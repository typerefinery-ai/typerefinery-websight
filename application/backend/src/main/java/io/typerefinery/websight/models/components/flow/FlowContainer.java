package io.typerefinery.websight.models.components.flow;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.RequestAttribute;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.services.flow.FlowService;
import io.typerefinery.websight.services.flow.registry.FlowComponent;
import lombok.Getter;

/*
 * Flow component
 * 
 * register component as FlowComponent to be able to use it in FlowService to determine if component needs Flow Sync
 * 
 */
@Component
@Model(adaptables = {Resource.class, SlingHttpServletRequest.class}, defaultInjectionStrategy = OPTIONAL)
public class FlowContainer extends BaseComponent implements FlowComponent {
    
    public static final String RESOURCE_TYPE = "typerefinery/components/flow/container";

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


    @OSGiService
    FlowService flowService;

    @Override
    @PostConstruct
    protected void init() {
        this.id = DEFAULT_ID;
        this.module = DEFAULT_MODULE;
        super.init();
    }

    @Override
    public String getKey() {
        return FlowService.FLOW_SPI_KEY;
    }

    @Override
    public String getComponent() {        
        return RESOURCE_TYPE;
    }

    @Override
    public int getRanking() {
        return 200;
    }

}
