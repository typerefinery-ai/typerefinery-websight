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
import ai.typerefinery.websight.events.flow.FlowResourceChangeListener;
import ai.typerefinery.websight.models.components.flow.FlowContainer;
import ai.typerefinery.websight.services.ContentAccess;
import ai.typerefinery.websight.services.flow.FlowService;

import org.osgi.framework.Constants;

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

        this.enabled = flowService.configuration.flow_page_change_listener_enabled();
        if (enabled) {
            HashMap<String, ResourceChange.ChangeType> changeMap = job.getProperty("changes", HashMap.class);

            try (ResourceResolver resourceResolver = contentAccess.getAdminResourceResolver()) {

                changeMap.forEach((path, changeType) -> {
                    
                    Resource resource = resourceResolver.getResource(path);
                    if (!ResourceUtil.isNonExistingResource(resource)) {
                        // run resource processing
                        if(flowService.doProcessFlowResource(resource, changeType) == false)
                        {
                            returnProcessFlowError = true;
                        }
                    } else {
                        LOGGER.warn("Could not have access to resource {}.", path);
                    }
                });
                if(returnProcessFlowError == true){
                    return JobResult.FAILED;
                }
                
            } catch (Exception e) {
                LOGGER.error("Could not process paths.", e);
                return JobResult.FAILED;
            }

        }
        return JobResult.OK;
    }
}
