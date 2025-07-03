/**
 * ConnectorTool - Interactive connector drawing component
 * 
 * Features:
 * - Real-time preview during drawing
 * - Smart snapping to element anchor points
 * - Support for line and arrow connectors
 * - Visual feedback for snap points
 */

import React, { useState, useCallback, useEffect } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import { Stage } from 'konva/lib/Stage';
import { Line, Arrow, Circle } from 'react-konva';
import { useUnifiedCanvasStore, canvasSelectors } from '../../../stores/unifiedCanvasStore';
import { debug } from '../../../utils/debug';
import type { CanvasElement, ConnectorElement, ConnectorStyle } from '../../../types/enhanced.types';
import { ElementId } from '../../../types/enhanced.types';

// Connector-specific types (migrated from old types)
interface ConnectorEndpoint {
  x: number;
  y: number;
  connectedElementId?: string;
  anchorPoint?: 'center' | 'top' | 'bottom' | 'left' | 'right' | undefined;
}

interface ConnectorToolProps {
  stageRef: React.RefObject<Stage | null>;
  isActive: boolean;
  connectorType?: 'line' | 'arrow';
}

interface DrawingState {
  isDrawing: boolean;
  startPoint: ConnectorEndpoint | null;
  currentEndPoint: ConnectorEndpoint | null;
  previewElement: CanvasElement | null;
}

const SNAP_DISTANCE = 20; // Distance in pixels to snap to elements

// Utility functions for connector calculations
const getAnchorPoint = (element: CanvasElement, anchor: ConnectorEndpoint['anchorPoint']): { x: number; y: number } => {
  const { x, y } = element;
  // Use default size if width/height not available or default to reasonable bounds
  const width = ('width' in element && typeof element.width === 'number') ? element.width : 100;
  const height = ('height' in element && typeof element.height === 'number') ? element.height : 100;
  
  switch (anchor) {
    case 'top':
      return { x: x + width / 2, y };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'center':
    default:
      return { x: x + width / 2, y: y + height / 2 };
  }
};

const calculateConnectorPath = (start: ConnectorEndpoint, end: ConnectorEndpoint): number[] => {
  // Simple straight line for now - can be enhanced with curve logic
  return [start.x, start.y, end.x, end.y];
};

