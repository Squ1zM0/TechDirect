# Tech Support Directory - Quick Reference Guide

**For Contractors and Field Technicians**

---

## What is This Directory?

The TechDirect Tech Support Directory is a verified collection of manufacturer technical support phone numbers for HVAC, Plumbing, Electrical, and other trade equipment.

**Key Features:**
- ✅ **Verified Numbers** - All numbers verified within 90 days
- ✅ **Official Sources** - Verified against manufacturer websites
- ✅ **Department Routing** - Technical support departments identified
- ✅ **Complete Documentation** - Source URLs for independent verification

---

## How to Use This Directory

### Finding a Manufacturer

Manufacturers are organized alphabetically by company name in `data/manufacturers/[first-letter]/[manufacturer-id].yaml`

**Example:** To find Carrier HVAC support:
```
data/manufacturers/c/carrier-hvac.yaml
```

### Understanding the Entry

Each manufacturer file contains:

```yaml
id: manufacturer-id              # Unique identifier
name: Manufacturer Name          # Official company name
website: https://example.com     # Company website
categories: [hvac, plumbing]     # Product categories
aliases: ["Brand Name"]          # Alternative names

support:
  - category: hvac                    # Product category
    department: Technical Support     # Department name
    phone: "+18005551234"            # Phone number (international format)
    country: US                       # Country code
    notes: "Optional routing info"    # Additional instructions
    source: "https://..."             # Verification source
    last_verified: "2025-12-26"      # Last verification date
```

### Phone Number Format

All numbers use international format:
- **US/Canada:** `+1` followed by 10-digit number
  - Example: `+18005551234` (1-800-555-1234)
- **International:** Country code + number
  - UK: `+44...`
  - Germany: `+49...`

**To dial from the US:**
- Remove the `+` symbol
- Dial as shown: `1-800-555-1234`

---

## Quick Tips

### Before You Call

1. **Check the notes field** - May contain IVR menu instructions
2. **Have ready:**
   - Model number
   - Serial number
   - Installation date
   - Issue description

### Multiple Support Numbers

Some manufacturers have multiple support lines:
- **Residential vs. Commercial** - Separate numbers for each
- **Regional Centers** - Different numbers by geographic region
- **Product Lines** - Different numbers by product type

Check all entries for a manufacturer to find the right line.

### Department Types

Common department names you'll see:
- **Technical Support** - Direct technical line (preferred)
- **Customer Service / Technical Support** - Combined service (may need to select option)
- **Pro Support** - Contractor-specific support
- **Technical Services** - Engineering support

### Hours of Operation

Some entries include support hours. If not listed:
- Most support lines: Monday-Friday, 7am-5pm local time
- Some offer 24/7 emergency support
- Check manufacturer website for current hours

---

## Common Scenarios

### Scenario 1: Unknown Manufacturer
**Problem:** Equipment brand not recognized  
**Solution:**
1. Check equipment label for parent company
2. Look up aliases in manufacturer file
3. Search by product category (HVAC, plumbing, etc.)

### Scenario 2: Number Not Working
**Problem:** Phone number disconnected or wrong department  
**Solution:**
1. Check verification date (should be recent)
2. Visit source URL to verify current number
3. Report issue for directory update

### Scenario 3: Automated Menu
**Problem:** IVR system with multiple options  
**Solution:**
1. Check notes field for menu navigation
2. Typical tech support options: "2" or "Tech Support"
3. Mention you're a contractor (may expedite routing)

### Scenario 4: Manufacturer Acquired
**Problem:** Brand was acquired by another company  
**Solution:**
1. Check manufacturer name for parent company note
2. Look up parent company if mentioned
3. Mention original brand name when calling

---

## Product Categories

Manufacturers are tagged with these categories:

- **HVAC** - Heating, ventilation, air conditioning
- **Plumbing** - Pipes, fixtures, water systems
- **Electrical** - Wiring, panels, electrical components
- **Hydronics** - Hydronic heating systems
- **Fire Protection** - Fire suppression systems

---

## Data Quality Assurance

### Verification Status

All entries are regularly verified:
- ✅ **Current** - Verified within last 90 days
- ⚠️ **Warning** - 90-180 days since verification
- ❌ **Critical** - Over 180 days (needs re-verification)

Current directory status: **✅ 100% CURRENT**

### Source Documentation

Every entry includes:
- **Source URL** - Where the number was verified
- **Last Verified Date** - When verification occurred
- **Official Sources Only** - No third-party directories used

### Reporting Issues

If you encounter a problem:
1. Note the manufacturer and issue
2. Verify against the source URL
3. Report to directory maintainers
4. Include: date, issue, current correct number (if known)

---

## Regional Differences

### United States
- Primary coverage region
- Most manufacturers have US support lines
- Toll-free numbers common (1-800, 1-888, etc.)

### Canada
- Some manufacturers have separate Canadian support
- Check for country: CA entries
- May route to US support with Canadian access

### International
- Limited international manufacturer coverage
- Check country field (GB, DE, IT, etc.)
- May have US distributor support

---

## Best Practices for Contractors

1. **Save Important Numbers**
   - Add frequently-used manufacturers to your phone
   - Create quick reference card for common brands

2. **Verify Before First Call**
   - Check verification date
   - Review any routing notes
   - Visit source URL if number seems outdated

3. **Document Your Experience**
   - Note actual wait times
   - Record successful routing paths
   - Report any issues for directory improvement

4. **Use During Business Hours**
   - Better response times
   - Access to full technical staff
   - Check manufacturer website for specific hours

5. **Have Information Ready**
   - Speeds up support process
   - Model/serial numbers essential
   - Photos of issue can help

---

## Troubleshooting

### "Number is disconnected"
→ Check source URL for current number  
→ Report to directory maintainers  
→ Try manufacturer main line from website

### "Routed to sales instead of tech support"
→ Ask to be transferred to technical support  
→ Check notes for correct menu options  
→ Report if consistently misrouted

### "Long hold times"
→ Call during off-peak hours (avoid Monday AM)  
→ Some manufacturers offer callback options  
→ Check if chat/email support available

### "Can't find manufacturer"
→ Check aliases for alternative brand names  
→ Search by parent company  
→ Look in multiple categories if multi-trade product

---

## Additional Resources

### Documentation
- **[AUDIT_REPORT.md](./AUDIT_REPORT.md)** - Complete audit details
- **[VERIFICATION_METHODOLOGY.md](./VERIFICATION_METHODOLOGY.md)** - How data is verified
- **[MANUFACTURER_INVENTORY.md](./MANUFACTURER_INVENTORY.md)** - Complete alphabetical list

### Scripts
- `scripts/verification-status.js` - Check directory health
- `scripts/validate.ts` - Validate data integrity

---

## Directory Statistics

- **Total Manufacturers:** 436
- **Total Support Numbers:** 451
- **Last Full Verification:** December 24-25, 2025
- **Coverage:** US, Canada, International
- **Categories:** HVAC, Plumbing, Electrical, and more

---

## Quick Examples

### Example 1: HVAC Equipment
```yaml
name: Carrier HVAC
phone: "+18002274437"
department: Technical Support
notes: 24/7 technical support line
```
**To call:** Dial 1-800-227-4437

### Example 2: Plumbing Fixture
```yaml
name: American Standard Plumbing
phone: "+18004424758"
department: Customer Service / Technical Support
notes: Select option 2 for technical support
```
**To call:** Dial 1-800-442-4758, then press 2

### Example 3: Electrical Component
```yaml
name: Square D (Schneider Electric)
phone: "+18887787902"
department: Technical Support
notes: Contractor technical support line
```
**To call:** Dial 1-888-778-7902

---

## Emergency Support

For after-hours emergencies:
- Check manufacturer entry for 24/7 support notation
- Some critical equipment has emergency lines
- Consider manufacturer's emergency service network
- Keep distributor emergency contacts as backup

---

## Updates and Maintenance

This directory is actively maintained:
- ✅ Quarterly spot verification
- ✅ Annual full re-verification
- ✅ Immediate updates for reported changes
- ✅ Industry monitoring for manufacturer changes

**Current Status:** All entries verified December 24-25, 2025

---

**Questions or Issues?**  
Report directory issues or suggest improvements to maintainers.

---

*This quick reference guide is for contractor use. For detailed technical documentation, see the verification methodology and audit reports.*
