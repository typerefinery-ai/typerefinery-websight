# Button Field

## Overview

**Component**: `typerefinery/components/forms/fields/button`

**Description**: Form button component with multiple button types (submit, navigate, action) and variants (hamburger). Supports icons, images, dropdowns, modal opening, and theme toggling.

**Location**: `/apps/typerefinery/components/forms/fields/button/`

## Resource Type

```
typerefinery/components/forms/fields/button
```

**Note**: This is a field-level component (not a container component), so it doesn't extend the base field component like other form fields.

## Features

- **Multiple Button Types**: Submit, Navigate, Action button types
- **Button Variants**: Standard button and hamburger variant
- **Icons**: Support for icons with left/right positioning
- **Images**: Support for images with left/right positioning
- **Dropdown Support**: Dropdown menu with navigation items
- **Modal Opening**: Open modals on button click
- **Theme Toggling**: Toggle page theme (dark/light)
- **Navigation**: Navigate to different pages or URLs
- **Event Support**: Supports `BUTTON_CLICK` and `MODAL_OPEN` events
- **Bootstrap Styling**: Uses Bootstrap button classes with multiple style options

## Component Structure

```
/apps/typerefinery/components/forms/fields/button/
├── button.html                # Rendering stub (uses Button model, variant selection)
├── variant.html               # Standard button template
├── variant.hamburger.html     # Hamburger button variant template
├── clientlibs/
│   ├── functions.js           # Button click handling and event support
│   ├── behaviour.js           # DOM initialization
│   └── style.css              # Component styling
├── dialog/                    # Button dialog configuration
├── eventactions/              # Event action definitions
│   └── .content.json          # Button click and modal open actions
└── templates/                 # Example images for documentation
    └── image/                 # Screenshot images for variants
```

## Sling Model

**Class**: `ai.typerefinery.websight.models.components.forms.Button`

**Inheritance**: Extends `BaseFormComponent`

**Key Properties**:
- `buttonType`: Button type ("submit", "navigate", "action")
- `buttonStyle`: Bootstrap button style ("primary", "secondary", "success", "warning", "danger", "info", "help", "light", "dark", "text")
- `variant`: Button variant ("hamburger" for hamburger menu button)
- `actionType`: Action type ("openModal", "toggleTheme", "openDropdown")
- `label`: Button label text
- `icon`: Icon class (e.g., Font Awesome class)
- `showIcon`: Boolean flag to show icon
- `iconPosition`: Icon position ("left" or "right")
- `showImage`: Boolean flag to show image
- `imagePosition`: Image position ("left" or "right")
- `hideButtonLabel`: Boolean flag to hide label
- `navigateTo`: URL to navigate to
- `actionUrl`: URL for action (e.g., modal content URL)
- `toggleTarget`: Component ID to toggle (for hamburger variant)
- `dropdownItems`: List of navigation items for dropdown
- Inherits all properties from `BaseFormComponent`

**Default Values**:
- `id`: Auto-generated
- `module`: `"button"` (default)
- `label`: `"Click me"`
- `buttonStyle`: `"primary"`
- `buttonType`: `"submit"`
- `iconPosition`: `"left"`
- `imagePosition`: `"left"`

**CSS Classes**:
- `btn`: Bootstrap button base class
- `btn-{style}`: Bootstrap button style class (primary, secondary, etc.)
- `btn-outline-{style}`: Outlined button style
- Additional classes based on configuration

## Button Types

### Submit Button

Standard form submit button:

**Type**: `buttonType="submit"`

**Behavior**:
- Submits parent form
- Default HTML button behavior
- Can trigger form validation

**Use Case**: Standard form submission

### Navigate Button

Navigation button that redirects to a URL:

**Type**: `buttonType="navigate"`

**Properties**:
- `navigateTo`: URL to navigate to (relative or absolute)
- `navigateToInNewWindow`: Boolean to open in new window/tab

**Behavior**:
- Navigates to specified URL on click
- Can open in new window if configured
- Prevents default form submission

**Use Case**: Cancel buttons, navigation within forms, external links

### Action Button

Button that performs specific actions:

**Type**: `buttonType="action"`

