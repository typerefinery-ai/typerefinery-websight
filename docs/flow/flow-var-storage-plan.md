# Flow Component Var Storage Architecture Plan

## Problem Statement

Currently, Flow component properties are stored directly on the component resource in `/content`, which causes the `FlowResourceChangeListener` to trigger on every FlowService update, creating infinite loops.

## Solution: Store Flow Data in `/var` with FlowSyncStorageService

Move all Flow service data to `/var/typerefinery/flow/` to prevent listener loops while keeping metadata in the component dialog.

## Architecture Overview

### Path Mapping

**Component Path** → **Var Path** (simply prepend `/var/typerefinery/flow`)

```
/content/pages/home/jcr:content/rootcontainer/form
  → /var/typerefinery/flow/content/pages/home/jcr:content/rootcontainer/form

/content/typerefinery-showcase/pages/components/form/jcr:content/rootcontainer/main/form
  → /var/typerefinery/flow/content/typerefinery-showcase/pages/components/form/jcr:content/rootcontainer/main/form

/content/os-triage/pages/dashboard/jcr:content/rootcontainer/header
  → /var/typerefinery/flow/content/os-triage/pages/dashboard/jcr:content/rootcontainer/header
```

### Data Storage

**Component Resource** (`/content/...`):
```
/content/pages/home/jcr:content/rootcontainer/form
  ├── flowapi_enable (user-controlled)
  ├── flowapi_template (user-controlled)
  ├── flowapi_title (user-controlled)
  ├── flowapi_icon (user-controlled)
  ├── flowapi_color (user-controlled)
  └── ... (other user-controlled metadata)
```

**Var Resource** (`/var/typerefinery/flow/...`):
```
/var/typerefinery/flow/content/pages/home/jcr:content/rootcontainer/form
  ├── flowapi_flowstreamid (from Flow service)
  ├── flowapi_processing_state (state machine)
  ├── flowapi_processing_job_id (job tracking)
  ├── flowapi_processing_state_timestamp
  ├── flowapi_processing_error
  ├── flowapi_paused (from Flow service)
  ├── flowapi_httproute (from Flow service)
  ├── flowapi_httproutenosfx (from Flow service)
  ├── flowapi_websocketurl (from Flow service)
  ├── flowapi_editurl (from Flow service)
  └── ... (all Flow service response data)
```

### Path Examples for Different Page Structures

**Simple Page with Form**:
- Component: `/content/pages/home/jcr:content/rootcontainer/form`
- Var: `/var/typerefinery/flow/content/pages/home/jcr:content/rootcontainer/form`

**Nested Page Structure**:
- Component: `/content/typerefinery-showcase/pages/components/form/jcr:content/rootcontainer/main/form`
- Var: `/var/typerefinery/flow/content/typerefinery-showcase/pages/components/form/jcr:content/rootcontainer/main/form`

**Deep Component Nesting**:
- Component: `/content/pages/home/jcr:content/rootcontainer/main/container/section/form`
- Var: `/var/typerefinery/flow/content/pages/home/jcr:content/rootcontainer/main/container/section/form`

**Flow Container Component**:
- Component: `/content/pages/home/jcr:content/rootcontainer/flowcontainer`
- Var: `/var/typerefinery/flow/content/pages/home/jcr:content/rootcontainer/flowcontainer`

## Task List

### 1. Create FlowSyncStorageService

**File**: `application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowSyncStorageService.java`

**Methods**:
- `getVarPath(String contentPath)` → `/var/typerefinery/flow{contentPath}`
- `getOrCreateVarResource(String contentPath, ResourceResolver resolver)` → Gets or creates var resource
- `syncComponentToVar(Resource componentResource)` → Copies component metadata to var resource
- `syncVarToFlow(Resource varResource)` → Syncs var data to Flow service (called by job)
- `syncFlowToVar(Resource varResource, Map<String, Object> flowResponse)` → Writes Flow service response to var

