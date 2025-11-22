# Flow Service Documentation

This guide covers the full Flow feature set: how change events trigger work, how flows are created and maintained, and how related registries and components participate. Core implementation lives in `application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java` with supporting listeners, jobs, and component models.

## Event Pipeline

- **Change detection** – `FlowResourceChangeListener` watches `/content` paths and filters changes to flow-enabled resources using `flowService.isFlowEnabledResource`. Matching paths are batched into a Sling Job payload so the heavy work runs outside the listener thread.  
```101:117:application/backend/src/main/java/ai/typerefinery/websight/events/flow/FlowResourceChangeListener.java
        for (ResourceChange change : changes) {
            String path = change.getPath();
            Resource resource = resourceResolver.getResource(path);

            if (flowService.isFlowEnabledResource(resource)) {
                changeMap.put(path, change.getType());
            }
        }
```
- **Job execution** – `FlowJobConsumer` re-fetches each resource with system credentials, then delegates to `flowService.doProcessFlowResource`. Failures flag the job as `FAILED` so Sling will retry.  
```73:88:application/backend/src/main/java/ai/typerefinery/websight/jobs/flow/FlowJobConsumer.java
                changeMap.forEach((path, changeType) -> {
                    
                    Resource resource = resourceResolver.getResource(path);
                    if (!ResourceUtil.isNonExistingResource(resource)) {
                        if(flowService.doProcessFlowResource(resource, changeType) == false)
                        {
                            returnProcessFlowError = true;
                        }
                    }
                });
```

## Component Registration and Defaults

- **Flow components** – `FlowComponent` exposes persisted Flow metadata via Sling Models, ensures container detection, and can lazily recreate flows if they disappear. Properties include `flowapi_enable`, `flowapi_flowstreamid`, `flowapi_paused`, and metadata fields (name, group, author, reference, icon, color, version, readme).  
```54:135:application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java
    @Getter
    @Inject
    @Default(booleanValues = false)
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_ENABLE)
    public Boolean flowapi_enable;
    
    @Getter
    @Inject
    @Nullable
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_PAUSED)
    public Boolean flowapi_paused;
    ...
    public Boolean isContainer() {
        boolean isContainer = flowapi_iscontainer != null ? flowapi_iscontainer : false;
        if (this.resource != null) {
            isContainer = this.resource.isResourceType(FlowComponent.RESOURCE_TYPE);
        }
        return isContainer;
    }
```
- **Container defaults** – `FlowContainer` seeds missing template paths, sample data, and container flags, then registers itself with the Flow registry so discovery works.  
```55:75:application/backend/src/main/java/ai/typerefinery/websight/models/components/flow/FlowContainer.java
        if (StringUtils.isBlank(this.flowapi_template)) {
            this.flowapi_template = DEFAULT_FLOWAPI_TEMPLATE;
            props.put(FlowService.prop(FlowService.PROPERTY_TEMPLATE), this.flowapi_template);
        }
        ...
        if (props.size() > 0) {
            PageUtil.updatResourceProperties(resource, props);
        }
```
- **Registry** – `FlowComponentRegistryImpl` binds `FlowComponentRegister` services, filters them per request (optional `ConditionalFlowComponent`), and supplies the list that `FlowService.isFlowEnabledResource` uses.  
```54:71:application/backend/src/main/java/ai/typerefinery/websight/services/flow/registry/impl/FlowComponentRegistryImpl.java
    public List<String> getComponents(String key, SlingHttpServletRequest request) {
        return (List)((List)this.flowComponentsByKey.getOrDefault(key, Collections.emptyList())).stream()
        .filter((flowComponentRegister) -> {
            return this.isApplicable(flowComponentRegister, request);
        })
        .map(flowComponentRegister -> ((FlowComponentRegister) flowComponentRegister).getComponent())
        .collect(Collectors.toList());
    }
```

## FlowService Responsibilities

### Resource Processing

`doProcessFlowResource` determines whether to create, update, or pause/unpause flows. It rejects non Flow components, ensures the JSON template exists, then branches based on `flowapi_enable` state:

