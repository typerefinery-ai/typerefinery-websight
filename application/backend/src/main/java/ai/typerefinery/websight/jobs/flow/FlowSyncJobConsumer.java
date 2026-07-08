package ai.typerefinery.websight.jobs.flow;

import java.util.Calendar;
import java.util.Collection;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.resource.observation.ResourceChange;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.JobManager;
import org.apache.sling.event.jobs.consumer.JobConsumer;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.typerefinery.websight.services.ContentAccess;
import ai.typerefinery.websight.services.flow.FlowService;
import ai.typerefinery.websight.services.flow.FlowSyncStorageService;
import static ai.typerefinery.websight.events.flow.FlowResourceChangeListener.JOB_TOPIC;
import java.util.HashMap;
import java.util.Map;

import org.apache.sling.api.resource.ModifiableValueMap;
import org.apache.sling.api.resource.PersistenceException;

/**
 * Job consumer for Flow synchronization.
 * 
 * This consumer processes jobs created by FlowResourceChangeListener and handles:
 * - Checking if resource is flow-enabled
 * - Syncing component metadata to /var
 * - Calling FlowService to sync to Flow API
 * - Managing state machine transitions
 * - Handling retries and stuck state detection
 */
@Component(
    service = JobConsumer.class,
    configurationPolicy = ConfigurationPolicy.IGNORE,
    immediate = true,
    property = {
        JobConsumer.PROPERTY_TOPICS + "=" + JOB_TOPIC,
        Constants.SERVICE_RANKING + ":Integer=5000"
    }
)
@Designate(ocd = FlowSyncJobConsumer.FlowSyncJobConsumerConfiguration.class)
public class FlowSyncJobConsumer implements JobConsumer {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(FlowSyncJobConsumer.class);
        
    @Reference
    private FlowService flowService;
    
    @Reference
    private FlowSyncStorageService flowSyncStorage;
    
    @Reference
    private ContentAccess contentAccess;
    
    @Reference
    private JobManager jobManager;
    
    private FlowSyncJobConsumerConfiguration configuration;
    
    @Activate
    protected void activate(FlowSyncJobConsumerConfiguration configuration) {
        this.configuration = configuration;
        LOGGER.info("FlowSyncJobConsumer activated. maxRetryCount={}, processingTimeoutSeconds={}", 
            configuration.maxRetryCount(), configuration.processingTimeoutSeconds());
    }
    
    private static final String PROPERTY_COMPONENT_PATH = "componentPath";
    private static final String PROPERTY_CHANGE_TYPE = "changeType";
    private static final String PROPERTY_PENDING_SYNC = "pendingSync";
    private static final String PROPERTY_PENDING_DELETE = "pendingDelete";
    private static final String PROPERTY_PENDING_CHANGE_TYPE = "pendingChangeType";

    @Override
    public JobResult process(Job job) {
        String jobId = job != null ? job.getId() : null;
        LOGGER.info("FlowSyncJobConsumer.process: Processing job. jobId={}", jobId);
        
        if (!flowService.configuration.flow_page_change_listener_enabled()) {
            LOGGER.info("FlowSyncJobConsumer.process: Flow listener is disabled, skipping job. jobId={}", jobId);
            return JobResult.OK;
        }
        
        String componentPath = job.getProperty(PROPERTY_COMPONENT_PATH, String.class);
        String changeTypeStr = job.getProperty(PROPERTY_CHANGE_TYPE, String.class);
        
        if (componentPath == null || componentPath.isEmpty()) {
            LOGGER.error("FlowSyncJobConsumer.process: componentPath is missing. jobId={}", jobId);
            return JobResult.FAILED;
        }
        
        if (changeTypeStr == null || changeTypeStr.isEmpty()) {
            LOGGER.error("FlowSyncJobConsumer.process: changeType is missing. jobId={}, componentPath={}", 
                jobId, componentPath);
            return JobResult.FAILED;
        }
        
        ResourceChange.ChangeType changeType;
        try {
            changeType = ResourceChange.ChangeType.valueOf(changeTypeStr);
        } catch (IllegalArgumentException e) {
            LOGGER.error("FlowSyncJobConsumer.process: Invalid changeType. jobId={}, componentPath={}, changeType={}", 
                jobId, componentPath, changeTypeStr, e);
            return JobResult.FAILED;
        }
        
        try (ResourceResolver resolver = contentAccess.getAdminResourceResolver()) {
            if (resolver == null) {
                LOGGER.error("FlowSyncJobConsumer.process: Could not get admin resource resolver. jobId={}, componentPath={}", 
                    jobId, componentPath);
                return JobResult.FAILED;
            }
            
            if (changeType == ResourceChange.ChangeType.REMOVED) {
                return processRemovedChange(job, jobId, componentPath, resolver);
            } else {
                return processUpdateChange(job, jobId, componentPath, changeType, resolver);
            }
            
        } catch (Exception e) {
            LOGGER.error("FlowSyncJobConsumer.process: Exception processing job. jobId={}, componentPath={}", 
                jobId, componentPath, e);
            return JobResult.FAILED;
        }
    }
    
