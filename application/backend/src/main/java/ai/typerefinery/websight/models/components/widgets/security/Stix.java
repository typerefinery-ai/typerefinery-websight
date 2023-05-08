package ai.typerefinery.websight.models.components.widgets.security;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.HashMap;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.jetbrains.annotations.Nullable;
import org.osgi.service.component.annotations.Component;
import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.models.components.FlowComponent;
import ai.typerefinery.websight.services.flow.FlowService;
import ai.typerefinery.websight.services.flow.registry.FlowComponentRegister;
import ai.typerefinery.websight.utils.PageUtil;
/*
 * Stix component
 * 
 * register component as FlowComponent to be able to use it in FlowService to determine if component needs Flow Sync
 * 
 */
@Component
@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    resourceType = { Stix.RESOURCE_TYPE },
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Stix extends FlowComponent implements FlowComponentRegister {
    
    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/security/stix";
    private static final String DEFAULT_MODULE = "stixComponent";

    public static final String PROPERTY_MAX_COUNT = "maxCount";
    public static final String PROPERTY_DATA_URL = "dataUrl";

    public static final String DEFAULT_FLOWAPI_TEMPLATE = "/apps/typerefinery/components/widgets/security/stix/templates/stix.json";
    public static final String DEFAULT_FLOWAPI_SAMPLEDATA = "/apps/typerefinery/components/widgets/security/stix/templates/flowsample.json";

    @Inject
    @Getter
    @Named(PROPERTY_MAX_COUNT)
    @Nullable
    public String maxCount;

    @Getter
    @Inject
    @Named(PROPERTY_DATA_URL)
    @Nullable
    public String dataUrl;


    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();

        // default values to be saved to resource if any are missing
        HashMap<String, Object> props = new HashMap<String, Object>(){{            
        }};

        if (StringUtils.isBlank(this.flowapi_template)) {
            this.flowapi_template = DEFAULT_FLOWAPI_TEMPLATE;
            props.put(FlowService.prop(FlowService.PROPERTY_TEMPLATE), this.flowapi_template);
        }
        if (StringUtils.isBlank(this.flowapi_sampledata)) {
            this.flowapi_sampledata = DEFAULT_FLOWAPI_SAMPLEDATA;
            props.put(FlowService.prop(FlowService.PROPERTY_SAMPLEDATA), this.flowapi_sampledata);
        }

        //update any defaults that should be set
        PageUtil.updatResourceProperties(resource, props);
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
