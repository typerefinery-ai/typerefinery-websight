# Select Field

## Overview
- **Component**: `typerefinery/components/forms/select`
- **Purpose**: Displays a dropdown (single or multi-select) control.
- **Inheritance**: Extends `typerefinery/components/forms/field`.

## Authoring Dialog
- Typical configuration:
  - Option list (label/value pairs).
  - Multi-select toggle or size options (where supported).
  - Shared **General**, **Style**, **Grid**, **Alignment** tabs.

## Flow Integration
- The form client library (`Typerefinery.Components.Forms.Select`) handles extraction of selected values and injects them into Flow payloads.
- Supports single and multi-value outputs; Flow receives the value(s) keyed by the field name.

## Templates
- Primary markup defined in `select.html` with any custom logic under `template/`.

## Related Links
- Base field – [`../field/README.md`](../field/README.md)
- Input field – [`../input/README.md`](../input/README.md)
- Radio field – [`../radio/README.md`](../radio/README.md)

