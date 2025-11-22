# Select Dialog Component

## Overview

The **Select Dialog Component** (`typerefinery/components/dialog/select`) renders an Atlaskit-powered `<Select>` field for dialog forms. It supports plain options, grouped options, and dynamic option loading via datasource components.

**Location**: `/apps/typerefinery/components/dialog/select/`

**Reference**: [Atlassian Design - Select Component](https://atlassian.design/components/select/examples)

## Resource Type

```
typerefinery/components/dialog/select
```

## Features

- **Plain Options**: Simple flat list of selectable options
- **Grouped Options**: Options organized into groups with labels
- **Dynamic Options**: Load options from repository nodes via datasource components
- **Visual Enhancements**: Color swatches and icon rendering support
- **Create Support**: Allow authors to create new options at authoring time
- **Backward Compatible**: Supports both inline and datasource-based options

## Component Structure

```
/apps/typerefinery/components/dialog/select/
├── select.json.html          # HTL template that renders JSON config
├── Select.js                 # React component using Atlaskit Select
├── selectitem/
│   └── selectitem.json.html  # Template for individual options
├── selectgroup/
│   └── selectgroup.json.html # Template for grouped options
└── README.md                 # Component documentation
```

## Usage Patterns

### Pattern 1: Inline Simple Options

Define options directly in the dialog definition:

```json
{
  "flowColor": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "flowapi_color",
    "label": "Card Colour",
    "description": "Choose the colour applied to Flow Designer cards.",
    "default": {
      "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
      "label": "Default",
      "value": ""
    },
    "accent": {
      "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
      "label": "Accent Red",
      "value": "#E73323"
    },
    "highlight": {
      "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
      "label": "Highlight Yellow",
      "value": "#FFFD54"
    }
  }
}
```

### Pattern 2: Inline Grouped Options

Organize options into groups:

```json
{
  "eventName": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "name",
    "allowCreate": true,
    "label": "Event Name",
    "description": "Event Name raised by the component",
    "default": {
      "sling:resourceType": "typerefinery/components/dialog/select/selectgroup",
      "label": "Default",
      "custom": {
        "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
        "label": "Custom",
        "value": ""
      }
    },
    "topic": {
      "sling:resourceType": "typerefinery/components/dialog/select/selectgroup",
      "label": "Topic",
      "create": {
        "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
        "label": "Payload",
        "value": "topicpayload"
      }
    }
  }
}
```

### Pattern 3: Datasource-Based Options

Load options from repository nodes using the Key-Value Datasource:

```json
{
  "flowIcon": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "flowapi_icon",
    "label": "Icon",
    "description": "Optional icon class shown in Flow Designer.",
    "isIcon": true,
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/icons"
    }
  }
}
```

## Properties

### Standard Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Field name (stored in content) |
| `label` | String | No | Display label for the field |
| `description` | String | No | Help text shown below the field |
| `required` | Boolean | No | Whether field is required (default: `false`) |
| `allowCreate` | Boolean | No | Allow creating new options at authoring time (default: `false`) |

### Visual Enhancement Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `isColour` | Boolean | No | Display color swatches next to options (default: `false`) |
| `isIcon` | Boolean | No | Display Font Awesome icons next to options (default: `false`) |

### Datasource Configuration

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `datasource` | Object | No | Datasource child resource configuration |

## Visual Enhancements

### Color Swatches (`isColour`)

When `isColour: true`, displays a color swatch next to each option label.

**Requirements:**
- Option `value` should be a hex color code (e.g., `#E73323`, `#FFFD54`)
- Empty string (`""`) displays as transparent/default
- Color swatch is 20px × 20px with border

**Example:**
```json
{
  "flowColor": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "flowapi_color",
    "label": "Color",
    "isColour": true,
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/color"
    }
  }
}
```

### Icon Rendering (`isIcon`)

When `isIcon: true`, displays Font Awesome icons next to each option label.

**Requirements:**
- Option `value` should be a Font Awesome class (e.g., `fa fa-ad`, `fab fa-500px`, `far fa-pause-circle`)
- Font Awesome CSS must be loaded in the page
- Icon is displayed before the label

**Example:**
```json
{
  "flowIcon": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "flowapi_icon",
    "label": "Icon",
    "isIcon": true,
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/icons"
    }
  }
}
```

## Datasource Integration

The select component automatically detects and uses datasource children:

### Detection Logic

The component looks for a child resource named `datasource` with resource type `typerefinery/components/dialog/datasources/keyvalue`:

```html
<sly data-sly-list.child="${resource.children}">
  <sly data-sly-test="${child.name == 'datasource' && child['sling:resourceType'] == 'typerefinery/components/dialog/datasources/keyvalue'}"
       data-sly-set.datasourceChild="${child}">
  </sly>
</sly>
```

### Datasource vs Inline Options

The component supports two modes:

1. **Datasource Mode**: Options loaded from repository via datasource (if datasource child exists)
2. **Inline Mode**: Options defined inline as children (fallback if no datasource)

**Important**: Both branches must pass the same props to the React component.

## Option Format

### Inline Options (selectitem)

Each `selectitem` child resource represents a single option:

```json
{
  "optionName": {
    "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
    "label": "Display Label",
    "value": "stored-value",
    "selected": false
  }
}
```

**Properties:**
- `label` (String): Display text shown to user
- `value` (String): Value stored when option is selected
- `selected` (Boolean): Whether this option is selected by default

### Grouped Options (selectgroup)

Each `selectgroup` wraps nested `selectitem` options:

```json
{
  "groupName": {
    "sling:resourceType": "typerefinery/components/dialog/select/selectgroup",
    "label": "Group Label",
    "option1": {
      "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
      "label": "Option 1",
      "value": "value1"
    },
    "option2": {
      "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
      "label": "Option 2",
      "value": "value2"
    }
  }
}
```

### Datasource Options

Options from datasource follow the key-value format:

```json
[
  {
    "label": "Display Label",
    "value": "stored-value"
  }
]
```

See [Key-Value Datasource Documentation](datasource-keyvalue.md) for details.

## React Component

**File**: `/apps/typerefinery/components/dialog/select/Select.js`

### Props

The React component receives the following props from the HTL template:

- `name`: Field name
- `label`: Display label
- `description`: Help text
- `required`: Required flag
- `allowCreate`: Allow creating new options
- `isColour`: Enable color swatches
- `isIcon`: Enable icon rendering
- `options`: Array of option objects

### Custom Rendering

The component uses `formatOptionLabel` to customize option rendering:

- **Color swatches**: Rendered when `isColour: true` and option value is hex color
- **Icons**: Rendered when `isIcon: true` and option value is Font Awesome class
- **Grouped options**: Group labels are rendered without enhancements

## Best Practices

### 1. Use Datasources for Reusable Options

- Create shared option lists in `/apps/typerefinery/components/dialog/fields/`
- Reference via datasource to avoid duplication
- Update options in one place, affects all usages

### 2. Use Inline Options for Component-Specific Options

- Define options inline when they're specific to one component
- Use relative paths in datasource for component-specific options

### 3. Visual Enhancement Guidelines

- Use `isColour` for color selection fields
- Use `isIcon` for icon selection fields
- Don't use both props together (typically only one is needed)

### 4. Prop Consistency

- **CRITICAL**: Always pass the same props in both datasource and fallback branches
- Use `${properties.prop || defaultValue}` pattern for optional props
- Booleans: `${properties.flag || false}` (no quotes)
- Strings: `"${properties.text || ''}"` (with quotes)

## Troubleshooting

### Options Not Appearing

**Possible Causes:**
- Datasource path is incorrect
- Content doesn't exist at specified path
- Child resources don't have `key` property
- Datasource not detected by select component

**Solutions:**
1. Verify datasource path in dialog definition
2. Check that content exists at path (use CRXDE Lite)
3. Ensure all option nodes have `key` property
4. Verify datasource resource type is correct

### Visual Enhancements Not Working

**Color Swatches Not Showing:**
- Verify `isColour: true` is set in dialog definition
- Check that `isColour` prop is passed in both branches of `select.json.html`
- Ensure option values are valid hex colors
- Check browser console for errors

**Icons Not Showing:**
- Verify `isIcon: true` is set in dialog definition
- Check that `isIcon` prop is passed in both branches of `select.json.html`
- Ensure Font Awesome CSS is loaded
- Verify option values are valid Font Awesome classes

### Props Not Working

**Most Common Issue**: Props missing in one branch of `select.json.html`

**Solution:**
- Always check BOTH datasource and fallback branches
- Use `${properties.prop || defaultValue}` pattern
- Ensure boolean props don't have quotes: `${properties.flag || false}`

## Related Components

- **Key-Value Datasource**: `typerefinery/components/dialog/datasources/keyvalue`
- **SelectItem Template**: `/apps/typerefinery/components/dialog/select/selectitem/selectitem.json.html`
- **SelectGroup Template**: `/apps/typerefinery/components/dialog/select/selectgroup/selectgroup.json.html`
- **Reusable Content Fields**: `/apps/typerefinery/components/dialog/fields/`

## References

- **Component README**: `/apps/typerefinery/components/dialog/select/README.md`
- **Key-Value Datasource**: `docs/dialog/datasource-keyvalue.md`
- **Reusable Content Fields**: `/apps/typerefinery/components/dialog/fields/README.md`
- **Atlassian Design - Select**: https://atlassian.design/components/select/examples
- **HTL Specification**: `.cursor/rules/htl-specification.mdc`

