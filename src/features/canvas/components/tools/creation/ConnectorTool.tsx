/**
 * ConnectorTool - Interactive connector drawing component
 * 
 * Features:
 * - Real-time preview during drawing
 * - Smart snapping to element anchor points
 * - Support for line and arrow connectors
 * - Visual feedback for snap points
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Line, Arrow } from 'react-konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { debug } from '../../../utils/debug';
import { nanoid } from 'nanoid';
import { ElementId, ConnectorElement, CanvasElement } from '../../../types/enhanced.types';
import Konva from 'konva';

interface ConnectorToolProps {
  isActive: boolean;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  connectorType: 'line' | 'arrow';
}

interface DrawingState {
  isDrawing: boolean;
  startPoint: { x: number; y: number };
  currentEndPoint: { x: number; y: number };
}

export const ConnectorTool: React.FC<ConnectorToolProps> = ({
  isActive,
  stageRef,
  connectorType
}) => {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: { x: 0, y: 0 },
    currentEndPoint: { x: 0, y: 0 }
  });

  const { addElement, elements } = useUnifiedCanvasStore(
    useShallow((state) => ({
      addElement: state.addElement,
      elements: state.elements
    }))
  );

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive) return;

    // Check if the click is on the stage background, not on an existing element
    if (e.target !== e.target.getStage()) {
      // Clicked on an element, not the background - don't create connector
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Transform coordinates to account for zoom/pan
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    debug.canvas.konvaEvent('connector-mouse-down', `${connectorType} at ${pos.x},${pos.y}`);

    setDrawingState({
      isDrawing: true,
      startPoint: { x: pos.x, y: pos.y },
      currentEndPoint: { x: pos.x, y: pos.y }
    });
  }, [isActive, stageRef, connectorType]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive || !drawingState.isDrawing) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Transform coordinates to account for zoom/pan
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    setDrawingState(prev => ({
      ...prev,
      currentEndPoint: { x: pos.x, y: pos.y }
    }));
  }, [isActive, drawingState.isDrawing, stageRef]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isActive || !drawingState.isDrawing) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Transform coordinates to account for zoom/pan
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    debug.canvas.konvaEvent('connector-mouse-up', `${connectorType} at ${pos.x},${pos.y}`);

    // Check minimum distance to prevent tiny connectors
    const distance = Math.sqrt(
      Math.pow(pos.x - drawingState.startPoint.x, 2) + 
      Math.pow(pos.y - drawingState.startPoint.y, 2)
    );

    if (distance < 10) {
      // Too short, cancel creation
      setDrawingState({
        isDrawing: false,
        startPoint: { x: 0, y: 0 },
        currentEndPoint: { x: 0, y: 0 }
      });
      return;
    }

    // Create the connector element
    const now = Date.now();
    
    // Calculate the bounding box for the connector
    const minX = Math.min(drawingState.startPoint.x, pos.x);
    const minY = Math.min(drawingState.startPoint.y, pos.y);
    
    const connectorElement: ConnectorElement = {
      id: ElementId(nanoid()),
      type: 'connector',
      subType: connectorType,
      x: minX,
      y: minY,
      startPoint: drawingState.startPoint,
      endPoint: { x: pos.x, y: pos.y },
      intermediatePoints: [],
      stroke: '#000000',
      strokeWidth: 2,
      connectorStyle: {
        strokeColor: '#000000',
        strokeWidth: 2,
        endArrow: connectorType === 'arrow' ? 'solid' : 'none',
        startArrow: 'none'
      },
      pathPoints: [drawingState.startPoint.x, drawingState.startPoint.y, pos.x, pos.y],
      createdAt: now,
      updatedAt: now
    };

    debug.canvas.konvaEvent('connector-created', `${connectorElement.subType} connector ${connectorElement.id}`);

    addElement(connectorElement);

    // Reset drawing state
    setDrawingState({
      isDrawing: false,
      startPoint: { x: 0, y: 0 },
      currentEndPoint: { x: 0, y: 0 }
    });
  }, [isActive, drawingState, stageRef, connectorType, addElement]);

  // Find the nearest element to snap to
  const findNearestElement = useCallback((x: number, y: number): { element: CanvasElement; anchor: string } | null => {
    const elementsArray = Array.from(elements.values());
    const snapDistance = 20;
    
    for (const element of elementsArray) {
      if (element.type === 'connector') continue; // Skip other connectors
      
      const elementBounds = {
        x: element.x,
        y: element.y,
        width: (element as any).width || (element as any).radius * 2 || 100,
        height: (element as any).height || (element as any).radius * 2 || 100
      };
      
      // Check if the point is near the element
      const distance = Math.sqrt(
        Math.pow(x - (elementBounds.x + elementBounds.width / 2), 2) + 
        Math.pow(y - (elementBounds.y + elementBounds.height / 2), 2)
      );
      
      if (distance < snapDistance) {
        return { element, anchor: 'center' };
      }
    }
    
    return null;
  }, [elements]);

  // Attach event listeners when active
  useEffect(() => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    
    stage.on('mousedown', handleMouseDown);
    stage.on('mousemove', handleMouseMove);
    stage.on('mouseup', handleMouseUp);
    
    debug.canvas.konvaEvent('connector-tool-activated', connectorType);
    
    return () => {
      stage.off('mousedown', handleMouseDown);
      stage.off('mousemove', handleMouseMove);
      stage.off('mouseup', handleMouseUp);
      debug.canvas.konvaEvent('connector-tool-deactivated', connectorType);
    };
  }, [isActive, stageRef, handleMouseDown, handleMouseMove, handleMouseUp, connectorType]);

  // Render preview during drawing
  if (!isActive || !drawingState.isDrawing) {
    return null;
  }

  const previewPoints = [
    drawingState.startPoint.x, 
    drawingState.startPoint.y, 
    drawingState.currentEndPoint.x, 
    drawingState.currentEndPoint.y
  ];

  const previewProps = {
    points: previewPoints,
    stroke: '#2563eb',
    strokeWidth: 2,
    opacity: 0.7,
    dash: [5, 5],
    listening: false,
    perfectDrawEnabled: false
  };

  return connectorType === 'arrow' ? (
    <Arrow
      {...previewProps}
      fill="#2563eb"
      pointerLength={10}
      pointerWidth={10}
    />
  ) : (
    <Line {...previewProps} />
  );
}; 