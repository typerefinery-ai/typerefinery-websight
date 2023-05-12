package ai.typerefinery.websight.models.components.widgets.map;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.models.annotations.Default;
import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;
import javax.inject.Named;

import java.util.HashMap;
import org.jetbrains.annotations.Nullable;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.osgi.service.component.annotations.Component;
import ai.typerefinery.websight.utils.PageUtil;
import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.models.components.FlowComponent;
import ai.typerefinery.websight.models.components.widgets.map.MarkerList;
import ai.typerefinery.websight.services.flow.registry.FlowComponentRegister;
import ai.typerefinery.websight.services.flow.FlowService;



@Component
@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/widgets/map" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { 
    @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false") 
})
public class Map extends FlowComponent implements FlowComponentRegister {

    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/map";
    private static final String PROPERTY_LATITUDE = "mapLat";
    private static final String DEFAULT_LATITUDE = "46.76336";
    
    private static final String PROPERTY_LONGITUDE = "mapLng";
    private static final String DEFAULT_LONGITUDE = "-71.32453";

    private static final String PROPERTY_ZOOM = "zoomLevel";
    private static final String DEFAULT_ZOOM = "16";

    private static final String PROPERTY_TILE_TEMPLATE = "tileTemplate";
    private static final String DEFAULT_TILE_TEMPLATE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    private static final String PROPERTY_LAYER_ZOOM = "layerZoom";
    private static final String DEFAULT_LAYER_ZOOM = "15";

    private static final String PROPERTY_COPYRIGHT_URL = "copyRightUrl";
    private static final String DEFAULT_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";

    private static final String PROPERTY_DATASOURCE = "dataSource";
    private static final String DEFAULT_DATASOURCE = "";

    private static final String PROPERTY_WEBSOCKET_HOST = "websocketHost";
    private static final String DEFAULT_WEBSOCKET_HOST = "ws://localhost:8112/$tms";

    private static final String PROPERTY_WEBSOCKET_TOPIC = "websocketTopic";
    private static final String DEFAULT_WEBSOCKET_TOPIC = "";

    private static final String PROPERTY_FLOWAPI_TOPIC = "flowapi_topic";
    private static final String DEFAULT_FLOWAPI_TOPIC = "";

    public static final String DEFAULT_FLOWAPI_TEMPLATE = "/apps/typerefinery/components/widgets/map/templates/map.json";
    public static final String DEFAULT_FLOWAPI_SAMPLEDATA = "/apps/typerefinery/components/widgets/map/templates/flowsample.json";

    @SlingObject
    private ResourceResolver resourceResolver;

    @Getter
    @Inject
    @Named(PROPERTY_LATITUDE)
    public String mapLat;


    @Getter
    @Inject
    @Named(PROPERTY_LONGITUDE)
    public String mapLng;

    @Getter
    @Inject
    @Named(PROPERTY_ZOOM)
    public String zoomLevel;

    @Getter
    @Inject
    @Named(PROPERTY_TILE_TEMPLATE)
    public String tileTemplate;

    @Getter
    @Inject
    @Named(PROPERTY_LAYER_ZOOM)
    public String layerZoom;

    @Getter
    @Inject
    @Named(PROPERTY_COPYRIGHT_URL)
    public String copyRightUrl;

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

    @Inject
    @Getter
    private List<MarkerList> markerList;

    @Override
    @PostConstruct
    protected void init() {
        super.init();
        if (StringUtils.isBlank(mapLat)) {
            this.mapLat = DEFAULT_LATITUDE;
        }
        if (StringUtils.isBlank(mapLng)) {
            this.mapLng = DEFAULT_LONGITUDE;
        } 
        if (StringUtils.isBlank(zoomLevel)) {
            this.zoomLevel = DEFAULT_ZOOM;
        } 
         if (StringUtils.isBlank(tileTemplate)) {
            this.tileTemplate = DEFAULT_TILE_TEMPLATE;
        } 
         if (StringUtils.isBlank(layerZoom)) {
            this.layerZoom = DEFAULT_LAYER_ZOOM;
        } 
         if (StringUtils.isBlank(copyRightUrl)) {
            this.copyRightUrl = DEFAULT_COPYRIGHT_URL;
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
