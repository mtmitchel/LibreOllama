/**
 * EdgeNode - Main layer connector rendering with proper hit detection
 * Part of the multi-layer blueprint: Main layer handles the selectable edge line
 */

import React from 'react';
import { Line, Arrow } from 'react-konva';
import { useUnifiedCanvasStore } from '../../stores/unifiedCanvasStore';
import { ConnectorElement } from '../../types/enhanced.types';

interface EdgeNodeProps {
  edge: ConnectorElement;
  isSelected: boolean;
}

export const EdgeNode: React.FC<EdgeNodeProps> = React.memo(({ edge, isSelected }) => {
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  
  // Calculate points for rendering
  const points = React.useMemo(() => {
    return [edge.startPoint.x, edge.startPoint.y, edge.endPoint.x, edge.endPoint.y];
  }, [edge.startPoint, edge.endPoint]);

  const handleMouseEnter = React.useCallback((e: any) => {
    const stage = e.target.getStage();
    if (stage?.container()) {
      stage.container().style.cursor = 'pointer';
    }
  }, []);

  const handleMouseLeave = React.useCallback((e: any) => {
    const stage = e.target.getStage();
    if (stage?.container()) {
      stage.container().style.cursor = '';
    }
  }, []);

  const handleMouseDown = React.useCallback((e: any) => {
    e.cancelBubble = true; // Prevent falling through to Stage click-clear
    selectElement(edge.id, false); // Select this edge (BLUEPRINT: STORE-FIRST)
  }, [edge.id, selectElement]);

  // Common props for both Line and Arrow
  const commonProps = {
    points,
    stroke: edge.stroke || '#374151',
    strokeWidth: edge.strokeWidth || 2,
    hitStrokeWidth: Math.max(20, (edge.strokeWidth || 2) * 3), // Wider hit area
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    listening: true,
    strokeScaleEnabled: false, // Consistent feel on zoom
    perfectDrawEnabled: false, // Performance
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseDown: handleMouseDown,
    draggable: false // Port-attached (BLUEPRINT: PORT-BASED LOGIC)
  };

  // Render as Arrow for arrow connectors
  if (edge.subType === 'arrow') {
    return (
      <Arrow
        {...commonProps}
        fill={edge.stroke || '#374151'}
        pointerLength={12}
        pointerWidth={8}
        pointerAtEnding={true}
      />
    );
  }

  // Render as Line for line connectors
  return <Line {...commonProps} />;
});

EdgeNode.displayName = 'EdgeNode';