// Debug script to test namespace import resolution
const path = require('path');

console.log('=== Enhanced Store Namespace Import Debug ===');

// Try to import the enhanced store directly
try {
  console.log('1. Attempting to import canvasElementsStore directly...');
  const CanvasElementsStore = require('../src/features/canvas/stores/slices/canvasElementsStore.ts');
  console.log('✅ Direct import successful');
  console.log('exports:', Object.keys(CanvasElementsStore));
  console.log('createCanvasElementsStore type:', typeof CanvasElementsStore.createCanvasElementsStore);
} catch (error) {
  console.error('❌ Direct import failed:', error.message);
}

console.log('\n2. Attempting to test module resolution with absolute path...');
try {
  // Test absolute path resolution
  const CanvasElementsStore = require(path.resolve(__dirname, '../src/features/canvas/stores/slices/canvasElementsStore.ts'));
  console.log('✅ Absolute path import successful');
  console.log('exports:', Object.keys(CanvasElementsStore));
} catch (error) {
  console.error('❌ Absolute path import failed:', error.message);
}

console.log('\n3. Testing enhanced store creation...');
try {
  // Try to require the enhanced store
  const enhancedStore = require('../src/features/canvas/stores/canvasStore.enhanced.ts');
  console.log('❌ Enhanced store imported without error - this should have failed');
} catch (error) {
  console.log('✅ Enhanced store import failed as expected:', error.message);
}

console.log('\n=== Debug Complete ===');
