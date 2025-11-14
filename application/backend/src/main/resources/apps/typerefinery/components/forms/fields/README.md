# Fields Library

## Overview
- **Location**: `typerefinery/components/forms/fields`
- **Purpose**: Houses reusable field variants (button, checkbox, composite, fileupload, input, radio, select, textarea) used by the parsys inside `forms/form`.
- Each subcomponent typically extends `typerefinery/components/forms/field` and exposes its own dialog under `forms/fields/<name>/dialog`.

## Structure
- `button/` – Specialised button styles for forms (often tied to events/actions).
- `checkbox/`, `composite/`, `fileupload/`, `input/`, `radio/`, `select/`, `textarea/` – Field variants mirroring their top-level counterparts but scoped for inclusion sets or Stix integrations.
- `label/` – Provides label-only elements when needed.

## Authoring Notes
- These components are usually surfaced to authors via the allowed components configuration on the form container.
- Dialogs rely on the same shared general fragment (`forms/form/common/.content.json`) plus type-specific settings.

## Flow Integration
- Values from fields in this library are collected by the same client library (`ai.typerefinery.websight.components.forms.form`) and included in Flow payloads when Flow is enabled.

## Related Links
- Form container – [`../form/README.md`](../form/README.md)
- Shared field container – [`../field/README.md`](../field/README.md)

