#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to clean up console logs from
const filesToClean = [
  'src/features/canvas/shapes/StickyNoteShape.tsx',
  'src/features/canvas/shapes/RectangleShape.tsx',
  'src/features/canvas/shapes/CircleShape.tsx',
  'src/features/canvas/shapes/TriangleShape.tsx',
  'src/features/canvas/shapes/TextShape.tsx',
  'src/features/canvas/toolbar/ModernKonvaToolbar.tsx',
  'src/features/canvas/utils/textEditingUtils.tsx'
];

let totalLogsRemoved = 0;

function cleanConsoleLogsFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return 0;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.length;
    
    // Count console logs before removal
    const logMatches = content.match(/console\.(log|warn|info|debug)\([^;]*\);?/g);
    const logCount = logMatches ? logMatches.length : 0;
    
    if (logCount === 0) {
      console.log(`✅ ${filePath} - No console logs found`);
      return 0;
    }

    // Remove console.log statements (but keep console.error for critical errors)
    content = content.replace(/\s*console\.(log|warn|info|debug)\([^;]*\);?\s*/g, '\n');
    
    // Clean up extra blank lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
    
    const newLength = content.length;
    const bytesRemoved = originalLength - newLength;
    
    console.log(`🧹 ${filePath} - Removed ${logCount} console logs (${bytesRemoved} bytes)`);
    return logCount;
    
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return 0;
  }
}

console.log('🧹 Starting console log cleanup for performance optimization...\n');

filesToClean.forEach(filePath => {
  const logsRemoved = cleanConsoleLogsFromFile(filePath);
  totalLogsRemoved += logsRemoved;
});

console.log(`\n📊 Cleanup Summary:`);
console.log(`✅ Console logs removed: ${totalLogsRemoved}`);
console.log(`🚀 Expected performance improvement: Significant`);
console.log(`💡 Note: console.error statements preserved for debugging`); 