# Reusable Content Fields

## Overview

The **Reusable Content Fields** directory (`/apps/typerefinery/components/dialog/fields/`) contains shared option lists that can be referenced by multiple dialog fields across different components. These reusable content resources provide a centralized way to manage common option sets (like colors, icons, statuses, etc.) that are used in dialog select fields.

## Purpose

Reusable content fields enable:
- **Centralized Management**: Update options in one place, affects all usages
- **Consistency**: Ensure all components use the same option sets
- **Maintainability**: Easy to add, remove, or modify options without touching individual dialog definitions
- **Reusability**: Reference the same option list from multiple dialog fields
- **Version Control**: Track option changes in source control

## Directory Structure

```
/apps/typerefinery/components/dialog/fields/
├── color/
│   └── .content.json          # Color options (hex codes)
├── icons/
│   └── .content.json          # Icon options (Font Awesome classes)
└── README.md                  # This file
```

## Available Reusable Content

### Color Options

**Path**: `/apps/typerefinery/components/dialog/fields/color`

**Purpose**: Provides a standardized set of color options for dialog select fields.

**Structure**: Each option is a child node with:
- `key`: Hex color code (e.g., `#E73323`) or empty string for default
- `value`: Display value (typically same as key)

**Example Options**:
```json
{
  "color000": {
    "key": "",
    "value": "Default"
  },
  "color001": {
    "key": "#E73323",
    "value": "#E73323"
  },
  "color002": {
    "key": "#EC8632",
    "value": "#EC8632"
  }
}
```

**Usage**: Used with `isColour: true` prop to display color swatches in select fields.

### Icon Options

**Path**: `/apps/typerefinery/components/dialog/fields/icons`

**Purpose**: Provides a comprehensive set of Font Awesome icon options for dialog select fields.

**Structure**: Each option is a child node with:
- `key`: Icon identifier (e.g., `pause-circle`, `water`)
- `value`: Font Awesome class name (e.g., `far fa-pause-circle`, `fa fa-water`)

**Example Options**:
```json
{
  "icon1005": {
    "key": "pause-circle",
    "value": "far fa-pause-circle"
  },
  "icon1498": {
    "key": "water",
    "value": "fa fa-water"
  }
}
```

**Usage**: Used with `isIcon: true` prop to display icons in select fields.

## How It Works

### Integration with Key-Value Datasource

Reusable content fields are accessed through the **Key-Value Datasource** component:

```
Dialog Field
  └── datasource (child resource)
      ├── sling:resourceType: "typerefinery/components/dialog/datasources/keyvalue"
      └── path: "/apps/typerefinery/components/dialog/fields/color"
            │
            └── KeyValue.java (Sling Model)
                  │
                  ├── Loads child resources from path
                  ├── Adapts each child to KeyValuePair
                  └── Returns options list
                        │
                        └── keyvalue.json.html (HTL Template)
                              │
                              └── Renders JSON array of options
```

### Data Flow

1. **Dialog Definition** references reusable content via datasource
2. **Key-Value Datasource** (`KeyValue.java`) loads options from specified path
3. **HTL Template** (`content.json.html`) renders options as JSON array
4. **Select Component** receives options and displays them with visual enhancements (if configured)

## Usage Examples

### Example 1: Using Color Options

**Dialog Definition** (`.content.json`):

```json
{
  "flowColor": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "flowapi_color",
    "label": "Color",
    "description": "Optional colour value applied to Flow Designer cards.",
    "isColour": true,
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/color"
    }
  }
}
```

**Result**: Select field displays color options with color swatches next to each option.

### Example 2: Using Icon Options

**Dialog Definition** (`.content.json`):

```json
{
  "flowIcon": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "flowapi_icon",
    "label": "Icon",
    "description": "Optional icon class (for example Font Awesome) shown in Flow Designer.",
    "isIcon": true,
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/icons"
    }
  }
}
```

**Result**: Select field displays icon options with Font Awesome icons next to each option.

### Example 3: Real-World Usage (Flow Container)

**File**: `/apps/typerefinery/components/flow/flowcontainer/dialog/.content.json`

```json
{
  "flowIcon": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "flowapi_icon",
    "label": "Icon",
    "isIcon": true,
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/icons"
    }
  },
  "flowColor": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "flowapi_color",
    "label": "Color",
    "isColour": true,
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/color"
    }
  }
}
```

## Creating New Reusable Content

### Step 1: Create Content Structure

Create a new directory under `/apps/typerefinery/components/dialog/fields/`:

```
/apps/typerefinery/components/dialog/fields/
└── myoptions/
    └── .content.json
```

### Step 2: Define Options in .content.json

Create `.content.json` file with option structure:

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
  },
  "option3": {
    "sling:resourceType": "nt:unstructured",
    "key": "value3",
    "value": "Display Label 3"
  }
}
```

### Step 3: Reference in Dialog

Reference the new reusable content in dialog definitions:

```json
{
  "myField": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "name": "myField",
    "label": "My Field",
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/myoptions"
    }
  }
}
```

### Option Resource Structure

Each option must follow the `KeyValuePair` model structure:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `key` | String | Yes | The stored value when option is selected |
| `value` | String | No | The display label (falls back to `key` if not provided) |

**Node Type**: `nt:unstructured` (or any type that supports properties)

## Visual Enhancement Props

### isColour (boolean)

When `true`, displays color swatches next to option labels.

**Requirements**:
- Option `value` should be a hex color code (e.g., `#E73323`) or empty string
- Used with color options from `/apps/typerefinery/components/dialog/fields/color`

**Example**:
```json
{
  "colorField": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "isColour": true,
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/color"
    }
  }
}
```

