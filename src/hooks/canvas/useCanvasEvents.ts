import { useCallback, useRef, useMemo, useEffect } from 'react';
import { CanvasElement, UseCanvasStateReturn } from './useCanvasState';

// Throttle utility for performance optimization
const throttle = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: number | null = null;
  let lastExecTime = 0;
  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
};

interface UseCanvasEventsProps {
  canvasState: UseCanvasStateReturn;
}

export const useCanvasEvents = ({ canvasState }: UseCanvasEventsProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);  const {
    elements, setElements,
    selectedElement, setSelectedElement,
    activeTool, setActiveTool,
    selectedShape,
    isDrawing, setIsDrawing,
    currentPath, setCurrentPath,
    isDragging, setIsDragging,
    dragOffset, setDragOffset,
    isResizing, setIsResizing,
    resizeHandle, setResizeHandle,
    resizeStartPos, setResizeStartPos,
    resizeStartSize, setResizeStartSize,
    zoomLevel, setZoomLevel,
    panOffset, setPanOffset,
    isCreatingLine, setIsCreatingLine,
    lineStartPoint, setLineStartPoint,
    showShapeDropdown, setShowShapeDropdown,
    dropdownPosition, setDropdownPosition,
    isEditingText, setIsEditingText,
    showTextFormatting, setShowTextFormatting,
    textFormattingPosition, setTextFormattingPosition,
    history, setHistory,
    historyIndex, setHistoryIndex,
    mousePos, setMousePos
  } = canvasState;

  // History management
  const saveToHistoryImmediate = useCallback((newElements: CanvasElement[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newElements]);
      return newHistory.slice(-50); // Limit history to last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex, setHistory, setHistoryIndex]);

  const saveToHistory = useCallback(
    (() => {
      let timeoutId: number;
      return (newElements: CanvasElement[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          saveToHistoryImmediate(newElements);
        }, 300);
      };
    })(),
    [saveToHistoryImmediate]
  );

  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setElements(previousState);
      setHistoryIndex(prev => prev - 1);
      setSelectedElement(null);
    }
  }, [history, historyIndex, setElements, setHistoryIndex, setSelectedElement]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setElements(nextState);
      setHistoryIndex(prev => prev + 1);
      setSelectedElement(null);
    }
  }, [history, historyIndex, setElements, setHistoryIndex, setSelectedElement]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 5)); // Max zoom 5x
  }, [setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.25)); // Min zoom 0.25x
  }, [setZoomLevel]);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [setZoomLevel, setPanOffset]);

  // Element deletion
  const handleDeleteElement = useCallback(() => {
    if (selectedElement) {
      const newElements = elements.filter(el => el.id !== selectedElement);
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedElement(null);
    }
  }, [selectedElement, elements, setElements, saveToHistory, setSelectedElement]);

  // Image upload
  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newElement: CanvasElement = {
        id: Date.now().toString(),
        type: 'image',
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        imageUrl,
        imageName: file.name
      };

      const newElements = [...elements, newElement];
      setElements(newElements);
      saveToHistory(newElements);
      setActiveTool('select');
    };
    reader.readAsDataURL(file);
  }, [elements, setElements, saveToHistory, setActiveTool]);

  // Resize functionality
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string, element: CanvasElement) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setSelectedElement(element.id);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    setResizeStartPos({
      x: (rawX / zoomLevel) - panOffset.x,
      y: (rawY / zoomLevel) - panOffset.y
    });
    setResizeStartSize({
      width: element.width || 100,
      height: element.height || 100
    });
  }, [setIsResizing, setResizeHandle, setSelectedElement, setResizeStartPos, setResizeStartSize, zoomLevel, panOffset]);

  // Mouse event handlers
  const handleResizeMove = useCallback((e: React.MouseEvent) => {
    if (!isResizing || !resizeHandle || !selectedElement) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const currentX = (rawX / zoomLevel) - panOffset.x;
    const currentY = (rawY / zoomLevel) - panOffset.y;

    const deltaX = currentX - resizeStartPos.x;
    const deltaY = currentY - resizeStartPos.y;

    setElements(prevElements => prevElements.map(el => {
      if (el.id !== selectedElement) return el;

      let newWidth = resizeStartSize.width;
      let newHeight = resizeStartSize.height;
      let newX = el.x;
      let newY = el.y;

      switch (resizeHandle) {
        case 'top-left':
          newWidth = Math.max(20, resizeStartSize.width - deltaX);
          newHeight = Math.max(20, resizeStartSize.height - deltaY);
          newX = el.x + (resizeStartSize.width - newWidth);
          newY = el.y + (resizeStartSize.height - newHeight);
          break;
        case 'top-right':
          newWidth = Math.max(20, resizeStartSize.width + deltaX);
          newHeight = Math.max(20, resizeStartSize.height - deltaY);
          newY = el.y + (resizeStartSize.height - newHeight);
          break;
        case 'bottom-left':
          newWidth = Math.max(20, resizeStartSize.width - deltaX);
          newHeight = Math.max(20, resizeStartSize.height + deltaY);
          newX = el.x + (resizeStartSize.width - newWidth);
          break;
        case 'bottom-right':
          newWidth = Math.max(20, resizeStartSize.width + deltaX);
          newHeight = Math.max(20, resizeStartSize.height + deltaY);
          break;
        case 'top':
          newHeight = Math.max(20, resizeStartSize.height - deltaY);
          newY = el.y + (resizeStartSize.height - newHeight);
          break;
        case 'bottom':
          newHeight = Math.max(20, resizeStartSize.height + deltaY);
          break;
        case 'left':
          newWidth = Math.max(20, resizeStartSize.width - deltaX);
          newX = el.x + (resizeStartSize.width - newWidth);
          break;
        case 'right':
          newWidth = Math.max(20, resizeStartSize.width + deltaX);
          break;
      }

      return { ...el, x: newX, y: newY, width: newWidth, height: newHeight };
    }));
  }, [isResizing, resizeHandle, selectedElement, resizeStartPos, resizeStartSize, zoomLevel, panOffset, setElements]);

  // Canvas mouse move handler
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Update mouse position for line preview
    setMousePos({
      x: (rawX / zoomLevel) - panOffset.x,
      y: (rawY / zoomLevel) - panOffset.y
    });

    // Handle resizing
    if (isResizing) {
      handleResizeMove(e);
      return;
    }

    // Handle drawing
    if (isDrawing && activeTool === 'pen') {
      const x = (rawX / zoomLevel) - panOffset.x;
      const y = (rawY / zoomLevel) - panOffset.y;
      
      setCurrentPath(prev => `${prev} L ${x} ${y}`);
      return;
    }

    // Handle dragging
    if (!isDragging || !selectedElement) return;

    const adjustedX = (rawX / zoomLevel) - panOffset.x;
    const adjustedY = (rawY / zoomLevel) - panOffset.y;
    const newX = adjustedX - dragOffset.x;
    const newY = adjustedY - dragOffset.y;

    setElements(prevElements => prevElements.map(el => 
      el.id === selectedElement 
        ? { ...el, x: newX, y: newY }
        : el
    ));
  }, [isResizing, handleResizeMove, isDrawing, activeTool, isDragging, selectedElement, dragOffset, zoomLevel, panOffset, setMousePos, setCurrentPath, setElements]);

  // Throttled mouse move for better performance
  const throttledCanvasMouseMove = useMemo(
    () => throttle(handleCanvasMouseMove, 16), // ~60fps
    [handleCanvasMouseMove]
  );

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentPath) {
      const newDrawing: CanvasElement = {
        id: Date.now().toString(),
        type: 'drawing',
        x: 0,
        y: 0,
        path: currentPath,
        color: '#000000'
      };
      
      const newElements = [...elements, newDrawing];
      setElements(newElements);
      saveToHistory(newElements);
      setCurrentPath('');
      setIsDrawing(false);
      setActiveTool('select');
      return;
    }

    // Save to history when dragging ends
    if (isDragging) {
      saveToHistory(elements);
    }

    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setIsResizing(false);
    setResizeHandle(null);
  }, [isDrawing, currentPath, elements, saveToHistory, isDragging, setElements, setCurrentPath, setIsDrawing, setActiveTool, setIsDragging, setDragOffset, setIsResizing, setResizeHandle]);

  // Element mouse down handler
  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    // Handle eraser tool
    if (activeTool === 'eraser') {
      const newElements = elements.filter(el => el.id !== elementId);
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedElement(null);
      return;
    }

    // Handle highlighter tool
    if (activeTool === 'highlighter' && element.type === 'text') {
      setElements(prevElements => prevElements.map(el => 
        el.id === elementId 
          ? { ...el, backgroundColor: el.backgroundColor ? undefined : '#ffeb3b' }
          : el
      ));
      saveToHistory(elements.map(el => 
        el.id === elementId 
          ? { ...el, backgroundColor: el.backgroundColor ? undefined : '#ffeb3b' }
          : el
      ));
      return;
    }

    if (activeTool !== 'select') return;

    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const adjustedX = (rawX / zoomLevel) - panOffset.x;
    const adjustedY = (rawY / zoomLevel) - panOffset.y;
    
    setDragOffset({
      x: adjustedX - element.x,
      y: adjustedY - element.y
    });
  }, [elements, activeTool, zoomLevel, panOffset, saveToHistory, setElements, setSelectedElement, setIsDragging, setDragOffset]);

  // Canvas click handler
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select' || isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const x = (rawX / zoomLevel) - panOffset.x;
    const y = (rawY / zoomLevel) - panOffset.y;

    if (activeTool === 'pen') {
      setIsDrawing(true);
      setCurrentPath(`M ${x} ${y}`);
      return;
    }

    // Handle line and arrow creation
    if (activeTool === 'line' || activeTool === 'arrow') {
      if (!isCreatingLine) {
        setIsCreatingLine(true);
        setLineStartPoint({ x, y });
        return;
      } else {
        if (lineStartPoint) {
          const newElement: CanvasElement = {
            id: Date.now().toString(),
            type: activeTool,
            x: lineStartPoint.x,
            y: lineStartPoint.y,
            x2: x,
            y2: y,
            color: '#000000'
          };

          const newElements = [...elements, newElement];
          setElements(newElements);
          saveToHistory(newElements);
          setIsCreatingLine(false);
          setLineStartPoint(null);
          setActiveTool('select');
          return;
        }
      }
    }

    // Create other elements
    const elementType = activeTool === 'shapes' ? selectedShape : activeTool;
    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type: elementType as CanvasElement['type'],
      x,
      y,
      width: activeTool === 'sticky-note' ? 180 : activeTool === 'text' ? 200 : 120,
      height: activeTool === 'sticky-note' ? 180 : activeTool === 'text' ? 60 : 80,
      content: activeTool === 'sticky-note' ? '' : activeTool === 'text' ? 'New text' : undefined,
      color: activeTool === 'sticky-note' ? '#facc15' : activeTool === 'rectangle' ? '#3b82f6' : activeTool === 'circle' ? '#10b981' : undefined
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setActiveTool('select');
  }, [activeTool, isDragging, zoomLevel, panOffset, isCreatingLine, lineStartPoint, selectedShape, elements, setIsDrawing, setCurrentPath, setIsCreatingLine, setLineStartPoint, setElements, saveToHistory, setActiveTool]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }
      
      // Element deletion
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        handleDeleteElement();
      }

      // Tool selection shortcuts
      if (e.key === 'Escape') {
        setSelectedElement(null);
        setActiveTool('select');
        if (showShapeDropdown) {
          setShowShapeDropdown(false);
          setDropdownPosition(null);
        }
      }
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 't' || e.key === 'T') setActiveTool('text');
      if (e.key === 'n' || e.key === 'N') setActiveTool('sticky-note');
      if (e.key === 'r' || e.key === 'R') setActiveTool('shapes');
      if (e.key === 'p' || e.key === 'P') setActiveTool('pen');
      if (e.key === 'e' || e.key === 'E') setActiveTool('eraser');
      if (e.key === 'h' || e.key === 'H') setActiveTool('highlighter');
      if (e.key === 'l' || e.key === 'L') setActiveTool('line');
      if (e.key === 'a' || e.key === 'A') setActiveTool('arrow');
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, handleDeleteElement, handleUndo, handleRedo, showShapeDropdown, setSelectedElement, setActiveTool, setShowShapeDropdown, setDropdownPosition]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShapeDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const shapesButton = document.querySelector('[data-tool="shapes"]');
        if (shapesButton && !shapesButton.contains(event.target as Node)) {
          setShowShapeDropdown(false);
          setDropdownPosition(null);
          setActiveTool('select');
        }
      }
      
      if (showTextFormatting && event.target) {
        const target = event.target as Element;
        const isClickOnToolbar = target.closest('.text-formatting-toolbar');
        const isClickOnTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        
        if (!isClickOnToolbar && !isClickOnTextInput) {
          setShowTextFormatting(false);
          setIsEditingText(null);
          setTextFormattingPosition(null);
        }
      }
    };

    if (showShapeDropdown || showTextFormatting) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showShapeDropdown, showTextFormatting, setShowShapeDropdown, setDropdownPosition, setActiveTool, setShowTextFormatting, setIsEditingText, setTextFormattingPosition]);

  // Text formatting functions
  const updateTextFormatting = useCallback((elementId: string, formatProperty: keyof CanvasElement, value: any) => {
    setElements(prevElements => {
      const newElements = prevElements.map(el => 
        el.id === elementId 
          ? { ...el, [formatProperty]: value }
          : el
      );
      if (formatProperty !== 'content') {
        saveToHistory(newElements);
      }
      return newElements;
    });
  }, [setElements, saveToHistory]);

  const getTextStyles = useCallback((element: CanvasElement) => {
    const styles: React.CSSProperties = {};
    
    if (element.fontSize === 'small') styles.fontSize = '14px';
    else if (element.fontSize === 'large') styles.fontSize = '24px';
    else styles.fontSize = '18px';
    
    if (element.isBold) styles.fontWeight = 'bold';
    if (element.isItalic) styles.fontStyle = 'italic';
    if (element.textAlignment) styles.textAlign = element.textAlignment;
    
    return styles;
  }, []);

  // Can undo/redo checks
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  return {
    canvasRef,
    dropdownRef,
    
    // Event handlers
    handleCanvasClick,
    handleCanvasMouseDown: handleCanvasClick, // Alias for backward compatibility
    handleCanvasMouseMove: throttledCanvasMouseMove,
    handleCanvasMouseUp: handleMouseUp,
    handleElementMouseDown,
    handleMouseUp,
    throttledCanvasMouseMove,
    handleResizeStart,
    handleUndo,
    handleRedo,
    handleDeleteElement,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleImageUpload,
    
    // Resize handles function
    getResizeHandles: (element: CanvasElement) => {
      if (!element.width || !element.height) return [];
      
      return [
        { position: 'top-left', x: element.x - 4, y: element.y - 4 },
        { position: 'top-right', x: element.x + element.width - 4, y: element.y - 4 },
        { position: 'bottom-left', x: element.x - 4, y: element.y + element.height - 4 },
        { position: 'bottom-right', x: element.x + element.width - 4, y: element.y + element.height - 4 },
        { position: 'top', x: element.x + element.width / 2 - 4, y: element.y - 4 },
        { position: 'bottom', x: element.x + element.width / 2 - 4, y: element.y + element.height - 4 },
        { position: 'left', x: element.x - 4, y: element.y + element.height / 2 - 4 },
        { position: 'right', x: element.x + element.width - 4, y: element.y + element.height / 2 - 4 }
      ];
    },
    
    // Text formatting
    updateTextFormatting,
    getTextStyles,
    
    // History checks
    canUndo,
    canRedo,
    
    // Save functions
    saveToHistory,
    saveToHistoryImmediate
  };
};
