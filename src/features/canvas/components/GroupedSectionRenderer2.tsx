// src/features/canvas/components/GroupedSectionRenderer.tsx
import React, { useMemo, useCallback } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import { SectionShape } from '../shapes/SectionShape';
import { CanvasElement } from '../stores/types';
import { SectionElement } from '../../../types/section';
import { renderElement } from '../utils/elementRenderer';
import { CoordinateService } from '../utils/coordinateService';

interface GroupedSectionRendererProps {
  section: SectionElement;
  children: CanvasElement[];
  isSelected: boolean;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onSectionUpdate: (id: string, updates: Partial<SectionElement>) => void;
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
  onElementUpdate,  onSectionUpdate,
  onStartTextEdit,
  onSectionResize
}) => {  // Create drag bound function for child elements within the section
  const createChildDragBoundFunc = useCallback((childElement: CanvasElement) => {
    return (pos: { x: number; y: number }) => {
      console.log(`[DragBound] Element ${childElement.id}: received pos(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
      
      const sectionX = section.x || 0;
      const sectionY = section.y || 0;
      
      // Always assume we're receiving absolute coordinates and convert to section-relative
      // This is more reliable than trying to detect coordinate space
      const sectionRelativePos = {
        x: pos.x - sectionX,
        y: pos.y - sectionY
      };
      
      console.log(`[DragBound] Converting to section-relative:`, {
        absolute: pos,
        relative: sectionRelativePos,
        sectionOffset: { x: sectionX, y: sectionY }
      });      // Apply section-relative constraints
      const constrainedPos = CoordinateService.constrainToSection(
        sectionRelativePos,
        childElement,
        section,
        5 // Reduced padding for more freedom of movement
      );

      // Convert back to absolute coordinates for Konva
      const finalPos = {
        x: constrainedPos.x + sectionX,
        y: constrainedPos.y + sectionY
      };
      
      console.log(`[DragBound] Converting back to absolute:`, {
        relative: constrainedPos,
        absolute: finalPos
      });

      // Debug logging to understand constraint behavior
      if (pos.x !== finalPos.x || pos.y !== finalPos.y) {
        console.log(`[DragBound] Element ${childElement.id}: requested(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) -> constrained(${finalPos.x.toFixed(1)}, ${finalPos.y.toFixed(1)})`);
      }

      return finalPos;
    };
  }, [section]);  // Handle child element drag end with relative coordinates
  const handleChildDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    const node = e.target;
    
    // Get the absolute position on the stage
    const absolutePos = node.absolutePosition();
    
    // Convert to section-relative coordinates for storage
    const relativePos = {
      x: absolutePos.x - (section.x || 0),
      y: absolutePos.y - (section.y || 0)
    };

    // Sanitize the coordinates to prevent precision issues
    const sanitizedPos = CoordinateService.sanitizeCoordinates(relativePos);

    console.log(`[GroupedSectionRenderer] Child ${elementId} drag end:`, {
      absolute: absolutePos,
      relative: relativePos,
      sanitized: sanitizedPos
    });

    // Update the element with its new relative position
    onElementUpdate(elementId, sanitizedPos);
    
    // Call the parent drag end handler with absolute coordinates for section detection
    onElementDragEnd(e, elementId);
  }, [onElementUpdate, onElementDragEnd, section.x, section.y]);// Render child elements with proper Konva shapes
  const renderedChildren = useMemo(() => {
    console.log(`[GroupedSectionRenderer] Rendering ${children.length} children for section ${section.id}`);
      return children.map(child => {
      // Child coordinates are already relative to section when child has sectionId
      // No need to convert - use them directly for positioning within the section Group
      const relativeX = child.x || 0;
      const relativeY = child.y || 0;

      console.log(`[GroupedSectionRenderer] Child ${child.id}: using relative(${relativeX}, ${relativeY}) directly (no conversion needed)`);

      return (
        <Group
          key={child.id}
          x={relativeX}
          y={relativeY}
          draggable={true}
          dragBoundFunc={createChildDragBoundFunc(child)}
          onDragEnd={(e) => handleChildDragEnd(e, child.id)}
          onClick={(e) => onElementClick(e, child)}
        >
          {/* Render the actual element shape at (0,0) since Group handles positioning */}
          {renderElement({
            element: {
              ...child,
              x: 0, // Position is handled by the Group
              y: 0  // Position is handled by the Group
            },
            isSelected: false, // Selection is handled at group level for now
            onElementClick: () => {}, // Click is handled by Group
            onElementDragEnd: () => {}, // Drag is handled by Group
            onElementUpdate: onElementUpdate,
            onStartTextEdit: onStartTextEdit,
            draggable: false, // Dragging is handled by Group
            sectionContext: {
              sectionId: section.id,
              isInSection: true
            }
          })}
        </Group>
      );
    });
  }, [
    children, 
    section.x, 
    section.y, 
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
      draggable={true}      onDragEnd={(e) => {
        const node = e.target;
        onSectionUpdate(section.id, {
          x: node.x(),
          y: node.y()
        });
        onElementDragEnd(e, section.id);
      }}
    >
      {/* Section background and UI - positioned at (0,0) relative to group */}
      <SectionShape
        element={{
          ...section,
          x: 0, // Always 0 since the Group handles absolute positioning
          y: 0  // Always 0 since the Group handles absolute positioning
        }}
        isSelected={isSelected}
        konvaProps={{
          listening: true
        }}
        onUpdate={onElementUpdate}
        onStartTextEdit={onStartTextEdit}
        onSectionResize={onSectionResize || (() => {})}
      />
      
      {/* Child elements with relative positioning */}
      {renderedChildren}
    </Group>
  );
};
