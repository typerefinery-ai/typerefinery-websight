package ai.typerefinery.websight.models.components.graphs;


import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import ai.typerefinery.websight.models.components.BaseComponent;


@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/graphs/linechart" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true") })
public class LineChart extends BaseComponent {
    @SlingObject
    private ResourceResolver resourceResolver;
    
    
    private static final String DEFAULT_ID = "linechart";
    private static final String DEFAULT_MODULE = "linechartComponent";
    
    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();
    }
    
    
    @Getter
    @Inject
    public String dataSource;
    
    @Getter
    @Inject
    public String websocketHost;

    @Getter
    @Inject
    public String websocketTopic;

    @Getter
    @Inject
    @Default (values = "lineChartWithoutlabel")
    public String chartVariant;
}