**Action Types**:
- `openModal`: Opens a modal dialog
- `toggleTheme`: Toggles page theme (dark/light)
- `openDropdown`: Opens dropdown menu

**Behavior**:
- Performs configured action on click
- Prevents default form submission
- Can trigger custom events

**Use Case**: Modal triggers, theme switchers, dropdown menus

## Button Variants

### Standard Button (`variant` not set or empty)

Standard button template:

- Standard button rendering
- Supports icons, images, labels
- Full styling options

### Hamburger Button (`variant="hamburger"`)

Hamburger menu button for mobile navigation:

- Visible only on certain screen sizes (responsive)
- Bootstrap collapse trigger
- Used for mobile menu toggles

**Template**: `variant.hamburger.html`

**Properties**:
- `toggleTarget`: Component ID to toggle (e.g., `#menu-id`)
- `target`: Bootstrap collapse target

## Button Styles

Bootstrap button styles supported:

| Style | Class | Description |
|-------|-------|-------------|
| `primary` | `btn-primary` | Primary action (default) |
| `secondary` | `btn-secondary` | Secondary action |
| `success` | `btn-success` | Success action |
| `warning` | `btn-warning` | Warning action |
| `danger` | `btn-danger` | Danger/destructive action |
| `info` | `btn-info` | Informational action |
| `help` | `btn-help` | Help action |
| `light` | `btn-light` | Light variant |
| `dark` | `btn-dark` | Dark variant |
| `text` | `btn-link` | Text/link style button |

### Style Variations

**Outlined Button**: Set `isOutlinedButton="true"`
- Uses `btn-outline-{style}` classes
- Border-only styling

**Text-Only Button**: Set `showTextualElementOfButton="true"`
- Hides button border
- Text or icon only

## Structure & Rendering

### Rendering Flow

1. **Button Component** (`button.html`):
   - Adapts `Button` Sling Model
   - Selects appropriate variant template
   - Renders button with all configured properties

2. **Variant Templates**:
   - **Standard** (`variant.html`): Standard button with icon/image support
   - **Hamburger** (`variant.hamburger.html`): Mobile menu toggle button

3. **Button Output**:
   - Renders `<button>` element with appropriate attributes
   - Includes icons/images based on configuration
   - Sets `component`, `data-model`, `data-actionType` attributes

## Authoring Dialog

The button component has its own dialog configuration:

### General Tab

- **Label**: Button label text
- **Button Style**: Bootstrap button style selection
- **Show Icon**: Enable/disable icon display
- **Hide Label**: Hide button label (icon/image only)
- **Icon Position**: Icon position (left or right)

### Style Tab

- **Class Name**: Custom CSS classes
- **Button Type**: Button type (submit, navigate, action)
- **Outlined Button**: Enable outlined button style
- **Show Text Elements**: Hide button border (text/icon only)

### Grid Tab

- **Width - S breakpoint**: Column width for small screens
- **Width - M breakpoint**: Column width for medium screens
- **Width - L breakpoint**: Column width for large screens
- **Text Alignment**: Text alignment

### Additional Configuration

- **Navigate To**: URL for navigate button type
- **Action Type**: Action type for action button (openModal, toggleTheme, openDropdown)
- **Action URL**: URL for action (e.g., modal content URL)
- **Toggle Target**: Component ID to toggle (for hamburger variant)

## Usage Patterns

### Submit Button

Standard form submit button:

```html
<typerefinery:button label="Submit" buttonType="submit" buttonStyle="primary" />
```

**Behavior**: Submits parent form on click

### Navigate Button

Navigation button:

```html
<typerefinery:button label="Cancel" 
  buttonType="navigate" 
  navigateTo="/home" 
  buttonStyle="secondary" />
```

**Behavior**: Navigates to `/home` on click

### Navigate in New Window

Open URL in new window:

```html
<typerefinery:button label="External Link" 
  buttonType="navigate" 
  navigateTo="https://example.com" 
  navigateToInNewWindow="true" />
```

**Behavior**: Opens `https://example.com` in new window/tab

### Button with Icon

Button with Font Awesome icon:

```html
<typerefinery:button label="Save" 
  showIcon="true" 
  icon="fa fa-save" 
  iconPosition="left" 
  buttonStyle="success" />
```

