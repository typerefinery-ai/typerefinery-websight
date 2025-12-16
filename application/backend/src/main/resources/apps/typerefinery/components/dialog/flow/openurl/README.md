# Flow OpenUrl

This component displays read-only Flow URLs from the `/var/typerefinery/flow/` resource in a dialog.

## Purpose

Flow service-managed properties (like `flowapi_editurl`, `flowapi_httproute`, etc.) are stored in `/var` resources to prevent listener loops. This component reads those values and displays them as read-only links in the dialog.

## Usage

```json
{
  "httproute": {
    "sling:resourceType": "typerefinery/components/dialog/flow/openurl",
    "name": "flowapi_httproute",
    "propertyName": "flowapi_httproute",
    "label": "HTTP Route",
    "title": "Open HTTP Route"
  },
  "editurl": {
    "sling:resourceType": "typerefinery/components/dialog/flow/openurl",
    "name": "flowapi_editurl",
    "propertyName": "flowapi_editurl",
    "label": "Flow Designer",
    "title": "Edit this flow in Flow Designer"
  }
}
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `propertyName` | String | Yes | Name of the property to read from var resource (e.g., `flowapi_httproute`) |
| `name` | String | Yes | Field name (usually same as `propertyName`) |
| `label` | String | Yes | Field label |
| `title` | String | No | Link title (defaults to `label`) |
| `description` | String | No | Field description |

## How It Works

1. Gets the component resource from dialog context
2. Maps component path to `/var/typerefinery/flow/{componentPath}`
3. Reads the specified property from the var resource
4. Passes the value to the `Url` component for display

## Example Output

The component renders a link button that opens the Flow URL in a new tab.


