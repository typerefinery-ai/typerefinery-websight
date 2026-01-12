# Field Container

## Overview
- **Component**: `typerefinery/components/forms/field`
- **Role**: Core building block for all leaf form inputs. Not usually authored directly; instead other components inherit it via `sling:resourceSuperType`.
- **Definition**: `.content.json` marks it as `isContainer: true`, grouped under `.hidden`, so it appears only as a base class.

## Sling Model (`Field`)
- Class: `ai.typerefinery.websight.models.components.forms.Field`.
- Responsibilities:
  - Sets `module = "field"` for client bootstrapping.
  - Adds standard Bootstrap classes (`form-group`, optional flex layout, `mb-3` spacing).
  - Resolves `labelId` / `fieldId` by inspecting `label` and `field` child nodes, guaranteeing `<label for>` links remain unique even after duplication.
  - Supports optional flex layout via the `flexEnabled` property.

## Authoring Fragment
- Shared controls live in `forms/form/common/.content.json` and are embedded by inheriting components:
  - Label (`label`)
  - Title (`title`)
  - Name (`name`)
  - Value (`value`)
  - Default Value (`defaultvalue`)
  - Placeholder (`placeholder`)
- The field dialog (`dialog/.content.json`) only pulls in **Style**, **Grid**, **Alignment** tabs; specific widgets come from the shared fragment.
- Select fields support datasource integration via the Key-Value Datasource component for loading options from repository nodes (see `docs/dialog/datasource-keyvalue.md`).

## Rendering
- `field.html` adapts the model, while `variant.html` renders markup for both the label and field wrapper.
- Child components (checkbox, input, select, etc.) supply their own template nodes but allow the base variant to handle layout, IDs, and CSS classes.

## Flow & Client Integration
- Because all field variants extend this component, Flow metadata and payload behaviour are centralised:
  - Flow configuration (enablement, metadata fields) lives on the parent form.
  - The form client library relies on marker attributes (e.g., `isInput`) placed by child templates, but the Field model ensures structural consistency.
  - Duplicate detection and hint overlays (in `functions.js` / `style.css`) target the wrappers supplied by this base component.

## Key Files
- Component definition: `forms/field/.content.json`
- Dialog: `forms/field/dialog/.content.json`
- Templates: `forms/field/field.html`, `forms/field/variant.html`
- Shared fragment: `forms/form/common/.content.json`

## Developer Guide

### Creating New Form Field Components

When creating a new form field component, follow these patterns:

#### 1. Component Definition

Create `.content.json` in `/apps/typerefinery/components/forms/fields/{component}/`:

```json
{
  "isContainer": false,
  "group": "Typerefinery - Forms",
  "sling:resourceType": "ws:Component",
  "sling:resourceSuperType": "typerefinery/components/forms/field",
  "description": "Component description",
  "title": "Component Title"
}
```

**Key Requirements:**
- `sling:resourceSuperType` MUST be `"typerefinery/components/forms/field"`
- `group` MUST be `"Typerefinery - Forms"` to appear in form palette

#### 2. Sling Model

Create Java class extending `BaseFormComponent`:

```java
@Model(adaptables = {Resource.class, SlingHttpServletRequest.class}, defaultInjectionStrategy = OPTIONAL)
@Exporter(name = "jackson", extensions = "json")
public class YourComponent extends BaseFormComponent {
    
    protected static final String DEFAULT_MODULE = "yourcomponent";
    
    @Override
    @PostConstruct
    protected void init() {
        this.module = DEFAULT_MODULE;
        super.init();
        style.addClasses("form-control");
    }
}
```

**Key Requirements:**
- Extend `ai.typerefinery.websight.models.components.forms.BaseFormComponent`
- Override `init()`, call `super.init()` first
- Set `this.module` to component-specific module name

#### 3. Templates

**Main template (`{component}.html`):**
```html
<sly data-sly-use.model="ai.typerefinery.websight.models.components.forms.YourComponent">
  <div class="${model.componentClassNames}"> 
    <sly data-sly-use.template="./variant.html" data-sly-call="${template.variant @ model=model}">
    </sly>
  </div>
</sly>
```

**Variant template (`variant.html`):**
```html
<template data-sly-template.variant="${ @ model }">
  <input 
    component="${model.componentName}"
    id="${model.id}" 
    name="${model.name}"
    value="${model.value}"
    data-fieldId="${model.parentFieldId}" 
    class="${model.variantClassNames}"
    data-model="${model.jsonString}"
  />
</template>
```

#### 4. Dialog Configuration

Use shared fragments from `/apps/typerefinery/components/forms/form/common/`:

- `fieldName` - Field name input
- `placeholder` - Placeholder text
- `fieldValue` - Default value
- `label` - Label text

Include standard tabs: General, Events, Validation, Grid, Style, Aria

#### 5. Integration

- **Form Data Collection**: Automatic via `name` attribute and `data-model` attribute
- **Flow API**: Automatic when parent form has Flow enabled
- **Event System**: Configure in dialog's `eventTab`

#### 6. Component README

**MANDATORY**: Create `README.md` file in component directory:

**Location**: `/apps/typerefinery/components/forms/fields/{component}/README.md`

**Required Content:**
- Component overview and description
- **Showcase path** - Link to component showcase page (REQUIRED)
- Component metadata (group, resourceType, etc.)
- Authoring documentation (dialog tabs and fields)
- Variants documentation (if applicable)

**Showcase Path Format:**
```markdown
- **Showcase**: [/typerefinery/components/forms/{component}](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/{component}::editor)
```

See `/apps/typerefinery/components/forms/fields/button/README.md` for a complete example.

### Showcase Examples

**REQUIRED**: When creating a new form component, create showcase examples:

1. **Component Showcase Page**: `tests/content/.../forms/{component}/.content.xml`
   - Demonstrates component features, variants, and configurations
   - Shows integration with forms
   - Includes real-world usage examples

2. **Main Forms Showcase**: Update `tests/content/.../forms/.content.xml`
   - Add component examples to main showcase page
   - Include in comprehensive form demonstrations

### Complete Documentation

For comprehensive developer guide with detailed examples, see:
- **Developer Guide**: `docs/forms/developer-guide.md` - Complete step-by-step guide including showcase examples
- **Component Rules**: `.cursor/rules/proj-04-form-components.mdc` - Development standards

## Related Documentation
- **Developer Guide**: `docs/forms/developer-guide.md` - Complete guide for creating new form components
- **Composite Field**: `docs/forms/composite.md` - Container field for grouping multiple inputs
- **Checkbox Field**: `docs/forms/checkbox.md` - Boolean and multi-select checkbox field
- **Input, Select, etc.**: See sibling documentation
- **Key-Value Datasource**: `docs/dialog/datasource-keyvalue.md` - For select fields with dynamic options

