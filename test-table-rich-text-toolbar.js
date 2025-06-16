// Comprehensive diagnostic script for LibreOllama table rich text editing
// Run this in browser console to test and validate toolbar positioning

console.log('🧪 [TABLE RICH TEXT DIAGNOSTIC] Starting comprehensive test...');

function runTableRichTextDiagnostic() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      browser: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scroll: { x: window.pageXOffset, y: window.pageYOffset }
    },
    tests: []
  };

  // Test 1: Konva Stage Detection
  console.log('🔍 [TEST 1] Konva Stage Detection');
  const test1 = {
    name: 'Stage Detection',
    status: 'running',
    details: {}
  };

  const canvasContainer = document.querySelector('.konva-canvas-container');
  const canvas = document.querySelector('.konva-canvas-container canvas');
  
  if (!canvasContainer) {
    test1.status = 'failed';
    test1.details.error = 'Canvas container not found';
  } else if (!canvas) {
    test1.status = 'failed';
    test1.details.error = 'Canvas element not found';
  } else {
    // Test multiple stage detection methods
    const stageDetectionMethods = {
      '__konvaStage': (canvas as any).__konvaStage,
      'stage': (canvas as any).stage,
      '_konvaStage': (canvas as any)._konvaStage
    };
    
    test1.details.stageDetectionMethods = stageDetectionMethods;
    
    const foundStage = Object.values(stageDetectionMethods).find(s => s != null);
    if (foundStage) {
      test1.status = 'passed';
      test1.details.stageFound = true;
      test1.details.stageInfo = {
        width: foundStage.width(),
        height: foundStage.height(),
        scaleX: foundStage.scaleX(),
        scaleY: foundStage.scaleY(),
        x: foundStage.x(),
        y: foundStage.y()
      };
    } else {
      test1.status = 'failed';
      test1.details.error = 'No stage found with any detection method';
    }
  }
  
  results.tests.push(test1);

  // Test 2: Table Element Detection
  console.log('🔍 [TEST 2] Table Element Detection');
  const test2 = {
    name: 'Table Element Detection',
    status: 'running',
    details: {}
  };

  const tableElements = document.querySelectorAll('[id*="table"]');
  const enhancedTables = Array.from(tableElements).filter(el => 
    el.id.includes('EnhancedTable') || el.closest('.konva-canvas-container')
  );

  test2.details.tableElementsFound = tableElements.length;
  test2.details.enhancedTablesFound = enhancedTables.length;
  
  if (enhancedTables.length > 0) {
    test2.status = 'passed';
    test2.details.tableIds = Array.from(enhancedTables).map(el => el.id);
  } else {
    test2.status = 'warning';
    test2.details.message = 'No table elements found - create a table to test cell editing';
  }

  results.tests.push(test2);

  // Test 3: Rich Text Editor Components
  console.log('🔍 [TEST 3] Rich Text Editor Components');
  const test3 = {
    name: 'Rich Text Editor Components',
    status: 'running',
    details: {}
  };

  const richTextEditor = document.querySelector('[data-testid="rich-text-cell-editor"]');
  const floatingToolbar = document.querySelector('[data-floating-toolbar="true"]');
  const tableEditor = document.querySelector('[data-table-cell-editor="true"]');

  test3.details.components = {
    richTextEditor: !!richTextEditor,
    floatingToolbar: !!floatingToolbar,
    tableEditor: !!tableEditor
  };

  if (floatingToolbar) {
    const toolbarRect = floatingToolbar.getBoundingClientRect();
    test3.details.toolbarPosition = {
      x: toolbarRect.left,
      y: toolbarRect.top,
      width: toolbarRect.width,
      height: toolbarRect.height,
      visible: toolbarRect.width > 0 && toolbarRect.height > 0
    };
  }

  test3.status = 'passed';
  results.tests.push(test3);

  // Test 4: Coordinate System Validation
  console.log('🔍 [TEST 4] Coordinate System Validation');
  const test4 = {
    name: 'Coordinate System Validation',
    status: 'running',
    details: {}
  };

  if (canvas && (canvas as any).__konvaStage) {
    const stage = (canvas as any).__konvaStage;
    const stageContainer = stage.container();
    const stageBox = stageContainer.getBoundingClientRect();
    const stageTransform = stage.getAbsoluteTransform();
    
    // Test coordinate conversion with known points
    const testPoints = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: stage.width() / 2, y: stage.height() / 2 }
    ];
    
    test4.details.coordinateTests = testPoints.map(point => {
      const screenPos = stageTransform.point(point);
      return {
        canvasPoint: point,
        screenPoint: screenPos,
        absoluteScreenPoint: {
          x: stageBox.left + screenPos.x,
          y: stageBox.top + screenPos.y
        }
      };
    });
    
    test4.details.stageBox = {
      left: stageBox.left,
      top: stageBox.top,
      width: stageBox.width,
      height: stageBox.height
    };
    
    test4.status = 'passed';
  } else {
    test4.status = 'failed';
    test4.details.error = 'Cannot test coordinates without stage';
  }

  results.tests.push(test4);

  // Test 5: Event Handler Validation
  console.log('🔍 [TEST 5] Event Handler Validation');
  const test5 = {
    name: 'Event Handler Validation',
    status: 'running',
    details: {}
  };

  // Test if React handlers are properly attached
  const hasReactHandlers = canvas && Object.keys(canvas).some(key => 
    key.startsWith('__reactInternalInstance') || key.startsWith('_reactInternalFiber')
  );

  test5.details.hasReactHandlers = hasReactHandlers;
  test5.details.canvasEventListeners = canvas ? canvas.getEventListeners?.() || 'getEventListeners not available' : 'No canvas';
  
  test5.status = 'passed';
  results.tests.push(test5);

  // Output results
  console.log('📊 [DIAGNOSTIC RESULTS]', results);
  
  const passed = results.tests.filter(t => t.status === 'passed').length;
  const failed = results.tests.filter(t => t.status === 'failed').length;
  const warnings = results.tests.filter(t => t.status === 'warning').length;
  
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed} | ⚠️ Warnings: ${warnings}`);
  
  if (failed > 0) {
    console.log('❌ [CRITICAL ISSUES FOUND]');
    results.tests.filter(t => t.status === 'failed').forEach(test => {
      console.log(`   - ${test.name}: ${test.details.error || 'Unknown error'}`);
    });
  }
  
  if (warnings > 0) {
    console.log('⚠️ [WARNINGS]');
    results.tests.filter(t => t.status === 'warning').forEach(test => {
      console.log(`   - ${test.name}: ${test.details.message || 'Check required'}`);
    });
  }

  return results;
}

// Test table cell editing flow specifically
function testTableCellEditing() {
  console.log('🎯 [TABLE CELL EDITING TEST] Simulating table cell double-click...');
  
  const tableCell = document.querySelector('[id*="cell"]');
  if (!tableCell) {
    console.log('❌ No table cells found. Create a table first.');
    return;
  }
  
  console.log('✅ Found table cell:', tableCell.id);
  
  // Simulate double-click
  const doubleClickEvent = new MouseEvent('dblclick', {
    bubbles: true,
    cancelable: true,
    clientX: 100,
    clientY: 100
  });
  
  tableCell.dispatchEvent(doubleClickEvent);
  
  // Check if editing started
  setTimeout(() => {
    const editor = document.querySelector('[data-testid="rich-text-cell-editor"]');
    const toolbar = document.querySelector('[data-floating-toolbar="true"]');
    
    console.log('📝 Editor appeared:', !!editor);
    console.log('🛠️ Toolbar appeared:', !!toolbar);
    
    if (toolbar) {
      const rect = toolbar.getBoundingClientRect();
      console.log('🎯 Toolbar position:', {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0
      });
    }
  }, 100);
}

// Run diagnostics
const diagnosticResults = runTableRichTextDiagnostic();

// Provide instructions for manual testing
console.log(`
🎯 [MANUAL TESTING INSTRUCTIONS]

1. Create a table using the table tool
2. Double-click any table cell
3. Check if the floating toolbar appears above the cell
4. Test formatting buttons (Bold, Italic, etc.)
5. Type text and verify formatting is applied
6. Press Enter or click outside to save

If toolbar doesn't appear, run: testTableCellEditing()
`);

// Export for further analysis
window.libreOllamaTableDiagnostic = {
  runDiagnostic: runTableRichTextDiagnostic,
  testCellEditing: testTableCellEditing,
  lastResults: diagnosticResults
};

console.log('🧪 [DIAGNOSTIC COMPLETE] Results available in window.libreOllamaTableDiagnostic');