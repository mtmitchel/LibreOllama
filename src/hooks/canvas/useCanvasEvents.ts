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
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    elements, setElements,
    selectedElement, setSelectedElement,
    activeTool, setActiveTool,
    zoomLevel, setZoomLevel,
    panOffset, setPanOffset,

    showShapeDropdown, setShowShapeDropdown,
    dropdownPosition, setDropdownPosition,
    isEditingText, setIsEditingText,
    showTextFormatting, setShowTextFormatting,
    textFormattingPosition, setTextFormattingPosition,
    history, setHistory,
    historyIndex, setHistoryIndex,
    mousePos, setMousePos,
    isPreviewing, setIsPreviewing, // New state for drawing preview
    previewElement, setPreviewElement, // New state for drawing preview
    isResizing, setIsResizing,
    resizeHandle, setResizeHandle,
    resizeStartPos, setResizeStartPos,
    resizeStartSize, setResizeStartSize,
    
    // Drag state
    isDragging, setIsDragging,
    dragStartPos, setDragStartPos,
    dragStartElementPos, setDragStartElementPos
    // saveToHistory // Removed: Not provided by useCanvasState, use local definition
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

  const handleResizeMove = useCallback((e: React.MouseEvent) => {
    if (!isResizing || !resizeHandle || !selectedElement || !resizeStartPos || !resizeStartSize) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const currentX = (rawX / zoomLevel) - panOffset.x;
    const currentY = (rawY / zoomLevel) - panOffset.y;

    const deltaX = currentX - resizeStartPos.x;
    const deltaY = currentY - resizeStartPos.y;

    setElements((prevElements: CanvasElement[]) => prevElements.map(el => {
      if (el.id !== selectedElement) return el;

      let newWidth = resizeStartSize.width;
      let newHeight = resizeStartSize.height;
      let newX = el.x;
      let newY = el.y;

      switch (resizeHandle) {
        case 'top-left':
          newWidth = Math.max(20, resizeStartSize.width - deltaX);
          newHeight = Math.max(20, resizeStartSize.height - deltaY);
          newX = (el.x ?? 0) + (resizeStartSize.width - newWidth);
          newY = (el.y ?? 0) + (resizeStartSize.height - newHeight);
          break;
        case 'top-right':
          newWidth = Math.max(20, resizeStartSize.width + deltaX);
          newHeight = Math.max(20, resizeStartSize.height - deltaY);
          newY = (el.y ?? 0) + (resizeStartSize.height - newHeight);
          break;
        case 'bottom-left':
          newWidth = Math.max(20, resizeStartSize.width - deltaX);
          newHeight = Math.max(20, resizeStartSize.height + deltaY);
          newX = (el.x ?? 0) + (resizeStartSize.width - newWidth);
          break;
        case 'bottom-right':
          newWidth = Math.max(20, resizeStartSize.width + deltaX);
          newHeight = Math.max(20, resizeStartSize.height + deltaY);
          break;
        case 'top':
          newHeight = Math.max(20, resizeStartSize.height - deltaY);
          newY = (el.y ?? 0) + (resizeStartSize.height - newHeight);
          break;
        case 'bottom':
          newHeight = Math.max(20, resizeStartSize.height + deltaY);
          break;
        case 'left':
          newWidth = Math.max(20, resizeStartSize.width - deltaX);
          newX = (el.x ?? 0) + (resizeStartSize.width - newWidth);
          break;
        case 'right':
          newWidth = Math.max(20, resizeStartSize.width + deltaX);
          break;
      }
      return { ...el, x: newX, y: newY, width: newWidth, height: newHeight }; 
    }));
  }, [isResizing, resizeHandle, selectedElement, resizeStartPos, resizeStartSize, zoomLevel, panOffset, setElements, canvasRef]);

  // Mouse event handlers
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isResizing && resizeHandle && selectedElement) {
      handleResizeMove(e);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const currentX = (rawX / zoomLevel) - panOffset.x;
    const currentY = (rawY / zoomLevel) - panOffset.y;
    setMousePos({ x: currentX, y: currentY });

    // Handle element dragging
    if (isDragging && selectedElement) {
      const deltaX = currentX - dragStartPos.x;
      const deltaY = currentY - dragStartPos.y;
      
      setElements(prevElements => 
        prevElements.map(el => 
          el.id === selectedElement 
            ? { 
                ...el, 
                x: dragStartElementPos.x + deltaX, 
                y: dragStartElementPos.y + deltaY 
              }
            : el
        )
      );
      return;
    }

    if (isPreviewing && previewElement) {
      let updatedPreview = { ...previewElement };
      switch (previewElement.type) {
        case 'line':
        case 'arrow':
          updatedPreview.x2 = currentX;
          updatedPreview.y2 = currentY;
          break;
        case 'drawing': 
          updatedPreview.path = `${previewElement.path || ''} L ${currentX.toFixed(2)} ${currentY.toFixed(2)}`;
          break;
        case 'rectangle':
        case 'circle':
        case 'triangle':
        case 'square':
        case 'hexagon':
        case 'star':
          updatedPreview.width = Math.abs(currentX - (previewElement.x || 0));
          updatedPreview.height = Math.abs(currentY - (previewElement.y || 0));
          if (currentX < (previewElement.x || 0)) updatedPreview.x = currentX;
          if (currentY < (previewElement.y || 0)) updatedPreview.y = currentY;
          break;
      }
      setPreviewElement(updatedPreview);
      return;
    }
  }, [isDragging, selectedElement, dragStartPos, dragStartElementPos, setElements, isResizing, resizeHandle, selectedElement, handleResizeMove, zoomLevel, panOffset, setMousePos, isPreviewing, previewElement, setPreviewElement, activeTool]);

  // Throttled mouse move for better performance
  const throttledCanvasMouseMove = useMemo(
    () => throttle(handleCanvasMouseMove, 16), // ~60fps
    [handleCanvasMouseMove]
  );

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    // Handle end of dragging
    if (isDragging) {
      setIsDragging(false);
      saveToHistory(elements);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default';
      }
      return;
    }

    if (isPreviewing && previewElement) { 
      let isValidElement = true;
      if ((previewElement.type === 'rectangle' || previewElement.type === 'circle' || previewElement.type === 'triangle' || previewElement.type === 'square' || previewElement.type === 'hexagon' || previewElement.type === 'star') && (!previewElement.width || !previewElement.height || previewElement.width < 5 || previewElement.height < 5)) {
        isValidElement = false;
      }
      if ((previewElement.type === 'line' || previewElement.type === 'arrow') && previewElement.x === previewElement.x2 && previewElement.y === previewElement.y2) {
        isValidElement = false;
      }
      if (previewElement.type === 'drawing' && previewElement.path && previewElement.path.split('L').length < 2) { 
        isValidElement = false;
      }

      if (isValidElement) {
        const finalElementToAdd: CanvasElement = { ...previewElement, id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
        setElements((prevElements: CanvasElement[]) => {
          const updatedElements = [...prevElements, finalElementToAdd];
          saveToHistory(updatedElements);
          return updatedElements;
        });
      } else {
      }
      
      setIsPreviewing(false);
      setPreviewElement(null);
      setIsResizing(false);
      setResizeHandle(null);
      if (canvasRef.current) canvasRef.current.style.cursor = 'default';
    }
  }, [isDragging, setIsDragging, saveToHistory, elements, canvasRef, isPreviewing, previewElement, setElements, setIsPreviewing, setPreviewElement, activeTool, setIsResizing, setResizeHandle]);

  // Element mouse down handler
  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    if (activeTool === 'eraser') {
      const newElements = elements.filter(el => el.id !== elementId);
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedElement(null);
      return;
    }

    if (activeTool === 'highlighter' && element.type === 'text') {
      setElements((prevElements: CanvasElement[]) => prevElements.map(el => 
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

    if (activeTool === 'select') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Set as selected
      setSelectedElement(elementId);
      
      // Start dragging
      setIsDragging(true);
      const mouseX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const mouseY = (e.clientY - rect.top - panOffset.y) / zoomLevel;
      setDragStartPos({ x: mouseX, y: mouseY });
      setDragStartElementPos({ x: element.x, y: element.y });
      
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    }
  }, [activeTool, elements, setElements, saveToHistory, setSelectedElement, setIsDragging, setDragStartPos, setDragStartElementPos, canvasRef, panOffset, zoomLevel]);

  // Canvas click handler
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mousePos = {
      x: (e.clientX - rect.left - panOffset.x) / zoomLevel,
      y: (e.clientY - rect.top - panOffset.y) / zoomLevel
    };

    // Text tool: create new text element
    if (activeTool === 'text') {
      const newElement: CanvasElement = {
        id: `el-${Date.now()}`,
        type: 'text',
        x: mousePos.x,
        y: mousePos.y,
        width: 200, 
        height: 30, 
        content: 'Text',
        fontSize: 'medium',
        color: '#000000'
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedElement(newElement.id);
      setIsEditingText(newElement.id);
      setActiveTool('select'); 
      return;
    }

    // Sticky note tool: create new sticky note
    if (activeTool === 'sticky-note') {
      const newElement: CanvasElement = {
        id: `el-${Date.now()}`,
        type: 'sticky-note',
        x: mousePos.x,
        y: mousePos.y,
        width: 150,
        height: 150,
        content: '',
        backgroundColor: '#FFFF00' 
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedElement(newElement.id);
      setIsEditingText(newElement.id); 
      setActiveTool('select');
      return;
    }

    // Pan tool (select tool used for panning when clicking empty canvas)
    if (activeTool === 'select') {
      setSelectedElement(null); // Deselect
      return;
    }
  }, [activeTool, elements, setElements, saveToHistory, setSelectedElement, setIsEditingText, setActiveTool, canvasRef, panOffset, zoomLevel]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isEditingText) return; 

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedElement) handleDeleteElement();
    }
    if (e.key === 'Escape') {
      setSelectedElement(null);
      setActiveTool('select');
      setIsPreviewing(false); 
      setPreviewElement(null);
      if (showShapeDropdown) setShowShapeDropdown(false);
      if (showTextFormatting) setShowTextFormatting(false);
    }
    if (!e.ctrlKey && !e.metaKey && !e.altKey) { 
      switch (e.key.toLowerCase()) {
        case 'v': setActiveTool('select'); break;
        case 't': setActiveTool('text'); break;
        case 's': setActiveTool('sticky-note'); break; 
        case 'r': setActiveTool('rectangle'); break; 
        case 'c': setActiveTool('circle'); break;
        case 'p': setActiveTool('pen'); break;
        case 'l': setActiveTool('line'); break;
        case 'a': setActiveTool('arrow'); break;
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    }
  }, [
    isEditingText, selectedElement, setSelectedElement, setActiveTool, 
    handleDeleteElement, handleUndo, handleRedo,
    setIsPreviewing, setPreviewElement, 
    showShapeDropdown, setShowShapeDropdown, 
    showTextFormatting, setShowTextFormatting
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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
    handleCanvasMouseDown: handleCanvasClick, 
    handleCanvasMouseMove: throttledCanvasMouseMove, 
    handleMouseUp,
    handleElementMouseDown,
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
        { position: 'top', x: element.x + (element.width / 2) - 4, y: element.y - 4 },
        { position: 'bottom', x: element.x + (element.width / 2) - 4, y: element.y + element.height - 4 },
        { position: 'left', x: element.x - 4, y: element.y + (element.height / 2) - 4 },
        { position: 'right', x: element.x + element.width - 4, y: element.y + (element.height / 2) - 4 }
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
