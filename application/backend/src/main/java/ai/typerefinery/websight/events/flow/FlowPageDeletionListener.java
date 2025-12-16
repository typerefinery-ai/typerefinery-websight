package ai.typerefinery.websight.events.flow;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.apache.jackrabbit.JcrConstants;
import org.apache.sling.api.resource.Resource;
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
import ai.typerefinery.websight.services.flow.FlowSyncStorageService;

/**
 * Listener for page deletions to clean up flows for all components on the page.
 * 
 * When a page is deleted, this listener:
 * 1. Finds all /var resources that correspond to components on the deleted page
 * 2. For each /var resource with a valid flow ID, creates a cleanup job
 * 
 * This ensures flows are properly paused and /var resources are cleaned up when pages are deleted.
 * 
 * Architecture: This listener only creates jobs - all business logic is handled by FlowSyncJobConsumer.
 */
@Component(
  immediate = true,
  service = ResourceChangeListener.class,
  configurationPolicy = ConfigurationPolicy.IGNORE,
  property = {
    Constants.SERVICE_ID + "=TypeRefinery - Flow Page Deletion Listener",
    Constants.SERVICE_DESCRIPTION + "=Listen to page deletions and trigger flow cleanup jobs",
    ResourceChangeListener.PATHS + "=/content",
    ResourceChangeListener.CHANGES + "=REMOVED"
  }
)
public class FlowPageDeletionListener implements ResourceChangeListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(FlowPageDeletionListener.class);

    @Reference
    private JobManager jobManager;

    @Reference
    private FlowService flowService;

    @Reference
    private FlowSyncStorageService flowSyncStorage;

    @Reference
    private ContentAccess contentAccess;

    private boolean enabled;
    
    @Activate
    protected void activate() {
        this.enabled = flowService.configuration.flow_page_change_listener_enabled();
        LOGGER.info("FlowPageDeletionListener activated. enabled={}", enabled);
    }

    @Override
    public void onChange(List<ResourceChange> changes) {
        LOGGER.info("FlowPageDeletionListener.onChange: Received {} change(s). enabled={}", 
            changes != null ? changes.size() : 0, enabled);
        
        if (!enabled) {
            LOGGER.debug("FlowPageDeletionListener.onChange: Listener is disabled, ignoring changes");
            return;
        }

        if (changes == null || changes.isEmpty()) {
            LOGGER.debug("FlowPageDeletionListener.onChange: No changes to process");
            return;
        }

        try (ResourceResolver resourceResolver = contentAccess.getAdminResourceResolver()) {
            if (resourceResolver == null) {
                LOGGER.error("FlowPageDeletionListener.onChange: Could not get admin resource resolver");
                return;
            }
            processPageDeletions(changes, resourceResolver);
        } catch (Exception e) {
            LOGGER.error("FlowPageDeletionListener.onChange: Exception processing changes", e);
        }
    }

    /**
     * Process page deletions and create cleanup jobs for flow-enabled components.
     * This method only creates jobs - all business logic is handled by FlowSyncJobConsumer.
     * 
     * @param changes List of resource changes
     * @param resourceResolver Resource resolver to use
     */
    private void processPageDeletions(List<ResourceChange> changes, ResourceResolver resourceResolver) {
        LOGGER.info("FlowPageDeletionListener.processPageDeletions: Processing {} change(s)", 
            changes != null ? changes.size() : 0);
        
        for (ResourceChange change : changes) {
            String resourcePath = change.getPath();
            
            // Check if this is a page deletion (page resource, not jcr:content)
            if (!isPagePath(resourcePath)) {
                LOGGER.debug("FlowPageDeletionListener.processPageDeletions: Not a page path, skipping. path={}", 
                    resourcePath);
                continue;
            }
            
            LOGGER.info("FlowPageDeletionListener.processPageDeletions: Page deleted, finding flow components. pagePath={}", 
                resourcePath);
            
            // Find all /var resources for components under this page
            // Construct the /var path for the page and check if it exists
            // Even though the page is deleted, /var resources might still exist temporarily
            String pageVarPath = flowSyncStorage.getVarPath(resourcePath);
            if (pageVarPath == null) {
                LOGGER.debug("FlowPageDeletionListener.processPageDeletions: Could not get var path for page. pagePath={}", 
                    resourcePath);
                continue;
            }
            
            // Get the /var resource for the page (if it exists)
            // The /var resource might still exist even if the page is deleted
            Resource varPageResource = resourceResolver.getResource(pageVarPath);
            if (varPageResource != null) {
                // Recursively find all /var resources under the page with flow IDs
                LOGGER.info("FlowPageDeletionListener.processPageDeletions: Found /var resource for deleted page, searching for flow components. pagePath={}, varPath={}", 
                    resourcePath, pageVarPath);
                findAndCleanupVarResources(varPageResource, resourceResolver);
            } else {
                // /var resource doesn't exist - this means no flows were created for this page
                // or the /var resource was already cleaned up
                LOGGER.debug("FlowPageDeletionListener.processPageDeletions: No /var resource found for deleted page. pagePath={}, varPath={}", 
                    resourcePath, pageVarPath);
            }
        }
    }
    
    /**
     * Check if a path is a page path (not jcr:content or a child of jcr:content).
     * 
     * @param path The resource path
     * @return true if this is a page path
     */
    private boolean isPagePath(String path) {
        if (path == null || path.isEmpty()) {
            return false;
        }
        
        // Page paths are like /content/pages/home
        // Not like /content/pages/home/jcr:content or /content/pages/home/jcr:content/rootcontainer
        return !path.contains("/" + JcrConstants.JCR_CONTENT + "/") && 
               !path.endsWith("/" + JcrConstants.JCR_CONTENT);
    }
    
    /**
     * Recursively find all /var resources with flow IDs and create cleanup jobs.
     * 
     * @param varResource The /var resource to search (can be page or component)
     * @param resourceResolver Resource resolver
     */
    private void findAndCleanupVarResources(Resource varResource, ResourceResolver resourceResolver) {
        if (varResource == null) {
            return;
        }
        
        // Check if this /var resource has a flow ID
        String flowstreamid = varResource.getValueMap().get(
            FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID),
            ""
        );
        
        if (flowstreamid != null && !flowstreamid.isEmpty()) {
            // This /var resource has a flow ID - create cleanup job
            // Reverse map /var path back to component path
            String varPath = varResource.getPath();
            String componentPath = getComponentPathFromVarPath(varPath);
            
            if (componentPath != null) {
                LOGGER.info("FlowPageDeletionListener.findAndCleanupVarResources: Found flow component on deleted page, creating cleanup job. componentPath={}, flowstreamid={}", 
                    componentPath, flowstreamid);
                
                createCleanupJob(componentPath);
            }
        }
        
        // Recursively check children
        Iterator<Resource> children = varResource.listChildren();
        while (children.hasNext()) {
            Resource child = children.next();
            findAndCleanupVarResources(child, resourceResolver);
        }
    }
    
    /**
     * Reverse map /var path back to component path.
     * 
     * @param varPath The /var path (e.g., /var/typerefinery/flow/content/pages/home/jcr:content/rootcontainer/form)
     * @return The component path (e.g., /content/pages/home/jcr:content/rootcontainer/form) or null if mapping fails
     */
    private String getComponentPathFromVarPath(String varPath) {
        if (varPath == null || varPath.isEmpty()) {
            return null;
        }
        
        // Remove /var/typerefinery/flow prefix using constant from FlowSyncStorageService
        String prefix = FlowSyncStorageService.VAR_BASE_PATH;
        if (!varPath.startsWith(prefix)) {
            return null;
        }
        
        // Get the component path part
        String componentPath = varPath.substring(prefix.length());
        if (componentPath.startsWith("/")) {
            return componentPath;
        }
        
        return "/" + componentPath;
    }
    
    /**
     * Create a cleanup job for a component path.
     * This follows the same pattern as FlowResourceChangeListener - only creates jobs.
     * 
     * @param componentPath The component path that was deleted
     */
    private void createCleanupJob(String componentPath) {
        LOGGER.info("FlowPageDeletionListener.createCleanupJob: Creating cleanup job for deleted component. componentPath={}", 
            componentPath);
        
        // Create job with component path and REMOVED change type
        // FlowSyncJobConsumer will handle all business logic (pause flow, delete /var resource)
        Map<String, Object> props = new HashMap<>();
        props.put("componentPath", componentPath);
        props.put("changeType", ResourceChange.ChangeType.REMOVED.toString());
        
        Job job = jobManager.addJob(FlowResourceChangeListener.JOB_TOPIC, props);
        String jobId = job != null ? job.getId() : null;
        
        LOGGER.info("FlowPageDeletionListener.createCleanupJob: Created cleanup job. componentPath={}, jobId={}", 
            componentPath, jobId);
    }
}

