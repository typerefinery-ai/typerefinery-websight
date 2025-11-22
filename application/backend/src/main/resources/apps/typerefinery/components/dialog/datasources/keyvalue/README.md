# Key-Value Datasource Component

## Overview

The **Key-Value Datasource** component (`typerefinery/components/dialog/datasources/keyvalue`) is a datasource provider that loads select/dropdown options from repository nodes and outputs them as key-value pairs (label-value format) instead of defining them inline in dialog definitions.

This datasource allows you to:
- Store option lists in repository nodes for better maintainability
- Reuse option lists across multiple dialog fields
- Update options without modifying dialog definitions
- Support both absolute and relative paths
- Output options in standardized key-value (label-value) format

## Resource Type

```
typerefinery/components/dialog/datasources/keyvalue
```

## How It Works

### Architecture Overview

```
Dialog Definition (.content.json)
  └── selectField
      └── datasource (child resource)
          ├── sling:resourceType: "typerefinery/components/dialog/datasources/keyvalue"
          └── path: "/content/myoptions" (property)
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

### Data Flow

1. **Dialog Component** (e.g., `select.json.html`) detects datasource child
2. **HTL Template** calls datasource via `data-sly-resource`
3. **KeyValue Model** (`KeyValue.java`) processes the request:
   - Reads `path` property from datasource resource
   - Resolves path (absolute or relative to component)
   - Loads child resources from resolved path
   - Adapts each child resource to `KeyValuePair`
4. **HTL Template** (`keyvalue.json.html`) renders options as JSON array in label-value format
5. **Options array** is embedded in parent component's JSON config

## Sling Model: KeyValue

**Class**: `ai.typerefinery.websight.models.datasource.KeyValue`

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `path` | String | Yes | Path to content node containing option resources |

### Path Resolution

The `path` property supports two formats:

#### 1. Absolute Path
If the path starts with `/`, it's resolved as an absolute path:

```json
{
  "path": "/content/myapp/options/colors"
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

### KeyValuePair Model

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

## HTL Template: keyvalue.json.html

**File**: `/apps/typerefinery/components/dialog/datasources/keyvalue/keyvalue.json.html`

### Template Structure

The template is standalone and outputs key-value pairs in a configurable format:

```html
<sly data-sly-use.model="ai.typerefinery.websight.models.datasource.KeyValue">
  <sly data-sly-set.labelProp="${properties.labelProp || 'label'}">
  <sly data-sly-set.valueProp="${properties.valueProp || 'value'}">
  [
    <sly data-sly-list.item="${model.options}">
      {
          "${labelProp}": "${item[labelProp] || item.label || item.key || item.value}",
          "${valueProp}": "${item[valueProp] || item.value}"
          <sly data-sly-test="${item.selected}">,
              "selected": ${item.selected}
          </sly>
      }<sly data-sly-test="${!itemList.last}">,</sly>
    </sly>
  ]
</sly>
</sly>
</sly>
```

### Configuration Options

The template supports configurable property names:

- `labelProp`: Property name for label field (default: `"label"`)
- `valueProp`: Property name for value field (default: `"value"`)

**Example with custom property names:**
```json
{
  "datasource": {
    "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
    "path": "/content/myoptions",
    "labelProp": "display",
    "valueProp": "id"
  }
}
```

This would output: `{"display": "...", "id": "..."}`

### How It Works

1. **Loads KeyValue Model**: Accesses the Sling Model to get options
2. **Configures Property Names**: Reads `labelProp` and `valueProp` from datasource resource (with defaults)
3. **Renders JSON Array**: Outputs a JSON array `[...]`
4. **Iterates Options**: Loops through `model.options` list
5. **Outputs Key-Value Pairs**: Renders each option as `{label: "...", value: "..."}`
6. **Comma Separation**: Adds commas between items (except last)

### Output Format

The template generates a JSON array of key-value pairs:

```json
[
  {
    "label": "Red Color",
    "value": "red"
  },
  {
    "label": "Blue Color",
    "value": "blue"
  },
  {
    "label": "Green Color",
    "value": "green"
  }
]
```

**Label Fallback Chain:**
- Uses `labelProp` property if configured
- Falls back to `item.label` if present
- Falls back to `item.key`
- Falls back to `item.value`

## Usage Examples

### Example 1: Basic Usage in Select Component

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

**Result**: Select component receives options array with color options in label-value format.

### Example 2: Relative Path

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

**Result**: Path resolves to `/apps/typerefinery/components/mycomponent/options/colors`

### Example 3: Custom Property Names

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
      "valueProp": "code"
    }
  }
}
```

**Output**: `[{"display": "...", "code": "..."}]`

### Example 4: Integration with Select Component

**How Select Component Uses Datasource** (`select.json.html`):

```html
<!--/* Find datasource child */-->
<sly data-sly-list.child="${resource.children}">
  <sly data-sly-test="${child.name == 'datasource' && child['sling:resourceType'] == 'typerefinery/components/dialog/datasources/keyvalue'}"
       data-sly-set.datasourceChild="${child}">
  </sly>
</sly>

<!--/* Use datasource if found */-->
<sly data-sly-test="${datasourceChild}">
  {
    "type": "/apps/typerefinery/components/dialog/select/Select.js",
    "props": {
      "name": "${properties.name}",
      "label": "${properties.label}",
      "options": <sly data-sly-resource="${datasourceChild.path @ resourceType='typerefinery/components/dialog/datasources/keyvalue'}"></sly>
    }
  }
</sly>
```

The `data-sly-resource` call renders the datasource template, which outputs the JSON options array.

## Related Components

- **Select Component**: `/apps/typerefinery/components/dialog/select`
- **KeyValuePair Model**: `ai.typerefinery.websight.models.components.KeyValuePair`
- **Reusable Content Fields**: `/apps/typerefinery/components/dialog/fields`

## References

- **Select Component README**: See `/apps/typerefinery/components/dialog/select/README.md`
- **Reusable Content Fields README**: See `/apps/typerefinery/components/dialog/fields/README.md`
- **HTL Specification**: See `.cursor/rules/htl-specification.mdc`
- **Sling Models**: https://sling.apache.org/documentation/bundles/models.html

