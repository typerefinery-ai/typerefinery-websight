# Flow Component Var Storage Architecture

This document describes the architecture for storing Flow service data in `/var/typerefinery/flow/` to prevent listener loops.

## Problem Statement

Flow component properties were previously stored directly on the component resource in `/content`, which caused the `FlowResourceChangeListener` to trigger on every FlowService update, creating infinite loops.

## Solution: Store Flow Data in `/var` with FlowSyncStorageService

All Flow service data is now stored in `/var/typerefinery/flow/` to prevent listener loops while keeping user-editable metadata in the component dialog.

## Architecture Overview

### Path Mapping

**Component Path** → **Var Path** (prepend `/var/typerefinery/flow`)

```
/content/pages/home/jcr:content/rootcontainer/form
  → /var/typerefinery/flow/content/pages/home/jcr:content/rootcontainer/form
```

### Data Storage

**Component Resource** (`/content/...`):
- User-editable metadata: `flowapi_enable`, `flowapi_template`, `flowapi_title`, `flowapi_icon`, `flowapi_color`, `flowapi_name`, `flowapi_group`, `flowapi_reference`, `flowapi_version`, `flowapi_readme`, `flowapi_sampledata`

**Var Resource** (`/var/typerefinery/flow/...`):
- Flow service data: `flowapi_flowstreamid`, `flowapi_paused`, `flowapi_httproute`, `flowapi_editurl`, `flowapi_websocketurl`, etc.
- These values are stored under `/var`, but URL properties such as `flowapi_httproute` must still point to the real client-facing Flow host, not to `/var/...` repository paths.
- The normalized client-facing route path is also reused as the default Flow group/category for a page unless an authored `flowapi_group` overrides it.
- State machine: `flowapi_processing_state`, `flowapi_processing_job_id`, `flowapi_processing_state_timestamp`, `flowapi_processing_error`

## Implementation Details

### 1. FlowSyncStorageService

**File**: `application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowSyncStorageService.java`

**Responsibilities**:
- Maps `/content` paths to `/var` paths
- Creates `/var` resources when needed
- Syncs component metadata to `/var`
- Calls FlowService to sync `/var` data to Flow API
- Resolves the original component resource before invoking FlowService so route generation continues to use the authored `/content` path while `/var` remains only the storage layer
- Writes Flow API responses back to `/var`

### 2. FlowSyncJobConsumer

**File**: `application/backend/src/main/java/ai/typerefinery/websight/jobs/flow/FlowSyncJobConsumer.java`

**Responsibilities**:
- Processes jobs created by `FlowResourceChangeListener`
- Checks if resource is flow-enabled
- Gets or creates `/var` resource
- Checks state (HOLD, QUEUED, PROCESSING) and handles retries
- Detects and recovers from stuck states
- Syncs component metadata to `/var`
- Calls FlowService with `/var` resource
- Manages state transitions

**Configuration**:
- `maxRetryCount`: Maximum retries before giving up (default: 10)
- `processingTimeoutSeconds`: Timeout for stuck state detection (default: 300 seconds)

### 3. FlowResourceChangeListener (Simplified)

**File**: `application/backend/src/main/java/ai/typerefinery/websight/events/flow/FlowResourceChangeListener.java`

**Changes**:
- **Simplified**: Only creates jobs, no business logic
- Creates jobs with `componentPath` and `changeType`
- All business logic moved to `FlowSyncJobConsumer`

### 4. FlowComponent Model

**File**: `application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java`

**Changes**:
- User-controlled properties: Read from component resource (injected)
- Flow service properties: Read from `/var` resource in `@PostConstruct`
- Uses `FlowSyncStorageService` to get var resource

### 5. FlowService

**File**: `application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java`

**Changes**:
- `setResourceState()` is now public (used by `FlowSyncJobConsumer`)
- Operates on `/var` resources (passed from `FlowSyncJobConsumer`)

### 6. OpenUrl Dialog Component

**Files**:
- `application/backend/src/main/resources/apps/typerefinery/components/dialog/flow/openurl/.content.json`
- `application/backend/src/main/resources/apps/typerefinery/components/dialog/flow/openurl/openurl.json.html`
- `application/backend/src/main/java/ai/typerefinery/websight/models/dialog/FlowOpenUrlModel.java`

**Purpose**: Display read-only Flow URLs from `/var` resource in dialogs

### 7. Flow Dialog

**File**: `application/backend/src/main/resources/apps/typerefinery/components/flow/flowcontainer/dialog/.content.json`

**Changes**:
- Removed read-only Flow service fields (moved to OpenUrl components)
- Added OpenUrl components for `editurl`, `httproute`, `websocketurl`
- Kept only user-editable metadata fields

## Event Flow

### ADDED/CHANGED Flow

```
User Updates Component in Dialog
  → Save Properties to /content Resource
  → FlowResourceChangeListener Detects Change
  → Create Job (componentPath + changeType)
  → FlowSyncJobConsumer.process()
    → Validate Job Properties
    → processUpdateChange()
      → STEP 1: Check if Flow-Enabled FIRST
        → If not flow-enabled → Return OK (skip)
      → STEP 2: Get/Create Var Resource (only for flow-enabled)
      → STEP 3: Check and Reserve State
        → Check HOLD → Skip if HOLD
        → Check QUEUED/PROCESSING → Retry if owned by other job
        → Reserve State to PROCESSING
      → STEP 4: Sync Component Metadata to Var
        → Copy user properties from /content to /var
      → STEP 5: Handle Enable/Disable Transitions
        → If disabled + has flow ID → Pause flow
        → If enabled (was disabled) + has flow ID → Unpause flow
        → If enabled → Sync var to Flow API
      → STEP 6: Set Final State (COMPLETED/ERROR/SKIPPED)
```

### REMOVED Flow

```
User Deletes Component
  → Component Removed from /content
  → FlowResourceChangeListener Detects Change
  → Create Job (componentPath + REMOVED)
  → FlowSyncJobConsumer.process()
    → Validate Job Properties
    → processRemovedChange()
      → Get /var Resource
      → If /var exists and has flow ID → Pause flow via Flow API
      → Delete /var Resource
      → Return OK
```

See [flow-execution-flow.md](flow-execution-flow.md) and [flow-sync-flow.md](flow-sync-flow.md) for detailed diagrams.

## Benefits

1. **No Listener Loops**: Flow service updates to `/var` don't trigger `/content` listener
2. **Clean Separation**: User data in `/content`, Flow service data in `/var`
3. **State Machine**: Prevents duplicate processing with retry mechanism
4. **Stuck State Recovery**: Automatic detection and recovery from stuck jobs
5. **Simplified Listener**: Listener only creates jobs, all logic in consumer

## Future Enhancements

- Consider adding metrics for var resource operations
- Monitor var resource storage usage
- Consider cleanup of old var resources for deleted components
