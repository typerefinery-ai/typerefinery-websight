# Component

Checkbox component

# Overview

Boolean form control that allows single or multiple selection. Supports both standalone checkboxes (true/false) and grouped checkboxes (array of values).

## Information

- **group**: Typerefinery - Forms
- **sling:resourceType**: ws:Component
- **description**: Checkbox component
- **title**: Checkbox Field
- **sling:resourceSuperType**: typerefinery/components/forms/field
- **Vendor**: Typerefinery
- **Version**: 1.0
- **Compatibility**: CMS
- **Status**: Ready
- **Showcase**: [/typerefinery/components/forms/checkbox](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/checkbox::editor)
- **Local Code**: [/apps/typerefinery/components/forms/fields/checkbox]
- **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/checkbox)
- **Readme**: [/typerefinery/components/forms/checkbox/readme](https://github.com/typerefinery-ai/typerefinery-websight/blob/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/checkbox/README.md)

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
            <td rowspan="3">General</td>
            <td>Label</td>
            <td>-</td>
            <td>The label text for the checkbox.</td>
        </tr>
        <tr>
            <td>Field Name</td>
            <td>-</td>
            <td>The name attribute for the checkbox input. Multiple checkboxes with the same name create an array of values.</td>
        </tr>
        <tr>
            <td>Field Value</td>
            <td>-</td>
            <td>The value attribute for the checkbox. When checked, this value is submitted with the form.</td>
        </tr>
        <tr>
            <td>Validation</td>
            <td>Required</td>
            <td>false</td>
            <td>Whether the checkbox is required to be checked for form submission.</td>
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
            <td>Disable the checkbox input.</td>
        </tr>
        <tr>
            <td>Hide Label</td>
            <td>false</td>
            <td>Hide the checkbox label while keeping accessibility.</td>
        </tr>
        <tr>
            <td>Persist Color When Theme Switches</td>
            <td>false</td>
            <td>Keep checkbox color when theme switches.</td>
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
            <td>Configure events to listen to or emit (CHECKBOX_CHANGE, CHECKBOX_CLICK, etc.).</td>
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

This component supports two usage patterns:

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
            <td>Single Checkbox</td>
            <td>Boolean</td>
            <td>Standalone checkbox that returns true/false. Used for single boolean values like "I agree to terms".</td>
        </tr>
        <tr>
            <td>Multiple Checkboxes</td>
            <td>Array</td>
            <td>Multiple checkboxes with the same name attribute create an array of selected values. Used for multi-select options like "Select all that apply".</td>
        </tr>
    </tbody>
</table>

## Usage Notes

- **Single Checkbox**: Set a unique name and value. When checked, returns the value; when unchecked, returns null or empty.
- **Multiple Checkboxes**: Use the same name for all checkboxes in a group, with different values. All checked values are collected into an array.
- **Form Data Collection**: The form's `getFormData()` function automatically handles checkbox arrays when multiple checkboxes share the same name.
- **Flow Integration**: Checkbox values are automatically included in Flow payloads when the form has Flow enabled.
