# File Upload Field

## Overview
- **Component**: `typerefinery/components/forms/fileupload`
- **Purpose**: Provides rich file upload support within Flow-enabled forms, including client-side previews and asynchronous uploads.
- **Inheritance**: Extends the shared field container, so it inherits standard label/name configuration and Flow metadata.

## Authoring Dialog
- Uses the base field dialog plus file-specific options (e.g., allowed types, size limits) defined in the component’s dialog.
- Includes common **Style**, **Grid**, and **Alignment** tabs via shared includes.

## Flow & Client Behaviour
- The form client library (`functions.js`) detects inputs of `type="file"` and collaborates with `Typerefinery.Components.Forms.Fileupload` to:
  - Manage staged files in an internal map.
  - Upload files asynchronously via `Typerefinery.Page.Files.uploadFile`.
  - Replace placeholder entries with the server response before emitting Flow or REST events.
- Flow payloads therefore contain references (e.g., URLs or metadata) returned by the upload service rather than raw file contents.

## Templates
- The component’s markup is defined in `fileupload.html` with supporting scripts/styles under `template/` as needed.

## Related Links
- Form container documentation – [`../form/README.md`](../form/README.md)
- Client library source – `../form/clientlibs/functions.js`

