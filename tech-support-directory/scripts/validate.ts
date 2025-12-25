#!/usr/bin/env node
/**
 * Minimal validator for YAML records:
 * - Checks required top-level keys
 * - Checks support[] required keys
 * This is intentionally dependency-free for easy bootstrapping.
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

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function parseYamlVerySimple(text) {
  // NOTE: This is NOT a full YAML parser. It's enough for our constrained records
  // because we keep them simple. Replace with real YAML parser later if desired.
  // Here we only need to check presence of keys; we do shallow regex detection.
  return text;
}

const root = process.cwd();
const dir = path.join(root, "data", "manufacturers");
if (!fs.existsSync(dir)) die("Missing data/manufacturers");

let ok = true;
for (const file of walk(dir)) {
  const txt = fs.readFileSync(file, "utf8");
  parseYamlVerySimple(txt);

  const requiredTop = ["id:", "name:", "categories:", "support:"];
  for (const k of requiredTop) {
    if (!txt.includes(k)) {
      console.error(`❌ ${file} missing ${k}`);
      ok = false;
    }
  }
  // support entries required fields
  const reqSupport = ["category:", "department:", "phone:", "country:", "last_verified:"];
  // crude: ensure at least one support block has all fields
  let hasOne = true;
  for (const k of reqSupport) {
    if (!txt.includes(k)) hasOne = false;
  }
  if (!hasOne) {
    console.error(`❌ ${file} support entries appear incomplete`);
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log("✅ Basic validation passed.");
