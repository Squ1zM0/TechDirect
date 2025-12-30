#!/usr/bin/env node
/**
 * Dedupe manufacturers script:
 * - Identifies duplicates using normalized keys
 * - Merges duplicate entries preserving all data
 * - Generates a dedupe report
 * - Updates YAML files in-place
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

function normalizeKey(name) {
  if (!name) return "";
  let key = name.toLowerCase();
  
  // Trim and collapse whitespace
  key = key.trim().replace(/\s+/g, " ");
  
  // Remove punctuation
  key = key.replace(/[.,;:'"()\\/\-_]/g, "");
  
  // Replace & with and
  key = key.replace(/&(amp;)?/g, "and");
  
  // Remove common suffix tokens for matching
  const suffixes = [
    "\\binc\\b", "\\bincorporated\\b", "\\bllc\\b", "\\bltd\\b",
    "\\blimited\\b", "\\bcorp\\b", "\\bcorporation\\b", "\\bco\\b",
    "\\bcompany\\b", "\\bgroup\\b", "\\bholdings\\b"
  ];
  for (const suffix of suffixes) {
    key = key.replace(new RegExp(suffix, "g"), "");
  }
  
  // Remove "the" prefix
  key = key.replace(/^the\s+/, "");
  
  // Final cleanup: collapse spaces and trim
  key = key.replace(/\s+/g, " ").trim();
  
  return key;
}

function pickOne(re, txt) {
  const m = txt.match(re);
  return m ? m[1].trim() : null;
}

function pickArray(key, txt) {
  // Try inline format first: key: [a, b, c]
  const inline = txt.match(new RegExp("^" + key + "\\s*:\\s*\\[(.*)\\]\\s*$", "m"));
  if (inline) {
    return inline[1].split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  }
  
  // Try multiline format: key:\n- item1\n- item2
  const lines = txt.split(/\r?\n/);
  const result = [];
  let inArray = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(new RegExp("^" + key + "\\s*:\\s*$"))) {
      inArray = true;
      continue;
    }
    if (inArray) {
      if (line.match(/^-\s+(.+)$/)) {
        result.push(line.match(/^-\s+(.+)$/)[1].trim().replace(/^["']|["']$/g, ""));
      } else if (line.match(/^\s+-.+$/)) {
        // Sub-list item
        result.push(line.match(/^\s+-\s+(.+)$/)[1].trim().replace(/^["']|["']$/g, ""));
      } else if (line.trim() !== "" && !line.startsWith(" ")) {
        // End of array
        break;
      }
    }
  }
  
  return result;
}

function parseSupportBlocks(txt) {
  const lines = txt.split(/\r?\n/);
  const support = [];
  let cur = null;
  let inSupport = false;
  let inHours = false;
  let inRegions = false;
  let inSpecialtyTags = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.match(/^support:\s*$/)) {
      inSupport = true;
      continue;
    }
    
    if (!inSupport) continue;
    
    // New support entry starts with "- category:" or "  - category:" at the first level under support
    // Look for pattern "- category:" with 0-2 spaces of indentation
    if (line.match(/^\s{0,2}-\s+category:/) && !inRegions && !inSpecialtyTags) {
      if (cur) support.push(cur);
      cur = { _raw_lines: [] };
      inHours = false;
      inRegions = false;
      inSpecialtyTags = false;
      
      const sameLine = line.match(/^\s{0,2}-\s+category:\s*(.+)/);
      if (sameLine) {
        cur.category = sameLine[1].trim();
      }
      continue;
    }
    
    if (!cur) continue;
    
    // Check if we're entering hours block
    if (line.match(/^\s+hours:\s*$/) && !inRegions && !inSpecialtyTags) {
      inHours = true;
      inRegions = false;
      inSpecialtyTags = false;
      cur.hours = {};
      continue;
    }
    
    // Check if we're entering regions array
    if (line.match(/^\s+regions:\s*$/) && !inHours) {
      inRegions = true;
      inHours = false;
      inSpecialtyTags = false;
      cur.regions = [];
      continue;
    }
    
    // Check if we're entering specialty_tags array
    if (line.match(/^\s+specialty_tags:\s*$/) && !inHours && !inRegions) {
      inSpecialtyTags = true;
      inHours = false;
      inRegions = false;
      cur.specialty_tags = [];
      continue;
    }
    
    // Parse regions array items (more deeply indented than support-level fields)
    if (inRegions) {
      const regionItem = line.match(/^\s{4,}-\s+(.+)/); // At least 4 spaces before the dash (for nested arrays)
      if (regionItem) {
        cur.regions.push(regionItem[1].trim());
        continue;
      } else if (line.match(/^\s+\w+:/) && !line.match(/^\s{4,}-/)) {
        // A new field at the support level, exit regions
        inRegions = false;
      }
    }
    
    // Parse specialty_tags array items
    if (inSpecialtyTags) {
      const tagItem = line.match(/^\s{4,}-\s+(.+)/); // At least 4 spaces before the dash
      if (tagItem) {
        cur.specialty_tags.push(tagItem[1].trim());
        continue;
      } else if (line.match(/^\s+\w+:/) && !line.match(/^\s{4,}-/)) {
        // A new field at the support level, exit specialty_tags
        inSpecialtyTags = false;
      }
    }
    
    // Parse hours sub-fields
    if (inHours) {
      const hourKv = line.match(/^\s+([a-z_]+):\s*(.*)$/);
      if (hourKv && hourKv[1] !== 'specialty_tags' && hourKv[1] !== 'regions') {
        cur.hours[hourKv[1]] = hourKv[2].trim().replace(/^["']|["']$/g, "");
        continue;
      } else if (line.match(/^\s+\w+:/) && !line.match(/^\s{4,}/)) {
        // A new field at the support level, exit hours
        inHours = false;
      }
    }
    
    // Capture support-level fields (inline format)
    const kv = line.match(/^\s+(category|department|phone|country|notes|source|last_verified):\s*(.*)$/);
    if (kv && !inHours && !inRegions && !inSpecialtyTags) {
      cur._raw_lines.push(line);
      const k = kv[1];
      let v = kv[2].trim();
      v = v.replace(/^["']|["']$/g, "");
      
      if (v.startsWith("[") && v.endsWith("]")) {
        cur[k] = v.slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      } else {
        cur[k] = v;
      }
      continue;
    }
    
    // Check for inline array formats for regions and specialty_tags
    const inlineArray = line.match(/^\s+(regions|specialty_tags):\s*\[(.+)\]/);
    if (inlineArray) {
      const k = inlineArray[1];
      cur[k] = inlineArray[2].split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      continue;
    }
    
    // Check if we've left the support section (new top-level key or end)
    if (line.match(/^[a-z_]+:/) && !line.startsWith(" ")) {
      break;
    }
  }
  
  if (cur) support.push(cur);
  return support;
}

function parseManufacturer(file) {
  const txt = fs.readFileSync(file, "utf8");
  const id = pickOne(/^id:\s*(.+)$/m, txt);
  const name = pickOne(/^name:\s*(.+)$/m, txt);
  const website = pickOne(/^website:\s*(.+)$/m, txt);
  const categories = pickArray("categories", txt);
  const aliases = pickArray("aliases", txt);
  const support = parseSupportBlocks(txt);
  
  return {
    file,
    id,
    name: name ? name.replace(/^["']|["']$/g, "") : "",
    website,
    categories,
    aliases,
    support,
    rawText: txt
  };
}

function selectCanonicalName(names) {
  // Pick the most complete name (usually the longest, with proper casing)
  return names.reduce((best, curr) => {
    if (curr.length > best.length) return curr;
    // Prefer names with proper casing (more uppercase letters)
    const upperCount = (s) => (s.match(/[A-Z]/g) || []).length;
    if (upperCount(curr) > upperCount(best)) return curr;
    return best;
  });
}

function mergeSupport(supportArrays) {
  const merged = [];
  const seen = new Set();
  
  for (const supportList of supportArrays) {
    for (const entry of supportList) {
      // Create a unique key for deduplication using JSON to avoid delimiter conflicts
      const key = JSON.stringify({
        category: entry.category,
        department: entry.department,
        phone: entry.phone,
        country: entry.country
      });
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(entry);
    }
  }
  
  return merged;
}

function mergeManufacturers(group) {
  const canonicalName = selectCanonicalName(group.map(m => m.name));
  
  // Merge categories
  const categories = [...new Set(group.flatMap(m => m.categories))];
  
  // Merge aliases
  const aliases = [...new Set(group.flatMap(m => m.aliases || []))];
  
  // Merge websites (pick the most common or first non-null)
  const websites = group.map(m => m.website).filter(Boolean);
  const website = websites[0] || "";
  
  // Merge support entries
  const support = mergeSupport(group.map(m => m.support));
  
  // Use the ID from the manufacturer with the canonical name, or the first one
  const canonical = group.find(m => m.name === canonicalName) || group[0];
  
  return {
    canonicalManufacturer: canonical,
    mergedData: {
      name: canonicalName,
      categories,
      aliases,
      website,
      support
    },
    filesInGroup: group.map(m => m.file)
  };
}

function generateYaml(id, data) {
  let yaml = `id: ${id}\n`;
  yaml += `name: ${data.name}\n`;
  if (data.website) {
    yaml += `website: ${data.website}\n`;
  }
  yaml += `categories: [${data.categories.join(", ")}]\n`;
  if (data.aliases && data.aliases.length > 0) {
    yaml += `aliases: [${data.aliases.map(a => `"${a}"`).join(", ")}]\n`;
  }
  yaml += `support:\n`;
  
  for (const s of data.support) {
    // Skip entries with missing required fields
    if (!s.category || !s.department || !s.phone || !s.country || !s.last_verified) {
      continue;
    }
    
    yaml += `  - category: ${s.category}\n`;
    yaml += `    department: ${s.department}\n`;
    yaml += `    phone: "${s.phone}"\n`;
    yaml += `    country: ${s.country}\n`;
    
    if (s.regions && s.regions.length > 0) {
      // Use multiline format for regions
      yaml += `    regions:\n`;
      for (const region of s.regions) {
        yaml += `      - ${region}\n`;
      }
    }
    
    if (s.notes) {
      yaml += `    notes: "${s.notes}"\n`;
    }
    if (s.source) {
      yaml += `    source: "${s.source}"\n`;
    }
    yaml += `    last_verified: "${s.last_verified}"\n`;
    
    if (s.hours && Object.keys(s.hours).length > 0) {
      yaml += `    hours:\n`;
      if (s.hours.timezone) yaml += `      timezone: "${s.hours.timezone}"\n`;
      if (s.hours.mon_fri) yaml += `      mon_fri: "${s.hours.mon_fri}"\n`;
      if (s.hours.sat) yaml += `      sat: "${s.hours.sat}"\n`;
      if (s.hours.sun) yaml += `      sun: "${s.hours.sun}"\n`;
    }
    
    if (s.specialty_tags && s.specialty_tags.length > 0) {
      // Use multiline format for specialty_tags
      yaml += `    specialty_tags:\n`;
      for (const tag of s.specialty_tags) {
        yaml += `      - ${tag}\n`;
      }
    }
  }
  
  return yaml;
}

function main() {
  const root = process.cwd();
  const dataDir = path.join(root, "data", "manufacturers");
  const reportPath = path.join(root, "DEDUPE_REPORT.md");
  
  console.log("🔍 Scanning manufacturers...");
  const files = walk(dataDir);
  const manufacturers = files.map(parseManufacturer);
  
  console.log(`📊 Found ${manufacturers.length} manufacturer files`);
  
  // Group by normalized key
  const groups = new Map();
  for (const mfr of manufacturers) {
    const key = normalizeKey(mfr.name);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(mfr);
  }
  
  // Find duplicates (groups with more than one entry)
  const duplicates = Array.from(groups.entries())
    .filter(([_, group]) => group.length > 1)
    .map(([key, group]) => ({ key, group }));
  
  console.log(`🔍 Found ${duplicates.length} duplicate groups`);
  
  // Generate report
  let report = `# Manufacturer Deduplication Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total manufacturers scanned: ${manufacturers.length}\n`;
  report += `- Duplicate groups found: ${duplicates.length}\n`;
  report += `- Total duplicate files: ${duplicates.reduce((sum, d) => sum + d.group.length, 0)}\n`;
  report += `- Files to be removed: ${duplicates.reduce((sum, d) => sum + d.group.length - 1, 0)}\n\n`;
  
  report += `## Normalization Rules\n\n`;
  report += `The following normalization rules are used for duplicate detection:\n\n`;
  report += `1. Convert to lowercase\n`;
  report += `2. Trim and collapse whitespace\n`;
  report += `3. Remove punctuation: . , : ; ' " ( ) / \\ - _\n`;
  report += `4. Replace & (and &amp;) with "and"\n`;
  report += `5. Remove common suffixes: inc, incorporated, llc, ltd, limited, corp, corporation, co, company, group, holdings\n`;
  report += `6. Remove "the" prefix\n\n`;
  
  report += `## Duplicate Groups\n\n`;
  
  const mergeActions = [];
  
  for (const { key, group } of duplicates) {
    const merged = mergeManufacturers(group);
    mergeActions.push(merged);
    
    report += `### ${merged.mergedData.name}\n\n`;
    report += `**Normalized Key:** \`${key}\`\n\n`;
    report += `**Canonical Name Selected:** ${merged.mergedData.name}\n\n`;
    report += `**Files in Group:**\n`;
    for (const mfr of group) {
      report += `- \`${path.relative(root, mfr.file)}\` - "${mfr.name}" (id: ${mfr.id})\n`;
    }
    report += `\n**Canonical File:** \`${path.relative(root, merged.canonicalManufacturer.file)}\` (id: ${merged.canonicalManufacturer.id})\n\n`;
    
    report += `**Merged Categories:** ${merged.mergedData.categories.join(", ")}\n\n`;
    report += `**Merged Support Entries:** ${merged.mergedData.support.length}\n\n`;
    
    report += `**Data Summary:**\n`;
    for (const mfr of group) {
      report += `- ${mfr.id}: ${mfr.support.length} support entries, ${mfr.categories.length} categories\n`;
    }
    report += `\n`;
    
    report += `**Actions:**\n`;
    report += `1. Keep and update: \`${path.relative(root, merged.canonicalManufacturer.file)}\`\n`;
    for (const file of merged.filesInGroup) {
      if (file !== merged.canonicalManufacturer.file) {
        report += `2. Remove: \`${path.relative(root, file)}\`\n`;
      }
    }
    report += `\n---\n\n`;
  }
  
  fs.writeFileSync(reportPath, report);
  console.log(`📝 Report written to ${reportPath}`);
  
  // Perform the merge
  if (process.argv.includes("--dry-run")) {
    console.log("🏃 Dry run mode - no files will be modified");
    return;
  }
  
  if (process.argv.includes("--apply")) {
    console.log("✏️  Applying deduplication...");
    
    for (const merged of mergeActions) {
      // Update canonical file
      const newYaml = generateYaml(merged.canonicalManufacturer.id, merged.mergedData);
      fs.writeFileSync(merged.canonicalManufacturer.file, newYaml);
      console.log(`✅ Updated ${merged.canonicalManufacturer.file}`);
      
      // Remove duplicate files
      for (const file of merged.filesInGroup) {
        if (file !== merged.canonicalManufacturer.file) {
          fs.unlinkSync(file);
          console.log(`🗑️  Removed ${file}`);
        }
      }
    }
    
    console.log("✅ Deduplication complete!");
  } else {
    console.log("ℹ️  No changes made. Use --apply to merge duplicates or --dry-run to see report only.");
  }
}

main();
