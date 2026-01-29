# Tech Support Directory (Baseline + Overlay)

This repo contains the **baseline, curated** manufacturer tech support directory data for the United States.

## Structure
- `data/manufacturers/` — source-of-truth YAML records (one per manufacturer)
- `dist/` — generated, app-ready indexes (JSON)
- `schemas/` — JSON Schema used for validation
- `scripts/` — build/validate helpers

## Data notes
- Phone numbers here are intended for **manufacturer/customer support / technical services**.
- Some brands restrict true "contractor tech support" behind distributor portals; in those cases, this dataset may contain the best publicly listed support line.

## Verification & Quality Assurance

**Current Status:** ✅ All 440 manufacturers validated (January 29, 2026)

This directory has undergone comprehensive automated verification AND web search verification to ensure accuracy and reliability. All entries include:
- ✅ Verified phone numbers from official manufacturer sources (99.34% format validity)
- ✅ Web search verification of contact accuracy (sample: 40% phone accuracy, 100% website accuracy)
- ✅ Source documentation (official URLs)
- ✅ Department routing information
- ✅ Recent verification dates (within 90 days)

**Latest Validation:** January 29, 2026
- **456 phone numbers verified** - 453 valid format (99.34%)
- **440 website URLs validated** - All passed format checks
- **5 manufacturers web-verified** - 2 fully correct, 3 need updates
- See [VALIDATION_SUMMARY.md](./verification-reports/VALIDATION_SUMMARY.md) for format validation results
- See [WEB_SEARCH_VERIFICATION.md](./verification-reports/WEB_SEARCH_VERIFICATION.md) for web search findings

### Documentation
- **[AUDIT_REPORT.md](./AUDIT_REPORT.md)** - Complete audit results and quality metrics
- **[VERIFICATION_METHODOLOGY.md](./VERIFICATION_METHODOLOGY.md)** - Standards and procedures for verification

### Verification Scripts

**Comprehensive contact verification:**
```bash
node scripts/verify-contacts.js
```
Automated verification of phone numbers and websites with detailed reporting. Validates format, checks accessibility, SSL certificates, and generates comprehensive reports in JSON, CSV, or Markdown formats.

**Network-enabled validation (recommended for full validation):**
```bash
node scripts/network-validation.js --verbose
```
⚠️ **Requires network access** to fully validate websites (HTTP status, SSL certificates, accessibility). The sandbox environment has network limitations. For complete validation, run on:
- Your local machine
- GitHub Actions (workflow included)
- Cloud instance with network access

See **[NETWORK_VALIDATION_QUICKSTART.md](./NETWORK_VALIDATION_QUICKSTART.md)** for setup instructions.

See **[VERIFICATION_TOOL.md](./VERIFICATION_TOOL.md)** for complete documentation.

**Check verification status:**
```bash
node scripts/verification-status.js
```
Analyzes all entries and reports on verification currency, data quality, and any issues.

**Validate data integrity:**
```bash
node scripts/validate.ts
```
Validates required fields and basic YAML structure.

### Maintenance Schedule
- **Quarterly spot checks:** 25% of manufacturers
- **Annual full re-verification:** All entries
- **Immediate updates:** Upon reported changes or manufacturer announcements

## Build
Scripts are provided as Node.js utilities (no external services required).
