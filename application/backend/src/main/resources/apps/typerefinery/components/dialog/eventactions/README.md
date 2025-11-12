# Event Actions Dialog Field

The `typerefinery/components/dialog/eventactions` dialog component renders an Atlaskit-powered `<Select>` input that lists the event actions supported by the component currently being configured.

The select is intended for use on the **Events** tab of component dialogs so authors can choose how the component reacts to runtime events (for example button click handling).

## Rendering Flow

- `eventactions.json.html` instantiates the React component `/apps/typerefinery/components/dialog/eventactions/EventActions.js`.
- The Sling model `ai.typerefinery.websight.models.dialog.Dialog` resolves the current component resource and exposes the list of event actions available under the component.
- `EventActions.js` renders the Atlaskit `<Select>` with the provided options, keeps the current value controlled, and portals the menu to `document.body` to prevent clipping inside the dialog.

## Component Structure Requirements

To expose options to this dialog field, a component must define the following repository structure:

```text
/apps/<component-path>/
├── dialog/...
└── eventactions/
    ├── <action-node>/
    │   ├── key = "<stored value>"
    │   └── value = "<author-facing label>"
    └── ...
```

- Create an `eventactions` child node directly under the component definition.
- Each immediate child node under `eventactions` **must** be `nt:unstructured` (or another resource type that adapts to `KeyValuePair`) and provide `key` and `value` string properties.
  - `key` is written to the dialog field and stored in content.
  - `value` is shown to authors as the option label.
- Additional properties (e.g. `description`) are ignored by the current implementation.

> The backing Sling model (`Dialog`) adapts each child to `KeyValuePair`, so only `key` and `value` are read. Any missing property results in that option being skipped.

## Example Component Configuration

`/apps/typerefinery/components/forms/fields/button/eventactions/.content.json` demonstrates the expected structure:

```json
{
  "sling:resourceType": "nt:unstructured",
  "buttonclick": {
    "sling:resourceType": "nt:unstructured",
    "key": "BUTTON_CLICK",
    "value": "Button Click"
  },
  "openmodal": {
    "sling:resourceType": "nt:unstructured",
    "key": "MODAL_OPEN",
    "value": "Open Modal with URL"
  }
}
```

With the dialog registration:

```json
"eventactions": {
  "sling:resourceType": "typerefinery/components/dialog/eventactions",
  "name": "./eventAction",
  "label": "Event action",
  "description": "Select how this component responds to events",
  "required": true
}
```

## Authoring Notes

- The dialog field placeholder uses the provided `label`.
- When the selection changes, the dialog writes the chosen `key` value to the field identified by `name`.
- Options are recalculated when the dialog reloads so updates to the `eventactions` child are immediately reflected.

For Atlaskit `<Select>` interaction details, refer to the Atlassian documentation: https://atlassian.design/components/select/examples