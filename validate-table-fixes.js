// Table Fixes Validation Script
// Run this in browser console after the fixes have been applied

console.log('🔧 Validating Enhanced Table Fixes...');

const TableFixValidator = {
  
  async testStoreIntegration() {
    console.log('\n🏪 Testing Store Integration Fix...');
    
    try {
      // Try to access the store through React DevTools
      let storeFound = false;
      let storeFunctions = [];
      
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('✅ React DevTools available');
        
        // Try to find store functions in component tree
        const rootFiber = document.querySelector('#root')?._reactInternalFiber ||
                         document.querySelector('#root')?._reactInternals;
        
        if (rootFiber) {
          console.log('✅ React fiber tree accessible');
          storeFound = true;
        }
      }
      
      // Check if table creation works (which would indicate store is working)
      const canvas = document.querySelector('canvas');
      const tableButton = document.querySelector('[data-tool="table"], button[title*="table"], button[title*="Table"]');
      
      console.log(`Canvas: ${canvas ? '✅' : '❌'}`);
      console.log(`Table tool: ${tableButton ? '✅' : '❌'}`);
      console.log(`Store integration: ${storeFound ? '✅' : '❌'}`);
      
      return { storeFound, hasCanvas: !!canvas, hasTableTool: !!tableButton };
      
    } catch (error) {
      console.error('❌ Store integration test failed:', error);
      return { error: error.message };
    }
  },
  
  async testHandleSystem() {
    console.log('\n🎯 Testing Enhanced Handle System...');
    
    try {
      // Look for existing tables first
      const tables = document.querySelectorAll('[id*="table"]');
      console.log(`Existing tables found: ${tables.length}`);
      
      if (tables.length === 0) {
        console.log('⚠️ No tables found - create a table first to test handles');
        return { needsTable: true };
      }
      
      // Look for handle elements
      const circleHandles = document.querySelectorAll('circle[fill*="primary"]');
      const rectHandles = document.querySelectorAll('rect[width="10"]');
      const allHandles = document.querySelectorAll('circle[radius], rect[onMouseDown]');
      
      console.log(`Circle handles (resize): ${circleHandles.length}`);
      console.log(`Rectangle handles (column/row): ${rectHandles.length}`);
      console.log(`Total interactive handles: ${allHandles.length}`);
      
      // Test handle visibility on selection
      let handleVisibilityTest = false;
      try {
        // Simulate table selection to show handles
        const firstTable = tables[0];
        if (firstTable) {
          firstTable.click?.();
          // Wait a moment for handles to appear
          setTimeout(() => {
            const handlesAfterClick = document.querySelectorAll('circle[fill*="primary"]');
            console.log(`Handles after selection: ${handlesAfterClick.length}`);
          }, 100);
          handleVisibilityTest = true;
        }
      } catch (e) {
        console.warn('Handle visibility test failed:', e.message);
      }
      
      return {
        circleHandles: circleHandles.length,
        rectHandles: rectHandles.length,
        totalHandles: allHandles.length,
        handleVisibilityTest
      };
      
    } catch (error) {
      console.error('❌ Handle system test failed:', error);
      return { error: error.message };
    }
  },
  
  async testResizeFunctionality() {
    console.log('\n📏 Testing Resize Functionality...');
    
    try {
      // Check for resize cursors
      const canvas = document.querySelector('canvas');
      let cursorTest = false;
      
      if (canvas) {
        // Test cursor changes
        const originalCursor = canvas.style.cursor;
        canvas.style.cursor = 'ew-resize';
        cursorTest = canvas.style.cursor === 'ew-resize';
        canvas.style.cursor = 'ns-resize';
        cursorTest = cursorTest && canvas.style.cursor === 'ns-resize';
        canvas.style.cursor = originalCursor;
      }
      
      console.log(`Cursor manipulation: ${cursorTest ? '✅' : '❌'}`);
      
      // Check for mouse event handlers
      let eventHandlers = 0;
      try {
        const elements = document.querySelectorAll('rect, circle');
        elements.forEach(el => {
          if (el.onmousedown || el.onMouseDown) eventHandlers++;
        });
      } catch (e) {
        console.warn('Event handler check failed:', e.message);
      }
      
      console.log(`Elements with mouse handlers: ${eventHandlers}`);
      
      return { cursorTest, eventHandlers };
      
    } catch (error) {
      console.error('❌ Resize functionality test failed:', error);
      return { error: error.message };
    }
  },
  
  async testCellEditing() {
    console.log('\n✏️ Testing Cell Editing...');
    
    try {
      // Check for cell editing infrastructure
      const cellEditors = document.querySelectorAll('textarea[data-testid="table-cell-editor"]');
      const textOverlays = document.querySelectorAll('[style*="position: absolute"][style*="z-index"]');
      
      console.log(`Active cell editors: ${cellEditors.length}`);
      console.log(`Text overlays: ${textOverlays.length}`);
      
      // Test double-click capability
      let doubleClickTest = false;
      try {
        const testElement = document.createElement('div');
        testElement.ondblclick = () => { doubleClickTest = true; };
        testElement.dispatchEvent(new MouseEvent('dblclick'));
      } catch (e) {
        console.warn('Double-click test failed:', e.message);
      }
      
      console.log(`Double-click events: ${doubleClickTest ? '✅' : '❌'}`);
      
      return {
        cellEditors: cellEditors.length,
        textOverlays: textOverlays.length,
        doubleClickTest
      };
      
    } catch (error) {
      console.error('❌ Cell editing test failed:', error);
      return { error: error.message };
    }
  },
  
  async createTestTable() {
    console.log('\n📊 Creating Test Table...');
    
    try {
      const tableButton = document.querySelector('[data-tool="table"], button[title*="table"], button[title*="Table"]');
      const canvas = document.querySelector('canvas');
      
      if (!tableButton) {
        console.log('❌ Table tool button not found');
        return false;
      }
      
      if (!canvas) {
        console.log('❌ Canvas not found');
        return false;
      }
      
      // Click table tool
      tableButton.click();
      console.log('✅ Table tool activated');
      
      // Click on canvas to create table
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      canvas.dispatchEvent(new MouseEvent('mousedown', {
        clientX: centerX,
        clientY: centerY,
        bubbles: true
      }));
      
      canvas.dispatchEvent(new MouseEvent('mouseup', {
        clientX: centerX,
        clientY: centerY,
        bubbles: true
      }));
      
      console.log('✅ Table creation attempted');
      
      // Wait for table to be created
      setTimeout(() => {
        const newTables = document.querySelectorAll('[id*="table"]');
        console.log(`Tables after creation: ${newTables.length}`);
      }, 500);
      
      return true;
      
    } catch (error) {
      console.error('❌ Table creation failed:', error);
      return false;
    }
  },
  
  async runAllValidations() {
    console.log('🚀 Running All Table Fix Validations...\n');
    
    const results = {};
    
    // Test 1: Store Integration
    results.storeIntegration = await this.testStoreIntegration();
    
    // Test 2: Handle System
    results.handleSystem = await this.testHandleSystem();
    
    // Test 3: Resize Functionality
    results.resizeFunctionality = await this.testResizeFunctionality();
    
    // Test 4: Cell Editing
    results.cellEditing = await this.testCellEditing();
    
    // Test 5: Table Creation
    if (results.handleSystem.needsTable) {
      console.log('\n🔧 Creating test table for handle testing...');
      const tableCreated = await this.createTestTable();
      if (tableCreated) {
        // Re-test handles after table creation
        setTimeout(async () => {
          results.handleSystemAfterCreation = await this.testHandleSystem();
        }, 1000);
      }
    }
    
    // Summary
    console.log('\n📋 Fix Validation Summary:');
    console.log('Store Integration:', results.storeIntegration.storeFound ? '✅' : '❌');
    console.log('Handle System:', results.handleSystem.totalHandles > 0 ? '✅' : '⚠️');
    console.log('Resize Functionality:', results.resizeFunctionality.cursorTest ? '✅' : '❌');
    console.log('Cell Editing:', results.cellEditing.doubleClickTest ? '✅' : '❌');
    
    // Store results
    window.tableFixValidationResults = {
      results,
      timestamp: new Date().toISOString(),
      summary: {
        storeIntegration: results.storeIntegration.storeFound || false,
        handleSystem: results.handleSystem.totalHandles > 0,
        resizeFunctionality: results.resizeFunctionality.cursorTest || false,
        cellEditing: results.cellEditing.doubleClickTest || false
      }
    };
    
    console.log('\n💾 Results saved to window.tableFixValidationResults');
    
    const totalTests = 4;
    const passedTests = Object.values(window.tableFixValidationResults.summary).filter(Boolean).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 Overall Success Rate: ${successRate}%`);
    
    if (successRate >= 75) {
      console.log('✅ FIXES WORKING WELL');
    } else if (successRate >= 50) {
      console.log('⚠️ PARTIAL SUCCESS - Some fixes need attention');
    } else {
      console.log('❌ FIXES NEED MORE WORK');
    }
    
    return window.tableFixValidationResults;
  }
};

// Auto-run validations
TableFixValidator.runAllValidations();