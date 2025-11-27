package ai.typerefinery.websight.events.flow;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.resource.observation.ResourceChange;
import org.apache.sling.api.resource.observation.ResourceChangeListener;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.JobManager;
import org.osgi.framework.Constants;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.typerefinery.websight.services.ContentAccess;
import ai.typerefinery.websight.services.flow.FlowService;
import ai.typerefinery.websight.utils.DateUtil;
import ai.typerefinery.websight.utils.PageUtil;

/**
 * The Sling Resource Change Listener is the preferred method for listening for Resource Change
 * events in AEM. This is preferred over the Sling Resource Event Listener, or the JCR Event Handler
 * approaches.
 *
 * <p>ResourceChangeListener Javadoc: -
 * https://docs.adobe.com/docs/en/aem/6-2/develop/ref/javadoc/org/apache/sling/api/resource/observation/ResourceChangeListener.html
 *
 * <p>Note: To listen for External events, implements the ExternalResourceChangeListener. If ONLY
 * local events are in scope, implement only the ResourceChangeListener.
 * 
 * This class listens for changes in the /content path and triggers a job to process the changes.
 */
@Component(
  immediate = true,
  service = ResourceChangeListener.class,
  configurationPolicy = ConfigurationPolicy.IGNORE,
  property = {
    Constants.SERVICE_ID + "=TypeRefinery - Flow Service",
    Constants.SERVICE_DESCRIPTION + "=Listen to changes in root path and trigger a job",
    ResourceChangeListener.PATHS + "=" + FlowResourceChangeListener.ROOT_PATH,
    ResourceChangeListener.CHANGES + "=ADDED",
    ResourceChangeListener.CHANGES + "=CHANGED",
    ResourceChangeListener.CHANGES + "=REMOVED",
    // Only trigger on user-controlled properties, not internal FlowService properties
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_ENABLE,
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_TEMPLATE,
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_TEMPLATE_DESIGN,
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_TITLE,
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_ICON,
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_COLOR,
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_NAME,
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_GROUP,
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_REFERENCE,
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_VERSION,
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_SAMPLEDATA,
    ResourceChangeListener.PROPERTY_NAMES_HINT + "=" + FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_README
    }
)
public class FlowResourceChangeListener implements ResourceChangeListener {

        public static final String ROOT_PATH = "/content";
        public static final String JOB_TOPIC =
          "io/typerefinery/websight/events/flow/resourcechange";
        public static final String SUBSERVICE = "FlowService";
      
        private static final Logger LOGGER = LoggerFactory.getLogger(FlowResourceChangeListener.class);

        @Reference
        private JobManager jobManager;

        @Reference
        private ResourceResolverFactory resourceResolverFactory;

        @Reference
        FlowService flowService;

        @Reference
        ContentAccess contentAccess;
    
        private boolean enabled;
        
        @Activate
        protected void activate() {
            this.enabled = flowService.configuration.flow_page_change_listener_enabled();

            LOGGER.error("activated and enabled: {}", enabled);
        }

        @Override
        public void onChange(List<ResourceChange> changes) {
            LOGGER.error("FlowResourceChangeListener.onChange: Received {} change(s). enabled={}", 
                changes != null ? changes.size() : 0, enabled);
            
            if (!enabled) {
                LOGGER.error("FlowResourceChangeListener.onChange: Listener is disabled, ignoring changes");
                return;
            }

            if (changes == null || changes.isEmpty()) {
                LOGGER.error("FlowResourceChangeListener.onChange: No changes to process");
                return;
            }

            for (ResourceChange change : changes) {
                LOGGER.error("FlowResourceChangeListener.onChange: Change detected. path={}, type={}", 
                    change.getPath(), change.getType());
            }

            try (ResourceResolver resourceResolver = contentAccess.getAdminResourceResolver()) {
                processChanges(changes, resourceResolver);
            } catch (Exception e) {
                LOGGER.error("FlowResourceChangeListener.onChange: Could not get resource resolver", e);
            }
        }

