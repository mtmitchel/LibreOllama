/**
 * Debug Rendering Pipeline
 * Check why elements aren't appearing on canvas
 */

console.log('🎨 Debugging Canvas Rendering Pipeline...');

function debugRenderingPipeline() {
  const store = window.__CANVAS_STORE__;
  
  console.log('=== STORE STATE ===');
  console.log('Store elements:', store.elements.size);
  console.log('Elements:', Array.from(store.elements.entries()));
  
  console.log('\n=== DOM INSPECTION ===');
  
  // Find all canvas elements
  const canvases = document.querySelectorAll('canvas');
  console.log('Canvas elements found:', canvases.length);
  
  canvases.forEach((canvas, i) => {
    console.log(`Canvas ${i}:`, {
      width: canvas.width,
      height: canvas.height,
      style: canvas.style.display,
      parentElement: canvas.parentElement?.tagName
    });
  });
  
  // Check for Konva elements
  const konvaElements = document.querySelectorAll('[data-konva]');
  console.log('Konva elements found:', konvaElements.length);
  
  // Look for MainLayer content
  console.log('\n=== REACT COMPONENT TREE ===');
  
  // Try to find React fiber node with MainLayer
  const findReactFiber = (element) => {
    const keys = Object.keys(element);
    return keys.find(key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance'));
  };
  
  const canvasContainer = document.querySelector('#canvas-container');
  if (canvasContainer) {
    console.log('Canvas container found:', canvasContainer);
    const fiberKey = findReactFiber(canvasContainer);
    if (fiberKey) {
      console.log('React fiber found on canvas container');
    }
  }
  
  console.log('\n=== KONVA STAGE INSPECTION ===');
  
  // Try to access Konva stage directly
  if (window.Konva) {
    console.log('Konva available:', !!window.Konva);
    const stages = window.Konva.stages;
    console.log('Konva stages:', stages.length);
    
    stages.forEach((stage, i) => {
      console.log(`Stage ${i}:`, {
        width: stage.width(),
        height: stage.height(),
        children: stage.children?.length || 0,
        layers: stage.getLayers?.()?.length || 0
      });
      
      // Check layers in this stage
      const layers = stage.getLayers();
      layers.forEach((layer, j) => {
        console.log(`  Layer ${j}:`, {
          name: layer.name(),
          children: layer.children?.length || 0,
          visible: layer.visible()
        });
        
        // Check children in this layer
        layer.children?.forEach((child, k) => {
          console.log(`    Child ${k}:`, {
            name: child.name?.() || 'unnamed',
            className: child.className,
            visible: child.visible?.() || 'no visible method',
            x: child.x?.() || 'no x',
            y: child.y?.() || 'no y'
          });
        });
      });
    });
  }
}

function testElementVisibility() {
  const store = window.__CANVAS_STORE__;
  
  console.log('\n=== ELEMENT VISIBILITY TEST ===');
  
  if (store.elements.size === 0) {
    console.log('❌ No elements in store to test');
    return;
  }
  
  store.elements.forEach((element, id) => {
    console.log(`Testing element ${id}:`, {
      type: element.type,
      position: `(${element.x}, ${element.y})`,
      visible: element.visible !== false,
      opacity: element.opacity || 1,
      fill: element.fill || 'none',
      stroke: element.stroke || 'none'
    });
    
    // Check if coordinates are reasonable
    if (element.x < 0 || element.x > 2000 || element.y < 0 || element.y > 2000) {
      console.warn(`⚠️ Element ${id} may be outside visible area`);
    }
    
    // Check if element has size
    if (element.width === 0 || element.height === 0) {
      console.warn(`⚠️ Element ${id} has zero size`);
    }
  });
}

function forceCanvasRedraw() {
  console.log('\n=== FORCING CANVAS REDRAW ===');
  
  if (window.Konva) {
    window.Konva.stages.forEach((stage, i) => {
      console.log(`Redrawing stage ${i}...`);
      stage.draw();
    });
  }
  
  // Try to trigger React re-render
  const store = window.__CANVAS_STORE__;
  if (store.setSelectedTool) {
    const currentTool = store.selectedTool;
    store.setSelectedTool('temp');
    setTimeout(() => {
      store.setSelectedTool(currentTool);
      console.log('Triggered re-render via tool change');
    }, 100);
  }
}

// Export debug functions
window.debugRendering = {
  debugRenderingPipeline,
  testElementVisibility,
  forceCanvasRedraw,
  
  // Quick debug
  quick: () => {
    debugRenderingPipeline();
    testElementVisibility();
  },
  
  // Force everything
  forceAll: () => {
    debugRenderingPipeline();
    testElementVisibility();
    forceCanvasRedraw();
  }
};

// Auto-run
console.log('🚀 Running rendering debug...');
debugRenderingPipeline();
testElementVisibility();

console.log('\n🛠️ Additional debug functions:');
console.log('- window.debugRendering.quick()');
console.log('- window.debugRendering.forceAll()');
console.log('- window.debugRendering.forceCanvasRedraw()');