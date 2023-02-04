package io.typerefinery.websight.services.workflow;

import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.HashMap;
import java.util.UUID;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.osgi.framework.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ObjectNode;

import io.typerefinery.websight.utils.DateUtil;
import io.typerefinery.websight.utils.JsonUtil;
import io.typerefinery.websight.utils.PageUtil;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

@Component(
        service = FlowService.class,
        immediate = true,
        property = {
                Constants.SERVICE_ID + "=TypeRefinery - Flow Service",
                Constants.SERVICE_DESCRIPTION + "=This is the service for accessing external Flow service"
        })
@Designate(ocd = FlowService.FlowServiceConfiguration.class)
public class FlowService {

    private static final String TAG = FlowService.class.getSimpleName();
    private static final Logger LOGGER = LoggerFactory.getLogger(FlowService.class);
    public static final String PROPERTY_PREFIX = "flowapi_";
    public static final String PROPERTY_FLOWSTREAMID = "flowstreamid";
    public static final String PROPERTY_TOPIC = "topic";
    public static final String PROPERTY_CREATEDON = "createdon";
    public static final String PROPERTY_UPDATEDON = "updatedon";
    public static final String PROPERTY_EDITURL = "editurl";


    private FlowServiceConfiguration configuration;

    // create http client
    protected static HttpClient client;


    @Activate
    protected void activate(FlowServiceConfiguration configuration) {
        this.configuration = configuration;

        client = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }


    // get flow data from flowstreamid
    public String getFlowStreamExportAPIURL(String flowstreamid) {
        String url = String.format(configuration.host_url() + configuration.endpoint_export(), flowstreamid);
        return url;
    }

    // get flow data from flowstreamid
    public String getFlowStreamImportAPIURL() {
        String url = String.format(configuration.host_url() + configuration.endpoint_import());
        return url;
    }

    // get flow data from flowstreamid
    public String getFlowStreamUpdateAPIURL() {
        String url = String.format(configuration.host_url() + configuration.endpoint_update());
        return url;
    }


    // create a flow from content
    public HashMap<String, Object> doFlowStreamImportData(String content) {

        String url = getFlowStreamImportAPIURL();
        
        HashMap<String, Object> flowResponse = new HashMap<String, Object>();

        try {

            // create request
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .POST(HttpRequest.BodyPublishers.ofString(content))
                .build();
            
            LOGGER.info("flowstream request: {}", request.uri());
            
            // send request
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            LOGGER.info("flowstream response: {}", response);

            String responseAsString = response.body();

            if (StringUtils.isNotBlank(responseAsString)) {
                // convert response to json
                ObjectMapper mapper = new ObjectMapper();
                JsonNode json = mapper.readTree(responseAsString);
                if (response.statusCode() != 200) {
                    LOGGER.error("flowstream could not create new flow: {}", responseAsString);
                    flowResponse.put(prop("error"), responseAsString);
                    return flowResponse;
                }
                
                String flowstreamid = json.get("value").asText();
                String flowapi_editurl = compileEditUrl(flowstreamid);

                flowResponse.put(prop(PROPERTY_FLOWSTREAMID), flowstreamid);
                flowResponse.put(prop(PROPERTY_EDITURL), flowapi_editurl);
                flowResponse.put(prop("success"), json.get("success").asText());
                flowResponse.put(prop("error"), json.get("error").asText());

                return flowResponse;
            } else {
                LOGGER.error("flowstream return empty response: {}", url);
                flowResponse.put(prop("error"), "no response");
            }
           

        } catch (Exception e) {
            LOGGER.error("flowstream could not create new flow: {}", url);
            flowResponse.put(prop("error"), "error executing flowstream import");
            e.printStackTrace();
        }

        return flowResponse;
    }

    public String compileEditUrl(String flowstreamid) {
        return compileEditUrl(configuration, flowstreamid) ;
    }

