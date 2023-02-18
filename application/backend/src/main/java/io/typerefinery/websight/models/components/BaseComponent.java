package io.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import io.typerefinery.websight.models.components.layout.Grid;
import io.typerefinery.websight.models.components.layout.Styled;
import io.typerefinery.websight.utils.PageUtil;
import lombok.Getter;
import lombok.experimental.Delegate;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true") })
public class BaseComponent extends BaseModel implements Styled, Grid {

    @Getter
    @Inject
    @Default(values = "")
    public String module;

    public String resourcePath; // full path of the component
    public String currentPagePath; // path of the page the component is on

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public Resource currentPage; // resource of the page the component is on

    @Self
    protected DefaultStyledComponent style;

    @Self
    @Delegate
    protected DefaultStyledGridComponent grid;

    public DefaultStyledComponent getStyle() {
        return style;
    }

    public DefaultStyledGridComponent getGrid() {
        return grid;
    }

    protected String[] componentClasses;

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

    private Map<String, String> gridConfig = new HashMap<String, String>() {
        {
            put("lgColSize", "col-lg-");
            put("mdColSize", "col-md-");
            put("smColSize", "col-sm-");
        }
    };


    @Override
    @PostConstruct
    protected void init() {
        super.init();

        style = resource.adaptTo(DefaultStyledComponent.class);
        grid = resource.adaptTo(DefaultStyledGridComponent.class);

        if (grid != null) {
            grid.addClasses(gridConfig.get("lgColSize") + getLgColSize());
            grid.addClasses(gridConfig.get("mdColSize") + getMdColSize());
            grid.addClasses(gridConfig.get("smColSize") + getSmColSize());
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
