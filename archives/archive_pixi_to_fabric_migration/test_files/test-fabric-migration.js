/**
 * Test script to verify Fabric.js migration functionality
 * Run this in the browser console on /fabric-migration page
 */

console.log('🧪 Testing Fabric.js Migration - Phase 2');

// Test 1: Check if Fabric.js canvas is loaded
const testFabricCanvas = () => {
  const canvasElement = document.querySelector('canvas');
  if (canvasElement) {
    console.log('✅ Canvas element found');
    return true;
  } else {
    console.log('❌ Canvas element not found');
    return false;
  }
};

// Test 2: Check toolbar functionality
const testToolbar = () => {
  const toolbar = document.querySelector('[class*="Canvas"]');
  if (toolbar) {
    console.log('✅ Toolbar found');
    return true;
  } else {
    console.log('❌ Toolbar not found');
    return false;
  }
};

// Test 3: Check if we can simulate element creation
const testElementCreation = () => {
  try {
    // Look for text button in toolbar
    const textButton = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.title?.includes('Text') || btn.textContent?.includes('Text'));
    
    if (textButton) {
      console.log('✅ Text tool button found');
      textButton.click();
      setTimeout(() => {
        console.log('🔄 Text tool clicked - check canvas for new element');
      }, 100);
      return true;
    } else {
      console.log('❌ Text tool button not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing element creation:', error);
    return false;
  }
};

// Run all tests
const runTests = () => {
  console.log('Running Fabric.js Migration Tests...\n');
  
  const canvasTest = testFabricCanvas();
  const toolbarTest = testToolbar();
  
  if (canvasTest && toolbarTest) {
    console.log('\n✅ Basic components loaded successfully');
    setTimeout(() => {
      testElementCreation();
    }, 500);
  } else {
    console.log('\n❌ Basic component tests failed');
  }
};

// Export for manual testing
window.testFabricMigration = runTests;

console.log('🎯 Run window.testFabricMigration() to test the migration');
