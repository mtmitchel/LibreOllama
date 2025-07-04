/**
 * ConnectorTool - Interactive connector drawing component (Refactored)
 * 
 * Features:
 * - Real-time preview during drawing
 * - Smart snapping to element anchor points
 * - Support for line and arrow connectors
 * - Visual feedback for snap points
 */

import React, { useCallback } from 'react';
import { Line, Arrow } from 'react-konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { BaseCreationTool, Vector2d } from '../base';
import { debug } from '../../../utils/debug';
import { nanoid } from 'nanoid';
import { ElementId, ConnectorElement, CanvasElement } from '../../../types/enhanced.types';
import Konva from 'konva';

interface ConnectorToolProps {
  isActive: boolean;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  connectorType: 'line' | 'arrow';
}

export const ConnectorTool: React.FC<ConnectorToolProps> = ({
  isActive,
  stageRef,
  connectorType
}) => {
  const { elements } = useUnifiedCanvasStore(
    useShallow((state) => ({
      elements: state.elements
    }))
  );

  // Create connector element function (for drag creation)
  const createConnectorElement = useCallback((startPos: Vector2d, endPos?: Vector2d): ConnectorElement => {
    const finalEndPos = endPos || startPos;
    
    // Calculate the bounding box for the connector
    const minX = Math.min(startPos.x, finalEndPos.x);
    const minY = Math.min(startPos.y, finalEndPos.y);
    
    const now = Date.now();
    
    const connectorElement: ConnectorElement = {
      id: ElementId(nanoid()),
      type: 'connector',
      subType: connectorType,
      x: minX,
      y: minY,
      startPoint: startPos,
      endPoint: finalEndPos,
      intermediatePoints: [],
      stroke: '#000000',
      strokeWidth: 2,
      connectorStyle: {
        strokeColor: '#000000',
        strokeWidth: 2,
        endArrow: connectorType === 'arrow' ? 'solid' : 'none',
        startArrow: 'none'
      },
      pathPoints: [startPos.x, startPos.y, finalEndPos.x, finalEndPos.y],
      createdAt: now,
      updatedAt: now
    };

    debug.canvas.konvaEvent('connector-created', `${connectorElement.subType} connector ${connectorElement.id}`);
    
    return connectorElement;
  }, [connectorType]);

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

  // Render preview during creation and hover
  const renderPreview = useCallback((position: Vector2d, showGuide: boolean, startPos?: Vector2d, endPos?: Vector2d) => {
    // For drag mode, we get start and end positions from BaseCreationTool state
    const realStartPos = startPos || position;
    const realEndPos = endPos || position;
    
    const isCreating = startPos && endPos && (startPos !== endPos);
    
    if (isCreating) {
      // Render actual connector during drag
      const points = [realStartPos.x, realStartPos.y, realEndPos.x, realEndPos.y];
      
      if (connectorType === 'arrow') {
        return (
          <Arrow
            points={points}
            stroke="#3B82F6"
            strokeWidth={2}
            fill="#3B82F6"
            pointerLength={10}
            pointerWidth={10}
            lineCap="round"
            lineJoin="round"
            listening={false}
            opacity={0.8}
          />
        );
      } else {
        return (
          <Line
            points={points}
            stroke="#3B82F6"
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
            listening={false}
            opacity={0.8}
          />
        );
      }
    } else if (showGuide) {
      // Show simple preview dot when hovering
      return (
        <Line
          points={[position.x - 5, position.y, position.x + 5, position.y]}
          stroke="#3B82F6"
          strokeWidth={2}
          lineCap="round"
          listening={false}
          opacity={0.6}
        />
      );
    }
    
    return null;
  }, [connectorType]);

  return (
    <BaseCreationTool
      stageRef={stageRef}
      isActive={isActive}
      type="connector"
      onCreate={createConnectorElement}
      renderPreview={renderPreview}
      requiresDrag={true}
      minDragDistance={10}
      shouldSwitchToSelect={false} // Stay in connector tool for multiple connector creation
      shouldStartTextEdit={false}
    />
  );
}; 