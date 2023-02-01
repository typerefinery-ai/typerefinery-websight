package io.typerefinery.websight.models.components.workflow;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.io.InputStream;
import javax.annotation.PostConstruct;
import javax.inject.Inject;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.RequestAttribute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import io.typerefinery.websight.models.components.BaseModel;
import lombok.Getter;

@Model(adaptables = {Resource.class, SlingHttpServletRequest.class}, defaultInjectionStrategy = OPTIONAL)
public class Flow extends BaseModel {
    
    private static final Logger LOG = LoggerFactory.getLogger(Flow.class);

    // private String TEMPLATE_JSON_COMPONENT_PATH = "/apps/typerefinery/components/workflow/flow/template/component.json";
    // private String TEMPLATE_JSON_DASHBOARD_PATH = "/apps/typerefinery/components/workflow/flow/template/dashboard.json";
    
    @Getter
    @Inject
    @Default(values = "false")
    public String flowstreamenable;

    @Getter
    @Inject
    @Default(values = "")
    public String flowstreamid;

    @RequestAttribute(name = "template")
    private String template;

    @Override
    @PostConstruct
    protected void init() {
        LOG.info("init template: {}", template);
        //quick fail
        if (StringUtils.isBlank(template)) {
            return;
        }

        super.init();
        JsonNode componentTemplate = getTemplateTree(template);
        String test = getJsonString(componentTemplate);

        //chnage first node name in componentTemplate
        // componentTemplate.put("test", componentTemplate.remove("component"));

        // JsonNode dashboardTemplate = getTemplateTree(TEMPLATE_JSON_DASHBOARD_PATH);
        // String test2 = getJsonString(dashboardTemplate);
    }

    //read the json file from a template and convert it to JSON Tree
    @SuppressWarnings("unchecked")
    public JsonNode getTemplateTree(String templatePath) {
        // TreeMap<String, Object> templateComponentJson = new TreeMap<String, Object>();
        try {
            Resource templateComponentResource = resourceResolver.getResource(templatePath);
            ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
            if (ResourceUtil.isNonExistingResource(templateComponentResource) == false) {
                InputStream inputStream = templateComponentResource.adaptTo(InputStream.class);
                // templateComponentJson = mapper.readValue(inputStream, TreeMap.class);
                return mapper.readTree(inputStream);
                // jsonNode.get("fxqxw001ey41d")
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null;
    }

    

}
