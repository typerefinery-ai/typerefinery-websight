# Input Field

## Overview

**Component**: `typerefinery/components/forms/input`

**Description**: Generic text-style input supporting various HTML input types (text, number, date, email, password, etc.) with validation and input masking support.

**Inheritance**: Extends `typerefinery/components/forms/field` via `sling:resourceSuperType`, inheriting the shared field container, dialog fragments, and Flow metadata conventions.

**Location**: `/apps/typerefinery/components/forms/input/`

## Resource Type

```
typerefinery/components/forms/input
```

## Features

- **Multiple Input Types**: Supports all HTML5 input types (text, number, date, email, password, tel, url, etc.)
- **Input Masking**: Supports input masking for formatted input (phone numbers, dates, etc.)
- **Validation**: Required field validation and HTML5 validation
- **Placeholder Support**: Placeholder text for user guidance
- **Event Support**: Supports `INPUT_CHANGE` event
- **Flow Integration**: Automatically included in form payloads
- **Bootstrap Styling**: Uses `form-control` class for consistent styling

## Component Structure

```
/apps/typerefinery/components/forms/input/
├── .content.json              # Component definition (extends field)
├── input.html                 # Rendering stub (uses Field model)
├── template/
│   └── .content.json          # Default template structure
└── dialog/                    # Inherits dialog from parent field
```

### Field Component

```
/apps/typerefinery/components/forms/fields/input/
├── input.html                 # Field rendering (uses Input model)
├── variant.html               # Input element template
├── clientlibs/
│   ├── functions.js           # Event handling
│   └── behaviour.js           # DOM initialization
└── dialog/
    └── .content.json          # Field dialog configuration
```

## Sling Model

**Class**: `ai.typerefinery.websight.models.components.forms.Input`

**Inheritance**: Extends `BaseFormComponent`

**Key Properties**:
- `inputType`: HTML input type (text, number, date, email, etc.)
- `validationRequired`: Boolean flag for required field validation
- `validationInputMask`: Input mask pattern for formatted input
- Inherits all properties from `BaseFormComponent`

**Default Values**:
- `id`: `"input"`
- `module`: `"input"`
- `label`: `"Full Name"`
- `placeholder`: `"Type here."`
- `inputType`: `"text"`
- `validationRequired`: `false`

**CSS Classes**:
- `form-control`: Bootstrap form control styling
- `mt-1`: Margin top spacing

## Structure & Rendering

### Default Template Structure

Default structure (`template/.content.json`) follows the standard field pattern:

```json
{
  "label": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/label",
    "label": "Input Label"
  },
  "field": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/input",
    "label": "Input"
  }
}
```

### Rendering Flow

1. **Container Component** (`input.html`):
   - Adapts `Field` Sling Model (inherits from base field)
   - Renders variant template ensuring label/field IDs remain synchronized

2. **Field Component** (`fields/input/input.html`):
   - Adapts `Input` Sling Model
   - Wraps variant template in component container

3. **Variant Template** (`variant.html`):
   - Renders `<input>` element with appropriate type
   - Sets `isInput="true"` attribute for form data collection
   - Includes input masking support via `data-inputmask` attribute
   - Special handling for hidden inputs (shows as text in edit mode)

## Authoring Dialog

The input component inherits the shared dialog from the base field:

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
| `inputType` | String | No | HTML input type (text, number, date, email, password, tel, url, etc.) |
| `label` | String | No | Display label for the input field (default: "Full Name") |
| `value` | String | No | Default/pre-filled value |
| `placeholder` | String | No | Placeholder text (default: "Type here.") |
| `required` | Boolean | No | Whether field is required (default: `false`) |
| `disabled` | Boolean | No | Whether field is disabled (default: `false`) |
| `validationInputMask` | String | No | Input mask pattern for formatted input (e.g., phone numbers, dates) |

## Supported Input Types

The input component supports all standard HTML5 input types:

| Type | Description | Use Case |
|------|-------------|----------|
| `text` | Single-line text input (default) | Names, addresses, general text |
| `email` | Email address input | Email addresses with validation |
| `password` | Password input (masked) | Password fields |
| `number` | Numeric input | Numbers, quantities |
| `tel` | Telephone number input | Phone numbers |
| `url` | URL input | Web addresses |
| `date` | Date picker | Dates |
| `time` | Time picker | Times |
| `datetime-local` | Date and time picker | Date and time |
| `month` | Month picker | Months |
| `week` | Week picker | Weeks |
| `color` | Color picker | Color selection |
| `range` | Range slider | Numeric ranges |
| `hidden` | Hidden input | Hidden form data (shown as text in edit mode) |

## Usage Patterns

### Text Input

Basic text input field:

```html
<typerefinery:input name="fullName" label="Full Name" placeholder="Enter your full name" />
```

**Output**:
```json
{
  "fullName": "John Doe"
}
```

### Email Input

Email input with validation:

```html
<typerefinery:input name="email" label="Email Address" inputType="email" placeholder="your@email.com" required="true" />
```

**Output**:
```json
{
  "email": "john@example.com"
}
```

### Number Input

Numeric input field:

```html
<typerefinery:input name="age" label="Age" inputType="number" placeholder="Enter your age" />
```

**Output**:
```json
{
  "age": "25"
}
```

### Date Input

Date picker input:

```html
<typerefinery:input name="birthDate" label="Date of Birth" inputType="date" />
```

**Output**:
```json
{
  "birthDate": "1990-01-15"
}
```

### Input with Masking

Input with format masking (phone number example):

```html
<typerefinery:input name="phone" label="Phone Number" inputType="tel" validationInputMask="(999) 999-9999" placeholder="(555) 123-4567" />
```

