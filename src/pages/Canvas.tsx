import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Container } from '@pixi/react';
import { useCanvasStore, CanvasElement, CanvasState } from '../stores/canvasStore';
import { useViewportCulling } from '../hooks/useViewportCulling';
import CanvasElementRenderer from '../components/canvas/CanvasElementRenderer';
import CanvasGrid from '../components/canvas/CanvasGrid';
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
  const deleteElement = useCanvasStore((state: CanvasState) => state.deleteElement);
  const selectElement = useCanvasStore((state: CanvasState) => state.selectElement);
  const setSelectedElementIds = useCanvasStore((state: CanvasState) => state.setSelectedElementIds);
  const clearSelection = useCanvasStore((state: CanvasState) => state.clearSelection);
  const setActiveTool = useCanvasStore((state: CanvasState) => state.setActiveTool);
  const setZoom = useCanvasStore((state: CanvasState) => state.setZoom);
  const setPan = useCanvasStore((state: CanvasState) => state.setPan);
  const setDragState = useCanvasStore((state: CanvasState) => state.setDragState);
  const setIsDrawing = useCanvasStore((state: CanvasState) => state.setIsDrawing);
  const setPreviewState = useCanvasStore((state: CanvasState) => state.setPreviewState);
  const setResizeState = useCanvasStore((state: CanvasState) => state.setResizeState);
  const setIsEditingText = useCanvasStore((state: CanvasState) => state.setIsEditingText);
  const setTextFormattingState = useCanvasStore((state: CanvasState) => state.setTextFormattingState);
  const addToHistory = useCanvasStore((state: CanvasState) => state.addToHistory); 

  const canvasContainerRef = useRef<HTMLDivElement>(null); // For overall workspace dimensions and DOM events
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const initialElementPositions = useRef<Record<string, { x: number; y: number }>>({});
  const isPanning = useRef(false);
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

  // Handle mouse down on an element (passed to CanvasElementComponent)
  const handleElementMouseDown = useCallback((pixiEvent: any, elementId: string) => {
    pixiEvent.stopPropagation(); // Prevent canvas click from firing
    const { elements: currentElements, selectedElementIds: currentSelectedIds, activeTool: currentActiveTool } = useCanvasStore.getState();
    const element = currentElements[elementId];

    if (!element) return;

    if (currentActiveTool === 'select') {
      const isSelected = currentSelectedIds.includes(elementId);
      // Pixi events don't have shiftKey directly, check if it exists
      const shiftPressed = pixiEvent.data?.originalEvent?.shiftKey || false;
      
      if (shiftPressed) {
        selectElement(elementId, !isSelected); // Toggle selection
      } else if (!isSelected) {
        selectElement(elementId, true); // Select only this element
      }

      // Prepare for dragging selected elements
      // For Pixi events, use global coordinates directly
      const startDragCoords = { x: pixiEvent.global.x, y: pixiEvent.global.y };
      initialElementPositions.current = {};
      const idsToDrag = useCanvasStore.getState().selectedElementIds; // Get current selection from store
      idsToDrag.forEach(id => {
        if (currentElements[id]) {
          initialElementPositions.current[id] = { x: currentElements[id].x, y: currentElements[id].y };
        }
      });
      // If the clicked element wasn't part of a multi-selection but is now selected, ensure it's in initialElementPositions
      if (idsToDrag.includes(elementId) && !initialElementPositions.current[elementId]) {
         initialElementPositions.current[elementId] = { x: element.x, y: element.y };
      }

      setDragState(true, startDragCoords, initialElementPositions.current);
    }
    // Potentially handle other tools if they interact with existing elements on mousedown
  }, [selectElement, setDragState, updateElement]);

  // Handle mouse down events on the main canvas workspace
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const currentStoreState = useCanvasStore.getState();

    if (e.target !== canvasContainerRef.current && !(e.target instanceof HTMLCanvasElement) ){
      // Click was on a React UI element over the canvas, not the canvas itself or its direct container
      return;
    }

    // If select tool and clicked on empty canvas, clear selection and text edit state
    if (currentStoreState.activeTool === 'select') {
      clearSelection();
      if (currentStoreState.isEditingText) {      // Commit text if editing
      if (textAreaRef.current && currentStoreState.isEditingText) {
        // Get current text value from the textarea ref instead of state
        const currentTextValue = textAreaRef.current.value;
        updateElement(currentStoreState.isEditingText, { content: currentTextValue });
        addToHistory(useCanvasStore.getState().elements);
      }
        setIsEditingText(null);
        setTextFormattingState(false);
      }
      // Initiate panning
      isPanning.current = true;
      const startPanCoords = { x: e.clientX, y: e.clientY };
      setDragState(true, startPanCoords, null); // dragStartElementPos is null for panning
      return;
    }

    // For drawing tools
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (['rectangle', 'text', 'sticky-note', 'line', 'pen'].includes(currentStoreState.activeTool)) {
      setIsDrawing(true); 
      setPreviewState(true, { 
        id: 'preview', // Preview element should have a temporary ID
        // TODO: Update CanvasElement type in canvasStore.ts to formally include 'drawing' type and 'points' property
        type: currentStoreState.activeTool === 'pen' ? 'drawing' : currentStoreState.activeTool as any, // Map 'pen' tool to 'drawing' element type
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
        content: currentStoreState.activeTool === 'text' ? '' : '', // Start with empty text
        points: ['pen', 'line'].includes(currentStoreState.activeTool) ? [{ x: coords.x, y: coords.y }] : [],
        color: '#000000',
        backgroundColor: currentStoreState.activeTool === 'sticky-note' ? '#FFFFE0' : 'transparent',
        fontSize: 'medium',
        isBold: false,
        isItalic: false,
        textAlignment: 'left',
        strokeColor: ['rectangle', 'line', 'pen'].includes(currentStoreState.activeTool) ? '#000000' : undefined,
        strokeWidth: ['rectangle', 'line', 'pen'].includes(currentStoreState.activeTool) ? 2 : undefined,
        isLocked: false,
      });
      setDragState(true, coords, null); // For drawing, dragStartPos is the drawing start
    }
  }, [clearSelection, setIsEditingText, setTextFormattingState, getCanvasCoordinates, setIsDrawing, setPreviewState, setDragState, updateElement, addToHistory]);

  // Global mouse move handler
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const { isDragging: currentIsDragging, dragStartPos: currentDragStartPos, activeTool: currentActiveTool, zoom: currentZoom, pan: currentPan, elements: currentElements, selectedElementIds: currentSelectedIds, previewElement: currentPreviewElement, isDrawing: currentIsDrawing, dragStartElementPos: currentDragStartElementPos } = useCanvasStore.getState();

    if (!currentIsDragging) return;

    const currentMouseX = e.clientX;
    const currentMouseY = e.clientY;

    if (isPanning.current && currentActiveTool === 'select') {
      const dx = currentMouseX - currentDragStartPos.x;
      const dy = currentMouseY - currentDragStartPos.y;
      setPan({ x: currentPan.x + dx, y: currentPan.y + dy });
      setDragState(true, { x: currentMouseX, y: currentMouseY }, null); // Update dragStartPos for continuous panning
    } else if (currentIsDrawing && currentPreviewElement) {
      const coords = getCanvasCoordinates(currentMouseX, currentMouseY);
      let newWidth = Math.abs(coords.x - currentDragStartPos.x);
      let newHeight = Math.abs(coords.y - currentDragStartPos.y);
      let newX = Math.min(coords.x, currentDragStartPos.x);
      let newY = Math.min(coords.y, currentDragStartPos.y);

      // TODO: Update CanvasElement type in canvasStore.ts to formally include 'drawing' type and 'points' property
      // TODO: Update CanvasElement type in canvasStore.ts to formally include 'drawing' type and 'points' property
      if (currentPreviewElement.type === 'line' || currentPreviewElement.type === 'drawing') { // Check for 'drawing' type for pen tool
        const updatedPoints = [...(currentPreviewElement.points || []), coords];
        setPreviewState(true, { ...currentPreviewElement, points: updatedPoints, x: newX, y: newY, width: newWidth, height: newHeight });
      } else {
        setPreviewState(true, { ...currentPreviewElement, x: newX, y: newY, width: newWidth, height: newHeight });
      }
    } else if (currentActiveTool === 'select' && currentDragStartElementPos && currentSelectedIds.length > 0) {
      // Dragging elements - convert screen coordinates to canvas coordinates
      // For Pixi events, dragStartPos is already in global screen coordinates
      const canvasContainer = canvasContainerRef.current;
      if (!canvasContainer) return;
      
      const rect = canvasContainer.getBoundingClientRect();
      const currentCanvasX = (currentMouseX - rect.left - currentPan.x) / currentZoom;
      const currentCanvasY = (currentMouseY - rect.top - currentPan.y) / currentZoom;
      const startCanvasX = (currentDragStartPos.x - rect.left - currentPan.x) / currentZoom;
      const startCanvasY = (currentDragStartPos.y - rect.top - currentPan.y) / currentZoom;
      
      const dx = currentCanvasX - startCanvasX;
      const dy = currentCanvasY - startCanvasY;

      currentSelectedIds.forEach(id => {
        const originalPos = currentDragStartElementPos[id];
        if (originalPos && currentElements[id]) {
          updateElement(id, { x: originalPos.x + dx, y: originalPos.y + dy });
        }
      });
    }
    // TODO: Implement resizing logic if currentIsResizing is true

  }, [getCanvasCoordinates, setPan, setDragState, setPreviewState, updateElement]);

  // Global mouse up handler
  const handleGlobalMouseUp = useCallback((_e: MouseEvent) => {
    const { isDrawing: currentIsDrawing, previewElement: currentPreviewElement, activeTool: currentActiveTool, selectedElementIds: currentSelectedIds, elements: currentElements, dragStartElementPos: currentDragStartElementPos } = useCanvasStore.getState();
    
    if (isPanning.current) {
      isPanning.current = false;
    }

    if (currentIsDrawing && currentPreviewElement) {
      const finalElement: CanvasElement = { ...currentPreviewElement, id: generateId() };
      // TODO: Update CanvasElement type in canvasStore.ts to formally include 'points' property
      if (((finalElement.width ?? 0) > 0 || (finalElement.height ?? 0) > 0) || (finalElement.points && finalElement.points.length > 1) ) {
          addElement(finalElement);
          addToHistory({ ...currentElements, [finalElement.id]: finalElement });
      }
    }
    // If elements were dragged, save their final positions to history
    else if (currentActiveTool === 'select' && currentSelectedIds.length > 0 && currentDragStartElementPos) {
        // Check if positions actually changed to avoid redundant history entries
        let changed = false;
        for (const id of currentSelectedIds) {
            if (currentElements[id] && currentDragStartElementPos[id]) {
                if (currentElements[id].x !== currentDragStartElementPos[id].x || currentElements[id].y !== currentDragStartElementPos[id].y) {
                    changed = true;
                    break;
                }
            }
        }
        if (changed) {
            addToHistory(currentElements); 
        }
    }

    setIsDrawing(false);
    setPreviewState(false, null);
    setDragState(false, { x: 0, y: 0 }, null);
    setResizeState(false, null, {x:0, y:0}, {width:0, height:0});

  }, [generateId, addElement, addToHistory, setIsDrawing, setPreviewState, setDragState, setResizeState]);

  // Effect for global mouse listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  // Handle wheel for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const { zoom: currentZoom, pan: currentPan } = useCanvasStore.getState();
    const scaleFactor = 1.1;
    const newZoom = e.deltaY < 0 ? currentZoom * scaleFactor : currentZoom / scaleFactor;
    
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate new pan to keep mouse position fixed relative to canvas content
      const newPanX = mouseX - (mouseX - currentPan.x) * (newZoom / currentZoom);
      const newPanY = mouseY - (mouseY - currentPan.y) * (newZoom / currentZoom);
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  }, [setZoom, setPan]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

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

  // Wrapper for delete button click (toolbar)
  const handleDeleteButtonClick = useCallback(() => {
    const { selectedElementIds: currentSelectedIds } = useCanvasStore.getState();
    if (currentSelectedIds.length > 0) {
      currentSelectedIds.forEach(id => deleteElement(id));
      addToHistory(useCanvasStore.getState().elements); // Add final state to history
      clearSelection();
    }
  }, [deleteElement, addToHistory, clearSelection]);

  // Handle keyboard events for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      // Prevent actions if typing in an input/textarea, unless it's our specific text editing area
      if ((activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') && activeEl !== textAreaRef.current) {
        return;
      }
      const { selectedElementIds: currentSelectedIds, isEditingText: currentEditingId } = useCanvasStore.getState();

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (currentSelectedIds.length > 0 && !currentEditingId) {
          e.preventDefault();
          handleDeleteButtonClick(); // Use the existing batch delete logic
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (currentEditingId) {
          // If editing text, commit changes before deselecting / clearing text edit state
          const currentTextValue = textAreaRef.current?.value || '';
          updateElement(currentEditingId, { content: currentTextValue });
          addToHistory(useCanvasStore.getState().elements);
          setIsEditingText(null);
          setTextFormattingState(false);
        }
        clearSelection();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        if (currentEditingId) {
          e.preventDefault();
          const currentTextValue = textAreaRef.current?.value || '';
          updateElement(currentEditingId, { content: currentTextValue });
          addToHistory(useCanvasStore.getState().elements);
          setIsEditingText(null);
          setTextFormattingState(false);
          // Optionally, select the element after committing text if it's not already
          // selectElement(currentEditingId, false); 
        }
      }
      // TODO: Add more shortcuts (undo/redo: Ctrl+Z/Y, zoom, tool selection)
      // if (e.ctrlKey || e.metaKey) {
      //   if (e.key === 'z') undo();
      //   if (e.key === 'y') redo();
      // }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteButtonClick, clearSelection, setIsEditingText, setTextFormattingState, updateElement, addToHistory, textAreaRef]);

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
