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

**Current Status:** ✅ All 436 manufacturers verified (Dec 24-25, 2025)

This directory has undergone comprehensive verification to ensure accuracy and reliability. All entries include:
- ✅ Verified phone numbers from official manufacturer sources
- ✅ Source documentation (official URLs)
- ✅ Department routing information
- ✅ Recent verification dates (within 90 days)

### Documentation
- **[AUDIT_REPORT.md](./AUDIT_REPORT.md)** - Complete audit results and quality metrics
- **[VERIFICATION_METHODOLOGY.md](./VERIFICATION_METHODOLOGY.md)** - Standards and procedures for verification

### Verification Scripts

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