        public void processChanges(List<ResourceChange> changes, ResourceResolver resourceResolver) {
            LOGGER.error("FlowResourceChangeListener.processChanges: Processing {} change(s)", 
                changes != null ? changes.size() : 0);
            
            final Map<String, Object> props = new HashMap<>();
            HashMap<String, ResourceChange.ChangeType> changeMap = new HashMap<>();
            
            for (ResourceChange change : changes) {
                String path = change.getPath();
                Resource resource = resourceResolver.getResource(path);

                LOGGER.error("FlowResourceChangeListener.processChanges: Checking resource. path={}, resourceExists={}, changeType={}", 
                    path, resource != null, change.getType());

                // Debug: Log all resource properties if resource exists
                if (resource != null) {
                    try {
                        org.apache.sling.api.resource.ValueMap valueMap = resource.getValueMap();
                        LOGGER.error("FlowResourceChangeListener.processChanges: Resource properties. path={}, properties={}", 
                            path, valueMap);
                        
                        // Log specific Flow-related properties
                        LOGGER.error("FlowResourceChangeListener.processChanges: Flow properties. path={}, " +
                            "flowapi_enable={}, flowapi_flowstreamid={}, flowapi_processing_state={}, flowapi_processing_job_id={}, " +
                            "flowapi_paused={}, flowapi_template={}, flowapi_title={}",
                            path,
                            valueMap.get(FlowService.prop(FlowService.PROPERTY_ENABLE), "null"),
                            valueMap.get(FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID), "null"),
                            valueMap.get(FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE), "null"),
                            valueMap.get(FlowService.prop(FlowService.PROPERTY_PROCESSING_JOB_ID), "null"),
                            valueMap.get(FlowService.prop(FlowService.PROPERTY_PAUSED), "null"),
                            valueMap.get(FlowService.prop(FlowService.PROPERTY_TEMPLATE), "null"),
                            valueMap.get(FlowService.prop(FlowService.PROPERTY_TITLE), "null"));
                    } catch (Exception e) {
                        LOGGER.error("FlowResourceChangeListener.processChanges: Error reading resource properties. path={}", 
                            path, e);
                    }
                }

                // Debug: Log change type and resource state
                LOGGER.error("FlowResourceChangeListener.processChanges: Change details. path={}, changeType={}", 
                    path, change.getType());

                // Check if this change is from user-controlled properties or internal FlowService updates
                // Skip if only internal properties changed (prevents loop from FlowService updates)
                if (!isUserControlledPropertyChange(change)) {
                    LOGGER.error("FlowResourceChangeListener.processChanges: Skipping change - only internal properties changed. path={}", path);
                    continue;
                }

                // Check state machine - skip if actively processing or recently completed
                if (resource != null && shouldSkipResourceByState(resource)) {
                    LOGGER.error("FlowResourceChangeListener.processChanges: Skipping resource based on state. path={}", path);
                    continue;
                }