    /**
     * Handles REMOVED changes - cleans up /var resource and pauses/deletes flow if it exists.
     * 
     * @param job The job being processed
     * @param jobId The job ID
     * @param componentPath The component path that was removed
     * @param resolver The resource resolver
     * @return JobResult indicating success or failure
     */
    private JobResult processRemovedChange(Job job, String jobId, String componentPath, ResourceResolver resolver) {
        LOGGER.info("FlowSyncJobConsumer.processRemovedChange: Handling REMOVED change. jobId={}, componentPath={}", 
            jobId, componentPath);
        
        // Get var resource (component resource is already deleted)
        String varPath = flowSyncStorage.getVarPath(componentPath);
        Resource varResource = varPath != null ? resolver.getResource(varPath) : null;

        if (varResource == null) {
            LOGGER.info("FlowSyncJobConsumer.processRemovedChange: No /var resource found, nothing to clean up. jobId={}, componentPath={}", 
                jobId, componentPath);
            return JobResult.OK; // Not an error if var resource doesn't exist
        }
        
        JobResult existingProcessingResult = markPendingDeleteIfAlreadyProcessing(
            jobId,
            componentPath,
            varResource
        );

        if (existingProcessingResult != null) {
            return existingProcessingResult;
        }        

        return cleanupRemovedResource(jobId, componentPath, varResource, resolver);
    }
    
