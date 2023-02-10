package io.typerefinery.websight.models.components.widgets;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;

import io.typerefinery.websight.models.components.BaseComponent;


@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/widgets/charts" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { 
    @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false") 
})
public class Chart extends BaseComponent {
    
    private static final String DEFAULT_ID = "chart";
    private static final String DEFAULT_CLASS_NAMES = "chart";
    private static final String DEFAULT_MODULE = "chartComponent";

    @Override
    @PostConstruct
    protected void init() {
        this.id = DEFAULT_ID;
        this.module = DEFAULT_MODULE;
        super.init();
    }

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
    @Default(values = "lineChart")
    public String variant;
}
