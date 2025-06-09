// src/hooks/canvas/useCanvasEvents.ts

import { useCallback, useRef, useEffect } from 'react';
import { UseCanvasStateReturn, CanvasElement, CanvasTool } from './useCanvasState';

export const useCanvasEvents = ({ canvasState }: { canvasState: UseCanvasStateReturn }) => {
  const {
    elements,
    setElements,
    activeTool,
    setActiveTool,
    selectedShape,
    panOffset,
    setPanOffset,
    zoomLevel,
    setZoomLevel,
    isDragging,
    setIsDragging,
    dragStartPos,
    setDragStartPos,
    dragStartElementPos,
    setDragStartElementPos,
    selectedElement,
    setSelectedElement,
    isDrawing,
    setIsDrawing,
    previewElement,
    setPreviewElement,
    isPreviewing,
    setIsPreviewing,
    isResizing,
    setIsResizing,
    resizeHandle,
    setResizeHandle,
    resizeStartPos,
    setResizeStartPos,
    resizeStartSize,
    setResizeStartSize,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    mousePos,
    setMousePos,
    isEditingText,
    setIsEditingText,
    showTextFormatting,
    setShowTextFormatting,
    textFormattingPosition,
    setTextFormattingPosition
  } = canvasState;

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
    // Remove any future history if we're not at the end
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1));
    }
    setHistory(prev => [...prev, [...newElements]]);
    setHistoryIndex(prev => prev + 1);
  }, [history, historyIndex, setHistory, setHistoryIndex]);

  // --- GLOBAL DOCUMENT EVENT LISTENERS ---
  
  /**
   * CRITICAL FIX: Global document event listeners to handle mouse events outside canvas
   * This fixes the "elements follow mouse forever" bug when dragging outside canvas bounds
   */
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Handle element dragging globally
      if (isDragging && selectedElement && dragStartPos && dragStartElementPos) {
        e.preventDefault();
        const currentPos = getCanvasCoordinatesFromNative(e);
        const deltaX = currentPos.x - dragStartPos.x;
        const deltaY = currentPos.y - dragStartPos.y;
        
        // Direct state update without requestAnimationFrame for immediate responsiveness
        setElements(prev => prev.map(el =>
          el.id === selectedElement
            ? {
                ...el,
                x: dragStartElementPos.x + deltaX,
                y: dragStartElementPos.y + deltaY
              }
            : el
        ));
        return;
      }
      
      // Handle canvas panning globally
      if (isPanning.current && dragStartPos && activeTool === 'select') {
        e.preventDefault();
        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;
        setPanOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        setDragStartPos({ x: e.clientX, y: e.clientY });
        return;
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      
      // Stop element dragging
      if (isDragging) {
        commitToHistory(elements);
        setIsDragging(false);
      }
      
      // Stop canvas panning
      if (isPanning.current) {
        isPanning.current = false;
      }
      
      // Stop resizing
      if (isResizing) {
        commitToHistory(elements);
        setIsResizing(false);
        setResizeHandle(null);
      }
      
      // Reset cursor style
      if (canvasRef.current) {
        canvasRef.current.style.cursor = activeTool === 'select' ? 'grab' : 'crosshair';
      }
      
      // Reset drag positions
      setDragStartPos({ x: 0, y: 0 });
      setDragStartElementPos({ x: 0, y: 0 });
    };

    // Add global event listeners
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    // Cleanup on unmount or dependency change
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    isDragging,
    selectedElement,
    dragStartPos,
    dragStartElementPos,
    elements,
    activeTool,
    isResizing,
    resizeHandle,
    getCanvasCoordinatesFromNative,
    commitToHistory,
    setElements,
    setIsDragging,
    setPanOffset,
    setDragStartPos,
    setDragStartElementPos,
    setIsResizing,
    setResizeHandle
  ]);

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
    console.log('🔄 PREVIEW DEBUG: createPreviewElement called with activeTool:', activeTool, 'startPos:', startPos, 'currentPos:', currentPos);
    
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
    console.log('🖱️ CANVAS CLICK DEBUG: handleCanvasMouseDown called with activeTool:', activeTool);
    e.preventDefault();
    e.stopPropagation();
    
    // Set cursor style for better visual feedback
    if (canvasRef.current) {
      canvasRef.current.style.cursor = activeTool === 'select' ? 'grabbing' : 'crosshair';
    }
    
    const startPos = getCanvasCoordinates(e);
    console.log('🖱️ CANVAS CLICK DEBUG: Canvas coordinates calculated:', startPos);
    setMousePos(startPos);

    // Clear any existing selections and previews when clicking on empty canvas
    if (activeTool === 'select') {
      setSelectedElement(null);
      setIsEditingText(null);
      setShowTextFormatting(false);
    }

    console.log('🖱️ CANVAS CLICK DEBUG: About to enter switch statement with activeTool:', activeTool);
    // Handle different tools
    switch (activeTool) {
      case 'select':
        // Start panning
        isPanning.current = true;
        setDragStartPos({ x: e.clientX, y: e.clientY });
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
        setPreviewElement(drawingElement);
        break;

      case 'rectangle':
      case 'line':
      case 'text':
      case 'sticky-note':
        // These tools now use direct creation from toolbar buttons
        // No longer create elements on canvas click - this prevents double creation
        console.log(`🚫 CANVAS CLICK: ${activeTool} tool should create directly from toolbar, not canvas click`);
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
    setSelectedElement,
    setIsDrawing,
    setIsPreviewing,
    setPreviewElement,
    setIsEditingText,
    setShowTextFormatting,
    setActiveTool,
    setMousePos,
    setDragStartPos
  ]);

  /**
   * Handle mouse move events on the canvas (simplified - global handlers manage dragging)
   */
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
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

      setElements(prev => prev.map(el =>
        el.id === selectedElement
          ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight }
          : el
      ));
      return;
    }

    // Handle drawing tools
    if (isDrawing) {
      console.log('🖱️ MOUSE MOVE DEBUG: isDrawing=true, activeTool:', activeTool, 'isPreviewing:', isPreviewing);
      if (activeTool === 'pen' && previewElement) {
        // Continue path drawing
        currentPath.current += ` L ${currentPos.x} ${currentPos.y}`;
        setPreviewElement({
          ...previewElement,
          path: currentPath.current
        });
      }
      // Note: Rectangle and line tools no longer use preview since they create immediately on click
    }
  }, [
    activeTool,
    isDrawing,
    isPreviewing,
    isResizing,
    selectedElement,
    resizeHandle,
    resizeStartPos,
    resizeStartSize,
    previewElement,
    elements,
    getCanvasCoordinates,
    createPreviewElement,
    setMousePos,
    setElements,
    setPreviewElement
  ]);

  /**
   * Handle mouse up events (simplified - global handler manages most cleanup)
   */
  const handleMouseUp = useCallback(() => {
    console.log('🖱️ MOUSE UP DEBUG: handleMouseUp called, isDrawing:', isDrawing);
    // Finalize drawing (only thing that needs canvas-specific handling)
    if (isDrawing) {
      console.log('🖱️ MOUSE UP DEBUG: isDrawing=true, previewElement:', previewElement);
      if (previewElement && previewElement.id === 'preview') {
        console.log('🖱️ MOUSE UP DEBUG: Converting preview to actual element:', previewElement);
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
          console.log('✅ ELEMENT CREATION DEBUG: Adding new element to canvas:', finalElement);
          const newElements = [...elements, finalElement];
          setElements(newElements);
          commitToHistory(newElements);
          setSelectedElement(finalElement.id);
          console.log('✅ ELEMENT CREATION DEBUG: Element added successfully, new elements count:', newElements.length);
        } else {
          console.log('❌ ELEMENT CREATION DEBUG: Element too small, not adding. Size:', finalElement.width, 'x', finalElement.height);
        }
      } else {
        console.log('❌ MOUSE UP DEBUG: No valid preview element to convert');
      }

      // Reset drawing state
      console.log('🖱️ MOUSE UP DEBUG: Resetting drawing state');
      setIsDrawing(false);
      setIsPreviewing(false);
      setPreviewElement(null);
      currentPath.current = '';
    } else {
      console.log('🖱️ MOUSE UP DEBUG: isDrawing=false, no action needed');
    }
  }, [
    isDrawing,
    previewElement,
    elements,
    commitToHistory,
    generateId,
    setIsDrawing,
    setIsPreviewing,
    setPreviewElement,
    setElements,
    setSelectedElement
  ]);

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
        setIsResizing(true);
        setResizeHandle(handleName);
        setResizeStartPos(currentPos);
        setResizeStartSize({
          width: element.width || 0,
          height: element.height || 0
        });
        setSelectedElement(elementId);
        return;
      }
    }

    // Start dragging element
    setSelectedElement(elementId);
    setIsDragging(true);
    setDragStartPos(currentPos);
    setDragStartElementPos({ x: element.x, y: element.y });
    
    // DEBUG: Log initial drag setup
    console.log('🎯 DRAG START SETUP:', {
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
        setIsEditingText(elementId);
        setShowTextFormatting(true);
        
        // Position text formatting toolbar
        if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const screenX = element.x * zoomLevel + panOffset.x + rect.left;
          const screenY = (element.y - 50) * zoomLevel + panOffset.y + rect.top;
          setTextFormattingPosition({ left: screenX, top: screenY });
        }
      }
    }
  }, [
    activeTool,
    elements,
    getCanvasCoordinates,
    zoomLevel,
    panOffset,
    setSelectedElement,
    setIsDragging,
    setIsResizing,
    setResizeHandle,
    setDragStartPos,
    setDragStartElementPos,
    setResizeStartPos,
    setResizeStartSize,
    setIsEditingText,
    setShowTextFormatting,
    setTextFormattingPosition
  ]);

  // --- TOOL AND HISTORY HANDLERS ---

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedElement(null);
    }
  }, [history, historyIndex, setElements, setHistoryIndex, setSelectedElement]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedElement(null);
    }
  }, [history, historyIndex, setElements, setHistoryIndex, setSelectedElement]);

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
      setZoomLevel(prev => Math.min(prev * 1.2, 5));
      return;
    }

    if (tool === 'zoom-out') {
      setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
      return;
    }

    // Clear selections when switching tools
    if (tool !== 'select') {
      setSelectedElement(null);
      setIsEditingText(null);
      setShowTextFormatting(false);
    }

    setActiveTool(tool);
  }, [handleUndo, handleRedo, setZoomLevel, setActiveTool, setSelectedElement, setIsEditingText, setShowTextFormatting]);

  // --- TEXT HANDLING ---

  const handleTextChange = useCallback((id: string, content: string) => {
    setElements(prev => prev.map(elem => 
      elem.id === id ? { ...elem, content } : elem
    ));
  }, [setElements]);

  const handleTextFormatting = useCallback((property: string, value: any) => {
    if (!selectedElement) return;
    
    setElements(prev => prev.map(elem => 
      elem.id === selectedElement 
        ? { ...elem, [property]: value }
        : elem
    ));
  }, [selectedElement, setElements]);

  const handleTextFormatPropertyChange = useCallback((property: string, value: any) => {
    handleTextFormatting(property, value);
  }, [handleTextFormatting]);

  // --- OTHER HANDLERS ---

  const handleDeleteElement = useCallback((elementId?: string) => {
    const targetElementId = elementId || selectedElement;
    if (!targetElementId) return;
    
    const newElements = elements.filter(el => el.id !== targetElementId);
    setElements(newElements);
    commitToHistory(newElements);
    setSelectedElement(null);
  }, [selectedElement, elements, setElements, commitToHistory, setSelectedElement]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 5));
  }, [setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
  }, [setZoomLevel]);

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

    setIsResizing(true);
    setResizeHandle(handle);
    setSelectedElement(elementId);
    setResizeStartPos(startPos);
    setResizeStartSize({
      width: element.width || 0,
      height: element.height || 0
    });
  }, [elements, setIsResizing, setResizeHandle, setSelectedElement, setResizeStartPos, setResizeStartSize]);

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
