import React, { useCallback, useEffect, useRef } from 'react';
import { useKonvaCanvasStore, CanvasElement } from '@/stores/konvaCanvasStore';

interface UseCanvasEventsProps {
  canvasContainerRef: React.RefObject<HTMLDivElement>;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
  getCanvasCoordinates: (clientX: number, clientY: number) => { x: number; y: number };
  generateId: () => string;
}

interface UseCanvasEventsReturn {
  handleElementMouseDown: (pixiEvent: any, elementId: string) => void;
  handleCanvasMouseDown: (e: React.MouseEvent) => void;
  handleDeleteButtonClick: () => void;
}

/**
 * Custom hook that manages all canvas event handling logic
 */
export const useCanvasEvents = ({
  canvasContainerRef,
  textAreaRef,
  getCanvasCoordinates,
  generateId,
}: UseCanvasEventsProps): UseCanvasEventsReturn => {  
  // Store refs for internal state that doesn't need to trigger re-renders
  const initialElementPositions = useRef<Record<string, { x: number; y: number }>>({});
    // Get store actions
  const addElement = useFabricCanvasStore((state) => state.addElement);
  const updateElement = useFabricCanvasStore((state) => state.updateElement);
  const deleteElement = useFabricCanvasStore((state) => state.deleteElement);
  const selectElement = useFabricCanvasStore((state) => state.selectElement);
  const clearSelection = useFabricCanvasStore((state) => state.clearSelection);
  const setPan = useFabricCanvasStore((state) => state.setPan);
  const setZoom = useFabricCanvasStore((state) => state.setZoom);
  const setDragState = useFabricCanvasStore((state) => state.setDragState);
  const setIsDrawing = useFabricCanvasStore((state) => state.setIsDrawing);
  const setPreviewState = useFabricCanvasStore((state) => state.setPreviewState);
  const setIsEditingText = useFabricCanvasStore((state) => state.setIsEditingText);
  const setTextFormattingState = useFabricCanvasStore((state) => state.setTextFormattingState);
  const setTextSelectionState = useFabricCanvasStore((state) => state.setTextSelectionState);
  const addToHistory = useFabricCanvasStore((state) => state.addToHistory);
  const updateMultipleElements = useFabricCanvasStore((state) => state.updateMultipleElements);

  // Handle mouse down on individual elements
  const handleElementMouseDown = useCallback((pixiEvent: any, elementId: string) => {
    console.log('Element mouse down:', elementId);
    pixiEvent.stopPropagation();
    
    if (pixiEvent.data?.originalEvent?.stopPropagation) {
      pixiEvent.data.originalEvent.stopPropagation();
    }
    
    const { elements: currentElements, activeTool: currentActiveTool, isEditingText: currentEditingText } = useFabricCanvasStore.getState();
    const element = currentElements[elementId];

    if (!element) {
      console.warn('Element not found in store:', elementId);
      return;
    }

    if (currentActiveTool === 'select') {
      const shiftPressed = pixiEvent.data?.originalEvent?.shiftKey || false;
      
      // Clear text editing when selecting elements
      if (!shiftPressed && currentEditingText && typeof currentEditingText === 'string') {
        if (textAreaRef.current) {
          const currentTextValue = textAreaRef.current.value;
          updateElement(currentEditingText, { content: currentTextValue });
          addToHistory();
        }
        setIsEditingText(null);
        setTextFormattingState(false);
        setTextSelectionState(null, null, null);
      }
      
      if (shiftPressed) {
        selectElement(elementId, true);
      } else {
        selectElement(elementId, false);
      }

      // Prepare for dragging
      const startDragWorldCoords = getCanvasCoordinates(pixiEvent.global.x, pixiEvent.global.y);
      
      initialElementPositions.current = {};
      const idsToDrag = useFabricCanvasStore.getState().selectedElementIds;
      idsToDrag.forEach((id: string) => {
        if (currentElements[id]) {
          initialElementPositions.current[id] = { x: currentElements[id].x, y: currentElements[id].y };
        }
      });
      
      if (idsToDrag.includes(elementId) && !initialElementPositions.current[elementId]) {
         initialElementPositions.current[elementId] = { x: element.x, y: element.y };
      }

      setDragState(true, startDragWorldCoords, initialElementPositions.current);
    }
  }, [selectElement, updateElement, addToHistory, setDragState, setIsEditingText, setTextFormattingState, setTextSelectionState, getCanvasCoordinates, textAreaRef]);
  // Handle mouse down on canvas background
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const currentStoreState = useFabricCanvasStore.getState();

    // SAFETY NET: If we're editing text, don't interfere with text editing
    if (currentStoreState.isEditingText) {
      return;
    }

    // Check if we have a pending double-click
    if (currentStoreState.pendingDoubleClick) {
      return;
    }

    // Check if the click target is a canvas element (Fabric.js canvas or mock component)
    const isCanvasElement = e.target instanceof HTMLCanvasElement ||
                           (e.target instanceof HTMLElement && e.target.getAttribute('data-canvas-component'));
    
    if (e.target !== canvasContainerRef.current && !isCanvasElement) {
      return;
    }

    const isTextarea = e.target instanceof HTMLTextAreaElement;

    if (!isTextarea) {
      e.preventDefault();
    }
    
    const {
      activeTool: currentActiveTool,
      isDragging: currentIsDragging,
      isDrawing: currentIsDrawing,
      previewElement: currentPreviewElement
    } = currentStoreState;

    if (currentIsDragging) {
      return;
    }
    
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

    switch (currentActiveTool) {
      case 'select':
        if (currentStoreState.isEditingText && typeof currentStoreState.isEditingText === 'string') {
          if (textAreaRef.current) {
            const currentTextValue = textAreaRef.current.value;
            updateElement(currentStoreState.isEditingText, { content: currentTextValue });
            addToHistory();
          }
          setIsEditingText(null);
        }
        clearSelection();
        setTextFormattingState(false);
        setTextSelectionState(null, null, null);
        break;

      case 'pen':
        setIsDrawing(true);
        setPreviewState(true, {
          id: 'preview-drawing',
          type: 'drawing',
          x: x,
          y: y,
          points: [{ x, y }],
          strokeColor: '#000000',
          strokeWidth: 2
        });
        break;

      case 'text':
      case 'sticky-note':
        if (currentIsDrawing && currentPreviewElement) {
          const finalElement: FabricCanvasElement = { ...currentPreviewElement, id: generateId() };
          addElement(finalElement);
          addToHistory();
        }
        setIsDrawing(false);
        setPreviewState(false, null);
        
        const textElement: FabricCanvasElement = {
          id: generateId(),
          type: currentActiveTool,
          x: x,
          y: y,
          width: 200,
          height: currentActiveTool === 'sticky-note' ? 100 : 50,
          content: '',
          color: '#000000',
          backgroundColor: currentActiveTool === 'sticky-note' ? '#FFFFE0' : 'transparent',
          fontSize: 'medium'
        };
        addElement(textElement);
        addToHistory();
        setIsEditingText(textElement.id);
        break;

      default:
        if (['rectangle', 'circle', 'triangle', 'square', 'hexagon', 'star', 'line', 'arrow'].includes(currentActiveTool)) {
          const shapeElement: FabricCanvasElement = {
            id: generateId(),
            type: currentActiveTool as FabricCanvasElement['type'],
            x: x,
            y: y,
            width: 80,
            height: 80,
            color: '#000000',
            backgroundColor: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 1
          };
          
          if (currentActiveTool === 'circle') {
            shapeElement.radius = 40;
          } else if (currentActiveTool === 'line') {
            shapeElement.points = [{ x: 0, y: 0 }, { x: 80, y: 0 }];
          }
          
          addElement(shapeElement);
          addToHistory();        }
        break;
    }
  }, [canvasContainerRef, clearSelection, setIsEditingText, setTextFormattingState, setTextSelectionState, getCanvasCoordinates, setIsDrawing, setPreviewState, updateElement, addToHistory, textAreaRef, generateId, addElement]);

  // Global mouse move handler
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const currentStoreState = useFabricCanvasStore.getState();
    const {
      isDragging: currentIsDragging,
      isDrawing: currentIsDrawing,
      dragStartPos: currentDragStartPos,
      dragStartElementPositions: currentDragStartElementPositions,
      previewElement: currentPreviewElement,
      selectedElementIds: currentSelectedIds
    } = currentStoreState;

    if (currentIsDragging && currentDragStartPos && currentDragStartElementPositions) {
      const currentMousePos = getCanvasCoordinates(e.clientX, e.clientY);
      const deltaX = currentMousePos.x - currentDragStartPos.x;
      const deltaY = currentMousePos.y - currentDragStartPos.y;

      const batchUpdates: Record<string, Partial<FabricCanvasElement>> = {};
      currentSelectedIds.forEach((id: string) => {
        if (currentDragStartElementPositions[id]) {
          batchUpdates[id] = {
            x: currentDragStartElementPositions[id].x + deltaX,
            y: currentDragStartElementPositions[id].y + deltaY
          };
        }
      });

      updateMultipleElements(batchUpdates);
    } else if (currentIsDrawing && currentPreviewElement && currentPreviewElement.type === 'drawing') {
      const currentPoint = getCanvasCoordinates(e.clientX, e.clientY);
      const updatedPoints = [...(currentPreviewElement.points || []), currentPoint];
      
      setPreviewState(true, {
        ...currentPreviewElement,
        points: updatedPoints
      });
    }
  }, [getCanvasCoordinates, updateMultipleElements, setPreviewState]);

  // Global mouse up handler
  const handleGlobalMouseUp = useCallback(() => {
    const currentStoreState = useFabricCanvasStore.getState();
    const {
      isDragging: currentIsDragging,
      isDrawing: currentIsDrawing,
      previewElement: currentPreviewElement
    } = currentStoreState;

    if (currentIsDragging) {
      setDragState(false, null, null);
      addToHistory();
    } else if (currentIsDrawing && currentPreviewElement) {
      const finalElement: FabricCanvasElement = { ...currentPreviewElement, id: generateId() };
      addElement(finalElement);
      addToHistory();
      setIsDrawing(false);
      setPreviewState(false, null);
    }

    setPreviewState(false, null);
  }, [generateId, addElement, addToHistory, setIsDrawing, setPreviewState, setDragState]);

  // Keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { selectedElementIds: currentSelectedIds, isEditingText: currentEditingId } = useFabricCanvasStore.getState();

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (currentSelectedIds.length > 0) {
        e.preventDefault();
        currentSelectedIds.forEach((id: string) => deleteElement(id));
        addToHistory();
      } else if (currentEditingId && typeof currentEditingId === 'string') {
        if (textAreaRef.current) {
          const currentTextValue = textAreaRef.current.value;
          updateElement(currentEditingId, { content: currentTextValue });
          addToHistory();
        }
      }
    } else if (e.key === 'Escape') {
      if (currentEditingId && typeof currentEditingId === 'string') {
        if (textAreaRef.current) {
          const currentTextValue = textAreaRef.current.value;
          updateElement(currentEditingId, { content: currentTextValue });
          addToHistory();
        }        setIsEditingText(null);
        setTextFormattingState(false);
      }
    }
  }, [deleteElement, updateElement, setIsEditingText, setTextFormattingState, textAreaRef, addToHistory]);

  // Handle wheel events for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const { zoom: currentZoom, pan: currentPan } = useFabricCanvasStore.getState();
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
  }, [canvasContainerRef, setZoom, setPan]);

  // Delete button click handler
  const handleDeleteButtonClick = useCallback(() => {
    const { selectedElementIds: currentSelectedIds, elements: currentElements } = useFabricCanvasStore.getState();
    
    if (currentSelectedIds.length > 0) {
      console.log('Deleting elements:', currentSelectedIds);
      
      currentSelectedIds.forEach((id: string) => {
        if (currentElements[id]) {
          deleteElement(id);
        }
      });
      addToHistory();
      
      setTimeout(() => {
        const updatedState = useFabricCanvasStore.getState();
        if (updatedState.selectedElementIds.length === 0) {
          clearSelection();
        }
      }, 0);
    }
  }, [deleteElement, addToHistory, clearSelection]);
  // Set up global event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleGlobalMouseMove(e);
    const handleMouseUp = () => handleGlobalMouseUp();
    const handleKeyDownEvent = (e: KeyboardEvent) => handleKeyDown(e);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDownEvent);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDownEvent);
    };  }, [handleGlobalMouseMove, handleGlobalMouseUp, handleKeyDown]);

  // Setup wheel event listener on canvas container
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel, canvasContainerRef]);

  return {
    handleElementMouseDown,
    handleCanvasMouseDown,
    handleDeleteButtonClick,
  };
};