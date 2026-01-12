# Component

File Upload component

# Overview

File upload field with client-side previews, drag-and-drop support, multiple file selection, and asynchronous upload functionality. Files are uploaded to a separate file service and referenced in form payloads.

## Information

- **group**: Typerefinery - Forms
- **sling:resourceType**: ws:Component
- **description**: File upload field with preview and drag-and-drop support
- **title**: File Upload Field
- **sling:resourceSuperType**: typerefinery/components/forms/field
- **Vendor**: Typerefinery
- **Version**: 1.0
- **Compatibility**: CMS
- **Status**: Ready
- **Showcase**: [/typerefinery/components/forms/fileupload](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/fileupload::editor)
- **Local Code**: [/apps/typerefinery/components/forms/fields/fileupload]
- **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/fileupload)
- **Readme**: [/typerefinery/components/forms/fileupload/readme](https://github.com/typerefinery-ai/typerefinery-websight/blob/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/fileupload/README.md)

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
            <td>The label text for the file upload field.</td>
        </tr>
        <tr>
            <td>Field Name</td>
            <td>-</td>
            <td>The name attribute for the file input. File URLs will be submitted under this name.</td>
        </tr>
        <tr>
            <td>Accept file types</td>
            <td>-</td>
            <td>Comma-separated list of file types to accept (e.g., "image/png, image/jpeg" or ".pdf, .doc, .docx"). Use "*" to accept all file types.</td>
        </tr>
        <tr>
            <td>General</td>
            <td>Multiple</td>
            <td>false</td>
            <td>Allow multiple file selection. When enabled, users can select multiple files at once.</td>
        </tr>
        <tr>
            <td>Validation</td>
            <td>Required</td>
            <td>false</td>
            <td>Whether at least one file is required for form submission.</td>
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
            <td>Disable the file upload input.</td>
        </tr>
        <tr>
            <td>Hide Label</td>
            <td>false</td>
            <td>Hide the file upload label while keeping accessibility.</td>
        </tr>
        <tr>
            <td>Persist Color When Theme Switches</td>
            <td>false</td>
            <td>Keep file upload styling when theme switches.</td>
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
            <td>Configure events to listen to or emit (FILEUPLOAD_CHANGE, etc.).</td>
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

This component supports file uploads with the following features:

<table style="border-spacing: 1px;border-collapse: separate;width: 100.0%;text-align: left;background-color: black; text-indent: 4px;">
    <thead style="font-size: larger;">
        <tr>
            <th style="width: 8%;">Feature</th>
            <th style="width: 8%;">Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody style="background-color: Gray;">
        <tr>
            <td>Single File Upload</td>
            <td>Single</td>
            <td>Upload one file at a time. User selects a single file from their device.</td>
        </tr>
        <tr>
            <td>Multiple File Upload</td>
            <td>Multiple</td>
            <td>Upload multiple files simultaneously. Enable "Multiple" option in dialog to allow multiple file selection.</td>
        </tr>
        <tr>
            <td>Drag and Drop</td>
            <td>Feature</td>
            <td>Support for drag-and-drop file selection. Users can drag files directly onto the upload area.</td>
        </tr>
        <tr>
            <td>File Type Filtering</td>
            <td>Feature</td>
            <td>Filter accepted file types via "Accept file types" field. Supports MIME types (image/png) or extensions (.pdf).</td>
        </tr>
        <tr>
            <td>Client-Side Preview</td>
            <td>Feature</td>
            <td>Preview uploaded files before form submission. Images show thumbnails, other files show file names.</td>
        </tr>
        <tr>
            <td>Asynchronous Upload</td>
            <td>Feature</td>
            <td>Files are uploaded asynchronously during form submission to a separate file service.</td>
        </tr>
    </tbody>
</table>

## File Upload Flow

1. **File Selection**: User selects file(s) via click or drag-and-drop
2. **Client-Side Validation**: File type and size validated before upload
3. **Preview Display**: Selected files shown with preview (images) or file name
4. **Asynchronous Upload**: Files uploaded to file service when form is submitted
5. **Payload Inclusion**: File URLs included in form payload as array (single file as single-item array)

## File Type Examples

**Accept file types** field accepts:
- MIME types: `image/png, image/jpeg, application/pdf`
- Extensions: `.pdf, .doc, .docx, .jpg, .png`
- Wildcard: `*` (accept all file types)
- Image wildcard: `image/*` (accept all image types)

## Flow Integration

File upload values are automatically included in Flow payloads when the form has Flow enabled. File URLs are uploaded asynchronously and included in the payload as an array of URLs.
