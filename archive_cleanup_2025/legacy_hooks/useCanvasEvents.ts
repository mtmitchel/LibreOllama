import React, { useCallback, useEffect, useRef } from 'react';
import { useFabricCanvasStore, CanvasElement } from '@/stores/fabricCanvasStoreFixed';

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
 * Extracts mouse/keyboard events from Canvas component and provides proper global listeners
 * Integrates with existing Zustand canvasStore for state management
 */
export const useCanvasEvents = ({
  canvasContainerRef,
  textAreaRef,
  getCanvasCoordinates,
  generateId,
}: UseCanvasEventsProps): UseCanvasEventsReturn => {  // Store refs for internal state that doesn't need to trigger re-renders
  const isPanning = useRef(false);
  const initialElementPositions = useRef<Record<string, { x: number; y: number }>>({});
  // Get store actions (these are stable function references from Zustand)
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

  // Handle mouse down on individual elements (Pixi events)
  const handleElementMouseDown = useCallback((pixiEvent: any, elementId: string) => {
    console.log('Element mouse down:', elementId, pixiEvent);
    pixiEvent.stopPropagation(); // Prevent canvas click from firing
    // Also stop propagation of the original DOM event if it exists
    if (pixiEvent.data && pixiEvent.data.originalEvent && typeof pixiEvent.data.originalEvent.stopPropagation === 'function') {
      pixiEvent.data.originalEvent.stopPropagation();
    }
    const { elements: currentElements, activeTool: currentActiveTool, isEditingText: currentEditingText } = useCanvasStore.getState();
    const element = currentElements[elementId];

    if (!element) {
      console.warn('Element not found in store:', elementId);
      return;
    }
    
    console.log('Processing element interaction:', { elementId, activeTool: currentActiveTool });

    if (currentActiveTool === 'select') {
      // Check for shift key in Pixi events
      const shiftPressed = pixiEvent.data?.originalEvent?.shiftKey || false;
      
      // Clear text editing when selecting elements (unless shift-clicking to add to selection)
      if (!shiftPressed && currentEditingText) {
        if (textAreaRef.current) {
          const currentTextValue = textAreaRef.current.value;
          updateElement(currentEditingText, { content: currentTextValue });
          addToHistory(useCanvasStore.getState().elements);
        }
        setIsEditingText(null);
        setTextFormattingState(false);
        setTextSelectionState(null, null, null);
      }
      
      if (shiftPressed) {
        selectElement(elementId, true); // Add/toggle to selection with shift
      } else {
        selectElement(elementId, false); // Select only this element (clear others)
      }

      // Prepare for dragging selected elements
      // Convert screen/stage coordinates from Pixi event to WORLD coordinates
      const startDragWorldCoords = getCanvasCoordinates(pixiEvent.global.x, pixiEvent.global.y);
      
      initialElementPositions.current = {};
      const idsToDrag = useCanvasStore.getState().selectedElementIds;
      idsToDrag.forEach(id => {
        if (currentElements[id]) {
          initialElementPositions.current[id] = { x: currentElements[id].x, y: currentElements[id].y };
        }
      });
      
      // If the clicked element wasn't part of a multi-selection but is now selected, ensure it's in initialElementPositions
      if (idsToDrag.includes(elementId) && !initialElementPositions.current[elementId]) {
         initialElementPositions.current[elementId] = { x: element.x, y: element.y };
      }

      // Store WORLD coordinates for drag start position
      setDragState(true, startDragWorldCoords, initialElementPositions.current);
    }
  }, [selectElement, setDragState, updateElement, addToHistory, setIsEditingText, setTextFormattingState, setTextSelectionState, textAreaRef, getCanvasCoordinates]); // Added getCanvasCoordinates  // Handle mouse down events on the main canvas workspace
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const currentStoreState = useCanvasStore.getState();

    // SAFETY NET: If we're editing text, don't interfere with text editing
    if (currentStoreState.isEditingText) {
      return;
    }

    // Check if we have a pending double-click
    if (currentStoreState.pendingDoubleClick) {
      return;
    }

    // Check if the click target is a PIXI element (real canvas or mock PIXI component)
    const isPixiElement = e.target instanceof HTMLCanvasElement ||
                         (e.target instanceof HTMLElement && e.target.getAttribute('data-pixi-component'));
    
    if (e.target !== canvasContainerRef.current && !isPixiElement) {
      return;
    }
    
    // Note: Removed early return for PIXI canvas clicks to allow panning
    // PIXI elements will still handle their own events via stopPropagation

    const isTextarea = e.target instanceof HTMLTextAreaElement;

    if (!isTextarea) {
      e.preventDefault();
    }

    // If select tool and clicked on empty canvas, clear selection and text edit state
    if (currentStoreState.activeTool === 'select') {
      console.log('Canvas click with select tool - clearing selection');
      // Only clear selection if not shift-clicking (to allow multi-select) and no pending double-click
      if (!e.shiftKey && !currentStoreState.pendingDoubleClick) {
        clearSelection();
      }
      if (currentStoreState.isEditingText) {
        // Commit text if editing
        if (textAreaRef.current && currentStoreState.isEditingText) {
          const currentTextValue = textAreaRef.current.value;
          updateElement(currentStoreState.isEditingText, { content: currentTextValue });
          addToHistory(useCanvasStore.getState().elements);
        }
        setIsEditingText(null);
        setTextFormattingState(false);
        setTextSelectionState(null, null, null);
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
        type: currentStoreState.activeTool === 'pen' ? 'drawing' : currentStoreState.activeTool as any,
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
        content: currentStoreState.activeTool === 'text' ? '' : '',
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
  }, [canvasContainerRef, clearSelection, setIsEditingText, setTextFormattingState, setTextSelectionState, getCanvasCoordinates, setIsDrawing, setPreviewState, setDragState, updateElement, addToHistory, textAreaRef]);

  // Global mouse move handler - critical for preventing stuck states
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const {      isDragging: currentIsDragging, 
      dragStartPos: currentDragStartPos, 
      activeTool: currentActiveTool, 
      pan: currentPan, 
      selectedElementIds: currentSelectedIds, 
      previewElement: currentPreviewElement, 
      isDrawing: currentIsDrawing, 
      dragStartElementPositions: currentDragStartElementPositions,
      zoom: currentZoom,
      updateMultipleElements // Get the new batch update action
    } = useCanvasStore.getState();

    if (!currentIsDragging) return;

    const currentMouseWorldCoords = getCanvasCoordinates(e.clientX, e.clientY);     if (currentActiveTool === 'select' && currentDragStartPos && currentDragStartElementPositions && currentSelectedIds.length > 0) {
      const dx = currentMouseWorldCoords.x - currentDragStartPos.x;
      const dy = currentMouseWorldCoords.y - currentDragStartPos.y;

      const batchUpdates: Record<string, Partial<CanvasElement>> = {};
      currentSelectedIds.forEach(id => {
        const initialPos = currentDragStartElementPositions[id];
        if (initialPos) {
          batchUpdates[id] = {
            x: initialPos.x + dx,
            y: initialPos.y + dy,
          };
        }
      });
      
      if (Object.keys(batchUpdates).length > 0) {
        updateMultipleElements(batchUpdates); // Use batch update
        // DO NOT addToHistory here; do it on mouse up (drag end)
      }

    } else if (isPanning.current && currentActiveTool === 'select' && currentDragStartPos) {
      const screenMouseCoords = { x: e.clientX, y: e.clientY };
      const dxScreen = screenMouseCoords.x - currentDragStartPos.x;
      const dyScreen = screenMouseCoords.y - currentDragStartPos.y;

      const dxWorld = dxScreen / currentZoom;
      const dyWorld = dyScreen / currentZoom;
      
      setPan({ 
        x: currentPan.x + dxWorld, // Corrected pan direction based on prompt
        y: currentPan.y + dyWorld  // Corrected pan direction based on prompt
      });
      setDragState(true, { x: screenMouseCoords.x, y: screenMouseCoords.y }, null);
    } else if (currentIsDrawing && currentDragStartPos && currentPreviewElement) {
      // For drawing, currentDragStartPos is world (from getCanvasCoordinates in handleCanvasMouseDown)
      // currentMouseWorldCoords is already calculated
      let newWidth = Math.abs(currentMouseWorldCoords.x - currentDragStartPos.x);
      let newHeight = Math.abs(currentMouseWorldCoords.y - currentDragStartPos.y);
      let newX = Math.min(currentMouseWorldCoords.x, currentDragStartPos.x);
      let newY = Math.min(currentMouseWorldCoords.y, currentDragStartPos.y);

      if (currentPreviewElement.type === 'line' || currentPreviewElement.type === 'drawing') {
        const updatedPoints = [...(currentPreviewElement.points || []), currentMouseWorldCoords];
        setPreviewState(true, { ...currentPreviewElement, points: updatedPoints, x: newX, y: newY, width: newWidth, height: newHeight });
      } else {
        setPreviewState(true, { ...currentPreviewElement, x: newX, y: newY, width: newWidth, height: newHeight });
      }
    }
  }, [getCanvasCoordinates, setPan, setDragState, setPreviewState /* updateMultipleElements is part of store, not a direct dep */]);

  // Global mouse up handler - critical for cleaning up interaction states
  const handleGlobalMouseUp = useCallback((_e: MouseEvent) => {
    const {      isDrawing: currentIsDrawing, 
      previewElement: currentPreviewElement, 
      activeTool: currentActiveTool, 
      selectedElementIds: currentSelectedIds, 
      elements: currentElements, 
      dragStartElementPositions: currentDragStartElementPositions
    } = useCanvasStore.getState();
    
    if (isPanning.current) {
      isPanning.current = false;
    }

    if (currentIsDrawing && currentPreviewElement) {
      const finalElement: CanvasElement = { ...currentPreviewElement, id: generateId() };
      if (((finalElement.width ?? 0) > 0 || (finalElement.height ?? 0) > 0) || (finalElement.points && finalElement.points.length > 1)) {
        addElement(finalElement);
        addToHistory({ ...currentElements, [finalElement.id]: finalElement });
      }
    }    // If elements were dragged, save their final positions to history
    else if (currentActiveTool === 'select' && currentSelectedIds.length > 0 && currentDragStartElementPositions) {
      // Check if positions actually changed to avoid redundant history entries
      let changed = false;
      for (const id of currentSelectedIds) {
        if (currentElements[id] && currentDragStartElementPositions[id]) {
          if (currentElements[id].x !== currentDragStartElementPositions[id].x || currentElements[id].y !== currentDragStartElementPositions[id].y) {
            changed = true;
            break;
          }
        }
      }
      if (changed) {
        addToHistory(currentElements); 
      }
    }

    // Clean up all interaction states
    setIsDrawing(false);
    setPreviewState(false, null);
    setDragState(false, { x: 0, y: 0 }, null);
    setResizeState(false, null, { x: 0, y: 0 }, { width: 0, height: 0 });
  }, [generateId, addElement, addToHistory, setIsDrawing, setPreviewState, setDragState, setResizeState]);

  // Handle wheel events for zooming
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
  }, [canvasContainerRef, setZoom, setPan]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const activeEl = document.activeElement;
    // Prevent actions if typing in an input/textarea, unless it's our specific text editing area
    if ((activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') && activeEl !== textAreaRef.current) {
      return;
    }
    const { selectedElementIds: currentSelectedIds, isEditingText: currentEditingId } = useCanvasStore.getState();

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (currentSelectedIds.length > 0 && !currentEditingId) {
        e.preventDefault();
        currentSelectedIds.forEach(id => deleteElement(id));
        addToHistory(useCanvasStore.getState().elements);
        clearSelection();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (currentEditingId) {
        // If editing text, commit changes before deselecting
        const currentTextValue = textAreaRef.current?.value || '';
        updateElement(currentEditingId, { content: currentTextValue });
        addToHistory(useCanvasStore.getState().elements);
        setIsEditingText(null);
        setTextFormattingState(false);
        setTextSelectionState(null, null, null);
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
        setTextSelectionState(null, null, null);
      }
    }
  }, [textAreaRef, deleteElement, addToHistory, clearSelection, updateElement, setIsEditingText, setTextFormattingState, setTextSelectionState]);

  // Delete button handler for toolbar
  const handleDeleteButtonClick = useCallback(() => {
    const { selectedElementIds: currentSelectedIds, elements: currentElements } = useCanvasStore.getState();
    console.log('Delete button handler called:', {
      selectedIds: currentSelectedIds,
      elementCount: Object.keys(currentElements).length
    });
    
    if (currentSelectedIds.length > 0) {
      console.log('Deleting elements:', currentSelectedIds);
      currentSelectedIds.forEach(id => {
        console.log('Deleting element:', id);
        deleteElement(id);
      });
      addToHistory(useCanvasStore.getState().elements);
      clearSelection();
      
      // Verify deletion
      setTimeout(() => {
        const updatedState = useCanvasStore.getState();
        console.log('State after deletion:', {
          elementCount: Object.keys(updatedState.elements).length,
          selectedIds: updatedState.selectedElementIds
        });
      }, 0);
    } else {
      console.log('No elements selected for deletion');
    }
  }, [deleteElement, addToHistory, clearSelection]);

  // Setup global event listeners with proper cleanup
  useEffect(() => {
    // Critical: Use document-level listeners to prevent stuck interaction states
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp, handleKeyDown]);

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