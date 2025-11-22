# Composite Field

## Overview

**Component**: `typerefinery/components/forms/composite`

**Description**: Container field that groups multiple child inputs (e.g., address blocks, contact information) while still behaving like a single logical field in payloads. It supports two variants: **field** (object output) and **list** (array output with add/remove/sort functionality).

**Inheritance**: Extends `typerefinery/components/forms/field`; marked as `isContainer: true` with allowed children drawn from the forms and STIX form libraries (see `.content.json`).

**Location**: `/apps/typerefinery/components/forms/composite/`

## Resource Type

```
typerefinery/components/forms/composite
```

## Features

- **Field Variant**: Single object output grouping related inputs
- **List Variant**: Array output with add/remove/sort functionality
- **Parsely Integration**: Allows authors to add child components via parsys
- **JSON Storage**: Stores all child values as JSON in a hidden input field
- **Dynamic Compilation**: Automatically compiles child values into JSON structure
- **Event Support**: Supports `ADD_ITEM` and `ADDONCE_ITEM` events for dynamic item addition
- **Flow Integration**: Automatically included in Flow API payloads when enabled

## Component Structure

### Container Component

```
/apps/typerefinery/components/forms/composite/
├── .content.json              # Component definition (isContainer: true)
├── composite.html             # Rendering stub (extends field.html)
├── template/
│   └── .content.json          # Default template structure
└── dialog/                    # Inherits dialog from parent field
```

### Field Component

```
/apps/typerefinery/components/forms/fields/composite/
├── .content.json              # Field component definition
├── composite.html             # Field rendering (uses Composite model)
├── variant.html               # Field variant template (object output)
├── variant.list.html          # List variant template (array output)
├── clientlibs/
│   ├── functions.js           # Value compilation and payload handling
│   ├── behaviour.js           # DOM event handlers (add/remove/sort)
│   └── style.css              # Component styling
└── dialog/
    └── .content.json          # Field dialog configuration
```

## Variants

### Field Variant (`type="field"` or default)

**Purpose**: Groups related inputs into a single object structure.

**Structure**:
- Hidden input field stores JSON of all child values
- Parsys area for author-created child components
- All child inputs are marked with `isCompositeInput` attribute

**Output Format**:
```json
{
  "fieldName1": "value1",
  "fieldName2": "value2",
  "nestedComposite": {
    "nestedField1": "nestedValue1"
  }
}
```

**Use Cases**:
- Address blocks (street, city, state, zip)
- Contact information (phone, email, name)
- Related form fields that should be grouped

### List Variant (`type="list"`)

**Purpose**: Creates a list/array of repeated item structures.

**Structure**:
- Hidden input field stores JSON array of all row values
- Template for new rows (`.content` template)
- Parsys area for author-created child components in each row
- Add/remove/sort controls for list management

**Output Format**:
```json
[
  {
    "fieldName1": "value1",
    "fieldName2": "value2",
    "id": "row-1"
  },
  {
    "fieldName1": "value3",
    "fieldName2": "value4",
    "id": "row-2"
  }
]
```

**Features**:
- Add new rows dynamically
- Remove rows (moved to trash for deletion)
- Sort rows via drag-and-drop (using Sortable.js)
- Move rows up/down/top/bottom

**Use Cases**:
- List of contacts
- Multiple addresses
- Repeating groups of fields

## Structure & Rendering

### Default Template Structure

Default structure (`template/.content.json`) mirrors the standard field pattern:

```json
{
  "label": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/label",
    "label": "Composite"
  },
  "field": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/composite",
    "label": "Composite Field"
  }
}
```

### Rendering Flow

1. **Container Component** (`composite.html`):
   - Adapts `Field` Sling Model (inherits from base field)
   - Renders variant template ensuring label/field IDs remain synchronized for accessibility

2. **Field Component** (`fields/composite/composite.html`):
   - Adapts `Composite` Sling Model
   - Selects appropriate variant template (`variant.html` or `variant.list.html`) based on `inputType`
   - Renders hidden input field with `isCompositeValue="true"` attribute
   - Includes parsys area for author-created child components

3. **Variant Templates**:
   - **Field Variant**: Simple parsys wrapper
   - **List Variant**: Row structure with templates, add/remove/sort controls

## Sling Model

**Class**: `ai.typerefinery.websight.models.components.forms.Composite`

**Inheritance**: Extends `BaseFormComponent`

**Key Properties**:
- `inputType`: Field type ("field" or "list")
- `listIsUserReadonly`: Boolean flag for read-only list mode
- Inherits all properties from `BaseFormComponent` and `Field`

**Default Values**:
- `label`: "Composite"
- `id`: "composite"
- `module`: "composite"
- `selectClasses`: "form-composite mt-1"

## Authoring Dialog

