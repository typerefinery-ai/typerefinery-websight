package io.typerefinery.websight.models.components.widgets.security;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.jetbrains.annotations.Nullable;
import org.osgi.service.component.annotations.Component;
import io.typerefinery.websight.models.components.BaseComponent;
import io.typerefinery.websight.services.flow.FlowService;
import io.typerefinery.websight.services.flow.registry.FlowComponent;
/*
 * Stix component
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
public class Stix extends BaseComponent implements FlowComponent {
    
    public static final String RESOURCE_TYPE = "typerefinery/components/widgets/security/stix";
    private static final String DEFAULT_ID = "stix";
    private static final String DEFAULT_MODULE = "stixComponent";

    public static final String PROPERTY_MAX_COUNT = "maxCount";
    public static final String PROPERTY_DATA_URL = "dataUrl";

    @Inject
    @Getter
    @Named(PROPERTY_MAX_COUNT)
    @Nullable
    public String maxCount;

    @Getter
    @Inject
    @Named(PROPERTY_DATA_URL)
    @Nullable
    public String dataUrl;


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
    }

}
