// src/features/canvas/components/ElementRenderer.tsx
import React from 'react';
import {
  CanvasElement,
  SectionElement,
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
import { useCanvasStore } from '../stores/canvasStore.enhanced';
import { calculateSnapLines } from '../utils/snappingUtils';
import { Line } from 'react-konva';

// Type for elements that are not sections (ElementRenderer should only handle these)
type NonSectionElement = Exclude<CanvasElement, SectionElement>;

interface ElementRendererProps {
  element: NonSectionElement;
  isSelected: boolean;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: NonSectionElement) => void;
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
  const { elements, isSnappingEnabled, snapTolerance, snapLines, snappingActions } = useCanvasStore((state) => ({
    elements: Array.from(state.elements.values()),
    isSnappingEnabled: state.isSnappingEnabled,
    snapTolerance: state.snapTolerance,
    snapLines: state.snapLines,
    snappingActions: state.snappingActions,
  }));

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isSnappingEnabled) return;

    const draggedElement = { ...element, x: e.target.x(), y: e.target.y() };
    const newSnapLines = calculateSnapLines(draggedElement, elements, snapTolerance);
    snappingActions.setSnapLines(newSnapLines);

    let snappedX = e.target.x();
    let snappedY = e.target.y();

    newSnapLines.forEach(line => {
      if (line.points[0] === line.points[2]) { // Vertical line
        snappedX = line.points[0] - (draggedElement.x - e.target.x());
      } else { // Horizontal line
        snappedY = line.points[1] - (draggedElement.y - e.target.y());
      }
    });

    e.target.position({ x: snappedX, y: snappedY });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    snappingActions.clearSnapLines();
    onElementDragEnd(e, element.id);
  };

  // CRITICAL FIX: Use element coordinates directly since they're already relative when inside sections
  // The SectionHandler's Group component handles the coordinate transformation automatically
  const konvaProps = {
      id: element.id,
      x: element.x, // These are relative coordinates when inside a section
      y: element.y, // These are relative coordinates when inside a section
      rotation: element.rotation || 0,
      draggable: !element.isLocked,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      ...overrideKonvaProps
  };

  const commonShapeProps = {
    isSelected,
    onUpdate: onElementUpdate,
    onStartTextEdit: onStartTextEdit,
    konvaProps,
    // Add missing handlers expected by BaseShapeProps
    onSelect: (elementId: ElementId) => onElementClick({ target: { id: () => elementId } } as any, element as NonSectionElement),
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
        onSelect={(el) => onElementClick({} as any, el as NonSectionElement)}
        onUpdate={(updates) => onElementUpdate(element.id, updates)}
        // ARCHITECTURAL FIX: Remove drag handler to centralize in CanvasEventHandler
        // onDragEnd={(e) => onElementDragEnd(e, element.id)} // DISABLED per Friday Review
        stageRef={{ current: null }}
      />
    );
  }

  return null;
};
