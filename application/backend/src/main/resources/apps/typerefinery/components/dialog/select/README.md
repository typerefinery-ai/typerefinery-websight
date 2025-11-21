# Select Dialog Component

The `typerefinery/components/dialog/select` dialog component renders an Atlaskit-powered `<Select>` field. It supports plain options as well as grouped options (via child resources). Options can be defined inline within the dialog definition, or loaded dynamically from shared content via datasource components.

Reference: https://atlassian.design/components/select/examples

## Current Behaviour

- `select.json.html` renders `/apps/typerefinery/components/dialog/select/Select.js`.
- Options are assembled by iterating over the dialog resource children:
  - `selectitem` nodes map to simple options.
  - `selectgroup` nodes wrap nested `selectitem` nodes for grouped options.
- The React component manages:
  - Deriving the default option (`selected` flag).
  - Handling `onChange` and `onCreateOption` (when `allowCreate` is enabled).
  - Rendering through Atlaskit with menu portal to `document.body`.

### Limitations Identified

- Dialog authors must duplicate option data in every dialog using this component.
- There is no support for pulling options defined at the component level (e.g. under `/apps/.../eventactions` like the Event Actions field).
- Flow-specific dialogs (for example `flowColor` and `flowIcon`) would benefit from centrally managed option lists shared across components.

## Goal: Dynamic Option Loading

We want to replicate and extend the pattern used by `dialog/eventactions`, where the dialog widget pulls its selectable values from structured content owned by the component. This enables:

- Single source of truth for reusable lists (colours, icons, etc.).
- Cleaner dialogs without large inline option structures.
- Easier localisation or downstream automation of option lists.

## Implemented Enhancements

- **Datasource child**: The select component now supports an optional `datasource` subresource beneath the select definition that points to a loader component (e.g. `typerefinery/components/dialog/datasources/content`) responsible for fetching options.
- **Content datasource**: The `typerefinery/components/dialog/datasources/content` component uses the `DatasourceContent` Sling model to resolve paths (absolute or relative to component) and load `KeyValuePair` options from repository nodes.
- **Backward compatibility**: When no `datasource` is provided, the component preserves the current inline child behaviour so existing dialogs continue working without migration.
- **Shared content**: Reusable option lists are available under `/apps/typerefinery/components/dialog/fields/` (e.g. `color` and `icons`).
- **Visual enhancements**: The component supports `isColour` and `isIcon` props for enhanced option rendering:
  - **`isColour`**: When `true`, displays color swatches next to option labels. Expects hex color values (e.g., `#E73323`) in option `value`.
  - **`isIcon`**: When `true`, displays Font Awesome icons next to option labels. Expects icon class names (e.g., `fa fa-ad`, `fab fa-500px`) in option `value`.

## Migration Completed: Flow Container Dialog

Target file: `/apps/typerefinery/components/flow/flowcontainer/dialog/.content.json`

✅ **Completed**:
   - Shared option data created under `/apps/typerefinery/components/dialog/fields/color` and `/apps/typerefinery/components/dialog/fields/icons`.
   - Dialog fields `flowColor` and `flowIcon` updated to use the dynamic select component with datasource references pointing to shared content.
   - Backward compatibility maintained: existing inline select configurations continue to work unchanged.

## Testing & Verification Strategy

- **Unit / Integration**:
  - Add tests for datasource loaders that fetch options from the specified path, covering happy path, missing path, empty lists, and grouped structures.
- **E2E**:
  - Create or extend dialog E2E coverage to ensure options appear in the rendered select when configured via a datasource.
  - Validate authoring flow: selecting colour/icon updates the stored value; previously saved values remain selected when reopening the dialog.
- **Regression**:
  - Run existing dialog select scenarios to confirm inline option behaviour is unchanged when a datasource is not provided.

## Implementation Details

- **Path resolution**: The `DatasourceContent` model supports both absolute paths (starting with `/`) and relative paths (resolved from the component resource).
- **Option format**: Options are loaded as `KeyValuePair` objects with `key` (stored value) and `value` (display label) properties.
- **Future enhancements**: Additional datasource types (REST endpoints, Java-backed providers) can be added by creating new datasource components following the same pattern.

## Component Architecture

### File Structure
```
/apps/typerefinery/components/dialog/select/
├── select.json.html          # HTL template that renders JSON config
├── Select.js                 # React component using Atlaskit Select
├── selectitem/
│   └── selectitem.json.html  # Template for individual options
├── selectgroup/
│   └── selectgroup.json.html # Template for grouped options
└── README.md                 # This file
```

