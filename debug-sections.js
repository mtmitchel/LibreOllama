/**
 * Debug Script for Section Creation Issues
 * 
 * Run this in your browser console after trying to create a section
 * to see what's happening with the section data flow.
 */

console.log('🔍 Debugging Section Creation...');

// Check if sections exist in the store
const store = window.__CANVAS_STORE__;
if (store) {
  const state = store.getState();
  console.log('📦 Store Sections Map:', state.sections);
  console.log('📦 Store Elements Map:', state.elements);
  console.log('📦 Section Count:', state.sections?.size || 0);
  console.log('📦 Element Count:', state.elements?.size || 0);
  
  if (state.sections && state.sections.size > 0) {
    console.log('✅ Sections exist in store - data creation is working');
    Array.from(state.sections.values()).forEach((section, index) => {
      console.log(`Section ${index + 1}:`, {
        id: section.id,
        x: section.x,
        y: section.y,
        width: section.width,
        height: section.height,
        title: section.title,
        isHidden: section.isHidden,
        backgroundColor: section.backgroundColor
      });
    });
  } else {
    console.log('❌ No sections found in store - section creation failed');
  }
  
  // Check viewport settings that might affect rendering
  console.log('🔍 Viewport State:', {
    zoom: state.zoom,
    pan: state.pan,
    viewportBounds: state.viewportBounds
  });
  
  // Check if sections are in the combined elements array
  console.log('🔍 Section IDs in elements Map:', Array.from(state.elements.keys()).filter(id => id.includes('section')));
  
} else {
  console.log('❌ Canvas store not found on window.__CANVAS_STORE__');
  console.log('Available on window:', Object.keys(window).filter(k => k.includes('CANVAS')));
}

// Check DOM elements
const canvasElements = document.querySelectorAll('[id*="section"]');
console.log('🖥️ DOM Section Elements Found:', canvasElements.length);
canvasElements.forEach((el, i) => {
  console.log(`DOM Section ${i + 1}:`, {
    id: el.id,
    tagName: el.tagName,
    visible: getComputedStyle(el).display !== 'none'
  });
});

// Check Konva stage elements
const stage = document.querySelector('.konvajs-content canvas');
if (stage) {
  console.log('🎨 Konva stage found');
} else {
  console.log('❌ Konva stage not found');
}

console.log('🔍 Debug complete. Check the logs above.');
