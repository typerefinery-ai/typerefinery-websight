# Component

Radio component

# Overview

Radio button component that renders a set of mutually exclusive options. Only one option can be selected at a time within a radio group (all radio buttons with the same `name` attribute form a group).

## Information

- **group**: Typerefinery - Forms
- **sling:resourceType**: ws:Component
- **description**: Radio component for Typerefinery
- **title**: Radio Field
- **sling:resourceSuperType**: typerefinery/components/forms/field
- **Vendor**: Typerefinery
- **Version**: 1.0
- **Compatibility**: CMS
- **Status**: Ready
- **Showcase**: [/typerefinery/components/forms/radiobutton](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/radiobutton::editor)
- **Local Code**: [/apps/typerefinery/components/forms/fields/radio]
- **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/radio)
- **Readme**: [/typerefinery/components/forms/radio/readme](https://github.com/typerefinery-ai/typerefinery-websight/blob/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/radio/README.md)

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
            <td>The label text for this radio option.</td>
        </tr>
        <tr>
            <td>Field Name</td>
            <td>-</td>
            <td>The name attribute for the radio input. <strong>MUST be the same for all options in a radio group</strong>.</td>
        </tr>
        <tr>
            <td>Field Value</td>
            <td>-</td>
            <td>The value attribute for this radio option. When selected, this value is submitted with the form.</td>
        </tr>
        <tr>
            <td>Default Value</td>
            <td>-</td>
            <td>The value that should be pre-selected. Must match one of the radio option values.</td>
        </tr>
        <tr>
            <td>Validation</td>
            <td>Required</td>
            <td>false</td>
            <td>Whether at least one option in the radio group must be selected for form submission.</td>
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
            <td>Disable this specific radio option.</td>
        </tr>
        <tr>
            <td>Hide Label</td>
            <td>false</td>
            <td>Hide the radio label while keeping accessibility.</td>
        </tr>
        <tr>
            <td>Persist Color When Theme Switches</td>
            <td>false</td>
            <td>Keep radio styling when theme switches.</td>
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
            <td>Configure events to listen to or emit (RADIO_CHANGE, etc.).</td>
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

This component does not have variants. It renders as a standard HTML `<input type="radio">` element.

## Usage Notes

**Radio Groups**: Create a radio group by adding multiple radio components with the same `name` attribute:

- **Option 1**: `name="gender"`, `label="Male"`, `value="male"`
- **Option 2**: `name="gender"`, `label="Female"`, `value="female"`
- **Option 3**: `name="gender"`, `label="Other"`, `value="other"`

**Output Format**: Radio groups return a single selected value (not an array):

```json
{
  "gender": "male"
}
```

**Key Requirements**:
- All radio buttons in a group MUST have the same `name` attribute
- Each radio button MUST have a unique `value` attribute
- Only one option can be selected at a time within a group
- The selected value is returned as a string (not array)

**Form Data Collection**: The form's `getFormData()` function automatically handles radio groups and returns the selected value as a single string.

## Flow Integration

Radio field values are automatically included in Flow payloads when the form has Flow enabled. The selected value is submitted as a string.
