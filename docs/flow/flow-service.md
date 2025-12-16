# Flow Service Documentation

This guide covers the full Flow feature set: how change events trigger work, how flows are created and maintained, and how related registries and components participate. Core implementation lives in `application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java` with supporting listeners, jobs, and component models.

## Related Documentation

- **[Flow Execution Flow](flow-execution-flow.md)** - Detailed execution flow diagrams from listener to job consumer
- **[Flow Synchronization Flow](flow-sync-flow.md)** - Data synchronization flow between `/content`, `/var`, and Flow API
- **[Flow Var Storage Plan](flow-var-storage-plan.md)** - Architecture for `/var` storage to prevent listener loops

## Processing State Machine

Flow resources maintain a processing state machine to track the lifecycle of flow creation and updates. The state is persisted on the `/var/typerefinery/flow/` resource (not the component resource) using the `flowapi_processing_state` property, allowing coordination between the change listener and job consumer without triggering listener loops.

### State Values

- **`IDLE`** – Initial state. Resource is ready for processing. No active jobs.
- **`QUEUED`** – Job has been created and is waiting to be processed. Set by `FlowResourceChangeListener` before adding a job to the queue.
- **`PROCESSING`** – Job is actively processing the resource. Set by `FlowJobConsumer` when job execution begins.
- **`COMPLETED`** – Processing completed successfully. Set by `FlowService` after successful flow creation or update.
- **`ERROR`** – Processing failed. Set when an error occurs during processing or when retry limits are exceeded.
- **`SKIPPED`** – Processing was skipped (no changes needed, resource doesn't exist, or resource is on HOLD). Set when processing is intentionally skipped.
- **`HOLD`** – Manual hold state. User has manually stopped all processing for this resource. When set, the listener will not create new jobs and the consumer will skip processing. To resume, set the state back to `IDLE` or another appropriate state.

### State Properties

The state machine uses three resource properties:

- **`flowapi_processing_state`** – Current state value (one of the states above)
- **`flowapi_processing_state_timestamp`** – ISO8601 timestamp of when the state was last updated
- **`flowapi_processing_error`** – Error message (only set when state is `ERROR`)

### State Transitions

**Normal Flow:**
```
IDLE → QUEUED → PROCESSING → COMPLETED
```

**With Errors:**
```
IDLE → QUEUED → PROCESSING → ERROR
```

**Skipped Processing:**
```
IDLE → QUEUED → PROCESSING → SKIPPED
```

**Manual Hold:**
```
Any State → HOLD (user sets manually)
HOLD → IDLE (user releases hold)
```

**Job Deduplication:**
- When a resource is in `QUEUED` or `PROCESSING` state, `FlowResourceChangeListener` will skip creating new jobs for that resource.
- When a job starts and finds a resource in `QUEUED` or `PROCESSING` state (from another job), it will retry later (up to 10 times) before giving up and setting state to `ERROR`.

**Hold Behavior:**
- `FlowResourceChangeListener` checks for `HOLD` state before creating jobs. If `HOLD`, no job is created.
- `FlowJobConsumer` checks for `HOLD` state before processing. If `HOLD`, the resource is marked as `SKIPPED` and processing is skipped.

### Implementation

State management is implemented in:

- **`FlowService.setResourceState()`** – Helper method to update state properties on a resource (operates on `/var` resources)
- **`FlowSyncJobConsumer.process()`** – Checks state before processing and updates state during processing
- **`FlowSyncJobConsumer.isResourceStuck()`** – Detects and recovers from stuck states (timeout or missing job ID)

```java
// Example: Setting resource state
FlowService.setResourceState(resource, FlowService.STATE_PROCESSING, null);
FlowService.setResourceState(resource, FlowService.STATE_ERROR, "Failed to create flow");
```

### Property Name Helper

Property names are generated using the `FlowService.prop()` helper method:

```java
// Instead of: FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_PROCESSING_STATE
// Use: FlowService.prop(FlowService.PROPERTY_PROCESSING_STATE)
// Returns: "flowapi_processing_state"
```

## Event Pipeline

- **Change detection** – `FlowResourceChangeListener` watches `/content` paths and uses `PROPERTY_NAMES_HINT` to only trigger on user-controlled property changes (`flowapi_enable`, `flowapi_template`, `flowapi_title`, etc.), preventing loops from internal FlowService updates. The listener is simplified to **only create jobs** with `componentPath` and `changeType` - **all business logic is handled by `FlowSyncJobConsumer`**. This follows the architectural principle that change listeners should only create jobs, not perform business logic.  
```120:143:application/backend/src/main/java/ai/typerefinery/websight/events/flow/FlowResourceChangeListener.java
    public void processChanges(List<ResourceChange> changes, ResourceResolver resourceResolver) {
        LOGGER.info("FlowResourceChangeListener.processChanges: Processing {} change(s)", 
            changes != null ? changes.size() : 0);
        
        for (ResourceChange change : changes) {
            String componentPath = change.getPath();
            ResourceChange.ChangeType changeType = change.getType();
            
            LOGGER.info("FlowResourceChangeListener.processChanges: Creating job for change. path={}, type={}", 
                componentPath, changeType);
            
            // Create job with component path and change type
            // FlowSyncJobConsumer will handle all business logic (flow-enabled check, cleanup, etc.)
            Map<String, Object> props = new HashMap<>();
            props.put("componentPath", componentPath);
            props.put("changeType", changeType.toString());
            
            Job job = jobManager.addJob(JOB_TOPIC, props);
            String jobId = job != null ? job.getId() : null;
            
            LOGGER.info("FlowResourceChangeListener.processChanges: Created job. path={}, changeType={}, jobId={}", 
                componentPath, changeType, jobId);
        }
    }
```

- **Job execution** – `FlowSyncJobConsumer` processes jobs created by the listener. The execution flow is refactored into separate methods for clarity:

  **For REMOVED changes** (`processRemovedChange`):
  1. Get `/var` resource (component is already deleted)
  2. If `/var` resource exists and has a valid `flowstreamid`, pause the flow via Flow API
  3. Delete `/var` resource
  4. Return `OK` or `FAILED`

  **For ADDED/CHANGED updates** (`processUpdateChange`):
  1. **Check flow-enabled FIRST** - Verify component resource exists and is flow-enabled. If not flow-enabled, return `OK` immediately (no state reservation needed).
  2. Get or create `/var/typerefinery/flow/{componentPath}` resource (only for flow-enabled resources)
  3. **Check and reserve state** (`checkAndReserveState`):
     - Handle `HOLD` state (skip processing)
     - Handle `QUEUED`/`PROCESSING` state (check if stuck, retry if owned by another job)
     - Reserve state to `PROCESSING` with job ID
  4. **Sync component metadata to var** - Copy user-controlled properties from `/content` to `/var` via `FlowSyncStorageService.syncComponentToVar()`
  5. **Handle enable/disable transitions** (`handleEnableDisableTransitions`):
     - If disabled + valid flow ID → Pause flow
     - If enabled (was disabled) + valid flow ID → Unpause flow
     - If enabled → Sync `/var` to Flow API via `FlowSyncStorageService.syncVarToFlow()`
     - If disabled + no flow ID → Nothing to do
  6. Set final state (`COMPLETED`, `ERROR`, or `SKIPPED`)
  
  The consumer uses a configurable retry mechanism (default: 10 retries) and detects stuck resources (timeout or missing job ID) for automatic recovery. The flow-enabled check happens **before** state reservation to prevent unnecessary job queuing for non-flow-enabled resources.

## Component Registration and Defaults

- **Flow components** – `FlowComponent` exposes persisted Flow metadata via Sling Models, ensures container detection, and can lazily recreate flows if they disappear. The model reads user-controlled properties from the `/content` component resource (injected) and Flow service-managed properties from the corresponding `/var/typerefinery/flow/` resource (loaded in `@PostConstruct` via `FlowSyncStorageService`). This separation prevents listener loops while maintaining a unified model interface.
  
  **User-controlled properties** (from `/content`):
  - `flowapi_enable`, `flowapi_template`, `flowapi_title`, `flowapi_icon`, `flowapi_color`, `flowapi_name`, `flowapi_group`, `flowapi_reference`, `flowapi_version`, `flowapi_readme`, `flowapi_sampledata`
  
  **Flow service properties** (from `/var`):
  - `flowapi_flowstreamid`, `flowapi_paused`, `flowapi_editurl`, `flowapi_httproute`, `flowapi_httproutenosfx`, `flowapi_websocketurl`, `flowapi_createdon`, `flowapi_updatedon`
  
```197:250:application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java
    @Override
    @PostConstruct
    protected void init() {
        super.init();
        
        // Read Flow service properties from /var resource
        // User-controlled properties are already injected from component resource
        if (this.resource != null && this.resourceResolver != null && flowSyncStorage != null) {
            try {
                Resource varResource = flowSyncStorage.getOrCreateVarResource(
                    this.resource.getPath(),
                    this.resourceResolver
                );
                
                if (varResource != null) {
                    org.apache.sling.api.resource.ValueMap varProps = varResource.getValueMap();
                    
                    // Read Flow service managed properties from var resource
                    this.flowapi_flowstreamid = varProps.get(
                        FlowService.prop(FlowService.PROPERTY_FLOWSTREAMID),
                        String.class
                    );
                    // ... other Flow service properties
                }
            } catch (Exception e) {
                LOG.warn("FlowComponent.init: Error reading Flow service properties from var resource", e);
            }
        }
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

`doProcessFlowResource` determines whether to create, update, or pause/unpause flows. It now operates on `/var/typerefinery/flow/` resources (passed from `FlowSyncJobConsumer` via `FlowSyncStorageService`), which prevents listener loops. The method rejects non Flow components, ensures the JSON template exists, then branches based on `flowapi_enable` state:

- **When `flowapi_enable` is `false`**: If a flow ID exists, the flow is paused via `/flow/pause/{id}?is=1` (FastAPI proxy).
- **When `flowapi_enable` is `true`**:
  - If no flow ID exists and a template exists, a new flow is created.
  - If a flow ID exists but the remote flow is missing (deleted), the flow is recreated.
  - If a flow ID exists and the remote flow exists, metadata is compared. If metadata has changed, the flow is updated via `/flow/save/` (metadata, FastAPI proxy) and `/flow/update` (content, FastAPI proxy).

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

- **Metadata updates** – `updateFlowFromTemplate` first saves metadata changes via `/flow/save/{id}` endpoint (FastAPI proxy), then loads the existing flow definition from `/flow/export/{id}` (FastAPI proxy), applies metadata changes, and posts the full update to `/flow/update` (FastAPI proxy). This ensures the Flow service remains the source of truth for flow content while metadata is synchronized from the CMS. Updated timestamps, edit URL, and client routes are written back.  
```1034:1041:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
        // First, save metadata changes via /flow/save/ (FastAPI proxy)
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

- **Pause control** – `toggleFlowStreamPause` sends GET requests to `/flow/pause/{flowstreamid}?is=0|1` (FastAPI proxy), where:
  - `is=0` means **not paused** (active/resumed)
  - `is=1` means **paused**
  
  The FastAPI proxy forwards the request to the Flow service. The pause state is persisted to the resource as `flowapi_paused` property.  
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

- **Metadata save** – `saveMetadataToFlow` sends POST requests to `/flow/save/{flowstreamid}` (FastAPI proxy) with a JSON payload containing metadata fields: `group`, `name`, `author`, `reference`, `icon`, `color`, `version`, and `readme`. The FastAPI proxy forwards the request to the Flow service. This endpoint updates only metadata without affecting flow content, allowing CMS-driven metadata changes to be synchronized to the Flow service.  
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
- **Metadata synchronization** – When a flow is updated, metadata is first saved via `/flow/save/` (FastAPI proxy), then the full flow definition (including content) is updated via `/flow/update` (FastAPI proxy). This ensures metadata changes are reflected immediately while preserving flow content managed in Flow Designer.
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
  2. Enable the **Flow API** checkbox (`flowapi_enable`). The dialog shows user-editable metadata fields (name, group, icon, color, etc.) and read-only Flow URLs (editurl, httproute, websocketurl) from the `/var` resource.
  3. Activate or publish the component change. The change listener creates a job that `FlowSyncJobConsumer` processes, syncing metadata to `/var` and calling `FlowService` to create/update the flow.
  4. The Form model mirrors those routes into `readUrl`/`writeUrl`, so form submissions automatically target the Flow proxy.

- **Verification** – Reopen the dialog to confirm the Flow URLs (editurl, httproute) are displayed correctly. These values are read from the `/var/typerefinery/flow/` resource and updated after successful Flow API calls. Use Flow Designer to adjust downstream behavior as needed.

## Configuration

`FlowServiceConfiguration` centralizes host URLs, endpoint templates, default authorship, and the flag toggling the listener + job pipeline. 

### Host URL Configuration

- **`host_url()`** – Internal host URL for the FastAPI proxy service (default: `http://localhost:8000`). The FastAPI service acts as a proxy/gateway that forwards requests to the actual Flow service. Used for all service-to-service API operations like pause/unpause, save metadata, import, update, export, etc.
- **`host_url_client()`** – Client-facing host URL used for URLs displayed in the UI (default: `https://flow.typerefinery.localhost:8101`). This is what users see in dialogs and what browsers will access.

**Important**: Service-to-service calls must use `host_url()` (FastAPI proxy), while URLs sent to the client/UI must use `host_url_client()`.

### Endpoints

Service-to-service endpoints via FastAPI proxy (use `host_url()`):
- `/flow/pause/{id}?is=0|1` – Pause/unpause flows (default: `"/flow/pause/%s?is=%s"`). FastAPI proxies this to the Flow service.
- `/flow/save/{id}` – Save flow metadata (default: `"/flow/save/%s"`). FastAPI proxies this to the Flow service.
- `/flow/export/{id}` – Export flow definition
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
        String endpoint_streams_pause() default "/flow/pause/%s?is=%s";
        
        @AttributeDefinition(
            name = "Flow Stream Save Endpoint",
            description = "Endpoint template for saving flow metadata (FastAPI proxy endpoint)",
            type = AttributeType.STRING
        )
        String endpoint_streams_save() default "/flow/save/%s";
```

## Architecture: /var Storage for Flow Service Data

To prevent listener loops, Flow service data is stored in `/var/typerefinery/flow/` instead of `/content`. This architectural change ensures that FlowService updates don't trigger the `FlowResourceChangeListener` which only watches `/content` paths.

### Path Mapping

Component paths in `/content` are mapped to `/var` paths by prepending `/var/typerefinery/flow`:

```
/content/pages/home/jcr:content/rootcontainer/form
  → /var/typerefinery/flow/content/pages/home/jcr:content/rootcontainer/form
```

### FlowSyncStorageService

The `FlowSyncStorageService` manages the `/var` storage and synchronization:

- **`getVarPath(componentPath)`** – Maps component path to var path
- **`getOrCreateVarResource(componentPath, resolver)`** – Gets or creates var resource
- **`syncComponentToVar(componentResource)`** – Syncs user metadata from `/content` to `/var`
- **`syncVarToFlow(varResource, changeType)`** – Calls FlowService to sync `/var` data to Flow API
- **`syncFlowToVar(varResource, flowResponseData)`** – Writes Flow API responses back to `/var`

### Data Separation

**Component Resource** (`/content/...`):
- User-editable metadata: `flowapi_enable`, `flowapi_template`, `flowapi_title`, `flowapi_icon`, etc.

**Var Resource** (`/var/typerefinery/flow/...`):
- Flow service data: `flowapi_flowstreamid`, `flowapi_httproute`, `flowapi_editurl`, etc.
- State machine: `flowapi_processing_state`, `flowapi_processing_job_id`, etc.

### Dialog Components

The Flow dialog uses `typerefinery/components/dialog/flow/openurl` to display read-only Flow URLs (editurl, httproute, websocketurl) from the `/var` resource. This component uses `FlowOpenUrlModel` to read values from the var resource.

## Summary

The Flow subsystem combines Sling listeners, jobs, registries, and comprehensive service utilities to keep authored components synchronized with the external Flow runtime. Templates plus metadata drive both initial flow creation and ongoing design synchronization, while configuration and registries keep the system adaptable and extensible. The `/var` storage architecture prevents listener loops by separating user-editable data (in `/content`) from Flow service-managed data (in `/var`).

