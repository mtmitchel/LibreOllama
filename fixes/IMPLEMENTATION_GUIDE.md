# LibreOllama Canvas Bug Fixes Implementation Guide

## Overview
The canvas has been successfully migrated to Pixi.js, but there are several interaction bugs that need fixing. This guide provides the specific changes needed.

## Issues Identified

### 1. Text Content Not Updating Live ✅
**Problem**: Text placeholders persist and content doesn't update in real-time while typing.

**Solution**: Update the textarea onChange handler in Canvas.tsx (around line 339):

```typescript
onChange={(e) => {
  const newValue = e.target.value;
  setEditingTextValue(newValue);
  // Update element content immediately for live updates
  updateElement(isEditingText, { content: newValue });
}}
```

### 2. Element Creation Position ✅
**Problem**: New elements appear at incorrect positions, sometimes off-screen.

**Solution**: Update createElementDirectly in Canvas.tsx (around line 109):

```typescript
// Calculate center of viewport for new elements
const rect = canvasContainerRef.current.getBoundingClientRect();
const centerX = (rect.width / 2 - currentPan.x) / currentZoom;
const centerY = (rect.height / 2 - currentPan.y) / currentZoom;

// Then use these for positioning:
x: elementData.x ?? centerX - defaultWidth / 2,
y: elementData.y ?? centerY - defaultHeight / 2,
```

### 3. Double-Click Timing ✅
**Problem**: 300ms delay on single clicks makes selection feel sluggish.

**Solution**: Simplify TextElement.tsx to handle clicks immediately:

```typescript
const handlePointerDown = useCallback((e: any) => {
  if (onMouseDown) {
    onMouseDown(e, element.id);
  }
}, [onMouseDown, element.id]);

const handlePointerTap = useCallback((e: any) => {
  const now = Date.now();
  const timeDiff = now - lastClickTime.current;
  
  if (timeDiff < 300 && onDoubleClick) {
    e.stopPropagation();
    onDoubleClick();
  }
  
  lastClickTime.current = now;
}, [onDoubleClick]);
```

### 4. Additional Improvements

#### A. Remove Debug Logs
Remove or comment out the console.log statements in production:
- Canvas.tsx: Lines 35-42, 103, 138, etc.
- useCanvasEvents.ts: Various debug logs

#### B. Fix Text Selection State
When clicking away from text editing, ensure proper cleanup:

```typescript
// In handleCanvasMouseDown (useCanvasEvents.ts)
if (currentStoreState.isEditingText && textAreaRef.current) {
  const currentTextValue = textAreaRef.current.value;
  updateElement(currentStoreState.isEditingText, { content: currentTextValue });
  addToHistory(useCanvasStore.getState().elements);
  setIsEditingText(null);
  setTextFormattingState(false);
  setTextSelectionState(null, null, null);
}
```

## Testing Checklist

After implementing these fixes, test:

1. **Text Editing**:
   - [ ] Create a text element
   - [ ] Double-click to edit
   - [ ] Type - content should update live
   - [ ] Click away - content should persist
   - [ ] Delete key works when element selected

2. **Element Creation**:
   - [ ] Click "Add Text" - element appears at viewport center
   - [ ] Click "Add Rectangle" - element appears at viewport center
   - [ ] Pan/zoom canvas, create element - still centered in view

3. **Selection & Interaction**:
   - [ ] Single click selects immediately (no delay)
   - [ ] Double-click enters text edit mode
   - [ ] Drag elements smoothly
   - [ ] Multi-select with Shift works
   - [ ] Delete button removes selected elements

4. **Edge Cases**:
   - [ ] Drag element outside viewport and release - no stuck state
   - [ ] Rapid clicking doesn't cause issues
   - [ ] Zoom in/out while editing text - textarea stays aligned

## Architecture Notes

The current architecture is solid:
- **Pixi.js Stage**: WebGL-accelerated rendering ✅
- **Zustand Store**: Centralized state management ✅
- **Event Hook**: Separated concerns for events ✅
- **Viewport Culling**: Performance optimization ✅

The main issues are in the interaction details, not the architecture itself.

## Next Steps

1. Apply the fixes above
2. Test thoroughly using the checklist
3. Consider adding:
   - Undo/redo functionality (already has history tracking)
   - Copy/paste support
   - Export functionality
   - Collaborative features

The foundation is strong - these fixes will make the interactions smooth and reliable.