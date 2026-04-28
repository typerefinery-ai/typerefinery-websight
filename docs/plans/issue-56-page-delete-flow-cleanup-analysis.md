# Issue 56 Analysis

Issue: `#56` Add a listener for page deletes and if the form has a flow delete the flow

## Summary

When a page containing a flow-backed form is deleted, the related flow should be paused and cleaned up automatically without requiring authors to trigger anything manually.

## Request

The issue asks for a page-delete listener that detects forms with flows and cleans up the related flow.

## Analysis Done

I reviewed the flow deletion listener and the job consumer that performs cleanup.

Relevant listener:

- `application/backend/src/main/java/ai/typerefinery/websight/events/flow/FlowPageDeletionListener.java`

Relevant cleanup consumer:

- `application/backend/src/main/java/ai/typerefinery/websight/jobs/flow/FlowSyncJobConsumer.java`

Key implementation points:

- listener is registered for `REMOVED` changes at `FlowPageDeletionListener.java:46`
- listener class exists at `FlowPageDeletionListener.java:49`
- it creates cleanup jobs at `FlowPageDeletionListener.java:238`
- the cleanup job marks the change as `REMOVED` at `FlowPageDeletionListener.java:246`
- removed-resource processing happens in `FlowSyncJobConsumer.java:137`
- removed resources with valid flow IDs are paused before cleanup at `FlowSyncJobConsumer.java:159`
- actual pause call happens at `FlowSyncJobConsumer.java:161`

## Showcase Page Event Analysis

This issue does not need a custom authored `_events_` contract on the showcase page.

The behavior is server-side and lifecycle-driven:

- a showcase page only needs a flow-enabled form
- deleting that page should trigger the backend listener
- the backend listener creates the cleanup job and the job consumer handles pause plus deletion logic

Showcase outcome:

- exact page event creation required: none
- exact showcase requirement: create a flow-enabled form page, then validate behavior by deleting the page

## Findings

- This repo already has a dedicated page deletion listener for flow-backed content.
- The listener follows the expected architecture: detect deletion, enqueue cleanup work, then let the job consumer pause and remove the flow-backed `/var` state.
- The implementation matches the intent of the issue closely.

## Outcome

Repo outcome: this issue appears implemented in this repo.

Working position:

- no new implementation is recommended until runtime testing proves a failure
- treat remaining work as validation, not feature build
