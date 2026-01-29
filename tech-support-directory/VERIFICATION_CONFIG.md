# Verification Tool Configuration

This file documents configuration options for the contact verification tool.

## Command-Line Configuration

Configure the verification tool using command-line options:

```bash
node scripts/verify-contacts.js \
  --type all \
  --format markdown \
  --timeout 10000 \
  --verbose
```

## Environment Variables

The tool supports the following environment variables:

- `VERIFICATION_TIMEOUT`: Default timeout in milliseconds (default: 10000)
- `VERIFICATION_DELAY`: Delay between requests in milliseconds (default: 100)
- `VERIFICATION_MAX_REDIRECTS`: Maximum number of redirects to follow (default: 5)

Example:
```bash
export VERIFICATION_TIMEOUT=15000
export VERIFICATION_DELAY=200
node scripts/verify-contacts.js
```

## External API Integration (Optional)

For enhanced phone verification (checking if numbers are active), you can integrate external APIs.

### Twilio Lookup API

1. Sign up for Twilio account: https://www.twilio.com/
2. Get your Account SID and Auth Token
3. Set environment variables:
   ```bash
   export TWILIO_ACCOUNT_SID=your_account_sid
   export TWILIO_AUTH_TOKEN=your_auth_token
   ```
4. Modify `utils/phone-verifier.js` to use Twilio API when `skipActiveCheck` is false

### Numverify API

1. Sign up for Numverify account: https://numverify.com/
2. Get your API key
3. Set environment variable:
   ```bash
   export NUMVERIFY_API_KEY=your_api_key
   ```
4. Modify `utils/phone-verifier.js` to use Numverify API when `skipActiveCheck` is false

### Abstract API

1. Sign up for Abstract API account: https://www.abstractapi.com/
2. Get your API key
3. Set environment variable:
   ```bash
   export ABSTRACT_API_KEY=your_api_key
   ```
4. Modify `utils/phone-verifier.js` to use Abstract API when `skipActiveCheck` is false

## Batch Processing Configuration

For large-scale verification:

```bash
# Increase timeout for slow networks
node scripts/verify-contacts.js --timeout 20000

# Process specific subset
node scripts/verify-contacts.js --manufacturer-pattern "a-*"
```

## Output Configuration

### Save to Files

```bash
# Save JSON report
node scripts/verify-contacts.js --format json --output reports/verification.json

# Save CSV report
node scripts/verify-contacts.js --format csv --output reports/verification.csv

# Save Markdown report
node scripts/verify-contacts.js --format markdown --output reports/verification.md
```

### Multiple Output Formats

To generate multiple formats, run the tool multiple times:

```bash
node scripts/verify-contacts.js --format json --output reports/verification.json
node scripts/verify-contacts.js --format csv --output reports/verification.csv
node scripts/verify-contacts.js --format markdown --output reports/verification.md
```

## Advanced Configuration

### Custom Verification Logic

You can extend the verification logic by modifying the utility modules:

- `utils/phone-verifier.js` - Add custom phone validation rules
- `utils/website-verifier.js` - Add custom website checks
- `utils/verification-report.js` - Customize report formats

### Adding Country Support

To add support for additional countries in phone verification:

1. Add country code to `COUNTRY_CODES` in `utils/phone-verifier.js`:
   ```javascript
   'AU': { 
     code: '+61', 
     minDigits: 9, 
     maxDigits: 9, 
     pattern: /^\+?61[-.\s]?([0-9\s-]{9,})$/ 
   }
   ```

2. Add test cases in `utils/phone-verifier.test.js`

3. Run tests to verify: `node utils/phone-verifier.test.js`

## Scheduled Verification

To run verification on a schedule, use cron (Linux/macOS) or Task Scheduler (Windows):

### Linux/macOS Cron Example

```bash
# Edit crontab
crontab -e

# Add line to run verification daily at 2 AM
0 2 * * * cd /path/to/tech-support-directory && node scripts/verify-contacts.js --format markdown --output reports/daily-verification.md
```

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily at 2:00 AM)
4. Set action: Start a program
   - Program: `node`
   - Arguments: `scripts/verify-contacts.js --format markdown --output reports/daily-verification.md`
   - Start in: `C:\path\to\tech-support-directory`

## Performance Tuning

For optimal performance:

1. **Parallel Processing**: The tool processes items sequentially to avoid overwhelming servers. For faster processing, you can modify the batch functions to use Promise.all()

2. **Caching**: Implement caching for verification results to avoid redundant checks:
   ```javascript
   // Example: Cache results for 24 hours
   const cache = new Map();
   const cacheKey = `${phone}_${country}`;
   if (cache.has(cacheKey)) {
     return cache.get(cacheKey);
   }
   ```

3. **Rate Limiting**: Adjust delay between requests based on your network and target servers:
   ```bash
   export VERIFICATION_DELAY=500  # 500ms delay for slower networks
   ```

## Troubleshooting

### Network Errors

If you encounter network errors:

1. Increase timeout: `--timeout 20000`
2. Check firewall settings
3. Verify DNS resolution
4. Test with a smaller subset first

### Memory Issues

For large datasets:

1. Process manufacturers in batches
2. Use streaming for large reports
3. Increase Node.js memory limit:
   ```bash
   node --max-old-space-size=4096 scripts/verify-contacts.js
   ```

### False Positives

If verification reports false issues:

1. Check format patterns in `COUNTRY_CODES`
2. Verify website accessibility rules
3. Review SSL certificate validation logic
4. Consider local network restrictions

## Best Practices

1. **Regular Verification**: Run verification quarterly or when data changes
2. **Review Reports**: Always review generated reports for anomalies
3. **Backup Data**: Keep backup of verification reports for tracking trends
4. **Update Patterns**: Keep country code patterns and validation rules up to date
5. **Test Changes**: Always run tests after modifying verification logic
6. **Document Issues**: Document any recurring verification issues for future reference
