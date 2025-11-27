# Textarea Field

## Overview

**Component**: `typerefinery/components/forms/textarea`

**Description**: Multi-line text input field for longer text content such as comments, descriptions, notes, and messages. Supports configurable rows and columns for size control.

**Inheritance**: Extends `typerefinery/components/forms/field` via `sling:resourceSuperType`, inheriting the shared field container, dialog fragments, and Flow metadata conventions.

**Location**: `/apps/typerefinery/components/forms/textarea/`

## Resource Type

```
typerefinery/components/forms/textarea
```

## Features

- **Multi-Line Input**: Supports multiple lines of text input
- **Configurable Size**: Customizable rows and columns for size control
- **Validation**: Required field validation
- **Placeholder Support**: Placeholder text for user guidance
- **Event Support**: Supports `TEXTAREA_CHANGE` event
- **Flow Integration**: Automatically included in form payloads
- **Bootstrap Styling**: Uses `form-control` class for consistent styling

## Component Structure

```
/apps/typerefinery/components/forms/textarea/
├── .content.json              # Component definition (extends field)
├── textarea.html              # Rendering stub (uses Field model)
├── template/
│   └── .content.json          # Default template structure
└── dialog/                    # Inherits dialog from parent field
```

### Field Component

```
/apps/typerefinery/components/forms/fields/textarea/
├── textarea.html              # Field rendering (uses Textarea model)
├── variant.html               # Textarea element template
├── clientlibs/
│   ├── functions.js           # Event handling
│   ├── behaviour.js           # DOM initialization
│   └── style.css              # Component styling
└── dialog/
    └── .content.json          # Field dialog configuration
```

## Sling Model

**Class**: `ai.typerefinery.websight.models.components.forms.Textarea`

**Inheritance**: Extends `BaseFormComponent`

**Key Properties**:
- `numOfRows`: Number of visible rows (height control)
- `numOfCols`: Number of visible columns (width control)
- `validationRequired`: Boolean flag for required field validation
- Inherits all properties from `BaseFormComponent`

**Default Values**:
- `id`: `"textare"` (note: typo in default, should be "textarea")
- `module`: `"textare"` (note: typo in default)
- `label`: `"Full Name"` (default, should be customized)
- `placeholder`: `"Type here."`
- `validationRequired`: `false`

**CSS Classes**:
- `form-control`: Bootstrap form control styling

## Structure & Rendering

### Default Template Structure

Default structure (`template/.content.json`) follows the standard field pattern:

```json
{
  "label": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/label",
    "label": "Textarea Label"
  },
  "field": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/textarea",
    "label": "Textarea"
  }
}
```

### Rendering Flow

1. **Container Component** (`textarea.html`):
   - Adapts `Field` Sling Model (inherits from base field)
   - Renders variant template ensuring label/field IDs remain synchronized

2. **Field Component** (`fields/textarea/textarea.html`):
   - Adapts `Textarea` Sling Model
   - Wraps variant template in component container

3. **Variant Template** (`variant.html`):
   - Renders `<textarea>` element with configurable rows and columns
   - Sets `isInput="true"` attribute for form data collection
   - Includes all standard field attributes (name, value, placeholder, required, disabled)

## Authoring Dialog

The textarea component inherits the shared dialog from the base field:

- **General** fragment (`forms/form/common/.content.json`) supplies:
  - Label
  - Title
  - Name (field name for form submission)
  - Value (default/pre-filled value)
  - Default Value
  - Placeholder
- **Style**, **Grid**, **Alignment** tabs via common includes
- **Events** tab for event configuration (if enabled)
- Flow metadata configured on parent form container

### Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Field name (used for form submission) |
| `label` | String | No | Display label for the textarea field (default: "Full Name") |
| `value` | String | No | Default/pre-filled value |
| `placeholder` | String | No | Placeholder text (default: "Type here.") |
| `numOfRows` | String | No | Number of visible rows (height control) |
| `numOfCols` | String | No | Number of visible columns (width control) |
| `required` | Boolean | No | Whether field is required (default: `false`) |
| `disabled` | Boolean | No | Whether field is disabled (default: `false`) |

## Usage Patterns

### Basic Textarea

Basic multi-line text input:

```html
<typerefinery:textarea name="comments" label="Comments" placeholder="Enter your comments here..." />
```

**Output**:
```json
{
  "comments": "This is a multi-line comment.\nIt can span multiple lines."
}
```

### Sized Textarea

Textarea with specific dimensions:

```html
<typerefinery:textarea name="description" label="Description" 
  numOfRows="5" 
  numOfCols="50" 
  placeholder="Enter description (5 lines, 50 columns)..." />
```

**Output**:
```json
{
  "description": "Product description text..."
}
```

### Required Textarea

Required multi-line text input:

```html
<typerefinery:textarea name="message" label="Message" 
  required="true" 
  placeholder="Your message (required)" />
```

**Output**:
```json
{
  "message": "Required message content"
}
```

### Pre-filled Textarea

Textarea with default value:

```html
<typerefinery:textarea name="notes" label="Notes" 
  value="Default notes content..." />
```

## Client-Side Behavior

### Event Support

The textarea component supports the following events:

#### TEXTAREA_CHANGE

Fired when the textarea value changes.

**Event Data**:
```javascript
{
  type: "TEXTAREA_CHANGE",
  value: "new text content",
  id: "textarea-id",
  action: "TEXTAREA_CHANGE"
}
```

### Event Configuration

Configure events in the dialog's **Events** tab:

