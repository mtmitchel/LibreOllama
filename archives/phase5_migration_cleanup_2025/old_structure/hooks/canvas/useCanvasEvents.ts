import React, { useCallback, useEffect, useRef } from 'react';
import { useKonvaCanvasStore } from '@/stores/konvaCanvasStore';
import type { CanvasElement } from '@/stores/konvaCanvasStore';

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
  // Get store actions from KonvaCanvasStore
  const addElement = useKonvaCanvasStore((state) => state.addElement);
  const updateElement = useKonvaCanvasStore((state) => state.updateElement);
  const deleteElement = useKonvaCanvasStore((state) => state.deleteElement);
  const selectElement = useKonvaCanvasStore((state) => state.selectElement);
  const clearSelection = useKonvaCanvasStore((state) => state.clearSelection);
  const setPan = useKonvaCanvasStore((state) => state.setPan);
  const setZoom = useKonvaCanvasStore((state) => state.setZoom);
  const setSelectedTool = useKonvaCanvasStore((state) => state.setSelectedTool);
  const setIsEditingText = useKonvaCanvasStore((state) => state.setIsEditingText);
  const addToHistory = useKonvaCanvasStore((state) => state.addToHistory);
  const updateMultipleElements = useKonvaCanvasStore((state) => state.updateMultipleElements);

  // Handle mouse down on individual elements
  const handleElementMouseDown = useCallback((pixiEvent: any, elementId: string) => {
    console.log('Element mouse down:', elementId);
    pixiEvent.stopPropagation();
    
    if (pixiEvent.data?.originalEvent?.stopPropagation) {
      pixiEvent.data.originalEvent.stopPropagation();
    }
    
    const { elements: currentElements, selectedTool: currentActiveTool, isEditingText: currentEditingText } = useKonvaCanvasStore.getState();
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
          updateElement(currentEditingText, { text: currentTextValue });
          addToHistory('Update element text');
        }
        setIsEditingText(null);
      }
      
      if (shiftPressed) {
        // For multi-selection, we need to handle this differently
        const currentSelected = useKonvaCanvasStore.getState().selectedElementIds;
        if (!currentSelected.includes(elementId)) {
          useKonvaCanvasStore.setState((state) => {
            state.selectedElementIds.push(elementId);
            state.selectedElementId = elementId;
          });
        }
      } else {
        selectElement(elementId);
      }

      // Prepare for dragging
      const startDragWorldCoords = getCanvasCoordinates(pixiEvent.global.x, pixiEvent.global.y);
      
      initialElementPositions.current = {};
      const idsToDrag = useKonvaCanvasStore.getState().selectedElementIds;
      idsToDrag.forEach((id: string) => {
        if (currentElements[id]) {
          initialElementPositions.current[id] = { x: currentElements[id].x, y: currentElements[id].y };
        }
      });
      
      if (idsToDrag.includes(elementId) && !initialElementPositions.current[elementId]) {
         initialElementPositions.current[elementId] = { x: element.x, y: element.y };
      }

      useKonvaCanvasStore.getState().setDragState(true, startDragWorldCoords, initialElementPositions.current);
    }
  }, [selectElement, updateElement, addToHistory, getCanvasCoordinates, textAreaRef]);
  // Handle mouse down on canvas background
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const currentStoreState = useKonvaCanvasStore.getState();

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
            updateElement(currentStoreState.isEditingText, { text: currentTextValue });
            addToHistory('Update text content');
          }
          setIsEditingText(null);
        }
        clearSelection();
        break;

      case 'pen':
        useKonvaCanvasStore.getState().setIsDrawing(true);
        useKonvaCanvasStore.getState().setPreviewState({
          id: 'preview-drawing',
          type: 'pen' as CanvasElement['type'],
          x: x,
          y: y,
          points: [x, y],
          stroke: '#000000',
          strokeWidth: 2
        });
        break;

      case 'text':
      case 'sticky-note':
        if (currentIsDrawing && currentPreviewElement && currentPreviewElement.type) {
          const finalElement: CanvasElement = {
            ...currentPreviewElement,
            id: generateId(),
            type: currentPreviewElement.type
          } as CanvasElement;
          addElement(finalElement);
          addToHistory('Add element');
        }
        useKonvaCanvasStore.getState().setIsDrawing(false);
        useKonvaCanvasStore.getState().setPreviewState(null);
        
        const textElement: CanvasElement = {
          id: generateId(),
          type: currentActiveTool,
          x: x,
          y: y,
          width: 200,
          height: currentActiveTool === 'sticky-note' ? 100 : 50,
          content: '',
          color: '#000000',
          backgroundColor: currentActiveTool === 'sticky-note' ? '#FFFFE0' : 'transparent',
          fontSize: 16
        };
        addElement(textElement);
        addToHistory();
        setIsEditingText(textElement.id);
        break;

      default:
        if (['rectangle', 'circle', 'triangle', 'square', 'hexagon', 'star', 'line', 'arrow'].includes(currentActiveTool)) {
          const shapeElement: CanvasElement = {
            id: generateId(),
            type: currentActiveTool as CanvasElement['type'],
            x: x,
            y: y,
            width: 80,
            height: 80,
            color: '#000000',
            backgroundColor: '#ffffff',
            stroke: '#000000',
            strokeWidth: 1
          };
          
          if (currentActiveTool === 'circle') {
            shapeElement.radius = 40;
          } else if (currentActiveTool === 'line') {
            shapeElement.points = [0, 0, 80, 0];
          }
          
          addElement(shapeElement);
          addToHistory();        }
        break;
    }
  }, [canvasContainerRef, clearSelection, setIsEditingText, getCanvasCoordinates, updateElement, addToHistory, textAreaRef, generateId, addElement]);

  // Global mouse move handler
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const currentStoreState = useKonvaCanvasStore.getState();
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

      const batchUpdates: Record<string, Partial<CanvasElement>> = {};
      currentSelectedIds.forEach((id: string) => {
        if (currentDragStartElementPositions[id]) {
          batchUpdates[id] = {
            x: currentDragStartElementPositions[id].x + deltaX,
            y: currentDragStartElementPositions[id].y + deltaY
          };
        }
      });

      updateMultipleElements(batchUpdates);
    } else if (currentIsDrawing && currentPreviewElement && currentPreviewElement.type === 'pen') {
      const currentPoint = getCanvasCoordinates(e.clientX, e.clientY);
      const existingPoints = currentPreviewElement.points || [];
      const updatedPoints = [...existingPoints, currentPoint.x, currentPoint.y];
      
      useKonvaCanvasStore.getState().setPreviewState({
        ...currentPreviewElement,
        points: updatedPoints
      });
    }
  }, [getCanvasCoordinates, updateMultipleElements]);

  // Global mouse up handler
  const handleGlobalMouseUp = useCallback(() => {
    const currentStoreState = useKonvaCanvasStore.getState();
    const {
      isDragging: currentIsDragging,
      isDrawing: currentIsDrawing,
      previewElement: currentPreviewElement
    } = currentStoreState;

    if (currentIsDragging) {
      useKonvaCanvasStore.getState().setDragState(false, undefined, undefined);
      addToHistory();
    } else if (currentIsDrawing && currentPreviewElement) {
      const finalElement: CanvasElement = {
        ...currentPreviewElement,
        id: generateId(),
        type: currentPreviewElement.type!
      } as CanvasElement;
      addElement(finalElement);
      addToHistory();
      useKonvaCanvasStore.getState().setIsDrawing(false);
      useKonvaCanvasStore.getState().setPreviewState(null);
    }

    useKonvaCanvasStore.getState().setPreviewState(null);
  }, [generateId, addElement, addToHistory]);

  // Keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { selectedElementIds: currentSelectedIds, isEditingText: currentEditingId } = useKonvaCanvasStore.getState();

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
        }
        setIsEditingText(null);
      }
    }
  }, [deleteElement, updateElement, setIsEditingText, textAreaRef, addToHistory]);

  // Handle wheel events for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const { zoom: currentZoom, pan: currentPan } = useKonvaCanvasStore.getState();
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
    const { selectedElementIds: currentSelectedIds, elements: currentElements } = useKonvaCanvasStore.getState();
    
    if (currentSelectedIds.length > 0) {
      console.log('Deleting elements:', currentSelectedIds);
      
      currentSelectedIds.forEach((id: string) => {
        if (currentElements[id]) {
          deleteElement(id);
        }
      });
      addToHistory();
      
      setTimeout(() => {
        const updatedState = useKonvaCanvasStore.getState();
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
