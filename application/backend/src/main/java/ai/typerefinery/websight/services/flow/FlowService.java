package ai.typerefinery.websight.services.flow;

import java.io.IOException;
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
import org.apache.jackrabbit.JcrConstants;
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
import com.fasterxml.jackson.databind.node.BooleanNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.net.UrlEscapers;

import ai.typerefinery.websight.models.components.FlowComponent;
import ai.typerefinery.websight.services.flow.registry.FlowComponentRegistry;
import ai.typerefinery.websight.utils.DateUtil;
import ai.typerefinery.websight.utils.JsonUtil;
import ai.typerefinery.websight.utils.PageUtil;
import ai.typerefinery.websight.utils.SlingConstants;

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

    public static final String RESOURCE_TYPE = "typerefinery/components/flow/flowcontainer";
    private static final String TAG = FlowService.class.getSimpleName();
    private static final Logger LOGGER = LoggerFactory.getLogger(FlowService.class);
    public static final String PROPERTY_PREFIX = "flowapi_";
    public static final String PROPERTY_FLOWSTREAMID = "flowstreamid";
    public static final String PROPERTY_ID = "id";
    public static final String PROPERTY_TOPIC = "topic";
    public static final String PROPERTY_AUTHOR = "author";
    public static final String PROPERTY_NAME = "name";
    public static final String PROPERTY_ERROR = "error";
    public static final String PROPERTY_SUCCESS = "success";
    public static final String PROPERTY_RESPONSE = "response";
    public static final String PROPERTY_GROUP = "group";
    public static final String PROPERTY_REFERENCE = "reference";
    public static final String PROPERTY_TITLE = "title";
    public static final String PROPERTY_ICON = "icon";
    public static final String PROPERTY_COLOR = "color";
    public static final String PROPERTY_VERSION = "version";
    public static final String PROPERTY_CREATEDON = "createdon";
    public static final String PROPERTY_UPDATEDON = "updatedon";
    public static final String PROPERTY_EDITURL = "editurl";
    public static final String PROPERTY_ENABLE = "enable";
    public static final String PROPERTY_TEMPLATE = "template";
    public static final String PROPERTY_TEMPLATE_DESIGN = "designtemplate";
    public static final String PROPERTY_ISCONTAINER = "iscontainer";
    public static final String PROPERTY_HTTPROUTE = "httproute";
    public static final String PROPERTY_HTTPROUTE_NOSFX = "httproutenosfx";
    public static final String PROPERTY_WEBSOCKETURL = "websocketurl";
    public static final String PROPERTY_SAMPLEDATA = "sampledata"; // path to json to be used to seed flow with sample data
    public static final String PROPERTY_README = "readme";
    public static final String PROPERTY_PAUSED = "paused";

    public static final String FLOW_COMPONENT_SAMPLE_DATA_FILE_PATH = "templates/flowsample.json";
    public static final String FLOW_SPI_KEY = "ai.typerefinery.flow.spi.extension";
    public static final String FLOW_SPI_KEY_IGNORE_PREFIX = "/apps/"; // remove this prefix from sling resource type so that it can be used to match againt flow spi key registered by a model

    public static final String FLOW_TEMPLATE_FIELD_SAMPLE_DATA = "<sample-data>"; // used to add sample data into send component
    public static final String FLOW_TEMPLATE_FIELD_CHILD_FLOWID = "<childflowid>"; // used to specify which child flow to be used
    public static final String FLOW_TEMPLATE_FIELD_PARENT_FLOWID = "<parentflowid>"; // used to specify which parent flow to be used
    public static final String FLOW_TEMPLATE_FIELD_SUBSCRIBE_ID = "<subscribe-id>"; // flow step subscribe id, updates subscribe step in a flow
    public static final String FLOW_TEMPLATE_FIELD_PRINTJSON_ID = "<printjson-id>"; // flow step printjson id, updates printjson step in a flow
    public static final String FLOW_TEMPLATE_FIELD_SENDDATA_ID = "<senddata-id>"; // flow step senddata id, updates senddata step in a flow, eg send to TMS
    public static final String FLOW_TEMPLATE_FIELD_PUBLISH_ID = "<publish-id>"; // flow step publish id, updates publish step in a flow
    public static final String FLOW_TEMPLATE_FIELD_TMS_TOPIC = "<tms-topic>"; // flow step tms topic, used for filtering and wrapping payloads for TMS Payload messages

    public static final String FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL = "<http-route-url>"; // used to specify which http route flow will use if any, eg form get url to be used /form/* will be updated to the {page URL}/*
    public static final String FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_SUFFIX = "/{{id}}"; // used to prefix http route url, eg form get url to be used /form/{{id}} will be updated to the {page URL}/{{id}}, this will allow client to substitiute the id in the url
    public static final String FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_NOSFX = "<http-route-url-nosfx>"; // used to specify which http route flow will use if any, will be url without suffix
    public static final String FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_NOSFX_VALUE = "/*"; // used to specify which http route flow will use if any, will be url without suffix

    public static final String FLOW_DEFAULT_TITLE_SUFFIX = " flow"; // used to generate flow title if not specified, flow title will be {page title} flow

    public FlowServiceConfiguration configuration;

    @Reference
    private FlowComponentRegistry flowComponentRegistry;

    // create http client
    protected static HttpClient client;
    public static final int HTTP_CLIENT_RETRY_COUNT = 10; // how many times to retry sending payload
    public static final int HTTP_CLIENT_RETRY_SLEEP = 1000; // how long to sleep between retries


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

    public String getFlowStreamPauseAPIURL(String flowstreamid, boolean pauseRequested) {
        String pauseFlag = pauseRequested ? "1" : "0";
        String url = String.format(configuration.host_url_client() + configuration.endpoint_streams_pause(), flowstreamid, pauseFlag);
        return url;
    }

    public String getFlowStreamSaveAPIURL(String flowstreamid) {
        String url = String.format(configuration.host_url_client() + configuration.endpoint_streams_save(), flowstreamid);
        return url;
    }

    public boolean doProcessFlowResource(@NotNull Resource resource, @NotNull ResourceChange.ChangeType changeType) {
        ResourceResolver resourceResolver = resource.getResourceResolver();
        if (ResourceUtil.isNonExistingResource(resource) && resourceResolver == null) {
            LOGGER.error("doProcessFlowResource: Resource is non-existing or resolver is null. path={}, changeType={}", 
                resource != null ? resource.getPath() : "null", changeType);
            return false;
        }
        String resourcePath = resource.getPath();
        
        LOGGER.error("doProcessFlowResource: Processing resource. path={}, changeType={}", resourcePath, changeType);
        
        FlowComponent flowComponent = resource.adaptTo(FlowComponent.class);
        if (flowComponent == null) {
            LOGGER.error("doProcessFlowResource: Could not adapt resource to FlowComponent. path={}", resourcePath);
            return false;
        }

        boolean flowapiEnable = Boolean.TRUE.equals(flowComponent.flowapi_enable);
        String flowapiTemplate = flowComponent.flowapi_template;
        String flowapiFlowstreamid = flowComponent.flowapi_flowstreamid;

        LOGGER.error("doProcessFlowResource: Flow component state. path={}, flowapi_enable={}, flowapi_template={}, flowapi_flowstreamid={}", 
            resourcePath, flowapiEnable, flowapiTemplate, flowapiFlowstreamid);

        if (!flowapiEnable) {
            LOGGER.error("doProcessFlowResource: Flow is disabled. Attempting to pause flow. path={}, flowstreamid={}", 
                resourcePath, flowapiFlowstreamid);
            if (StringUtils.isNotBlank(flowapiFlowstreamid)) {
                boolean pauseResult = processPauseChange(resource, flowapiFlowstreamid, true);
                LOGGER.error("doProcessFlowResource: Pause result. path={}, flowstreamid={}, pauseResult={}", 
                    resourcePath, flowapiFlowstreamid, pauseResult);
            } else {
                LOGGER.error("doProcessFlowResource: Flow is disabled but no flowstreamid exists. path={}", resourcePath);
            }
            return true;
        }

        if (StringUtils.isBlank(flowapiTemplate)) {
            LOGGER.error("doProcessFlowResource: Flow is enabled but template is blank. path={}, flowapi_enable={}", 
                resourcePath, flowapiEnable);
            return false;
        }

        boolean templateExists = PageUtil.isResourceExists(flowapiTemplate, resourceResolver);
        if (!templateExists) {
            LOGGER.error("doProcessFlowResource: Flow is enabled but template does not exist. path={}, template={}", 
                resourcePath, flowapiTemplate);
            return false;
        }

        LOGGER.error("doProcessFlowResource: Template exists. path={}, template={}", resourcePath, flowapiTemplate);

        boolean hasStoredFlowId = StringUtils.isNotBlank(flowComponent.flowapi_flowstreamid);
        boolean flowExists = false;
        if (hasStoredFlowId) {
            LOGGER.error("doProcessFlowResource: Checking if flow exists remotely. path={}, flowstreamid={}", 
                resourcePath, flowComponent.flowapi_flowstreamid);
            try {
                flowExists = isFlowExists(flowComponent.flowapi_flowstreamid);
                LOGGER.error("doProcessFlowResource: Flow existence check result. path={}, flowstreamid={}, exists={}", 
                    resourcePath, flowComponent.flowapi_flowstreamid, flowExists);
            } catch (Exception exception) {
                LOGGER.error("doProcessFlowResource: Exception checking flow existence. path={}, flowstreamid={}, error={}", 
                    resourcePath, flowComponent.flowapi_flowstreamid, exception.getMessage(), exception);
                flowExists = true; // Assume exists on error to avoid recreation
            }
        } else {
            LOGGER.error("doProcessFlowResource: No stored flow ID. Will create new flow. path={}", resourcePath);
        }

        if (!hasStoredFlowId) {
            LOGGER.error("doProcessFlowResource: Creating new flow from template. path={}, template={}", 
                resourcePath, flowapiTemplate);
            String newFlowId = createFlowFromTemplate(flowComponent);
            if (StringUtils.isNotBlank(newFlowId)) {
                LOGGER.error("doProcessFlowResource: Flow created successfully. path={}, newFlowId={}", 
                    resourcePath, newFlowId);
                Resource updatedResource = resourceResolver.getResource(resourcePath);
                if (updatedResource != null) {
                    FlowComponent updatedComponent = updatedResource.adaptTo(FlowComponent.class);
                    boolean unpauseResult = processPauseChange(updatedResource, newFlowId, false);
                    LOGGER.error("doProcessFlowResource: Unpause after creation. path={}, flowstreamid={}, unpauseResult={}", 
                        resourcePath, newFlowId, unpauseResult);
                    if (updatedComponent != null && updatedComponent.isContainer() && StringUtils.isNotBlank(updatedComponent.flowapi_designtemplate)) {
                        LOGGER.error("doProcessFlowResource: Updating flow design from template. path={}, flowstreamid={}", 
                            resourcePath, newFlowId);
                        updateFlowDesignFromTemplate(updatedComponent);
                    }
                } else {
                    LOGGER.error("doProcessFlowResource: Could not get updated resource after flow creation. path={}, newFlowId={}", 
                        resourcePath, newFlowId);
                }
            } else {
                LOGGER.error("doProcessFlowResource: Failed to create flow from template. path={}, template={}", 
                    resourcePath, flowapiTemplate);
            }
            return true;
        }

        LOGGER.error("doProcessFlowResource: Flow ID exists, ensuring flow is unpaused. path={}, flowstreamid={}", 
            resourcePath, flowComponent.flowapi_flowstreamid);
        boolean unpauseResult = processPauseChange(resource, flowComponent.flowapi_flowstreamid, false);
        LOGGER.error("doProcessFlowResource: Unpause result. path={}, flowstreamid={}, unpauseResult={}", 
            resourcePath, flowComponent.flowapi_flowstreamid, unpauseResult);

        if (!flowExists) {
            LOGGER.error("doProcessFlowResource: Flow ID stored but remote flow not found. Recreating. path={}, flowstreamid={}", 
                resourcePath, flowComponent.flowapi_flowstreamid);
            String newFlowId = createFlowFromTemplate(flowComponent);
            if (StringUtils.isNotBlank(newFlowId)) {
                LOGGER.error("doProcessFlowResource: Flow recreated successfully. path={}, oldFlowId={}, newFlowId={}", 
                    resourcePath, flowComponent.flowapi_flowstreamid, newFlowId);
                Resource updatedResource = resourceResolver.getResource(resourcePath);
                if (updatedResource != null) {
                    FlowComponent updatedComponent = updatedResource.adaptTo(FlowComponent.class);
                    boolean unpauseResult2 = processPauseChange(updatedResource, newFlowId, false);
                    LOGGER.error("doProcessFlowResource: Unpause after recreation. path={}, flowstreamid={}, unpauseResult={}", 
                        resourcePath, newFlowId, unpauseResult2);
                    if (updatedComponent != null && updatedComponent.isContainer() && StringUtils.isNotBlank(updatedComponent.flowapi_designtemplate)) {
                        updateFlowDesignFromTemplate(updatedComponent);
                    }
                }
            } else {
                LOGGER.error("doProcessFlowResource: Failed to recreate flow from template. path={}, template={}", 
                    resourcePath, flowapiTemplate);
            }
            return true;
        }

        // Check if metadata has actually changed by comparing with Flow service
        LOGGER.error("doProcessFlowResource: Checking metadata changes. path={}, flowstreamid={}", 
            resourcePath, flowComponent.flowapi_flowstreamid);
        boolean metadataChanged = hasMetadataChanged(flowComponent, flowComponent.flowapi_flowstreamid);
        LOGGER.error("doProcessFlowResource: Metadata change check result. path={}, flowstreamid={}, metadataChanged={}", 
            resourcePath, flowComponent.flowapi_flowstreamid, metadataChanged);
        
        if (!metadataChanged) {
            LOGGER.error("doProcessFlowResource: No metadata changes detected, skipping update. path={}, flowstreamid={}", 
                resourcePath, flowComponent.flowapi_flowstreamid);
            return true;
        }

        LOGGER.error("doProcessFlowResource: Metadata changes detected, updating flow. path={}, flowstreamid={}", 
            resourcePath, flowComponent.flowapi_flowstreamid);
        updateFlowFromTemplate(flowComponent);
        FlowComponent refreshedComponent = resourceResolver.getResource(resourcePath).adaptTo(FlowComponent.class);
        if (refreshedComponent != null && refreshedComponent.isContainer() && StringUtils.isNotBlank(refreshedComponent.flowapi_designtemplate)) {
            LOGGER.error("doProcessFlowResource: Updating flow design after metadata update. path={}, flowstreamid={}", 
                resourcePath, flowComponent.flowapi_flowstreamid);
            updateFlowDesignFromTemplate(refreshedComponent);
        }

        return true; // pass ok to running job     
    }

    protected HttpResponse<String> executeFlowPauseRequest(HttpRequest request) throws IOException, InterruptedException {
        return sendRequestWithRetry(request, client, HttpResponse.BodyHandlers.ofString());
    }

    public FlowPauseResult toggleFlowStreamPause(@NotNull String flowstreamid, boolean pauseRequested) {
        if (StringUtils.isBlank(flowstreamid)) {
            throw new IllegalArgumentException("flowstreamid must not be blank when toggling pause state.");
        }

        String url = getFlowStreamPauseAPIURL(flowstreamid, pauseRequested);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .POST(HttpRequest.BodyPublishers.noBody())
            .build();

        try {
            HttpResponse<String> response = executeFlowPauseRequest(request);
            int statusCode = response.statusCode();
            if (statusCode >= 200 && statusCode < 300) {
                LOGGER.info("Flow pause state updated successfully for {}, pauseRequested={}, status={}", flowstreamid, pauseRequested, statusCode);
                return FlowPauseResult.success(statusCode, pauseRequested);
            }
            String body = response.body();
            LOGGER.error("Flow pause state update failed for {}, pauseRequested={}, status={}, body={}", flowstreamid, pauseRequested, statusCode, body);
            return FlowPauseResult.failure(statusCode, pauseRequested, body);
        } catch (IOException ioException) {
            LOGGER.error("Flow pause request failed for {}, pauseRequested={} due to IO error: {}", flowstreamid, pauseRequested, ioException.getMessage());
            return FlowPauseResult.failure(0, pauseRequested, ioException.getMessage());
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            LOGGER.error("Flow pause request interrupted for {}, pauseRequested={}: {}", flowstreamid, pauseRequested, interruptedException.getMessage());
            return FlowPauseResult.failure(0, pauseRequested, interruptedException.getMessage());
        }
    }

    /**
     * Save metadata to Flow service using /fapi/stream_save/{flowstreamid}
     * @param metadata Flow metadata to save
     * @param flowstreamid Flow stream ID
     * @return true if successful, false otherwise
     */
    public boolean saveMetadataToFlow(FlowComponentMetadata metadata, String flowstreamid) {
        if (metadata == null || StringUtils.isBlank(flowstreamid)) {
            LOGGER.error("Cannot save metadata to Flow: metadata or flowstreamid is null/blank. flowstreamid={}", flowstreamid);
            return false;
        }

        LOGGER.info("Saving metadata to Flow for flowstreamid={}, name={}, group={}, author={}", 
            flowstreamid, metadata.getName(), metadata.getGroup(), metadata.getAuthor());

        try {
            ObjectMapper mapper = new ObjectMapper();
            ObjectNode metadataJson = mapper.createObjectNode();
            
            // Required fields
            metadataJson.put(PROPERTY_GROUP, metadata.getGroup());
            metadataJson.put(PROPERTY_NAME, metadata.getName());
            metadataJson.put(PROPERTY_AUTHOR, metadata.getAuthor());
            
            // Optional fields (only include if not null)
            if (metadata.getReference() != null) {
                metadataJson.put(PROPERTY_REFERENCE, metadata.getReference());
                LOGGER.debug("Including reference in metadata: {}", metadata.getReference());
            }
            if (metadata.getIcon() != null) {
                metadataJson.put(PROPERTY_ICON, metadata.getIcon());
                LOGGER.debug("Including icon in metadata: {}", metadata.getIcon());
            }
            if (metadata.getColor() != null) {
                metadataJson.put(PROPERTY_COLOR, metadata.getColor());
                LOGGER.debug("Including color in metadata: {}", metadata.getColor());
            }
            if (metadata.getVersion() != null) {
                metadataJson.put(PROPERTY_VERSION, metadata.getVersion());
                LOGGER.debug("Including version in metadata: {}", metadata.getVersion());
            }
            if (metadata.getReadme() != null) {
                metadataJson.put(PROPERTY_README, metadata.getReadme());
                LOGGER.debug("Including readme in metadata (length={})", metadata.getReadme().length());
            }

            String metadataJsonString = mapper.writeValueAsString(metadataJson);
            LOGGER.info("Metadata JSON to save: {}", metadataJsonString);

            String url = getFlowStreamSaveAPIURL(flowstreamid);
            LOGGER.info("POSTing metadata to Flow API: {}", url);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(metadataJsonString))
                .build();

            HttpResponse<String> response = sendRequestWithRetry(request, client, HttpResponse.BodyHandlers.ofString());
            int statusCode = response.statusCode();

            if (statusCode >= 200 && statusCode < 300) {
                LOGGER.info("Metadata saved successfully to Flow for flowstreamid={}, status={}, response={}", 
                    flowstreamid, statusCode, response.body());
                return true;
            } else {
                LOGGER.error("Failed to save metadata to Flow for flowstreamid={}, status={}, response={}", 
                    flowstreamid, statusCode, response.body());
                return false;
            }
        } catch (Exception e) {
            LOGGER.error("Error saving metadata to Flow for flowstreamid={}: {}", flowstreamid, e.getMessage(), e);
            return false;
        }
    }

    private boolean processPauseChange(Resource resource, String flowstreamid, boolean pauseRequested) {
        if (resource == null) {
            LOGGER.error("processPauseChange: Resource is null. flowstreamid={}, pauseRequested={}", 
                flowstreamid, pauseRequested);
            return false;
        }
        if (StringUtils.isBlank(flowstreamid)) {
            LOGGER.error("processPauseChange: Flowstreamid is blank. resource={}, pauseRequested={}", 
                resource.getPath(), pauseRequested);
            return false;
        }
        
        String resourcePath = resource.getPath();
        LOGGER.error("processPauseChange: Starting pause change. resource={}, flowstreamid={}, pauseRequested={}", 
            resourcePath, flowstreamid, pauseRequested);
        
        FlowPauseResult pauseResult = toggleFlowStreamPause(flowstreamid, pauseRequested);
        if (!pauseResult.isSuccess()) {
            LOGGER.error("processPauseChange: Failed to update pause state. resource={}, flowstreamid={}, pauseRequested={}, status={}, message={}", 
                resourcePath, flowstreamid, pauseRequested, pauseResult.getStatusCode(), pauseResult.getMessage());
            return false;
        }
        
        LOGGER.error("processPauseChange: Pause state updated successfully. resource={}, flowstreamid={}, pauseRequested={}", 
            resourcePath, flowstreamid, pauseRequested);
        
        persistPauseState(resource, pauseRequested);
        LOGGER.error("processPauseChange: Pause state persisted to resource. resource={}, flowstreamid={}, pauseRequested={}", 
            resourcePath, flowstreamid, pauseRequested);
        
        return true;
    }

    private void persistPauseState(Resource resource, boolean pauseRequested) {
        HashMap<String, Object> props = new HashMap<String, Object>();
        props.put(prop(PROPERTY_PAUSED), pauseRequested);
        PageUtil.updatResourceProperties(resource, props);
    }

    /**
     * Check if flow metadata has changed by comparing local metadata with Flow service metadata
     * @param flowComponent Local flow component with metadata
     * @param flowstreamid Flow stream ID
     * @return true if metadata has changed, false if it's the same
     */
    private boolean hasMetadataChanged(@NotNull FlowComponent flowComponent, String flowstreamid) {
        if (StringUtils.isBlank(flowstreamid)) {
            LOGGER.error("Cannot check metadata changes: flowstreamid is blank");
            return true; // Assume changed if we can't check
        }

        try {
            // Get current metadata from Flow service
            String exportData = getFlowStreamExportData(flowstreamid);
            if (StringUtils.isBlank(exportData)) {
                LOGGER.error("Cannot check metadata changes: could not get flow data from Flow service for flowstreamid={}", flowstreamid);
                return true; // Assume changed if we can't get Flow data
            }

            ObjectMapper mapper = new ObjectMapper();
            // Parse outer JSON response: {"success": true, "value": "..."}
            JsonNode responseNode = mapper.readTree(exportData);
            
            // Extract the "value" field which contains the actual flow data as a JSON string
            if (!responseNode.has("value") || !responseNode.get("value").isTextual()) {
                LOGGER.error("Cannot check metadata changes: export response does not contain 'value' field or it's not a string for flowstreamid={}", flowstreamid);
                return true; // Assume changed if we can't parse
            }
            
            String valueJsonString = responseNode.get("value").asText();
            if (StringUtils.isBlank(valueJsonString)) {
                LOGGER.error("Cannot check metadata changes: 'value' field is empty for flowstreamid={}", flowstreamid);
                return true; // Assume changed if we can't parse
            }
            
            // Parse the inner JSON string to get the actual flow data
            JsonNode flowData = mapper.readTree(valueJsonString);
            
            // Extract metadata from Flow service
            String flowGroup = flowData.has(PROPERTY_GROUP) ? flowData.get(PROPERTY_GROUP).asText() : null;
            String flowName = flowData.has(PROPERTY_NAME) ? flowData.get(PROPERTY_NAME).asText() : null;
            String flowAuthor = flowData.has(PROPERTY_AUTHOR) ? flowData.get(PROPERTY_AUTHOR).asText() : null;
            String flowReference = flowData.has(PROPERTY_REFERENCE) ? flowData.get(PROPERTY_REFERENCE).asText() : null;
            String flowIcon = flowData.has(PROPERTY_ICON) ? flowData.get(PROPERTY_ICON).asText() : null;
            String flowColor = flowData.has(PROPERTY_COLOR) ? flowData.get(PROPERTY_COLOR).asText() : null;
            String flowVersion = flowData.has(PROPERTY_VERSION) ? flowData.get(PROPERTY_VERSION).asText() : null;
            String flowReadme = flowData.has(PROPERTY_README) ? flowData.get(PROPERTY_README).asText() : null;

            // Get local metadata
            String httpRoutePath = compileHttpRoutePath(flowComponent.path);
            Resource currentFlowContainerResource = PageUtil.getResourceParentByResourceType(flowComponent.resource, RESOURCE_TYPE);
            String flowGroupLocal = httpRoutePath;
            if (currentFlowContainerResource != null) {
                String parentFlowstreamuid = currentFlowContainerResource.getValueMap().get(PROPERTY_FLOWSTREAMID, "");
                if (StringUtils.isNotBlank(parentFlowstreamuid)) {
                    HashMap<String,Object> parentMetadata = getFlowStreamData(parentFlowstreamuid);
                    flowGroupLocal = (String)parentMetadata.get(PROPERTY_GROUP);
                }
            }

            String newTitle = compileFlowTitle(flowComponent.title, flowComponent.componentTitle);
            FlowComponentMetadata localMetadata = resolveFlowComponentMetadata(flowComponent, flowGroupLocal, newTitle);

            // Compare all metadata fields
            boolean changed = false;
            if (!StringUtils.equals(flowGroup, localMetadata.getGroup())) {
                LOGGER.info("Metadata changed: group (Flow={}, Local={})", flowGroup, localMetadata.getGroup());
                changed = true;
            }
            if (!StringUtils.equals(flowName, localMetadata.getName())) {
                LOGGER.info("Metadata changed: name (Flow={}, Local={})", flowName, localMetadata.getName());
                changed = true;
            }
            if (!StringUtils.equals(flowAuthor, localMetadata.getAuthor())) {
                LOGGER.info("Metadata changed: author (Flow={}, Local={})", flowAuthor, localMetadata.getAuthor());
                changed = true;
            }
            if (!StringUtils.equals(flowReference, localMetadata.getReference())) {
                LOGGER.info("Metadata changed: reference (Flow={}, Local={})", flowReference, localMetadata.getReference());
                changed = true;
            }
            if (!StringUtils.equals(flowIcon, localMetadata.getIcon())) {
                LOGGER.info("Metadata changed: icon (Flow={}, Local={})", flowIcon, localMetadata.getIcon());
                changed = true;
            }
            if (!StringUtils.equals(flowColor, localMetadata.getColor())) {
                LOGGER.info("Metadata changed: color (Flow={}, Local={})", flowColor, localMetadata.getColor());
                changed = true;
            }
            if (!StringUtils.equals(flowVersion, localMetadata.getVersion())) {
                LOGGER.info("Metadata changed: version (Flow={}, Local={})", flowVersion, localMetadata.getVersion());
                changed = true;
            }
            if (!StringUtils.equals(flowReadme, localMetadata.getReadme())) {
                LOGGER.info("Metadata changed: readme (Flow={}, Local={})", flowReadme, localMetadata.getReadme());
                changed = true;
            }

            if (!changed) {
                LOGGER.info("No metadata changes detected for flowstreamid={}", flowstreamid);
            }
            return changed;

        } catch (Exception e) {
            LOGGER.error("Error checking metadata changes for flowstreamid={}: {}", flowstreamid, e.getMessage(), e);
            return true; // Assume changed if we can't check
        }
    }

    // function to send http request using client with retry
    /**
     * send http request using client with retry
     * @param request request to send
     * @param client http client to use
     * @return HttpResponse<String> output of the request send
     * @throws IOException error sending request
     * @throws InterruptedException
     */
    public static HttpResponse<String> sendRequestWithRetry(HttpRequest request, HttpClient client, HttpResponse.BodyHandler<String> responseBodyHandler) throws IOException, InterruptedException {
        HttpResponse<String> response = null;
        int retry = 0;
        while (retry < HTTP_CLIENT_RETRY_COUNT) {
            try {
                response = client.send(request, responseBodyHandler);
                break;
            } catch (IOException | InterruptedException e) {
                LOGGER.error("error sending request, retrying: {}", e.getMessage());
                retry++;
                Thread.sleep(HTTP_CLIENT_RETRY_SLEEP);
            }
        }
        // if we have exhausted all retries then throw exception
        if (retry == HTTP_CLIENT_RETRY_COUNT) {
            throw new IOException("error sending request, retry exhausted.");
        }
        // if response is null then throw exception
        if (response == null) {
            throw new IOException("error sending request, response is null.");
        }
        return response;
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
            HttpResponse<String> response = sendRequestWithRetry(request, client, HttpResponse.BodyHandlers.ofString());

            LOGGER.info("flowstream response: {}", response);

            String responseAsString = response.body();

            if (StringUtils.isNotBlank(responseAsString)) {
                // convert response to json
                ObjectMapper mapper = new ObjectMapper();
                JsonNode json = mapper.readTree(responseAsString);
                if (response.statusCode() != 200) {
                    LOGGER.error("flowstream could not create new flow: {}", responseAsString);
                    flowResponse.put(prop(PROPERTY_ERROR), responseAsString);
                    return flowResponse;
                }
                
                // get flowstreamid
                String flowstreamid = json.get("value").asText();
                String flowapi_editurl = compileEditUrl(flowstreamid);

                flowResponse.put(prop(PROPERTY_FLOWSTREAMID), flowstreamid);
                flowResponse.put(prop(PROPERTY_EDITURL), flowapi_editurl);
                flowResponse.put(prop(PROPERTY_SUCCESS), json.get("success").asText());
                flowResponse.put(prop(PROPERTY_ERROR), json.get("error").asText());

                return flowResponse;
            } else {
                LOGGER.error("flowstream return empty response: {}", url);
                flowResponse.put(prop(PROPERTY_ERROR), "no response");
            }
           

        } catch (Exception e) {
            LOGGER.error("flowstream could not create new flow: {}", url);
            flowResponse.put(prop(PROPERTY_ERROR), "error executing flowstream import");
            e.printStackTrace();
        }

        return flowResponse;
    }

    public static final class FlowPauseResult {
        private final boolean success;
        private final int statusCode;
        private final boolean pauseRequested;
        private final String message;

        private FlowPauseResult(boolean success, int statusCode, boolean pauseRequested, String message) {
            this.success = success;
            this.statusCode = statusCode;
            this.pauseRequested = pauseRequested;
            this.message = message;
        }

        public static FlowPauseResult success(int statusCode, boolean pauseRequested) {
            return new FlowPauseResult(true, statusCode, pauseRequested, "");
        }

        public static FlowPauseResult failure(int statusCode, boolean pauseRequested, String message) {
            return new FlowPauseResult(false, statusCode, pauseRequested, message == null ? "" : message);
        }

        public boolean isSuccess() {
            return this.success;
        }

        public int getStatusCode() {
            return this.statusCode;
        }

        public boolean isPauseRequested() {
            return this.pauseRequested;
        }

        public String getMessage() {
            return this.message;
        }
    }

    public String compileClientHttpRouteUrl(String routerPath) {
        return compileClientHttpRouteUrl(configuration, routerPath) ;
    }

    /**
     * compile client http route url, full url to which client should send request
     * @param configuration flow service configuration
     * @param routerPath path to endpoint
     */
    public static String compileClientHttpRouteUrl(FlowServiceConfiguration configuration, String routerPath) {
        String flowapi_httproute =  String.format(configuration.host_url_client() + configuration.endpoint_client(), routerPath.startsWith("/") ? routerPath.substring(1) : routerPath); //replease leading slash in routerPath
        return flowapi_httproute;
    }


    public String compileEditUrl(String flowstreamid) {
        return compileEditUrl(configuration, flowstreamid) ;
    }

    /**
     * compile edit url, url to which user should be redirected to edit flow
     * @param configuration
     * @param flowstreamid
     * @return
     */
    public static String compileEditUrl(FlowServiceConfiguration configuration, String flowstreamid) {
        String flowWsUString = String.format(configuration.flow_ws_url(),flowstreamid);
        String flowapi_editurl = String.format(configuration.flow_designer_url(),"0", URLEncoder.encode(flowWsUString, StandardCharsets.UTF_8),"");
        return flowapi_editurl;
    }

    public static String prop(String key) {
        return PROPERTY_PREFIX + key;
    }
    
    /**
     * create a flow from content
     * @param content
     * @param flowstreamid
     * @return
     */
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
                flowResponse.put(prop(PROPERTY_ERROR), "flow does not exist.");
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
                    flowResponse.put(prop(PROPERTY_ERROR), responseAsString);
                    return flowResponse;
                }

                String flowapi_editurl = compileEditUrl(flowstreamid);
                flowResponse.put(prop(PROPERTY_EDITURL), flowapi_editurl);

                flowResponse.put(prop(PROPERTY_SUCCESS), json.get("success").asText());

                return flowResponse;
            } else {
                LOGGER.error("flowstream return empty response: {}", url);
                flowResponse.put(prop(PROPERTY_ERROR), "no response");
            }
           

        } catch (Exception e) {
            LOGGER.error("flowstream could not update flow: {}", url);
            flowResponse.put(prop(PROPERTY_ERROR), "error executing flowstream update");
            e.printStackTrace();
        }

        return flowResponse;
    }

    
    /**
     * create a flow from content
     * @param content - json content
     * @param flowstreamid - flowstreamid
     * @return - flowstream response
     */
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
            flowResponse.put(prop(PROPERTY_RESPONSE), responseAsString);

            if (StringUtils.isNotBlank(responseAsString)) {
                // convert response to json
                ObjectMapper mapper = new ObjectMapper();
                JsonNode json = mapper.readTree(responseAsString);

                if (json != null) {
                    flowResponse.put(prop(PROPERTY_ERROR), json.get("wserror").asText());
                } else {
                    flowResponse.put(prop(PROPERTY_ERROR), "could not parse response");
                }

                return flowResponse;
            } else {
                LOGGER.error("flowstream return empty response: {}", url);
                flowResponse.put(prop(PROPERTY_ERROR), "no response");
            }
           

        } catch (Exception e) {
            LOGGER.error("flowstream could not update flow: {}", url);
            flowResponse.put(prop(PROPERTY_ERROR), "error executing flowstream update");
            e.printStackTrace();
        }

        return flowResponse;
    }
    
    // generate a new topic
    public String generateTopic(String name) {
        return String.format("%s_%s", name, UUID.randomUUID().toString().replace("-", ""));
    }

    /**
     * get the flow data
     * @param flowstreamid - the flowstream id
     * @return a hashmap with the flow data
     */
    public boolean isFlowExists(String flowstreamid) {
        String responseAsString = getFlowStreamReadData(flowstreamid);

        if (StringUtils.isNotBlank(responseAsString)) {
            return true;
        }
        return false;
    }

    /**
     * get the flow data
     * @param flowstreamid - the flowstream id
     * @return a hashmap with the flow data
     */
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
            flowResponse.put(prop(PROPERTY_ERROR), "no response");
        }
        return flowResponse;
    }

    /**
     * do a http client call to get the flow data
     * @param flowstreamid - the flowstream id
     * @return a sting promise
     */
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

    /**
     * do a http client call to get the flow data
     * @param flowstreamid - the flowstream id
     * @return a sting promise
     */
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
     * do a http client call to get the flow data
     * @param flowstreamid
     * @return a sting promise
     */
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
     * fix invalid characters in resource path for http route
     * @param resourcePath
     * @return
     */
    public static String compileHttpRoutePath(String resourcePath) {
        String httpRouterPath = resourcePath;
        httpRouterPath = httpRouterPath.replaceAll(JcrConstants.JCR_CONTENT, "_" + JcrConstants.JCR_CONTENT.replace(":", "_"));
        // escape url characters
        httpRouterPath = UrlEscapers.urlFragmentEscaper().escape(httpRouterPath);
        return httpRouterPath;
    }


    /**
     * compile a flow title, provide a default if not author specified
     * @param auhoredTitle
     * @param flowComponentTitle
     * @return
     */
    public static String compileFlowTitle(String auhoredTitle, String flowComponentTitle) {
        String flowTitle = auhoredTitle;
        // generate a title if its not specified
        if (StringUtils.isBlank(flowTitle)) {
            flowTitle = flowComponentTitle + FLOW_DEFAULT_TITLE_SUFFIX;
        }
        return flowTitle;
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
    public String createFlowFromTemplate(@NotNull FlowComponent flowComponent) {
        String templatePath = flowComponent.flowapi_template;
        String title = compileFlowTitle(flowComponent.flowapi_title,flowComponent.componentTitle);
        String flowTopic = flowComponent.flowapi_topic;
        String id = flowComponent.flowapi_flowstreamid;
        boolean isContainer = flowComponent.isContainer();
        String sampleDataPath = flowComponent.flowapi_sampledata;
        String designTemplatePath = flowComponent.flowapi_designtemplate;
        
        //  String designTemplatePath
        
        // if topic is blank then generate a unique topic
        if (StringUtils.isBlank(flowTopic)) {
            flowTopic = generateTopic(flowComponent.componentName);
        }

        String componentSampleData = getComponentSampleJson(sampleDataPath, flowComponent.resourceResolver);
        String httpRoutePath = compileHttpRoutePath(flowComponent.path); // will be used as endpoint for incoming HTTP request
        String designTemplateString = getResourceInputStreamAsString(templatePath, flowComponent.resourceResolver);

        // setup a list of replace strings, as this is new flowId, flowStreamId and childPathId will be blank
        HashMap<String, String> replaceMap = getReplaceMap("", "", "", flowTopic, httpRoutePath, componentSampleData);

        // replace template variables with values
        String designTemplateStringUpdated = updateFlowTemplateVariables(designTemplateString, replaceMap);

        // get template json
        JsonNode componentTemplate = toJsonNode(designTemplateStringUpdated);

        if (componentTemplate == null) {
            LOGGER.error("could not parse flow template: {}", templatePath);
            return "";
        }

        Resource currentFlowContainerResource = PageUtil.getResourceParentByResourceType(flowComponent.resource, RESOURCE_TYPE);

        String flowGroup = httpRoutePath;
        if (currentFlowContainerResource != null) {
            //get flow group from parent flow container
            String parentFlowstreamuid = currentFlowContainerResource.getValueMap().get(PROPERTY_FLOWSTREAMID, "");
            if (StringUtils.isNotBlank(parentFlowstreamuid)) {
                HashMap<String,Object> parentMetadata = getFlowStreamData(parentFlowstreamuid);
                flowGroup = (String)parentMetadata.get("group");
            }
        }

        ObjectNode componentTemplateObject = (ObjectNode)componentTemplate;

        FlowComponentMetadata metadata = resolveFlowComponentMetadata(flowComponent, flowGroup, title);
        applyFlowMetadata(componentTemplateObject, metadata);
        
        // remove id
        if (componentTemplateObject.has(PROPERTY_ID)) {
            componentTemplateObject.remove(PROPERTY_ID);
        }

        // update component design, this is done with MAP fields to allow more flexibility.
        // JsonNode components = componentTemplate.get("components");
        // JsonNode component_flow_output = components.get("flow_output");
        // JsonNode component_flow_input = components.get("flow_input");
        // if (componentTemplate.has("design")) {
        //     JsonNode design = componentTemplate.get("design");
            
        //     // update topic in flow tms filter update block
        //     // this is used to wrap data incoming into flow before its sent to TMS
        //     if (design.has("flowtmsfilterupdate")) {
        //         JsonNode instance_design_flowtmsfilterupdate = design.get("flowtmsfilterupdate");
        //         JsonNode instance_design_flowtmsfilterupdate_config = instance_design_flowtmsfilterupdate.get("config");
        //         ((ObjectNode)instance_design_flowtmsfilterupdate_config).put("topic", flowTopic);
        //     }

        //     //update topic in flow tms filter get block
        //     // this is used to unwrap data incoming from TMS before its sent as flow output
        //     if (design.has("flowtmsfilterget")) {
        //         JsonNode instance_design_flowtmsfilterget = design.get("flowtmsfilterget");
        //         JsonNode instance_design_flowtmsfilterget_config = instance_design_flowtmsfilterget.get("config");
        //         ((ObjectNode)instance_design_flowtmsfilterget_config).put("topic", flowTopic);
        //     }
        // }

        // get json string
        String componentJson = JsonUtil.getJsonString(componentTemplate);

        // send to flowstream
        HashMap<String, Object> response = doFlowStreamImportData(componentJson);
        
        String responseFlowId = (String)response.get(prop(PROPERTY_FLOWSTREAMID));

        response.put(prop(PROPERTY_TOPIC), flowTopic);
        response.put(prop(PROPERTY_TITLE), title);
        response.put(prop(PROPERTY_TEMPLATE), templatePath);
        response.put(prop(PROPERTY_TEMPLATE_DESIGN), designTemplatePath);
        response.put(prop(PROPERTY_ISCONTAINER), isContainer);
        response.put(prop(PROPERTY_CREATEDON), DateUtil.getIsoDate(new Date()));
        response.put(prop(PROPERTY_EDITURL), compileEditUrl(responseFlowId));
        response.put(prop(PROPERTY_HTTPROUTE), compileClientHttpRouteUrl(httpRoutePath + FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_SUFFIX));
        response.put(prop(PROPERTY_HTTPROUTE_NOSFX), compileClientHttpRouteUrl(httpRoutePath));
        response.put(prop(PROPERTY_WEBSOCKETURL), configuration.flow_tms_url());
        applyFlowMetadataToResponse(response, metadata);

        LOGGER.info("flowstreamdata: {}", response);

        // update component with response
        PageUtil.updatResourceProperties(flowComponent.resource, response, true);

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
    public void updateFlowFromTemplate(@NotNull FlowComponent flowComponent) {

        Resource componentResource = flowComponent.resource;
        String newTitle = compileFlowTitle(flowComponent.title, flowComponent.componentTitle);
        String flowstreamid = flowComponent.flowapi_flowstreamid;
        
        ResourceResolver resourceResolver = componentResource.getResourceResolver();

        if (StringUtils.isBlank(flowstreamid)) {
            LOGGER.warn("Skipping flow update for {} because flowstream id is missing.", componentResource.getPath());
            return;
        }

        ObjectNode componentTemplateObject = loadExportOrTemplate(flowComponent, resourceResolver);
        if (componentTemplateObject == null) {
            LOGGER.warn("Could not load flow definition for {}. Skipping update.", componentResource.getPath());
            return;
        }

        String httpRoutePath = compileHttpRoutePath(flowComponent.path); // will be used as endpoint for incoming HTTP request
        Resource currentFlowContainerResource = PageUtil.getResourceParentByResourceType(componentResource, RESOURCE_TYPE);
        
        String flowGroup = httpRoutePath;
        if (currentFlowContainerResource != null) {
            if (currentFlowContainerResource != null) {
                //get flow group from parent flow container
                String parentFlowstreamuid = currentFlowContainerResource.getValueMap().get(PROPERTY_FLOWSTREAMID, "");
                if (StringUtils.isNotBlank(parentFlowstreamuid)) {
                    HashMap<String,Object> parentMetadata = getFlowStreamData(parentFlowstreamuid);
                    flowGroup = (String)parentMetadata.get(PROPERTY_GROUP);
                }
            }
        }

        componentTemplateObject.put(PROPERTY_ID, flowstreamid);
        FlowComponentMetadata metadata = resolveFlowComponentMetadata(flowComponent, flowGroup, newTitle);
        applyFlowMetadata(componentTemplateObject, metadata);

        // Save metadata to Flow using /fapi/stream_save/{flowstreamid}
        LOGGER.info("Updating metadata in Flow for flowstreamid={} on resource={}", flowstreamid, componentResource.getPath());
        boolean metadataSaved = saveMetadataToFlow(metadata, flowstreamid);
        if (metadataSaved) {
            LOGGER.info("Metadata successfully saved to Flow for flowstreamid={}", flowstreamid);
        } else {
            LOGGER.error("Failed to save metadata to Flow for flowstreamid={}, continuing with full flow update", flowstreamid);
        }

        // get json string
        String componentJson = JsonUtil.getJsonString(componentTemplateObject);

        // send to flowstream
        HashMap<String, Object> response = doFlowStreamUpdateData(componentJson, flowstreamid);
        
        response.put(prop(PROPERTY_UPDATEDON), DateUtil.getIsoDate(new Date()));
        response.put(prop(PROPERTY_EDITURL), compileEditUrl(flowstreamid));
        response.put(prop(PROPERTY_TITLE), newTitle);
        response.put(prop(PROPERTY_HTTPROUTE), compileClientHttpRouteUrl(httpRoutePath + FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_SUFFIX));
        response.put(prop(PROPERTY_HTTPROUTE_NOSFX), compileClientHttpRouteUrl(httpRoutePath));
        response.put(prop(PROPERTY_WEBSOCKETURL), configuration.flow_tms_url());
        applyFlowMetadataToResponse(response, metadata);

        LOGGER.info("flowstreamdata: {}", response);

        // go through response object and remove all null value
        // update component with response
        PageUtil.updatResourceProperties(componentResource, response, true);
    }

    private ObjectNode loadExportOrTemplate(@NotNull FlowComponent flowComponent, ResourceResolver resourceResolver) {
        ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        String flowstreamid = flowComponent.flowapi_flowstreamid;
        if (StringUtils.isNotBlank(flowstreamid)) {
            String exportData = getFlowStreamExportData(flowstreamid);
            if (StringUtils.isNotBlank(exportData)) {
                try {
                    // Parse outer JSON response: {"success": true, "value": "..."}
                    JsonNode responseNode = mapper.readTree(exportData);
                    
                    // Extract the "value" field which contains the actual flow data as a JSON string
                    if (responseNode.has("value") && responseNode.get("value").isTextual()) {
                        String valueJsonString = responseNode.get("value").asText();
                        if (StringUtils.isNotBlank(valueJsonString)) {
                            // Parse the inner JSON string to get the actual flow data
                            JsonNode exportNode = mapper.readTree(valueJsonString);
                            if (exportNode instanceof ObjectNode) {
                                return (ObjectNode) exportNode;
                            }
                        }
                    } else {
                        // Fallback: try parsing directly (for backward compatibility)
                        JsonNode exportNode = mapper.readTree(exportData);
                        if (exportNode instanceof ObjectNode) {
                            return (ObjectNode) exportNode;
                        }
                    }
                } catch (Exception exception) {
                    LOGGER.warn("Could not parse flow export for {}: {}", flowstreamid, exception.getMessage());
                }
            }
        }

        String templatePath = flowComponent.flowapi_template;
        if (StringUtils.isBlank(templatePath)) {
            return null;
        }

        JsonNode templateNode = getTemplateTree(templatePath, resourceResolver);
        if (templateNode instanceof ObjectNode) {
            return (ObjectNode) templateNode;
        }
        return null;
    }


    /**
     * get a map of replace values for a flow
     * @param childFlowId flow id of child flow
     * @param flowstreamid flowstream id of child flow
     * @param childPathId path id of child flow
     * @param topic topic of child flow
     * @param httpRoutePath path of current page
     * @param componentSampleData sample data of component
     * @return map of replace values
     */
    public HashMap<String, String> getReplaceMap(String childFlowId, String flowstreamid, String childPathId, String topic, String httpRoutePath, String componentSampleData) {
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
            put(FLOW_TEMPLATE_FIELD_CHILD_FLOWID, childFlowId);
            put(FLOW_TEMPLATE_FIELD_PARENT_FLOWID, flowstreamid);
            put(FLOW_TEMPLATE_FIELD_SUBSCRIBE_ID, StringUtils.join(childPathId, "subscribe"));
            put(FLOW_TEMPLATE_FIELD_PRINTJSON_ID, StringUtils.join(childPathId, "printjson"));
            put(FLOW_TEMPLATE_FIELD_SENDDATA_ID, StringUtils.join(childPathId, "senddata"));
            put(FLOW_TEMPLATE_FIELD_PUBLISH_ID, StringUtils.join(childPathId, "publish"));
            put(FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL, httpRoutePath + FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_SUFFIX); // used for HTTP Route step, eg in forms
            put(FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_NOSFX, httpRoutePath + FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_NOSFX_VALUE); // used for HTTP Route step with url without suffix, eg in forms
            put(FLOW_TEMPLATE_FIELD_SAMPLE_DATA, componentSampleDataValueFinal); // used for HTTP Route step, eg in forms            
            put(FLOW_TEMPLATE_FIELD_TMS_TOPIC, topic); // used for filtering TMS messages            
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
    public void updateFlowDesignFromTemplate(@NotNull FlowComponent flowComponent) {
        String designTemplate = flowComponent.flowapi_designtemplate;
        Resource componentResource = flowComponent.resource;
        String flowstreamid = flowComponent.flowapi_flowstreamid;
        String sampleDataPath = flowComponent.flowapi_sampledata;
        String newTitle = flowComponent.title;
        
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
                FlowComponent flowComponentChild = flowResource.adaptTo(FlowComponent.class);
                if (flowComponentChild == null) {
                    LOGGER.error("flow component not found: {}", flowResource.getPath());
                    continue;
                }
                String flowId = flowComponentChild.flowapi_flowstreamid;
                if (StringUtils.isNotBlank(flowId)) {
                    //get flow title to use as group title
                    String flowTitle = flowComponentChild.flowapi_title;
                    if (StringUtils.isBlank(flowTitle)) {
                        flowTitle = flowComponentChild.componentTitle;
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
                    String httpRoutePath = compileHttpRoutePath(flowComponent.path); // will be used as endpoint for incoming HTTP request
                    String componentSampleData = getComponentSampleJson(sampleDataPath, resourceResolver);

                    // setup a list of replace strings
                    HashMap<String, String> replaceMap = getReplaceMap(flowId, flowstreamid, childPathId, flowComponent.flowapi_topic, httpRoutePath, componentSampleData);

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
    public String getComponentSampleJson(String samplePath, @NotNull ResourceResolver resourceResolver) {
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
        String slingResourceType = properties.get(SlingConstants.SLING_RESOURCE_TYPE_PROPERTY, "");
        // check if slingResourceType is prepended with FLOW_SPI_KEY_IGNORE_PREFIX, if so remove it
        if (slingResourceType.startsWith(FLOW_SPI_KEY_IGNORE_PREFIX)) {
            slingResourceType = slingResourceType.substring(FLOW_SPI_KEY_IGNORE_PREFIX.length());
        }

        if (flowComponentRegistry != null) {
            List<String> list = flowComponentRegistry.getComponents(FLOW_SPI_KEY);
            isComponentFlowEnabled = list.contains(slingResourceType);
        }
        
        return isComponentFlowEnabled;
    }

    protected FlowComponentMetadata resolveFlowComponentMetadata(@NotNull FlowComponent flowComponent, String defaultGroup, String defaultName) {
        String resolvedGroup = StringUtils.defaultIfBlank(flowComponent.flowapi_group, defaultGroup);
        String resolvedName = StringUtils.defaultIfBlank(flowComponent.flowapi_name, defaultName);
        String resolvedAuthor = StringUtils.defaultIfBlank(flowComponent.flowapi_author,
                configuration != null ? configuration.flow_meta_author() : FlowServiceConfiguration.FLOW_META_AUTHOR);

        return new FlowComponentMetadata(
            resolvedGroup,
            resolvedName,
            StringUtils.trimToNull(flowComponent.flowapi_reference),
            StringUtils.trimToNull(flowComponent.flowapi_icon),
            StringUtils.trimToNull(flowComponent.flowapi_color),
            StringUtils.trimToNull(flowComponent.flowapi_version),
            resolvedAuthor,
            StringUtils.trimToNull(flowComponent.flowapi_readme)
        );
    }

    protected void applyFlowMetadata(ObjectNode templateObject, FlowComponentMetadata metadata) {
        templateObject.put(PROPERTY_GROUP, metadata.getGroup());
        templateObject.put(PROPERTY_NAME, metadata.getName());
        templateObject.put(PROPERTY_AUTHOR, metadata.getAuthor());

        if (metadata.getReference() != null) {
            templateObject.put(PROPERTY_REFERENCE, metadata.getReference());
        }
        if (metadata.getIcon() != null) {
            templateObject.put(PROPERTY_ICON, metadata.getIcon());
        }
        if (metadata.getColor() != null) {
            templateObject.put(PROPERTY_COLOR, metadata.getColor());
        }
        if (metadata.getVersion() != null) {
            templateObject.put(PROPERTY_VERSION, metadata.getVersion());
        }
        if (metadata.getReadme() != null) {
            templateObject.put(PROPERTY_README, metadata.getReadme());
        }
    }

    protected void applyFlowMetadataToResponse(Map<String, Object> response, FlowComponentMetadata metadata) {
        response.put(prop(PROPERTY_GROUP), metadata.getGroup());
        response.put(prop(PROPERTY_NAME), metadata.getName());
        response.put(prop(PROPERTY_AUTHOR), metadata.getAuthor());

        if (metadata.getReference() != null) {
            response.put(prop(PROPERTY_REFERENCE), metadata.getReference());
        }
        if (metadata.getIcon() != null) {
            response.put(prop(PROPERTY_ICON), metadata.getIcon());
        }
        if (metadata.getColor() != null) {
            response.put(prop(PROPERTY_COLOR), metadata.getColor());
        }
        if (metadata.getVersion() != null) {
            response.put(prop(PROPERTY_VERSION), metadata.getVersion());
        }
        if (metadata.getReadme() != null) {
            response.put(prop(PROPERTY_README), metadata.getReadme());
        }
    }

    protected static final class FlowComponentMetadata {
        private final String group;
        private final String name;
        private final String reference;
        private final String icon;
        private final String color;
        private final String version;
        private final String author;
        private final String readme;

        FlowComponentMetadata(String group, String name, String reference, String icon, String color, String version, String author, String readme) {
            this.group = group;
            this.name = name;
            this.reference = reference;
            this.icon = icon;
            this.color = color;
            this.version = version;
            this.author = author;
            this.readme = readme;
        }

        public String getGroup() {
            return group;
        }

        public String getName() {
            return name;
        }

        public String getReference() {
            return reference;
        }

        public String getIcon() {
            return icon;
        }

        public String getColor() {
            return color;
        }

        public String getVersion() {
            return version;
        }

        public String getAuthor() {
            return author;
        }

        public String getReadme() {
            return readme;
        }
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

        public final static String FLOW_HOST = "http://localhost:8000"; // this could be Flow service or Fast API Proxy, 8000 is Fastapi proxy
        public final static String FLOW_HOST_CLIENT = "https://flow.typerefinery.localhost:8101"; // this is a client facing url, this could be Flow service or Fast API Proxy, 8000 is Fastapi proxy
        public final static String FLOW_ENDPOINT_EXPORT = "/flow/export/%s";
        public final static String FLOW_ENDPOINT_IMPORT = "/flow/import";
        public final static String FLOW_ENDPOINT_UPDATE = "/flow/update";
        public final static String FLOW_ENDPOINT_DESIGN_SAVE = "/flow/%s/design/save";
        public final static String FLOW_ENDPOINT_DESIGN = "/flow/%s/design";
        public final static String FLOW_ENDPOINT_READ = "/flow/read/%s";
        public final static String FLOW_ENDPOINT_CLIENT = "/%s"; // this will allow posting data to the flow service via the proxy without CORS issues
        public final static String FLOW_WS_URL = "wss://flow.typerefinery.localhost:8101/flows/%s";
        public final static String FLOW_TMS_URL = "wss://tms.typerefinery.localhost:8101/$tms";
        public final static String FLOW_DESIGNER_URL = "https://flow.typerefinery.localhost:8101/designer/?darkmode=%s&socket=%s&components=%s";
        public final static boolean FLOW_PAGE_CHNAGE_LISTENER_ENABLE = true;
        public final static String FLOW_META_AUTHOR = "TypeRefinery.io";
        public final static String FLOW_ENDPOINT_STREAMS_PAUSE = "/fapi/streams_pause/%s?is=%s";
        public final static String FLOW_ENDPOINT_STREAMS_SAVE = "/fapi/stream_save/%s";
        
        @AttributeDefinition(
            name = "Host URL",
            description = "Host url of the external service.",
            defaultValue = FLOW_HOST
        )
        String host_url() default FLOW_HOST;

        @AttributeDefinition(
            name = "Host URL Client",
            description = "Host url of the external service accessible by client.",
            defaultValue = FLOW_HOST_CLIENT
        )
        String host_url_client() default FLOW_HOST_CLIENT;

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
                defaultValue = FLOW_ENDPOINT_UPDATE
        )
        String endpoint_update() default FLOW_ENDPOINT_UPDATE;

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
                name = "Endpoint Client",
                description = "Prefix for url that client should be posting to from external service, eg from a form.",
                defaultValue = FLOW_ENDPOINT_CLIENT
        )
        String endpoint_client() default FLOW_ENDPOINT_CLIENT;

        @AttributeDefinition(
                name = "Endpoint Streams Pause",
                description = "URL template for pausing or resuming Flow streams.",
                defaultValue = FLOW_ENDPOINT_STREAMS_PAUSE
        )
        String endpoint_streams_pause() default FLOW_ENDPOINT_STREAMS_PAUSE;

        @AttributeDefinition(
                name = "Endpoint Streams Save",
                description = "URL template for saving Flow stream metadata.",
                defaultValue = FLOW_ENDPOINT_STREAMS_SAVE
        )
        String endpoint_streams_save() default FLOW_ENDPOINT_STREAMS_SAVE;

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