The composite component inherits the shared dialog from the base field:

- **General** fragment for label, title, name, value, default value, placeholder
- **Style**, **Grid**, **Alignment** tabs via common includes
- No extra composite-specific widgets; the main difference is that authors can insert additional components within the composite body

### Field Properties

- **Label**: Display label for the composite field
- **Name**: Field name (used in payload)
- **Type**: Field variant ("field" for object, "list" for array)
- **Read-only List**: Enable read-only mode for list variant (no add/remove controls)

## Client-Side Behavior

### Value Compilation

The composite component automatically compiles all child field values into a JSON structure:

1. **Field Variant**: Collects all immediate child inputs and nested composite values, merging them into a single object
2. **List Variant**: Collects values from each row, creating an array of objects

### Functions (`functions.js`)

Key functions:

- `compositeVal()`: Recursively collects child values into JSON structure
- `compileValue()`: Compiles template field values into hidden input field
- `setValue()`: Sets values on composite fields (used for form pre-population)
- `addRow()`: Adds new row to list variant
- `addNewItem()`: Handles `ADD_ITEM` and `ADDONCE_ITEM` events

### Behavior (`behaviour.js`)

Event handlers:

- **Add Row**: Adds new row to list
- **Delete Row**: Removes row (moves to trash if existing)
- **Sort Rows**: Drag-and-drop reordering via Sortable.js
- **Move Controls**: Up/down/top/bottom buttons for row positioning
- **Change Events**: Automatically recompiles values when child inputs change

### Selectors

- `[isCompositeParent]`: Main composite container
- `[isCompositeValue]`: Hidden input field storing JSON
- `[isCompositeInput]`: Child input fields (not processed by form submit)
- `[isInput]`: Regular form inputs (removed from composite inputs)

## Flow & Client Integration

### Flow API Integration

Flow metadata is inherited from the parent form container. When Flow API is enabled, composite values are included automatically in the payload sent to FlowStream:

- Composite field values are serialized as JSON
- Nested composites are included recursively
- List composites are serialized as arrays

### Form Submission

- Composite fields appear as single fields in form payload
- Values are stored as JSON strings in hidden input
- Child inputs are marked with `isCompositeInput` to prevent duplicate submission
- Form validation treats composite as single field

## Publish Capability

### Structured JSON Publishing

The composite field enables **structured, nested JSON publishing** for forms, transforming flat key-value pairs into hierarchical, publish-ready data structures that can be directly consumed by external systems without transformation.

### Key Benefits

#### 1. Structured Data Instead of Flat Key-Value Pairs

**Without Composite Fields** (flat structure):
```json
{
  "street": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "contact1_name": "John",
  "contact1_email": "john@example.com",
  "contact2_name": "Jane",
  "contact2_email": "jane@example.com"
}
```

**With Composite Fields** (structured hierarchy):
```json
{
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701"
  },
  "contacts": [
    {"name": "John", "email": "john@example.com"},
    {"name": "Jane", "email": "jane@example.com"}
  ]
}
```

#### 2. Publish-Ready Structures

- **Single Field, Complex Data**: The composite appears as one field in the form payload but contains a complete nested structure (object or array)
- **No Client-Side Transformation**: Data is already in the correct format for downstream consumption
- **Direct API Consumption**: Structured JSON can be directly consumed by REST APIs, FlowStream, or other external systems without transformation

#### 3. Domain-Specific Formats

Enables authoring domain-specific structures (like STIX objects for security intelligence) without custom transformation code:

- **STIX Objects**: Complex security intelligence structures
- **Business Objects**: Custom business entity structures
- **Nested Forms**: Complex hierarchical data without flattening

#### 4. Automatic Flow Integration

When Flow API is enabled:

- Composite values are automatically included in FlowStream payloads
- Structure is preserved through the entire Flow pipeline
- Supports complex nested structures automatically

#### 5. Publish Pipeline Integration

In the form's `getFormData()` function, composite fields are processed as follows:

```javascript
// Composite field compiles all child inputs into structured JSON
let compositeValue = $compositeValue.compositeVal(addFieldHint);
result[compositeValueName] = compositeValue;
```

The composite field:
- Compiles all child inputs into a structured JSON object/array
- Inserts it as a single key in the form payload
- Preserves nested structure for downstream consumption

#### 6. Example: Publishing to External API

**Without Composite** (needs transformation):
```javascript
// Manual transformation required before publishing
const transformedData = {
  ...formData,
  address: {
    street: formData.street,
    city: formData.city,
    state: formData.state,
    zip: formData.zip
  }
  // ... more manual transformation
};
publishToAPI(transformedData);
```

**With Composite** (direct publish):
```javascript
// Direct publish - already structured!
// formData.address already contains complete nested structure
publishToAPI(formData); // Ready to go!
```

