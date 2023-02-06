package io.typerefinery.websight.jobs.flow;

import java.util.List;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.consumer.JobConsumer;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.typerefinery.websight.events.flow.FlowResourceChangeListener;
import io.typerefinery.websight.services.ContentAccess;
import io.typerefinery.websight.services.workflow.FlowService;

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

    @Override
    public JobResult process(final Job job) {
        this.enabled = flowService.configuration.flow_page_change_listener_enabled();
        if (enabled) {
            List<String> paths = job.getProperty("paths", List.class);

            try (ResourceResolver resourceResolver = contentAccess.getAdminResourceResolver()) {

                paths.forEach(path -> {
                    Resource resource = resourceResolver.getResource(path);
                    if (resource != null) {
                        ValueMap valueMap = resource.getValueMap();

                    } else {
                        LOGGER.warn("Could not have access to resource {}.", path);
                    }
                });

            } catch (Exception e) {
                LOGGER.error("Could not get resource resolver", e);
            }

        }
        return JobResult.OK;
    }
}
