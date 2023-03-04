package io.typerefinery.websight.services.flow;

import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Map.Entry;
import java.util.concurrent.CompletableFuture;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.resource.observation.ResourceChange;
import org.jetbrains.annotations.NotNull;
import org.osgi.framework.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;

import io.typerefinery.websight.services.flow.registry.FlowComponentRegistry;
import io.typerefinery.websight.utils.DateUtil;
import io.typerefinery.websight.utils.JsonUtil;
import io.typerefinery.websight.utils.PageUtil;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;;

@Component(
        service = FlowService.class,
        immediate = true,
        property = {
                Constants.SERVICE_ID + "=TypeRefinery - Flow Service",
                Constants.SERVICE_DESCRIPTION + "=This is the service for accessing external Flow service",
                Constants.SERVICE_RANKING+":Integer=1000"
        })
@Designate(ocd = FlowService.FlowServiceConfiguration.class)
public class FlowService {

    private static final String TAG = FlowService.class.getSimpleName();
    private static final Logger LOGGER = LoggerFactory.getLogger(FlowService.class);
    public static final String PROPERTY_PREFIX = "flowapi_";
    public static final String PROPERTY_FLOWSTREAMID = "flowstreamid";
    public static final String PROPERTY_TOPIC = "topic";
    public static final String PROPERTY_GROUP = "group";
    public static final String PROPERTY_TITLE = "title";
    public static final String PROPERTY_CREATEDON = "createdon";
    public static final String PROPERTY_UPDATEDON = "updatedon";
    public static final String PROPERTY_EDITURL = "editurl";
    public static final String PROPERTY_ENABLE = "enable";
    public static final String PROPERTY_TEMPLATE = "template";
    public static final String PROPERTY_TEMPLATE_DESIGN = "designtemplate";
    public static final String PROPERTY_ISCONTAINER = "iscontainer";
    public static final String PROPERTY_HTTPROUTE = "httproute";
    public static final String PROPERTY_SAMPLEDATA = "sampledata"; // path to json to be used to seed flow with sample data
    public static final String SLING_RESOURCE_SUPER_TYPE_PROPERTY = "sling:resourceSuperType"; // org.apache.sling.jcr.resource.JcrResourceConstants , not osgi feature supported
    public static final String SLING_RESOURCE_TYPE_PROPERTY = "sling:resourceType"; // org.apache.sling.jcr.resource.JcrResourceConstants , not osgi feature supported

    public static final String FLOW_COMPONENT_SAMPLE_DATA_FILE_PATH = "templates/flowsample.json";
    public static final String FLOW_SPI_KEY = "io.typerefinery.flow.spi.extension";

    public static final String FLOW_TEMPLATE_FIELD_SAMPLE_DATA = "<sample-data>"; // used to add sample data into send component
    public static final String FLOW_TEMPLATE_FIELD_CHILD_FLOWID = "<childflowid>"; // used to specify which child flow to be used
    public static final String FLOW_TEMPLATE_FIELD_PARENT_FLOWID = "<parentflowid>"; // used to specify which parent flow to be used
    public static final String FLOW_TEMPLATE_FIELD_SUBSCRIBE_ID = "<subscribe-id>"; // flow step subscribe id, updates subscribe step in a flow
    public static final String FLOW_TEMPLATE_FIELD_PRINTJSON_ID = "<printjson-id>"; // flow step printjson id, updates printjson step in a flow
    public static final String FLOW_TEMPLATE_FIELD_SENDDATA_ID = "<senddata-id>"; // flow step senddata id, updates senddata step in a flow, eg send to TMS
    public static final String FLOW_TEMPLATE_FIELD_PUBLISH_ID = "<publish-id>"; // flow step publish id, updates publish step in a flow

    public static final String FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL = "<http-route-url>"; // used to specify which http route flow will use if any, eg form get url to be used /form/* will be updated to the {page URL}/*
    public static final String FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_SUFFIX = "/*";

    public FlowServiceConfiguration configuration;

    @Reference
    private FlowComponentRegistry flowComponentRegistry;

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


    // export flow data from flowstreamid
    public String getFlowStreamExportAPIURL(String flowstreamid) {
        String url = String.format(configuration.host_url() + configuration.endpoint_export(), flowstreamid);
        return url;
    }

    // get flow data from flowstreamid
    public String getFlowStreamReadAPIURL(String flowstreamid) {
        String url = String.format(configuration.host_url() + configuration.endpoint_read(), flowstreamid);
        return url;
    }

    // import flow data from flowstreamid
    public String getFlowStreamImportAPIURL() {
        String url = String.format(configuration.host_url() + configuration.endpoint_import());
        return url;
    }

    // get flow data from flowstreamid
    public String getFlowStreamUpdateAPIURL() {
        String url = String.format(configuration.host_url() + configuration.endpoint_update());
        return url;
    }

    // get flow data from flowstreamid
    public String getFlowStreamDesignSaveAPIURL(String flowstreamid) {
        String url = String.format(configuration.host_url() + configuration.endpoint_design_save(), flowstreamid);
        return url;
    }

    // get flow data from flowstreamid
    public String getFlowStreamDesignAPIURL(String flowstreamid) {
        String url = String.format(configuration.host_url() + configuration.endpoint_design(), flowstreamid);
        return url;
    }

