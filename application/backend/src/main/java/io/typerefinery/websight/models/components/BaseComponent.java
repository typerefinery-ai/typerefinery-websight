package io.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.jetbrains.annotations.Nullable;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import io.typerefinery.websight.models.components.layout.Grid;
import io.typerefinery.websight.models.components.layout.Styled;
import io.typerefinery.websight.utils.GridDisplayType;
import io.typerefinery.websight.utils.GridStyle;
import io.typerefinery.websight.utils.PageUtil;
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
public class BaseComponent extends BaseModel {

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
    @Getter
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

    public String resourcePath; // full path of the component
    public String currentPagePath; // path of the page the component is on

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public Resource currentPage; // resource of the page the component is on

    protected DefaultStyledComponent style;

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
            .toArray(new String[]{});
        }

        // get common properties
        if (resource != null) {
            this.resourcePath = resource.getPath();
            this.currentPagePath = PageUtil.getResourcePagePath(resource);
            this.currentPage = resourceResolver.getResource(currentPagePath);
        }

        // add default class name as first class
        String resourceSuperType = resource.getResourceType();
        String componentName = resourceSuperType.substring(resourceSuperType.lastIndexOf('/') + 1);
        // componentClasses.add(componentName); 
        style.addClasses(componentName);
    }
}
