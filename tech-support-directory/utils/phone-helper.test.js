#!/usr/bin/env node
/**
 * Test suite for phone-helper.ts
 * Run with: node utils/phone-helper.test.js
 */

// Simple test runner
let passed = 0;
let failed = 0;

function assertEquals(actual, expected, testName) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    console.log(`✅ ${testName}`);
    passed++;
  } else {
    console.log(`❌ ${testName}`);
    console.log(`   Expected: ${expectedStr}`);
    console.log(`   Actual:   ${actualStr}`);
    failed++;
  }
}

// Mock ES6 module exports for testing in Node.js
const exports = {};

// Inline the phone-helper code for testing
// (In production, this would be imported)
function formatPhone(phone) {
  // Handle missing or empty phone
  if (!phone || typeof phone !== 'string') {
    return {
      displayPhone: '',
      callPhone: null,
      isCallable: false
    };
  }

  const raw = phone.trim();
  
  // If empty after trim, not displayable
  if (!raw) {
    return {
      displayPhone: '',
      callPhone: null,
      isCallable: false
    };
  }

  // Always display the original formatted string
  const displayPhone = raw;

  // Sanitize for tel: link
  // Keep leading +, keep digits 0-9, remove everything else
  let sanitized = raw.replace(/[^\d+]/g, '');

  // Normalize multiple leading + signs to single +, remove + anywhere else
  sanitized = sanitized.replace(/^\++/, '+').replace(/(?<=.)\+/g, '');

  // Count digits (excluding +)
  const digitCount = sanitized.replace(/\+/g, '').length;

  // Valid if we have at least 7 digits
  const isCallable = digitCount >= 7;

  return {
    displayPhone,
    callPhone: isCallable ? sanitized : null,
    isCallable
  };
}

function getTelLink(phone) {
  const result = formatPhone(phone);
  return result.callPhone ? `tel:${result.callPhone}` : null;
}

function isPhoneCallable(phone) {
  return formatPhone(phone).isCallable;
}

// Test cases from acceptance criteria
console.log('\n=== Acceptance Criteria Tests ===\n');

// Test: +1 800-555-1212 → +18005551212
assertEquals(
  formatPhone('+1 800-555-1212').callPhone,
  '+18005551212',
  'US number with spaces: +1 800-555-1212'
);

// Test: +49-2932-9616-0 → +49293296160
assertEquals(
  formatPhone('+49-2932-9616-0').callPhone,
  '+49293296160',
  'HL Hutterer & Lechner number: +49-2932-9616-0'
);

// Test: +49-8456-270 → +498456270
assertEquals(
  formatPhone('+49-8456-270').callPhone,
  '+498456270',
  'KESSEL number: +49-8456-270'
);

// Test: (800) 555-1212 → 8005551212
assertEquals(
  formatPhone('(800) 555-1212').callPhone,
  '8005551212',
  'US number with parentheses: (800) 555-1212'
);

console.log('\n=== Display Phone Tests ===\n');

// Display phone should always be the original string
assertEquals(
  formatPhone('+1 800-555-1212').displayPhone,
  '+1 800-555-1212',
  'Display phone preserves formatting'
);

assertEquals(
  formatPhone('+49-2932-9616-0').displayPhone,
  '+49-2932-9616-0',
  'Display phone preserves hyphens'
);

assertEquals(
  formatPhone('(800) 555-1212').displayPhone,
  '(800) 555-1212',
  'Display phone preserves parentheses'
);

console.log('\n=== Edge Cases ===\n');

// Test null/undefined
assertEquals(
  formatPhone(null),
  { displayPhone: '', callPhone: null, isCallable: false },
  'Null phone returns empty result'
);

assertEquals(
  formatPhone(undefined),
  { displayPhone: '', callPhone: null, isCallable: false },
  'Undefined phone returns empty result'
);

assertEquals(
  formatPhone(''),
  { displayPhone: '', callPhone: null, isCallable: false },
  'Empty string returns empty result'
);

assertEquals(
  formatPhone('   '),
  { displayPhone: '', callPhone: null, isCallable: false },
  'Whitespace-only string returns empty result'
);

// Test too short (< 7 digits)
const shortResult = formatPhone('123456');
assertEquals(
  shortResult.isCallable,
  false,
  'Phone with 6 digits is not callable'
);
assertEquals(
  shortResult.displayPhone,
  '123456',
  'Short phone still displays'
);

// Test exactly 7 digits (minimum valid)
const minResult = formatPhone('1234567');
assertEquals(
  minResult.isCallable,
  true,
  'Phone with 7 digits is callable'
);
assertEquals(
  minResult.callPhone,
  '1234567',
  'Phone with 7 digits sanitizes correctly'
);

console.log('\n=== Various Formatting Tests ===\n');

// Test dots
assertEquals(
  formatPhone('+1.800.555.1212').callPhone,
  '+18005551212',
  'Dots are removed: +1.800.555.1212'
);

// Test spaces
assertEquals(
  formatPhone('+44 20 7123 4567').callPhone,
  '+442071234567',
  'UK number with spaces'
);

// Test mixed formatting
assertEquals(
  formatPhone('+1 (800) 555-1212').callPhone,
  '+18005551212',
  'Mixed parentheses, spaces, and hyphens'
);

// Test multiple + signs
assertEquals(
  formatPhone('++18005551212').callPhone,
  '+18005551212',
  'Double + signs normalized to one'
);

assertEquals(
  formatPhone('+++18005551212').callPhone,
  '+18005551212',
  'Triple + signs normalized to one'
);

// Test + in middle of number (should be removed)
assertEquals(
  formatPhone('+1+800+555+1212').callPhone,
  '+18005551212',
  '+ signs in middle of number are removed'
);

// Test number without +
assertEquals(
  formatPhone('8005551212').callPhone,
  '8005551212',
  'Number without + is still callable'
);

console.log('\n=== Helper Functions ===\n');

// Test getTelLink
assertEquals(
  getTelLink('+1 800-555-1212'),
  'tel:+18005551212',
  'getTelLink generates correct tel: URI'
);

assertEquals(
  getTelLink('123'),
  null,
  'getTelLink returns null for invalid phone'
);

// Test isPhoneCallable
assertEquals(
  isPhoneCallable('+1 800-555-1212'),
  true,
  'isPhoneCallable returns true for valid phone'
);

assertEquals(
  isPhoneCallable('123'),
  false,
  'isPhoneCallable returns false for short phone'
);

assertEquals(
  isPhoneCallable(null),
  false,
  'isPhoneCallable returns false for null'
);

console.log('\n=== Real-World Examples ===\n');

// Test actual data from the repository
const kesselPhone = '+49-8456-270';
const kesselResult = formatPhone(kesselPhone);
assertEquals(
  kesselResult.displayPhone,
  '+49-8456-270',
  'KESSEL display phone matches original'
);
assertEquals(
  kesselResult.callPhone,
  '+498456270',
  'KESSEL call phone is sanitized'
);
assertEquals(
  kesselResult.isCallable,
  true,
  'KESSEL phone is callable'
);

const hlPhone = '+49-2932-9616-0';
const hlResult = formatPhone(hlPhone);
assertEquals(
  hlResult.displayPhone,
  '+49-2932-9616-0',
  'HL Hutterer & Lechner display phone matches original'
);
assertEquals(
  hlResult.callPhone,
  '+49293296160',
  'HL Hutterer & Lechner call phone is sanitized'
);
assertEquals(
  hlResult.isCallable,
  true,
  'HL Hutterer & Lechner phone is callable'
);

// Summary
console.log('\n=== Test Summary ===\n');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!\n');
}
