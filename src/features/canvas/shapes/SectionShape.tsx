import React, { useRef, useCallback, useEffect, memo } from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';
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
  const transformerRef = useRef<Konva.Transformer>(null);
  
  const updateSection = useUnifiedCanvasStore(state => state.updateSection);
  
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const target = e.target as Konva.Group;
    updateSection(section.id, { 
      x: target.x(), 
      y: target.y() 
    });
  }, [section.id, updateSection]);

  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    e.cancelBubble = true;
    const node = e.target as Konva.Group;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
      
    updateSection(section.id, {
      width: Math.max(50, (section.width || 100) * scaleX),
      height: Math.max(50, (section.height || 100) * scaleY),
    });
    
    node.scaleX(1);
    node.scaleY(1);
    node.getLayer()?.batchDraw();
  }, [section.id, section.width, section.height, updateSection]);

  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnBackground = e.target.name() === 'section-background';
    if (clickedOnBackground) {
      onSelect(section.id, e);
    }
  }, [section.id, onSelect]);

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
        id={section.id}
        x={section.x}
        y={section.y}
        draggable
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
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
