package io.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/widgets/ticker" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true") })
public class Ticker extends BaseComponent {

    private static final Logger LOG = LoggerFactory.getLogger(Ticker.class);

    private static final String DEFAULT_ID = "ticker";
    private static final String DEFAULT_CLASS_NAMES = "ticker";
    private static final String DEFAULT_MODULE = "tickerComponent";
    
    @PostConstruct
    protected void init() {
        this.id = DEFAULT_ID;
        this.classNames = DEFAULT_CLASS_NAMES;
        this.module = DEFAULT_MODULE;
        super.init();
     }
    
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
    public String badge;

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
    // @Default (values = "http://localhost:8080/apps/typerefinery/components/widgets/ticker/dataSource_1.json")
    public String dataSource;

    @Getter
    @Inject
    @Default (values = "ws://localhost:8112/$tms")
    public String websocketHost;

    @Getter
    @Inject
    // @Default (values = "")
    public String websocketTopic;

    //  @Getter
    // @Inject
    // // @Default (values = "")
    // public String defaultWebsocketHost;

    
    @Getter
    @Inject
    @Default (values = "5")
    public String dataSourceRefreshTime;

    @Getter
    @Inject
    @Default (values = "")
    public String configSourceURL;

}
