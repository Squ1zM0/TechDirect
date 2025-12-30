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

**Current Status:** ✅ All 421 manufacturers verified and deduplicated (Dec 2025)

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

**Check for duplicate manufacturers:**
```bash
node scripts/check-duplicates.ts
```
Scans all manufacturer files and fails if any duplicates are found based on normalized names. This is used in CI to prevent reintroduction of duplicates.

### Deduplication

The manufacturer directory has been deduplicated to ensure a single canonical entry per manufacturer. The deduplication process:

1. **Normalizes** manufacturer names by removing punctuation, corporate suffixes, and standardizing formatting
2. **Groups** manufacturers with matching normalized names
3. **Merges** data from duplicates, preserving all phone numbers, categories, and support information
4. **Selects** the best canonical name (most complete/properly cased)

**Run deduplication analysis:**
```bash
node scripts/dedupe-manufacturers.ts --dry-run
```
Generates a report (`DEDUPE_REPORT.md`) showing any duplicate groups found without making changes.

**Apply deduplication:**
```bash
node scripts/dedupe-manufacturers.ts --apply
```
Merges duplicate entries and removes duplicate files. The script is idempotent - running it multiple times produces no changes after the first run.

**Normalization rules:**
- Lowercase conversion
- Whitespace trimming and collapsing
- Punctuation removal (`. , : ; ' " ( ) / \ - _`)
- Replace `&` and `&amp;` with `and`
- Remove corporate suffixes: inc, incorporated, llc, ltd, limited, corp, corporation, co, company, group, holdings
- Remove "the" prefix

See **[DEDUPE_REPORT.md](./DEDUPE_REPORT.md)** for the latest deduplication analysis.

### Maintenance Schedule
- **Quarterly spot checks:** 25% of manufacturers
- **Annual full re-verification:** All entries
- **Immediate updates:** Upon reported changes or manufacturer announcements

## Build
Scripts are provided as Node.js utilities (no external services required).