**Code Structure**:
```java
@Component(service = FlowSyncStorageService.class)
public class FlowSyncStorageService {
    private static final String VAR_ROOT = "/var/typerefinery/flow";
    
    @Reference
    private FlowService flowService;
    
    public String getVarPath(String contentPath) {
        return VAR_ROOT + contentPath;
    }
    
    public Resource getOrCreateVarResource(String contentPath, ResourceResolver resolver) {
        String varPath = getVarPath(contentPath);
        Resource varResource = resolver.getResource(varPath);
        if (varResource == null) {
            varResource = createVarResource(varPath, resolver);
        }
        return varResource;
    }
    
    public void syncComponentToVar(Resource componentResource) {
        // Copy user metadata to var resource
    }
    
    public boolean syncVarToFlow(Resource varResource) {
        // Call FlowService to update/create flow
        return flowService.doProcessFlowResource(varResource, ResourceChange.ChangeType.CHANGED);
    }
    
    public void syncFlowToVar(Resource varResource, Map<String, Object> flowResponse) {
        PageUtil.updatResourceProperties(varResource, flowResponse, true);
    }
}
```

### 2. Update FlowService to Use Var Resources

**File**: `application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java`

**Changes**:
- Inject `FlowSyncStorageService`
- Update `doProcessFlowResource()` to accept var resource (not component resource)
- Update `setResourceState()` to write to var resource
- Update `persistPauseState()` to write to var resource
- Update `createFlowFromTemplate()` to write response via `flowSyncStorage.syncFlowToVar()`
- Update `updateFlowFromTemplate()` to write response via `flowSyncStorage.syncFlowToVar()`

**Key Change**: FlowService now operates on var resources, not component resources.

### 3. Update FlowComponent Model to Read from Both

**File**: `application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java`

**Changes**:
- Inject `FlowSyncStorageService`
- User-controlled properties: Read from component resource (injected)
- Flow service properties: Read from var resource in `@PostConstruct`
- If var resource doesn't exist, create it (means it needs sync)

**Code Structure**:
```java
@Model(adaptables = {SlingHttpServletRequest.class, Resource.class})
public class FlowComponent {
    @Inject
    private Resource resource;  // Component resource from /content
    
    @Inject
    private FlowSyncStorageService flowSyncStorage;
    
    // User metadata (from component resource)
    @Inject
    @Named(FlowService.prop(FlowService.PROPERTY_ENABLE))
    public Boolean flowapi_enable;
    
    // Flow service data (from var resource)
    public String flowapi_flowstreamid;
    public Boolean flowapi_paused;
    
    @PostConstruct
    protected void init() {
        Resource varResource = flowSyncStorage.getOrCreateVarResource(
            resource.getPath(), 
            resource.getResourceResolver()
        );
        // Read Flow service properties from varResource
    }
}
```

### 4. Update FlowResourceChangeListener

**File**: `application/backend/src/main/java/ai/typerefinery/websight/events/flow/FlowResourceChangeListener.java`

**Changes**:
- Inject `FlowSyncStorageService`
- When component changes:
  1. Sync component metadata to var resource
  2. Create job with var resource path
  3. Job tells FlowSyncService to update flow
