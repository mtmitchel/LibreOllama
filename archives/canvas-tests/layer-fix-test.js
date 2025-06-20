// QUICK FIX TEST - Run this in browser console after the fix

console.log('🔧 TESTING LAYER FIX...');
console.log('========================');

// Check if the error is resolved
function testLayerFix() {
  console.log('📋 LAYER STRUCTURE TEST:');
  console.log('');
  
  // Check Konva layer structure
  const stages = document.querySelectorAll('.konvajs-content canvas');
  if (stages.length > 0) {
    console.log('✅ Canvas found');
    
    // Monitor for the specific error
    let errorCount = 0;
    const originalError = console.error;
    
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes('You may only add layers to the stage')) {
        errorCount++;
        console.log('🚨 LAYER ERROR DETECTED:', message);
      }
      return originalError.apply(console, args);
    };
    
    setTimeout(() => {
      console.error = originalError;
      if (errorCount === 0) {
        console.log('✅ NO LAYER ERRORS - Fix successful!');
      } else {
        console.log('❌ Still seeing layer errors:', errorCount);
      }
    }, 10000);
    
    console.log('📊 Monitoring for layer errors...');
  }
  
  console.log('');
  console.log('👉 NOW TRY:');
  console.log('1. Select Section tool');
  console.log('2. Draw a section on canvas');
  console.log('3. Check console for any errors');
  console.log('4. Section should appear without errors');
}

testLayerFix();

// Make it globally available
window.testLayerFix = testLayerFix;

console.log('🎯 Ready to test! Try creating a section now.');
