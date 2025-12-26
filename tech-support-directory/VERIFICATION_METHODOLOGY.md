# Tech Support Directory - Verification Methodology

**Document Version:** 1.0  
**Last Updated:** 2025-12-26  
**Purpose:** Standard operating procedures for verifying manufacturer tech support information

---

## Overview

This document defines the methodology used to verify and maintain manufacturer technical support contact information in the TechDirect repository. All verifications must follow these procedures to ensure data accuracy and reliability.

---

## Verification Principles

### 1. Official Sources Only
**APPROVED SOURCES:**
- ✅ Manufacturer's official website (primary domain)
- ✅ Official support/contact pages
- ✅ OEM technical support portals
- ✅ Official product documentation (PDFs from manufacturer site)
- ✅ Official distributor portals (when manufacturer-authorized)

**PROHIBITED SOURCES:**
- ❌ Third-party review sites
- ❌ Blog posts or articles
- ❌ Forums or community discussions
- ❌ Cached/archived pages (unless official site is down)
- ❌ Social media (unless official and verified account)
- ❌ Reseller/retailer websites (unless manufacturer-owned)

### 2. Verification Recency
- All entries must have `last_verified` date
- Dates must use ISO format: `YYYY-MM-DD`
- Re-verification required:
  - Quarterly spot checks (25% of database)
  - Annually for all entries
  - Immediately upon reported changes
  - After manufacturer merger/acquisition announcements

### 3. Complete Documentation
Every support entry must include:
- `phone`: International format with country code (+1, +44, etc.)
- `country`: ISO 3166-1 alpha-2 code (US, CA, GB, etc.)
- `category`: Product category (hvac, plumbing, electrical, etc.)
- `department`: Specific department name from official source
- `source`: URL of the official page where number was verified
- `last_verified`: Date of verification (YYYY-MM-DD)
- `notes`: (Optional) Additional routing information, menu options, or special instructions

---

## Step-by-Step Verification Process

### Step 1: Locate Official Support Page

1. Navigate to manufacturer's official website
2. Look for sections labeled:
   - "Support"
   - "Contact Us"
   - "Technical Support"
   - "Customer Service"
   - "For Contractors"
   - "For Professionals"

3. Verify domain authenticity:
   - Check for HTTPS
   - Verify domain matches known manufacturer domain
   - Look for official branding and recent updates

### Step 2: Identify Technical Support Number

1. Locate phone numbers on support page
2. Distinguish between:
   - **Technical Support** (preferred)
   - **Customer Service** (acceptable if includes tech support)
   - **Sales** (do NOT use unless no tech support available)
   - **General Inquiries** (do NOT use)

3. Note department labels:
   - Record exact department name as shown
   - Note any IVR menu instructions
   - Document if separate numbers exist for:
     - Residential vs. Commercial
     - Different product lines
     - Different regions

### Step 3: Validate Phone Number Format

1. Extract phone number from source
2. Convert to international format:
   - US/Canada: `+1` + 10-digit number
   - UK: `+44` + number (drop leading 0)
   - Other countries: Use appropriate country code

3. Format requirements:
   - Start with `+` symbol
   - No spaces, dashes, or parentheses in YAML
   - Format: `"+12125551234"`

4. Verification checks:
   - Number has correct digit count for country
   - Area code is valid (for US/CA numbers)
   - Number is not a generic placeholder (e.g., 555-0100)

### Step 4: Verify Department Routing

**For clear technical support lines:**
- Department: "Technical Support"
- Notes: Can be minimal

**For customer service lines with tech routing:**
- Department: "Customer Service / Technical Support"
- Notes: Document menu navigation
  - Example: "Select Option 2 for Technical Support"

**For specialized support:**
- Department: Specify type (e.g., "Contractor Support", "Pro Support")
- Notes: Explain specialization and access requirements

**Multiple support numbers:**
- Create separate entries for distinct departments
- Use categories to distinguish (residential vs commercial)
- Add specialty_tags if applicable

### Step 5: Document Sources and Metadata

1. **Source URL:**
   - Copy exact URL of page containing the phone number
   - Use permanent links when available
   - Avoid links that may change (e.g., session-based URLs)

2. **Verification Date:**
   - Use date verification was performed
   - Format: `YYYY-MM-DD`
   - Example: `2025-12-26`

3. **Notes Field:**
   - Add routing instructions if needed
   - Document business hours if critical
   - Note regional restrictions
   - Mention if portal login required

4. **Additional Context:**
   - Add `hours` object if hours are clearly documented
   - Use `regions` array for regional numbers
   - Apply `specialty_tags` for specific use cases

---

## Special Cases

### Multiple Support Numbers

**Scenario:** Manufacturer has separate residential and commercial support

**Approach:**
```yaml
support:
  - category: hvac
    department: Residential Technical Support
    phone: "+18005551234"
    country: US
    notes: Residential products only
    source: https://example.com/support
    last_verified: '2025-12-26'
  - category: hvac
    department: Commercial Technical Support
    phone: "+18005555678"
    country: US
    notes: Commercial products only
    source: https://example.com/support
    last_verified: '2025-12-26'
```

### Regional Variations

**Scenario:** Different numbers for different US regions

**Approach:**
```yaml
support:
  - category: hvac
    department: Technical Support
    phone: "+18005551234"
    country: US
    regions: ["West", "Southwest"]
    source: https://example.com/support
    last_verified: '2025-12-26'
  - category: hvac
    department: Technical Support
    phone: "+18005555678"
    country: US
    regions: ["East", "Midwest"]
    source: https://example.com/support
    last_verified: '2025-12-26'
```

### Portal-Only Support

**Scenario:** Manufacturer restricts tech support to distributor portal

