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

## Build
Scripts are provided as Node.js utilities (no external services required).
