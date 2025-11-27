# Select Field

## Overview

**Component**: `typerefinery/components/forms/select`

**Description**: Dropdown selection field supporting single and multiple selection, search/filter, dynamic option loading, and advanced selection features. Uses Choices.js library for enhanced functionality.

**Inheritance**: Extends `typerefinery/components/forms/field` via `sling:resourceSuperType`, inheriting the shared field container, dialog fragments, and Flow metadata conventions.

**Location**: `/apps/typerefinery/components/forms/select/`

## Resource Type

```
typerefinery/components/forms/select
```

## Features

- **Single Selection**: Traditional dropdown with single option selection
- **Multiple Selection**: Multi-select dropdown with array output
- **Search/Filter**: Built-in search functionality to filter options
- **Select All**: Option to select all items at once (multi-select)
- **Dynamic Options**: Load options from datasource or API endpoint
- **Custom Key/Label**: Configure which properties to use for value/label
- **Maximum Selection**: Limit number of selections in multi-select mode
- **Event Support**: Supports `SELECT_CHANGE`, `SELECT_ITEM_ADD`, `SELECT_ITEM_REMOVE`, `SELECT_ITEM_SELECT` events
- **Flow Integration**: Automatically included in form payloads
- **Bootstrap Styling**: Uses `form-select` class for consistent styling

## Component Structure

```
/apps/typerefinery/components/forms/select/
├── .content.json              # Component definition (extends field)
├── select.html                # Rendering stub (uses Field model)
├── template/
│   └── .content.json          # Default template structure
└── dialog/                    # Inherits dialog from parent field
```

### Field Component

```
/apps/typerefinery/components/forms/fields/select/
├── select.html                # Field rendering (uses Select model)
├── variant.html               # Select element template
├── clientlibs/
│   ├── functions.js           # Choices.js integration and event handling
│   └── behaviour.js           # DOM initialization
└── dialog/
    └── .content.json          # Field dialog configuration
```

## Sling Model

**Class**: `ai.typerefinery.websight.models.components.forms.Select`

**Inheritance**: Extends `BaseFormComponent`

**Key Properties**:
- `inputType`: Select type (single or multi)
- `multipleSelection`: Boolean flag for multi-select mode
- `maxSelection`: Maximum number of selections allowed
- `enableSearch`: Boolean flag to enable search/filter
- `searchPlaceholder`: Placeholder text for search input
- `enableSelectAll`: Boolean flag to enable "select all" option
- `selectOptions`: List of option items (for inline options)
- `readOptionsFromDataSource`: URL to load options dynamically
- `readMethod`: HTTP method for loading options (GET, POST, etc.)
- `readPayloadType`: Payload type for option loading (json, form, etc.)
- `keyNameInOptionList`: Property name to use as option value
- `labelNameInOptionList`: Property name to use as option label
- Inherits all properties from `BaseFormComponent`

**Default Values**:
- `id`: `"select"`
- `module`: `"select"`
- `label`: `"Select"`
- `placeholder`: `"Select an item"`
- `inputType`: `"single"` (default)
- `multipleSelection`: `false`
- `validationRequired`: `false`
- `enableSearch`: `false`
- `enableSelectAll`: `false`

**CSS Classes**:
- `form-select`: Bootstrap select styling
- `mt-1`: Margin top spacing

## Structure & Rendering

### Default Template Structure

Default structure (`template/.content.json`) follows the standard field pattern:

```json
{
  "label": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/label",
    "label": "Select Label"
  },
  "field": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/select",
    "label": "Select"
  }
}
```

### Rendering Flow

1. **Container Component** (`select.html`):
   - Adapts `Field` Sling Model (inherits from base field)
   - Renders variant template ensuring label/field IDs remain synchronized

2. **Field Component** (`fields/select/select.html`):
   - Adapts `Select` Sling Model
   - Wraps variant template in component container
   - Initializes Choices.js library client-side

3. **Variant Template** (`variant.html`):
   - Renders `<select>` element with appropriate attributes
   - Sets `isInput="true"` attribute for form data collection
   - Options are populated via Choices.js initialization

## Authoring Dialog

The select component inherits the shared dialog from the base field:

- **General** fragment (`forms/form/common/.content.json`) supplies:
  - Label
  - Title
  - Name (field name for form submission)
  - Value (default selected value)
  - Default Value
  - Placeholder
- **Style**, **Grid**, **Alignment** tabs via common includes
- **Events** tab for event configuration (if enabled)
- Flow metadata configured on parent form container

### Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Field name (used for form submission) |
| `label` | String | No | Display label for the select field (default: "Select") |
| `placeholder` | String | No | Placeholder text (default: "Select an item") |
| `inputType` | String | No | Select type ("single" or "multi") |
| `multipleSelection` | Boolean | No | Enable multi-select mode (default: `false`) |
| `maxSelection` | String | No | Maximum number of selections allowed (multi-select only) |
| `enableSearch` | Boolean | No | Enable search/filter functionality (default: `false`) |
| `searchPlaceholder` | String | No | Placeholder text for search input |
| `enableSelectAll` | Boolean | No | Enable "select all" option (multi-select only) |
| `required` | Boolean | No | Whether field is required (default: `false`) |
| `disabled` | Boolean | No | Whether field is disabled (default: `false`) |
| `selectOptions` | Array | No | Inline option list (label/value pairs) |
| `readOptionsFromDataSource` | String | No | URL to load options dynamically |
| `readMethod` | String | No | HTTP method for option loading (GET, POST, etc.) |
| `readPayloadType` | String | No | Payload type for option loading (json, form, etc.) |
| `keyNameInOptionList` | String | No | Property name to use as option value |
| `labelNameInOptionList` | String | No | Property name to use as option label |
| `defaultSelectedOptions` | String | No | Default selected value(s) |

## Usage Patterns

### Single Selection

Basic single-select dropdown:

```html
<typerefinery:select name="country" label="Country" placeholder="Select a country">
  <!-- Options loaded via datasource or inline -->
</typerefinery:select>
```

**Output**:
```json
{
  "country": "us"
}
```

### Multiple Selection

Multi-select dropdown with array output:

```html
<typerefinery:select name="interests" label="Interests" multipleSelection="true" placeholder="Select interests">
  <!-- Options loaded via datasource or inline -->
</typerefinery:select>
```

**Output**:
```json
{
  "interests": ["sports", "music", "reading"]
}
```

### With Search

Select with search/filter functionality:

```html
<typerefinery:select name="country" label="Country" enableSearch="true" searchPlaceholder="Search countries..." />
```

### With Select All

Multi-select with "select all" option:

```html
<typerefinery:select name="interests" label="Interests" 
  multipleSelection="true" 
  enableSelectAll="true" />
```

### Maximum Selection

Limit number of selections:

```html
<typerefinery:select name="skills" label="Top Skills" 
  multipleSelection="true" 
  maxSelection="3" />
```

### Dynamic Options Loading

Load options from datasource or API:

```html
<typerefinery:select name="category" label="Category"
  readOptionsFromDataSource="/api/categories"
  readMethod="GET"
  keyNameInOptionList="id"
  labelNameInOptionList="name" />
```

**API Response Format**:
```json
[
  {"id": "1", "name": "Category 1"},
  {"id": "2", "name": "Category 2"}
]
```

## Options Configuration

### Inline Options

Define options directly in dialog:

```json
{
  "selectOptions": [
    {
      "label": "Option 1",
      "value": "opt1"
    },
    {
      "label": "Option 2",
      "value": "opt2"
    }
  ]
}
```

### Dynamic Options (Datasource)

Use datasource component for option loading:

```html
<typerefinery:select name="color" label="Color">
  <datasource>
    <sling:resourceType>typerefinery/components/dialog/datasources/keyvalue</sling:resourceType>
    <path>/apps/typerefinery/components/dialog/fields/color</path>
  </datasource>
</typerefinery:select>
```

## Client-Side Behavior

### Choices.js Integration

The select component uses Choices.js library for enhanced functionality:

- **Enhanced Dropdown**: Better UX than native select
- **Search/Filter**: Built-in search functionality
- **Multi-Select**: Advanced multi-select with tags
- **Custom Styling**: Bootstrap-compatible styling

### Value Handling

The select component provides specialized value handling:

#### `getValue(id)`

Retrieves selected value(s) for select component:

```javascript
// Single select: returns single value or null
// Multi-select: returns array of values or empty array
const value = Typerefinery.Components.Forms.Select.getValue("select-id");
// Example: "us" or ["sports", "music"]
```

#### `setValue(id, value, options)`

Sets selected value(s) programmatically:

```javascript
// Single select
Typerefinery.Components.Forms.Select.setValue("country-id", "us");

// Multi-select (array)
Typerefinery.Components.Forms.Select.setValue("interests-id", ["sports", "music"], {
  replaceItems: true  // Replace existing items
});
```

### Form Integration

In the form's `getFormData()` function, select fields are processed as follows:

```javascript
else if(isSelect) {
    // Get value from select tag
    result[name] = selectNs.getValue(id);
}
```

**Key Behavior**:
- Single select returns single value (string or null)
- Multi-select returns array of values (array or empty array)
- Values are extracted from Choices.js instance

## Event Support

The select component supports the following events:

### SELECT_CHANGE

Fired when selection changes.

**Event Data**:
```javascript
{
  type: "SELECT_CHANGE",
  value: "us",  // or ["sports", "music"] for multi-select
  id: "select-id",
  action: "SELECT_CHANGE"
}
```

### SELECT_ITEM_ADD

Fired when an item is added to multi-select.

**Event Data**:
```javascript
{
  type: "SELECT_ITEM_ADD",
  value: "reading",
  id: "select-id",
  action: "SELECT_ITEM_ADD"
}
```

### SELECT_ITEM_REMOVE

Fired when an item is removed from multi-select.

**Event Data**:
```javascript
{
  type: "SELECT_ITEM_REMOVE",
  value: "sports",
  id: "select-id",
  action: "SELECT_ITEM_REMOVE"
}
```

