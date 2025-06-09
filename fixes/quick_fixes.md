# Quick Fix Script for LibreOllama Canvas Issues

This script applies the critical fixes to resolve the canvas interaction bugs.

## Fix 1: Update Text Live in Canvas.tsx

Replace the textarea onChange handler with the following to enable live text updates:

```typescript
// Find this line (around line 339):
onChange={(e) => setEditingTextValue(e.target.value)}

// Replace with:
onChange={(e) => {
  const newValue = e.target.value;
  setEditingTextValue(newValue);
  updateElement(isEditingText, { content: newValue });
}}
```

## Fix 2: Center New Elements in Canvas.tsx

In the createElementDirectly function (around line 109), update the positioning logic:

```typescript
// Add after getting current state:
const rect = canvasContainerRef.current.getBoundingClientRect();
const centerX = (rect.width / 2 - currentPan.x) / currentZoom;
const centerY = (rect.height / 2 - currentPan.y) / currentZoom;

// Update the x and y assignments:
x: elementData.x ?? centerX - defaultWidth / 2,
y: elementData.y ?? centerY - defaultHeight / 2,
```

## Fix 3: Simplify Double-Click in TextElement.tsx

Replace the complex handlePointerDown with:

```typescript
const handlePointerDown = useCallback((e: any) => {
  if (onMouseDown) {
    onMouseDown(e, element.id);
  }
}, [onMouseDown, element.id]);

// Add a new handler for double-click:
const handlePointerTap = useCallback((e: any) => {
  const now = Date.now();
  const timeDiff = now - lastClickTime.current;
  
  if (timeDiff < 300 && onDoubleClick) {
    e.stopPropagation();
    onDoubleClick();
  }
  
  lastClickTime.current = now;
}, [onDoubleClick]);

// Update the Text component props:
pointerdown={handlePointerDown}
pointertap={handlePointerTap}
```

## Optional: Remove Debug Logs

Comment out or remove console.log statements for production use.

## Test After Applying

1. Create a text element - should appear centered
2. Double-click to edit - should be instant
3. Type text - should update live without placeholder
4. Click away - text should persist
5. Select and delete - should work reliably

These minimal changes should resolve the main interaction issues!