// src/hooks/canvas/useCanvasEvents.ts

import { useCallback, useRef } from 'react';
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

  const canvasRef = useRef<HTMLDivElement>(null);
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
    if (activeTool === 'rectangle') {
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);
      
      // Prevent zero-size elements
      if (width < 5 && height < 5) return null;

      return {
        id: 'preview',
        type: 'rectangle',
        x: Math.min(startPos.x, currentPos.x),
        y: Math.min(startPos.y, currentPos.y),
        width,
        height,
        color: '#3b82f6'
      };
    }

    if (activeTool === 'line') {
      return {
        id: 'preview',
        type: 'line',
        x: startPos.x,
        y: startPos.y,
        x2: currentPos.x,
        y2: currentPos.y,
        color: '#3b82f6'
      };
    }

    return null;
  }, [activeTool]);

  // --- CORE EVENT HANDLERS ---

  /**
   * Handle mouse down events on the canvas
   */
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startPos = getCanvasCoordinates(e);
    setMousePos(startPos);

    // Clear any existing selections and previews when clicking on empty canvas
    if (activeTool === 'select') {
      setSelectedElement(null);
      setIsEditingText(null);
      setShowTextFormatting(false);
    }

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
        // Start shape creation
        setIsDrawing(true);
        setIsPreviewing(true);
        drawStartPos.current = startPos;
        break;

      case 'text':
        // Create text element immediately
        const textElement: CanvasElement = {
          id: generateId(),
          type: 'text',
          x: startPos.x,
          y: startPos.y,
          width: 200,
          height: 40,
          content: 'New Text',
          fontSize: 'medium',
          color: '#000000'
        };
        const newTextElements = [...elements, textElement];
        setElements(newTextElements);
        commitToHistory(newTextElements);
        setSelectedElement(textElement.id);
        setIsEditingText(textElement.id);
        setActiveTool('select');
        break;

      case 'sticky-note':
        // Create sticky note element immediately
        const stickyElement: CanvasElement = {
          id: generateId(),
          type: 'sticky-note',
          x: startPos.x,
          y: startPos.y,
          width: 180,
          height: 180,
          content: '',
          color: '#facc15'
        };
        const newStickyElements = [...elements, stickyElement];
        setElements(newStickyElements);
        commitToHistory(newStickyElements);
        setSelectedElement(stickyElement.id);
        setActiveTool('select');
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
   * Handle mouse move events on the canvas
   */
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const currentPos = getCanvasCoordinates(e);
    setMousePos(currentPos);

    // Handle panning
    if (isPanning.current && dragStartPos && activeTool === 'select') {
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStartPos({ x: e.clientX, y: e.clientY });
      return;
    }

    // Handle element dragging
    if (isDragging && selectedElement && dragStartPos && dragStartElementPos) {
      const deltaX = currentPos.x - dragStartPos.x;
      const deltaY = currentPos.y - dragStartPos.y;
      
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

    // Handle element resizing
    if (isResizing && selectedElement && resizeHandle) {
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
      if (activeTool === 'pen' && previewElement) {
        // Continue path drawing
        currentPath.current += ` L ${currentPos.x} ${currentPos.y}`;
        setPreviewElement({
          ...previewElement,
          path: currentPath.current
        });
      } else if (isPreviewing && (activeTool === 'rectangle' || activeTool === 'line')) {
        // Update shape preview
        const preview = createPreviewElement(drawStartPos.current, currentPos);
        setPreviewElement(preview);
      }
    }
  }, [
    activeTool,
    isDragging,
    isDrawing,
    isPreviewing,
    isResizing,
    selectedElement,
    dragStartPos,
    dragStartElementPos,
    resizeHandle,
    resizeStartPos,
    resizeStartSize,
    previewElement,
    elements,
    getCanvasCoordinates,
    createPreviewElement,
    setMousePos,
    setPanOffset,
    setDragStartPos,
    setElements,
    setPreviewElement
  ]);

  /**
   * Handle mouse up events
   */
  const handleMouseUp = useCallback(() => {
    // Stop panning
    isPanning.current = false;

    // Finalize dragging
    if (isDragging) {
      commitToHistory(elements);
      setIsDragging(false);
    }

    // Finalize resizing
    if (isResizing) {
      commitToHistory(elements);
      setIsResizing(false);
      setResizeHandle(null);
    }

    // Finalize drawing
    if (isDrawing) {
      if (previewElement && previewElement.id === 'preview') {
        // Convert preview to actual element
        const finalElement: CanvasElement = {
          ...previewElement,
          id: generateId()
        };

        // Only add if element has meaningful size
        let shouldAdd = true;
        if (finalElement.type === 'rectangle') {
          shouldAdd = (finalElement.width || 0) >= 5 && (finalElement.height || 0) >= 5;
        } else if (finalElement.type === 'drawing') {
          shouldAdd = currentPath.current.length > 20; // Minimum path length
        }

        if (shouldAdd) {
          const newElements = [...elements, finalElement];
          setElements(newElements);
          commitToHistory(newElements);
          setSelectedElement(finalElement.id);
        }
      }

      // Reset drawing state
      setIsDrawing(false);
      setIsPreviewing(false);
      setPreviewElement(null);
      currentPath.current = '';
    }

    // Reset drag positions
    setDragStartPos({ x: 0, y: 0 });
    setDragStartElementPos({ x: 0, y: 0 });
  }, [
    isDragging,
    isDrawing,
    isResizing,
    previewElement,
    elements,
    commitToHistory,
    generateId,
    setIsDragging,
    setIsDrawing,
    setIsPreviewing,
    setIsResizing,
    setResizeHandle,
    setPreviewElement,
    setElements,
    setSelectedElement,
    setDragStartPos,
    setDragStartElementPos
  ]);

  /**
   * Handle mouse down on canvas elements
   */
  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (activeTool !== 'select') return;

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

  const handleDeleteElement = useCallback(() => {
    if (!selectedElement) return;
    
    const newElements = elements.filter(el => el.id !== selectedElement);
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