const generateId = () => {
  return 'connector_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * ConnectorTool - Interactive connector drawing component
 * 
 * Features:
 * - Real-time preview during drawing
 * - Smart snapping to element anchor points
 * - Support for line and arrow connectors
 * - Visual feedback for snap points
 */
export const ConnectorTool: React.FC<ConnectorToolProps> = ({
  stageRef,
  isActive,
  connectorType = 'line'
}) => {
  // Unified store selectors
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const elements = useUnifiedCanvasStore(canvasSelectors.elements);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  const findStickyNoteAtPoint = useUnifiedCanvasStore(state => state.findStickyNoteAtPoint);
  const addElementToStickyNote = useUnifiedCanvasStore(state => state.addElementToStickyNote);
  
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentEndPoint: null,
    previewElement: null
  });

  // Find the nearest element to snap to
  const findNearestElement = useCallback((x: number, y: number): { element: CanvasElement; anchor: ConnectorEndpoint['anchorPoint'] } | null => {
    const elementsArray = Object.values(elements);
    
    for (const element of elementsArray) {
      if (element.type === 'connector') continue; // Don't snap to other connectors
      
      // Calculate potential anchor points
      const anchors: ConnectorEndpoint['anchorPoint'][] = ['center', 'top', 'bottom', 'left', 'right'];
      
      for (const anchor of anchors) {
        const anchorPoint = getAnchorPoint(element, anchor);
        const distance = Math.sqrt(
          Math.pow(x - anchorPoint.x, 2) + Math.pow(y - anchorPoint.y, 2)
        );
        
        if (distance <= SNAP_DISTANCE) {
          debug.canvas.konvaEvent('connector-snap', element.id, { anchor, distance });
          return { element, anchor };
        }
      }
    }
    
    return null;
  }, [elements]);
  
  // Handle mouse down - start drawing
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isActive) return;
    
    // Prevent other handlers from interfering
    e.cancelBubble = true;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    // Only handle if clicking on the stage background (not on an existing element)
    if (e.target !== stage) return;
    
    // Get pointer position relative to the stage (accounting for stage transform)
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Transform screen coordinates to stage coordinates
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const stagePos = transform.point(pos);
    
    // Check if we're snapping to an element
    const snapTarget = findNearestElement(stagePos.x, stagePos.y);
    
    const startPoint: ConnectorEndpoint = snapTarget
      ? {
          x: getAnchorPoint(snapTarget.element, snapTarget.anchor).x,
          y: getAnchorPoint(snapTarget.element, snapTarget.anchor).y,
          connectedElementId: snapTarget.element.id,
          anchorPoint: snapTarget.anchor
        }
      : { x: stagePos.x, y: stagePos.y, anchorPoint: undefined };
    
    debug.canvas.elementOperation('connector-start', 'new', startPoint);
    console.log('🔗 [ConnectorTool] Starting connector draw at:', startPoint);
    
    setDrawingState({
      isDrawing: true,
      startPoint,
      currentEndPoint: { x: stagePos.x, y: stagePos.y },
      previewElement: null
    });
  }, [isActive, stageRef, findNearestElement]);
  
  // Handle mouse move - update preview
  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isActive || !drawingState.isDrawing || !drawingState.startPoint) return;
    
    // Prevent other handlers from interfering during drawing
    e.cancelBubble = true;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    // Get pointer position relative to the stage (accounting for stage transform)
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Transform screen coordinates to stage coordinates
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const stagePos = transform.point(pos);
    
    // Check if we're snapping to an element
    const snapTarget = findNearestElement(stagePos.x, stagePos.y);
    
    const endPoint: ConnectorEndpoint = snapTarget
      ? {
          x: getAnchorPoint(snapTarget.element, snapTarget.anchor).x,
          y: getAnchorPoint(snapTarget.element, snapTarget.anchor).y,
          connectedElementId: snapTarget.element.id,
          anchorPoint: snapTarget.anchor
        }
      : { x: stagePos.x, y: stagePos.y, anchorPoint: undefined };
    
    setDrawingState(prev => ({
      ...prev,
      currentEndPoint: endPoint
    }));
  }, [isActive, drawingState.isDrawing, drawingState.startPoint, stageRef, findNearestElement]);

  // Handle mouse up - finish drawing
  const handleMouseUp = useCallback(() => {
    if (!isActive || !drawingState.isDrawing || !drawingState.startPoint || !drawingState.currentEndPoint) return;
    
    // Calculate the distance between start and end points
    const distance = Math.sqrt(
      Math.pow(drawingState.currentEndPoint.x - drawingState.startPoint.x, 2) + 
      Math.pow(drawingState.currentEndPoint.y - drawingState.startPoint.y, 2)
    );
    
    // Minimum distance threshold to prevent accidental tiny connectors
    const MIN_CONNECTOR_DISTANCE = 10;
    
    if (distance < MIN_CONNECTOR_DISTANCE) {
      // If the user just clicked without dragging, don't create a connector
      console.log('🔗 [ConnectorTool] Connector too short, canceling creation. Distance:', distance);
      
      // Reset drawing state without creating connector
      setDrawingState({
        isDrawing: false,
        startPoint: null,
        currentEndPoint: null,
        previewElement: null
      });
      return;
    }
    
    // Create the connector element
    const connectorStyle: ConnectorStyle = {
      strokeColor: '#1E293B',
      strokeWidth: 2,
      startArrow: 'none',
      endArrow: connectorType === 'arrow' ? 'solid' : 'none',
      arrowSize: 10
    };
    
    const pathPoints = calculateConnectorPath(drawingState.startPoint, drawingState.currentEndPoint);
    
    const now = Date.now();
    const connectorElement: ConnectorElement = {
      id: ElementId(generateId()),
      type: 'connector',
      subType: connectorType,
      x: 0, // Connectors use absolute coordinates in pathPoints
      y: 0,
      startPoint: drawingState.startPoint,
      endPoint: drawingState.currentEndPoint,
      connectorStyle,
      pathPoints,
      createdAt: now,
      updatedAt: now
    };
    
    debug.canvas.elementOperation('connector-create', connectorElement.id, {
      type: connectorType,
      hasConnections: !!(drawingState.startPoint.connectedElementId || drawingState.currentEndPoint.connectedElementId),
      distance: distance
    });

    addElement(connectorElement);
    
    // Check if the connector was created within a sticky note container
    const midPoint = {
      x: (drawingState.startPoint.x + drawingState.currentEndPoint.x) / 2,
      y: (drawingState.startPoint.y + drawingState.currentEndPoint.y) / 2
    };
    const stickyNoteId = findStickyNoteAtPoint(midPoint);
    
    if (stickyNoteId) {
      console.log('🔗 [ConnectorTool] Adding connector to sticky note container:', stickyNoteId);
      addElementToStickyNote(connectorElement.id, stickyNoteId);
    }
    
    // Reset drawing state
    setDrawingState({
      isDrawing: false,
      startPoint: null,
      currentEndPoint: null,
      previewElement: null
    });
    
    // Don't auto-switch back to select tool - keep the connector tool active
    // This matches the behavior the user expects
    console.log('🔗 [ConnectorTool] Connector created successfully, keeping tool active');
  }, [isActive, drawingState, connectorType, addElement, addElementToStickyNote, findStickyNoteAtPoint]);

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

  // Render real-time preview during drawing
  if (!isActive || !drawingState.isDrawing || !drawingState.startPoint || !drawingState.currentEndPoint) {
    return null;
  }

  // Calculate preview path
  const previewPath = calculateConnectorPath(drawingState.startPoint, drawingState.currentEndPoint);
  
  // Render snap indicators
  const snapIndicators = [];
  
  // Show snap indicator for start point if connected
  if (drawingState.startPoint.connectedElementId) {
    snapIndicators.push(
      <Circle
        key="start-snap"
        x={drawingState.startPoint.x}
        y={drawingState.startPoint.y}
        radius={4}
        fill="#3B82F6"
        stroke="#1E40AF"
        strokeWidth={2}
        opacity={0.8}
      />
    );
  }
  
  // Show snap indicator for end point if connected
  if (drawingState.currentEndPoint.connectedElementId) {
    snapIndicators.push(
      <Circle
        key="end-snap"
        x={drawingState.currentEndPoint.x}
        y={drawingState.currentEndPoint.y}
        radius={4}
        fill="#3B82F6"
        stroke="#1E40AF"
        strokeWidth={2}
        opacity={0.8}
      />
    );
  }
  
  // Render preview connector
  const previewConnector = connectorType === 'arrow' ? (
    <Arrow
      points={previewPath}
      stroke="#3B82F6"
      strokeWidth={2}
      fill="#3B82F6"
      pointerLength={10}
      pointerWidth={10}
      opacity={0.7}
      dash={[5, 5]}
      listening={false}
    />
  ) : (
    <Line
      points={previewPath}
      stroke="#3B82F6"
      strokeWidth={2}
      opacity={0.7}
      dash={[5, 5]}
      listening={false}
    />
  );
  
  return (
    <>
      {previewConnector}
      {snapIndicators}
    </>
  );
}; 