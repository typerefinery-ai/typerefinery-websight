# Component

Input component

# Overview

Generic text-style input supporting various HTML input types (text, number, date, email, password, etc.) with validation and input masking support.

## Information

- **group**: Typerefinery - Forms
- **sling:resourceType**: ws:Component
- **description**: Basic form input field
- **title**: Input Field
- **sling:resourceSuperType**: typerefinery/components/forms/field
- **Vendor**: Typerefinery
- **Version**: 1.0
- **Compatibility**: CMS
- **Status**: Ready
- **Showcase**: [/typerefinery/components/forms/input](https://cms.typerefinery.localhost:8101/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor)
- **Local Code**: [/apps/typerefinery/components/forms/fields/input]
- **Source**: [github/typerefinery-websight](https://github.com/typerefinery-ai/typerefinery-websight/tree/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input)
- **Readme**: [/typerefinery/components/forms/input/readme](https://github.com/typerefinery-ai/typerefinery-websight/blob/main/application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/README.md)

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
            <td>Full Name</td>
            <td>The label text for the input field.</td>
        </tr>
        <tr>
            <td>Field Name</td>
            <td>-</td>
            <td>The name attribute for the input. Used for form submission.</td>
        </tr>
        <tr>
            <td>Placeholder</td>
            <td>Type here.</td>
            <td>Placeholder text displayed in the input field when empty.</td>
        </tr>
        <tr>
            <td>Type</td>
            <td>Text</td>
            <td>HTML5 input type. Options: Text, Password, Email, Mobile Number, Number, Date, Time, Range, Colour Picker, Rating, Hidden (visible in edit mode).</td>
        </tr>
        <tr>
            <td rowspan="3">General (Range only)</td>
            <td>Range Minimum</td>
            <td>0</td>
            <td>Minimum value for range input slider.</td>
        </tr>
        <tr>
            <td>Range Maximum</td>
            <td>100</td>
            <td>Maximum value for range input slider.</td>
        </tr>
        <tr>
            <td>Range Step</td>
            <td>1</td>
            <td>Step increment for range input slider.</td>
        </tr>
        <tr>
            <td rowspan="5">General (Rating only)</td>
            <td>Maximum Stars</td>
            <td>5</td>
            <td>Maximum number of stars for rating input (1-10).</td>
        </tr>
        <tr>
            <td>Allow Half Stars</td>
            <td>true</td>
            <td>Enable half-star selection for rating input.</td>
        </tr>
        <tr>
            <td>Filled Icon Class</td>
            <td>fas fa-star</td>
            <td>Font Awesome icon class for filled stars (e.g., "fas fa-star", "fas fa-heart").</td>
        </tr>
        <tr>
            <td>Empty Icon Class</td>
            <td>far fa-star</td>
            <td>Font Awesome icon class for empty stars (e.g., "far fa-star", "far fa-heart").</td>
        </tr>
        <tr>
            <td>Half Icon Class</td>
            <td>fas fa-star-half-alt</td>
            <td>Font Awesome icon class for half stars (e.g., "fas fa-star-half-alt", "fas fa-heart-half-alt").</td>
        </tr>
        <tr>
            <td>Icon Color</td>
            <td>#ffc107</td>
            <td>Color for rating icons in hex format (e.g., "#ffc107" for yellow, "#ff0000" for red, "#0066ff" for blue). Default is "#ffc107" (yellow).</td>
        </tr>
        <tr>
            <td rowspan="2">Validation</td>
            <td>Required</td>
            <td>false</td>
            <td>Whether the input field is required for form submission.</td>
        </tr>
        <tr>
            <td>Input Mask</td>
            <td>-</td>
            <td>Input masking pattern for formatted input (e.g., phone numbers, dates). Uses Inputmask library format.</td>
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
            <td>Disable the input field.</td>
        </tr>
        <tr>
            <td>Hide Label</td>
            <td>false</td>
            <td>Hide the input label while keeping accessibility.</td>
        </tr>
        <tr>
            <td>Persist Color When Theme Switches</td>
            <td>false</td>
            <td>Keep input styling when theme switches.</td>
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
            <td>Configure events to listen to or emit (INPUT_CHANGE, etc.).</td>
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

This component supports multiple HTML5 input types:

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
            <td>Text</td>
            <td>text</td>
            <td>Standard text input for any text content.</td>
        </tr>
        <tr>
            <td>Email</td>
            <td>email</td>
            <td>Email input with built-in email validation. Browsers validate email format automatically.</td>
        </tr>
        <tr>
            <td>Password</td>
            <td>password</td>
            <td>Password input that masks characters for security.</td>
        </tr>
        <tr>
            <td>Mobile Number</td>
            <td>tel</td>
            <td>Telephone number input. On mobile devices, shows numeric keypad.</td>
        </tr>
        <tr>
            <td>Number</td>
            <td>number</td>
            <td>Numeric input with spinner controls. Accepts only numeric values.</td>
        </tr>
        <tr>
            <td>Date</td>
            <td>date</td>
            <td>Date picker input. Shows native date picker on supported browsers.</td>
        </tr>
        <tr>
            <td>Time</td>
            <td>time</td>
            <td>Time picker input. Shows native time picker on supported browsers.</td>
        </tr>
        <tr>
            <td>Range</td>
            <td>range</td>
            <td>Range slider input for selecting numeric values within a range. Uses Bootstrap form-range class. Configure min, max, and step values in dialog.</td>
        </tr>
        <tr>
            <td>Colour Picker</td>
            <td>colourpicker</td>
            <td>Native HTML5 color picker input. Allows selecting colors from a color wheel/picker interface and typing hex values directly. Uses native browser color picker UI.</td>
        </tr>
        <tr>
            <td>Rating</td>
            <td>rating</td>
            <td>Star rating input with Font Awesome icons. Supports full and half-star selection. Configurable number of stars (1-10), half-star support, customizable icon classes, and icon color. Icons have fixed width (1.5rem) to prevent container growth when switching between empty and filled states. The input is hidden with CSS (`input[type="rating"]`), and a visual rating interface is created dynamically by JavaScript. Uses namespaced CSS classes (`.input-rating-items`, `.input-rating-item`) with uniform 2px spacing between items. Uses fixed width reference for accurate half-star detection.</td>
        </tr>
        <tr>
            <td>Hidden</td>
            <td>hidden</td>
            <td>Hidden input field. Invisible in published mode, but visible in edit mode for configuration.</td>
        </tr>
    </tbody>
</table>

## Input Masking

The input component supports input masking for formatted input:

**Common Mask Examples:**
- Phone: `(999) 999-9999` or `999-999-9999`
- Date: `99/99/9999`
- Credit Card: `9999-9999-9999-9999`
- Currency: `$999,999.99`

Uses Inputmask library format. See Inputmask documentation for complete mask syntax.

## Flow Integration

Input field values are automatically included in Flow payloads when the form has Flow enabled. The input value is submitted as a string (for text, email, tel, colourpicker) or number (for number, range, rating). Colour picker values are submitted as hex color strings (e.g., "#ff0000"). Rating values are submitted as numbers (e.g., 3.5 for three and a half stars).
