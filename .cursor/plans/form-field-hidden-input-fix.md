# Plan: Fix CSS Rule Hiding All Form Fields

## Problem Analysis

**Current CSS Rule:**
```css
field:has(> div > input[type=hidden]) {
  display: none;
}
```

**Issue:**
- The rule is hiding ALL fields instead of just fields with `inputType="hidden"`
- The selector `field:has(> div > input[type=hidden])` is either:
  1. Too broad and matching fields it shouldn't
  2. Not matching the actual DOM structure
  3. Matching datetime hidden inputs that are created for formatting

## Investigation Needed

### 1. Understand the Intent
- **Purpose**: Hide fields where `inputType="hidden"` (actual hidden input fields)
- **NOT meant to hide**: Fields that create hidden inputs for formatting (like datetime)

### 2. Check DOM Structure
**Expected structure for hidden input field:**
```html
<field id="..." class="...">
  <label>...</label>
  <input type="hidden" name="..." value="..." />
</field>
```

**Actual structure from variant.html:**
- `field` element is rendered by base field variant
- `input` element is rendered by input variant via `data-sly-resource`
- No `div` wrapper in the structure

**Issue**: The selector `> div > input[type=hidden]` requires a `div` wrapper, but the structure doesn't have one.

### 3. Check Datetime Hidden Inputs
**Datetime component creates:**
```html
<input type="datetime-local" />
<input type="hidden" name="..." />  <!-- Sibling, not child -->
<span class="input-datetime-display">...</span>
```

These are siblings, not children, so they shouldn't match `> div > input[type=hidden]`.

## Root Cause Hypothesis

1. **Selector mismatch**: The selector expects `> div > input[type=hidden]` but the structure is `> input[type=hidden]` (no div)
2. **Browser compatibility**: `:has()` selector might not work as expected in all browsers
3. **Specificity issue**: The selector might be matching something else entirely

## Solution Options

### Option 1: Fix Selector to Match Actual Structure
```css
/* Hide field container with hidden input (no div wrapper) */
field:has(> input[type=hidden]) {
  display: none;
}
```

**Pros:**
- Matches actual DOM structure
- More specific (only direct child input)

**Cons:**
- Still uses `:has()` which has limited browser support
- Might match datetime hidden inputs if they're direct children

### Option 2: Use Data Attribute or Class
Add a class or data attribute to hidden input fields:
```css
/* In Input.java or variant.html */
if ("hidden".equals(inputType)) {
  // Add class or data attribute
}

/* In CSS */
field:has(> input[type=hidden].field-hidden-input) {
  display: none;
}
```

**Pros:**
- More specific and reliable
- Won't match formatting hidden inputs

**Cons:**
- Requires code changes in multiple places

### Option 3: Use Component Attribute
Check if the input has `component="input"` and `type="hidden"`:
```css
field:has(> input[component="input"][type=hidden]) {
  display: none;
}
```

**Pros:**
- More specific
- Only matches actual input components

**Cons:**
- Still uses `:has()`

### Option 4: Use JavaScript to Add Class
Add a class via JavaScript when hidden input is detected:
```javascript
// In form initialization
$('field:has(> input[type=hidden])').addClass('field-hidden');
```

```css
field.field-hidden {
  display: none;
}
```

**Pros:**
- No `:has()` dependency
- More reliable

**Cons:**
- Requires JavaScript
- More complex

## Recommended Solution

**Option 1 (Simplified Selector)** - Fix the selector to match actual structure:

```css
/* form/field */
/* hide field container with hidden input of type hidden */
field:has(> input[type=hidden]) {
  display: none;
}
```

**But add exception for datetime formatting hidden inputs:**
```css
/* Exception: Don't hide fields with datetime formatting hidden inputs */
field:has(> input[type=hidden][id$="_formatted"]) {
  display: block;
}
```

Or better, use a more specific selector that excludes formatting inputs:
```css
/* Hide field container with hidden input (actual hidden field, not formatting helper) */
field:has(> input[type=hidden]:not([id$="_formatted"])) {
  display: none;
}
```

## Implementation Steps

1. **Test current behavior**: Check what's actually being hidden
2. **Verify DOM structure**: Inspect rendered HTML to see actual structure
3. **Fix selector**: Update to match actual structure and exclude formatting inputs
4. **Test**: Verify hidden input fields are hidden, but datetime fields are not
5. **Test edge cases**: Check other components that might create hidden inputs

## Testing Checklist

- [ ] Hidden input fields (`inputType="hidden"`) are hidden in published mode
- [ ] Hidden input fields are visible in edit mode (as text)
- [ ] Datetime fields with formatting are NOT hidden
- [ ] Other fields (text, email, etc.) are NOT hidden
- [ ] Rating fields are NOT hidden
- [ ] Range fields are NOT hidden
