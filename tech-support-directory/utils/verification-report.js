#!/usr/bin/env node
/**
 * Verification Report Generator
 * 
 * Generates structured reports from verification results in multiple formats:
 * - JSON (detailed machine-readable format)
 * - CSV (spreadsheet-compatible format)
 * - Markdown (human-readable summary)
 * 
 * Usage:
 *   const { generateReport } = require('./verification-report');
 *   const report = generateReport(results, 'json');
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate summary statistics from verification results
 * @param {Array} results - Array of verification results
 * @param {string} type - Type of verification ('phone' or 'website')
 * @returns {object} Summary statistics
 */
function generateSummary(results, type) {
  const summary = {
    total: results.length,
    valid: 0,
    invalid: 0,
    warning: 0,
    error: 0,
    unknown: 0,
    byConfidence: {
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0
    }
  };

  results.forEach(result => {
    switch (result.status) {
      case 'valid':
        summary.valid++;
        break;
      case 'invalid':
      case 'inaccessible':
        summary.invalid++;
        break;
      case 'warning':
        summary.warning++;
        break;
      case 'error':
        summary.error++;
        break;
      default:
        summary.unknown++;
    }

    if (result.confidence) {
      summary.byConfidence[result.confidence] = (summary.byConfidence[result.confidence] || 0) + 1;
    }
  });

  summary.successRate = summary.total > 0 
    ? ((summary.valid / summary.total) * 100).toFixed(2) + '%'
    : 'N/A';

  return summary;
}

/**
 * Generate JSON report
 * @param {Array} results - Verification results
 * @param {object} metadata - Report metadata
 * @returns {string} JSON report
 */
function generateJsonReport(results, metadata) {
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      ...metadata
    },
    summary: generateSummary(results, metadata.type),
    results: results
  };

  return JSON.stringify(report, null, 2);
}

/**
 * Generate CSV report
 * @param {Array} results - Verification results
 * @param {string} type - Type of verification ('phone' or 'website')
 * @returns {string} CSV report
 */
function generateCsvReport(results, type) {
  const rows = [];
  
  if (type === 'phone') {
    // CSV header for phone verification
    rows.push([
      'ID',
      'Phone Number',
      'Country',
      'Status',
      'Confidence',
      'Normalized',
      'Format Check',
      'Country Check',
      'Callable Check',
      'Issues',
      'Recommendations',
      'Timestamp'
    ].join(','));

    // CSV rows
    results.forEach(result => {
      rows.push([
        escapeCsv(result.id || ''),
        escapeCsv(result.phone || ''),
        escapeCsv(result.details?.detectedCountry || ''),
        escapeCsv(result.status),
        escapeCsv(result.confidence),
        escapeCsv(result.details?.normalized || ''),
        escapeCsv(result.checks?.format || ''),
        escapeCsv(result.checks?.country || ''),
        escapeCsv(result.checks?.callable || ''),
        escapeCsv(result.issues.join('; ')),
        escapeCsv(result.recommendations.join('; ')),
        escapeCsv(result.timestamp)
      ].join(','));
    });
  } else if (type === 'website') {
    // CSV header for website verification
    rows.push([
      'ID',
      'URL',
      'Status',
      'Confidence',
      'Status Code',
      'Response Time (ms)',
      'Format Check',
      'Accessible Check',
      'SSL Check',
      'Redirects Check',
      'Issues',
      'Warnings',
      'Recommendations',
      'Timestamp'
    ].join(','));

    // CSV rows
    results.forEach(result => {
      rows.push([
        escapeCsv(result.id || ''),
        escapeCsv(result.url || ''),
        escapeCsv(result.status),
        escapeCsv(result.confidence),
        escapeCsv(result.details?.statusCode?.toString() || ''),
        escapeCsv(result.details?.responseTime?.toString() || ''),
        escapeCsv(result.checks?.format || ''),
        escapeCsv(result.checks?.accessible || ''),
        escapeCsv(result.checks?.ssl || ''),
        escapeCsv(result.checks?.redirects || ''),
        escapeCsv(result.issues.join('; ')),
        escapeCsv(result.warnings.join('; ')),
        escapeCsv(result.recommendations.join('; ')),
        escapeCsv(result.timestamp)
      ].join(','));
    });
  }

  return rows.join('\n');
}

