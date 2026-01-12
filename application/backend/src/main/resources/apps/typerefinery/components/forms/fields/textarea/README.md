# Component

Textarea component

# Overview

Multi-line text input field for longer text content. Supports rows configuration, placeholder text, and validation. Used for comments, messages, descriptions, and other multi-line text input.

## Information

- **group**: Typerefinery - Forms
- **sling:resourceType**: ws:Component
- **description**: Textarea form field component
- **title**: Textarea Field
- **sling:resourceSuperType**: typerefinery/components/forms/field
- **Vendor**: Typerefinery
- **Version**: 1.0
- **Compatibility**: CMS
- **Status**: Ready
- **Showcase**: [/typerefinery/components/forms/textarea](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/textarea::editor)
- **Local Code**: [/apps/typerefinery/components/forms/fields/textarea]
- **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/textarea)
- **Readme**: [/typerefinery/components/forms/textarea/readme](https://github.com/typerefinery-ai/typerefinery-websight/blob/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/textarea/README.md)

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
            <td>The label text for the textarea field.</td>
        </tr>
        <tr>
            <td>Field Name</td>
            <td>-</td>
            <td>The name attribute for the textarea. Used for form submission.</td>
        </tr>
        <tr>
            <td>Placeholder</td>
            <td>-</td>
            <td>Placeholder text displayed in the textarea when empty.</td>
        </tr>
        <tr>
            <td>Validation</td>
            <td>Required</td>
            <td>false</td>
            <td>Whether the textarea is required for form submission.</td>
        </tr>
        <tr>
            <td rowspan="4">Style</td>
            <td>Class name</td>
            <td>-</td>
            <td>Add custom CSS classes.</td>
        </tr>
        <tr>
            <td>Rows</td>
            <td>3</td>
            <td>Number of visible text lines (controls textarea height).</td>
        </tr>
        <tr>
            <td>Disabled</td>
            <td>false</td>
            <td>Disable the textarea input.</td>
        </tr>
        <tr>
            <td>Hide Label</td>
            <td>false</td>
            <td>Hide the textarea label while keeping accessibility.</td>
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
            <td>Configure events to listen to or emit (TEXTAREA_CHANGE, etc.).</td>
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

This component does not have variants. It renders as a standard HTML `<textarea>` element.

## Usage Notes

- **Multi-line Text**: Use for longer text content that requires multiple lines (comments, messages, descriptions)
- **Rows Configuration**: Set the number of visible rows to control the textarea height
- **Auto-resize**: Browser handles textarea resizing; users can manually resize by dragging the corner
- **Character Limits**: Can be combined with validation rules to set maximum character limits
- **Form Data Collection**: Textarea values are automatically collected by the form's `getFormData()` function
- **Value Handling**: Returns the text content as a string, preserving line breaks

## Output Format

**Textarea Value**:
```json
{
  "fieldName": "Multi-line\ntext content\nwith line breaks"
}
```

Line breaks are preserved in the submitted value.

## Flow Integration

Textarea values are automatically included in Flow payloads when the form has Flow enabled. The textarea content is submitted as a string with line breaks preserved.
