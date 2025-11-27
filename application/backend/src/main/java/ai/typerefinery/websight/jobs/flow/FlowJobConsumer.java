package ai.typerefinery.websight.jobs.flow;

import java.util.HashMap;
import java.util.List;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.consumer.JobConsumer;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.apache.sling.api.resource.observation.ResourceChange;
import org.osgi.framework.Constants;
import ai.typerefinery.websight.events.flow.FlowResourceChangeListener;
import ai.typerefinery.websight.models.components.flow.FlowContainer;
import ai.typerefinery.websight.services.ContentAccess;
import ai.typerefinery.websight.services.flow.FlowService;
import ai.typerefinery.websight.utils.DateUtil;
import ai.typerefinery.websight.utils.PageUtil;

@Component(
  service = JobConsumer.class,
  configurationPolicy = ConfigurationPolicy.IGNORE,
  immediate = true,
  property = {
    JobConsumer.PROPERTY_TOPICS +
    "=" +
    FlowResourceChangeListener.JOB_TOPIC,
    Constants.SERVICE_RANKING+":Integer=5000"
  }
)
public class FlowJobConsumer implements JobConsumer {
    private static final Logger LOGGER = LoggerFactory.getLogger(FlowJobConsumer.class);

    @Reference
    FlowService flowService;

    private boolean enabled;

    @Reference
    ContentAccess contentAccess;
    
    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    @Activate
    protected void activate() {
        if (flowService == null) {
            LOGGER.warn("Flow service is not available.");
        } else {
            this.enabled = flowService.configuration.flow_page_change_listener_enabled();
        }
    }

    boolean returnProcessFlowError = false;

    @Override
    public JobResult process(final Job job) {
        LOGGER.error("FlowJobConsumer.process: Job received. jobId={}, enabled={}", 
            job != null ? job.getId() : "null", enabled);

        this.enabled = flowService.configuration.flow_page_change_listener_enabled();
        LOGGER.error("FlowJobConsumer.process: Listener enabled state. enabled={}", enabled);
        
        if (!enabled) {
            LOGGER.error("FlowJobConsumer.process: Listener is disabled, skipping job processing");
            return JobResult.OK;
        }

        HashMap<String, ResourceChange.ChangeType> changeMap = job.getProperty("changes", HashMap.class);
        if (changeMap == null || changeMap.isEmpty()) {
            LOGGER.error("FlowJobConsumer.process: No changes in job. jobId={}", 
                job != null ? job.getId() : "null");
            return JobResult.OK;
        }

        LOGGER.error("FlowJobConsumer.process: Processing {} resource change(s). jobId={}, changes={}", 
            changeMap.size(), job != null ? job.getId() : "null", changeMap);

        try (ResourceResolver resourceResolver = contentAccess.getAdminResourceResolver()) {
            if (resourceResolver == null) {
                LOGGER.error("FlowJobConsumer.process: Could not get resource resolver");
                return JobResult.FAILED;
            }

            // Check if any resource is QUEUED or PROCESSING by another job
            // If so, retry this job later (but limit retries to prevent infinite loops)
            // Get retry count from job properties (Sling tracks this automatically)
            int retryCount = job.getRetryCount();
            int maxRetries = 10; // Maximum number of retries before giving up
            
            for (String path : changeMap.keySet()) {
                Resource resource = resourceResolver.getResource(path);
                if (resource != null) {
                    String currentState = resource.getValueMap().get(
                        FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE),
                        FlowService.STATE_IDLE
                    );
                    
                    // Skip HOLD state - will be handled in processing loop
                    if (FlowService.STATE_HOLD.equals(currentState)) {
                        continue;
                    }
                    
                    // If QUEUED or PROCESSING, another job is handling it - retry this job
                    if (FlowService.STATE_QUEUED.equals(currentState) || FlowService.STATE_PROCESSING.equals(currentState)) {
                        if (retryCount < maxRetries) {
                            LOGGER.error("FlowJobConsumer.process: Resource is queued or processing. Retrying later. path={}, jobId={}, state={}, retryCount={}/{}", 
                                path, job != null ? job.getId() : "null", currentState, retryCount, maxRetries);
                            // Return FAILED to trigger Sling's retry mechanism
                            // Sling will retry this job after a delay
                            return JobResult.FAILED;
                        } else {
                            LOGGER.error("FlowJobConsumer.process: Resource is still queued/processing after {} retries. Giving up. path={}, jobId={}, state={}", 
                                maxRetries, path, job != null ? job.getId() : "null", currentState);
                            // Set state to ERROR to unblock and allow manual intervention
                            setResourceState(resource, FlowService.STATE_ERROR, "Job retry limit exceeded - resource stuck in " + currentState);
                            returnProcessFlowError = true;
                        }
                    }
                }
            }

            returnProcessFlowError = false;
            
            // Set state to PROCESSING for all resources at start (now we know they're not already processing)
            // Skip resources that are on HOLD
            String jobId = job != null ? job.getId() : null;
            for (String path : changeMap.keySet()) {
                Resource resource = resourceResolver.getResource(path);
                if (resource != null) {
                    String currentState = resource.getValueMap().get(
                        FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE),
                        FlowService.STATE_IDLE
                    );
                    // Only set PROCESSING if not on HOLD
                    if (!FlowService.STATE_HOLD.equals(currentState)) {
                        setResourceState(resource, FlowService.STATE_PROCESSING, null, jobId);
                    }
                }
            }
            
