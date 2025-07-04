// src/features/canvas/renderers/ElementRenderer.tsx
import React, { useCallback } from 'react';
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
  isConnectorElement,
  ElementId
} from '../types/enhanced.types';
import { RectangleShape } from '../shapes/RectangleShape';
import { CircleShape } from '../shapes/CircleShape';
import { TriangleShape } from '../shapes/TriangleShape';
import { StickyNoteShape } from '../shapes/StickyNoteShape';
import { TextShape } from '../shapes/TextShape';
import { ImageShape } from '../shapes/ImageShape';
import { PenShape } from '../shapes/PenShape';
import { ConnectorShape } from '../shapes/ConnectorShape';
import { TableElement } from '../elements/TableElement';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { calculateSnapLines } from '../utils/snappingUtils';
import { Line } from 'react-konva';
import { isMarkerElement, isHighlighterElement } from '../types/drawing.types';
import { StrokeRenderer } from '../components/renderers/StrokeRenderer';
import { canvasLog } from '../utils/canvasLogger';

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
  const elements = useUnifiedCanvasStore(state => state.elements) as Map<ElementId, CanvasElement>;
  const isSnappingEnabled = useUnifiedCanvasStore(state => state.snapToGrid || false);
  const snapTolerance = useUnifiedCanvasStore(state => 10); // Default snap tolerance
  // Snap lines functionality - temporarily disabled until unified store implements it
  const snapLines: any[] = [];
  const setSnapLines = useCallback((lines: any[]) => {
    // TODO: Implement snap lines in unified store
    canvasLog.debug('Snap lines would be set:', lines);
  }, []);

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isSnappingEnabled) return;

    const draggedElement = { ...element, x: e.target.x(), y: e.target.y() };
    const newSnapLines = calculateSnapLines(draggedElement, Array.from(elements.values()));
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
  }, [isSnappingEnabled, element, elements, snapTolerance, setSnapLines]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setSnapLines([]); // Clear snap lines after drag
    onElementDragEnd(e, element.id);
  }, [onElementDragEnd, element.id, setSnapLines]);

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
    onStartTextEdit: onStartTextEdit,
    konvaProps,
    // REMOVED: onDragEnd - handled by UnifiedEventHandler
  };

  const handleSelect = useCallback(() => {
    onElementClick({ target: { id: () => element.id } } as any, element as NonSectionElement);
  }, [element, onElementClick]);
  
  const handleUpdate = useCallback((updates: Partial<CanvasElement>) => {
    onElementUpdate(element.id, updates);
  }, [element.id, onElementUpdate]);

  const handleUpdateWithId = useCallback((id: ElementId, updates: Partial<CanvasElement>) => {
    onElementUpdate(id, updates);
  }, [onElementUpdate]);

  if (isRectangleElement(element)) {
    return <RectangleShape {...(commonShapeProps as any)} element={element} onSelect={handleSelect} onUpdate={handleUpdate} />;
  }
  if (isCircleElement(element)) {
    return <CircleShape {...(commonShapeProps as any)} element={element} onSelect={handleSelect} onUpdate={handleUpdate} />;
  }
  if (isTriangleElement(element)) {
    return <TriangleShape {...(commonShapeProps as any)} element={element} onSelect={handleSelect} onUpdate={handleUpdate} />;
  }
  if (isConnectorElement(element)) {
    return <ConnectorShape {...(commonShapeProps as any)} element={element} onSelect={handleSelect} onUpdate={handleUpdate} />;
  }
  if (isStickyNoteElement(element)) {
    return <StickyNoteShape {...commonShapeProps} element={element} onUpdate={handleUpdateWithId} />;
  }
  if (isTextElement(element)) {
    return <TextShape {...commonShapeProps} element={element} onUpdate={handleUpdateWithId} />;
  }
  if (isImageElement(element)) {
    return <ImageShape {...commonShapeProps} element={element} onUpdate={handleUpdateWithId} onTransformEnd={() => {}} />;
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
        onSelect={handleSelect}
        isEditing={false}
      />
    );
  }
  
  if (isTableElement(element)) {
    return (
      <TableElement 
        element={element} 
        isSelected={isSelected}
        onSelect={handleSelect}
        onUpdate={handleUpdate}
        stageRef={{ current: null }}
      />
    );
  }

  return null;
};

export const ElementRenderer = React.memo(ElementRendererComponent, (prev, next) => {
  // If the selection status changes, we must re-render.
  if (prev.isSelected !== next.isSelected) {
    return false;
  }

  // If the element's identity changes, we must re-render.
  if (prev.element.id !== next.element.id) {
    return false;
  }

  // For performance, if the updatedAt timestamp is identical, we assume no visual change.
  // This is a safe bet as our store logic updates this on any modification.
  if (prev.element.updatedAt === next.element.updatedAt) {
    return true;
  }

  // As a more robust fallback, do a shallow comparison of critical visual properties.
  const prevEl = prev.element;
  const nextEl = next.element;

  const haveVisualsChanged =
    prevEl.x !== nextEl.x ||
    prevEl.y !== nextEl.y ||
    (prevEl as any).width !== (nextEl as any).width ||
    (prevEl as any).height !== (nextEl as any).height ||
    prevEl.rotation !== nextEl.rotation ||
    (prevEl as any).fill !== (nextEl as any).fill ||
    (prevEl as any).stroke !== (nextEl as any).stroke ||
    (prevEl as any).strokeWidth !== (nextEl as any).strokeWidth ||
    (prevEl as any).opacity !== (nextEl as any).opacity;

  // If none of the critical visual properties have changed, don't re-render.
  return !haveVisualsChanged;
});
