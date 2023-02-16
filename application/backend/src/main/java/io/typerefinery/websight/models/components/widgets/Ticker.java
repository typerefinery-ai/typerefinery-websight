package io.typerefinery.websight.models.components.widgets;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;
		
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;

import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.services.flow.FlowService;
import io.typerefinery.websight.services.flow.registry.FlowComponent;


@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/widgets/ticker" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { 
    @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false") 
})
public class Ticker extends BaseComponent  implements FlowComponent {
    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/ticker";
    
    private static final String DEFAULT_ID = "ticker";
    private static final String DEFAULT_CLASS_NAMES = "ticker";
    private static final String DEFAULT_MODULE = "tickerComponent";
     
    @Getter
    @Inject
    @Default(values = "Sample Card")
    public String title;

    @Getter
    @Inject
    @Default(values = "12.5k")
    public String value;


    @Getter
    @Inject
    @Default(values = "pi pi-database")
    public String icon;

    @Getter
    @Inject
    @Default (values = "pi pi-arrow-up")
    public String indicatorType;


    @Getter
    @Inject
    @Default (values = "12.k")
    public String indicatorValue;


    @Getter
    @Inject
    @Default(values = "")
    public String indicatorValuePrecision;

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
    @Default(values = "primaryTicker")
    public String variant;

    @Getter
    @Inject
    // @Default (values = "")
    public String backGroundClass;

    @Getter	
    @Inject	
    @Default(values = "")	
    public String flowapi_topic;

    @Inject
    @Getter
    @Default(values = "col")
    private String sizeType;

    @Inject
    @Getter
    @Default(values = "")
    private String marginValue;

    @Inject
    @Getter
    @Default(values = "")
    private String alignmentHorizontal;

    @Inject
    @Getter
    @Default(values = "")
    private String alignmentVirtical;

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
        this.id = DEFAULT_ID;
        this.module = DEFAULT_MODULE;
        super.init();
        if (grid != null && style != null) {
            grid.addClasses(sizeType);
            grid.addClasses(marginValue);
        }

        if (StringUtils.isBlank(this.websocketTopic)) {
            this.websocketTopic = this.flowapi_topic;
        }
     }
}