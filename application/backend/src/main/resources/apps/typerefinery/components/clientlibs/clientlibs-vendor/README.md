# Clientlibs - Vendor

Vendor clientlibs contain third-party libraries (Bootstrap, Font Awesome, jQuery, etc.) that are shared across the application.

## Category

**Category**: `ai.typerefinery.websight.components-vendor`

## Usage

These clientlibs are automatically included in pages that use the standard page structure:

- **CSS**: Included in `<head>` via `head-libs.html`
- **JS**: Included at end of `<body>` via `body-end.html`

## Included Libraries

### CSS
- Bootstrap (`bootstrap.min.css`)
- PrimeVue Icons (`primeicons.css`)
- Bootstrap Icons (`bootstrap-icons.css`)
- Font Awesome (`fontawesome/css/all.min.css`)
- Main styles (`webroot/main.css`)

### JavaScript
- jQuery (`jquery.min.js`)
- Bootstrap (`bootstrap.min.js`)
- Handlebars (`handlebars.js`)
- JSONPath (`jsonpath.js`)

## Adding New Vendor Libraries

1. Add CSS/JS files to `/apps/typerefinery/clientlibs/vendor/`
2. Update `.content.json` to include the new files:
   ```json
   {
     "css": [
       "/apps/typerefinery/clientlibs/vendor/new-lib/style.css"
     ],
     "js": [
       "/apps/typerefinery/clientlibs/vendor/new-lib/script.js"
     ]
   }
   ```

## Manual Inclusion

If you need to include vendor clientlibs manually in a custom template:

```html
<!-- CSS in <head> -->
<sly data-sly-use.clientlibs="${'ai.typerefinery.websight.clientlibs.ClientLibsModel' @
    categories='ai.typerefinery.websight.components-vendor',
    debug=true,
    crossorigin='anonymous'}">
  ${clientlibs.cssIncludes @ context="unsafe"}
</sly>

<!-- JS at end of <body> -->
<sly data-sly-use.clientlibs="${'ai.typerefinery.websight.clientlibs.ClientLibsModel' @
    categories='ai.typerefinery.websight.components-vendor',
    debug=true,
    crossorigin='anonymous'}">
  ${clientlibs.jsIncludes @ context="unsafe"}
</sly>
```

See `.cursor/rules/proj-06-htl.mdc` for complete clientlibs documentation.