    public static String compileEditUrl(FlowServiceConfiguration configuration, String flowstreamid) {
        String flowWsUString = String.format(configuration.flow_ws_url(),flowstreamid);
        String flowapi_editurl = String.format(configuration.flow_designer_url(),"0", URLEncoder.encode(flowWsUString, StandardCharsets.UTF_8),"");
        return flowapi_editurl;
    }

    public static String prop(String key) {
        return PROPERTY_PREFIX + key;
    }
    
    // create a flow from content
    public HashMap<String, Object> doFlowStreamUpdateData(String content, String flowstreamid) {

        String url = getFlowStreamUpdateAPIURL();
        
        HashMap<String, Object> flowResponse = new HashMap<String, Object>();

        try {

            // create request
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .POST(HttpRequest.BodyPublishers.ofString(content))
                .build();
            
            LOGGER.info("flowstream request: {}", request.uri());
            
            // send request
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            LOGGER.info("flowstream response: {}", response);

            String responseAsString = response.body();

            if (StringUtils.isNotBlank(responseAsString)) {
                // convert response to json
                ObjectMapper mapper = new ObjectMapper();
                JsonNode json = mapper.readTree(responseAsString);
                if (response.statusCode() != 200) {
                    LOGGER.error("flowstream could not update flow: {}", responseAsString);
                    flowResponse.put(prop("error"), responseAsString);
                    return flowResponse;
                }

                String flowapi_editurl = compileEditUrl(flowstreamid);
                flowResponse.put(prop(PROPERTY_EDITURL), flowapi_editurl);

                flowResponse.put(prop("success"), json.get("success").asText());

                return flowResponse;
            } else {
                LOGGER.error("flowstream return empty response: {}", url);
                flowResponse.put(prop("error"), "no response");
            }
           

        } catch (Exception e) {
            LOGGER.error("flowstream could not update flow: {}", url);
            flowResponse.put(prop("error"), "error executing flowstream update");
            e.printStackTrace();
        }

        return flowResponse;
    }
    
    // generate a new topic
    public String generateTopic(String name) {
        return String.format("%s_%s", name, UUID.randomUUID().toString().replace("-", ""));
    }

    // do a http client call to get the flow data
    public String getFlowStreamExportData(String flowstreamid) {

        String url = getFlowStreamExportAPIURL(flowstreamid);
        
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI(url))
                .GET()
                .build();

