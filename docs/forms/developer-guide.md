# Form Component Developer Guide

This guide provides comprehensive instructions for creating new form field components in Typerefinery. Form components follow a standardized architecture pattern that ensures consistency, maintainability, and integration with the form system, Flow API, and client-side data collection.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Step-by-Step Guide](#step-by-step-guide)
- [Component Structure](#component-structure)
- [Sling Model Implementation](#sling-model-implementation)
- [Template Implementation](#template-implementation)
- [Dialog Configuration](#dialog-configuration)
- [Client Libraries (Optional)](#client-libraries-optional)
- [Integration Points](#integration-points)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

### What is a Form Component?

Form components are reusable field inputs that can be added to forms. They extend the base field component (`typerefinery/components/forms/field`) to provide consistent behavior, styling, and integration with the form system.

### Key Features

- **Automatic Integration**: Automatically works with form data collection, Flow API, and event system
- **Consistent Styling**: Inherits Bootstrap classes and form styling from base component
- **Dialog Configuration**: Uses shared dialog fragments for consistency
- **Client-Side Support**: Integrated with form client library for data collection and validation

### Component Types

1. **Simple Input Fields**: Text inputs, textareas, basic form controls (e.g., Input, Textarea)
2. **Complex Input Fields**: Fields with JavaScript behavior, variants, or special handling (e.g., Button, FileUpload)
3. **Container Fields**: Fields that contain child components (e.g., Composite)

## Architecture

### Inheritance Model

```
typerefinery/components/forms/field (base)
    ↑ (sling:resourceSuperType)
YourComponent (new component)
```

All form field components inherit from the base field component, which provides:
- Label wrapper and ID management
- CSS classes and styling
- Dialog structure (Style, Grid, Alignment, Aria tabs)
- Flow integration foundation

### Component Location

- **Component Definition**: `/apps/typerefinery/components/forms/fields/{component}/`
- **Sling Model**: `/application/backend/src/main/java/ai/typerefinery/websight/models/components/forms/{YourComponent}.java`
- **Documentation**: `/docs/forms/{component}.md` (optional)

### Data Flow

1. **Authoring**: Author configures component via dialog
2. **Rendering**: Component renders using Sling Model and HTL templates
3. **Client-Side**: Form client library collects field values via `getFormData()`
4. **Submission**: Form submits data to configured endpoint (or Flow API)
5. **Flow Integration**: Field values included in Flow payload when enabled

## Step-by-Step Guide

### Step 1: Create Component Directory Structure

Create the component directory:

```
/apps/typerefinery/components/forms/fields/{yourcomponent}/
├── .content.json
├── {yourcomponent}.html
├── variant.html
├── dialog/
│   └── .content.json
└── README.md          # REQUIRED: Component documentation
```

### Step 2: Create Component Definition (`.content.json`)

Create `/apps/typerefinery/components/forms/fields/{yourcomponent}/.content.json`:

```json
{
  "isContainer": false,
  "group": "Typerefinery - Forms",
  "isLayout": false,
  "sling:resourceType": "ws:Component",
  "sling:resourceSuperType": "typerefinery/components/forms/field",
  "description": "Your component description",
  "title": "Your Component Name"
}
```

**Key Points:**
- `sling:resourceSuperType` MUST be `"typerefinery/components/forms/field"`
- `group` MUST be `"Typerefinery - Forms"` to appear in form palette
- Set `isContainer: true` only if component needs to contain children

### Step 3: Create Sling Model

Create `/application/backend/src/main/java/ai/typerefinery/websight/models/components/forms/{YourComponent}.java`:

```java
package ai.typerefinery.websight.models.components.forms;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Exporter;
import org.apache.sling.models.annotations.ExporterOption;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import lombok.Getter;

@Model(adaptables = {
    Resource.class,
    SlingHttpServletRequest.class
}, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json", options = {
    @ExporterOption(name = "SerializationFeature.WRITE_DATES_AS_TIMESTAMPS", value = "true")
})
public class YourComponent extends BaseFormComponent {

    protected static final String DEFAULT_MODULE = "yourcomponent";
    protected static final String DEFAULT_LABEL = "Your Label";
    protected static final String DEFAULT_PLACEHOLDER = "Your placeholder";

    // Add your component-specific properties
    @Inject
    @Getter
    @Default(values = "defaultValue")
    public String yourProperty;

    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();

        if (StringUtils.isBlank(label)) {
            this.label = DEFAULT_LABEL;
        }

        if (StringUtils.isBlank(placeholder)) {
            this.placeholder = DEFAULT_PLACEHOLDER;
        }

        // Add component-specific CSS classes
        style.addClasses("form-control");
    }
}
```

**Key Points:**
- Extend `BaseFormComponent`
- Use `@Model` with `Resource.class` and `SlingHttpServletRequest.class`
- Use `@Exporter` for JSON serialization
- Override `init()`, call `super.init()` first
- Set `this.module` to component-specific module name

### Step 4: Create Main Template (`{yourcomponent}.html`)

Create `/apps/typerefinery/components/forms/fields/{yourcomponent}/{yourcomponent}.html`:

```html
<!--/*
    Copyright (C) 2023 Typerefinery.io

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/-->
<sly data-sly-use.model="ai.typerefinery.websight.models.components.forms.YourComponent">
  <div class="${model.componentClassNames}"> 
    <sly data-sly-use.template="./variant.html" data-sly-call="${template.variant @ model=model}">
    </sly>
  </div>
</sly>
```

### Step 5: Create Variant Template (`variant.html`)

Create `/apps/typerefinery/components/forms/fields/{yourcomponent}/variant.html`:

```html
<template data-sly-template.variant="${ @ model }">
  <input 
    component="${model.componentName}"
    id="${model.id}" 
    name="${model.name}"
    value="${model.value}"
    data-fieldId="${model.parentFieldId}" 
    placeholder="${model.placeholder}" 
    class="${model.variantClassNames}"
    data-model="${model.jsonString}"
  />
</template>
```

**Key Points:**
- Use `data-sly-template.variant` pattern
- Include required attributes: `component`, `id`, `name`, `data-fieldId`, `data-model`
- The base field component handles the label wrapper automatically

### Step 6: Create Dialog Configuration

Create `/apps/typerefinery/components/forms/fields/{yourcomponent}/dialog/.content.json`:

```json
{
  "sling:resourceType": "wcm/dialogs/dialog",
  "tabs": {
    "sling:resourceType": "wcm/dialogs/components/tabs",
    "generalTab": {
      "sling:resourceType": "wcm/dialogs/components/tab",
      "label": "General",
      "fieldName": {
        "sling:resourceType": "wcm/dialogs/components/include",
        "path": "/apps/typerefinery/components/forms/form/common/fieldName"
      },
      "placeholder": {
        "sling:resourceType": "wcm/dialogs/components/include",
        "path": "/apps/typerefinery/components/forms/form/common/placeholder"
      },
      "fieldValue": {
        "sling:resourceType": "wcm/dialogs/components/include",
        "path": "/apps/typerefinery/components/forms/form/common/fieldValue"
      }
    },
    "eventTab": {
      "sling:resourceType": "wcm/dialogs/components/tab",
      "label": "Events",
      "event": {
        "sling:resourceType": "wcm/dialogs/components/multifield",
        "name": "_events_",
        "label": "Events",
        "topic": {
          "sling:resourceType": "wcm/dialogs/components/include",
          "path": "/apps/typerefinery/components/dialog/tabs/event/event/topic"
        },
        "type": {
          "sling:resourceType": "wcm/dialogs/components/include",
          "path": "/apps/typerefinery/components/dialog/tabs/event/event/type"
        },
        "eventAction": {
          "sling:resourceType": "typerefinery/components/dialog/eventactions",
          "name": "action",
          "label": "Component Action"
        }
      }
    },
    "validationTab": {
      "sling:resourceType": "wcm/dialogs/components/include",
      "path": "/apps/typerefinery/components/dialog/tabs/validation"
    },
    "gridTab": {
      "sling:resourceType": "wcm/dialogs/components/include",
      "path": "/apps/typerefinery/components/dialog/tabs/grid"
    },
    "styleTab": {
      "sling:resourceType": "wcm/dialogs/components/include",
      "path": "/apps/typerefinery/components/dialog/tabs/style"
    },
    "ariaTab": {
      "sling:resourceType": "wcm/dialogs/components/include",
      "path": "/apps/typerefinery/components/dialog/tabs/aria"
    }
  }
}
```

**Key Points:**
- Use shared fragments from `/apps/typerefinery/components/forms/form/common/`
- Include standard tabs: General, Events, Validation, Grid, Style, Aria
- Add component-specific fields in `generalTab` as needed

### Step 7: Create Component README

**MANDATORY**: Create `/apps/typerefinery/components/forms/fields/{yourcomponent}/README.md`:

```markdown
# Component

Your Component component

# Overview

Brief description of your component and its purpose

## Information

- **group**: Typerefinery - Forms
- **sling:resourceType**: ws:Component
- **description**: Your component description
- **title**: Your Component Title
- **sling:resourceSuperType**: typerefinery/components/forms/field
- **Vendor**: Typerefinery
- **Version**: 1.0
- **Compatibility**: CMS
- **Status**: Ready
- **Showcase**: [/typerefinery/components/forms/{yourcomponent}](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/{yourcomponent}::editor)
- **Local Code**: [/apps/typerefinery/components/forms/fields/{yourcomponent}]
- **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/{yourcomponent})
- **Readme**: [/typerefinery/components/forms/{yourcomponent}/readme](https://github.com/typerefinery-ai/typerefinery-websight/blob/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/{yourcomponent}/README.md)

# Authoring

Document dialog tabs and fields available for authors

## Dialog Tabs

| Tab | Field Name | Default Value | Description |
|-----|------------|---------------|-------------|
| General | Field Name | - | Field description |
| ... | ... | ... | ... |

# Variants

Document component variants (if applicable)
```

**Key Points:**
- **REQUIRED**: Must include showcase path to component showcase page
- **REQUIRED**: Must document all dialog tabs and fields
- **REQUIRED**: Must document variants if component has them
- Update showcase URL to match your component name
- Update source links to match repository structure

## Component Structure

### Required Files

Every form component MUST have:

1. **`.content.json`** - Component definition with `sling:resourceSuperType`
2. **`{component}.html`** - Main template that adapts Sling Model
3. **`variant.html`** - Field variant template with input element
4. **`dialog/.content.json`** - Dialog configuration using shared fragments
5. **Sling Model Java class** - Extends `BaseFormComponent`
6. **`README.md`** - Component documentation with showcase path and component details

### Optional Files

Components may include:

- **`clientlibs/`** - JavaScript and CSS (only if needed)
- **`eventactions/.content.json`** - Component-specific event actions
- **`README.md`** - Component documentation
- **Additional variant templates** - For components with multiple variants

## Sling Model Implementation

### BaseFormComponent Properties

All form components inherit these properties from `BaseFormComponent`:

| Property | Type | Description |
|----------|------|-------------|
| `id` | String | Unique field ID (auto-generated) |
| `name` | String | Field name (used in form submission) |
| `label` | String | Field label text |
| `value` | String | Field value |
| `placeholder` | String | Placeholder text |
| `disabled` | Boolean | Disabled state |
| `required` | Boolean | Required validation |
| `module` | String | Client module name |
| `componentClassNames` | String | CSS classes for component wrapper |
| `variantClassNames` | String | CSS classes for field element |
| `jsonString` | String | JSON representation (for `data-model` attribute) |

### Required Methods

**`init()` method:**

```java
@Override
@PostConstruct
protected void init() {
    this.module = DEFAULT_MODULE;  // REQUIRED: Set module name
    super.init();                   // REQUIRED: Call parent init first
    
    // Set default values if blank
    if (StringUtils.isBlank(label)) {
        this.label = DEFAULT_LABEL;
    }
    
    // Add CSS classes
    style.addClasses("form-control");
}
```

### Property Injection

Use standard Sling Model injection:

```java
@Inject
@Getter
@Default(values = "defaultValue")
public String yourProperty;
```

**Annotations:**
- `@Inject` - Injects property from resource/dialog
- `@Getter` - Lombok generates getter method
- `@Default` - Provides default value if not set

### Computed Properties Pattern

**MANDATORY**: For any HTML attribute that needs conditional logic, defaults, or type mapping, create a computed property in the model.

**Pattern**: `{AttributeName}Attr` suffix for computed HTML attribute values.

```java
/**
 * Computed: HTML type attribute value.
 * Maps inputType to HTML type with special handling.
 */
@Getter
private String typeAttr;

/**
 * Computed: HTML value attribute with defaults.
 * Sets default value for specific types if not provided.
 */
@Getter
private String valueAttr;

/**
 * Computed: HTML placeholder attribute (null if not applicable).
 */
@Getter
private String placeholderAttr;

@PostConstruct
protected void init() {
    super.init();
    
    // Compute all conditional attributes in init()
    this.typeAttr = computeTypeAttr();
    this.valueAttr = computeValueAttr();
    this.placeholderAttr = computePlaceholderAttr();
}

private String computeTypeAttr() {
    // All logic here, not in template
    if (isEditMode && "hidden".equals(inputType)) {
        return "text";
    } else if ("colourpicker".equals(inputType)) {
        return "color";
    }
    return inputType != null ? inputType : "text";
}
```

**Rules:**
- **REQUIRED**: Compute all conditionals in `init()` method
- **REQUIRED**: Return `null` if attribute should not be rendered
- **REQUIRED**: Use `data-sly-attribute.{attr}="${model.{attr}Attr}"` in template
- **FORBIDDEN**: Conditionals, defaults, or logic in template expressions

## Template Implementation

### Main Template Pattern

The main template adapts the Sling Model and calls the variant template:

```html
<sly data-sly-use.model="ai.typerefinery.websight.models.components.forms.YourComponent">
  <div class="${model.componentClassNames}"> 
    <sly data-sly-use.template="./variant.html" data-sly-call="${template.variant @ model=model}">
    </sly>
  </div>
</sly>
```

### Variant Template Pattern

**CRITICAL: VERY LEAN HTML SIGNATURE**

The variant template MUST have the absolute minimum HTML signature. All logic, defaults, and conditionals MUST be computed in the Sling Model.

```html
<template data-sly-template.variant="${ @ model }">
  <input 
    component="${model.componentName}"
    isInput="true"
    id="${model.id}" 
    type="${model.typeAttr}"
    name="${model.name}"
    value="${model.valueAttr}"
    data-fieldId="${model.parentFieldId}" 
    data-model="${model.jsonString}"
    class="${model.variantClassNames}"
    data-sly-attribute.placeholder="${model.placeholderAttr}"
    data-sly-attribute.required="${model.requiredAttr}"
    data-sly-attribute.min="${model.minAttr}"
    data-sly-attribute.max="${model.maxAttr}"
    data-sly-attribute.step="${model.stepAttr}"
    data-sly-attribute.data-inputmask="${model.inputmaskAttr}"
    data-sly-attribute.disabled="${model.disabledAttr}"
  />
</template>
```

**MANDATORY Rules:**

1. **NO CONDITIONALS IN TEMPLATES**: Compute in model, use computed property
   - ❌ `${model.inputType == 'rating' ? null : model.placeholder}`
   - ✅ `model.placeholderAttr` (computed in model)

2. **NO DEFAULTS IN TEMPLATES**: Compute defaults in model
   - ❌ `${model.value || '#000000'}`
   - ✅ `model.valueAttr` (includes defaults in model)

3. **NO LOGIC IN TEMPLATES**: All logic in model's `init()` method
   - ❌ `${model.inputType != 'rating' && model.validationRequired}`
   - ✅ `model.requiredAttr` (computed in model)

4. **USE COMPUTED PROPERTIES**: Create `{AttributeName}Attr` properties in model
5. **USE DATA-MODEL**: Client-side reads from `data-model`, not DOM queries

**Required Attributes:**
- `component` - Component name for client-side identification
- `id` - Unique field ID
- `name` - Field name (used in form submission)
- `data-fieldId` - Parent field ID for label association
- `data-model` - JSON representation for client-side access (REQUIRED for JS)
- `class` - CSS classes from model (computed in model)
- All conditional attributes via `data-sly-attribute` with computed `{attr}Attr` properties

**Note:** The base field component's `variant.html` handles the label wrapper automatically. Your variant template only needs to provide the input element itself.

## Dialog Configuration

### Shared Fragments

Always use shared fragments from `/apps/typerefinery/components/forms/form/common/`:

| Fragment | Path | Description |
|----------|------|-------------|
| `fieldName` | `/apps/typerefinery/components/forms/form/common/fieldName` | Field name input |
| `placeholder` | `/apps/typerefinery/components/forms/form/common/placeholder` | Placeholder text |
| `fieldValue` | `/apps/typerefinery/components/forms/form/common/fieldValue` | Default value |
| `label` | `/apps/typerefinery/components/forms/form/common/label` | Label text |
| `title` | `/apps/typerefinery/components/forms/form/common/title` | Title attribute |
| `defaultvalue` | `/apps/typerefinery/components/forms/form/common/defaultvalue` | Default value (alternative) |

### Standard Tabs

Include these standard tabs for consistency:

1. **General** - Component-specific fields + shared fragments
2. **Events** - Event configuration (multifield)
3. **Validation** - Validation rules
4. **Grid** - Responsive grid settings
5. **Style** - CSS classes and styling
6. **Aria** - Accessibility attributes

### Component-Specific Fields

Add component-specific fields in `generalTab`:

```json
"generalTab": {
  "sling:resourceType": "wcm/dialogs/components/tab",
  "label": "General",
  "fieldName": {
    "sling:resourceType": "wcm/dialogs/components/include",
    "path": "/apps/typerefinery/components/forms/form/common/fieldName"
  },
  "yourCustomField": {
    "sling:resourceType": "wcm/dialogs/components/textfield",
    "name": "yourProperty",
    "label": "Your Field Label"
  }
}
```

## Client Libraries (Optional)

Only add client libraries if your component requires JavaScript or CSS.

**MANDATORY: CSS Namespacing**

All CSS selectors in component `style.css` files MUST be properly namespaced using `[component="{componentName}"]` to prevent global conflicts. See "CSS Namespacing" section in Best Practices for details.

### Structure

```
/clientlibs/
├── .content.json
├── behaviour.js
├── functions.js
└── style.css
```

### `.content.json`

```json
{
  "sling:resourceType": "io/typerefinery/websight/clientlibs",
  "categories": ["ai.typerefinery.websight.components"],
  "css": [
    "/apps/typerefinery/components/forms/fields/{component}/clientlibs/style.css"
  ],
  "js": [
    "/apps/typerefinery/components/forms/fields/{component}/clientlibs/behaviour.js",
    "/apps/typerefinery/components/forms/fields/{component}/clientlibs/functions.js"
  ]
}
```

### `behaviour.js` Pattern

```javascript
(function() {
    "use strict";
    
    function init(component) {
        // Initialize component
    }
    
    // Register component
    if (window.Typerefinery) {
        Typerefinery.Components = Typerefinery.Components || {};
        Typerefinery.Components.YourComponent = {
            init: init
        };
        
        // Watch DOM for new instances
        Typerefinery.Page.watchDOMForComponent("yourcomponent", init);
    }
})();
```

## Integration Points

### Form Data Collection

**AUTOMATIC**: Components are automatically collected by form's `getFormData()` function.

**Requirements:**
- Component must have `name` attribute on input element
- Component must include `data-model` attribute with `model.jsonString`
- Field values are collected based on `name` attribute

**MANDATORY: Use Data-Model for Client-Side Configuration**

**CRITICAL RULE**: Client-side JavaScript MUST read all configuration from the `data-model` attribute, NOT from DOM queries, data attributes, or element classes.

**Forbidden Patterns:**
```javascript
// ❌ FORBIDDEN: Querying DOM for configuration
const type = $component.find('input').attr('type');
const placeholder = $component.find('input').attr('placeholder');
const isRequired = $component.find('input').hasClass('required');

// ❌ FORBIDDEN: Reading from data attributes for config
const maxStars = $component.data('max-stars');
const allowHalf = $component.data('allow-half');
```

**Required Pattern:**
```javascript
// ✅ REQUIRED: Read from data-model attribute
const componentConfig = componentNs.getComponentConfig($component);
const { inputType, placeholder, validationRequired, ratingMaxStars, ratingAllowHalf } = componentConfig;

// ✅ REQUIRED: Use componentConfig for all initialization and configuration
ns.initRating($component, componentConfig);
```

**Implementation:**
1. **Include `data-model`**: Template must include `data-model="${model.jsonString}"`
2. **Parse in JavaScript**: Use `componentNs.getComponentConfig($component)` to parse
3. **Pass to Functions**: Pass `componentConfig` object to all initialization functions
4. **No DOM Queries**: Never query DOM for configuration values

This ensures:
- Configuration is centralized in the model
- Client-side code is independent of HTML structure
- Changes to HTML don't break JavaScript
- Single source of truth for component configuration

### Flow API Integration

**AUTOMATIC**: Components are automatically included in Flow payloads when form has Flow enabled.

**Requirements:**
- No special configuration needed for basic fields
- Flow metadata is configured on parent form
- Field values are included in Flow payload automatically

### Event System

**OPTIONAL**: Components can emit and listen to events.

**Standard Events:**
- `FORM_SUCCESS` - Form submission succeeded
- `FORM_ERROR` - Form submission failed
- `FORM_SUBMIT` - Form submission started
- `FORM_CANCEL` - Form cancelled
- `FORM_LOAD` - Form data loaded

**Configuration:**
- Wire events in dialog's `eventTab`
- Use `eventactions/.content.json` for component-specific actions
- Events are handled by form client library

## Examples

### Example 1: Simple Input Component

See: `/apps/typerefinery/components/forms/fields/input/`

- Basic text input with HTML5 types
- Minimal clientlibs
- Standard dialog pattern

### Example 2: Complex Component with Variants

See: `/apps/typerefinery/components/forms/fields/button/`

- Multiple variants (submit, navigate, action, hamburger)
- Complex clientlibs
- Event action definitions
- Variant template selection

### Example 3: Container Component

See: `/apps/typerefinery/components/forms/fields/composite/`

- `isContainer: true`
- Multiple variants (field, list)
- Parsys integration
- JSON output compilation

## Showcase Examples

### MANDATORY: Showcase Updates for Component Changes

**CRITICAL RULE**: Whenever ANY change is made to a component (new features, new properties, new variants, bug fixes, refactoring, CSS changes, JavaScript changes, etc.), the showcase page MUST be updated to demonstrate and validate those changes.

**MANDATORY Update Triggers:**
- ✅ **New features** added to component
- ✅ **New properties** added to dialog
- ✅ **New variants** created
- ✅ **Behavioral changes** (how component works)
- ✅ **CSS/styling changes** (visual appearance, namespacing)
- ✅ **JavaScript changes** (client-side behavior)
- ✅ **Bug fixes** that affect functionality or appearance
- ✅ **Refactoring** that changes component structure
- ✅ **New input types** or field types
- ✅ **Configuration changes** (new dialog fields, options)
- ✅ **Documentation updates** in README

**Showcase Update Requirements:**
1. **MANDATORY**: Add examples demonstrating the new/changed feature
2. **MANDATORY**: Test all showcase examples after changes
3. **MANDATORY**: Update README if component documentation changed
4. **MANDATORY**: Use container components to group related examples
5. **MANDATORY**: Include edge cases and different configurations
6. **MANDATORY**: Verify all existing examples still work correctly

**Examples:**
- Added new `rating` input type → Must add rating examples to showcase
- Added `rangeMin`, `rangeMax`, `rangeStep` properties → Must add range examples with different configurations
- Changed CSS namespacing → Must verify all showcase examples still work correctly
- Added custom icon classes for rating → Must add example showing custom icons
- Fixed bug in component behavior → Must verify fix works in showcase
- Refactored template → Must test all showcase examples still render correctly

**NO EXCEPTIONS**: Every component change MUST include showcase updates. This ensures:
- Features are properly demonstrated
- Changes are validated and tested
- Documentation stays current
- Users can see all available features
- Regression testing is performed

### Creating Showcase Pages

When creating a new form component, you MUST also create showcase examples to demonstrate the component's functionality.

**Location**: `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/{component}/`

### Showcase Page Structure

Create a showcase page for your component:

```
tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/{component}/
└── .content.xml
```

### Showcase Page Template

**MANDATORY**: Use container components to group related examples. Each container should have a descriptive title and use the `sectionwithtitle` variant.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:ws="http://ds.pl/websight" xmlns:sling="http://sling.apache.org/jcr/sling/1.0"
    jcr:primaryType="ws:Page">
    <jcr:content
        jcr:primaryType="ws:PageContent"
        jcr:title="{Component Name}"
        sling:resourceType="typerefinery/components/structure/page"
        ws:template="/apps/typerefinery/templates/page">
        <rootcontainer
            jcr:primaryType="nt:unstructured"
            sling:resourceType="typerefinery/components/layout/fixedrootcontainer">
            <header
                jcr:primaryType="nt:unstructured"
                sling:resourceType="typerefinery/components/layout/header"/>
            <container
                jcr:primaryType="nt:unstructured"
                sling:resourceType="typerefinery/components/layout/container">
                <form
                    jcr:primaryType="nt:unstructured"
                    sling:resourceType="typerefinery/components/forms/form"
                    id="form_{ID}">
                    <!-- Group examples using container components -->
                    <container_1
                        jcr:primaryType="nt:unstructured"
                        sling:resourceType="typerefinery/components/layout/container"
                        flexEnabled="true"
                        id="container_1_BASIC"
                        title="Basic Examples"
                        variant="sectionwithtitle">
                        <!-- Component examples here -->
                    </container_1>
                    <container_2
                        jcr:primaryType="nt:unstructured"
                        sling:resourceType="typerefinery/components/layout/container"
                        flexEnabled="true"
                        id="container_2_VALIDATION"
                        title="Validation Examples"
                        variant="sectionwithtitle">
                        <!-- Validation examples here -->
                    </container_2>
                    <container_3
                        jcr:primaryType="nt:unstructured"
                        sling:resourceType="typerefinery/components/layout/container"
                        flexEnabled="true"
                        id="container_3_STATES"
                        title="Component States"
                        variant="sectionwithtitle">
                        <!-- State examples (disabled, etc.) here -->
                    </container_3>
                </form>
            </container>
        </rootcontainer>
    </jcr:content>
</jcr:root>
```

### Showcase Requirements

**MANDATORY**: Showcase pages MUST include:

1. **Basic Usage Example** - Simple, default component usage
2. **Variants** - If component has variants, show each variant
3. **Configuration Options** - Show different configuration options
4. **Integration Examples** - Show component working within forms
5. **Edge Cases** - Show validation, error states, etc. (if applicable)

### Adding to Main Forms Showcase

**MANDATORY**: Update the main forms showcase page:

`tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/.content.xml`

Add your component examples to the main form:

```xml
<form
    jcr:primaryType="nt:unstructured"
    sling:resourceType="typerefinery/components/forms/form">
    <!-- Existing components... -->
    
    <!-- Add your new component example -->
    <{component}
        jcr:primaryType="nt:unstructured"
        sling:resourceType="typerefinery/components/forms/{component}"
        id="{component}_{ID}">
        <label
            jcr:primaryType="nt:unstructured"
            sling:resourceType="typerefinery/components/forms/fields/label"
            label="Your Component Label"/>
        <field
            jcr:primaryType="nt:unstructured"
            sling:resourceType="typerefinery/components/forms/fields/{component}"
            name="example_field_unique"
            inputType="text"/>
```

**CRITICAL**: Notice the `name="example_field_unique"` attribute - **ALWAYS use `name` (NOT `fieldName`)** and ensure each field has a unique, descriptive name.
    </{component}>
</form>
```

### Showcase Best Practices

**MANDATORY**: Use container components to group related examples.

1. **Container Grouping**: Always use `typerefinery/components/layout/container` with `variant="sectionwithtitle"` to group related examples
2. **Container Titles**: Use descriptive titles that clearly indicate what the grouped examples demonstrate (e.g., "Basic Input Types", "Input with Validation", "Disabled States")
3. **Container Properties**: Set `flexEnabled="true"` for responsive layout
4. **Logical Grouping**: Group examples by feature/capability:
   - Basic usage examples
   - Variant examples (if applicable)
   - Validation examples
   - State examples (disabled, required, etc.)
   - Advanced features
5. **Clear Examples**: Each example should demonstrate one feature clearly
6. **Descriptive Labels**: Use descriptive labels that explain what the example shows
7. **Complete Forms**: Include complete form examples, not just isolated components
8. **Flow Integration**: Show Flow integration when applicable
9. **Real-World Scenarios**: Include examples that reflect real-world usage patterns
10. **CRITICAL: Unique Field Names**: **MANDATORY** - Each form field MUST have a unique `name` attribute
    - **REQUIRED**: Use `name="..."` (NOT `fieldName="..."`) in showcase XML
    - **REQUIRED**: All showcase field examples must include `name="unique_field_name"` to ensure proper form submission
    - **REQUIRED**: Use descriptive, unique names (e.g., `name="input_email"`, `name="rating_1_star"`, `name="input_color_basic"`)
    - **FORBIDDEN**: Duplicate `name` values across showcase examples

**Container Pattern:**
```xml
<container_X
    jcr:primaryType="nt:unstructured"
    sling:resourceType="typerefinery/components/layout/container"
    flexEnabled="true"
    id="container_X_DESCRIPTIVE_NAME"
    title="Descriptive Section Title"
    variant="sectionwithtitle">
    <!-- Related component examples here -->
</container_X>
```

### Updating Existing Showcases

**MANDATORY**: When updating a component:

1. **MANDATORY: Update Component Showcase**: Update the dedicated component showcase page with examples demonstrating the changes
2. **MANDATORY: Update Main Showcase**: Add/update examples in main forms showcase page
3. **MANDATORY: Test Examples**: Verify all examples work correctly after changes
4. **MANDATORY: Document Changes**: Update README if component documentation changed
5. **MANDATORY: Verify Existing Examples**: Test all existing showcase examples still work correctly
6. **MANDATORY: Add New Examples**: Add examples for any new features, properties, or variants

**NO EXCEPTIONS**: Every component change MUST include showcase updates. See "MANDATORY: Showcase Updates for Component Changes" section above for details.

## Best Practices

### 1. Reuse Shared Components

- Always use shared dialog fragments
- Follow existing patterns from similar components
- Don't duplicate functionality

### 2. Naming Conventions

- Component directory: lowercase, descriptive
- Sling Model class: PascalCase, matches component name
- Module name: lowercase, matches component directory

### 3. CSS Classes

- Use Bootstrap classes where possible
- Add component-specific classes via `style.addClasses()`
- Use `componentClassNames` for wrapper, `variantClassNames` for input

### 3.1. CSS Namespacing (MANDATORY)

**CRITICAL**: All CSS selectors in component `style.css` files MUST be properly namespaced to prevent global conflicts.

**Rules:**
- **REQUIRED**: Scope all selectors to the component using `[component="{componentName}"]` attribute selector
- **REQUIRED**: Use component-prefixed class names (e.g., `.input-rating-items`, not `.rating-items`)
- **REQUIRED**: Namespace both custom classes and element selectors
- **FORBIDDEN**: Global selectors without component scope

**Pattern:**
```css
/* ✅ CORRECT: Namespaced */
[component="input"] input[type="color"].form-control-color {
  width: 3rem;
  height: calc(1.5em + 0.75rem + 2px);
  /* ... */
}

[component="input"] .input-rating-items {
  display: inline-flex;
  /* ... */
}

/* ❌ WRONG: Global selector */
input[type="color"].form-control-color {
  /* Can conflict with other components */
}

.rating-items {
  /* Global class name can conflict */
}
```

**Component Name:**
- Use the component name from `model.componentName` (e.g., `"input"`, `"button"`, `"select"`)
- This matches the `component` attribute in the HTML template

### 4. Default Values

- Always provide sensible defaults
- Use `@Default` annotation
- Set defaults in `init()` if conditional logic needed

### 5. Documentation

**MANDATORY**: All form components MUST have a `README.md` file.

**Location**: `/apps/typerefinery/components/forms/fields/{component}/README.md`

**Required Sections:**

1. **Component Overview** - Brief description of component purpose
2. **Information Section** - Component metadata including:
   - Component group, resourceType, title, description
   - **Showcase path** - REQUIRED link to showcase page
   - Local code path
   - Source repository link
   - Readme link
3. **Authoring Section** - Dialog tabs and fields documentation
4. **Variants Section** - Component variants (if applicable)

**Showcase Path Format:**

The README MUST include a showcase path in this format:

```markdown
- **Showcase**: [/typerefinery/components/forms/{component}](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/{component}::editor)
```

**Example README Template:**

```markdown
# Component

{Component Name} component

# Overview

Component description and purpose

## Information

- **group**: Typerefinery - Forms
- **sling:resourceType**: ws:Component
- **description**: Component description
- **title**: Component Title
- **sling:resourceSuperType**: typerefinery/components/forms/field
- **Vendor**: Typerefinery
- **Version**: 1.0
- **Compatibility**: CMS
- **Status**: Ready
- **Showcase**: [/typerefinery/components/forms/{component}](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/{component}::editor)
- **Local Code**: [/apps/typerefinery/components/forms/fields/{component}]
- **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/{component})
- **Readme**: [/typerefinery/components/forms/{component}/readme](https://github.com/typerefinery-ai/typerefinery-websight/blob/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/{component}/README.md)

# Authoring

Document dialog tabs and fields available for authors

## Dialog Tabs

Create a table documenting available dialog fields:

| Tab | Field Name | Default Value | Description |
|-----|------------|---------------|-------------|
| General | Field Name | - | Field description |
| ... | ... | ... | ... |

# Variants

Document component variants (if applicable)

| Name | Type | Description | Example |
|------|------|-------------|---------|
| Variant 1 | Type | Description | - |
| ... | ... | ... | ... |
```

**Reference Example:**

See `/apps/typerefinery/components/forms/fields/button/README.md` for a complete example.

### 6. Showcase Examples

- Create dedicated showcase page for each component
- **MANDATORY**: Use container components to group examples by feature/capability
- Update main forms showcase page with examples
- Include variants, configurations, and integration examples
- Test all showcase examples before committing
- **CRITICAL: Each form field MUST have a unique `name` attribute** - Use `name="..."` (NOT `fieldName="..."`) in showcase XML
- **REQUIRED**: All showcase field examples must include unique `name` attributes to ensure proper form submission

## Troubleshooting

### Component Not Appearing in Palette

- Check `group` is set to `"Typerefinery - Forms"`
- Verify `.content.json` is valid JSON
- Check component path is correct

### Template Not Rendering

- Verify Sling Model class name matches template
- Check `data-sly-use.model` path is correct
- Verify variant template exists and uses correct template name

### Dialog Not Opening

- Verify `dialog/.content.json` is valid JSON
- Check dialog path is correct
- Verify shared fragment paths exist

### Data Not Collected

- Verify `name` attribute is set on input element
- Check `data-model` attribute includes `model.jsonString`
- Verify form's `getFormData()` function is working

### Flow Integration Not Working

- Verify parent form has Flow enabled
- Check field values are included in payload
- Verify Flow template is configured correctly

## Related Documentation

- **Base Field Component**: `docs/forms/field.md`
- **Form Container**: `application/backend/src/main/resources/apps/typerefinery/components/forms/form/README.md`
- **HTL Standards**: `.cursor/rules/proj-01-htl-overview.mdc`
- **Form Component Rules**: `.cursor/rules/proj-04-form-components.mdc`
