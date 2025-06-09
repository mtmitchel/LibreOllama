// Fix for Element Creation Position
// Location: Around line 109 in Canvas.tsx, in createElementDirectly function

// BEFORE:
// x: elementData.x ?? (100 - currentPan.x) / currentZoom,
// y: elementData.y ?? (100 - currentPan.y) / currentZoom,

// AFTER:
const createElementDirectly = useCallback((elementData: Partial<CanvasElement>) => {
  console.log('Creating element directly:', elementData);
  
  if (!canvasContainerRef.current) {
    console.warn('Canvas container ref not available');
    return;
  }
  
  const { pan: currentPan, zoom: currentZoom, elements: currentElements } = useCanvasStore.getState();
  
  // Calculate center of viewport for new elements
  const rect = canvasContainerRef.current.getBoundingClientRect();
  const centerX = (rect.width / 2 - currentPan.x) / currentZoom;
  const centerY = (rect.height / 2 - currentPan.y) / currentZoom;
  
  const defaultWidth = elementData.type === 'text' || elementData.type === 'sticky-note' ? 150 : 100;
  const defaultHeight = elementData.type === 'text' || elementData.type === 'sticky-note' ? 50 : 100;

  const newElement: CanvasElement = {
    id: generateId(),
    x: elementData.x ?? centerX - defaultWidth / 2,  // Center the element
    y: elementData.y ?? centerY - defaultHeight / 2, // Center the element
    width: elementData.width ?? defaultWidth,
    height: elementData.height ?? defaultHeight,
    // ... rest of the properties
  };