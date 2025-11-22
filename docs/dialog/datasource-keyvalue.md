# Key-Value Datasource Component

## Overview

The **Key-Value Datasource** component (`typerefinery/components/dialog/datasources/keyvalue`) is a datasource provider that loads select/dropdown options from repository nodes and outputs them as key-value pairs (label-value format) instead of defining them inline in dialog definitions.

**Location**: `/apps/typerefinery/components/dialog/datasources/keyvalue/`

## Resource Type

```
typerefinery/components/dialog/datasources/keyvalue
```

## Purpose

This datasource allows you to:
- Store option lists in repository nodes for better maintainability
- Reuse option lists across multiple dialog fields
- Update options without modifying dialog definitions
- Support both absolute and relative paths
- Output options in standardized key-value (label-value) format
- Configure custom property names for label/value fields

## Architecture

### Components

1. **Sling Model**: `ai.typerefinery.websight.models.datasource.KeyValue`
   - Package: `ai.typerefinery.websight.models.datasource`
   - Class: `KeyValue`
   - Location: `application/backend/src/main/java/ai/typerefinery/websight/models/datasource/KeyValue.java`

2. **HTL Template**: `keyvalue.json.html`
   - Location: `/apps/typerefinery/components/dialog/datasources/keyvalue/keyvalue.json.html`
   - Outputs: JSON array of label-value pairs

### Data Flow

```
Dialog Definition (.content.json)
  └── selectField
      └── datasource (child resource)
          ├── sling:resourceType: "typerefinery/components/dialog/datasources/keyvalue"
          └── path: "/apps/typerefinery/components/dialog/fields/color" (property)
                │
                └── KeyValue.java (Sling Model)
                      │
                      ├── Resolves path (absolute or relative)
                      ├── Loads child resources from path
                      └── Adapts each child to KeyValuePair
                            │
                            └── keyvalue.json.html (HTL Template)
                                  │
                                  └── Renders JSON array:
                                      [
                                        {"label": "...", "value": "..."},
                                        {"label": "...", "value": "..."}
                                      ]
```

## Sling Model

**Class**: `ai.typerefinery.websight.models.datasource.KeyValue`

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `path` | String | Yes | Path to repository node containing option resources |

### Path Resolution

The `path` property supports two formats:

#### 1. Absolute Path
If the path starts with `/`, it's resolved as an absolute path:

```json
{
  "path": "/apps/typerefinery/components/dialog/fields/color"
}
```

This resolves directly from the repository root.

#### 2. Relative Path
If the path doesn't start with `/`, it's resolved relative to the component resource:

```json
{
  "path": "options/colors"
}
```

This resolves relative to the component that contains the dialog.

**Example Resolution:**
- Component: `/apps/typerefinery/components/mycomponent`
- Relative path: `options/colors`
- Resolved to: `/apps/typerefinery/components/mycomponent/options/colors`

### Processing Logic

1. **Path Validation**: If `path` is null or empty, returns empty options list
2. **Dialog Detection**: Finds ancestor dialog resource (required for context)
3. **Component Detection**: Finds ancestor component resource (for relative paths)
4. **Path Resolution**: 
   - Absolute: `resolver.getResource(path)`
   - Relative: `resolver.getResource(component, path)`
5. **Child Loading**: Iterates through all child resources
6. **Adaptation**: Each child is adapted to `KeyValuePair`
7. **Filtering**: Only includes options where `key` is not null

## HTL Template

**File**: `/apps/typerefinery/components/dialog/datasources/keyvalue/keyvalue.json.html`

### Configuration Options

The template supports configurable property names:

- `labelProp`: Property name for label field (default: `"label"`)
- `valueProp`: Property name for value field (default: `"value"`)

### Output Format

The template generates a JSON array of key-value pairs:

```json
[
  {
    "label": "Red Color",
    "value": "#E73323"
  },
  {
    "label": "Blue Color",
    "value": "#4285F4"
  }
]
```

