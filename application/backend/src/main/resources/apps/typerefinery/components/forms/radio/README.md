# Radio Group

## Overview
- **Component**: `typerefinery/components/forms/radio`
- **Purpose**: Renders a set of mutually exclusive options using radio inputs.
- **Inheritance**: Extends the shared field container for consistent label/name handling.

## Authoring Dialog
- Provides configuration for:
  - Option list (value/label pairs).
  - Default selection.
  - Standard styling and layout via shared tabs.

## Flow Integration
- The form client library ensures only the checked value is placed into the Flow payload keyed by the field name.
- Flow metadata continues to be governed by the parent form container.

## Templates
- Defined in `radio.html` with supporting assets under `template/`.

## Related Links
- Base field – [`../field/README.md`](../field/README.md)
- Select component – [`../select/README.md`](../select/README.md) for alternative multi-option inputs.

