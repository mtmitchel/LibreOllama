// Fix for Double-Click Detection in TextElement
// Location: TextElement.tsx

// SIMPLIFIED VERSION:
const handlePointerDown = useCallback((e: any) => {
  // Always handle single click immediately
  if (onMouseDown) {
    onMouseDown(e, element.id);
  }
}, [onMouseDown, element.id]);

const handlePointerTap = useCallback((e: any) => {
  // Use Pixi's tap event for double-click detection
  const now = Date.now();
  const timeDiff = now - lastClickTime.current;
  
  if (timeDiff < 300 && onDoubleClick) {
    e.stopPropagation();
    onDoubleClick();
  }
  
  lastClickTime.current = now;
}, [onDoubleClick]);

// In the Text component:
<Text
  x={element.x}
  y={element.y}
  text={element.content || 'Text'}
  style={textStyle}
  interactive={true}
  pointerdown={handlePointerDown}  // Immediate selection
  pointertap={handlePointerTap}     // Double-click detection
  cursor="text"
/>