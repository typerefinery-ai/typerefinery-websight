# Flow Page Deletion Handling

This document describes how Flow handles page deletions and cleanup of flows for components on deleted pages.

## Problem Statement

When a page is deleted in AEM, all child components are also deleted. However, the Flow system needs to:
1. **Pause flows** for all flow-enabled components on the deleted page
2. **Clean up /var resources** for all components on the deleted page

## Options Considered

### Option 1: Rely on Cascading REMOVED Events (Not Reliable)

**Approach**: Rely on JCR to trigger REMOVED events for all child components when a page is deleted.

**Pros**:
- Simple - no additional listener needed
- Works if JCR properly cascades events

**Cons**:
- **Unreliable**: JCR may not always trigger REMOVED events for all child resources
- **Order dependency**: Events might fire in unpredictable order
- **Timing issues**: Child resources might be deleted before events fire

**Verdict**: ❌ Not reliable enough for production use

### Option 2: Page Deletion Listener (Chosen)

**Approach**: Add a dedicated listener for page deletions that:
1. Detects when a page is deleted (REMOVED event on page resource)
2. Finds all /var resources for components under that page
3. Creates cleanup jobs for each /var resource with a flow ID

**Pros**:
- ✅ **Explicit and reliable**: Directly handles page deletions
- ✅ **Follows architecture**: Listener only creates jobs, consumer handles logic
- ✅ **Works even if cascading events fail**: Checks /var resources directly
- ✅ **Comprehensive**: Finds all flow components recursively

**Cons**:
- Requires /var resources to still exist when listener fires (they typically do, as /var is separate from /content)

**Verdict**: ✅ **Chosen approach**

### Option 3: Enhance REMOVED Handling

**Approach**: When processing a REMOVED event, check if it's a page and if so, find all child components.

**Pros**:
- Reuses existing infrastructure

**Cons**:
- ❌ **Component resources already deleted**: Can't check if they're flow-enabled
- ❌ **Complex logic in consumer**: Mixes page and component deletion logic
- ❌ **Relies on /var structure**: Must assume /var resources match component structure

**Verdict**: ❌ Not practical (components already deleted)

## Implementation: FlowPageDeletionListener

### Architecture

The `FlowPageDeletionListener` follows the same architectural pattern as `FlowResourceChangeListener`:

1. **Listener**: Only creates jobs (no business logic)
2. **Consumer**: Handles all cleanup logic (pause flow, delete /var resource)

### Flow

```
Page Deleted
  → FlowPageDeletionListener.onChange (REMOVED event)
  → Check if path is a page (not jcr:content)
  → Get /var path for page
  → Find /var resource (might still exist even if page deleted)
  → Recursively find all /var resources with flow IDs
  → Create cleanup job for each component
  → FlowSyncJobConsumer.processRemovedChange
    → Pause flow (if flow ID exists)
    → Delete /var resource
```

### Key Methods

#### `isPagePath(String path)`
Checks if a path is a page path (not `jcr:content` or a child of `jcr:content`).

**Examples**:
- ✅ `/content/pages/home` → Page path
- ❌ `/content/pages/home/jcr:content` → Not a page path
- ❌ `/content/pages/home/jcr:content/rootcontainer` → Not a page path

#### `findAndCleanupVarResources(Resource varResource, ResourceResolver resolver)`
Recursively finds all /var resources with flow IDs and creates cleanup jobs.

**Process**:
1. Check if current /var resource has a `flowstreamid`
2. If yes, reverse-map /var path to component path
3. Create cleanup job with component path and REMOVED change type
4. Recursively check all children

#### `getComponentPathFromVarPath(String varPath)`
Reverse maps /var path back to component path.

**Example**:
- Input: `/var/typerefinery/flow/content/pages/home/jcr:content/rootcontainer/form`
- Output: `/content/pages/home/jcr:content/rootcontainer/form`

### Configuration

The listener uses the same configuration as `FlowResourceChangeListener`:
- **Enabled/Disabled**: Controlled by `flow_page_change_listener_enabled` configuration
- **Paths**: Listens to `/content` path
- **Changes**: Only `REMOVED` events

### Job Creation

The listener creates jobs with:
- **Topic**: `FlowResourceChangeListener.JOB_TOPIC` (same as component changes)
- **Properties**:
  - `componentPath`: The component path (reverse-mapped from /var path)
  - `changeType`: `REMOVED`

The `FlowSyncJobConsumer` processes these jobs using the existing `processRemovedChange()` method.

## Benefits

1. **Reliable**: Explicitly handles page deletions, doesn't rely on cascading events
2. **Comprehensive**: Recursively finds all flow components on the page
3. **Consistent**: Uses same job processing infrastructure as component deletions
4. **Clean Architecture**: Listener only creates jobs, consumer handles logic
5. **No Duplication**: Reuses existing cleanup logic in `FlowSyncJobConsumer`

## Edge Cases

### Case 1: /var Resource Doesn't Exist
**Scenario**: Page deleted but no /var resource exists (no flows were created).

**Handling**: Listener logs debug message and continues. No cleanup needed.

### Case 2: /var Resource Already Deleted
**Scenario**: /var resource was already cleaned up by another process.

**Handling**: Listener can't find /var resource, logs debug message. No cleanup needed.

### Case 3: Multiple Flow Components on Page
**Scenario**: Page has multiple flow-enabled components.

**Handling**: Listener recursively finds all /var resources with flow IDs and creates a cleanup job for each.

### Case 4: Nested Components
**Scenario**: Flow components nested inside containers.

**Handling**: Recursive search finds all nested components with flow IDs.

## Testing

To test page deletion handling:

1. **Create a page** with flow-enabled components
2. **Verify flows are created** (check /var resources and Flow API)
3. **Delete the page**
4. **Verify**:
   - Cleanup jobs are created (check logs)
   - Flows are paused (check Flow API)
   - /var resources are deleted (check repository)

## Future Enhancements

- **Metrics**: Track page deletions and cleanup jobs created
- **Batch Processing**: If page has many components, consider batching cleanup jobs
- **Retry Logic**: Add retry mechanism if cleanup jobs fail

