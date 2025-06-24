/**
 * CanvasEventHandler - Centralized Event Delegation System
 * Part of LibreOllama Canvas Refactoring - Phase 3
 * 
 * This component centralizes all canvas interactions using the event delegation pattern.
 * A single listener per event type is attached to the stage, dramatically reducing overhead.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import Konva from 'konva';
import { CanvasTool, ElementId } from '../types/enhanced.types';
import { useCanvasStore } from '../stores';
import { toElementId } from '../types/compatibility';
import { logger } from '@/lib/logger';

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
  stageRef: React.RefObject<Konva.Stage>;
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

  // Access canvas store for drawing functions - split selectors
  const startDrawing = useCanvasStore((state) => state.startDrawing);
  const updateDrawing = useCanvasStore((state) => state.updateDrawing);
  const finishDrawing = useCanvasStore((state) => state.finishDrawing);
  const addElement = useCanvasStore((state) => state.addElement);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const deselectElement = useCanvasStore((state) => state.deselectElement);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const setSelectedTool = useCanvasStore((state) => state.setSelectedTool);
  const createSection = useCanvasStore((state) => state.createSection);
  const captureElementsAfterSectionCreation = useCanvasStore((state) => state.captureElementsAfterSectionCreation);

  // Build a map of handlers for the current tool
  const toolHandlers = useMemo(() => {
    const map = new Map<string, EventHandler>();

    // Define tool-specific event handlers
    switch (currentTool) {
      case 'select':
        map.set('mousedown', handleSelectMouseDown);
        map.set('mousemove', handleSelectMouseMove);
        map.set('mouseup', handleSelectMouseUp);
        map.set('click', handleSelectClick);
        break;

      case 'pan':
        map.set('mousedown', handlePanMouseDown);
        map.set('mousemove', handlePanMouseMove);
        map.set('mouseup', handlePanMouseUp);
        break;

      case 'text':
        map.set('click', handleTextClick);
        break;

      case 'rectangle':
      case 'circle':
      case 'star':
      case 'triangle':
        map.set('mousedown', handleShapeMouseDown);
        map.set('mousemove', handleShapeMouseMove);
        map.set('mouseup', handleShapeMouseUp);
        map.set('click', handleShapeClick);
        break;

      case 'pen':
        map.set('mousedown', handlePenMouseDown);
        map.set('mousemove', handlePenMouseMove);
        map.set('mouseup', handlePenMouseUp);
        map.set('click', handlePenClick);
        break;

      case 'line':
      case 'connector':
      case 'connector-line':
      case 'connector-arrow':
        map.set('mousedown', handleConnectorMouseDown);
        map.set('mousemove', handleConnectorMouseMove);
        map.set('mouseup', handleConnectorMouseUp);
        map.set('click', handleConnectorClick);
        break;

      case 'section':
        // RE-ENABLED: Section tool handlers to enable drawing mode
        map.set('mousedown', handleSectionMouseDown);
        map.set('mousemove', handleSectionMouseMove);
        map.set('mouseup', handleSectionMouseUp);
        map.set('click', handleSectionClick);
        break;

      case 'sticky-note':
        map.set('click', handleStickyNoteClick);
        map.set('mousedown', handleStickyNoteMouseDown);
        map.set('mousemove', handleStickyNoteMouseMove);
        map.set('mouseup', handleStickyNoteMouseUp);
        break;

      case 'image':
        map.set('click', handleImageClick);
        map.set('mousedown', handleImageMouseDown);
        map.set('mousemove', handleImageMouseMove);
        map.set('mouseup', handleImageMouseUp);
        break;

      case 'table':
        map.set('click', handleTableClick);
        map.set('mousedown', handleTableMouseDown);
        map.set('mousemove', handleTableMouseMove);
        map.set('mouseup', handleTableMouseUp);
        break;
    }

    // Always handle wheel events for zoom
    map.set('wheel', handleWheel);

    return map;
  }, [currentTool]);

  // Event handler implementations
  function handleSelectMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
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
  }

  function handleSelectMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isPointerDownRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer || !lastMousePosRef.current) return;

    // Throttle mousemove events using requestAnimationFrame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const delta = {
        x: pointer.x - lastMousePosRef.current!.x,
        y: pointer.y - lastMousePosRef.current!.y
      };

      if (e.target === stage) {
        // Selection box drag - for now, just skip this
        // TODO: Implement selection box if needed
      } else {
        // Element drag - update element position
        const elementId = e.target.id();
        if (elementId) {
          const typedElementId = toElementId(elementId);
          updateElement(typedElementId, {
            x: e.target.x(),
            y: e.target.y(),
            updatedAt: Date.now()
          });
        }
      }

      lastMousePosRef.current = pointer;
    });
  }

  function handleSelectMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
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
  }

  function handleSelectClick(e: Konva.KonvaEventObject<MouseEvent>) {
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
  }

  function handlePanMouseDown(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Pan is handled by Stage's draggable prop, no action needed here
    isPointerDownRef.current = true;
  }

  function handlePanMouseMove(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Pan is handled by Stage's draggable prop, no action needed here
  }

  function handlePanMouseUp() {
    // Pan is handled by Stage's draggable prop, no action needed here
    isPointerDownRef.current = false;
  }

  function handleTextClick(_e: Konva.KonvaEventObject<MouseEvent>) {
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
  }

  function handleShapeMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
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
  }

  function handleShapeMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isPointerDownRef.current || !lastMousePosRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // TODO: Show preview shape during drag
    // For now, just track the movement
  }

  function handleShapeMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
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
    
    const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let newElement: any = null;
    
    switch (currentTool) {
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
      addElement(newElement);
      selectElement(newElement.id);
      setSelectedTool('select');
    }

    // Cleanup
    isPointerDownRef.current = false;
    lastMousePosRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function handlePenMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
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
      logger.log('🖊️ [CanvasEventHandler] Starting pen drawing at:', pointer);
      startDrawing(pointer.x, pointer.y, currentTool as 'pen' | 'pencil');
    }
  }

  function handlePenMouseMove(_e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isPointerDownRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // For pen drawing, update immediately without throttling to avoid choppy lines
    logger.log('🖊️ [CanvasEventHandler] Updating pen drawing at:', pointer);
    updateDrawing(pointer.x, pointer.y);
  }

  function handlePenMouseUp() {
    isPointerDownRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    logger.log('🖊️ [CanvasEventHandler] Finishing pen drawing');
    finishDrawing();
  }

  function handleConnectorMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const target = e.target;
    const elementId = target.id() ? toElementId(target.id()) : undefined;

    if (!isDrawingConnector) {
        setIsDrawingConnector(true);
        setConnectorStart({ x: pointer.x, y: pointer.y, elementId });
        setConnectorEnd({ x: pointer.x, y: pointer.y, elementId });
    }
  }

  function handleConnectorMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
      if (!isDrawingConnector || !connectorStart) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      setConnectorEnd({ x: pointer.x, y: pointer.y });
  }

  function handleConnectorMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isDrawingConnector || !connectorStart) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const target = e.target;
    const endElementId = target.id() ? toElementId(target.id()) : undefined;

    const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let subType: 'line' | 'arrow' | 'straight' | 'bent' | 'curved' = 'arrow'; // Default
    if (currentTool === 'connector-line' || currentTool === 'line') {
      subType = 'line';
    } else if (currentTool === 'connector-arrow') {
      subType = 'arrow';
    }

    const newConnector = {
      id: toElementId(generateId()),
      type: 'connector' as const,
      subType: subType,
      x: connectorStart.x, // Set base coordinates
      y: connectorStart.y,
      startPoint: { x: connectorStart.x, y: connectorStart.y },
      endPoint: { x: pointer.x, y: pointer.y },
      startElementId: connectorStart.elementId,
      endElementId: endElementId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addElement(newConnector);

    // Reset state
    setIsDrawingConnector(false);
    setConnectorStart(null);
    setConnectorEnd(null);
    setSelectedTool('select');
  }

  function handleSectionMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    console.log('🎯 [CanvasEventHandler] SECTION MOUSEDOWN - starting section draw');
    // Only allow section drawing when clicking on the stage (not on existing elements)
    if (e.target !== stageRef.current) {
        console.log('🎯 [CanvasEventHandler] SECTION MOUSEDOWN - clicked on element, ignoring');
        return;
    }
    
    isPointerDownRef.current = true;
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointer = stage.getPointerPosition();
    if (pointer) {
        console.log('🎯 [CanvasEventHandler] SECTION MOUSEDOWN - pointer:', pointer);
        lastMousePosRef.current = pointer;
        setIsDrawingSection(true);
        setPreviewSection({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
        console.log('🎯 [CanvasEventHandler] SECTION MOUSEDOWN - drawing state set');
    }
  }

  function handleSectionMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
      if (!isDrawingSection || !lastMousePosRef.current) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (pointer) {
          const newWidth = pointer.x - lastMousePosRef.current.x;
          const newHeight = pointer.y - lastMousePosRef.current.y;
          setPreviewSection({
              x: lastMousePosRef.current.x,
              y: lastMousePosRef.current.y,
              width: newWidth,
              height: newHeight,
          });
      }
  }

  function handleSectionMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
      console.log('🎯 [CanvasEventHandler] SECTION MOUSEUP - starting section completion');
      if (!isDrawingSection || !previewSection) {
          console.log('🎯 [CanvasEventHandler] SECTION MOUSEUP - not drawing or no preview, aborting');
          return;
      }

      // Prevent creating tiny sections
      if (Math.abs(previewSection.width) < 10 || Math.abs(previewSection.height) < 10) {
          console.log('🎯 [CanvasEventHandler] SECTION MOUSEUP - section too small, aborting');
          setIsDrawingSection(false);
          setPreviewSection(null);
          isPointerDownRef.current = false;
          lastMousePosRef.current = null;
          return;
      }

      const newSection = {
          x: previewSection.width > 0 ? previewSection.x : previewSection.x + previewSection.width,
          y: previewSection.height > 0 ? previewSection.y : previewSection.y + previewSection.height,
          width: Math.abs(previewSection.width),
          height: Math.abs(previewSection.height),
          title: 'New Section',
          backgroundColor: 'rgba(243, 244, 246, 0.7)',
          borderColor: '#D1D5DB',
          borderWidth: 1,
      };

      console.log('🎯 [CanvasEventHandler] SECTION MOUSEUP - creating section with:', newSection);
      console.log('🎯 [CanvasEventHandler] SECTION MOUSEUP - createSection function available:', typeof createSection);
      console.log('🎯 [CanvasEventHandler] SECTION MOUSEUP - captureElementsAfterSectionCreation function available:', typeof captureElementsAfterSectionCreation);

      try {
          const sectionId = createSection(newSection.x, newSection.y, newSection.width, newSection.height, newSection.title);
          console.log('🎯 [CanvasEventHandler] SECTION MOUSEUP - section created with ID:', sectionId);
          
          // FigJam-like behavior: automatically capture existing elements within the section bounds
          if (captureElementsAfterSectionCreation) {
              console.log('🎯 [CanvasEventHandler] SECTION MOUSEUP - capturing elements after creation');
              captureElementsAfterSectionCreation(sectionId);
          } else {
              console.error('🎯 [CanvasEventHandler] SECTION MOUSEUP - captureElementsAfterSectionCreation not available');
          }

          console.log('🎯 [CanvasEventHandler] SECTION MOUSEUP - section creation completed successfully');
      } catch (error) {
          console.error('🎯 [CanvasEventHandler] SECTION MOUSEUP - error during section creation:', error);
      }

      // Reset state
      console.log('🎯 [CanvasEventHandler] SECTION MOUSEUP - resetting state');
      setIsDrawingSection(false);
      setPreviewSection(null);
      isPointerDownRef.current = false;
      lastMousePosRef.current = null;
      setSelectedTool('select');
      console.log('🎯 [CanvasEventHandler] SECTION MOUSEUP - completed');
  }

  function handleStickyNoteClick(_e: Konva.KonvaEventObject<MouseEvent>) {
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
  }

  function handleImageClick(_e: Konva.KonvaEventObject<MouseEvent>) {
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
  }

  function handleTableClick(_e: Konva.KonvaEventObject<MouseEvent>) {
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
  }

  // Handle shape click for immediate creation with default size
  function handleShapeClick(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    console.log('🎨 [CanvasEventHandler] SHAPE CLICK - Creating shape with default size:', currentTool);
    logger.log('🎨 [CanvasEventHandler] Creating shape with default size:', currentTool);
    
    const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let newElement: any = null;
    
    switch (currentTool) {
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
  }

  function handlePenClick(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Pen drawing is handled by mousedown/mouseup, click is just for cleanup
    // This prevents the "No handler found" message
  }

  function handleConnectorClick(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Connector creation is handled by mousedown/mouseup, click is just for cleanup
    // This prevents the "No handler found" message
  }

  function handleSectionClick(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Section creation is handled by mousedown/mouseup, click is just for cleanup
    // This prevents the "No handler found" message
  }

  // Missing handlers for sticky-note tool
  function handleStickyNoteMouseDown(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Sticky note uses click for creation, these are just for event handling consistency
  }

  function handleStickyNoteMouseMove(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Sticky note uses click for creation, these are just for event handling consistency
  }

  function handleStickyNoteMouseUp(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Sticky note uses click for creation, these are just for event handling consistency
  }

  // Missing handlers for image tool
  function handleImageMouseDown(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Image uses click for creation, these are just for event handling consistency
  }

  function handleImageMouseMove(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Image uses click for creation, these are just for event handling consistency
  }

  function handleImageMouseUp(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Image uses click for creation, these are just for event handling consistency
  }

  // Missing handlers for table tool
  function handleTableMouseDown(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Table uses click for creation, these are just for event handling consistency
  }

  function handleTableMouseMove(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Table uses click for creation, these are just for event handling consistency
  }

  function handleTableMouseUp(_e: Konva.KonvaEventObject<MouseEvent>) {
    // Table uses click for creation, these are just for event handling consistency
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    // TODO: Implement zoom functionality with viewport store methods
    // For now, just prevent the default scroll behavior
  }

  // Set up event delegation
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Generic handler that dispatches to the correct tool-specific logic
    const handleEvent = (e: Konva.KonvaEventObject<any>) => {
      console.log('🎯 [CanvasEventHandler] Event received:', e.type, 'currentTool:', currentTool);
      logger.log('🎯 [CanvasEventHandler] Event received:', e.type, 'currentTool:', currentTool);
      const handler = toolHandlers.get(e.type);
      if (handler) {
        console.log('🎯 [CanvasEventHandler] Handler found for:', e.type, 'executing...');
        logger.log('🎯 [CanvasEventHandler] Handler found for:', e.type, 'executing...');
        // Use requestAnimationFrame for expensive mousemove events
        if (e.type === 'mousemove') {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(() => handler(e));
        } else {
          handler(e);
        }
      } else {
        console.log('🚫 [CanvasEventHandler] No handler found for:', e.type, 'currentTool:', currentTool);
        logger.log('🚫 [CanvasEventHandler] No handler found for:', e.type, 'currentTool:', currentTool);
      }
    };

    // Attach all event listeners
    const eventTypes = ['mousedown', 'mousemove', 'mouseup', 'click', 'wheel'];
    eventTypes.forEach(eventType => {
      stage.on(eventType, handleEvent);
    });

    // Cleanup function
    return () => {
      eventTypes.forEach(eventType => {
        stage.off(eventType, handleEvent);
      });
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stageRef, toolHandlers]);

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
