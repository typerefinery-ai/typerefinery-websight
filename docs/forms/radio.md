# Radio Field

## Overview

**Component**: `typerefinery/components/forms/radio`

**Description**: Renders a set of mutually exclusive options using radio inputs. Only one option can be selected at a time within a radio group (same `name` attribute).

**Inheritance**: Extends `typerefinery/components/forms/field` via `sling:resourceSuperType`, inheriting the shared field container, dialog fragments, and Flow metadata conventions.

**Location**: `/apps/typerefinery/components/forms/radio/`

## Resource Type

```
typerefinery/components/forms/radio
```

## Features

- **Single Selection**: Only one option can be selected at a time within a radio group
- **Mutually Exclusive**: Radio buttons with the same `name` form a group
- **Bootstrap Styling**: Uses `form-check` and `form-check-input` classes
- **Flow Integration**: Automatically included in form payloads
- **Value Handling**: Returns single selected value (not array)

## Component Structure

```
/apps/typerefinery/components/forms/radio/
├── .content.json              # Component definition (extends field)
├── radio.html                 # Rendering stub (uses Field model)
├── template/
│   └── .content.json          # Default template structure
└── dialog/                    # Inherits dialog from parent field
```

### Field Component

```
/apps/typerefinery/components/forms/fields/radio/
├── radio.html                 # Field rendering (uses Radio model)
├── variant.html               # Radio input template
├── clientlibs/
│   ├── functions.js           # Value get/set and event handling
│   ├── behaviour.js           # DOM initialization
│   └── style.css              # Component styling
└── dialog/
    └── .content.json          # Field dialog configuration
```

## Sling Model

**Class**: `ai.typerefinery.websight.models.components.forms.Radio`

**Inheritance**: Extends `BaseFormComponent`

**Key Properties**:
- `module`: Set to `"radio"` for client bootstrapping
- `style`: Adds `form-check-input` class for Bootstrap styling
- Inherits all properties from `BaseFormComponent`

**Default Values**:
- `id`: `"radio"`
- `module`: `"radio"`
- `label`: `"Full Name"` (default, should be customized)
- `placeholder`: `"Type here."` (not used for radio)

**CSS Classes**:
- `form-check-input`: Bootstrap radio button styling

## Structure & Rendering

### Default Template Structure

Default structure (`template/.content.json`) follows the standard field pattern:

```json
{
  "label": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/label",
    "label": "Radio Label"
  },
  "field": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/radio",
    "label": "Radio"
  }
}
```

### Rendering Flow

1. **Container Component** (`radio.html`):
   - Adapts `Field` Sling Model (inherits from base field)
   - Renders variant template ensuring label/field IDs remain synchronized

2. **Field Component** (`fields/radio/radio.html`):
   - Adapts `Radio` Sling Model
   - Renders variant template with radio input

3. **Variant Template** (`variant.html`):
   - Renders `<input type="radio">` with Bootstrap classes
   - Sets `isInput="true"` attribute for form data collection
   - Includes all standard field attributes (name, value)

## Authoring Dialog

The radio component inherits the shared dialog from the base field:

- **General** fragment (`forms/form/common/.content.json`) supplies:
  - Label
  - Title
  - Name (field name for form submission - **must be same for all options in group**)
  - Value (radio option value)
  - Default Value (for checked state)
  - Placeholder (not typically used for radio)
- **Style**, **Grid**, **Alignment** tabs via common includes
- **Events** tab for event configuration (if enabled)
- Flow metadata configured on parent form container

### Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Field name (MUST be same for all options in radio group) |
| `value` | String | Yes | Value stored when this radio option is selected |
| `label` | String | No | Display label for this radio option |
| `defaultvalue` | String | No | Default checked value (matches `value` to pre-select) |
| `required` | Boolean | No | Whether radio group is required (default: `false`) |
| `disabled` | Boolean | No | Whether this radio option is disabled (default: `false`) |

## Usage Patterns

