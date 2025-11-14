# Fieldset

## Overview
- **Component**: `typerefinery/components/forms/fieldset`
- **Purpose**: Semantic wrapper for grouping related form inputs inside a `<fieldset>` with an optional `<legend>`.
- **Characteristics**: `isContainer: true` so authors can nest any supported form component inside the fieldset.

## Sling Model & Rendering
- `fieldset.html` adapts `ai.typerefinery.websight.models.components.layout.Container` with `decorationTagName='fieldset'`, so the container infrastructure emits a `<fieldset>` element.
- The corresponding variant template outputs an optional legend before rendering child components.

## Authoring Dialog
- Dialog configuration (in `dialog/.content.json`) exposes:
  - Legend/title fields.
  - Optional description or helper text (depending on project needs).
  - Shared **Style**, **Grid**, **Alignment** tabs so layout classes can be applied to the container.
- Authors drag other form components inside the fieldset to build grouped sections.

## Flow Integration
- Fieldset does not generate its own payload entries; it simply organises child components.
- Child fields remain Flow-aware via their own models and the global client library, so grouping does not affect payload serialisation.

## Key Files
- Component definition: `.content.json`
- Dialog definition: `dialog/.content.json`
- Rendering stub: `fieldset.html`

## Related Links
- Form container – [`../form/README.md`](../form/README.md)
- Shared field container – [`../field/README.md`](../field/README.md)