**Output**:
```html
<button class="btn btn-success">
  <i class="fa fa-save"></i> Save
</button>
```

### Button with Image

Button with image:

```html
<typerefinery:button label="Upload" 
  showImage="true" 
  defaultImage="/path/to/image.png" 
  imagePosition="left" />
```

### Icon-Only Button

Button with icon only (no label):

```html
<typerefinery:button hideButtonLabel="true" 
  showIcon="true" 
  icon="fa fa-trash" 
  buttonStyle="danger" 
  title="Delete" />
```

### Outlined Button

Outlined button style:

```html
<typerefinery:button label="Cancel" 
  buttonStyle="secondary" 
  isOutlinedButton="true" />
```

**Output**: `btn-outline-secondary` class

### Open Modal Button

Action button that opens a modal:

```html
<typerefinery:button label="View Details" 
  buttonType="action" 
  actionType="openModal" 
  actionUrl="/path/to/modal-content" 
  actionModalTitle="Details" />
```

**Behavior**: Opens modal dialog with content from `actionUrl`

### Theme Toggle Button

Button that toggles page theme:

```html
<typerefinery:button label="Toggle Theme" 
  buttonType="action" 
  actionType="toggleTheme" 
  buttonStyle="dark" />
```

**Behavior**: Toggles page theme between dark and light

### Hamburger Button

Mobile menu toggle button:

```html
<typerefinery:button variant="hamburger" 
  toggleTarget="#mobile-menu" 
  target="#mobile-menu" />
```

**Behavior**: Toggles mobile menu visibility (responsive)

## Client-Side Behavior

### Event Support

The button component supports the following events:

#### BUTTON_CLICK

Fired when button is clicked (for custom event handling).

**Event Data**:
```javascript
{
  type: "BUTTON_CLICK",
  action: "BUTTON_CLICK",
  id: "button-id"
}
```

#### MODAL_OPEN

Fired when modal is opened (for action buttons with `openModal`).

**Event Data**:
```javascript
{
  type: "MODAL_OPEN",
  action: "MODAL_OPEN",
  id: "button-id"
}
```

### Event Configuration

Configure events in the dialog's **Events** tab:

```json
{
  "events": [
    {
      "topic": "form-button",
      "type": "emit",
      "name": "BUTTON_CLICK",
      "action": "BUTTON_CLICK"
    }
  ]
}
```

### Button Click Handling

The button component handles clicks based on `buttonType`:

1. **Submit**: Default HTML form submission
2. **Navigate**: `window.location.href = navigateTo` or `window.open(navigateTo)`
3. **Action**: Performs configured action (openModal, toggleTheme, etc.)

**Code Flow**:
```javascript
if(buttonType === "navigate") {
    if(navigateToInNewWindow) {
        window.open(navigateTo);
    } else {
        window.location.href = navigateTo;
    }
} else if(buttonType === "action") {
    if(actionType === "openModal") {
        // Open modal with actionUrl
    } else if(actionType === "toggleTheme") {
        // Toggle page theme
    } else if(actionType === "openDropdown") {
        // Open dropdown menu
    }
}
```

## Event Actions

The button component supports event actions defined in `eventactions/.content.json`:

- **BUTTON_CLICK**: Standard button click event
- **MODAL_OPEN**: Modal opening event

### Event Action Configuration

Configure event actions in dialog's **Events** tab using the eventactions component:

```json
{
  "buttonclick": {
    "key": "BUTTON_CLICK",
    "value": "Button Click"
  },
  "openmodal": {
    "key": "MODAL_OPEN",
    "value": "Open Modal with URL"
  }
}
```

## Flow Integration

### Form Submission

When `buttonType="submit"`:

- Button triggers standard HTML form submission
- Form's `getFormData()` is called
- Form payload is submitted via configured `writeUrl` and `writeMethod`
- Flow events (`FORM_SUBMIT`, `FORM_SUCCESS`, `FORM_ERROR`) are triggered

### Action Buttons

Action buttons don't submit forms but can trigger events:

- Modal opening doesn't submit form
- Theme toggle doesn't submit form
- Navigation doesn't submit form

## Bootstrap Styling

The button component uses Bootstrap button classes:

