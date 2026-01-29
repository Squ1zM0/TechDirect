# Sample Test Data

This directory contains sample test data for demonstrating the contact verification tool.

## Test Manufacturers

### test-manufacturer-1
- **Valid Data**: Properly formatted US phone number and HTTPS website
- **Purpose**: Demonstrate successful verification

### test-manufacturer-2
- **Invalid Phone**: Phone number "123" is too short
- **HTTP Website**: Uses HTTP instead of HTTPS (security warning)
- **Purpose**: Demonstrate format validation and security warnings

### test-manufacturer-3
- **International Numbers**: Contains UK and German phone numbers
- **Purpose**: Demonstrate multi-country support

## Running Tests

Test the verification tool with this sample data:

```bash
# Create temporary data directory structure
mkdir -p /tmp/test-verification/data/manufacturers/t
cp test-data/*.yaml /tmp/test-verification/data/manufacturers/t/

# Run verification (modify script to use test data directory)
# Or manually test each file:

# Test valid data
node -e "
const { verifyPhone } = require('./utils/phone-verifier');
const { verifyWebsite } = require('./utils/website-verifier');

(async () => {
  const phoneResult = await verifyPhone('+18005551212', 'US');
  console.log('Phone:', phoneResult.status);
  
  const webResult = await verifyWebsite('https://www.example.com', { skipAccessibilityCheck: true });
  console.log('Website:', webResult.status);
})();
"

# Test invalid data
node -e "
const { verifyPhone } = require('./utils/phone-verifier');

(async () => {
  const result = await verifyPhone('123', 'US');
  console.log('Status:', result.status);
  console.log('Issues:', result.issues);
  console.log('Recommendations:', result.recommendations);
})();
"

# Test international numbers
node -e "
const { batchVerifyPhones } = require('./utils/phone-verifier');

(async () => {
  const phones = [
    { id: 'UK', phone: '+441234567890', country: 'GB' },
    { id: 'DE', phone: '+49-2932-9616-0', country: 'DE' }
  ];
  const results = await batchVerifyPhones(phones);
  results.forEach(r => console.log(r.id + ':', r.status));
})();
"
```

## Expected Results

### test-manufacturer-1
- **Phone**: ✅ Valid (US format, high confidence)
- **Website**: ✅ Valid format (accessibility check may fail in sandbox)

### test-manufacturer-2
- **Phone**: ❌ Invalid (too short, format check fails)
- **Website**: ⚠️ Warning (HTTP instead of HTTPS)

### test-manufacturer-3
- **UK Phone**: ✅ Valid (GB format, high confidence)
- **DE Phone**: ✅ Valid (DE format, high confidence)
- **Website**: ✅ Valid format (accessibility check may fail in sandbox)

## Integration Testing

To test the full verification workflow:

```bash
# Test with sample data (requires modifying script to use test-data directory)
# or copy test files to actual data directory:

# Backup current data
cp -r data/manufacturers/a data/manufacturers/a.backup

# Copy test data
cp test-data/test-manufacturer-1.yaml data/manufacturers/t/

# Run verification
node scripts/verify-contacts.js --manufacturer test-manufacturer-1

# Cleanup
rm data/manufacturers/t/test-manufacturer-1.yaml
mv data/manufacturers/a.backup data/manufacturers/a
```
