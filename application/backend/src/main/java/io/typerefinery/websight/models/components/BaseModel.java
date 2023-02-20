package io.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import org.jetbrains.annotations.Nullable;
import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.typerefinery.websight.utils.JsonUtil;
import lombok.Getter;
import pl.ds.websight.pages.core.api.Page;

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
    protected Resource resource;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @SlingObject
    protected ResourceResolver resourceResolver;

    @Inject
    @Getter
    @Named(PROPERTY_ID)
    @Nullable
    public String id;

    public String path;

    @PostConstruct
    protected void init() {
        if (StringUtils.isBlank(this.id)) {
            this.id = resource.getName();
        }

        if (resource != null) {
            this.path = resource.getPath();
        }

    }

    @JsonIgnore
    public String getJsonString() {
        return JsonUtil.getJsonString(this);
    }

}