### Real-World Use Cases

- **Address Blocks**: Single `address` object with nested fields (street, city, state, zip)
- **Contact Lists**: Single `contacts` array with multiple entries
- **STIX Objects**: Domain-specific structures (e.g., `kill_chain_phases`, `external_references`)
- **Nested Forms**: Complex hierarchical data without flattening
- **Business Entities**: Structured business objects ready for API consumption

### Summary

The composite field transforms forms from flat key-value pairs into **publish-ready structured JSON**, enabling:
- Direct consumption by external systems without transformation
- Domain-specific data structures without custom code
- Automatic Flow integration with structure preservation
- Single field representation of complex nested data

This capability is essential for integrating forms with modern APIs, microservices, and external systems that expect structured JSON payloads.

## Usage Patterns

### Field Variant: Address Block

```html
<typerefinery:composite name="address" label="Address" type="field">
  <typerefinery:input name="street" label="Street" />
  <typerefinery:input name="city" label="City" />
  <typerefinery:input name="state" label="State" />
  <typerefinery:input name="zip" label="ZIP Code" />
</typerefinery:composite>
```

**Output**:
```json
{
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701"
  }
}
```

### List Variant: Contact List

```html
<typerefinery:composite name="contacts" label="Contacts" type="list">
  <template class="content">
    <typerefinery:input name="name" label="Name" />
    <typerefinery:input name="email" label="Email" />
    <typerefinery:input name="phone" label="Phone" />
  </template>
</typerefinery:composite>
```

**Output**:
```json
{
  "contacts": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "id": "row-1"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "555-5678",
      "id": "row-2"
    }
  ]
}
```

## Event Handling

The composite component supports the following events:

### ADD_ITEM

Adds a new item to the composite (list variant).

**Event Data**:
```json
{
  "type": "composite",
  "action": "add_item",
  "config": "templateSelector",
  "id": "itemId"
}
```

**Usage**:
- `config`: CSS selector for template element
- `once`: Boolean to prevent duplicate additions

### ADDONCE_ITEM

Adds a new item only if it doesn't already exist.

**Event Data**: Same as `ADD_ITEM`

## Best Practices

### 1. Naming Conventions

- Use descriptive field names for composite containers
- Ensure child components have unique names within the composite
- Avoid name conflicts between nested composites

### 2. Field vs List Selection

- Use **field variant** for single grouped structures (address, contact info)
- Use **list variant** for repeating groups (multiple contacts, addresses)

### 3. Child Component Selection

- Only use form input components as children
- Avoid nesting too deeply (recommended max 2-3 levels)
- Use STIX components for domain-specific structures

### 4. Performance Considerations

- Limit list items to reasonable numbers (recommended max 50-100)
- Avoid very large nested structures
- Consider pagination for large lists

## Troubleshooting

### Values Not Compiling

**Possible Causes**:
- Child inputs not marked with `isCompositeInput` attribute
- Hidden input field missing or incorrectly configured
- JavaScript errors in compilation functions

**Solutions**:
1. Verify child inputs are form components
2. Check browser console for JavaScript errors
3. Verify composite structure is correct

### List Not Adding Rows

**Possible Causes**:
- Template not found or incorrectly configured
- JavaScript errors in behavior.js
- Missing Sortable.js library

**Solutions**:
1. Verify `.content` template exists in list variant
2. Check browser console for errors
3. Verify Sortable.js is loaded

### Payload Structure Incorrect

**Possible Causes**:
- Incorrect field names
- Nested composites not properly configured
- List variant not properly set

**Solutions**:
1. Verify field names are unique and valid
2. Check nested composite configurations
3. Verify `inputType` is set correctly ("field" or "list")

## Related Components

- **Field Container**: `typerefinery/components/forms/field` - Base field component
- **Form Container**: `typerefinery/components/forms/form` - Parent form component
- **Input Fields**: `typerefinery/components/forms/input`, `select`, `textarea`, etc.
- **STIX Components**: `typerefinery/components/stix/forms/...` - Domain-specific structures

## Key Files

- **Component Definition**: `/apps/typerefinery/components/forms/composite/.content.json`
- **Default Template**: `/apps/typerefinery/components/forms/composite/template/.content.json`
- **Rendering Stub**: `/apps/typerefinery/components/forms/composite/composite.html`
- **Field Component**: `/apps/typerefinery/components/forms/fields/composite/`
- **Sling Model**: `ai.typerefinery.websight.models.components.forms.Composite`
- **Client Libraries**: `/apps/typerefinery/components/forms/fields/composite/clientlibs/`

## References

- **Base Field Container**: `docs/forms/field.md`
- **Form Container**: `docs/forms/form.md` (if exists)
- **Component README**: `/apps/typerefinery/components/forms/composite/README.md`
