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
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.resource.observation.ResourceChange;
import org.osgi.framework.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
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
    public static final String SLING_RESOURCE_SUPER_TYPE_PROPERTY = "sling:resourceSuperType"; // org.apache.sling.jcr.resource.JcrResourceConstants , not osgi feature supported
    public static final String SLING_RESOURCE_TYPE_PROPERTY = "sling:resourceType"; // org.apache.sling.jcr.resource.JcrResourceConstants , not osgi feature supported

    public static final String FLOW_SPI_KEY = "io.typerefinery.flow.spi.extension";

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
                flowapi_flowstreamid = createFlowFromTemplate(flowapi_template, resource, flowapi_topic, flowapi_title, flowapi_designtemplate, flowapi_iscontainer);
                if (flowapi_iscontainer & StringUtils.isNotBlank(flowapi_designtemplate)) {
                    updateFlowDesignFromTemplate(flowapi_designtemplate, resource, authored_title, flowapi_flowstreamid);
                }
                isFlowExists = isFlowExists(flowapi_flowstreamid);
            } else if (isFlowExists && isTemplateExists) {

                // if flowapi_title and title are different then update flowstream
                if (flowapi_title.equals(authored_title) || StringUtils.isBlank(authored_title)) {
                    LOGGER.info("nothing to update.");
                    return;
                } else {
                    updateFlowFromTemplate(flowapi_template, resource, authored_title, flowapi_flowstreamid);
                    if (flowapi_iscontainer & StringUtils.isNotBlank(flowapi_designtemplate)) {
                        updateFlowDesignFromTemplate(flowapi_designtemplate, resource, authored_title, flowapi_flowstreamid);
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
    public String getFlowStreamDesignData(String flowstreamid) {

        String url = getFlowStreamDesignAPIURL(flowstreamid);
        
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
     * @param isContainer if true then create a flow container
     */
    public String createFlowFromTemplate(String templatePath, Resource componentResource, String topic, String title, String designTemplatePath, boolean isContainer) {

        // generate a title if its not specified
        if (StringUtils.isBlank(title)) {
            title = componentResource.getName() + " flow";
        }
        
        ResourceResolver resourceResolver = componentResource.getResourceResolver();

        // get template json
        JsonNode componentTemplate = getTemplateTree(templatePath, resourceResolver);

        String currentPagePath = PageUtil.getResourcePagePath(componentResource);
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
    public void updateFlowFromTemplate(String templatePath, Resource componentResource, String newTitle, String flowstreamid) {
        
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

        LOGGER.info("flowstreamdata: {}", response);

        // update component with response
        PageUtil.updatResourceProperties(componentResource, response);
    }


    /**
     * update flow from template
     * @param templatePath template path in repository to use as a template
     * @param componentResource resource of the component which to update with outcome of api call
     * @param newTitle new title to use for the flow
     * @param flowstreamid flowstream id to update
     * @param isContainer if true then create a flow container
     */
    public void updateFlowDesignFromTemplate(String designTemplate, Resource componentResource, String newTitle, String flowstreamid) {
        
        ResourceResolver resourceResolver = componentResource.getResourceResolver();

        String parentPath = componentResource.getPath();
        // update flow design with child flows
        List<Resource> flowResources = findContainerFlowResources(componentResource, new ArrayList<Resource>());
        // new design components
        ObjectNode newDesignComponents = JsonNodeFactory.instance.objectNode();

        if (flowResources != null) {

            ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

            // get current flow design
            String flowDesign = getFlowStreamDesignData(flowstreamid);
            JsonNode currentDesign = null;
            try {
                currentDesign = mapper.readTree(flowDesign);
            } catch (Exception e) {
                LOGGER.error("error parsing flow current design: {}", e.getMessage());
            }

            for (Resource flowResource : flowResources) {

                String flowId = flowResource.getValueMap().get(PROPERTY_FLOWSTREAMID, String.class);
                if (StringUtils.isNotBlank(flowId)) {


                    // get template json
                    // JsonNode componentTemplate = getTemplateTree(designTemplate, resourceResolver);
                    String designTemplateString = getResourceInputStreamAsString(designTemplate, resourceResolver);

                    if (StringUtils.isBlank(designTemplateString)) {
                        LOGGER.error("design template not found: {}", designTemplate);
                        return;
                    }

                    // get path to child flow relative to parent
                    String childPath = formatResourcePathToId(flowResource.getPath().replace(parentPath, ""));

                    // setup a list of replace strings
                    HashMap<String, String> replaceMap = new HashMap<String, String>(){{
                        put("<flowid>", flowstreamid);
                        put("<subscribe-id>", StringUtils.join(childPath, "subscribe"));
                        put("<printjson-id>", StringUtils.join(childPath, "printjson"));
                        put("<senddata-id>", StringUtils.join(childPath, "senddata"));
                        put("<publish-id>", StringUtils.join(childPath, "publish"));

                    }};

                    boolean flowIsUsed = false;
                    // check if any replacemap nodes existing in current design
                    if (currentDesign != null) {
                        for (Map.Entry<String, String> entry : replaceMap.entrySet()) {
                            if (currentDesign.has(entry.getValue())) {
                                flowIsUsed = true;
                                JsonNode components = currentDesign.get(entry.getValue());
                                newDesignComponents.set(flowId, components.get(flowId));        
                                LOGGER.error("flow [{}] already has using this flow step resource: {}", flowstreamid, entry.getValue());
                            }
                        }
                    }
                    
                    // if steps already exists do nothing and continue
                    if (flowIsUsed) {
                        LOGGER.error("flow [{}] already has using this flow resource: {}", flowstreamid, flowResource.getPath());
                        continue;
                    }

                    // get resource component sample data
                    String componentSampleData = getComponentSampleJson(flowResource, resourceResolver);
                    if (StringUtils.isBlank(componentSampleData)) {
                        LOGGER.error("sample data not found for flow: {}", flowResource.getPath());
                        replaceMap.put("<sample-data>", "");
                    } else {
                        
                        try {
                            JsonNode componentSampleDataJson = mapper.readTree(designTemplateString);
                            // update sample data
                            //<sample-data>
                            replaceMap.put("<sample-data>", mapper.writeValueAsString(componentSampleDataJson));
                        } catch (Exception e) {
                            LOGGER.error("error parsing design template: {}", e.getMessage());
                            return;
                        }
                    }

                    //replace values in design
                    for (Map.Entry<String, String> entry : replaceMap.entrySet()) {
                        designTemplateString = designTemplateString.replaceAll(entry.getKey(), entry.getValue());
                    }

                    // add new design steps to flow design
                    try {
                        JsonNode newDesign = mapper.readTree(designTemplateString);
                        // add to desing
                        newDesignComponents.set(flowId, newDesign);
                    } catch (Exception e) {
                        LOGGER.error("error parsing design template: {}", e.getMessage());
                        return;
                    }
                }
            }
            
            
            
            //update flow
            // ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
            // String newDesignComponentsString = mapper.writeValueAsString(newDesignComponents);
            // doFlowStreamDesignSaveData(newDesignComponentsString, flowstreamid);
        }
    }


    /**
     * get sample.json from resource path
     * @param resource resource to get sample.json from
     * @param resourceResolver resource resolver
     */
    public String getComponentSampleJson(Resource resource, ResourceResolver resourceResolver) {
        pl.ds.websight.components.core.api.Component resourceComponent = resource.adaptTo(pl.ds.websight.components.core.api.Component.class);
        
        String samplePath = resourceComponent.getPath() + "/sample.json";
        if (!resourceResolver.getResource(samplePath).isResourceType("nt:file")) {
            return "";
        }
        String sampleJson = getResourceInputStreamAsString(samplePath, resourceResolver);
        return sampleJson;
    }


    public String formatResourcePathToId(String path) {
        //regex replace all non word characters
        return path.replaceAll("[^\\w]", "");
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
