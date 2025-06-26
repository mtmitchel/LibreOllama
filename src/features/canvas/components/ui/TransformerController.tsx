import React from 'react';
import { Transformer } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, ElementId, SectionId, isRectangularElement } from '../../types/enhanced.types';

interface TransformerControllerProps {
  selectedElementIds: Set<ElementId>;
  elements: Map<ElementId | SectionId, CanvasElement>;
  sections: Map<SectionId, any>;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onElementUpdate?: (id: ElementId, updates: Partial<CanvasElement>) => void;
  addHistoryEntry?: (action: string, patches: any[], inversePatches: any[], metadata?: any) => void;
}

export const TransformerController: React.FC<TransformerControllerProps> = ({
  selectedElementIds,
  elements,
  sections,
  stageRef,
  onElementUpdate,
  addHistoryEntry,
}) => {
  const transformerRef = React.useRef<Konva.Transformer>(null);

  React.useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer || !stageRef.current) return;

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
  }, [selectedElementIds, stageRef]);

  const getTransformerConfig = React.useCallback(() => {
    if (selectedElementIds.size === 0) return { enabledAnchors: [] };
    const firstSelectedId = Array.from(selectedElementIds)[0];
    if (!firstSelectedId) return { enabledAnchors: [] };

    const selectedElement = elements.get(firstSelectedId) || sections.get(firstSelectedId as unknown as SectionId);
    if (!selectedElement) return { enabledAnchors: [] };

    switch (selectedElement.type) {
      case 'text':
      case 'rich-text':
        return { enabledAnchors: ['middle-left', 'middle-right'] };
      case 'sticky-note':
        return { enabledAnchors: ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] };
      case 'table':
      case 'pen':
      case 'connector':
      case 'section':
        return { enabledAnchors: [] };
      default:
        return { enabledAnchors: ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] };
    }
  }, [selectedElementIds, elements, sections]);

  const transformerConfig = getTransformerConfig();

  const handleTransformEnd = React.useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer || !onElementUpdate) return;

    const nodes = transformer.nodes();
    if (nodes.length === 0) return;

    nodes.forEach((node) => {
      const elementId = node.id();
      const element = elements.get(elementId as ElementId) || sections.get(elementId as unknown as SectionId);
      if (!element) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();
      const x = node.x();
      const y = node.y();

      node.scaleX(1);
      node.scaleY(1);
      node.rotation(0);

      const updates: Partial<CanvasElement> = { x, y, rotation };

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

      onElementUpdate(elementId as ElementId, updates);
    });

    if (addHistoryEntry) {
      addHistoryEntry(
        `Transform ${nodes.length} element${nodes.length > 1 ? 's' : ''}`,
        [],
        [],
        {
          elementIds: nodes.map(n => n.id()),
          operationType: 'update',
          affectedCount: nodes.length
        }
      );
    }
  }, [onElementUpdate, elements, sections, addHistoryEntry]);

  return (
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
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }
        return newBox;
      }}
      onTransformEnd={handleTransformEnd}
    />
  );
};
