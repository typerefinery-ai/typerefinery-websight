package io.typerefinery.websight.models.components.workflow;


import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.io.InputStream;
import java.util.Date;
import java.util.HashMap;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.ModifiableValueMap;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.RequestAttribute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.typerefinery.websight.models.components.BaseModel;
import io.typerefinery.websight.services.workflow.FlowService;
import io.typerefinery.websight.utils.PageUtil;
import io.typerefinery.websight.utils.DateUtil;
import lombok.Getter;

import static io.typerefinery.websight.services.workflow.FlowService.prop;

@Model(adaptables = {Resource.class, SlingHttpServletRequest.class}, defaultInjectionStrategy = OPTIONAL)
public class Flow extends BaseModel {
    
    private static final Logger LOG = LoggerFactory.getLogger(Flow.class);

    // read properties from resource

    // if true will create/update flow
    @Getter
    @Inject
    @Default(values = "false")
    public Boolean flowapi_enable;

    // if blank will create new flow, if not blank will be used to update existing flow
    @Getter
    @Inject
    @Default(values = "")
    public String flowapi_flowstreamid;

    // will be used to test if update of flow should happen
    @Getter
    @Inject
    @Default(values = "")
    public String flowapi_title;

    // authored title and will be used compared to flowapi_title to determine if update of flow should happen
    @Getter
    @Inject
    @Default(values = "")
    public String title;

    // accept HTL attributes

    // which template to use for flow
    @RequestAttribute(name = "template")
    private String template;

    // which topic to use for flow
    @RequestAttribute(name = "topic")
    private String topic;

    @OSGiService
    FlowService flowService;

    @Override
    @PostConstruct
    protected void init() {
        LOG.info("init template: {}", template);

        //quick fail
        if (StringUtils.isBlank(template)) {
            return;
        }

        super.init();

        if (flowapi_enable) {
            // create new flow or update existing flow
            if (StringUtils.isBlank(flowapi_flowstreamid) 
                && StringUtils.isNotBlank(template)
            ) {
                // get template json
                JsonNode componentTemplate = getTemplateTree(template);

                String currentPagePath = PageUtil.getResourcePagePath(resource);
                
                String flowTopic = topic;
                // if topic is blank then generate a unique topic
                if (StringUtils.isBlank(flowTopic)) {
                    flowTopic = flowService.generateTopic(id);
                }

                // update component meta
                ObjectNode componentTemplateObject = (ObjectNode)componentTemplate;
                // componentTemplateObject.put("reference", "dashboard-reference");
                componentTemplateObject.put("author", "TypeRefinery.io");
                componentTemplateObject.put("group", currentPagePath);
                componentTemplateObject.put("icon", "fa fa-puzzle-piece");
                componentTemplateObject.put("readme", "");
                componentTemplateObject.put("name", title);
                
                // remove id
                if (componentTemplateObject.has("id")) {
                    componentTemplateObject.remove("id");
                }

                // update component design
                // JsonNode components = componentTemplate.get("components");
                // JsonNode component_flow_output = components.get("flow_output");
                // JsonNode component_flow_input = components.get("flow_input");
                if (componentTemplate.has("design")) {
                    JsonNode design = componentTemplate.get("design");

                    // update topic in flow_tms_filter_update
                    if (design.has("flow_tms_filter_update")) {
                        JsonNode instance_design_flowtmsfilterupdate = design.get("flow_tms_filter_update");
                        JsonNode instance_design_flowtmsfilterupdate_config = instance_design_flowtmsfilterupdate.get("config");
                        ((ObjectNode)instance_design_flowtmsfilterupdate_config).put("topic", flowTopic);
                    }

                    //update topic in flow_tms_filter_get
                    if (design.has("flow_tms_filter_get")) {
                        JsonNode instance_design_flowtmsfilterget = design.get("flow_tms_filter_get");
                        JsonNode instance_design_flowtmsfilterget_config = instance_design_flowtmsfilterget.get("config");
                        ((ObjectNode)instance_design_flowtmsfilterget_config).put("topic", flowTopic);
                    }
                }

                // get json string
                String componentJson = getJsonString(componentTemplate);
        
                // send to flowstream
                HashMap<String, Object> response = flowService.doFlowStreamImportData(componentJson);
                
                response.put(prop("title"), title);
                response.put(prop("topic"), flowTopic);
                response.put(prop("createdon"), DateUtil.getIsoDate(new Date()));

                LOG.info("flowstreamdata: {}", response);

                // update component with response
                PageUtil.updatResourceProperties(this.resource, response);
                
            } else if (StringUtils.isNotBlank(flowapi_flowstreamid) 
                && StringUtils.isNotBlank(template)
            ) {

                // if flowapi_title and title are different then update flowstream
                if (flowapi_title.equals(title)) {
                    LOG.info("nothing to update.");
                } else {

                    // get template json
                    JsonNode componentTemplate = getTemplateTree(template);

                    String currentPagePath = PageUtil.getResourcePagePath(resource);
                    
                    // update component meta
                    ObjectNode componentTemplateObject = (ObjectNode)componentTemplate;
                    componentTemplateObject.put("id", flowapi_flowstreamid);
                    componentTemplateObject.put("author", "TypeRefinery.io");
                    componentTemplateObject.put("group", currentPagePath);
                    componentTemplateObject.put("icon", "fa fa-puzzle-piece");
                    componentTemplateObject.put("readme", "");
                    componentTemplateObject.put("name", title);

                    // get json string
                    String componentJson = getJsonString(componentTemplate);
            
                    // send to flowstream
                    HashMap<String, Object> response = flowService.doFlowStreamUpdateData(componentJson);
                    
                    response.put(prop("updatedon"), DateUtil.getIsoDate(new Date()));

                    LOG.info("flowstreamdata: {}", response);

                    // update component with response
                    PageUtil.updatResourceProperties(this.resource, response);
                }
            }
        }
    }

    

    //read the json file from a template and convert it to JSON Tree
    @JsonIgnore
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
