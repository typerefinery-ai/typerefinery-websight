# Event Actions Dialog Component

## Overview

The **Event Actions Dialog Component** (`typerefinery/components/dialog/eventactions`) renders an Atlaskit-powered `<Select>` field that automatically loads event actions from the component being configured. It is designed for use on the **Events** tab of component dialogs, allowing authors to select how components react to runtime events (e.g., button click handling).

**Location**: `/apps/typerefinery/components/dialog/eventactions/`

**Reference**: [Atlassian Design - Select Component](https://atlassian.design/components/select/examples)

## Resource Type

```
typerefinery/components/dialog/eventactions
```

## Features

- **Automatic Option Loading**: Automatically loads event actions from the component's `eventactions` child node
- **Component-Scoped**: Options are specific to the component being configured
- **Dynamic Updates**: Options are recalculated when the dialog reloads, so updates to `eventactions` are immediately reflected
- **Key-Value Format**: Uses `KeyValuePair` model for option structure
- **Atlaskit Integration**: Uses Atlaskit Select with menu portal to prevent clipping

## Component Structure

```
/apps/typerefinery/components/dialog/eventactions/
├── eventactions.json.html    # HTL template that renders JSON config
├── EventActions.js           # React component using Atlaskit Select
├── selectitem/
│   └── selectitem.json.html  # Template for individual options
└── README.md                  # Component documentation
```

## Architecture

### Data Flow

1. **Dialog Definition** (`.content.json`):
   ```json
   {
     "eventactions": {
       "sling:resourceType": "typerefinery/components/dialog/eventactions",
       "name": "./eventAction",
       "label": "Event action",
       "description": "Select how this component responds to events",
       "required": true
     }
   }
   ```

2. **HTL Template** (`eventactions.json.html`):
   - Uses `Dialog` Sling Model to resolve the component resource
   - Loads event actions from component's `eventactions` child node
   - Renders JSON config with options passed to React component

3. **Sling Model** (`Dialog.java`):
   - Resolves the component resource from the dialog context
   - Finds `eventactions` child node under the component
   - Adapts each child to `KeyValuePair` objects
   - Exposes `eventActions` list to HTL template

4. **React Component** (`EventActions.js`):
   - Receives props from HTL template
   - Renders Atlaskit Select with provided options
   - Portals menu to `document.body` to prevent clipping
   - Handles value changes and updates dialog field

## Component Structure Requirements

To expose event actions to this dialog field, a component must define the following repository structure:

```
/apps/<component-path>/
├── dialog/
│   └── .content.json
└── eventactions/
    ├── <action-node-1>/
    │   ├── key = "<stored value>"
    │   └── value = "<author-facing label>"
    ├── <action-node-2>/
    │   ├── key = "<stored value>"
    │   └── value = "<author-facing label>"
    └── ...
```

### Requirements

1. **`eventactions` Child Node**: Create an `eventactions` child node directly under the component definition
2. **Action Nodes**: Each immediate child node under `eventactions` must:
   - Be `nt:unstructured` (or another resource type that adapts to `KeyValuePair`)
   - Provide `key` and `value` string properties
   - `key`: Value written to dialog field and stored in content
   - `value`: Display label shown to authors
3. **Additional Properties**: Currently ignored (only `key` and `value` are read)

### Example Component Configuration

`/apps/typerefinery/components/forms/fields/button/eventactions/.content.json`:

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

## Usage

### Basic Usage

Add the eventactions field to your component's dialog definition:

```json
{
  "eventactions": {
    "sling:resourceType": "typerefinery/components/dialog/eventactions",
    "name": "./eventAction",
    "label": "Event action",
    "description": "Select how this component responds to events",
    "required": true
  }
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Field name (stored in content) |
| `label` | String | No | Display label for the field (also used as placeholder) |
| `description` | String | No | Help text shown below the field |
| `required` | Boolean | No | Whether field is required (default: `false`) |

## Sling Model

**Class**: `ai.typerefinery.websight.models.dialog.Dialog`

**Purpose**: Resolves the component resource and loads event actions from the `eventactions` child node.

**Key Methods**:
- `getEventActions()`: Returns list of `KeyValuePair` objects representing available event actions
- `getComponent()`: Returns the component resource
- `getDialog()`: Returns the dialog resource

**Resolution Logic**:
1. Finds dialog resource ancestor
2. Finds component resource ancestor
3. Locates `eventactions` child node under component
4. Adapts each child to `KeyValuePair`
5. Filters out null or invalid options

## Option Format

Each event action option follows the `KeyValuePair` structure:

```json
{
  "label": "Button Click",
  "value": "BUTTON_CLICK"
}
```

**Properties**:
- `label` (String): Display text shown to authors (from `value` property in repository)
- `value` (String): Stored value when option is selected (from `key` property in repository)

## React Component

**File**: `/apps/typerefinery/components/dialog/eventactions/EventActions.js`

### Props

- `name`: Field name
- `label`: Display label (also used as placeholder)
- `description`: Help text
- `required`: Required flag
- `options`: Array of option objects with `label` and `value` properties

### Features

- **Controlled Component**: Manages selected value state
- **Menu Portal**: Portals menu to `document.body` to prevent clipping inside dialog
- **Default Option**: Automatically selects option with `selected: true` if present
- **Dynamic Updates**: Updates when options change

## Best Practices

### 1. Component-Scoped Event Actions

- Define event actions at the component level (under `eventactions` child node)
- Each component can have its own set of event actions
- Event actions are automatically loaded based on the component being configured

### 2. Naming Conventions

- Use descriptive `key` values (e.g., `BUTTON_CLICK`, `MODAL_OPEN`)
- Use user-friendly `value` labels (e.g., "Button Click", "Open Modal with URL")
- Keep keys consistent across components for similar actions

### 3. Required vs Optional

- Set `required: true` if the component must have an event action
- Set `required: false` if event actions are optional

### 4. Component Structure

- Place `eventactions` node directly under component root
- Use `nt:unstructured` for action nodes
- Ensure all action nodes have both `key` and `value` properties

## Troubleshooting

### Event Actions Not Appearing

**Possible Causes**:
- `eventactions` child node doesn't exist under component
- Action nodes missing `key` or `value` properties
- Component resource not resolved correctly
- Dialog not properly associated with component

**Solutions**:
1. Verify `eventactions` node exists under component
2. Check that all action nodes have `key` and `value` properties
3. Verify component resource type is correct
4. Check browser console for HTL errors

### Options Not Updating

**Possible Causes**:
- Dialog not reloading after changes
- Cached component resource
- Incorrect component resolution

**Solutions**:
1. Refresh the dialog after updating `eventactions`
2. Clear browser cache
3. Verify component resource path is correct

### Field Not Saving

**Possible Causes**:
- Incorrect `name` property
- Field not properly bound to dialog
- Validation errors

**Solutions**:
1. Verify `name` property is correct (e.g., `"./eventAction"`)
2. Check dialog structure is valid
3. Review browser console for validation errors

## Comparison with Select Component

| Feature | Event Actions | Select |
|---------|---------------|--------|
| **Option Source** | Component's `eventactions` node | Inline children or datasource |
| **Scope** | Component-specific | Dialog-specific or shared |
| **Loading** | Automatic (via Dialog model) | Manual (inline or datasource) |
| **Use Case** | Event handling configuration | General option selection |
| **Visual Enhancements** | No | Yes (`isColour`, `isIcon`) |
| **Grouping** | No | Yes (via `selectgroup`) |

## Related Components

- **Select Component**: `typerefinery/components/dialog/select` - General-purpose select field
- **Key-Value Datasource**: `typerefinery/components/dialog/datasources/keyvalue` - Loads options from repository
- **KeyValuePair Model**: `ai.typerefinery.websight.models.components.KeyValuePair` - Option structure
- **Dialog Model**: `ai.typerefinery.websight.models.dialog.Dialog` - Component and dialog resolution

## References

- **Component README**: `/apps/typerefinery/components/dialog/eventactions/README.md`
- **Select Component**: `docs/dialog/select.md`
- **Key-Value Datasource**: `docs/dialog/datasource-keyvalue.md`
- **Atlassian Design - Select**: https://atlassian.design/components/select/examples
- **HTL Specification**: `.cursor/rules/htl-specification.mdc`

