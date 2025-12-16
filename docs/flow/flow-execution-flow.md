# Flow Execution Flow

This document describes the complete execution flow from change detection to Flow API synchronization.

## Architecture Overview

The Flow synchronization system uses a **listener → job → consumer** pattern:

1. **FlowResourceChangeListener** - Detects changes in `/content` and creates jobs
2. **FlowSyncJobConsumer** - Processes jobs and handles all business logic
3. **FlowSyncStorageService** - Manages `/var` storage and synchronization
4. **FlowService** - Interacts with Flow API

## Execution Flow Diagram

```mermaid
flowchart TD
    Start([User Updates Component in Dialog]) --> Save[Save Properties to /content Resource]
    Save --> Listener[FlowResourceChangeListener.onChange]
    
    Listener --> CheckEnabled{Listener Enabled?}
    CheckEnabled -->|No| End1([End - Listener Disabled])
    CheckEnabled -->|Yes| ProcessChanges[processChanges: Iterate Changes]
    
    ProcessChanges --> CreateJob[Create Job with componentPath + changeType]
    CreateJob --> JobQueue[Job Added to Queue]
    
    JobQueue --> Consumer[FlowSyncJobConsumer.process]
    
    Consumer --> ValidateJob{Validate Job Properties}
    ValidateJob -->|Invalid| Fail1[Return FAILED]
    ValidateJob -->|Valid| CheckChangeType{Change Type?}
    
    CheckChangeType -->|REMOVED| ProcessRemoved[processRemovedChange]
    CheckChangeType -->|ADDED/CHANGED| ProcessUpdate[processUpdateChange]
    
    %% REMOVED Flow
    ProcessRemoved --> GetVar1[Get /var Resource]
    GetVar1 --> VarExists1{/var Exists?}
    VarExists1 -->|No| OK1[Return OK - Nothing to Clean]
    VarExists1 -->|Yes| GetFlowId1[Get flowstreamid from /var]
    GetFlowId1 --> HasFlowId1{Has flowstreamid?}
    HasFlowId1 -->|Yes| PauseFlow[Pause Flow via Flow API]
    HasFlowId1 -->|No| DeleteVar
    PauseFlow --> DeleteVar[Delete /var Resource]
    DeleteVar --> Success1[Return OK]
    
    %% ADDED/CHANGED Flow
    ProcessUpdate --> GetComponent[Get Component Resource]
    GetComponent --> ComponentExists{Component Exists?}
    ComponentExists -->|No| Fail2[Return FAILED]
    ComponentExists -->|Yes| CheckFlowEnabled{Is Flow-Enabled?}
    
    CheckFlowEnabled -->|No| OK2[Return OK - Skip Processing]
    CheckFlowEnabled -->|Yes| GetOrCreateVar[Get or Create /var Resource]
    
    GetOrCreateVar --> CheckState[checkAndReserveState]
    CheckState --> StateCheck{State Check}
    
    StateCheck -->|HOLD| Skip1[Set SKIPPED, Return OK]
    StateCheck -->|QUEUED/PROCESSING + Stuck| ResetState[Reset to IDLE, Continue]
    StateCheck -->|QUEUED/PROCESSING + Owned by Other| RetryCheck{Retry Count < Max?}
    RetryCheck -->|Yes| Retry[Return FAILED - Trigger Retry]
    RetryCheck -->|No| Error1[Set ERROR, Return FAILED]
    StateCheck -->|IDLE or Owned by This Job| ReserveState[Reserve State: PROCESSING]
    
    ReserveState --> SyncToVar[syncComponentToVar: Copy User Properties to /var]
    SyncToVar --> SyncSuccess{Sync Success?}
    SyncSuccess -->|No| Error2[Set ERROR, Return FAILED]
    SyncSuccess -->|Yes| ReloadVar[Reload /var Resource]
    
    ReloadVar --> HandleTransitions[handleEnableDisableTransitions]
    HandleTransitions --> TransitionCheck{Enable State?}
    
    TransitionCheck -->|Disabled + Has Flow ID| Pause1[Pause Flow via Flow API]
    TransitionCheck -->|Enabled + Was Disabled + Has Flow ID| Unpause[Unpause Flow via Flow API]
    TransitionCheck -->|Enabled| SyncToFlow[syncVarToFlow: Sync /var to Flow API]
    TransitionCheck -->|Disabled + No Flow ID| Nothing[Do Nothing]
    
    Pause1 --> PauseSuccess1{Pause Success?}
    PauseSuccess1 -->|Yes| Complete1[Set COMPLETED, Return OK]
    PauseSuccess1 -->|No| Error3[Set ERROR, Return FAILED]
    
    Unpause --> UnpauseSuccess{Unpause Success?}
    UnpauseSuccess -->|Yes| Complete2[Set COMPLETED, Return OK]
    UnpauseSuccess -->|No| Error4[Set ERROR, Return FAILED]
    
    SyncToFlow --> FlowSyncSuccess{Flow Sync Success?}
    FlowSyncSuccess -->|Yes| Complete3[Set COMPLETED, Return OK]
    FlowSyncSuccess -->|No| Error5[Set ERROR, Return FAILED]
    
    Nothing --> Complete4[Set COMPLETED, Return OK]
    
    style Start fill:#e1f5ff
    style End1 fill:#ffe1e1
    style Fail1 fill:#ffe1e1
    style Fail2 fill:#ffe1e1
    style Error1 fill:#ffe1e1
    style Error2 fill:#ffe1e1
    style Error3 fill:#ffe1e1
    style Error4 fill:#ffe1e1
    style Error5 fill:#ffe1e1
    style Success1 fill:#e1ffe1
    style OK1 fill:#e1ffe1
    style OK2 fill:#e1ffe1
    style Complete1 fill:#e1ffe1
    style Complete2 fill:#e1ffe1
    style Complete3 fill:#e1ffe1
    style Complete4 fill:#e1ffe1
    style Skip1 fill:#fff4e1
```