- Remove complex property filtering (no longer needed)
- Only watch `/content` (var changes won't trigger)

**Code Structure**:
```java
public void processChanges(List<ResourceChange> changes, ResourceResolver resourceResolver) {
    for (ResourceChange change : changes) {
        Resource componentResource = resourceResolver.getResource(change.getPath());
        
        if (flowService.isFlowEnabledResource(componentResource)) {
            // Sync component metadata to var
            flowSyncStorage.syncComponentToVar(componentResource);
            
            // Get var path and create job
            String varPath = flowSyncStorage.getVarPath(componentResource.getPath());
            Map<String, Object> props = new HashMap<>();
            props.put("varPath", varPath);
            jobManager.addJob(FLOW_SYNC_JOB_TOPIC, props);
        }
    }
}
```

### 5. Create FlowSyncJobConsumer

**File**: `application/backend/src/main/java/ai/typerefinery/websight/jobs/flow/FlowSyncJobConsumer.java`

**Purpose**: Process jobs to sync var resources to Flow service

**Code Structure**:
```java
@Component(
  property = {
    JobConsumer.PROPERTY_TOPICS + "=io/typerefinery/websight/flow/sync"
  }
)
public class FlowSyncJobConsumer implements JobConsumer {
    
    @Reference
    private FlowSyncStorageService flowSyncStorage;
    
    @Override
    public JobResult process(Job job) {
        String varPath = job.getProperty("varPath", String.class);
        
        try (ResourceResolver resolver = contentAccess.getAdminResourceResolver()) {
            Resource varResource = resolver.getResource(varPath);
            if (varResource == null) {
                return JobResult.FAILED;
            }
            
            // Sync var resource to Flow service
            boolean success = flowSyncStorage.syncVarToFlow(varResource);
            return success ? JobResult.OK : JobResult.FAILED;
        }
    }
}
```

### 6. Update Flow Dialog

**File**: `application/backend/src/main/resources/apps/typerefinery/components/flow/flowcontainer/dialog/.content.json`

**Changes**:
- Remove read-only Flow service fields (flowstreamid, httproute, editurl, websocketurl, etc.)
- Keep only user-editable metadata fields:
  - `flowapi_enable`
  - `flowapi_template`
  - `flowapi_title`
  - `flowapi_icon`
  - `flowapi_color`
  - `flowapi_name`
  - `flowapi_group`
  - `flowapi_reference`
  - `flowapi_version`
  - `flowapi_readme`
  - `flowapi_sampledata`

### 7. Create Flow OpenUrl Dialog Component

**File**: `application/backend/src/main/resources/apps/typerefinery/components/dialog/flow/openurl/.content.json`

**Purpose**: Display Flow URLs (read-only) from var resource

**Based On**: Copy `typerefinery/components/dialog/url` component

**Component Path**: `typerefinery/components/dialog/flow/openurl`

**Code Structure**:
```javascript
// OpenUrl.js
export default class OpenUrl extends URL {
  getValue() {
    const componentPath = this.getComponentPath();
    const varPath = `/var/typerefinery/flow${componentPath}`;
    const varResource = this.getResource(varPath);
    return varResource?.getValueMap()?.get(this.propertyName, '');
  }
}
```

**Dialog Usage**:
```json
{
  "httproute": {
    "sling:resourceType": "typerefinery/components/dialog/flow/openurl",
    "propertyName": "flowapi_httproute",
    "fieldLabel": "HTTP Route",
    "readOnly": true
  },
  "editurl": {
    "sling:resourceType": "typerefinery/components/dialog/flow/openurl",
    "propertyName": "flowapi_editurl",
    "fieldLabel": "Edit URL",
    "readOnly": true
  }
}
```

## Data Flow

```
User changes component metadata
  → FlowResourceChangeListener detects change
  → syncComponentToVar() copies metadata to /var
  → Creates job with var path
  → FlowSyncJobConsumer processes job
  → syncVarToFlow() calls FlowService
  → FlowService updates Flow service
  → syncFlowToVar() writes response to /var
  → /var changes don't trigger /content listener (no loop!)
```

## Benefits

1. **No More Loops**: `/var` changes don't trigger `/content` listener
2. **Clean Separation**: User data vs. service data
3. **Simpler Dialog**: Only user-editable fields
4. **Better Performance**: Less property filtering needed
5. **Easier Debugging**: Clear data location

## Testing

1. Enable flow → check `/var` resource created
2. Update title → check only component resource updated
3. Check dialog shows URLs from var resource
4. Verify no listener loops
5. Test job retry mechanism

## Files to Create/Modify

**New Files**:
- `FlowSyncStorageService.java`
- `FlowSyncJobConsumer.java`
- `typerefinery/components/dialog/flow/openurl/.content.json`
- `typerefinery/components/dialog/flow/openurl/README.md`
- `typerefinery/components/dialog/flow/openurl/clientlibs/OpenUrl.js`

**Modified Files**:
- `FlowService.java` (operates on var resources)
- `FlowComponent.java` (reads from both)
- `FlowResourceChangeListener.java` (simplified - just raises jobs)
- `flowcontainer/dialog/.content.json` (only user metadata fields)
