# Input Field

## Overview
- **Component**: `typerefinery/components/forms/input`
- **Purpose**: Generic text-style input supporting various HTML input types (text, number, date, etc.).
- **Inheritance**: Extends `typerefinery/components/forms/field`, leveraging the shared general dialog.

## Authoring Dialog
- Inherits the shared field fragment (label, name, default value, etc.).
- Component-specific dialog entries expose input type selection and optional constraints (min/max/step) when the template supports them.
- Includes shared **Style**, **Grid**, **Alignment** tabs automatically.

## Flow Integration
- Input values are collected by the form client library and injected into the Flow payload under the authored field name.
- When Flow is enabled, metadata configured on the parent form (group, name, readme, etc.) applies globally; no extra Flow settings exist on the input itself.

## Templates
- `input.html` adapts the field model and renders the base variant.
- Additional markup/logic can be provided under `template/` (e.g., for special formatting).

## Related Links
- Base field documentation – [`../field/README.md`](../field/README.md)
- Form container documentation – [`../form/README.md`](../form/README.md)

