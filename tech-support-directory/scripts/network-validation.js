#!/usr/bin/env node
/**
 * Network-Enabled Comprehensive Validation Script
 * 
 * This script performs full validation with network access:
 * - Validates all phone numbers (format)
 * - Verifies all websites are accessible (HTTP status, SSL, redirects)
 * - Generates comprehensive reports
 * - Compares with previous validation results
 * 
 * Usage:
 *   node scripts/network-validation.js [options]
 * 
 * Options:
 *   --timeout <ms>              Request timeout (default: 15000)
 *   --output-dir <path>         Output directory (default: ./network-validation-reports)
 *   --skip-phone                Skip phone verification
 *   --skip-website              Skip website verification
 *   --compare <json-file>       Compare with previous validation results
 *   --verbose                   Show detailed progress
 *   --strict-ssl                Enable strict SSL validation (reject invalid certs)
 * 
 * Examples:
 *   node scripts/network-validation.js
 *   node scripts/network-validation.js --timeout 20000 --verbose
 *   node scripts/network-validation.js --strict-ssl --output-dir ./reports
 */

const fs = require('fs');
const path = require('path');
const { verifyPhone, batchVerifyPhones } = require('../utils/phone-verifier');
const { verifyWebsite, batchVerifyWebsites } = require('../utils/website-verifier');
const { generateReport, saveReport } = require('../utils/verification-report');

