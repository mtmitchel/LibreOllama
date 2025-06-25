/**
 * Canvas Debug Utilities for LibreOllama
 * 
 * This file contains debug helpers for testing canvas functionality.
 * Copy and paste functions into browser console or run the entire file.
 */

// Test section tool minimum size validation
function testSectionTool() {
  console.log('📦 Testing Section Tool...');
  
  // Try multiple ways to get the canvas store
  const store = window.__CANVAS_STORE__?.getState?.() || 
                window.canvasStore?.getState?.() || 
                window.useCanvasStore?.getState?.();
  
  if (!store) {
    console.error('🚫 Canvas store not found! Make sure you\'re on the canvas page.');
    console.log('Try navigating to the canvas view first.');
    return;
  }
  
  // Set tool to section
  console.log('🔄 Setting tool to section...');
  store.setSelectedTool('section');
  
  // Log current tool
  console.log('✅ Current tool:', store.selectedTool);
  
  // Instructions
  console.log('\n📘 Instructions:');
  console.log('1. Click and drag on the canvas to create a section');
  console.log('2. Minimum size is 10x10 pixels');
  console.log('3. Check console for detailed size information when creation is blocked');
  console.log('\n💡 Tip: Try drawing a very small section to see the size validation in action');
  
  return 'Section tool activated! Try drawing on the canvas.';
}

// Memory leak status check
function checkMemoryLeaks() {
  console.log('🔍 Checking for memory leaks...');
  
  if (typeof MemoryLeakDetector !== 'undefined') {
    MemoryLeakDetector.logStatus();
    const report = MemoryLeakDetector.generateReport();
    console.log('📊 Leak Report:', report);
    
    if (report.suspiciousPatterns.length > 0) {
      console.warn('⚠️ Suspicious patterns detected:');
      report.suspiciousPatterns.forEach(pattern => console.warn(`  - ${pattern}`));
    }
    
    return report;
  } else {
    console.warn('⚠️ MemoryLeakDetector not available. Make sure you\'re in development mode.');
    console.log('Try adding ?debug=true to the URL or check if NODE_ENV=development');
    return null;
  }
}

// Performance status check  
function checkPerformance() {
  console.log('📊 Checking canvas performance...');
  
  if (typeof CanvasPerformanceProfiler !== 'undefined') {
    CanvasPerformanceProfiler.logStatus();
    
    // Get specific operation stats
    const sectionStats = CanvasPerformanceProfiler.getOperationStats('section-create');
    if (sectionStats.count > 0) {
      console.log('📦 Section Creation Performance:', {
        count: sectionStats.count,
        avgTime: `${sectionStats.avgDuration.toFixed(2)}ms`,
        minTime: `${sectionStats.minDuration.toFixed(2)}ms`,
        maxTime: `${sectionStats.maxDuration.toFixed(2)}ms`
      });
    }
    
    return 'Performance report logged to console';
  } else {
    console.warn('⚠️ CanvasPerformanceProfiler not available. Make sure you\'re in development mode.');
    return null;
  }
}

// Event handler health check
function checkEventHandlers() {
  console.log('🎯 Checking event handler health...');
  
  if (typeof eventHandlerManager !== 'undefined') {
    const health = eventHandlerManager.getSystemHealth();
    console.log('📊 System Health:', health);
    
    if (health.failingHandlers.length > 0) {
      console.warn('⚠️ Failing handlers detected:', health.failingHandlers);
    }
    
    const metrics = eventHandlerManager.getHandlerMetrics();
    console.log('📊 Handler Metrics:');
    metrics.forEach((metric, name) => {
      if (metric.errorCount > 0) {
        console.warn(`  ${name}: ${metric.errorCount} errors, ${metric.successCount} successes`);
      } else {
        console.log(`  ${name}: ${metric.successCount} successes`);
      }
    });
    
    return health;
  } else {
    console.warn('⚠️ eventHandlerManager not available.');
    return null;
  }
}

