# Network Validation - Quick Start Guide

## 🚨 Important: Network Access Required

The sandbox environment where the verification tool was developed **does not have network access**. To perform true validation of websites and verify phone numbers are current, you need to run the validation in an environment with network connectivity.

## Three Options for Network Validation

### Option 1: Local Machine (Fastest) ⚡

**Best for:** Immediate validation, development, testing

```bash
# Clone the repository
git clone https://github.com/Squ1zM0/TechDirect.git
cd TechDirect/tech-support-directory

# Run network-enabled validation
node scripts/network-validation.js --verbose

# Results will be in ./network-validation-reports/
```

**Pros:**
- Immediate results
- Full control over settings
- Can iterate quickly

**Cons:**
- Manual process
- Requires your machine to be available

### Option 2: GitHub Actions (Automated) 🤖

**Best for:** Scheduled validation, automated monitoring, team collaboration

The repository includes a GitHub Actions workflow that runs automatically:

**Setup:**
1. The workflow file is already in `.github/workflows/network-validation.yml`
2. It runs weekly on Mondays at 2 AM UTC
3. You can also trigger it manually from the GitHub Actions tab

**To run manually:**
1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Contact Validation with Network Access"
4. Click "Run workflow"
5. Set options (timeout, strict SSL)
6. Click "Run workflow"

**Pros:**
- Fully automated
- Runs on schedule
- Creates GitHub issues on failure
- Stores reports as artifacts

**Cons:**
- Requires GitHub Actions to be enabled
- Limited to repository owner/maintainers

### Option 3: Cloud Instance (Production) ☁️

**Best for:** Production monitoring, integration with other systems

```bash
# On AWS EC2, Google Cloud, Azure, etc.
ssh user@your-instance
git clone https://github.com/Squ1zM0/TechDirect.git
cd TechDirect/tech-support-directory
node scripts/network-validation.js --timeout 20000 --verbose
```

**Pros:**
- Always available
- Can integrate with monitoring systems
- Professional deployment

**Cons:**
- Requires cloud infrastructure
- Ongoing costs

## What Gets Validated with Network Access

### Phone Numbers ✅
- ✅ Format validation (works without network)
- ✅ Country code detection (works without network)
- ⚠️ Active phone verification (requires external API integration)

### Websites 🌐
- ✅ Format validation (works without network)
- ✅ HTTP status codes (requires network)
- ✅ SSL certificate validation (requires network)
- ✅ Certificate expiration (requires network)
- ✅ Redirect detection (requires network)
- ✅ Response times (requires network)

## Expected Results

Based on the sandbox validation (format only):

**Phone Numbers:**
- 453/456 valid (99.34%)
- 3 entries need review

**Websites (Format Only):**
- 440/440 valid format (100%)
- Accessibility: Unknown without network

**With Network Access, Expect:**
- ~85-95% websites to be fully accessible
- Some sites may have moved or changed
- SSL certificate issues on older sites
- Redirects from HTTP to HTTPS

## Running the Validation

### Command Options

```bash
# Basic validation
node scripts/network-validation.js

# With custom timeout (for slow networks)
node scripts/network-validation.js --timeout 20000

# Verbose output
node scripts/network-validation.js --verbose

# Strict SSL (reject invalid certificates)
node scripts/network-validation.js --strict-ssl

# Skip website validation (phones only)
node scripts/network-validation.js --skip-website

# Custom output directory
node scripts/network-validation.js --output-dir ./my-reports
```

### Understanding Output

The validation creates three types of reports:

1. **JSON Reports** (detailed, machine-readable)
   - `phone-verification-[timestamp].json`
   - `website-verification-[timestamp].json`

2. **Summary Report** (human-readable)
   - `validation-summary-[timestamp].md`

3. **Console Output** (real-time progress)

## Troubleshooting

### No Network Access Detected

If you see: `⚠️ WARNING: Network access appears to be unavailable`

**Solutions:**
1. Check internet connection: `curl -I https://www.google.com`
2. Check firewall settings
3. Try running on a different machine/network
4. Use GitHub Actions instead

### Timeouts or Slow Validation

If validation is slow or timing out:

```bash
# Increase timeout to 30 seconds
node scripts/network-validation.js --timeout 30000
```

### SSL Certificate Errors

If you're getting SSL errors on valid sites:

```bash
# Run in informational mode (default)
node scripts/network-validation.js

# Or skip strict SSL
# (validation will report cert issues but continue)
```

## Next Steps

1. **Choose your method:** Local, GitHub Actions, or Cloud
2. **Run the validation** with network access
3. **Review the reports** in the output directory
4. **Address any issues** found
5. **Schedule regular runs** (weekly or monthly)

## Need Help?

- See `NETWORK_VALIDATION_GUIDE.md` for detailed documentation
- Check `VERIFICATION_TOOL.md` for tool usage
- Review `SECURITY_SUMMARY.md` for security considerations

---

**Remember:** The sandbox validation (99.34% valid phones) is excellent, but network validation will provide complete confidence in your data accuracy.