- **When `flowapi_enable` is `false`**: If a flow ID exists, the flow is paused via `/fapi/streams_pause/{id}?is=1`.
- **When `flowapi_enable` is `true`**:
  - If no flow ID exists and a template exists, a new flow is created.
  - If a flow ID exists but the remote flow is missing (deleted), the flow is recreated.
  - If a flow ID exists and the remote flow exists, metadata is compared. If metadata has changed, the flow is updated via `/fapi/stream_save/` (metadata) and `/flow/update` (content).

Container components also trigger design syncs.  
```275:330:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
        if (!flowapi_enable) {
            // When Flow is disabled, pause the flow if it exists
            if (StringUtils.isNotBlank(flowComponent.flowapi_flowstreamid)) {
                processPauseChange(resource, flowComponent.flowapi_flowstreamid, true);
            }
            return true;
        }

        if (flowapi_enable && StringUtils.isNotBlank(flowapi_template)) {
            boolean isFlowExists = StringUtils.isNotBlank(flowComponent.flowapi_flowstreamid) ? isFlowExists(flowComponent.flowapi_flowstreamid) : false;
            boolean isTemplateExists = PageUtil.isResourceExists(flowapi_template, resourceResolver);
            if (isFlowExists == false && isTemplateExists) {
                String flowapi_flowstreamid = createFlowFromTemplate(flowComponent);
                // After creating, ensure flow is unpaused
                if (StringUtils.isNotBlank(flowapi_flowstreamid)) {
                    processPauseChange(resource, flowapi_flowstreamid, false);
                }
            } else if (isFlowExists && isTemplateExists) {
                // Check if metadata has changed before updating
                if (hasMetadataChanged(flowComponent, flowComponent.flowapi_flowstreamid)) {
                    updateFlowFromTemplate(flowComponent);
                    if (flowComponent.isContainer() & StringUtils.isNotBlank(flowComponent.flowapi_designtemplate)) {
                        updateFlowDesignFromTemplate(flowComponent);
                    }
                }
            } else if (!isFlowExists && StringUtils.isNotBlank(flowComponent.flowapi_flowstreamid) && isTemplateExists) {
                // Flow was deleted remotely, recreate it
                String flowapi_flowstreamid = createFlowFromTemplate(flowComponent);
                if (StringUtils.isNotBlank(flowapi_flowstreamid)) {
                    processPauseChange(resource, flowapi_flowstreamid, false);
                }
            }
        }
```

### Flow Creation

`createFlowFromTemplate` composes runtime metadata, substitutes template placeholders, and calls the Flow API `/flow/import`. Responses are merged into component properties, including generated HTTP routes and WebSocket URLs. (See earlier section for process breakdown.)  
```669:777:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
        HashMap<String, Object> response = doFlowStreamImportData(componentJson);
        ...
        PageUtil.updatResourceProperties(flowComponent.resource, response, true);
        return responseFlowId;
```

### Flow Updates

