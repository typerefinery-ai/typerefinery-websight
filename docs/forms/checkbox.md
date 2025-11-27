# Checkbox Field

## Overview

**Component**: `typerefinery/components/forms/checkbox`

**Description**: Boolean form control rendered with Bootstrap's `form-check` classes. Supports single and multiple checkbox selection patterns for Flow-enabled forms.

**Inheritance**: Extends `typerefinery/components/forms/field` via `sling:resourceSuperType`, inheriting the shared field container, dialog fragments, and Flow metadata conventions.

**Location**: `/apps/typerefinery/components/forms/checkbox/`

## Resource Type

```
typerefinery/components/forms/checkbox
```

## Features

- **Single Checkbox**: Boolean true/false selection
- **Multiple Checkboxes**: Array of selected values (multiple checkboxes with same name)
- **Bootstrap Styling**: Uses `form-check` and `form-check-input` classes
- **Event Support**: Supports `CHECKBOX_CHANGE` and `CHECKBOX_CLICK` events
- **Flow Integration**: Automatically included in form payloads
- **Value Handling**: Returns empty array if no checkboxes checked, array of values if multiple checked

## Component Structure

```
/apps/typerefinery/components/forms/checkbox/
├── .content.json              # Component definition (extends field)
├── checkbox.html              # Rendering stub (uses CheckboxField model)
├── template/
│   └── .content.json          # Default template structure
└── dialog/                    # Inherits dialog from parent field
```

### Field Component

```
/apps/typerefinery/components/forms/fields/checkbox/
├── checkbox.html              # Field rendering (uses Checkbox model)
├── variant.html               # Checkbox input template
├── clientlibs/
│   ├── functions.js           # Value get/set and event handling
│   ├── behaviour.js           # DOM initialization
│   └── style.css              # Component styling
└── dialog/
    └── .content.json          # Field dialog configuration
```

## Sling Models

### Container Component (`CheckboxField`)

**Class**: `ai.typerefinery.websight.models.components.forms.CheckboxField`

**Inheritance**: Extends `Field`

**Key Properties**:
- `module`: Set to `"field"` for client bootstrapping
- `grid`: Adds `form-check` class for Bootstrap styling
- Inherits all properties from `Field` model

**Default Values**:
- `id`: `"field"`
- `module`: `"field"`

### Field Component (`Checkbox`)

**Class**: `ai.typerefinery.websight.models.components.forms.Checkbox`

**Inheritance**: Extends `BaseFormComponent`

**Key Properties**:
- `module`: Set to `"checkbox"` for client bootstrapping
- `style`: Adds `form-check-input` class for Bootstrap styling
- Inherits all properties from `BaseFormComponent`

**Default Values**:
- `id`: `"checkbox"`
- `module`: `"checkbox"`

## Structure & Rendering

### Default Template Structure

Default structure (`template/.content.json`) follows the standard field pattern:

```json
{
  "label": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/label",
    "label": "Checkbox Label"
  },
  "field": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/checkbox",
    "label": "Checkbox"
  }
}
```

### Rendering Flow

1. **Container Component** (`checkbox.html`):
   - Adapts `CheckboxField` Sling Model (inherits from `Field`)
   - Renders variant template ensuring label/field IDs remain synchronized

2. **Field Component** (`fields/checkbox/checkbox.html`):
   - Adapts `Checkbox` Sling Model
   - Renders variant template with checkbox input

3. **Variant Template** (`variant.html`):
   - Renders `<input type="checkbox">` with Bootstrap classes
   - Sets `isInput="true"` attribute for form data collection
   - Includes all standard field attributes (name, value, required, disabled)

## Authoring Dialog

The checkbox component inherits the shared dialog from the base field:

- **General** fragment (`forms/form/common/.content.json`) supplies:
  - Label
  - Title
  - Name (field name for form submission)
  - Value (checkbox value when checked)
  - Default Value
  - Placeholder
