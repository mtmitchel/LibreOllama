// Enhanced Table Diagnostic Script
console.log('🔍 Starting Enhanced Table Diagnostic...');

const TableDiagnostic = {
  
  async checkStoreState() {
    console.log('\n📊 Checking Store State...');
    
    // Try to access the store via React DevTools or global window
    let storeAccess = false;
    let elementCount = 0;
    
    try {
      // Check if React fiber is available
      const root = document.querySelector('#root');
      if (root && (root._reactInternalFiber || root._reactInternals)) {
        console.log('✅ React fiber tree accessible');
        storeAccess = true;
      }
      
      // Check console for store logs
      console.log('🔍 Store logs should appear when creating tables...');
      
    } catch (error) {
      console.error('❌ Store access error:', error);
    }
    
    return { storeAccess, elementCount };
  },
  
  async testTableCreation() {
    console.log('\n🏗️ Testing Table Creation...');
    
    try {
      // Find table tool button
      const tableButton = document.querySelector('[data-tool="table"]') ||
                         document.querySelector('button[title*="table"]') ||
                         document.querySelector('button[title*="Table"]') ||
                         Array.from(document.querySelectorAll('button')).find(btn => 
                           btn.textContent?.toLowerCase().includes('table') ||
                           btn.getAttribute('aria-label')?.toLowerCase().includes('table')
                         );
      
      console.log('Table button found:', !!tableButton);
      if (tableButton) {
        console.log('Table button element:', tableButton);
      }
      
      // Find canvas
      const canvas = document.querySelector('canvas');
      console.log('Canvas found:', !!canvas);
      
      if (tableButton && canvas) {
        console.log('🎯 Attempting to create table...');
        
        // Activate table tool
        tableButton.click();
        console.log('✅ Table tool activated');
        
        // Wait a moment for tool activation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Click on canvas to create table
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        console.log('📍 Clicking canvas at:', { centerX, centerY });
        
        // Create mouse events
        const mouseDown = new MouseEvent('mousedown', {
          clientX: centerX,
          clientY: centerY,
          bubbles: true,
          cancelable: true
        });
        
        const mouseUp = new MouseEvent('mouseup', {
          clientX: centerX,
          clientY: centerY,
          bubbles: true,
          cancelable: true
        });
        
        canvas.dispatchEvent(mouseDown);
        canvas.dispatchEvent(mouseUp);
        
        console.log('✅ Mouse events dispatched');
        
        // Wait for table creation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check for new tables
        const tables = document.querySelectorAll('[id*="table"]');
        console.log(`Tables found after creation: ${tables.length}`);
        
        // Check DOM for table elements
        const tableGroups = document.querySelectorAll('g[id*="table"]');
        const tableRects = document.querySelectorAll('rect[id*="table"]');
        
        console.log('Table groups in DOM:', tableGroups.length);
        console.log('Table rects in DOM:', tableRects.length);
        
        return {
          tableCreated: tables.length > 0,
          tableGroups: tableGroups.length,
          tableRects: tableRects.length
        };
        
      } else {
        console.log('❌ Missing table button or canvas');
        return { error: 'Missing required elements' };
      }
      
    } catch (error) {
      console.error('❌ Table creation test failed:', error);
      return { error: error.message };
    }
  },
  
  async checkTableHandles() {
    console.log('\n🎛️ Checking Table Handles...');
    
    try {
      // Look for table-related elements
      const tableElements = document.querySelectorAll('[id*="table"]');
      console.log('Table elements found:', tableElements.length);
      
      // Look for handles (circles and rects that could be handles)
      const circles = document.querySelectorAll('circle');
      const rects = document.querySelectorAll('rect');
      
      const possibleHandles = Array.from(circles).filter(circle => {
        const radius = circle.getAttribute('radius');
        const fill = circle.getAttribute('fill');
        return radius && (radius === '10' || radius === '16') && fill;
      });
      
      console.log('Total circles:', circles.length);
      console.log('Total rects:', rects.length);
      console.log('Possible handle circles:', possibleHandles.length);
      
      // Check for mouse event handlers
      let elementsWithHandlers = 0;
      [...circles, ...rects].forEach(el => {
        if (el.onmousedown || el.getAttribute('onMouseDown')) {
          elementsWithHandlers++;
        }
      });
      
      console.log('Elements with mouse handlers:', elementsWithHandlers);
      
      return {
        circles: circles.length,
        rects: rects.length,
        possibleHandles: possibleHandles.length,
        elementsWithHandlers
      };
      
    } catch (error) {
      console.error('❌ Handle check failed:', error);
      return { error: error.message };
    }
  },
  
  async runDiagnostic() {
    console.log('🚀 Running Enhanced Table Diagnostic...\n');
    
    const results = {};
    
    // Test 1: Store state
    results.storeState = await this.checkStoreState();
    
    // Test 2: Table creation
    results.tableCreation = await this.testTableCreation();
    
    // Test 3: Handle check
    results.handleCheck = await this.checkTableHandles();
    
    // Summary
    console.log('\n📋 Diagnostic Summary:');
    console.log('Store Access:', results.storeState.storeAccess ? '✅' : '❌');
    console.log('Table Creation:', results.tableCreation.tableCreated ? '✅' : '❌');
    console.log('Handle Elements:', results.handleCheck.possibleHandles > 0 ? '✅' : '⚠️');
    
    // Store results for inspection
    window.tableDiagnosticResults = {
      results,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n💾 Results saved to window.tableDiagnosticResults');
    console.log('🔍 Watch console for detailed debug logs from store and components...');
    
    return results;
  }
};

// Auto-run diagnostic
TableDiagnostic.runDiagnostic();