    /**
     * Handles ADDED and CHANGED updates - checks flow-enabled first, then reserves state, syncs component to var, and handles Flow API sync.
     * 
     * @param job The job being processed
     * @param jobId The job ID
     * @param componentPath The component path
     * @param changeType The change type (ADDED or CHANGED)
     * @param resolver The resource resolver
     * @return JobResult indicating success or failure
     */
    private JobResult processUpdateChange(Job job, String jobId, String componentPath, 
                                          ResourceChange.ChangeType changeType, ResourceResolver resolver) {
        LOGGER.info("FlowSyncJobConsumer.processUpdateChange: Handling update change. jobId={}, componentPath={}, changeType={}", 
            jobId, componentPath, changeType);
        
        // STEP 1: Verify component resource exists and check if flow-enabled FIRST
        // This prevents unnecessary state reservation and job queuing for non-flow-enabled resources
        Resource componentResource = resolver.getResource(componentPath);
        if (componentResource == null) {
            LOGGER.error("FlowSyncJobConsumer.processUpdateChange: Component resource not found. jobId={}, componentPath={}", 
                jobId, componentPath);
            return JobResult.FAILED;
        }
        
        // Check if flow-enabled BEFORE reserving state - only queue jobs for flow-enabled resources
        if (!flowService.isFlowEnabledResource(componentResource)) {
            LOGGER.info("FlowSyncJobConsumer.processUpdateChange: Resource is not flow-enabled, skipping. jobId={}, componentPath={}", 
                jobId, componentPath);
            return JobResult.OK; // Not an error, just skip processing
        }
        
        // STEP 2: Get or create var resource and reserve state (only for flow-enabled resources)
        Resource varResource = flowSyncStorage.getOrCreateVarResource(componentPath, resolver);
        if (varResource == null) {
            LOGGER.error("FlowSyncJobConsumer.processUpdateChange: Failed to get or create var resource. jobId={}, componentPath={}", 
                jobId, componentPath);
            return JobResult.FAILED;
        }
        
        // Check and reserve state (early reservation to prevent job overlap)
        JobResult stateCheckResult = checkAndReserveState(job, jobId, componentPath, changeType, varResource);
        if (stateCheckResult != null) {
            return stateCheckResult; // State check returned early (HOLD, retry, etc.)
        }
        
        // Reserve state VERY EARLY to ensure other jobs wait
        flowService.setResourceState(varResource, FlowService.STATE_PROCESSING, null, jobId);
        LOGGER.info("FlowSyncJobConsumer.processUpdateChange: Reserved path and state (PROCESSING). jobId={}, componentPath={}", 
            jobId, componentPath);
        
        // Get current enable state from var BEFORE syncing (to detect transitions)
        ValueMap varPropsBefore = varResource.getValueMap();
        Boolean enabledInVar = varPropsBefore.get(FlowService.prop(FlowService.PROPERTY_ENABLE), Boolean.class);
        
        // Sync component metadata to var
        LOGGER.info("FlowSyncJobConsumer.processUpdateChange: Syncing component metadata to var. jobId={}, componentPath={}", 
            jobId, componentPath);
        boolean syncResult = flowSyncStorage.syncComponentToVar(componentResource);
        if (!syncResult) {
            LOGGER.error("FlowSyncJobConsumer.processUpdateChange: Failed to sync component to var. jobId={}, componentPath={}", 
                jobId, componentPath);
            flowService.setResourceState(varResource, FlowService.STATE_ERROR, 
                "Failed to sync component metadata to var", jobId);
            return JobResult.FAILED;
        }
        
        // Reload var resource to get updated properties after sync
        resolver.refresh();
        varResource = resolver.getResource(varResource.getPath());
        if (varResource == null) {
            LOGGER.error("FlowSyncJobConsumer.processUpdateChange: Var resource disappeared after sync. jobId={}, componentPath={}", 
                jobId, componentPath);
            return JobResult.FAILED;
        }
        
        // Handle enable/disable transitions and Flow API sync
        boolean flowSyncResult = handleEnableDisableTransitions(
            jobId, componentPath, changeType, varResource, enabledInVar, resolver);
        
        // Set final state based on result
        if (flowSyncResult) {
            LOGGER.info(
                "FlowSyncJobConsumer.processUpdateChange: Successfully processed flow changes. jobId={}, componentPath={}",
                jobId, componentPath
            );

            String varPath = varResource.getPath();

            flowService.setResourceState(varResource, FlowService.STATE_COMPLETED, null, jobId);

            resolver.refresh();

            Resource refreshedVarResource = resolver.getResource(varPath);
            if (refreshedVarResource == null) {
                LOGGER.info(
                    "FlowSyncJobConsumer.processUpdateChange: Var resource no longer exists after completion. jobId={}, componentPath={}",
                    jobId, componentPath
                );
                return JobResult.OK;
            }

            JobResult pendingResult = handlePendingAfterCompletion(
                jobId,
                componentPath,
                refreshedVarResource,
                resolver
            );

            if (pendingResult != null) {
                return pendingResult;
            }

            return JobResult.OK;
        } else {
            LOGGER.error("FlowSyncJobConsumer.processUpdateChange: Failed to process flow changes. jobId={}, componentPath={}", 
                jobId, componentPath);
            flowService.setResourceState(varResource, FlowService.STATE_ERROR, 
                "Failed to sync to Flow API", jobId);
            return JobResult.FAILED;
        }
    }
    
    /**
     * Checks current state and reserves it if available. Returns early if state check requires it.
     * 
     * @param job The job being processed
     * @param jobId The job ID
     * @param componentPath The component path
     * @param varResource The /var resource
     * @return JobResult if early return is needed (HOLD, retry, error), null to continue processing
     */
    private JobResult checkAndReserveState(Job job, String jobId, String componentPath, ResourceChange.ChangeType changeType, Resource varResource) {
        String currentState = varResource.getValueMap().get(
            FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE),
            FlowService.STATE_IDLE
        );
        
