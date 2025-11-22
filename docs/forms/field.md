# Field Container

## Overview
- **Component**: `typerefinery/components/forms/field`
- **Role**: Core building block for all leaf form inputs. Not usually authored directly; instead other components inherit it via `sling:resourceSuperType`.
- **Definition**: `.content.json` marks it as `isContainer: true`, grouped under `.hidden`, so it appears only as a base class.

## Sling Model (`Field`)
- Class: `ai.typerefinery.websight.models.components.forms.Field`.
- Responsibilities:
  - Sets `module = "field"` for client bootstrapping.
  - Adds standard Bootstrap classes (`form-group`, optional flex layout, `mb-3` spacing).
  - Resolves `labelId` / `fieldId` by inspecting `label` and `field` child nodes, guaranteeing `<label for>` links remain unique even after duplication.
  - Supports optional flex layout via the `flexEnabled` property.

## Authoring Fragment
- Shared controls live in `forms/form/common/.content.json` and are embedded by inheriting components:
  - Label (`label`)
  - Title (`title`)
  - Name (`name`)
  - Value (`value`)
  - Default Value (`defaultvalue`)
  - Placeholder (`placeholder`)
- The field dialog (`dialog/.content.json`) only pulls in **Style**, **Grid**, **Alignment** tabs; specific widgets come from the shared fragment.
- Select fields support datasource integration via the Key-Value Datasource component for loading options from repository nodes (see `docs/dialog/datasource-keyvalue.md`).

## Rendering
- `field.html` adapts the model, while `variant.html` renders markup for both the label and field wrapper.
- Child components (checkbox, input, select, etc.) supply their own template nodes but allow the base variant to handle layout, IDs, and CSS classes.

## Flow & Client Integration
- Because all field variants extend this component, Flow metadata and payload behaviour are centralised:
  - Flow configuration (enablement, metadata fields) lives on the parent form.
  - The form client library relies on marker attributes (e.g., `isInput`) placed by child templates, but the Field model ensures structural consistency.
  - Duplicate detection and hint overlays (in `functions.js` / `style.css`) target the wrappers supplied by this base component.

## Key Files
- Component definition: `forms/field/.content.json`
- Dialog: `forms/field/dialog/.content.json`
- Templates: `forms/field/field.html`, `forms/field/variant.html`
- Shared fragment: `forms/form/common/.content.json`

## Related Readme
- Composite (`docs/forms/composite.md`)
- Checkbox, input, select, etc. (see sibling documentation)
- Key-Value Datasource (`docs/dialog/datasource-keyvalue.md`) - For select fields with dynamic options

