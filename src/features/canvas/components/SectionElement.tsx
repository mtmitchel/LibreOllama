import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { SectionElement as SectionType } from '../types/section';
import { findSectionByPosition } from '../utils/sectionUtils';
import { useCanvasStore } from '../stores';

interface SectionElementProps {
  section: SectionType;
  onUpdate: (id: string, updates: Partial<SectionType>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, id: string) => void;
  onSectionChange: (elementId: string, newSectionId: string | null) => void;
  children: React.ReactNode;
}

const SectionElement = React.forwardRef<Konva.Group, SectionElementProps>(({ section, onUpdate, onDragEnd, onSectionChange, children }, ref) => {
  const sections = useCanvasStore((state) => state.sections);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const position = e.target.getAbsolutePosition();
    const newSectionId = findSectionByPosition(sections, position);
    if (newSectionId !== section.id) {
      useCanvasStore.getState().moveElementBetweenSections(e.target.id(), section.id, newSectionId);
    }
  };

  return (
    <Group
      ref={ref}
      id={section.id}
      x={section.x}
      y={section.y}
      draggable
      onDragEnd={(e) => onDragEnd(e, section.id)}
      onDragMove={handleDragMove}
    >
      <Rect
        width={section.width}
        height={section.height}
        fill="rgba(0, 0, 255, 0.1)"
        stroke="#6366F1"
        strokeWidth={2}
        listening={true}
      />
      <Text text={section.title} />
      {children}
    </Group>
  );
});

SectionElement.displayName = 'SectionElement';

export default SectionElement;