import React from 'react';
import { Layer, Rect, Transformer, Circle } from 'react-konva';
import Konva from 'konva';
import { useShallow } from 'zustand/react/shallow';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { CanvasElement, ElementId } from '../types/enhanced.types';
import { canvasTheme } from '../utils/canvasTheme';

interface SelectionLayerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  elements: Map<ElementId, CanvasElement>;
  selectedElementIds: Set<ElementId>;
  selectionBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  };
  onSelectionBoxUpdate?: (box: { x: number; y: number; width: number; height: number }) => void;
}

export function SelectionLayer({
  stageRef,
  elements,
  selectedElementIds,
  selectionBox,
  onSelectionBoxUpdate
}: SelectionLayerProps) {
  const transformerRef = React.useRef<Konva.Transformer | null>(null);
  
  // Update transformer when selection changes
  React.useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer || !stageRef.current) return;

    const selectedNodes: Konva.Node[] = [];
    
    selectedElementIds.forEach((elementId) => {
      const node = stageRef.current?.findOne(`#${elementId}`);
      if (node) {
        selectedNodes.push(node);
      }
    });

    transformer.nodes(selectedNodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedElementIds, stageRef]);

  // Handle transformer events
  const handleTransformEnd = React.useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const nodes = transformer.nodes();
    nodes.forEach((node) => {
      const element = elements.get(node.id() as ElementId);
      if (!element) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      // Reset scale to 1 and apply to dimensions
      node.scaleX(1);
      node.scaleY(1);

      // Update element with new position and dimensions
      const updates = {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation()
      };

      // Update through store
      useUnifiedCanvasStore.getState().updateElement(node.id() as ElementId, updates);
    });
  }, [elements]);

  return (
    <Layer>
      {/* Selection Box for multi-select */}
      {selectionBox?.visible && (
        <Rect
          x={selectionBox.x}
          y={selectionBox.y}
          width={selectionBox.width}
          height={selectionBox.height}
          fill="rgba(64, 150, 255, 0.1)"
          stroke={canvasTheme.colors.primary}
          strokeWidth={1}
          dash={[2, 2]}
          listening={false}
        />
      )}

      {/* Selection Handles for Individual Elements */}
      {Array.from(selectedElementIds).map((elementId) => {
        const element = elements.get(elementId);
        if (!element) return null;

        return (
          <React.Fragment key={`selection-${elementId}`}>
            {/* Selection highlight */}
            <Rect
              x={element.x - 2}
              y={element.y - 2}
              width={((element as any).width || 100) + 4}
              height={((element as any).height || 100) + 4}
              stroke={canvasTheme.colors.primary}
              strokeWidth={2}
              fill="transparent"
              listening={false}
            />
            
            {/* Corner handles for resize */}
            {[
              { x: element.x, y: element.y }, // top-left
              { x: element.x + ((element as any).width || 100), y: element.y }, // top-right
              { x: element.x, y: element.y + ((element as any).height || 100) }, // bottom-left
              { x: element.x + ((element as any).width || 100), y: element.y + ((element as any).height || 100) } // bottom-right
            ].map((handle, index) => (
              <Circle
                key={`handle-${elementId}-${index}`}
                x={handle.x}
                y={handle.y}
                radius={4}
                fill="white"
                stroke={canvasTheme.colors.primary}
                strokeWidth={2}
                listening={false}
              />
            ))}
          </React.Fragment>
        );
      })}

      {/* Transformer for selected elements */}
      <Transformer
        ref={transformerRef}
        rotateAnchorOffset={20}
        enabledAnchors={[
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
          'middle-left',
          'middle-right',
          'top-center',
          'bottom-center'
        ]}
        boundBoxFunc={(oldBox, newBox) => {
          // Limit resize to minimum dimensions
          if (newBox.width < 5 || newBox.height < 5) {
            return oldBox;
          }
          return newBox;
        }}
        onTransformEnd={handleTransformEnd}
        anchorStroke={canvasTheme.colors.primary}
        anchorFill="white"
        anchorSize={8}
        borderStroke={canvasTheme.colors.primary}
        borderStrokeWidth={2}
      />
    </Layer>
  );
} 