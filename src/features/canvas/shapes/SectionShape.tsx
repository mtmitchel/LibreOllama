import React, { useRef, useCallback, memo } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import type { SectionElement, SectionId, ElementId } from '../types/enhanced.types';

interface SectionShapeProps {
  section: SectionElement;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: (id: SectionId, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onElementDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: ElementId) => void;
}

const SectionShapeComponent: React.FC<SectionShapeProps> = ({ 
  section, 
  children, 
  isSelected, 
  onSelect,
  onElementDragEnd,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  
  const updateSection = useUnifiedCanvasStore(state => state.updateSection);
  
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const target = e.target as Konva.Group;
    updateSection(section.id, { 
      x: target.x(), 
      y: target.y() 
    });
  }, [section.id, updateSection]);

  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnBackground = e.target.name() === 'section-background';
    if (clickedOnBackground) {
      onSelect(section.id, e);
    }
  }, [section.id, onSelect]);

  return (
    <>
      <Group
        ref={groupRef}
        id={section.id}
        x={section.x}
        y={section.y}
        draggable
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onTap={handleClick}
      >
        <Rect
          name="section-background"
          width={section.width}
          height={section.height}
          fill={section.backgroundColor || '#f0f0f0'}
          stroke={section.borderColor || '#ddd'}
          strokeWidth={section.borderWidth || 1}
          cornerRadius={section.cornerRadius || 8}
          shadowEnabled={isSelected}
          shadowColor="rgba(74, 144, 226, 0.5)"
          shadowBlur={isSelected ? 10 : 0}
          shadowOpacity={isSelected ? 0.9 : 0}
        />
        {section.title && (
          <Text
            name="section-title"
            text={section.title}
            x={10}
            y={10}
            fontSize={14}
            fontFamily="Inter, sans-serif"
            fill="#333"
            width={section.width - 20}
            ellipsis={true}
            listening={false}
          />
        )}
        <Group onDragEnd={(e) => onElementDragEnd(e, e.target.id() as ElementId)}>
          {children}
        </Group>
      </Group>
    </>
  );
};

export const SectionShape = memo(SectionShapeComponent, (prevProps, nextProps) => {
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

SectionShape.displayName = 'SectionShape';
