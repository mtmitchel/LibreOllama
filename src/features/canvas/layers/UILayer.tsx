// src/features/canvas/layers/UILayer.tsx
import React from 'react';
import { Layer, Group, Transformer, Rect, Circle } from 'react-konva';
import Konva from 'konva';
import { CanvasElement } from '../layers/types';
import { useFeatureFlag } from '../hooks/useFeatureFlags';

interface UILayerProps {
  selectedElementIds: string[];
  elements: Record<string, CanvasElement>;
  sections: Record<string, any>;
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  selectionBox?: { x: number; y: number; width: number; height: number; visible: boolean; };
  hoveredSnapPoint?: { x: number; y: number; elementId?: string; anchor?: string } | null;
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onElementUpdate?: (id: string, updates: Partial<CanvasElement>) => void;
  // Add history function for atomic undo/redo
  addHistoryEntry?: (action: string, patches: any[], inversePatches: any[], metadata?: any) => void;
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
  stageRef,
  selectionBox,
  hoveredSnapPoint,
  onMouseDown = () => {},
  onMouseMove = () => {},
  onMouseUp = () => {},
  onElementUpdate,
  addHistoryEntry,
}) => {
  // Check if centralized transformer is enabled
  const useCentralizedTransformer = useFeatureFlag('centralized-transformer');
  
  const transformerRef = React.useRef<Konva.Transformer>(null);
  const layerRef = React.useRef<Konva.Group>(null);

  console.log(`[UILayer] Centralized transformer enabled: ${useCentralizedTransformer}, will ${useCentralizedTransformer ? 'SKIP' : 'RENDER'} local transformer`);

  // Update transformer when selection changes (only if not using centralized transformer)
  React.useEffect(() => {
    if (useCentralizedTransformer) {
      // Skip transformer management - handled by TransformerManager
      return;
    }
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
        transformer.getLayer()?.batchDraw();      }
    }
  }, [selectedElementIds, stageRef, useCentralizedTransformer]);

  // Determine transformer configuration based on selected elements
  const getTransformerConfig = React.useCallback(() => {
    if (selectedElementIds.length === 0) return { enabledAnchors: [] };

    const firstSelectedId = selectedElementIds[0];
    if (!firstSelectedId) return { enabledAnchors: [] };

    const selectedElement = elements[firstSelectedId] || sections[firstSelectedId];
    if (!selectedElement) return { enabledAnchors: [] };    switch (selectedElement.type) {
      case 'text':
      case 'rich-text':
        // Text elements: only horizontal resize to maintain line height
        return { enabledAnchors: ['middle-left', 'middle-right'] };
      case 'sticky-note':
        // Sticky notes: full resize capability
        return {
          enabledAnchors: [
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
          ]
        };
      case 'table':
        // Table elements: disable transformer (use custom resize handles)
        return { enabledAnchors: [] };
      case 'pen':
      case 'connector':
        // Line-based elements: disable transformer (points-based positioning)
        return { enabledAnchors: [] };      case 'section':
        // Sections: disable transformer (use custom resize handles in SectionShape)
        return { enabledAnchors: [] };
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

  const transformerConfig = getTransformerConfig();  // Handle transform end - when user finishes resizing/rotating elements
  const handleTransformEnd = React.useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer || !onElementUpdate) return;

    const nodes = transformer.nodes();
    if (nodes.length === 0) return;

    nodes.forEach((node) => {
      const elementId = node.id();
      const element = elements[elementId] || sections[elementId];
      if (!element) return;

      // Get transform values
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();
      const x = node.x();
      const y = node.y();

      // Reset transform scale back to 1 to avoid compound scaling
      node.scaleX(1);
      node.scaleY(1);
      node.rotation(0);

      const updates: Partial<CanvasElement> = {
        x,
        y,
        rotation: rotation || 0
      };

      // Apply scale to dimensions based on element type
      switch (element.type) {
        case 'rectangle':
          updates.width = Math.max(5, (element.width || 100) * scaleX);
          updates.height = Math.max(5, (element.height || 100) * scaleY);
          break;
        case 'circle':
          // For circles, use the larger scale to maintain aspect ratio
          const newRadius = Math.max(5, (element.radius || 50) * Math.max(scaleX, scaleY));
          updates.radius = newRadius;

          // Handle circle positioning: store coordinates are top-left corner based
          // but during transform, Konva treats circle x,y as center
          // Convert from center position back to top-left corner
          updates.x = x - newRadius;
          updates.y = y - newRadius;
          break;
        case 'text':
        case 'sticky-note':
        case 'rich-text':
          updates.width = Math.max(20, (element.width || 120) * scaleX);
          updates.height = Math.max(15, (element.height || 30) * scaleY);
          break;
        case 'table':
          updates.width = Math.max(160, (element.width || 300) * scaleX);
          updates.height = Math.max(80, (element.height || 200) * scaleY);
          break;
        case 'image':
          updates.width = Math.max(20, (element.width || 100) * scaleX);
          updates.height = Math.max(20, (element.height || 100) * scaleY);
          break;
        case 'star':
          const newStarRadius = Math.max(5, (element.radius || 50) * Math.max(scaleX, scaleY));
          updates.radius = newStarRadius;
          if (element.innerRadius) {
            updates.innerRadius = element.innerRadius * Math.max(scaleX, scaleY);
          }

          // Handle star positioning: store coordinates are top-left corner based
          // but during transform, Konva treats star x,y as center
          // Convert from center position back to top-left corner
          updates.x = x - newStarRadius;
          updates.y = y - newStarRadius;
          break;
        case 'triangle':
          updates.width = Math.max(5, (element.width || 100) * scaleX);
          updates.height = Math.max(5, (element.height || 60) * scaleY);
          // Clear any old points array to force recalculation with new dimensions
          delete (updates as any).points;
          break;
        case 'pen':
        case 'connector':
          // For line-based elements, scale the points array if it exists
          if (element.points && Array.isArray(element.points)) {
            const scaledPoints = element.points.map((point: number, index: number) => 
              index % 2 === 0 ? point * scaleX : point * scaleY
            );
            updates.points = scaledPoints;
          }
          break;
        case 'section':
          updates.width = Math.max(100, (element.width || 200) * scaleX);
          updates.height = Math.max(50, (element.height || 150) * scaleY);
          break;
        default:
          // For other elements, apply scale to width/height if they exist
          if (element.width !== undefined) {
            updates.width = Math.max(5, element.width * scaleX);
          }
          if (element.height !== undefined) {
            updates.height = Math.max(5, element.height * scaleY);
          }
          break;
      }

      // Update the element in the store
      onElementUpdate(elementId, updates);    });

    // Task 4: Save atomic history entry after transform completion
    if (addHistoryEntry) {
      addHistoryEntry(
        `Transform ${nodes.length} element${nodes.length > 1 ? 's' : ''}`,
        [], // patches handled by onElementUpdate
        [], // inverse patches handled by onElementUpdate
        {
          elementIds: nodes.map(n => n.id()),
          operationType: 'update',
          affectedCount: nodes.length
        }
      );
    }
  }, [onElementUpdate, elements, sections, addHistoryEntry]);

  return (
    <Layer 
      listening={true}
      name="ui-layer"
    >
      <Group 
        ref={layerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}        onMouseUp={onMouseUp}      >
        {/* Selection and transform controls - only render if centralized transformer is disabled */}
        {!useCentralizedTransformer && (
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
          onTransformEnd={handleTransformEnd}
        />
        )}

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
          listening={false}        />
      )}
      {/* Selection box for multi-select */}
      {selectionBox?.visible && (
        <Rect
          x={selectionBox.x}
          y={selectionBox.y}
          width={selectionBox.width}
          height={selectionBox.height}          fill="rgba(0, 161, 255, 0.2)"
          stroke="rgba(0, 161, 255, 0.8)"
          strokeWidth={1}
          listening={false}        />
      )}
        {/* Snap point indicator */}
        {hoveredSnapPoint && (
        <Group
          x={hoveredSnapPoint.x}
          y={hoveredSnapPoint.y}
          listening={false}
        >
          {/* Outer glow circle */}
          <Circle
            radius={12}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth={2}
          />
          {/* Inner snap point */}
          <Circle
            radius={6}
            fill="#3B82F6"
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        </Group>
      )}
      </Group>
    </Layer>
  );
};
