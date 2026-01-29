#!/usr/bin/env node
/**
 * Website Verification Utility
 * 
 * Provides comprehensive website URL validation and verification capabilities:
 * - URL format validation
 * - HTTP/HTTPS accessibility checks
 * - SSL/TLS certificate validation
 * - Redirect detection
 * - Response time measurement
 * 
 * Usage:
 *   const { verifyWebsite } = require('./website-verifier');
 *   const result = await verifyWebsite('https://example.com');
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {object} Validation result
 */
function validateUrlFormat(url) {
  const result = {
    valid: false,
    parsed: null,
    issues: [],
    warnings: []
  };

  if (!url || typeof url !== 'string') {
    result.issues.push('URL is missing or invalid');
    return result;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    result.issues.push('URL is empty');
    return result;
  }

  try {
    // Try to parse the URL
    const parsed = new URL(trimmed);
    result.parsed = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash
    };

    // Check protocol
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      result.issues.push(`Invalid protocol: ${parsed.protocol} (expected http: or https:)`);
      return result;
    }

    // Check for HTTPS
    if (parsed.protocol === 'http:') {
      result.warnings.push('Using HTTP instead of HTTPS (not secure)');
    }

    // Check hostname
    if (!parsed.hostname) {
      result.issues.push('URL missing hostname');
      return result;
    }

    // Basic hostname validation
    const hostnamePattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    if (!hostnamePattern.test(parsed.hostname)) {
      result.issues.push('Invalid hostname format');
      return result;
    }

    result.valid = true;
  } catch (error) {
    result.issues.push(`URL parsing error: ${error.message}`);
  }

  return result;
}

/**
 * Check website accessibility via HTTP/HTTPS
 * @param {string} url - URL to check
 * @param {object} options - Check options
 * @returns {Promise<object>} Accessibility check result
 */
function checkAccessibility(url, options = {}) {
  return new Promise((resolve) => {
    const timeout = options.timeout || 10000;
    const maxRedirects = options.maxRedirects || 5;
    let redirectCount = 0;
    const redirectChain = [];
    
    const result = {
      accessible: false,
      statusCode: null,
      statusMessage: null,
      responseTime: null,
      redirects: [],
      ssl: null,
      headers: {},
      error: null
    };

    const startTime = Date.now();

    function makeRequest(requestUrl) {
      let parsedUrl;
      try {
        parsedUrl = new URL(requestUrl);
      } catch (error) {
        result.error = `Invalid URL: ${error.message}`;
        resolve(result);
        return;
      }

      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'HEAD',
        timeout: timeout,
        headers: {
          'User-Agent': 'TechDirect-Verification-Tool/1.0'
        },
        // For HTTPS: We disable strict SSL verification to allow checking certificates
        // separately. This lets us provide detailed certificate information even for
        // expired or self-signed certificates. The certificate is still checked and
        // reported in the result.ssl object.
        // Security note: This makes certificate verification informational rather than
        // blocking. For production use, consider setting rejectUnauthorized: true.
        rejectUnauthorized: false
      };

      const req = client.request(requestOptions, (res) => {
        const responseTime = Date.now() - startTime;
        result.responseTime = responseTime;
        result.statusCode = res.statusCode;
        result.statusMessage = res.statusMessage;
        result.headers = res.headers;

        // Check SSL/TLS for HTTPS
        if (parsedUrl.protocol === 'https:' && res.socket && res.socket.getPeerCertificate) {
          try {
            const cert = res.socket.getPeerCertificate();
            if (cert && Object.keys(cert).length > 0) {
              result.ssl = {
                valid: res.socket.authorized,
                validFrom: cert.valid_from,
                validTo: cert.valid_to,
                issuer: cert.issuer ? cert.issuer.O : 'Unknown',
                subject: cert.subject ? cert.subject.CN : parsedUrl.hostname
              };
            }
          } catch (certError) {
            result.ssl = { error: certError.message };
          }
        }

        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          redirectCount++;
          const redirectUrl = res.headers.location;
          
          // Resolve relative URLs
          let absoluteRedirectUrl;
          try {
            absoluteRedirectUrl = new URL(redirectUrl, requestUrl).href;
          } catch (error) {
            absoluteRedirectUrl = redirectUrl;
          }
          
          redirectChain.push({
            from: requestUrl,
            to: absoluteRedirectUrl,
            statusCode: res.statusCode
          });

          if (redirectCount <= maxRedirects) {
            makeRequest(absoluteRedirectUrl);
            return; // Prevent further execution after recursive call
          } else {
            result.error = `Too many redirects (${redirectCount})`;
            result.redirects = redirectChain;
            resolve(result);
          }
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          // Success
          result.accessible = true;
          result.redirects = redirectChain;
          resolve(result);
        } else {
          // Error status code
          result.accessible = false;
          result.redirects = redirectChain;
          resolve(result);
        }
      });

      req.on('error', (error) => {
        result.error = error.message;
        result.responseTime = Date.now() - startTime;
        resolve(result);
      });

      req.on('timeout', () => {
        req.destroy();
        result.error = `Request timeout (${timeout}ms)`;
        result.responseTime = Date.now() - startTime;
        resolve(result);
      });

      req.end();
    }

    makeRequest(url);
  });
}

/**
 * Verify a website URL
 * @param {string} url - Website URL to verify
 * @param {object} options - Verification options
 * @returns {Promise<object>} Verification result
 */