### Data Flow

1. **Dialog Definition** (`.content.json`):
   ```json
   {
     "flowColor": {
       "sling:resourceType": "typerefinery/components/dialog/select",
       "name": "flowapi_color",
       "isColour": true,
       "datasource": { ... }
     }
   }
   ```

2. **HTL Template** (`select.json.html`):
   - Reads properties from dialog resource
   - Finds datasource child (if present)
   - Renders JSON config with all props passed to React component
   - **CRITICAL**: Must pass ALL props in BOTH datasource and fallback branches

3. **React Component** (`Select.js`):
   - Receives props from HTL template
   - Uses `formatOptionLabel` to customize option rendering
   - Renders Atlaskit Select with custom formatting

## How to Extend the Select Component

### Adding New Rendering Features (e.g., isColour, isIcon)

When adding new visual features to the select component, follow this process:

#### Step 1: Update the React Component (`Select.js`)

1. **Add prop extraction in `render()` method**:
   ```javascript
   const {
     isColour,  // Add new prop here
     isIcon,    // Add new prop here
     ...otherProps
   } = this.props;
   ```

2. **Implement `formatOptionLabel` method** (or update existing):
   ```javascript
   formatOptionLabel(option, { context }) {
     const { isColour, isIcon } = this.props;
     
     // Handle grouped options
     if (option.options) {
       return option.label || '';
     }
     
     // Custom rendering logic
     if (isColour && option.value) {
       // Render color swatch
       return React.createElement("div", { ... }, ...);
     }
     
     if (isIcon && option.value) {
       // Render icon
       return React.createElement("div", { ... }, ...);
     }
     
     // Default rendering
     return option.label;
   }
   ```

3. **Pass `formatOptionLabel` to AtlaskitSelect**:
   ```javascript
   <AtlaskitSelect
     {...otherProps}
     formatOptionLabel={this.formatOptionLabel.bind(this)}
     // ... other props
   />
   ```

#### Step 2: Update HTL Template (`select.json.html`)

**CRITICAL RULE**: You MUST pass the new prop in BOTH branches (datasource and fallback):

```html
<!--/* Datasource branch */-->
<sly data-sly-test="${datasourceChild}">
  {
    "type": "/apps/typerefinery/components/dialog/select/Select.js",
    "props": {
      "name": "${properties.name}",
      "isColour": ${properties.isColour || false},  <!-- Add here -->
      "isIcon": ${properties.isIcon || false},      <!-- Add here -->
      "options": <sly data-sly-resource="..."></sly>
    }
  }
</sly>

<!--/* Fallback branch - MUST include same props */-->
<sly data-sly-test="${!datasourceChild}">
  {
    "type": "/apps/typerefinery/components/dialog/select/Select.js",
    "props": {
      "name": "${properties.name}",
      "isColour": ${properties.isColour || false},  <!-- Add here too -->
      "isIcon": ${properties.isIcon || false},      <!-- Add here too -->
      "options": [...]
    }
  }
</sly>
```

**Rules for passing props:**
- Use `${properties.propName || defaultValue}` for optional props
- Booleans: `${properties.flag || false}` (no quotes)
- Strings: `"${properties.text || ''}"` (with quotes)
- Numbers: `${properties.count || 0}` (no quotes)
- **Always use the same props in both branches**

#### Step 3: Update Dialog Definitions (`.content.json`)

Add the new property to dialog field definitions:

```json
{
  "flowColor": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "flowapi_color",
    "label": "Color",
    "isColour": true,  <!-- Add new prop here -->
    "datasource": { ... }
  }
}
```

#### Step 4: Update Documentation

1. Update this README with the new feature
2. Document the prop in component usage examples
3. Add notes about when to use the feature

### Adding New Datasource Types

To add a new datasource type (e.g., REST API, Java service):

1. **Create datasource component**:
   ```
   /apps/typerefinery/components/dialog/datasources/rest/
   ├── rest.json.html
   └── (optional) RestDatasource.java (Sling Model)
   ```

2. **Implement datasource logic**:
   - Create HTL template that renders options array
   - Optionally create Sling Model to fetch data
   - Return options in same format as `content.json.html`