    public void doProcessFlowResource(Resource resource, ResourceChange.ChangeType changeType) {
        ResourceResolver resourceResolver = resource.getResourceResolver();
        if (ResourceUtil.isNonExistingResource(resource) && resourceResolver == null) {
            return;
        }
        ValueMap properties = resource.getValueMap();

        Boolean flowapi_enable = properties.get(prop(PROPERTY_ENABLE), false);
        String flowapi_template = properties.get(prop(PROPERTY_TEMPLATE), String.class);
        
        if (flowapi_enable && StringUtils.isNotBlank(flowapi_template)) {

            String authored_title = properties.get(PROPERTY_TITLE, String.class);
            Boolean flowapi_iscontainer = properties.get(prop(PROPERTY_ISCONTAINER), false);
            String flowapi_flowstreamid = properties.get(prop(PROPERTY_FLOWSTREAMID), String.class);
            String flowapi_topic = properties.get(prop(PROPERTY_TOPIC), String.class);
            String flowapi_title = properties.get(prop(PROPERTY_TITLE), String.class);
            String flowapi_group = properties.get(prop(PROPERTY_GROUP), String.class);
            String flowapi_designtemplate = properties.get(prop(PROPERTY_TEMPLATE_DESIGN), String.class);
            String flowapi_editurl = properties.get(prop(PROPERTY_EDITURL), String.class);
            String flowapi_sampledata = properties.get(prop(PROPERTY_SAMPLEDATA), String.class);
    
            boolean isFlowExists = isFlowExists(flowapi_flowstreamid);

            //pick templates

            boolean isTemplateExists = PageUtil.isResourceExists(flowapi_template, resourceResolver);
            if (!isTemplateExists) {
                LOGGER.info("nothing to do, template not found: {}", flowapi_template);
                return;
            }
            // create new flow or update existing flow
            if (isFlowExists == false && isTemplateExists) {
                // use topic from resource as priority
                flowapi_flowstreamid = createFlowFromTemplate(flowapi_template, resource, flowapi_topic, flowapi_title, flowapi_designtemplate, flowapi_iscontainer, flowapi_sampledata);
                if (StringUtils.isNotBlank(flowapi_flowstreamid)) {
                    isFlowExists = isFlowExists(flowapi_flowstreamid);
                    if (flowapi_iscontainer & StringUtils.isNotBlank(flowapi_designtemplate)) {
                        updateFlowDesignFromTemplate(flowapi_designtemplate, resource, authored_title, flowapi_flowstreamid, flowapi_sampledata);
                    } 
                } else {
                    LOGGER.info("could not create flow from template: {}", flowapi_template);
                }
            } else if (isFlowExists && isTemplateExists) {

                // if flowapi_title and title are different then update flowstream
                if (flowapi_title.equals(authored_title) || StringUtils.isBlank(authored_title)) {
                    LOGGER.info("nothing to update.");
                    return;
                } else {
                    updateFlowFromTemplate(flowapi_template, resource, authored_title, flowapi_flowstreamid, flowapi_sampledata);
                    if (flowapi_iscontainer & StringUtils.isNotBlank(flowapi_designtemplate)) {
                        updateFlowDesignFromTemplate(flowapi_designtemplate, resource, authored_title, flowapi_flowstreamid, flowapi_sampledata);
                    }
                }
            } 
        }        
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
                
                // get flowstreamid
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

            if (response.statusCode() != 200) {
                LOGGER.error("flowstream could not update flow: {}", response.body());
                flowResponse.put(prop("error"), "flow does not exist.");
                return flowResponse;
            }

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

    
    // create a flow from content
    public HashMap<String, Object> doFlowStreamDesignSaveData(String content, String flowstreamid) {

        String url = getFlowStreamDesignSaveAPIURL(flowstreamid);
        
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
            flowResponse.put(prop("response"), responseAsString);

            if (StringUtils.isNotBlank(responseAsString)) {
                // convert response to json
                ObjectMapper mapper = new ObjectMapper();
                JsonNode json = mapper.readTree(responseAsString);

                if (json != null) {
                    flowResponse.put(prop("error"), json.get("wserror").asText());
                } else {
                    flowResponse.put(prop("error"), "could not parse response");
                }

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

    public boolean isFlowExists(String flowstreamid) {
        String responseAsString = getFlowStreamReadData(flowstreamid);

        if (StringUtils.isNotBlank(responseAsString)) {
            return true;
        }
        return false;
    }

    public HashMap<String, Object> getFlowStreamData(String flowstreamid) {
        String responseAsString = getFlowStreamReadData(flowstreamid);

        HashMap<String, Object> flowResponse = new HashMap<String, Object>();

        if (StringUtils.isNotBlank(responseAsString)) {
            // convert response to json
            ObjectMapper mapper = new ObjectMapper();
            flowResponse = mapper.convertValue(responseAsString, new TypeReference<HashMap<String, Object>>(){});
            return flowResponse;
        } else {
            LOGGER.error("flowstream return empty response for streamid {}", flowstreamid);
            flowResponse.put(prop("error"), "no response");
        }
        return flowResponse;
    }

    // do a http client call to get the flow meta data
    public String getFlowStreamReadData(String flowstreamid) {

        String url = getFlowStreamReadAPIURL(flowstreamid);
        
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI(url))
                .GET()
                .build();

            HttpClient client = HttpClient.newBuilder().build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return response.body();
            } else {
                return "";
            }            

        } catch (Exception e) {
            e.printStackTrace();
        }

        return "";
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

    
    // do a http client call to get the flow data
    public CompletableFuture<String> getFlowStreamDesignData(String flowstreamid) {

        String url = getFlowStreamDesignAPIURL(flowstreamid);
        
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI(url))
                .GET()
                .build();

            HttpClient client = HttpClient.newBuilder().build();

            // HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            return client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).thenApply(HttpResponse::body);

            // return response.body();

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }


