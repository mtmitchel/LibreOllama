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
import { calculateSnapLines, applySnapping } from '../utils/snappingUtils';
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
  // Snap lines functionality
  const snapLines = useUnifiedCanvasStore(state => state.snapLines);
  const setSnapLines = useUnifiedCanvasStore(state => state.setSnapLines);

  // Handle drag move with snapping - declared before use
  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isSnappingEnabled) return;
    
    const node = e.target;
    const newPosition = { x: node.x(), y: node.y() };
    const allElements = Array.from(elements.values()).filter(el => el.id !== element.id);
    
    const snappingResult = applySnapping(element, newPosition, allElements);
    
    if (snappingResult.snapped) {
      node.position({ x: snappingResult.x, y: snappingResult.y });
      setSnapLines([]); // For now, just clear snap lines as they're managed elsewhere
    } else {
      setSnapLines([]);
    }
  }, [isSnappingEnabled, elements, element, setSnapLines]);

  const konvaProps = {
      id: element.id,
      x: element.x, // These are relative coordinates when inside a section
      y: element.y, // These are relative coordinates when inside a section
      rotation: element.rotation || 0,
      draggable: !element.isLocked && !isPenElement(element), // Pen elements should never be draggable
      onDragMove: handleDragMove,
      onDragEnd: (e: any) => onElementDragEnd(e, element.id), // Fix 'any' type issue
      ...overrideKonvaProps
  };

  const commonShapeProps = {
    isSelected,
    onStartTextEdit: onStartTextEdit,
    konvaProps,
    // REMOVED: onDragEnd - handled by CanvasEventManager
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
        onUpdate={handleUpdateWithId}
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

  // OPTIMIZATION: Since our store ensures immutable updates (creates new object references),
  // we can use simple reference equality for maximum performance.
  // This avoids expensive property comparisons with large element sets (2000+).
  if (prev.element === next.element && 
      prev.onElementClick === next.onElementClick &&
      prev.onElementDragEnd === next.onElementDragEnd &&
      prev.onElementUpdate === next.onElementUpdate &&
      prev.onStartTextEdit === next.onStartTextEdit) {
    return true; // No re-render needed
  }

  return false; // Re-render needed
});
// Archived (2025-09-01): Legacy react-konva element renderer.