3. **Update `select.json.html`**:
   - Add detection for new datasource type:
   ```html
   <sly data-sly-test="${child['sling:resourceType'] == 'typerefinery/components/dialog/datasources/rest'}">
     <!-- Handle REST datasource -->
   </sly>
   ```

4. **Document usage** in this README

### Adding New Option Properties

To add new properties to options (e.g., `description`, `disabled`):

1. **Update `selectitem.json.html`**:
   ```html
   {
     "label": "${item.label || item.key || item.value}",
     "value": "${item.value}",
     "description": "${item.description || ''}",  <!-- Add new prop -->
     "disabled": ${item.disabled || false}        <!-- Add new prop -->
   }
   ```

2. **Update React component** if needed:
   - Atlaskit Select supports many option properties natively
   - Check Atlaskit docs for supported props

3. **Update content sources**:
   - Add new properties to `.content.json` files if using datasource/content

### Testing Checklist

When extending the component:

- [ ] New prop is passed in both datasource and fallback branches
- [ ] Prop has correct fallback value (`|| false`, `|| ''`, etc.)
- [ ] React component handles prop correctly
- [ ] Feature works with both inline and datasource options
- [ ] Feature works with grouped options
- [ ] Backward compatibility maintained (existing dialogs still work)
- [ ] Documentation updated
- [ ] Examples added to README

## Quick Reference

### Common Tasks

#### Adding a new select field with color swatches
1. Add field to dialog `.content.json`:
   ```json
   "myColor": {
     "sling:resourceType": "typerefinery/components/dialog/select",
     "name": "myColor",
     "label": "Color",
     "isColour": true,
     "datasource": {
       "sling:resourceType": "typerefinery/components/dialog/datasources/content",
       "path": "/apps/typerefinery/components/dialog/fields/color"
     }
   }
   ```

#### Adding a new select field with icons
1. Add field to dialog `.content.json`:
   ```json
   "myIcon": {
     "sling:resourceType": "typerefinery/components/dialog/select",
     "name": "myIcon",
     "label": "Icon",
     "isIcon": true,
     "datasource": {
       "sling:resourceType": "typerefinery/components/dialog/datasources/content",
       "path": "/apps/typerefinery/components/dialog/fields/icons"
     }
   }
   ```

#### Creating shared option content
1. Create `.content.json` under `/apps/typerefinery/components/dialog/fields/`:
   ```json
   {
     "sling:resourceType": "nt:unstructured",
     "option1": {
       "sling:resourceType": "nt:unstructured",
       "key": "value1",
       "value": "Display Label 1"
     },
     "option2": {
       "sling:resourceType": "nt:unstructured",
       "key": "value2",
       "value": "Display Label 2"
     }
   }
   ```

2. Reference in dialog:
   ```json
   "datasource": {
     "sling:resourceType": "typerefinery/components/dialog/datasources/content",
     "path": "/apps/typerefinery/components/dialog/fields/myoptions"
   }
   ```

### Troubleshooting

**Options not appearing:**
- Check datasource path is correct (absolute or relative)
- Verify content exists at path
- Check that child nodes have `key` and `value` properties
- Review browser console for HTL errors

**Color swatches not showing:**
- Verify `isColour: true` is set in dialog definition
- Check that `isColour` prop is passed in both branches of `select.json.html`
- Ensure option values are valid hex colors (e.g., `#E73323`)

**Icons not showing:**
- Verify `isIcon: true` is set in dialog definition
- Check that `isIcon` prop is passed in both branches of `select.json.html`
- Ensure Font Awesome is loaded in the page
- Verify option values are valid Font Awesome classes (e.g., `fa fa-ad`)

**Props not working:**
- **Most common issue**: Props missing in one branch of `select.json.html`
- Always check BOTH datasource and fallback branches have the same props
- Use `${properties.prop || defaultValue}` pattern for optional props

## Inline Usage Patterns

### Simple Flat Options

```json
"flowColor": {
  "sling:resourceType": "typerefinery/components/dialog/select",
  "name": "flowapi_color",
  "label": "Card Colour",
  "description": "Choose the colour applied to Flow Designer cards.",
  "default": {
    "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
    "label": "Default",
    "value": ""
  },
  "accent": {
    "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
    "label": "Accent Red",
    "value": "#E73323"
  },
  "highlight": {
    "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
    "label": "Highlight Yellow",
    "value": "#FFFD54"
  }
}
```

Child structure:

```text
/flowColor
├── default (selectitem)  → value ""
├── accent (selectitem)   → value "accent"
└── highlight (selectitem)→ value "highlight"
```

