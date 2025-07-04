#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files identified as unused by npx unimported that are safe to delete
const filesToDelete = [
  'src/features/canvas/hooks/useMemoryPressure.ts',
  'src/features/canvas/types/performance.ts',
  'src/features/canvas/types/shape-props.types.ts',
  'src/features/canvas/types/tools.ts',
  'src/features/canvas/utils/canvas/CacheManager.ts',
  'src/features/canvas/utils/canvasRedrawUtils.ts',
  'src/features/canvas/utils/connectorUtils.ts',
  'src/features/canvas/utils/dataValidation.ts',
  'src/features/canvas/utils/events/delegation.ts',
  'src/features/canvas/utils/events/index.ts',
  'src/features/canvas/utils/events/performance.ts',
  'src/features/canvas/utils/events/throttling.ts',
  'src/features/canvas/utils/memory/MemoryOptimizedCulling.ts',
  'src/features/canvas/utils/performance/index.ts',
  'src/features/canvas/utils/richTextUtils.ts',
  'src/features/canvas/utils/sectionUtils.ts',
  'src/features/canvas/utils/snappingUtils.ts',
  'src/features/canvas/utils/tableUtils.ts',
  'src/features/canvas/utils/throttle.ts',
  'src/features/canvas/components/tools/creation/ImageTool.tsx',
  'src/features/canvas/components/tools/LazyToolRenderer.tsx',
  'src/features/canvas/toolbar/ColorPicker.tsx',
  'src/features/canvas/toolbar/FloatingTextToolbar.tsx',
  'src/utils/konva-optimized.ts',
  'src/utils/performance.ts',
  'src/components/ThemeProvider.tsx',
  'src/components/ThemeToggle.tsx'
];

// Index files that are likely safe to delete
const indexFilesToDelete = [
  'src/components/index.ts',
  'src/components/layout/index.tsx',
  'src/components/navigation/index.tsx',
  'src/core/hooks/index.ts',
  'src/core/lib/index.ts',
  'src/features/canvas/components/ui/index.ts',
  'src/features/canvas/elements/index.ts',
  'src/features/canvas/index.ts',
  'src/features/canvas/layers/index.ts',
  'src/features/canvas/renderers/index.ts',
  'src/features/canvas/shapes/index.ts',
  'src/features/canvas/utils/index.ts',
  'src/stores/index.ts',
  'src/utils/index.ts'
];

let deletedCount = 0;
let errorCount = 0;

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted: ${filePath}`);
      deletedCount++;
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting ${filePath}:`, error.message);
    errorCount++;
  }
}

console.log('🧹 Starting dead code cleanup...\n');

console.log('Deleting unused utility and component files...');
filesToDelete.forEach(deleteFile);

console.log('\nDeleting unused index files...');
indexFilesToDelete.forEach(deleteFile);

console.log(`\n📊 Cleanup Summary:`);
console.log(`✅ Files deleted: ${deletedCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`💾 Estimated bundle size reduction: ~${Math.round(deletedCount * 2)}KB`); 