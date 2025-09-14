# Text Editor Positioning Fix

## Problem
Text editors were appearing thousands of pixels off-screen instead of at click locations due to a ~2048px stage position offset that was breaking coordinate transformations.

## Root Cause
The issue was caused by conflicting viewport handling between the legacy system and modular system:

1. **ViewportModule** was applying `viewport.x` and `viewport.y` directly to the Konva stage position
2. **NonReactCanvasStage.tsx** was also applying viewport positioning to the stage
3. This created a cumulative offset where the stage position became thousands of pixels away from (0,0)
4. Text editor positioning calculations used `stage.getAbsoluteTransform()` and `getClientRect()` which included this erroneous offset

## Solution
Fixed the coordinate system by implementing proper viewport handling:

### 1. ViewportModule.ts Changes
- **Stage Position**: Keep stage at (0,0) always for proper coordinate calculations
- **Viewport Panning**: Apply pan transforms to content layers (background, main, preview) instead of stage
- **Layer Isolation**: Overlay layer doesn't pan to keep transformers/UI fixed

```typescript
// Before (BROKEN):
this.stage.position({ x: viewport.x, y: viewport.y });

// After (FIXED):
this.stage.position({ x: 0, y: 0 });
// Apply pan to content layers instead:
layers.main.position({ x: viewport.x, y: viewport.y });
```

### 2. NonReactCanvasStage.tsx Changes
- Skip legacy viewport sync when modular system is active to prevent conflicts
- Added `isModularSystemActive` check to avoid double transformation

```typescript
// Skip viewport sync if modular system is active
if (isModularSystemActive) {
  console.log('[NonReactCanvasStage] Skipping legacy viewport sync - modular system active');
  return;
}
```

## Expected Results
- Text editors now appear exactly at click locations
- Stage position remains at (0,0) for predictable coordinate calculations
- Viewport panning works correctly via layer transforms
- No more thousands-of-pixels offset issues

## Technical Details
- **Coordinate System**: Stage at (0,0) provides stable reference point
- **Panning**: Content layers translate instead of entire stage
- **Scaling**: Still applied to stage for zoom functionality
- **UI Elements**: Overlay layer remains unpanned for fixed positioning

## Testing
- Created `test_text_editor_positioning.html` for verification
- Tests coordinate transformations and viewport pan independence
- Verifies stage position remains at origin

This fix ensures text editing works correctly in the modular canvas system while maintaining proper viewport functionality.