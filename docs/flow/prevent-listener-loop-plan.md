# Prevent Flow Resource Change Listener Loop

## Problem

When `FlowService` updates resource properties (e.g., `flowapi_flowstreamid`, `flowapi_processing_state`, `flowapi_paused`), these updates trigger `FlowResourceChangeListener` again, creating an infinite loop:

```
User changes flowapi_enable
  → Listener detects change
  → Creates job, sets QUEUED state
  → JobConsumer processes
  → FlowService updates flowapi_flowstreamid, flowapi_processing_state, etc.
  → Listener detects these changes
  → Creates new job
  → Loop continues...
```

## Current Protection

- **PROPERTY_NAMES_HINT**: Only listens to user-controlled properties:
  - `flowapi_enable`
  - `flowapi_template`
  - `flowapi_title`
  - `flowapi_icon`
  - `flowapi_color`
  - `flowapi_name`
  - `flowapi_group`
  - `flowapi_reference`
  - `flowapi_version`
  - `flowapi_sampledata`
  - `flowapi_readme`

**Issue**: PROPERTY_NAMES_HINT may not work as expected, or we might be updating properties that ARE in the list.

## Properties FlowService Updates (Internal)

These should NOT trigger the listener:
- `flowapi_flowstreamid` - Flow ID from service
- `flowapi_processing_state` - State machine state
- `flowapi_processing_job_id` - Job ID tracking
- `flowapi_processing_state_timestamp` - State timestamp
- `flowapi_processing_error` - Error message
- `flowapi_paused` - Pause state from service
- `flowapi_httproute` - HTTP route from service
- `flowapi_httproutenosfx` - HTTP route without suffix
- `flowapi_websocketurl` - WebSocket URL from service
- `flowapi_editurl` - Edit URL from service

## Solution Options

### Option 1: Check Changed Properties (Recommended)

**Approach**: Use `ResourceChange.getPropertyNames()` to check which properties changed, and only process if they're user-controlled properties.

**Pros**:
- ✅ Precise - only processes actual user changes
- ✅ Works even if PROPERTY_NAMES_HINT doesn't filter correctly
- ✅ Can log which properties triggered the change

**Cons**:
- ⚠️ Requires ResourceChange API to support getPropertyNames()
- ⚠️ Need to maintain list of user-controlled properties

**Implementation**:
```java
private boolean isUserControlledPropertyChange(ResourceChange change) {
    Set<String> changedProperties = change.getPropertyNames();
    if (changedProperties == null || changedProperties.isEmpty()) {
        // If we can't determine, allow processing (safer)
        return true;
    }
    
    // Check if any changed property is user-controlled
    Set<String> userControlledProps = Set.of(
        FlowService.prop(FlowService.PROPERTY_ENABLE),
        FlowService.prop(FlowService.PROPERTY_TEMPLATE),
        FlowService.prop(FlowService.PROPERTY_TITLE),
        // ... other user-controlled properties
    );
    
    for (String prop : changedProperties) {
        if (userControlledProps.contains(prop)) {
            return true; // User-controlled property changed
        }
    }
    
    return false; // Only internal properties changed
}
```

### Option 2: Check Processing State

**Approach**: If resource is in PROCESSING state with our job ID, skip it (already implemented, but may not catch all cases).

**Pros**:
- ✅ Already partially implemented
- ✅ Simple check

**Cons**:
- ⚠️ May not catch all cases (e.g., if state check happens before state is set)
- ⚠️ Race condition window

### Option 3: Session Attribute Flag

**Approach**: Set a session attribute when updating properties, check it in listener.

**Pros**:
- ✅ Can mark internal updates explicitly

**Cons**:
- ⚠️ Requires session access
- ⚠️ May not work across different sessions
- ⚠️ More complex

### Option 4: Check Change Type + Processing State

**Approach**: Only process CHANGED events if resource is NOT currently being processed.

**Pros**:
- ✅ Simple
- ✅ Works with existing state machine

**Cons**:
- ⚠️ May skip legitimate user changes during processing
- ⚠️ Need to handle edge cases

## Recommended Solution: Hybrid Approach

**Combine Option 1 + Option 2**:

1. **Check changed properties** (if available) - Only process if user-controlled properties changed
2. **Check processing state** - Skip if resource is currently being processed by our job
3. **Fallback** - If we can't determine changed properties, use processing state check

### Implementation Plan

1. **Add helper method** to check if change is from user-controlled properties
2. **Update processChanges()** to check changed properties before processing
3. **Add logging** to track which properties triggered changes
4. **Test** with rapid updates to ensure no loops

### Code Changes

```java
private boolean isUserControlledPropertyChange(ResourceChange change) {
    // Try to get changed properties
    try {
        Set<String> changedProperties = change.getPropertyNames();
        if (changedProperties != null && !changedProperties.isEmpty()) {
            // Check if any changed property is user-controlled
            Set<String> userControlledProps = getUserControlledProperties();
            for (String prop : changedProperties) {
                if (userControlledProps.contains(prop)) {
                    return true;
                }
            }
            // Only internal properties changed
            return false;
        }
    } catch (Exception e) {
        LOGGER.error("Error checking changed properties", e);
    }
    
    // If we can't determine, allow processing (safer to process than skip)
    return true;
}

private Set<String> getUserControlledProperties() {
    return Set.of(
        FlowService.prop(FlowService.PROPERTY_ENABLE),
        FlowService.prop(FlowService.PROPERTY_TEMPLATE),
        FlowService.prop(FlowService.PROPERTY_TEMPLATE_DESIGN),
        FlowService.prop(FlowService.PROPERTY_TITLE),
        FlowService.prop(FlowService.PROPERTY_ICON),
        FlowService.prop(FlowService.PROPERTY_COLOR),
        FlowService.prop(FlowService.PROPERTY_NAME),
        FlowService.prop(FlowService.PROPERTY_GROUP),
        FlowService.prop(FlowService.PROPERTY_REFERENCE),
        FlowService.prop(FlowService.PROPERTY_VERSION),
        FlowService.prop(FlowService.PROPERTY_SAMPLEDATA),
        FlowService.prop(FlowService.PROPERTY_README)
    );
}
```

## Testing Strategy

1. **Unit Tests**: Test property filtering logic
2. **Integration Tests**: 
   - Create flow → verify no loop
   - Update flow metadata → verify no loop
   - Rapid updates → verify no loop
3. **Manual Tests**:
   - Enable flow → check logs for loop
   - Update title → check logs for loop
   - Update multiple properties → check logs for loop

## Alternative: Verify PROPERTY_NAMES_HINT

Before implementing, verify that PROPERTY_NAMES_HINT is working correctly. If it is, the issue might be:
- We're updating a property that IS in the list
- PROPERTY_NAMES_HINT doesn't work for batch updates
- There's a bug in Sling's implementation

Add logging to see which properties are actually triggering events.

