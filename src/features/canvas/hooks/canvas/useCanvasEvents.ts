import React, { useCallback, useEffect, useRef } from 'react';
import { CoordinateService } from '../../utils/coordinateService';
import { useCanvasStore } from '../../stores/canvasStore.enhanced';
import type { CanvasElement } from '../../../../types';

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
 * Updated to work with the current store architecture
 */
export const useCanvasEvents = ({
  canvasContainerRef,
  textAreaRef,
  getCanvasCoordinates,
  generateId,
}: UseCanvasEventsProps): UseCanvasEventsReturn => {
  // Store refs for internal state that doesn't need to trigger re-renders
  const initialElementPositions = useRef<Record<string, { x: number; y: number }>>({});
  
  // Get store actions using the current API
  const addElement = useCanvasStore((state) => state.addElement);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const deleteElement = useCanvasStore((state) => state.deleteElement);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const setPan = useCanvasStore((state) => state.setPan);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);
  const addHistoryEntry = useCanvasStore((state) => state.addHistoryEntry);

  // Handle mouse down on individual elements
  const handleElementMouseDown = useCallback((pixiEvent: any, elementId: string) => {
    console.log('Element mouse down:', elementId);
    pixiEvent.stopPropagation();
    
    if (pixiEvent.data?.originalEvent?.stopPropagation) {
      pixiEvent.data.originalEvent.stopPropagation();
    }
    
    const { elements: currentElements, selectedTool: currentActiveTool, editingTextId: currentEditingText } = useCanvasStore.getState();
    const element = currentElements[elementId];

    if (!element) {
      console.warn('Element not found in store:', elementId);
      return;
    }

    if (currentActiveTool === 'select') {
      const shiftPressed = pixiEvent.data?.originalEvent?.shiftKey || false;
      
      // Clear text editing when selecting elements
      if (!shiftPressed && currentEditingText) {
        if (textAreaRef.current) {
          const currentTextValue = textAreaRef.current.value;
          updateElement(currentEditingText, { text: currentTextValue });
          addHistoryEntry('Update text', [], []);
        }
        setEditingTextId(null);
      }
      
      if (shiftPressed) {
        selectElement(elementId, true);
      } else {
        selectElement(elementId, false);
      }

      // Prepare for dragging
      initialElementPositions.current = {};
      const { selectedElementIds } = useCanvasStore.getState();
      selectedElementIds.forEach((id: string) => {
        if (currentElements[id]) {
          initialElementPositions.current[id] = { x: currentElements[id].x, y: currentElements[id].y };
        }
      });
      
      if (initialElementPositions.current[elementId] === undefined) {
         initialElementPositions.current[elementId] = { x: element.x, y: element.y };
      }

      // Dragging logic would go here
    }
  }, [selectElement, updateElement, addHistoryEntry, setEditingTextId, getCanvasCoordinates, textAreaRef]);

  // Handle mouse down on canvas background
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const currentStoreState = useCanvasStore.getState();

    // SAFETY NET: If we're editing text, don't interfere with text editing
    if (currentStoreState.editingTextId) {
      return;
    }

    // Check if the click target is a canvas element
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
      selectedTool: currentActiveTool,
    } = currentStoreState;
    
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    const sections = useCanvasStore.getState().sections;
    let sectionId = CoordinateService.findSectionAtPoint({ x, y }, Object.values(sections));
    
    console.log('🎯 [CANVAS EVENTS] Click coordinates:', { x, y });
    console.log('🎯 [CANVAS EVENTS] Found section:', sectionId);
    
    let relCoords = { x, y };
    if (sectionId) {
      const section = sections[sectionId];
      if (section) {
        console.log('🎯 [CANVAS EVENTS] Section details:', {
          id: section.id,
          x: section.x,
          y: section.y,
          width: section.width,
          height: section.height
        });
        
        relCoords = CoordinateService.toRelative({ x, y }, section);
        console.log('🎯 [CANVAS EVENTS] Relative coordinates before clamping:', relCoords);
        
        // Clamp to section bounds to ensure elements stay inside
        relCoords.x = Math.max(0, Math.min(relCoords.x, section.width - 80)); // Leave space for element size
        relCoords.y = Math.max(0, Math.min(relCoords.y, section.height - 80));
        
        console.log('🎯 [CANVAS EVENTS] Relative coordinates after clamping:', relCoords);
        
        // Safety check: if relative coordinates are still negative, don't assign section
        if (relCoords.x < 0 || relCoords.y < 0) {
          console.warn('⚠️ [CANVAS EVENTS] Negative relative coordinates detected, removing section assignment');
          sectionId = null;
          relCoords = { x, y }; // Use absolute coordinates instead
        }
      }
    }

    switch (currentActiveTool) {
      case 'select':
        if (currentStoreState.editingTextId) {
          if (textAreaRef.current) {
            const currentTextValue = textAreaRef.current.value;
            updateElement(currentStoreState.editingTextId, { text: currentTextValue });
            addHistoryEntry('Update text', [], []);
          }
          setEditingTextId(null);
        }
        clearSelection();
        break;

      case 'pen':
        // Drawing logic would go here
        break;

      case 'text':
      case 'sticky-note':
        const textElement: CanvasElement = {
          id: generateId(),
          type: currentActiveTool,
          x: relCoords.x,
          y: relCoords.y,
          width: 200,
          height: currentActiveTool === 'sticky-note' ? 100 : 50,
          text: '',
          fill: '#000000',
          backgroundColor: currentActiveTool === 'sticky-note' ? '#FFFFE0' : 'transparent',
          ...(sectionId ? { sectionId } : {})
        };
        addElement(textElement);
        addHistoryEntry('Add text element', [], []);
        setEditingTextId(textElement.id);
        break;

      default:
        if ([
          'rectangle', 'circle', 'triangle', 'square', 'hexagon', 'star', 'line', 'arrow'
        ].includes(currentActiveTool)) {
          const shapeElement: CanvasElement = {
            id: generateId(),
            type: currentActiveTool as CanvasElement['type'],
            x: relCoords.x,
            y: relCoords.y,
            width: 80,
            height: 80,
            fill: '#000000',
            stroke: '#000000',
            strokeWidth: 1,
            ...(sectionId ? { sectionId } : {})
          };
          if (currentActiveTool === 'circle') {
            shapeElement.radius = 40;
          }
          addElement(shapeElement);
          addHistoryEntry('Add shape element', [], []);
        }
        break;
    }
  }, [canvasContainerRef, clearSelection, setEditingTextId, setEditingTextId, getCanvasCoordinates, updateElement, addHistoryEntry, textAreaRef, generateId, addElement]);

  // Global mouse move handler
  const handleGlobalMouseMove = useCallback((_e: MouseEvent) => {
    // Mouse move logic would go here when dragging is implemented
  }, []);

  // Global mouse up handler
  const handleGlobalMouseUp = useCallback(() => {
    // Mouse up logic would go here when dragging is implemented
  }, [addHistoryEntry]);

  // Keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { selectedElementIds: currentSelectedIds, editingTextId: currentEditingId } = useCanvasStore.getState();

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (currentSelectedIds.length > 0) {
        e.preventDefault();
        currentSelectedIds.forEach((id: string) => deleteElement(id));
        addHistoryEntry('Delete elements', [], []);
      }
    } else if (e.key === 'Escape') {
      if (currentEditingId) {
        if (textAreaRef.current) {
          const currentTextValue = textAreaRef.current.value;
          updateElement(currentEditingId, { text: currentTextValue });
          addHistoryEntry('Update text', [], []);
        }
        setEditingTextId(null);
      }
    }
  }, [deleteElement, updateElement, setEditingTextId, textAreaRef, addHistoryEntry]);

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

  // Delete button click handler
  const handleDeleteButtonClick = useCallback(() => {
    const { selectedElementIds: currentSelectedIds, elements: currentElements } = useCanvasStore.getState();
    
    if (currentSelectedIds.length > 0) {
      console.log('Deleting elements:', currentSelectedIds);
      
      currentSelectedIds.forEach((id: string) => {
        if (currentElements[id]) {
          deleteElement(id);
        }
      });
      addHistoryEntry('Delete elements', [], []);
      
      setTimeout(() => {
        const updatedState = useCanvasStore.getState();
        if (updatedState.selectedElementIds.length === 0) {
          clearSelection();
        }
      }, 0);
    }
  }, [deleteElement, addHistoryEntry, clearSelection]);

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