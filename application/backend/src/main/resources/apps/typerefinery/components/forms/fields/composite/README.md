# Component

Composite component

# Overview

Container field that groups multiple child inputs (e.g., address blocks, contact information) while still behaving like a single logical field in payloads. Supports two variants: **field** (object output) and **list** (array output with add/remove/sort functionality).

## Information

- **group**: Typerefinery - Forms
- **sling:resourceType**: ws:Component
- **description**: Composite field returning JSON of its values
- **title**: Composite Field
- **sling:resourceSuperType**: typerefinery/components/forms/field
- **isContainer**: true
- **Vendor**: Typerefinery
- **Version**: 1.0
- **Compatibility**: CMS
- **Status**: Ready
- **Showcase**: [/typerefinery/components/forms/composite](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/composite::editor)
- **Local Code**: [/apps/typerefinery/components/forms/fields/composite]
- **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/composite)
- **Readme**: [/typerefinery/components/forms/composite/readme](https://github.com/typerefinery-ai/typerefinery-websight/blob/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/composite/README.md)

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
            <td>Field Name</td>
            <td>-</td>
            <td>The name attribute for the composite field. Child values are compiled into JSON under this name.</td>
        </tr>
        <tr>
            <td>Type</td>
            <td>Field - Object</td>
            <td>Select between "Field - Object" (single object output) or "List - Array" (array output with add/remove/sort).</td>
        </tr>
        <tr>
            <td>Is User Readonly?</td>
            <td>false</td>
            <td>Only applies to List variant. Prevents users from adding or removing items (read-only list).</td>
        </tr>
        <tr>
            <td>Events</td>
            <td>Events</td>
            <td>-</td>
            <td>Configure events to listen to or emit (ADD_ITEM, ADDONCE_ITEM, etc.).</td>
        </tr>
        <tr>
            <td>Validation</td>
            <td>Required</td>
            <td>false</td>
            <td>Whether the composite field is required.</td>
        </tr>
        <tr>
            <td rowspan="4">Style</td>
            <td>Class name</td>
            <td>-</td>
            <td>Add custom CSS classes.</td>
        </tr>
        <tr>
            <td>Border Enabled</td>
            <td>false</td>
            <td>Enable border styling.</td>
        </tr>
        <tr>
            <td>Margin Enabled</td>
            <td>false</td>
            <td>Enable margin spacing.</td>
        </tr>
        <tr>
            <td>Padding Enabled</td>
            <td>false</td>
            <td>Enable padding spacing.</td>
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
            <td>Aria</td>
            <td>Aria attributes</td>
            <td>-</td>
            <td>Configure accessibility attributes (aria-label, aria-describedby, etc.).</td>
        </tr>
    </tbody>
</table>

# Variants

This component has two variants that determine the output format:

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
            <td>Field - Object</td>
            <td>field</td>
            <td>Single object output grouping related inputs. All child field values are compiled into a single JSON object. Used for grouping related fields like address (street, city, state, zip) or contact info (name, email, phone).</td>
        </tr>
        <tr>
            <td>List - Array</td>
            <td>list</td>
            <td>Array output with add/remove/sort functionality. Creates a list of repeated item structures. Each row contains the same set of fields. Supports dynamic addition, removal, and sorting of rows. Used for repeating groups like multiple addresses or contacts.</td>
        </tr>
    </tbody>
</table>

## Field Variant Usage

**Purpose**: Group related inputs into a single object structure.

**Output Format**:
```json
{
  "compositeField": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  }
}
```

**Use Cases**:
- Address blocks (street, city, state, zip)
- Contact information (phone, email, name)
- Related form fields that should be grouped together

## List Variant Usage

**Purpose**: Create a list/array of repeated item structures.

**Output Format**:
```json
{
  "contacts": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-0100",
      "id": "row-1"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "555-0101",
      "id": "row-2"
    }
  ]
}
```

**Features**:
- Add new rows dynamically
- Remove rows (moved to trash for deletion)
- Sort rows via drag-and-drop
- Move rows up/down/top/bottom
- User readonly mode (prevents add/remove actions)

**Use Cases**:
- List of contacts
- Multiple addresses
- Repeating groups of fields

## Parsys Integration

The composite component uses a parsys area where authors can add child components. All form field components can be added as children. Child components are automatically compiled into the JSON structure based on the variant type.

## Flow Integration

Composite field values are automatically included in Flow payloads when the form has Flow enabled. The entire JSON structure (object or array) is included in the payload.
