# Viewport Culling Test Plan

## Changes Made

1. **Canvas.tsx Integration**: 
   - Added `useResizeObserver` hook to properly track canvas dimensions
   - Now passing observed dimensions to `useViewportCulling` instead of calculating during render

2. **Debug Logging Added**:
   - `useViewportCulling`: Logs canvas size, zoom level, pan offset, viewport bounds, and culling results
   - `useResizeObserver`: Logs dimension changes when canvas is resized

## Testing Steps

### 1. Initial Load Test
- Open the Canvas page
- Check console for initial logs:
  - `[useResizeObserver] New dimensions:` should show canvas size
  - `[ViewportCulling] Calculating with:` should show proper canvas dimensions
  - `[ViewportCulling] Visible:` should show element counts

### 2. Window Resize Test
- Resize the browser window to a smaller size
- Monitor console logs:
  - Should see `[useResizeObserver] New dimensions:` with new values
  - Viewport bounds should adjust accordingly
  - More elements should be culled (Culled count increases)

### 3. Zoom Test
- Use mouse wheel to zoom in/out
- Verify viewport bounds change with zoom level
- Elements should be culled/shown based on new viewport

### 4. Pan Test
- Drag to pan the canvas
- Elements outside the viewport should be culled
- Console should show updated pan offset values

## Expected Behavior

With buffer = 0:
- Elements completely outside the viewport should be culled immediately
- No elements should render beyond canvas boundaries
- Performance should improve with many elements off-screen

## Debug Output Format

```
[useResizeObserver] New dimensions: 1200 800
[ViewportCulling] Calculating with: {canvasSizeW: 1200, canvasSizeH: 800, zoomLevel: 1, panX: 0, panY: 0}
[ViewportCulling] Viewport bounds: {left: 0, top: 0, right: 1200, bottom: 800}
[ViewportCulling] Visible: 5, Culled: 0
```

## Common Issues to Check

1. **Canvas Size = 0**: If canvasSize shows 0x0, the ref might not be properly attached
2. **All Elements Visible**: Check if viewport bounds are too large
3. **No Elements Visible**: Check if viewport calculation is inverted

## Type Issues Resolved

- Fixed import in `useViewportCulling.ts` to properly import the CanvasElement type
- Using type-only import to avoid circular dependencies