            changeMap.forEach((path, changeType) -> {
                LOGGER.error("FlowJobConsumer.process: Processing resource change. path={}, changeType={}", 
                    path, changeType);
                
                Resource resource = resourceResolver.getResource(path);
                if (resource == null) {
                    LOGGER.error("FlowJobConsumer.process: Resource is null. path={}", path);
                    // Set state to ERROR for null resource
                    Resource errorResource = resourceResolver.getResource(path);
                    if (errorResource != null) {
                        setResourceState(errorResource, FlowService.STATE_ERROR, "Resource is null");
                    }
                    returnProcessFlowError = true;
                } else if (ResourceUtil.isNonExistingResource(resource)) {
                    LOGGER.error("FlowJobConsumer.process: Resource does not exist. path={}", path);
                    setResourceState(resource, FlowService.STATE_SKIPPED, "Resource does not exist");
                } else {
                    // Check if resource is on HOLD - user has manually stopped processing
                    String currentState = resource.getValueMap().get(
                        FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE),
                        FlowService.STATE_IDLE
                    );
                    if (FlowService.STATE_HOLD.equals(currentState)) {
                        LOGGER.error("FlowJobConsumer.process: Resource is on HOLD. Skipping processing. path={}, jobId={}", 
                            path, job != null ? job.getId() : "null");
                        setResourceState(resource, FlowService.STATE_SKIPPED, "Processing skipped - resource is on HOLD");
                        return; // Skip this resource, continue with others
                    }
                    
                    LOGGER.error("FlowJobConsumer.process: Calling doProcessFlowResource. path={}, changeType={}", 
                        path, changeType);
                    boolean result = flowService.doProcessFlowResource(resource, changeType);
                    LOGGER.error("FlowJobConsumer.process: doProcessFlowResource result. path={}, result={}", 
                        path, result);
                    if (!result) {
                        LOGGER.error("FlowJobConsumer.process: doProcessFlowResource returned false. path={}", path);
                        setResourceState(resource, FlowService.STATE_ERROR, "doProcessFlowResource returned false");
                        returnProcessFlowError = true;
                    } else {
                        // Success - state will be set by FlowService.doProcessFlowResource
                        // It will set COMPLETED or SKIPPED based on what happened
                    }
                }
            });
            
            // Set final state for all resources
            for (String path : changeMap.keySet()) {
                Resource resource = resourceResolver.getResource(path);
                if (resource != null) {
                    String currentState = resource.getValueMap().get(
                        FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE),
                        FlowService.STATE_PROCESSING
                    );
                    // Only update if still in PROCESSING (FlowService didn't set it)
                    if (FlowService.STATE_PROCESSING.equals(currentState)) {
                        if (returnProcessFlowError) {
                            setResourceState(resource, FlowService.STATE_ERROR, "Job processing failed");
                        } else {
                            setResourceState(resource, FlowService.STATE_COMPLETED, null);
                        }
                    }
                }
            }
            
            if (returnProcessFlowError) {
                LOGGER.error("FlowJobConsumer.process: Job processing failed. jobId={}", 
                    job != null ? job.getId() : "null");
                return JobResult.FAILED;
            }
            
            LOGGER.error("FlowJobConsumer.process: Job processing completed successfully. jobId={}", 
                job != null ? job.getId() : "null");
            
        } catch (Exception e) {
            LOGGER.error("FlowJobConsumer.process: Exception processing job. jobId={}", 
                job != null ? job.getId() : "null", e);
            return JobResult.FAILED;
        }

        return JobResult.OK;
    }

    /**
     * Sets the processing state on a resource with timestamp and optional job ID.
     * 
     * @param resource The resource to update
     * @param state The new state (IDLE, PENDING, PROCESSING, COMPLETED, ERROR, SKIPPED)
     * @param errorMessage Optional error message if state is ERROR
     * @param jobId Optional job ID that is processing this resource (null to clear)
     */
    private void setResourceState(Resource resource, String state, String errorMessage, String jobId) {
        try {
            HashMap<String, Object> props = new HashMap<>();
            props.put(FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE), state);
            String timestamp = DateUtil.getIsoDate(new java.util.Date());
            props.put(FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE_TIMESTAMP), timestamp);
            
            // Store or clear job ID
            if (jobId != null && !jobId.isEmpty()) {
                props.put(FlowService.prop(FlowService.PROPERTY_PROCESSING_JOB_ID), jobId);
            } else {
                // Clear job ID when state is IDLE, COMPLETED, ERROR, SKIPPED, or HOLD
                props.put(FlowService.prop(FlowService.PROPERTY_PROCESSING_JOB_ID), "");
            }
            
            if (errorMessage != null && !errorMessage.isEmpty()) {
                props.put(FlowService.prop(FlowService.PROPERTY_PROCESSING_ERROR), errorMessage);
            } else {
                // Clear error message if not in ERROR state
                props.put(FlowService.prop(FlowService.PROPERTY_PROCESSING_ERROR), "");
            }
            
            PageUtil.updatResourceProperties(resource, props);
            LOGGER.error("FlowJobConsumer.setResourceState: Set resource state. path={}, state={}, jobId={}, timestamp={}", 
                resource.getPath(), state, jobId, timestamp);
        } catch (Exception e) {
            LOGGER.error("FlowJobConsumer.setResourceState: Error setting state. path={}, state={}", 
                resource != null ? resource.getPath() : "null", state, e);
        }
    }

    /**
     * Sets the processing state on a resource with timestamp (backward compatibility).
     * 
     * @param resource The resource to update
     * @param state The new state (IDLE, PENDING, PROCESSING, COMPLETED, ERROR, SKIPPED)
     * @param errorMessage Optional error message if state is ERROR
     */
    private void setResourceState(Resource resource, String state, String errorMessage) {
        setResourceState(resource, state, errorMessage, null);
    }
}
