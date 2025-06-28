/**
 * Debug Script for Testing Unified Store Integration
 * 
 * Run this in the browser console when the canvas page is loaded
 * to test if the unified store integration is working correctly.
 */

console.log('🔍 Debugging Unified Store Integration...');

// Test if the store is accessible
try {
  // Get the store from the window (if exposed) or directly from the module
  const state = window.__CANVAS_STORE__ || { error: 'Store not exposed' };
  console.log('📊 Current Store State:', state);
  
  // Test basic functionality
  console.log('🧪 Testing Basic Store Functions...');
  
  // Log what's available
  console.log('Available functions:', Object.keys(state).filter(key => typeof state[key] === 'function'));
  
  // Test tool selection
  if (typeof state.setSelectedTool === 'function') {
    state.setSelectedTool('text');
    console.log('✅ Tool selection working - selected tool:', state.selectedTool);
  } else {
    console.log('❌ setSelectedTool not available');
  }
  
  // Test element operations
  if (typeof state.addElement === 'function') {
    console.log('✅ Element operations available');
  } else {
    console.log('❌ Element operations not available');
  }
  
} catch (error) {
  console.error('❌ Store access failed:', error);
}

console.log(`
🚀 Unified Store Integration Status:
- Store architecture: ${typeof window.__CANVAS_STORE__ !== 'undefined' ? '✅ Available' : '❌ Not accessible'}
- Event handling: Check for centralized EventHandlerManager
- Type safety: Check for zero 'as any' casts in console

To manually test toolbar functionality:
1. Click toolbar buttons and check console for function calls
2. Look for "[Legacy]" prefixed logs indicating adapter usage
3. Check for error messages about missing functions
`);

// Export debug functions for manual testing
window.debugUnifiedStore = {
  testToolSelection: () => {
    console.log('🧪 Testing tool selection...');
    const tools = ['select', 'text', 'sticky-note', 'section', 'pen'];
    tools.forEach(tool => {
      if (window.__CANVAS_STORE__ && window.__CANVAS_STORE__.setSelectedTool) {
        window.__CANVAS_STORE__.setSelectedTool(tool);
        console.log(`Set tool to: ${tool}, current tool: ${window.__CANVAS_STORE__.selectedTool}`);
      }
    });
  },
  
  testElementCreation: () => {
    console.log('🧪 Testing element creation...');
    if (window.__CANVAS_STORE__ && window.__CANVAS_STORE__.addElement) {
      const testElement = {
        id: `debug-${Date.now()}`,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        fill: '#ff0000',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      window.__CANVAS_STORE__.addElement(testElement);
      console.log('✅ Element added:', testElement.id);
    }
  },
  
  getCurrentState: () => {
    return window.__CANVAS_STORE__;
  }
};

console.log('🛠️ Debug functions available as: window.debugUnifiedStore');