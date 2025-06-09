// src/hooks/canvas/useCanvasEvents.ts

import { useCallback, useRef, useEffect } from 'react';
// Assuming useCanvasStore is in src/stores/canvasStore.ts
// and exports CanvasElement, CanvasTool types
import { useCanvasStore, CanvasElement, CanvasTool } from '../../stores/canvasStore';

export const useCanvasEvents = () => {
  const {
    // State properties from CanvasState
    elements,
    activeTool,
    // selectedShape, // Removed as unused in this hook
    panOffset,
    zoomLevel,
    isDragging,
    dragStartPos, // Provided by store, part of isDragging state logic
    dragStartElementPos, // Provided by store
    selectedElement,
    isDrawing,
    previewElement, // Provided by store, part of isPreviewing state logic
    isPreviewing,
    isResizing,
    resizeHandle, // Provided by store, part of isResizing state logic
    resizeStartPos, // Provided by store
    resizeStartSize, // Provided by store
    history, // Provided by store for canUndo/canRedo checks
    historyIndex, // Provided by store for canUndo/canRedo checks
    // mousePos, // State variable removed as unused in this hook (setMousePos action is kept)
    // isEditingText, // State variable removed as unused in this hook (setIsEditingText action is kept)
    // showTextFormatting, // Removed, text formatting UI state handled by setIsEditingText
    // textFormattingPosition, // Removed, text formatting UI state handled by setIsEditingText

    // Action methods from CanvasState
    setElements, // Direct element array replacement
    setActiveTool,
    // setSelectedShape, // Removed as unused in this hook
    setPanOffset,
    setZoomLevel,
    setIsDrawing, // Action to set drawing state
    setMousePos, // Action, kept as it's used
    setIsEditingText, // Action to set which text element is being edited, kept as it's used

    // Composite/specific actions from CanvasState
    updateElement, // To update parts of an element
    addElement,    // To add a new element
    deleteElement, // Store's own deleteElement action
    selectElement, // Replaces direct setSelectedElement calls
    setPreviewState, // Manages isPreviewing and previewElement
    setResizeState,  // Manages isResizing, resizeHandle, resizeStartPos, resizeStartSize
    // setTextFormatState, // This action does not exist; setIsEditingText handles text formatting UI state
    addToHistory,    // For committing changes to history
    undo,            // Undo action
    redo,            // Redo action
    setDragState,    // Manages isDragging, dragStartPos, dragStartElementPos
    setShowShapeDropdown // For toolbar UI
  } = useCanvasStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPanning = useRef(false);
  const currentPath = useRef<string>('');
  const drawStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // --- UTILITY FUNCTIONS ---

  /**
   * Convert screen coordinates to canvas coordinates accounting for pan and zoom
   */
  const getCanvasCoordinates = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;
    return { x, y };
  }, [panOffset, zoomLevel]);

  /**
   * Convert native MouseEvent to canvas coordinates (for global event listeners)
   */
  const getCanvasCoordinatesFromNative = useCallback((e: MouseEvent): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;
    return { x, y };
  }, [panOffset, zoomLevel]);

  /**
   * Add elements to history for undo/redo functionality
   */
  const commitToHistory = useCallback((newElements: CanvasElement[]) => {
    addToHistory(newElements);
  }, [addToHistory]);

  // --- GLOBAL DOCUMENT EVENT LISTENERS ---
  
  /**
   * CRITICAL FIX: Global document event listeners to handle mouse events outside canvas
   * This fixes the "elements follow mouse forever" bug when dragging outside canvas bounds
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Handle element dragging globally
      if (isDragging && selectedElement && dragStartPos && dragStartElementPos) {
        e.preventDefault();
        const currentPos = getCanvasCoordinatesFromNative(e);
        const deltaX = currentPos.x - dragStartPos.x;
        const deltaY = currentPos.y - dragStartPos.y;
        
        // Update element position using store action
        updateElement(selectedElement, {
          x: dragStartElementPos.x + deltaX,
          y: dragStartElementPos.y + deltaY
        });
        return;
      }
      
      // Handle canvas panning globally
      if (isPanning.current && dragStartPos && activeTool === 'select') {
        e.preventDefault();
        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;
        setPanOffset({
          x: panOffset.x + deltaX,
          y: panOffset.y + deltaY
        });
        setDragState(true, { x: e.clientX, y: e.clientY });
        return;
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      
      // Stop element dragging
      if (isDragging) {
        commitToHistory(elements);
        setDragState(false);
      }
      
      // Stop canvas panning
      if (isPanning.current) {
        isPanning.current = false;
      }
      
      // Stop resizing
      if (isResizing) {
        commitToHistory(elements);
        setResizeState(false); // This also resets the resize handle in the store
      }
      
      // Reset cursor style
      if (canvasRef.current) {
        canvasRef.current.style.cursor = activeTool === 'select' ? 'grab' : 'crosshair';
      }
      
      // Reset drag positions
      setDragState(false);
    };

    // Global document event listeners
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    // Dependency arrays for global listeners are tricky. 
    // For now, including all potentially relevant store states and actions that are read or called.
    // This might need refinement if performance issues arise or if ESLint rules are stricter.
    // Consider using refs for values that change frequently but shouldn't trigger re-registration.

    // Cleanup on unmount or dependency change
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [getCanvasCoordinatesFromNative, isDragging, selectedElement, dragStartPos, dragStartElementPos, updateElement, isPanning, activeTool, panOffset, setPanOffset, setDragState, commitToHistory, elements, isResizing, setResizeState, canvasRef]);

  /**
   * Generate unique ID for new elements
   */
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Create preview element for shape tools
   */
  const createPreviewElement = useCallback((
    startPos: { x: number; y: number },
    currentPos: { x: number; y: number }
  ): CanvasElement | null => {
    console.log(' PREVIEW DEBUG: createPreviewElement called with activeTool:', activeTool, 'startPos:', startPos, 'currentPos:', currentPos);
    
    // Rectangle, line, text, and sticky-note tools no longer use preview since they create directly from toolbar
    if (['rectangle', 'line', 'text', 'sticky-note'].includes(activeTool)) {
      return null;
    }

    return null;
  }, [activeTool]);

  // --- CORE EVENT HANDLERS ---

  /**
   * Handle mouse down events on the canvas
   */
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    console.log(' CANVAS CLICK DEBUG: handleCanvasMouseDown called with activeTool:', activeTool);
    e.preventDefault();
    e.stopPropagation();
    
    // Set cursor style for better visual feedback
    if (canvasRef.current) {
      canvasRef.current.style.cursor = activeTool === 'select' ? 'grabbing' : 'crosshair';
    }
    
    const startPos = getCanvasCoordinates(e);
    console.log(' CANVAS CLICK DEBUG: Canvas coordinates calculated:', startPos);
    setMousePos(startPos);

    // Clear any existing selections and previews when clicking on empty canvas
    if (activeTool === 'select') {
      selectElement(null);
      setIsEditingText(null);
      setShowShapeDropdown(false);
    }

    console.log(' CANVAS CLICK DEBUG: About to enter switch statement with activeTool:', activeTool);
    // Handle different tools
    switch (activeTool) {
      case 'select':
        // Start panning
        isPanning.current = true;
        setDragState(true, { x: e.clientX, y: e.clientY });
        break;

      case 'pen':
        // Start drawing path
        setIsDrawing(true);
        drawStartPos.current = startPos;
        currentPath.current = `M ${startPos.x} ${startPos.y}`;
        
        // Create initial preview element
        const drawingElement: CanvasElement = {
          id: 'preview',
          type: 'drawing',
          x: startPos.x,
          y: startPos.y,
          path: currentPath.current,
          color: '#000000'
        };
        setPreviewState(true, drawingElement);
        break;

      case 'rectangle':
      case 'line':
      case 'text':
      case 'sticky-note':
        // These tools now use direct creation from toolbar buttons
        // No longer create elements on canvas click - this prevents double creation
        console.log(` CANVAS CLICK: ${activeTool} tool should create directly from toolbar, not canvas click`);
        break;

      default:
        break;
    }
  }, [
    activeTool,
    elements,
    getCanvasCoordinates,
    generateId,
    commitToHistory,
    setElements,
    selectElement,
    setIsDrawing,
    setIsPreviewing,
    setPreviewState,
    setIsEditingText,
    setShowShapeDropdown,
    setActiveTool,
    setMousePos,
    setDragState
  ]);

  /**
   * Handle mouse move events on the canvas (simplified - global handlers manage dragging)
   */
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    
    const currentPos = getCanvasCoordinates(e);
    setMousePos(currentPos);

    // Handle element resizing (still needs canvas-relative coordinates)
    if (isResizing && selectedElement && resizeHandle) {
      e.stopPropagation();
      const element = elements.find(el => el.id === selectedElement);
      if (!element) return;

      const deltaX = currentPos.x - resizeStartPos.x;
      const deltaY = currentPos.y - resizeStartPos.y;

      let newWidth = resizeStartSize.width;
      let newHeight = resizeStartSize.height;
      let newX = element.x;
      let newY = element.y;

      // Handle different resize handles
      switch (resizeHandle) {
        case 'se': // Southeast
          newWidth = Math.max(10, resizeStartSize.width + deltaX);
          newHeight = Math.max(10, resizeStartSize.height + deltaY);
          break;
        case 'sw': // Southwest
          newWidth = Math.max(10, resizeStartSize.width - deltaX);
          newHeight = Math.max(10, resizeStartSize.height + deltaY);
          newX = element.x + (resizeStartSize.width - newWidth);
          break;
        case 'ne': // Northeast
          newWidth = Math.max(10, resizeStartSize.width + deltaX);
          newHeight = Math.max(10, resizeStartSize.height - deltaY);
          newY = element.y + (resizeStartSize.height - newHeight);
          break;
        case 'nw': // Northwest
          newWidth = Math.max(10, resizeStartSize.width - deltaX);
          newHeight = Math.max(10, resizeStartSize.height - deltaY);
          newX = element.x + (resizeStartSize.width - newWidth);
          newY = element.y + (resizeStartSize.height - newHeight);
          break;
      }

      updateElement(selectedElement, { x: newX, y: newY, width: newWidth, height: newHeight });
      return;
    }

    // Handle drawing tools
    if (isDrawing) {
      console.log(' MOUSE MOVE DEBUG: isDrawing=true, activeTool:', activeTool, 'isPreviewing:', isPreviewing);
      if (activeTool === 'pen' && previewElement) {
        // Continue path drawing
        currentPath.current += ` L ${currentPos.x} ${currentPos.y}`;
        setPreviewState(true, {
          ...previewElement,
          path: currentPath.current
        });
      }
      // Note: Rectangle and line tools no longer use preview since they create immediately on click
    }
  }, [
    activeTool,
    isDrawing,
    elements, // Kept for read operations if any, or if updateElement needs it implicitly
    getCanvasCoordinates,
    isResizing,
    resizeHandle,
    resizeStartPos,
    resizeStartSize,
    selectedElement,
    updateElement, // Replaces setElements for targeted updates
    isDrawing,
    activeTool,
    previewElement,
    setPreviewState,
    currentPath,
    drawStartPos,
    zoomLevel,
    panOffset
  ]);

  /**
   * Handle mouse up events (simplified - global handler manages most cleanup)
   */
  const handleMouseUp = useCallback(() => {
    console.log(' MOUSE UP DEBUG: handleMouseUp called, isDrawing:', isDrawing);
    // Finalize drawing (only thing that needs canvas-specific handling)
    if (isDrawing) {
      console.log(' MOUSE UP DEBUG: isDrawing=true, previewElement:', previewElement);
      if (previewElement && previewElement.id === 'preview') {
        console.log(' MOUSE UP DEBUG: Converting preview to actual element:', previewElement);
        // Convert preview to actual element
        const finalElement: CanvasElement = {
          ...previewElement,
          id: generateId()
        };

        // Only add if element has meaningful size
        let shouldAdd = true;
        if (finalElement.type === 'drawing') {
          shouldAdd = currentPath.current.length > 20; // Minimum path length
        }
        // Note: Rectangle and line elements are created immediately, not through preview conversion

        if (shouldAdd) {
          console.log(' ELEMENT CREATION DEBUG: Adding new element to canvas via store action:', finalElement);
          addElement(finalElement); // Use store action to add element and handle history
          selectElement(finalElement.id); // Select the newly added element
          console.log(' ELEMENT CREATION DEBUG: Element added successfully, new elements count:', elements.length);
        } else {
          console.log(' ELEMENT CREATION DEBUG: Element too small, not adding. Size:', finalElement.width, 'x', finalElement.height);
        }
      } else {
        console.log(' MOUSE UP DEBUG: No valid preview element to convert');
      }

      // Reset drawing state
      console.log(' MOUSE UP DEBUG: Resetting drawing state');
      setIsDrawing(false);
      // setIsPreviewing(false); // Redundant, setPreviewState below handles this
      setPreviewState(false, null);
      selectElement(null); // Deselect after drawing/action
    } else {
      console.log(' MOUSE UP DEBUG: isDrawing=false, no action needed');
    }
  }, [
    isDrawing,
    previewElement,
    // elements, // Removed as addElement now handles element list modification
    // commitToHistory, // Removed as addElement should handle history
    generateId,
    setIsDrawing,
    setPreviewState,
    addElement, // Replaces setElements and commitToHistory for new elements
    selectElement
  ]);

  // ... rest of the code remains the same ...
  /**
   * Handle mouse down on canvas elements
   */
  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (activeTool !== 'select') return;

    // Set dragging cursor for visual feedback
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const currentPos = getCanvasCoordinates(e);
    
    // Check if clicking on resize handle
    const handleSize = 8;
    const elementRight = element.x + (element.width || 0);
    const elementBottom = element.y + (element.height || 0);
    
    // Define resize handle positions
    const handles = {
      se: { x: elementRight, y: elementBottom },
      sw: { x: element.x, y: elementBottom },
      ne: { x: elementRight, y: element.y },
      nw: { x: element.x, y: element.y }
    };

    // Check if clicking on any resize handle
    for (const [handleName, handlePos] of Object.entries(handles)) {
      if (Math.abs(currentPos.x - handlePos.x) <= handleSize &&
          Math.abs(currentPos.y - handlePos.y) <= handleSize) {
        setResizeState(true, handleName, currentPos, {
          width: element.width || 0,
          height: element.height || 0
        });
        selectElement(elementId);
        return;
      }
    }

    // Start dragging element
    selectElement(elementId);
    setDragState(true, currentPos, { x: element.x, y: element.y });
    
    // DEBUG: Log initial drag setup
    console.log(' DRAG START SETUP:', {
      elementId,
      screenMouse: { x: e.clientX, y: e.clientY },
      canvasClickPos: currentPos,
      elementPosition: { x: element.x, y: element.y },
      elementSize: { width: element.width, height: element.height },
      clickOffsetInElement: {
        x: currentPos.x - element.x,
        y: currentPos.y - element.y
      }
    });

    // Handle text editing
    if (element.type === 'text' || element.type === 'sticky-note') {
      if (e.detail === 2) { // Double click
        let position;
        if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const toolbarHeightEstimate = 40; // Estimated height of the toolbar
          const spacing = 10; // Desired spacing above the element
          // Calculate screenX for the center of the element for better positioning
          const elementScreenX = (element.x + (element.width || 0) / 2) * zoomLevel + panOffset.x + rect.left;
          const elementScreenY = element.y * zoomLevel + panOffset.y + rect.top;
          // Position toolbar above the element
          position = {
            x: elementScreenX, // Centered horizontally
            y: elementScreenY - toolbarHeightEstimate - spacing
          };
        }
        setIsEditingText(elementId, position);
      }
    }
  }, [
    activeTool,
    elements,
    getCanvasCoordinates,
    zoomLevel,
    panOffset,
    selectElement,
    setDragState,
    setResizeState,
    setIsEditingText
    // setShowTextFormatting, // Removed, handled by setIsEditingText
    // setTextFormattingPosition // Removed, handled by setIsEditingText
  ]);

  // --- TOOL AND HISTORY HANDLERS ---

  const handleUndo = useCallback(() => {
    // The canUndo check (historyIndex > 0) is typically done before calling this handler.
    // The store's undo action handles updating elements and historyIndex.
    undo();
    selectElement(null); // Deselect element after undo
  }, [undo, selectElement]);

  const handleRedo = useCallback(() => {
    // The canRedo check (historyIndex < history.length - 1) is typically done before calling this handler.
    // The store's redo action handles updating elements and historyIndex.
    redo();
    selectElement(null); // Deselect element after redo
  }, [redo, selectElement]);

  const handleToolSelect = useCallback((tool: CanvasTool) => {
    if (tool === 'undo') {
      handleUndo();
      return;
    }
    
    if (tool === 'redo') {
      handleRedo();
      return;
    }

    if (tool === 'zoom-in') {
      setZoomLevel(Math.min(zoomLevel * 1.2, 5));
      return;
    }

    if (tool === 'zoom-out') {
      setZoomLevel(Math.max(zoomLevel / 1.2, 0.1));
      return;
    }

    // Clear selections when switching tools
    if (tool !== 'select') {
      selectElement(null);
      setIsEditingText(null); // This also hides text formatting implicitly if store handles it
    }

    setActiveTool(tool);
  }, [handleUndo, handleRedo, zoomLevel, setZoomLevel, setActiveTool, selectElement, setIsEditingText]);

  // --- TEXT HANDLING ---

  const handleTextChange = useCallback((id: string, content: string) => {
    updateElement(id, { content });
    // Assuming updateElement in the store handles history/state updates appropriately.
  }, [updateElement]);

  const handleTextFormatting = useCallback((property: string, value: any) => {
    if (!selectedElement) return;
    
    updateElement(selectedElement, { [property]: value });
    // Assuming updateElement in the store handles history/state updates appropriately.
  }, [selectedElement, updateElement]);

  const handleTextFormatPropertyChange = useCallback((property: string, value: any) => {
    handleTextFormatting(property, value);
  }, [handleTextFormatting]);

  // --- OTHER HANDLERS ---

  const handleDeleteElement = useCallback((elementId?: string) => {
    const targetElementId = elementId || selectedElement;
    if (!targetElementId) return;
    
    deleteElement(targetElementId);
    // Assuming the store's deleteElement action handles history and selection state (e.g., deselects the element).
    // If selectElement(null) is still required, it should be called here and added to dependencies.
  }, [selectedElement, deleteElement]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(Math.min(zoomLevel * 1.2, 5));
  }, [zoomLevel, setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(Math.max(zoomLevel / 1.2, 0.1));
  }, [zoomLevel, setZoomLevel]);

  const getTextStyles = useCallback((element: CanvasElement) => {
    return {
      fontSize: element.fontSize === 'small' ? '12px' :
                element.fontSize === 'large' ? '24px' : '16px',
      fontWeight: element.isBold ? 'bold' : 'normal',
      fontStyle: element.isItalic ? 'italic' : 'normal',
      textAlign: element.textAlignment || 'left',
      color: element.color || '#000000'
    };
  }, []);

  // --- RESIZE HANDLERS ---

  const handleResizeStart = useCallback((elementId: string, handle: string, startPos: { x: number; y: number }) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    selectElement(elementId); // Ensure element is selected before resizing
    setResizeState(true, handle, startPos, {
      width: element.width || 0,
      height: element.height || 0
    });
  }, [elements, selectElement, setResizeState]);

  // --- COMPUTED VALUES ---

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    // Canvas reference
    canvasRef,
    
    // Core event handlers
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleMouseUp,
    handleElementMouseDown,
    
    // Tool and history handlers
    handleToolSelect,
    handleUndo,
    handleRedo,
    
    // Text handlers
    handleTextChange,
    handleTextFormatting,
    handleTextFormatPropertyChange,
    getTextStyles,
    
    // Other handlers
    handleDeleteElement,
    handleZoomIn,
    handleZoomOut,
    handleResizeStart,
    
    // Computed values
    canUndo,
    canRedo,
    
    // Utility functions
    getCanvasCoordinates,
    commitToHistory
  };
};