async function verifyWebsite(url, options = {}) {
  const timestamp = new Date().toISOString();
  
  const result = {
    url: url,
    timestamp: timestamp,
    status: 'unknown',
    checks: {
      format: null,
      accessible: null,
      ssl: null,
      redirects: null
    },
    issues: [],
    warnings: [],
    recommendations: [],
    confidence: 'unknown',
    details: {}
  };

  try {
    // Format validation
    const formatCheck = validateUrlFormat(url);
    result.checks.format = formatCheck.valid ? 'pass' : 'fail';
    
    if (formatCheck.warnings.length > 0) {
      result.warnings.push(...formatCheck.warnings);
    }
    
    if (!formatCheck.valid) {
      result.status = 'invalid';
      result.issues.push(...formatCheck.issues);
      result.recommendations.push('Ensure URL starts with http:// or https:// and has a valid domain name');
      result.confidence = 'high';
      return result;
    }

    result.details.parsed = formatCheck.parsed;

    // Accessibility check
    if (!options.skipAccessibilityCheck) {
      const accessCheck = await checkAccessibility(url, options);
      
      result.details.statusCode = accessCheck.statusCode;
      result.details.responseTime = accessCheck.responseTime;
      result.details.redirects = accessCheck.redirects;
      
      if (accessCheck.error) {
        result.checks.accessible = 'fail';
        result.issues.push(`Accessibility error: ${accessCheck.error}`);
        result.status = 'inaccessible';
        result.confidence = 'high';
        result.recommendations.push('Verify the URL is correct and the website is online');
      } else if (!accessCheck.accessible) {
        result.checks.accessible = 'fail';
        result.issues.push(`HTTP error: ${accessCheck.statusCode} ${accessCheck.statusMessage}`);
        result.status = 'inaccessible';
        result.confidence = 'high';
        
        if (accessCheck.statusCode === 404) {
          result.recommendations.push('Page not found - verify the URL path is correct');
        } else if (accessCheck.statusCode >= 500) {
          result.recommendations.push('Server error - website may be temporarily down');
        }
      } else {
        result.checks.accessible = 'pass';
        
        // Check redirects
        if (accessCheck.redirects.length > 0) {
          result.checks.redirects = 'warning';
          result.warnings.push(`URL redirects ${accessCheck.redirects.length} time(s)`);
          result.details.finalUrl = accessCheck.redirects[accessCheck.redirects.length - 1].to;
          
          // Check if redirect changes protocol
          const originalProtocol = formatCheck.parsed.protocol;
          try {
            const finalUrl = new URL(result.details.finalUrl);
            if (originalProtocol === 'http:' && finalUrl.protocol === 'https:') {
              result.warnings.push('Redirects from HTTP to HTTPS - consider updating URL to use HTTPS directly');
            }
          } catch (e) {
            // Ignore URL parsing errors for final URL
          }
        } else {
          result.checks.redirects = 'pass';
        }

        // SSL check for HTTPS
        if (formatCheck.parsed.protocol === 'https:') {
          if (accessCheck.ssl) {
            if (accessCheck.ssl.error) {
              result.checks.ssl = 'warning';
              result.warnings.push(`SSL certificate warning: ${accessCheck.ssl.error}`);
            } else if (accessCheck.ssl.valid) {
              result.checks.ssl = 'pass';
              result.details.ssl = accessCheck.ssl;
              
              // Check certificate expiration
              if (accessCheck.ssl.validTo) {
                try {
                  const expiryDate = new Date(accessCheck.ssl.validTo);
                  const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                  
                  if (daysUntilExpiry < 0) {
                    result.checks.ssl = 'fail';
                    result.issues.push('SSL certificate has expired');
                  } else if (daysUntilExpiry < 30) {
                    result.warnings.push(`SSL certificate expires soon (${daysUntilExpiry} days)`);
                  }
                } catch (e) {
                  // Ignore date parsing errors
                }
              }
            } else {
              result.checks.ssl = 'warning';
              result.warnings.push('SSL certificate validation warning');
            }
          } else {
            result.checks.ssl = 'warning';
            result.warnings.push('Unable to verify SSL certificate');
          }
        } else {
          result.checks.ssl = 'warning';
          result.warnings.push('Not using HTTPS encryption');
        }

        // Determine overall status
        if (result.issues.length === 0) {
          if (result.warnings.length === 0) {
            result.status = 'valid';
            result.confidence = 'high';
          } else {
            result.status = 'warning';
            result.confidence = 'medium';
          }
        } else {
          result.status = 'invalid';
          result.confidence = 'high';
        }
      }
    } else {
      // Skip accessibility check
      result.status = 'valid';
      result.confidence = 'medium';
      result.details.note = 'Accessibility check skipped';
    }

  } catch (error) {
    result.status = 'error';
    result.issues.push(`Verification error: ${error.message}`);
    result.confidence = 'unknown';
  }

  return result;
}

/**
 * Batch verify multiple websites
 * @param {Array} urls - Array of URLs or {url, id, context} objects
 * @param {object} options - Verification options
 * @returns {Promise<Array>} Array of verification results
 */
async function batchVerifyWebsites(urls, options = {}) {
  const results = [];
  
  for (const entry of urls) {
    const url = typeof entry === 'string' ? entry : entry.url;
    const result = await verifyWebsite(url, options);
    
    if (typeof entry === 'object') {
      results.push({
        ...result,
        id: entry.id || null,
        context: entry.context || null
      });
    } else {
      results.push(result);
    }
    
    // Add small delay to avoid overwhelming servers
    if (options.delayBetweenRequests) {
      await new Promise(resolve => setTimeout(resolve, options.delayBetweenRequests));
    }
  }
  
  return results;
}

module.exports = {
  verifyWebsite,
  batchVerifyWebsites,
  validateUrlFormat,
  checkAccessibility
};
