package ai.typerefinery.websight.models.components.widgets;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;

import java.util.HashMap;
import javax.inject.Named;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.Nullable;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import ai.typerefinery.websight.models.components.FlowComponent;
import ai.typerefinery.websight.models.components.KeyValuePair;
import ai.typerefinery.websight.services.flow.FlowService;
import ai.typerefinery.websight.services.flow.registry.FlowComponentRegister;
import ai.typerefinery.websight.utils.PageUtil;
import org.osgi.service.component.annotations.Component;


import ai.typerefinery.websight.models.components.BaseComponent;
/*
 * Ticker component
 * 
 * register component as FlowComponent to be able to use it in FlowService to determine if component needs Flow Sync
 * 
 */
@Component
@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/widgets/charts" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { 
    @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false") 
})
public class Chart extends FlowComponent implements FlowComponentRegister {

    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/chart";
    
    private static final String PROPERTY_TITLE = "title";
    private static final String DEFAULT_TITLE = "Chart";
    
    private static final String DEFAULT_ID = "chart";
    private static final String DEFAULT_CLASS_NAMES = "chart";
    private static final String DEFAULT_MODULE = "chartComponent";

    private static final String PROPERTY_DATASOURCE = "dataSource";
    private static final String DEFAULT_DATASOURCE = "";

    private static final String PROPERTY_WEBSOCKET_HOST = "websocketHost";
    private static final String DEFAULT_WEBSOCKET_HOST = "ws://localhost:8112/$tms";

    private static final String PROPERTY_WEBSOCKET_TOPIC = "websocketTopic";
    private static final String DEFAULT_WEBSOCKET_TOPIC = "";

    private static final String PROPERTY_FLOWAPI_TOPIC = "flowapi_topic";
    private static final String DEFAULT_FLOWAPI_TOPIC = "";

    private static final String PROPERTY_VARIANT = "variant";
    private static final String DEFAULT_VARIANT = "lineChart";

    public static final String DEFAULT_FLOWAPI_TEMPLATE = "/apps/typerefinery/components/widgets/chart/templates/chart.json";
    public static final String DEFAULT_FLOWAPI_SAMPLEDATA = "/apps/typerefinery/components/widgets/chart/templates/flowsample.json";

    @Getter
    @Inject
    @Named(PROPERTY_TITLE)
    @Nullable
    public String title;

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


    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();
        if (StringUtils.isBlank(title)) {
            this.title = DEFAULT_TITLE;
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
        if (StringUtils.isBlank(this.websocketTopic)) {
            this.websocketTopic = this.flowapi_topic;
        }

        // default values to be saved to resource if any are missing
        HashMap<String, Object> props = new HashMap<String, Object>() {
            {
            }
        };

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