// Configuration
const DEFAULT_CONFIG = {
  timeout: 15000,
  outputDir: './network-validation-reports',
  delayBetweenRequests: 200,  // 200ms delay to be respectful to servers
  verbose: false,
  strictSSL: false
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--timeout':
        options.timeout = parseInt(args[++i], 10);
        break;
      case '--output-dir':
        options.outputDir = args[++i];
        break;
      case '--skip-phone':
        options.skipPhone = true;
        break;
      case '--skip-website':
        options.skipWebsite = true;
        break;
      case '--compare':
        options.compareWith = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--strict-ssl':
        options.strictSSL = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Network-Enabled Comprehensive Validation Script

Usage:
  node scripts/network-validation.js [options]

Options:
  --timeout <ms>              Request timeout (default: 15000)
  --output-dir <path>         Output directory (default: ./network-validation-reports)
  --skip-phone                Skip phone verification
  --skip-website              Skip website verification
  --compare <json-file>       Compare with previous validation results
  --verbose                   Show detailed progress
  --strict-ssl                Enable strict SSL validation
  --help                      Show this help message

Examples:
  node scripts/network-validation.js
  node scripts/network-validation.js --timeout 20000 --verbose
  node scripts/network-validation.js --strict-ssl
`);
}

/**
 * Load manufacturer data
 */
function loadManufacturers() {
  const manufacturersDir = path.join(__dirname, '../data/manufacturers');
  const manufacturers = [];
  
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const manufacturer = parseManufacturerYaml(content, entry.name);
          manufacturers.push(manufacturer);
        } catch (error) {
          console.error(`Error parsing ${fullPath}:`, error.message);
        }
      }
    }
  }
  
  walk(manufacturersDir);
  return manufacturers;
}

/**
 * Simple YAML parser for manufacturer data
 */
function parseManufacturerYaml(content, filename) {
  const lines = content.split('\n');
  const manufacturer = {
    id: '',
    name: '',
    website: '',
    supportEntries: []
  };
  
  let currentEntry = null;
  
  lines.forEach(line => {
    if (line.match(/^id:/)) {
      manufacturer.id = line.replace(/^id:\s*/, '').trim();
    }
    if (line.match(/^name:/)) {
      manufacturer.name = line.replace(/^name:\s*/, '').trim();
    }
    if (line.match(/^website:/)) {
      manufacturer.website = line.replace(/^website:\s*/, '').trim();
    }
    
    if (line.match(/^\s*- category:/)) {
      if (currentEntry) {
        manufacturer.supportEntries.push(currentEntry);
      }
      currentEntry = {
        category: line.replace(/^\s*- category:\s*/, '').trim(),
        phone: '',
        country: ''
      };
    }
    
    if (currentEntry) {
      if (line.match(/^\s+phone:/)) {
        currentEntry.phone = line.replace(/^\s+phone:\s*['"]?/, '').replace(/['"]?\s*$/, '').trim();
      }
      if (line.match(/^\s+country:/)) {
        currentEntry.country = line.replace(/^\s+country:\s*['"]?/, '').replace(/['"]?\s*$/, '').trim();
      }
    }
  });
  
  if (currentEntry) {
    manufacturer.supportEntries.push(currentEntry);
  }
  
  return manufacturer;
}

/**
 * Check if network is available
 */
async function checkNetworkAccess() {
  try {
    const { verifyWebsite } = require('../utils/website-verifier');
    const result = await verifyWebsite('https://www.google.com', { timeout: 5000 });
    
    if (result.status === 'inaccessible' && result.issues.some(i => i.includes('ENOTFOUND'))) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Compare with previous results
 */
function compareResults(current, previous) {
  const comparison = {
    totalChange: current.length - previous.length,
    statusChanges: [],
    newIssues: [],
    resolvedIssues: []
  };
  
  // Create maps for quick lookup
  const currentMap = new Map(current.map(r => [r.id, r]));
  const previousMap = new Map(previous.map(r => [r.id, r]));
  
  // Find status changes
  for (const [id, curr] of currentMap) {
    const prev = previousMap.get(id);
    if (prev && prev.status !== curr.status) {
      comparison.statusChanges.push({
        id,
        from: prev.status,
        to: curr.status
      });
      
      if (curr.status === 'invalid' && prev.status === 'valid') {
        comparison.newIssues.push(id);
      } else if (curr.status === 'valid' && prev.status === 'invalid') {
        comparison.resolvedIssues.push(id);
      }
    }
  }
  
  return comparison;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  
  console.log('🌐 Network-Enabled Comprehensive Validation\n');
  
  // Check network access
  if (options.verbose) {
    console.log('🔍 Checking network access...');
  }
  
  const hasNetwork = await checkNetworkAccess();
  
  if (!hasNetwork) {
    console.log('⚠️  WARNING: Network access appears to be unavailable.');
    console.log('   Website verification will be limited to format validation only.');
    console.log('   For full validation, run this script in a network-enabled environment.\n');
    console.log('   See NETWORK_VALIDATION_GUIDE.md for instructions.\n');
  } else {
    console.log('✅ Network access confirmed\n');
  }
  
  // Create output directory
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }
  
  // Load manufacturers
  if (options.verbose) {
    console.log('📂 Loading manufacturer data...');
  }
  
  const manufacturers = loadManufacturers();
  console.log(`Loaded ${manufacturers.length} manufacturers\n`);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const results = {};
  
  // Phone verification
  if (!options.skipPhone) {
    console.log('📞 Verifying phone numbers...');
    
    const phoneEntries = [];
    manufacturers.forEach(mfr => {
      mfr.supportEntries.forEach(entry => {
        if (entry.phone) {
          phoneEntries.push({
            id: `${mfr.id}/${entry.category}`,
            phone: entry.phone,
            country: entry.country,
            context: {
              manufacturerId: mfr.id,
              manufacturerName: mfr.name,
              category: entry.category
            }
          });
        }
      });
    });
    
    console.log(`Found ${phoneEntries.length} phone numbers`);
    
    results.phone = await batchVerifyPhones(phoneEntries, { skipActiveCheck: true });
    
    const validCount = results.phone.filter(r => r.status === 'valid').length;
    console.log(`✅ ${validCount}/${results.phone.length} phone numbers valid\n`);
    
    // Save phone results
    const phoneReport = generateReport(results.phone, 'json', {
      type: 'phone',
      title: 'Network-Enabled Phone Verification',
      description: `Comprehensive phone verification with network access - ${timestamp}`
    });
    
    saveReport(phoneReport, `phone-verification-${timestamp}.json`, { outputDir: options.outputDir });
    console.log(`📄 Phone report saved: ${options.outputDir}/phone-verification-${timestamp}.json\n`);
  }
  
  // Website verification
  if (!options.skipWebsite) {
    console.log('🌐 Verifying websites...');
    console.log(`Timeout: ${options.timeout}ms, Delay: ${options.delayBetweenRequests}ms`);
    console.log(`SSL Mode: ${options.strictSSL ? 'Strict' : 'Informational'}\n`);
    
    const websiteEntries = [];
    manufacturers.forEach(mfr => {
      if (mfr.website) {
        websiteEntries.push({
          id: mfr.id,
          url: mfr.website,
          context: {
            manufacturerId: mfr.id,
            manufacturerName: mfr.name
          }
        });
      }
    });
    
    console.log(`Found ${websiteEntries.length} websites`);
    
    if (hasNetwork) {
      console.log('⏳ This may take several minutes with network validation...\n');
    }
    
    results.website = await batchVerifyWebsites(websiteEntries, {
      timeout: options.timeout,
      delayBetweenRequests: options.delayBetweenRequests,
      strictSSL: options.strictSSL
    });
    
    const validCount = results.website.filter(r => r.status === 'valid').length;
    console.log(`✅ ${validCount}/${results.website.length} websites valid\n`);
    
    // Save website results
    const websiteReport = generateReport(results.website, 'json', {
      type: 'website',
      title: 'Network-Enabled Website Verification',
      description: `Comprehensive website verification with network access - ${timestamp}`
    });
    
    saveReport(websiteReport, `website-verification-${timestamp}.json`, { outputDir: options.outputDir });
    console.log(`📄 Website report saved: ${options.outputDir}/website-verification-${timestamp}.json\n`);
  }
  
  // Generate combined summary
  console.log('📊 Generating summary report...\n');
  
  const summaryLines = [];
  summaryLines.push(`# Network-Enabled Validation Report`);
  summaryLines.push(`**Date:** ${new Date().toISOString()}`);
  summaryLines.push(`**Network Access:** ${hasNetwork ? 'Available' : 'Limited'}`);
  summaryLines.push(``);
  
  if (results.phone) {
    const phoneSummary = {
      total: results.phone.length,
      valid: results.phone.filter(r => r.status === 'valid').length,
      invalid: results.phone.filter(r => r.status === 'invalid').length
    };
    
    summaryLines.push(`## Phone Verification`);
    summaryLines.push(`- Total: ${phoneSummary.total}`);
    summaryLines.push(`- Valid: ${phoneSummary.valid} (${((phoneSummary.valid/phoneSummary.total)*100).toFixed(2)}%)`);
    summaryLines.push(`- Invalid: ${phoneSummary.invalid}`);
    summaryLines.push(``);
  }
  
  if (results.website) {
    const websiteSummary = {
      total: results.website.length,
      valid: results.website.filter(r => r.status === 'valid').length,
      accessible: results.website.filter(r => r.checks && r.checks.accessible === 'pass').length
    };
    
    summaryLines.push(`## Website Verification`);
    summaryLines.push(`- Total: ${websiteSummary.total}`);
    summaryLines.push(`- Valid Format: ${websiteSummary.valid}`);
    summaryLines.push(`- Accessible: ${websiteSummary.accessible} (${((websiteSummary.accessible/websiteSummary.total)*100).toFixed(2)}%)`);
    summaryLines.push(``);
  }
  
  const summaryPath = path.join(options.outputDir, `validation-summary-${timestamp}.md`);
  fs.writeFileSync(summaryPath, summaryLines.join('\n'), 'utf8');
  console.log(`📄 Summary saved: ${summaryPath}\n`);
  
  // Comparison if requested
  if (options.compareWith && fs.existsSync(options.compareWith)) {
    console.log('📊 Comparing with previous results...\n');
    const previous = JSON.parse(fs.readFileSync(options.compareWith, 'utf8')).results;
    const comparison = compareResults(results.phone || results.website, previous);
    
    console.log(`Changes: ${comparison.totalChange >= 0 ? '+' : ''}${comparison.totalChange}`);
    console.log(`Status changes: ${comparison.statusChanges.length}`);
    console.log(`New issues: ${comparison.newIssues.length}`);
    console.log(`Resolved issues: ${comparison.resolvedIssues.length}\n`);
  }
  
  console.log('✨ Network validation complete!\n');
  
  if (!hasNetwork) {
    console.log('💡 To enable full network validation:');
    console.log('   • Run this script on your local machine');
    console.log('   • Set up GitHub Actions workflow');
    console.log('   • Deploy to a cloud instance');
    console.log('   See NETWORK_VALIDATION_GUIDE.md for details\n');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Error:', error.message);
    if (process.env.VERBOSE) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = {
  loadManufacturers,
  checkNetworkAccess,
  compareResults
};