**Label Fallback Chain:**
- Uses `labelProp` property if configured
- Falls back to `item.label` if present
- Falls back to `item.key`
- Falls back to `item.value`

## Usage Examples

### Example 1: Basic Usage

**Dialog Definition** (`.content.json`):

```json
{
  "colorField": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "color",
    "label": "Color",
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/color"
    }
  }
}
```

### Example 2: Custom Property Names

**Dialog Definition**:

```json
{
  "customField": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "custom",
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/content/myoptions",
      "labelProp": "display",
      "valueProp": "id"
    }
  }
}
```

**Output**: `[{"display": "...", "id": "..."}]`

### Example 3: Relative Path

**Component Structure**:
```
/apps/typerefinery/components/mycomponent
  ├── dialog
  │   └── .content.json (contains datasource with path: "options/colors")
  └── options
      └── colors
          ├── red
          ├── blue
          └── green
```

**Dialog Definition**:
```json
{
  "colorField": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "color",
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "options/colors"
    }
  }
}
```

## KeyValuePair Model

Each option resource must be adaptable to `KeyValuePair`:

**Class**: `ai.typerefinery.websight.models.components.KeyValuePair`

**Properties:**
- `key` (String): The stored value (required)
- `value` (String): The display label (optional)

**Example Content Structure:**
```
/content/myoptions
  ├── red
  │   ├── key: "red"
  │   └── value: "Red Color"
  ├── blue
  │   ├── key: "blue"
  │   └── value: "Blue Color"
  └── green
      ├── key: "green"
      └── value: "Green Color"
```

## Integration with Select Component

The select component (`select.json.html`) automatically detects datasource children:

```html
<sly data-sly-list.child="${resource.children}">
  <sly data-sly-test="${child.name == 'datasource' && child['sling:resourceType'] == 'typerefinery/components/dialog/datasources/keyvalue'}"
       data-sly-set.datasourceChild="${child}">
  </sly>
</sly>

<sly data-sly-test="${datasourceChild}">
  {
    "type": "/apps/typerefinery/components/dialog/select/Select.js",
    "props": {
      "options": <sly data-sly-resource="${datasourceChild.path @ resourceType='typerefinery/components/dialog/datasources/keyvalue'}"></sly>
    }
  }
</sly>
```

## Reusable Content Fields

For shared option lists, see the **Reusable Content Fields** in `/apps/typerefinery/components/dialog/fields/`:

- **Color Options**: `/apps/typerefinery/components/dialog/fields/color`
- **Icon Options**: `/apps/typerefinery/components/dialog/fields/icons`

These can be referenced using the key-value datasource:

```json
{
  "flowIcon": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "flowapi_icon",
    "isIcon": true,
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/icons"
    }
  }
}
```

## Best Practices

1. **Path Organization**:
   - Use absolute paths for shared options (e.g., `/apps/typerefinery/components/dialog/fields/color`)
   - Use relative paths for component-specific options

2. **Option Resource Structure**:
   - Always set `key` property (stored value)
   - Set `value` property for user-friendly labels
   - If `value` is missing, `key` is used as label

3. **Reusability**:
   - Create reusable option sets in `/apps/typerefinery/components/dialog/fields/`
   - Reference same option sets across multiple dialogs
   - Update options in one place, affects all usages

## Related Components

- **Select Component**: `/apps/typerefinery/components/dialog/select`
- **KeyValuePair Model**: `ai.typerefinery.websight.models.components.KeyValuePair`
- **Reusable Content Fields**: `/apps/typerefinery/components/dialog/fields`

## References

- **Component README**: `/apps/typerefinery/components/dialog/datasources/keyvalue/README.md`
- **Select Component README**: `/apps/typerefinery/components/dialog/select/README.md`
- **Reusable Content Fields README**: `/apps/typerefinery/components/dialog/fields/README.md`
- **HTL Specification**: `.cursor/rules/htl-specification.mdc`
- **Sling Models**: https://sling.apache.org/documentation/bundles/models.html