    /**
     * Create a flow from a template
     * @param templatePath template path in repository to use as a template
     * @param componentResource resource of the component which to update with outcome of api call
     * @param topic topic to use for the flow
     * @param title title to use for the flow
     * @param id id to use for the flow
     * @param isContainer if true then create a flow container
     */
    public String createFlowFromTemplate(String templatePath, Resource componentResource, String topic, String title, String designTemplatePath, boolean isContainer, String sampleDataPath) {

        // generate a title if its not specified
        if (StringUtils.isBlank(title)) {
            title = componentResource.getName() + " flow";
        }
        
        ResourceResolver resourceResolver = componentResource.getResourceResolver();


        String componentSampleData = getComponentSampleJson(sampleDataPath, componentResource, resourceResolver);
        String currentPagePath = PageUtil.getResourcePagePath(componentResource);
        String designTemplateString = getResourceInputStreamAsString(templatePath, resourceResolver);

        // setup a list of replace strings, as this is new flowId, flowStreamId and childPathId will be blank
        HashMap<String, String> replaceMap = getReplaceMap("", "", "", currentPagePath, componentSampleData);

        // replace template variables with values
        String designTemplateStringUpdated = updateFlowTemplateVariables(designTemplateString, replaceMap);

        // get template json
        JsonNode componentTemplate = toJsonNode(designTemplateStringUpdated);

        if (componentTemplate == null) {
            LOGGER.error("could not parse flow template: {}", templatePath);
            return "";
        }

        Resource currentFlowContainerResource = PageUtil.getResourceParentByResourceType(componentResource,"typerefinery/components/workflow/flow");

        String flowGroup = currentPagePath;
        if (currentFlowContainerResource != null) {
            //get flow group from parent flow container
            String parentFlowstreamuid = currentFlowContainerResource.getValueMap().get(PROPERTY_FLOWSTREAMID, "");
            if (StringUtils.isNotBlank(parentFlowstreamuid)) {
                HashMap<String,Object> parentMetadata = getFlowStreamData(parentFlowstreamuid);
                flowGroup = (String)parentMetadata.get("group");
            }
        }

        String flowTopic = topic;
        // if topic is blank then generate a unique topic
        if (StringUtils.isBlank(flowTopic)) {
            flowTopic = generateTopic(componentResource.getName());
        }

        // update component meta
        ObjectNode componentTemplateObject = (ObjectNode)componentTemplate;
        // componentTemplateObject.put("reference", "dashboard-reference");
        componentTemplateObject.put("author", configuration.flow_meta_author());
        componentTemplateObject.put("group", flowGroup);
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
            
            // update topic in flow tms filter update block
            // this is used to wrap data incoming into flow before its sent to TMS
            if (design.has("flowtmsfilterupdate")) {
                JsonNode instance_design_flowtmsfilterupdate = design.get("flowtmsfilterupdate");
                JsonNode instance_design_flowtmsfilterupdate_config = instance_design_flowtmsfilterupdate.get("config");
                ((ObjectNode)instance_design_flowtmsfilterupdate_config).put("topic", flowTopic);
            }

            //update topic in flow tms filter get block
            // this is used to unwrap data incoming from TMS before its sent as flow output
            if (design.has("flowtmsfilterget")) {
                JsonNode instance_design_flowtmsfilterget = design.get("flowtmsfilterget");
                JsonNode instance_design_flowtmsfilterget_config = instance_design_flowtmsfilterget.get("config");
                ((ObjectNode)instance_design_flowtmsfilterget_config).put("topic", flowTopic);
            }
        }

        // get json string
        String componentJson = JsonUtil.getJsonString(componentTemplate);

        // send to flowstream
        HashMap<String, Object> response = doFlowStreamImportData(componentJson);
        
        String responseFlowId = (String)response.get(prop(PROPERTY_FLOWSTREAMID));

        response.put(prop(PROPERTY_TOPIC), flowTopic);
        response.put(prop(PROPERTY_GROUP), flowGroup);
        response.put(prop(PROPERTY_TITLE), title);
        response.put(prop(PROPERTY_TEMPLATE), templatePath);
        response.put(prop(PROPERTY_TEMPLATE_DESIGN), designTemplatePath);
        response.put(prop(PROPERTY_ISCONTAINER), isContainer);
        response.put(prop(PROPERTY_CREATEDON), DateUtil.getIsoDate(new Date()));
        response.put(prop(PROPERTY_EDITURL), compileEditUrl(responseFlowId));
        response.put(prop(PROPERTY_HTTPROUTE), currentPagePath + FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_SUFFIX);

        LOGGER.info("flowstreamdata: {}", response);

