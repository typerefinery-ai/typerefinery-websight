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

- **Flow components** – `FlowComponent` exposes persisted Flow metadata via Sling Models, ensures container detection, and can lazily recreate flows if they disappear.  
```54:135:application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java
    @Getter
    @Inject
    @Default(booleanValues = false)
    @Named(FlowService.PROPERTY_PREFIX + FlowService.PROPERTY_ENABLE)
    public Boolean flowapi_enable;
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

`doProcessFlowResource` determines whether to create or update. It rejects non Flow components, ensures the JSON template exists, then branches: create when no flow ID is stored; update when titles diverge. Container components also trigger design syncs.  
```177:243:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
        if (flowapi_enable && StringUtils.isNotBlank(flowapi_template)) {
            boolean isFlowExists = StringUtils.isNotBlank(flowComponent.flowapi_flowstreamid) ? isFlowExists(flowComponent.flowapi_flowstreamid) : false;
            boolean isTemplateExists = PageUtil.isResourceExists(flowapi_template, resourceResolver);
            if (isFlowExists == false && isTemplateExists) {
                String flowapi_flowstreamid = createFlowFromTemplate(flowComponent);
                ...
            } else if (isFlowExists && isTemplateExists) {
                if (flowComponent.flowapi_title.equals(flowComponent.title) || StringUtils.isBlank(flowComponent.title)) {
                    LOGGER.info("nothing to update.");
                } else {
                    updateFlowFromTemplate(flowComponent);
                    if (flowComponent.isContainer() & StringUtils.isNotBlank(flowComponent.flowapi_designtemplate)) {
                        updateFlowDesignFromTemplate(flowComponent);
                    }
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

- **Metadata updates** – `updateFlowFromTemplate` repopulates IDs, author, group, and title, serializes the template, and posts to `/flow/update`. Updated timestamps, edit URL, and client routes are written back.  
```788:841:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
        HashMap<String, Object> response = doFlowStreamUpdateData(componentJson, flowstreamid);
        response.put(prop(PROPERTY_UPDATEDON), DateUtil.getIsoDate(new Date()));
        response.put(prop(PROPERTY_HTTPROUTE), compileClientHttpRouteUrl(httpRoutePath + FLOW_TEMPLATE_FIELD_HTTP_ROUTE_URL_SUFFIX));
        PageUtil.updatResourceProperties(componentResource, response, true);
```
- **Design graph updates** – `updateFlowDesignFromTemplate` fetches existing design JSON, calculates non-overlapping tiles, injects child flow blocks, and saves the merged design via `/flow/{id}/design/save`.  
```911:1170:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
                String newDesignComponentsString = mapper.writeValueAsString(newDesignComponents);
                            
                doFlowStreamDesignSaveData(newDesignComponentsString, flowstreamid);
```

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

`FlowServiceConfiguration` centralizes host URLs, endpoint templates, default authorship, and the flag toggling the listener + job pipeline. Updating OSGi config allows point-and-click retargeting of the external Flow service.  
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
```

## Summary

The Flow subsystem combines Sling listeners, jobs, registries, and comprehensive service utilities to keep authored components synchronized with the external Flow runtime. Templates plus metadata drive both initial flow creation and ongoing design synchronization, while configuration and registries keep the system adaptable and extensible.

