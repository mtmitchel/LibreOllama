// src/components/canvas/layers/UILayer.tsx
import React from 'react';
import { Group, Transformer, Rect } from 'react-konva';
import Konva from 'konva';
import { CanvasElement } from '../../../features/canvas/layers/types';

interface UILayerProps {
  selectedElementIds: string[];
  elements: Record<string, CanvasElement>;
  sections: Record<string, any>;
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
}

/**
 * UILayer - Renders selection handles and UI overlays
 * - Selection rectangles and handles
 * - Transform controls and resize handles
 * - Tool-specific UI elements
 * - Section drawing previews
 */
export const UILayer: React.FC<UILayerProps> = ({
  selectedElementIds,
  elements,
  sections,
  isDrawingSection = false,
  previewSection,
  stageRef
}) => {
  const transformerRef = React.useRef<Konva.Transformer>(null);
  const layerRef = React.useRef<Konva.Group>(null);

  // Update transformer when selection changes
  React.useEffect(() => {
    const transformer = transformerRef.current;
    const layer = layerRef.current;
    if (!transformer || !layer || !stageRef.current) return;

    // Clear previous selection
    transformer.nodes([]);

    if (selectedElementIds.length > 0) {
      const selectedNodes: Konva.Node[] = [];
      
      selectedElementIds.forEach(elementId => {
        const node = stageRef.current?.findOne(`#${elementId}`);
        if (node) {
          selectedNodes.push(node);
        }
      });

      if (selectedNodes.length > 0) {
        transformer.nodes(selectedNodes);
        transformer.getLayer()?.batchDraw();
      }
    }
  }, [selectedElementIds, stageRef]);

  // Determine transformer configuration based on selected elements
  const getTransformerConfig = React.useCallback(() => {
    if (selectedElementIds.length === 0) return { enabledAnchors: [] };
    
    const firstSelectedId = selectedElementIds[0];
    if (!firstSelectedId) return { enabledAnchors: [] };
    
    const selectedElement = elements[firstSelectedId] || sections[firstSelectedId];
    if (!selectedElement) return { enabledAnchors: [] };

    switch (selectedElement.type) {
      case 'text':
        // Text elements: only horizontal resize
        return { enabledAnchors: ['middle-left', 'middle-right'] };
      case 'table':
        // Table elements: disable transformer (use custom resize handles)
        return { enabledAnchors: [] };
      case 'section':
        // Sections: full resize capability
        return {
          enabledAnchors: [
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
          ]
        };
      default:
        // Other elements: full resize capability
        return {
          enabledAnchors: [
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
          ]
        };
    }
  }, [selectedElementIds, elements, sections]);

  const transformerConfig = getTransformerConfig();

  return (
    <Group ref={layerRef} listening={false} name="ui-layer">
      {/* Selection and transform controls */}
      <Transformer
        ref={transformerRef}
        rotateEnabled={true}
        enabledAnchors={transformerConfig.enabledAnchors}
        borderStroke="#3B82F6"
        borderStrokeWidth={2}
        borderDash={[8, 4]}
        anchorFill="#FFFFFF"
        anchorStroke="#3B82F6"
        anchorStrokeWidth={2}
        anchorSize={14}
        anchorCornerRadius={7}
        rotateAnchorOffset={35}
        rotationSnapTolerance={5}
        rotateAnchorSize={20}
        rotateAnchorFill="#3B82F6"
        rotateAnchorStroke="#FFFFFF"
        rotateAnchorStrokeWidth={2}
        padding={8}
        shadowColor="rgba(59, 130, 246, 0.3)"
        shadowBlur={12}
        shadowOffset={{ x: 0, y: 4 }}
        shadowOpacity={0.5}
        boundBoxFunc={(oldBox, newBox) => {
          // Limit resize to minimum size
          if (newBox.width < 5 || newBox.height < 5) {
            return oldBox;
          }
          return newBox;
        }}
      />
      
      {/* Section preview during drawing */}
      {isDrawingSection && previewSection && (
        <Rect
          x={previewSection.x}
          y={previewSection.y}
          width={previewSection.width}
          height={previewSection.height}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="#3B82F6"
          strokeWidth={2}
          dash={[5, 5]}
          opacity={0.7}
          listening={false}
        />
      )}
    </Group>
  );
};
