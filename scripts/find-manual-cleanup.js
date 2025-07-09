#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Patterns to find that need manual review
const MANUAL_CLEANUP_PATTERNS = {
  consoleStatements: {
    pattern: /console\.(log|debug|warn|info)\s*\(/g,
    description: 'Console statements that should be replaced with proper logging',
    excludePatterns: [
      /test\.(ts|tsx|js|jsx)$/,
      /\.test\./,
      /\/tests?\//,
      /mock/i,
      /spec\.(ts|tsx|js|jsx)$/,
      /vitest/,
      /setup\.ts$/
    ]
  },
  
  todoComments: {
    pattern: /(TODO|FIXME|XXX|HACK|BUG)[\s:]/gi,
    description: 'TODO comments that should be converted to issues or addressed',
    excludePatterns: []
  },
  
  deprecatedCode: {
    pattern: /@deprecated|deprecated|DEPRECATED|Legacy|LEGACY/gi,
    description: 'Deprecated code that can potentially be removed',
    excludePatterns: []
  },
  
  emptyFunctions: {
    pattern: /{\s*\/\/\s*(TODO|FIXME|No-op|Empty|Placeholder)/gi,
    description: 'Empty function implementations that might be removable',
    excludePatterns: []
  },
  
  unusedImports: {
    pattern: /import\s+[^'"`]*from\s+['"`][^'"`]*['"`]\s*;\s*$/gm,
    description: 'Potential unused imports (requires manual verification)',
    excludePatterns: []
  }
};

const ANALYSIS_CONFIG = {
  sourceDirectories: ['src', 'src-tauri/src'],
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.rs'],
  maxFileSize: 5 * 1024 * 1024, // 5MB max
  maxResults: 50 // Limit results per pattern
};

function shouldExcludeFile(filePath, excludePatterns) {
  return excludePatterns.some(pattern => pattern.test(filePath));
}

function analyzeFile(filePath, pattern, excludePatterns) {
  if (shouldExcludeFile(filePath, excludePatterns)) {
    return [];
  }

  try {
    const stats = fs.statSync(filePath);
    if (stats.size > ANALYSIS_CONFIG.maxFileSize) {
      return []; // Skip very large files
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [];
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const lines = content.substring(0, match.index).split('\n');
      const lineNumber = lines.length;
      const lineContent = lines[lineNumber - 1].trim();
      
      matches.push({
        file: filePath,
        line: lineNumber,
        content: lineContent,
        match: match[0],
        context: getContext(content, match.index)
      });

      // Reset regex lastIndex to avoid infinite loops with global patterns
      if (!pattern.global) break;
    }

    return matches;
  } catch (error) {
    console.warn(`Warning: Could not analyze ${filePath}: ${error.message}`);
    return [];
  }
}

function getContext(content, index) {
  const lines = content.split('\n');
  const position = content.substring(0, index).split('\n').length - 1;
  const start = Math.max(0, position - 1);
  const end = Math.min(lines.length, position + 2);
  return lines.slice(start, end).join('\n');
}

function findFilesToAnalyze(dir, extensions) {
  const files = [];
  
  function walkDir(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules, .git, target, and other build directories
          if (!['node_modules', '.git', 'target', 'dist', 'build', '.next'].includes(entry.name)) {
            walkDir(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${currentDir}: ${error.message}`);
    }
  }
  
  walkDir(dir);
  return files;
}

function generateReport(results) {
  console.log('🔍 Manual Cleanup Analysis Report\n');
  console.log('=' .repeat(60));
  
  for (const [patternName, data] of Object.entries(results)) {
    console.log(`\n📋 ${data.description}`);
    console.log('-'.repeat(40));
    
    if (data.results.length === 0) {
      console.log('   ✅ No issues found');
      continue;
    }

    const fileGroups = {};
    data.results.forEach(result => {
      if (!fileGroups[result.file]) {
        fileGroups[result.file] = [];
      }
      fileGroups[result.file].push(result);
    });

    console.log(`   Found ${data.results.length} instances in ${Object.keys(fileGroups).length} files\n`);
    
    // Show top 10 files with most issues
    const sortedFiles = Object.entries(fileGroups)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10);

    for (const [file, matches] of sortedFiles) {
      console.log(`   📄 ${file} (${matches.length} matches)`);
      
      // Show first few matches
      matches.slice(0, 3).forEach(match => {
        console.log(`      Line ${match.line}: ${match.content}`);
      });
      
      if (matches.length > 3) {
        console.log(`      ... and ${matches.length - 3} more`);
      }
      console.log('');
    }

    if (Object.keys(fileGroups).length > 10) {
      console.log(`   ... and ${Object.keys(fileGroups).length - 10} more files`);
    }
  }
}

function calculatePotentialSavings(results) {
  let totalLines = 0;
  const filesAffected = new Set();
  
  for (const data of Object.values(results)) {
    data.results.forEach(result => {
      totalLines++;
      filesAffected.add(result.file);
    });
  }
  
  console.log('\n💾 Potential Impact:');
  console.log(`   Lines to review: ${totalLines}`);
  console.log(`   Files affected: ${filesAffected.size}`);
  console.log(`   Estimated cleanup potential: ${(totalLines * 0.3).toFixed(0)} lines removable`);
}

async function main() {
  console.log('🔍 Analyzing codebase for manual cleanup opportunities...\n');
  
  const allFiles = [];
  for (const dir of ANALYSIS_CONFIG.sourceDirectories) {
    if (fs.existsSync(dir)) {
      allFiles.push(...findFilesToAnalyze(dir, ANALYSIS_CONFIG.fileExtensions));
    }
  }
  
  console.log(`📊 Analyzing ${allFiles.length} files...\n`);
  
  const results = {};
  
  for (const [patternName, config] of Object.entries(MANUAL_CLEANUP_PATTERNS)) {
    console.log(`Checking for: ${config.description}...`);
    results[patternName] = {
      description: config.description,
      results: []
    };
    
    for (const file of allFiles) {
      const matches = analyzeFile(file, new RegExp(config.pattern), config.excludePatterns);
      results[patternName].results.push(...matches);
      
      // Limit results to prevent overwhelming output
      if (results[patternName].results.length > ANALYSIS_CONFIG.maxResults) {
        results[patternName].results = results[patternName].results.slice(0, ANALYSIS_CONFIG.maxResults);
        break;
      }
    }
  }
  
  generateReport(results);
  calculatePotentialSavings(results);
  
  console.log('\n📋 Next Steps:');
  console.log('1. Review console.log statements and replace with proper logging');
  console.log('2. Convert TODO comments to GitHub issues or fix them');
  console.log('3. Remove or update deprecated code');
  console.log('4. Clean up empty function implementations');
  console.log('5. Use an import analyzer to find truly unused imports');
  console.log('\n💡 For import analysis, consider using: npx unimported');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MANUAL_CLEANUP_PATTERNS, analyzeFile }; 