/**
 * Debug Tool Selection - Test if store is updating correctly
 * 
 * Run this in the browser console when the canvas page is loaded
 * to verify that tool selection is working properly.
 */

console.log('🔧 Testing Tool Selection...');

// Function to test tool selection and state updates
function testToolSelection() {
  const store = window.__CANVAS_STORE__;
  
  if (!store) {
    console.error('❌ Canvas store not available on window.__CANVAS_STORE__');
    return;
  }
  
  console.log('📊 Initial Store State:');
  console.log('- selectedTool:', store.selectedTool);
  console.log('- isDrawing:', store.isDrawing);
  console.log('- isDrawingSection:', store.isDrawingSection);
  
  const testTools = ['select', 'text', 'pen', 'section', 'sticky-note'];
  
  testTools.forEach((tool, index) => {
    setTimeout(() => {
      console.log(`\n🔧 Testing tool: ${tool}`);
      
      // Select the tool
      store.setSelectedTool(tool);
      
      // Check the state after selection
      setTimeout(() => {
        const currentState = window.__CANVAS_STORE__;
        console.log(`✅ Tool ${tool} selected:`);
        console.log('  - selectedTool:', currentState.selectedTool);
        console.log('  - isDrawing:', currentState.isDrawing);
        console.log('  - isDrawingSection:', currentState.isDrawingSection);
        console.log('  - drawingTool:', currentState.drawingTool);
        
        // Verify the tool actually changed
        if (currentState.selectedTool === tool) {
          console.log(`  ✅ Tool selection successful: ${tool}`);
        } else {
          console.log(`  ❌ Tool selection failed: expected ${tool}, got ${currentState.selectedTool}`);
        }
      }, 100);
      
    }, index * 1000); // Space out tests by 1 second each
  });
}

// Function to test drawing state transitions
function testDrawingStateTransitions() {
  const store = window.__CANVAS_STORE__;
  
  if (!store) {
    console.error('❌ Canvas store not available');
    return;
  }
  
  console.log('\n🎨 Testing Drawing State Transitions...');
  
  // Test pen tool drawing
  console.log('🖊️ Testing pen tool drawing state:');
  store.setSelectedTool('pen');
  console.log('  - Selected tool set to pen');
  
  if (store.startDrawing) {
    store.startDrawing('pen', [100, 100]);
    console.log('  - Started drawing');
    console.log('  - isDrawing:', store.isDrawing);
    console.log('  - drawingTool:', store.drawingTool);
    
    setTimeout(() => {
      if (store.endDrawing) {
        store.endDrawing();
        console.log('  - Ended drawing');
        console.log('  - isDrawing:', store.isDrawing);
      }
    }, 500);
  }
  
  // Test section tool
  setTimeout(() => {
    console.log('\n📦 Testing section tool drawing state:');
    store.setSelectedTool('section');
    console.log('  - Selected tool set to section');
    console.log('  - isDrawingSection:', store.isDrawingSection);
    
    if (store.startDrawing) {
      store.startDrawing('section', [200, 200]);
      console.log('  - Started section drawing');
      console.log('  - isDrawing:', store.isDrawing);
      console.log('  - isDrawingSection:', store.isDrawingSection);
      console.log('  - drawingTool:', store.drawingTool);
      
      setTimeout(() => {
        if (store.endDrawing) {
          store.endDrawing();
          console.log('  - Ended section drawing');
          console.log('  - isDrawing:', store.isDrawing);
          console.log('  - isDrawingSection:', store.isDrawingSection);
        }
      }, 500);
    }
  }, 2000);
}

// Export test functions for manual use
window.debugToolSelection = {
  testToolSelection,
  testDrawingStateTransitions,
  
  getCurrentState: () => {
    const store = window.__CANVAS_STORE__;
    return {
      selectedTool: store?.selectedTool,
      isDrawing: store?.isDrawing,
      isDrawingSection: store?.isDrawingSection,
      drawingTool: store?.drawingTool,
      drawingStartPoint: store?.drawingStartPoint,
      currentPath: store?.currentPath
    };
  },
  
  selectTool: (tool) => {
    const store = window.__CANVAS_STORE__;
    if (store) {
      console.log(`🔧 Manually selecting tool: ${tool}`);
      store.setSelectedTool(tool);
      setTimeout(() => {
        console.log('State after tool selection:', window.debugToolSelection.getCurrentState());
      }, 100);
    }
  }
};

// Run initial test
console.log('🚀 Starting tool selection test...');
setTimeout(testToolSelection, 1000);

console.log('🛠️ Debug functions available:');
console.log('- window.debugToolSelection.testToolSelection()');
console.log('- window.debugToolSelection.testDrawingStateTransitions()');
console.log('- window.debugToolSelection.getCurrentState()');
console.log('- window.debugToolSelection.selectTool("pen")');