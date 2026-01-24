# Implementation Plan: Date Input Type Enhancement

## Overview
Enhance the date input type to support:
1. **Date + Time Selection**: Allow selecting both date and time in a single input (using HTML5 `type="datetime-local"`)
2. **Output Format Configuration**: Allow authors to specify how the date/time value is formatted when submitted
3. **Timezone Handling**: Define how timezones should work for date/time inputs

## What is "datetime-local"?

**HTML5 Input Types:**
- `type="date"` - Date only (YYYY-MM-DD)
- `type="time"` - Time only (HH:mm)
- `type="datetime-local"` - Date AND time together (YYYY-MM-DDTHH:mm)
- `type="datetime"` - **DEPRECATED** (was UTC-based, removed from HTML5 spec)

**What "-local" means:**
- **"Local" = NO timezone specified** - it's just the date/time value without timezone info
- Format: `YYYY-MM-DDTHH:mm` (no `Z` or `±HH:MM` offset)
- The browser shows the picker in the user's locale, but the value has no timezone
- **There is NO "datetime-remote"** - that doesn't exist in HTML5

**Why it's called "local":**
- It represents a "local" date/time (user's local timezone context)
- But the value itself has no timezone attached
- If you need timezone, you handle it separately (which is what our component will do)

## Current State Analysis

### ✅ Currently Implemented
- **Date Input**: Native HTML5 `<input type="date">` - outputs ISO date format (`YYYY-MM-DD`)
- **Time Input**: Native HTML5 `<input type="time">` - outputs ISO time format (`HH:mm` or `HH:mm:ss`)
- **Separate Types**: Date and time are separate input types (no combined datetime)

### ❌ Missing Features
1. **Combined Date + Time**: No `datetime-local` input type support
2. **Output Format**: No way to configure how date/time is formatted in form submission
3. **Timezone Support**: No timezone handling or configuration
4. **Format Documentation**: No documentation of common date/time formats

## Requirements Analysis

### 1. Date + Time Selection

**Options:**
- **Option A**: Add `datetime-local` input type (native HTML5)
  - ✅ Simple: Just add new input type option
  - ✅ Native browser support
  - ✅ Single input field
  - ❌ Limited browser support (Safari issues)
  - ❌ No timezone awareness (always local)

- **Option B**: Combine existing `date` and `time` inputs with JavaScript
  - ✅ Better browser compatibility
  - ✅ Can add timezone handling
  - ✅ Can format output
  - ❌ More complex implementation
  - ❌ Two separate inputs (or custom UI)

- **Option C**: Add `datetime-local` type + JavaScript enhancement for format/timezone
  - ✅ Native input for better UX
  - ✅ JavaScript for format/timezone handling
  - ✅ Best of both worlds
  - ❌ More complex

**Recommendation**: **Option C** - Add `datetime-local` type with JavaScript enhancement for format/timezone handling.

**CRITICAL**: Since native HTML5 date/time inputs only accept ISO format, we'll use `type="text"` with a date picker library (e.g., Flatpickr) that gives us full control. This allows:
- Immediate formatting when user selects
- User sees formatted value in the input
- `$component.val()` returns formatted value
- Component is self-contained and "just works"

### 2. Output Format Configuration

**Common Date/Time Formats:**
- ISO 8601: `2024-01-15T14:30:00` (datetime-local default)
- ISO Date: `2024-01-15` (date default)
- ISO Time: `14:30:00` (time default)
- US Date: `01/15/2024`
- European Date: `15/01/2024`
- Long Date: `January 15, 2024`
- Unix Timestamp: `1705327800`
- RFC 3339: `2024-01-15T14:30:00Z` (with timezone)
- Custom formats via pattern (e.g., `YYYY-MM-DD HH:mm:ss`)

**Implementation Approach:**
- Add `dateOutputFormat` dialog field (select dropdown with common formats)
- Add `dateCustomFormat` field (text input for custom patterns)
- JavaScript formats the value before form submission
- Store original ISO value in `data-iso-value` attribute
- Format on `change` event or form submission

### 3. Timezone Handling

**Key Questions:**
1. **Input Timezone**: What timezone is the user's input in?
   - **Option A**: Always local timezone (browser timezone)
   - **Option B**: Configurable timezone (author selects)
   - **Option C**: UTC (convert to UTC on input)

2. **Output Timezone**: What timezone should the output be in?
   - **Option A**: Same as input (preserve user's timezone)
   - **Option B**: Always UTC (convert on output)
   - **Option C**: Configurable (author selects output timezone)
   - **Option D**: Server timezone (convert on server)

3. **Display Timezone**: What timezone should be shown to the user?
   - **Option A**: Browser local timezone (default)
   - **Option B**: Configurable (author sets display timezone)

**Recommendation:**
- **Input**: Browser local timezone (user's timezone) - most intuitive
- **Output**: Configurable (default: preserve input timezone, option to convert to UTC)
- **Display**: Browser local timezone (native HTML5 inputs show local time)

**Implementation:**
- Add `dateTimezone` dialog field (select: "Local", "UTC", or specific timezone)
- Add `dateOutputTimezone` field (select: "Preserve Input", "UTC", or specific timezone)
- JavaScript handles timezone conversion using `Intl.DateTimeFormat` or library (e.g., date-fns, moment.js, or native)
- Store timezone info in `data-timezone` attribute

## Implementation Plan

### Phase 1: Add datetime-local Input Type

#### 1.1 Dialog Configuration
**File**: `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/dialog/.content.json`

**Changes:**
- Add "Date and Time" option to inputType select with value `datetime-local`
- Position after "date" and before "time" in the dropdown

#### 1.2 Sling Model
**File**: `application/backend/src/main/java/ai/typerefinery/websight/models/components/forms/Input.java`

**Changes:**
- No changes needed for `typeAttr` computation - it already maps `inputType` directly to HTML type
- When `inputType = "datetime-local"`, `typeAttr = "datetime-local"` (no special handling needed)
- Follows same pattern as "date" and "time" - native HTML5 types

#### 1.3 Template
**File**: `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/variant.html`

**Changes:**
- No template changes needed - template already uses `type="${model.typeAttr}"`
- Model will compute `typeAttr = "datetime-local"` for the new input type
- Add `data-output-format`, `data-custom-format`, `data-output-timezone` attributes from model (for JavaScript)
- Keep native HTML5 `type="datetime-local"` - component handles formatting via JavaScript

#### 1.4 Testing
- Test `datetime-local` input renders correctly
- Test native browser picker works
- Test form submission includes datetime value

### Phase 2: Output Format Configuration

#### 2.1 Dialog Configuration
**File**: `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/dialog/.content.json`

**Changes:**
- Add new section in General tab: "Date/Time Format (Date, Time, Date and Time only)"
- Add `dateOutputFormat` select field with options:
  - "ISO 8601" (default for datetime-local: `YYYY-MM-DDTHH:mm:ss`)
  - "ISO Date" (for date: `YYYY-MM-DD`)
  - "ISO Time" (for time: `HH:mm:ss`)
  - "US Date" (`MM/DD/YYYY`)
  - "European Date" (`DD/MM/YYYY`)
  - "Long Date" (`MMMM DD, YYYY`)
  - "Unix Timestamp" (seconds since epoch)
  - "RFC 3339" (`YYYY-MM-DDTHH:mm:ssZ`)
  - "Custom" (triggers custom format field)
- Add `dateCustomFormat` text field (shown when "Custom" selected)
  - Placeholder: `YYYY-MM-DD HH:mm:ss`
  - Description: "Custom format pattern (e.g., YYYY-MM-DD HH:mm:ss)"

#### 2.2 Sling Model
**File**: `application/backend/src/main/java/ai/typerefinery/websight/models/components/forms/Input.java`

**Changes:**
- Add `@Inject @Getter` properties:
  - `dateOutputFormat` (String, default: "iso-8601" for datetime-local, "iso-date" for date, "iso-time" for time)
  - `dateCustomFormat` (String, optional)

#### 2.3 JavaScript Formatting
**File**: `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/clientlibs/functions.js` (or new `type-datetime.js`)

**Changes:**
- Initialize formatting on date/time/datetime-local inputs (similar to `initRating`)
- Read format and timezone from `data-model` (componentConfig)
- On `change` event, immediately format the value
- Create/update hidden input with formatted value (same `name` attribute)
- Hide native input, show formatted display element
- User sees formatted value immediately
- Form collection automatically gets formatted value from hidden input

**Implementation Pattern (Like Rating):**
```javascript
ns.initDateTime = ($component, componentConfig) => {
  const $nativeInput = $component; // Native datetime-local input
  const format = componentConfig.dateOutputFormat || 'iso-8601';
  const customFormat = componentConfig.dateCustomFormat;
  const timezone = componentConfig.dateOutputTimezone || 'preserve-input';
  
  // Create hidden input for formatted value (same name)
  let $hiddenInput = $nativeInput.siblings(`input[name="${componentConfig.name}"][type="hidden"]`);
  if ($hiddenInput.length === 0) {
    $hiddenInput = $('<input>')
      .attr('type', 'hidden')
      .attr('name', componentConfig.name)
      .attr('id', componentConfig.id + '_formatted');
    $nativeInput.after($hiddenInput);
  }
  
  // Create formatted display element
  let $display = $nativeInput.siblings('.input-datetime-display');
  if ($display.length === 0) {
    $display = $('<span>').addClass('input-datetime-display');
    $nativeInput.after($display);
  }
  
  // On change, format immediately
  $nativeInput.on('change', function() {
    const isoValue = $nativeInput.val(); // ISO format from native input
    const formatted = formatDateTime(isoValue, format, customFormat, timezone);
    
    // Update hidden input with formatted value
    $hiddenInput.val(formatted);
    
    // Update display element
    $display.text(formatted);
    
    // Hide native input, show display
    $nativeInput.hide();
    $display.show();
  });
  
  // On display click, show native input for editing
  $display.on('click', function() {
    $display.hide();
    $nativeInput.show().focus();
  });
}
```

**Result:**
- User clicks display → native picker opens
- User selects date/time → component formats immediately
- User sees formatted value in display element
- Hidden input has formatted value
- `$component.val()` returns formatted value (from hidden input)
- Form collection gets formatted value automatically

**Format Patterns:**
- Use JavaScript `Intl.DateTimeFormat` for locale-aware formatting
- For custom patterns, use a library (date-fns, moment.js) or implement pattern parser
- Common patterns:
  - `YYYY` - 4-digit year
  - `MM` - 2-digit month
  - `DD` - 2-digit day
  - `HH` - 2-digit hour (24-hour)
  - `mm` - 2-digit minute
  - `ss` - 2-digit second

#### 2.4 Template Updates
**File**: `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/variant.html`

**Changes:**
- Add `data-output-format` attribute with format value
- Add `data-custom-format` attribute if custom format provided
- These attributes used by JavaScript for formatting

### Phase 3: Timezone Handling

#### 3.1 Dialog Configuration
**File**: `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/dialog/.content.json`

**Changes:**
- Add `dateTimezone` select field (Date, Time, Date and Time only):
  - "Browser Local" (default)
  - "UTC"
  - "Custom" (triggers timezone select)
- Add `dateTimezoneCustom` select field (shown when "Custom" selected):
  - List of common timezones (e.g., "America/New_York", "Europe/London", "Asia/Tokyo")
  - Use IANA timezone database names
- Add `dateOutputTimezone` select field:
  - "Preserve Input" (default - keep user's timezone)
  - "UTC" (convert to UTC on output)
  - "Custom" (triggers output timezone select)

#### 3.2 Sling Model
**File**: `application/backend/src/main/java/ai/typerefinery/websight/models/components/forms/Input.java`

**Changes:**
- Add `@Inject @Getter` properties:
  - `dateTimezone` (String, default: "browser-local")
  - `dateTimezoneCustom` (String, optional)
  - `dateOutputTimezone` (String, default: "preserve-input")

#### 3.3 JavaScript Timezone Conversion
**File**: `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/clientlibs/functions.js` (or `type-datetime.js`)

**Changes:**
- Add timezone conversion function:
  ```javascript
  ns.convertTimezone = (dateValue, fromTz, toTz) => {
    // Convert date/time from one timezone to another
    // Use Intl.DateTimeFormat or timezone library
  }
  ```
- Handle timezone conversion on form submission
- Store timezone info in `data-timezone` and `data-output-timezone` attributes

**Timezone Library Options:**
- **Native JavaScript**: `Intl.DateTimeFormat` with timezone support (modern browsers)
- **date-fns-tz**: Lightweight, tree-shakeable
- **moment-timezone**: Heavier, but comprehensive
- **Luxon**: Modern, immutable API

**Recommendation**: Use native `Intl.DateTimeFormat` first, fallback to date-fns-tz if needed.

### Phase 4: Documentation

#### 4.1 README Updates
**File**: `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/README.md`

**Changes:**
- Add "Date and Time" to input types table
- Document output format options
- Document timezone handling
- Add format pattern reference table
- Add usage examples

**Format Documentation Section:**
```markdown
## Date/Time Output Formats

The date, time, and datetime-local input types support configurable output formats.

### Common Formats

| Format Name | Pattern | Example Output | Use Case |
|-------------|---------|----------------|----------|
| ISO 8601 | `YYYY-MM-DDTHH:mm:ss` | `2024-01-15T14:30:00` | Standard datetime format |
| ISO Date | `YYYY-MM-DD` | `2024-01-15` | Date only |
| ISO Time | `HH:mm:ss` | `14:30:00` | Time only |
| US Date | `MM/DD/YYYY` | `01/15/2024` | US date format |
| European Date | `DD/MM/YYYY` | `15/01/2024` | European date format |
| Long Date | `MMMM DD, YYYY` | `January 15, 2024` | Human-readable date |
| Unix Timestamp | Seconds since epoch | `1705327800` | Unix timestamp |
| RFC 3339 | `YYYY-MM-DDTHH:mm:ssZ` | `2024-01-15T14:30:00Z` | RFC 3339 with UTC |

### Custom Format Patterns

When "Custom" format is selected, use the following pattern characters:

| Pattern | Description | Example |
|---------|-------------|---------|
| `YYYY` | 4-digit year | `2024` |
| `YY` | 2-digit year | `24` |
| `MM` | 2-digit month | `01` |
| `M` | Month (1-12) | `1` |
| `DD` | 2-digit day | `15` |
| `D` | Day (1-31) | `15` |
| `HH` | 2-digit hour (24-hour) | `14` |
| `H` | Hour (0-23) | `14` |
| `hh` | 2-digit hour (12-hour) | `02` |
| `h` | Hour (1-12) | `2` |
| `mm` | 2-digit minute | `30` |
| `m` | Minute (0-59) | `30` |
| `ss` | 2-digit second | `00` |
| `s` | Second (0-59) | `0` |
| `A` | AM/PM | `PM` |
| `a` | am/pm | `pm` |

**Example Custom Formats:**
- `YYYY-MM-DD HH:mm:ss` → `2024-01-15 14:30:00`
- `MM/DD/YYYY hh:mm A` → `01/15/2024 02:30 PM`
- `DD-MM-YYYY` → `15-01-2024`

### Timezone Handling

Date/time inputs support timezone configuration:

**Input Timezone:**
- **Browser Local** (default): User's browser timezone
- **UTC**: Coordinated Universal Time
- **Custom**: Specific IANA timezone (e.g., "America/New_York")

**Output Timezone:**
- **Preserve Input** (default): Keep the input timezone
- **UTC**: Convert to UTC on form submission
- **Custom**: Convert to specific timezone

**Examples:**
- User in EST (UTC-5) selects `2024-01-15 14:30`
- Input timezone: Browser Local (EST)
- Output timezone: UTC
- Output value: `2024-01-15T19:30:00Z` (converted to UTC)

**IANA Timezone Examples:**
- `America/New_York` - Eastern Time (US)
- `America/Los_Angeles` - Pacific Time (US)
- `Europe/London` - British Time
- `Europe/Paris` - Central European Time
- `Asia/Tokyo` - Japan Standard Time
- `UTC` - Coordinated Universal Time
```

## User Experience Flow

### How It Works (Self-Contained Component)

**Example: User selects date with US Date format (MM/DD/YYYY)**

```
1. User clicks on date input field
   ↓
2. Native date/time picker opens (browser native)
   ↓
3. User selects: January 15, 2024
   ↓
4. Component immediately formats: "01/15/2024" and stores in data-formatted-value
   ↓
5. Input field shows formatted value (via display overlay or formatted element)
   ↓
6. User sees formatted value immediately ✅
   ↓
7. When form submits, component returns formatted value from data-formatted-value ✅
   ↓
8. Component "just works" - no external intervention needed ✅
```

**Example: User selects datetime with UTC timezone**

```
1. User in EST (UTC-5) selects: 2024-01-15 14:30
   ↓
2. Component immediately converts to UTC: 2024-01-15 19:30
   ↓
3. Component formats: "01/15/2024 19:30" (or configured format)
   ↓
4. Input field shows: "01/15/2024 19:30" (UTC, formatted)
   ↓
5. User sees UTC value immediately ✅
   ↓
6. When form submits, $component.val() returns: "01/15/2024 19:30" ✅
   ↓
7. Component "just works" - self-contained ✅
```

**Key Principle**: The component handles everything internally. User selects → component formats/converts → user sees result → form gets formatted value. No external formatting needed.

## Technical Decisions

### 1. Format Library Choice

**Options:**
- **Native JavaScript**: `Intl.DateTimeFormat`, `Date.toLocaleString()`
- **date-fns**: Lightweight, functional, tree-shakeable
- **moment.js**: Heavy, but comprehensive (deprecated)
- **Luxon**: Modern, immutable, moment.js successor

**Decision**: **Native JavaScript first** (no dependencies), with date-fns as optional enhancement for complex patterns.

### 2. Format Application Timing

**CRITICAL**: The component must be self-contained and "just work". When the user selects a date/time, they should immediately see it in the configured format.

**Decision**: **On Input Change** - Format immediately when user selects date/time. The input value is updated to the formatted version, so:
- User sees formatted value immediately (e.g., "01/15/2024" instead of "2024-01-15")
- `$component.val()` returns the formatted value
- Form submission gets the formatted value automatically
- Component is self-contained and works without external intervention

**Implementation Pattern (Like Rating Component):**
- Keep native `type="datetime-local"` input (visible for picker UX)
- On `change` event, format the value immediately
- Create/update a hidden input with the formatted value (same `name` attribute)
- Hide the native input, show formatted display element
- User sees formatted value immediately
- Form collection gets formatted value from hidden input automatically
- `$component.val()` returns formatted value (from hidden input)

**Why This Works:**
- Native input provides picker UX (user clicks to open picker)
- After selection, component formats and swaps to formatted display
- Hidden input with same `name` ensures form collection gets formatted value
- Component is self-contained - `$component.val()` returns formatted value
- Follows same pattern as rating component (hidden input + visual interface)

### 3. Timezone Conversion Timing

**Decision**: **On Input Change** - Convert timezone immediately when user selects date/time. The component shows the value in the configured output timezone right away:
- User selects date/time in their local timezone
- Component immediately converts to configured output timezone (if different)
- User sees the converted value in the input field
- `$component.val()` returns the value in the output timezone
- Form submission gets the value in the output timezone automatically
- Component is self-contained and works without external intervention

### 4. Backward Compatibility

**Considerations:**
- Existing date/time inputs should continue working
- Default behavior should match current behavior (ISO format, local timezone)
- New features should be opt-in (defaults preserve current behavior)

**Decision**: All new features are opt-in with sensible defaults that match current behavior.

## Implementation Files

### Files to Modify
1. `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/dialog/.content.json`
2. `application/backend/src/main/java/ai/typerefinery/websight/models/components/forms/Input.java`
3. `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/variant.html`
4. `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/clientlibs/functions.js` (or new `type-datetime.js`)
5. `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/README.md`
6. `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/input/.content.xml` - Add datetime-local examples

### Files to Create
1. `application/backend/src/main/resources/apps/typerefinery/components/forms/fields/input/clientlibs/type-datetime.js` (optional - if datetime logic is complex)
2. `tests/end-to-end/tests/components/forms/input/datetime-preview.cy.ts` - Preview mode E2E tests
3. `tests/end-to-end/tests/components/forms/input/datetime-author.cy.ts` - Author mode E2E tests

## Testing Checklist

### Phase 1: datetime-local
- [ ] Dialog shows "Date and Time" option
- [ ] datetime-local input renders correctly
- [ ] Native browser picker works
- [ ] Form submission includes datetime value in ISO format
- [ ] Works across different browsers

### Phase 2: Output Format
- [ ] Dialog shows format configuration fields (date/time/datetime only)
- [ ] Format dropdown shows all options
- [ ] Custom format field appears when "Custom" selected
- [ ] Date picker library initialized on date/time inputs
- [ ] ISO 8601 format works (default)
- [ ] US Date format works - user sees "01/15/2024" immediately
- [ ] European Date format works - user sees "15/01/2024" immediately
- [ ] Long Date format works - user sees "January 15, 2024" immediately
- [ ] Unix Timestamp format works
- [ ] RFC 3339 format works
- [ ] Custom format patterns work
- [ ] Format is applied immediately when user selects date/time
- [ ] User sees formatted value in input field
- [ ] `$component.val()` returns formatted value

### Phase 3: Timezone
- [ ] Dialog shows timezone configuration fields (date/time/datetime only)
- [ ] Browser Local timezone works (default)
- [ ] UTC timezone works
- [ ] Custom timezone selection works
- [ ] Output timezone "Preserve Input" works - user sees value in their timezone
- [ ] Output timezone "UTC" converts correctly - user sees UTC value immediately
- [ ] Output timezone "Custom" converts correctly - user sees converted value immediately
- [ ] Timezone conversion happens immediately when user selects date/time
- [ ] User sees converted value in input field
- [ ] `$component.val()` returns value in output timezone
- [ ] Timezone conversion handles DST correctly

### Phase 4: Showcase Updates
- [ ] Add datetime-local examples to showcase page
- [ ] Add examples with different output formats (US Date, European Date, Long Date, etc.)
- [ ] Add examples with different timezones (Local, UTC, Custom)
- [ ] Add examples showing format + timezone combinations
- [ ] Group examples in containers by feature (like rating examples)
- [ ] Each example has unique `name` attribute
- [ ] Test all showcase examples render correctly
- [ ] Update main forms showcase page with datetime-local examples

### Phase 5: E2E Tests
- [ ] Create `datetime-preview.cy.ts` - Preview mode tests
  - Test datetime-local input renders
  - Test native picker opens
  - Test formatted value displays after selection
  - Test different formats (US, European, Long, etc.)
  - Test timezone conversion displays correctly
  - Test `$component.val()` returns formatted value
  - Test form submission includes formatted value
- [ ] Create `datetime-author.cy.ts` - Author mode tests
  - Test dialog shows "Date and Time" option
  - Test format configuration fields appear
  - Test timezone configuration fields appear
  - Test custom format field appears when "Custom" selected
  - Test dialog saves configuration correctly
- [ ] Update existing date/time tests if needed
- [ ] All tests use showcase page examples (not mock data)

### Phase 6: Documentation
- [ ] README documents datetime-local type
- [ ] README documents output formats
- [ ] README documents format patterns
- [ ] README documents timezone handling
- [ ] README includes usage examples
- [ ] README includes showcase path

## Dependencies

### Required
- **None** - Uses native HTML5 `type="datetime-local"` input
- JavaScript for formatting and timezone conversion

### Optional
- **date-fns-tz**: For timezone conversion (if native `Intl.DateTimeFormat` insufficient)
- **Flatpickr**: Optional enhancement for better UX (if native picker insufficient)

## Browser Compatibility

### datetime-local Support
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ⚠️ Safari: Limited support (may need fallback)
- ⚠️ Mobile Safari: Limited support

### Timezone Support
- ✅ Modern browsers: Full `Intl.DateTimeFormat` support
- ⚠️ Older browsers: May need polyfill or library

### Format Support
- ✅ Native formatting: Works in all modern browsers
- ⚠️ Custom patterns: May need library for complex patterns

## Future Enhancements (Optional)

1. **Date Range Selection**: Min/max date constraints
2. **Time Range Selection**: Min/max time constraints
3. **Locale-Aware Formatting**: Format dates according to user's locale
4. **Relative Time Display**: Show "2 hours ago" format option
5. **Calendar Integration**: Custom calendar UI (if native picker insufficient)
6. **Recurring Dates**: Support for recurring date patterns
7. **Holiday Detection**: Highlight holidays in date picker

## Showcase Examples Required

### Showcase Structure (Following Rating Component Pattern)

**Location**: `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/forms/input/.content.xml`

**Container Groups:**
1. **"Date and Time Examples - Basic"**
   - Basic datetime-local input
   - With default value
   - Required datetime-local
   - Disabled datetime-local

2. **"Date and Time Examples - Output Formats"**
   - ISO 8601 format (default)
   - US Date format (MM/DD/YYYY)
   - European Date format (DD/MM/YYYY)
   - Long Date format (January 15, 2024)
   - Unix Timestamp format
   - RFC 3339 format
   - Custom format example

3. **"Date and Time Examples - Timezones"**
   - Browser Local (default)
   - UTC timezone
   - Custom timezone (America/New_York)
   - Custom timezone (Europe/London)
   - Output timezone: Preserve Input
   - Output timezone: UTC
   - Output timezone: Custom

4. **"Date and Time Examples - Format + Timezone Combinations"**
   - US Date format + UTC timezone
   - European Date format + Custom timezone
   - Long Date format + UTC timezone

**CRITICAL**: Each example must have a unique `name` attribute (e.g., `name="datetime_basic"`, `name="datetime_us_format"`, etc.)

## E2E Tests Required

### Preview Tests (`datetime-preview.cy.ts`)

**Test Cases:**
1. **Basic Rendering**
   - Datetime-local input renders correctly
   - Native picker can be opened
   - Display element shows after selection

2. **Format Testing**
   - US Date format displays correctly
   - European Date format displays correctly
   - Long Date format displays correctly
   - Custom format displays correctly

3. **Timezone Testing**
   - UTC conversion displays correctly
   - Custom timezone conversion displays correctly
   - Preserve Input timezone works

4. **Value Collection**
   - `$component.val()` returns formatted value
   - Form submission includes formatted value
   - Hidden input has correct formatted value

### Author Tests (`datetime-author.cy.ts`)

**Test Cases:**
1. **Dialog Configuration**
   - "Date and Time" option appears in inputType dropdown
   - Format configuration fields appear (date/time/datetime only)
   - Timezone configuration fields appear (date/time/datetime only)
   - Custom format field appears when "Custom" selected

2. **Dialog Functionality**
   - Can select output format
   - Can enter custom format pattern
   - Can select timezone
   - Can select output timezone
   - Dialog saves configuration correctly

**MANDATORY**: All tests must use showcase page examples, NOT mock data.

## Questions for Discussion

1. **Format Library**: Should we include date-fns as a dependency, or stick with native JavaScript?
2. **Safari Support**: How should we handle Safari's limited datetime-local support?
3. **Server-Side Formatting**: Should formatting happen client-side (JS) or server-side (Java)?
4. **Timezone Database**: Should we include full IANA timezone database, or just common timezones?
5. **Format Validation**: Should we validate custom format patterns in the dialog?
