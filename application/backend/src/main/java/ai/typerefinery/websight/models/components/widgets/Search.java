package ai.typerefinery.websight.models.components.widgets;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;


import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;
import lombok.Builder.Default;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;

import ai.typerefinery.websight.models.components.BaseComponent;


@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/widgets/editor" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { 
    @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false") 
})
public class Search extends BaseComponent {
    
    
    private static final String DEFAULT_MARGIN_CLASS = "mb-2";


    @Getter
    @Inject
    public String placeholder;


    @Getter
    @Inject
    public String name;

    // create variable for icon, componentId and componentType 
    @Getter
    @Inject
    public String icon;

    @Getter
    @Inject
    public String componentId;

    @Getter
    @Inject
    public String componentType;

    @Getter
    @Inject
    public String debounceTimer;


    @Override
    @PostConstruct
    protected void init() {
        super.init();

        grid.addClasses(DEFAULT_MARGIN_CLASS);
    }
}
