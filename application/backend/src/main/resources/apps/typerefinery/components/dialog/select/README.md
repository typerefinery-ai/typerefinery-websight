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

We want to replicate the pattern used by `dialog/eventactions`, where the dialog widget pulls its selectable values from structured content owned by the component. This enables:

- Single source of truth for reusable lists (colours, icons, etc.).
- Cleaner dialogs without large inline option structures.
- Easier localisation or downstream automation of option lists.

## Proposed Enhancements

- **New dialog property**: introduce an optional `optionsSource` (name TBD) that points to a relative path under the component definition. When provided, the select component should load options from that path rather than the inline children.
  - Example value: `./flowcoloroptions` to read `/apps/<component>/flowcoloroptions`.
- **Sling model / utility**: extend or create a Sling model to fetch child resources from `optionsSource` and adapt them to a common type (`KeyValuePair` for simple lists, possibly a new model for grouped options). Consider sharing logic with `ai.typerefinery.websight.models.dialog.Dialog`.
- **Backward compatibility**: if `optionsSource` is absent, preserve the current inline behaviour so existing dialogs keep working without migration.
- **Grouped support**: define how grouped options should be represented in component content. Likely mirror current structure (parent node with children).
- **Validation**: add guard rails and logging when the configured `optionsSource` cannot be resolved.

## Migration Plan for Flow Container Dialog

Target file: `/apps/typerefinery/components/flow/flowcontainer/dialog/.content.json`

1. **Define option data under the component**:
   - Create `/apps/typerefinery/components/flow/flowcontainer/flowColorOptions/.content.json` (name subject to final convention) containing `nt:unstructured` child nodes with `key` and `value`.
   - Create `/apps/typerefinery/components/flow/flowcontainer/flowIconOptions/.content.json` following the same structure.
   - Add optional metadata (e.g. descriptions) if we decide to surface tooltips later.
2. **Update dialog fields**:
   - Replace existing text fields `flowColor` and `flowIcon` with the dynamic select component.
   - Set `optionsSource` to reference the new content nodes (for example `"optionsSource": "flowColorOptions"`).
   - Map `name`, `label`, and validation requirements as before.
3. **Ensure backward compatibility**:
   - During rollout, confirm that the select component gracefully handles existing content values (strings already stored in pages).

## Testing & Verification Strategy

- **Unit / Integration**:
  - Add tests for the Sling model that loads options from the specified path, covering happy path, missing path, empty lists, and grouped structures.
- **E2E**:
  - Create or extend dialog E2E coverage to ensure options appear in the rendered select when configured via `optionsSource`.
  - Validate authoring flow: selecting colour/icon updates the stored value; previously saved values remain selected when reopening the dialog.
- **Regression**:
  - Run existing dialog select scenarios to confirm inline option behaviour is unchanged when `optionsSource` is not provided.

## Open Questions / Next Steps

- Finalise naming convention for the new property (optionsSource vs. optionsPath) and whether it should accept absolute, relative, or both paths.
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

The future implementation will mirror this structure but allow specifying `optionsSource` instead of inline children. Details will be added once development is complete.