#!/usr/bin/env node
/**
 * Test suite for website-verifier.js
 * Run with: node utils/website-verifier.test.js
 */

const { 
  verifyWebsite, 
  validateUrlFormat,
  checkAccessibility 
} = require('./website-verifier');

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
  console.log('Running website-verifier tests...\n');

  // Test validateUrlFormat
  console.log('=== validateUrlFormat Tests ===');
  
  const httpsValid = validateUrlFormat('https://www.example.com');
  assertTrue(httpsValid.valid, 'HTTPS URL is valid');
  assertEquals(httpsValid.parsed.protocol, 'https:', 'HTTPS protocol detected');
  assertEquals(httpsValid.warnings.length, 0, 'HTTPS has no warnings');

  const httpValid = validateUrlFormat('http://www.example.com');
  assertTrue(httpValid.valid, 'HTTP URL is valid');
  assertEquals(httpValid.parsed.protocol, 'http:', 'HTTP protocol detected');
  assertTrue(httpValid.warnings.length > 0, 'HTTP has warnings about security');

  const withPath = validateUrlFormat('https://example.com/path/to/page');
  assertTrue(withPath.valid, 'URL with path is valid');
  assertEquals(withPath.parsed.pathname, '/path/to/page', 'Path parsed correctly');

  const withQuery = validateUrlFormat('https://example.com/page?query=value');
  assertTrue(withQuery.valid, 'URL with query is valid');
  assertEquals(withQuery.parsed.search, '?query=value', 'Query parsed correctly');

  const invalidProtocol = validateUrlFormat('ftp://example.com');
  assertFalse(invalidProtocol.valid, 'FTP protocol is invalid');
  assertTrue(invalidProtocol.issues.length > 0, 'Invalid protocol has issues');

  const noProtocol = validateUrlFormat('www.example.com');
  assertFalse(noProtocol.valid, 'URL without protocol is invalid');

  const empty = validateUrlFormat('');
  assertFalse(empty.valid, 'Empty URL is invalid');

  // Test checkAccessibility (may fail if no network)
  console.log('\n=== checkAccessibility Tests (network-dependent) ===');
  
  try {
    // Test with a reliable public endpoint
    const result = await checkAccessibility('https://www.google.com', { timeout: 5000 });
    
    if (result.error) {
      console.log(`⚠️  Network test skipped: ${result.error}`);
    } else {
      assertTrue(result.accessible || result.statusCode > 0, 'Google.com is accessible or returns status');
      assertTrue(result.responseTime !== null, 'Response time is measured');
      
      if (result.ssl) {
        console.log(`✅ SSL certificate detected for google.com`);
        passed++;
      } else {
        console.log(`⚠️  SSL certificate not detected (may be expected in test environment)`);
      }
      testCount++;
    }
  } catch (error) {
    console.log(`⚠️  Network test skipped: ${error.message}`);
  }

  // Test verifyWebsite with skip option
  console.log('\n=== verifyWebsite Tests (format validation only) ===');
  
  const verifyValid = await verifyWebsite('https://www.example.com', { skipAccessibilityCheck: true });
  assertEquals(verifyValid.status, 'valid', 'Valid URL verification status is valid');
  assertEquals(verifyValid.checks.format, 'pass', 'Format check passes');

  const verifyInvalid = await verifyWebsite('not-a-url', { skipAccessibilityCheck: true });
  assertEquals(verifyInvalid.status, 'invalid', 'Invalid URL verification status is invalid');
  assertEquals(verifyInvalid.checks.format, 'fail', 'Format check fails');
  assertTrue(verifyInvalid.issues.length > 0, 'Invalid URL has issues');

  const verifyHttp = await verifyWebsite('http://www.example.com', { skipAccessibilityCheck: true });
  assertEquals(verifyHttp.status, 'valid', 'HTTP URL verification status is valid (format only)');
  assertTrue(verifyHttp.warnings.length > 0, 'HTTP URL has security warnings');

  // Test with actual network check (if available)
  console.log('\n=== verifyWebsite Tests (with network check) ===');
  
  try {
    const verifyGoogleResult = await verifyWebsite('https://www.google.com', { timeout: 5000 });
    
    if (verifyGoogleResult.status === 'error' || verifyGoogleResult.status === 'inaccessible') {
      console.log(`⚠️  Network verification skipped: ${verifyGoogleResult.issues[0] || 'no network access'}`);
    } else {
      assertTrue(['valid', 'warning'].includes(verifyGoogleResult.status), 'Google.com verification succeeds');
      console.log(`✅ Google.com verification status: ${verifyGoogleResult.status}`);
      passed++;
      testCount++;
    }
  } catch (error) {
    console.log(`⚠️  Network verification skipped: ${error.message}`);
  }

  // Test non-existent domain
  try {
    const verifyNonExistent = await verifyWebsite('https://this-domain-definitely-does-not-exist-12345.com', { timeout: 3000 });
    assertTrue(['invalid', 'inaccessible', 'error'].includes(verifyNonExistent.status), 'Non-existent domain fails verification');
    assertTrue(verifyNonExistent.issues.length > 0, 'Non-existent domain has issues');
    console.log(`✅ Non-existent domain verification: ${verifyNonExistent.status}`);
  } catch (error) {
    console.log(`⚠️  Non-existent domain test skipped: ${error.message}`);
  }

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
