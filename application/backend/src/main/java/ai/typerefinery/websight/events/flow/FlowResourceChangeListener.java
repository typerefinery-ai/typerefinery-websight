package ai.typerefinery.websight.events.flow;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.resource.observation.ResourceChange;
import org.apache.sling.api.resource.observation.ResourceChangeListener;
import org.apache.sling.event.jobs.JobManager;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.osgi.framework.BundleContext;
import org.osgi.framework.Constants;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.ServiceReference;
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
    ResourceChangeListener.PATHS + "=/content/typerefinery-showcase/pages/components",
    ResourceChangeListener.CHANGES + "=ADDED",
    ResourceChangeListener.CHANGES + "=CHANGED",
    ResourceChangeListener.CHANGES + "=REMOVED"
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
            if (enabled) {

                try (ResourceResolver resourceResolver = contentAccess.getAdminResourceResolver()) {
                    processChanges(changes, resourceResolver);
                } catch (Exception e) {
                  LOGGER.error("Could not get resource resolver", e);
                }
                
            }
        }

        public void processChanges(List<ResourceChange> changes, ResourceResolver resourceResolver) {
            final Map<String, Object> props = new HashMap<>();
            HashMap<String, ResourceChange.ChangeType> changeMap = new HashMap<>();
            for (ResourceChange change : changes) {
                String path = change.getPath();
                Resource resource = resourceResolver.getResource(path);

                if (flowService.isFlowEnabledResource(resource)) {
                    changeMap.put(path, change.getType());
                }
            }

            if (!changeMap.isEmpty()) {
                props.put("changes", changeMap);
                jobManager.addJob(JOB_TOPIC, props);
            }

        }
      
}