            HttpClient client = HttpClient.newBuilder().build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            return response.body();

        } catch (Exception e) {
            e.printStackTrace();
        }

        return "";
    }


    /**
     * Create a flow from a template
     * @param templatePath template path in repository to use as a template
     * @param componentResource resource of the component which to update with outcome of api call
     * @param topic topic to use for the flow
     * @param title title to use for the flow
     * @param id id to use for the flow
     */
    public void createFlowFromTemplate(String templatePath, Resource componentResource, String topic, String title) {
        
        ResourceResolver resourceResolver = componentResource.getResourceResolver();

        // get template json
        JsonNode componentTemplate = getTemplateTree(templatePath, resourceResolver);

        String currentPagePath = PageUtil.getResourcePagePath(componentResource);
        
        String flowTopic = topic;
        // if topic is blank then generate a unique topic
        if (StringUtils.isBlank(flowTopic)) {
            flowTopic = generateTopic(componentResource.getName());
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
        String componentJson = JsonUtil.getJsonString(componentTemplate);

        // send to flowstream
        HashMap<String, Object> response = doFlowStreamImportData(componentJson);
        
        response.put(prop(PROPERTY_TOPIC), flowTopic);
        response.put(prop(PROPERTY_CREATEDON), DateUtil.getIsoDate(new Date()));

        LOGGER.info("flowstreamdata: {}", response);

        // update component with response
        PageUtil.updatResourceProperties(componentResource, response);

    }

    /**
     * update flow from template
     * @param templatePath
     * @param componentResource
     * @param newTitle
     * @param flowstreamid
     */
    public void updateFlowFromTemplate(String templatePath, Resource componentResource, String newTitle, String flowstreamid) {
        
        ResourceResolver resourceResolver = componentResource.getResourceResolver();

        // get template json
        JsonNode componentTemplate = getTemplateTree(templatePath, resourceResolver);

        String currentPagePath = PageUtil.getResourcePagePath(componentResource);
        
        // update component meta
        ObjectNode componentTemplateObject = (ObjectNode)componentTemplate;
        componentTemplateObject.put("id", flowstreamid);
        componentTemplateObject.put("author", "TypeRefinery.io");
        componentTemplateObject.put("group", currentPagePath);
        componentTemplateObject.put("icon", "fa fa-puzzle-piece");
        componentTemplateObject.put("readme", "");
        componentTemplateObject.put("name", newTitle);

        // get json string
        String componentJson = JsonUtil.getJsonString(componentTemplate);

        // send to flowstream
        HashMap<String, Object> response = doFlowStreamUpdateData(componentJson, flowstreamid);
        
        response.put(prop(PROPERTY_UPDATEDON), DateUtil.getIsoDate(new Date()));

        LOGGER.info("flowstreamdata: {}", response);

        // update component with response
        PageUtil.updatResourceProperties(componentResource, response);
    }

    public boolean isUpdateRequired(Resource componentResource) {
        // quick fail
        if (componentResource == null) {
            return false;
        }
        ValueMap properties = componentResource.getValueMap();
        String flowstreamid = properties.get(prop(PROPERTY_FLOWSTREAMID), "");
        if (StringUtils.isBlank(flowstreamid)) {
            return true;
        }
        return false;
    }

    //read the json file from a template and convert it to JSON Tree
    @SuppressWarnings("unchecked")
    public JsonNode getTemplateTree(String templatePath, ResourceResolver resourceResolver) {
        try {
            Resource templateComponentResource = resourceResolver.getResource(templatePath);
            ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
            if (ResourceUtil.isNonExistingResource(templateComponentResource) == false) {
                InputStream inputStream = templateComponentResource.adaptTo(InputStream.class);
                return mapper.readTree(inputStream);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null;
    }
    
    @ObjectClassDefinition(
        name = "TypeRefinery - Flow Configuration",
        description = "This is the configuration for the Flow service"
    )
    public @interface FlowServiceConfiguration {

        public final static String FLOW_HOST = "http://localhost:8000";
        public final static String FLOW_ENDPOINT_EXPORT = "/flow/export/%s";
        public final static String FLOW_ENDPOINT_IMPORT = "/flow/import";
        public final static String FLOW_ENDPOINT_UPDATE = "/flow/update";
        public final static String FLOW_WS_URL = "ws://localhost:8111/flows/%s";
        public final static String FLOW_DESIGNER_URL = "http://localhost:8111/designer/?darkmode=%s&socket=%s&components=%s";
        
        @AttributeDefinition(
            name = "Host URL",
            description = "Host url of the external service.",
            defaultValue = FLOW_HOST
        )
        String host_url() default FLOW_HOST;

        @AttributeDefinition(
                name = "Endpoint Export",
                description = "URL of the endpoint to export data",
                defaultValue = FLOW_ENDPOINT_EXPORT
        )
        String endpoint_export() default FLOW_ENDPOINT_EXPORT;

        @AttributeDefinition(
                name = "Endpoint Import",
                description = "URL of the endpoint to import data",
                defaultValue = FLOW_ENDPOINT_IMPORT
        )
        String endpoint_import() default FLOW_ENDPOINT_IMPORT;

        @AttributeDefinition(
                name = "Endpoint Update",
                description = "URL of the endpoint to update flow",
                defaultValue = FLOW_ENDPOINT_IMPORT
        )
        String endpoint_update() default FLOW_ENDPOINT_UPDATE;

        @AttributeDefinition(
            name = "Flow WS URL",
            description = "Flow websocket url that will be used in designer url",
            defaultValue = FLOW_WS_URL
        )
        String flow_ws_url() default FLOW_WS_URL;

        @AttributeDefinition(
            name = "Flow Designer URL",
            description = "Flow Designer url where to open flow editor",
            defaultValue = FLOW_DESIGNER_URL
        )
        String flow_designer_url() default FLOW_DESIGNER_URL;
    }
}
