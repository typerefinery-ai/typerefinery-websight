# Component

Label component

# Overview

Standalone label component for form fields. Provides label text that can be associated with form inputs via the `for` attribute. Useful when you need a label that is not directly part of a field component structure.

## Information

- **group**: Typerefinery - Forms
- **sling:resourceType**: ws:Component
- **description**: Label for fields
- **title**: Label Field
- **sling:resourceSuperType**: typerefinery/components/forms/field
- **Vendor**: Typerefinery
- **Version**: 1.0
- **Compatibility**: CMS
- **Status**: Ready
- **Showcase**: [/typerefinery/components/forms/forms-test](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/forms-test::editor)
- **Local Code**: [/apps/typerefinery/components/forms/fields/label]
- **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/label)
- **Readme**: [/typerefinery/components/forms/label/readme](https://github.com/typerefinery-ai/typerefinery-websight/blob/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/label/README.md)

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
            <td>The label text to display.</td>
        </tr>
        <tr>
            <td>For ID</td>
            <td>-</td>
            <td>The ID of the form element this label is associated with. If this label is part of a field component structure, it will be generated automatically.</td>
        </tr>
        <tr>
            <td>Hide Label</td>
            <td>false</td>
            <td>Hide the label visually while keeping it accessible for screen readers.</td>
        </tr>
        <tr>
            <td rowspan="4">Style</td>
            <td>Class name</td>
            <td>-</td>
            <td>Add custom CSS classes.</td>
        </tr>
        <tr>
            <td>Text Alignment</td>
            <td>Default</td>
            <td>Alignment of the label text.</td>
        </tr>
        <tr>
            <td>Border Enabled</td>
            <td>false</td>
            <td>Enable border styling.</td>
        </tr>
        <tr>
            <td>Persist Color When Theme Switches</td>
            <td>false</td>
            <td>Keep label styling when theme switches.</td>
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
    </tbody>
</table>

# Variants

This component does not have variants. It renders as a standard HTML `<label>` element.

## Usage Notes

- **Standalone Labels**: Use this component when you need a label that is not directly part of a field component structure
- **Accessibility**: The `for` attribute automatically links the label to the associated form element for accessibility
- **Hidden Labels**: Use "Hide Label" option to hide the label visually while keeping it accessible for screen readers
- **Field Integration**: Most form field components include labels automatically via the base field component's variant template. Use this standalone label component only when needed for special layouts or structures.

## Flow Integration

Label components do not contribute values to form payloads. They are presentation-only components for accessibility and user guidance.