Use this pattern when you need a straightforward list with no grouping.

- `value` is saved into content; ensure the component consuming the field supports the chosen format (e.g. hex colour strings).

### Grouped Options with Creation Support

```json
"eventName": {
        "sling:resourceType": "typerefinery/components/dialog/select",
        "name": "name",
  "allowCreate": true,
  "label": "Event Name",
  "description": "Event Name raised by the component",
  "default": {
    "sling:resourceType": "typerefinery/components/dialog/select/selectgroup",
    "label": "Default",
    "custom": {
      "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
      "label": "Custom",
      "value": ""
    }
  },
  "topic": {
    "sling:resourceType": "typerefinery/components/dialog/select/selectgroup",
    "label": "Topic",
    "create": {
      "sling:resourceType": "typerefinery/components/dialog/select/selectitem",
      "label": "Payload",
      "value": "topicpayload"
    }
  }
}
```

Grouped structure:

```text
/eventName
├── default (typerefinery/components/dialog/select/selectgroup)
│   └── custom (typerefinery/components/dialog/select/selectitem)
│       ├── label = "Custom"
│       └── value = ""
└── topic (typerefinery/components/dialog/select/selectgroup)
    └── create (typerefinery/components/dialog/select/selectitem)
        ├── label = "Payload"
        └── value = "topicpayload"
```

Each `selectgroup` wraps nested `selectitem` options. Set `allowCreate` to let authors add new values at authoring time; ensure your component logic can handle arbitrary entries.

### Datasource Subresource Pattern

The select component supports a `datasource` child beneath the select definition to load options from shared content:

```json
"flowIcon": {
  "sling:resourceType": "typerefinery/components/dialog/select",
  "name": "flowapi_icon",
  "label": "Icon",
  "description": "Optional icon class shown in Flow Designer.",
  "isIcon": true,
  "datasource": {
    "sling:resourceType": "typerefinery/components/dialog/datasources/content",
    "path": "/apps/typerefinery/components/dialog/fields/icons"
  }
}
```

**With color swatches:**
```json
"flowColor": {
  "sling:resourceType": "typerefinery/components/dialog/select",
  "name": "flowapi_color",
  "label": "Color",
  "description": "Optional colour value applied to Flow Designer cards.",
  "isColour": true,
  "datasource": {
    "sling:resourceType": "typerefinery/components/dialog/datasources/content",
    "path": "/apps/typerefinery/components/dialog/fields/color"
  }
}
```

- `path` accepts relative (`"flowIconOptions"` resolved from component) or absolute (`"/apps/typerefinery/components/dialog/fields/icons"`) repository locations.
- The `datasources/content` component reads child nodes from the specified path and adapts them to `KeyValuePair` format.
- **Visual props**: Use `isColour: true` for color swatches, `isIcon: true` for icon rendering.
- Future datasource types can be added under `typerefinery/components/dialog/datasources/*`:
  - `datasources/rest` (future) – invoke a URL/service to populate options.
  - `datasources/java` (future) – call into Sling services or models for computed lists.
- Rendering logic: if `datasource` exists and is valid, it is used; otherwise the select falls back to inline child options, preserving backward compatibility.

### Visual Enhancement Props

#### `isColour` (boolean)

When `true`, renders a color swatch next to each option label.

- **Expected format**: Option `value` should be a hex color code (e.g., `#E73323`, `#FFFD54`) or empty string for default/transparent
- **Rendering**: 20px × 20px color square with border, displayed before the label
- **Validation**: Only renders swatch if value matches hex color pattern or is empty
- **Example**:
  ```json
  {
    "flowColor": {
      "sling:resourceType": "typerefinery/components/dialog/select",
      "isColour": true,
      ...
    }
  }
  ```

#### `isIcon` (boolean)

When `true`, renders a Font Awesome icon next to each option label.

- **Expected format**: Option `value` should be a Font Awesome class (e.g., `fa fa-ad`, `fab fa-500px`, `far fa-pause-circle`)
- **Rendering**: Icon displayed before the label with appropriate sizing
- **Validation**: Only renders icon if value matches Font Awesome class pattern
- **Example**:
  ```json
  {
    "flowIcon": {
      "sling:resourceType": "typerefinery/components/dialog/select",
      "isIcon": true,
      ...
    }
  }
  ```

**Note**: Both props can be used together if needed, but typically only one is used per select field.