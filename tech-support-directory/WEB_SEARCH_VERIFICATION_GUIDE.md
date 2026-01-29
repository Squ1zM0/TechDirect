# Web Search Verification Guide

## Overview

This guide explains how to use web search to verify that manufacturer contact information is not just properly formatted, but actually correct and current.

## Why Web Search Verification?

Format validation tells us if a phone number or URL is structurally correct, but it doesn't tell us if:
- The phone number actually belongs to the manufacturer
- The number is still in service
- The website URL is current and correct
- The contact information has changed since last update

Web search verification solves this by:
1. Searching for the manufacturer's current contact information online
2. Comparing search results with repository data
3. Identifying discrepancies
4. Flagging outdated or incorrect information

## Verification Process

### Manual Web Search Verification

For manual verification of critical entries:

1. **Search for the manufacturer:**
   ```
   [Manufacturer Name] company contact phone number technical support
   ```

2. **Visit official sources:**
   - Official manufacturer website
   - Contact/support pages
   - Business directories

3. **Verify contact information:**
   - Phone numbers match
   - Websites are current
   - Country codes are correct

4. **Document findings:**
   - Record correct information
   - Note discrepancies
   - Update repository if needed

### Automated Web Search Tool

Use the web search verification script for batch verification:

```bash
# Verify specific manufacturer
node scripts/web-search-verify.js --manufacturer a-o-smith

# Verify random sample
node scripts/web-search-verify.js --sample 10 --verbose

# Generate report
node scripts/web-search-verify.js --sample 20 --output web-verification-$(date +%Y%m%d).md
```

**Note:** The current script is a demonstration. Full implementation requires web search API integration.

## Verification Results

### Sample Verification (5 Manufacturers)

Based on web search verification performed on 2026-01-29:

| Manufacturer | Phone Status | Website Status | Overall |
|--------------|--------------|----------------|---------|
| KESSEL       | ⚠️ Incomplete | ✅ Correct     | Update Needed |
| TECE         | ❌ Incorrect  | ✅ Correct     | Update Needed |
| TROX Group   | ❌ Incorrect  | ✅ Correct     | Update Needed |
| A. O. Smith  | ✅ Correct    | ✅ Correct     | Verified |
| Carrier      | ✅ Correct    | ✅ Correct     | Verified |

**Key Findings:**
- 40% of phones verified were correct
- 100% of websites verified were correct
- Common issue: Country code confusion (numbers starting with +1 marked as DE)

## Specific Issues Found

### 1. KESSEL - Incomplete Phone Number

**Current:** `+49-8456-270`  
**Correct:** `+49-8456-27-0` (main) or `+49-8456-27-208` (tech support)

**Web Search Results:**
- Main switchboard: +49 8456 27-0
- Technical Support: +49 8456 27-208 or +49 8456 27-320
- After Sales: +49 8456 27-462
- Source: https://www.kessel.com/contact/

**Action:** Update to full phone number with proper extension

### 2. TECE - Wrong Country Code

**Current:** `+14926120050` (marked as DE)  
**Correct:** `+49-2572-928999` (Germany)

**Web Search Results:**
- Headquarters phone: +49 (0)2572 928 999
- Address: Hollefeldstraße 57, 48282 Emsdetten, Germany
- Source: https://www.tece.com/en/contact

**Action:** Update phone number and verify country is DE

### 3. TROX - Wrong Country Assignment

**Current:** `+14928452020` (marked as DE)  
**Correct:** `+1-770-569-1433` (US - North America office)

**Web Search Results:**
- North America office: +1 770-569-1433
- Address: 4305 Settingdown Circle, Cumming, Georgia 30028, USA
- Source: https://www.trox-northamerica.com/

**Action:** Update phone number and change country from DE to US

## Web Search Strategies

### Effective Search Queries

**For Phone Numbers:**
```
[Company Name] technical support phone number
[Company Name] customer service contact
[Company Name] headquarters phone
```

**For Websites:**
```
[Company Name] official website
[Company Name] contact page
[Company Name] support site
```

**For Verification:**
```
[Company Name] [Specific Phone Number]
Is [Phone Number] correct for [Company Name]
```

