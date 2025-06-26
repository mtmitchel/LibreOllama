// src/features/canvas/components/ElementRenderer.tsx
import React from 'react';
import {
  CanvasElement,
  isCircleElement,
  isImageElement,
  isPenElement,
  isRectangleElement,
  isStarElement,
  isStickyNoteElement,
  isTableElement,
  isTextElement,
  isTriangleElement,
  ElementId
} from '../types/enhanced.types';
import { RectangleShape } from '../shapes/RectangleShape';
import { CircleShape } from '../shapes/CircleShape';
import { StarShape } from '../shapes/StarShape';
import { TriangleShape } from '../shapes/TriangleShape';
import { StickyNoteShape } from '../shapes/StickyNoteShape';
import { TextShape } from '../shapes/TextShape';
import { ImageShape } from '../shapes/ImageShape';
import { PenShape } from '../shapes/PenShape';
import { EnhancedTableElement } from '../components/EnhancedTableElement';
import Konva from 'konva';

interface ElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => void;
  onElementUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
  overrideKonvaProps?: Partial<Konva.NodeConfig>;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({ 
  element, 
  isSelected, 
  onElementClick,
  onElementDragEnd,
  onElementUpdate,
  onStartTextEdit,
  overrideKonvaProps
}) => {
  // CRITICAL FIX: Use element coordinates directly since they're already relative when inside sections
  // The SectionHandler's Group component handles the coordinate transformation automatically
  const konvaProps = {
      id: element.id,
      x: element.x, // These are relative coordinates when inside a section
      y: element.y, // These are relative coordinates when inside a section
      rotation: element.rotation,
      draggable: !element.isLocked,
      ...overrideKonvaProps
  };

  const commonShapeProps = {
    isSelected,
    onUpdate: onElementUpdate,
    onStartTextEdit: onStartTextEdit,
    konvaProps,
    // Add missing handlers expected by BaseShapeProps
    onSelect: (elementId: ElementId) => onElementClick({ target: { id: () => elementId } } as any, element),
    onDragEnd: (elementId: ElementId) => onElementDragEnd({ target: { id: () => elementId } } as any, elementId)
  };

  if (isRectangleElement(element)) {
    return <RectangleShape {...(commonShapeProps as any)} element={element} />;
  }
  if (isCircleElement(element)) {
    return <CircleShape {...(commonShapeProps as any)} element={element} />;
  }
  if (isStarElement(element)) {
    return <StarShape {...(commonShapeProps as any)} element={element} />;
  }
  if (isTriangleElement(element)) {
    return <TriangleShape {...(commonShapeProps as any)} element={element} />;
  }
  if (isStickyNoteElement(element)) {
    return <StickyNoteShape {...commonShapeProps} element={element} />;
  }
  if (isTextElement(element)) {
    return <TextShape {...commonShapeProps} element={element} />;
  }
  if (isImageElement(element)) {
    return <ImageShape {...commonShapeProps} element={element} />;
  }
  if (isPenElement(element)) {
    return <PenShape element={element} konvaProps={konvaProps} />;
  }  if (isTableElement(element)) {
    return (
      <EnhancedTableElement 
        element={element} 
        isSelected={isSelected}
        onSelect={(el) => onElementClick({} as any, el)}
        onUpdate={(updates) => onElementUpdate(element.id, updates)}
        onDragEnd={(e) => onElementDragEnd(e, element.id)}
        stageRef={{ current: null }}
      />
    );
  }

  return null;
};