        // Handle HOLD state
        if (FlowService.STATE_HOLD.equals(currentState)) {
            LOGGER.info("FlowSyncJobConsumer.checkAndReserveState: Resource is on HOLD, skipping. jobId={}, componentPath={}", 
                jobId, componentPath);
            flowService.setResourceState(varResource, FlowService.STATE_SKIPPED, null, jobId);
            return JobResult.OK;
        }
        
        // Handle QUEUED or PROCESSING state - check if stuck or owned by another job
        if (FlowService.STATE_QUEUED.equals(currentState) || FlowService.STATE_PROCESSING.equals(currentState)) {
            String storedJobId = varResource.getValueMap().get(
                FlowService.prop(FlowService.PROPERTY_PROCESSING_JOB_ID),
                ""
            );
            
            // Check if resource is stuck (timeout or job doesn't exist)
            if (isResourceStuck(varResource, jobId)) {
                LOGGER.warn("FlowSyncJobConsumer.checkAndReserveState: Resource is stuck, resetting to IDLE. jobId={}, componentPath={}, currentState={}, storedJobId={}", 
                    jobId, componentPath, currentState, storedJobId);
                flowService.setResourceState(varResource, FlowService.STATE_IDLE, null, null);
                return null; // Continue processing to reserve state
            } else if (!java.util.Objects.equals(jobId, storedJobId)) {
                LOGGER.info(
                    "FlowSyncJobConsumer.checkAndReserveState: Resource is already {} by another job, marking pending and skipping this job. jobId={}, componentPath={}, storedJobId={}",
                    currentState, jobId, componentPath, storedJobId
                );

                boolean markedPending = markPendingChange(varResource, changeType, jobId, componentPath);
                return markedPending ? JobResult.OK : JobResult.FAILED;
            }
            // If storedJobId matches jobId, continue processing (this job owns it)
        }
        
