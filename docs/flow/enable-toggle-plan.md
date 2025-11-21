# Flow Enable Toggle Pause Plan

This document captures the discovery notes and proposed implementation plan for wiring the Flow authoring toggle to the Flow pause API so that enabling or disabling Flow in author dialogs immediately resumes or pauses the underlying stream. It supplements `docs/flow/flow-service.md` with a focus on the enable/disable workflow.

## Context Recap

- Author dialogs surface a `flowapi_enable` checkbox on Flow-capable components such as `flowcontainer` and `form`. The field is defined in `apps/typerefinery/components/flow/flowcontainer/dialog/.content.json` and persists under the `flowapi` prefix.
- Flow component models adapt resources via `ai.typerefinery.websight.models.components.FlowComponent`, surfacing `flowapi_enable`, `flowapi_flowstreamid`, and metadata consumed by `FlowService`.
- `FlowService.doProcessFlowResource` currently provisions or updates flows only when `flowapi_enable` is `true`. There is no pause/unpause call when the enable state flips.

```198:248:application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java
        if (flowapi_enable && StringUtils.isNotBlank(flowapi_template)) {
            boolean isFlowExists = StringUtils.isNotBlank(flowComponent.flowapi_flowstreamid) ? isFlowExists(flowComponent.flowapi_flowstreamid) : false;
            boolean isTemplateExists = PageUtil.isResourceExists(flowapi_template, resourceResolver);
            if (isFlowExists == false && isTemplateExists) {
                String flowapi_flowstreamid = createFlowFromTemplate(flowComponent);
                ...
            } else if (isFlowExists && isTemplateExists) {
                if (flowComponent.flowapi_title.equals(flowComponent.title) || StringUtils.isBlank(flowComponent.title)) {
                    LOGGER.info("nothing to update.");
                    return true;
                } else {
                    updateFlowFromTemplate(flowComponent);
                    ...
                }
            }
        }
```

- The Flow API exposes `https://flow.typerefinery.localhost:8101/fapi/streams_pause/{flowapi_flowstreamid}?is=0|1`, where `is=0` resumes and `is=1` pauses.

## Discovery Findings

- **Authoring UI**  
  - The enable checkbox is the only interactive element tied to Flow lifecycle changes. All IDs and URLs rendered in the dialog are read-only after Flow creation, so the checkbox is the correct trigger for a pause/unpause call.
  - `flowapi_flowstreamid` is populated after `FlowService.createFlowFromTemplate` runs; new components may not have an ID during the initial enable action.

- **Backend Lifecycle**  
  - Resource changes are processed asynchronously through `FlowResourceChangeListener` and `FlowJobConsumer`, meaning pause/unpause logic must live in `FlowService` to keep behaviour consistent across authors, bulk edits, and programmatic changes.
  - Existing HTTP helpers (`sendRequestWithRetry`) and configuration (`FlowServiceConfiguration`) already manage authentication, retries, and URL construction for other Flow endpoints.

- **Testing Infrastructure**  
  - Backend unit tests use JUnit 5 (`FlowServiceTest`).  
  - End-to-end coverage resides under `tests/end-to-end` (Cypress/Jest hybrid). No current test simulates the enable toggle network behaviour.

## Proposed Architecture

- **Backend Enhancements**
  - Extend `FlowServiceConfiguration` with a new `streams_pause` endpoint constant, defaulting to `"/fapi/streams_pause/%s?is=%s"`. Reuse `host_url_client()` so the default matches `https://flow.typerefinery.localhost:8101`.
  - Add a dedicated helper `toggleFlowStreamPause(String flowstreamId, boolean pauseRequested)` that:
    - Validates non-blank `flowstreamId`.
    - Builds the endpoint URL using `URI.create(configuration.host_url_client() + String.format(endpoint, flowstreamId, pauseFlag))`.
    - Utilises the existing shared `HttpClient` and `sendRequestWithRetry`, including retry/backoff semantics.
    - Parses response codes: treat 2xx as success, 404 as warning (log + surface in job result), others as errors.
  - Update `doProcessFlowResource`:
    - When `flowapi_enable` is `false` and a flow ID exists, call `toggleFlowStreamPause(flowId, true)` before exiting.
    - When `flowapi_enable` is `true`:
      - After successfully creating a flow, immediately call `toggleFlowStreamPause(flowId, false)` to ensure resumed state.
      - When updating an existing flow (regardless of whether metadata changed), call `toggleFlowStreamPause(flowId, false)` so re-enabling an already created flow resumes it.
    - Ensure calls are idempotent and guarded so they do not run when IDs are missing.

