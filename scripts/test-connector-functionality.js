/**
 * Test Script for Connector Functionality
 * Run this in browser console to test connector selection and interaction
 */

function testConnectorFunctionality() {
  console.log('🔗 Testing Connector Functionality...');
  
  // Check if the store is available
  if (typeof window !== 'undefined' && window.useUnifiedCanvasStore) {
    const store = window.useUnifiedCanvasStore.getState();
    
    console.log('📋 Store Status:');
    console.log('- Elements count:', store.elements.size);
    console.log('- Selected elements:', Array.from(store.selectedElementIds));
    console.log('- Selected tool:', store.selectedTool);
    
    // Check for connectors
    const connectors = [];
    store.elements.forEach((element, id) => {
      if (element.type === 'connector') {
        connectors.push({ id, element });
      }
    });
    
    console.log('🔗 Connectors found:', connectors.length);
    connectors.forEach((conn, index) => {
      console.log(`  ${index + 1}. ID: ${conn.id}, Type: ${conn.element.subType}`);
      console.log(`     Start: (${conn.element.startPoint.x}, ${conn.element.startPoint.y})`);
      console.log(`     End: (${conn.element.endPoint.x}, ${conn.element.endPoint.y})`);
    });
    
    // Test selection
    if (connectors.length > 0) {
      const firstConnector = connectors[0];
      console.log(`🎯 Testing selection of connector: ${firstConnector.id}`);
      
      try {
        store.selectElement(firstConnector.id);
        const isSelected = store.selectedElementIds.has(firstConnector.id);
        console.log(`✅ Selection test result: ${isSelected ? 'SUCCESS' : 'FAILED'}`);
        
        if (isSelected) {
          console.log('🎉 Connector selection is working!');
          console.log('📝 You should now see:');
          console.log('   - Blue endpoint handles on the connector');
          console.log('   - Blue dashed selection outline');
          console.log('   - Ability to drag endpoint handles to resize');
          console.log('   - Ability to drag the connector body to move');
        }
      } catch (error) {
        console.error('❌ Selection test failed:', error);
      }
    } else {
      console.log('ℹ️ No connectors found. Create a connector first:');
      console.log('   1. Select Line or Arrow tool from toolbar');
      console.log('   2. Click and drag on canvas to create connector');
      console.log('   3. Run this test again');
    }
    
    // Test connector creation
    console.log('🛠️ Testing connector creation...');
    try {
      const testConnector = {
        id: 'test-connector-' + Date.now(),
        type: 'connector',
        subType: 'line',
        x: 0,
        y: 0,
        startPoint: { x: 100, y: 100 },
        endPoint: { x: 200, y: 150 },
        connectorStyle: {
          strokeColor: '#333',
          strokeWidth: 2,
          startArrow: 'none',
          endArrow: 'none'
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      store.addElement(testConnector);
      console.log('✅ Test connector created successfully');
      console.log('🎯 Now testing selection...');
      
      setTimeout(() => {
        store.selectElement(testConnector.id);
        const isSelected = store.selectedElementIds.has(testConnector.id);
        console.log(`✅ Test connector selection: ${isSelected ? 'SUCCESS' : 'FAILED'}`);
      }, 100);
      
    } catch (error) {
      console.error('❌ Connector creation test failed:', error);
    }
    
  } else {
    console.error('❌ Store not found. Make sure you\'re on the canvas page.');
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🔗 Connector Functionality Test Script Loaded');
  console.log('Run testConnectorFunctionality() to start testing');
  window.testConnectorFunctionality = testConnectorFunctionality;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testConnectorFunctionality };
} 