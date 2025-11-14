# Form Component Reference

This document captures the authoring model, runtime behaviour, and service integration for the form component suite located under `application/backend/src/main/resources/apps/typerefinery/components/forms/form`. Use it as the canonical reference when configuring authoring dialogs, wiring events, or extending supporting services.

## Component Overview

- The component is registered via `.content.json` as a container in `Typerefinery - Forms`, allowing nested content, layout, and flow widgets. It enforces `ws:Component` with `isContainer` and `isLayout` enabled.
- Rendering is managed by `form.html`, which delegates to `variant.html`. The variant template wraps authored children inside a `<form>` element, binds `data-model` to the serialized component model, and falls back to the standard placeholder when no child resources are present.
- All server-side models resolve through `ai.typerefinery.websight.models.components.forms.Form`, which feeds CSS classes and JSON configuration used by client libraries.

## Dialog Configuration

- Dialog structure is defined in `dialog/.content.json` and composed of reusable includes for consistency across Typerefinery components.
- Tabs exposed to authors:
  - **General** – Captures the Flow title with a default of `"Demo"`, persisted as `title`.
  - **Events** – Multifield allowing event-topic, type, and action selections. Uses `typerefinery/components/dialog/eventactions` to constrain available actions.
  - **Style/Grid/Alignment/Aria** – Delegated to shared includes under `/apps/typerefinery/components/dialog/tabs`.
  - **Write** – Configures outbound submission (`writePayloadType`, `writeMethod`, `writeUrl`).
  - **Read** – Configures inbound data loading (`readMethod`, `readUrl`).
  - **Flow** – Includes the container flow tab from `/apps/typerefinery/components/flow/flowcontainer/dialog/tabs/flowTab`, enabling FlowStream wiring and template selection.

## Common Tab Fields

- `common/.content.json` defines reusable field fragments for label, title, name, value, default value, and placeholder. These fragments are typically embedded inside child field components to guarantee consistent naming and validation hints for `getFormData`.

## Event Actions

- `eventactions/.content.json` enumerates the canonical action keys consumed by JavaScript (`FORM_SUCCESS`, `FORM_ERROR`, `FORM_SUBMIT`, `FORM_CANCEL`, `FORM_LOAD`). The multifield dialog references these entries to ensure authors align with `ns.ACTIONS` inside `functions.js`.

## Templates

### Template Registry

- `template/.content.json` points the component to a default automation template (`flowform-service.json`) and associated sample data (`flowsample.json`).

### `flowform-service.json`

- Provides a full FlowStream definition covering REST triggers (GET/POST/PUT/DELETE), response handling, logging, and data routing components.
- Relies on placeholders expanded by `FlowService` during provisioning:
  - `<http-route-url>` and `<http-route-url-nosfx>` are substituted with page-aware routes.
  - `<senddata-id>`, `<printjson-id>`, `<publish-id>`, `<sample-data>` and related markers allow `FlowService` to inject component IDs, sample payloads, or downstream flow references.
- Organises components into logical groups (Create, Read, Update, Delete) with matching colour overlays for Flow designer clarity.

### `flowform-empty.json`

- Ships a minimal, event-focused flow containing **Subscribe**, **Publish**, **Print JSON**, and **Send Data** nodes. Useful for rapid prototypes where Flow behaviour is wired manually without REST endpoints.

### Samples

- `flowsample.json` and `incidentinfoflowsample.json` supply starter payloads for forms that synchronise with FlowStream, illustrating the expected schema for Form API consumers.

## Client Libraries

### Entry Behaviour (`behaviour.js`)

- Registers the component with the global Typerefinery registry and invokes `watchDOMForComponent` so new instances on the page are initialised automatically.

### Core Logic (`functions.js`)

