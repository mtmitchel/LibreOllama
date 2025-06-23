// src/features/canvas/layers/MainLayer.tsx
import React, { useMemo, useCallback } from 'react';
import { Group, Line } from 'react-konva';
import Konva from 'konva';
import { 
  CanvasElement, 
  ElementId, 
  SectionId, 
  isSectionElement, 
  isRectangleElement,
  isCircleElement,
  isRectangularElement, 
  SectionElement
} from '../types/enhanced.types';
import { designSystem } from '../../../design-system';
import { TextShape } from '../shapes/TextShape';
import { ImageShape } from '../shapes/ImageShape';
import { StickyNoteShape } from '../shapes/StickyNoteShape';
import { StarShape } from '../shapes/StarShape';
import { TriangleShape } from '../shapes/TriangleShape';
import { PenShape } from '../shapes/PenShape';
import { SectionShape } from '../shapes/SectionShape';
import { EditableNode } from '../shapes/EditableNode';
import { EnhancedTableElement } from '../components/EnhancedTableElement';
import { ConnectorRenderer } from '../components/ConnectorRenderer';
import KonvaErrorBoundary from '../components/KonvaErrorBoundary';
import { optimizeLayerProps } from '../utils/events';
import { useCanvasStore } from '../stores/canvasStore.enhanced';

