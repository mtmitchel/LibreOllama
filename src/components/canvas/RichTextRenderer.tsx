// src/components/canvas/RichTextRenderer.tsx
import React, { useRef, useEffect } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, RichTextSegment } from '../../stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';
import SelectableText from './SelectableText';

export type RichTextElementType = CanvasElement & {
  type: 'rich-text';
  segments: RichTextSegment[];
  width?: number;
};

interface RichTextRendererProps extends Omit<Konva.GroupConfig, 'children'> {
  element: RichTextElementType;
  isEditing: boolean;
  onTextUpdate: (id: string, text: string) => void;
  onEditingCancel: () => void;
  onFormatChange: (elementId: string, format: Partial<RichTextSegment>, selection: { start: number; end: number }) => void;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  element,
  isEditing,
  onTextUpdate,
  onEditingCancel,
  onFormatChange,
  ...groupProps
}) => {
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    if (isEditing || !groupRef.current || !element.segments) return;

    const group = groupRef.current;
    group.destroyChildren();

    let currentX = 0;
    let currentY = 0;
    const defaultLineHeight = (element.fontSize || designSystem.typography.fontSize.base) * 1.4;

    element.segments.forEach((segment) => {
      const fontSize = segment.fontSize || element.fontSize || designSystem.typography.fontSize.base;
      const lineHeight = fontSize * 1.4;

      const textNode = new Konva.Text({
        x: currentX,
        y: currentY,
        text: segment.text,
        fontSize,
        fontFamily: segment.fontFamily || element.fontFamily || designSystem.typography.fontFamily.sans,
        fontStyle: segment.fontStyle || 'normal',
        textDecoration: segment.textDecoration || '',
        fill: segment.fill || element.fill || designSystem.colors.secondary[700],
      });

      if (segment.url) {
        textNode.on('click tap', () => window.open(segment.url, '_blank'));
        textNode.on('mouseenter', () => {
          const stage = group.getStage();
          if (stage) stage.container().style.cursor = 'pointer';
        });
        textNode.on('mouseleave', () => {
          const stage = group.getStage();
          if (stage) stage.container().style.cursor = 'default';
        });
      }

      group.add(textNode);
      currentX += textNode.width();

      if (element.width && currentX > element.width) {
        currentX = 0;
        currentY += Math.max(lineHeight, defaultLineHeight);
        textNode.y(currentY);
        textNode.x(currentX);
        currentX += textNode.width();
      }
    });

    group.getLayer()?.batchDraw();
  }, [element, isEditing]);

  if (isEditing) {
    const plainText = element.segments.map((s) => s.text).join('');
    const textElementForEditing = {
      ...element,
      type: 'text' as const,
      text: plainText,
      fontSize: element.fontSize || designSystem.typography.fontSize.base,
      fontFamily: element.fontFamily || designSystem.typography.fontFamily.sans,
      fill: element.fill || designSystem.colors.secondary[700],
    };

    return (
      <SelectableText
        element={textElementForEditing}
        isEditing={true}
        onTextUpdate={onTextUpdate}
        onEditingCancel={onEditingCancel}
        onFormatChange={onFormatChange}
        {...groupProps}
      />
    );
  }

  return <Group ref={groupRef} id={element.id} x={element.x} y={element.y} {...groupProps} />;
};

export default RichTextRenderer;
