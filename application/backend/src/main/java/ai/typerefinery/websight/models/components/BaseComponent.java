package ai.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.jetbrains.annotations.Nullable;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.Default;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import ai.typerefinery.websight.models.components.BaseComponent;
import ai.typerefinery.websight.utils.Styled;
import ai.typerefinery.websight.utils.Grid;
import ai.typerefinery.websight.utils.PageUtil;
import lombok.Getter;

import lombok.experimental.Delegate;

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
public class BaseComponent extends BaseModel implements Styled, Grid {

    public static final String PROPERTY_MODULE = "module";
    public static final String PROPERTY_DECORATION_TAG_NAME = "decorationTagName";
    public static final String PROPERTY_VARIANT = "variant";
    public static final String PROPERTY_TITLE = "title";
    public static final String PROPERTY_TITLE_TAG_NAME = "titleTagName";
    public static final String PROPERTY_DESCRIPTION = "description";

    public static final String DEFAULT_DECORATION_TAG_NAME = "div";
    public static final String DEFAULT_VARIANT_TEMPLATE_NAME = "variant";

    @Inject
    @Getter
    @Named(PROPERTY_TITLE)
    @Nullable
    public String title;

    @Inject
    @Getter
    @Named(PROPERTY_TITLE_TAG_NAME)
    @Nullable
    public String titleTagName;

    @Inject
    @Getter
    @Named(PROPERTY_DESCRIPTION)
    @Nullable
    public String description;

    @Inject
    @Named(PROPERTY_DECORATION_TAG_NAME)
    @Nullable
    public String decorationTagName;

    @Inject
    @Getter
    @Named(PROPERTY_VARIANT)
    @Nullable
    public String variant;

    @Inject
    @Getter
    @Named(PROPERTY_MODULE)
    @Nullable
    public String module;

    // bootstrap padding for the containers.
    @Inject
    @Getter
    @Default(values = "")
    private Boolean paddingEnabled;

    @Inject
    @Getter
    @Default(values = "")
    private String paddingGeneral;

    @Inject
    @Getter
    @Default(values = "")
    private String paddingTop;

    @Inject
    @Getter
    @Default(values = "")
    private String paddingBottom;

    @Inject
    @Getter
    @Default(values = "")
    private String paddingLeft;

    @Inject
    @Getter
    @Default(values = "")
    private String paddingRight;

    // bootstrap margin for the containers.
    @Inject
    @Getter
    @Default(values = "")
    private Boolean marginEnabled;

    @Inject
    @Getter
    @Default(values = "")
    private String marginGeneral;

    @Inject
    @Getter
    @Default(values = "")
    private String marginTop;

    @Inject
    @Getter
    @Default(values = "")
    private String marginBottom;

    @Inject
    @Getter
    @Default(values = "")
    private String marginLeft;

    @Inject
    @Getter
    @Default(values = "")
    private String marginRight;

    
    @Inject
    @Getter
    public Boolean persistColorWhenThemeSwitches;

    public String resourcePath; // full path of the component
    public String currentPagePath; // path of the page the component is on


    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public Resource currentPage; // resource of the page the component is on

    @Self
    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    protected DefaultStyledComponent style;

    @Self
    @Delegate
    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    protected DefaultStyledGridComponent grid;

    protected String[] componentClasses;

    public DefaultStyledComponent getStyle() {
        return style;
    }

    public DefaultStyledGridComponent getGrid() {
        return grid;
    }

    public String[] getClasses() {
        // collect all authorable classes
        if (style != null) {
            componentClasses = Arrays.stream(style.getClasses())
                .collect(Collectors.toCollection(LinkedHashSet::new))
                .toArray(new String[] {});
        }
        return componentClasses;
    }

    public String getVariantClassNames() {
        // this will used for variant
        return StringUtils.join(getClasses(), " ");
    }

    public String getComponentClassNames() {
        if (grid != null) {
            return StringUtils.join(grid.getClasses(), " ");
        }
        return "";
    }

    private Map<String, String> paddingGeneralConfig = new HashMap<String, String>() {
        {
            put("zero", "p-0");
            put("one", "p-1");
            put("two", "p-2");
            put("three", "p-3");
            put("four", "p-4");
            put("five", "p-5");
        }
    };

    private Map<String, String> paddingTopConfig = new HashMap<String, String>() {
        {
            put("zero", "pt-0");
            put("one", "pt-1");
            put("two", "pt-2");
            put("three", "pt-3");
            put("four", "pt-4");
            put("five", "pt-5");
        }
    };

    private Map<String, String> paddingBottomConfig = new HashMap<String, String>() {
        {
            put("zero", "pb-0");
            put("one", "pb-1");
            put("two", "pb-2");
            put("three", "pb-3");
            put("four", "pb-4");
            put("five", "pb-5");
        }
    };

