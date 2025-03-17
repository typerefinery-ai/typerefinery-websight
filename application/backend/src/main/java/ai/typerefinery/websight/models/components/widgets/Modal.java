package ai.typerefinery.websight.models.components.widgets;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.List;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;

import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.models.components.KeyValuePair;


@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/widgets/modal" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { 
    @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false") 
})
public class Modal extends BaseComponent {
    
    
    @Getter
    @Inject
    public String labelOk;


    @Getter
    @Inject
    public String labelCancel;

    
    @Getter
    @Inject
    public String labelLoading;
    
    @Getter
    @Inject
    public String labelError;

    @Getter
    @Inject
    public String labelRetry;


    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (this.labelOk == null) {
            this.labelOk = "Save";
        }

        if (this.labelCancel == null) {
            this.labelCancel = "Cancel";
        }

        if (this.labelLoading == null) {
            this.labelLoading = "Loading...";
        }

        if (this.labelError == null) {
            this.labelError = "Error";
        }

        if (this.labelRetry == null) {
            this.labelRetry = "Retry";
        }

    }
}
