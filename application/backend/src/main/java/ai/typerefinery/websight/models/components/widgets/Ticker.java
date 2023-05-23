package ai.typerefinery.websight.models.components.widgets;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.jetbrains.annotations.Nullable;
import org.osgi.service.component.annotations.Component;
import ai.typerefinery.websight.models.components.FlowComponent;
import ai.typerefinery.websight.services.flow.FlowService;
import ai.typerefinery.websight.services.flow.registry.FlowComponentRegister;
import ai.typerefinery.websight.utils.PageUtil;

import ai.typerefinery.websight.models.components.KeyValuePair;

/*

/*
 * Ticker component
 * 
 * register component as FlowComponent to be able to use it in FlowService to determine if component needs Flow Sync
 * 
 */
@Component
@Model(adaptables = Resource.class, resourceType = {
        "typerefinery/components/widgets/ticker" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Ticker extends FlowComponent implements FlowComponentRegister {
    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/ticker";
    public static final String DEFAULT_TEMPLATE_I = "<div class=' rounded'> <div class='card-body d-flex flex-row align-items-center flex-0 '> <div class='d-block'> <div class='h6 fw-normal text-gray mb-2'>{{title}}</div> <div class='d-flex'> <h2 class='h3 me-3'>{{value}}</h2> <div class='mt-2'> <span class='{{indicatorIcon}} text-{{indicatorType}}'></span> <span class='text-{{indicatorType}} fw-bold'>{{indicatorValue}}</span> </div> </div> </div> <div class='d-block ms-auto'> <i class='{{tickerIcon}}'></i> </div> </div> </div>";
    public static final String DEFAULT_TEMPLATE_II = "<div class=' rounded'>   <div class='card-body'>     <div class='lead'>{{title}}</div>     <h2 class='card-title'>{{value}}</h2>     <p class='small text-muted'>{{indicatorValue}}<i class='{{indicatorIcon}}'></i> {{indicatorType}}</p>   </div> </div>";
    public static final String DEFAULT_TEMPLATE_III = "<div class=' rounded'>   <div class='card-body'>     <i class='{{widgetIcon}} fa-2x p-3 bg-{{indicatorType}}'></i>     <div class='mt-2 lead'>{{title}}</div>     <h2 class='card-title' style='font-size:1.8em;'>{{value}}</h2>     <p class='small text-muted'>{{indicatorValue}},  <i class='pi pi-globe'></i> Worldwide</p>     <p class='text-{{indicatorType}}'>       <i class='{{indicatorIcon}}'></i> {{value}}      <span style='font-size: 0.9em' class='ml-2 text-muted'>{{indicatorPrecisionValue}}</span>     </p>   </div> </div>";
    public static final String CUSTOM_TEMPLATE = "custom";

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

    @Getter
    @Inject
    public List<KeyValuePair> configData;

    @Getter
    @Inject
    public String templateString;

    @Getter
    @Inject
    public String templateSelected;

    public Map<String, String> templateList = new HashMap<String, String>() {{
        put("1", DEFAULT_TEMPLATE_I);
        put("2", DEFAULT_TEMPLATE_II);
        put("3", DEFAULT_TEMPLATE_III);
    }};

    @Override
    @PostConstruct
    protected void init() {
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
        HashMap<String, Object> props = new HashMap<String, Object>(){{}};

        if (StringUtils.isBlank(this.flowapi_template)) {
            this.flowapi_template = DEFAULT_FLOWAPI_TEMPLATE;
            props.put(FlowService.prop(FlowService.PROPERTY_TEMPLATE), this.flowapi_template);
        }
        if (StringUtils.isBlank(this.flowapi_sampledata)) {
            this.flowapi_sampledata = DEFAULT_FLOWAPI_SAMPLEDATA;
            props.put(FlowService.prop(FlowService.PROPERTY_SAMPLEDATA), this.flowapi_sampledata);
        }
        if (StringUtils.isBlank(this.websocketTopic)) {
            this.websocketTopic = this.flowapi_topic;
        }

        if (StringUtils.isNotBlank(templateSelected)) {
            this.templateString = this.templateList.getOrDefault(templateSelected, this.templateString);
        }

        if (this.configData == null || this.configData.size() == 0) {
            this.configData = List.of(
                    new WidgetOptionItem("title", "Number of active users"),
                    new WidgetOptionItem("value", "25.5k"),
                    new WidgetOptionItem("indicatorValue", "4.54K"),
                    new WidgetOptionItem("indicatorType", "info"),
                    new WidgetOptionItem("tickerIcon", "pi pi-database "),
                    new WidgetOptionItem("indicatorIcon", "pi pi-arrow-down"),
                    new WidgetOptionItem("widgetIcon", "pi pi-briefcase text-light"),
                    new WidgetOptionItem("indicatorPrecisionValue", "Since last quarter"));
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