        // update component with response
        PageUtil.updatResourceProperties(componentResource, response);

        //return flowstreamid
        return responseFlowId;

    }

    /**
     * update flow from template
     * @param templatePath template path in repository to use as a template
     * @param componentResource resource of the component which to update with outcome of api call
     * @param newTitle new title to use for the flow
     * @param flowstreamid flowstream id to update
     */
    public void updateFlowFromTemplate(String templatePath, Resource componentResource, String newTitle, String flowstreamid, String sampleDataPath) {
        
        ResourceResolver resourceResolver = componentResource.getResourceResolver();

        // get template json
        JsonNode componentTemplate = getTemplateTree(templatePath, resourceResolver);

        String currentPagePath = PageUtil.getResourcePagePath(componentResource);
        Resource currentFlowContainerResource = PageUtil.getResourceParentByResourceType(componentResource,"typerefinery/components/workflow/flow");
        
        String flowGroup = currentPagePath;
        if (currentFlowContainerResource != null) {
            if (currentFlowContainerResource != null) {
                //get flow group from parent flow container
                String parentFlowstreamuid = currentFlowContainerResource.getValueMap().get("flowstreamid", "");
                if (StringUtils.isNotBlank(parentFlowstreamuid)) {
                    HashMap<String,Object> parentMetadata = getFlowStreamData(parentFlowstreamuid);
                    flowGroup = (String)parentMetadata.get("group");
                }
            }
        }

        // update component meta
        ObjectNode componentTemplateObject = (ObjectNode)componentTemplate;
        componentTemplateObject.put("id", flowstreamid);
        componentTemplateObject.put("author", configuration.flow_meta_author());
        componentTemplateObject.put("group", flowGroup);
        componentTemplateObject.put("name", newTitle);

        // get json string
        String componentJson = JsonUtil.getJsonString(componentTemplate);

        // send to flowstream
        HashMap<String, Object> response = doFlowStreamUpdateData(componentJson, flowstreamid);
        
        response.put(prop(PROPERTY_UPDATEDON), DateUtil.getIsoDate(new Date()));
        response.put(prop(PROPERTY_EDITURL), compileEditUrl(flowstreamid));
        response.put(prop(PROPERTY_TITLE), newTitle);
        response.put(prop(PROPERTY_HTTPROUTE), currentPagePath + FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_SUFFIX);

        LOGGER.info("flowstreamdata: {}", response);

        // update component with response
        PageUtil.updatResourceProperties(componentResource, response);
    }

    public HashMap<String, String> getReplaceMap(String flowId, String flowstreamid, String childPathId, String currentPagePath, String componentSampleData) {
        String componentSampleDataValue = componentSampleData;

        ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        // update sample data
        if (StringUtils.isNotBlank(componentSampleData)) {
            try {
                JsonNode componentSampleDataJson = mapper.readTree(componentSampleData);
                // update sample data
                //<sample-data>
                componentSampleDataValue = StringEscapeUtils.escapeJson(mapper.writeValueAsString(componentSampleDataJson));
            } catch (Exception e) {
                LOGGER.error("error parsing component sample data: {}, error: {}", componentSampleData, e.getMessage());
            }
        }
        final String componentSampleDataValueFinal = componentSampleDataValue;
        // setup a list of replace strings
        return new HashMap<String, String>(){{
            put(FLOW_TEMPLATE_FIELD_CHILD_FLOWID, flowId);
            put(FLOW_TEMPLATE_FIELD_PARENT_FLOWID, flowstreamid);
            put(FLOW_TEMPLATE_FIELD_SUBSCRIBE_ID, StringUtils.join(childPathId, "subscribe"));
            put(FLOW_TEMPLATE_FIELD_PRINTJSON_ID, StringUtils.join(childPathId, "printjson"));
            put(FLOW_TEMPLATE_FIELD_SENDDATA_ID, StringUtils.join(childPathId, "senddata"));
            put(FLOW_TEMPLATE_FIELD_PUBLISH_ID, StringUtils.join(childPathId, "publish"));
            put(FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL, currentPagePath + FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_SUFFIX); // used for HTTP Route step, eg in forms            
            put(FLOW_TEMPLATE_FIELD_SAMPLE_DATA, componentSampleDataValueFinal); // used for HTTP Route step, eg in forms            
        }};
    }

    public String updateFlowTemplateVariables(String template, HashMap<String, String> replaceMap) {
        String updatedTemplate = template;

        // update template
        StringBuilder designTemplateStringBuilder = new StringBuilder(updatedTemplate);
        // replace values in template
        for (Map.Entry<String, String> entry : replaceMap.entrySet()) {
            
            // replace value in designTemplateStringBuilder while it exists
            while (designTemplateStringBuilder.indexOf(entry.getKey()) != -1) {
                designTemplateStringBuilder.replace(designTemplateStringBuilder.indexOf(entry.getKey()), designTemplateStringBuilder.indexOf(entry.getKey()) + entry.getKey().length(), entry.getValue());
            }

        }
        
        return designTemplateStringBuilder.toString();
    }

    /**
     * update flow from template
     * @param templatePath template path in repository to use as a template
     * @param componentResource resource of the component which to update with outcome of api call
     * @param newTitle new title to use for the flow
     * @param flowstreamid flowstream id to update
     * @param isContainer if true then create a flow container
     */
    public void updateFlowDesignFromTemplate(String designTemplate, Resource componentResource, String newTitle, String flowstreamid, String sampleDataPath) {
        
        ResourceResolver resourceResolver = componentResource.getResourceResolver();

        String parentPath = componentResource.getPath();
        // update flow design with child flows
        List<Resource> flowResources = findContainerFlowResources(componentResource, new ArrayList<Resource>());
        // contains all of the existing and new design components
        ObjectNode newDesignComponents = JsonNodeFactory.instance.objectNode();
        // contains all of the existing and new groups
        ArrayNode newDesignComponentsGroups = JsonNodeFactory.instance.arrayNode();

        if (flowResources != null) {

            ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

            // get current flow design
            CompletableFuture<String> existingFlowDesignStringPromise = getFlowStreamDesignData(flowstreamid);

            // create flow grid
            GridTitles flowGridTiles = new GridTitles(3, 900D, 700D, 50D, 20D);
            
            try {
                String existingFlowDesignString = existingFlowDesignStringPromise.get();
                // use existing flow components as a base
                newDesignComponents = (ObjectNode) mapper.readTree(existingFlowDesignString);

                // based on flow elements
                // find the place y coord where to start adding new flows
                // for each child in newDesignComponents get x and y
                Iterator<Entry<String, JsonNode>> fieldsIterator = newDesignComponents.fields();
                GridTile existingDesignTile = null;
                //determine how far x and y to place new flows, by finding the max x and y of existing flow elements
                // if there are no existing flows then start at 0,0
                if ( fieldsIterator.hasNext() ) {
                    existingDesignTile = new GridTile("existing", "existing", flowGridTiles.tilePadding);
                    boolean foundExistingFlowElements = false;
                    while (fieldsIterator.hasNext()) {
                        Entry<String, JsonNode> field = fieldsIterator.next();
                        if (field.getValue().isObject()) {
                            ObjectNode afield = (ObjectNode) field.getValue();
                            if (afield.has("x") && afield.has("y") ) {
                                String xValue = afield.get("x").asText();
                                String yValue = afield.get("y").asText();
                                if (xValue != null && yValue != null) {
                                    Double xValueD = Double.parseDouble(xValue);
                                    Double yValueD = Double.parseDouble(yValue);
                                    // collect all x and y values
                                    if (xValueD > existingDesignTile.x) {
                                        existingDesignTile.setX(xValueD);
                                    }
                                    if (yValueD > existingDesignTile.y) {
                                        existingDesignTile.setY(yValueD);
                                    }
                                }
                                foundExistingFlowElements = true;
                            }
                        } else if (field.getKey().equals("groups") && field.getValue().isArray()) {
                            //check if there are any groups and use those as x+width and y+height for max values to avoid overlaps
                            newDesignComponentsGroups = (ArrayNode) field.getValue();

                            Iterator<JsonNode> groupsIterator = newDesignComponentsGroups.elements();
                            while (groupsIterator.hasNext()) {
                                JsonNode group = groupsIterator.next();
                                if (group.has("x") && group.has("y") && group.has("width") && group.has("height") ) {
                                    String xValue = group.get("x").asText();
                                    String yValue = group.get("y").asText();
                                    String widthValue = group.get("width").asText();
                                    String heightValue = group.get("height").asText();
                                    if (xValue != null && yValue != null && widthValue != null && heightValue != null) {
                                        Double xValueD = Double.parseDouble(xValue);
                                        Double yValueD = Double.parseDouble(yValue);
                                        Double widthValueD = Double.parseDouble(widthValue);
                                        Double heightValueD = Double.parseDouble(heightValue);

                                        // collect all x and y values
                                        if (xValueD > existingDesignTile.x) {
                                            existingDesignTile.setX(xValueD);
                                        }
                                        if (yValueD > existingDesignTile.y) {
                                            existingDesignTile.setY(yValueD);
                                        }

                                        // collect all the max x and max y
                                        if (xValueD + widthValueD > existingDesignTile.x) {
                                            existingDesignTile.setX(xValueD + widthValueD);
                                        }
                                        if (yValueD + heightValueD > existingDesignTile.y) {
                                            existingDesignTile.setY(yValueD + heightValueD);
                                        }
                                    }
                                    foundExistingFlowElements = true;
                                }
                            }

                        }
                    }
                    if (foundExistingFlowElements) {
                        //this will reset the x and y to the next available spot as well as set width and height of all tiles
                        flowGridTiles.addFirstTile(existingDesignTile); 
                    }
                } else {
                    newDesignComponents.set("groups", JsonNodeFactory.instance.arrayNode());
                }
                
            } catch (Exception e) {
                LOGGER.error("error parsing flow current design: {}", e.getMessage());
                e.printStackTrace();
            }

            int flowCount = 1;
            for (Resource flowResource : flowResources) {
                flowCount++;
                String flowId = flowResource.getValueMap().get(prop(PROPERTY_FLOWSTREAMID), String.class);
                if (StringUtils.isNotBlank(flowId)) {
                    //get flow title to use as group title
                    String flowTitle = flowResource.getValueMap().get(prop(PROPERTY_TITLE), String.class);
                    if (StringUtils.isBlank(flowTitle)) {
                        flowTitle = flowResource.getName();
                    }

                    // get template json
                    // JsonNode componentTemplate = getTemplateTree(designTemplate, resourceResolver);
                    String designTemplateString = getResourceInputStreamAsString(designTemplate, resourceResolver);

                    if (StringUtils.isBlank(designTemplateString)) {
                        LOGGER.error("design template not found: {}", designTemplate);
                        return;
                    }

                    // get path to child flow relative to parent
                    String childPathId = formatResourcePathToId(flowResource.getPath().replace(parentPath, ""));
                    String currentPagePath = PageUtil.getResourcePagePath(componentResource);
                    String componentSampleData = getComponentSampleJson(sampleDataPath, flowResource, resourceResolver);

                    // setup a list of replace strings
                    HashMap<String, String> replaceMap = getReplaceMap(flowId, flowstreamid, childPathId, currentPagePath, componentSampleData);

                    boolean flowIsUsed = false;
                    // check if any replacemap nodes existing in current design
                    // do we have components in current design that we need to copy over as is
                    if (newDesignComponents != null) {
                        for (Map.Entry<String, String> entry : replaceMap.entrySet()) {
                            if (newDesignComponents.has(entry.getValue())) {
                                flowIsUsed = true;
                                LOGGER.error("flow [{}] already has using this flow step resource: {}", flowstreamid, entry.getKey(), entry.getValue());
                            }
                        }
                    }
                    
                    // if steps already exists do nothing and continue
                    if (flowIsUsed) {
                        LOGGER.error("some items from child flow [{}] already exist in this flow [{}]: {}", flowId, flowstreamid, flowResource.getPath());
                        continue;
                    }

                    // replace template variables with values
                    String designTemplateStringUpdated = updateFlowTemplateVariables(designTemplateString, replaceMap);

                    // add new design steps to flow design
                    try {
                        JsonNode newDesign = mapper.readTree(designTemplateStringUpdated);
                        
                        // this will add a new tile to the grid and return the tile
                        // this will be used to update the x and y values of the new flow elements
                        GridTile flowGridTile = flowGridTiles.nextTile(flowId, flowTitle);

                        //for each step in new design, update x and y positions and add to new design components
                        Iterator<Entry<String, JsonNode>> fieldsIterator = newDesign.fields();
                        while (fieldsIterator.hasNext()) {
                            Entry<String, JsonNode> field = fieldsIterator.next();
                            ObjectNode aComponent = (ObjectNode) field.getValue();
                            //skip if already exists
                            if (newDesignComponents.has(field.getKey())) {
                                LOGGER.error("flow [{}] already has using this flow step resource: {}", flowstreamid, field.getKey());
                                continue;
                            }
                            
                            try {
                                //TODO: update X and Y positions of new design components                                
                                if (aComponent.has("x") && aComponent.has("y") ) {
                                    String xValue = aComponent.get("x").asText();
                                    String yValue = aComponent.get("y").asText();
                                    if (xValue != null && yValue != null) {
                                        // update component x and y positions to be relative to flow grid tile
                                        Double xValueD = Double.parseDouble(xValue) + flowGridTile.innerX;
                                        Double yValueD = Double.parseDouble(yValue) + flowGridTile.innerY;
                                        aComponent.set("x", JsonNodeFactory.instance.numberNode(xValueD));
                                        aComponent.set("y", JsonNodeFactory.instance.numberNode(yValueD));
                                    }
                                }
                            } catch (Exception e) {
                                LOGGER.error("error parsing flow item design: {}", e.getMessage());
                                e.printStackTrace();
                            }

                            //add to new design components
                            newDesignComponents.set(field.getKey(), (JsonNode)aComponent);

                        }
                         
                        //add group under new design components
                        if (newDesignComponentsGroups != null) {
                            int groupOffset = flowGridTiles.tilePadding.intValue() / 2;
                            HashMap<String, Object> flowGroup = new HashMap<String, Object>(){{
                                put("id", "group"+flowId);
                                put("x", flowGridTile.boundaryX.intValue() + groupOffset);
                                put("y", flowGridTile.boundaryY.intValue() + groupOffset);
                                put("width", flowGridTile.boundaryWidth.intValue() - groupOffset);
                                put("height", flowGridTile.boundaryHeight.intValue() - groupOffset);
                            }};

                            flowGroup.put("name", flowTitle);

                            // add new group
                            newDesignComponentsGroups.add(mapper.valueToTree(flowGroup));
                            //TODO: add groups around new design components
                            // "groups": [
                            //     {
                            //         "id": "gldh7c51h",
                            //         "x": 24,
                            //         "y": 21,
                            //         "width": 1038,
                            //         "height": 288,
                            //         "name": "Read message from TMS",
                            //         "background": "rgba(97,200,59,0.3)"
                            //     },
                        }

                    } catch (Exception e) {
                        LOGGER.error("error parsing design template: {}", e.getMessage());
                        e.printStackTrace();
                        return;
                    }
            


                }
            }
            
            try {
                // add new design groups into new design
                newDesignComponents.set("groups", (JsonNode)newDesignComponentsGroups);

                // once all new design components are added, update flow design
                String newDesignComponentsString = mapper.writeValueAsString(newDesignComponents);
                            
                // update flow
                doFlowStreamDesignSaveData(newDesignComponentsString, flowstreamid);

            } catch (Exception e) {
                LOGGER.error("could not update flow, error parsing design template: {}", e.getMessage());
                e.printStackTrace();
                return;
            }

        }
    }


    /**
     * get sample.json from resource path
     * @param resource resource to get sample.json from
     * @param resourceResolver resource resolver
     */
    public String getComponentSampleJson(String samplePath, @NotNull Resource resource, @NotNull ResourceResolver resourceResolver) {
        if (samplePath == null || samplePath.isEmpty()) {
            return "";
        }
        Resource sampleResource = resourceResolver.getResource(samplePath);
        if (ResourceUtil.isNonExistingResource(sampleResource) || !sampleResource.isResourceType("nt:file")) {
            LOGGER.error("sample data not found: {}", samplePath );
            return "";
        }
        String sampleJson = getResourceInputStreamAsString(samplePath, resourceResolver);
        return sampleJson;
    }


    public String formatResourcePathToId(String path) {
        //regex replace all non word characters
        return path.replaceAll("[^\\w]", "").replaceAll("[_-]", "");
    }

    /**
     * walk the container and find all flow resources
     * @param templatePath template path in repository to use as a template
     * @param resourceResolver resource resolver
     * @return json tree
     */
    public List<Resource> findContainerFlowResources(Resource containerResource, List<Resource> flowResources) {
        if (containerResource == null) {
            return null;
        }
        Iterator<Resource> children = containerResource.listChildren();
        while (children.hasNext()) {
            Resource child = children.next();
            if (isFlowEnabledResource(child)) {
                flowResources.add(child);
            }
            findContainerFlowResources(child, flowResources);
        }
        return flowResources;
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
    public String getResourceInputStreamAsString(String resourcePath, ResourceResolver resourceResolver) {
        try {
            InputStream inputStream = getResourceInputStream(resourcePath, resourceResolver);
            if (inputStream == null) {
                return StringUtils.EMPTY;
            }
            return  IOUtils.toString(inputStream, "UTF-8");
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return StringUtils.EMPTY;
    }
    
    //read the json file from a template and convert it to JSON Tree
    @SuppressWarnings("unchecked")
    public InputStream getResourceInputStream(String resourcePath, ResourceResolver resourceResolver) {
        try {
            Resource resource = resourceResolver.getResource(resourcePath);
            if (ResourceUtil.isNonExistingResource(resource) == false) {
                return resource.adaptTo(InputStream.class);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null;
    }
    
    //read the json file from a template and convert it to JSON Tree
    @SuppressWarnings("unchecked")
    public JsonNode toJsonNode(String jsonContent) {
        try {
            ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
            return mapper.readTree(jsonContent);
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null;
    }
        

    //read the json file from a template and convert it to JSON Tree
    @SuppressWarnings("unchecked")
    public JsonNode getTemplateTree(String templatePath, ResourceResolver resourceResolver) {
        try {
            InputStream inputStream = getResourceInputStream(templatePath, resourceResolver);
            if (inputStream == null) {
                return null;
            }
            ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
            return mapper.readTree(inputStream);
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null;
    }
    
    /**
     * check if resource is a flow enabled component
     * @param resource
     * @return
     */
    public boolean isFlowEnabledResource(Resource resource) {
        if (resource == null) {
            return false;
        }

        boolean isComponentFlowEnabled = false;
        ValueMap properties = resource.getValueMap();
        String slingResourceType = properties.get(SLING_RESOURCE_TYPE_PROPERTY, "");

        if (flowComponentRegistry != null) {
            List<String> list = flowComponentRegistry.getComponents(FLOW_SPI_KEY);
            isComponentFlowEnabled = list.contains(slingResourceType);
        }
        
        return isComponentFlowEnabled;
    }

    public class GridTitles {
        public LinkedHashMap<String, GridTile> tiles = new LinkedHashMap<String, GridTile>();
        public Double tileWidth = 1000D;
        public Double tileHeight = 500D;
        public Double currentX = 0D;
        public Double currentY = 0D;
        public Double tileMargin = 50D; // margin between tiles
        public Double tilePadding = 50D; // padding inside tile
        public int columns = 3;

        GridTitles(int columns, Double tileWidth, Double tileHeight, Double tileMargin, Double tilePadding) {
            this.columns = columns;
            this.tileWidth = tileWidth;
            this.tileHeight = tileHeight;
            this.tileMargin = tileMargin;
            this.tilePadding = tilePadding;
        }

        /**
         * add first tile to grid and update grid tile width and height
         * @param tile
         * @return
         */
        public GridTile addFirstTile(GridTile tile) {            
            if (tile.width > 0) {
                tileWidth = tile.width;
            }
            if (tile.height > 0) {
                tileHeight = tile.height;
            }
            tiles.put(tile.id, tile);
            return tiles.get(tile.id);
        }

        /**
         * add tile to grid
         */
        public GridTile nextTile(String id, String name) {

            if (tiles.size() == 0) {
                return addFirstTile(new GridTile(id, currentX, currentY, tileWidth, tileHeight, name, tilePadding));
            }

            boolean isNewRow = tiles.size() % columns == 0;

            if (isNewRow) {
                currentY += tileHeight + tileMargin;
                currentX = 0D;
            } else {
                currentX += tileWidth + tileMargin;
            }
            
            GridTile newTile = new GridTile(id, currentX, currentY, tileWidth, tileHeight, name, tilePadding);
            newTile.column = tiles.size() == 0 ? 0 : tiles.size() % columns;
            newTile.row = tiles.size() == 0 ? 0 : tiles.size() / columns;

            tiles.put(id, newTile);
            return tiles.get(id);
        }

    }

    public class GridTile {

        // tile position
        public int column;
        public int row;

        //tile coordinates
        public String id;
        public Double boundaryX = 0D; // tile grid y based on row
        public Double boundaryY = 0D; // tile grid x based on column
        public Double boundaryWidth = 0D; // tile width based on row
        public Double boundaryHeight = 0D; // tile height based on row
        public Double x = 0D; // tile x position
        public Double y = 0D; // tile y position
        public Double width = 0D; // tile width
        public Double height = 0D; // tile height
        public Double padding = 0D; // tile padding
        public String name;

        // group coordinates
        public Double innerX; // x boudnary for components
        public Double innerY; // y boudnary for components
        public Double innerHeight; // height boudnary for components
        public Double innerWidth; // width boudnary for components

        public void setX(Double x) {
            this.x = x;
            // if x is more than the width of the tile then we need to expand width
            if (x > boundaryWidth) {
                width = x + padding;
            }
        }

        public void setY(Double y) {
            this.y = y;
            // if y is more than the height of the tile then we need to expand height
            if (y > boundaryHeight) {
                height = y + padding;
            }
        }

        public void setWidth(Double width) {
            this.width = width;
            this.innerWidth = width - (padding * 2);
        }

        public void setHeight(Double height) {
            this.height = height;
            this.innerHeight = height - (padding * 2);
        }

        public GridTile(String id, String name, Double padding) {
            this.id = id;
            this.name = name;
            this.padding = padding;
        }
        
        /**
         * create a new tile with boundaries
         * @param id
         * @param boundaryX x position of the tile
         * @param boundaryY y position of the tile
         * @param boundaryWidth initial width of the tile
         * @param boundaryHeight initial height of the tile
         * @param name name of the tile
         * @param padding how much padding to use for inner boundaries
         */
        public GridTile(String id, Double boundaryX, Double boundaryY, Double boundaryWidth, Double boundaryHeight, String name, Double padding) {
            this.id = id;
            this.name = name;
            this.padding = padding;

            // set the boundaries
            this.boundaryX = boundaryX;
            this.boundaryY = boundaryY;
            this.boundaryWidth = boundaryWidth;
            this.boundaryHeight = boundaryHeight;

            // set the inner boundaries
            this.innerX = boundaryX + padding;
            this.innerY = boundaryY + padding;
            this.innerWidth = boundaryWidth - (padding * 2);
            this.innerHeight = boundaryHeight - (padding * 2);

            // set the tile position
            this.x = boundaryX + padding;
            this.y = boundaryY + padding;
        }
        
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
        public final static String FLOW_ENDPOINT_DESIGN_SAVE = "/flow/%s/design/save";
        public final static String FLOW_ENDPOINT_DESIGN = "/flow/%s/design";
        public final static String FLOW_ENDPOINT_READ = "/flow/read/%s";
        public final static String FLOW_WS_URL = "ws://localhost:8111/flows/%s";
        public final static String FLOW_TMS_URL = "ws://localhost:8112/$tms";
        public final static String FLOW_DESIGNER_URL = "http://localhost:8111/designer/?darkmode=%s&socket=%s&components=%s";
        public final static boolean FLOW_PAGE_CHNAGE_LISTENER_ENABLE = true;
        public final static String FLOW_META_AUTHOR = "TypeRefinery.io";
        
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
                name = "Endpoint Read",
                description = "URL of the endpoint to read flow data",
                defaultValue = FLOW_ENDPOINT_READ
        )
        String endpoint_read() default FLOW_ENDPOINT_READ;

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
        String endpoint_update() default FLOW_ENDPOINT_IMPORT;

        @AttributeDefinition(
                name = "Endpoint Design Save",
                description = "URL of the endpoint to update flow designs",
                defaultValue = FLOW_ENDPOINT_DESIGN_SAVE
        )
        String endpoint_design_save() default FLOW_ENDPOINT_DESIGN_SAVE;

        @AttributeDefinition(
                name = "Endpoint Design",
                description = "URL of the endpoint to get flow design",
                defaultValue = FLOW_ENDPOINT_DESIGN
        )
        String endpoint_design() default FLOW_ENDPOINT_DESIGN;

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

        @AttributeDefinition(
            name = "Flow Message Service URL",
            description = "Flow message service url where components can connect to for data",
            defaultValue = FLOW_TMS_URL
        )
        String flow_tms_url() default FLOW_TMS_URL;

        @AttributeDefinition(
            name = "Flow Page Change Listener Enabled",
            description = "Flow Designer dark mode",
            type = AttributeType.BOOLEAN
        )
        boolean flow_page_change_listener_enabled() default FLOW_PAGE_CHNAGE_LISTENER_ENABLE;

        @AttributeDefinition(
            name = "Flow Meta - Author",
            description = "Flow author to be used in meta data"
        )
        String flow_meta_author() default FLOW_META_AUTHOR;
    }
}
