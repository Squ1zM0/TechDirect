#!/usr/bin/env node

/**
 * Find Unverified Manufacturers
 * 
 * Identifies manufacturers that have not been verified via web search yet
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// List of verified manufacturers from our batches (manually compiled from reports)
const verifiedManufacturers = new Set([
  // Batch 1-7 (92 manufacturers)
  'A. O. Smith', 'AAON', 'AERCO', 'Amana HAC', 'American Standard', 
  'American Water Heaters', 'Ameristar', 'AMTROL', 'AprilAire', 
  'Armstrong Air', 'Ariston', 'Badger Meter', 'Bell & Gossett',
  'Bosch Home Comfort', 'Bradford White', 'Bryant', 'Buderus',
  'Burnham Commercial', 'Caleffi', 'Carrier', 'Goodman', 'Lennox',
  'Navien', 'Rheem', 'Trane', 'YORK', 'Ajax Boilers', 'KESSEL',
  'TECE', 'TROX', 'Carlin', 'Cash Acme', 'Charlotte Pipe',
  'Chicago Faucets', 'Cleaver-Brooks', 'Daikin', 'Danfoss',
  'Crown Boiler', 'Delta Faucet', 'Dunkirk', 'Elkay', 'Emerson',
  'Field Controls',
  
  // Batch 8-15 (120 manufacturers)
  'Patterson-Kelley', 'Peerless Pump', 'Pentair Hydromatic', 'Pfister',
  'Pioneer Industries', 'Powers', 'Price Industries', 'Raypak',
  'RectorSeal', 'Reliance Water Heaters', 'Rinnai', 'Ruud', 'Reznor',
  'Schneider Electric', 'SharkBite', 'Sioux Chief', 'Slant/Fin',
  'Sloan', 'Speakman', 'State Water Heaters', 'Taco Comfort Solutions',
  'Takagi', 'Titus HVAC', 'Triangle Tube', 'Unico System', 'Uponor',
  'Utica Boilers', 'Viega', 'Victaulic', 'Viessmann', 'Watts',
  'WaterFurnace', 'Webstone', 'Weil-McLain', 'Wilo', 'Woodford',
  'Wolverine Brass',
  
  // Batch 16-23 (100+ manufacturers)
  'Franklin Electric', 'Generac', 'Greenheck', 'Goulds Water Technology',
  'Gerber', 'Grundfos', 'GROHE', 'Halsey Taylor', 'HTP', 'Hansgrohe',
  'Haws', 'Hubbell Water Heaters', 'IMI Hydronic', 'InSinkErator',
  'Ice-O-Matic', 'Jay R. Smith', 'Josam', 'Kohler', 'Laars',
  'Liberty Pumps', 'Leviton', 'Lochinvar', 'Lutron', 'McDonnell & Miller',
  'Mansfield Plumbing', 'Mitsubishi Electric', 'Modine', 'Moen',
  'NIBCO', 'Noritz', 'ACV', 'Addison', 'Adey', 'Anemostat',
  'Anvil', 'Apollo Valves', 'aquatherm',
  
  // Batch 24+ (13+ manufacturers)
  'AtmosAir Solutions', 'Atkore', 'Baltimore Aircoil Company',
  'Bard HVAC', 'Beckett',
  
  // New additions
  'Payne', 'Comfortmaker', 'Brondell', 'Jacuzzi'
]);

function getAllManufacturers() {
  const manufacturers = [];
  const dataDir = path.join(__dirname, '../data/manufacturers');
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.yaml')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const data = yaml.load(content);
          if (data && data.name) {
            manufacturers.push({
              name: data.name,
              file: fullPath.replace(dataDir + '/', ''),
              category: Array.isArray(data.categories) ? data.categories : [data.categories],
              country: data.country
            });
          }
        } catch (err) {
          console.error(`Error reading ${fullPath}:`, err.message);
        }
      }
    }
  }
  
  scanDirectory(dataDir);
  return manufacturers;
}

const allManufacturers = getAllManufacturers();
const unverified = allManufacturers.filter(m => !verifiedManufacturers.has(m.name));

console.log(`Total Manufacturers: ${allManufacturers.length}`);
console.log(`Verified: ${verifiedManufacturers.size}`);
console.log(`Unverified: ${unverified.length}`);
console.log('\n=== UNVERIFIED MANUFACTURERS ===\n');

// Group by first letter for easier batch processing
const byLetter = {};
unverified.forEach(m => {
  const firstLetter = m.name[0].toUpperCase();
  if (!byLetter[firstLetter]) {
    byLetter[firstLetter] = [];
  }
  byLetter[firstLetter].push(m);
});

Object.keys(byLetter).sort().forEach(letter => {
  console.log(`\n${letter} (${byLetter[letter].length} manufacturers):`);
  byLetter[letter].forEach((m, idx) => {
    console.log(`  ${idx + 1}. ${m.name} (${m.category.join(', ')}) [${m.country}]`);
  });
});

// Save to file for reference
const outputPath = path.join(__dirname, '../verification-reports/UNVERIFIED_LIST.txt');
const output = unverified.map(m => 
  `${m.name}\t${m.category.join(', ')}\t${m.country}\t${m.file}`
).join('\n');

fs.writeFileSync(outputPath, 
  `Unverified Manufacturers (${unverified.length} total)\n` +
  `Generated: ${new Date().toISOString()}\n\n` +
  `NAME\tCATEGORY\tCOUNTRY\tFILE\n` +
  output
);

console.log(`\n\nList saved to: ${outputPath}`);
