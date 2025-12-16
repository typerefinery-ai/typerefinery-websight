# Checkbox Field

## Overview

- **Component**: `typerefinery/components/forms/checkbox`
- **Description**: Boolean form control rendered with Bootstrap's `form-check` classes. Supports single and multiple checkbox selection patterns for Flow-enabled forms.
- **Inheritance**: Extends `typerefinery/components/forms/field` via `sling:resourceSuperType`, inheriting the shared field container, dialog fragments, and Flow metadata conventions.

## Sling Model (`CheckboxField`)

- Location: `application/backend/src/main/java/ai/typerefinery/websight/models/components/forms/CheckboxField.java`
- Extends the base `Field` model:
  - Sets the client module to `"field"`
  - Calls `super.init()` to initialise IDs, flex/grid helpers, and Flow-aware metadata inherited from `BaseFormComponent`
  - Adds `form-check` to the grid classes so the output matches Bootstrap checkbox styling

## Rendering Pipeline

- `checkbox.html` adapts the Sling model and invokes the shared `variant.html` from the base field container
- Default content structure (`template/.content.json`):
  - `label` child using `typerefinery/components/forms/fields/label`
  - `field` child using `typerefinery/components/forms/fields/checkbox`
- The base `Field` model detects these children, derives unique IDs (via `ComponentUtil.getComponentId`) and exposes them as `labelId` / `fieldId`, ensuring `<label>` and `<input>` stay in sync even when the component is duplicated

## Authoring Dialog

- Inherits the shared dialog definition from the base field component:
  - **General** fragment (`forms/form/common/.content.json`) supplies Label, Title, Name, Value, Default Value, Placeholder
  - **Style**, **Grid**, **Alignment** tabs are included via `/apps/typerefinery/components/dialog/tabs/{style,grid,alignment}`
  - **Events** tab for event configuration (if enabled)
- No checkbox-specific dialog widgets are declared
- Flow enablement and additional metadata are configured on the parent form container's Flow tab

## Flow Integration

- Checkbox values are gathered by the global form client library (`application/backend/src/main/resources/apps/typerefinery/components/forms/form/clientlibs/functions.js`):
  - `getFormData` inspects inputs with `type="checkbox"` and builds an array of checked values keyed by the authored field name
  - Duplicate name warnings surface in the console to help authors avoid conflicts
- When Flow API is enabled, the form payload (including checkbox selections) is handed to `FlowService`, which applies metadata through `resolveFlowComponentMetadata` and synchronises with FlowStream via the REST endpoints

## Usage Notes

- **Single Checkbox**: Use for boolean agreements, toggles, opt-ins. Returns array with one value if checked, empty array if not checked
- **Multiple Checkboxes**: Duplicate the component or add multiple `field` children with the same `name` but distinct `value`. The client library pushes the selected values as an array
- When nesting inside composites, ensure the checkbox remains within the `field` hierarchy so automatic ID assignment and Flow integration continue to function
- Always expect arrays in form submission (even for single checkbox)
- Handle empty arrays for unchecked checkbox groups

## Event Support

- **CHECKBOX_CHANGE**: Fired when any checkbox with the same name changes state
- **CHECKBOX_CLICK**: Fired when a specific checkbox is clicked

## Key Files

- Component definition: `.content.json`
- Default template: `template/.content.json`
- Rendering stub: `checkbox.html`
- Field component: `fields/checkbox/`
- Sling model: `CheckboxField.java`
- Client libraries: `fields/checkbox/clientlibs/`

## Related Documentation

- **Comprehensive Documentation**: `docs/forms/checkbox.md` - Complete usage guide, examples, and API reference
- **Base Field Container**: `docs/forms/field.md`
- **Form Container**: `docs/forms/form.md` (if exists)
