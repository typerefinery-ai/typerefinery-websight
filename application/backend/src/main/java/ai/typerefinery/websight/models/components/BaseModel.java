package ai.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import org.jetbrains.annotations.Nullable;
import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.vault.util.JcrConstants;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import ai.typerefinery.websight.utils.ComponentUtil;
import ai.typerefinery.websight.utils.JsonUtil;
import ai.typerefinery.websight.utils.PageUtil;
import lombok.Getter;

@Model(
    adaptables = SlingHttpServletRequest.class,
    defaultInjectionStrategy = OPTIONAL
)
@Exporter(
    name = "jackson",
    extensions = "json",
    options = { 
        @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true") 
    }
)
public class BaseModel {

    public static final String PROPERTY_ID = "id";

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @SlingObject
    public Resource resource;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @SlingObject
    public ResourceResolver resourceResolver;

    @Inject
    @Getter
    @Named(PROPERTY_ID)
    @Nullable
    public String id;

    @Getter
    public String path;

    @Getter
    public String componentPath;

    @Getter
    public String componentName;
    
    @Getter
    public String componentTitle;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Inject
    public static SlingHttpServletRequest request;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Inject
    public SlingHttpServletResponse response;

    @PostConstruct
    protected void init() {

        this.componentName = PageUtil.getResourceTypeName(resource);
        this.componentTitle = StringUtils.capitalize(this.componentName);

        if (StringUtils.isBlank(this.id)) {
            //TODO: generate a unique id
            this.id = ComponentUtil.getComponentId(resource);
        }

        if (resource != null) {
            this.path = resource.getPath();
            // set component path to the path of the resource after the jcr:content
            this.componentPath = PageUtil.getResourcePagePath(resource);
        }

    }

    @JsonIgnore
    public String getJsonString() {
        return JsonUtil.getJsonString(this);
    }

}