**Output**:
```json
{
  "phone": "(555) 123-4567"
}
```

### Password Input

Password field with masking:

```html
<typerefinery:input name="password" label="Password" inputType="password" placeholder="Enter password" required="true" />
```

**Output**:
```json
{
  "password": "********"
}
```

## Input Masking

The input component supports input masking for formatted input via the `validationInputMask` property.

### Mask Pattern Syntax

Common mask patterns:

| Pattern | Example | Description |
|---------|---------|-------------|
| `(999) 999-9999` | Phone number | 9 = digit |
| `99/99/9999` | Date | 9 = digit |
| `999-999-9999` | SSN | 9 = digit |
| `aaa-9999` | License plate | a = letter, 9 = digit |

### Mask Characters

- `9`: Digit (0-9)
- `a`: Letter (a-z, A-Z)
- `*`: Alphanumeric (a-z, A-Z, 0-9)

## Client-Side Behavior

### Event Support

The input component supports the following events:

#### INPUT_CHANGE

Fired when the input value changes.

**Event Data**:
```javascript
{
  type: "INPUT_CHANGE",
  value: "new value",
  inputType: "text",
  id: "input-id",
  action: "INPUT_CHANGE"
}
```

### Event Configuration

Configure events in the dialog's **Events** tab:

```json
{
  "events": [
    {
      "topic": "form-input",
      "type": "emit",
      "name": "INPUT_CHANGE",
      "action": "INPUT_CHANGE"
    }
  ]
}
```

## Flow Integration

### Automatic Inclusion

When Flow API is enabled:

- Input values are automatically included in form payloads
- Values are serialized as strings
- Flow metadata is inherited from parent form container
- Empty values are included in payloads

### Payload Structure

**Single Input**:
```json
{
  "fullName": "John Doe"
}
```

**Multiple Inputs**:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567"
}
```

## Bootstrap Styling

The input component uses Bootstrap form-control classes:

### Input Classes

- `form-control`: Bootstrap form control styling
- `mt-1`: Margin top spacing

### HTML Structure

```html
<div class="form-group">
  <label for="input-id">Full Name</label>
  <input type="text" class="form-control mt-1" id="input-id" name="fullName" placeholder="Type here." />
</div>
```

## Special Features

### Hidden Input Handling

Hidden inputs are shown as text inputs in edit mode (WCM mode):

```html
<!-- In WCM edit mode: shown as text -->
<!-- In publish mode: hidden -->
<input type="hidden" ... />
```

This allows authors to see and edit hidden field values during authoring.

### Input Masking Integration

Input masking is applied via the `data-inputmask` attribute:

```html
<input data-inputmask=" 'mask' : '(999) 999-9999'" ... />
```

The mask is processed by inputmask library (if loaded).

## Best Practices

### 1. Input Type Selection

- Use appropriate input types for validation (email, number, date, etc.)
- Use `text` for general text input
- Use `password` for sensitive data

### 2. Placeholder Text

- Provide helpful placeholder text
- Keep placeholders concise and descriptive
- Use placeholder to show expected format

### 3. Required Fields

- Mark required fields with `required="true"`
- Use appropriate validation for required fields
- Provide clear labels for required fields

### 4. Input Masking

- Use input masking for formatted input (phone, date, etc.)
- Test masks with various inputs
- Ensure mask patterns match expected format

### 5. Accessibility

- Always provide labels for inputs
- Use appropriate input types for screen readers
- Ensure placeholder text doesn't replace labels

## Troubleshooting

### Input Not Appearing in Form Data

**Possible Causes**:
- Missing `name` attribute
- Input not inside form container
- Input disabled

**Solutions**:
1. Verify `name` attribute is set
2. Check that input is inside form component
3. Verify input is not disabled
4. Check browser console for form data collection errors

### Input Masking Not Working

**Possible Causes**:
- Inputmask library not loaded
- Incorrect mask pattern
- Mask syntax error

**Solutions**:
1. Verify inputmask library is loaded
2. Check mask pattern syntax
3. Test mask pattern with sample input
4. Check browser console for JavaScript errors

### Validation Not Working

**Possible Causes**:
- Incorrect input type
- HTML5 validation disabled
- Missing required attribute

**Solutions**:
1. Verify input type is correct (email, number, etc.)
2. Check that HTML5 validation is enabled
3. Verify `required` attribute is set for required fields
4. Test validation in browser

## Related Components

- **Field Container**: `typerefinery/components/forms/field` - Base field component
- **Textarea Field**: `typerefinery/components/forms/textarea` - Multi-line text input
- **Select Field**: `typerefinery/components/forms/select` - Dropdown selection
- **Form Container**: `typerefinery/components/forms/form` - Parent form component

## Key Files

- **Component Definition**: `/apps/typerefinery/components/forms/input/.content.json`
- **Default Template**: `/apps/typerefinery/components/forms/input/template/.content.json`
- **Rendering Stub**: `/apps/typerefinery/components/forms/input/input.html`
- **Field Component**: `/apps/typerefinery/components/forms/fields/input/`
- **Sling Model**: `ai.typerefinery.websight.models.components.forms.Input`
- **Client Libraries**: `/apps/typerefinery/components/forms/fields/input/clientlibs/`

## References

- **Base Field Container**: `docs/forms/field.md`
- **Form Container**: `docs/forms/form.md` (if exists)
- **Component README**: `/apps/typerefinery/components/forms/input/README.md`
- **HTML5 Input Types**: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
- **Bootstrap Form Controls**: https://getbootstrap.com/docs/5.3/forms/form-control/