**Approach:**
- List best publicly available number (customer service)
- Document portal requirement in notes
- Include portal URL in source if available

```yaml
support:
  - category: hvac
    department: Customer Service
    phone: "+18005551234"
    country: US
    notes: Direct tech support available only via distributor portal. Public line can direct to appropriate resources.
    source: https://example.com/contact
    last_verified: '2025-12-26'
```

### Manufacturer Mergers/Acquisitions

**Scenario:** Brand acquired by larger company

**Approach:**
- Keep original manufacturer entry if brand still active
- Update support number to new parent company if consolidated
- Add note about parent company relationship
- Document both old brand name and current support structure

```yaml
id: brand-name
name: Brand Name (Now Part of Parent Co)
aliases: ["Brand Name", "Original Brand"]
support:
  - category: hvac
    department: Technical Support (Parent Co Brand Division)
    phone: "+18005551234"
    country: US
    notes: Brand Name products now supported through Parent Company tech support. Mention brand name when calling.
    source: https://parentcompany.com/brands/brandname/support
    last_verified: '2025-12-26'
```

### Defunct Manufacturers

**Scenario:** Manufacturer no longer in business

**Approach:**
- DO NOT remove entry immediately
- Verify through multiple sources (news, official announcements)
- Add note about defunct status
- Keep historical data for reference
- Mark with appropriate tag/note

```yaml
support:
  - category: hvac
    department: Unavailable
    phone: "+10000000000"
    country: US
    notes: "DEFUNCT - Company ceased operations in [year]. Contact [successor company] for legacy product support at [number]."
    source: https://source-documenting-closure
    last_verified: '2025-12-26'
```

---

## Quality Assurance Checks

### Pre-Commit Validation

Before committing any changes:

1. **Run validation script:**
   ```bash
   node scripts/validate.ts
   ```

2. **Check required fields:**
   - All required fields present
   - Phone format correct (+country code)
   - Date format correct (YYYY-MM-DD)
   - Source URL provided

3. **Verify YAML syntax:**
   - Proper indentation (2 spaces)
   - Arrays formatted correctly
   - Strings quoted when necessary

4. **Test phone number:**
   - (Optional but recommended) Call to verify routing
   - Note any changes in IVR menu
   - Confirm reaches technical support

### Ongoing Monitoring

1. **Monthly validation:**
   - Run automated validation scripts
   - Check for broken source URLs
   - Identify entries approaching verification deadline

2. **Quarterly spot checks:**
   - Manually verify 25% of entries
   - Prioritize high-traffic manufacturers
   - Test actual phone routing

3. **Annual full re-verification:**
   - Complete verification of all entries
   - Update all verification dates
   - Refresh source URLs if changed

---

## Common Issues and Solutions

### Issue: Phone Number No Longer Valid

**Solution:**
1. Check manufacturer website for updated number
2. If website unchanged, try calling to get new number
3. Check for company announcements about changes
4. Update with new verified number
5. Document change in commit message

### Issue: Source URL Returns 404

**Solution:**
1. Navigate to manufacturer homepage
2. Locate current support page
3. Verify phone number still matches
4. Update source URL to current page
5. Update last_verified date

### Issue: Support Routing Changed (IVR menu)

**Solution:**
1. Update notes field with new menu navigation
2. Update last_verified date
3. Keep phone number if still correct
4. Document change in commit

### Issue: Manufacturer Website Down/Unavailable

**Solution:**
1. Check if temporary outage or permanent
2. Use Internet Archive for recent snapshot (verify recency)
3. If permanent closure, mark as defunct
4. If temporary, wait and verify when available

---

## Data Integrity Standards

### Phone Number Format
- **Standard:** E.164 international format
- **Pattern:** `^\\+[1-9]\\d{1,14}$`
- **Examples:**
  - US: `+18005551234`
  - Canada: `+14165551234`
  - UK: `+442012345678`

### Date Format
- **Standard:** ISO 8601 date
- **Pattern:** `^\\d{4}-\\d{2}-\\d{2}$`
- **Example:** `2025-12-26`

### Source URLs
- Must be HTTPS when available
- Should be direct link to page with number
- Avoid parameters when possible
- Use permanent/canonical URLs

### Department Names
- Use exact name from official source
- Capitalize properly
- Use "/" to separate combined departments
- Examples:
  - "Technical Support"
  - "Customer Service / Technical Support"
  - "Pro Support"

---

## Verification Workflow Summary

```
1. Locate manufacturer's official support page
   ↓
2. Identify technical support phone number
   ↓
3. Verify number format and routing
   ↓
4. Document source URL
   ↓
5. Record verification date
   ↓
6. Add notes for routing/access details
   ↓
7. Run validation scripts
   ↓
8. Commit with descriptive message
   ↓
9. Schedule next verification
```

---

## Commit Message Standards

When updating manufacturer data:

**Format:**
```
Update [manufacturer-name] tech support verification

- Verified phone: [number]
- Source: [URL]
- Department: [department name]
- Date: [YYYY-MM-DD]
- Changes: [if any]
```

**Example:**
```
Update AAON tech support verification

- Verified phone: +19183826450
- Source: https://www.aaon.com/contact
- Department: Service and Tech Support
- Date: 2025-12-26
- No changes from previous entry
```

---

## Conclusion

Following this methodology ensures:
- ✅ Consistent verification standards
- ✅ Reliable, accurate data
- ✅ Traceable verification sources
- ✅ Contractor confidence in directory
- ✅ Maintainable long-term data quality

All contributors must follow these procedures when adding or updating manufacturer support information.

---

*Last reviewed: 2025-12-26*  
*Next review: 2026-03-26*