- **Style**, **Grid**, **Alignment** tabs via common includes
- **Events** tab for event configuration (if enabled)
- Flow metadata configured on parent form container

### Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Field name (used for form submission, same name for multiple checkboxes creates array) |
| `value` | String | Yes | Value stored when checkbox is checked |
| `label` | String | No | Display label for the checkbox |
| `required` | Boolean | No | Whether checkbox is required (default: `false`) |
| `disabled` | Boolean | No | Whether checkbox is disabled (default: `false`) |
| `defaultvalue` | String | No | Default checked value |

## Usage Patterns

### Single Checkbox (Boolean)

Single checkbox for boolean true/false selection:

```html
<typerefinery:checkbox name="agree" label="I agree to the terms" value="yes" />
```

**Output**:
```json
{
  "agree": ["yes"]  // Array with one value if checked
}
// Or empty array if not checked: { "agree": [] }
```

### Multiple Checkboxes (Array)

Multiple checkboxes with the same `name` create an array of selected values:

```html
<typerefinery:checkbox name="interests" label="Sports" value="sports" />
<typerefinery:checkbox name="interests" label="Music" value="music" />
<typerefinery:checkbox name="interests" label="Reading" value="reading" />
```

**Output** (if "Sports" and "Music" are checked):
```json
{
  "interests": ["sports", "music"]
}
```

**Output** (if none checked):
```json
{
  "interests": []
}
```

### Required Checkbox

Single checkbox that must be checked:

```html
<typerefinery:checkbox name="terms" label="I accept the terms and conditions" value="accepted" required="true" />
```

## Client-Side Behavior

### Value Handling

The checkbox component provides specialized value handling:

#### `getValue(name)`

Retrieves array of checked values for checkboxes with the given name:

```javascript
// Returns array of checked values, or empty array if none checked
const values = Typerefinery.Components.Forms.Checkbox.getValue("interests");
// Example: ["sports", "music"] or []
```

#### `setValue(name, value)`

Sets checkbox values programmatically:

```javascript
// Set single value
Typerefinery.Components.Forms.Checkbox.setValue("agree", "yes");

// Set multiple values (array)
Typerefinery.Components.Forms.Checkbox.setValue("interests", ["sports", "music"]);
```

#### `setChoiceByValue(name, value)`

Checks a specific checkbox by value:

```javascript
Typerefinery.Components.Forms.Checkbox.setChoiceByValue("interests", "sports");
```

### Form Integration

In the form's `getFormData()` function, checkboxes are processed as follows:

```javascript
if (type === "checkbox") {
    // Get value from checkbox if checked
    if ($input.is(":checked")) {
        if (!result[name]) {
            result[name] = [];
        }
        result[name].push($input.val());
    }
}
```

**Key Behavior**:
- Checkboxes with the same `name` are collected into an array
- Only checked checkboxes are included in the array
- If no checkboxes are checked, the array is empty `[]`
- Each checkbox's `value` is pushed into the array

## Event Support

The checkbox component supports the following events:

### CHECKBOX_CHANGE

Fired when any checkbox with the same name changes state.

**Event Data**:
```javascript
{
  type: "CHECKBOX_CHANGE",
  name: "interests",
  value: ["sports", "music"],
  component: "checkbox-id"
}
```

### CHECKBOX_CLICK

Fired when a specific checkbox is clicked.

**Event Data**:
```javascript
{
  type: "CHECKBOX_CLICK",
  name: "interests",
  value: "sports",
  checked: true,
  component: "checkbox-id"
}
```

### Event Configuration

Configure events in the dialog's **Events** tab:

```json
{
  "events": [
    {
      "topic": "form-interests",
      "type": "emit",
      "name": "CHECKBOX_CHANGE",
      "action": "CHECKBOX_CHANGE"
    }
  ]
}
```

## Flow Integration

### Automatic Inclusion

When Flow API is enabled:

- Checkbox values are automatically included in form payloads
- Multiple checkbox values are serialized as arrays
- Empty arrays are included for unchecked checkbox groups
- Flow metadata is inherited from parent form container

