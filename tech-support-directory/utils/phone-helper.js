/**
 * Phone validation and sanitization helper for the Tech Directory UI.
 * 
 * Handles international phone numbers with various formatting (hyphens, spaces, parentheses, dots).
 * Always displays the phone number if present, and generates safe tel: links for calling.
 */

/**
 * Process a phone number for display and calling.
 * 
 * @param {string | null | undefined} phone - Raw phone string from data
 * @returns {{displayPhone: string, callPhone: string | null, isCallable: boolean}} PhoneResult with display and callable phone info
 * 
 * @example
 * formatPhone("+1 800-555-1212")
 * // { displayPhone: "+1 800-555-1212", callPhone: "+18005551212", isCallable: true }
 * 
 * formatPhone("+49-2932-9616-0")
 * // { displayPhone: "+49-2932-9616-0", callPhone: "+49293296160", isCallable: true }
 * 
 * formatPhone("(800) 555-1212")
 * // { displayPhone: "(800) 555-1212", callPhone: "8005551212", isCallable: true }
 */
export function formatPhone(phone) {
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

  // Normalize multiple + signs to single +
  if (sanitized.startsWith('++')) {
    sanitized = '+' + sanitized.slice(2);
  }

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

/**
 * Generate a safe tel: link from a phone number.
 * 
 * @param {string | null | undefined} phone - Raw phone string
 * @returns {string | null} tel: URI or null if not callable
 * 
 * @example
 * getTelLink("+1 800-555-1212") // "tel:+18005551212"
 * getTelLink("+49-2932-9616-0") // "tel:+49293296160"
 * getTelLink("123") // null (too short)
 */
export function getTelLink(phone) {
  const result = formatPhone(phone);
  return result.callPhone ? `tel:${result.callPhone}` : null;
}

/**
 * Check if a phone number is valid enough to be callable.
 * 
 * @param {string | null | undefined} phone - Raw phone string
 * @returns {boolean} true if the phone can be called
 */
export function isPhoneCallable(phone) {
  return formatPhone(phone).isCallable;
}

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatPhone,
    getTelLink,
    isPhoneCallable
  };
}
