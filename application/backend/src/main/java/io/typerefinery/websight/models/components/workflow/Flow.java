package io.typerefinery.websight.models.components.workflow;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.HashMap;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.RequestAttribute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.services.workflow.FlowService;
import io.typerefinery.websight.utils.PageUtil;
import lombok.Getter;

import static io.typerefinery.websight.services.workflow.FlowService.PROPERTY_EDITURL;
import static io.typerefinery.websight.services.workflow.FlowService.prop;

@Model(adaptables = {Resource.class, SlingHttpServletRequest.class}, defaultInjectionStrategy = OPTIONAL)
public class Flow extends BaseComponent {
    
    private static final Logger LOG = LoggerFactory.getLogger(Flow.class);
    private static final String DEFAULT_ID = "flow";
    private static final String DEFAULT_MODULE = "flowComponent";
    // read properties from resource

    // if true will create/update flow
    @Getter
    @Inject
    @Default(values = "false")
    public Boolean flowapi_enable;

    // if blank will create new flow, if not blank will be used to update existing flow
    @Getter
    @Inject
    @Default(values = "")
    public String flowapi_flowstreamid;

    // will be used to test if update of flow should happen
    @Getter
    @Inject
    @Default(values = "")
    public String flowapi_title;
    
    // authored title and will be used compared to flowapi_title to determine if update of flow should happen
    @Getter
    @Inject
    @Default(values = "")
    public String title;

    @Getter
    @Inject
    @Default(values = "")
    public String flowapi_editurl;

    // accept HTL attributes

    // which template to use for flow
    @RequestAttribute(name = "template")
    private String template;

    // which topic to use for flow
    @RequestAttribute(name = "topic")
    private String topic;

    // which topic to use for flow
    @RequestAttribute(name = "iscontainer")
    private boolean isContainer;

    // which design template to use for flow update
    @RequestAttribute(name = "designtemplate")
    private String designTemplate;

    @OSGiService
    FlowService flowService;

    @Override
    @PostConstruct
    protected void init() {
        this.id = DEFAULT_ID;
        this.module = DEFAULT_MODULE;
        super.init();

        LOG.info("init template: {}", template);

        //quick fail
        if (StringUtils.isBlank(template)) {
            return;
        }

        super.init();

        if (StringUtils.isBlank(title)) {
            title = resource.getName();
        }

        if (flowapi_enable) {
            boolean isFlowExists = flowService.isFlowExists(flowapi_flowstreamid);
            boolean isTemplateExists = PageUtil.isResourceExists(template, resourceResolver);
            if (!isTemplateExists) {
                LOG.info("nothing to do, template not found: {}", template);
                return;
            }
            // create new flow or update existing flow
            if (isFlowExists == false && isTemplateExists) {
                // use topic from resource as priority
                flowapi_flowstreamid = flowService.createFlowFromTemplate(template, resource, topic, title);
                isFlowExists = flowService.isFlowExists(flowapi_flowstreamid);
            } else if (isFlowExists && isTemplateExists) {

                // if flowapi_title and title are different then update flowstream
                if (flowapi_title.equals(title)) {
                    LOG.info("nothing to update.");
                } else {
                    flowService.updateFlowFromTemplate(template, resource, title, flowapi_flowstreamid);
                    if (isContainer & StringUtils.isNotBlank(designTemplate)) {
                        flowService.updateFlowDesignFromTemplate(designTemplate, resource, title, flowapi_flowstreamid);
                    }
                }
            } 

            //if edit url has been cleared then update it if we have a flowstreamid
            if (isFlowExists && StringUtils.isBlank(flowapi_editurl)) {
                // set edit url
                flowapi_editurl = flowService.compileEditUrl(flowapi_flowstreamid);
                // update current resource
                HashMap<String, Object> data = new HashMap<>();
                data.put(prop(PROPERTY_EDITURL), flowapi_editurl);
                PageUtil.updatResourceProperties(resource, data);
            }
        }
    }

}
