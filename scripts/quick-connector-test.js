// Quick connector test - run this in browser console on canvas page
function quickConnectorTest() {
  console.log('🔗 Quick Connector Test');
  
  if (!window.useUnifiedCanvasStore) {
    console.error('❌ Store not found');
    return;
  }
  
  const store = window.useUnifiedCanvasStore.getState();
  console.log('📋 Elements:', store.elements.size);
  
  // Test connector creation
  const testConnector = {
    id: 'test-' + Date.now(),
    type: 'connector',
    subType: 'arrow',
    startPoint: { x: 100, y: 100 },
    endPoint: { x: 200, y: 150 },
    intermediatePoints: [],
    connectorStyle: {
      strokeColor: '#333',
      strokeWidth: 2,
      endArrow: 'solid'
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  try {
    store.addElement(testConnector);
    console.log('✅ Connector added');
    
    // Test selection
    setTimeout(() => {
      store.selectElement(testConnector.id);
      const selected = store.selectedElementIds.has(testConnector.id);
      console.log(selected ? '✅ Selection works' : '❌ Selection failed');
    }, 100);
    
  } catch (e) {
    console.error('❌ Test failed:', e);
  }
}

if (typeof window !== 'undefined') {
  window.quickConnectorTest = quickConnectorTest;
  console.log('Run: quickConnectorTest()');
} 