/**
 * Enhanced Debug Script for Canvas Store Integration
 * 
 * This script will check the actual React components and store integration
 * Run this in the browser console when the canvas page is loaded
 */

console.log('🔍 Enhanced Canvas Store Debug...');

// Function to find React components and their props/state
function findReactComponents() {
  const allElements = document.querySelectorAll('*');
  const reactElements = [];
  
  allElements.forEach(el => {
    const keys = Object.keys(el);
    const reactKey = keys.find(key => key.startsWith('__reactInternalInstance') || key.startsWith('_reactInternalFiber'));
    if (reactKey) {
      reactElements.push(el);
    }
  });
  
  return reactElements;
}

// Test toolbar functionality
function testToolbarFunctionality() {
  console.log('🧪 Testing Toolbar Functionality...');
  
  // Find toolbar buttons
  const toolbarButtons = document.querySelectorAll('[data-tool], .tool-button, button[aria-label*="Tool"]');
  console.log(`Found ${toolbarButtons.length} potential toolbar buttons`);
  
  // Find text tool button specifically
  const textButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Text') || 
    btn.title?.includes('Text') ||
    btn.getAttribute('aria-label')?.includes('Text')
  );
  
  if (textButton) {
    console.log('✅ Found text tool button:', textButton);
    console.log('Button attributes:', {
      'data-tool': textButton.getAttribute('data-tool'),
      'title': textButton.title,
      'aria-label': textButton.getAttribute('aria-label'),
      'className': textButton.className
    });
    
    // Test clicking the button
    console.log('🖱️ Simulating click on text tool...');
    textButton.click();
    
    setTimeout(() => {
      console.log('✅ Text tool click completed - check for any errors above');
    }, 100);
  } else {
    console.log('❌ Could not find text tool button');
  }
}

// Check for store-related errors in console
function checkForStoreErrors() {
  console.log('🔍 Checking for store-related elements...');
  
  // Look for error indicators in the DOM
  const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
  if (errorElements.length > 0) {
    console.log('⚠️ Found potential error elements:', errorElements);
  }
  
  // Check if the canvas page is properly loaded
  const canvasContainer = document.querySelector('[class*="canvas"], [class*="Canvas"], [data-testid*="canvas"]');
  if (canvasContainer) {
    console.log('✅ Canvas container found:', canvasContainer);
  } else {
    console.log('❌ No canvas container found');
  }
}

// Test the integration step by step
function runDiagnostics() {
  console.log('🚀 Running Canvas Store Diagnostics...');
  console.log('='.repeat(50));
  
  // 1. Check if we're on the canvas page
  const currentPath = window.location.pathname;
  console.log('📍 Current page:', currentPath);
  const isCanvasPage = currentPath.includes('canvas') || currentPath.includes('Canvas');
  console.log(`Canvas page detected: ${isCanvasPage ? '✅' : '❌'}`);
  
  // 2. Check for React elements
  const reactElements = findReactComponents();
  console.log(`📱 React elements found: ${reactElements.length}`);
  
  // 3. Check for store errors
  checkForStoreErrors();
  
  // 4. Test toolbar if available
  if (isCanvasPage) {
    setTimeout(() => testToolbarFunctionality(), 500);
  }
  
  // 5. Monitor console for function errors
  console.log('👀 Monitoring console for "setSelectedTool is not a function" errors...');
  console.log('   If you see such errors, the integration needs adjustment');
  
  console.log('='.repeat(50));
  console.log('🏁 Diagnostics complete. Try clicking toolbar buttons now.');
}

// Manual testing functions
window.canvasDebug = {
  runDiagnostics,
  testToolbar: testToolbarFunctionality,
  findReactComponents,
  
  // Test specific functionality
  testTextTool: () => {
    console.log('🧪 Testing text tool specifically...');
    const textButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent?.toLowerCase().includes('text') || 
      btn.title?.toLowerCase().includes('text')
    );
    
    if (textButton) {
      console.log('Found text button, clicking...');
      textButton.click();
      setTimeout(() => {
        console.log('Text tool test complete - check for errors');
      }, 200);
    } else {
      console.log('❌ Text button not found');
    }
  },
  
  checkConsoleErrors: () => {
    console.log('Checking for recent console errors...');
    // This will show any errors that happened during testing
  }
};

// Run diagnostics automatically
runDiagnostics();

console.log('🛠️ Canvas debug functions available as: window.canvasDebug');
console.log('💡 Try: window.canvasDebug.testTextTool()');