- **Selectors and Actions**: Declares `ns.selectorComponent` (`[component=form]`) and the supported event constants used across the module.
- **Data Extraction**: `getFormData` walks the DOM excluding embedded composites, editors, and selects. It supports file upload components via `Typerefinery.Page.Files.uploadFile`, maintains checkbox arrays, and optionally emits field hints for debugging.
- **Submission Pipeline**:
  - `submit` performs a fetch request with configurable payload/method, raising `FORM_SUCCESS` or `FORM_ERROR` based on outcomes.
  - `submitForm`/`formSubmitHandler` orchestrate payload assembly, fallback defaults, URL token replacement, and UI state toggles before delegating to `jsonRequest` or `formRequest`.
- **Data Loading**: `getData` drives server reads (`readUrl`/`readMethod`) and `loadData` fills form controls, including composite widgets, editors, and selects.
- **Event Bus Integration**:
  - `addEventListener` wires author-configured events via `Typerefinery.Page.Events`, differentiates emit/listen behaviours, and hooks window messages for iframe scenarios.
  - `handleEventAction` triggers load or submit sequences based on incoming events, enabling orchestration with other widgets.
- **UX Helpers**: `showFormHints` surfaces field badges, while edit-mode duplicate detection marks fields sharing IDs/names with CSS animations backed by `style.css`.

### Styling (`style.css`)

- Defines `.fieldhint` badges, animations for duplicate field detection, and hides wrapper `field` elements backing hidden inputs. The CSS works with JavaScript hinting for author debugging.

## FlowService Integration

- `FlowService` (`application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java`) provisions, updates, and synchronises FlowStream instances based on the form component configuration.
- Key responsibilities:
  - **Template Application**: `doProcessFlowResource` decides whether to create or update a FlowStream when authors enable Flow support (`flowapi_enable`) and choose a template.
  - **Metadata Resolution**: `resolveFlowComponentMetadata` merges authored metadata with defaults, and `applyFlowMetadata`/`applyFlowMetadataToResponse` stamp values into templates and Sling responses using the `flowapi_` prefix.
  - **HTTP Endpoints**: Helper methods such as `compileClientHttpRouteUrl`, `compileEditUrl`, and `getFlowStream*APIURL` derive service URLs from the OSGi configuration.
  - **Template Parsing**: Utility helpers (`getTemplateTree`, `findContainerFlowResources`, `replaceFlowTemplatePlaceholders`) load JSON templates, locate Flow-enabled child components, and replace placeholders like `<senddata-id>` or `<http-route-url>` before publishing to FlowStream APIs.
  - **Retry/Resilience**: `sendRequestWithRetry` standardises outbound HTTP communication with retry semantics.

## Runtime Data Flow

1. **Authoring** – Authors configure metadata, endpoints, and events in the dialog. Enabling Flow activates template provisioning through `FlowService`.
2. **Template Expansion** – On publish or resource change, `FlowService` materialises the FlowStream definition, substituting runtime tokens and applying metadata.
3. **Page Initialisation** – `behaviour.js` initialises each rendered form, while `functions.js` reads authored JSON injected into `data-model`.
4. **Interaction** – User actions invoke `submitForm`, emit local/global events, and optionally dispatch Flow payloads through configured endpoints.
5. **Read/Write Loop** – `readUrl` fetches initial values when query parameters are present; `writeUrl` handles submissions. Success or failure triggers mapped events (`FORM_SUCCESS`, `FORM_ERROR`) which other widgets can consume.

## Extension Guidelines

- Reuse the `common` field snippets when introducing new form field components so `getFormData` recognises names.
- Extend event behaviour by adding new keys to `ns.ACTIONS` and `eventactions/.content.json` in tandem, then wiring handlers through `Typerefinery.Page.Events`.
- When creating new Flow templates, favour the existing placeholder vocabulary (`<http-route-url>`, `<senddata-id>`, etc.) for compatibility with `FlowService`.
- Always validate duplicate IDs/names in authoring – the built-in duplicate detector highlights conflicts but cannot resolve them automatically.

Maintaining parity between author dialogs, client-side logic, and FlowService templates ensures forms remain synchronised across content, automations, and runtime events.