// Check current canvas state
function checkCanvasState() {
  console.log('🖼️ Checking canvas state...');
  
  const store = window.__CANVAS_STORE__?.getState?.() || 
                window.canvasStore?.getState?.() || 
                window.useCanvasStore?.getState?.();
  
  if (!store) {
    console.error('🚫 Canvas store not found!');
    return;
  }
  
  const state = store;
  console.log('📊 Canvas State Summary:');
  console.log(`  Elements: ${state.elements?.size || 0}`);
  console.log(`  Sections: ${state.sections?.size || 0}`);
  console.log(`  Selected: ${state.selectedElementIds?.size || 0}`);
  console.log(`  Current Tool: ${state.selectedTool}`);
  console.log(`  Zoom: ${state.zoom?.toFixed(2) || 1}`);
  console.log(`  Pan: x=${state.pan?.x || 0}, y=${state.pan?.y || 0}`);
  
  // List sections if any exist
  if (state.sections?.size > 0) {
    console.log('\n📦 Sections:');
    Array.from(state.sections.values()).forEach((section, i) => {
      console.log(`  ${i + 1}. ${section.title || 'Untitled'} (${section.id})`);
      console.log(`     Position: ${section.x}, ${section.y}`);
      console.log(`     Size: ${section.width}x${section.height}`);
    });
  }
  
  return state;
}

// Monitor memory usage
function monitorMemory(durationSeconds = 30) {
  console.log(`📊 Monitoring memory for ${durationSeconds} seconds...`);
  
  const startMemory = performance.memory?.usedJSHeapSize;
  if (!startMemory) {
    console.error('🚫 Memory monitoring not available. Use Chrome with --enable-precise-memory-info flag');
    return;
  }
  
  const startMB = (startMemory / 1024 / 1024).toFixed(2);
  console.log(`Starting memory: ${startMB}MB`);
  
  const interval = setInterval(() => {
    const currentMemory = performance.memory.usedJSHeapSize;
    const currentMB = (currentMemory / 1024 / 1024).toFixed(2);
    const deltaMB = ((currentMemory - startMemory) / 1024 / 1024).toFixed(2);
    console.log(`Memory: ${currentMB}MB (${deltaMB >= 0 ? '+' : ''}${deltaMB}MB)`);
  }, 5000);
  
  setTimeout(() => {
    clearInterval(interval);
    const endMemory = performance.memory.usedJSHeapSize;
    const endMB = (endMemory / 1024 / 1024).toFixed(2);
    const totalDeltaMB = ((endMemory - startMemory) / 1024 / 1024).toFixed(2);
    console.log(`\n📊 Memory monitoring complete:`);
    console.log(`  Start: ${startMB}MB`);
    console.log(`  End: ${endMB}MB`);
    console.log(`  Change: ${totalDeltaMB >= 0 ? '+' : ''}${totalDeltaMB}MB`);
    
    if (parseFloat(totalDeltaMB) > 5) {
      console.warn('⚠️ Significant memory increase detected!');
    }
  }, durationSeconds * 1000);
  
  return `Monitoring for ${durationSeconds} seconds...`;
}

// Quick diagnostic function
function runCanvasDiagnostics() {
  console.log('\n🏥 Running Canvas Diagnostics...\n');
  
  console.group('📦 Section Tool Test');
  testSectionTool();
  console.groupEnd();
  
  console.group('🖼️ Canvas State');
  checkCanvasState();
  console.groupEnd();
  
  console.group('🔍 Memory Leak Check');
  checkMemoryLeaks();
  console.groupEnd();
  
  console.group('📊 Performance Check');
  checkPerformance();
  console.groupEnd();
  
  console.group('🎯 Event Handler Health');
  checkEventHandlers();
  console.groupEnd();
  
  console.log('\n✅ Diagnostics complete! Check the groups above for details.');
  console.log('💡 Tip: Use monitorMemory(60) to watch memory usage for 60 seconds');
}

// Export to window for easy access
if (typeof window !== 'undefined') {
  window.canvasDebug = {
    testSectionTool,
    checkMemoryLeaks,
    checkPerformance,
    checkEventHandlers,
    checkCanvasState,
    monitorMemory,
    runDiagnostics: runCanvasDiagnostics
  };
}

// Print available commands
console.log('🎨 LibreOllama Canvas Debug Utilities Loaded!');
console.log('\n📦 Canvas Debug Commands:');
console.log('  testSectionTool()      - Test section tool with size validation');
console.log('  checkCanvasState()     - View current canvas state summary');
console.log('  checkMemoryLeaks()     - Check for memory leaks');
console.log('  checkPerformance()     - Check canvas performance stats');
console.log('  checkEventHandlers()   - Check event handler health');
console.log('  monitorMemory(30)      - Monitor memory usage for 30 seconds');
console.log('  runCanvasDiagnostics() - Run all diagnostics');
console.log('\n💡 Quick Start: runCanvasDiagnostics()');
console.log('💾 All functions also available on: window.canvasDebug');
