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

            returnProcessFlowError = false;
            changeMap.forEach((path, changeType) -> {
                LOGGER.error("FlowJobConsumer.process: Processing resource change. path={}, changeType={}", 
                    path, changeType);
                
                Resource resource = resourceResolver.getResource(path);
                if (resource == null) {
                    LOGGER.error("FlowJobConsumer.process: Resource is null. path={}", path);
                } else if (ResourceUtil.isNonExistingResource(resource)) {
                    LOGGER.error("FlowJobConsumer.process: Resource does not exist. path={}", path);
                } else {
                    LOGGER.error("FlowJobConsumer.process: Calling doProcessFlowResource. path={}, changeType={}", 
                        path, changeType);
                    boolean result = flowService.doProcessFlowResource(resource, changeType);
                    LOGGER.error("FlowJobConsumer.process: doProcessFlowResource result. path={}, result={}", 
                        path, result);
                    if (!result) {
                        LOGGER.error("FlowJobConsumer.process: doProcessFlowResource returned false. path={}", path);
                        returnProcessFlowError = true;
                    }
                }
            });
            
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
}
