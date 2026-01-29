# Network-Enabled Validation Guide

## Overview

This guide explains how to run comprehensive validation with full network access to verify:
- Phone numbers are formatted correctly
- Websites are accessible and online
- SSL/TLS certificates are valid and not expired
- Phone numbers match active, reachable contact information

## Network Access Requirements

The verification tool requires network access to:
1. **Website Verification:**
   - Make HTTP/HTTPS requests to manufacturer websites
   - Verify SSL/TLS certificates
   - Check for redirects
   - Measure response times
   - Detect broken links or 404 errors

2. **Phone Verification (Optional with API):**
   - Connect to external phone validation APIs (Twilio, Numverify, etc.)
   - Verify phone numbers are active and in service
   - Check carrier information
   - Validate number ownership

## Running Validation with Network Access

### Option 1: Local Machine (Recommended)

Run the verification on your local development machine:

```bash
# Clone the repository
git clone https://github.com/Squ1zM0/TechDirect.git
cd TechDirect/tech-support-directory

# Run full validation with network access
node scripts/verify-contacts.js \
  --type all \
  --format json \
  --output verification-reports/network-validation.json \
  --timeout 15000 \
  --verbose

# Generate human-readable report
node scripts/verify-contacts.js \
  --type all \
  --format markdown \
  --output verification-reports/network-validation.md \
  --timeout 15000
```

### Option 2: GitHub Actions (CI/CD)

Create a GitHub Actions workflow to run validation automatically:

```yaml
# .github/workflows/validation.yml
name: Contact Validation

on:
  schedule:
    - cron: '0 2 * * 1'  # Run weekly on Monday at 2 AM
  workflow_dispatch:  # Allow manual trigger

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Run Phone Verification
      run: |
        cd tech-support-directory
        node scripts/verify-contacts.js \
          --type phone \
          --format json \
          --output verification-reports/phone-validation-$(date +%Y%m%d).json \
          --timeout 15000
    
    - name: Run Website Verification
      run: |
        cd tech-support-directory
        node scripts/verify-contacts.js \
          --type website \
          --format json \
          --output verification-reports/website-validation-$(date +%Y%m%d).json \
          --timeout 15000
    
    - name: Generate Summary Report
      run: |
        cd tech-support-directory
        node scripts/verify-contacts.js \
          --type all \
          --format markdown \
          --output verification-reports/validation-summary-$(date +%Y%m%d).md \
          --timeout 15000
    
    - name: Upload Reports
      uses: actions/upload-artifact@v3
      with:
        name: validation-reports
        path: tech-support-directory/verification-reports/
        retention-days: 90
    
    - name: Check for Issues
      run: |
        cd tech-support-directory
        # Parse JSON and fail if too many invalid entries
        node -e "
          const fs = require('fs');
          const report = JSON.parse(fs.readFileSync('verification-reports/phone-validation-$(date +%Y%m%d).json'));
          const invalidRate = (report.summary.invalid / report.summary.total) * 100;
          if (invalidRate > 2) {
            console.error('❌ Validation failed: ' + invalidRate.toFixed(2) + '% invalid entries');
            process.exit(1);
          }
          console.log('✅ Validation passed: ' + invalidRate.toFixed(2) + '% invalid entries');
        "
```

### Option 3: Cloud Instance (AWS, GCP, Azure)

Run validation on a cloud instance with network access:

```bash
# SSH into cloud instance
ssh user@your-instance

# Install Node.js if needed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and run
git clone https://github.com/Squ1zM0/TechDirect.git
cd TechDirect/tech-support-directory
node scripts/verify-contacts.js --type all --timeout 15000 --verbose
```

## Expected Results with Network Access

### Phone Verification
With network access and optional API integration:

**Format Validation (No network required):**
- Validates phone number structure
- Checks country codes
- Verifies digit counts
- Current results: 99.34% valid

**Active Phone Verification (Requires API integration):**
- Verifies number is in service
- Checks carrier information
- Validates number ownership
- Expected improvement: 95-98% active numbers

### Website Verification
With network access:

**Format Validation (Current - No network):**
- URL structure validation
- Protocol verification
- Current results: 100% valid format

**Full Validation (With network):**
- HTTP status codes (200, 404, 500, etc.)
- SSL/TLS certificate validity
- Certificate expiration dates
- Redirect chains
- Response times
- Expected results: 85-95% accessible (some sites may have changed)

