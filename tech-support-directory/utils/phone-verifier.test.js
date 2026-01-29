#!/usr/bin/env node
/**
 * Test suite for phone-verifier.js
 * Run with: node utils/phone-verifier.test.js
 */

const { 
  verifyPhone, 
  validatePhoneFormat, 
  normalizePhone,
  extractCountryCode,
  COUNTRY_CODES 
} = require('./phone-verifier');

// Simple test framework
let passed = 0;
let failed = 0;
let testCount = 0;

function assertEquals(actual, expected, testName) {
  testCount++;
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

function assertTrue(value, testName) {
  testCount++;
  if (value) {
    console.log(`✅ ${testName}`);
    passed++;
  } else {
    console.log(`❌ ${testName}`);
    console.log(`   Expected: true`);
    console.log(`   Actual:   ${value}`);
    failed++;
  }
}

function assertFalse(value, testName) {
  testCount++;
  if (!value) {
    console.log(`✅ ${testName}`);
    passed++;
  } else {
    console.log(`❌ ${testName}`);
    console.log(`   Expected: false`);
    console.log(`   Actual:   ${value}`);
    failed++;
  }
}

async function runTests() {
  console.log('Running phone-verifier tests...\n');

  // Test normalizePhone
  console.log('=== normalizePhone Tests ===');
  assertEquals(normalizePhone('+1-800-555-1212'), '+18005551212', 'Normalize US phone with dashes');
  assertEquals(normalizePhone('(800) 555-1212'), '8005551212', 'Normalize US phone with parentheses');
  assertEquals(normalizePhone('+49-2932-9616-0'), '+49293296160', 'Normalize German phone');
  assertEquals(normalizePhone('  +1 800 555 1212  '), '+18005551212', 'Normalize with whitespace');
  assertEquals(normalizePhone(''), '', 'Empty string returns empty');
  assertEquals(normalizePhone(null), '', 'Null returns empty');

  // Test extractCountryCode
  console.log('\n=== extractCountryCode Tests ===');
  assertEquals(extractCountryCode('+18005551212'), 'US', 'Extract US country code');
  assertEquals(extractCountryCode('+49293296160'), 'DE', 'Extract DE country code');
  assertEquals(extractCountryCode('+441234567890'), 'GB', 'Extract GB country code');
  assertEquals(extractCountryCode('8005551212'), null, 'No country code returns null');

  // Test validatePhoneFormat
  console.log('\n=== validatePhoneFormat Tests ===');
  
  const usValid = validatePhoneFormat('+1-800-555-1212', 'US');
  assertTrue(usValid.valid, 'US phone format is valid');
  assertEquals(usValid.country, 'US', 'US phone country detected');
  assertEquals(usValid.confidence, 'high', 'US phone has high confidence');

  const usInvalid = validatePhoneFormat('123', 'US');
  assertFalse(usInvalid.valid, 'Short phone is invalid');
  assertTrue(usInvalid.issues.length > 0, 'Invalid phone has issues');

  const deValid = validatePhoneFormat('+49-2932-9616-0', 'DE');
  assertTrue(deValid.valid, 'DE phone format is valid');
  assertEquals(deValid.country, 'DE', 'DE phone country detected');

  const noCountry = validatePhoneFormat('5551234567', null);
  assertTrue(noCountry.valid, 'Phone without country code can be valid');
  assertEquals(noCountry.confidence, 'medium', 'Phone without country has medium confidence');

  // Test verifyPhone
  console.log('\n=== verifyPhone Tests ===');
  
  const usVerification = await verifyPhone('+1-800-555-1212', 'US');
  assertEquals(usVerification.status, 'valid', 'US phone verification status is valid');
  assertEquals(usVerification.checks.format, 'pass', 'US phone format check passes');
  assertEquals(usVerification.checks.callable, 'pass', 'US phone callable check passes');

  const invalidVerification = await verifyPhone('123', 'US');
  assertEquals(invalidVerification.status, 'invalid', 'Invalid phone verification status is invalid');
  assertEquals(invalidVerification.checks.format, 'fail', 'Invalid phone format check fails');

  const emptyVerification = await verifyPhone('', 'US');
  assertEquals(emptyVerification.status, 'invalid', 'Empty phone verification status is invalid');
  assertTrue(emptyVerification.issues.length > 0, 'Empty phone has issues');

  const canadianVerification = await verifyPhone('+1-416-555-1212', 'CA');
  assertEquals(canadianVerification.status, 'valid', 'Canadian phone verification status is valid');

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log(`Tests completed: ${testCount}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