- **Metadata updates** – `updateFlowFromTemplate` first saves metadata changes via `/fapi/stream_save/{id}` endpoint, then loads the existing flow definition from `/fapi/streams_export/{id}/`, applies metadata changes, and posts the full update to `/flow/update`. This ensures the Flow service remains the source of truth for flow content while metadata is synchronized from the CMS. Updated timestamps, edit URL, and client routes are written back.  
```1034:1041:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
        // First, save metadata changes via /fapi/stream_save/
        FlowComponentMetadata metadata = new FlowComponentMetadata(flowComponent);
        saveMetadataToFlow(metadata, flowstreamid);
        
        // Then, load existing flow definition and apply metadata changes
        String existingFlowJson = loadExportOrTemplate(flowComponent, resourceResolver);
```
- **Metadata comparison** – `hasMetadataChanged` compares local FlowComponent metadata (name, group, author, reference, icon, color, version, readme) with metadata fetched from the Flow service export endpoint. This prevents unnecessary updates when only non-metadata properties change.  
```427:529:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
    private boolean hasMetadataChanged(@NotNull FlowComponent flowComponent, String flowstreamid) {
        try {
            String exportData = getFlowStreamExportData(flowstreamid);
            if (StringUtils.isBlank(exportData)) {
                return true; // If export fails, assume changed to trigger update
            }
            
            // Parse nested JSON structure: {"success": true, "value": "{...}"}
            ObjectMapper mapper = new ObjectMapper();
            JsonNode exportResponse = mapper.readTree(exportData);
            if (!exportResponse.has("success") || !exportResponse.get("success").asBoolean()) {
                return true;
            }
            
            String flowJsonString = exportResponse.get("value").asText();
            JsonNode flowData = mapper.readTree(flowJsonString);
            
            // Compare metadata fields
            FlowComponentMetadata localMetadata = new FlowComponentMetadata(flowComponent);
            // ... comparison logic ...
        }
    }
```
- **Design graph updates** – `updateFlowDesignFromTemplate` fetches existing design JSON, calculates non-overlapping tiles, injects child flow blocks, and saves the merged design via `/flow/{id}/design/save`.  
```911:1170:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
                String newDesignComponentsString = mapper.writeValueAsString(newDesignComponents);
                            
                doFlowStreamDesignSaveData(newDesignComponentsString, flowstreamid);
```

### Flow Pause/Unpause

- **Pause control** – `toggleFlowStreamPause` sends GET requests to `/fapi/streams_pause/{flowstreamid}?is=0|1`, where `is=0` resumes and `is=1` pauses the flow. The pause state is persisted to the resource as `flowapi_paused` property.  
```353:382:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
    public FlowPauseResult toggleFlowStreamPause(@NotNull String flowstreamid, boolean pauseRequested) {
        String url = getFlowStreamPauseAPIURL(flowstreamid, pauseRequested);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .GET()
            .build();
        // ... HTTP request with retry logic ...
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            return FlowPauseResult.success(statusCode, pauseRequested);
        }
    }
```
- **Automatic pause on disable** – When `flowapi_enable` is set to `false`, the flow is automatically paused if a `flowapi_flowstreamid` exists.
- **Automatic resume on enable** – When `flowapi_enable` is set to `true` and a flow is created or updated, the flow is automatically resumed (unpaused).
- **Pause state property** – The `flowapi_paused` boolean property is exposed via `FlowComponent` model and displayed as a read-only field in author dialogs.

### Flow Metadata Management

- **Metadata save** – `saveMetadataToFlow` sends POST requests to `/fapi/stream_save/{flowstreamid}` with a JSON payload containing metadata fields: `group`, `name`, `author`, `reference`, `icon`, `color`, `version`, and `readme`. This endpoint updates only metadata without affecting flow content, allowing CMS-driven metadata changes to be synchronized to the Flow service.  
```332:400:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
    private boolean saveMetadataToFlow(FlowComponentMetadata metadata, String flowstreamid) {
        String url = getFlowStreamSaveAPIURL(flowstreamid);
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> payload = new HashMap<>();
        payload.put("group", metadata.getGroup());
        payload.put("name", metadata.getName());
        // ... other metadata fields ...
        String jsonPayload = mapper.writeValueAsString(payload);
        // ... HTTP POST request ...
    }
```
- **Metadata synchronization** – When a flow is updated, metadata is first saved via `/fapi/stream_save/`, then the full flow definition (including content) is updated via `/flow/update`. This ensures metadata changes are reflected immediately while preserving flow content managed in Flow Designer.
- **Source of truth** – After initial flow creation, the Flow service becomes the source of truth for flow content. Updates from the CMS merge metadata changes into the existing flow definition fetched from `/fapi/streams_export/{id}/`, preserving any manual changes made in Flow Designer.

### HTTP and Retry Helpers

- `sendRequestWithRetry` wraps POST calls with configurable retry count and delay.  
```256:278:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
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
```
- `doFlowStreamImportData`, `doFlowStreamUpdateData`, and `doFlowStreamDesignSaveData` handle specific endpoints, parsing JSON responses and surfacing errors to the caller.  
```281:337:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
            HttpResponse<String> response = sendRequestWithRetry(request, client, HttpResponse.BodyHandlers.ofString());
            String responseAsString = response.body();
            if (StringUtils.isNotBlank(responseAsString)) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode json = mapper.readTree(responseAsString);
                ...
                flowResponse.put(prop(PROPERTY_FLOWSTREAMID), flowstreamid);
```

