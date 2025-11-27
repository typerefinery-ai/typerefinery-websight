# File Upload Field

## Overview

**Component**: `typerefinery/components/forms/fileupload`

**Description**: File upload field with client-side previews, drag-and-drop support, multiple file selection, and asynchronous upload functionality. Files are uploaded to a separate file service and referenced in form payloads.

**Inheritance**: Extends `typerefinery/components/forms/field` via `sling:resourceSuperType`, inheriting the shared field container, dialog fragments, and Flow metadata conventions.

**Location**: `/apps/typerefinery/components/forms/fileupload/`

## Resource Type

```
typerefinery/components/forms/fileupload
```

## Features

- **Single File Upload**: Upload one file at a time
- **Multiple File Upload**: Upload multiple files simultaneously
- **Drag-and-Drop**: Support for drag-and-drop file selection
- **File Type Filtering**: Accept specific file types via `accept` attribute
- **Client-Side Preview**: Preview uploaded files before submission
- **Asynchronous Upload**: Files uploaded asynchronously during form submission
- **File Management**: Add/remove files before form submission
- **Event Support**: Supports `FILEUPLOAD_CHANGE` event
- **Flow Integration**: File URLs automatically included in form payloads
- **Bootstrap Styling**: Uses `form-control` and custom upload button styling

## Component Structure

```
/apps/typerefinery/components/forms/fileupload/
├── .content.json              # Component definition (extends field)
├── fileupload.html            # Rendering stub (uses Field model)
├── template/
│   └── .content.json          # Default template structure
└── dialog/                    # Inherits dialog from parent field
```

### Field Component

```
/apps/typerefinery/components/forms/fields/fileupload/
├── fileupload.html            # Field rendering (uses FileUpload model)
├── variant.html               # File input template with drag-and-drop
├── clientlibs/
│   ├── functions.js           # File management and event handling
│   ├── behaviour.js           # DOM initialization
│   └── style.css              # Component styling
└── dialog/
    └── .content.json          # Field dialog configuration
```

## Sling Model

**Class**: `ai.typerefinery.websight.models.components.forms.FileUpload`

**Inheritance**: Extends `BaseFormComponent`

**Key Properties**:
- `inputType`: Input type (default: "text", not used for file uploads)
- `multiple`: Boolean flag for multiple file selection
- `accept`: File type filter (e.g., "image/*", ".pdf", "*.jpg,*.png")
- `variant`: Upload variant/style
- `validationRequired`: Boolean flag for required field validation
- Inherits all properties from `BaseFormComponent`

**Default Values**:
- `id`: `"input"` (default, should be customized)
- `module`: `"input"` (default)
- `label`: `"Full Name"` (default, should be customized)
- `placeholder`: `"Type here."` (default)
- `inputType`: `"text"` (not used for file inputs)
- `multiple`: `false`
- `accept`: `"*"` (all file types)
- `validationRequired`: `false`

**CSS Classes**:
- `form-control`: Bootstrap form control styling
- `mt-1`: Margin top spacing
- `uploadButton`: Custom upload button class

## Structure & Rendering

### Default Template Structure

Default structure (`template/.content.json`) follows the standard field pattern:

```json
{
  "label": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/label",
    "label": "File Upload Label"
  },
  "field": {
    "jcr:primaryType": "nt:unstructured",
    "sling:resourceType": "typerefinery/components/forms/fields/fileupload",
    "label": "File Upload"
  }
}
```

### Rendering Flow

1. **Container Component** (`fileupload.html`):
   - Adapts `Field` Sling Model (inherits from base field)
   - Renders variant template ensuring label/field IDs remain synchronized

2. **Field Component** (`fields/fileupload/fileupload.html`):
   - Adapts `FileUpload` Sling Model
   - Wraps variant template in component container

3. **Variant Template** (`variant.html`):
   - Renders `<input type="file">` with drag-and-drop support
   - Includes upload button/label with icon
   - Adds error display area (`#error`)
   - Adds image preview area (`#image-display`)
   - Sets `isInput="true"` attribute for form data collection

## Authoring Dialog

The file upload component inherits the shared dialog from the base field:

- **General** fragment (`forms/form/common/.content.json`) supplies:
  - Label
  - Title
  - Name (field name for form submission)
  - Value (not typically used for file uploads)
  - Default Value
  - Placeholder
- **Style**, **Grid**, **Alignment** tabs via common includes
- **Events** tab for event configuration (if enabled)
- Flow metadata configured on parent form container

### Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Field name (used for form submission) |
| `label` | String | No | Display label for the file upload field (default: "Full Name") |
| `multiple` | Boolean | No | Enable multiple file selection (default: `false`) |
| `accept` | String | No | File type filter (e.g., "image/*", ".pdf") (default: "*" for all types) |
| `required` | Boolean | No | Whether field is required (default: `false`) |
| `disabled` | Boolean | No | Whether field is disabled (default: `false`) |
| `variant` | String | No | Upload variant/style |

## File Type Filtering

The `accept` property filters allowed file types:

### Common Accept Values

