/**
 * CanvasEventHandler - Centralized Event Delegation System
 * Part of LibreOllama Canvas Refactoring - Phase 3
 * 
 * This component centralizes all canvas interactions using the event delegation pattern.
 * A single listener per event type is attached to the stage, dramatically reducing overhead.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import Konva from 'konva';
import { CanvasTool } from '../types/enhanced.types';
import { useCanvasStore } from '../stores/canvasStore.enhanced';

interface CanvasEventHandlerProps {
  stageRef: React.RefObject<Konva.Stage>;
  currentTool: CanvasTool;
  children: React.ReactNode;
}

type EventHandler = (e: Konva.KonvaEventObject<any>) => void;

export const CanvasEventHandler: React.FC<CanvasEventHandlerProps> = ({
  stageRef,
  currentTool,
  children
}) => {
  const isPointerDownRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Access canvas store for drawing functions
  const { startDrawing, updateDrawing, finishDrawing, addElement, selectElement, setSelectedTool } = useCanvasStore();

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
        break;

      case 'pen':
        map.set('mousedown', handlePenMouseDown);
        map.set('mousemove', handlePenMouseMove);
        map.set('mouseup', handlePenMouseUp);
        break;

      case 'line':
      case 'connector':
        map.set('mousedown', handleConnectorMouseDown);
        map.set('mousemove', handleConnectorMouseMove);
        map.set('mouseup', handleConnectorMouseUp);
        break;

      case 'section':
        map.set('mousedown', handleSectionMouseDown);
        map.set('mousemove', handleSectionMouseMove);
        map.set('mouseup', handleSectionMouseUp);
        break;

      case 'sticky-note':
        map.set('click', handleStickyNoteClick);
        break;

      case 'image':
        map.set('click', handleImageClick);
        break;

      case 'table':
        map.set('click', handleTableClick);
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
      // Clicked on empty canvas - start selection box or clear selection
      dispatchCanvasEvent('selection:start', { position: pointer });
    } else {
      // Clicked on an element
      const elementId = target.id();
      if (elementId) {
        dispatchCanvasEvent('element:select', { elementId, shiftKey: e.evt.shiftKey });
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
        // Selection box drag
        dispatchCanvasEvent('selection:drag', { 
          start: lastMousePosRef.current!, 
          current: pointer 
        });
      } else {
        // Element drag
        const elementId = e.target.id();
        if (elementId) {
          dispatchCanvasEvent('element:drag', { elementId, delta, pointer });
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
      dispatchCanvasEvent('selection:end', { position: pointer });
    } else {
      const elementId = e.target.id();
      if (elementId) {
        dispatchCanvasEvent('element:dragEnd', { elementId, position: pointer });
      }
    }
  }

  function handleSelectClick(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    if (e.target === stage) {
      dispatchCanvasEvent('canvas:click', { position: pointer });
    }
  }

  function handlePanMouseDown(_e: Konva.KonvaEventObject<MouseEvent>) {
    isPointerDownRef.current = true;
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (pointer) {
      lastMousePosRef.current = pointer;
      dispatchCanvasEvent('pan:start', { position: pointer });
    }
  }
  function handlePanMouseMove(_e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isPointerDownRef.current || !lastMousePosRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Throttle pan events
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const delta = {
        x: pointer.x - lastMousePosRef.current!.x,
        y: pointer.y - lastMousePosRef.current!.y
      };

      dispatchCanvasEvent('pan:drag', { delta });
      lastMousePosRef.current = pointer;
    });
  }

  function handlePanMouseUp() {
    isPointerDownRef.current = false;
    lastMousePosRef.current = null;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    dispatchCanvasEvent('pan:end', {});
  }

  function handleTextClick(_e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    console.log('📝 [CanvasEventHandler] Creating text at:', pointer);
    
    const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newText = {
      id: generateId(),
      type: 'text' as const,
      x: pointer.x,
      y: pointer.y,
      text: 'Double-click to edit',
      fontSize: 16,
      fontFamily: 'Inter, sans-serif',
      fill: '#1F2937',
      width: 200,
      height: 24
    };
    
    console.log('📝 [CanvasEventHandler] Creating text element:', newText);
    addElement(newText);
    selectElement(newText.id);
    setSelectedTool('select');
  }

  function handleShapeMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target !== stageRef.current) return;

    isPointerDownRef.current = true;
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (pointer) {
      lastMousePosRef.current = pointer;
      console.log('🎯 [CanvasEventHandler] Starting shape creation:', currentTool, 'at:', pointer);
      
      // Create the shape immediately (click-to-place)
      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let newElement: any = null;
      
      switch (currentTool) {
        case 'rectangle':
          newElement = {
            id: generateId(),
            type: 'rectangle' as const,
            x: pointer.x,
            y: pointer.y,
            width: 100,
            height: 80,
            fill: '#C7D2FE',
            stroke: '#6366F1',
            strokeWidth: 2
          };
          break;
          
        case 'circle':
          newElement = {
            id: generateId(),
            type: 'circle' as const,
            x: pointer.x,
            y: pointer.y,
            radius: 50,
            fill: '#FED7D7',
            stroke: '#E53E3E',
            strokeWidth: 2
          };
          break;
          
        case 'triangle':
          newElement = {
            id: generateId(),
            type: 'triangle' as const,
            x: pointer.x,
            y: pointer.y,
            points: [0, 60, 50, 0, 100, 60],
            fill: '#BBF7D0',
            stroke: '#10B981',
            strokeWidth: 2,
            closed: true
          };
          break;
          
        case 'star':
          newElement = {
            id: generateId(),
            type: 'star' as const,
            x: pointer.x,
            y: pointer.y,
            numPoints: 5,
            innerRadius: 30,
            radius: 60,
            fill: '#E1BEE7',
            stroke: '#9C27B0',
            strokeWidth: 2
          };
          break;
      }
      
      if (newElement) {
        console.log('🎯 [CanvasEventHandler] Creating element:', newElement);
        addElement(newElement);
        selectElement(newElement.id);
        setSelectedTool('select');
      }
    }
  }
  function handleShapeMouseMove(_e: Konva.KonvaEventObject<MouseEvent>) {
    // For click-to-place shapes, we don't need mouse move handling
    return;
  }

  function handleShapeMouseUp(_e: Konva.KonvaEventObject<MouseEvent>) {
    isPointerDownRef.current = false;
    lastMousePosRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function handlePenMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target !== stageRef.current) return;

    isPointerDownRef.current = true;
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (pointer) {
      console.log('🖊️ [CanvasEventHandler] Starting pen drawing at:', pointer);
      startDrawing(pointer.x, pointer.y, currentTool as 'pen' | 'pencil');
    }
  }

  function handlePenMouseMove(_e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isPointerDownRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Throttle pen drawing
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      console.log('🖊️ [CanvasEventHandler] Updating pen drawing at:', pointer);
      updateDrawing(pointer.x, pointer.y);
    });
  }

  function handlePenMouseUp() {
    isPointerDownRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    console.log('🖊️ [CanvasEventHandler] Finishing pen drawing');
    finishDrawing();
  }

  function handleConnectorMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const target = e.target;
    const elementId = target.id();

    dispatchCanvasEvent('tool:connector:start', {
      position: pointer,
      elementId: elementId || null
    });
  }

  function handleConnectorMouseMove(_e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    dispatchCanvasEvent('tool:connector:preview', { position: pointer });
  }

  function handleConnectorMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const target = e.target;
    const elementId = target.id();

    dispatchCanvasEvent('tool:connector:end', {
      position: pointer,
      elementId: elementId || null
    });
  }

  function handleSectionMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target !== stageRef.current) return;

    isPointerDownRef.current = true;
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (pointer) {
      lastMousePosRef.current = pointer;
      console.log('📦 [CanvasEventHandler] Creating section at:', pointer);
      
      // Create section immediately (click-to-place)
      const generateId = () => `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newSection = {
        id: generateId(),
        type: 'section' as const,
        x: pointer.x,
        y: pointer.y,
        width: 300,
        height: 200,
        backgroundColor: '#F9FAFB',
        borderColor: '#D1D5DB',
        borderWidth: 2,
        title: 'New Section'
      };
      
      console.log('📦 [CanvasEventHandler] Creating section element:', newSection);
      addElement(newSection);
      selectElement(newSection.id);
      setSelectedTool('select');
    }
  }

  function handleSectionMouseMove(_e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isPointerDownRef.current || !lastMousePosRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Throttle section drawing
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      dispatchCanvasEvent('tool:section:draw', {
        start: lastMousePosRef.current!,
        current: pointer
      });
    });
  }

  function handleSectionMouseUp(_e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isPointerDownRef.current || !lastMousePosRef.current) return;

    isPointerDownRef.current = false;
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (pointer) {
      dispatchCanvasEvent('tool:section:end', {
        start: lastMousePosRef.current,
        end: pointer
      });
    }

    lastMousePosRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function handleStickyNoteClick(_e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    console.log('🗒️ [CanvasEventHandler] Creating sticky note at:', pointer);
    
    const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newStickyNote = {
      id: generateId(),
      type: 'sticky-note' as const,
      x: pointer.x,
      y: pointer.y,
      width: 150,
      height: 150,
      backgroundColor: '#FEF3C7',
      text: 'Type your note here...',
      fontSize: 12,
      fontFamily: 'Inter, sans-serif',
      textColor: '#92400E'
    };
    
    console.log('🗒️ [CanvasEventHandler] Creating sticky note element:', newStickyNote);
    addElement(newStickyNote);
    selectElement(newStickyNote.id);
    setSelectedTool('select');
  }

  function handleImageClick(_e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    dispatchCanvasEvent('tool:image:create', { position: pointer });
  }

  function handleTableClick(_e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    dispatchCanvasEvent('tool:table:create', { position: pointer });
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const delta = e.evt.deltaY;
    dispatchCanvasEvent('viewport:zoom', { 
      delta, 
      pointer,
      ctrlKey: e.evt.ctrlKey 
    });
  }

  // Helper function to dispatch custom canvas events
  function dispatchCanvasEvent(eventType: string, data: any) {
    const customEvent = new CustomEvent(`canvas:${eventType}`, { 
      detail: data 
    });
    window.dispatchEvent(customEvent);
  }

  // Set up event delegation
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Generic handler that dispatches to the correct tool-specific logic
    const handleEvent = (e: Konva.KonvaEventObject<any>) => {
      const handler = toolHandlers.get(e.type);
      if (handler) {
        // Use requestAnimationFrame for expensive mousemove events
        if (e.type === 'mousemove') {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(() => handler(e));
        } else {
          handler(e);
        }
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