### Template and Sample Utilities

- `getReplaceMap` handles placeholders for nested flows, HTTP routes, sample payloads, and TMS topics, escaping sample JSON when needed.  
```854:883:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
        return new HashMap<String, String>(){{
            put(FLOW_TEMPLATE_FIELD_CHILD_FLOWID, childFlowId);
            put(FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL, httpRoutePath + FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_SUFFIX);
            put(FLOW_TEMPLATE_FIELD_SAMPLE_DATA, componentSampleDataValueFinal);
        }};
```
- `getComponentSampleJson`, `getTemplateTree`, and `getResourceInputStreamAsString` centralize repository reads, returning empty strings for missing resources instead of failing hard.  
```1186:1196:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
        Resource sampleResource = resourceResolver.getResource(samplePath);
        if (ResourceUtil.isNonExistingResource(sampleResource) || !sampleResource.isResourceType("nt:file")) {
            LOGGER.error("sample data not found: {}", samplePath );
            return "";
        }
        String sampleJson = getResourceInputStreamAsString(samplePath, resourceResolver);
```

### Layout Helpers

The nested `GridTitles` and `GridTile` classes compute non-overlapping regions for visualizing flows in the design tool. They maintain tile positions, padding, and grid columns, and supply coordinates used when inserting new flow steps.  
```1328:1477:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
    public class GridTitles {
        public LinkedHashMap<String, GridTile> tiles = new LinkedHashMap<String, GridTile>();
        public GridTile nextTile(String id, String name) {
            ...
            GridTile newTile = new GridTile(id, currentX, currentY, tileWidth, tileHeight, name, tilePadding);
            tiles.put(id, newTile);
            return tiles.get(id);
        }
    }
```

### Flow Discovery and Read APIs

- `isFlowExists` and `getFlowStreamReadData` call the Flow `/flow/read/{id}` endpoint, returning `true` when the response body is non-empty.  
```509:570:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
    public boolean isFlowExists(String flowstreamid) {
        String responseAsString = getFlowStreamReadData(flowstreamid);
        if (StringUtils.isNotBlank(responseAsString)) {
            return true;
        }
        return false;
    }
```
- Export and designer helpers expose read-only flows and async design retrieval for UI integrations (`getFlowStreamExportData`, `getFlowStreamDesignData`).  
```577:621:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
            return client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).thenApply(HttpResponse::body);
```

### URLs and Formatting

`compileClientHttpRouteUrl`, `compileEditUrl`, and `compileHttpRoutePath` ensure route strings are encoded, include dynamic IDs, and point to client-accessible hosts from configuration.  
```339:351:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
        String flowapi_httproute =  String.format(configuration.host_url_client() + configuration.endpoint_client(), routerPath.startsWith("/") ? routerPath.substring(1) : routerPath);
        return flowapi_httproute;
```

## Enabling Flow on Forms

