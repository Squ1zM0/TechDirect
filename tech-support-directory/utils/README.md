# Phone Helper Utility

Helper functions for formatting and validating phone numbers in the Tech Directory UI.

## Overview

This utility handles international phone numbers with various formatting (hyphens, spaces, parentheses, dots) and provides:
- Display-friendly phone numbers (preserves original formatting)
- Sanitized phone numbers for `tel:` links
- Validation to determine if a phone is callable

## Installation

Copy `phone-helper.js` (or `phone-helper.ts` for TypeScript) to your frontend project.

## Usage

### Basic Usage

```javascript
import { formatPhone, getTelLink, isPhoneCallable } from './utils/phone-helper';

// Format a phone number
const result = formatPhone('+1 800-555-1212');
console.log(result.displayPhone);  // "+1 800-555-1212" (original)
console.log(result.callPhone);     // "+18005551212" (sanitized)
console.log(result.isCallable);    // true

// Get a tel: link
const telLink = getTelLink('+49-2932-9616-0');
console.log(telLink);              // "tel:+49293296160"

// Check if callable
const callable = isPhoneCallable('123');
console.log(callable);             // false (too short)
```

### React Component Example

```jsx
import { formatPhone } from './utils/phone-helper';

function ManufacturerCard({ manufacturer }) {
  const phone = manufacturer.support[0]?.phone;
  const phoneData = formatPhone(phone);

  return (
    <div className="card">
      <h3>{manufacturer.name}</h3>
      
      {/* Always display the phone if present */}
      {phoneData.displayPhone && (
        <div className="phone">
          <span>📞 {phoneData.displayPhone}</span>
          
          {/* Show call button only if callable */}
          {phoneData.isCallable && (
            <a 
              href={`tel:${phoneData.callPhone}`}
              className="call-button"
            >
              Call
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

### Vue Component Example

```vue
<template>
  <div class="card">
    <h3>{{ manufacturer.name }}</h3>
    
    <div v-if="phoneData.displayPhone" class="phone">
      <span>📞 {{ phoneData.displayPhone }}</span>
      
      <a 
        v-if="phoneData.isCallable"
        :href="`tel:${phoneData.callPhone}`"
        class="call-button"
      >
        Call
      </a>
    </div>
  </div>
</template>

<script>
import { formatPhone } from './utils/phone-helper';

export default {
  props: ['manufacturer'],
  computed: {
    phoneData() {
      const phone = this.manufacturer.support[0]?.phone;
      return formatPhone(phone);
    }
  }
}
</script>
```

## API Reference

### `formatPhone(phone)`

Process a phone number for display and calling.

**Parameters:**
- `phone` (string | null | undefined) - Raw phone string from data

**Returns:**
- Object with:
  - `displayPhone` (string) - Original phone string for display
  - `callPhone` (string | null) - Sanitized phone for tel: link, or null if invalid
  - `isCallable` (boolean) - Whether the phone is valid enough to be callable

**Examples:**
```javascript
formatPhone("+1 800-555-1212")
// { displayPhone: "+1 800-555-1212", callPhone: "+18005551212", isCallable: true }

formatPhone("+49-2932-9616-0")
// { displayPhone: "+49-2932-9616-0", callPhone: "+49293296160", isCallable: true }

formatPhone("(800) 555-1212")
// { displayPhone: "(800) 555-1212", callPhone: "8005551212", isCallable: true }

formatPhone("123")
// { displayPhone: "123", callPhone: null, isCallable: false }

formatPhone(null)
// { displayPhone: "", callPhone: null, isCallable: false }
```

### `getTelLink(phone)`

Generate a safe tel: link from a phone number.

**Parameters:**
- `phone` (string | null | undefined) - Raw phone string

**Returns:**
- (string | null) - tel: URI or null if not callable

**Examples:**
```javascript
getTelLink("+1 800-555-1212")  // "tel:+18005551212"
getTelLink("+49-2932-9616-0")  // "tel:+49293296160"
getTelLink("123")              // null (too short)
```

### `isPhoneCallable(phone)`

Check if a phone number is valid enough to be callable.

**Parameters:**
- `phone` (string | null | undefined) - Raw phone string

**Returns:**
- (boolean) - true if the phone can be called

**Examples:**
```javascript
isPhoneCallable("+1 800-555-1212")  // true
isPhoneCallable("123")              // false
isPhoneCallable(null)               // false
```

## Validation Rules

- **Minimum digits:** 7 digits required for a phone to be callable
- **Sanitization:** Removes spaces, hyphens, parentheses, dots from tel: links
- **Leading +:** Preserved if present in the original number
- **Multiple +:** Normalized to a single +
- **Display:** Original formatting is always preserved for display

## Supported Formats

The helper handles various international phone formats:

- US/CA: `+1 800-555-1212`, `(800) 555-1212`, `800-555-1212`
- Germany: `+49-2932-9616-0`, `+49-8456-270`
- UK: `+44 20 7123 4567`
- Generic: Any combination of digits, spaces, hyphens, parentheses, dots

## Testing

Run the test suite:

```bash
node utils/phone-helper.test.js
```

## Browser Compatibility

The helper uses standard JavaScript features compatible with:
- All modern browsers (Chrome, Firefox, Safari, Edge)
- IE11+ (with polyfills for older environments if needed)

## License

Same as the parent repository.
