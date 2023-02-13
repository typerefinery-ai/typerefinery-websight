package io.typerefinery.websight.models.components.workflow;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.RequestAttribute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.services.workflow.FlowService;
import lombok.Getter;

@Model(adaptables = {Resource.class, SlingHttpServletRequest.class}, defaultInjectionStrategy = OPTIONAL)
public class Flow extends BaseComponent {
    
    private static final Logger LOG = LoggerFactory.getLogger(Flow.class);
    private static final String DEFAULT_ID = "flow";
    private static final String DEFAULT_MODULE = "flowComponent";
    // read properties from resource

    // if true will create/update flow
    @Getter
    @Inject
    public Boolean flowapi_enable;

    // if blank will create new flow, if not blank will be used to update existing flow
    @Getter
    @Inject
    public String flowapi_flowstreamid;

    // will be used to test if update of flow should happen
    @Getter
    @Inject
    public String flowapi_title;

    @Getter
    @Inject
    public String flowapi_template;
    
    @Getter
    @Inject
    public String flowapi_designtemplate;    

    @Getter
    @Inject
    public Boolean flowapi_iscontainer;
    
    // authored title and will be used compared to flowapi_title to determine if update of flow should happen
    @Getter
    @Inject
    public String title;

    @Getter
    @Inject
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

        flowService.doProcessFlowResource(resource, title, topic, template, designTemplate, isContainer);

    }

}
