#!/usr/bin/env node
/**
 * Build JSON indexes from YAML records.
 * Dependency-free starter: extracts fields with simple parsing rules.
 * For production, replace with a real YAML parser.
 */
const fs = require("fs");
const path = require("path");

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && p.endsWith(".yaml")) out.push(p);
  }
  return out;
}

function readYamlAsText(file) {
  return fs.readFileSync(file, "utf8");
}

function pickOne(re, txt) {
  const m = txt.match(re);
  return m ? m[1].trim() : null;
}

function pickArray(key, txt) {
  // matches: key: [a, b, c]
  const m = txt.match(new RegExp("^" + key + "\\s*:\\s*\\[(.*)\\]\\s*$", "m"));
  if (!m) return [];
  return m[1].split(",").map(s => s.trim()).filter(Boolean);
}

function parseSupportBlocks(txt) {
  // Detects YAML list items (with or without indentation) containing key-value pairs as support entries
  const lines = txt.split(/\r?\n/);
  const support = [];
  let cur = null;
  let inSupport = false;
  for (const line of lines) {
    if (line.startsWith("support:")) { inSupport = true; continue; }
    if (!inSupport) continue;
    // Match list items with key:value pairs (e.g., "  - category: hvac" or "- category: hvac")
    // Must have a dash followed by a key:value to be a support entry (not a nested array item like "  - US")
    const listItemMatch = line.match(/^\s*-\s+\w+:/);
    if (listItemMatch) {
      if (cur) support.push(cur);
      cur = {};
      // Extract the key-value from the same line as the dash
      const kvMatch = line.match(/^\s*-\s*([a-zA-Z0-9_]+):\s*(.*)$/);
      if (kvMatch) {
        const k = kvMatch[1];
        let v = kvMatch[2].trim();
        v = v.replace(/^["']|["']$/g, "");
        cur[k] = v;
      }
      continue;
    }
    if (!cur) continue;
    const kv = line.match(/^\s+([a-zA-Z0-9_]+):\s*(.*)$/);
    if (kv) {
      const k = kv[1];
      let v = kv[2].trim();
      v = v.replace(/^["']|["']$/g, "");
      if (v.startsWith("[") && v.endsWith("]")) {
        cur[k] = v.slice(1,-1).split(",").map(s=>s.trim()).filter(Boolean);
      } else {
        cur[k] = v;
      }
    }
  }
  if (cur) support.push(cur);
  return support;
}

function dedupeSupportEntries(support) {
  // Deduplicate support entries based on category, department, phone, country, and regions
  const seen = new Map();
  const deduped = [];
  
  for (const entry of support) {
    // Create a unique key from the identifying fields
    const regions = entry.regions || [];
    const sortedRegions = Array.isArray(regions) ? [...regions].sort() : [];
    const key = JSON.stringify({
      category: entry.category || "",
      department: entry.department || "",
      phone: entry.phone || "",
      country: entry.country || "",
      regions: sortedRegions
    });
    
    if (!seen.has(key)) {
      seen.set(key, true);
      deduped.push(entry);
    }
  }
  
  return deduped;
}

const root = process.cwd();
const dataDir = path.join(root, "data", "manufacturers");
const outDir = path.join(root, "dist");
const shardsDir = path.join(outDir, "shards");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(shardsDir, { recursive: true });

const manufacturers = [];
for (const file of walk(dataDir)) {
  const txt = readYamlAsText(file);
  const id = pickOne(/^id:\s*(.+)$/m, txt);
  const name = pickOne(/^name:\s*(.+)$/m, txt);
  const website = pickOne(/^website:\s*(.+)$/m, txt);
  const categories = pickArray("categories", txt);
  const rawSupport = parseSupportBlocks(txt).map(s => ({
    category: s.category,
    department: s.department,
    phone: s.phone,
    country: s.country,
    regions: s.regions || [],
    timezone: s.timezone || (s.hours_timezone || null),
    last_verified: s.last_verified,
    specialty_tags: s.specialty_tags || [],
    notes: s.notes || "",
    source: s.source || ""
  }));
  // Deduplicate support entries based on category, department, phone, country, and regions
  const support = dedupeSupportEntries(rawSupport);
  manufacturers.push({ id, name, website, categories, support });
}

const version = "2025-12-24";
const index = { version, manufacturers };
fs.writeFileSync(path.join(outDir, "index.min.json"), JSON.stringify(index));

const byDomain = {};
for (const m of manufacturers) {
  for (const s of m.support) {
    const d = s.category || "unknown";
    byDomain[d] = byDomain[d] || [];
    byDomain[d].push({ manufacturer_id: m.id, manufacturer_name: m.name, ...s });
  }
}
fs.writeFileSync(path.join(outDir, "index.by-domain.json"), JSON.stringify({ version, byDomain }, null, 2));

const usHvac = manufacturers
  .map(m => {
    const support = m.support.filter(s => (s.country||"").toUpperCase()==="US" && (s.category||"")==="hvac");
    return support.length ? {...m, support} : null;
  })
  .filter(Boolean);
fs.writeFileSync(path.join(shardsDir, "us-hvac.json"), JSON.stringify({ version, manufacturers: usHvac }, null, 2));

console.log("✅ Built dist/index.min.json, dist/index.by-domain.json, dist/shards/us-hvac.json");
