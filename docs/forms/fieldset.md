# Fieldset Component

## Overview

**Component**: `typerefinery/components/forms/fieldset`

**Description**: Layout container component that renders a semantic `<fieldset>` HTML element for grouping related form fields with an optional `<legend>`. Provides visual and semantic grouping of form inputs for better accessibility and organization.

**Inheritance**: Extends `typerefinery/components/layout/container` via `sling:resourceSuperType`, using the Container model with `decorationTagName='fieldset'` to render a `<fieldset>` element instead of a `<div>`.

**Location**: `/apps/typerefinery/components/forms/fieldset/`

## Resource Type

```
typerefinery/components/forms/fieldset
```

**Note**: This is a **layout container component**, not a form field component. It groups other form components semantically.

## Features

- **Semantic HTML**: Renders `<fieldset>` HTML element for form grouping
- **Optional Legend**: Supports `<legend>` element for fieldset title
- **Container Functionality**: Full container capabilities (allowed components, layout, styling)
- **Parsely Integration**: Allows authors to add child components via parsys
- **Layout Support**: Supports grid, alignment, and styling options
- **Accessibility**: Improves form accessibility with semantic grouping
- **Flow Integration**: Child fields remain Flow-aware (fieldset itself doesn't generate payload entries)

## Component Structure

```
/apps/typerefinery/components/forms/fieldset/
├── .content.json              # Component definition (isContainer: true, isLayout: true)
├── fieldset.html              # Rendering stub (uses Container model with decorationTagName='fieldset')
└── dialog/                    # Dialog configuration (inherits from container)
    └── .content.json          # Dialog definition
```

## Sling Model

**Class**: `ai.typerefinery.websight.models.components.layout.Container`

**Special Configuration**: Uses `decorationTagName='fieldset'` parameter to render `<fieldset>` element

**Key Properties**:
- `decorationTagName`: Set to `'fieldset'` to render `<fieldset>` instead of `<div>`
- `title`: Optional legend text (rendered as `<legend>`)
- `description`: Optional description text
- `inheriting`: Boolean flag for inherited containers
- `cancelInheritParent`: Boolean flag to cancel inheritance
- Inherits all properties from `BaseComponent` (styled, grid, etc.)

## Structure & Rendering

### Rendering Flow

1. **Fieldset Component** (`fieldset.html`):
   - Adapts `Container` Sling Model with `decorationTagName='fieldset'` parameter
   - Uses container variant template
   - Renders `<fieldset>` element with parsys for child components

2. **Variant Template** (inherited from container):
   - Renders opening `<fieldset>` tag via `data-sly-element="${model.decorationTagName}"`
   - Includes parsys for child components
   - Renders closing `</fieldset>` tag

### HTML Output

**Standard Fieldset**:
```html
<fieldset id="fieldset-id" class="container-classes" data-model="{...}">
  <legend>Fieldset Title</legend>
  <parsys>
    <!-- Child form components -->
  </parsys>
</fieldset>
```

**Fieldset without Legend**:
```html
<fieldset id="fieldset-id" class="container-classes">
  <parsys>
    <!-- Child form components -->
  </parsys>
</fieldset>
```

## Authoring Dialog

The fieldset component inherits dialog configuration from the layout container:

- **General Tab**:
  - Title/Legend text
  - Description (optional)
  - Inheritance configuration (if needed)
- **Style Tab**: Grid, alignment, styling options (inherited from container)
- **Grid Tab**: Column widths, alignment (inherited from container)
- **Alignment Tab**: Alignment options (inherited from container)

### Fieldset Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | String | No | Legend text (rendered as `<legend>` inside fieldset) |
| `description` | String | No | Optional description/helper text |
| `inheriting` | Boolean | No | Enable container inheritance (default: `false`) |
| `cancelInheritParent` | Boolean | No | Cancel inheritance from parent (default: `false`) |

## Allowed Components

The fieldset component allows the following component groups:

- **Typerefinery - Content**: Content components
- **Typerefinery - Details**: Detail components
- **Typerefinery - Forms**: All form components (input, select, textarea, checkbox, radio, button, etc.)
- **Typerefinery - Graphs**: Graph components
- **Typerefinery - Layout**: Layout components (including nested fieldsets)
- **Typerefinery - List**: List components
- **Typerefinery - Widgets**: Widget components
- **Typerefinery - Widgets - Security**: Security widget components
- **Typerefinery - Flow**: Flow components

## Usage Patterns

### Basic Fieldset

Simple fieldset with legend:

```html
<typerefinery:fieldset title="Personal Information">
  <typerefinery:input name="firstName" label="First Name" />
  <typerefinery:input name="lastName" label="Last Name" />
  <typerefinery:input name="email" label="Email" inputType="email" />
</typerefinery:fieldset>
```

**HTML Output**:
```html
<fieldset>
  <legend>Personal Information</legend>
  <div class="form-group">
    <label for="firstName">First Name</label>
    <input type="text" name="firstName" id="firstName" />
  </div>
  <!-- More form fields -->
</fieldset>
```

### Fieldset without Legend

Fieldset without title:

```html
<typerefinery:fieldset>
  <typerefinery:input name="street" label="Street" />
  <typerefinery:input name="city" label="City" />
  <typerefinery:input name="state" label="State" />
  <typerefinery:input name="zip" label="ZIP Code" />
</typerefinery:fieldset>
```

### Nested Fieldsets

Fieldsets can be nested:

```html
<typerefinery:fieldset title="Contact Information">
  <typerefinery:fieldset title="Address">
    <typerefinery:input name="street" label="Street" />
    <typerefinery:input name="city" label="City" />
  </typerefinery:fieldset>
  <typerefinery:fieldset title="Phone">
    <typerefinery:input name="phone" label="Phone" inputType="tel" />
  </typerefinery:fieldset>
</typerefinery:fieldset>
```

### Fieldset with Composite Field

Group related fields using composite:

```html
<typerefinery:fieldset title="Address">
  <typerefinery:composite name="address" type="field">
    <typerefinery:input name="street" label="Street" />
    <typerefinery:input name="city" label="City" />
    <typerefinery:input name="state" label="State" />
    <typerefinery:input name="zip" label="ZIP Code" />
  </typerefinery:composite>
</typerefinery:fieldset>
```

**Result**: Semantic grouping with structured data output from composite field.

## Form Submission

### Payload Behavior

The fieldset component **does not generate payload entries**:

- Fieldset is a layout container only
- Child form fields are processed normally
- Child fields remain Flow-aware via their own models
- Grouping does not affect payload serialization

### Example Payload

**Form Structure**:
```html
<form>
  <fieldset title="Personal Info">
    <input name="firstName" value="John" />
    <input name="lastName" value="Doe" />
  </fieldset>
  <fieldset title="Contact">
    <input name="email" value="john@example.com" />
  </fieldset>
</form>
```

**Form Payload**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

**Note**: Fieldset structure is not reflected in payload - only child field values are included.

## Flow Integration

### Automatic Inclusion

When Flow API is enabled:

- Fieldset does not generate Flow payload entries
- Child form fields are processed normally
- Child fields remain Flow-aware via their own models
- Flow metadata is inherited from parent form container
- Grouping is for organization only, not data structure

### Payload Structure

Fieldset grouping is **visual/semantic only**:

**With Fieldset**:
```json
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "contact": {
    "email": "john@example.com"
  }
}
```

**Actual Payload** (fieldset doesn't create nesting):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

**Note**: To create nested payload structure, use **composite fields** instead of fieldset.

## Accessibility

### Semantic Benefits

The `<fieldset>` element provides:

- **Screen Reader Support**: Screen readers announce fieldset groups
- **Legend Association**: Legend is associated with fieldset content
- **Visual Grouping**: Visual boundaries for related fields
- **Keyboard Navigation**: Improved keyboard navigation structure

### Best Practices

- Always provide `title`/legend for fieldsets with meaningful content
- Use descriptive legend text
- Group logically related fields together
- Limit nesting depth (recommended max 2-3 levels)

## Comparison with Composite Field

| Feature | Fieldset | Composite Field |
|---------|----------|-----------------|
| **Purpose** | Visual/semantic grouping | Data structure grouping |
| **HTML Element** | `<fieldset>` | `<div>` with hidden input |
| **Payload Impact** | None (visual only) | Creates nested structure |
| **Use Case** | Organization, accessibility | Structured JSON output |
| **Child Fields** | Independent in payload | Grouped in payload |
| **Legend** | Supported (`<legend>`) | Not applicable |

**Key Difference**: Fieldset is for **visual/semantic organization**, Composite is for **data structure grouping**.

## Bootstrap Styling

The fieldset component uses Bootstrap container classes:

### Container Classes

- Inherits all container styling classes
- Grid classes (column widths)
- Alignment classes (flex, alignment)
- Style classes (backgrounds, borders, etc.)

### HTML Structure

```html
<fieldset class="container-classes" id="fieldset-id">
  <legend>Fieldset Title</legend>
  <parsys>
    <!-- Child components -->
  </parsys>
</fieldset>
```

## Best Practices

### 1. Semantic Grouping

- Use fieldsets for logically related form fields
- Group fields that belong together conceptually
- Provide meaningful legend text

### 2. Legend Usage

- Always provide legend for fieldsets with content
- Keep legend text concise and descriptive
- Use legend to explain the group purpose

### 3. Nesting

- Avoid excessive nesting (recommended max 2-3 levels)
- Use nested fieldsets for sub-grouping
- Test screen reader behavior with nesting

### 4. Fieldset vs Composite

- Use **fieldset** for visual/semantic grouping only
- Use **composite field** for nested data structures
- Combine both when needed (fieldset for organization, composite for structure)

### 5. Accessibility

- Always provide legends for fieldsets
- Test with screen readers
- Ensure keyboard navigation works correctly

## Troubleshooting

### Legend Not Showing

**Possible Causes**:
- `title` property not set
- Legend template not rendering
- CSS hiding legend

**Solutions**:
1. Verify `title` property is set in dialog
2. Check variant template includes legend
3. Verify CSS is not hiding legend

### Child Fields Not Appearing

**Possible Causes**:
- Child components not added
- Parsys not rendering
- Component not initialized

**Solutions**:
1. Verify child components are added via parsys
2. Check parsys is rendering correctly
3. Verify fieldset is inside form container

### Payload Structure Issues

**Possible Causes**:
- Expecting fieldset to create nesting (it doesn't)
- Confusion with composite field behavior

**Solutions**:
1. Remember: fieldset doesn't affect payload structure
2. Use composite field for nested payload structures
3. Check child fields are processing correctly

## Related Components

- **Layout Container**: `typerefinery/components/layout/container` - Base container component
- **Composite Field**: `typerefinery/components/forms/composite` - Data structure grouping
- **Form Container**: `typerefinery/components/forms/form` - Parent form component
- **Field Container**: `typerefinery/components/forms/field` - Base field component

## Key Files

- **Component Definition**: `/apps/typerefinery/components/forms/fieldset/.content.json`
- **Rendering Stub**: `/apps/typerefinery/components/forms/fieldset/fieldset.html`
- **Sling Model**: `ai.typerefinery.websight.models.components.layout.Container` (with `decorationTagName='fieldset'`)
- **Variant Template**: Inherited from `/apps/typerefinery/components/layout/container/variant.html`

## References

- **Base Field Container**: `docs/forms/field.md`
- **Composite Field**: `docs/forms/composite.md`
- **Form Container**: `docs/forms/form.md` (if exists)
- **Component README**: `/apps/typerefinery/components/forms/fieldset/README.md`
- **HTML Fieldset**: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset
- **HTML Legend**: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend



