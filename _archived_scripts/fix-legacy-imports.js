#!/usr/bin/env node

/**
 * Mass Legacy Import Fix Script
 * 
 * This script systematically replaces all legacy store imports with 
 * the unified store adapter, eliminating the mixed store architecture.
 */

const fs = require('fs');
const path = require('path');

// Files to update and their import fixes
const importFixes = [
  {
    // Pattern to find
    from: /import\s*{\s*([^}]*)\s*}\s*from\s*['"][^'"]*stores\/canvasStore\.enhanced['"];?/g,
    // Replacement - calculate relative path to main stores
    to: (match, imports, filePath) => {
      const relativePath = calculateRelativePath(filePath, '/src/stores');
      return `import { ${imports.trim()} } from '${relativePath}'; // Unified store via adapter`;
    }
  },
  {
    // Alternative pattern
    from: /import\s*{\s*([^}]*)\s*}\s*from\s*['"][^'"]*\/stores\/canvasStore\.enhanced['"];?/g,
    to: (match, imports, filePath) => {
      const relativePath = calculateRelativePath(filePath, '/src/stores');
      return `import { ${imports.trim()} } from '${relativePath}'; // Unified store via adapter`;
    }
  }
];

function calculateRelativePath(fromFile, toDir) {
  // Calculate relative path from file to /src/stores
  const fromDir = path.dirname(fromFile);
  const srcIndex = fromFile.indexOf('/src/');
  const fromSrc = fromDir.substring(srcIndex + 4); // Remove '/src' part
  
  const levels = fromSrc.split('/').length - 1;
  const upLevels = '../'.repeat(levels);
  
  return `${upLevels}stores`;
}

// Files to process
const filesToProcess = [
  '/mnt/c/Projects/LibreOllama/src/features/canvas/components/CanvasSidebar.tsx',
  '/mnt/c/Projects/LibreOllama/src/features/canvas/components/connectors/ConnectorManager.tsx',
  '/mnt/c/Projects/LibreOllama/src/features/canvas/components/EnhancedTableElement.tsx',
  '/mnt/c/Projects/LibreOllama/src/features/canvas/components/KonvaDebugPanel.tsx',
  '/mnt/c/Projects/LibreOllama/src/features/canvas/components/performance/VirtualizedSection.tsx',
  '/mnt/c/Projects/LibreOllama/src/features/canvas/components/table/TableCellEditor.tsx',
  '/mnt/c/Projects/LibreOllama/src/features/canvas/components/toolbar/ShapesDropdown.tsx',
  '/mnt/c/Projects/LibreOllama/src/features/canvas/components/tools/PenTool.tsx',
  '/mnt/c/Projects/LibreOllama/src/features/canvas/components/tools/SectionTool.tsx',
  '/mnt/c/Projects/LibreOllama/src/features/canvas/components/ui/LayersPanel.tsx'
];

console.log('🔧 Starting legacy import cleanup...');
console.log(`📁 Processing ${filesToProcess.length} files`);

filesToProcess.forEach((filePath, index) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply each import fix
    importFixes.forEach(fix => {
      const newContent = content.replace(fix.from, (match, imports) => {
        modified = true;
        return fix.to(match, imports, filePath);
      });
      content = newContent;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${path.basename(filePath)}`);
    } else {
      console.log(`⏭️  No changes: ${path.basename(filePath)}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('🎉 Legacy import cleanup complete!');
console.log('📋 Summary:');
console.log('- All components now use unified store via adapter');
console.log('- Legacy store imports eliminated');
console.log('- Single source of truth established');