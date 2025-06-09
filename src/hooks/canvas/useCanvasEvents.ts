import { useCallback, useEffect, useRef } from 'react';
import { useCanvasStore, CanvasElement } from '../../stores/canvasStore';

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
}: UseCanvasEventsProps): UseCanvasEventsReturn => {
  // Store refs for internal state that doesn't need to trigger re-renders
  const isPanning = useRef(false);
  const initialElementPositions = useRef<Record<string, { x: number; y: number }>>({});

  // Get store actions (these are stable function references from Zustand)
  const addElement = useCanvasStore((state) => state.addElement);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const updateElementContent = useCanvasStore((state) => state.updateElementContent);
  const deleteElement = useCanvasStore((state) => state.deleteElement);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const setPan = useCanvasStore((state) => state.setPan);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setDragState = useCanvasStore((state) => state.setDragState);
  const setIsDrawing = useCanvasStore((state) => state.setIsDrawing);
  const setPreviewState = useCanvasStore((state) => state.setPreviewState);
  const setResizeState = useCanvasStore((state) => state.setResizeState);
  const setIsEditingText = useCanvasStore((state) => state.setIsEditingText);
  const setTextFormattingState = useCanvasStore((state) => state.setTextFormattingState);
  const setTextSelectionState = useCanvasStore((state) => state.setTextSelectionState);
  const addToHistory = useCanvasStore((state) => state.addToHistory);

  // Handle mouse down on individual elements (Pixi events)
  const handleElementMouseDown = useCallback((pixiEvent: any, elementId: string) => {
    console.log('Element mouse down:', elementId, pixiEvent);
    pixiEvent.stopPropagation(); // Prevent canvas click from firing
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
        // Text content is already synced via updateElementContent, just exit editing mode
        addToHistory(useCanvasStore.getState().elements);
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
      // Use screen coordinates for consistent drag calculation
      const startDragCoords = { 
        x: pixiEvent.global.x,
        y: pixiEvent.global.y
      };
      
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

      setDragState(true, startDragCoords, initialElementPositions.current);
    }
  }, [selectElement, setDragState, updateElement, addToHistory, setIsEditingText, setTextFormattingState, setTextSelectionState, textAreaRef]);

  // Handle mouse down events on the main canvas workspace
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('Canvas mouse down:', {
      target: e.target,
      isCanvasContainer: e.target === canvasContainerRef.current,
      isCanvasElement: e.target instanceof HTMLCanvasElement,
      activeTool: useCanvasStore.getState().activeTool
    });
    
    e.preventDefault();
    const currentStoreState = useCanvasStore.getState();

    if (e.target !== canvasContainerRef.current && !(e.target instanceof HTMLCanvasElement)) {
      // Click was on a React UI element over the canvas, not the canvas itself or its direct container
      console.log('Click was on UI element, ignoring');
      return;
    }

    // If select tool and clicked on empty canvas, clear selection and text edit state
    if (currentStoreState.activeTool === 'select') {
      console.log('Canvas click with select tool - clearing selection');
      // Only clear selection if not shift-clicking (to allow multi-select)
      if (!e.shiftKey) {
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
    const { 
      isDragging: currentIsDragging, 
      dragStartPos: currentDragStartPos, 
      activeTool: currentActiveTool, 
      zoom: currentZoom, 
      pan: currentPan, 
      elements: currentElements, 
      selectedElementIds: currentSelectedIds, 
      previewElement: currentPreviewElement, 
      isDrawing: currentIsDrawing, 
      dragStartElementPos: currentDragStartElementPos 
    } = useCanvasStore.getState();

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

      if (currentPreviewElement.type === 'line' || currentPreviewElement.type === 'drawing') {
        const updatedPoints = [...(currentPreviewElement.points || []), coords];
        setPreviewState(true, { ...currentPreviewElement, points: updatedPoints, x: newX, y: newY, width: newWidth, height: newHeight });
      } else {
        setPreviewState(true, { ...currentPreviewElement, x: newX, y: newY, width: newWidth, height: newHeight });
      }
    } else if (currentActiveTool === 'select' && currentDragStartElementPos && currentSelectedIds.length > 0) {
      // Dragging elements - convert screen coordinates to canvas coordinates
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
  }, [canvasContainerRef, getCanvasCoordinates, setPan, setDragState, setPreviewState, updateElement]);

  // Global mouse up handler - critical for cleaning up interaction states
  const handleGlobalMouseUp = useCallback((_e: MouseEvent) => {
    const { 
      isDrawing: currentIsDrawing, 
      previewElement: currentPreviewElement, 
      activeTool: currentActiveTool, 
      selectedElementIds: currentSelectedIds, 
      elements: currentElements, 
      dragStartElementPos: currentDragStartElementPos 
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