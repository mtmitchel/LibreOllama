import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Container } from '@pixi/react';
import { useCanvasStore, CanvasElement, CanvasState } from '../stores/canvasStore';
import { useViewportCulling } from '../hooks/useViewportCulling';
import CanvasElementRenderer from '../components/canvas/CanvasElementRenderer';
import CanvasGrid from '../components/canvas/CanvasGrid';
import { useCanvasEvents } from '../hooks/canvas/useCanvasEvents';
import { Trash2 } from 'lucide-react';

const Canvas = () => {
  // Use individual selectors to prevent object recreation and infinite loops
  const elements = useCanvasStore((state: CanvasState) => state.elements);
  const selectedElementIds = useCanvasStore((state: CanvasState) => state.selectedElementIds);
  const activeTool = useCanvasStore((state: CanvasState) => state.activeTool);
  const zoom = useCanvasStore((state: CanvasState) => state.zoom);
  const pan = useCanvasStore((state: CanvasState) => state.pan);
  const isEditingText = useCanvasStore((state: CanvasState) => state.isEditingText);
  const isDrawing = useCanvasStore((state: CanvasState) => state.isDrawing);
  const previewElement = useCanvasStore((state: CanvasState) => state.previewElement);
  
  // Create stable elements array using useMemo with proper dependencies
  const elementsArray = useMemo(() => Object.values(elements), [elements]);

  // Get store actions directly (these are stable function references)
  const addElement = useCanvasStore((state: CanvasState) => state.addElement);
  const updateElement = useCanvasStore((state: CanvasState) => state.updateElement);
  const setSelectedElementIds = useCanvasStore((state: CanvasState) => state.setSelectedElementIds);
  const setActiveTool = useCanvasStore((state: CanvasState) => state.setActiveTool);
  const setIsEditingText = useCanvasStore((state: CanvasState) => state.setIsEditingText);
  const setTextFormattingState = useCanvasStore((state: CanvasState) => state.setTextFormattingState);
  const addToHistory = useCanvasStore((state: CanvasState) => state.addToHistory);

  const canvasContainerRef = useRef<HTMLDivElement>(null); // For overall workspace dimensions and DOM events
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Use viewport culling with container measurements
  const { visibleElements } = useViewportCulling({
    elements: elementsArray, // Use the memoized array
    canvasSize: canvasSize, // Use the state variable
    zoomLevel: zoom, 
    panOffset: pan, 
  });

  // Utility function to convert screen coordinates to canvas coordinates
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!canvasContainerRef.current) return { x: 0, y: 0 };
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  }, [pan, zoom]);

  // Utility to generate unique IDs
  const generateId = useCallback(() => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, []);

  // Initialize canvas events hook
  const { handleElementMouseDown, handleCanvasMouseDown, handleDeleteButtonClick } = useCanvasEvents({
    canvasContainerRef,
    textAreaRef,
    getCanvasCoordinates,
    generateId
  });

  // Get text styles for elements
  const getTextStyles = useCallback((element: CanvasElement) => {
    return {
      fontSize: element.fontSize === 'small' ? '12px' :
                element.fontSize === 'large' ? '24px' : '16px',
      fontWeight: element.isBold ? 'bold' : 'normal',
      fontStyle: element.isItalic ? 'italic' : 'normal',
      textAlign: element.textAlignment || 'left',
      color: element.color || '#000000',
    };
  }, []);


  // ResizeObserver to track canvas container size changes
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Direct element creation function
  const createElementDirectly = useCallback((elementData: Partial<CanvasElement>) => {
    if (!canvasContainerRef.current) return;
    // const canvasRect = canvasContainerRef.current.getBoundingClientRect(); // Not strictly needed if positioning is relative to store state
    const { pan: currentPan, zoom: currentZoom, elements: currentElements } = useCanvasStore.getState();
    
    const defaultWidth = elementData.type === 'text' || elementData.type === 'sticky-note' ? 150 : 100;
    const defaultHeight = elementData.type === 'text' || elementData.type === 'sticky-note' ? 50 : 100;

    const newElement: CanvasElement = {
      id: generateId(),
      x: elementData.x ?? (100 - currentPan.x) / currentZoom, // Use provided x or default
      y: elementData.y ?? (100 - currentPan.y) / currentZoom, // Use provided y or default
      width: elementData.width ?? defaultWidth,
      height: elementData.height ?? defaultHeight,
      color: elementData.color ?? '#000000',
      backgroundColor: elementData.backgroundColor ?? (elementData.type === 'sticky-note' ? '#FFFFE0' : 'transparent'),
      fontSize: elementData.fontSize ?? 'medium',
      isBold: elementData.isBold ?? false,
      isItalic: elementData.isItalic ?? false,
      textAlignment: elementData.textAlignment ?? 'left',
      strokeColor: elementData.strokeColor ?? (['rectangle', 'line', 'drawing'].includes(elementData.type || '') ? '#000000' : undefined),
      strokeWidth: elementData.strokeWidth ?? (['rectangle', 'line', 'drawing'].includes(elementData.type || '') ? 2 : undefined),
      points: elementData.points ?? (elementData.type === 'line' || elementData.type === 'drawing' ? [] : undefined),
      isLocked: elementData.isLocked ?? false,
      type: elementData.type || 'rectangle', // Ensure type is always set
      content: elementData.content || (elementData.type === 'text' ? 'Text' : ''),
      ...elementData, // Spread last to allow overrides, but ensure core properties above have defaults
    };

    addElement(newElement);
    addToHistory({ ...currentElements, [newElement.id]: newElement });
    setSelectedElementIds([newElement.id]);
    if (newElement.type === 'text') {
      setIsEditingText(newElement.id);
      // If new text element, set editingTextValue from its content or default if empty
      setEditingTextValue(newElement.content || ''); 
    }
  }, [generateId, addElement, addToHistory, setSelectedElementIds, setIsEditingText]);


  return (
    <div className="canvas-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Direct creation toolbar - single click creates elements */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 bg-white p-2 rounded-lg shadow-lg">
        <button
          onClick={() => setActiveTool('select')}
          className={`p-2 rounded transition-colors ${activeTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Select
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'text' } as Partial<CanvasElement>)}
          className="p-2 rounded bg-gray-200 hover:bg-blue-100 transition-colors active:bg-blue-200"
        >
          Add Text
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'sticky-note' } as Partial<CanvasElement>)}
          className="p-2 rounded bg-gray-200 hover:bg-yellow-100 transition-colors active:bg-yellow-200"
        >
          Add Note
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'rectangle' } as Partial<CanvasElement>)}
          className="p-2 rounded bg-gray-200 hover:bg-blue-100 transition-colors active:bg-blue-200"
        >
          Add Rectangle
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'line' } as Partial<CanvasElement>)}
          className="p-2 rounded bg-gray-200 hover:bg-blue-100 transition-colors active:bg-blue-200"
        >
          Add Line
        </button>
        <button
          onClick={() => setActiveTool('pen')}
          className={`p-2 rounded transition-colors ${activeTool === 'pen' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Pen
        </button>
        <button
          onClick={handleDeleteButtonClick}
          disabled={selectedElementIds.length === 0}
          className={`p-2 rounded flex items-center gap-1 transition-colors ${
            selectedElementIds.length > 0
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Delete selected element (Delete key)"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div 
        className="canvas-workspace" 
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        ref={canvasContainerRef}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Pixi.js Stage for WebGL rendering */}
        <Stage
          width={canvasSize.width}
          height={canvasSize.height}
          options={{
            backgroundColor: 0x1a1b1e,
            antialias: true,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
          }}
        >
          <Container
            x={pan.x}
            y={pan.y}
            scale={{ x: zoom, y: zoom }}
          >
            {/* Render all visible elements */}
            {visibleElements.map(element => (
              <CanvasElementRenderer
                key={element.id}
                element={element}
                isSelected={selectedElementIds.includes(element.id)}
                onMouseDown={handleElementMouseDown}
              />
            ))}
            
            {/* Preview element during drawing */}
            {isDrawing && previewElement && (
              <CanvasElementRenderer
                key="preview"
                element={previewElement}
                isSelected={false}
                onMouseDown={() => {}} // No interaction for preview
              />
            )}
          </Container>
        </Stage>
        
        {/* Grid overlay */}
        <CanvasGrid zoomLevel={zoom} panOffset={pan} />
        
        {/* Text editing textarea - still DOM-based for text input */}
        {isEditingText && (
          <textarea
            ref={textAreaRef}
            value={editingTextValue}
            onChange={(e) => setEditingTextValue(e.target.value)}
            onBlur={() => {
              if (isEditingText && textAreaRef.current) {
                updateElement(isEditingText, { content: textAreaRef.current.value });
                addToHistory(useCanvasStore.getState().elements);
              }
              setIsEditingText(null);
              setTextFormattingState(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isEditingText && textAreaRef.current) {
                  updateElement(isEditingText, { content: textAreaRef.current.value });
                  addToHistory(useCanvasStore.getState().elements);
                }
                setIsEditingText(null);
                setTextFormattingState(false);
              }
            }}
            style={{
              position: 'absolute',
              left: `${(elements[isEditingText]?.x || 0) * zoom + pan.x}px`,
              top: `${(elements[isEditingText]?.y || 0) * zoom + pan.y}px`,
              width: `${(elements[isEditingText]?.width || 200) * zoom}px`,
              height: `${(elements[isEditingText]?.height || 100) * zoom}px`,
              fontSize: `${getTextStyles(elements[isEditingText] || {} as CanvasElement).fontSize}`,
              fontFamily: 'Arial, sans-serif',
              fontWeight: elements[isEditingText]?.isBold ? 'bold' : 'normal',
              fontStyle: elements[isEditingText]?.isItalic ? 'italic' : 'normal',
              textAlign: elements[isEditingText]?.textAlignment || 'left',
              color: elements[isEditingText]?.color || '#000000',
              backgroundColor: elements[isEditingText]?.type === 'sticky-note' 
                ? (elements[isEditingText]?.backgroundColor || '#FFFFE0')
                : 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              zIndex: 1000,
            }}
            autoFocus
          />
        )}
      </div>
    </div>
  );
};

export default Canvas;