| Value | Description | Example |
|-------|-------------|---------|
| `"*"` | All file types (default) | Any file |
| `"image/*"` | All image types | jpg, png, gif, svg, webp |
| `".pdf"` | Specific extension | PDF files only |
| `".pdf,.doc,.docx"` | Multiple extensions | PDF, Word documents |
| `"application/pdf"` | MIME type | PDF files |
| `"video/*"` | All video types | mp4, avi, mov |
| `"audio/*"` | All audio types | mp3, wav, ogg |

### Examples

```html
<!-- Images only -->
<typerefinery:fileupload name="photo" label="Photo" accept="image/*" />

<!-- PDF only -->
<typerefinery:fileupload name="document" label="Document" accept=".pdf" />

<!-- Multiple file types -->
<typerefinery:fileupload name="attachment" label="Attachment" accept=".pdf,.doc,.docx" />
```

## Usage Patterns

### Single File Upload

Basic single file upload:

```html
<typerefinery:fileupload name="photo" label="Photo" accept="image/*" />
```

**Output**:
```json
{
  "photo": ["https://files.typerefinery.localhost:8101/api/path/to/file.jpg"]
}
```

### Multiple File Upload

Multiple file selection:

```html
<typerefinery:fileupload name="attachments" label="Attachments" multiple="true" />
```

**Output**:
```json
{
  "attachments": [
    "https://files.typerefinery.localhost:8101/api/path/to/file1.pdf",
    "https://files.typerefinery.localhost:8101/api/path/to/file2.pdf"
  ]
}
```

### Required File Upload

Required file upload:

```html
<typerefinery:fileupload name="resume" label="Resume" accept=".pdf,.doc,.docx" required="true" />
```

**Output** (if file uploaded):
```json
{
  "resume": ["https://files.typerefinery.localhost:8101/api/path/to/resume.pdf"]
}
```

**Output** (if no file):
```json
{
  "resume": ""
}
```

## Client-Side Behavior

### File Management

The file upload component manages files in a client-side Map:

#### `addFile($component, file)`

Adds a file to the upload queue:

```javascript
const fileId = Typerefinery.Components.Forms.Fileupload.addFile($component, file);
```

**Behavior**:
- Files are stored in `$component[0].files` Map
- Each file gets a unique ID
- Triggers `FILEUPLOAD_CHANGE` event if events enabled
- Returns file ID for tracking

#### `removeFile($component, id)`

Removes a file from the upload queue:

```javascript
Typerefinery.Components.Forms.Fileupload.removeFile($component, fileId);
```

**Behavior**:
- Removes file from internal Map
- Updates UI (removes preview, etc.)
- Triggers `FILEUPLOAD_CHANGE` event if events enabled

### File Upload Process

During form submission, files are uploaded asynchronously:

1. **File Collection**: Form collects all files from `$component[0].files` Map
2. **Upload Loop**: Each file is uploaded individually
3. **Upload Service**: Files uploaded via `Typerefinery.Page.Files.uploadFile(file)`
4. **URL Generation**: Upload service returns preview URL for uploaded file
5. **Payload Assembly**: File URLs are added to form payload as array

### Upload Service

Files are uploaded to a separate file service:

**Service**: `Typerefinery.Page.Files`

**Upload Method**: `uploadFile(file)`

**URL Structure**:
```
https://files.typerefinery.localhost:8101/api/{page-path}/{date-time}/{filename}
```

**Process**:
1. Create date-based folder structure
2. Upload file to service
3. Return preview URL for uploaded file

### Form Integration

In the form's `getFormData()` function, file upload fields are processed as follows:

```javascript
// Check if file upload component
const $parentContainer = $input.closest(Typerefinery.Components.Forms.Fileupload.selectorComponent);
if ($parentContainer.length > 0) {
    const files = $parentContainer[0].files;
    if (files && files.size > 0) {
        result[name] = [];
        // Upload each file and collect URLs
        for (let [fileId, file] of files.entries()) {
            const output = await filesNs.uploadFile(file);
            result[name].push(output);
        }
    } else {
        result[name] = "";
    }
}
```

**Key Behavior**:
- Files are uploaded asynchronously during form submission
- File URLs are collected in an array
- Empty file fields return empty string `""`
- Multiple files result in array of URLs

## Event Support

The file upload component supports the following events:

### FILEUPLOAD_CHANGE

Fired when files are added or removed.

**Event Data**:
```javascript
{
  type: "FILEUPLOAD_CHANGE",
  value: "filename.jpg",
  type: "image/jpeg",
  id: "file-id",
  action: "add"  // or "remove"
}
```

### Event Configuration

Configure events in the dialog's **Events** tab:

```json
{
  "events": [
    {
      "topic": "form-fileupload",
      "type": "emit",
      "name": "FILEUPLOAD_CHANGE",
      "action": "FILEUPLOAD_CHANGE"
    }
  ]
}
```

## Flow Integration

### Automatic Inclusion

When Flow API is enabled:

- File URLs are automatically included in form payloads
- Single file upload returns array with one URL
- Multiple file upload returns array with multiple URLs
- Empty file upload returns empty string
- Flow metadata is inherited from parent form container