        return null; // Continue processing
    }
    
    /**
     * Handles enable/disable transitions and syncs to Flow API based on the new state.
     * 
     * @param jobId The job ID
     * @param componentPath The component path
     * @param changeType The change type
     * @param varResource The /var resource (after syncing component to var)
     * @param enabledInVar The previous enable state from var (before sync)
     * @param resolver The resource resolver
     * @return true if sync succeeded, false otherwise
     */
    private boolean handleEnableDisableTransitions(String jobId, String componentPath, 
                                                    ResourceChange.ChangeType changeType,
                                                    Resource varResource, Boolean enabledInVar, 
                                                    ResourceResolver resolver) {
        ValueMap varProps = varResource.getValueMap();
        Boolean enabledInComponent = varProps.get(FlowService.prop(FlowService.PROPERTY_ENABLE), Boolean.class);
        String flowstreamid = varProps.get(FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID), "");
        boolean hasValidFlowId = flowstreamid != null && !flowstreamid.isEmpty();
        
        // Case 1: Resource is disabled and has a valid flow ID - disable/pause the flow
        if (Boolean.FALSE.equals(enabledInComponent) && hasValidFlowId) {
            LOGGER.info("FlowSyncJobConsumer.handleEnableDisableTransitions: Resource disabled with valid flow ID, pausing flow. jobId={}, componentPath={}, flowstreamid={}", 
                jobId, componentPath, flowstreamid);
            var pauseResult = flowService.toggleFlowStreamPause(flowstreamid, true);
            if (pauseResult.isSuccess()) {
                LOGGER.info("FlowSyncJobConsumer.handleEnableDisableTransitions: Successfully paused flow. jobId={}, componentPath={}, flowstreamid={}", 
                    jobId, componentPath, flowstreamid);
                return true;
            } else {
                LOGGER.warn("FlowSyncJobConsumer.handleEnableDisableTransitions: Failed to pause flow. jobId={}, componentPath={}, flowstreamid={}, status={}", 
                    jobId, componentPath, flowstreamid, pauseResult.getStatusCode());
                return false;
            }
        }
        
        // Case 2: Resource is enabled and was disabled in var (transition from disabled to enabled) and has valid flow ID - enable/unpause the flow
        if (Boolean.TRUE.equals(enabledInComponent) && Boolean.FALSE.equals(enabledInVar) && hasValidFlowId) {
            LOGGER.info("FlowSyncJobConsumer.handleEnableDisableTransitions: Resource enabled (transition from disabled), unpausing flow. jobId={}, componentPath={}, flowstreamid={}", 
                jobId, componentPath, flowstreamid);
            var unpauseResult = flowService.toggleFlowStreamPause(flowstreamid, false);
            if (unpauseResult.isSuccess()) {
                LOGGER.info("FlowSyncJobConsumer.handleEnableDisableTransitions: Successfully unpaused flow. jobId={}, componentPath={}, flowstreamid={}", 
                    jobId, componentPath, flowstreamid);
                return true;
            } else {
                LOGGER.warn("FlowSyncJobConsumer.handleEnableDisableTransitions: Failed to unpause flow. jobId={}, componentPath={}, flowstreamid={}, status={}", 
                    jobId, componentPath, flowstreamid, unpauseResult.getStatusCode());
                return false;
            }
        }
        
        // Case 3: Resource is enabled - sync properties to Flow API
        if (Boolean.TRUE.equals(enabledInComponent)) {
            LOGGER.info("FlowSyncJobConsumer.handleEnableDisableTransitions: Syncing var to Flow API. jobId={}, componentPath={}, changeType={}", 
                jobId, componentPath, changeType);
            return flowSyncStorage.syncVarToFlow(varResource, changeType);
        }
        
        // Case 4: Resource is disabled but no flow ID - nothing to do
        LOGGER.info("FlowSyncJobConsumer.handleEnableDisableTransitions: Resource is disabled with no flow ID, nothing to sync. jobId={}, componentPath={}", 
            jobId, componentPath);
        return true; // Not an error
    }
    
    /**
     * Checks if a resource is stuck in PROCESSING or QUEUED state.
     * A resource is considered stuck if:
     * 1. It's been in PROCESSING state longer than processingTimeoutSeconds
     * 2. The stored job ID no longer exists (job completed/failed/cancelled)
     * 
     * @param varResource The /var resource to check
     * @param currentJobId The current job ID (for logging)
     * @return true if resource is stuck, false otherwise
     */
    private boolean isResourceStuck(Resource varResource, String currentJobId) {
        try {
            ValueMap props = varResource.getValueMap();
            String state = props.get(
                FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE),
                FlowService.STATE_IDLE
            );
            
            // Only check PROCESSING state for timeout (QUEUED might be waiting)
            if (!FlowService.STATE_PROCESSING.equals(state)) {
                return false;
            }
            
            // Check timeout
            String timestampStr = props.get(
                FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE_TIMESTAMP),
                ""
            );
            
            if (timestampStr != null && !timestampStr.isEmpty()) {
                try {
                    Calendar timestamp = org.apache.jackrabbit.util.ISO8601.parse(timestampStr);
                    long timestampMillis = timestamp.getTimeInMillis();
                    long currentMillis = System.currentTimeMillis();
                    long ageSeconds = (currentMillis - timestampMillis) / 1000;
                    long timeoutSeconds = configuration.processingTimeoutSeconds();
                    
                    if (ageSeconds > timeoutSeconds) {
                        LOGGER.warn("FlowSyncJobConsumer.isResourceStuck: Resource timeout exceeded. varPath={}, state={}, ageSeconds={}, timeoutSeconds={}", 
                            varResource.getPath(), state, ageSeconds, timeoutSeconds);
                        return true;
                    }
                } catch (Exception e) {
                    LOGGER.warn("FlowSyncJobConsumer.isResourceStuck: Could not parse timestamp. varPath={}, timestamp={}", 
                        varResource.getPath(), timestampStr, e);
                }
            }
            
            // Check if stored job ID still exists
            String storedJobId = props.get(
                FlowService.prop(FlowService.PROPERTY_PROCESSING_JOB_ID),
                ""
            );
            
            if (storedJobId != null && !storedJobId.isEmpty()) {
                boolean jobExists = jobExists(storedJobId);
                if (!jobExists) {
                    LOGGER.warn("FlowSyncJobConsumer.isResourceStuck: Stored job ID no longer exists. varPath={}, state={}, storedJobId={}", 
                        varResource.getPath(), state, storedJobId);
                    return true;
                }
            }
            
            return false;
        } catch (Exception e) {
            LOGGER.error("FlowSyncJobConsumer.isResourceStuck: Error checking if resource is stuck. varPath={}, currentJobId={}", 
                varResource != null ? varResource.getPath() : "null", currentJobId, e);
            return false; // On error, don't consider stuck
        }
    }
    
    /**
     * Checks if a job with the given ID still exists (QUEUED or ACTIVE).
     * 
     * @param jobId The job ID to check
     * @return true if job exists, false otherwise
     */
    private boolean jobExists(String jobId) {
        try {
            if (jobId == null || jobId.isEmpty()) {
                return false;
            }
            
            // Check QUEUED jobs
            @SuppressWarnings("unchecked")
            Collection<Job> queuedJobs = jobManager.findJobs(
                JobManager.QueryType.QUEUED, 
                JOB_TOPIC, 
                -1
            );
            for (Job job : queuedJobs) {
                if (jobId.equals(job.getId())) {
                    return true;
                }
            }
            
            // Check ACTIVE jobs
            @SuppressWarnings("unchecked")
            Collection<Job> activeJobs = jobManager.findJobs(
                JobManager.QueryType.ACTIVE, 
                JOB_TOPIC, 
                -1
            );
            for (Job job : activeJobs) {
                if (jobId.equals(job.getId())) {
                    return true;
                }
            }
            
            return false;
        } catch (Exception e) {
            LOGGER.error("FlowSyncJobConsumer.jobExists: Error checking if job exists. jobId={}", jobId, e);
            return false; // On error, assume job doesn't exist
        }
    }
    
    @ObjectClassDefinition(
        name = "Flow Sync Job Consumer Configuration",
        description = "Configuration for Flow synchronization job consumer"
    )
    public @interface FlowSyncJobConsumerConfiguration {
        
        @AttributeDefinition(
            name = "Max Retry Count",
            description = "Maximum number of retries before giving up on a job",
            type = AttributeType.INTEGER
        )
        int maxRetryCount() default 10;
        
        @AttributeDefinition(
            name = "Processing Timeout Seconds",
            description = "Number of seconds before a resource in PROCESSING state is considered stuck",
            type = AttributeType.INTEGER
        )
        int processingTimeoutSeconds() default 300; // 5 minutes
    }


    private boolean markPendingChange(
            Resource varResource,
            ResourceChange.ChangeType changeType,
            String jobId,
            String componentPath) {

        try {
            ModifiableValueMap props = varResource.adaptTo(ModifiableValueMap.class);
            if (props == null) {
                LOGGER.error(
                    "FlowSyncJobConsumer.markPendingChange: Could not adapt var resource to ModifiableValueMap. jobId={}, componentPath={}, varPath={}",
                    jobId, componentPath, varResource.getPath()
                );
                return false;
            }

            props.put(FlowService.prop(PROPERTY_PENDING_SYNC), true);

            if (changeType == ResourceChange.ChangeType.REMOVED) {
                props.put(FlowService.prop(PROPERTY_PENDING_DELETE), true);
                props.put(FlowService.prop(PROPERTY_PENDING_CHANGE_TYPE), ResourceChange.ChangeType.REMOVED.name());
            } else {
                Boolean pendingDelete = props.get(
                    FlowService.prop(PROPERTY_PENDING_DELETE),
                    Boolean.class
                );

                // Delete wins over update. Do not downgrade a pending delete back to changed.
                if (!Boolean.TRUE.equals(pendingDelete)) {
                    props.put(FlowService.prop(PROPERTY_PENDING_CHANGE_TYPE), ResourceChange.ChangeType.CHANGED.name());
                }
            }

            varResource.getResourceResolver().commit();

            LOGGER.info(
                "FlowSyncJobConsumer.markPendingChange: Marked pending change. jobId={}, componentPath={}, changeType={}",
                jobId, componentPath, changeType
            );

            return true;
        } catch (PersistenceException e) {
            LOGGER.error(
                "FlowSyncJobConsumer.markPendingChange: Failed to mark pending change. jobId={}, componentPath={}, changeType={}",
                jobId, componentPath, changeType, e
            );
            return false;
        }
    }

    private JobResult handlePendingAfterCompletion(
            String jobId,
            String componentPath,
            Resource varResource,
            ResourceResolver resolver) {

        PendingChange pendingChange = readPendingChange(varResource);

        if (!pendingChange.pendingSync) {
            return null;
        }

        if (pendingChange.pendingDelete) {
            LOGGER.info(
                "FlowSyncJobConsumer.handlePendingAfterCompletion: Pending delete found after sync completion. jobId={}, componentPath={}",
                jobId, componentPath
            );

            return cleanupRemovedResource(jobId, componentPath, varResource, resolver);
        }

        LOGGER.info(
            "FlowSyncJobConsumer.handlePendingAfterCompletion: Pending update found after sync completion, queueing follow-up sync. jobId={}, componentPath={}",
            jobId, componentPath
        );

        boolean cleared = clearPendingChange(varResource, jobId, componentPath);
        if (!cleared) {
            return JobResult.FAILED;
        }

        boolean queued = enqueueFollowUpSync(componentPath);
        if (!queued) {
            LOGGER.error(
                "FlowSyncJobConsumer.handlePendingAfterCompletion: Failed to queue follow-up sync after clearing pending. Re-marking pending. jobId={}, componentPath={}",
                jobId, componentPath
            );

            markPendingChange(
                varResource,
                ResourceChange.ChangeType.CHANGED,
                jobId,
                componentPath
            );

            return JobResult.FAILED;
        }

        return JobResult.OK;
    }

    private PendingChange readPendingChange(Resource varResource) {
        ValueMap props = varResource.getValueMap();

        boolean pendingSync = Boolean.TRUE.equals(props.get(
            FlowService.prop(PROPERTY_PENDING_SYNC),
            Boolean.class
        ));

        boolean pendingDelete = Boolean.TRUE.equals(props.get(
            FlowService.prop(PROPERTY_PENDING_DELETE),
            Boolean.class
        ));

        return new PendingChange(pendingSync, pendingDelete);
    }

    private boolean clearPendingChange(Resource varResource, String jobId, String componentPath) {
        try {
            ModifiableValueMap props = varResource.adaptTo(ModifiableValueMap.class);
            if (props == null) {
                LOGGER.error(
                    "FlowSyncJobConsumer.clearPendingChange: Could not adapt var resource to ModifiableValueMap. jobId={}, componentPath={}, varPath={}",
                    jobId, componentPath, varResource.getPath()
                );
                return false;
            }

            props.remove(FlowService.prop(PROPERTY_PENDING_SYNC));
            props.remove(FlowService.prop(PROPERTY_PENDING_DELETE));
            props.remove(FlowService.prop(PROPERTY_PENDING_CHANGE_TYPE));

            varResource.getResourceResolver().commit();

            LOGGER.info(
                "FlowSyncJobConsumer.clearPendingChange: Cleared pending change. jobId={}, componentPath={}",
                jobId, componentPath
            );

            return true;
        } catch (PersistenceException e) {
            LOGGER.error(
                "FlowSyncJobConsumer.clearPendingChange: Failed to clear pending change. jobId={}, componentPath={}",
                jobId, componentPath, e
            );
            return false;
        }
    }

    private boolean enqueueFollowUpSync(String componentPath) {
        Map<String, Object> props = new HashMap<>();
        props.put("componentPath", componentPath);
        props.put("changeType", ResourceChange.ChangeType.CHANGED.name());

        Job newJob = jobManager.addJob(JOB_TOPIC, props);

        if (newJob == null) {
            LOGGER.error(
                "FlowSyncJobConsumer.enqueueFollowUpSync: Failed to queue follow-up sync. componentPath={}",
                componentPath
            );
            return false;
        }

        LOGGER.info(
            "FlowSyncJobConsumer.enqueueFollowUpSync: Queued follow-up sync. componentPath={}, newJobId={}",
            componentPath, newJob.getId()
        );

        return true;
    }

    private static final class PendingChange {
        private final boolean pendingSync;
        private final boolean pendingDelete;

        private PendingChange(boolean pendingSync, boolean pendingDelete) {
            this.pendingSync = pendingSync;
            this.pendingDelete = pendingDelete;
        }
    }
        

    private JobResult markPendingDeleteIfAlreadyProcessing(
            String jobId,
            String componentPath,
            Resource varResource) {

        String currentState = varResource.getValueMap().get(
            FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE),
            FlowService.STATE_IDLE
        );

        if (!FlowService.STATE_QUEUED.equals(currentState) && !FlowService.STATE_PROCESSING.equals(currentState)) {
            return null;
        }

        String storedJobId = varResource.getValueMap().get(
            FlowService.prop(FlowService.PROPERTY_PROCESSING_JOB_ID),
            ""
        );

        if (isResourceStuck(varResource, jobId)) {
            LOGGER.warn(
                "FlowSyncJobConsumer.markPendingDeleteIfAlreadyProcessing: Resource is stuck during delete, resetting to IDLE. jobId={}, componentPath={}, currentState={}, storedJobId={}",
                jobId, componentPath, currentState, storedJobId
            );
            flowService.setResourceState(varResource, FlowService.STATE_IDLE, null, null);
            return null;
        }

        if (!java.util.Objects.equals(jobId, storedJobId)) {
            LOGGER.info(
                "FlowSyncJobConsumer.markPendingDeleteIfAlreadyProcessing: Resource is already {} by another job, marking pending delete and skipping delete job. jobId={}, componentPath={}, storedJobId={}",
                currentState, jobId, componentPath, storedJobId
            );

            boolean markedPending = markPendingChange(
                varResource,
                ResourceChange.ChangeType.REMOVED,
                jobId,
                componentPath
            );

            return markedPending ? JobResult.OK : JobResult.FAILED;
        }

        return null;
    }


    private JobResult cleanupRemovedResource(
            String jobId,
            String componentPath,
            Resource varResource,
            ResourceResolver resolver) {

        if (varResource == null) {
            LOGGER.info(
                "FlowSyncJobConsumer.cleanupRemovedResource: No /var resource found, nothing to clean up. jobId={}, componentPath={}",
                jobId, componentPath
            );
            return JobResult.OK;
        }

        String flowstreamid = varResource.getValueMap().get(
            FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID),
            ""
        );

        if (flowstreamid != null && !flowstreamid.isEmpty()) {
            LOGGER.info(
                "FlowSyncJobConsumer.cleanupRemovedResource: Resource deleted with valid flow ID, pausing flow. jobId={}, componentPath={}, flowstreamid={}",
                jobId, componentPath, flowstreamid
            );

            var pauseResult = flowService.toggleFlowStreamPause(flowstreamid, true);

            if (pauseResult.isSuccess()) {
                LOGGER.info(
                    "FlowSyncJobConsumer.cleanupRemovedResource: Successfully paused flow. jobId={}, componentPath={}, flowstreamid={}",
                    jobId, componentPath, flowstreamid
                );
            } else {
                LOGGER.warn(
                    "FlowSyncJobConsumer.cleanupRemovedResource: Failed to pause flow, continuing with deletion anyway. jobId={}, componentPath={}, flowstreamid={}, status={}",
                    jobId, componentPath, flowstreamid, pauseResult.getStatusCode()
                );
            }
        }

        boolean deleteResult = flowSyncStorage.deleteVarResource(componentPath, resolver);

        if (deleteResult) {
            LOGGER.info(
                "FlowSyncJobConsumer.cleanupRemovedResource: Successfully cleaned up /var resource. jobId={}, componentPath={}",
                jobId, componentPath
            );
            return JobResult.OK;
        }

        LOGGER.error(
            "FlowSyncJobConsumer.cleanupRemovedResource: Failed to delete /var resource. jobId={}, componentPath={}",
            jobId, componentPath
        );

        return JobResult.FAILED;
    }

}

