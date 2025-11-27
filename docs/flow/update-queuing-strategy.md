# Flow Update Queuing Strategy

## Problem Statement

When users make rapid changes to Flow-enabled components (e.g., toggling enable/disable multiple times), multiple resource change events are triggered, creating multiple jobs that all execute in parallel. This leads to:

- **Redundant API calls** to the Flow service
- **Race conditions** where older updates overwrite newer ones
- **Unnecessary load** on both the CMS and Flow service
- **Potential inconsistencies** in flow state

## Current Architecture

1. **FlowResourceChangeListener** - Detects resource changes and creates jobs via `JobManager.addJob()`
2. **FlowJobConsumer** - Processes jobs and calls `doProcessFlowResource()` for each resource
3. **FlowService** - Makes API calls to Flow service (pause/unpause, save metadata, update flow)

**Current Flow:**
```
Resource Change → Listener → Job Created → Job Queue → Consumer → FlowService → API Call
```

**Problem Flow:**
```
Rapid Changes → Multiple Jobs → All Execute → Multiple API Calls (redundant)
```

## Solution Options

### Option 1: Job Deduplication with Cancellation (Recommended)

**Approach:** Before creating a new job, check for pending jobs for the same resource path and cancel them. Only the latest job executes.

**Implementation:**
- Use `JobManager.getJobs()` to find pending jobs for the same resource path
- Cancel existing jobs before creating a new one
- Use job properties to identify resource-specific jobs

**Pros:**
- ✅ Simple to implement
- ✅ Uses existing Sling Job infrastructure
- ✅ Only latest update executes
- ✅ No additional state management needed

**Cons:**
- ⚠️ Requires querying job queue (may have performance impact)
- ⚠️ Job cancellation might not be immediate

**Code Changes:**
- Modify `FlowResourceChangeListener.processChanges()` to check and cancel existing jobs
- Add helper method to find and cancel jobs for a resource path

---

### Option 2: Debouncing with Delayed Job Creation

**Approach:** Delay job creation by a short period (e.g., 500ms). If a new change arrives for the same resource within the delay period, cancel the previous job and reset the timer.

**Implementation:**
- Use a `ScheduledExecutorService` to delay job creation
- Maintain a map of `resourcePath → ScheduledFuture` to track delayed jobs
- Cancel previous scheduled job when a new change arrives

**Pros:**
- ✅ Naturally handles rapid changes
- ✅ Reduces total number of jobs created
- ✅ Configurable delay period

**Cons:**
- ⚠️ Adds complexity with thread management
- ⚠️ Requires cleanup of cancelled futures
- ⚠️ Introduces delay (may not be desired for all scenarios)

**Code Changes:**
- Add `ScheduledExecutorService` to `FlowResourceChangeListener`
- Modify `processChanges()` to schedule delayed job creation
- Add cleanup logic for cancelled futures

---

### Option 3: Resource-Level Locking in JobConsumer

**Approach:** Use a `ConcurrentHashMap` with per-resource locks to ensure only one update processes at a time for each resource. Queue subsequent updates.

**Implementation:**
- Maintain `ConcurrentHashMap<String, Lock>` for resource paths
- In `FlowJobConsumer.process()`, acquire lock before processing
- If lock is held, queue the update or skip if newer update exists

**Pros:**
- ✅ Prevents parallel processing of same resource
- ✅ No job cancellation needed
- ✅ Thread-safe

**Cons:**
- ⚠️ Requires managing lock lifecycle
- ⚠️ Doesn't prevent job creation (jobs still queue up)
- ⚠️ More complex state management

**Code Changes:**
- Add locking mechanism to `FlowJobConsumer`
- Modify `process()` to acquire/release locks
- Add cleanup for stale locks

---

### Option 4: Merge Changes in Listener

**Approach:** Instead of creating a new job for each change event, merge changes for the same resource into existing pending jobs or create a single consolidated job.

**Implementation:**
- Before creating a job, check if a job with the same resource path already exists
- If exists, update the job's change map with the latest change type
- If not, create a new job

**Pros:**
- ✅ Reduces total number of jobs
- ✅ Natural deduplication
- ✅ Simpler job processing

**Cons:**
- ⚠️ Sling jobs are immutable - cannot update existing jobs
- ⚠️ Would require custom job storage mechanism
- ⚠️ More complex implementation

**Code Changes:**
- Would require significant refactoring
- May need custom job storage

---

### Option 5: Update Queue per Resource with Latest-Only Processing