    private Map<String, String> paddingRightConfig = new HashMap<String, String>() {
        {
            put("zero", "pe-0");
            put("one", "pe-1");
            put("two", "pe-2");
            put("three", "pe-3");
            put("four", "pe-4");
            put("five", "pe-5");
        }
    };

    private Map<String, String> paddingLeftConfig = new HashMap<String, String>() {
        {
            put("zero", "ps-0");
            put("one", "ps-1");
            put("two", "ps-2");
            put("three", "ps-3");
            put("four", "ps-4");
            put("five", "ps-5");
        }
    };


    private Map<String, String> marginGeneralConfig = new HashMap<String, String>() {
        {
            put("zero", "m-0");
            put("one", "m-1");
            put("two", "m-2");
            put("three", "m-3");
            put("four", "m-4");
            put("five", "m-5");
        }
    };

    private Map<String, String> marginTopConfig = new HashMap<String, String>() {
        {
            put("zero", "mt-0");
            put("one", "mt-1");
            put("two", "mt-2");
            put("three", "mt-3");
            put("four", "mt-4");
            put("five", "mt-5");
        }
    };

    private Map<String, String> marginBottomConfig = new HashMap<String, String>() {
        {
            put("zero", "mb-0");
            put("one", "mb-1");
            put("two", "mb-2");
            put("three", "mb-3");
            put("four", "mb-4");
            put("five", "mb-5");
        }
    };

    private Map<String, String> marginLeftConfig = new HashMap<String, String>() {
        {
            put("zero", "ms-0");
            put("one", "ms-1");
            put("two", "ms-2");
            put("three", "ms-3");
            put("four", "ms-4");
            put("five", "ms-5");
        }
    };

    private Map<String, String> marginRightConfig = new HashMap<String, String>() {
        {
            put("zero", "me-0");
            put("one", "me-1");
            put("two", "me-2");
            put("three", "me-3");
            put("four", "me-4");
            put("five", "me-5");
        }
    };



    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (StringUtils.isBlank(decorationTagName)) {
            decorationTagName = DEFAULT_DECORATION_TAG_NAME;
        }

        style = resource.adaptTo(DefaultStyledComponent.class);
        grid = resource.adaptTo(DefaultStyledGridComponent.class);

        if (grid != null && style != null) {
            componentClasses = Arrays.stream(style.getClasses())
                .collect(Collectors.toCollection(LinkedHashSet::new))
                .toArray(new String[] {});
                
            grid.addClasses(getAllGridClasses());
        }

        //bootstrap margin styling
        if (BooleanUtils.isTrue(marginEnabled)) {   

            if (StringUtils.isNotBlank(marginGeneral)) {
                grid.addClasses(marginGeneralConfig.getOrDefault(marginGeneral, ""));
            }
            if (StringUtils.isNotBlank(marginTop)) {
                grid.addClasses(marginTopConfig.getOrDefault(marginTop, ""));
            } 
            if (StringUtils.isNotBlank(marginBottom)) {
                grid.addClasses(marginBottomConfig.getOrDefault(marginBottom, ""));
            } 
            if (StringUtils.isNotBlank(marginLeft)) {
                grid.addClasses(marginLeftConfig.getOrDefault(marginLeft, ""));
            } 
            if (StringUtils.isNotBlank(marginRight)) {
                grid.addClasses(marginRightConfig.getOrDefault(marginRight, ""));
            } 

            componentClasses = Arrays.stream(style.getClasses())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }

        //bootstrap margin styling
        if (BooleanUtils.isTrue(paddingEnabled)) {   

            if (StringUtils.isNotBlank(paddingGeneral)) {
                grid.addClasses(paddingGeneralConfig.getOrDefault(paddingGeneral, ""));
            }
            if (StringUtils.isNotBlank(paddingTop)) {
                grid.addClasses(paddingTopConfig.getOrDefault(paddingTop, ""));
            } 
            if (StringUtils.isNotBlank(paddingBottom)) {
                grid.addClasses(paddingBottomConfig.getOrDefault(paddingBottom, ""));
            } 
            if (StringUtils.isNotBlank(paddingLeft)) {
                grid.addClasses(paddingLeftConfig.getOrDefault(paddingLeft, ""));
            } 
            if (StringUtils.isNotBlank(paddingRight)) {
                grid.addClasses(paddingRightConfig.getOrDefault(paddingRight, ""));
            } 

            componentClasses = Arrays.stream(style.getClasses())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[]{});
        }

        // get common properties
        if (resource != null) {
            this.resourcePath = resource.getPath();
            this.currentPagePath = PageUtil.getResourcePagePath(resource);
            this.currentPage = resourceResolver.getResource(currentPagePath);
        }

        // add default class name as first class
        // String resourceSuperType = resource.getResourceType();
        // String componentName =
        // resourceSuperType.substring(resourceSuperType.lastIndexOf('/') + 1);
        // componentClasses.add(componentName);
        // style.addClasses(componentName);
    }
}