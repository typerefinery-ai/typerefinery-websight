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
    
    
    public static final String PROPERTY_LABEL_BUTTON_OK = "labelButtonOk";
    public static final String PROPERTY_LABEL_BUTTON_CANCEL = "labelButtonCancel";
    public static final String PROPERTY_LABEL_STATUS_LOADING = "labelLoading";
    public static final String PROPERTY_LABEL_STATUS_SUBMITTING = "labelSubmitting";
    public static final String PROPERTY_LABEL_STATUS_SUBMITTED = "labelSubmitted";
    public static final String PROPERTY_LABEL_STATUS_ERROR = "labelError";
    public static final String PROPERTY_LABEL_RETRY = "labelRetry";
    public static final String PROPERTY_LABEL_MAXIMISE = "labelMaximise";
    public static final String PROPERTY_LABEL_MINIMISE = "labelMinimise";
    
    @Getter
    @Inject
    @Named(PROPERTY_LABEL_BUTTON_OK)
    @Nullable
    public String labelButtonOk;


    @Getter
    @Inject
    @Named(PROPERTY_LABEL_BUTTON_CANCEL)
    @Nullable
    public String labelButtonCancel;

    
    @Getter
    @Inject
    @Named(PROPERTY_LABEL_STATUS_LOADING)
    @Nullable
    public String labelStatusLoading;
    
    @Getter
    @Inject
    @Named(PROPERTY_LABEL_STATUS_SUBMITTING)
    @Nullable
    public String labelStatusSubmitting;

    @Getter
    @Inject
    @Named(PROPERTY_LABEL_STATUS_SUBMITTED)
    @Nullable
    public String labelStatusSubmitted;

    @Getter
    @Inject
    @Named(PROPERTY_LABEL_STATUS_ERROR)
    @Nullable
    public String labelStatusError;

    @Getter
    @Inject
    @Named(PROPERTY_LABEL_RETRY)
    @Nullable
    public String labelRetry;

    @Getter
    @Inject
    @Named(PROPERTY_LABEL_MAXIMISE)
    @Nullable
    public String labelMaximise;
    
    @Getter
    @Inject
    @Named(PROPERTY_LABEL_MINIMISE)
    @Nullable
    public String labelMinimise;

    @Getter
    @Inject
    @Nullable
    public Boolean hideFooter;

    @Getter
    @Inject
    @Nullable
    public Boolean backdropIsStatic;

    @Getter
    @Inject
    @Nullable
    public Boolean keyboardIsEnabled;

    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (StringUtils.isBlank(this.labelButtonOk)) {
            this.labelButtonOk = "Save";
        }

        if (StringUtils.isBlank(this.labelButtonCancel)) {
            this.labelButtonCancel = "Cancel";
        }

        if (StringUtils.isBlank(this.labelStatusLoading)) {
            this.labelStatusLoading = "Loading...";
        }

        if (StringUtils.isBlank(this.labelStatusSubmitting)) {
            this.labelStatusSubmitting = "Submitting...";
        }

        if (StringUtils.isBlank(this.labelStatusSubmitted)) {
            this.labelStatusSubmitted = "Submitted";
        }

        if (StringUtils.isBlank(this.labelStatusError)) {
            this.labelStatusError = "Error";
        }

        if (StringUtils.isBlank(this.labelRetry)) {
            this.labelRetry = "Retry";
        }

        if (StringUtils.isBlank(this.labelMaximise)) {
            this.labelMaximise = "Maximise";
        }

        if (StringUtils.isBlank(this.labelMinimise)) {
            this.labelMinimise = "Minimise";
        }

    }
}
