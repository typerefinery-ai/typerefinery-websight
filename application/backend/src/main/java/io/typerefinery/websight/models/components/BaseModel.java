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

import lombok.Getter;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = { @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true") })
public class BaseModel {

    @SlingObject
    protected Resource resource;

    @SlingObject
    protected ResourceResolver resourceResolver;

    @Getter
    @Inject
    @Default(values = "")
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