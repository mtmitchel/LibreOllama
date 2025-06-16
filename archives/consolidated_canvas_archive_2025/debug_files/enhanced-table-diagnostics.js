// Enhanced Table Diagnostics Script
// Run this in the browser console to validate table functionality

console.log('🔍 Enhanced Table Diagnostics Starting...');

// Check if dev server is running
if (!window.location.href.includes('localhost')) {
  console.warn('⚠️ Not running on localhost - make sure dev server is active');
}

// 1. Check if Enhanced Table component is loaded
const checkEnhancedTableComponent = () => {
  console.log('\n📊 Checking Enhanced Table Component...');
  
  // Look for table elements in the DOM
  const tables = document.querySelectorAll('[id*="table"]');
  console.log(`Found ${tables.length} table elements:`, tables);
  
  // Check for Konva stage
  const stage = document.querySelector('canvas');
  if (stage) {
    console.log('✅ Konva canvas found');
  } else {
    console.log('❌ Konva canvas not found');
  }
  
  return tables.length > 0;
};

// 2. Check store functions availability
const checkStoreFunctions = () => {
  console.log('\n🏪 Checking Store Functions...');
  
  try {
    // Try to access the store through window (if exposed) or React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React DevTools available');
    }
    
    // Check if we can find the store in the React fiber tree
    const reactFiber = document.querySelector('#root')?._reactInternalFiber ||
                      document.querySelector('#root')?._reactInternals;
    
    if (reactFiber) {
      console.log('✅ React fiber tree accessible');
    } else {
      console.log('❌ Cannot access React fiber tree');
    }
    
  } catch (error) {
    console.log('❌ Error checking store:', error.message);
  }
};

// 3. Test table creation functionality
const testTableCreation = () => {
  console.log('\n📋 Testing Table Creation...');
  
  // Check if table tool is available in toolbar
  const tableButton = document.querySelector('[data-tool="table"], button[title*="table"], button[title*="Table"]');
  if (tableButton) {
    console.log('✅ Table tool button found:', tableButton);
  } else {
    console.log('❌ Table tool button not found');
  }
  
  // Check for any existing tables on canvas
  const canvasRect = document.querySelector('canvas')?.getBoundingClientRect();
  if (canvasRect) {
    console.log('✅ Canvas bounds:', {
      width: canvasRect.width,
      height: canvasRect.height,
      x: canvasRect.x,
      y: canvasRect.y
    });
  }
};

// 4. Test handle visibility and interaction
const testHandleInteraction = () => {
  console.log('\n🎯 Testing Handle Interaction...');
  
  // Look for any resize handles or table controls
  const handles = document.querySelectorAll('[class*="handle"], [class*="resize"], circle[fill*="primary"]');
  console.log(`Found ${handles.length} potential handles:`, handles);
  
  // Check for mouse event listeners
  const canvas = document.querySelector('canvas');
  if (canvas) {
    const events = getEventListeners ? getEventListeners(canvas) : 'getEventListeners not available';
    console.log('Canvas event listeners:', events);
  }
};

// 5. Test cell editing functionality
const testCellEditing = () => {
  console.log('\n✏️ Testing Cell Editing...');
  
  // Look for any active text editors
  const editors = document.querySelectorAll('textarea[data-testid="table-cell-editor"]');
  console.log(`Found ${editors.length} active cell editors:`, editors);
  
  // Check for text editing overlays
  const overlays = document.querySelectorAll('[style*="position: absolute"][style*="z-index"]');
  console.log(`Found ${overlays.length} potential overlay elements:`, overlays);
};

// 6. Test TypeScript compilation status
const checkTypeScriptErrors = () => {
  console.log('\n🔧 Checking TypeScript Status...');
  
  // Look for any TypeScript error indicators in the dev tools
  const errors = document.querySelectorAll('[class*="error"], [class*="Error"]');
  console.log(`Found ${errors.length} potential error elements:`, errors);
  
  // Check console for TypeScript errors
  const consoleErrors = console.error.toString().includes('TypeScript') ||
                       console.warn.toString().includes('TypeScript');
  console.log('TypeScript-related console methods detected:', consoleErrors);
};

// 7. Test performance and rendering
const testPerformance = () => {
  console.log('\n⚡ Testing Performance...');
  
  // Check frame rate if available
  if (window.performance && window.performance.now) {
    console.log('✅ Performance API available');
    
    // Measure a simple operation
    const start = performance.now();
    document.querySelector('canvas')?.getBoundingClientRect();
    const end = performance.now();
    console.log(`Canvas bounds calculation took ${end - start}ms`);
  }
  
  // Check memory usage if available
  if (window.performance && window.performance.memory) {
    console.log('Memory usage:', {
      used: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    });
  }
};

// Run all diagnostics
const runDiagnostics = () => {
  console.log('🚀 Running Enhanced Table Diagnostics...\n');
  
  const hasTable = checkEnhancedTableComponent();
  checkStoreFunctions();
  testTableCreation();
  testHandleInteraction();
  testCellEditing();
  checkTypeScriptErrors();
  testPerformance();
  
  console.log('\n📋 Diagnostic Summary:');
  console.log('- Table component present:', hasTable ? '✅' : '❌');
  console.log('- Canvas available:', document.querySelector('canvas') ? '✅' : '❌');
  console.log('- React available:', typeof React !== 'undefined' ? '✅' : '❌');
  
  console.log('\n💡 Next Steps:');
  console.log('1. Try creating a table using the table tool');
  console.log('2. Select a table to see resize handles');
  console.log('3. Double-click a cell to test editing');
  console.log('4. Check browser console for any errors');
  
  return {
    hasTable,
    hasCanvas: !!document.querySelector('canvas'),
    timestamp: new Date().toISOString()
  };
};

// Auto-run diagnostics
const result = runDiagnostics();

// Export result for further analysis
window.tableDebugResult = result;

console.log('\n🔍 Diagnostics complete! Results saved to window.tableDebugResult');