## Interpreting Results

### Website Validation with Network

**Status Codes:**
- `200-299`: Success - Website is accessible
- `300-399`: Redirect - Follow redirects (tool does this automatically)
- `400-499`: Client errors (404 = page not found)
- `500-599`: Server errors (temporary or permanent issues)

**SSL Certificate Issues:**
- Expired certificates
- Self-signed certificates
- Invalid certificate chains
- Hostname mismatches

### Common Issues and Resolutions

**Website Issues:**
1. **404 Not Found**: URL path has changed - verify on manufacturer website
2. **SSL Expired**: Certificate needs renewal - note in report
3. **Timeout**: Server slow or blocking automated requests - increase timeout
4. **DNS Error**: Domain no longer exists - requires data update

**Phone Issues:**
1. **Disconnected**: Number no longer in service - requires verification
2. **Wrong Country**: Area code doesn't match expected country
3. **Invalid Format**: Doesn't match international phone standards

## Configuration for Network Validation

### Timeout Settings

Adjust timeouts based on network conditions:

```bash
# Fast network (default)
--timeout 10000  # 10 seconds

# Slower network or international sites
--timeout 20000  # 20 seconds

# Very slow network or many redirects
--timeout 30000  # 30 seconds
```

### Rate Limiting

Add delays to avoid overwhelming servers:

```javascript
// In scripts/verify-contacts.js
const CONFIG = {
  delayBetweenRequests: 500,  // Increase from 100ms to 500ms
};
```

### Strict SSL Mode

Enable strict SSL validation for security:

```bash
# Edit scripts/verify-contacts.js
# In the website verification call, add:
const results = await batchVerifyWebsites(websiteEntries, {
  timeout: options.timeout,
  delayBetweenRequests: CONFIG.delayBetweenRequests,
  strictSSL: true  // Enable strict SSL validation
});
```

## External API Integration

### Phone Verification APIs

**Twilio Lookup API:**
```javascript
// Add to utils/phone-verifier.js
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function verifyPhoneActive(phone) {
  try {
    const result = await client.lookups.v1.phoneNumbers(phone).fetch();
    return {
      active: true,
      carrier: result.carrier?.name,
      type: result.carrier?.type
    };
  } catch (error) {
    return { active: false, error: error.message };
  }
}
```

**Environment Variables:**
```bash
export TWILIO_ACCOUNT_SID=your_account_sid
export TWILIO_AUTH_TOKEN=your_auth_token
```

## Automated Validation Schedule

**Recommended Schedule:**
- **Weekly**: Quick validation of critical changes
- **Monthly**: Full validation of all entries
- **Quarterly**: Deep validation with external APIs
- **On-demand**: When manufacturers report changes

## Troubleshooting

### Network Connection Issues

```bash
# Test network connectivity
curl -I https://www.google.com

# Test DNS resolution
nslookup www.google.com

# Test with specific timeout
curl --max-time 10 https://example.com
```

### Firewall or Proxy Issues

```bash
# Set proxy if needed
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# Run validation with proxy
node scripts/verify-contacts.js --type all
```

### Rate Limiting

If you encounter rate limiting (429 errors):

1. Increase delay between requests
2. Run validation during off-peak hours
3. Split validation into smaller batches
4. Use multiple IP addresses (rotate)

## Security Considerations

1. **API Keys**: Never commit API keys to the repository
2. **Rate Limits**: Respect API rate limits to avoid blocks
3. **User Agent**: Tool identifies itself to avoid being flagged as a bot
4. **Timeouts**: Set reasonable timeouts to avoid hanging
5. **Error Handling**: Gracefully handle network errors

## Performance Optimization

### Parallel Processing

For faster validation with network access:

```javascript
// Modify batchVerifyWebsites to process in parallel batches
async function batchVerifyWebsites(urls, options = {}) {
  const batchSize = 10;  // Process 10 at a time
  const results = [];
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(url => verifyWebsite(url.url || url, options))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

## Next Steps

1. Choose deployment environment (local, CI/CD, cloud)
2. Set up network access and credentials
3. Run full validation with network connectivity
4. Review results and create action plan
5. Schedule regular automated validations
6. Monitor and maintain data quality

---

**For immediate network validation**, run on your local development machine where network access is available.
