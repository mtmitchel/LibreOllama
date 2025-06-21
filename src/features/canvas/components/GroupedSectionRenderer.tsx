// src/features/canvas/components/GroupedSectionRenderer.tsx
import React, { useMemo, useCallback } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import { SectionShape } from '../shapes/SectionShape';
import { CanvasElement as LegacyCanvasElement } from '../stores/types';
import { SectionElement } from '../../../types/section';
import { ElementRenderer } from './ElementRenderer';
import { CanvasElement as EnhancedCanvasElement } from '../types/enhanced.types';

interface GroupedSectionRendererProps {
  section: SectionElement;
  children: LegacyCanvasElement[];
  isSelected: boolean;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: LegacyCanvasElement) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onElementUpdate: (id: string, updates: Partial<LegacyCanvasElement>) => void;
  onStartTextEdit: (elementId: string) => void;
  onSectionResize?: (sectionId: string, newWidth: number, newHeight: number) => void;
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
  children,
  isSelected,
  onElementClick,
  onElementDragEnd,
  onElementUpdate,
  onStartTextEdit,
  onSectionResize
}) => {
  // Calculate section boundaries for child constraint
  const sectionBounds = useMemo(() => ({
    width: section.width || 300,
    height: section.height || 200,
    titleBarHeight: section.titleBarHeight || 32
  }), [section.width, section.height, section.titleBarHeight]);

  // Create drag bound function for child elements within the section
  const createChildDragBoundFunc = useCallback((childElement: LegacyCanvasElement) => {
    return (pos: { x: number; y: number }) => {
      const elementWidth = childElement.width || 0;
      const elementHeight = childElement.height || 0;
      const padding = 5;

      // Since we're using true Konva Groups, pos is already relative to the section
      const constrainedX = Math.max(
        padding, 
        Math.min(pos.x, sectionBounds.width - elementWidth - padding)
      );
      
      const constrainedY = Math.max(
        sectionBounds.titleBarHeight + padding,
        Math.min(pos.y, sectionBounds.height - elementHeight - padding)
      );

      return { x: constrainedX, y: constrainedY };
    };
  }, [sectionBounds]);

  // Handle child element drag end with relative coordinates
  const handleChildDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    const node = e.target;
    const relativePos = {
      x: node.x(),
      y: node.y()
    };

    // Update the element with its new relative position
    onElementUpdate(elementId, relativePos);
    
    // Also call the parent drag end handler
    onElementDragEnd(e, elementId);
  }, [onElementUpdate, onElementDragEnd]);

  // Render children using the new ElementRenderer component
  const renderedChildren = useMemo(() => {
    return children.map(child => {
      // ElementRenderer expects absolute coordinates for its own logic,
      // but the Konva <Group> handles the relative positioning.
      // We pass the original element so ElementRenderer can handle its type.
      
      // The drag bound function needs to be created for each child
      const dragBoundFunc = createChildDragBoundFunc(child);

      return (
        <ElementRenderer
          key={child.id}
          element={child as EnhancedCanvasElement} // Cast to the enhanced type
          isSelected={false} // Child selection is handled at a higher level
          onElementClick={onElementClick as any} // Cast to satisfy ElementRenderer props
          onElementDragEnd={handleChildDragEnd} // Use the relative drag handler
          onElementUpdate={onElementUpdate as any} // Cast to satisfy ElementRenderer props
          onStartTextEdit={onStartTextEdit}
          // Override Konva props to enforce relative positioning and drag bounds
          overrideKonvaProps={{
            x: (child.x || 0) - (section.x || 0),
            y: (child.y || 0) - (section.y || 0),
            dragBoundFunc: dragBoundFunc,
            draggable: !child.isLocked,
          }}
        />
      );
    });
  }, [children, section.x, section.y, createChildDragBoundFunc, onElementClick, handleChildDragEnd, onElementUpdate, onStartTextEdit]);

  return (
    <Group
      id={`section-group-${section.id}`}
      x={section.x}
      y={section.y}
      draggable={!section.isLocked}
    >
      <SectionShape
        element={section} // Corrected prop: use 'element' instead of 'section'
        isSelected={isSelected}
        onUpdate={onElementUpdate as (id: string, updates: Partial<SectionElement>) => void} // Cast handler
        {...(onSectionResize && { onSectionResize })} // Conditionally pass onSectionResize
        konvaProps={{}}
      >
        {/* Render the actual elements inside the section group */}
        {renderedChildren}
      </SectionShape>
    </Group>
  );
};
