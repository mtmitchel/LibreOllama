import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Container } from '@pixi/react';
import { useCanvasStore, CanvasElement, CanvasState } from '../stores/canvasStore';
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

  // Direct access to store actions (these are stable)
  const {
    addElement,
    updateElement,
    updateElementContent,
    setSelectedElementIds,
    setActiveTool,
    setIsEditingText,
    setTextFormattingState,
    addToHistory,
    clearSelection,
    deleteElement,
  } = useCanvasStore.getState();

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


  // Component mounting debug and ResizeObserver setup
  useEffect(() => {
    console.log('Canvas component mounted - Stage should only mount once');
    
    const container = canvasContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        console.log('Canvas size changed:', { width, height });
        setCanvasSize({ width, height });
      }
    });

    resizeObserver.observe(container);
    return () => {
      console.log('Canvas component unmounting');
      resizeObserver.disconnect();
    };
  }, []); // Empty deps ensures this only runs once

  // Direct element creation function
  const createElementDirectly = useCallback((elementData: Partial<CanvasElement>) => {
    console.log('Creating element directly:', elementData);
    
    if (!canvasContainerRef.current) {
      console.warn('Canvas container ref not available');
      return;
    }
    
    const { pan: currentPan, zoom: currentZoom, elements: currentElements } = useCanvasStore.getState();
    console.log('Current store state before creation:', {
      elementCount: Object.keys(currentElements).length,
      pan: currentPan,
      zoom: currentZoom
    });
    
    const defaultWidth = elementData.type === 'text' || elementData.type === 'sticky-note' ? 150 : 100;
    const defaultHeight = elementData.type === 'text' || elementData.type === 'sticky-note' ? 50 : 100;

    // Calculate center of viewport for new elements
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const centerX = (rect.width / 2 - currentPan.x) / currentZoom;
    const centerY = (rect.height / 2 - currentPan.y) / currentZoom;

    // Special handling for line elements
    const isLineElement = elementData.type === 'line';
    const lineStartX = isLineElement ? centerX - 50 : centerX - defaultWidth / 2;
    const lineStartY = isLineElement ? centerY : centerY - defaultHeight / 2;
    const lineEndX = isLineElement ? centerX + 50 : undefined;
    const lineEndY = isLineElement ? centerY : undefined;

    const newElement: CanvasElement = {
      id: generateId(),
      x: elementData.x ?? lineStartX,
      y: elementData.y ?? lineStartY,
      x2: isLineElement ? (elementData.x2 ?? lineEndX) : undefined,
      y2: isLineElement ? (elementData.y2 ?? lineEndY) : undefined,
      width: elementData.width ?? (isLineElement ? undefined : defaultWidth),
      height: elementData.height ?? (isLineElement ? undefined : defaultHeight),
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

    console.log('Created new element:', newElement);
    
    addElement(newElement);
    addToHistory({ ...currentElements, [newElement.id]: newElement });
    setSelectedElementIds([newElement.id]);
    
    // Verify element was added to store
    setTimeout(() => {
      const updatedState = useCanvasStore.getState();
      console.log('Store state after element creation:', {
        elementCount: Object.keys(updatedState.elements).length,
        newElementExists: !!updatedState.elements[newElement.id],
        selectedIds: updatedState.selectedElementIds
      });
    }, 0);
    
    if (newElement.type === 'text') {
      setIsEditingText(newElement.id);
      // For new text elements, start with empty content so user can type immediately
      setEditingTextValue('');
      // Update the element to have empty content initially
      updateElement(newElement.id, { content: '' });
    }
  }, [generateId, addElement, addToHistory, setSelectedElementIds, setIsEditingText]);

  // Text formatting toolbar is now handled by text selection in individual components

  // Handle double-click to enter text editing mode
  const handleElementDoubleClick = useCallback((elementId: string) => {
    const element = elements[elementId];
    if (element && (element.type === 'text' || element.type === 'sticky-note')) {
      setIsEditingText(elementId);
      setEditingTextValue(element.content || '');
      setTextFormattingState(false); // Hide toolbar when editing
    }
  }, [elements, setIsEditingText, setTextFormattingState]);

  // Text formatting handlers
  const handleToggleFormat = useCallback((elementId: string, formatType: 'isBold' | 'isItalic' | 'isBulletList') => {
    const element = elements[elementId];
    if (element) {
      updateElement(elementId, { [formatType]: !element[formatType] });
      addToHistory(useCanvasStore.getState().elements);
    }
  }, [elements, updateElement, addToHistory]);

  const handleSetFontSize = useCallback((elementId: string, fontSize: 'small' | 'medium' | 'large') => {
    updateElement(elementId, { fontSize });
    addToHistory(useCanvasStore.getState().elements);
  }, [updateElement, addToHistory]);

  const handleSetAlignment = useCallback((elementId: string, alignment: 'left' | 'center' | 'right') => {
    updateElement(elementId, { textAlignment: alignment });
    addToHistory(useCanvasStore.getState().elements);
  }, [updateElement, addToHistory]);

  const handleSetUrl = useCallback((elementId: string) => {
    const element = elements[elementId];
    if (element) {
      const currentUrl = element.url || '';
      const newUrl = prompt('Enter URL:', currentUrl);
      if (newUrl !== null) {
        updateElement(elementId, { url: newUrl || undefined });
        addToHistory(useCanvasStore.getState().elements);
      }
    }
  }, [elements, updateElement, addToHistory]);

  const handleUpdateContent = useCallback((elementId: string, content: string) => {
    updateElement(elementId, { content });
    addToHistory(useCanvasStore.getState().elements);
  }, [updateElement, addToHistory]);

  const { effectiveTheme } = useTheme();
  
  // Get theme-aware colors, recompute when theme changes
  const themeColors = useMemo(() => getThemeColors(), [effectiveTheme]);

  return (
    <div className="canvas-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Direct creation toolbar - single click creates elements */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 bg-bg-surface border border-border-default p-3 rounded-lg shadow-xl">
        <button
          onClick={() => setActiveTool('select')}
          className={`px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            activeTool === 'select'
              ? 'bg-accent-primary text-white'
              : 'bg-bg-tertiary text-text-primary hover:bg-bg-elevated'
          }`}
        >
          Select
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'text' } as Partial<CanvasElement>)}
          className="px-3 py-2 rounded-md bg-bg-tertiary text-text-primary hover:bg-bg-elevated transition-colors text-sm font-medium"
        >
          Add Text
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'sticky-note' } as Partial<CanvasElement>)}
          className="px-3 py-2 rounded-md bg-bg-tertiary text-text-primary hover:bg-bg-elevated transition-colors text-sm font-medium"
        >
          Add Note
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'rectangle' } as Partial<CanvasElement>)}
          className="px-3 py-2 rounded-md bg-bg-tertiary text-text-primary hover:bg-bg-elevated transition-colors text-sm font-medium"
        >
          Add Rectangle
        </button>
        <button
          onClick={() => createElementDirectly({ type: 'line' } as Partial<CanvasElement>)}
          className="px-3 py-2 rounded-md bg-bg-tertiary text-text-primary hover:bg-bg-elevated transition-colors text-sm font-medium"
        >
          Add Line
        </button>
        <button
          onClick={() => setActiveTool('pen')}
          className={`px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            activeTool === 'pen'
              ? 'bg-accent-primary text-white'
              : 'bg-bg-tertiary text-text-primary hover:bg-bg-elevated'
          }`}
        >
          Pen
        </button>
        <button
          onClick={() => {
            console.log('Delete button clicked, selected elements:', selectedElementIds);
            handleDeleteButtonClick();
          }}
          disabled={selectedElementIds.length === 0}
          className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors text-sm font-medium ${
            selectedElementIds.length > 0
              ? 'bg-error text-white hover:opacity-90'
              : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
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
            backgroundColor: themeColors.canvasBackground,
            backgroundAlpha: 1,
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
            {visibleElements.map(element => {
              console.log('Rendering element:', element.id, element.type, { x: element.x, y: element.y });
              return (
                <CanvasElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onMouseDown={handleElementMouseDown}
                  onDoubleClick={() => handleElementDoubleClick(element.id)}
                />
              );
            })}
            
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
        {isEditingText && (() => {
          const editingElement = elements[isEditingText];
          if (!editingElement) {
            console.warn('Editing element not found:', isEditingText);
            return null;
          }
          
          const textareaX = (editingElement.x || 0) * zoom + pan.x;
          const textareaY = (editingElement.y || 0) * zoom + pan.y;
          const textareaWidth = (editingElement.width || 200) * zoom;
          const textareaHeight = (editingElement.height || 100) * zoom;
          
          console.log('Text editing positioning:', {
            elementId: isEditingText,
            element: { x: editingElement.x, y: editingElement.y, width: editingElement.width, height: editingElement.height },
            zoom, pan,
            textareaPosition: { x: textareaX, y: textareaY, width: textareaWidth, height: textareaHeight }
          });
          
          return (
            <textarea
              ref={textAreaRef}
              value={editingTextValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditingTextValue(newValue);
                // Update element content immediately for live updates
                updateElement(isEditingText, { content: newValue });
              }}
              onBlur={(e) => {
                // Only commit and exit if the blur is not due to clicking on canvas elements
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (!relatedTarget || (!relatedTarget.closest('.canvas-container') && !relatedTarget.closest('button'))) {
                  console.log('Text editing blur - committing changes');
                  if (isEditingText && textAreaRef.current) {
                    updateElement(isEditingText, { content: textAreaRef.current.value });
                    addToHistory(useCanvasStore.getState().elements);
                  }
                  setIsEditingText(null);
                  setTextFormattingState(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  console.log('Text editing enter - committing changes');
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
                left: `${textareaX}px`,
                top: `${textareaY}px`,
                width: `${textareaWidth}px`,
                height: `${textareaHeight}px`,
                fontSize: `${getTextStyles(editingElement).fontSize}`,
                fontFamily: 'var(--font-sans)',
                fontWeight: editingElement.isBold ? 'bold' : 'normal',
                fontStyle: editingElement.isItalic ? 'italic' : 'normal',
                textAlign: editingElement.textAlignment || 'left',
                color: editingElement.color || 'var(--text-primary)',
                backgroundColor: editingElement.type === 'sticky-note'
                  ? (editingElement.backgroundColor || '#FFFFF0')
                  : 'transparent',
                border: `1px solid var(--border-subtle)`,
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                zIndex: 1000,
              }}
              autoFocus
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
