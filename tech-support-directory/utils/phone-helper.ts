/**
 * Phone validation and sanitization helper for the Tech Directory UI.
 * 
 * Handles international phone numbers with various formatting (hyphens, spaces, parentheses, dots).
 * Always displays the phone number if present, and generates safe tel: links for calling.
 */

export interface PhoneResult {
  /** Original phone string for display */
  displayPhone: string;
  /** Sanitized phone for tel: link, or null if invalid */
  callPhone: string | null;
  /** Whether the phone is valid enough to be callable */
  isCallable: boolean;
}

/**
 * Process a phone number for display and calling.
 * 
 * @param phone - Raw phone string from data
 * @returns PhoneResult with display and callable phone info
 * 
 * @example
 * ```ts
 * formatPhone("+1 800-555-1212")
 * // { displayPhone: "+1 800-555-1212", callPhone: "+18005551212", isCallable: true }
 * 
 * formatPhone("+49-2932-9616-0")
 * // { displayPhone: "+49-2932-9616-0", callPhone: "+49293296160", isCallable: true }
 * 
 * formatPhone("(800) 555-1212")
 * // { displayPhone: "(800) 555-1212", callPhone: "8005551212", isCallable: true }
 * ```
 */
export function formatPhone(phone: string | null | undefined): PhoneResult {
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
  // (using simple string operations for browser compatibility)
  if (sanitized.includes('+')) {
    const hasLeadingPlus = sanitized.startsWith('+');
    sanitized = sanitized.replace(/\+/g, '');
    if (hasLeadingPlus) {
      sanitized = '+' + sanitized;
    }
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
 * @param phone - Raw phone string
 * @returns tel: URI or null if not callable
 * 
 * @example
 * ```ts
 * getTelLink("+1 800-555-1212") // "tel:+18005551212"
 * getTelLink("+49-2932-9616-0") // "tel:+49293296160"
 * getTelLink("123") // null (too short)
 * ```
 */
export function getTelLink(phone: string | null | undefined): string | null {
  const result = formatPhone(phone);
  return result.callPhone ? `tel:${result.callPhone}` : null;
}

/**
 * Check if a phone number is valid enough to be callable.
 * 
 * @param phone - Raw phone string
 * @returns true if the phone can be called
 */
export function isPhoneCallable(phone: string | null | undefined): boolean {
  return formatPhone(phone).isCallable;
}