**Approach:** Maintain a queue per resource path. When processing, only process the latest update and discard older queued updates.

**Implementation:**
- Use `ConcurrentHashMap<String, Queue<Update>>` to track updates per resource
- When processing, check queue and only process the latest update
- Discard older updates in queue

**Pros:**
- ✅ Guarantees only latest update executes
- ✅ Simple queue management
- ✅ No job cancellation needed

**Cons:**
- ⚠️ Requires custom queue management
- ⚠️ Jobs still get created (just not all processed)
- ⚠️ Memory overhead for queues

**Code Changes:**
- Add queue management to `FlowJobConsumer`
- Modify processing logic to check queues
- Add cleanup for processed updates

---

### Option 6: Rate Limiting with Throttling

**Approach:** Limit how many updates can happen per resource per time period. Skip updates that exceed the rate limit.

**Implementation:**
- Track last update time per resource
- Skip updates if within rate limit window (e.g., 1 second)
- Use `ConcurrentHashMap<String, Long>` to track timestamps

**Pros:**
- ✅ Prevents rapid-fire updates
- ✅ Simple implementation
- ✅ Configurable rate limit

**Cons:**
- ⚠️ May skip legitimate rapid updates
- ⚠️ Doesn't guarantee latest update executes
- ⚠️ May delay important updates

**Code Changes:**
- Add rate limiting to `FlowJobConsumer`
- Track last update time per resource
- Skip processing if within rate limit window

---

## Recommended Approach: Hybrid Solution

**Combine Option 1 (Job Deduplication) + Option 6 (Rate Limiting)**

### Phase 1: Job Deduplication
- Before creating a job, check for pending jobs for the same resource path
- Cancel existing jobs using `JobManager.removeJob()`
- Create new job with latest change

### Phase 2: Rate Limiting (Optional)
- Add configurable rate limit (e.g., max 1 update per resource per 500ms)
- Skip job creation if within rate limit window
- Log skipped updates for monitoring

### Implementation Plan

1. **Add Job Cancellation Helper**
   ```java
   private void cancelPendingJobsForResource(String resourcePath) {
       // Query jobs for this resource path
       // Cancel pending jobs
   }
   ```

2. **Modify processChanges()**
   ```java
   for (ResourceChange change : changes) {
       String path = change.getPath();
       if (flowService.isFlowEnabledResource(resource)) {
           // Cancel existing jobs for this resource
           cancelPendingJobsForResource(path);
           // Create new job
           changeMap.put(path, change.getType());
       }
   }
   ```

3. **Add Configuration**
   - `flow_update_rate_limit_ms` - Minimum time between updates per resource (default: 500ms)
   - `flow_enable_job_deduplication` - Enable/disable job cancellation (default: true)

## Alternative: Sling Job Properties for Deduplication

Sling jobs support properties that can be used for deduplication:

```java
// Add resource path as job property
props.put("resourcePath", resourcePath);
props.put("changes", changeMap);

// When creating job, check for existing jobs with same resourcePath
Collection<Job> existingJobs = jobManager.getJobs(
    JobManager.QueryType.ALL, 
    JOB_TOPIC, 
    -1, 
    Collections.singletonMap("resourcePath", resourcePath)
);

// Cancel existing jobs
for (Job job : existingJobs) {
    if (job.getJobState() == Job.JobState.QUEUED || 
        job.getJobState() == Job.JobState.ACTIVE) {
        jobManager.removeJob(job.getId());
    }
}
```

## Performance Considerations

- **Job Query Performance**: Querying jobs may have overhead. Consider caching or limiting query scope.
- **Memory Usage**: Tracking state per resource requires memory. Consider cleanup of stale entries.
- **Thread Safety**: All solutions must be thread-safe for concurrent change events.

## Monitoring and Observability

Add metrics/logging for:
- Number of jobs cancelled per resource
- Number of updates skipped due to rate limiting
- Average time between updates per resource
- Job queue depth

## Testing Strategy

1. **Unit Tests**: Test job cancellation logic
2. **Integration Tests**: Test rapid change scenarios
3. **Load Tests**: Test with high-frequency updates
4. **Edge Cases**: Test with resource deletion, concurrent updates from different users

## Recommendation

**Start with Option 1 (Job Deduplication)** as it's:
- Simple to implement
- Uses existing Sling infrastructure
- Solves the core problem (multiple jobs for same resource)
- Can be enhanced with rate limiting later if needed

**Future Enhancement**: Add Option 6 (Rate Limiting) if job cancellation alone doesn't provide sufficient throttling.

