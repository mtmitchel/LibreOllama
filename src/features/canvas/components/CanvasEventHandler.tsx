/**
 * CanvasEventHandler - Centralized Event Delegation System
 * Part of LibreOllama Canvas Refactoring - Phase 3
 * 
 * This component centralizes all canvas interactions using the event delegation pattern.
 * A single listener per event type is attached to the stage, dramatically reducing overhead.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { CanvasTool, ElementId } from '../types/enhanced.types';
import { useCanvasStore, canvasStore } from '../stores';
import { toElementId } from '../types/compatibility';
import { logger } from '@/lib/logger';
import { findNearestSnapPoint } from '../utils/connectorUtils';
import { eventHandlerManager } from '../utils/state/EventHandlerManager';
import { drawingStateManager } from '../utils/state/DrawingStateManager';
import { stateSynchronizationMonitor } from '../utils/state/StateSynchronizationMonitor';
import { MemoryLeakDetector, useMemoryLeakDetector } from '../utils/performance/MemoryLeakDetector';
import { CanvasPerformanceProfiler } from '../utils/performance/CanvasPerformanceProfiler';

// Import table creation utility
const createTableData = (id: string, rows: number, cols: number) => {
  const tableRows = Array.from({ length: rows }, (_, i) => ({
    id: `row_${id}_${i}`,
    height: 50,
    minHeight: 30,
    isResizable: true,
    isHeader: i === 0
  }));

  const tableColumns = Array.from({ length: cols }, (_, i) => ({
    id: `col_${id}_${i}`,
    width: 120,
    minWidth: 80,
    isResizable: true
  }));

  const tableCells = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => ({
      id: `cell_${id}_${rowIndex}_${colIndex}`,
      content: '', // Required property
      text: '',
      segments: [{
        text: '',
        fontSize: 14,
        fontFamily: 'Inter, system-ui, sans-serif',
        fill: '#1F2937'
      }],
      containedElementIds: [],
      isHeader: rowIndex === 0,
      backgroundColor: rowIndex === 0 ? '#F9FAFB' : '#FFFFFF',
      textAlign: 'left' as const
    }))
  );

  return { rows: tableRows, columns: tableColumns, cells: tableCells };
};

interface CanvasEventHandlerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  currentTool: CanvasTool;
  children: React.ReactNode;
  isDrawingConnector: boolean;
  setIsDrawingConnector: React.Dispatch<React.SetStateAction<boolean>>;
  connectorStart: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  setConnectorStart: React.Dispatch<React.SetStateAction<{ x: number; y: number; elementId?: ElementId; anchor?: string } | null>>;
  connectorEnd: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  setConnectorEnd: React.Dispatch<React.SetStateAction<{ x: number; y: number; elementId?: ElementId; anchor?: string } | null>>;
  isDrawingSection: boolean;
  setIsDrawingSection: React.Dispatch<React.SetStateAction<boolean>>;
  previewSection: { x: number; y: number; width: number; height: number } | null;
  setPreviewSection: React.Dispatch<React.SetStateAction<{ x: number; y: number; width: number; height: number } | null>>;
}

type EventHandler = (e: Konva.KonvaEventObject<any>) => void;

export const CanvasEventHandler: React.FC<CanvasEventHandlerProps> = ({
  stageRef,
  currentTool,
  children,
  isDrawingConnector,
  setIsDrawingConnector,
  connectorStart,
  setConnectorStart,
  connectorEnd,
  setConnectorEnd,
  isDrawingSection,
  setIsDrawingSection,
  previewSection,
  setPreviewSection,
}) => {
  const isPointerDownRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  // FIXED: Store current tool handlers in ref to avoid constant event listener re-attachment
  const currentToolHandlersRef = useRef<Map<string, EventHandler>>(new Map());
  
  // Memory leak tracking
  const memoryTracker = useMemoryLeakDetector('CanvasEventHandler');
  const eventListenerIds = useRef<string[]>([]);

  // Access canvas store for drawing functions - split selectors
  const selectedTool = useCanvasStore((state) => state.selectedTool);
  const isDrawing = useCanvasStore((state) => state.isDrawing);
  const addElement = useCanvasStore((state) => state.addElement);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const deselectElement = useCanvasStore((state) => state.deselectElement);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const setSelectedTool = useCanvasStore((state) => state.setSelectedTool);
  const createSection = useCanvasStore((state) => state.createSection);
  const captureElementsAfterSectionCreation = useCanvasStore((state) => state.captureElementsAfterSectionCreation);
  const elements = useCanvasStore((state) => state.elements);
  const zoom = useCanvasStore((state) => state.zoom);
  const pan = useCanvasStore((state) => state.pan);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setPan = useCanvasStore((state) => state.setPan);
  const deleteElement = useCanvasStore((state) => state.deleteElement);
  const deleteSelectedElements = useCanvasStore((state) => state.deleteSelectedElements);
  const addHistoryEntry = useCanvasStore((state) => state.addHistoryEntry);
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);
  const editingTextId = useCanvasStore((state) => state.editingTextId);
  
  // Add missing drawing functions from store
  const startDrawing = useCanvasStore((state) => state.startDrawing);
  const updateDrawing = useCanvasStore((state) => state.updateDrawing);
  const finishDrawing = useCanvasStore((state) => state.finishDrawing);
  
  // Add missing connector state
  const [hoveredSnapPoint, setHoveredSnapPoint] = useState<any>(null);

  // INSIGHT FROM TESTS: State validation and error recovery patterns
  const validateToolState = (tool: CanvasTool) => {
    // Ensure tool is valid before using
    const validTools = [
      'select', 'pan', 'text', 'rectangle', 'circle', 'triangle', 'star',
      'pen', 'pencil', 'connector', 'connector-line', 'connector-arrow', 'line',
      'section', 'sticky-note', 'image', 'table'
    ];
    
    if (!validTools.includes(tool)) {
      logger.warn('🎯 [CanvasEventHandler] Invalid tool detected:', tool, 'falling back to select');
      return 'select';
    }
    return tool;
  };

  // INSIGHT FROM TESTS: Debounced mousemove to prevent performance issues
  const debouncedMouseMove = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (callback: () => void, delay: number = 16) => { // 60fps = ~16ms
      clearTimeout(timeout);
      timeout = setTimeout(callback, delay);
    };
  }, []);

  // INSIGHT FROM TESTS: State synchronization validation
  const validateElementState = (elementId: ElementId) => {
    const element = elements.get(elementId);
    if (!element) {
      logger.warn('🎯 [CanvasEventHandler] Element not found in store:', elementId);
      return false;
    }
    return true;
  };

  // INSIGHT FROM TESTS: Consistent tool cleanup on errors
  const cleanupToolState = () => {
    try {
      isPointerDownRef.current = false;
      lastMousePosRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clean up drawing states
      if (isDrawingConnector) {
        setIsDrawingConnector(false);
        setConnectorStart(null);
        setConnectorEnd(null);
        setHoveredSnapPoint(null);
      }
      
      if (isDrawingSection) {
        setIsDrawingSection(false);
        setPreviewSection(null);
      }
    } catch (error) {
      logger.error('🎯 [CanvasEventHandler] Error during tool cleanup:', error);
    }
  };

  // INSIGHT FROM TESTS: Performance monitoring for debugging
  const performanceMonitor = useMemo(() => {
    let eventCounts: Record<string, number> = {};
    let lastLogTime = Date.now();
    
    return {
      trackEvent: (eventType: string) => {
        eventCounts[eventType] = (eventCounts[eventType] || 0) + 1;
        
        // Log performance stats every 5 seconds in development
        if (process.env.NODE_ENV === 'development') {
          const now = Date.now();
          if (now - lastLogTime > 5000) {
            const totalEvents = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);
            if (totalEvents > 0) {
              logger.log('📊 [CanvasEventHandler] Performance Stats:', {
                totalEvents,
                eventBreakdown: eventCounts,
                eventsPerSecond: totalEvents / 5
              });
            }
            eventCounts = {};
            lastLogTime = now;
          }
        }
      }
    };
  }, []);

  // Event handler implementations - MUST BE DEFINED BEFORE toolHandlers useMemo
  // Enhanced select mouse handlers with error handling
  const handleSelectMouseDown = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      isPointerDownRef.current = true;
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      lastMousePosRef.current = pointer;

      // Handle selection logic
      const target = e.target;
      if (target === stage) {
        // Clicked on empty canvas - clear selection
        clearSelection();
      } else {
        // Clicked on an element
        const elementId = target.id();
        if (elementId) {
          if (e.evt.shiftKey) {
            // Multi-select with shift key
            const typedElementId = toElementId(elementId);
            if (selectedElementIds.has(typedElementId)) {
              deselectElement(typedElementId);
            } else {
              selectElement(typedElementId);
            }
          } else {
            // Single select
            selectElement(toElementId(elementId));
          }
        }
      }
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🎯 [CanvasEventHandler] Select mouse down fallback handler activated');
      isPointerDownRef.current = false;
      lastMousePosRef.current = null;
    };

    const toolValidator = (tool: any) => {
      return tool === 'select';
    };

    return eventHandlerManager.createSafeEventHandler(
      'selectMouseDown',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [stageRef, selectedElementIds, clearSelection, selectElement, deselectElement]);

  const handleSelectMouseMove = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPointerDownRef.current) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer || !lastMousePosRef.current) return;

      // INSIGHT FROM TESTS: Use debounced mousemove for better performance
      debouncedMouseMove(() => {
        const delta = {
          x: pointer.x - lastMousePosRef.current!.x,
          y: pointer.y - lastMousePosRef.current!.y
        };

        // INSIGHT FROM TESTS: Validate minimum movement before processing
        const minMovement = 2; // pixels
        if (Math.abs(delta.x) < minMovement && Math.abs(delta.y) < minMovement) {
          return; // Ignore micro-movements
        }

        if (e.target === stage) {
          // Selection box drag - for now, just skip this
          // TODO: Implement selection box if needed
        } else {
          // Element drag - update element position
          // FIX: This logic is incorrect and inefficient. It is now handled by the `dragend` event.
          // The element's draggable property should be used instead of manual position updates here.
        }

        lastMousePosRef.current = pointer;
      });
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🎯 [CanvasEventHandler] Select mouse move fallback handler activated');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    return eventHandlerManager.createSafeEventHandler(
      'selectMouseMove',
      originalHandler,
      fallbackHandler
    );
  }, [stageRef]);

  const handleSelectMouseUp = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      isPointerDownRef.current = false;
      lastMousePosRef.current = null;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      if (e.target === stage) {
        // End selection box - for now, just skip this
        // TODO: Implement selection box completion if needed
      } else {
        // Element drag end - element position was already updated in mousemove
        // Just ensure the element is selected
        const elementId = e.target.id();
        if (elementId) {
          selectElement(toElementId(elementId));
        }
      }
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🎯 [CanvasEventHandler] Select mouse up fallback handler activated');
      isPointerDownRef.current = false;
      lastMousePosRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    return eventHandlerManager.createSafeEventHandler(
      'selectMouseUp',
      originalHandler,
      fallbackHandler
    );
  }, [stageRef, selectElement]);

  // Enhanced element drag end handler with error handling
  const handleElementDragEnd = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<DragEvent>, elementId?: ElementId) => {
      const targetNode = e.target;
      const id = elementId || toElementId(targetNode.id());

      if (!id) {
        logger.warn('[CanvasEventHandler] dragend event on element with no ID');
        return;
      }

      if (!validateElementState(id)) {
        logger.warn('[CanvasEventHandler] Cannot update non-existent element:', id);
        return;
      }

      const newPosition = {
        x: targetNode.x(),
        y: targetNode.y(),
      };

      if (isNaN(newPosition.x) || isNaN(newPosition.y)) {
        logger.warn('[CanvasEventHandler] Invalid position values:', newPosition);
        return;
      }

      logger.log(`✅ [CanvasEventHandler] DragEnd on ${id}. New position:`, newPosition);

      updateElement(id, {
        ...newPosition,
        updatedAt: Date.now(),
      });
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<DragEvent>) => {
      logger.warn('↔️ [CanvasEventHandler] Element drag end fallback handler activated');
      // Try to get element ID and update if possible
      try {
        const targetNode = e.target;
        const elementId = toElementId(targetNode.id());
        if (elementId) {
          const newPosition = {
            x: targetNode.x(),
            y: targetNode.y(),
          };
          updateElement(elementId, {
            ...newPosition,
            updatedAt: Date.now(),
          });
        }
      } catch (error) {
        logger.error('↔️ [CanvasEventHandler] Error in drag end fallback:', error);
      }
    };

    // Drag end handler works for all tools, so always validate as true
    const toolValidator = (_tool: any) => true;

    return eventHandlerManager.createSafeEventHandler(
      'elementDragEnd',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [updateElement]);

  // Enhanced select click handler with error handling
  const handleSelectClick = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      if (e.target === stage) {
        // Clicked on empty canvas - clear selection
        clearSelection();
      } else {
        // Clicked on an element - select it
        const elementId = e.target.id();
        if (elementId) {
          const typedElementId = toElementId(elementId);
          if (e.evt.shiftKey) {
            // Multi-select with shift key
            if (selectedElementIds.has(typedElementId)) {
              deselectElement(typedElementId);
            } else {
              selectElement(typedElementId);
            }
          } else {
            // Single select
            selectElement(typedElementId);
          }
        }
      }
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🎯 [CanvasEventHandler] Select click fallback handler activated');
      // Fallback: clear selection to ensure consistent state
      try {
        clearSelection();
      } catch (error) {
        logger.error('🎯 [CanvasEventHandler] Error in select click fallback:', error);
      }
    };

    const toolValidator = (tool: any) => {
      return tool === 'select';
    };

    return eventHandlerManager.createSafeEventHandler(
      'selectClick',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [stageRef, clearSelection, selectElement, deselectElement, selectedElementIds]);

  // Enhanced pan mouse handlers with error handling
  const handlePanMouseDown = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Pan is handled by Stage's draggable prop, no action needed here
      isPointerDownRef.current = true;
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🔄 [CanvasEventHandler] Pan mouse down fallback handler activated');
      isPointerDownRef.current = false;
    };

    const toolValidator = (tool: any) => {
      return tool === 'pan';
    };

    return eventHandlerManager.createSafeEventHandler(
      'panMouseDown',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  const handlePanMouseMove = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Pan is handled by Stage's draggable prop, no action needed here
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🔄 [CanvasEventHandler] Pan mouse move fallback handler activated');
    };

    return eventHandlerManager.createSafeEventHandler(
      'panMouseMove',
      originalHandler,
      fallbackHandler
    );
  }, []);

  const handlePanMouseUp = useMemo(() => {
    const originalHandler = () => {
      // Pan is handled by Stage's draggable prop, no action needed here
      isPointerDownRef.current = false;
    };

    const fallbackHandler = () => {
      logger.warn('🔄 [CanvasEventHandler] Pan mouse up fallback handler activated');
      isPointerDownRef.current = false;
    };

    return eventHandlerManager.createSafeEventHandler(
      'panMouseUp',
      originalHandler,
      fallbackHandler
    );
  }, []);

  // Enhanced text click handler with error handling
  const handleTextClick = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      console.log('📝 [CanvasEventHandler] TEXT CLICK - Creating text at:', pointer);
      logger.log('📝 [CanvasEventHandler] Creating text at:', pointer);
      
      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newText = {
        id: toElementId(generateId()),
        type: 'text' as const,
        x: pointer.x,
        y: pointer.y,
        text: 'Double-click to edit',
        fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        fill: '#1F2937',
        width: 200,
        height: 24,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      logger.log('📝 [CanvasEventHandler] Creating text element:', newText);
      addElement(newText);
      selectElement(newText.id);
      setSelectedTool('select');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('📝 [CanvasEventHandler] Text click fallback handler activated');
      setSelectedTool('select');
    };

    const toolValidator = (tool: any) => {
      return tool === 'text';
    };

    return eventHandlerManager.createSafeEventHandler(
      'textClick',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [stageRef, addElement, selectElement, setSelectedTool]);

  // Enhanced shape mouse handlers with error handling
  const handleShapeMouseDown = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      console.log('🎨 [CanvasEventHandler] SHAPE MOUSEDOWN - tool:', currentTool, 'target:', e.target === stageRef.current ? 'stage' : 'element');
      logger.log('🎨 [CanvasEventHandler] handleShapeMouseDown called for:', currentTool);
      if (e.target !== stageRef.current) {
        console.log('🎨 [CanvasEventHandler] SHAPE MOUSEDOWN - clicked on element, ignoring');
        return;
      }

      isPointerDownRef.current = true;
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (pointer) {
        lastMousePosRef.current = pointer;
        logger.log('🎯 [CanvasEventHandler] Starting shape drag for:', currentTool, 'at:', pointer);
        // Don't create shape immediately - wait for drag and mouseup
      }
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🎨 [CanvasEventHandler] Shape mouse down fallback handler activated');
      isPointerDownRef.current = false;
      lastMousePosRef.current = null;
    };

    const toolValidator = (tool: any) => {
      return ['rectangle', 'circle', 'triangle', 'star'].includes(tool);
    };

    return eventHandlerManager.createSafeEventHandler(
      'shapeMouseDown',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [currentTool, stageRef]);

  const handleShapeMouseMove = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPointerDownRef.current || !lastMousePosRef.current) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // TODO: Show preview shape during drag
      // For now, just track the movement
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🎨 [CanvasEventHandler] Shape mouse move fallback handler activated');
      // Safe cleanup
      isPointerDownRef.current = false;
      lastMousePosRef.current = null;
    };

    return eventHandlerManager.createSafeEventHandler(
      'shapeMouseMove',
      originalHandler,
      fallbackHandler
    );
  }, [stageRef]);

  const handleShapeMouseUp = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      console.log('🎨 [CanvasEventHandler] SHAPE MOUSEUP - finishing shape creation');
      if (!isPointerDownRef.current || !lastMousePosRef.current) {
        console.log('🎨 [CanvasEventHandler] SHAPE MOUSEUP - no drag detected, canceling');
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Calculate shape dimensions from drag
      const startX = lastMousePosRef.current.x;
      const startY = lastMousePosRef.current.y;
      const width = Math.abs(pointer.x - startX);
      const height = Math.abs(pointer.y - startY);
      
      console.log('🎨 [CanvasEventHandler] SHAPE MOUSEUP - calculated dimensions:', { width, height, startX, startY, endX: pointer.x, endY: pointer.y });
      
      // Minimum size check - reduced for better UX
      if (width < 5 || height < 5) {
        logger.log('🎨 [CanvasEventHandler] Shape too small, canceling creation (minimum 5x5 pixels)');
        isPointerDownRef.current = false;
        lastMousePosRef.current = null;
        return;
      }

      const x = Math.min(startX, pointer.x);
      const y = Math.min(startY, pointer.y);

      logger.log('🎯 [CanvasEventHandler] Creating dragged shape:', currentTool, { x, y, width, height });
      
      // Get current tool from store to avoid stale closure values
      const actualCurrentTool = canvasStore.getState().selectedTool;
      
      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let newElement: any = null;
      
      switch (actualCurrentTool) {
        case 'rectangle':
          newElement = {
            id: toElementId(generateId()),
            type: 'rectangle' as const,
            x,
            y,
            width,
            height,
            fill: '#C7D2FE',
            stroke: '#6366F1',
            strokeWidth: 2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          break;
          
        case 'circle':
          newElement = {
            id: toElementId(generateId()),
            type: 'circle' as const,
            x: x + width / 2,
            y: y + height / 2,
            radius: Math.min(width, height) / 2,
            fill: '#FED7D7',
            stroke: '#E53E3E',
            strokeWidth: 2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          break;
          
        case 'triangle':
          newElement = {
            id: toElementId(generateId()),
            type: 'triangle' as const,
            x,
            y,
            points: [width/2, 0, 0, height, width, height],
            fill: '#BBF7D0',
            stroke: '#10B981',
            strokeWidth: 2,
            closed: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          break;
          
        case 'star':
          newElement = {
            id: toElementId(generateId()),
            type: 'star' as const,
            x: x + width / 2,
            y: y + height / 2,
            numPoints: 5,
            innerRadius: Math.min(width, height) / 4,
            radius: Math.min(width, height) / 2,
            fill: '#E1BEE7',
            stroke: '#9C27B0',
            strokeWidth: 2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          break;
      }
      
      if (newElement) {
        logger.log('🎯 [CanvasEventHandler] Creating element:', newElement);
        
        // Profile element creation
        CanvasPerformanceProfiler.profileSync(
          'shape-create',
          () => {
            addElement(newElement);
            selectElement(newElement.id);
            setSelectedTool('select');
          },
          {
            shapeType: actualCurrentTool,
            dimensions: { width, height }
          }
        );
      }

      // Cleanup
      isPointerDownRef.current = false;
      lastMousePosRef.current = null;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🎨 [CanvasEventHandler] Shape mouse up fallback handler activated');
      // Safe cleanup
      isPointerDownRef.current = false;
      lastMousePosRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const toolValidator = (tool: any) => {
      return ['rectangle', 'circle', 'triangle', 'star'].includes(tool);
    };

    return eventHandlerManager.createSafeEventHandler(
      'shapeMouseUp',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [currentTool, stageRef, addElement, selectElement, setSelectedTool]);

  // Enhanced pen mouse handlers with error handling
  const handlePenMouseDown = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      console.log('🖊️ [CanvasEventHandler] PEN MOUSEDOWN - target:', e.target === stageRef.current ? 'stage' : 'element');
      if (e.target !== stageRef.current) {
        console.log('🖊️ [CanvasEventHandler] PEN MOUSEDOWN - clicked on element, ignoring');
        return;
      }

      isPointerDownRef.current = true;
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (pointer) {
        // Get current tool from store to avoid stale closure values
        const actualCurrentTool = canvasStore.getState().selectedTool;
        logger.log('🖊️ [CanvasEventHandler] Starting pen drawing at:', pointer);
        startDrawing(pointer.x, pointer.y, actualCurrentTool as 'pen' | 'pencil');
      }
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🖊️ [CanvasEventHandler] Pen mouse down fallback handler activated');
      isPointerDownRef.current = false;
    };

    const toolValidator = (tool: any) => {
      return ['pen', 'pencil'].includes(tool);
    };

    return eventHandlerManager.createSafeEventHandler(
      'penMouseDown',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [stageRef, startDrawing]);

  const handlePenMouseMove = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPointerDownRef.current) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // For pen drawing, update immediately without throttling to avoid choppy lines
      logger.log('🖊️ [CanvasEventHandler] Updating pen drawing at:', pointer);
      updateDrawing(pointer.x, pointer.y);
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🖊️ [CanvasEventHandler] Pen mouse move fallback handler activated');
      isPointerDownRef.current = false;
    };

    return eventHandlerManager.createSafeEventHandler(
      'penMouseMove',
      originalHandler,
      fallbackHandler
    );
  }, [stageRef, updateDrawing]);

  const handlePenMouseUp = useMemo(() => {
    const originalHandler = () => {
      isPointerDownRef.current = false;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      logger.log('🖊️ [CanvasEventHandler] Finishing pen drawing');
      finishDrawing();
    };

    const fallbackHandler = () => {
      logger.warn('🖊️ [CanvasEventHandler] Pen mouse up fallback handler activated');
      isPointerDownRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    return eventHandlerManager.createSafeEventHandler(
      'penMouseUp',
      originalHandler,
      fallbackHandler
    );
  }, [finishDrawing]);

  // Enhanced connector mouse handlers with error handling
  const handleConnectorMouseDown = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Find nearest snap point
      const snapPoint = findNearestSnapPoint(pointer, elements);
      
      if (!isDrawingConnector) {
        setIsDrawingConnector(true);
        
        if (snapPoint) {
          console.log('🔗 [CanvasEventHandler] Connector start snapped to element:', snapPoint.elementId);
          setConnectorStart({
            x: snapPoint.x,
            y: snapPoint.y,
            elementId: snapPoint.elementId,
            anchor: snapPoint.attachmentPoint
          });
          setConnectorEnd({
            x: snapPoint.x,
            y: snapPoint.y,
            elementId: snapPoint.elementId,
            anchor: snapPoint.attachmentPoint
          });
        } else {
          setConnectorStart({ x: pointer.x, y: pointer.y });
          setConnectorEnd({ x: pointer.x, y: pointer.y });
        }
      }
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🔗 [CanvasEventHandler] Connector mouse down fallback handler activated');
      setIsDrawingConnector(false);
      setConnectorStart(null);
      setConnectorEnd(null);
      setHoveredSnapPoint(null);
    };

    const toolValidator = (tool: any) => {
      return ['connector', 'connector-line', 'connector-arrow', 'line'].includes(tool);
    };

    return eventHandlerManager.createSafeEventHandler(
      'connectorMouseDown',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [stageRef, elements, isDrawingConnector, setIsDrawingConnector, setConnectorStart, setConnectorEnd, setHoveredSnapPoint, findNearestSnapPoint]);

  const handleConnectorMouseMove = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawingConnector || !connectorStart) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Find nearest snap point for visual feedback
      const snapPoint = findNearestSnapPoint(pointer, elements);
      
      if (snapPoint) {
        setHoveredSnapPoint(snapPoint);
        setConnectorEnd({
          x: snapPoint.x,
          y: snapPoint.y,
          elementId: snapPoint.elementId,
          anchor: snapPoint.attachmentPoint
        });
      } else {
        setHoveredSnapPoint(null);
        setConnectorEnd({ x: pointer.x, y: pointer.y });
      }
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🔗 [CanvasEventHandler] Connector mouse move fallback handler activated');
      setHoveredSnapPoint(null);
    };

    return eventHandlerManager.createSafeEventHandler(
      'connectorMouseMove',
      originalHandler,
      fallbackHandler
    );
  }, [stageRef, elements, isDrawingConnector, connectorStart, setHoveredSnapPoint, setConnectorEnd, findNearestSnapPoint]);

  const handleConnectorMouseUp = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawingConnector || !connectorStart) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Find snap point for end position
      const endSnapPoint = findNearestSnapPoint(pointer, elements);
      const endPoint = endSnapPoint || { x: pointer.x, y: pointer.y };

      // Don't create connector if start and end are the same
      if (connectorStart.x === endPoint.x && connectorStart.y === endPoint.y) {
        console.log('🔗 [CanvasEventHandler] Connector too small, canceling');
        setIsDrawingConnector(false);
        setConnectorStart(null);
        setConnectorEnd(null);
        setHoveredSnapPoint(null);
        return;
      }

      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get current tool from store to avoid stale closure values
      const actualCurrentTool = canvasStore.getState().selectedTool;
      
      let subType: 'line' | 'arrow' | 'straight' | 'bent' | 'curved' = 'arrow'; // Default
      if (actualCurrentTool === 'connector-line' || actualCurrentTool === 'line') {
        subType = 'line';
      } else if (actualCurrentTool === 'connector-arrow') {
        subType = 'arrow';
      }

      const newConnector = {
        id: toElementId(generateId()),
        type: 'connector' as const,
        subType: subType,
        x: connectorStart.x, // Set base coordinates
        y: connectorStart.y,
        startPoint: {
          x: connectorStart.x,
          y: connectorStart.y,
          attachmentPoint: connectorStart.anchor
        },
        endPoint: {
          x: endPoint.x,
          y: endPoint.y,
          attachmentPoint: endSnapPoint?.attachmentPoint
        },
        startElementId: connectorStart.elementId,
        endElementId: endSnapPoint?.elementId,
        stroke: '#6366F1',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      console.log('🔗 [CanvasEventHandler] Creating connector:', {
        from: connectorStart.elementId || 'canvas',
        to: endSnapPoint?.elementId || 'canvas',
        type: subType
      });

      addElement(newConnector);

      // Reset state
      setIsDrawingConnector(false);
      setConnectorStart(null);
      setConnectorEnd(null);
      setHoveredSnapPoint(null);
      setSelectedTool('select');
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🔗 [CanvasEventHandler] Connector mouse up fallback handler activated');
      // Safe cleanup
      setIsDrawingConnector(false);
      setConnectorStart(null);
      setConnectorEnd(null);
      setHoveredSnapPoint(null);
      setSelectedTool('select');
    };

    const toolValidator = (tool: any) => {
      return ['connector', 'connector-line', 'connector-arrow', 'line'].includes(tool);
    };

    return eventHandlerManager.createSafeEventHandler(
      'connectorMouseUp',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [stageRef, elements, isDrawingConnector, connectorStart, setIsDrawingConnector, setConnectorStart, setConnectorEnd, setHoveredSnapPoint, setSelectedTool, findNearestSnapPoint, addElement]);

  const [currentOperationId, setCurrentOperationId] = useState<string | null>(null);

  // Enhanced section mouse handlers with error handling
  const handleSectionMouseDown = useMemo(() => {
    return eventHandlerManager.createSectionMouseDownHandler(
      stageRef,
      (operationId) => {
        setIsDrawingSection(true);
        setPreviewSection({ x: 0, y: 0, width: 0, height: 0 }); // Reset preview
        setCurrentOperationId(operationId);
      },
      lastMousePosRef
    );
  }, [stageRef, setIsDrawingSection, setPreviewSection, setCurrentOperationId]);

  const handleSectionMouseUp = useMemo(() => {
    return eventHandlerManager.createSectionMouseUpHandler(
      stageRef,
      currentOperationId,
      () => {
        setIsDrawingSection(false);
        setPreviewSection(null);
        setCurrentOperationId(null);
      },
      createSection,
      (sectionId: string) => captureElementsAfterSectionCreation(sectionId as any),
      setSelectedTool
    );
  }, [
    stageRef, 
    currentOperationId, 
    setIsDrawingSection, 
    setPreviewSection, 
    setCurrentOperationId,
    createSection, 
    captureElementsAfterSectionCreation,
    setSelectedTool
  ]);

  const handleSectionMouseMove = useMemo(() => {
    return eventHandlerManager.createSectionMouseMoveHandler(
      stageRef,
      isDrawingSection,
      currentOperationId,
      setPreviewSection
    );
  }, [stageRef, isDrawingSection, currentOperationId, setPreviewSection]);

  // Enhanced sticky note click handler with error handling
  const handleStickyNoteClick = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      console.log('🗒️ [CanvasEventHandler] STICKY NOTE CLICK - Creating sticky note at:', pointer);
      logger.log('🗒️ [CanvasEventHandler] Creating sticky note at:', pointer);
      
      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newStickyNote = {
        id: toElementId(generateId()),
        type: 'sticky-note' as const,
        x: pointer.x,
        y: pointer.y,
        width: 150,
        height: 150,
        backgroundColor: '#FEF3C7',
        text: 'Type your note here...',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        textColor: '#92400E',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      logger.log('🗒️ [CanvasEventHandler] Creating sticky note element:', newStickyNote);
      addElement(newStickyNote);
      selectElement(newStickyNote.id);
      setSelectedTool('select');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🗒️ [CanvasEventHandler] Sticky note click fallback handler activated');
      setSelectedTool('select');
    };

    const toolValidator = (tool: any) => {
      return tool === 'sticky-note';
    };

    return eventHandlerManager.createSafeEventHandler(
      'stickyNoteClick',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [stageRef, addElement, selectElement, setSelectedTool]);

  // Enhanced image click handler with error handling
  const handleImageClick = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      console.log('🖼️ [CanvasEventHandler] IMAGE CLICK - Triggering file upload at:', pointer);

      // Create file input element for image upload
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';

      const handleFileSelect = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file) {
          console.log('🖼️ [CanvasEventHandler] File selected:', file.name, file.type, file.size);

          // Validate file type
          if (!file.type.startsWith('image/')) {
            console.error('🖼️ [CanvasEventHandler] Invalid file type:', file.type);
            alert('Please select an image file (PNG, JPG, GIF, etc.)');
            return;
          }

          // Validate file size (max 10MB)
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            console.error('🖼️ [CanvasEventHandler] File too large:', file.size);
            alert('Image file is too large. Please select an image smaller than 10MB.');
            return;
          }

          // Create FileReader to convert to data URL
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              console.log('🖼️ [CanvasEventHandler] Image loaded, creating element');

              // Create image element to get dimensions
              const img = new Image();
              img.onload = () => {
                // Calculate display size (maintain aspect ratio, max 400px width/height)
                const maxDisplaySize = 400;
                let displayWidth = img.naturalWidth;
                let displayHeight = img.naturalHeight;

                if (displayWidth > maxDisplaySize || displayHeight > maxDisplaySize) {
                  const aspectRatio = img.naturalWidth / img.naturalHeight;
                  if (displayWidth > displayHeight) {
                    displayWidth = maxDisplaySize;
                    displayHeight = maxDisplaySize / aspectRatio;
                  } else {
                    displayHeight = maxDisplaySize;
                    displayWidth = maxDisplaySize * aspectRatio;
                  }
                }

                const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const newImage = {
                  id: toElementId(generateId()),
                  type: 'image' as const,
                  x: pointer.x - displayWidth / 2, // Center on click point
                  y: pointer.y - displayHeight / 2,
                  width: displayWidth,
                  height: displayHeight,
                  imageUrl: result, // Base64 data URL
                  originalWidth: img.naturalWidth,
                  originalHeight: img.naturalHeight,
                  fileName: file.name,
                  fileSize: file.size,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };

                logger.log('🖼️ [CanvasEventHandler] Creating image element:', {
                  fileName: file.name,
                  originalSize: { width: img.naturalWidth, height: img.naturalHeight },
                  displaySize: { width: displayWidth, height: displayHeight },
                  fileSize: file.size
                });

                addElement(newImage);
                selectElement(newImage.id);
                setSelectedTool('select');
              };

              img.onerror = () => {
                console.error('🖼️ [CanvasEventHandler] Failed to load image');
                alert('Failed to load the selected image. Please try a different image.');
              };

              img.src = result;
            }
          };

          reader.onerror = () => {
            console.error('🖼️ [CanvasEventHandler] Failed to read file');
            alert('Failed to read the selected file. Please try again.');
          };

          reader.readAsDataURL(file);
        }

        // Clean up
        document.body.removeChild(fileInput);
      };

      fileInput.addEventListener('change', handleFileSelect);
      document.body.appendChild(fileInput);
      fileInput.click();
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🖼️ [CanvasEventHandler] Image click fallback handler activated');
      setSelectedTool('select');
    };

    const toolValidator = (tool: any) => {
      return tool === 'image';
    };

    return eventHandlerManager.createSafeEventHandler(
      'imageClick',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [stageRef, addElement, selectElement, setSelectedTool]);

  // Enhanced table click handler with error handling
  const handleTableClick = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      console.log('📊 [CanvasEventHandler] TABLE CLICK - Creating table at:', pointer);

      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tableId = generateId();
      
      // Create enhanced table data using the helper function
      const enhancedTableData = createTableData(tableId, 3, 3);
      
      // Calculate initial dimensions from the enhanced data
      const initialWidth = enhancedTableData.columns.reduce((sum, col) => sum + col.width, 0);
      const initialHeight = enhancedTableData.rows.reduce((sum, row) => sum + row.height, 0);
      
      const newTable = {
          id: toElementId(tableId),
          type: 'table' as const,
          x: pointer.x,
          y: pointer.y,
          width: initialWidth,
          height: initialHeight,
          rows: 3,
          cols: 3,
          enhancedTableData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
      };

      addElement(newTable);
      selectElement(newTable.id);
      setSelectedTool('select');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('📊 [CanvasEventHandler] Table click fallback handler activated');
      setSelectedTool('select');
    };

    const toolValidator = (tool: any) => {
      return tool === 'table';
    };

    return eventHandlerManager.createSafeEventHandler(
      'tableClick',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [stageRef, addElement, selectElement, setSelectedTool]);

  // Handle shape click for immediate creation with default size
  // Enhanced shape click handler with error handling
  const handleShapeClick = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      console.log('🎨 [CanvasEventHandler] SHAPE CLICK - Creating shape with default size:', currentTool);
      logger.log('🎨 [CanvasEventHandler] Creating shape with default size:', currentTool);
      
      // Get current tool from store to avoid stale closure values
      const actualCurrentTool = canvasStore.getState().selectedTool;
      
      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let newElement: any = null;
      
      switch (actualCurrentTool) {
        case 'rectangle':
          newElement = {
            id: toElementId(generateId()),
            type: 'rectangle' as const,
            x: pointer.x - 50, // Center the shape on click point
            y: pointer.y - 40,
            width: 100,
            height: 80,
            fill: '#C7D2FE',
            stroke: '#6366F1',
            strokeWidth: 2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          break;
          
        case 'circle':
          newElement = {
            id: toElementId(generateId()),
            type: 'circle' as const,
            x: pointer.x,
            y: pointer.y,
            radius: 50,
            fill: '#FED7D7',
            stroke: '#E53E3E',
            strokeWidth: 2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          break;
          
        case 'triangle':
          newElement = {
            id: toElementId(generateId()),
            type: 'triangle' as const,
            x: pointer.x - 50, // Center the shape on click point
            y: pointer.y - 30,
            points: [50, 0, 0, 60, 100, 60], // Default triangle points
            fill: '#BBF7D0',
            stroke: '#10B981',
            strokeWidth: 2,
            closed: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          break;
          
        case 'star':
          newElement = {
            id: toElementId(generateId()),
            type: 'star' as const,
            x: pointer.x,
            y: pointer.y,
            numPoints: 5,
            innerRadius: 25,
            outerRadius: 50,
            fill: '#E1BEE7',
            stroke: '#9C27B0',
            strokeWidth: 2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          break;
      }
      
      if (newElement) {
        logger.log('🎯 [CanvasEventHandler] Creating shape element:', newElement);
        addElement(newElement);
        selectElement(newElement.id);
        setSelectedTool('select');
      }
    };

    const fallbackHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🎨 [CanvasEventHandler] Shape click fallback handler activated');
      setSelectedTool('select');
    };

    const toolValidator = (tool: any) => {
      return ['rectangle', 'circle', 'triangle', 'star'].includes(tool);
    };

    return eventHandlerManager.createSafeEventHandler(
      'shapeClick',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [currentTool, stageRef, addElement, selectElement, setSelectedTool]);

  // Enhanced pen click handler with error handling
  const handlePenClick = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Pen drawing is handled by mousedown/mouseup, click is just for cleanup
      logger.log('🖊️ [CanvasEventHandler] Pen click - handled by mouse events');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🖊️ [CanvasEventHandler] Pen click fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return ['pen', 'pencil'].includes(tool);
    };

    return eventHandlerManager.createSafeEventHandler(
      'penClick',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  // Enhanced connector click handler with error handling
  const handleConnectorClick = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Connector creation is handled by mousedown/mouseup, click is just for cleanup
      logger.log('🔗 [CanvasEventHandler] Connector click - handled by mouse events');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🔗 [CanvasEventHandler] Connector click fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return tool === 'connector';
    };

    return eventHandlerManager.createSafeEventHandler(
      'connectorClick',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  // Enhanced section click handler with error handling
  const handleSectionClick = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Section creation is handled by mousedown/mouseup, click is just for cleanup
      logger.log('📦 [CanvasEventHandler] Section click - handled by mouse events');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('📦 [CanvasEventHandler] Section click fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return tool === 'section';
    };

    return eventHandlerManager.createSafeEventHandler(
      'sectionClick',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  // Enhanced sticky note mouse handlers with error handling
  const handleStickyNoteMouseDown = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Sticky note uses click for creation, these are just for event handling consistency
      logger.log('📝 [CanvasEventHandler] Sticky note mouse down - handled by click');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('📝 [CanvasEventHandler] Sticky note mouse down fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return tool === 'sticky-note';
    };

    return eventHandlerManager.createSafeEventHandler(
      'stickyNoteMouseDown',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  const handleStickyNoteMouseMove = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Sticky note uses click for creation, these are just for event handling consistency
      logger.log('📝 [CanvasEventHandler] Sticky note mouse move - handled by click');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('📝 [CanvasEventHandler] Sticky note mouse move fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return tool === 'sticky-note';
    };

    return eventHandlerManager.createSafeEventHandler(
      'stickyNoteMouseMove',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  const handleStickyNoteMouseUp = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Sticky note uses click for creation, these are just for event handling consistency
      logger.log('📝 [CanvasEventHandler] Sticky note mouse up - handled by click');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('📝 [CanvasEventHandler] Sticky note mouse up fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return tool === 'sticky-note';
    };

    return eventHandlerManager.createSafeEventHandler(
      'stickyNoteMouseUp',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  // Enhanced image mouse handlers with error handling
  const handleImageMouseDown = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Image uses click for creation, these are just for event handling consistency
      logger.log('🖼️ [CanvasEventHandler] Image mouse down - handled by click');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🖼️ [CanvasEventHandler] Image mouse down fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return tool === 'image';
    };

    return eventHandlerManager.createSafeEventHandler(
      'imageMouseDown',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  const handleImageMouseMove = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Image uses click for creation, these are just for event handling consistency
      logger.log('🖼️ [CanvasEventHandler] Image mouse move - handled by click');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🖼️ [CanvasEventHandler] Image mouse move fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return tool === 'image';
    };

    return eventHandlerManager.createSafeEventHandler(
      'imageMouseMove',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  const handleImageMouseUp = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Image uses click for creation, these are just for event handling consistency
      logger.log('🖼️ [CanvasEventHandler] Image mouse up - handled by click');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('🖼️ [CanvasEventHandler] Image mouse up fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return tool === 'image';
    };

    return eventHandlerManager.createSafeEventHandler(
      'imageMouseUp',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  // Enhanced table mouse handlers with error handling
  const handleTableMouseDown = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Table uses click for creation, these are just for event handling consistency
      logger.log('📊 [CanvasEventHandler] Table mouse down - handled by click');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('📊 [CanvasEventHandler] Table mouse down fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return tool === 'table';
    };

    return eventHandlerManager.createSafeEventHandler(
      'tableMouseDown',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  const handleTableMouseMove = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Table uses click for creation, these are just for event handling consistency
      logger.log('📊 [CanvasEventHandler] Table mouse move - handled by click');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('📊 [CanvasEventHandler] Table mouse move fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return tool === 'table';
    };

    return eventHandlerManager.createSafeEventHandler(
      'tableMouseMove',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  const handleTableMouseUp = useMemo(() => {
    const originalHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Table uses click for creation, these are just for event handling consistency
      logger.log('📊 [CanvasEventHandler] Table mouse up - handled by click');
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      logger.warn('📊 [CanvasEventHandler] Table mouse up fallback handler activated');
    };

    const toolValidator = (tool: any) => {
      return tool === 'table';
    };

    return eventHandlerManager.createSafeEventHandler(
      'tableMouseUp',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, []);

  // Enhanced wheel handler with error handling
  const handleWheel = useMemo(() => {
    const originalHandler = (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      
      const scaleFactor = 1.1;
      const newZoom = e.evt.deltaY < 0 ? zoom * scaleFactor : zoom / scaleFactor;
      
      // Get stage for mouse position calculation
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          // Calculate new pan to keep mouse position fixed relative to canvas content
          const newPanX = pointer.x - (pointer.x - pan.x) * (newZoom / zoom);
          const newPanY = pointer.y - (pointer.y - pan.y) * (newZoom / zoom);
          
          setZoom(newZoom);
          setPan({ x: newPanX, y: newPanY });
        } else {
          // Fallback: just set zoom without adjusting pan
          setZoom(newZoom);
        }
      }
    };

    const fallbackHandler = (_e: Konva.KonvaEventObject<WheelEvent>) => {
      logger.warn('🎯 [CanvasEventHandler] Wheel fallback handler activated');
      // No specific fallback needed for wheel - just prevent errors
    };

    // Wheel handler doesn't depend on tools, so always validate as true
    const toolValidator = (_tool: any) => true;

    return eventHandlerManager.createSafeEventHandler(
      'wheel',
      originalHandler,
      fallbackHandler,
      toolValidator
    );
  }, [zoom, pan, stageRef, setZoom, setPan]);

  // CRITICAL: Register event handlers based on current tool
  // This useEffect maps the defined handlers to the currentToolHandlersRef based on the selected tool
  useEffect(() => {
    const toolHandlerMap = new Map<string, EventHandler>();

    // Get current tool and validate it
    const currentTool = validateToolState(selectedTool as CanvasTool);

    // Register handlers based on current tool
    switch (currentTool) {
      case 'select':
        toolHandlerMap.set('mousedown', handleSelectMouseDown);
        toolHandlerMap.set('mousemove', handleSelectMouseMove);
        toolHandlerMap.set('mouseup', handleSelectMouseUp);
        toolHandlerMap.set('click', handleSelectClick);
        toolHandlerMap.set('dragend', handleElementDragEnd);
        break;

      case 'pan':
        toolHandlerMap.set('mousedown', handlePanMouseDown);
        toolHandlerMap.set('mousemove', handlePanMouseMove);
        toolHandlerMap.set('mouseup', handlePanMouseUp);
        break;

      case 'text':
        toolHandlerMap.set('click', handleTextClick);
        toolHandlerMap.set('dragend', handleElementDragEnd);
        break;

      case 'rectangle':
      case 'circle':
      case 'triangle':
      case 'star':
        // All shape tools use the generic shape handlers
        toolHandlerMap.set('mousedown', handleShapeMouseDown);
        toolHandlerMap.set('mousemove', handleShapeMouseMove);
        toolHandlerMap.set('mouseup', handleShapeMouseUp);
        toolHandlerMap.set('click', handleShapeClick);
        toolHandlerMap.set('dragend', handleElementDragEnd);
        break;

      case 'pen':
        toolHandlerMap.set('mousedown', handlePenMouseDown);
        toolHandlerMap.set('mousemove', handlePenMouseMove);
        toolHandlerMap.set('mouseup', handlePenMouseUp);
        toolHandlerMap.set('click', handlePenClick);
        toolHandlerMap.set('dragend', handleElementDragEnd);
        break;

      case 'connector':
      case 'connector-line':
      case 'connector-arrow':
      case 'line':
        toolHandlerMap.set('mousedown', handleConnectorMouseDown);
        toolHandlerMap.set('mousemove', handleConnectorMouseMove);
        toolHandlerMap.set('mouseup', handleConnectorMouseUp);
        toolHandlerMap.set('click', handleConnectorClick);
        toolHandlerMap.set('dragend', handleElementDragEnd);
        break;

      case 'section':
        toolHandlerMap.set('mousedown', handleSectionMouseDown);
        toolHandlerMap.set('mousemove', handleSectionMouseMove);
        toolHandlerMap.set('mouseup', handleSectionMouseUp);
        toolHandlerMap.set('click', handleSectionClick);
        toolHandlerMap.set('dragend', handleElementDragEnd);
        break;

      case 'sticky-note':
        toolHandlerMap.set('click', handleStickyNoteClick);
        toolHandlerMap.set('mousedown', handleStickyNoteMouseDown);
        toolHandlerMap.set('mousemove', handleStickyNoteMouseMove);
        toolHandlerMap.set('mouseup', handleStickyNoteMouseUp);
        toolHandlerMap.set('dragend', handleElementDragEnd);
        break;

      case 'image':
        toolHandlerMap.set('click', handleImageClick);
        toolHandlerMap.set('mousedown', handleImageMouseDown);
        toolHandlerMap.set('mousemove', handleImageMouseMove);
        toolHandlerMap.set('mouseup', handleImageMouseUp);
        toolHandlerMap.set('dragend', handleElementDragEnd);
        break;

      case 'table':
        toolHandlerMap.set('click', handleTableClick);
        toolHandlerMap.set('mousedown', handleTableMouseDown);
        toolHandlerMap.set('mousemove', handleTableMouseMove);
        toolHandlerMap.set('mouseup', handleTableMouseUp);
        toolHandlerMap.set('dragend', handleElementDragEnd);
        break;

      default:
        // Fallback to select tool handlers
        toolHandlerMap.set('mousedown', handleSelectMouseDown);
        toolHandlerMap.set('mousemove', handleSelectMouseMove);
        toolHandlerMap.set('mouseup', handleSelectMouseUp);
        toolHandlerMap.set('click', handleSelectClick);
        toolHandlerMap.set('dragend', handleElementDragEnd);
        break;
    }

    // Always register wheel handler (for pan/zoom)
    toolHandlerMap.set('wheel', handleWheel);

    // Update the ref with new handlers
    currentToolHandlersRef.current = toolHandlerMap;

    logger.log('🔄 [CanvasEventHandler] Tool handlers registered for:', currentTool, 'handlers:', Array.from(toolHandlerMap.keys()));

  }, [
    selectedTool,
    // All the handler dependencies
    handleSelectMouseDown, handleSelectMouseMove, handleSelectMouseUp, handleSelectClick,
    handlePanMouseDown, handlePanMouseMove, handlePanMouseUp,
    handleTextClick,
    handleShapeMouseDown, handleShapeMouseMove, handleShapeMouseUp, handleShapeClick,
    handlePenMouseDown, handlePenMouseMove, handlePenMouseUp, handlePenClick,
    handleConnectorMouseDown, handleConnectorMouseMove, handleConnectorMouseUp, handleConnectorClick,
    handleSectionMouseDown, handleSectionMouseMove, handleSectionMouseUp, handleSectionClick,
    handleStickyNoteClick, handleStickyNoteMouseDown, handleStickyNoteMouseMove, handleStickyNoteMouseUp,
    handleImageClick, handleImageMouseDown, handleImageMouseMove, handleImageMouseUp,
    handleTableClick, handleTableMouseDown, handleTableMouseMove, handleTableMouseUp,
    handleElementDragEnd, handleWheel
  ]);

  // Keyboard event handler - consolidated from useCanvasEvents
  // INSIGHTS FROM TESTS: Enhanced keyboard shortcuts with clear documentation
  // Note: This handler operates on native DOM events, not Konva events, so it doesn't use EventHandlerManager
  function handleKeyDown(e: KeyboardEvent) {
    // INSIGHT FROM TESTS: Don't trigger shortcuts when input elements are focused
    // This prevents accidental deletion when user is typing in text fields
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true'
    )) {
      return; // Let the input element handle the key press
    }

    try {
      // Delete/Backspace: Remove selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.size > 0) {
          e.preventDefault();
          // INSIGHT FROM TESTS: Use the convenience method instead of manual deletion
          deleteSelectedElements();
          addHistoryEntry('Delete elements', [], []);
        }
      } 
      // Escape: Clear current operations and selections
      else if (e.key === 'Escape') {
        if (editingTextId) {
          // Exit text editing mode
          setEditingTextId(null);
        }
        // Clear selection (common UX pattern for canceling operations)
        if (selectedElementIds.size > 0) {
          clearSelection();
        }
        // INSIGHT FROM TESTS: Reset tool to 'select' mode for consistent UX
        // This ensures Escape acts as a universal "cancel" operation
        setSelectedTool('select');
      }
    } catch (error) {
      logger.error('⌨️ [CanvasEventHandler] Error in keyboard handler:', error);
      // Fallback: Reset to select tool
      try {
        setSelectedTool('select');
      } catch (fallbackError) {
        logger.error('⌨️ [CanvasEventHandler] Error in keyboard fallback:', fallbackError);
      }
    }
  }

  // INSIGHT FROM TESTS: Memory leak prevention
  useEffect(() => {
    // Track component mount
    memoryTracker.trackMount();
    
    return () => {
      // Track component unmount
      memoryTracker.trackUnmount();
      
      // Cleanup on unmount to prevent memory leaks
      cleanupToolState();
      
      // Clean up tracked event listeners
      eventListenerIds.current.forEach(id => {
        MemoryLeakDetector.untrackResource(id);
      });
      eventListenerIds.current = [];
    };
  }, []);

  // FIXED: Set up event delegation with stable event listeners
  useEffect(() => {
    const stage = stageRef?.current;
    if (!stage) return;

    // Initialize state monitoring system
    stateSynchronizationMonitor.startMonitoring();

    // Set up global keyboard event listener
    const handleKeyDownEvent = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener('keydown', handleKeyDownEvent);

    // Generic handler that dispatches to the correct tool-specific logic
    const handleEvent = (e: Konva.KonvaEventObject<any>) => {
      try {
        // INSIGHT FROM TESTS: Track event performance in development
        if (process.env.NODE_ENV === 'development') {
          performanceMonitor.trackEvent(e.type);
        }

        // FIXED: Get current tool directly from store to avoid stale closure values
        const actualCurrentTool = canvasStore.getState().selectedTool;
        
        // INSIGHT FROM TESTS: Validate tool state before processing events
        const validatedTool = validateToolState(actualCurrentTool as CanvasTool);
        if (validatedTool !== actualCurrentTool) {
          logger.warn('🎯 [CanvasEventHandler] Tool validation failed, cleaning up:', actualCurrentTool);
          cleanupToolState();
          setSelectedTool(validatedTool);
          return;
        }
        
        console.log('🎯 [CanvasEventHandler] Event received:', e.type, 'currentTool:', actualCurrentTool);
        logger.log('🎯 [CanvasEventHandler] Event received:', e.type, 'currentTool:', actualCurrentTool);
        
        // FIXED: Use the ref to get current handlers, avoiding dependency on toolHandlers
        const handler = currentToolHandlersRef.current.get(e.type);
        if (handler) {
          console.log('🎯 [CanvasEventHandler] Handler found for:', e.type, 'executing...');
          logger.log('🎯 [CanvasEventHandler] Handler found for:', e.type, 'executing...');
          
          // INSIGHT FROM TESTS: Wrap all handler execution in try-catch for graceful error recovery
          const executeHandler = () => {
            try {
              handler(e);
            } catch (handlerError) {
              logger.error('🎯 [CanvasEventHandler] Handler execution error:', handlerError);
              // INSIGHT FROM TESTS: Attempt state cleanup on handler error
              cleanupToolState();
              // Fall back to select tool for safety
              setSelectedTool('select');
            }
          };
          
          // Use requestAnimationFrame for expensive mousemove events
          if (e.type === 'mousemove') {
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }
            animationFrameRef.current = requestAnimationFrame(executeHandler);
          } else {
            executeHandler();
          }
        } else {
          // INSIGHT FROM TESTS: Don't spam console with no handler messages for expected cases
          if (!['mousemove', 'wheel'].includes(e.type)) {
            console.log('🚫 [CanvasEventHandler] No handler found for:', e.type, 'currentTool:', actualCurrentTool);
          }
          logger.log('🚫 [CanvasEventHandler] No handler found for:', e.type, 'currentTool:', currentTool);
        }
      } catch (error) {
        logger.error(`Error in event handler for ${e.type}:`, error);
        
        // Record the error for monitoring
        stateSynchronizationMonitor.reportIssue({
          type: 'tool_mismatch',
          severity: 'medium',
          description: `Event handler error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          expectedValue: 'successful event handling',
          actualValue: error,
          autoFixed: false
        });

        // For critical drawing events, attempt recovery
        if (['mousedown', 'mouseup', 'mousemove'].includes(e.type) && 
            ['section', 'rectangle', 'circle', 'star', 'triangle', 'pen', 'connector'].includes(canvasStore.getState().selectedTool)) {
          logger.warn('Attempting drawing state recovery after error');
          drawingStateManager.cancelCurrentOperation();
        }
      }
    };

    // Attach all event listeners including dragend
    const eventTypes = ['mousedown', 'mousemove', 'mouseup', 'click', 'wheel', 'dragend'];
    eventTypes.forEach(eventType => {
      stage.on(eventType, handleEvent);
      
      // Track event listener for memory leak detection
      const listenerId = MemoryLeakDetector.trackEventListener(
        'Stage',
        eventType,
        'handleEvent'
      );
      eventListenerIds.current.push(listenerId);
    });

    // Cleanup function
    return () => {
      eventTypes.forEach(eventType => {
        stage.off(eventType, handleEvent);
      });
      
      // Clean up tracked event listeners in MemoryLeakDetector
      eventListenerIds.current.forEach(id => {
        MemoryLeakDetector.untrackResource(id);
      });
      eventListenerIds.current = [];
      
      // Clean up keyboard event listener
      window.removeEventListener('keydown', handleKeyDownEvent);
      
      // Clean up monitoring systems
      stateSynchronizationMonitor.stopMonitoring();
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clean up any active drawing states
      cleanupToolState();
    };
  }, [stageRef]); // FIXED: Remove toolHandlers from dependency to prevent constant re-attachment

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return <>{children}</>;
};
