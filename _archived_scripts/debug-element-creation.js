/**
 * Canvas Element Creation Debug Script
 * Based on CANVAS_REFACTOR.md debugging guide
 * 
 * Run this in browser console to diagnose element creation issues
 */

console.log('🔧 Canvas Element Creation Debugging...');

// 1. Tool Selection State Verification
function debugToolSelection() {
  console.log('\n=== 🔧 TOOL SELECTION DEBUG ===');
  
  const store = window.__CANVAS_STORE__;
  if (!store) {
    console.error('❌ Store not available');
    return;
  }
  
  console.log('Current tool:', store.selectedTool);
  
  // Test tool switching
  const testTools = ['rectangle', 'circle', 'text', 'pen'];
  
  testTools.forEach((tool, index) => {
    setTimeout(() => {
      console.log(`\n🔧 Testing tool: ${tool}`);
      
      // Store state before
      const beforeTool = store.selectedTool;
      
      // Switch tool
      store.setSelectedTool(tool);
      
      // Check after next tick
      setTimeout(() => {
        const afterTool = store.selectedTool;
        console.log(`  Before: ${beforeTool} → After: ${afterTool}`);
        
        if (afterTool === tool) {
          console.log(`  ✅ Tool switch successful: ${tool}`);
        } else {
          console.error(`  🚨 Tool switch failed: expected ${tool}, got ${afterTool}`);
        }
      }, 50);
      
    }, index * 500);
  });
}

// 2. Store Element Addition Verification
function debugElementAddition() {
  console.log('\n=== 📦 ELEMENT ADDITION DEBUG ===');
  
  const store = window.__CANVAS_STORE__;
  if (!store || !store.addElement) {
    console.error('❌ Store or addElement not available');
    return;
  }
  
  // Test adding a simple rectangle
  const testElement = {
    id: `debug-rect-${Date.now()}`,
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  console.log('📦 Adding test element:', testElement);
  
  // Get element count before
  const beforeCount = store.elements.size || Object.keys(store.elements).length;
  console.log('Elements before:', beforeCount);
  
  // Add element
  store.addElement(testElement);
  
  // Verify addition after next tick
  setTimeout(() => {
    const afterCount = store.elements.size || Object.keys(store.elements).length;
    const addedElement = store.elements.get ? 
      store.elements.get(testElement.id) : 
      store.elements[testElement.id];
    
    console.log('📦 Element addition result:', {
      beforeCount,
      afterCount,
      elementExists: !!addedElement,
      elementDetails: addedElement
    });
    
    if (!addedElement) {
      console.error('🚨 Element was not added to store!');
    } else {
      console.log('✅ Element successfully added to store');
    }
  }, 100);
}

// 3. Canvas Click Event Verification
function debugCanvasClick() {
  console.log('\n=== 🖱️ CANVAS CLICK DEBUG ===');
  
  // Find the canvas stage
  const canvasContainer = document.querySelector('#canvas-container');
  const konvaCanvas = document.querySelector('canvas');
  
  if (!konvaCanvas) {
    console.error('❌ Canvas element not found');
    return;
  }
  
  console.log('✅ Canvas found:', konvaCanvas);
  
  // Add temporary click listener
  const debugClickHandler = (e) => {
    console.log('🖱️ Canvas clicked!', {
      tool: window.__CANVAS_STORE__?.selectedTool,
      position: { x: e.offsetX, y: e.offsetY },
      target: e.target.tagName,
      timestamp: Date.now()
    });
  };
  
  konvaCanvas.addEventListener('click', debugClickHandler);
  
  console.log('🖱️ Temporary click listener added');
  console.log('   Click anywhere on the canvas to test event handling');
  
  // Remove listener after 30 seconds
  setTimeout(() => {
    konvaCanvas.removeEventListener('click', debugClickHandler);
    console.log('🖱️ Debug click listener removed');
  }, 30000);
}

// 4. Store Consistency Check
function debugStoreConsistency() {
  console.log('\n=== 🏪 STORE CONSISTENCY DEBUG ===');
  
  const store = window.__CANVAS_STORE__;
  if (!store) {
    console.error('❌ Store not available');
    return;
  }
  
  console.log('🏪 Store consistency check:', {
    hasElements: !!store.elements,
    hasAddElement: typeof store.addElement === 'function',
    hasSetSelectedTool: typeof store.setSelectedTool === 'function',
    currentTool: store.selectedTool,
    elementCount: store.elements?.size || Object.keys(store.elements || {}).length
  });
  
  // Test store methods
  const methods = ['addElement', 'setSelectedTool', 'updateElement', 'deleteElement'];
  methods.forEach(method => {
    const exists = typeof store[method] === 'function';
    console.log(`  ${exists ? '✅' : '❌'} ${method}: ${exists ? 'available' : 'missing'}`);
  });
}

// 5. Coordinate System Validation
function debugCoordinateSystem() {
  console.log('\n=== 📐 COORDINATE SYSTEM DEBUG ===');
  
  const store = window.__CANVAS_STORE__;
  if (!store) {
    console.error('❌ Store not available');
    return;
  }
  
  // Check viewport state
  const viewport = store.viewport || { x: 0, y: 0, scale: 1 };
  console.log('📐 Viewport state:', viewport);
  
  // Test coordinate validation
  const testCoordinates = [
    { x: 100, y: 100, desc: 'Normal coordinates' },
    { x: -50, y: -50, desc: 'Negative coordinates' },
    { x: 5000, y: 5000, desc: 'Large coordinates' },
    { x: NaN, y: 100, desc: 'Invalid X coordinate' },
    { x: 100, y: NaN, desc: 'Invalid Y coordinate' }
  ];
  
  testCoordinates.forEach(coord => {
    const isValid = !isNaN(coord.x) && !isNaN(coord.y) && 
                   Math.abs(coord.x) < 10000 && Math.abs(coord.y) < 10000;
    console.log(`  ${isValid ? '✅' : '❌'} ${coord.desc}: (${coord.x}, ${coord.y})`);
  });
}

// Export debug functions
window.debugElementCreation = {
  debugToolSelection,
  debugElementAddition,
  debugCanvasClick,
  debugStoreConsistency,
  debugCoordinateSystem,
  
  // Run all tests
  runAllTests: () => {
    console.log('🚀 Running comprehensive element creation debug...');
    debugStoreConsistency();
    debugCoordinateSystem();
    debugToolSelection();
    setTimeout(() => debugElementAddition(), 3000);
    setTimeout(() => debugCanvasClick(), 4000);
  },
  
  // Quick test for immediate issues
  quickTest: () => {
    console.log('⚡ Quick element creation test...');
    const store = window.__CANVAS_STORE__;
    
    if (!store) {
      console.error('❌ Store not available');
      return;
    }
    
    console.log('Current state:', {
      tool: store.selectedTool,
      elementCount: store.elements?.size || Object.keys(store.elements || {}).length,
      hasAddElement: typeof store.addElement === 'function'
    });
    
    // Try adding element immediately
    if (store.addElement) {
      debugElementAddition();
    }
  }
};

// Auto-run quick test
console.log('🛠️ Element creation debug tools loaded');
console.log('Available functions:');
console.log('- window.debugElementCreation.runAllTests()');
console.log('- window.debugElementCreation.quickTest()');
console.log('- window.debugElementCreation.debugCanvasClick()');

// Run quick test automatically
setTimeout(() => {
  window.debugElementCreation.quickTest();
}, 1000);