### isIcon (boolean)

When `true`, displays Font Awesome icons next to option labels.

**Requirements**:
- Option `value` should be a Font Awesome class (e.g., `fa fa-ad`, `fab fa-500px`)
- Used with icon options from `/apps/typerefinery/components/dialog/fields/icons`

**Example**:
```json
{
  "iconField": {
    "sling:resourceType": "typerefinery/components/dialog/select",
    "isIcon": true,
    "datasource": {
      "sling:resourceType": "typerefinery/components/dialog/datasources/keyvalue",
      "path": "/apps/typerefinery/components/dialog/fields/icons"
    }
  }
}
```

## Best Practices

### 1. Naming Conventions

- **Directory Names**: Use lowercase, descriptive names (e.g., `color`, `icons`, `statuses`, `sizes`)
- **Option Node Names**: Use descriptive identifiers (e.g., `color001`, `icon1005`, `status-active`)
- **Key Values**: Use consistent formats (e.g., hex codes for colors, class names for icons)

### 2. Content Organization

- **Group Related Options**: Keep related options together (e.g., all colors in `color/`, all icons in `icons/`)
- **Logical Ordering**: Order options logically (e.g., colors by spectrum, icons by category)
- **Documentation**: Add comments or README files for complex option sets

### 3. Maintenance

- **Version Control**: Track all changes to reusable content in source control
- **Backward Compatibility**: When adding/removing options, consider impact on existing usages
- **Testing**: Test option changes across all components that use the reusable content

### 4. Reusability

- **Shared Options**: Use reusable content for options used in multiple places
- **Component-Specific**: For component-specific options, use relative paths in component structure
- **Global Options**: For global options, use absolute paths in `/apps/typerefinery/components/dialog/fields/`

## Modifying Existing Reusable Content

### Adding New Options

1. **Edit `.content.json`** file in the reusable content directory
2. **Add new option node** with `key` and `value` properties
3. **Test** in all components using the reusable content
4. **Commit** changes to source control

**Example - Adding a new color**:
```json
{
  "color020": {
    "sling:resourceType": "nt:unstructured",
    "key": "#FF0000",
    "value": "#FF0000"
  }
}
```

### Removing Options

1. **Remove option node** from `.content.json`
2. **Check for usages** - ensure no components depend on removed option
3. **Test** affected components
4. **Commit** changes

### Updating Options

1. **Modify option properties** in `.content.json`
2. **Test** all usages to ensure changes work correctly
3. **Commit** changes

**Note**: Changes to reusable content affect all components using it. Test thoroughly before committing.

## Troubleshooting

### Issue: Options Not Appearing

**Possible Causes**:
- Path is incorrect in datasource definition
- Content doesn't exist at specified path
- Child resources don't have `key` property
- Datasource not detected by select component

**Solutions**:
1. Verify path in datasource: `/apps/typerefinery/components/dialog/fields/[name]`
2. Check that `.content.json` exists and has correct structure
3. Ensure all option nodes have `key` property
4. Verify datasource resource type is correct

### Issue: Visual Enhancements Not Working

**Color Swatches Not Showing**:
- Verify `isColour: true` is set in dialog definition
- Check that option values are valid hex colors
- Ensure `isColour` prop is passed in select component template

**Icons Not Showing**:
- Verify `isIcon: true` is set in dialog definition
- Check that option values are valid Font Awesome classes
- Ensure `isIcon` prop is passed in select component template
- Verify Font Awesome CSS is loaded

### Issue: Changes Not Reflecting

**Cache Issues**:
- Clear browser cache
- Restart AEM instance (if needed)
- Check that changes are deployed correctly

**Path Issues**:
- Verify absolute path is correct
- Check for typos in path
- Ensure content is in correct location

## Related Documentation

- **Key-Value Datasource**: See `/apps/typerefinery/components/dialog/datasources/keyvalue/README.md`
- **Select Component**: See `/apps/typerefinery/components/dialog/select/README.md`
- **KeyValuePair Model**: See Java model `ai.typerefinery.websight.models.components.KeyValuePair`

## Examples in Codebase

### Flow Container Dialog

**File**: `/apps/typerefinery/components/flow/flowcontainer/dialog/.content.json`

Uses both color and icon reusable content:
- `flowColor` → `/apps/typerefinery/components/dialog/fields/color`
- `flowIcon` → `/apps/typerefinery/components/dialog/fields/icons`

### Color Options

**File**: `/apps/typerefinery/components/dialog/fields/color/.content.json`

Contains 20+ color options with hex codes, including:
- Default (empty key)
- Primary colors (red, blue, green, etc.)
- Grayscale colors (white, light gray, dark gray, etc.)

### Icon Options

**File**: `/apps/typerefinery/components/dialog/fields/icons/.content.json`

Contains 7000+ Font Awesome icon options with:
- Icon identifiers as `key`
- Font Awesome class names as `value`
- Support for all Font Awesome styles (solid, regular, brands)

## Future Enhancements

Potential additions to reusable content fields:
- **Status Options**: Common status values (active, inactive, pending, etc.)
- **Size Options**: Standard size values (small, medium, large, etc.)
- **Theme Options**: Theme identifiers for theming systems
- **Language Options**: Language codes and names
- **Country Options**: Country codes and names

## Summary

Reusable content fields provide a powerful way to centralize and manage option lists used across multiple dialog fields. By storing options in `/apps/typerefinery/components/dialog/fields/` and referencing them via the key-value datasource, you can:

- Maintain consistency across components
- Update options in one place
- Reuse option sets efficiently
- Support visual enhancements (colors, icons)
- Track changes in version control

Use reusable content for any option list that is used in multiple places or needs centralized management.

