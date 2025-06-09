import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Container } from '@pixi/react';
import { useCanvasStore, CanvasElement } from '../stores/canvasStore';
import { useViewportCulling } from '../hooks/useViewportCulling';
import CanvasElementRenderer from '../components/canvas/CanvasElementRenderer';
import CanvasGrid from '../components/canvas/CanvasGrid';
import { useCanvasEvents } from '../hooks/canvas/useCanvasEvents';
import { TextFormattingToolbar } from '../components/canvas/TextFormattingToolbar';
import { useTheme } from '../hooks/useTheme';
import { getThemeColors } from '../lib/theme-utils';
import { Trash2 } from 'lucide-react';

const Canvas = () => {
  // Use selectors for state values that trigger re-renders
  const elements = useCanvasStore((state) => state.elements);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const zoom = useCanvasStore((state) => state.zoom);
  const pan = useCanvasStore((state) => state.pan);
  const isEditingText = useCanvasStore((state) => state.isEditingText);
  const isDrawing = useCanvasStore((state) => state.isDrawing);
  const previewElement = useCanvasStore((state) => state.previewElement);
  const showTextFormatting = useCanvasStore((state) => state.showTextFormatting);
  const textFormattingPosition = useCanvasStore((state) => state.textFormattingPosition);
  const selectedTextElement = useCanvasStore((state) => state.selectedTextElement);

  // Memoize the elements array for stability
  const elementsArray = useMemo(() => Object.values(elements), [elements]);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const isElementClicked = useRef(false);

  // Setup viewport culling
  const { visibleElements } = useViewportCulling({
    elements: elementsArray,
    canvasSize: canvasSize,
    zoomLevel: zoom,
    panOffset: pan,
  });

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!canvasContainerRef.current) return { x: 0, y: 0 };
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  }, [pan, zoom]);

  const generateId = useCallback(() => crypto.randomUUID(), []);

  // Initialize canvas events hook
  const { handleCanvasMouseDown, handleDeleteButtonClick } = useCanvasEvents({
    canvasContainerRef,
    textAreaRef,
    getCanvasCoordinates,
    generateId,
  });
  
  // Element-specific mouse down handler
  const handleElementMouseDown = useCallback((e: any, elementId: string) => {
    isElementClicked.current = true; // Flag that an element was clicked
    e.stopPropagation();

    const { activeTool: currentActiveTool, isEditingText: currentEditingText, selectElement, setIsEditingText, addToHistory } = useCanvasStore.getState();

    if (currentActiveTool !== 'select') return;
    
    // Handle text editing exit
    if (currentEditingText && currentEditingText !== elementId) {
      addToHistory(useCanvasStore.getState().elements);
      setIsEditingText(null);
    }
    
    // Handle selection
    const shiftPressed = e.data?.originalEvent?.shiftKey || false;
    if (shiftPressed) {
      selectElement(elementId, true);
    } else if (!selectedElementIds.includes(elementId)) {
      useCanvasStore.getState().setSelectedElementIds([elementId]);
    }
    
    // Prepare for dragging
    const { elements: currentElements, selectedElementIds: currentSelectedIds, setDragState } = useCanvasStore.getState();
    const startDragCoords = { x: e.global.x, y: e.global.y };
    const initialPositions: Record<string, { x: number; y: number }> = {};
    currentSelectedIds.forEach(id => {
        if (currentElements[id]) {
            initialPositions[id] = { x: currentElements[id].x, y: currentElements[id].y };
        }
    });

    setDragState(true, startDragCoords, initialPositions);
  }, [selectedElementIds]);
  
    // This is the main canvas mousedown, we check our flag here.
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    // If an element was just clicked, do nothing on the canvas. Reset the flag.
    if (isElementClicked.current) {
        isElementClicked.current = false;
        return;
    }
    // Otherwise, handle canvas click as normal (deselecting, panning, etc.)
    handleCanvasMouseDown(e);
  };
  
  // Handle double-click to start text editing
  const handleElementDoubleClick = useCallback((elementId: string) => {
    const element = elements[elementId];
    if (element && (element.type === 'text' || element.type === 'sticky-note')) {
      useCanvasStore.getState().setIsEditingText(elementId);
    }
  }, [elements]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ width, height });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const createElementDirectly = useCallback((elementData: Partial<CanvasElement>) => {
    if (!canvasContainerRef.current) return;
    
    const { pan: currentPan, zoom: currentZoom, elements: currentElements, addElement, addToHistory, setSelectedElementIds, setIsEditingText } = useCanvasStore.getState();
    const defaultWidth = 150;
    const defaultHeight = 100;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    const centerX = (rect.width / 2 - currentPan.x) / currentZoom;
    const centerY = (rect.height / 2 - currentPan.y) / currentZoom;
    
    const newElement: CanvasElement = {
      id: generateId(),
      x: centerX - defaultWidth / 2,
      y: centerY - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      color: '#000000',
      backgroundColor: elementData.type === 'sticky-note' ? '#FFFFE0' : 'transparent',
      content: elementData.type === 'text' ? 'New Text' : '',
      isLocked: false,
      ...elementData, // Apply specific type and other properties
      // Ensure line properties are handled correctly
      x2: elementData.type === 'line' ? centerX + 50 : undefined,
      y2: elementData.type === 'line' ? centerY : undefined,
      strokeColor: ['rectangle', 'line'].includes(elementData.type || '') ? '#000000' : undefined,
      strokeWidth: ['rectangle', 'line'].includes(elementData.type || '') ? 2 : undefined,
    };

    addElement(newElement);
    addToHistory({ ...currentElements, [newElement.id]: newElement });
    setSelectedElementIds([newElement.id]);
    
    if (newElement.type === 'text') {
      setIsEditingText(newElement.id);
    }
  }, [generateId]);

  const { effectiveTheme } = useTheme();
  const themeColors = useMemo(() => getThemeColors(), [effectiveTheme]);

  // Text formatting handlers (simplified versions for the refactored approach)
  const handleToggleFormat = useCallback((elementId: string, formatType: 'isBold' | 'isItalic' | 'isBulletList') => {
    const { elements, updateElement, addToHistory } = useCanvasStore.getState();
    const element = elements[elementId];
    if (element) {
      updateElement(elementId, { [formatType]: !element[formatType] });
      addToHistory(useCanvasStore.getState().elements);
    }
  }, []);

  const handleSetFontSize = useCallback((elementId: string, fontSize: 'small' | 'medium' | 'large') => {
    const { updateElement, addToHistory } = useCanvasStore.getState();
    updateElement(elementId, { fontSize });
    addToHistory(useCanvasStore.getState().elements);
  }, []);

  const handleSetAlignment = useCallback((elementId: string, alignment: 'left' | 'center' | 'right') => {
    const { updateElement, addToHistory } = useCanvasStore.getState();
    updateElement(elementId, { textAlignment: alignment });
    addToHistory(useCanvasStore.getState().elements);
  }, []);

  const handleSetUrl = useCallback((elementId: string) => {
    const { elements, updateElement, addToHistory } = useCanvasStore.getState();
    const element = elements[elementId];
    if (element) {
      const currentUrl = element.url || '';
      const newUrl = prompt('Enter URL:', currentUrl);
      if (newUrl !== null) {
        updateElement(elementId, { url: newUrl || undefined });
        addToHistory(useCanvasStore.getState().elements);
      }
    }
  }, []);

  const handleUpdateContent = useCallback((elementId: string, content: string) => {
    const { updateElement, addToHistory } = useCanvasStore.getState();
    updateElement(elementId, { content });
    addToHistory(useCanvasStore.getState().elements);
  }, []);

  // When editing text, focus the textarea
  useEffect(() => {
    if (isEditingText && textAreaRef.current) {
        textAreaRef.current.focus();
        // Select all text when starting to edit for easy replacement
        textAreaRef.current.select();
    }
  }, [isEditingText]);

  return (
    <div className="canvas-container" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 bg-bg-surface border border-border-default p-3 rounded-lg shadow-xl">
        {/* Toolbar buttons */}
        <button onClick={() => useCanvasStore.getState().setActiveTool('select')} className={`px-3 py-2 rounded-md transition-colors text-sm font-medium ${activeTool === 'select' ? 'bg-accent-primary text-white' : 'bg-bg-tertiary text-text-primary hover:bg-bg-elevated'}`}>Select</button>
        <button onClick={() => createElementDirectly({ type: 'text' })} className="px-3 py-2 rounded-md bg-bg-tertiary text-text-primary hover:bg-bg-elevated transition-colors text-sm font-medium">Add Text</button>
        <button onClick={() => createElementDirectly({ type: 'sticky-note' })} className="px-3 py-2 rounded-md bg-bg-tertiary text-text-primary hover:bg-bg-elevated transition-colors text-sm font-medium">Add Note</button>
        <button onClick={() => createElementDirectly({ type: 'rectangle' })} className="px-3 py-2 rounded-md bg-bg-tertiary text-text-primary hover:bg-bg-elevated transition-colors text-sm font-medium">Add Rectangle</button>
        <button onClick={() => createElementDirectly({ type: 'line' })} className="px-3 py-2 rounded-md bg-bg-tertiary text-text-primary hover:bg-bg-elevated transition-colors text-sm font-medium">Add Line</button>
        <button onClick={handleDeleteButtonClick} disabled={selectedElementIds.length === 0} className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors text-sm font-medium ${selectedElementIds.length > 0 ? 'bg-error text-white hover:opacity-90' : 'bg-bg-tertiary text-text-muted cursor-not-allowed'}`} title="Delete selected element (Delete key)">
          <Trash2 size={16} />
        </button>
      </div>
      
      <div 
        className="canvas-workspace" 
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        ref={canvasContainerRef}
        onMouseDown={onCanvasMouseDown} // Use our new handler
      >
        <Stage
          width={canvasSize.width}
          height={canvasSize.height}
          options={{
            backgroundColor: 0xffffff, // FIX: Hardcode to white for now
            backgroundAlpha: 1,
            antialias: true,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
          }}
        >
          <Container x={pan.x} y={pan.y} scale={{ x: zoom, y: zoom }}>
            <CanvasGrid zoomLevel={zoom} panOffset={pan} />
            {visibleElements.map(element => (
              <CanvasElementRenderer
                key={element.id}
                element={element}
                isSelected={selectedElementIds.includes(element.id)}
                onMouseDown={handleElementMouseDown}
                onDoubleClick={() => handleElementDoubleClick(element.id)}
              />
            ))}
            {isDrawing && previewElement && <CanvasElementRenderer key="preview" element={previewElement} isSelected={false} onMouseDown={() => {}} />}
          </Container>
        </Stage>
        
        {isEditingText && (() => {
          const editingElement = elements[isEditingText];
          if (!editingElement) return null;
          
          const textareaX = (editingElement.x || 0) * zoom + pan.x;
          const textareaY = (editingElement.y || 0) * zoom + pan.y;
          const textareaWidth = (editingElement.width || 0) * zoom;
          const textareaHeight = (editingElement.height || 0) * zoom;

          return (
            <textarea
              ref={textAreaRef}
              className="canvas-text-editor" // Added a class for styling
              value={editingElement.content || ''}
              onChange={(e) => useCanvasStore.getState().updateElement(isEditingText, { content: e.target.value })}
              onBlur={() => {
                useCanvasStore.getState().addToHistory(useCanvasStore.getState().elements);
                useCanvasStore.getState().setIsEditingText(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
                  e.preventDefault();
                  textAreaRef.current?.blur(); // Trigger the onBlur handler to save and exit
                }
              }}
              style={{
                position: 'absolute',
                left: `${textareaX}px`,
                top: `${textareaY}px`,
                width: `${textareaWidth}px`,
                height: `${textareaHeight}px`,
                fontSize: `${(editingElement.fontSize === 'small' ? 12 : editingElement.fontSize === 'large' ? 24 : 16) * zoom}px`,
                lineHeight: 1.2,
                fontFamily: 'var(--font-sans)',
                color: 'black',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                zIndex: 1000,
              }}
            />
          );
        })()}

        {/* Text Formatting Toolbar */}
        {showTextFormatting && textFormattingPosition && selectedTextElement && (
          <TextFormattingToolbar
            elementId={selectedTextElement}
            element={elements[selectedTextElement]}
            position={textFormattingPosition}
            onToggleFormat={handleToggleFormat}
            onSetFontSize={handleSetFontSize}
            onSetAlignment={handleSetAlignment}
            onSetUrl={handleSetUrl}
            onUpdateContent={handleUpdateContent}
          />
        )}
      </div>
    </div>
  );
};

export default Canvas;