### Reliable Sources

Priority order for information sources:

1. **Official manufacturer website** (highest priority)
   - Contact pages
   - Support pages
   - About/company info pages

2. **Business directories**
   - RocketReach
   - LinkedIn
   - Crunchbase
   - Industry databases

3. **Technical documentation**
   - Product manuals
   - Installation guides
   - Service bulletins

4. **Third-party verified sources**
   - Better Business Bureau
   - Industry associations
   - Trade publications

### Red Flags

Be cautious of:
- Information that conflicts across multiple sources
- Outdated pages (check last modified dates)
- Third-party aggregators without citation
- Numbers that redirect to call centers or sales
- Generic contact forms instead of direct numbers

## Integration with Verification Tool

### Current Implementation

The verification tool now includes:

1. **Format Validation** (implemented)
   - Phone number structure
   - URL format
   - Country code validation

2. **Network Validation** (implemented)
   - HTTP status checks
   - SSL certificate validation
   - Website accessibility

3. **Web Search Verification** (documented, requires API)
   - Contact information accuracy
   - Current vs. outdated data
   - Manufacturer verification

### Future Enhancement: API Integration

To fully automate web search verification:

```javascript
// Example: Integrate with search API
const searchResults = await webSearch({
  query: `${manufacturer.name} technical support phone`,
  maxResults: 5
});

// Parse and compare results
const extractedPhone = parseContactInfo(searchResults);
const matches = comparePhoneNumbers(manufacturer.phone, extractedPhone);

if (!matches) {
  flagForReview(manufacturer, {
    current: manufacturer.phone,
    found: extractedPhone,
    confidence: calculateConfidence(searchResults)
  });
}
```

## Recommended Workflow

### Quarterly Verification Schedule

1. **Week 1: Sample Verification**
   - Run web search on 25 random manufacturers
   - Document findings
   - Update critical issues

2. **Week 2: Flagged Entries**
   - Verify all previously flagged entries
   - Re-verify manufacturers with updates in past quarter
   - Check manufacturers with customer reports

3. **Week 3: High-Priority Categories**
   - Focus on most-used categories (HVAC, plumbing)
   - Verify top manufacturers by popularity
   - Check emergency/critical support numbers

4. **Week 4: Documentation**
   - Generate verification report
   - Update repository
   - Plan next quarter's priorities

### On-Demand Verification

Trigger web search verification when:
- Customer reports incorrect information
- Manufacturer announces changes
- Format validation flags unusual pattern
- New manufacturer added to directory
- Significant time since last verification (>1 year)

## Tools and Resources

### Web Search APIs

- **Bing Web Search API:** Microsoft's search API
- **Google Custom Search:** Google's programmable search
- **SerpAPI:** Search engine results aggregator

### Natural Language Processing

For extracting contact info from search results:
- Phone number extraction regex
- URL extraction and validation
- Address parsing libraries
- Named entity recognition

### Automation Tools

- GitHub Actions for scheduled verification
- Webhook triggers for on-demand checks
- Slack/email notifications for discrepancies

## Best Practices

1. **Always verify from official sources first**
2. **Cross-reference multiple sources**
3. **Document the source of verified information**
4. **Track verification date and method**
5. **Maintain audit trail of changes**
6. **Get confirmation for critical changes**
7. **Test phone numbers when possible**
8. **Check website accessibility**

## Security and Privacy

- Don't expose API keys in code
- Rate limit search queries
- Respect robots.txt and terms of service
- Don't scrape data aggressively
- Cache results appropriately
- Follow data protection regulations

## Reporting Issues

When web search reveals incorrect data:

1. Document the finding
2. Note the correct information
3. Cite reliable sources
4. Create an issue or update request
5. Track verification status
6. Re-verify after update

## Conclusion

Web search verification is essential for ensuring contact information accuracy beyond format validation. While the automated tool requires API integration, manual web search verification can be performed immediately to validate critical entries and maintain data quality.

---

**See Also:**
- `WEB_SEARCH_VERIFICATION.md` - Sample verification report
- `VERIFICATION_TOOL.md` - Format validation documentation
- `NETWORK_VALIDATION_GUIDE.md` - Network-based verification
