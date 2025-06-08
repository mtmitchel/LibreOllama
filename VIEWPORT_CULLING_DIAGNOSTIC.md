# Viewport Culling Diagnostic Checklist

## Quick Diagnosis Steps

### 1. Check if visibleElements is actually being used
Open DevTools and search for `visibleElements.map` in the Canvas component. It should be rendering elements, NOT `elements.map`.

**Wrong:**
```javascript
{elements.map(el => (
  <CanvasElement ... />
))}
```

**Correct:**
```javascript
{visibleElements.map(el => (
  <CanvasElement ... />
))}
```

### 2. Verify viewport bounds calculation
Add this temporary debug code to useViewportCulling:
```javascript
console.log('Viewport bounds:', {
  left: viewportBounds.left,
  top: viewportBounds.top,
  right: viewportBounds.right,
  bottom: viewportBounds.bottom,
  width: viewportBounds.right - viewportBounds.left,
  height: viewportBounds.bottom - viewportBounds.top
});
```

### 3. Check element positions
Log the first few elements to see their positions:
```javascript
console.log('First 3 elements:', elements.slice(0, 3).map(e => ({
  id: e.id,
  x: e.x,
  y: e.y,
  width: e.width,
  height: e.height
})));
```

### 4. Verify canvas size is updating
In Canvas.tsx, add:
```javascript
useEffect(() => {
  console.log('Canvas size changed:', viewportSize);
}, [viewportSize]);
```

## Common Issues and Solutions

### Issue 1: All elements always visible
**Symptom:** `culledElements.length` is always 0
**Cause:** Using `elements.map` instead of `visibleElements.map`
**Fix:** Replace the rendering loop

### Issue 2: Canvas size is 0
**Symptom:** Console shows `canvasSize: {width: 0, height: 0}`
**Cause:** ResizeObserver not initialized or ref not attached
**Fix:** Ensure `ref={canvasRef}` is on the canvas container div

### Issue 3: Viewport bounds are huge
**Symptom:** Viewport bounds cover entire canvas regardless of window size
**Cause:** Incorrect calculation or wrong size being used
**Fix:** Check that canvasSize reflects the container size, not content size

### Issue 4: Elements positioned incorrectly
**Symptom:** Elements appear at wrong coordinates
**Cause:** Transform origin or pan/zoom calculation issues
**Fix:** Ensure `transformOrigin: '0 0'` is set on the content container

## Manual Test Procedure

1. **Add position markers**:
```javascript
// Add this to see where (0,0) is
<div className="absolute w-4 h-4 bg-red-500" style={{ left: 0, top: 0 }} />
```

2. **Test with a single element**:
```javascript
// Temporarily replace elements with a single test element
const testElement = [{
  id: 'test',
  type: 'rectangle',
  x: 100,
  y: 100,
  width: 100,
  height: 100,
  backgroundColor: 'red'
}];
```

3. **Log intersection checks**:
```javascript
// In useViewportCulling, log each intersection check
console.log(`Element ${element.id}:`, {
  elementBounds,
  viewportBounds,
  isIntersecting
});
```

## Emergency Fix
If culling still doesn't work, apply this CSS-based clipping as a temporary fix:

```javascript
// On the canvas container div
style={{ 
  overflow: 'hidden',
  position: 'relative',
  clipPath: 'inset(0)' // Force clipping
}}
```

This will at least hide elements outside the container visually, though they'll still be in the DOM.
