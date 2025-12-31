# Phone Validation Helper - Integration Guide for Frontend Team

## Overview

This utility solves the issue where international phone numbers with hyphens, spaces, and other formatting characters were not displaying in the Tech Directory UI because of strict frontend validation.

## Problem Solved

**Before:** Phone numbers like `+49-2932-9616-0` (HL Hutterer & Lechner) and `+49-8456-270` (KESSEL) failed validation and didn't display.

**After:** All phone numbers display with their original formatting, and "Call" buttons work correctly with sanitized tel: links.

## Quick Start

### 1. Copy the Helper to Your Frontend Project

Copy one of these files to your project:
- `phone-helper.js` - For JavaScript projects (ES6 modules + CommonJS)
- `phone-helper.ts` - For TypeScript projects

### 2. Import and Use

```javascript
import { formatPhone } from './utils/phone-helper';

// In your component
const phoneData = formatPhone(manufacturer.support[0]?.phone);

// phoneData contains:
// {
//   displayPhone: "+49-2932-9616-0",  // Original formatting preserved
//   callPhone: "+49293296160",         // Sanitized for tel: link
//   isCallable: true                   // Can this be called?
// }
```

### 3. Update Your UI Component

Replace your current phone validation/display logic with this pattern:

```jsx
// React example
function ManufacturerCard({ manufacturer }) {
  const phone = manufacturer.support[0]?.phone;
  const phoneData = formatPhone(phone);

  return (
    <div className="card">
      {/* Always display phone if present */}
      {phoneData.displayPhone && (
        <div className="phone">
          <span>📞 {phoneData.displayPhone}</span>
          
          {/* Only show call button if callable (≥7 digits) */}
          {phoneData.isCallable && (
            <a href={`tel:${phoneData.callPhone}`}>Call</a>
          )}
        </div>
      )}
    </div>
  );
}
```

## API Functions

### `formatPhone(phone)`

Main function that processes any phone string.

**Input:** `"+49-2932-9616-0"`

**Output:**
```javascript
{
  displayPhone: "+49-2932-9616-0",  // Display as-is
  callPhone: "+49293296160",         // Use for tel: link
  isCallable: true                   // Has ≥7 digits
}
```

### `getTelLink(phone)`

Convenience function to get a ready-to-use tel: URI.

**Example:**
```javascript
getTelLink("+49-2932-9616-0")  // Returns: "tel:+49293296160"
```

### `isPhoneCallable(phone)`

Quick check if a phone can be called.

**Example:**
```javascript
isPhoneCallable("+49-2932-9616-0")  // Returns: true
isPhoneCallable("123")              // Returns: false (too short)
```

## What It Handles

✅ **International formats:**
- `+49-2932-9616-0` → `+49293296160`
- `+49-8456-270` → `+498456270`
- `+44 20 7123 4567` → `+442071234567`

✅ **US formats:**
- `+1 800-555-1212` → `+18005551212`
- `(800) 555-1212` → `8005551212`
- `800.555.1212` → `8005551212`

✅ **Edge cases:**
- Empty/null/undefined → safe empty result
- Too short (<7 digits) → displays but not callable
- Multiple + signs → normalized to single +
- + in middle → removed

## Testing

All acceptance criteria from the issue are verified:

```bash
# Run the test suite
node utils/phone-helper.test.js

# Expected output:
# ✅ Passed: 33
# ❌ Failed: 0
```

Test cases include:
- +1 800-555-1212 → +18005551212 ✅
- +49-2932-9616-0 → +49293296160 ✅ (HL Hutterer & Lechner)
- +49-8456-270 → +498456270 ✅ (KESSEL)
- (800) 555-1212 → 8005551212 ✅

## Browser Support

The helper works in:
- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Internet Explorer 11+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

No polyfills required - uses only ES5-compatible features.

## Demo

Open `utils/demo.html` in a browser to see:
- Live examples with HL Hutterer & Lechner and KESSEL
- All test cases with visual results
- Interactive "Call" buttons

## Migration Checklist

- [ ] Copy `phone-helper.js` or `phone-helper.ts` to your project
- [ ] Import `formatPhone` in your directory card component
- [ ] Replace phone validation logic with `formatPhone()`
- [ ] Update display to show `phoneData.displayPhone`
- [ ] Update Call button href to use `phoneData.callPhone`
- [ ] Add conditional rendering based on `phoneData.isCallable`
- [ ] Test with HL Hutterer & Lechner and KESSEL entries
- [ ] Test on mobile device to ensure tel: links work

## Questions?

Refer to:
- `utils/README.md` - Complete API documentation
- `utils/phone-helper.test.js` - All test cases
- `utils/demo.html` - Working example

## Key Points

1. **Always display** the phone number if present (use `displayPhone`)
2. **Only enable calling** if valid (check `isCallable`)
3. **Use sanitized version** for tel: links (use `callPhone`)
4. **No runtime errors** - handles all edge cases gracefully

This is a frontend-only fix - no backend changes required!