```json
{
  "events": [
    {
      "topic": "form-textarea",
      "type": "emit",
      "name": "TEXTAREA_CHANGE",
      "action": "TEXTAREA_CHANGE"
    }
  ]
}
```

### Form Integration

In the form's `getFormData()` function, textarea fields are processed like standard inputs:

```javascript
// Textarea is processed as standard input
result[name] = $input.val();
```

**Key Behavior**:
- Values are serialized as strings
- Multi-line text includes newline characters (`\n`)
- Empty textareas return empty strings

## Flow Integration

### Automatic Inclusion

When Flow API is enabled:

- Textarea values are automatically included in form payloads
- Values are serialized as strings with newline characters preserved
- Flow metadata is inherited from parent form container
- Empty textareas are included as empty strings

### Payload Structure

**Single Textarea**:
```json
{
  "comments": "First line of comment.\nSecond line of comment."
}
```

**Multiple Fields**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "comments": "Multi-line comment\nwith newlines preserved"
}
```

## Bootstrap Styling

The textarea component uses Bootstrap form-control classes:

### Input Classes

- `form-control`: Bootstrap form control styling

### HTML Structure

```html
<div class="form-group">
  <label for="textarea-id">Comments</label>
  <textarea class="form-control" id="textarea-id" name="comments" 
    rows="5" cols="50" 
    placeholder="Enter your comments here...">
  </textarea>
</div>
```

## Size Configuration

### Rows (Height)

The `numOfRows` property controls the visible height of the textarea:

- Default: Browser default (typically 2-3 rows)
- Recommended: 3-10 rows for most use cases
- Large content: 10-20 rows for longer text

### Columns (Width)

The `numOfCols` property controls the visible width of the textarea:

- Default: Browser default (typically 20 columns)
- Recommended: 50-80 columns for most use cases
- Note: Modern CSS often overrides column width with responsive layouts

### Best Practices for Sizing

- Use CSS for responsive width control instead of columns
- Set rows based on expected content length
- Allow textarea to resize if needed (consider CSS `resize` property)

## Multi-Line Text Handling

### Newline Preservation

Textarea values preserve newline characters:

```javascript
// User input:
"Line 1
Line 2
Line 3"

// Form payload:
{
  "content": "Line 1\nLine 2\nLine 3"
}
```

### Display Considerations

- Newlines are preserved in form submission
- Display may need special handling (e.g., `white-space: pre-wrap` in CSS)
- JSON serialization preserves `\n` characters

## Comparison with Input Field

| Feature | Input | Textarea |
|---------|-------|----------|
| **Lines** | Single line | Multiple lines |
| **Height** | Fixed (single line) | Configurable (rows) |
| **Use Case** | Short text | Longer text content |
| **Newlines** | Not supported | Supported (`\n`) |
| **Display** | Single line | Multi-line box |

## Best Practices

### 1. Size Selection

- Use appropriate row count for expected content
- Don't rely on columns for width (use CSS instead)
- Allow users to resize if needed

### 2. Placeholder Text

- Provide helpful placeholder text
- Keep placeholders concise and descriptive
- Show expected format or content type

### 3. Required Fields

- Mark required textareas with `required="true"`
- Provide clear labels for required fields
- Validate required fields appropriately

### 4. Content Type

- Use textarea for longer text (comments, descriptions, notes)
- Use input for short text (names, emails, addresses)
- Consider character limits for very long content

### 5. Accessibility

- Always provide labels for textareas
- Use appropriate placeholder text
- Ensure textarea is keyboard accessible

## Troubleshooting

### Textarea Not Appearing in Form Data

**Possible Causes**:
- Missing `name` attribute
- Textarea not inside form container
- Textarea disabled

**Solutions**:
1. Verify `name` attribute is set
2. Check that textarea is inside form component
3. Verify textarea is not disabled
4. Check browser console for form data collection errors

### Newlines Not Preserved

**Possible Causes**:
- Value processing removes newlines
- Display doesn't preserve newlines
- JSON serialization issues

**Solutions**:
1. Verify newlines are in form value (`\n` characters)
2. Use CSS `white-space: pre-wrap` for display
3. Check JSON serialization preserves newlines

### Size Not Working

**Possible Causes**:
- CSS overriding rows/cols attributes
- Responsive layout affecting size
- Browser default behavior

**Solutions**:
1. Check CSS styles for textarea
2. Verify `numOfRows` and `numOfCols` are set correctly
3. Test with inline styles if needed
4. Use CSS for width control instead of columns

## Related Components

- **Field Container**: `typerefinery/components/forms/field` - Base field component
- **Input Field**: `typerefinery/components/forms/input` - Single-line text input alternative
- **Editor Component**: Rich text editor alternative (if available)
- **Form Container**: `typerefinery/components/forms/form` - Parent form component

## Key Files

- **Component Definition**: `/apps/typerefinery/components/forms/textarea/.content.json`
- **Default Template**: `/apps/typerefinery/components/forms/textarea/template/.content.json`
- **Rendering Stub**: `/apps/typerefinery/components/forms/textarea/textarea.html`
- **Field Component**: `/apps/typerefinery/components/forms/fields/textarea/`
- **Sling Model**: `ai.typerefinery.websight.models.components.forms.Textarea`
- **Client Libraries**: `/apps/typerefinery/components/forms/fields/textarea/clientlibs/`

## References

- **Base Field Container**: `docs/forms/field.md`
- **Input Field**: `docs/forms/input.md`
- **Form Container**: `docs/forms/form.md` (if exists)
- **Component README**: `/apps/typerefinery/components/forms/textarea/README.md`
- **Bootstrap Form Control**: https://getbootstrap.com/docs/5.3/forms/form-control/