- **Author Dialog UX**
  - No direct client-side call is required; the backend listener keeps behaviour consistent for replication agents and package installs.
  - The Flow tab now surfaces a read-only `flowapi_paused` text field so authors can confirm whether the stream is paused.

- **TypeScript Constraints (for any front-end follow-ups)**
  - If future UI feedback is added, author dialogs must use strict TypeScript modules with explicit interfaces for API responses, no usage of `any`, no non-null assertions, and double-quoted strings. Centralise fetch logic in a typed utility to preserve testability.

## Implementation Steps

1. **TDD Setup**
   - Create Cypress E2E spec under `tests/end-to-end/tests/` that:
     - Authors a flow component with an existing `flowapi_flowstreamid`.
     - Toggles the enable checkbox on and off.
     - Intercepts the network call to `fapi/streams_pause` and asserts `is=0` when enabling, `is=1` when disabling.
     - Fails against current implementation (red phase).

2. **Backend Implementation**
   - Introduce the configuration constant and helper in `FlowService`.
   - Invoke the helper in `doProcessFlowResource` for both enable and disable paths.
   - Add structured logging (`LOGGER.info/error`) annotating resource path, flow ID, and pause flag.

3. **Unit Tests**
   - Extend `FlowServiceTest` with scenarios covering:
     - URL construction for pause/unpause using a stub configuration.
     - Handling of invalid flow IDs (expecting `IllegalArgumentException` or equivalent).
     - Response handling (success vs error) via mocked `HttpClient`.

4. **Documentation & Configuration**
   - Update OSGi configuration docs to include the new pause endpoint value and describe any environment overrides.
   - Note required environment variable or config file change if the endpoint varies between environments.

5. **Refinement**
   - After green tests, refactor for readability, ensuring inline comments and JSDoc headers document the new helper.
   - Confirm all strings use double quotes, no `any`, and no non-null assertions across new code.

## Testing Strategy

- **E2E**: Cypress test described above, executed via `npm run test:e2e` (or project-specific wrapper) against author environment with Flow API stub reachable at `https://flow.typerefinery.localhost:8101`.
- Use the `POST /bin/typerefinery/flow/toggle` servlet to programmatically flip Flow state during automated runs so the backend listener executes without relying on manual dialog interaction.
- **Unit**: `mvn -pl application/backend test` to run updated `FlowServiceTest`.
- **Regression**: Full suite covering backend modules plus UI smoke tests to ensure Flow creation remains unaffected.

## Error Handling & Observability

- Treat network failures as non-fatal but log at `ERROR` level with structured context (`flowId`, `pauseFlag`, `componentPath`).
- Expose pause failures back to the author via job log/messages so administrators can diagnose via Sling Job history.
- Consider future enhancement to persist pause state locally (`flowapi_paused`) when API acknowledges success.

## Configuration & Environment Considerations

- Default endpoint leverages `FlowServiceConfiguration.host_url_client()`. Verify that author environments route `https://flow.typerefinery.localhost:8101` correctly; adjust configuration in non-local deployments if the pause endpoint differs.
- For automated tests, provide a mock Flow service or use WireMock to capture `streams_pause` calls.

## Open Questions

- Should pause failures block the Flow job (preventing publish), or merely warn? (Recommendation: warn, but configurable.)
- Do we need to cache the remote pause status to reflect it in the dialog?
- How should we handle brand-new flows where the ID is allocated only after enablement? (Recommendation: call unpause only after ID is available; skip otherwise.)

## Follow-up Tasks

- Implement backend changes tracked by a new enhancement issue.
- Add optional UI feedback to communicate pause state (requires additional ticket).
- Revisit documentation once the implementation ships to ensure instructions stay aligned with behaviour.