### Button Classes

- `btn`: Base button class
- `btn-{style}`: Style-specific classes (primary, secondary, etc.)
- `btn-outline-{style}`: Outlined button style
- `btn-link`: Link-style button

### HTML Structure

**Standard Button**:
```html
<button type="submit" class="btn btn-primary" 
  component="button" 
  data-actionType=""
  data-model="{...}">
  <i class="fa fa-save"></i> Save
</button>
```

**Hamburger Button**:
```html
<div class="navbar-expand-lg mt-2">
  <button type="button" class="navbar-toggler" 
    data-bs-toggle="collapse"
    data-bs-target="#mobile-menu">
    <i class="pi pi-align-justify"></i>
  </button>
</div>
```

## Best Practices

### 1. Button Type Selection

- Use **Submit** for form submission
- Use **Navigate** for navigation/cancel buttons
- Use **Action** for modal opening, theme toggle, etc.

### 2. Button Style Selection

- Use **Primary** for main actions (Submit)
- Use **Secondary** for secondary actions (Cancel)
- Use **Danger** for destructive actions (Delete)
- Use **Text** for less important actions

### 3. Icon Usage

- Use icons to enhance button meaning
- Keep icon selection consistent
- Provide text labels with icons for accessibility

### 4. Mobile Considerations

- Use hamburger variant for mobile menus
- Consider button size on mobile devices
- Test button touch targets (min 44x44px)

### 5. Accessibility

- Always provide labels (even if hidden)
- Use `title` attribute for icon-only buttons
- Ensure keyboard navigation works
- Use semantic button types

## Troubleshooting

### Button Not Submitting Form

**Possible Causes**:
- Button type not set to "submit"
- Form validation preventing submission
- JavaScript preventing default behavior

**Solutions**:
1. Verify `buttonType="submit"` is set
2. Check form validation errors
3. Verify button is inside form element
4. Check browser console for JavaScript errors

### Navigation Not Working

**Possible Causes**:
- `navigateTo` URL not set or incorrect
- JavaScript preventing navigation
- Invalid URL format

**Solutions**:
1. Verify `navigateTo` URL is correct
2. Check URL format (relative or absolute)
3. Verify button type is "navigate"
4. Check browser console for JavaScript errors

### Modal Not Opening

**Possible Causes**:
- `actionType` not set to "openModal"
- `actionUrl` not set or incorrect
- Modal component not initialized

**Solutions**:
1. Verify `actionType="openModal"` is set
2. Check `actionUrl` is correct and accessible
3. Verify modal component is loaded
4. Check browser console for errors

### Icon Not Showing

**Possible Causes**:
- Icon class incorrect
- Icon library not loaded
- `showIcon` not set to `true`

**Solutions**:
1. Verify icon class is correct (e.g., `fa fa-save`)
2. Check icon library (Font Awesome, etc.) is loaded
3. Verify `showIcon="true"` is set
4. Check icon positioning (`iconPosition`)

## Related Components

- **Field Container**: `typerefinery/components/forms/field` - Base field component (button doesn't extend this)
- **Form Container**: `typerefinery/components/forms/form` - Parent form component
- **Modal Component**: Modal dialog component (for openModal action)
- **Dropdown Component**: Dropdown menu component (for openDropdown action)

## Key Files

- **Component Definition**: `/apps/typerefinery/components/forms/fields/button/`
- **Rendering Stub**: `/apps/typerefinery/components/forms/fields/button/button.html`
- **Variant Templates**: `/apps/typerefinery/components/forms/fields/button/variant*.html`
- **Sling Model**: `ai.typerefinery.websight.models.components.forms.Button`
- **Client Libraries**: `/apps/typerefinery/components/forms/fields/button/clientlibs/`
- **Event Actions**: `/apps/typerefinery/components/forms/fields/button/eventactions/.content.json`

## References

- **Form Container**: `docs/forms/form.md` (if exists)
- **Component README**: `/apps/typerefinery/components/forms/fields/button/README.md`
- **Bootstrap Buttons**: https://getbootstrap.com/docs/5.3/components/buttons/
- **Bootstrap Navbar**: https://getbootstrap.com/docs/5.3/components/navbar/


