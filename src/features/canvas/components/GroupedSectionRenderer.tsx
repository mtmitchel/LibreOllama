// src/features/canvas/components/GroupedSectionRenderer2.tsx
import React, { useMemo, useCallback } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import { SectionShape } from '../shapes/SectionShape';
import { CanvasElement, SectionElement, ElementId, SectionId } from '../types/enhanced.types';
import { renderElement } from '../utils/elementRenderer';
import { CoordinateService } from '../utils/canvasCoordinateService';

interface GroupedSectionRendererProps {
  section: SectionElement;
  elements: CanvasElement[];
  isSelected: boolean;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId | SectionId) => void;
  onElementUpdate: (id: ElementId | SectionId, updates: Partial<CanvasElement>) => void;
  onSectionUpdate: (id: SectionId, updates: Partial<SectionElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
  onSectionResize?: (sectionId: SectionId, newWidth: number, newHeight: number) => void;
}

/**
 * GroupedSectionRenderer - Implements true Konva grouping for sections
 * 
 * This component replaces the manual coordinate conversion approach with proper
 * Konva Groups where:
 * - Section position is set on the Group level
 * - Child elements use relative coordinates within the group
 * - Transforms and movements are handled natively by Konva
 * 
 * Benefits:
 * - ✅ Fixes coordinate system issues (bugs 2.7, 2.8)
 * - ✅ Eliminates manual boundary calculations
 * - ✅ Enables native Konva transformations
 * - ✅ Simplifies event handling
 */
export const GroupedSectionRenderer: React.FC<GroupedSectionRendererProps> = ({
  section,
  elements,
  isSelected,
  onElementClick,
  onElementDragEnd,
  onElementUpdate,
  onSectionUpdate,
  onStartTextEdit,
  onSectionResize
}) => {
  const createChildDragBoundFunc = useCallback((childElement: CanvasElement) => {
    return (pos: { x: number; y: number }) => {
      const sectionX = section.x || 0;
      const sectionY = section.y || 0;
      
      const sectionRelativePos = {
        x: pos.x - sectionX,
        y: pos.y - sectionY
      };
      
      const constrainedPos = CoordinateService.constrainToSection(
        sectionRelativePos,
        childElement,
        section,
        5
      );

      const finalPos = {
        x: constrainedPos.x + sectionX,
        y: constrainedPos.y + sectionY
      };
      
      return finalPos;
    };
  }, [section]);

  const handleChildDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => {
    const node = e.target;
    const absolutePos = node.absolutePosition();
    
    const relativePos = {
      x: absolutePos.x - (section.x || 0),
      y: absolutePos.y - (section.y || 0)
    };

    const sanitizedPos = CoordinateService.sanitizeCoordinates(relativePos);

    onElementUpdate(elementId, sanitizedPos);
    onElementDragEnd(e, elementId);
  }, [onElementUpdate, onElementDragEnd, section.x, section.y]);

  const renderedChildren = useMemo(() => {
    return elements.map(child => {
      const relativeX = child.x || 0;
      const relativeY = child.y || 0;

      return (
        <Group
          key={child.id}
          x={relativeX}
          y={relativeY}
          draggable={true}
          dragBoundFunc={createChildDragBoundFunc(child)}
          onDragEnd={(e) => handleChildDragEnd(e, child.id as ElementId)}
          onClick={(e) => onElementClick(e, child)}
        >
          {renderElement({
            element: {
              ...child,
              x: 0,
              y: 0
            },
            isSelected: false,
            onElementClick: () => {},
            onElementDragEnd: () => {},
            onElementUpdate: onElementUpdate,
            onStartTextEdit: () => onStartTextEdit(child.id as ElementId),
            draggable: false,
            sectionContext: {
              sectionId: section.id,
              isInSection: true
            }
          })}
        </Group>
      );
    });
  }, [
    elements, 
    section.id,
    onElementClick,
    onElementUpdate,
    onStartTextEdit,
    createChildDragBoundFunc,
    handleChildDragEnd
  ]);

  return (
    <Group
      id={`section-group-${section.id}`}
      x={section.x || 0}
      y={section.y || 0}
      draggable={true}
      onDragEnd={(e) => {
        const node = e.target;
        onSectionUpdate(section.id, {
          x: node.x(),
          y: node.y()
        });
        onElementDragEnd(e, section.id);
      }}
    >
      <SectionShape
        element={{
          ...section,
          x: 0,
          y: 0,
          title: section.title || ''
        } as any}
        isSelected={isSelected}
        konvaProps={{
          listening: true
        }}
        onUpdate={onElementUpdate as any}
        onStartTextEdit={onStartTextEdit as any}
        onSectionResize={onSectionResize as any}
      />
      {renderedChildren}
    </Group>
  );
};

GroupedSectionRenderer.displayName = 'GroupedSectionRenderer';
