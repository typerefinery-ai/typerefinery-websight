# Textarea Field

## Overview
- **Component**: `typerefinery/components/forms/textarea`
- **Purpose**: Captures multi-line text input.
- **Inheritance**: Extends `typerefinery/components/forms/field`.

## Authoring Dialog
- Standard field controls (label, name, placeholder, default value) plus any textarea-specific settings such as row count.
- Includes **Style**, **Grid**, and **Alignment** tabs via shared includes.

## Flow Integration
- Values are serialised by the form client library in the same manner as standard inputs and included in Flow payloads.
- Supports integration with Flow metadata configured on the parent form container.

## Templates
- Rendered via `textarea.html` with supporting templates located under `template/`.

## Related Links
- Base field documentation – [`../field/README.md`](../field/README.md)
- Form container documentation – [`../form/README.md`](../form/README.md)

