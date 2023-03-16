package io.typerefinery.websight.models.components.widgets;

import javax.inject.Inject;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.osgi.service.component.annotations.Component;

import lombok.Getter;

@Component
@Model(adaptables = Resource.class, resourceType = {
        "typerefinery/components/widgets/ticker" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false")
})
public class ActionButton {
    @Getter
    @Inject
    public String actionButtonNavigateToPath;

    @Getter
    @Inject
    public String actionButtonModalContentURL;

    @Getter
    @Inject
    public String actionTypeWhenActionButtonIsClicked;

    @Getter
    @Inject
    public String label;

    @Getter
    @Inject
    public String icon;

    
    @Getter
    @Inject
    public String background;
}
