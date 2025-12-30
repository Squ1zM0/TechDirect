#!/usr/bin/env node
/**
 * CI/Pre-commit check for duplicate manufacturers.
 * Fails if any duplicates are detected based on normalized keys.
 * This prevents reintroduction of duplicates after deduplication.
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

function main() {
  const root = process.cwd();
  const dataDir = path.join(root, "data", "manufacturers");
  
  if (!fs.existsSync(dataDir)) {
    console.error("❌ Missing data/manufacturers directory");
    process.exit(1);
  }
  
  console.log("🔍 Checking for duplicate manufacturers...");
  const files = walk(dataDir);
  
  const keyMap = new Map();
  const duplicates = [];
  
  for (const file of files) {
    const txt = fs.readFileSync(file, "utf8");
    const name = pickOne(/^name:\s*(.+)$/m, txt);
    const id = pickOne(/^id:\s*(.+)$/m, txt);
    
    if (!name) {
      console.error(`❌ ${file} missing name field`);
      process.exit(1);
    }
    
    const key = normalizeKey(name.replace(/^["']|["']$/g, ""));
    
    if (keyMap.has(key)) {
      duplicates.push({
        key,
        files: [keyMap.get(key), { file, name, id }]
      });
      // Update the entry to include all files
      const existing = duplicates.find(d => d.key === key);
      if (existing && !existing.files.some(f => f.file === file)) {
        existing.files.push({ file, name, id });
      }
    } else {
      keyMap.set(key, { file, name, id });
    }
  }
  
  if (duplicates.length === 0) {
    console.log("✅ No duplicate manufacturers found!");
    console.log(`   Scanned ${files.length} manufacturer files`);
    process.exit(0);
  }
  
  // Report duplicates
  console.error("\n❌ DUPLICATE MANUFACTURERS DETECTED!\n");
  console.error(`Found ${duplicates.length} duplicate groups:\n`);
  
  for (const dup of duplicates) {
    console.error(`Normalized Key: "${dup.key}"`);
    for (const entry of dup.files) {
      console.error(`  - ${path.relative(root, entry.file)}`);
      console.error(`    Name: "${entry.name}"`);
      console.error(`    ID: ${entry.id}`);
    }
    console.error("");
  }
  
  console.error("⚠️  Please deduplicate these manufacturers before committing.");
  console.error("   Run: node scripts/dedupe-manufacturers.ts --apply\n");
  
  process.exit(1);
}

main();
