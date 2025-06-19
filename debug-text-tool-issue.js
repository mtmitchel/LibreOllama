// Debug script to trace text tool selection issue
console.log('🔍 [DEBUG] Starting text tool investigation...');

// Check for console warnings about missing or unused dependencies
console.log('📊 [DEBUG] Starting script to trace text tool selection behavior');

// Mock elements data to test various scenarios
const mockElements = {
  'element_1': { id: 'element_1', type: 'rectangle', x: 100, y: 100, width: 50, height: 50 },
  'element_2': { id: 'element_2', type: 'circle', x: 200, y: 200, radius: 30 },
  'element_3': { id: 'element_3', type: 'text', x: 300, y: 300, text: 'Hello World' }
};

// Mock sections data
const mockSections = {
  'section_1': { id: 'section_1', x: 50, y: 50, width: 400, height: 300, containedElementIds: ['element_1', 'element_2', 'element_3'] }
};

console.log('📦 [DEBUG] Mock data created:');
console.log('Elements:', Object.keys(mockElements).length);
console.log('Sections:', Object.keys(mockSections).length);

// Test text tool selection logic
console.log('🔧 [DEBUG] Simulating text tool selection...');

// Check if there are any clear operations that might be happening
const potentialClearOperations = [
  'clearAllElements',
  'clearSelection', 
  'resetElements',
  'clearCanvas',
  'removeAllElements'
];

console.log('🔍 [DEBUG] Checking for potential clear operations in codebase...');
potentialClearOperations.forEach(op => {
  console.log(`   - ${op}: Need to check if this is called during text tool selection`);
});

// Check for timing issues
console.log('⏱️ [DEBUG] Timing analysis - setTimeout usage:');
console.log('   - Text tool uses setTimeout(() => setSelectedTool("select"), 100)');
console.log('   - This could be causing race conditions if other code reacts to tool changes');

console.log('🎯 [DEBUG] Key investigation points:');
console.log('   1. Check if any useEffect hooks react to selectedTool changes');
console.log('   2. Check if any store subscriptions cause element clearing');
console.log('   3. Check if enhanced store cross-slice operations have bugs');
console.log('   4. Check if text tool creation process differs from other tools');

console.log('✅ [DEBUG] Debug analysis complete. Check console for any actual errors.');
