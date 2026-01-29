# Contact Verification Tool

A comprehensive verification and validation tool for phone numbers and websites in the TechDirect repository.

## Features

### Phone Number Verification
- ✅ Format validation (country codes, structure)
- ✅ Phone number parsing and normalization
- ✅ Country code detection and validation
- ✅ Callable phone number checks
- ✅ Multi-country support (US, CA, GB, DE, FR, MX)
- ℹ️ Active/live verification (requires external API integration)

### Website Verification
- ✅ URL format validation
- ✅ HTTP/HTTPS accessibility checks
- ✅ SSL/TLS certificate validation
- ✅ Certificate expiration detection
- ✅ Redirect detection and tracking
- ✅ Response time measurement
- ✅ Security warnings for HTTP sites

### Reporting
- ✅ JSON output (machine-readable, detailed)
- ✅ CSV output (spreadsheet-compatible)
- ✅ Markdown output (human-readable summaries)
- ✅ Batch verification support
- ✅ Detailed issue tracking and recommendations

## Installation

No additional dependencies required beyond Node.js core modules.

## Usage

### Command Line Interface

```bash
# Verify all contacts (phones and websites)
node scripts/verify-contacts.js

# Verify only phone numbers
node scripts/verify-contacts.js --type phone

# Verify only websites
node scripts/verify-contacts.js --type website

# Verify specific manufacturer
node scripts/verify-contacts.js --manufacturer a-o-smith

# Generate JSON report
node scripts/verify-contacts.js --format json --output reports/verification.json

# Generate CSV report
node scripts/verify-contacts.js --format csv --output reports/verification.csv

# Verbose output
node scripts/verify-contacts.js --verbose

# Custom timeout (in milliseconds)
node scripts/verify-contacts.js --timeout 15000
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--type <phone\|website\|all>` | Type of verification to run | `all` |
| `--manufacturer <id>` | Verify specific manufacturer by ID | All manufacturers |
| `--format <json\|csv\|markdown>` | Output format | `markdown` |
| `--output <path>` | Output file path | Console output |
| `--timeout <ms>` | Request timeout in milliseconds | `10000` |
| `--verbose` | Show detailed progress | `false` |
| `--help` | Show help message | - |

### Programmatic Usage

#### Phone Verification

```javascript
const { verifyPhone, batchVerifyPhones } = require('./utils/phone-verifier');

// Verify single phone number
const result = await verifyPhone('+1-800-555-1212', 'US');
console.log(result.status); // 'valid', 'invalid', 'warning', 'error'
console.log(result.issues); // Array of issues found
console.log(result.recommendations); // Array of recommendations

// Batch verification
const phones = [
  { id: 'mfr1', phone: '+1-800-555-1212', country: 'US' },
  { id: 'mfr2', phone: '+44-20-1234-5678', country: 'GB' }
];
const results = await batchVerifyPhones(phones);
```

#### Website Verification

```javascript
const { verifyWebsite, batchVerifyWebsites } = require('./utils/website-verifier');

// Verify single website
const result = await verifyWebsite('https://www.example.com');
console.log(result.status); // 'valid', 'invalid', 'warning', 'inaccessible', 'error'
console.log(result.checks.ssl); // SSL certificate status
console.log(result.details.responseTime); // Response time in ms

// Batch verification
const websites = [
  { id: 'mfr1', url: 'https://www.example.com' },
  { id: 'mfr2', url: 'https://www.example.org' }
];
const results = await batchVerifyWebsites(websites, {
  timeout: 10000,
  delayBetweenRequests: 100
});
```

#### Report Generation

```javascript
const { generateReport, saveReport } = require('./utils/verification-report');

// Generate report
const report = generateReport(results, 'json', {
  type: 'phone',
  title: 'Phone Verification Report',
  description: 'Verification of manufacturer phone numbers'
});

// Save report to file
const outputPath = saveReport(report, 'verification-report.json', {
  outputDir: './reports'
});
```

## Output Formats

### JSON Format

Detailed machine-readable format with complete verification data:

```json
{
  "metadata": {
    "generatedAt": "2025-01-29T19:00:00.000Z",
    "version": "1.0.0",
    "type": "phone"
  },
  "summary": {
    "total": 100,
    "valid": 95,
    "invalid": 3,
    "warning": 2,
    "successRate": "95.00%"
  },
  "results": [
    {
      "phone": "+1-800-555-1212",
      "status": "valid",
      "confidence": "high",
      "checks": {
        "format": "pass",
        "country": "pass",
        "callable": "pass"
      },
      "issues": [],
      "recommendations": [],
      "details": {
        "normalized": "+18005551212",
        "detectedCountry": "US"
      }
    }
  ]
}
```