### Payload Structure

**Single File Upload**:
```json
{
  "photo": ["https://files.typerefinery.localhost:8101/api/path/to/photo.jpg"]
}
```

**Multiple File Upload**:
```json
{
  "attachments": [
    "https://files.typerefinery.localhost:8101/api/path/to/file1.pdf",
    "https://files.typerefinery.localhost:8101/api/path/to/file2.pdf"
  ]
}
```

**No Files Uploaded**:
```json
{
  "attachments": ""
}
```

## File Upload Service

### Service Configuration

The file upload service is configured via `Typerefinery.Page.Files`:

**Base URL**: `https://files.typerefinery.localhost:8101`

**Endpoints**:
- `POST /api/{path}?type=CREATE_FOLDER` - Create folder structure
- `POST /api/{path}/{filename}` - Upload file

### URL Generation

File URLs follow this pattern:

```
https://files.typerefinery.localhost:8101/api{page-path}/{YYYY-MM-DD}/{HH-MM-SS}/{filename}
```

**Example**:
```
https://files.typerefinery.localhost:8101/api/content/showcase/page/2024-01-15/14-30-45/document.pdf
```

**Features**:
- Date-based folder structure for organization
- Time-based subfolder for uniqueness
- Filename with sanitized spaces (replaced with dashes)

## Bootstrap Styling

The file upload component uses Bootstrap form-control classes:

### Input Classes

- `form-control`: Bootstrap form control styling
- `mt-1`: Margin top spacing
- `uploadButton`: Custom upload button class

### HTML Structure

```html
<div class="form-group">
  <label for="fileupload-id">File Upload</label>
  <div component="fileupload" id="fileupload-id">
    <input type="file" class="form-control mt-1 uploadButton" 
      id="fileupload-id-name" 
      name="attachment" 
      accept="*" />
    <label for="fileupload-id-name">
      <i class="pi pi-upload"></i>&nbsp;Choose Or Drop File(s)
    </label>
    <div id="error"></div>
    <div id="image-display"></div>
  </div>
</div>
```

## Best Practices

### 1. File Type Filtering

- Always specify `accept` attribute for better UX
- Use appropriate MIME types or extensions
- Test file type validation

### 2. Multiple Files

- Enable `multiple` only when multiple files are needed
- Consider file size limits for multiple uploads
- Provide clear feedback for upload progress

### 3. File Size Limits

- Implement server-side file size validation
- Warn users about large files
- Consider chunked uploads for very large files

### 4. Security

- Validate file types on server side
- Scan uploaded files for malware
- Limit file size to prevent abuse
- Sanitize filenames

### 5. User Experience

- Provide clear upload instructions
- Show upload progress
- Display preview for images
- Allow file removal before submission

## Troubleshooting

### Files Not Uploading

**Possible Causes**:
- File service not accessible
- Network errors during upload
- File size too large
- File type not accepted

**Solutions**:
1. Check file service URL is correct
2. Verify network connectivity
3. Check file size limits
4. Verify `accept` attribute matches file type
5. Check browser console for upload errors

### Files Not in Form Payload

**Possible Causes**:
- Files not added to component Map
- Form submission before upload completes
- File upload component not detected

**Solutions**:
1. Verify files are added via `addFile()` method
2. Check form waits for async uploads
3. Verify file upload component is properly initialized
4. Check `$component[0].files` Map exists

### Preview Not Showing

**Possible Causes**:
- Image preview not implemented
- File type not previewable
- Preview area not configured

**Solutions**:
1. Check preview implementation in variant template
2. Verify file type supports preview (images)
3. Check `#image-display` div exists

### Drag-and-Drop Not Working

**Possible Causes**:
- Drag-and-drop not initialized
- JavaScript errors
- Browser compatibility issues

**Solutions**:
1. Check drag-and-drop handlers are registered
2. Verify JavaScript is loaded
3. Test in different browsers
4. Check browser console for errors

## Related Components

- **Field Container**: `typerefinery/components/forms/field` - Base field component
- **Form Container**: `typerefinery/components/forms/form` - Parent form component
- **File Service**: `Typerefinery.Page.Files` - File upload service

## Key Files

- **Component Definition**: `/apps/typerefinery/components/forms/fileupload/.content.json`
- **Default Template**: `/apps/typerefinery/components/forms/fileupload/template/.content.json`
- **Rendering Stub**: `/apps/typerefinery/components/forms/fileupload/fileupload.html`
- **Field Component**: `/apps/typerefinery/components/forms/fields/fileupload/`
- **Sling Model**: `ai.typerefinery.websight.models.components.forms.FileUpload`
- **Client Libraries**: `/apps/typerefinery/components/forms/fields/fileupload/clientlibs/`
- **File Service**: `/apps/typerefinery/components/structure/page/clientlibs-header/files/functions.js`

## References

- **Base Field Container**: `docs/forms/field.md`
- **Form Container**: `docs/forms/form.md` (if exists)
- **Component README**: `/apps/typerefinery/components/forms/fileupload/README.md`
- **Bootstrap Form Control**: https://getbootstrap.com/docs/5.3/forms/form-control/


