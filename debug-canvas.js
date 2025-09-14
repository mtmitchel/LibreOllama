// Canvas Debugging Script - Run in Browser Console
// This script enables the modular canvas system and tests the debugging pipeline

console.log('=== CANVAS DEBUGGING SCRIPT ===');

// Step 1: Enable modular canvas flag
console.log('Step 1: Enabling modular canvas flag...');
localStorage.setItem('USE_NEW_CANVAS', 'true');
console.log('✓ Modular canvas flag enabled');

// Step 2: Reload page to activate modular system
console.log('Step 2: Reloading page to activate modular system...');
window.location.reload();

// Note: After reload, the following steps should be run manually:
/*
// Step 3: Navigate to Canvas page
console.log('Step 3: Navigate to /canvas');

// Step 4: Check console for QA-DEBUG logs
console.log('Step 4: Check for QA-DEBUG logs in console');

// Step 5: Test element creation
console.log('Step 5: Testing text element creation...');

// Access the store and add a test text element
const store = window.__UNIFIED_CANVAS_STORE__;
if (store) {
  const testElement = {
    id: 'test-debug-' + Date.now(),
    type: 'text',
    x: 100,
    y: 100,
    width: 60,
    height: 24,
    text: 'DEBUG TEST',
    fontSize: 16,
    fontFamily: 'Arial',
    fill: '#000000',
    isLocked: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isHidden: false
  };

  console.log('Adding test element:', testElement);
  store.getState().addElement(testElement);
  console.log('✓ Test element added');
} else {
  console.error('❌ Store not found on window');
}
*/