// src/components/canvas/layers/MainLayer.tsx
import React, { useMemo, useCallback } from 'react';
import { Group, Line } from 'react-konva';
import Konva from 'konva';
import type { CanvasElement } from '../../../features/canvas/types';
import { EditableNode } from '../shapes/EditableNode';
import { designSystem } from '../../styles/designSystem';
import { 
  createEventDelegation, 
  optimizeLayerProps,
  throttleRAF
} from '../../../features/canvas/utils/events';

interface MainLayerProps {
  elements: CanvasElement[];
  selectedElementIds: string[];
  selectedTool: string;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: string) => void;
  isDrawing?: boolean;
  currentPath?: number[];
  onLayerDraw?: () => void;
}

/**
 * MainLayer - Renders primary interactive canvas elements
 * - Shapes, text, images, sections
 * - Interactive elements with drag/selection support
 * - Performance optimized rendering with event delegation
 */
export const MainLayer: React.FC<MainLayerProps> = ({
  elements,
  selectedElementIds,
  selectedTool,
  onElementClick,
  onElementDragEnd,
  onElementUpdate,
  onStartTextEdit,
  isDrawing = false,
  currentPath = [],
  onLayerDraw
}) => {
  // Create throttled event handlers for performance
  const throttledDragEnd = useMemo(() => 
    throttleRAF((e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
      onElementDragEnd(e, elementId);
    }), [onElementDragEnd]
  );

  // Create event delegation for the layer
  const layerEventHandlers = useMemo(() => {
    return createEventDelegation(
      {
        enableClick: true,
        enableDrag: true,
        enableHover: false // Disabled for performance
      },
      {
        onElementClick: (elementId: string, event: any) => {
          const element = elements.find(el => el.id === elementId);
          if (element) {
            onElementClick(event, element);
          }
        },
        onElementDragEnd: (elementId: string, event: any) => {
          throttledDragEnd(event, elementId);
        }
      }
    );
  }, [elements, onElementClick, throttledDragEnd]);

  // Optimize layer props for performance
  const layerProps = useMemo(() => 
    optimizeLayerProps({
      listening: true,
      name: "main-layer"
    }, true), []
  );

  // Render individual elements using EditableNode wrapper
  const renderElement = useCallback((element: CanvasElement) => {
    const isSelected = selectedElementIds.includes(element.id);
    
    return (
      <EditableNode
        key={element.id}
        element={element}
        isSelected={isSelected}
        selectedTool={selectedTool}
        onElementClick={onElementClick}
        onElementDragEnd={onElementDragEnd}
        onElementUpdate={onElementUpdate}
        onStartTextEdit={onStartTextEdit}
      />
    );
  }, [selectedElementIds, selectedTool, onElementClick, onElementDragEnd, onElementUpdate, onStartTextEdit]);

  // Effect to trigger layer redraw when needed
  React.useEffect(() => {
    if (onLayerDraw) {
      onLayerDraw();
    }
  }, [elements.length, onLayerDraw]);
  return (
    <Group 
      {...layerProps}
      {...layerEventHandlers}
    >
      {/* Render all main elements */}
      {elements.map(renderElement)}
      
      {/* Preview line during pen drawing */}
      {isDrawing && currentPath.length > 0 && selectedTool === 'pen' && (
        <Line
          points={currentPath}
          stroke={designSystem.colors.secondary[800]}
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          tension={0.5}
          opacity={0.7}
          listening={false}
        />
      )}
    </Group>
  );
};
