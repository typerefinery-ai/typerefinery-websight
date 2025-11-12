# Select Dialog Component

The `typerefinery/components/dialog/select` dialog component renders an Atlaskit-powered `<Select>` field. It supports plain options as well as grouped options (via child resources). At the moment, all option data must be defined inline within the dialog definition itself.

Reference: https://atlassian.design/components/select/examples

## Current Behaviour

- `select.json.html` renders `/apps/typerefinery/components/dialog/select/Select.js`.
- Options are assembled by iterating over the dialog resource children:
  - `selectitem` nodes map to simple options.
  - `selectgroup` nodes wrap nested `selectitem` nodes for grouped options.
- The React component manages:
  - Deriving the default option (`selected` flag).
  - Handling `onChange` and `onCreateOption` (when `allowCreate` is enabled).
  - Rendering through Atlaskit with menu portal to `document.body`.

### Limitations Identified

- Dialog authors must duplicate option data in every dialog using this component.
- There is no support for pulling options defined at the component level (e.g. under `/apps/.../eventactions` like the Event Actions field).
- Flow-specific dialogs (for example `flowColor` and `flowIcon`) would benefit from centrally managed option lists shared across components.

## Goal: Dynamic Option Loading

We want to replicate and extend the pattern used by `dialog/eventactions`, where the dialog widget pulls its selectable values from structured content owned by the component. This enables:

- Single source of truth for reusable lists (colours, icons, etc.).
- Cleaner dialogs without large inline option structures.
- Easier localisation or downstream automation of option lists.

## Proposed Enhancements

- **Datasource child**: allow an optional `datasource` subresource beneath the select definition that points to a loader component (for example `typerefinery/components/dialog/datasources/content`) responsible for fetching options.
  - Example configuration points to `flowColorOptions` under the component.
- **Loader implementations**: extend or create Sling models/utilities that the datasource components use to assemble options (key/value pairs, grouped items, etc.). Consider sharing logic with `ai.typerefinery.websight.models.dialog.Dialog`.
- **Backward compatibility**: when no `datasource` is provided, preserve the current inline child behaviour so existing dialogs keep working without migration.
- **Grouped support**: define how grouped options should be represented in component content. Likely mirror current structure (parent node with children).
- **Validation**: add guard rails and logging when the configured datasource cannot resolve or produce options.

## Migration Plan for Flow Container Dialog

Target file: `/apps/typerefinery/components/flow/flowcontainer/dialog/.content.json`

1. **Define option data under the component**:
   - Create `/apps/typerefinery/components/flow/flowcontainer/flowColorOptions/.content.json` (name subject to final convention) containing `nt:unstructured` child nodes with `key` and `value`.
   - Create `/apps/typerefinery/components/flow/flowcontainer/flowIconOptions/.content.json` following the same structure.
   - Add optional metadata (e.g. descriptions) if we decide to surface tooltips later.
2. **Update dialog fields**:
   - Replace existing text fields `flowColor` and `flowIcon` with the dynamic select component.
   - Add a `datasource` child using the content loader to reference the new option nodes (for example `"path": "flowColorOptions"`).
   - Map `name`, `label`, and validation requirements as before.
3. **Ensure backward compatibility**:
   - During rollout, confirm that the select component gracefully handles existing content values (strings already stored in pages).

## Testing & Verification Strategy

- **Unit / Integration**:
  - Add tests for datasource loaders that fetch options from the specified path, covering happy path, missing path, empty lists, and grouped structures.
- **E2E**:
  - Create or extend dialog E2E coverage to ensure options appear in the rendered select when configured via a datasource.
  - Validate authoring flow: selecting colour/icon updates the stored value; previously saved values remain selected when reopening the dialog.
- **Regression**:
  - Run existing dialog select scenarios to confirm inline option behaviour is unchanged when a datasource is not provided.

## Open Questions / Next Steps

- Finalise datasource component naming conventions and clarify how relative vs. absolute paths are resolved.
- Decide whether key/value is sufficient or if we need additional fields (e.g. icon previews, colour swatches) that the React component should render.
- Determine if grouped options need to be supported in the initial iteration for Flow (likely not, but should be validated).
- Once an agreement is reached, implement the dynamics, migrate Flow dialog, and document deployment steps.

## Example Inline Usage (Current State)

```json
"flowIcon": {
  "sling:resourceType": "typerefinery/components/dialog/select",
  "name": "flowapi_icon",
  "label": "Icon",
  "description": "Optional icon class"
  // child resources define the options today
}
```

Example inline configuration (mirrors the `eventName` dialog field):

```json
"eventName": {
  "sling:resourceType": "typerefinery/components/dialog/select",
  "name": "name",
  "allowCreate": true,
  "label": "Event Name",
  "description": "Event Name raised by the component",
  "default": {
    "sling:resourceType": "typerefinery/components/dialog/select/selectgroup",
    "label": "Default",
    "custom": {
      "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
      "label": "Custom",
      "value": ""
    }
  },
  "topic": {
    "sling:resourceType": "typerefinery/components/dialog/select/selectgroup",
    "label": "Topic",
    "create": {
      "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
      "label": "Payload",
      "value": "topicpayload"
    }
  }
}
```

Inline options live as child resources under the select node:

```text
/flowIcon
├── default (typerefinery/components/dialog/select/selectgroup)
│   └── custom (typerefinery/components/dialog/select/selectitem)
│       ├── label = "Custom"
│       └── value = ""
└── topic (typerefinery/components/dialog/select/selectgroup)
    └── create (typerefinery/components/dialog/select/selectitem)
        ├── label = "Payload"
        └── value = "topicpayload"
```

Each `selectgroup` child wraps nested `selectitem` options; you can also place `selectitem` nodes directly under the select for flat lists.

### Datasource Subresource Pattern

To support additional sources (shared content, REST endpoints, Java-backed providers), we plan to allow a `datasource` child beneath the select definition:

```json
"flowIcon": {
  "sling:resourceType": "typerefinery/components/dialog/select",
  "name": "flowapi_icon",
  "label": "Icon",
  "datasource": {
    "sling:resourceType": "typerefinery/components/dialog/datasources/content",
    "path": "flowIconOptions"
  }
}
```

- `path` accepts relative (`"flowIconOptions"` or `"../shared/flowIconOptions"`) or absolute (`"/apps/typerefinery/shared/flowIconOptions"`) repository locations.
- Datasource implementations under `typerefinery/components/dialog/datasources/*` encapsulate how options are loaded:
  - `datasources/content` – read repository nodes and adapt to `{ key, value }`.
  - `datasources/rest` (future) – invoke a URL/service to populate options.
  - `datasources/java` (future) – call into Sling services or models for computed lists.
- Rendering logic: if `datasource` exists it is used; otherwise the select falls back to inline child options, preserving current behaviour.