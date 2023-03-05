package io.typerefinery.websight.models.components.widgets;

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
import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.models.components.FlowComponent;
import io.typerefinery.websight.services.flow.FlowService;
import io.typerefinery.websight.services.flow.registry.FlowComponentRegister;
import io.typerefinery.websight.utils.PageUtil;

/*
 * Ticker component
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
    resourceType = { Ticker.RESOURCE_TYPE },
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Ticker extends FlowComponent implements FlowComponentRegister {
    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/ticker";
    private static final String DEFAULT_MODULE = "tickerComponent";

    private static final String PROPERTY_TITLE = "title";
    private static final String DEFAULT_TITLE = "Sample Card";

    private static final String PROPERTY_VALUE = "value";
    private static final String DEFAULT_VALUE = "12.5k";

    private static final String PROPERTY_ICON = "icon";
    private static final String DEFAULT_ICON = "pi pi-database";

    private static final String PROPERTY_BADGE = "badge";
    private static final String DEFAULT_BADGE = "";

    private static final String PROPERTY_INDICATOR_TYPE = "indicatorType";
    private static final String DEFAULT_INDICATOR_TYPE = "pi pi-arrow-up";

    private static final String PROPERTY_INDICATOR_VALUE = "indicatorValue";
    private static final String DEFAULT_INDICATOR_VALUE = "12.k";

    private static final String PROPERTY_INDICATOR_VALUE_PRECISION = "indicatorValuePrecision";
    private static final String DEFAULT_INDICATOR_VALUE_PRECISION = "";

    private static final String PROPERTY_DATASOURCE = "dataSource";
    private static final String DEFAULT_DATASOURCE = "";

    private static final String PROPERTY_WEBSOCKET_HOST = "websocketHost";
    private static final String DEFAULT_WEBSOCKET_HOST = "ws://localhost:8112/$tms";

    private static final String PROPERTY_WEBSOCKET_TOPIC = "websocketTopic";
    private static final String DEFAULT_WEBSOCKET_TOPIC = "";

    private static final String PROPERTY_FLOWAPI_TOPIC = "flowapi_topic";
    private static final String DEFAULT_FLOWAPI_TOPIC = "";

    private static final String PROPERTY_VARIANT = "variant";
    private static final String DEFAULT_VARIANT = "primaryTicker";

    private static final String PROPERTY_BACKGROUND_CLASS = "backGroundClass";
    private static final String DEFAULT_BACKGROUND_CLASS = "";    

    public static final String DEFAULT_FLOWAPI_TEMPLATE = "/apps/typerefinery/components/widgets/ticker/templates/ticker.json";
    public static final String DEFAULT_FLOWAPI_SAMPLEDATA = "/apps/typerefinery/components/widgets/ticker/templates/flowsample.json";


    @Getter
    @Inject
    @Named(PROPERTY_TITLE)
    @Nullable
    public String title;

    @Getter
    @Inject
    @Named(PROPERTY_VALUE)
    @Nullable
    public String value;

    @Getter
    @Inject
    @Named(PROPERTY_ICON)
    @Nullable
    public String icon;

    @Getter
    @Inject
    @Named(PROPERTY_BADGE)
    @Nullable
    public String badge;

    @Getter
    @Inject
    @Named(PROPERTY_INDICATOR_TYPE)
    @Nullable
    public String indicatorType;

    @Getter
    @Inject
    @Named(PROPERTY_INDICATOR_VALUE)
    @Nullable
    public String indicatorValue;
    
    @Getter
    @Inject
    @Named(PROPERTY_INDICATOR_VALUE_PRECISION)
    @Nullable
    public String indicatorValuePrecision;

    @Getter
    @Inject
    @Named(PROPERTY_DATASOURCE)
    @Nullable
    public String dataSource;

    @Getter
    @Inject
    @Named(PROPERTY_WEBSOCKET_HOST)
    @Nullable
    public String websocketHost;

    @Getter
    @Inject
    @Named(PROPERTY_WEBSOCKET_TOPIC)
    @Nullable
    public String websocketTopic;

    @Getter
    @Inject
    @Named(PROPERTY_FLOWAPI_TOPIC)
    @Nullable
    public String flowapi_topic;

    @Getter
    @Inject
    @Named(PROPERTY_VARIANT)
    @Nullable
    public String variant;

    @Inject
    @Getter
    @Named(PROPERTY_BACKGROUND_CLASS)
    @Nullable
    public String backGroundClass;


    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();
        if (StringUtils.isBlank(title)) {
            this.title = DEFAULT_TITLE;
        }
        if (StringUtils.isBlank(value)) {
            this.value = DEFAULT_VALUE;
        }
        if (StringUtils.isBlank(icon)) {
            this.icon = DEFAULT_ICON;
        }
        if (StringUtils.isBlank(badge)) {
            this.badge = DEFAULT_BADGE;
        }
        if (StringUtils.isBlank(indicatorType)) {
            this.indicatorType = DEFAULT_INDICATOR_TYPE;
        }
        if (StringUtils.isBlank(indicatorValue)) {
            this.indicatorValue = DEFAULT_INDICATOR_VALUE;
        }
        if (StringUtils.isBlank(indicatorValuePrecision)) {
            this.indicatorValuePrecision = DEFAULT_INDICATOR_VALUE_PRECISION;
        }
        if (StringUtils.isBlank(dataSource)) {
            this.dataSource = DEFAULT_DATASOURCE;
        }
        if (StringUtils.isBlank(websocketHost)) {
            this.websocketHost = DEFAULT_WEBSOCKET_HOST;
        }
        if (StringUtils.isBlank(websocketTopic)) {
            this.websocketTopic = DEFAULT_WEBSOCKET_TOPIC;
        }
        if (StringUtils.isBlank(flowapi_topic)) {
            this.flowapi_topic = DEFAULT_FLOWAPI_TOPIC;
        }
        if (StringUtils.isBlank(variant)) {
            this.variant = DEFAULT_VARIANT;
        }
        if (StringUtils.isBlank(backGroundClass)) {
            this.backGroundClass = DEFAULT_BACKGROUND_CLASS;
        }

        if (StringUtils.isBlank(this.websocketTopic)) {
            this.websocketTopic = this.flowapi_topic;
        }

        
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