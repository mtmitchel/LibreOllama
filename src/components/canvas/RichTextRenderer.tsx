// src/components/canvas/RichTextRenderer.tsx
import React, { useRef, useEffect } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, RichTextSegment } from '../../stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';
import UnifiedTextElement from './UnifiedTextElement';

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

      // Combine fontStyle and fontWeight for Konva
      let combinedFontStyle = segment.fontStyle || 'normal';
      if (segment.fontWeight === 'bold') {
        combinedFontStyle = combinedFontStyle === 'italic' ? 'bold italic' : 'bold';
      }

      const textNode = new Konva.Text({
        x: currentX,
        y: currentY,
        text: segment.text,
        fontSize,
        fontFamily: segment.fontFamily || element.fontFamily || designSystem.typography.fontFamily.sans,
        fontStyle: combinedFontStyle,
        textDecoration: segment.textDecoration || '',
        fill: segment.fill || element.fill || designSystem.colors.secondary[700],
        align: element.textAlign || 'left',
        width: element.width
      });

      if (segment.url) {
        let clickTimeout: number | null = null;
        
        // Store event handlers for cleanup
        const clickHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
          // Clear any existing timeout
          if (clickTimeout) {
            window.clearTimeout(clickTimeout);
            clickTimeout = null;
            return; // This is a double-click, don't open URL
          }
          
          // Set a timeout to detect single vs double click
          clickTimeout = window.setTimeout(() => {
            if (segment.url) window.open(segment.url, '_blank');
            clickTimeout = null;
          }, 300); // 300ms delay to detect double-click
        };
        
        const dblClickHandler = (e: Konva.KonvaEventObject<MouseEvent>) => {
          // Clear the single-click timeout on double-click
          if (clickTimeout) {
            window.clearTimeout(clickTimeout);
            clickTimeout = null;
          }
          // Let the double-click event bubble up for editing
        };
        
        const mouseEnterHandler = () => {
          const stage = group.getStage();
          if (stage) stage.container().style.cursor = 'pointer';
        };
        
        const mouseLeaveHandler = () => {
          const stage = group.getStage();
          if (stage) stage.container().style.cursor = 'default';
        };
        
        // Add event listeners
        textNode.on('click tap', clickHandler);
        textNode.on('dblclick', dblClickHandler);
        textNode.on('mouseenter', mouseEnterHandler);
        textNode.on('mouseleave', mouseLeaveHandler);
        
        // Store cleanup function on the node for later use
        (textNode as any)._cleanupEvents = () => {
          if (clickTimeout) window.clearTimeout(clickTimeout);
          textNode.off('click tap', clickHandler);
          textNode.off('dblclick', dblClickHandler);
          textNode.off('mouseenter', mouseEnterHandler);
          textNode.off('mouseleave', mouseLeaveHandler);
        };
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
      textAlign: element.textAlign
    };

    return (
      <UnifiedTextElement
        element={{
          ...textElementForEditing,
          type: 'text'
        }}
        isSelected={true}
        onUpdate={(elementId, updates) => {
          if (onTextUpdate && updates.text !== undefined) {
            onTextUpdate(elementId, updates.text);
          }
        }}
        onSelect={() => {}}
        onStartEdit={() => {}}
        konvaProps={groupProps}
      />
    );
  }

  return <Group ref={groupRef} id={element.id} x={element.x} y={element.y} {...groupProps} />;
};

export default RichTextRenderer;
