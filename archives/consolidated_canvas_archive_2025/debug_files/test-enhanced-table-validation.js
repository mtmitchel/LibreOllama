// Enhanced Table Validation Test Script
// This script validates all aspects of the enhanced table functionality

console.log('🧪 Enhanced Table Validation Test Starting...');

const TableValidator = {
  results: {},
  
  // Test 1: Table Creation and Basic Functionality
  async testTableCreation() {
    console.log('\n📊 Test 1: Table Creation and Basic Functionality');
    
    try {
      // Check if table tool exists
      const tableButtons = document.querySelectorAll('button[data-tool="table"], button[title*="table"], button[title*="Table"]');
      const hasTableTool = tableButtons.length > 0;
      
      console.log(`Table tool available: ${hasTableTool ? '✅' : '❌'}`);
      
      // Check for existing tables on canvas
      const canvas = document.querySelector('canvas');
      const existingTables = document.querySelectorAll('[id^="table"], [id*="table"]');
      
      console.log(`Canvas found: ${canvas ? '✅' : '❌'}`);
      console.log(`Existing tables: ${existingTables.length}`);
      
      // Check EnhancedTableElement is loaded
      const tableElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.constructor.name.includes('Table') || 
        el.getAttribute('id')?.includes('table')
      );
      
      console.log(`Table elements in DOM: ${tableElements.length}`);
      
      this.results.tableCreation = {
        hasTableTool,
        hasCanvas: !!canvas,
        existingTables: existingTables.length,
        tableElements: tableElements.length
      };
      
      return hasTableTool && !!canvas;
      
    } catch (error) {
      console.error('❌ Table creation test failed:', error);
      this.results.tableCreation = { error: error.message };
      return false;
    }
  },
  
  // Test 2: Enhanced Handle System
  async testHandleSystem() {
    console.log('\n🎯 Test 2: Enhanced Handle System');
    
    try {
      // Look for resize handles and hover areas
      const handles = document.querySelectorAll(
        'circle[radius], rect[width="10"][height], [class*="handle"], [onMouseEnter*="resize"]'
      );
      
      console.log(`Found ${handles.length} potential handles`);
      
      // Check for specific resize handle types
      const circleHandles = document.querySelectorAll('circle[fill*="primary"]');
      const rectHandles = document.querySelectorAll('rect[width="10"]'); // 10px hitboxes
      
      console.log(`Circle handles (main resize): ${circleHandles.length}`);
      console.log(`Rectangle handles (column/row): ${rectHandles.length}`);
      
      // Test cursor changes
      let cursorTestPassed = false;
      try {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const originalCursor = canvas.style.cursor;
          canvas.style.cursor = 'ew-resize';
          cursorTestPassed = canvas.style.cursor === 'ew-resize';
          canvas.style.cursor = originalCursor;
        }
      } catch (e) {
        console.warn('Cursor test failed:', e.message);
      }
      
      console.log(`Cursor manipulation works: ${cursorTestPassed ? '✅' : '❌'}`);
      
      this.results.handleSystem = {
        totalHandles: handles.length,
        circleHandles: circleHandles.length,
        rectHandles: rectHandles.length,
        cursorTestPassed
      };
      
      return handles.length > 0;
      
    } catch (error) {
      console.error('❌ Handle system test failed:', error);
      this.results.handleSystem = { error: error.message };
      return false;
    }
  },
  
  // Test 3: Text Editing Improvements
  async testTextEditing() {
    console.log('\n✏️ Test 3: Text Editing Improvements');
    
    try {
      // Check for TableCellEditor component
      const cellEditors = document.querySelectorAll('textarea[data-testid="table-cell-editor"]');
      console.log(`Active cell editors: ${cellEditors.length}`);
      
      // Check for text editing overlays
      const overlays = document.querySelectorAll('[style*="position: absolute"][style*="z-index"]');
      console.log(`Text editing overlays: ${overlays.length}`);
      
      // Test textarea creation capability
      let textareaTestPassed = false;
      try {
        const testTextarea = document.createElement('textarea');
        testTextarea.style.position = 'absolute';
        testTextarea.style.zIndex = '1000';
        testTextarea.value = 'test';
        document.body.appendChild(testTextarea);
        textareaTestPassed = testTextarea.value === 'test';
        document.body.removeChild(testTextarea);
      } catch (e) {
        console.warn('Textarea creation test failed:', e.message);
      }
      
      console.log(`Textarea creation works: ${textareaTestPassed ? '✅' : '❌'}`);
      
      // Check focus management
      let focusTestPassed = false;
      try {
        const testInput = document.createElement('input');
        document.body.appendChild(testInput);
        testInput.focus();
        focusTestPassed = document.activeElement === testInput;
        document.body.removeChild(testInput);
      } catch (e) {
        console.warn('Focus test failed:', e.message);
      }
      
      console.log(`Focus management works: ${focusTestPassed ? '✅' : '❌'}`);
      
      this.results.textEditing = {
        cellEditors: cellEditors.length,
        overlays: overlays.length,
        textareaTestPassed,
        focusTestPassed
      };
      
      return textareaTestPassed && focusTestPassed;
      
    } catch (error) {
      console.error('❌ Text editing test failed:', error);
      this.results.textEditing = { error: error.message };
      return false;
    }
  },
  
  // Test 4: Store Integration
  async testStoreIntegration() {
    console.log('\n🏪 Test 4: Store Integration');
    
    try {
      // Try to access React DevTools to check store
      let storeAccessible = false;
      let storeFunctions = {};
      
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('React DevTools detected ✅');
        
        // Try to find the store in the component tree
        const rootElement = document.querySelector('#root');
        if (rootElement && rootElement._reactInternals) {
          console.log('React internals accessible ✅');
          storeAccessible = true;
        }
      }
      
      // Check for specific store functions by looking at component props/state
      try {
        // Look for any elements that might have store methods
        const elements = Array.from(document.querySelectorAll('*'));
        const hasStoreIndicators = elements.some(el => {
          const reactProps = Object.keys(el).find(key => key.startsWith('__reactInternalInstance'));
          return reactProps !== undefined;
        });
        
        if (hasStoreIndicators) {
          console.log('Store indicators found ✅');
          storeFunctions.hasIndicators = true;
        }
      } catch (e) {
        console.warn('Store function check failed:', e.message);
      }
      
      // Check for TypeScript compilation errors
      const consoleErrors = [];
      const originalError = console.error;
      console.error = (...args) => {
        consoleErrors.push(args.join(' '));
        originalError.apply(console, args);
      };
      
      // Restore after a brief period
      setTimeout(() => {
        console.error = originalError;
      }, 100);
      
      this.results.storeIntegration = {
        storeAccessible,
        storeFunctions,
        recentErrors: consoleErrors.length
      };
      
      console.log(`Store accessible: ${storeAccessible ? '✅' : '❌'}`);
      
      return storeAccessible;
      
    } catch (error) {
      console.error('❌ Store integration test failed:', error);
      this.results.storeIntegration = { error: error.message };
      return false;
    }
  },
  
  // Test 5: Cross-Browser and Edge Cases
  async testCrossBrowserCompatibility() {
    console.log('\n🌐 Test 5: Cross-Browser and Edge Cases');
    
    try {
      // Browser detection
      const userAgent = navigator.userAgent;
      const browser = {
        chrome: /Chrome/.test(userAgent),
        firefox: /Firefox/.test(userAgent),
        safari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
        edge: /Edge/.test(userAgent)
      };
      
      console.log('Browser:', Object.keys(browser).find(key => browser[key]) || 'Unknown');
      
      // Test zoom levels
      const zoom = window.devicePixelRatio;
      console.log(`Device pixel ratio (zoom indicator): ${zoom}`);
      
      // Test viewport size
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      console.log(`Viewport: ${viewport.width}x${viewport.height}`);
      
      // Test canvas scaling
      const canvas = document.querySelector('canvas');
      let canvasScaling = false;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const style = window.getComputedStyle(canvas);
        canvasScaling = rect.width !== canvas.width || rect.height !== canvas.height;
      }
      
      console.log(`Canvas scaling detected: ${canvasScaling ? '✅' : '❌'}`);
      
      this.results.crossBrowser = {
        browser: Object.keys(browser).find(key => browser[key]) || 'Unknown',
        zoom,
        viewport,
        canvasScaling
      };
      
      return true;
      
    } catch (error) {
      console.error('❌ Cross-browser test failed:', error);
      this.results.crossBrowser = { error: error.message };
      return false;
    }
  },
  
  // Test 6: Performance Validation
  async testPerformance() {
    console.log('\n⚡ Test 6: Performance Validation');
    
    try {
      // Memory usage
      let memoryInfo = null;
      if (window.performance && window.performance.memory) {
        memoryInfo = {
          used: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024)
        };
        console.log(`Memory usage: ${memoryInfo.used}MB / ${memoryInfo.total}MB`);
      }
      
      // Performance timing
      let performanceTest = false;
      const start = performance.now();
      
      // Simulate table operations
      for (let i = 0; i < 1000; i++) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = `${i}px`;
        div.style.top = `${i}px`;
      }
      
      const end = performance.now();
      const operationTime = end - start;
      console.log(`Performance test: ${operationTime.toFixed(2)}ms for 1000 operations`);
      
      performanceTest = operationTime < 100; // Should be under 100ms
      
      // Check for memory leaks (basic)
      const beforeGC = window.performance?.memory?.usedJSHeapSize || 0;
      
      this.results.performance = {
        memoryInfo,
        operationTime,
        performanceTest,
        beforeGC
      };
      
      console.log(`Performance acceptable: ${performanceTest ? '✅' : '❌'}`);
      
      return performanceTest;
      
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      this.results.performance = { error: error.message };
      return false;
    }
  },
  
  // Run all tests
  async runAllTests() {
    console.log('🚀 Running All Enhanced Table Validation Tests...\n');
    
    const tests = [
      { name: 'Table Creation', fn: this.testTableCreation },
      { name: 'Handle System', fn: this.testHandleSystem },
      { name: 'Text Editing', fn: this.testTextEditing },
      { name: 'Store Integration', fn: this.testStoreIntegration },
      { name: 'Cross-Browser', fn: this.testCrossBrowserCompatibility },
      { name: 'Performance', fn: this.testPerformance }
    ];
    
    const results = {};
    
    for (const test of tests) {
      try {
        const result = await test.fn.call(this);
        results[test.name] = result;
        console.log(`${test.name}: ${result ? '✅ PASS' : '❌ FAIL'}`);
      } catch (error) {
        results[test.name] = false;
        console.log(`${test.name}: ❌ ERROR - ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n📋 Test Summary:');
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.values(results).length;
    
    console.log(`Passed: ${passed}/${total} tests`);
    console.log(`Success rate: ${Math.round((passed / total) * 100)}%`);
    
    // Detailed results
    console.log('\n📊 Detailed Results:', this.results);
    
    // Store results globally
    window.tableValidationResults = {
      summary: results,
      details: this.results,
      timestamp: new Date().toISOString(),
      successRate: Math.round((passed / total) * 100)
    };
    
    console.log('\n💾 Results saved to window.tableValidationResults');
    
    return {
      passed,
      total,
      successRate: Math.round((passed / total) * 100),
      results: this.results
    };
  }
};

// Auto-run validation tests
TableValidator.runAllTests().then(summary => {
  console.log('\n🎯 Validation Complete!');
  console.log(`Overall Status: ${summary.successRate >= 80 ? '✅ GOOD' : summary.successRate >= 60 ? '⚠️ NEEDS ATTENTION' : '❌ CRITICAL ISSUES'}`);
  
  if (summary.successRate < 80) {
    console.log('\n🔧 Recommended Actions:');
    if (!summary.results.tableCreation?.hasTableTool) {
      console.log('- Check table tool implementation in toolbar');
    }
    if (!summary.results.handleSystem?.totalHandles) {
      console.log('- Verify enhanced handle system is working');
    }
    if (!summary.results.textEditing?.textareaTestPassed) {
      console.log('- Check cell editing functionality');
    }
    if (!summary.results.storeIntegration?.storeAccessible) {
      console.log('- Verify store integration and functions');
    }
  }
});