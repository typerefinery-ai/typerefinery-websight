package io.typerefinery.websight.models.components.widgets;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.osgi.service.component.annotations.Component;
import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.models.components.KeyValuePair;
import io.typerefinery.websight.services.flow.FlowService;
import io.typerefinery.websight.services.flow.registry.FlowComponent;

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
public class Ticker extends BaseComponent implements FlowComponent {
    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/ticker";
    public static final String DEFAULT_TEMPLATE_I = "<div class='card shadow-sm bg-white rounded'> <div class='card-body d-flex flex-row align-items-center flex-0 border-bottom'> <div class='d-block'> <div class='h6 fw-normal text-gray mb-2'>{{title}}</div> <div class='d-flex'> <h2 class='h3 me-3'>{{value}}</h2> <div class='mt-2'> <span class='{{indicatorIcon}} text-{{indicatorType}}'></span> <span class='text-{{indicatorType}} fw-bold'>{{indicatorValue}}</span> </div> </div> </div> <div class='d-block ms-auto'> <i class='{{tickerIcon}}'></i> </div> </div> </div>";
    public static final String DEFAULT_TEMPLATE_II = "<div class='card shadow-sm bg-white rounded'>   <div class='card-body'>     <div class='lead'>{{title}}</div>     <h2 class='card-title'>{{value}}</h2>     <p class='small text-muted'>{{indicatorValue}}<i class='{{indicatorIcon}}'></i> {{indicatorType}}</p>   </div> </div>";
    public static final String DEFAULT_TEMPLATE_III = "<div class='card shadow-sm bg-white rounded'>   <div class='card-body'>     <i class='{{widgetIcon}} fa-2x p-1 bg-{{indicatorType}}'></i>     <div class='mt-2 lead'>{{title}}</div>     <h2 class='card-title' style='font-size:1.8em;'>{{value}}</h2>     <p class='small text-muted'>{{indicatorValue}},  <i class='glyphicon glyphicon-globe'></i> Worldwide</p>     <p class='text-{{indicatorType}}'>       <i class='{{indicatorIcon}}'></i> {{value}}      <span style='font-size: 0.9em' class='ml-2 text-muted'>{{indicatorPrecisionValue}}</span>     </p>   </div> </div>";
    public static final String CUSTOM_TEMPLATE = "custom";

    @Getter
    @Inject
    public List<KeyValuePair> keyValueList;

    
    @Getter
    @Inject
    public List<WidgetOptionItem> test;

    @Getter
    @Inject
    public String templateString;

    
    @Getter
    @Inject
    public String hello;

    @Getter
    @Inject
    public String dataSource;

    @Getter
    @Inject
    public String templateSelected;

    @Getter
    @Inject
    @Default(values = "ws://localhost:8112/$tms")
    public String websocketHost;

    @Getter
    @Inject
    public String websocketTopic;

    @Getter
    @Inject
    @Default(values = "")
    public String flowapi_topic;

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

    public Map<String, String> templateList = new HashMap<String, String>() {
        {
            put("1", DEFAULT_TEMPLATE_I);
            put("2", DEFAULT_TEMPLATE_II);
            put("3", DEFAULT_TEMPLATE_III);
        }
    };

    @Override
    @PostConstruct
    protected void init() {
        super.init();
        if (StringUtils.isBlank(this.websocketTopic)) {
            this.websocketTopic = this.flowapi_topic;
        }

        if (StringUtils.isNotBlank(templateSelected)) {
            this.templateString = this.templateList.getOrDefault(templateSelected, this.templateString);
        }


        if (this.keyValueList == null || this.keyValueList.size() == 0) {
            this.keyValueList = List.of(
                    new WidgetOptionItem("title", "Number of active users"),
                    new WidgetOptionItem("value", "25.5k"),
                    new WidgetOptionItem("indicatorValue", "4.54K"),
                    new WidgetOptionItem("indicatorType", "success"),
                    new WidgetOptionItem("tickerIcon", "glyphicon glyphicon-signal "),
                    new WidgetOptionItem("indicatorIcon", "glyphicon glyphicon-circle-arrow-up"),
                    new WidgetOptionItem("widgetIcon", "glyphicon glyphicon-signal text-light"),
                    new WidgetOptionItem("indicatorPrecisionValue", "Since last quarter"));
        }
    }
}