### Payload Structure

**Single Checkbox**:
```json
{
  "agree": ["yes"]
}
```

**Multiple Checkboxes**:
```json
{
  "interests": ["sports", "music", "reading"]
}
```

**Mixed with Other Fields**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "agree": ["yes"],
  "interests": ["sports", "music"]
}
```

## Bootstrap Styling

The checkbox component uses Bootstrap form-check classes:

### Container Classes

- `form-check`: Applied to the container (from `CheckboxField` model)

### Input Classes

- `form-check-input`: Applied to the checkbox input (from `Checkbox` model)

### HTML Structure

```html
<div class="form-check">
  <input type="checkbox" class="form-check-input" id="checkbox-id" name="interests" value="sports" />
  <label class="form-check-label" for="checkbox-id">Sports</label>
</div>
```

## Best Practices

### 1. Naming Conventions

- Use descriptive names for checkbox groups (e.g., `interests`, `permissions`)
- Use meaningful values for checkbox options (e.g., `"sports"` not `"1"`)
- Keep checkbox group names consistent across multiple checkboxes

### 2. Single vs Multiple

- **Single Checkbox**: Use for boolean agreements, toggles, opt-ins
- **Multiple Checkboxes**: Use for multi-select options, categories, permissions

### 3. Value Handling

- Always expect arrays in form submission (even for single checkbox)
- Handle empty arrays for unchecked checkbox groups
- Use array methods (`.includes()`, `.length`) when processing checkbox values

### 4. Accessibility

- Always provide labels for checkboxes
- Use `required` attribute for mandatory checkboxes
- Ensure label/input ID synchronization (handled automatically by field container)

## Troubleshooting

### Checkboxes Not Appearing in Form Data

**Possible Causes**:
- Checkboxes not checked (empty array is returned)
- Incorrect `name` attribute
- Checkboxes not inside form container

**Solutions**:
1. Verify checkbox `name` attribute is set
2. Check that checkboxes are inside form component
3. Verify checkboxes are actually checked
4. Check browser console for form data collection errors

### Multiple Checkboxes Not Creating Array

**Possible Causes**:
- Checkboxes have different `name` values
- Form data collection logic not working

**Solutions**:
1. Ensure all checkboxes in group have the same `name`
2. Verify form's `getFormData()` function is working
3. Check browser console for JavaScript errors

### Events Not Firing

**Possible Causes**:
- Event configuration incorrect
- Event listeners not registered
- Component not initialized

**Solutions**:
1. Verify event configuration in dialog
2. Check that component is initialized (check browser console)
3. Verify event names match exactly (`CHECKBOX_CHANGE`, `CHECKBOX_CLICK`)

## Related Components

- **Field Container**: `typerefinery/components/forms/field` - Base field component
- **Radio Field**: `typerefinery/components/forms/radio` - Single selection alternative
- **Select Field**: `typerefinery/components/forms/select` - Dropdown selection
- **Form Container**: `typerefinery/components/forms/form` - Parent form component

## Key Files

- **Component Definition**: `/apps/typerefinery/components/forms/checkbox/.content.json`
- **Default Template**: `/apps/typerefinery/components/forms/checkbox/template/.content.json`
- **Rendering Stub**: `/apps/typerefinery/components/forms/checkbox/checkbox.html`
- **Field Component**: `/apps/typerefinery/components/forms/fields/checkbox/`
- **Sling Models**: 
  - `ai.typerefinery.websight.models.components.forms.CheckboxField`
  - `ai.typerefinery.websight.models.components.forms.Checkbox`
- **Client Libraries**: `/apps/typerefinery/components/forms/fields/checkbox/clientlibs/`

## References

- **Base Field Container**: `docs/forms/field.md`
- **Form Container**: `docs/forms/form.md` (if exists)
- **Component README**: `/apps/typerefinery/components/forms/checkbox/README.md`
- **Bootstrap Form Check**: https://getbootstrap.com/docs/5.3/forms/checks-radios/