/**
 * Escape CSV values
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Generate Markdown report
 * @param {Array} results - Verification results
 * @param {object} metadata - Report metadata
 * @returns {string} Markdown report
 */
function generateMarkdownReport(results, metadata) {
  const summary = generateSummary(results, metadata.type);
  const lines = [];

  lines.push(`# ${metadata.title || 'Verification Report'}`);
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  if (metadata.description) {
    lines.push(`**Description:** ${metadata.description}`);
  }
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Entries:** ${summary.total}`);
  lines.push(`- **Valid:** ${summary.valid} (${summary.successRate})`);
  lines.push(`- **Invalid:** ${summary.invalid}`);
  lines.push(`- **Warnings:** ${summary.warning}`);
  lines.push(`- **Errors:** ${summary.error}`);
  lines.push('');

  // Confidence breakdown
  lines.push('### Confidence Breakdown');
  lines.push('');
  lines.push(`- **High Confidence:** ${summary.byConfidence.high}`);
  lines.push(`- **Medium Confidence:** ${summary.byConfidence.medium}`);
  lines.push(`- **Low Confidence:** ${summary.byConfidence.low}`);
  lines.push(`- **Unknown:** ${summary.byConfidence.unknown}`);
  lines.push('');

  // Issues found
  const invalidResults = results.filter(r => r.status === 'invalid' || r.status === 'inaccessible');
  if (invalidResults.length > 0) {
    lines.push('## Issues Found');
    lines.push('');
    
    invalidResults.forEach(result => {
      const identifier = result.id || result.phone || result.url;
      lines.push(`### ${identifier}`);
      lines.push('');
      lines.push(`- **Status:** ${result.status}`);
      lines.push(`- **Confidence:** ${result.confidence}`);
      
      if (result.issues.length > 0) {
        lines.push('- **Issues:**');
        result.issues.forEach(issue => {
          lines.push(`  - ${issue}`);
        });
      }
      
      if (result.recommendations.length > 0) {
        lines.push('- **Recommendations:**');
        result.recommendations.forEach(rec => {
          lines.push(`  - ${rec}`);
        });
      }
      lines.push('');
    });
  }

  // Warnings
  const warningResults = results.filter(r => r.status === 'warning' || (r.warnings && r.warnings.length > 0));
  if (warningResults.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    
    warningResults.forEach(result => {
      const identifier = result.id || result.phone || result.url;
      const warnings = result.warnings || [];
      
      if (warnings.length > 0) {
        lines.push(`### ${identifier}`);
        lines.push('');
        warnings.forEach(warning => {
          lines.push(`- ${warning}`);
        });
        lines.push('');
      }
    });
  }

  // Valid entries summary
  const validResults = results.filter(r => r.status === 'valid');
  if (validResults.length > 0) {
    lines.push('## Valid Entries');
    lines.push('');
    lines.push(`✅ ${validResults.length} ${metadata.type === 'phone' ? 'phone numbers' : 'websites'} verified successfully.`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate verification report
 * @param {Array} results - Verification results
 * @param {string} format - Report format ('json', 'csv', 'markdown')
 * @param {object} metadata - Report metadata
 * @returns {string} Generated report
 */
function generateReport(results, format, metadata = {}) {
  switch (format.toLowerCase()) {
    case 'json':
      return generateJsonReport(results, metadata);
    case 'csv':
      return generateCsvReport(results, metadata.type || 'unknown');
    case 'markdown':
    case 'md':
      return generateMarkdownReport(results, metadata);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Save report to file
 * @param {string} report - Report content
 * @param {string} filename - Output filename
 * @param {object} options - Save options
 * @returns {string} Saved file path
 */
function saveReport(report, filename, options = {}) {
  const outputDir = options.outputDir || process.cwd();
  const filePath = path.join(outputDir, filename);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, report, 'utf8');
  return filePath;
}

module.exports = {
  generateReport,
  generateSummary,
  generateJsonReport,
  generateCsvReport,
  generateMarkdownReport,
  saveReport
};
