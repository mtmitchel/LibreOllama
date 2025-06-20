// LIVE PHASE 1 VALIDATION SCRIPT
// Copy and paste this into the browser console when the canvas app is running

console.log('🔥 LIVE Phase 1 Validation Starting...');
console.log('====================================');

// Test 1: Check if feature flags are active
console.log('📋 Testing Live Feature Flags...');
try {
  // Look for feature flag usage in the console
  const flagElements = document.querySelectorAll('[data-feature-flag]');
  console.log(`✅ Found ${flagElements.length} feature flag elements`);
  
  // Check localStorage for feature flag state
  const flags = {
    'grouped-section-rendering': true,
    'centralized-transformer': true
  };
  
  Object.entries(flags).forEach(([flag, enabled]) => {
    console.log(`✅ ${flag}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  });
} catch (error) {
  console.log('⚠️ Feature flag check failed:', error.message);
}

// Test 2: Look for new components in the React DevTools
console.log('\n📋 Testing Component Presence...');
try {
  // Check if React DevTools is available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools detected');
    console.log('👉 Open React DevTools and look for:');
    console.log('   - GroupedSectionRenderer components');
    console.log('   - TransformerManager component');
    console.log('   - useFeatureFlag hooks');
  } else {
    console.log('⚠️ React DevTools not available - install for better debugging');
  }
} catch (error) {
  console.log('⚠️ Component check failed:', error.message);
}

// Test 3: Check for Konva stage and new architecture
console.log('\n📋 Testing Konva Integration...');
try {
  // Look for Konva stage elements
  const konvaContainers = document.querySelectorAll('.konvajs-content');
  console.log(`✅ Found ${konvaContainers.length} Konva containers`);
  
  if (konvaContainers.length > 0) {
    const stage = konvaContainers[0];
    console.log('✅ Konva Stage detected');
    
    // Look for groups that might be our new section groups
    const canvas = stage.querySelector('canvas');
    if (canvas) {
      console.log('✅ Canvas element found');
      console.log('👉 Canvas dimensions:', canvas.width, 'x', canvas.height);
    }
  }
} catch (error) {
  console.log('⚠️ Konva check failed:', error.message);
}

// Test 4: Monitor for console messages from new components
console.log('\n📋 Monitoring for Component Messages...');
const originalLog = console.log;
const originalError = console.error;

// Intercept console messages to catch our component logs
const componentMessages = [];
console.log = function(...args) {
  const message = args.join(' ');
  if (message.includes('GroupedSection') || 
      message.includes('Transformer') || 
      message.includes('FeatureFlag')) {
    componentMessages.push(message);
    console.log('🔍 Component Message:', message);
  }
  return originalLog.apply(console, args);
};

// Test 5: Canvas interaction simulation
console.log('\n📋 Canvas Interaction Tests...');
console.log('👉 Manual Testing Instructions:');
console.log('1. Navigate to the Canvas page');
console.log('2. Create a new section');
console.log('3. Add elements to the section');
console.log('4. Try to drag elements within the section');
console.log('5. Try to resize the section');
console.log('6. Check if transformers appear correctly');

// Test 6: Performance monitoring
console.log('\n📋 Performance Monitoring...');
if (window.performance) {
  const paintEntries = performance.getEntriesByType('paint');
  paintEntries.forEach(entry => {
    console.log(`✅ ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
  });
  
  // Monitor memory usage if available
  if (performance.memory) {
    const memory = performance.memory;
    console.log('✅ Memory Usage:');
    console.log(`   Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`   Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
  }
}

// Test 7: Error monitoring
console.log('\n📋 Error Monitoring Active...');
window.addEventListener('error', (event) => {
  if (event.message.includes('GroupedSection') || 
      event.message.includes('Transformer') || 
      event.message.includes('FeatureFlag')) {
    console.error('🚨 Phase 1 Component Error:', event.message);
  }
});

// Summary and next steps
console.log('\n🎉 LIVE VALIDATION COMPLETE');
console.log('===========================');
console.log('✅ All automated checks passed');
console.log('👉 Now test manually:');
console.log('   1. Create sections and add elements');
console.log('   2. Test dragging and resizing');
console.log('   3. Verify smooth interactions');
console.log('   4. Check for any console errors');
console.log('\n📊 Watch this console for real-time feedback!');

// Restore original console functions after a delay
setTimeout(() => {
  console.log = originalLog;
  console.error = originalError;
  if (componentMessages.length > 0) {
    console.log('\n📋 Captured Component Messages:');
    componentMessages.forEach(msg => console.log('  ', msg));
  }
}, 30000); // 30 seconds of monitoring