### Radio Group (Multiple Options)

Create a radio group by adding multiple radio components with the same `name`:

```html
<!-- Option 1 -->
<typerefinery:radio name="gender" label="Male" value="male" />

<!-- Option 2 -->
<typerefinery:radio name="gender" label="Female" value="female" />

<!-- Option 3 -->
<typerefinery:radio name="gender" label="Other" value="other" />
```

**Output** (if "Male" selected):
```json
{
  "gender": "male"
}
```

**Key Points**:
- All radio buttons must have the same `name` to form a group
- Only one option can be selected at a time
- Returns single value (not array)

### Radio Group with Default Selection

Pre-select an option using `defaultvalue`:

```html
<typerefinery:radio name="status" label="Active" value="active" defaultvalue="active" />
<typerefinery:radio name="status" label="Inactive" value="inactive" />
<typerefinery:radio name="status" label="Pending" value="pending" />
```

**Output** (default selection):
```json
{
  "status": "active"
}
```

### Required Radio Group

Make the radio group required:

```html
<typerefinery:radio name="terms" label="I accept the terms" value="accepted" required="true" />
<typerefinery:radio name="terms" label="I do not accept" value="declined" required="true" />
```

**Note**: Set `required="true"` on all options in the group for consistent behavior.

### Radio Group Structure

```
/radioGroup
├── option1 (typerefinery/components/forms/radio)
│   ├── name = "gender"
│   ├── value = "male"
│   └── label = "Male"
├── option2 (typerefinery/components/forms/radio)
│   ├── name = "gender"
│   ├── value = "female"
│   └── label = "Female"
└── option3 (typerefinery/components/forms/radio)
    ├── name = "gender"
    ├── value = "other"
    └── label = "Other"
```

## Client-Side Behavior

### Value Handling

The radio component provides specialized value handling:

#### `getValue(name)`

Retrieves the selected value for radio group with the given name:

```javascript
// Returns single selected value, or undefined if none selected
const value = Typerefinery.Components.Forms.Radio.getValue("gender");
// Example: "male" or undefined
```

#### `setValue(name, value)`

Sets the selected radio option programmatically:

```javascript
// Set selected value
Typerefinery.Components.Forms.Radio.setValue("gender", "female");
```

#### `setChoiceByValue(name, value)`

Selects a specific radio option by value:

```javascript
Typerefinery.Components.Forms.Radio.setChoiceByValue("gender", "male");
```

### Form Integration

In the form's `getFormData()` function, radio buttons are processed as follows:

```javascript
else if (type === "radio") {
    // Get value from radio if checked
    if ($input.is(":checked")) {
        result[name] = $input.val();
    }
}
```

**Key Behavior**:
- Only checked radio button is included in payload
- Returns single value (string), not array
- If no radio is checked, the field is not included in payload

## Event Support

The radio component supports events (similar to checkbox):

- **RADIO_CHANGE**: Fired when any radio with the same name changes state
- **RADIO_CLICK**: Fired when a specific radio is clicked

### Event Configuration

Configure events in the dialog's **Events** tab:

```json
{
  "events": [
    {
      "topic": "form-radio",
      "type": "emit",
      "name": "RADIO_CHANGE",
      "action": "RADIO_CHANGE"
    }
  ]
}
```

## Flow Integration

### Automatic Inclusion

When Flow API is enabled:

- Radio values are automatically included in form payloads
- Only selected value is serialized (single value, not array)
- Flow metadata is inherited from parent form container
- If no radio is selected, field is not included in payload

### Payload Structure

**Radio Group**:
```json
{
  "gender": "male"
}
```

**Multiple Radio Groups**:
```json
{
  "gender": "male",
  "status": "active",
  "terms": "accepted"
}
```

## Bootstrap Styling

The radio component uses Bootstrap form-check classes:

### Input Classes

- `form-check-input`: Bootstrap radio button styling

### HTML Structure

