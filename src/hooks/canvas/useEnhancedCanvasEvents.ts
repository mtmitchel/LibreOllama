/**
 * Enhanced canvas event handling hook with performance optimizations
 * Demonstrates integration of the new utility systems
 */

import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { useCanvasStore, CanvasElement } from '@/stores/canvasStore';
import { useCoordinateSystem } from '@/lib/canvas-coordinates';
import { BatchManager, MemoryManager, performanceUtils } from '@/lib/canvas-performance';
import { useMarqueeSelection, SelectionManager } from '@/lib/canvas-selection';
import { useCanvasEventManager, CanvasEventHandlers, CanvasEventData } from '@/lib/canvas-events';

interface UseEnhancedCanvasEventsProps {
  canvasContainerRef: React.RefObject<HTMLDivElement>;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
  generateId: () => string;
}

interface UseEnhancedCanvasEventsReturn {
  handleElementMouseDown: (pixiEvent: any, elementId: string) => void;
  handleCanvasMouseDown: (e: React.MouseEvent) => void;
  handleDeleteButtonClick: () => void;
  renderMarquee: () => JSX.Element | null;
  performanceStats: { fps: number };
}

/**
 * Enhanced canvas events hook with performance optimizations and marquee selection
 */
export const useEnhancedCanvasEvents = ({
  canvasContainerRef,
  textAreaRef,
  generateId,
}: UseEnhancedCanvasEventsProps): UseEnhancedCanvasEventsReturn => {
  
  // Store state selectors
  const elements = useCanvasStore((state) => state.elements);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const zoom = useCanvasStore((state) => state.zoom);
  const pan = useCanvasStore((state) => state.pan);
  const isEditingText = useCanvasStore((state) => state.isEditingText);
  
  // Store actions
  const updateMultipleElements = useCanvasStore((state) => state.updateMultipleElements);
  const deleteMultipleElements = useCanvasStore((state) => state.deleteMultipleElements);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const selectMultipleElements = useCanvasStore((state) => state.selectMultipleElements);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const addElement = useCanvasStore((state) => state.addElement);
  const addToHistory = useCanvasStore((state) => state.addToHistory);
  const setDragState = useCanvasStore((state) => state.setDragState);
  const setPan = useCanvasStore((state) => state.setPan);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setIsEditingText = useCanvasStore((state) => state.setIsEditingText);
  const setTextFormattingState = useCanvasStore((state) => state.setTextFormattingState);
  const setTextSelectionState = useCanvasStore((state) => state.setTextSelectionState);
  const updateElement = useCanvasStore((state) => state.updateElement);

  // Performance and utility managers
  const batchManager = useRef<BatchManager | null>(null);
  const memoryManager = useRef<MemoryManager | null>(null);
  const selectionManager = useRef<SelectionManager | null>(null);
  const performanceMonitor = useRef<performanceUtils.PerformanceMonitor | null>(null);
  const [performanceStats, setPerformanceStats] = React.useState({ fps: 0 });

  // State refs
  const isDragging = useRef(false);
  const isPanning = useRef(false);
  const dragStartPositions = useRef<Record<string, { x: number; y: number }>>({});

  // Coordinate system
  const { getCoordinateSystem } = useCoordinateSystem(zoom, pan, canvasContainerRef);

  // Marquee selection
  const {
    marqueeState,
    startMarqueeSelection,
    updateMarqueeSelection,
    endMarqueeSelection,
    renderMarquee
  } = useMarqueeSelection(elements, (selectedIds, addToSelection) => {
    if (addToSelection) {
      // Add to existing selection
      const newSelection = [...new Set([...selectedElementIds, ...selectedIds])];
      selectMultipleElements(newSelection);
    } else {
      selectMultipleElements(selectedIds);
    }
  });

  // Initialize performance and utility managers
  useEffect(() => {
    // Batch manager for optimized updates
    batchManager.current = new BatchManager(
      (updates) => updateMultipleElements(updates),
      (ids) => deleteMultipleElements(ids)
    );

    // Memory manager for texture caching
    memoryManager.current = new MemoryManager();

    // Selection manager
    selectionManager.current = new SelectionManager((ids) => {
      selectMultipleElements(ids);
    });

    // Performance monitor
    performanceMonitor.current = new performanceUtils.PerformanceMonitor();
    performanceMonitor.current.start();
    
    const unsubscribe = performanceMonitor.current.onFpsUpdate((fps) => {
      setPerformanceStats({ fps });
    });

    return () => {
      batchManager.current?.flush();
      memoryManager.current?.destroy();
      performanceMonitor.current = null;
      unsubscribe();
    };
  }, [updateMultipleElements, deleteMultipleElements, selectMultipleElements]);

  // Enhanced event handlers
  const eventHandlers: CanvasEventHandlers = useMemo(() => ({
    onElementPointerDown: (elementId: string, event: CanvasEventData) => {
      console.log('Enhanced element pointer down:', elementId, event);
      
      if (activeTool !== 'select') return;

      // Clear text editing if not shift-clicking
      if (!event.shiftKey && isEditingText) {
        commitTextEdit();
      }

      // Handle selection
      if (event.shiftKey) {
        selectionManager.current?.select(elementId, true);
      } else {
        selectionManager.current?.select(elementId, false);
      }

      // Prepare for dragging
      prepareDragOperation(event.worldPosition);
    },

    onCanvasPointerDown: (event: CanvasEventData) => {
      if (isEditingText) return;

      if (activeTool === 'select') {
        // Start marquee selection if shift is held, otherwise start panning
        if (event.shiftKey) {
          startMarqueeSelection(event.worldPosition);
        } else {
          clearSelection();
          commitTextEdit();
          startPanning(event);
        }
      } else {
        // Handle drawing tools
        startDrawing(event);
      }
    },

    onCanvasPointerMove: (event: CanvasEventData) => {
      const coordinateSystem = getCoordinateSystem();
      if (!coordinateSystem) return;

      if (marqueeState?.isActive) {
        updateMarqueeSelection(event.worldPosition);
      } else if (isDragging.current && selectedElementIds.length > 0) {
        updateDraggedElements(event.worldPosition);
      } else if (isPanning.current) {
        updatePanning(event);
      }
    },

    onCanvasPointerUp: (event: CanvasEventData) => {
      if (marqueeState?.isActive) {
        const selectedIds = endMarqueeSelection();
        if (selectedIds.length > 0) {
          selectMultipleElements(selectedIds);
        }
      }

      finishDragOperation();
      finishPanning();
    },

    onWheel: (wheelEvent: WheelEvent, worldPosition) => {
      handleZoom(wheelEvent, worldPosition);
    }
  }), [
    activeTool, isEditingText, selectedElementIds, marqueeState,
    getCoordinateSystem, startMarqueeSelection, updateMarqueeSelection, 
    endMarqueeSelection, selectMultipleElements, clearSelection
  ]);

  // Enhanced event manager
  const coordinateSystem = getCoordinateSystem();
  const { createElementHandlers } = useCanvasEventManager(
    canvasContainerRef,
    coordinateSystem,
    eventHandlers
  );

  // Helper functions
  const commitTextEdit = useCallback(() => {
    if (isEditingText && textAreaRef.current) {
      const currentTextValue = textAreaRef.current.value;
      updateElement(isEditingText, { content: currentTextValue });
      addToHistory(useCanvasStore.getState().elements);
      setIsEditingText(null);
      setTextFormattingState(false);
      setTextSelectionState(null, null, null);
    }
  }, [isEditingText, textAreaRef, updateElement, addToHistory, setIsEditingText, setTextFormattingState, setTextSelectionState]);

  const prepareDragOperation = useCallback((startPosition: { x: number; y: number }) => {
    isDragging.current = true;
    dragStartPositions.current = {};
    
    selectedElementIds.forEach(id => {
      const element = elements[id];
      if (element) {
        dragStartPositions.current[id] = { x: element.x, y: element.y };
      }
    });

    setDragState(true, startPosition, dragStartPositions.current);
  }, [selectedElementIds, elements, setDragState]);

  const updateDraggedElements = useCallback((currentPosition: { x: number; y: number }) => {
    if (!isDragging.current || !batchManager.current) return;

    const dragStart = useCanvasStore.getState().dragStartPos;
    if (!dragStart) return;

    const dx = currentPosition.x - dragStart.x;
    const dy = currentPosition.y - dragStart.y;

    // Use batch manager for optimal performance
    selectedElementIds.forEach(id => {
      const startPos = dragStartPositions.current[id];
      if (startPos) {
        batchManager.current?.scheduleUpdate(id, {
          x: startPos.x + dx,
          y: startPos.y + dy
        });
      }
    });
  }, [selectedElementIds]);

  const finishDragOperation = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      batchManager.current?.flush();
      
      // Add to history if elements moved
      const currentElements = useCanvasStore.getState().elements;
      let hasChanges = false;
      
      selectedElementIds.forEach(id => {
        const startPos = dragStartPositions.current[id];
        const currentElement = currentElements[id];
        if (startPos && currentElement && 
            (startPos.x !== currentElement.x || startPos.y !== currentElement.y)) {
          hasChanges = true;
        }
      });

      if (hasChanges) {
        addToHistory(currentElements);
      }
    }

    setDragState(false, { x: 0, y: 0 }, null);
    dragStartPositions.current = {};
  }, [selectedElementIds, addToHistory, setDragState]);

  const startPanning = useCallback((event: CanvasEventData) => {
    isPanning.current = true;
    setDragState(true, event.screenPosition, null);
  }, [setDragState]);

  const updatePanning = useCallback((event: CanvasEventData) => {
    if (!isPanning.current) return;

    const dragStart = useCanvasStore.getState().dragStartPos;
    if (!dragStart) return;

    const dx = (event.screenPosition.x - dragStart.x) / zoom;
    const dy = (event.screenPosition.y - dragStart.y) / zoom;

    setPan({
      x: pan.x + dx,
      y: pan.y + dy
    });

    setDragState(true, event.screenPosition, null);
  }, [pan, zoom, setPan, setDragState]);

  const finishPanning = useCallback(() => {
    isPanning.current = false;
  }, []);

  const startDrawing = useCallback((event: CanvasEventData) => {
    // Implementation for drawing tools
    console.log('Starting drawing operation:', event);
  }, []);

  const handleZoom = useCallback((wheelEvent: WheelEvent, worldPosition: { x: number; y: number }) => {
    wheelEvent.preventDefault();
    
    const scaleFactor = 1.1;
    const newZoom = wheelEvent.deltaY < 0 ? zoom * scaleFactor : zoom / scaleFactor;
    
    // Zoom towards mouse position
    const container = canvasContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const mouseX = wheelEvent.clientX - rect.left;
      const mouseY = wheelEvent.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  }, [zoom, pan, setZoom, setPan, canvasContainerRef]);

  // Legacy compatibility handlers
  const handleElementMouseDown = useCallback((pixiEvent: any, elementId: string) => {
    // Convert legacy Pixi event to new event system
    const coordinateSystem = getCoordinateSystem();
    if (!coordinateSystem) return;

    const worldPosition = coordinateSystem.pixiToWorld({
      x: pixiEvent.global.x,
      y: pixiEvent.global.y
    });

    const eventData: CanvasEventData = {
      worldPosition,
      screenPosition: { x: pixiEvent.global.x, y: pixiEvent.global.y },
      originalEvent: pixiEvent.data?.originalEvent || {},
      shiftKey: pixiEvent.data?.originalEvent?.shiftKey || false,
      ctrlKey: pixiEvent.data?.originalEvent?.ctrlKey || false,
      altKey: pixiEvent.data?.originalEvent?.altKey || false,
      metaKey: pixiEvent.data?.originalEvent?.metaKey || false,
      button: 0,
      buttons: 1,
      pressure: 0,
      isPrimary: true,
      pointerType: 'mouse'
    };

    eventHandlers.onElementPointerDown?.(elementId, eventData);
  }, [getCoordinateSystem, eventHandlers]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const coordinateSystem = getCoordinateSystem();
    if (!coordinateSystem) return;

    const worldPosition = coordinateSystem.screenToWorld({
      x: e.clientX,
      y: e.clientY
    });

    const eventData: CanvasEventData = {
      worldPosition,
      screenPosition: { x: e.clientX, y: e.clientY },
      originalEvent: e.nativeEvent,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      button: e.button,
      buttons: e.buttons,
      pressure: 0,
      isPrimary: true,
      pointerType: 'mouse'
    };

    eventHandlers.onCanvasPointerDown?.(eventData);
  }, [getCoordinateSystem, eventHandlers]);

  const handleDeleteButtonClick = useCallback(() => {
    if (selectedElementIds.length > 0 && batchManager.current) {
      selectedElementIds.forEach(id => {
        batchManager.current?.scheduleDelete(id);
      });
      batchManager.current.flush();
      clearSelection();
      addToHistory(useCanvasStore.getState().elements);
    }
  }, [selectedElementIds, clearSelection, addToHistory]);

  return {
    handleElementMouseDown,
    handleCanvasMouseDown,
    handleDeleteButtonClick,
    renderMarquee,
    performanceStats
  };
};
