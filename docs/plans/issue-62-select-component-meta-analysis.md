# Issue 62 Analysis

Issue: `#62` Need to be able to provide meta for Select component

## Summary

Extend the Select component so datasource-driven options can carry richer metadata, such as icon or other display fields, instead of being limited to plain key and label text.

## Request

The issue asks for richer metadata support in the Select component, including investigation into whether the current select framework can support icons and additional option metadata.

## Analysis Done

I reviewed the Select dialog configuration and the Select client-side rendering logic.

Relevant dialog definition:

- `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/select/dialog/.content.json`

Relevant rendering logic:

- `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/select/clientlibs/functions.js`

Current authored/datasource contract:

- dialog description says datasource must return a JSON array with label/value style fields
- authoring supports:
  - `readOptionsFromDataSource`
  - `keyNameInOptionList`
  - `labelNameInOptionList`
  - `selectOptions`

Current rendering behavior:

- options are rendered as plain HTML `<option>` tags at `functions.js:302`
- only key/value and label text are injected at `functions.js:305`
- datasource options are passed through at `functions.js:404`
- authored options are passed through at `functions.js:433`

## Showcase Page Event Analysis

This issue does not need a custom authored `_events_` contract on the showcase page.

For a showcase page in this repo, the behavior should be demonstrated through Select component configuration:

- `readOptionsFromDataSource`
- `keyNameInOptionList`
- `labelNameInOptionList`
- any new metadata mapping fields introduced by the enhancement

Current limitation:

- the component reads options from datasource config, not from an event emitted on the page
- current HTML generation only produces plain `<option>` tags, so there is no authored event we can add today to unlock metadata rendering

Showcase outcome:

- exact page event creation required: none
- exact showcase requirement: create a new Select showcase page backed by a datasource that returns metadata-rich option objects, then extend the component to render them

## Findings

- The current Select component supports mapping option keys and labels from a datasource.
- I did not find support for additional per-option metadata such as icon, column data, or richer templated rendering.
- The underlying component currently renders standard `<option>` elements, which is a structural limitation for advanced visual metadata unless the enhanced UI layer is extended deliberately.

## Outcome

Repo outcome: this looks like genuine new feature work in this repo.

Working position:

- treat this as a new Select component enhancement
- design a metadata contract first
- then decide whether to extend the current Choices-based rendering or introduce a richer option-template path
