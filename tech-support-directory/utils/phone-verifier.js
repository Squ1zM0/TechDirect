#!/usr/bin/env node
/**
 * Phone Number Verification Utility
 * 
 * Provides comprehensive phone number validation and verification capabilities:
 * - Format validation
 * - Country code validation
 * - Phone number parsing and normalization
 * - Structure validation
 * 
 * Usage:
 *   const { verifyPhone } = require('./phone-verifier');
 *   const result = await verifyPhone('+1-800-555-1212', 'US');
 */

/**
 * Country code patterns and validation rules
 */
const COUNTRY_CODES = {
  'US': { code: '+1', minDigits: 10, maxDigits: 10, pattern: /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/ },
  'CA': { code: '+1', minDigits: 10, maxDigits: 10, pattern: /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/ },
  'GB': { code: '+44', minDigits: 10, maxDigits: 10, pattern: /^\+?44[-.\s]?([0-9\s-]{10,})$/ },
  'DE': { code: '+49', minDigits: 9, maxDigits: 11, pattern: /^\+?49[-.\s]?([0-9\s-]{9,})$/ },
  'FR': { code: '+33', minDigits: 9, maxDigits: 9, pattern: /^\+?33[-.\s]?([0-9\s-]{9,})$/ },
  'MX': { code: '+52', minDigits: 10, maxDigits: 10, pattern: /^\+?52[-.\s]?([0-9\s-]{10,})$/ },
};

/**
 * Normalize a phone number to digits only (preserving leading +)
 * @param {string} phone - Raw phone number
 * @returns {string} Normalized phone number
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  
  // Keep leading +, remove all non-digits except the leading +
  let normalized = phone.trim();
  const hasLeadingPlus = normalized.startsWith('+');
  normalized = normalized.replace(/[^\d]/g, '');
  
  if (hasLeadingPlus && normalized) {
    normalized = '+' + normalized;
  }
  
  return normalized;
}

/**
 * Extract country code from phone number
 * @param {string} phone - Normalized phone number
 * @returns {string|null} Country code or null
 */
