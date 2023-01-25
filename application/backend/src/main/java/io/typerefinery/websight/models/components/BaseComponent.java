package io.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import io.typerefinery.websight.utils.PageUtil;
import lombok.Getter;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true") })
public class BaseComponent {

    @SlingObject
    Resource resource;

    @SlingObject
    ResourceResolver resourceResolver;

    @Getter
    @Inject
    @Default(values = "")
    public String id;

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

    @PostConstruct
    protected void init() {
        if (StringUtils.isBlank(this.id)) {
            this.id = resource.getName();
        }
        if (StringUtils.isBlank(this.classNames)) {
            this.classNames = PageUtil.getResourceTypeName(resource);
        }
        if (resource != null) {
            this.componentPath = resource.getPath();
            this.currentPagePath = PageUtil.getResourcePagePath(resource);
            this.currentPage = resourceResolver.getResource(currentPagePath);
        }
    }


    @JsonIgnore
    public String getJsonString() {
        ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        
        JsonNode node = mapper.valueToTree(this);
        String jsonString =null;
        try {
            jsonString = mapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            e.getMessage();
        }
        return jsonString;
    }
}
