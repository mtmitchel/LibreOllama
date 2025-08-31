/**
 * EdgeHandles - Overlay layer connector resize handles
 * Part of the multi-layer blueprint: Overlay handles selection UI
 */

import React from 'react';
import { Circle, Line } from 'react-konva';
import { useUnifiedCanvasStore } from '../../stores/unifiedCanvasStore';
import { ConnectorElement } from '../../types/enhanced.types';

interface EdgeHandlesProps {
  edge: ConnectorElement;
  isSelected: boolean;
}

interface HandleProps {
  x: number;
  y: number;
  role: 'source' | 'target';
  onDragStart: () => void;
  onDragMove: (pos: { x: number; y: number }) => void;
  onDragEnd: () => void;
}

const Handle: React.FC<HandleProps> = ({ x, y, role, onDragStart, onDragMove, onDragEnd }) => {
  const handleMouseEnter = React.useCallback((e: any) => {
    e.target.scale({ x: 1.2, y: 1.2 });
    const stage = e.target.getStage();
    if (stage?.container()) {
      stage.container().style.cursor = 'grab';
    }
  }, []);

  const handleMouseLeave = React.useCallback((e: any) => {
    e.target.scale({ x: 1, y: 1 });
    const stage = e.target.getStage();
    if (stage?.container()) {
      stage.container().style.cursor = '';
    }
  }, []);

  const handleMouseDown = React.useCallback((e: any) => {
    e.cancelBubble = true; // Handles don't clear selection
    onDragStart();
  }, [onDragStart]);

  const handleDragMove = React.useCallback((e: any) => {
    e.cancelBubble = true; // No bubbling to line/stage
    const { x, y } = e.target.getAbsolutePosition();
    onDragMove({ x, y });
  }, [onDragMove]);

  const handleDragEnd = React.useCallback((e: any) => {
    e.cancelBubble = true;
    onDragEnd();
  }, [onDragEnd]);

  return (
    <Circle
      x={x}
      y={y}
      radius={8} // Bigger handle
      fill="#3b82f6"
      stroke="#ffffff"
      strokeWidth={2}
      opacity={0.95}
      shadowColor="black"
      shadowBlur={4}
      shadowOffset={{ x: 1, y: 1 }}
      shadowOpacity={0.25}
      listening={true}
      draggable={true}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    />
  );
};

export const EdgeHandles: React.FC<EdgeHandlesProps> = ({ edge, isSelected }) => {
  const beginEndpointDrag = useUnifiedCanvasStore(state => state.beginEndpointDrag);
  const updateEndpointDrag = useUnifiedCanvasStore(state => state.updateEndpointDrag);
  const commitEndpointDrag = useUnifiedCanvasStore(state => state.commitEndpointDrag);

  // Only render when selected
  if (!isSelected) {
    return null;
  }

  // Source endpoint drag handlers
  const handleSourceDragStart = React.useCallback(() => {
    beginEndpointDrag(edge.id, 'start');
  }, [edge.id, beginEndpointDrag]);

  const handleSourceDragMove = React.useCallback((pos: { x: number; y: number }) => {
    updateEndpointDrag(pos);
  }, [updateEndpointDrag]);

  const handleSourceDragEnd = React.useCallback(() => {
    commitEndpointDrag();
  }, [commitEndpointDrag]);

  // Target endpoint drag handlers  
  const handleTargetDragStart = React.useCallback(() => {
    beginEndpointDrag(edge.id, 'end');
  }, [edge.id, beginEndpointDrag]);

  const handleTargetDragMove = React.useCallback((pos: { x: number; y: number }) => {
    updateEndpointDrag(pos);
  }, [updateEndpointDrag]);

  const handleTargetDragEnd = React.useCallback(() => {
    commitEndpointDrag();
  }, [commitEndpointDrag]);

  return (
    <>
      {/* Selection highlight behind the handles */}
      <Line
        points={[edge.startPoint.x, edge.startPoint.y, edge.endPoint.x, edge.endPoint.y]}
        stroke="rgba(59,130,246,0.35)" // Blue glow
        strokeWidth={(edge.strokeWidth || 2) + 6}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
      
      {/* Source handle */}
      <Handle
        x={edge.startPoint.x}
        y={edge.startPoint.y}
        role="source"
        onDragStart={handleSourceDragStart}
        onDragMove={handleSourceDragMove}
        onDragEnd={handleSourceDragEnd}
      />
      
      {/* Target handle */}
      <Handle
        x={edge.endPoint.x}
        y={edge.endPoint.y}
        role="target"
        onDragStart={handleTargetDragStart}
        onDragMove={handleTargetDragMove}
        onDragEnd={handleTargetDragEnd}
      />
    </>
  );
};

EdgeHandles.displayName = 'EdgeHandles';