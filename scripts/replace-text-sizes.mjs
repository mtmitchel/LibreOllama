#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Typography mapping rules
const replacements = [
  // Direct text size classes (most specific first)
  { pattern: /\btext-3xl\b/g, replacement: 'asana-text-2xl' },
  { pattern: /\btext-2xl\b/g, replacement: 'asana-text-2xl' },
  { pattern: /\btext-xl\b/g, replacement: 'asana-text-xl' },
  { pattern: /\btext-lg\b/g, replacement: 'asana-text-lg' },
  { pattern: /\btext-base\b/g, replacement: 'asana-text-base' },
  { pattern: /\btext-sm\b/g, replacement: 'asana-text-sm' },
  { pattern: /\btext-xs\b/g, replacement: 'text-[11px]' }, // Special case for tiny text
];

// Find all relevant files
const srcDirs = ['src/components', 'src/features'];
const excludeDirs = ['__archive__', '_archive', 'archived'];
const excludeFiles = ['*.stories.tsx', '*.test.tsx', '*.spec.tsx'];

function shouldProcessFile(filePath) {
  // Check if path contains any excluded directory
  for (const excludeDir of excludeDirs) {
    if (filePath.includes(excludeDir)) {
      return false;
    }
  }
  
  // Check if file matches any excluded pattern
  const fileName = path.basename(filePath);
  if (fileName.includes('.stories.') || fileName.includes('.test.') || fileName.includes('.spec.')) {
    return false;
  }
  
  return true;
}

function processFile(filePath) {
  if (!shouldProcessFile(filePath)) {
    return { path: filePath, skipped: true };
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const changes = [];
  
  // Apply each replacement
  for (const { pattern, replacement } of replacements) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      changes.push(`${matches.length}x ${pattern.source} → ${replacement}`);
    }
  }
  
  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { path: filePath, changes, modified: true };
  }
  
  return { path: filePath, modified: false };
}

// Main execution
console.log('Starting text size replacement...\n');

let totalFiles = 0;
let modifiedFiles = 0;
let skippedFiles = 0;
const results = [];

for (const dir of srcDirs) {
  const pattern = path.join(dir, '**/*.{tsx,jsx}');
  const files = await glob(pattern, { nodir: true });
  
  for (const file of files) {
    totalFiles++;
    const result = processFile(file);
    
    if (result.skipped) {
      skippedFiles++;
    } else if (result.modified) {
      modifiedFiles++;
      results.push(result);
    }
  }
}

// Print results
console.log('='.repeat(60));
console.log('REPLACEMENT SUMMARY');
console.log('='.repeat(60));
console.log(`Total files scanned: ${totalFiles}`);
console.log(`Files modified: ${modifiedFiles}`);
console.log(`Files skipped: ${skippedFiles}`);
console.log(`Files unchanged: ${totalFiles - modifiedFiles - skippedFiles}`);
console.log('');

if (results.length > 0) {
  console.log('Modified files:');
  console.log('-'.repeat(60));
  
  results.forEach(result => {
    console.log(`\n${result.path}`);
    result.changes.forEach(change => {
      console.log(`  • ${change}`);
    });
  });
}

console.log('\n✅ Text size replacement complete!');