## Key Design Decisions

### 1. Flow-Enabled Check First

The flow-enabled check happens **before** state reservation to prevent unnecessary job queuing for non-flow-enabled resources. This ensures:
- No `/var` resources created for non-flow-enabled resources
- No state machine overhead for resources that don't need processing
- Faster job completion for skipped resources

### 2. Early State Reservation

State is reserved to `PROCESSING` **before** syncing component to var. This ensures:
- Other jobs wait if they try to process the same resource
- Race conditions are prevented
- Stuck state detection can recover from failed jobs

### 3. Separation of Concerns

- **Listener**: Only creates jobs (no business logic)
- **Consumer**: All business logic (flow-enabled check, state management, sync)
- **Storage Service**: Manages `/var` storage and synchronization
- **Flow Service**: Interacts with Flow API

### 4. Enable/Disable Transition Handling

The system explicitly handles enable/disable transitions:
- **Disable**: If flow ID exists, pause the flow
- **Enable (from disabled)**: If flow ID exists, unpause the flow
- **Enable**: Sync properties to Flow API
- **Disable (no flow ID)**: Nothing to do

### 5. Stuck State Recovery

The system detects and recovers from stuck states:
- **Timeout**: Resource in `PROCESSING` state longer than `processingTimeoutSeconds`
- **Missing Job**: Stored job ID no longer exists in queue
- **Recovery**: Reset state to `IDLE` and allow processing to continue

## State Machine Flow

```
IDLE → (Check Flow-Enabled) → Get/Create Var → Check State → Reserve PROCESSING
  → Sync Component to Var → Handle Transitions → Sync to Flow API → COMPLETED/ERROR
```

For REMOVED changes:
```
Get Var → (If exists) Pause Flow → Delete Var → OK
```

## Error Handling

- **Invalid Job Properties**: Return `FAILED` immediately
- **Component Not Found**: Set `ERROR` state, return `FAILED`
- **Not Flow-Enabled**: Return `OK` (not an error, just skip)
- **Sync Failures**: Set `ERROR` state, return `FAILED`
- **Flow API Failures**: Set `ERROR` state, return `FAILED`
- **Stuck Resources**: Reset to `IDLE`, allow retry

## Retry Mechanism

- **Max Retries**: Configurable (default: 10)
- **Retry Trigger**: Return `FAILED` when resource is owned by another job
- **Retry Limit**: After max retries, set `ERROR` state and stop retrying
- **Stuck Recovery**: Automatic recovery from stuck states (timeout or missing job)

## Configuration

- **`maxRetryCount`**: Maximum retries before giving up (default: 10)
- **`processingTimeoutSeconds`**: Timeout for stuck state detection (default: 300 seconds)

