// Test script to verify tool integration
// Run this in the browser console on the canvas page

console.log('=== Canvas Tool Integration Test ===');

// 1. Check if store exists
const store = window.useUnifiedCanvasStore?.getState();
if (!store) {
  console.error('❌ Store not found');
} else {
  console.log('✅ Store found');
  
  // 2. Check current elements
  console.log('Current elements:', store.elements.size);
  
  // 3. Get tool system
  const getToolSystem = window.getToolSystem || window.__getToolSystem;
  if (getToolSystem) {
    const toolSystem = getToolSystem();
    console.log('✅ Tool system found');
    console.log('Active tool:', toolSystem.registry?.getActiveTool()?.id);
  } else {
    console.warn('⚠️ Tool system not exposed to window');
  }
  
  // 4. Try to create an element directly
  console.log('\n--- Testing direct element creation ---');
  const testElement = {
    id: 'test-' + Date.now(),
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2,
    rotation: 0,
    isLocked: false,
    isHidden: false,
    zIndex: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  console.log('Adding test element:', testElement);
  store.addElement(testElement);
  
  // 5. Check if element was added
  setTimeout(() => {
    const newSize = store.elements.size;
    console.log('Elements after add:', newSize);
    if (store.elements.has(testElement.id)) {
      console.log('✅ Element added to store successfully');
      console.log('Element:', store.elements.get(testElement.id));
    } else {
      console.error('❌ Element not found in store');
    }
  }, 100);
  
  // 6. Test tool activation
  console.log('\n--- Testing tool activation ---');
  if (store.setSelectedTool) {
    console.log('Activating rectangle tool...');
    store.setSelectedTool('draw-rectangle');
    console.log('Selected tool:', store.selectedTool);
  }
}