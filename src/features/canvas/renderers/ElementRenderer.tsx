// src/features/canvas/renderers/ElementRenderer.tsx
import React from 'react';
import {
  CanvasElement,
  SectionElement,
  isCircleElement,
  isImageElement,
  isPenElement,
  isRectangleElement,
  isStickyNoteElement,
  isTableElement,
  isTextElement,
  isTriangleElement,
  ElementId
} from '../types/enhanced.types';
import { RectangleShape } from '../shapes/RectangleShape';
import { CircleShape } from '../shapes/CircleShape';
import { TriangleShape } from '../shapes/TriangleShape';
import { StickyNoteShape } from '../shapes/StickyNoteShape';
import { TextShape } from '../shapes/TextShape';
import { ImageShape } from '../shapes/ImageShape';
import { PenShape } from '../shapes/PenShape';
import { TableElement } from '../elements/TableElement';
import Konva from 'konva';
import { useUnifiedCanvasStore, canvasSelectors } from '../../../stores'; // Using unified store
import { calculateSnapLines } from '../utils/snappingUtils';
import { Line } from 'react-konva';
import { StrokeRenderer } from './StrokeRenderer';
import { isMarkerElement, isHighlighterElement } from '../types/drawing.types';

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

const ElementRendererComponent: React.FC<ElementRendererProps> = ({ 
  element, 
  isSelected, 
  onElementClick,
  onElementDragEnd,
  onElementUpdate,
  onStartTextEdit,
  overrideKonvaProps
}) => {
  // Use unified store with proper selectors
  const elements = useUnifiedCanvasStore(canvasSelectors.elements);
  const isSnappingEnabled = useUnifiedCanvasStore(state => state.snapToGrid || false);
  const snapTolerance = useUnifiedCanvasStore(state => 10); // Default snap tolerance
  // Snap lines functionality - temporarily disabled until unified store implements it
  const snapLines: any[] = [];
  const setSnapLines = (lines: any[]) => {
    // TODO: Implement snap lines in unified store
    console.log('Snap lines would be set:', lines);
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isSnappingEnabled) return;

    const draggedElement = { ...element, x: e.target.x(), y: e.target.y() };
    const newSnapLines = calculateSnapLines(draggedElement, Array.from(elements.values()), snapTolerance);
    setSnapLines(newSnapLines);

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
    setSnapLines([]); // Clear snap lines after drag
    onElementDragEnd(e, element.id);
  };

  // ARCHITECTURAL FIX: Remove drag handlers - UnifiedEventHandler handles all drag operations
  // The SectionHandler's Group component handles the coordinate transformation automatically
  const konvaProps = {
      id: element.id,
      x: element.x, // These are relative coordinates when inside a section
      y: element.y, // These are relative coordinates when inside a section
      rotation: element.rotation || 0,
      draggable: !element.isLocked && !isPenElement(element), // Pen elements should never be draggable
      // REMOVED: onDragMove, onDragEnd - handled by UnifiedEventHandler at stage level
      ...overrideKonvaProps
  };

  const commonShapeProps = {
    isSelected,
    onUpdate: onElementUpdate,
    onStartTextEdit: onStartTextEdit,
    konvaProps,
    // Add missing handlers expected by BaseShapeProps  
    onSelect: (elementId: ElementId) => onElementClick({ target: { id: () => elementId } } as any, element as NonSectionElement),
    // REMOVED: onDragEnd - handled by UnifiedEventHandler
  };

  if (isRectangleElement(element)) {
    return <RectangleShape {...(commonShapeProps as any)} element={element} />;
  }
  if (isCircleElement(element)) {
    return <CircleShape {...(commonShapeProps as any)} element={element} />;
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
  }
  
  // Handle new drawing types with StrokeRenderer
      if (isMarkerElement(element) || isHighlighterElement(element)) {
    return (
      <StrokeRenderer
        element={element}
        isSelected={isSelected}
        onSelect={() => onElementClick({ target: { id: () => element.id } } as any, element as NonSectionElement)}
        isEditing={false}
      />
    );
  }
  
  if (isTableElement(element)) {
    return (
      <TableElement 
        element={element} 
        isSelected={isSelected}
        onSelect={(el) => onElementClick({} as any, el as NonSectionElement)}
        onUpdate={(updates) => onElementUpdate(element.id, updates)}
        stageRef={{ current: null }}
      />
    );
  }

  return null;
};

export const ElementRenderer = React.memo(ElementRendererComponent, (prev, next) => {
  return (
    prev.element.id === next.element.id &&
    (prev.element as any).updatedAt === (next.element as any).updatedAt &&
    prev.isSelected === next.isSelected
  );
});