- **Flow-aware model** – The Form Sling Model extends `FlowComponent`, so it inherits Flow metadata fields and ensures the component is registered with `FlowComponentRegistry`.  
```49:137:application/backend/src/main/java/ai/typerefinery/websight/models/components/forms/Form.java
public class Form extends FlowComponent implements FlowComponentRegister {
    public static final String RESOURCE_TYPE = "typerefinery/components/forms/form";
    public static final String DEFAULT_FLOWAPI_TEMPLATE = "/apps/typerefinery/components/forms/form/templates/flowform-service.json";
    public static final String DEFAULT_FLOWAPI_SAMPLEDATA = "/apps/typerefinery/components/forms/form/templates/flowsample.json";
```
- **Automatic defaults** – On initialization the model seeds missing Flow template/sample paths and, when Flow is enabled, calls `ensureFlowExists` so the backing flow is provisioned immediately.  
```108:125:application/backend/src/main/java/ai/typerefinery/websight/models/components/forms/Form.java
        if (StringUtils.isBlank(this.flowapi_template)) {
            this.flowapi_template = DEFAULT_FLOWAPI_TEMPLATE;
            props.put(FlowService.prop(FlowService.PROPERTY_TEMPLATE), this.flowapi_template);
        }
        ...
        if (this.flowapi_enable) {
            this.ensureFlowExists();
            this.flowapi_editurl = this.getFlowStreamEditUrl();
            props.put(FlowService.prop(FlowService.PROPERTY_EDITURL), this.flowapi_editurl);
        }
```
- **Authoring steps**
  1. Open the form component dialog (`apps/typerefinery/components/forms/form/dialog`) and select the **Flow** tab.
  2. Enable the **Flow API** checkbox (`flowapi_enable`). The dialog surfaces generated values for topic, title, flow ID, and designer URL; these become read-only once the flow exists.
  3. Activate or publish the component change. The change listener enqueues a job that invokes `createFlowFromTemplate`, storing the new `flowapi_flowstreamid` plus HTTP routes (`flowapi_httproute`, `flowapi_httproutenosfx`) and WebSocket URL.
  4. The Form model mirrors those routes into `readUrl`/`writeUrl`, so form submissions automatically target the Flow proxy.

- **Verification** – Reopen the dialog to confirm the designer link works and the `readUrl`/`writeUrl` fields now match the generated Flow routes. Use Flow Designer to adjust downstream behavior as needed.

## Configuration

`FlowServiceConfiguration` centralizes host URLs, endpoint templates, default authorship, and the flag toggling the listener + job pipeline. 

### Host URL Configuration

- **`host_url()`** – Internal host URL used for service-to-service calls (backend to Flow API). Used for all API operations like pause/unpause, save metadata, import, update, export, etc.
- **`host_url_client()`** – Client-facing host URL used for URLs displayed in the UI (e.g., HTTP routes, edit URLs). This is what users see in dialogs and what browsers will access.

**Important**: Service-to-service calls must use `host_url()` (internal), while URLs sent to the client/UI must use `host_url_client()`.

### Endpoints

Service-to-service endpoints (use `host_url()`):
- `/fapi/streams_pause/{id}?is=0|1` – Pause/unpause flows (default: `"/fapi/streams_pause/%s?is=%s"`)
- `/fapi/stream_save/{id}` – Save flow metadata (default: `"/fapi/stream_save/%s"`)
- `/fapi/streams_export/{id}/` – Export flow definition
- `/flow/import` – Create new flows
- `/flow/update` – Update existing flows

Client-facing endpoints (use `host_url_client()`):
- `/fapi/client/{path}` – HTTP route URLs displayed in dialogs

Updating OSGi config allows point-and-click retargeting of the external Flow service.  
```1481:1598:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
    public @interface FlowServiceConfiguration {
        public final static String FLOW_HOST = "http://localhost:8000";
        ...
        @AttributeDefinition(
            name = "Flow Page Change Listener Enabled",
            description = "Flow Designer dark mode",
            type = AttributeType.BOOLEAN
        )
        boolean flow_page_change_listener_enabled() default FLOW_PAGE_CHNAGE_LISTENER_ENABLE;
        
        @AttributeDefinition(
            name = "Flow Streams Pause Endpoint",
            description = "Endpoint template for pausing/unpausing flows",
            type = AttributeType.STRING
        )
        String endpoint_streams_pause() default "/fapi/streams_pause/%s?is=%s";
        
        @AttributeDefinition(
            name = "Flow Stream Save Endpoint",
            description = "Endpoint template for saving flow metadata",
            type = AttributeType.STRING
        )
        String endpoint_streams_save() default "/fapi/stream_save/%s";
```

## Summary

The Flow subsystem combines Sling listeners, jobs, registries, and comprehensive service utilities to keep authored components synchronized with the external Flow runtime. Templates plus metadata drive both initial flow creation and ongoing design synchronization, while configuration and registries keep the system adaptable and extensible.

