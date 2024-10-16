package ai.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;

import lombok.Getter;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.jetbrains.annotations.Nullable;

@Model(
    adaptables = {
        Resource.class,
        SlingHttpServletRequest.class
    },
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(
    name = "jackson",
    extensions = "json",
    options = {
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
    }
)
public class BaseFormComponent extends BaseComponent {

    public static final String PROPERTY_NAME = "name";
    public static final String PROPERTY_LABEL = "label";
    public static final String PROPERTY_TITLE = "title";
    public static final String PROPERTY_VALUE = "value";
    public static final String PROPERTY_PLACEHOLDER = "placeholder";

    @Self
    protected SlingHttpServletRequest request;

    @Inject
    @Getter
    @Named(PROPERTY_NAME)
    @Nullable
    protected String name;

    @Inject
    @Getter
    @Named(PROPERTY_LABEL)
    @Nullable
    protected String label;

    @Inject
    @Getter
    @Named(PROPERTY_TITLE)
    @Nullable
    protected String title;
    
    @Inject
    @Getter
    @Named(PROPERTY_VALUE)
    @Nullable
    protected String value;
    
    @Inject
    @Getter
    @Named(PROPERTY_PLACEHOLDER)
    @Nullable
    protected String placeholder;

    @Inject
    @Getter
    @Default(booleanValues = false)
    protected Boolean disabled;

    @Getter
    protected String parentFieldId;


    @Override
    @PostConstruct
    protected void init() {

        super.init();

        // set default parent field id
        this.parentFieldId = this.id;

        // check if selectors are present
        if (request != null && request.getRequestPathInfo() != null) {
            String selectors = request.getRequestPathInfo().getSelectorString();
            if (StringUtils.isNotBlank(selectors)) {
                String[] selectorArray = StringUtils.split(selectors, ".");
                if (selectorArray.length >= 2) {
                    // check if id is present and update component id
                    if (ArrayUtils.contains(selectorArray, "id")) { //overide id 
                        int valueIndex = ArrayUtils.indexOf(selectorArray, "id")+1;
                        if (valueIndex < selectorArray.length) {
                            String value = selectorArray[valueIndex];
                            if (StringUtils.isNotBlank(value)) {
                                if (value.endsWith(this.id)) {
                                    this.id = value;
                                } else {
                                    this.id = value + "-" + this.id;                            
                                }
                            }
                        }
                    } 
                    if (ArrayUtils.contains(selectorArray, "fid")) { //parent field id
                        int valueIndex = ArrayUtils.indexOf(selectorArray, "fid")+1;
                        if (valueIndex < selectorArray.length) {
                            String value = selectorArray[valueIndex];
                            if (StringUtils.isNotBlank(value)) {
                                this.parentFieldId = value;
                            }
                        }
                    }
                }
            }
        }

        if (StringUtils.isBlank(this.name)) {
            this.name = resource.getName();
        }

    }

    
}
