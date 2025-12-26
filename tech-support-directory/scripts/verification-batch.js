#!/usr/bin/env node
/**
 * External Verification Batch Processor
 * 
 * This script helps manage the external verification process by:
 * 1. Tracking which manufacturers have been verified
 * 2. Generating verification batches
 * 3. Recording findings
 * 
 * Usage: node scripts/verification-batch.js [command]
 * Commands:
 *   - next [count]    : Get next batch of unverified manufacturers
 *   - mark [id]       : Mark a manufacturer as verified
 *   - status          : Show verification progress
 */

const fs = require('fs');
const path = require('path');

const VERIFIED_LOG_PATH = path.join(__dirname, '..', 'EXTERNAL_VERIFICATION_LOG.md');
const VERIFIED_STATE_PATH = path.join(__dirname, '..', '.verification-state.json');

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && p.endsWith('.yaml')) out.push(p);
  }
  return out;
}

function loadState() {
  if (fs.existsSync(VERIFIED_STATE_PATH)) {
    return JSON.parse(fs.readFileSync(VERIFIED_STATE_PATH, 'utf8'));
  }
  return { verified: [], corrections: [] };
}

function saveState(state) {
  fs.writeFileSync(VERIFIED_STATE_PATH, JSON.stringify(state, null, 2));
}

function getAllManufacturers() {
  const manufacturersDir = path.join(process.cwd(), 'data', 'manufacturers');
  const files = walk(manufacturersDir).sort();
  
  return files.map(file => {
    const id = path.basename(file, '.yaml');
    const content = fs.readFileSync(file, 'utf8');
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const name = nameMatch ? nameMatch[1].trim() : id;
    const websiteMatch = content.match(/^website:\s*(.+)$/m);
    const website = websiteMatch ? websiteMatch[1].trim() : '';
    const phoneMatch = content.match(/phone:\s*['"]?(\+\d+)['"]?/);
    const phone = phoneMatch ? phoneMatch[1] : '';
    
    return { id, name, website, phone, file };
  });
}

function getNextBatch(count = 10) {
  const state = loadState();
  const all = getAllManufacturers();
  const unverified = all.filter(m => !state.verified.includes(m.id));
  
  return unverified.slice(0, count);
}

function showStatus() {
  const state = loadState();
  const all = getAllManufacturers();
  
  const total = all.length;
  const verified = state.verified.length;
  const remaining = total - verified;
  const pct = ((verified / total) * 100).toFixed(1);
  
  console.log('═'.repeat(70));
  console.log('EXTERNAL VERIFICATION STATUS');
  console.log('═'.repeat(70));
  console.log(`Total Manufacturers:     ${total}`);
  console.log(`Verified:                ${verified} (${pct}%)`);
  console.log(`Remaining:               ${remaining}`);
  console.log(`Corrections Made:        ${state.corrections.length}`);
  console.log('═'.repeat(70));
  
  if (state.corrections.length > 0) {
    console.log('\nCorrections Applied:');
    state.corrections.forEach(c => {
      console.log(`  - ${c.name} (${c.id})`);
    });
  }
}

function markVerified(id, corrected = false) {
  const state = loadState();
  if (!state.verified.includes(id)) {
    state.verified.push(id);
  }
  if (corrected) {
    const all = getAllManufacturers();
    const mfg = all.find(m => m.id === id);
    if (mfg && !state.corrections.find(c => c.id === id)) {
      state.corrections.push({ id, name: mfg.name });
    }
  }
  saveState(state);
  console.log(`✓ Marked ${id} as verified${corrected ? ' (corrected)' : ''}`);
}

// Command line interface
const command = process.argv[2] || 'status';
const arg = process.argv[3];

if (command === 'next') {
  const count = arg ? parseInt(arg) : 10;
  const batch = getNextBatch(count);
  
  console.log(`\nNext ${batch.length} Manufacturers to Verify:\n`);
  batch.forEach((m, i) => {
    console.log(`${i + 1}. ${m.name}`);
    console.log(`   ID: ${m.id}`);
    console.log(`   Website: ${m.website}`);
    console.log(`   Current Phone: ${m.phone}`);
    console.log(`   File: ${m.file}`);
    console.log();
  });
  
} else if (command === 'mark') {
  if (!arg) {
    console.error('Error: Please provide manufacturer ID');
    process.exit(1);
  }
  const corrected = process.argv[4] === 'corrected';
  markVerified(arg, corrected);
  
} else if (command === 'status') {
  showStatus();
  
} else {
  console.log('External Verification Batch Processor');
  console.log('\nUsage: node verification-batch.js [command]');
  console.log('\nCommands:');
  console.log('  next [count]           Get next batch of unverified manufacturers');
  console.log('  mark [id] [corrected]  Mark manufacturer as verified');
  console.log('  status                 Show verification progress');
}
