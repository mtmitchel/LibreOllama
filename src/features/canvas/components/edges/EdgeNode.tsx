// src/features/canvas/components/edges/EdgeNode.tsx
import React, { useMemo } from 'react';
import { Line, Arrow, Group } from 'react-konva';
import { EdgeElement, ElementId } from '../../types/canvas-elements';

interface EdgeNodeProps {
  edge: EdgeElement;
  isSelected?: boolean;
  onSelect?: (edgeId: ElementId) => void;
}

/**
 * EdgeNode - Permanent edge rendering in Main layer
 * Supports hit-testing, selection, and various marker types
 */
export const EdgeNode: React.FC<EdgeNodeProps> = React.memo(({ 
  edge, 
  isSelected = false, 
  onSelect 
}) => {
  // Calculate if this edge should have arrow markers
  const hasArrowEnd = useMemo(() => {
    return edge.markerEnd === 'arrow';
  }, [edge.markerEnd]);

  const hasArrowStart = useMemo(() => {
    return edge.markerStart === 'arrow';
  }, [edge.markerStart]);

  // Handle edge selection
  const handleClick = React.useCallback((e: any) => {
    e.cancelBubble = true;
    if (onSelect) {
      onSelect(edge.id);
    }
  }, [edge.id, onSelect]);

  // Common line properties
  const lineProps = useMemo(() => ({
    points: edge.points,
    stroke: edge.stroke,
    strokeWidth: edge.strokeWidth,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    listening: edge.selectable !== false,
    onClick: handleClick,
    perfectDrawEnabled: false,
    // Selection highlighting
    shadowEnabled: isSelected,
    shadowColor: '#3B82F6',
    shadowBlur: isSelected ? 4 : 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  }), [edge.points, edge.stroke, edge.strokeWidth, edge.selectable, isSelected, handleClick]);

  // Render as Arrow if it has arrow markers, otherwise as Line
  if (hasArrowEnd || hasArrowStart) {
    return (
      <Arrow
        {...lineProps}
        fill={edge.stroke}
        pointerLength={8}
        pointerWidth={8}
        pointerAtBeginning={hasArrowStart}
        pointerAtEnding={hasArrowEnd}
      />
    );
  }

  return <Line {...lineProps} />;
});

EdgeNode.displayName = 'EdgeNode';