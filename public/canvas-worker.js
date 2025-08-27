/**
 * Canvas Web Worker for Heavy Computations
 * Offloads expensive calculations from main thread to prevent UI blocking
 * React 19 + Tauri performance optimization
 */

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'CALCULATE_VIEWPORT_TRANSFORMS':
        const viewportResult = calculateViewportTransforms(data);
        self.postMessage({ type: 'VIEWPORT_TRANSFORMS_CALCULATED', result: viewportResult });
        break;
        
      case 'CALCULATE_TEXT_DIMENSIONS':
        const textResult = calculateTextDimensions(data);
        self.postMessage({ type: 'TEXT_DIMENSIONS_CALCULATED', result: textResult });
        break;
        
      case 'PROCESS_ELEMENT_POSITIONS':
        const positionsResult = processElementPositions(data);
        self.postMessage({ type: 'ELEMENT_POSITIONS_PROCESSED', result: positionsResult });
        break;
        
      default:
        self.postMessage({ type: 'ERROR', error: `Unknown task type: ${type}` });
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
};

/**
 * Calculate viewport transforms for canvas elements
 * Heavy computation moved off main thread
 */
function calculateViewportTransforms(data) {
  const { elements, viewport } = data;
  const { scale, x, y } = viewport;
  
  const transformedElements = [];
  
  for (const element of elements) {
    // Apply viewport transformation
    const transformedElement = {
      ...element,
      x: (element.x * scale) + x,
      y: (element.y * scale) + y,
      width: element.width * scale,
      height: element.height * scale
    };
    
    transformedElements.push(transformedElement);
  }
  
  return {
    transformedElements,
    timestamp: Date.now()
  };
}

/**
 * Calculate text dimensions for auto-expansion
 * Expensive text measurement moved to worker
 */
function calculateTextDimensions(data) {
  const { text, fontSize, fontFamily, maxWidth } = data;
  
  // Use OffscreenCanvas for text measurement in worker
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  
  return {
    width: Math.min(metrics.width, maxWidth || 600),
    height: fontSize * 1.2, // Approximate line height
    actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || fontSize * 0.8,
    actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || fontSize * 0.2
  };
}

/**
 * Process element positions for collision detection and layout
 * Heavy spatial calculations moved to worker
 */
function processElementPositions(data) {
  const { elements, canvasViewport } = data;
  
  const processedElements = [];
  const spatialIndex = new Map();
  
  // Build spatial index for fast lookups
  for (const element of elements) {
    const gridX = Math.floor(element.x / 100);
    const gridY = Math.floor(element.y / 100);
    const key = `${gridX}-${gridY}`;
    
    if (!spatialIndex.has(key)) {
      spatialIndex.set(key, []);
    }
    spatialIndex.get(key).push(element);
    
    // Check if element is visible in viewport
    const isVisible = (
      element.x < canvasViewport.x + canvasViewport.width &&
      element.x + element.width > canvasViewport.x &&
      element.y < canvasViewport.y + canvasViewport.height &&
      element.y + element.height > canvasViewport.y
    );
    
    processedElements.push({
      ...element,
      isVisible,
      gridPosition: key
    });
  }
  
  return {
    processedElements,
    spatialIndex: Object.fromEntries(spatialIndex),
    visibleCount: processedElements.filter(e => e.isVisible).length
  };
}

// Error handling for worker
self.onerror = function(error) {
  self.postMessage({ 
    type: 'ERROR', 
    error: `Worker error: ${error.message}` 
  });
};