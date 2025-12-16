package ai.typerefinery.websight.events.flow;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.sling.api.resource.ResourceResolver;
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
 * This class listens for changes in the /content path and creates jobs for FlowSyncJobConsumer to process.
 * All business logic is handled by FlowSyncJobConsumer.
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
    public static final String JOB_TOPIC = "io/typerefinery/websight/flow/sync";
    
    private static final Logger LOGGER = LoggerFactory.getLogger(FlowResourceChangeListener.class);

    @Reference
    private JobManager jobManager;

    @Reference
    FlowService flowService;

    @Reference
    ContentAccess contentAccess;

    private boolean enabled;
    
    @Activate
    protected void activate() {
        this.enabled = flowService.configuration.flow_page_change_listener_enabled();
        LOGGER.info("FlowResourceChangeListener activated. enabled={}", enabled);
    }

    @Override
    public void onChange(List<ResourceChange> changes) {
        LOGGER.info("FlowResourceChangeListener.onChange: Received {} change(s). enabled={}", 
            changes != null ? changes.size() : 0, enabled);
        
        if (!enabled) {
            LOGGER.debug("FlowResourceChangeListener.onChange: Listener is disabled, ignoring changes");
            return;
        }

        if (changes == null || changes.isEmpty()) {
            LOGGER.debug("FlowResourceChangeListener.onChange: No changes to process");
            return;
        }

        try (ResourceResolver resourceResolver = contentAccess.getAdminResourceResolver()) {
            if (resourceResolver == null) {
                LOGGER.error("FlowResourceChangeListener.onChange: Could not get admin resource resolver");
                return;
            }
            processChanges(changes, resourceResolver);
        } catch (Exception e) {
            LOGGER.error("FlowResourceChangeListener.onChange: Exception processing changes", e);
        }
    }

    /**
     * Process changes and create jobs for FlowSyncJobConsumer.
     * This method only creates jobs - all business logic is handled by FlowSyncJobConsumer.
     * 
     * @param changes List of resource changes
     * @param resourceResolver Resource resolver to use
     */
    public void processChanges(List<ResourceChange> changes, ResourceResolver resourceResolver) {
        LOGGER.info("FlowResourceChangeListener.processChanges: Processing {} change(s)", 
            changes != null ? changes.size() : 0);
        
        for (ResourceChange change : changes) {
            String componentPath = change.getPath();
            ResourceChange.ChangeType changeType = change.getType();
            
            LOGGER.info("FlowResourceChangeListener.processChanges: Creating job for change. path={}, type={}", 
                componentPath, changeType);
            
            // Create job with component path and change type
            // FlowSyncJobConsumer will handle all business logic (flow-enabled check, cleanup, etc.)
            Map<String, Object> props = new HashMap<>();
            props.put("componentPath", componentPath);
            props.put("changeType", changeType.toString());
            
            Job job = jobManager.addJob(JOB_TOPIC, props);
            String jobId = job != null ? job.getId() : null;
            
            LOGGER.info("FlowResourceChangeListener.processChanges: Created job. path={}, changeType={}, jobId={}", 
                componentPath, changeType, jobId);
        }
    }
}
