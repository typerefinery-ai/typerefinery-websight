# Checkbox Field

## Overview
- **Component**: `typerefinery/components/forms/checkbox`
- **Description**: Boolean form control rendered with Bootstrap’s `form-check` classes. Intended for use inside Flow-enabled forms.
- **Inheritance**: Declares `sling:resourceSuperType="typerefinery/components/forms/field"`, inheriting the shared field container, dialog fragments, and Flow metadata conventions.

## Sling Model (`CheckboxField`)
- Location: `application/backend/src/main/java/ai/typerefinery/websight/models/components/forms/CheckboxField.java`.
- Extends the base `Field` model:
  - Sets the client module to `"field"`.
  - Calls `super.init()` to initialise IDs, flex/grid helpers, and Flow-aware metadata inherited from `BaseFormComponent`.
  - Adds `form-check` to the grid classes so the output matches Bootstrap checkbox styling.

## Rendering Pipeline
- `checkbox.html` adapts the Sling model and invokes the shared `variant.html` from the base field container.
- Default content structure (`template/.content.json`):
  - `label` child using `typerefinery/components/forms/fields/label`.
  - `field` child using `typerefinery/components/forms/fields/checkbox`.
- The base `Field` model detects these children, derives unique IDs (via `ComponentUtil.getComponentId`) and exposes them as `labelId` / `fieldId`, ensuring `<label>` and `<input>` stay in sync even when the component is duplicated.

## Authoring Dialog
- Inherits the shared dialog definition from the base field component:
  - **General** fragment (`forms/form/common/.content.json`) supplies Label, Title, Name, Value, Default Value, Placeholder.
  - **Style**, **Grid**, **Alignment** tabs are included via `/apps/typerefinery/components/dialog/tabs/{style,grid,alignment}`.
- No checkbox-specific dialog widgets are declared.
- Flow enablement and additional metadata are configured on the parent form container’s Flow tab.

## Flow Integration
- Checkbox values are gathered by the global form client library (`application/backend/src/main/resources/apps/typerefinery/components/forms/form/clientlibs/functions.js`):
  - `getFormData` inspects inputs with `type="checkbox"` and builds an array of checked values keyed by the authored field name.
  - Duplicate name warnings surface in the console to help authors avoid conflicts.
- When Flow API is enabled, the form payload (including checkbox selections) is handed to `FlowService`, which applies metadata through `resolveFlowComponentMetadata` and synchronises with FlowStream via the REST endpoints.

## Client Behaviour & Styling
- JavaScript:
  - `functions.js` manages payload construction, Flow/REST submission, and event handling (`FORM_LOAD`, `FORM_SUBMIT`, etc.).
  - Works together with `Typerefinery.Components.Forms.Fileupload` and other helpers if the checkbox is embedded within composites or custom layouts.
- CSS:
  - `style.css` in the same client library highlights duplicate IDs/names and renders field hints used during authoring.

## Usage Notes
- To create multi-value checkboxes, duplicate the component or add multiple `field` children with the same `name` but distinct `value`. The client library pushes the selected values as an array.
- When nesting inside composites, ensure the checkbox remains within the `field` hierarchy so automatic ID assignment and Flow integration continue to function.

## Key Files
- Component definition: `.content.json`
- Default template: `template/.content.json`
- Rendering stub: `checkbox.html`
- Sling model: `CheckboxField.java`
- Related docs:
  - Base field container – [`../field/README.md`](../field/README.md)
  - Form container – [`../form/README.md`](../form/README.md)
# Checkbox Field

## Overview
- **Component**: `typerefinery/components/forms/checkbox`
- **Purpose**: Renders a single boolean input inside Flow-enabled forms.
- **Inheritance**: Extends `typerefinery/components/forms/field`, so it inherits the shared field dialog, Flow metadata, and client behaviour.

## Authoring Dialog
- Uses the shared **General** fragment from the base field (label, title, name, value, default value, placeholder).
- Additional tabs included by default:
  - **Style**, **Grid**, **Alignment** – via the common dialog includes.
- Flow metadata appears via the shared Flow tab when the parent form enables Flow.

## Flow Integration
- By inheriting `FlowComponent` fields from the base form container, checkbox values participate in payload collection handled by `clientlibs/functions.js`.
- When Flow is enabled, the component is processed through `FlowService`, so authored Flow metadata on the parent form applies automatically.

## Client Libraries
- Relies on the global form client library (`ai.typerefinery.websight.components.forms.form`) for serialising boolean values and dispatching Flow/REST events.

## Templates
- Checkbox rendering is defined in `checkbox.html` and associated template resources under `template/`.

## Related Links
- Base field documentation (`docs/forms/field.md`)
- Form container documentation (`docs/forms/form.md`)*** End Patch