                if (flowService.isFlowEnabledResource(resource)) {
                    LOGGER.error("FlowResourceChangeListener.processChanges: Resource is flow-enabled. path={}, changeType={}", 
                        path, change.getType());
                    changeMap.put(path, change.getType());
                } else {
                    LOGGER.error("FlowResourceChangeListener.processChanges: Resource is NOT flow-enabled. path={}", path);
                }
            }

            if (!changeMap.isEmpty()) {
                // Cancel any existing jobs for the same resource paths
                // This handles the case where a job was already created before we set QUEUED
                cancelOverlappingJobs(changeMap.keySet());
                
                LOGGER.error("FlowResourceChangeListener.processChanges: Creating job for {} flow-enabled resource(s). changes={}", 
                    changeMap.size(), changeMap);
                props.put("changes", changeMap);
                // Store creation timestamp to track job age for stale job cleanup
                props.put("createdTime", System.currentTimeMillis());
                Job newJob = jobManager.addJob(JOB_TOPIC, props);
                String jobId = newJob != null ? newJob.getId() : null;
                
                // Set state to QUEUED for resources AFTER creating job to get job ID
                // This prevents other listeners from creating duplicate jobs for the same resource
                for (String path : changeMap.keySet()) {
                    Resource resource = resourceResolver.getResource(path);
                    if (resource != null) {
                        setResourceState(resource, FlowService.STATE_QUEUED, null, jobId);
                    }
                }
                
                LOGGER.error("FlowResourceChangeListener.processChanges: Job created successfully. topic={}, jobId={}, changes={}", 
                    JOB_TOPIC, jobId, changeMap);
            } else {
                LOGGER.error("FlowResourceChangeListener.processChanges: No flow-enabled resources found in changes");
            }
        }

        /**
         * Cancels any existing jobs that overlap with the given resource paths.
         * This prevents redundant processing when multiple changes occur rapidly.
         * 
         * @param resourcePaths The set of resource paths that will be processed by the new job
         */
        @SuppressWarnings("unchecked")
        private void cancelOverlappingJobs(Set<String> resourcePaths) {
            try {
                // Find all queued jobs for this topic
                Collection<Job> queuedJobs = jobManager.findJobs(
                    JobManager.QueryType.QUEUED, 
                    JOB_TOPIC, 
                    -1  // -1 means no limit
                );
                
                // Find all active jobs for this topic
                Collection<Job> activeJobs = jobManager.findJobs(
                    JobManager.QueryType.ACTIVE, 
                    JOB_TOPIC, 
                    -1
                );
                
                int cancelledCount = 0;
                long currentTime = System.currentTimeMillis();
                long maxJobAge = 5 * 60 * 1000; // 5 minutes in milliseconds
                
                // Cancel queued jobs that overlap OR are too old
                for (Job job : queuedJobs) {
                    boolean shouldCancel = false;
                    String reason = "";
                    
                    // Check for path overlap
                    if (hasOverlappingPaths(job, resourcePaths)) {
                        shouldCancel = true;
                        reason = "overlapping paths";
                    }
                    // Check if job is too old (stale)
                    else if (isJobTooOld(job, currentTime, maxJobAge)) {
                        shouldCancel = true;
                        reason = "job too old (stale)";
                    }
                    
                    if (shouldCancel) {
                        String jobId = job.getId();
                        boolean removed = jobManager.removeJobById(jobId);
                        if (removed) {
                            cancelledCount++;
                            LOGGER.error("FlowResourceChangeListener.cancelOverlappingJobs: Cancelled queued job. jobId={}, reason={}, paths={}", 
                                jobId, reason, resourcePaths);
                        }
                    }
                }
                
                // Stop active jobs that overlap OR are too old
                for (Job job : activeJobs) {
                    boolean shouldCancel = false;
                    String reason = "";
                    
                    // Check for path overlap
                    if (hasOverlappingPaths(job, resourcePaths)) {
                        shouldCancel = true;
                        reason = "overlapping paths";
                    }
                    // Check if job is too old (stale)
                    else if (isJobTooOld(job, currentTime, maxJobAge)) {
                        shouldCancel = true;
                        reason = "job too old (stale)";
                    }
                    
                    if (shouldCancel) {
                        String jobId = job.getId();
                        jobManager.stopJobById(jobId);
                        cancelledCount++;
                        LOGGER.error("FlowResourceChangeListener.cancelOverlappingJobs: Stopped active job. jobId={}, reason={}, paths={}", 
                            jobId, reason, resourcePaths);
                    }
                }
                
                if (cancelledCount > 0) {
                    LOGGER.error("FlowResourceChangeListener.cancelOverlappingJobs: Cancelled {} job(s) for paths={}", 
                        cancelledCount, resourcePaths);
                }
            } catch (Exception e) {
                LOGGER.error("FlowResourceChangeListener.cancelOverlappingJobs: Error cancelling overlapping jobs for paths={}", 
                    resourcePaths, e);
            }
        }

        /**
         * Checks if a job is too old (stale) based on its creation time.
         * 
         * @param job The job to check
         * @param currentTime Current time in milliseconds
         * @param maxAge Maximum age in milliseconds before job is considered stale
         * @return true if job is older than maxAge
         */
        private boolean isJobTooOld(Job job, long currentTime, long maxAge) {
            try {
                // Get job creation time from job properties or job object
                // Sling Job API may provide creation time via getCreated() or similar
                // If not available, we can use a timestamp stored in job properties
                Object createdTimeObj = job.getProperty("createdTime");
                if (createdTimeObj instanceof Long) {
                    long createdTime = (Long) createdTimeObj;
                    long age = currentTime - createdTime;
                    return age > maxAge;
                }
                // If no creation time is stored, we can't determine age
                // Return false to be safe (don't cancel jobs we can't verify)
                return false;
            } catch (Exception e) {
                LOGGER.error("FlowResourceChangeListener.isJobTooOld: Error checking job age. jobId={}", 
                    job != null ? job.getId() : "null", e);
                return false; // On error, don't cancel
            }
        }

        /**
         * Checks if a job's changes overlap with the given resource paths.
         * 
         * @param job The job to check
         * @param resourcePaths The resource paths to check for overlap
         * @return true if the job processes any of the given resource paths
         */
        private boolean hasOverlappingPaths(Job job, Set<String> resourcePaths) {
            try {
                Object changesObj = job.getProperty("changes");
                if (changesObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, ?> changes = (Map<String, ?>) changesObj;
                    // Check if any of the job's paths overlap with the new paths
                    for (String path : changes.keySet()) {
                        if (resourcePaths.contains(path)) {
                            return true;
                        }
                    }
                }
            } catch (Exception e) {
                LOGGER.error("FlowResourceChangeListener.hasOverlappingPaths: Error checking job overlap. jobId={}", 
                    job != null ? job.getId() : "null", e);
            }
            return false;
        }

        /**
         * Checks if a ResourceChange is from user-controlled properties or internal FlowService updates.
         * Returns true if user-controlled properties changed, false if only internal properties changed.
         * 
         * @param change The ResourceChange to check
         * @return true if user-controlled properties changed, false if only internal properties changed
         */
        private boolean isUserControlledPropertyChange(ResourceChange change) {
            try {
                // Try to get changed property names from the change event
                // Note: ResourceChange API may not support getPropertyNames() in all versions
                // If not available, we'll use reflection or fallback to allowing the change
                Set<String> changedProperties = null;
                
                // Try to get property names using reflection (if method exists)
                try {
                    java.lang.reflect.Method getPropertyNamesMethod = change.getClass().getMethod("getPropertyNames");
                    Object result = getPropertyNamesMethod.invoke(change);
                    if (result instanceof Set) {
                        @SuppressWarnings("unchecked")
                        Set<String> props = (Set<String>) result;
                        changedProperties = props;
                    }
                } catch (NoSuchMethodException | IllegalAccessException | java.lang.reflect.InvocationTargetException e) {
                    // Method doesn't exist or not accessible - fallback to allowing change
                    LOGGER.error("FlowResourceChangeListener.isUserControlledPropertyChange: Cannot get property names from ResourceChange. Allowing change. path={}", 
                        change.getPath());
                    return true; // If we can't determine, allow processing (safer to process than skip)
                }
                
                // If we got property names, check if any are user-controlled
                if (changedProperties != null && !changedProperties.isEmpty()) {
                    Set<String> userControlledProps = getUserControlledProperties();
                    boolean hasUserControlledChange = false;
                    
                    for (String prop : changedProperties) {
                        if (userControlledProps.contains(prop)) {
                            hasUserControlledChange = true;
                            LOGGER.error("FlowResourceChangeListener.isUserControlledPropertyChange: User-controlled property changed. path={}, property={}", 
                                change.getPath(), prop);
                            break;
                        }
                    }
                    
                    if (!hasUserControlledChange) {
                        LOGGER.error("FlowResourceChangeListener.isUserControlledPropertyChange: Only internal properties changed. path={}, properties={}", 
                            change.getPath(), changedProperties);
                        return false; // Only internal properties changed - skip
                    }
                }
                
                // If we can't determine changed properties, allow processing (safer)
                return true;
            } catch (Exception e) {
                LOGGER.error("FlowResourceChangeListener.isUserControlledPropertyChange: Error checking property change. path={}", 
                    change != null ? change.getPath() : "null", e);
                return true; // On error, allow processing (safer to process than skip)
            }
        }

        /**
         * Returns the set of user-controlled properties that should trigger Flow processing.
         * These are properties that users can edit in dialogs, not internal FlowService properties.
         * 
         * @return Set of user-controlled property names
         */
        private Set<String> getUserControlledProperties() {
            return Set.of(
                FlowService.prop(FlowService.PROPERTY_ENABLE),
                FlowService.prop(FlowService.PROPERTY_TEMPLATE),
                FlowService.prop(FlowService.PROPERTY_TEMPLATE_DESIGN),
                FlowService.prop(FlowService.PROPERTY_TITLE),
                FlowService.prop(FlowService.PROPERTY_ICON),
                FlowService.prop(FlowService.PROPERTY_COLOR),
                FlowService.prop(FlowService.PROPERTY_NAME),
                FlowService.prop(FlowService.PROPERTY_GROUP),
                FlowService.prop(FlowService.PROPERTY_REFERENCE),
                FlowService.prop(FlowService.PROPERTY_VERSION),
                FlowService.prop(FlowService.PROPERTY_SAMPLEDATA),
                FlowService.prop(FlowService.PROPERTY_README)
            );
        }

        /**
         * Checks if a resource should be skipped based on its processing state.
         * Uses state machine logic to prevent duplicate processing.
         * If the job associated with the state no longer exists, allows processing.
         * 
         * @param resource The resource to check
         * @return true if resource should be skipped (actively processing)
         */
        private boolean shouldSkipResourceByState(Resource resource) {
            try {
                String state = resource.getValueMap().get(
                    FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE),
                    FlowService.STATE_IDLE
                );
                
                // Skip if HOLD - user has manually stopped processing
                if (FlowService.STATE_HOLD.equals(state)) {
                    LOGGER.error("FlowResourceChangeListener.shouldSkipResourceByState: Resource is on HOLD. path={}, state={}", 
                        resource.getPath(), state);
                    return true;
                }
                
                // Check if QUEUED or PROCESSING - another job might be handling this resource
                if (FlowService.STATE_QUEUED.equals(state) || FlowService.STATE_PROCESSING.equals(state)) {
                    // Get the job ID stored on the resource
                    String jobId = resource.getValueMap().get(
                        FlowService.prop(FlowService.PROPERTY_PROCESSING_JOB_ID),
                        ""
                    );
                    
                    // If no job ID stored, allow processing (state might be stale)
                    if (jobId == null || jobId.isEmpty()) {
                        LOGGER.error("FlowResourceChangeListener.shouldSkipResourceByState: Resource state is {} but no job ID found. Allowing processing. path={}", 
                            state, resource.getPath());
                        return false;
                    }
                    
                    // Check if the job still exists
                    boolean jobExists = jobExists(jobId);
                    if (!jobExists) {
                        // Job is gone (completed, cancelled, or failed) - allow new processing
                        LOGGER.error("FlowResourceChangeListener.shouldSkipResourceByState: Resource state is {} but job {} no longer exists. Allowing processing. path={}", 
                            state, jobId, resource.getPath());
                        // Reset state to IDLE since job is gone
                        setResourceState(resource, FlowService.STATE_IDLE, null, null);
                        return false;
                    }
                    
                    // Job still exists - skip processing
                    LOGGER.error("FlowResourceChangeListener.shouldSkipResourceByState: Resource is queued or processing. path={}, state={}, jobId={}", 
                        resource.getPath(), state, jobId);
                    return true;
                }
                
                // Allow processing for IDLE, ERROR, SKIPPED, or COMPLETED states
                // PROPERTY_NAMES_HINT ensures we only get events for user-controlled properties,
                // so we don't need to check for "recently completed" to filter internal updates
                return false;
            } catch (Exception e) {
                LOGGER.error("FlowResourceChangeListener.shouldSkipResourceByState: Error checking state. path={}", 
                    resource != null ? resource.getPath() : "null", e);
                return false; // On error, allow processing to proceed
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
                LOGGER.error("FlowResourceChangeListener.jobExists: Error checking if job exists. jobId={}", jobId, e);
                // On error, assume job doesn't exist to allow processing
                return false;
            }
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
                LOGGER.error("FlowResourceChangeListener.setResourceState: Set resource state. path={}, state={}, jobId={}, timestamp={}", 
                    resource.getPath(), state, jobId, timestamp);
            } catch (Exception e) {
                LOGGER.error("FlowResourceChangeListener.setResourceState: Error setting state. path={}, state={}", 
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
