package ai.typerefinery.websight.models.components.flow;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.HashMap;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.RequestAttribute;
import org.jetbrains.annotations.Nullable;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.models.components.FlowComponent;
import ai.typerefinery.websight.services.flow.FlowService;
import ai.typerefinery.websight.services.flow.registry.FlowComponentRegister;
import lombok.Getter;
import ai.typerefinery.websight.utils.PageUtil;

/*
 * Flow component
 * 
 * register component as FlowComponent to be able to use it in FlowService to determine if component needs Flow Sync
 * 
 */
@Component
@Model(adaptables = Resource.class, resourceType = { FlowContainer.RESOURCE_TYPE }, defaultInjectionStrategy = OPTIONAL)
public class FlowContainer extends FlowComponent implements FlowComponentRegister {
    
    public static final String RESOURCE_TYPE = "typerefinery/components/flow/flowcontainer";

    private static final Logger LOG = LoggerFactory.getLogger(FlowContainer.class);
    private static final String DEFAULT_MODULE = "flowComponent";
    // read properties from resource

    public static final String DEFAULT_FLOWAPI_TEMPLATE = "/apps/typerefinery/components/flow/flowcontainer/templates/dashboard.json";
    public static final String DEFAULT_FLOWAPI_SAMPLEDATA = "/apps/typerefinery/components/flow/flowcontainer/templates/dashboard_design.json";
    public static final Boolean DEFAULT_FLOWAPI_ISCONTAINER = true;


    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();

        // default values to be saved to resource if any are missing
        HashMap<String, Object> props = new HashMap<String, Object>(){{}};

        if (StringUtils.isBlank(this.flowapi_template)) {
            this.flowapi_template = DEFAULT_FLOWAPI_TEMPLATE;
            props.put(FlowService.prop(FlowService.PROPERTY_TEMPLATE), this.flowapi_template);
        }
        if (StringUtils.isBlank(this.flowapi_sampledata)) {
            this.flowapi_sampledata = DEFAULT_FLOWAPI_SAMPLEDATA;
            props.put(FlowService.prop(FlowService.PROPERTY_SAMPLEDATA), this.flowapi_sampledata);
        }
        if (this.flowapi_iscontainer == null) {
            this.flowapi_iscontainer = DEFAULT_FLOWAPI_ISCONTAINER;
            props.put(FlowService.prop(FlowService.PROPERTY_ISCONTAINER), this.flowapi_iscontainer);
        }

        if (props.size() > 0) {
            //update any defaults that should be set
            PageUtil.updatResourceProperties(resource, props);
        }
        
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
