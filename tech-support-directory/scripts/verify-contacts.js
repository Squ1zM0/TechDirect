#!/usr/bin/env node
/**
 * Tech Support Directory - Contact Verification Tool
 * 
 * Comprehensive verification tool for phone numbers and websites in the tech support directory.
 * Validates format, checks accessibility, and generates detailed reports.
 * 
 * Usage:
 *   node scripts/verify-contacts.js [options]
 * 
 * Options:
 *   --type <phone|website|all>    Type of verification to run (default: all)
 *   --manufacturer <id>            Verify specific manufacturer by ID
 *   --format <json|csv|markdown>   Output format (default: markdown)
 *   --output <path>                Output file path
 *   --timeout <ms>                 Request timeout in milliseconds (default: 10000)
 *   --verbose                      Show detailed progress
 *   --help                         Show this help message
 * 
 * Examples:
 *   node scripts/verify-contacts.js --type phone
 *   node scripts/verify-contacts.js --manufacturer a-o-smith --format json
 *   node scripts/verify-contacts.js --type website --output reports/website-verification.md
 */

const fs = require('fs');
const path = require('path');
const { verifyPhone, batchVerifyPhones } = require('../utils/phone-verifier');
const { verifyWebsite, batchVerifyWebsites } = require('../utils/website-verifier');
const { generateReport, saveReport } = require('../utils/verification-report');

// Configuration
const CONFIG = {
  dataDir: path.join(__dirname, '../data/manufacturers'),
  timeout: 10000,
  delayBetweenRequests: 100, // ms delay to avoid overwhelming servers
  verbose: false
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    type: 'all',
    manufacturer: null,
    format: 'markdown',
    output: null,
    timeout: CONFIG.timeout,
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--type':
        options.type = args[++i];
        break;
      case '--manufacturer':
        options.manufacturer = args[++i];
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i], 10);
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        options.help = true;
        break;
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Tech Support Directory - Contact Verification Tool

Usage:
  node scripts/verify-contacts.js [options]

Options:
  --type <phone|website|all>    Type of verification to run (default: all)
  --manufacturer <id>            Verify specific manufacturer by ID
  --format <json|csv|markdown>   Output format (default: markdown)
  --output <path>                Output file path
  --timeout <ms>                 Request timeout in milliseconds (default: 10000)
  --verbose                      Show detailed progress
  --help                         Show this help message

Examples:
  node scripts/verify-contacts.js --type phone
  node scripts/verify-contacts.js --manufacturer a-o-smith --format json
  node scripts/verify-contacts.js --type website --output reports/website-verification.md
`);
}

/**
 * Recursively find all YAML files in directory
 */
function findYamlFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Parse YAML file (simple parser for manufacturer data)
 */
function parseManufacturerYaml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const manufacturer = {
    id: '',
    name: '',
    website: '',
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
    if (line.match(/^website:/)) {
      manufacturer.website = line.replace(/^website:\s*/, '').trim();
    }
    
    // Support entries
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
  
  // Don't forget the last entry
  if (currentEntry) {
    manufacturer.supportEntries.push(currentEntry);
  }
  
  return manufacturer;
}

/**
 * Load manufacturer data
 */
function loadManufacturers(manufacturerId = null) {
  const manufacturers = [];
  
  if (manufacturerId) {
    // Load specific manufacturer
    const letter = manufacturerId.charAt(0).toLowerCase();
    const filePath = path.join(CONFIG.dataDir, letter, `${manufacturerId}.yaml`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Manufacturer not found: ${manufacturerId}`);
    }
    
    manufacturers.push(parseManufacturerYaml(filePath));
  } else {
    // Load all manufacturers
    const yamlFiles = findYamlFiles(CONFIG.dataDir);
    
    for (const file of yamlFiles) {
      try {
        manufacturers.push(parseManufacturerYaml(file));
      } catch (error) {
        console.error(`Error parsing ${file}:`, error.message);
      }
    }
  }
  
  return manufacturers;
}

/**
 * Verify phone numbers
 */
async function verifyPhoneNumbers(manufacturers, options) {
  if (options.verbose) {
    console.log('\n📞 Verifying phone numbers...');
  }
  
  const phoneEntries = [];
  
  // Extract phone numbers from manufacturers
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
  
  if (options.verbose) {
    console.log(`Found ${phoneEntries.length} phone numbers to verify`);
  }
  
  const results = await batchVerifyPhones(phoneEntries, {
    skipActiveCheck: true,
    timeout: options.timeout
  });
  
  if (options.verbose) {
    const valid = results.filter(r => r.status === 'valid').length;
    console.log(`✅ Verified ${valid}/${results.length} phone numbers successfully`);
  }
  
  return results;
}

/**
 * Verify websites
 */
async function verifyWebsites(manufacturers, options) {
  if (options.verbose) {
    console.log('\n🌐 Verifying websites...');
  }
  
  const websiteEntries = [];
  
  // Extract websites from manufacturers
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
  
  if (options.verbose) {
    console.log(`Found ${websiteEntries.length} websites to verify`);
  }
  
  const results = await batchVerifyWebsites(websiteEntries, {
    timeout: options.timeout,
    delayBetweenRequests: CONFIG.delayBetweenRequests
  });
  
  if (options.verbose) {
    const valid = results.filter(r => r.status === 'valid').length;
    console.log(`✅ Verified ${valid}/${results.length} websites successfully`);
  }
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  CONFIG.verbose = options.verbose;
  
  console.log('🔍 Tech Support Directory - Contact Verification Tool\n');
  
  try {
    // Load manufacturer data
    if (options.verbose) {
      console.log('📂 Loading manufacturer data...');
    }
    
    const manufacturers = loadManufacturers(options.manufacturer);
    
    if (options.verbose) {
      console.log(`Loaded ${manufacturers.length} manufacturer(s)`);
    }
    
    // Run verification based on type
    const results = {
      phone: null,
      website: null
    };
    
    if (options.type === 'all' || options.type === 'phone') {
      results.phone = await verifyPhoneNumbers(manufacturers, options);
    }
    
    if (options.type === 'all' || options.type === 'website') {
      results.website = await verifyWebsites(manufacturers, options);
    }
    
    // Generate reports
    console.log('\n📊 Generating reports...\n');
    
    if (results.phone) {
      const phoneReport = generateReport(results.phone, options.format, {
        type: 'phone',
        title: 'Phone Number Verification Report',
        description: `Verification of ${results.phone.length} phone numbers from tech support directory`
      });
      
      if (options.output) {
        const outputPath = saveReport(phoneReport, 
          options.output.replace('{type}', 'phone'),
          {}
        );
        console.log(`✅ Phone verification report saved to: ${outputPath}`);
      } else {
        console.log('=== PHONE VERIFICATION REPORT ===\n');
        console.log(phoneReport);
      }
    }
    
    if (results.website) {
      const websiteReport = generateReport(results.website, options.format, {
        type: 'website',
        title: 'Website Verification Report',
        description: `Verification of ${results.website.length} websites from tech support directory`
      });
      
      if (options.output) {
        const outputPath = saveReport(websiteReport, 
          options.output.replace('{type}', 'website'),
          {}
        );
        console.log(`✅ Website verification report saved to: ${outputPath}`);
      } else {
        console.log('\n=== WEBSITE VERIFICATION REPORT ===\n');
        console.log(websiteReport);
      }
    }
    
    console.log('\n✨ Verification complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  loadManufacturers,
  verifyPhoneNumbers,
  verifyWebsites,
  parseArgs
};
