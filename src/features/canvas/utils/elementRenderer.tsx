// src/features/canvas/utils/elementRenderer.tsx
import React from 'react';
import { Rect, Circle } from 'react-konva';
import { CanvasElement, ElementId, SectionId, isPenElement, isRectangleElement, isCircleElement, isTextElement, isImageElement, isStickyNoteElement, isStarElement, isTriangleElement } from '../types/enhanced.types';
import { TextShape } from '../shapes/TextShape';
import { ImageShape } from '../shapes/ImageShape';
import { StickyNoteShape } from '../shapes/StickyNoteShape';
import { StarShape } from '../shapes/StarShape';
import { TriangleShape } from '../shapes/TriangleShape';
import { PenShape } from '../shapes/PenShape';
import Konva from 'konva';
import { Vector2d } from 'konva/lib/types';

interface RenderElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => void;
  onElementUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
  dragBoundFunc?: (this: Konva.Node, pos: Vector2d) => Vector2d;
  draggable?: boolean;
  sectionContext?: {
    sectionId: SectionId;
    isInSection: boolean;
  };
}

/**
 * Universal element renderer that handles all canvas element types
 * Used by both legacy and grouped rendering systems
 */
export const renderElement = ({
  element,
  isSelected,
  onElementClick,
  onElementDragEnd,
  onElementUpdate,
  onStartTextEdit,
  dragBoundFunc,
  draggable = true,
  sectionContext
}: RenderElementProps): React.ReactElement | null => {
  const { id, ...restOfElement } = element;

  const konvaProps = {
    id: id,
    x: element.x || 0,
    y: element.y || 0,
    draggable: draggable && !element.isLocked,
    ...(dragBoundFunc && { dragBoundFunc }),
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => onElementClick(e, element),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onElementDragEnd(e, element.id as ElementId)
  };

  const commonShapeProps = {
    element,
    isSelected,
    konvaProps,
    onUpdate: onElementUpdate,
    onStartTextEdit,
    sectionContext
  };

  switch (element.type) {
    case 'text':
      if (isTextElement(element)) {
        return <TextShape key={id} {...commonShapeProps} element={element} />;
      }
      return null;

    case 'image':
      if (isImageElement(element)) {
        return <ImageShape key={id} {...commonShapeProps} element={element} />;
      }
      return null;

    case 'sticky-note':
      if (isStickyNoteElement(element)) {
        return <StickyNoteShape key={id} {...commonShapeProps} element={element} />;
      }
      return null;

    case 'star':
      if (isStarElement(element)) {
        return <StarShape key={id} {...commonShapeProps} element={element} />;
      }
      return null;

    case 'triangle':
      if (isTriangleElement(element)) {
        return <TriangleShape key={id} {...commonShapeProps} element={element} />;
      }
      return null;

    case 'pen':
      if (isPenElement(element)) {
        return <PenShape key={id} {...commonShapeProps} element={element} />;
      }
      return null;

    case 'rectangle':
      if (isRectangleElement(element)) {
        return (
          <Rect
            key={id}
            {...konvaProps}
            width={element.width || 100}
            height={element.height || 100}
            fill={element.fill || '#3B82F6'}
            stroke={element.stroke || '#1E40AF'}
            strokeWidth={element.strokeWidth || 2}
            cornerRadius={element.cornerRadius || 0}
          />
        );
      }
      return null;

    case 'circle':
      if (isCircleElement(element)) {
        return (
          <Circle
            key={id}
            {...konvaProps}
            radius={element.radius || 50}
            fill={element.fill || '#3B82F6'}
            stroke={element.stroke || '#1E40AF'}
            strokeWidth={element.strokeWidth || 2}
          />
        );
      }
      return null;

    case 'section':
      // Sections are handled by the GroupedSectionRenderer, not here
      return null;

    case 'connector':
      // Connectors are handled by a dedicated connector layer, not here
      return null;

    case 'table':
      // Tables need a dedicated component that we haven't created yet
      return null;

    default:
      // This should never happen with the discriminated union
      return null;
  }
};
