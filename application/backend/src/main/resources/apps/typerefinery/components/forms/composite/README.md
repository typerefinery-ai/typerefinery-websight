# Composite Field

## Overview
- **Component**: `typerefinery/components/forms/composite`
- **Description**: Container field that groups multiple child inputs (e.g., address blocks) while still behaving like a single logical field in payloads.
- **Inheritance**: Extends `typerefinery/components/forms/field`; marked as `isContainer: true` with allowed children drawn from the forms and STIX form libraries (see `.content.json`).

## Structure & Rendering
- Default structure (`template/.content.json`) mirrors the standard field pattern:
  - `label` child: `typerefinery/components/forms/fields/label`.
  - `field` child: `typerefinery/components/forms/fields/composite`, which acts as a wrapper for nested inputs.
- `composite.html` adapts the Sling model (inherits from `Field`) and renders the variant template, ensuring label/field IDs remain synchronised for accessibility.
- Author-created child resources inside the composite become part of the grouped payload.

## Authoring Dialog
- Inherits the shared dialog from the base field:
  - **General** fragment for label, title, name, value, default value, placeholder.
  - **Style**, **Grid**, **Alignment** tabs via common includes.
- No extra composite-specific widgets; the main difference is that authors can insert additional components within the composite body.

## Flow & Client Behaviour
- `functions.js` (global form client library) recognises composite containers (`compositeNs.selector`) and:
  - Collects child field values using `compositeNs.getValue`.
  - Flattens or nests payloads depending on child configuration, allowing a single composite to emit an object structure.
- Flow metadata is inherited from the parent form container. When Flow API is enabled, composite values are included automatically in the payload sent to FlowStream.

## Usage Notes
- Use composites to bundle related inputs with a shared name or grouped JSON output.
- Combine with custom templates or STIX form inputs to produce domain-specific structures without writing bespoke client code.
- Ensure child components have unique names to avoid overflow; the client library warns about duplicates during authoring.

## Key Files
- Component definition: `.content.json`
- Default template: `template/.content.json`
- Rendering stub: `composite.html`
- Related docs:
  - Base field container – [`../field/README.md`](../field/README.md)
  - Form container – [`../form/README.md`](../form/README.md)

