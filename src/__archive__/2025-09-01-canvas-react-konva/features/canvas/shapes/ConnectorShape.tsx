/**
 * ConnectorShape - Full-featured connector element for main canvas rendering
 * 
 * This component integrates with the general element system and provides:
 * - Full transformation support via Konva Transformer
 * - Integration with the unified element system
 * - Complex interaction handling for general use
 * 
 * For optimized connector-only rendering, see components/ConnectorShape.tsx
 */
import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Group, Line, Arrow, Circle, Transformer } from 'react-konva';
import Konva from 'konva';
import { ConnectorElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';

interface ConnectorShapeProps {
  element: ConnectorElement;
  isSelected: boolean;
  konvaProps: Partial<Konva.LineConfig>;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onSelect: () => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null>;
}

export const ConnectorShape: React.FC<ConnectorShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
  onUpdate,
  onSelect,
  stageRef
}) => {
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  
  const groupRef = useRef<Konva.Group>(null);
  const lineRef = useRef<Konva.Line | null>(null);
  const arrowRef = useRef<Konva.Arrow | null>(null);
  const startHandleRef = useRef<Konva.Circle>(null);
  const endHandleRef = useRef<Konva.Circle>(null);
  
  // State for tracking drag operations to prevent excessive updates
  const [isDraggingEndpoint, setIsDraggingEndpoint] = useState(false);
  const [tempStartPoint, setTempStartPoint] = useState(element.startPoint);
  const [tempEndPoint, setTempEndPoint] = useState(element.endPoint);
  
  // Calculate points for rendering - relative to group position
  const points = useMemo(() => {
    // Use temporary points during dragging for smooth updates
    const startPoint = isDraggingEndpoint ? tempStartPoint : element.startPoint;
    const endPoint = isDraggingEndpoint ? tempEndPoint : element.endPoint;
    
    // Make points relative to the element position
    const relativeStartX = startPoint.x - element.x;
    const relativeStartY = startPoint.y - element.y;
    const relativeEndX = endPoint.x - element.x;
    const relativeEndY = endPoint.y - element.y;
    
    return [relativeStartX, relativeStartY, relativeEndX, relativeEndY];
  }, [element.x, element.y, element.startPoint, element.endPoint, isDraggingEndpoint, tempStartPoint, tempEndPoint]);
  
  // Determine if this is an arrow connector
  const isArrow = useMemo(() => {
    return element.subType === 'arrow' || 
           element.connectorStyle?.endArrow === 'solid' || 
           element.connectorStyle?.endArrow === 'triangle';
  }, [element.subType, element.connectorStyle?.endArrow]);
  
  // Handle selection
  const handleSelect = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect();
  }, [onSelect]);
  
  // Handle drag end for the main connector
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<any>) => {
    const group = groupRef.current;
    if (!group) return;
    
    const newX = group.x();
    const newY = group.y();
    
    // Calculate the offset from the original position
    const deltaX = newX - element.x;
    const deltaY = newY - element.y;
    
    // Update start and end points
    const newStartPoint = {
      x: element.startPoint.x + deltaX,
      y: element.startPoint.y + deltaY
    };
    const newEndPoint = {
      x: element.endPoint.x + deltaX,
      y: element.endPoint.y + deltaY
    };
    
    // Update pathPoints
    const newPathPoints = [newStartPoint.x, newStartPoint.y, newEndPoint.x, newEndPoint.y];
    
    // Update both the element position and the connector endpoints
    onUpdate(element.id, {
      x: newX,
      y: newY,
      startPoint: newStartPoint,
      endPoint: newEndPoint,
      pathPoints: newPathPoints,
      updatedAt: Date.now()
    });
  }, [element, onUpdate]);
  
  // Handle endpoint drag start - initialize temp state
  const handleEndpointDragStart = useCallback((isStart: boolean) => (e: Konva.KonvaEventObject<any>) => {
    e.cancelBubble = true;
    setIsDraggingEndpoint(true);
    setTempStartPoint(element.startPoint);
    setTempEndPoint(element.endPoint);
    onSelect(); // Ensure connector stays selected
  }, [element.startPoint, element.endPoint, onSelect]);
  
  // Handle endpoint drag move - update temp state only (no store updates)
  const handleEndpointDragMove = useCallback((isStart: boolean) => (e: Konva.KonvaEventObject<any>) => {
    e.cancelBubble = true;
    
    const handle = isStart ? startHandleRef.current : endHandleRef.current;
    if (!handle || !groupRef.current) return;
    
    // Get the absolute position of the handle
    const absPos = handle.getAbsolutePosition();
    
    // Update temporary points for smooth visual feedback
    if (isStart) {
      setTempStartPoint(absPos);
    } else {
      setTempEndPoint(absPos);
    }
  }, []);
  
  // Handle endpoint drag end - commit changes to store
  const handleEndpointDragEnd = useCallback((isStart: boolean) => (e: Konva.KonvaEventObject<any>) => {
    e.cancelBubble = true;
    
    const handle = isStart ? startHandleRef.current : endHandleRef.current;
    if (!handle || !groupRef.current) return;
    
    // Get the final absolute position of the handle
    const absPos = handle.getAbsolutePosition();
    
    // Calculate new start and end points
    const newStartPoint = isStart ? absPos : tempStartPoint;
    const newEndPoint = isStart ? tempEndPoint : absPos;
    
    // Recalculate the bounding box position (element.x, element.y)
    const minX = Math.min(newStartPoint.x, newEndPoint.x);
    const minY = Math.min(newStartPoint.y, newEndPoint.y);
    
    // Update pathPoints for straight connectors
    const newPathPoints = [newStartPoint.x, newStartPoint.y, newEndPoint.x, newEndPoint.y];
    
    // Commit final changes to store
    onUpdate(element.id, {
      x: minX,
      y: minY,
      startPoint: newStartPoint,
      endPoint: newEndPoint,
      pathPoints: newPathPoints,
      updatedAt: Date.now()
    });
    
    // Reset drag state
    setIsDraggingEndpoint(false);
  }, [element.id, tempStartPoint, tempEndPoint, onUpdate]);
  
  // Handle endpoint mousedown to prevent tool from creating new connectors
  const handleEndpointMouseDown = useCallback((e: Konva.KonvaEventObject<any>) => {
    e.cancelBubble = true;
    // Ensure the connector stays selected
    onSelect();
  }, [onSelect]);
  
  // Calculate stroke properties
  const strokeProps = useMemo(() => ({
    stroke: element.stroke || element.connectorStyle?.strokeColor || '#000000',
    strokeWidth: element.strokeWidth || element.connectorStyle?.strokeWidth || 2,
    dash: element.connectorStyle?.strokeDashArray || undefined,
    lineCap: 'round' as const,
    lineJoin: 'round' as const
  }), [element.stroke, element.strokeWidth, element.connectorStyle]);
  
  // Handle drawing tools - connector tool should NOT disable connector interaction
  const shouldAllowDrawing = ['pen', 'marker', 'highlighter', 'eraser'].includes(selectedTool);
  const isConnectorToolActive = selectedTool === 'connector-line' || selectedTool === 'connector-arrow';
  const allowConnectorInteraction = selectedTool === 'select' || isConnectorToolActive;
  
  // Calculate handle positions - using temp points during dragging for better alignment
  const startHandlePosition = useMemo(() => {
    const startPoint = isDraggingEndpoint ? tempStartPoint : element.startPoint;
    return {
      x: startPoint.x - element.x,
      y: startPoint.y - element.y
    };
  }, [element.x, element.y, element.startPoint, isDraggingEndpoint, tempStartPoint]);
  
  const endHandlePosition = useMemo(() => {
    const endPoint = isDraggingEndpoint ? tempEndPoint : element.endPoint;
    return {
      x: endPoint.x - element.x,
      y: endPoint.y - element.y
    };
  }, [element.x, element.y, element.endPoint, isDraggingEndpoint, tempEndPoint]);
  
  return (
    <Group
      {...konvaProps}
      ref={groupRef}
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={element.rotation || 0}
      onClick={handleSelect}
      onTap={handleSelect}
      onDragStart={handleSelect}
      draggable={allowConnectorInteraction && isSelected}
      listening={allowConnectorInteraction}
      onDragEnd={handleDragEnd}
    >
      {isArrow ? (
        <Arrow
          ref={arrowRef}
          points={points}
          fill={strokeProps.stroke}
          {...strokeProps}
          hitStrokeWidth={Math.max(strokeProps.strokeWidth * 4, 15)} // Larger hit area
          perfectDrawEnabled={false}
          listening={allowConnectorInteraction}
        />
      ) : (
        <Line
          ref={lineRef}
          points={points}
          {...strokeProps}
          hitStrokeWidth={Math.max(strokeProps.strokeWidth * 4, 15)} // Larger hit area
          perfectDrawEnabled={false}
          listening={allowConnectorInteraction}
        />
      )}
      
      {/* Endpoint handles for precise editing - positioned relative to group */}
      {isSelected && allowConnectorInteraction && (
        <>
          <Circle
            ref={startHandleRef}
            x={startHandlePosition.x}
            y={startHandlePosition.y}
            radius={8}
            fill="#0066ff"
            stroke="#ffffff"
            strokeWidth={2}
            draggable
            onMouseDown={handleEndpointMouseDown}
            onPointerDown={handleEndpointMouseDown}
            onDragStart={handleEndpointDragStart(true)}
            onDragMove={handleEndpointDragMove(true)}
            onDragEnd={handleEndpointDragEnd(true)}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={4}
            shadowOffsetY={2}
            cursor="move"
            listening={true}
            perfectDrawEnabled={false}
          />
          <Circle
            ref={endHandleRef}
            x={endHandlePosition.x}
            y={endHandlePosition.y}
            radius={8}
            fill="#0066ff"
            stroke="#ffffff"
            strokeWidth={2}
            draggable
            onMouseDown={handleEndpointMouseDown}
            onPointerDown={handleEndpointMouseDown}
            onDragStart={handleEndpointDragStart(false)}
            onDragMove={handleEndpointDragMove(false)}
            onDragEnd={handleEndpointDragEnd(false)}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={4}
            shadowOffsetY={2}
            cursor="move"
            listening={true}
            perfectDrawEnabled={false}
          />
          {/* Visual selection indicator - blue outline */}
          {isArrow ? (
            <Arrow
              points={points}
              stroke="#0066ff"
              strokeWidth={strokeProps.strokeWidth + 4}
              opacity={0.3}
              listening={false}
              perfectDrawEnabled={false}
              fill="transparent"
              dash={[]}
            />
          ) : (
            <Line
              points={points}
              stroke="#0066ff"
              strokeWidth={strokeProps.strokeWidth + 4}
              opacity={0.3}
              listening={false}
              perfectDrawEnabled={false}
              dash={[]}
            />
          )}
        </>
      )}
    </Group>
  );
});

ConnectorShape.displayName = 'ConnectorShape'; 
// Archived (2025-09-01): Legacy react-konva connector shape.
