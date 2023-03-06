package io.typerefinery.websight.models.components.widgets;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

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
import io.typerefinery.websight.services.flow.FlowService;
import io.typerefinery.websight.services.flow.registry.FlowComponent;

/*
 * Ticker component
 * 
 * register component as FlowComponent to be able to use it in FlowService to determine if component needs Flow Sync
 * 
 */
@Component
@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/widgets/ticker" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class Ticker extends BaseComponent implements FlowComponent {
    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/ticker";


    @Getter
    @Inject
    public List<WidgetOptionItem> keyValueList;

    @Getter
    @Inject
    public String template;

    @Getter
    @Inject
    public String dataSource;

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

    @Override
    @PostConstruct
    protected void init() {
        super.init();
        if (StringUtils.isBlank(this.websocketTopic)) {
            this.websocketTopic = this.flowapi_topic;
        }

        if(StringUtils.isBlank(this.template)) {
            this.template = "<div class='card shadow'> <div class='card-body d-flex flex-row align-items-center flex-0 border-bottom'> <div class='d-block'> <div class='h6 fw-normal text-gray mb-2'>{{title}}</div> <div class='d-flex'> <h2 class='h3 me-3'>{{value}}</h2> <div class='mt-2'> <span class='{{indicatorIcon}} text-{{indicatorType}}'></span> <span class='text-{{indicatorType}} fw-bold'>{{indicatorValue}}</span> </div> </div> </div> <div class='d-block ms-auto'> <i class='{{tickerIcon}}'></i> </div> </div> </div>";
        }

        if(this.keyValueList == null || this.keyValueList.size() == 0) {
            if(this.keyValueList == null) {
                this.keyValueList = new java.util.ArrayList<>();
            }
            this.keyValueList.add(new WidgetOptionItem("title", "Number of active users"));
            this.keyValueList.add(new WidgetOptionItem("value", "25.5k"));
            this.keyValueList.add(new WidgetOptionItem("indicatorValue", "4.54K"));
            this.keyValueList.add(new WidgetOptionItem("indicatorType", "success"));
            this.keyValueList.add(new WidgetOptionItem("tickerIcon", "fa fa-inbox"));
            this.keyValueList.add(new WidgetOptionItem("indicatorIcon", "fa fa-arrow-down"));
        }
    }
}