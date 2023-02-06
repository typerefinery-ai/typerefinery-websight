package io.typerefinery.websight.models.components.workflow;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.HashMap;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.RequestAttribute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.typerefinery.websight.models.components.BaseModel;
import io.typerefinery.websight.services.workflow.FlowService;
import io.typerefinery.websight.utils.PageUtil;
import lombok.Getter;

import static io.typerefinery.websight.services.workflow.FlowService.PROPERTY_EDITURL;
import static io.typerefinery.websight.services.workflow.FlowService.prop;

@Model(adaptables = {Resource.class, SlingHttpServletRequest.class}, defaultInjectionStrategy = OPTIONAL)
public class Flow extends BaseModel {
    
    private static final Logger LOG = LoggerFactory.getLogger(Flow.class);

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

    @OSGiService
    FlowService flowService;

    @Override
    @PostConstruct
    protected void init() {
        LOG.info("init template: {}", template);

        //quick fail
        if (StringUtils.isBlank(template)) {
            return;
        }

        super.init();

        if (flowapi_enable) {
            // create new flow or update existing flow
            if (StringUtils.isBlank(flowapi_flowstreamid) 
                && StringUtils.isNotBlank(template)
            ) {
                // use topic from resource as priority
                flowService.createFlowFromTemplate(template, resource, topic, title);
            } else if (StringUtils.isNotBlank(flowapi_flowstreamid) 
                && StringUtils.isNotBlank(template)
            ) {
                // if flowapi_title and title are different then update flowstream
                if (flowapi_title.equals(title)) {
                    LOG.info("nothing to update.");
                } else {
                    flowService.updateFlowFromTemplate(template, resource, title, flowapi_flowstreamid);
                }
            }

            //if edit url has been cleared then update it if we have a flowstreamid
            if (StringUtils.isBlank(flowapi_editurl) && StringUtils.isNotBlank(flowapi_flowstreamid)) {
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
