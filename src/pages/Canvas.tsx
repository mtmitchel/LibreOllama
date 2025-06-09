import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Container } from '@pixi/react';
import { useCanvasStore, CanvasElement } from '../stores/canvasStore';
import { useViewportCulling } from '../hooks/useViewportCulling';
import CanvasElementRenderer from '../components/canvas/CanvasElementRenderer';
import CanvasGrid from '../components/canvas/CanvasGrid';
import { useCanvasEvents } from '../hooks/canvas/useCanvasEvents';
import { TextFormattingToolbar } from '../components/canvas/TextFormattingToolbar';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';

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
  const history = useCanvasStore((state) => state.history);
  const historyIndex = useCanvasStore((state) => state.historyIndex);

  // Memoize the elements array for stability
  const elementsArray = useMemo(() => Object.values(elements), [elements]);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const isElementClicked = useRef(false);
  
  // CanvasToolbar state
  const [selectedShape, setSelectedShape] = useState('');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);
  
  // Compute undo/redo availability
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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

    const { activeTool: currentActiveTool, isEditingText: currentEditingText, selectElement, setIsEditingText, addToHistory, setSelectedElementIds, setDragState } = useCanvasStore.getState();

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
      setSelectedElementIds([elementId]);
    }
    
    // Prepare for dragging
    const { elements: currentElements, selectedElementIds: currentSelectedIds } = useCanvasStore.getState();
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
    
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const centerX = (rect.width / 2 - currentPan.x) / currentZoom;
    const centerY = (rect.height / 2 - currentPan.y) / currentZoom;
    
    // Set element-specific dimensions and properties
    let defaultWidth = 150;
    let defaultHeight = 100;
    let additionalProps: Partial<CanvasElement> = {};
    
    switch (elementData.type) {
      case 'text':
        defaultWidth = 200;
        defaultHeight = 50;
        additionalProps = {
          content: 'Click to edit text',
          color: '#000000',
          fontSize: 'medium',
          textAlignment: 'left'
        };
        break;
      case 'sticky-note':
        defaultWidth = 200;
        defaultHeight = 150;
        additionalProps = {
          content: 'New sticky note',
          backgroundColor: '#FFFFE0',
          color: '#000000',
          fontSize: 'medium'
        };
        break;
      case 'rectangle':
      case 'square':
        defaultWidth = elementData.type === 'square' ? 100 : 150;
        defaultHeight = elementData.type === 'square' ? 100 : 100;
        additionalProps = {
          backgroundColor: 'transparent',
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'circle':
        defaultWidth = 100;
        defaultHeight = 100;
        additionalProps = {
          backgroundColor: 'transparent',
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'triangle':
      case 'hexagon':
      case 'star':
        defaultWidth = 100;
        defaultHeight = 100;
        additionalProps = {
          backgroundColor: 'transparent',
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'line':
        defaultWidth = 100;
        defaultHeight = 0;
        additionalProps = {
          x2: centerX + 100,
          y2: centerY,
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'arrow':
        defaultWidth = 100;
        defaultHeight = 0;
        additionalProps = {
          x2: centerX + 100,
          y2: centerY,
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'drawing':
        defaultWidth = 100;
        defaultHeight = 100;
        additionalProps = {
          points: [],
          strokeColor: '#000000',
          strokeWidth: 2
        };
        break;
      case 'image':
        defaultWidth = 200;
        defaultHeight = 150;
        additionalProps = {
          imageUrl: '',
          imageName: 'Click to upload image'
        };
        break;
    }    const newElement: CanvasElement = {
      id: generateId(),
      type: elementData.type!,
      x: centerX - defaultWidth / 2,
      y: centerY - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      isLocked: false,
      ...additionalProps,
      ...elementData, // Override with any specific properties passed in
    };

    // Validate the new element before adding
    if (!newElement.id || !newElement.type || typeof newElement.x !== 'number' || typeof newElement.y !== 'number') {
      console.error('Canvas: Failed to create valid element:', newElement);
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`Canvas: Creating new ${newElement.type} element:`, newElement);
    }

    addElement(newElement);
    addToHistory({ ...currentElements, [newElement.id]: newElement });
    setSelectedElementIds([newElement.id]);
    
    // Auto-start text editing for text elements
    if (newElement.type === 'text' || newElement.type === 'sticky-note') {
      setIsEditingText(newElement.id);
    }
  }, [generateId]);

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
  // Handlers for CanvasToolbar
  const handleToolSelect = useCallback((toolId: string, event?: React.MouseEvent) => {
    if (toolId === 'shapes' && event) {
      // Handle shapes dropdown
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setDropdownPosition({
        left: rect.left,
        top: rect.top - 10
      });
      setShowShapeDropdown(!showShapeDropdown);
      return;
    }
    
    // Close dropdown when selecting other tools
    setShowShapeDropdown(false);
      // Handle other tools
    if (toolId === 'select') {
      useCanvasStore.getState().setActiveTool('select');
    } else if (toolId === 'delete') {
      handleDeleteButtonClick();
    } else if (toolId === 'pen') {
      // For pen tool, switch to drawing mode
      useCanvasStore.getState().setActiveTool('pen');
    } else {
      // For shape tools, create the element directly
      switch (toolId) {
        case 'text':
          createElementDirectly({ type: 'text' });
          break;
        case 'sticky-note':
          createElementDirectly({ type: 'sticky-note' });
          break;
        case 'rectangle':
          createElementDirectly({ type: 'rectangle' });
          break;
        case 'line':
          createElementDirectly({ type: 'line' });
          break;
        case 'circle':
          createElementDirectly({ type: 'circle' });
          break;
        case 'triangle':
          createElementDirectly({ type: 'triangle' });
          break;
        case 'star':
          createElementDirectly({ type: 'star' });
          break;
        case 'hexagon':
          createElementDirectly({ type: 'hexagon' });
          break;
        case 'arrow':
          createElementDirectly({ type: 'arrow' });
          break;
        case 'square':
          createElementDirectly({ type: 'square' });
          break;
        case 'image':
          createElementDirectly({ type: 'image' });
          break;
      }
    }
  }, [createElementDirectly, handleDeleteButtonClick, showShapeDropdown]);
  const handleShapeSelect = useCallback((shapeId: string) => {
    createElementDirectly({ type: shapeId as CanvasElement['type'] });
    setSelectedShape(shapeId);
    setShowShapeDropdown(false);
  }, [createElementDirectly]);

  // Additional handlers for CanvasToolbar
  const handleUndo = useCallback(() => {
    useCanvasStore.getState().undo();
  }, []);

  const handleRedo = useCallback(() => {
    useCanvasStore.getState().redo();
  }, []);

  const handleZoomIn = useCallback(() => {
    const { zoom: currentZoom, setZoom } = useCanvasStore.getState();
    setZoom(currentZoom * 1.1);
  }, []);

  const handleZoomOut = useCallback(() => {
    const { zoom: currentZoom, setZoom } = useCanvasStore.getState();
    setZoom(currentZoom / 1.1);
  }, []);
  // When editing text, focus the textarea
  useEffect(() => {
    if (isEditingText && textAreaRef.current) {
        textAreaRef.current.focus();
        // Select all text when starting to edit for easy replacement
        textAreaRef.current.select();
    }
  }, [isEditingText]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShapeDropdown(false);
      }
    };

    if (showShapeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShapeDropdown]);
  return (
    <div className="canvas-container" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Replace simple toolbar with comprehensive CanvasToolbar */}      <CanvasToolbar
        activeTool={activeTool}
        selectedShape={selectedShape}
        showShapeDropdown={showShapeDropdown}
        dropdownPosition={dropdownPosition}
        canUndo={canUndo}
        canRedo={canRedo}
        dropdownRef={dropdownRef}
        onToolSelect={handleToolSelect}
        onShapeSelect={handleShapeSelect}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={handleDeleteButtonClick}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
      
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
          }}        >          <Container x={pan.x} y={pan.y} scale={{ x: zoom, y: zoom }}>            <CanvasGrid zoomLevel={zoom} panOffset={pan} canvasSize={canvasSize} />
            {(() => {
              const filteredElements = visibleElements.filter(element => element && element.id && element.type);
              
              if (import.meta.env.DEV) {
                console.log(`Canvas: Rendering ${filteredElements.length} elements out of ${Object.keys(elements).length} total`);
                if (filteredElements.length !== Object.keys(elements).length) {
                  console.log('Canvas: Some elements filtered out by viewport culling or validation');
                }
              }
              
              return filteredElements.map(element => (
                <CanvasElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onMouseDown={handleElementMouseDown}
                  onDoubleClick={() => handleElementDoubleClick(element.id)}
                />
              ));
            })()}
            {isDrawing && previewElement && previewElement.type && (
              <CanvasElementRenderer 
                key="preview" 
                element={previewElement} 
                isSelected={false} 
                onMouseDown={() => {}} 
              />
            )}
          </Container>
        </Stage>
          {isEditingText && (() => {
          const editingElement = elements[isEditingText];
          if (!editingElement) {
            console.warn(`Canvas: Editing element "${isEditingText}" not found in elements`);
            return null;
          }
          
          // Calculate textarea position and size
          const textareaX = (editingElement.x || 0) * zoom + pan.x;
          const textareaY = (editingElement.y || 0) * zoom + pan.y;
          const textareaWidth = Math.max((editingElement.width || 200) * zoom, 100);
          const textareaHeight = Math.max((editingElement.height || 50) * zoom, 30);

          // Debug log for textarea positioning
          if (import.meta.env.DEV) {
            console.log(`Canvas: Textarea positioned at (${textareaX}, ${textareaY}) with size ${textareaWidth}x${textareaHeight}`);
          }

          return (            <textarea
              ref={textAreaRef}
              className="canvas-text-editor" // Added a class for styling
              value={editingElement.content || ''}
              onChange={(e) => {
                const newContent = e.target.value;
                useCanvasStore.getState().updateElement(isEditingText, { content: newContent });
                if (import.meta.env.DEV) {
                  console.log(`Canvas: Updated element "${isEditingText}" content to:`, newContent);
                }
              }}
              onMouseDown={(e) => {
                // Prevent canvas events from interfering with text selection
                e.stopPropagation();
              }}
              onBlur={() => {
                const { elements: currentElements } = useCanvasStore.getState();
                if (import.meta.env.DEV) {
                  console.log(`Canvas: Finishing text edit for element "${isEditingText}"`);
                }
                useCanvasStore.getState().addToHistory(currentElements);
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
                backgroundColor: editingElement.type === 'sticky-note' ? 'rgba(255, 255, 224, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ccc',
                outline: 'none',
                resize: 'none',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                zIndex: 1000,
                padding: '5px',
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