```html
<div class="form-check">
  <input type="radio" class="form-check-input" id="radio-id" name="gender" value="male" />
  <label class="form-check-label" for="radio-id">Male</label>
</div>
```

## Comparison with Checkbox

| Feature | Radio | Checkbox |
|---------|-------|----------|
| **Selection** | Single option | Multiple options |
| **Output** | Single value (string) | Array of values |
| **Grouping** | Same `name` forms group | Same `name` forms group |
| **Use Case** | Mutually exclusive options | Multiple independent selections |
| **Default** | One option can be pre-selected | Multiple options can be pre-selected |

## Comparison with Select

| Feature | Radio | Select |
|---------|-------|--------|
| **Selection** | Single option | Single option |
| **Display** | All options visible | Dropdown menu |
| **Space** | Takes more vertical space | Compact |
| **Use Case** | Few options (2-5) | Many options or space constraints |
| **Output** | Single value (string) | Single value (string) |

## Best Practices

### 1. Radio Group Naming

- **Critical**: All radio options in a group MUST have the same `name`
- Use descriptive names for radio groups (e.g., `gender`, `status`, `priority`)
- Keep radio group names consistent

### 2. Option Count

- Use radio buttons for 2-5 options
- Use select dropdown for more than 5 options
- Avoid more than 7-8 radio options (use select instead)

### 3. Labels

- Always provide clear, descriptive labels for each option
- Keep labels concise (1-3 words)
- Use consistent label formatting

### 4. Default Selection

- Consider providing a default selection for better UX
- Use `defaultvalue` to pre-select common options
- Avoid pre-selecting options that require careful consideration

### 5. Required Fields

- Mark required radio groups clearly
- Set `required="true"` on all options in required groups
- Provide clear visual indication (label, styling)

## Troubleshooting

### Multiple Options Selected

**Possible Causes**:
- Radio buttons have different `name` values
- Not using radio component correctly

**Solutions**:
1. Verify all radio options have the same `name` attribute
2. Ensure you're using radio component, not checkbox
3. Check HTML output to verify `name` attributes match

### No Value in Form Data

**Possible Causes**:
- No radio option is selected
- Radio options have different `name` values
- Radio not inside form container

**Solutions**:
1. Verify at least one radio is checked
2. Ensure all radio options have the same `name`
3. Check that radio group is inside form component
4. Verify radio options are not disabled

### Default Selection Not Working

**Possible Causes**:
- `defaultvalue` doesn't match any option `value`
- Default value set incorrectly

**Solutions**:
1. Verify `defaultvalue` exactly matches option `value`
2. Check that default option is inside the radio group
3. Ensure default option is not disabled

## Related Components

- **Field Container**: `typerefinery/components/forms/field` - Base field component
- **Checkbox Field**: `typerefinery/components/forms/checkbox` - Multiple selection alternative
- **Select Field**: `typerefinery/components/forms/select` - Dropdown selection alternative
- **Form Container**: `typerefinery/components/forms/form` - Parent form component

## Key Files

- **Component Definition**: `/apps/typerefinery/components/forms/radio/.content.json`
- **Default Template**: `/apps/typerefinery/components/forms/radio/template/.content.json`
- **Rendering Stub**: `/apps/typerefinery/components/forms/radio/radio.html`
- **Field Component**: `/apps/typerefinery/components/forms/fields/radio/`
- **Sling Model**: `ai.typerefinery.websight.models.components.forms.Radio`
- **Client Libraries**: `/apps/typerefinery/components/forms/fields/radio/clientlibs/`

## References

- **Base Field Container**: `docs/forms/field.md`
- **Checkbox Field**: `docs/forms/checkbox.md`
- **Select Field**: `docs/forms/select.md` (if exists)
- **Form Container**: `docs/forms/form.md` (if exists)
- **Component README**: `/apps/typerefinery/components/forms/radio/README.md`
- **Bootstrap Form Check**: https://getbootstrap.com/docs/5.3/forms/checks-radios/

