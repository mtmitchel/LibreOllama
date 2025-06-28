/**
 * Section Handler - Fixes coordinate jumping and enables robust resizing.
 * This component lets Konva's Group handle all coordinate transformations.
 * 
 * Part of LibreOllama Canvas Coordinate System Fixes - Priority 1
 */
import React, { useRef, useCallback, useEffect, memo } from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../../../stores'; // Use adapter from main stores
import type { SectionElement, SectionId, ElementId } from '../../types/enhanced.types';

interface SectionHandlerProps {
  section: SectionElement;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: (id: SectionId) => void;
}

const SectionHandlerComponent: React.FC<SectionHandlerProps> = ({ 
  section, 
  children, 
  isSelected, 
  onSelect 
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  
  // Get section-specific update function instead of element update
  const updateSection = useCanvasStore(state => state.updateSection);
  const updateElement = useCanvasStore(state => state.updateElement);
  
  // When a section is dragged, only its own absolute position is updated.
  // Children move with it automatically thanks to the <Group> transform.
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const target = e.target as Konva.Group;
    updateSection(section.id, { 
      x: target.x(), 
      y: target.y() 
    });
  }, [section.id, updateSection]);

  // Handle child element drag end - this fixes the coordinate jumping issue
  const handleChildElementDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const targetNode = e.target;
    const elementId = targetNode.id() as ElementId;
    
    // Only handle child elements, not the section itself
    if (elementId === (section.id as string) || !elementId) {
      return;
    }
    
    // Get the element's position relative to the section group
    const relativePos = targetNode.position();
    
    // Update the element with its new relative position within the section
    updateElement(elementId, {
      x: relativePos.x,
      y: relativePos.y,
      updatedAt: Date.now()
    });
    
    console.log(`[SectionHandler] Updated child element ${elementId} position:`, relativePos);
  }, [section.id, updateElement]);

  // When resizing, update the section's dimensions and reset the node's scale.
  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Group;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
      // Update section dimensions based on scale
    updateSection(section.id, {
      width: Math.max(50, section.width * scaleX),
      height: Math.max(50, section.height * scaleY),
    });
    
    // Reset scale to prevent compounding transformations
    node.scaleX(1);
    node.scaleY(1);
  }, [section.id, section.width, section.height, updateSection]);

  // Handle section selection
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only select if clicking on the section background, not children
    const clickedOnBackground = e.target.name() === 'section-background';
    if (clickedOnBackground) {
      e.cancelBubble = true;
      onSelect(section.id);
    }
  }, [section.id, onSelect]);

  // Attach transformer for resizing when selected.
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Group
        ref={groupRef}
        x={section.x} // Section's absolute position
        y={section.y}
        draggable
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={handleClick}
        onTap={handleClick} // Touch support
      >
        {/* Section background */}
        <Rect
          name="section-background"
          width={section.width}
          height={section.height}
          fill={section.backgroundColor || '#f0f0f0'}
          stroke={section.borderColor || '#ddd'}
          strokeWidth={section.borderWidth || 1}
          cornerRadius={section.cornerRadius || 8}
          // Add visual feedback for selection
          shadowEnabled={isSelected}
          shadowColor="blue"
          shadowBlur={isSelected ? 10 : 0}
          shadowOpacity={isSelected ? 0.3 : 0}
        />

        {/* Section title if provided */}
        {section.title && (
          <Text
            name="section-title"
            text={section.title}
            x={10}
            y={10}
            fontSize={14}
            fontFamily="Arial"
            fill="#333"
            width={section.width - 20}
            ellipsis={true}
          />
        )}

        {/* Children are rendered inside this group and automatically transformed */}
        {/* We need to wrap children to add dragend handler for child elements */}
        <Group onDragEnd={handleChildElementDragEnd}>
          {children}
        </Group>
      </Group>

      {/* Transformer is placed outside the group and attached when needed */}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          anchorCornerRadius={5}
          anchorStroke="#4A90E2"
          anchorFill="#4A90E2"
          anchorSize={8}
          borderStroke="#4A90E2"
          borderDash={[5, 5]}
          boundBoxFunc={(oldBox, newBox) => {
            // Enforce minimum size constraints
            if (newBox.width < 50 || newBox.height < 50) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

// Memoize component for better performance
const SectionHandler = memo(SectionHandlerComponent, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.section.id === nextProps.section.id &&
    prevProps.section.x === nextProps.section.x &&
    prevProps.section.y === nextProps.section.y &&
    prevProps.section.width === nextProps.section.width &&
    prevProps.section.height === nextProps.section.height &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.children === nextProps.children
  );
});

SectionHandler.displayName = 'SectionHandler';

export default SectionHandler;
export { SectionHandler };