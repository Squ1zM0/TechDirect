#!/usr/bin/env node
/**
 * Minimal phone normalizer (US/CA-ish):
 * - strips non-digits
 * - if 10 digits, formats +1XXXXXXXXXX
 * - if 11 digits starting with 1, formats +1XXXXXXXXXX
 * This is intentionally simple; replace with libphonenumber-js later.
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

function norm(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+1" + digits.slice(1);
  if (phone.startsWith("+")) return phone;
  return phone;
}

const root = process.cwd();
const dir = path.join(root, "data", "manufacturers");
for (const file of walk(dir)) {
  let txt = fs.readFileSync(file, "utf8");
  txt = txt.replace(/^\s*phone:\s*(.+)$/gm, (m, p1) => {
    const raw = p1.trim().replace(/^["']|["']$/g, "");
    const n = norm(raw);
    return m.replace(p1, `"${n}"`);
  });
  fs.writeFileSync(file, txt);
}
console.log("✅ Normalized phones in YAML records.");
