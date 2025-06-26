// src/features/canvas/layers/UILayer.tsx
// TODO: [LO-Refactor] This component is >350 lines and needs to be broken down
// TODO: Refactor to use enhanced types properly - currently using temporary type assertions
import React from 'react';
import { Layer, Group, Transformer, Rect, Circle } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, ElementId, SectionId, isRectangularElement } from '../types/enhanced.types';
import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { enhancedFeatureFlagManager } from '../utils/state/EnhancedFeatureFlagManager';

interface UILayerProps {
  selectedElementIds: Set<ElementId>;
  elements: Map<ElementId | SectionId, CanvasElement>;
  sections: Map<SectionId, any>;
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  selectionBox?: { x: number; y: number; width: number; height: number; visible: boolean; };
  hoveredSnapPoint?: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onElementUpdate?: (id: ElementId, updates: Partial<CanvasElement>) => void;
  // Add history function for atomic undo/redo
  addHistoryEntry?: (action: string, patches: any[], inversePatches: any[], metadata?: any) => void;
}

/**
 * UILayer - Renders selection handles and UI overlays
 * - Selection rectangles and handles
 * - Transform controls and resize handles
 * - Tool-specific UI elements
 * - Section drawing previews
 * 
 * TODO: [LO-Refactor] Break this component down into smaller components:
 * - TransformerController
 * - SelectionBox
 * - SnapPointIndicator
 * - SectionPreview
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
  // Check if centralized transformer is enabled with enhanced fallback support
  const useCentralizedTransformer = enhancedFeatureFlagManager.getFlag('centralized-transformer');
  
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

    if (selectedElementIds.size > 0) {
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
  }, [selectedElementIds, stageRef, useCentralizedTransformer]);

  // Determine transformer configuration based on selected elements
  const getTransformerConfig = React.useCallback(() => {
    if (selectedElementIds.size === 0) return { enabledAnchors: [] };

    const firstSelectedId = Array.from(selectedElementIds)[0];
    if (!firstSelectedId) return { enabledAnchors: [] };

    // Get element with proper type safety - check both maps
    const selectedElement = elements.get(firstSelectedId) || sections.get(firstSelectedId as unknown as SectionId);
    if (!selectedElement) return { enabledAnchors: [] };

    switch (selectedElement.type) {
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
        return { enabledAnchors: [] };
      case 'section':
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

  const transformerConfig = getTransformerConfig();

  // Handle transform end - when user finishes resizing/rotating elements
  const handleTransformEnd = React.useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer || !onElementUpdate) return;

    const nodes = transformer.nodes();
    if (nodes.length === 0) return;

    nodes.forEach((node) => {
      const elementId = node.id();
      // Get element with proper type safety
      const element = elements.get(elementId as ElementId) || sections.get(elementId as unknown as SectionId);
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

      // Handle element-specific transforms with proper type checking
      const updates: Partial<CanvasElement> = { x, y, rotation };

      // Handle element-specific transforms
      switch (element.type) {
        case 'rectangle':
        case 'image':
        case 'text':
        case 'rich-text':
        case 'sticky-note':
        case 'table':
          if (isRectangularElement(element)) {
            (updates as any).width = Math.max(5, element.width * scaleX);
            (updates as any).height = Math.max(5, element.height * scaleY);
          }
          break;
        case 'circle':
          if (element.type === 'circle') {
            const avgScale = (scaleX + scaleY) / 2;
            const newRadius = Math.max(5, element.radius * avgScale);
            (updates as any).radius = newRadius;
          }
          break;
        case 'star':
          if (element.type === 'star') {
            const avgScale = (scaleX + scaleY) / 2;
            const newOuterRadius = Math.max(5, element.outerRadius * avgScale);
            (updates as any).outerRadius = newOuterRadius;
            if (element.innerRadius) {
              (updates as any).innerRadius = element.innerRadius * avgScale;
            }
          }
          break;
        case 'triangle':
          if (element.type === 'triangle') {
            (updates as any).width = Math.max(5, (element.width || 100) * scaleX);
            (updates as any).height = Math.max(5, (element.height || 100) * scaleY);
            // Scale triangle points if they exist
            if (element.points && Array.isArray(element.points)) {
              const scaledPoints = element.points.map((point: number, index: number) => {
                return index % 2 === 0 ? point * scaleX : point * scaleY;
              });
              (updates as any).points = scaledPoints;
            }
          }
          break;
        case 'section':
          if (element.type === 'section') {
            (updates as any).width = Math.max(5, element.width * scaleX);
            (updates as any).height = Math.max(5, element.height * scaleY);
          }
          break;
      }

      // Apply updates using proper ElementId type
      onElementUpdate(elementId as ElementId, updates);
    });

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
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <Group 
        ref={layerRef}
      >
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
            listening={false}
          />
        )}

        {/* Selection box for multi-select */}
        {selectionBox?.visible && (
          <Rect
            x={selectionBox.x}
            y={selectionBox.y}
            width={selectionBox.width}
            height={selectionBox.height}
            fill="rgba(0, 161, 255, 0.2)"
            stroke="rgba(0, 161, 255, 0.8)"
            strokeWidth={1}
            listening={false}
          />
        )}

        {/* Snap point indicator */}
        {hoveredSnapPoint && (
          <Group
            x={hoveredSnapPoint.x}
            y={hoveredSnapPoint.y}
            listening={false}
          >
            <Circle
              radius={12}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth={2}
            />
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
