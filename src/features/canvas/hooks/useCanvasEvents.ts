import React, { useCallback, useEffect, useRef } from 'react';
import { CoordinateService } from '../utils/canvasCoordinateService';
import { useCanvasStore, canvasStore } from '../stores';
import type { CanvasElement } from '../types/enhanced.types';
import { toElementId, toSectionId } from '../types/compatibility';

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
  const createSection = useCanvasStore((state) => state.createSection);
  const startDrawing = useCanvasStore((state) => state.startDrawing);
  const updateDrawing = useCanvasStore((state) => state.updateDrawing);
  const finishDrawing = useCanvasStore((state) => state.finishDrawing);

  // Handle mouse down on individual elements
  const handleElementMouseDown = useCallback((pixiEvent: any, elementId: string) => {
    console.log('Element mouse down:', elementId);
    pixiEvent.stopPropagation();
    
    if (pixiEvent.data?.originalEvent?.stopPropagation) {
      pixiEvent.data.originalEvent.stopPropagation();
    }
    
    const { elements: currentElements, selectedTool: currentActiveTool, editingTextId: currentEditingText } = canvasStore.getState();
    const element = currentElements.get(elementId);

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
          updateElement(toElementId(currentEditingText), { text: currentTextValue });
          addHistoryEntry('Update text', [], []);
        }
        setEditingTextId(null);
      }
      
      if (shiftPressed) {
        selectElement(toElementId(elementId), true);
      } else {
        selectElement(toElementId(elementId), false);
      }

      // Prepare for dragging
      initialElementPositions.current = {};
      const { selectedElementIds } = canvasStore.getState();
      selectedElementIds.forEach((id: string) => {
        if (currentElements.get(id)) {
          const elem = currentElements.get(id)!;
          initialElementPositions.current[id] = { x: elem.x, y: elem.y };
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
    const currentStoreState = canvasStore.getState();

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
    const sections = canvasStore.getState().sections;
    let sectionId = CoordinateService.findSectionAtPoint({ x, y }, Object.values(sections));
    
    console.log('🎯 [CANVAS EVENTS] Click coordinates:', { x, y });
    console.log('🎯 [CANVAS EVENTS] Found section:', sectionId);
    
    let relCoords = { x, y };
    if (sectionId) {
      const section = sections.get(sectionId);
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
            updateElement(toElementId(currentStoreState.editingTextId), { text: currentTextValue });
            addHistoryEntry('Update text', [], []);
          }
          setEditingTextId(null);
        }
        clearSelection();
        break;

      case 'pen':
        // Start drawing with pen tool
        startDrawing(x, y, 'pen');
        break;

      case 'text':
        const textElement: CanvasElement = {
          id: toElementId(generateId()),
          type: 'text',
          x: relCoords.x,
          y: relCoords.y,
          width: 200,
          height: 50,
          text: '',
          fill: '#000000',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...(sectionId ? { sectionId: toSectionId(sectionId) } : {})
        };
        addElement(textElement);
        addHistoryEntry('Add text element', [], []);
        setEditingTextId(textElement.id);
        break;

      case 'sticky-note':
        const stickyElement: CanvasElement = {
          id: toElementId(generateId()),
          type: 'sticky-note',
          x: relCoords.x,
          y: relCoords.y,
          width: 200,
          height: 100,
          text: '',
          backgroundColor: '#FFFFE0',
          textColor: '#000000',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...(sectionId ? { sectionId: toSectionId(sectionId) } : {})
        };
        addElement(stickyElement);
        addHistoryEntry('Add sticky note', [], []);
        setEditingTextId(stickyElement.id);
        break;

      default:
        if ([
          'rectangle', 'circle', 'triangle', 'square', 'hexagon', 'star', 'line', 'arrow'
        ].includes(currentActiveTool)) {
          let shapeElement: CanvasElement;
          
          if (currentActiveTool === 'triangle') {
            // Triangle uses points instead of width/height
            const size = 80;
            shapeElement = {
              id: toElementId(generateId()),
              type: 'triangle',
              x: relCoords.x,
              y: relCoords.y,
              points: [
                size/2, 0,        // top point
                0, size,          // bottom left
                size, size        // bottom right
              ],
              width: size,        // Add for compatibility
              height: size,       // Add for compatibility
              fill: '#000000',
              stroke: '#000000',
              strokeWidth: 1,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              ...(sectionId ? { sectionId: toSectionId(sectionId) } : {})
            };
          } else if (currentActiveTool === 'circle') {
            shapeElement = {
              id: toElementId(generateId()),
              type: 'circle',
              x: relCoords.x,
              y: relCoords.y,
              radius: 40,
              fill: '#000000',
              stroke: '#000000',
              strokeWidth: 1,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              ...(sectionId ? { sectionId: toSectionId(sectionId) } : {})
            };
          } else if (currentActiveTool === 'star') {
            shapeElement = {
              id: toElementId(generateId()),
              type: 'star',
              x: relCoords.x,
              y: relCoords.y,
              innerRadius: 20,
              outerRadius: 40,
              numPoints: 5,
              fill: '#000000',
              stroke: '#000000',
              strokeWidth: 1,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              ...(sectionId ? { sectionId: toSectionId(sectionId) } : {})
            };
          } else {
            // Rectangle and other rectangular shapes
            shapeElement = {
              id: toElementId(generateId()),
              type: 'rectangle',
              x: relCoords.x,
              y: relCoords.y,
              width: 80,
              height: 80,
              fill: '#000000',
              stroke: '#000000',
              strokeWidth: 1,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              ...(sectionId ? { sectionId: toSectionId(sectionId) } : {})
            };
          }
          
          addElement(shapeElement);
          addHistoryEntry('Add shape element', [], []);
        }
        break;
    }
  }, [canvasContainerRef, clearSelection, setEditingTextId, setEditingTextId, getCanvasCoordinates, updateElement, addHistoryEntry, textAreaRef, generateId, addElement]);

  // Handle global mouse move for dragging and drawing
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const { isDrawing: currentIsDrawing } = canvasStore.getState();
    
    if (currentIsDrawing) {
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      updateDrawing(x, y);
    }
  }, [getCanvasCoordinates, updateDrawing]);

  // Handle global mouse up for ending dragging and drawing
  const handleGlobalMouseUp = useCallback(() => {
    const { isDrawing: currentIsDrawing } = canvasStore.getState();
    
    if (currentIsDrawing) {
      finishDrawing();
    }
  }, [finishDrawing]);

  // Keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { selectedElementIds: currentSelectedIds, editingTextId: currentEditingId } = canvasStore.getState();

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (currentSelectedIds.size > 0) {
        e.preventDefault();
        currentSelectedIds.forEach((id: string) => deleteElement(toElementId(id)));
        addHistoryEntry('Delete elements', [], []);
      }
    } else if (e.key === 'Escape') {
      if (currentEditingId) {
        if (textAreaRef.current) {
          const currentTextValue = textAreaRef.current.value;
          updateElement(toElementId(currentEditingId), { text: currentTextValue });
          addHistoryEntry('Update text', [], []);
        }
        setEditingTextId(null);
      }
    }
  }, [deleteElement, updateElement, setEditingTextId, textAreaRef, addHistoryEntry]);

  // Handle wheel events for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const { zoom: currentZoom, pan: currentPan } = canvasStore.getState();
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
    const { selectedElementIds: currentSelectedIds, elements: currentElements } = canvasStore.getState();
    
    if (currentSelectedIds.size > 0) {
      console.log('Deleting elements:', currentSelectedIds);
      
      currentSelectedIds.forEach((id: string) => {
        if (currentElements.get(id)) {
          deleteElement(toElementId(id));
        }
      });
      addHistoryEntry('Delete elements', [], []);
      
      setTimeout(() => {
        const updatedState = canvasStore.getState();
        if (updatedState.selectedElementIds.size === 0) {
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
    return undefined;
  }, [handleWheel, canvasContainerRef]);

  return {
    handleElementMouseDown,
    handleCanvasMouseDown,
    handleDeleteButtonClick,
  };
};