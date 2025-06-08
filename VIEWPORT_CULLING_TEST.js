// Quick test to verify viewport culling is working
// Add this temporarily to Canvas.tsx after the imports

const TEST_VIEWPORT_CULLING = true;

// Inside the Canvas component, add this after hooks:
useEffect(() => {
  if (TEST_VIEWPORT_CULLING && process.env.NODE_ENV === 'development') {
    // Add test elements spread across a large area
    const testElements: CanvasElementType[] = [];
    
    // Create a grid of elements
    for (let x = -1000; x <= 2000; x += 200) {
      for (let y = -1000; y <= 2000; y += 200) {
        testElements.push({
          id: `test-${x}-${y}`,
          type: 'rectangle',
          x,
          y,
          width: 50,
          height: 50,
          backgroundColor: `hsl(${(x + y) % 360}, 70%, 50%)`,
        });
      }
    }
    
    // Add test elements to the canvas
    setElements(prev => [...prev, ...testElements]);
    
    console.log('[TEST] Added', testElements.length, 'test elements across large area');
    
    // Log culling effectiveness after a delay
    setTimeout(() => {
      console.log('[TEST] Culling effectiveness:', {
        totalElements: elements.length,
        visibleElements: visibleElements.length,
        culledElements: culledElements.length,
        cullingPercentage: ((culledElements.length / elements.length) * 100).toFixed(1) + '%'
      });
    }, 1000);
  }
}, []); // Run once on mount

// Expected behavior:
// 1. Should create ~256 elements spread across a large area
// 2. Only a small subset should be visible (maybe 10-20)
// 3. As you pan/zoom, different elements should appear/disappear
// 4. Console should show high culling percentage (>90%)