### SELECT_ITEM_SELECT

Fired when an item is selected.

**Event Data**:
```javascript
{
  type: "SELECT_ITEM_SELECT",
  value: "music",
  id: "select-id",
  action: "SELECT_ITEM_SELECT"
}
```

### Event Configuration

Configure events in the dialog's **Events** tab:

```json
{
  "events": [
    {
      "topic": "form-select",
      "type": "emit",
      "name": "SELECT_CHANGE",
      "action": "SELECT_CHANGE"
    }
  ]
}
```

## Flow Integration

### Automatic Inclusion

When Flow API is enabled:

- Select values are automatically included in form payloads
- Single select returns single value
- Multi-select returns array of values
- Flow metadata is inherited from parent form container

### Payload Structure

**Single Select**:
```json
{
  "country": "us"
}
```

**Multi-Select**:
```json
{
  "interests": ["sports", "music", "reading"]
}
```

## Bootstrap Styling

The select component uses Bootstrap form-select classes:

### Input Classes

- `form-select`: Bootstrap select styling
- `mt-1`: Margin top spacing

### HTML Structure

```html
<div class="form-group">
  <label for="select-id">Country</label>
  <select class="form-select mt-1" id="select-id" name="country">
    <!-- Options populated via Choices.js -->
  </select>
</div>
```

## Best Practices

### 1. Single vs Multi-Select

- Use **single select** for mutually exclusive options (country, status, etc.)
- Use **multi-select** when multiple independent selections are needed (tags, categories, etc.)

### 2. Search Functionality

- Enable search for lists with more than 10 options
- Provide clear search placeholder text
- Test search with various option names

### 3. Maximum Selection

- Set `maxSelection` for multi-select to prevent too many selections
- Communicate maximum to users via label or placeholder
- Use validation for maximum selection enforcement

### 4. Dynamic Options

- Use datasource for shared option lists
- Use API endpoint for dynamic/computed options
- Configure `keyNameInOptionList` and `labelNameInOptionList` correctly

### 5. Performance

- Limit option count to reasonable numbers (recommended max 500-1000)
- Use search for large option lists
- Consider pagination for very large lists

## Troubleshooting

### Select Not Initializing

**Possible Causes**:
- Choices.js library not loaded
- Invalid select element structure
- JavaScript errors during initialization

**Solutions**:
1. Verify Choices.js library is loaded
2. Check browser console for JavaScript errors
3. Verify select element structure is correct
4. Ensure select has valid options

### Options Not Loading

**Possible Causes**:
- Datasource not configured correctly
- API endpoint not accessible
- Incorrect key/label property names

**Solutions**:
1. Verify datasource path or API URL is correct
2. Check network tab for API requests
3. Verify `keyNameInOptionList` and `labelNameInOptionList` match API response
4. Test API endpoint directly

### Multi-Select Not Working

**Possible Causes**:
- `multipleSelection` not set to `true`
- Choices.js not initialized in multi-select mode
- Conflicting options

**Solutions**:
1. Verify `multipleSelection="true"` is set
2. Check Choices.js initialization configuration
3. Verify options are valid for multi-select

### Search Not Working

**Possible Causes**:
- `enableSearch` not set to `true`
- Choices.js search not enabled
- Options not searchable

**Solutions**:
1. Verify `enableSearch="true"` is set
2. Check Choices.js search configuration
3. Test with different option names

## Related Components

- **Field Container**: `typerefinery/components/forms/field` - Base field component
- **Radio Field**: `typerefinery/components/forms/radio` - Single selection alternative
- **Checkbox Field**: `typerefinery/components/forms/checkbox` - Multiple selection alternative
- **Dialog Select**: `typerefinery/components/dialog/select` - Dialog-specific select component
- **Form Container**: `typerefinery/components/forms/form` - Parent form component

## Key Files

- **Component Definition**: `/apps/typerefinery/components/forms/select/.content.json`
- **Default Template**: `/apps/typerefinery/components/forms/select/template/.content.json`
- **Rendering Stub**: `/apps/typerefinery/components/forms/select/select.html`
- **Field Component**: `/apps/typerefinery/components/forms/fields/select/`
- **Sling Model**: `ai.typerefinery.websight.models.components.forms.Select`
- **Client Libraries**: `/apps/typerefinery/components/forms/fields/select/clientlibs/`

## References

- **Base Field Container**: `docs/forms/field.md`
- **Radio Field**: `docs/forms/radio.md`
- **Checkbox Field**: `docs/forms/checkbox.md`
- **Dialog Select**: `docs/dialog/select.md`
- **Key-Value Datasource**: `docs/dialog/datasource-keyvalue.md`
- **Form Container**: `docs/forms/form.md` (if exists)
- **Component README**: `/apps/typerefinery/components/forms/select/README.md`
- **Choices.js**: https://github.com/Choices-js/Choices
- **Bootstrap Form Select**: https://getbootstrap.com/docs/5.3/forms/select/