### CSV Format

Spreadsheet-compatible format for analysis:

```csv
ID,Phone Number,Country,Status,Confidence,Normalized,Format Check,Country Check,Callable Check,Issues,Recommendations,Timestamp
mfr1,+1-800-555-1212,US,valid,high,+18005551212,pass,pass,pass,,2025-01-29T19:00:00.000Z
```

### Markdown Format

Human-readable summary with key findings:

```markdown
# Phone Number Verification Report

**Generated:** 2025-01-29T19:00:00.000Z

## Summary

- **Total Entries:** 100
- **Valid:** 95 (95.00%)
- **Invalid:** 3
- **Warnings:** 2

## Issues Found

### mfr-xyz/hvac

- **Status:** invalid
- **Issues:**
  - Phone number too short (5 digits, minimum 7 required)
- **Recommendations:**
  - Ensure phone follows US format: +1 followed by 10 digits
```

## Verification Status Codes

### Phone Numbers

| Status | Description |
|--------|-------------|
| `valid` | Phone number passes all format checks and is callable |
| `invalid` | Phone number fails format validation or has structural issues |
| `warning` | Phone number is valid but has minor issues (e.g., country mismatch) |
| `error` | Verification process encountered an error |

### Websites

| Status | Description |
|--------|-------------|
| `valid` | Website URL is properly formatted and accessible |
| `invalid` | URL format is invalid |
| `inaccessible` | URL is properly formatted but website is not accessible |
| `warning` | Website is accessible but has issues (e.g., redirects, HTTP instead of HTTPS) |
| `error` | Verification process encountered an error |

## Confidence Levels

| Level | Description |
|-------|-------------|
| `high` | Verification result is highly reliable |
| `medium` | Verification result is moderately reliable (e.g., format valid but no country code) |
| `low` | Verification result has low confidence (e.g., unusual format) |
| `unknown` | Confidence cannot be determined |

## Phone Number Checks

1. **Format Check**: Validates phone number structure and digit count
2. **Country Check**: Verifies country code matches expected country
3. **Callable Check**: Ensures phone number can be used in tel: links

## Website Checks

1. **Format Check**: Validates URL structure and protocol
2. **Accessible Check**: Verifies website responds to HTTP requests
3. **SSL Check**: Validates HTTPS certificate (for HTTPS sites)
4. **Redirects Check**: Detects and tracks URL redirects

## Testing

Run the test suites to verify the verification tools:

```bash
# Test phone verifier
node utils/phone-verifier.test.js

# Test website verifier
node utils/website-verifier.test.js
```

## Configuration

The tool supports configuration through command-line options. Default settings:

- **Timeout**: 10000ms (10 seconds)
- **Delay Between Requests**: 100ms (for batch website verification)
- **Max Redirects**: 5

## Error Handling

The tool includes comprehensive error handling for:
- Network timeouts
- Connection errors
- Invalid data formats
- Missing files
- API rate limits (when external APIs are integrated)

## External API Integration

For full phone number verification (checking if numbers are active/disconnected), you can integrate external APIs:

### Supported APIs (requires API keys):
- **Twilio Lookup API**: Phone number validation and carrier lookup
- **Numverify**: Phone number validation and verification
- **Abstract API**: Phone number validation

To integrate, modify the `verifyPhone` function in `utils/phone-verifier.js` to call your chosen API when `skipActiveCheck` is false.

## Sample Data

Test the verification tool with sample data:

```bash
# Create a sample manufacturer YAML file
cat > /tmp/test-manufacturer.yaml << 'EOF'
id: test-company
name: Test Company
website: https://www.example.com
categories: [hvac]
support:
  - category: hvac
    department: Technical Support
    phone: "+18005551212"
    country: US
EOF

# Verify the sample data
node scripts/verify-contacts.js --manufacturer test-company
```

## Troubleshooting

### Network Timeouts

If you experience network timeouts, increase the timeout value:

```bash
node scripts/verify-contacts.js --timeout 20000
```

### SSL Certificate Warnings

Some websites may have self-signed or expired certificates. These will be flagged as warnings but won't prevent format validation.

### Rate Limiting

For batch verification of many websites, consider increasing the delay between requests:

Edit `scripts/verify-contacts.js` and modify:
```javascript
const CONFIG = {
  delayBetweenRequests: 500, // Increase from 100ms to 500ms
};
```

## Contributing

To add support for additional countries in phone verification:

1. Add country code patterns to `COUNTRY_CODES` in `utils/phone-verifier.js`
2. Add test cases in `utils/phone-verifier.test.js`
3. Run tests to verify

## License

This verification tool is part of the TechDirect repository. See the main repository LICENSE for details.