function extractCountryCode(phone) {
  if (!phone) return null;
  
  for (const [country, info] of Object.entries(COUNTRY_CODES)) {
    if (phone.startsWith(info.code)) {
      return country;
    }
  }
  
  return null;
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @param {string} expectedCountry - Expected country code (e.g., 'US', 'CA')
 * @returns {object} Validation result
 */
function validatePhoneFormat(phone, expectedCountry) {
  const result = {
    valid: false,
    normalized: '',
    country: expectedCountry || 'UNKNOWN',
    issues: [],
    confidence: 'unknown'
  };

  // Check if phone exists
  if (!phone || typeof phone !== 'string') {
    result.issues.push('Phone number is missing or invalid');
    return result;
  }

  // Normalize the phone number
  const normalized = normalizePhone(phone);
  result.normalized = normalized;

  if (!normalized) {
    result.issues.push('Phone number contains no digits');
    return result;
  }

  // Extract digit count
  const digitCount = normalized.replace(/\+/g, '').length;
  
  if (digitCount < 7) {
    result.issues.push(`Phone number too short (${digitCount} digits, minimum 7 required)`);
    return result;
  }

  // Try to detect country from phone
  const detectedCountry = extractCountryCode(normalized);
  
  if (detectedCountry) {
    result.country = detectedCountry;
  }

  // Validate against country-specific pattern if we have one
  if (expectedCountry && COUNTRY_CODES[expectedCountry]) {
    const countryInfo = COUNTRY_CODES[expectedCountry];
    
    // Check if it matches the pattern
    if (!phone.match(countryInfo.pattern)) {
      result.issues.push(`Does not match ${expectedCountry} phone format`);
      result.confidence = 'low';
    } else {
      // Check digit count (excluding country code and +)
      let digitsOnly = normalized.replace(/\+/g, '');
      
      // Remove country code prefix
      if (expectedCountry === 'US' || expectedCountry === 'CA') {
        digitsOnly = digitsOnly.replace(/^1/, ''); // Remove leading 1
      } else if (expectedCountry === 'GB') {
        digitsOnly = digitsOnly.replace(/^44/, ''); // Remove leading 44
      } else if (expectedCountry === 'DE') {
        digitsOnly = digitsOnly.replace(/^49/, ''); // Remove leading 49
      } else if (expectedCountry === 'FR') {
        digitsOnly = digitsOnly.replace(/^33/, ''); // Remove leading 33
      } else if (expectedCountry === 'MX') {
        digitsOnly = digitsOnly.replace(/^52/, ''); // Remove leading 52
      }
      
      if (digitsOnly.length >= countryInfo.minDigits && digitsOnly.length <= countryInfo.maxDigits) {
        result.valid = true;
        result.confidence = 'high';
      } else {
        result.issues.push(`Invalid digit count for ${expectedCountry} (expected ${countryInfo.minDigits}-${countryInfo.maxDigits}, got ${digitsOnly.length})`);
        result.confidence = 'low';
      }
    }
  } else {
    // No expected country or unknown country - basic validation
    if (digitCount >= 10 && digitCount <= 15) {
      result.valid = true;
      result.confidence = 'medium';
    } else if (digitCount >= 7 && digitCount < 10) {
      result.valid = true;
      result.confidence = 'low';
      result.issues.push('Phone number may be incomplete (7-9 digits)');
    } else {
      result.issues.push(`Unusual digit count (${digitCount} digits)`);
      result.confidence = 'low';
    }
  }

  return result;
}

/**
 * Verify phone number is active/valid
 * Note: Full verification requires external APIs (e.g., Twilio, Numverify)
 * This implementation provides format validation and basic checks
 * 
 * @param {string} phone - Phone number to verify
 * @param {string} country - Country code (e.g., 'US', 'CA')
 * @param {object} options - Verification options
 * @returns {Promise<object>} Verification result
 */
async function verifyPhone(phone, country, options = {}) {
  const timestamp = new Date().toISOString();
  
  const result = {
    phone: phone,
    timestamp: timestamp,
    status: 'unknown',
    checks: {
      format: null,
      country: null,
      callable: null
    },
    issues: [],
    recommendations: [],
    confidence: 'unknown',
    details: {}
  };

  try {
    // Format validation
    const formatCheck = validatePhoneFormat(phone, country);
    result.checks.format = formatCheck.valid ? 'pass' : 'fail';
    result.details.normalized = formatCheck.normalized;
    result.details.detectedCountry = formatCheck.country;
    result.confidence = formatCheck.confidence;
    
    if (!formatCheck.valid) {
      result.status = 'invalid';
      result.issues.push(...formatCheck.issues);
      
      // Provide recommendations
      if (country && COUNTRY_CODES[country]) {
        result.recommendations.push(`Ensure phone follows ${country} format: ${COUNTRY_CODES[country].code} followed by ${COUNTRY_CODES[country].minDigits} digits`);
      } else {
        result.recommendations.push('Provide a valid international phone number with country code');
      }
      
      return result;
    }

    // Country validation
    if (formatCheck.country !== 'UNKNOWN') {
      result.checks.country = 'pass';
      
      // US and CA share the same country code, so both are acceptable
      const detectedCountry = formatCheck.country;
      const isNorthAmerica = (detectedCountry === 'US' || detectedCountry === 'CA');
      const expectedNorthAmerica = (country === 'US' || country === 'CA');
      
      if (country && !(isNorthAmerica && expectedNorthAmerica) && formatCheck.country !== country) {
        result.checks.country = 'warning';
        result.issues.push(`Country mismatch: expected ${country}, detected ${formatCheck.country}`);
      }
    } else {
      result.checks.country = 'warning';
      result.issues.push('Country code not detected or unknown');
    }

    // Callable check (basic - checks if it's a valid tel: link format)
    const digitCount = formatCheck.normalized.replace(/\+/g, '').length;
    result.checks.callable = digitCount >= 7 ? 'pass' : 'fail';

    // Determine overall status
    if (result.checks.format === 'pass' && result.checks.callable === 'pass') {
      if (result.checks.country === 'pass') {
        result.status = 'valid';
      } else {
        result.status = 'warning';
      }
    } else {
      result.status = 'invalid';
    }

    // Note about active verification
    if (result.status === 'valid' && !options.skipActiveCheck) {
      result.details.activeCheckNote = 'Active phone verification requires external API (e.g., Twilio Lookup, Numverify). Format is valid.';
    }

  } catch (error) {
    result.status = 'error';
    result.issues.push(`Verification error: ${error.message}`);
    result.confidence = 'unknown';
  }

  return result;
}

/**
 * Batch verify multiple phone numbers
 * @param {Array} phones - Array of {phone, country} objects
 * @param {object} options - Verification options
 * @returns {Promise<Array>} Array of verification results
 */
async function batchVerifyPhones(phones, options = {}) {
  const results = [];
  
  for (const entry of phones) {
    const result = await verifyPhone(entry.phone, entry.country, options);
    results.push({
      ...result,
      id: entry.id || null,
      context: entry.context || null
    });
  }
  
  return results;
}

module.exports = {
  verifyPhone,
  batchVerifyPhones,
  validatePhoneFormat,
  normalizePhone,
  extractCountryCode,
  COUNTRY_CODES
};
