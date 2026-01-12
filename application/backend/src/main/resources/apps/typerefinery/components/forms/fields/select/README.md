# Component

Select component

# Overview

Dropdown selection field supporting single and multiple selection, search/filter, dynamic option loading, and advanced selection features. Uses Choices.js library for enhanced functionality.

## Information

- **group**: Typerefinery - Forms
- **sling:resourceType**: ws:Component
- **description**: Select component for Typerefinery
- **title**: Select Field
- **sling:resourceSuperType**: typerefinery/components/forms/field
- **Vendor**: Typerefinery
- **Version**: 1.0
- **Compatibility**: CMS
- **Status**: Ready
- **Showcase**: [/typerefinery/components/forms/select](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/select::editor)
- **Local Code**: [/apps/typerefinery/components/forms/fields/select]
- **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/select)
- **Readme**: [/typerefinery/components/forms/select/readme](https://github.com/typerefinery-ai/typerefinery-websight/blob/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/select/README.md)

# Authoring

Following section covers authoring features

## Dialog Tabs

These fields are available for input by the authors. These fields are used in templates

<table style="border-spacing: 1px;border-collapse: separate;width: 100.0%;text-align: left;background-color: black; text-indent: 4px;">
    <thead style="font-size: larger;">
        <tr>
            <th style="width: 8%;">Tab</th>
            <th style="width: 8%;">Field Name</th>
            <th style="width: 8%;">Default Value</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody style="background-color: gray;">
        <tr>
            <td rowspan="4">General</td>
            <td>Label</td>
            <td>-</td>
            <td>The label text for the select field.</td>
        </tr>
        <tr>
            <td>Field Name</td>
            <td>-</td>
            <td>The name attribute for the select input. Used for form submission.</td>
        </tr>
        <tr>
            <td>Placeholder</td>
            <td>-</td>
            <td>Placeholder text displayed when no option is selected.</td>
        </tr>
        <tr>
            <td>Add Options</td>
            <td>-</td>
            <td>Add inline options with Label and Value pairs. If option endpoint is mentioned, options will be read from datasource instead.</td>
        </tr>
        <tr>
            <td rowspan="3">Options</td>
            <td>Read options from data source</td>
            <td>-</td>
            <td>URL/path to load options dynamically. The data source must be a JSON array of objects with label and value properties.</td>
        </tr>
        <tr>
            <td>Key name in option list</td>
            <td>-</td>
            <td>Property name to use as option value when loading from datasource (default: "value").</td>
        </tr>
        <tr>
            <td>Label name in option list</td>
            <td>-</td>
            <td>Property name to use as option label when loading from datasource (default: "label").</td>
        </tr>
        <tr>
            <td rowspan="3">Advanced</td>
            <td>Multiple Select</td>
            <td>false</td>
            <td>Enable multiple selection. When enabled, users can select multiple options and output is an array.</td>
        </tr>
        <tr>
            <td>Max Selections</td>
            <td>-</td>
            <td>Maximum number of selections allowed (only applies when Multiple Select is enabled).</td>
        </tr>
        <tr>
            <td>Default Selected Options</td>
            <td>-</td>
            <td>Comma-separated list of values to be selected by default.</td>
        </tr>
        <tr>
            <td>Validation</td>
            <td>Required</td>
            <td>false</td>
            <td>Whether at least one option must be selected for form submission.</td>
        </tr>
        <tr>
            <td rowspan="4">Style</td>
            <td>Class name</td>
            <td>-</td>
            <td>Add custom CSS classes.</td>
        </tr>
        <tr>
            <td>Disabled</td>
            <td>false</td>
            <td>Disable the select field.</td>
        </tr>
        <tr>
            <td>Hide Label</td>
            <td>false</td>
            <td>Hide the select label while keeping accessibility.</td>
        </tr>
        <tr>
            <td>Persist Color When Theme Switches</td>
            <td>false</td>
            <td>Keep select styling when theme switches.</td>
        </tr>
        <tr>
            <td rowspan="4">Grid</td>
            <td>Width - S breakpoint</td>
            <td>12 Col</td>
            <td>S - Large Screen Break Points will be applicable to screens larger than 576px.</td>
        </tr>
        <tr>
            <td>Width - M breakpoint</td>
            <td>12 Col</td>
            <td>M - Large Screen Break Points will be applicable to screens larger than 768px.</td>
        </tr>
        <tr>
            <td>Width - L breakpoint</td>
            <td>12 Col</td>
            <td>L - Large Screen Break Points will be applicable to screens larger than 992px.</td>
        </tr>
        <tr>
            <td>Text Alignment</td>
            <td>Default</td>
            <td>Contains alignment of the text.</td>
        </tr>
        <tr>
            <td>Events</td>
            <td>Events</td>
            <td>-</td>
            <td>Configure events to listen to or emit (SELECT_CHANGE, SELECT_ITEM_ADD, SELECT_ITEM_REMOVE, etc.).</td>
        </tr>
        <tr>
            <td>Aria</td>
            <td>Aria attributes</td>
            <td>-</td>
            <td>Configure accessibility attributes (aria-label, aria-describedby, etc.).</td>
        </tr>
    </tbody>
</table>

# Variants

This component supports two selection modes:

<table style="border-spacing: 1px;border-collapse: separate;width: 100.0%;text-align: left;background-color: black; text-indent: 4px;">
    <thead style="font-size: larger;">
        <tr>
            <th style="width: 8%;">Name</th>
            <th style="width: 8%;">Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody style="background-color: Gray;">
        <tr>
            <td>Single Select</td>
            <td>Single</td>
            <td>Traditional dropdown with single option selection. Returns a single string value.</td>
        </tr>
        <tr>
            <td>Multiple Select</td>
            <td>Multiple</td>
            <td>Multi-select dropdown with array output. Users can select multiple options. Returns an array of selected values.</td>
        </tr>
    </tbody>
</table>

## Option Sources

Options can be provided in two ways:

1. **Inline Options**: Add options directly in the dialog via "Add Options" multifield
2. **Datasource Options**: Load options dynamically from a URL/endpoint via "Read options from data source"

**Datasource Format**: The datasource must return a JSON array of objects:

```json
[
  {"label": "Option 1", "value": "opt1"},
  {"label": "Option 2", "value": "opt2"}
]
```

Use "Key name in option list" and "Label name in option list" to customize which properties are used when the datasource structure differs.

## Output Format

**Single Select**:
```json
{
  "fieldName": "selectedValue"
}
```

**Multiple Select**:
```json
{
  "fieldName": ["value1", "value2", "value3"]
}
```

## Choices.js Integration

The select component uses Choices.js library for enhanced functionality:
- Search/filter options
- Better styling and UX
- Keyboard navigation
- Touch support
- Accessibility features

## Flow Integration

Select field values are automatically included in Flow payloads when the form has Flow enabled. Single select returns a string, multiple select returns an array of strings.
