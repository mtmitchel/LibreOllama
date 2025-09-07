# Circle Text Synchronization Fixes

## Summary
Fixed the "text looks different while typing vs after commit" issue by addressing:
1. **Baseline offset** between DOM and Konva
2. **Per-axis scaling** for proper width/height mapping
3. **Square content box** maintenance for circles

## Key Changes

### 1. Baseline Offset Fix
- **Problem**: Konva renders text lower than DOM, causing a "drop" after commit
- **Solution**: Calculate baseline offset and apply ONLY to Konva (lift it up)
- **Implementation**: `getBaselineOffset()` in `text-layout.ts`

```typescript
// Measure DOM vs Canvas height difference
const offset = Math.round((domHeight - canvasHeight) / 2);

// Apply to Konva only (not DOM)
textNode.y(-contentHWorld/2 - baselineWorld);
```

### 2. Per-Axis Scaling Fix
- **Problem**: Mixed scaling causing width/height mismatch
- **Solution**: Use per-axis scale (sx, sy) for accurate mapping

```typescript
// Correct per-axis calculation
const sx = Math.abs(px.x - p0.x);
const sy = Math.abs(py.y - p0.y);
const sLim = Math.min(sx, sy); // For outer square

// Map content back to world with per-axis scale
const contentWWorld = contentWPx / sx;
const contentHWorld = contentHPx / sy;
```

### 3. Square Content Box Fix
- **Problem**: Content box becoming rectangular instead of square
- **Solution**: Ensure content dimensions are equal for circles

```typescript
// Content box must be square for circles
const contentSizePx = sidePx - 2 * padPx - 2 * indentPx;
const contentWPx = contentSizePx;
const contentHPx = contentSizePx; // Same as width!
```

## Testing & Verification

### Enable Debug Mode
```javascript
// In browser console
window.__CANVAS_TEXT_DEBUG__ = true;

// Or via renderer
renderer.setDebugMode(true);
```

### Toggle Baseline Offset (for A/B testing)
```javascript
// Disable baseline offset to see the "drop" return
renderer.toggleBaselineOffset(false);

// Re-enable to fix it
renderer.toggleBaselineOffset(true);
```

### Get Debug Info
```javascript
// Check sync accuracy
const debugInfo = renderer.getDebugInfo();
console.table(debugInfo);

// Should show:
// - konvaWidthPx ≈ contentWPx (within 0.5px)
// - contentWPx === contentHPx (square)
// - baselineOffsetPx > 0 (when enabled)
```

### Visual Verification
1. **Red outline** = Wrapper square (should match inscribed square)
2. **Blue outline** = Content editor (should be square)

### Test at Different Scales
- 100% zoom: Square should fit perfectly
- 125% zoom: Square should scale proportionally
- 150% zoom: No drift or rectangular distortion

## Key Invariants Maintained

1. **Single source of truth**: World radius drives everything
2. **Same-frame sync**: Overlay + ellipse update together
3. **Square content**: Width === Height for circles
4. **Baseline parity**: DOM top-aligned, Konva lifted by offset
5. **Per-axis accuracy**: Content maps correctly at any scale

## Debug Flags

```javascript
// Enable all debugging
window.__CANVAS_TEXT_DEBUG__ = true;

// Check current state
console.log({
  debugMode: window.__CANVAS_TEXT_DEBUG__,
  debugOverlay: window.__CANVAS_DEBUG_OVERLAY__,
  baselineEnabled: renderer.circleTextSync.config.enableBaselineOffset
});
```

## Expected Results

✅ No "drop" after commit (baseline fix)
✅ Square text box at all zoom levels (square content fix)
✅ Consistent wrapping between edit and display (per-axis fix)
✅ <0.5px difference between DOM and Konva widths (sync accuracy)

## Files Modified

- `circle-text-sync.ts` - Core synchronization logic
- `text-layout.ts` - Baseline offset calculation
- `editor/overlay.ts` - DOM editor using sync
- `index.ts` - Orchestrator integration
- Tests added for verification