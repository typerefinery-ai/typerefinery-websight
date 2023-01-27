package io.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import io.typerefinery.websight.utils.PageUtil;
import lombok.Getter;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true") })
public class BaseComponent extends BaseModel{


    @Getter
    @Inject
    @Default(values = "")
    public String classNames;

    @Getter
    @Inject
    @Default(values = "")
    public String module;
    
    public String componentPath; // full path of the component
    public String currentPagePath; // path of the page the component is on
    public Resource currentPage; // resource of the page the component is on

    @Override
    @PostConstruct
    protected void init() {
        super.init();

        if (StringUtils.isBlank(this.classNames)) {
            this.classNames = PageUtil.getResourceTypeName(resource);
        }
        if (resource != null) {
            this.componentPath = resource.getPath();
            this.currentPagePath = PageUtil.getResourcePagePath(resource);
            this.currentPage = resourceResolver.getResource(currentPagePath);
        }
    }

}