interface MainLayerProps {
  name?: string;
  elements: CanvasElement[];
  selectedElementIds: Set<ElementId | SectionId>;
  selectedTool: string;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementDragStart?: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => void;
  onElementDragMove?: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => void;
  onElementUpdate: (id: ElementId | SectionId, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
  onSectionResize?: (sectionId: SectionId, newWidth: number, newHeight: number) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null>;
  isDrawing?: boolean;
  currentPath?: number[];
  onLayerDraw?: () => void;
  elementsBySection?: Map<SectionId, CanvasElement[]>;
}

export const MainLayer: React.FC<MainLayerProps> = ({
  name,
  elements,
  selectedElementIds,
  selectedTool,
  onElementClick,
  onElementDragStart,
  onElementDragEnd,
  onElementDragMove,
  onElementUpdate,
  onStartTextEdit,
  onSectionResize,
  stageRef,
  isDrawing = false,
  currentPath = [],
  onLayerDraw,
  elementsBySection
}) => {
  const elementsMap = useCanvasStore((state) => state.elements);

  const getSection = useCallback((sectionId: SectionId): SectionElement | undefined => {
    const el = elementsMap.get(sectionId);
    return el && isSectionElement(el) ? el : undefined;
  }, [elementsMap]);

  const createDragBoundFunc = useCallback((element: CanvasElement) => {
    return (pos: { x: number; y: number }) => {
      if (!element.sectionId) {
        return pos;
      }
      const section = getSection(element.sectionId);
      if (!section) {
        return pos;
      }

      const elementWidth = isRectangularElement(element) ? element.width : 0;
      const elementHeight = isRectangularElement(element) ? element.height : 0;

      const relativeX = pos.x - section.x;
      const relativeY = pos.y - section.y;

      const padding = 5;
      const minX = padding;
      const maxX = section.width - elementWidth - padding;
      const minY = padding;
      const maxY = section.height - elementHeight - padding;

      const constrainedRelativeX = Math.max(minX, Math.min(maxX, relativeX));
      const constrainedRelativeY = Math.max(minY, Math.min(maxY, relativeY));

      return {
        x: section.x + constrainedRelativeX,
        y: section.y + constrainedRelativeY
      };
    };
  }, [getSection]);

  const optimizedProps = useMemo(() => optimizeLayerProps({}), []);

  const renderElement = useCallback((element: CanvasElement) => {
    const isSelected = selectedElementIds.has(element.id);
    const isEditing = false; // This will be handled by text editing overlay

    // Elements should be draggable when select tool is active or when the element is selected
    const isDraggable = !isEditing &&
      selectedTool === 'select' && // Only draggable in select mode for better UX
      !element.isLocked &&
      !(element.sectionId && selectedElementIds.has(element.sectionId));

    // Calculate rendering position based on section membership
    const section = element.sectionId ? getSection(element.sectionId) : null;
    const renderX = section ? section.x + element.x : element.x;
    const renderY = section ? section.y + element.y : element.y;

    // Common props for Konva shapes
    const konvaElementProps: any = {
      id: element.id,
      x: renderX,
      y: renderY,
      draggable: isDraggable,
      dragBoundFunc: isDraggable ? createDragBoundFunc(element) : undefined,
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => onElementClick(e, element),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onElementDragEnd(e, element.id),
      opacity: 1,
      stroke: isSelected ? designSystem.colors.primary[500] : (element as any).stroke,
      strokeWidth: isSelected ? (((element as any).strokeWidth || 1) + 1.5) : ((element as any).strokeWidth || 1),
      shadowColor: isSelected ? designSystem.colors.primary[300] : undefined,
      shadowBlur: isSelected ? 10 : 0,
      shadowOpacity: isSelected ? 0.7 : 0,
      perfectDrawEnabled: false,
    };

    // For basic shapes (rectangle, circle), use EditableNode wrapper pattern
    if (isRectangleElement(element) || isCircleElement(element)) {
      return (
        <KonvaErrorBoundary key={`${element.id}-editable-boundary`}>
          <EditableNode
            key={element.id}
            element={element as any}
            isSelected={isSelected}
            selectedTool={selectedTool}
            onElementClick={onElementClick as any}
            onElementDragEnd={onElementDragEnd as any}
            onElementUpdate={onElementUpdate as any}
            onStartTextEdit={onStartTextEdit as any}
            {...(onElementDragStart && { onElementDragStart: onElementDragStart as any })}
            {...(onElementDragMove && { onElementDragMove: onElementDragMove as any })}
          />
        </KonvaErrorBoundary>
      );
    }

    // For complex shapes, use existing individual shape components
    switch (element.type) {
      case 'text':
        return (
          <KonvaErrorBoundary key={`${element.id}-text-boundary`}>
            <TextShape
              key={element.id}
              element={element as any}
              konvaProps={konvaElementProps}
              onUpdate={onElementUpdate as any}
              stageRef={stageRef}
              isSelected={isSelected}
              onStartTextEdit={onStartTextEdit as any}
            />
          </KonvaErrorBoundary>
        );
      case 'sticky-note':
        return (
          <KonvaErrorBoundary key={`${element.id}-sticky-boundary`}>
            <StickyNoteShape
              key={element.id}
              element={element as any}
              konvaProps={konvaElementProps}
              onUpdate={onElementUpdate as any}
              stageRef={stageRef}
              isSelected={isSelected}
              onStartTextEdit={onStartTextEdit as any}
            />
          </KonvaErrorBoundary>
        );
      case 'pen':
        return (
          <PenShape
            key={element.id}
            element={element}
            konvaProps={konvaElementProps}
          />
        );
      case 'star':
        return (
          <StarShape
            key={element.id}
            element={element}
            konvaProps={konvaElementProps}
            isSelected={isSelected}
            onUpdate={onElementUpdate as any}
            onStartTextEdit={onStartTextEdit as any}
          />
        );
      case 'triangle':
        return (
          <TriangleShape
            key={element.id}
            element={element}
            konvaProps={konvaElementProps}
            isSelected={isSelected}
            onUpdate={onElementUpdate as any}
            onStartTextEdit={onStartTextEdit as any}
          />
        );
      case 'image':
        return (
          <ImageShape
            key={element.id}
            element={element as any}
            konvaProps={konvaElementProps}
            isSelected={isSelected}
            onUpdate={onElementUpdate as any}
            onStartTextEdit={onStartTextEdit as any}
          />
        );
      case 'connector':
        return (
          <KonvaErrorBoundary key={`${element.id}-connector-boundary`}>
            <ConnectorRenderer
              key={element.id}
              element={element as any}
              isSelected={isSelected}
              onSelect={() => {
                const fakeEvent = { target: stageRef?.current } as unknown as Konva.KonvaEventObject<MouseEvent>;
                onElementClick(fakeEvent, element);
              }}
              onUpdate={onElementUpdate as any}
              elements={Object.fromEntries(elementsMap.entries()) as any}
              sections={new Map(Array.from(elementsMap.values()).filter(isSectionElement).map(s => [s.id, s])) as any}
            />
          </KonvaErrorBoundary>
        );
      case 'section':
        const sectionChildren = elementsBySection?.get(element.id) || [];
        const sectionKonvaProps = {
          ...konvaElementProps,
          onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
            const newSectionX = e.target.x();
            const newSectionY = e.target.y();
            onElementUpdate(element.id, { x: newSectionX, y: newSectionY });
            onElementDragEnd(e, element.id);
          }
        };
        return (
          <SectionShape
            key={element.id}
            element={element as any}
            isSelected={isSelected}
            konvaProps={sectionKonvaProps}
            onUpdate={onElementUpdate as any}
            onStartTextEdit={onStartTextEdit as any}
            onSectionResize={onSectionResize ? (id, w, h) => onSectionResize(id as SectionId, w, h) : (() => {})}>
            {sectionChildren.map(childElement => renderElement(childElement))}
          </SectionShape>
        );
      case 'table':
        return (
          <KonvaErrorBoundary key={`${element.id}-error-boundary`}>
            <EnhancedTableElement
              key={element.id}
              element={element as any}
              isSelected={isSelected}
              onSelect={(el) => {
                const fakeEvent = { target: stageRef?.current } as unknown as Konva.KonvaEventObject<MouseEvent>;
                onElementClick(fakeEvent, el as CanvasElement);
              }}
              onUpdate={(updates) => {
                onElementUpdate(element.id, updates as Partial<CanvasElement>);
              }}
              onDragEnd={(e) => onElementDragEnd(e, element.id)}
              stageRef={stageRef || { current: null }}
            />
          </KonvaErrorBoundary>
        );
      default:
        console.warn('Unhandled element type in MainLayer:', (element as any).type);
        return null;
    }
  }, [selectedElementIds, selectedTool, onElementClick, onElementDragEnd, onElementUpdate, onStartTextEdit, onSectionResize, stageRef, elementsMap, elementsBySection, getSection, createDragBoundFunc]);

  // Effect to trigger layer redraw when needed
  React.useEffect(() => {
    if (onLayerDraw) {
      onLayerDraw();
    }
  }, [elements.length, onLayerDraw]);

  // Use robust rendering pattern to eliminate whitespace issues
  const validElements = elements.filter(Boolean); // Filter out any undefined elements first
  const elementNodes = validElements.map(renderElement);

  // Drawing line component for active drawing state - add key to prevent React warning
  const drawingLine = isDrawing && currentPath.length > 0 ? (
    <Line
      key="drawing-line"
      points={currentPath}
      stroke={designSystem.colors.primary[500]}
      strokeWidth={3}
      lineCap="round"
      lineJoin="round"
      listening={false}
    />
  ) : null;

  // Combine all nodes into single array, filtering out any null values
  const allNodes = elementNodes.filter(Boolean);
  if (drawingLine) {
    allNodes.push(drawingLine);
  }

  return (
    <Group {...optimizedProps} name={name || "main-group"}>
      <KonvaErrorBoundary>
        {allNodes}
      </KonvaErrorBoundary>
    </Group>
  );
};

