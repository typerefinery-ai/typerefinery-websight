package ai.typerefinery.websight.models.components.widgets;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.List;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import javax.validation.constraints.Null;

import lombok.Getter;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.jetbrains.annotations.Nullable;

import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.models.components.KeyValuePair;
import ai.typerefinery.websight.utils.StringsUtils;


@Model(adaptables = Resource.class, resourceType = { "typerefinery/components/widgets/modal" }, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { 
    @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true"),
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "false") 
})
public class Modal extends BaseComponent {
    
    
    public static final String PROPERTY_LABEL_OK = "labelOk";
    public static final String PROPERTY_LABEL_CANCEL = "labelCancel";
    public static final String PROPERTY_LABEL_LOADING = "labelLoading";
    public static final String PROPERTY_LABEL_ERROR = "labelError";
    public static final String PROPERTY_LABEL_RETRY = "labelRetry";
    
    @Getter
    @Inject
    @Named(PROPERTY_LABEL_OK)
    @Nullable
    public String labelOk;


    @Getter
    @Inject
    @Named(PROPERTY_LABEL_CANCEL)
    @Nullable
    public String labelCancel;

    
    @Getter
    @Inject
    @Named(PROPERTY_LABEL_LOADING)
    @Nullable
    public String labelLoading;
    
    @Getter
    @Inject
    @Named(PROPERTY_LABEL_ERROR)
    @Nullable
    public String labelError;

    @Getter
    @Inject
    @Named(PROPERTY_LABEL_RETRY)
    @Nullable
    public String labelRetry;


    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (StringUtils.isBlank(this.labelOk)) {
            this.labelOk = "Save";
        }

        if (StringUtils.isBlank(this.labelCancel)) {
            this.labelCancel = "Cancel";
        }

        if (StringUtils.isBlank(this.labelLoading)) {
            this.labelLoading = "Loading...";
        }

        if (StringUtils.isBlank(this.labelError)) {
            this.labelError = "Error";
        }

        if (StringUtils.isBlank(this.labelRetry)) {
            this.labelRetry = "Retry";
        }

    }
}
