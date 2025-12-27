#!/usr/bin/env node
/**
 * Tech Support Directory - Verification Status Checker
 * 
 * This script analyzes the tech support directory and provides a detailed
 * status report on verification currency, completeness, and quality metrics.
 * 
 * Usage: node scripts/verification-status.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const WARN_DAYS = 90;  // Warn if verification older than 90 days
const CRITICAL_DAYS = 180;  // Critical if verification older than 180 days

// Helper: Recursively find all YAML files
function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && p.endsWith('.yaml')) out.push(p);
  }
  return out;
}

// Helper: Calculate days between dates
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
}

// Helper: Parse YAML file (simple extraction)
function parseManufacturerYaml(content) {
  const lines = content.split('\n');
  const manufacturer = {
    id: '',
    name: '',
    categories: [],
    supportEntries: []
  };
  
  let currentEntry = null;
  
  lines.forEach(line => {
    // Top-level fields
    if (line.match(/^id:/)) {
      manufacturer.id = line.replace(/^id:\s*/, '').trim();
    }
    if (line.match(/^name:/)) {
      manufacturer.name = line.replace(/^name:\s*/, '').trim();
    }
    if (line.match(/^categories:/)) {
      const cats = line.replace(/^categories:\s*/, '').trim();
      manufacturer.categories = cats;
    }
    
    // Support entries
    if (line.match(/^\s*- category:/)) {
      if (currentEntry) {
        manufacturer.supportEntries.push(currentEntry);
      }
      currentEntry = {
        category: line.replace(/^\s*- category:\s*/, '').trim(),
        department: '',
        phone: '',
        country: '',
        source: '',
        lastVerified: '',
        notes: ''
      };
    }
    
    if (currentEntry) {
      if (line.match(/^\s+department:/)) {
        currentEntry.department = line.replace(/^\s+department:\s*/, '').trim();
      }
      if (line.match(/^\s+phone:/)) {
        currentEntry.phone = line.replace(/^\s+phone:\s*['"]?/, '').replace(/['"]?\s*$/, '').trim();
      }
      if (line.match(/^\s+country:/)) {
        currentEntry.country = line.replace(/^\s+country:\s*['"]?/, '').replace(/['"]?\s*$/, '').trim();
      }
      if (line.match(/^\s+source:/)) {
        currentEntry.source = line.replace(/^\s+source:\s*['"]?/, '').replace(/['"]?\s*$/, '').trim();
      }
      if (line.match(/^\s+last_verified:/)) {
        currentEntry.lastVerified = line.replace(/^\s+last_verified:\s*['"]?/, '').replace(/['"]?\s*$/, '').trim();
      }
      if (line.match(/^\s+notes:/)) {
        currentEntry.notes = line.replace(/^\s+notes:\s*['"]?/, '').replace(/['"]?\s*$/, '').trim();
      }
    }
  });
  
  // Don't forget the last entry
  if (currentEntry) {
    manufacturer.supportEntries.push(currentEntry);
  }
  
  return manufacturer;
}

// Main verification status check
function checkVerificationStatus() {
  const manufacturersDir = path.join(process.cwd(), 'data', 'manufacturers');
  
  if (!fs.existsSync(manufacturersDir)) {
    console.error('❌ Error: data/manufacturers directory not found');
    console.error('   Make sure to run this script from the tech-support-directory root');
    process.exit(1);
  }
  
  const files = walk(manufacturersDir);
  const today = new Date();
  
  const stats = {
    totalManufacturers: 0,
    totalSupportEntries: 0,
    current: 0,           // < 90 days
    warning: 0,           // 90-180 days
    critical: 0,          // > 180 days
    missingVerification: 0,
    invalidDate: 0,
    missingSource: 0,
    invalidPhone: 0,
    byCountry: {},
    byCategory: {},
    oldestVerification: null,
    newestVerification: null
  };
  
  const issues = {
    warning: [],
    critical: [],
    missingVerification: [],
    invalidDate: [],
    missingSource: [],
    invalidPhone: []
  };
  
  console.log('🔍 Tech Support Directory Verification Status Check\n');
  console.log('━'.repeat(70));
  console.log(`Analyzing ${files.length} manufacturer files...\n`);
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const manufacturer = parseManufacturerYaml(content);
    const fileName = path.basename(file, '.yaml');
    
    stats.totalManufacturers++;
    
    manufacturer.supportEntries.forEach(entry => {
      stats.totalSupportEntries++;
      
      // Check verification date
      if (!entry.lastVerified) {
        stats.missingVerification++;
        issues.missingVerification.push({
          manufacturer: manufacturer.name || fileName,
          file: fileName
        });
        return;
      }
      
      // Validate date format
      if (!entry.lastVerified.match(/^\d{4}-\d{2}-\d{2}$/)) {
        stats.invalidDate++;
        issues.invalidDate.push({
          manufacturer: manufacturer.name || fileName,
          date: entry.lastVerified,
          file: fileName
        });
        return;
      }
      
      // Check date currency
      const verifyDate = new Date(entry.lastVerified);
      const daysOld = daysBetween(today, verifyDate);
      
      if (daysOld < WARN_DAYS) {
        stats.current++;
      } else if (daysOld < CRITICAL_DAYS) {
        stats.warning++;
        issues.warning.push({
          manufacturer: manufacturer.name || fileName,
          date: entry.lastVerified,
          daysOld,
          file: fileName
        });
      } else {
        stats.critical++;
        issues.critical.push({
          manufacturer: manufacturer.name || fileName,
          date: entry.lastVerified,
          daysOld,
          file: fileName
        });
      }
      
      // Track oldest and newest
      if (!stats.oldestVerification || verifyDate < stats.oldestVerification) {
        stats.oldestVerification = verifyDate;
      }
      if (!stats.newestVerification || verifyDate > stats.newestVerification) {
        stats.newestVerification = verifyDate;
      }
      
      // Check source
      if (!entry.source || entry.source.length < 5) {
        stats.missingSource++;
        issues.missingSource.push({
          manufacturer: manufacturer.name || fileName,
          file: fileName
        });
      }
      
      // Check phone format
      if (!entry.phone || !entry.phone.startsWith('+')) {
        stats.invalidPhone++;
        issues.invalidPhone.push({
          manufacturer: manufacturer.name || fileName,
          phone: entry.phone,
          file: fileName
        });
      }
      
      // Count by country
      const country = entry.country || 'Unknown';
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
      
      // Count by category
      const category = entry.category || 'Unknown';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });
  });
  
  // Display results
  console.log('📊 VERIFICATION STATUS SUMMARY');
  console.log('━'.repeat(70));
  console.log(`Total Manufacturers:        ${stats.totalManufacturers}`);
  console.log(`Total Support Entries:      ${stats.totalSupportEntries}`);
  console.log();
  
  console.log('📅 VERIFICATION CURRENCY:');
  const currentPct = ((stats.current / stats.totalSupportEntries) * 100).toFixed(1);
  const warnPct = ((stats.warning / stats.totalSupportEntries) * 100).toFixed(1);
  const critPct = ((stats.critical / stats.totalSupportEntries) * 100).toFixed(1);
  
  console.log(`  ✅ Current (< 90 days):      ${stats.current} (${currentPct}%)`);
  console.log(`  ⚠️  Warning (90-180 days):   ${stats.warning} (${warnPct}%)`);
  console.log(`  ❌ Critical (> 180 days):    ${stats.critical} (${critPct}%)`);
  console.log();
  
  if (stats.oldestVerification && stats.newestVerification) {
    console.log('📆 VERIFICATION DATE RANGE:');
    console.log(`  Oldest:  ${stats.oldestVerification.toISOString().split('T')[0]}`);
    console.log(`  Newest:  ${stats.newestVerification.toISOString().split('T')[0]}`);
    console.log();
  }
  
  console.log('🔍 DATA QUALITY:');
  console.log(`  Missing verification dates: ${stats.missingVerification}`);
  console.log(`  Invalid date formats:       ${stats.invalidDate}`);
  console.log(`  Missing source URLs:        ${stats.missingSource}`);
  console.log(`  Invalid phone formats:      ${stats.invalidPhone}`);
  console.log();
  
  console.log('🌍 COVERAGE BY COUNTRY:');
  Object.entries(stats.byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([country, count]) => {
      console.log(`  ${country}: ${count}`);
    });
  console.log();
  
  console.log('📦 TOP CATEGORIES:');
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
  console.log();
  
  // Report issues
  let hasIssues = false;
  
  if (issues.critical.length > 0) {
    hasIssues = true;
    console.log('❌ CRITICAL: Entries requiring immediate re-verification (> 180 days):');
    issues.critical.slice(0, 10).forEach(i => {
      console.log(`  - ${i.manufacturer} (${i.daysOld} days old) [${i.file}]`);
    });
    if (issues.critical.length > 10) {
      console.log(`  ... and ${issues.critical.length - 10} more`);
    }
    console.log();
  }
  
  if (issues.warning.length > 0) {
    hasIssues = true;
    console.log('⚠️  WARNING: Entries needing re-verification soon (90-180 days):');
    issues.warning.slice(0, 10).forEach(i => {
      console.log(`  - ${i.manufacturer} (${i.daysOld} days old) [${i.file}]`);
    });
    if (issues.warning.length > 10) {
      console.log(`  ... and ${issues.warning.length - 10} more`);
    }
    console.log();
  }
  
  if (issues.missingVerification.length > 0) {
    hasIssues = true;
    console.log('⚠️  Missing verification dates:');
    issues.missingVerification.forEach(i => {
      console.log(`  - ${i.manufacturer} [${i.file}]`);
    });
    console.log();
  }
  
  if (issues.invalidDate.length > 0) {
    hasIssues = true;
    console.log('⚠️  Invalid date formats:');
    issues.invalidDate.forEach(i => {
      console.log(`  - ${i.manufacturer}: "${i.date}" [${i.file}]`);
    });
    console.log();
  }
  
  if (issues.missingSource.length > 0) {
    hasIssues = true;
    console.log('⚠️  Missing source URLs:');
    issues.missingSource.slice(0, 10).forEach(i => {
      console.log(`  - ${i.manufacturer} [${i.file}]`);
    });
    if (issues.missingSource.length > 10) {
      console.log(`  ... and ${issues.missingSource.length - 10} more`);
    }
    console.log();
  }
  
  if (issues.invalidPhone.length > 0) {
    hasIssues = true;
    console.log('⚠️  Invalid phone number formats (should start with +):');
    issues.invalidPhone.slice(0, 10).forEach(i => {
      console.log(`  - ${i.manufacturer}: "${i.phone}" [${i.file}]`);
    });
    if (issues.invalidPhone.length > 10) {
      console.log(`  ... and ${issues.invalidPhone.length - 10} more`);
    }
    console.log();
  }
  
  // Final status
  console.log('━'.repeat(70));
  if (!hasIssues && stats.warning === 0 && stats.critical === 0) {
    console.log('✅ DIRECTORY STATUS: EXCELLENT');
    console.log('   All entries are current and properly formatted.');
  } else if (stats.critical === 0 && issues.missingVerification.length === 0) {
    console.log('✅ DIRECTORY STATUS: GOOD');
    console.log('   No critical issues. Some entries approaching re-verification.');
  } else {
    console.log('⚠️  DIRECTORY STATUS: NEEDS ATTENTION');
    console.log('   Please address the issues listed above.');
  }
  console.log('━'.repeat(70));
  
  // Exit code
  if (stats.critical > 0 || issues.missingVerification.length > 0) {
    process.exit(1);
  }
}

// Run the check
try {
  checkVerificationStatus();
} catch (error) {
  console.error('❌ Error running verification check:', error.message);
  process.exit(1);
}
