// Debug script to test namespace import issue
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Try to simulate the namespace import issue
console.log('=== Testing namespace import simulation ===');

// Simulate what happens with namespace import
const mockCanvasElementsStore = {
  createCanvasElementsStore: function() { return 'creator-function'; },
  useCanvasElementsStore: function() { return 'store-instance'; },
  useCanvasElements: function() { return 'selector'; }
};

const mockViewportStore = {
  createViewportStore: function() { return 'creator-function'; }
};

console.log('Canvas Elements Store namespace:');
console.log('- createCanvasElementsStore:', typeof mockCanvasElementsStore.createCanvasElementsStore);
console.log('- useCanvasElementsStore:', typeof mockCanvasElementsStore.useCanvasElementsStore);

console.log('\nViewport Store namespace:');
console.log('- createViewportStore:', typeof mockViewportStore.createViewportStore);

console.log('\nTesting function calls:');
try {
  console.log('Canvas creator result:', mockCanvasElementsStore.createCanvasElementsStore());
  console.log('Viewport creator result:', mockViewportStore.createViewportStore());
} catch (e) {
  console.error('Error calling functions:', e.message);
}
