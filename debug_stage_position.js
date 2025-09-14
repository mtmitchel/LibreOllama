// Debug script to test stage position issue
// Run this in the browser console to see stage position values

console.log('=== STAGE POSITION DEBUG ===');

// Find the stage
const stage = document.querySelector('canvas')?.getContext('2d')?.canvas?.parentNode?._konvajs;
if (!stage) {
    console.log('No Konva stage found');
} else {
    console.log('Stage found:', stage);
    console.log('Stage position:', stage.position());
    console.log('Stage scale:', stage.scale());
    console.log('Stage size:', { width: stage.width(), height: stage.height() });
    console.log('Container rect:', stage.container().getBoundingClientRect());
    
    // Test coordinate transformation
    const testPoint = { x: 100, y: 100 };
    console.log('Test point (world):', testPoint);
    console.log('Stage transformed point:', stage.getAbsoluteTransform().point(testPoint));
    
    // Check viewport state
    const store = window.__UNIFIED_CANVAS_STORE__;
    if (store) {
        const state = store.getState();
        console.log('Viewport state:', state.viewport);
    }
}

console.log('=== END DEBUG ===');
