// Script to replace console.log statements with canvasLogger in canvas components
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to update based on grep search results
const filesToUpdate = [
  
  'src/features/canvas/components/ui/ZoomControls.tsx',
  'src/features/canvas/components/tools/creation/SectionTool.tsx',
  'src/features/canvas/components/tools/creation/StickyNoteTool.tsx',
  'src/features/canvas/components/tools/creation/MindmapTool.tsx',
  'src/features/canvas/components/tools/creation/TextTool.tsx',
  'src/features/canvas/components/ui/CanvasDragDropHandler.tsx',
  'src/features/canvas/components/tools/base/BaseShapeTool.tsx',
  'src/features/canvas/components/ConnectorShape.tsx',
  'src/features/canvas/components/CanvasStage.tsx',
  'src/features/canvas/components/CanvasErrorBoundary.tsx',
  'src/features/canvas/shapes/EditableNode.tsx',
  'src/features/canvas/shapes/TriangleShape.tsx',
  'src/features/canvas/shapes/ImageShape.tsx',
  'src/features/canvas/renderers/ElementRenderer.tsx',
  'src/features/canvas/shapes/RectangleShape.tsx',
  'src/features/canvas/shapes/CircleShape.tsx',
  'src/features/canvas/layers/CanvasLayerManager.tsx'
];

// Replacements to make
const replacements = [
  // Console.log -> canvasLog.debug or canvasLog.info based on context
  { pattern: /console\.log\(/g, replacement: 'canvasLog.debug(' },
  // Console.warn -> canvasLog.warn
  { pattern: /console\.warn\(/g, replacement: 'canvasLog.warn(' },
  // Console.error -> canvasLog.error
  { pattern: /console\.error\(/g, replacement: 'canvasLog.error(' }
];

// Import statement to add if not present
const importStatement = "import { canvasLog } from '../utils/canvasLogger';";

function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Check if canvasLog is already imported
  const hasCanvasLogImport = content.includes('canvasLogger');
  
  // Apply replacements
  let hasReplacements = false;
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      hasReplacements = true;
    }
  });
  
  // If we made replacements and don't have the import, add it
  if (hasReplacements && !hasCanvasLogImport) {
    // Find the right place to add the import (after other imports)
    const importRegex = /^import.*from.*;$/gm;
    const imports = content.match(importRegex);
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      
      // Adjust import path based on file location
      const relativePath = path.relative(path.dirname(filePath), 'src/features/canvas/utils');
      const adjustedImport = importStatement.replace('../utils', relativePath.replace(/\\/g, '/'));
      
      content = content.slice(0, lastImportIndex + lastImport.length) + 
                '\n' + adjustedImport + 
                content.slice(lastImportIndex + lastImport.length);
    }
  }
  
  // Write back if changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes: ${filePath}`);
  }
}

// Process all files
filesToUpdate.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    processFile(fullPath);
  } else {
    console.log(`❌ File not found: ${fullPath}`);
  }
});

console.log('\n✅ Console.log replacement complete!'); 