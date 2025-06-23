// src/components/canvas/StickyNoteElement.tsx
import React, { useRef, useCallback } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { CanvasElement } from '../types';
import type { StandardTextFormat } from '../types/richText';
import { designSystem, getStickyNoteColors } from '../../../design-system';
import { richTextManager as UnifiedRichTextManager } from './RichTextSystem/UnifiedRichTextManager'; // Corrected import alias
import { triggerLayerRedraw } from '../utils/canvasRedrawUtils';

interface StickyNoteElementProps {
  element: CanvasElement & { textStyle?: StandardTextFormat };
  isSelected: boolean;
  isEditing?: boolean;
  isDraggable?: boolean;
  onSelect: (id: string, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDoubleClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

const StickyNoteElement = React.forwardRef<Konva.Group, StickyNoteElementProps>(  ({ element, isSelected, isEditing = false, isDraggable = true, onSelect, onDragEnd, onDoubleClick }, ref) => {
  
  // Create a ref to the stage for redraw registration
  const stageRef = useRef<any>(null);  // Default size if not specified
  const width = element.width || 200;
  const height = element.height || 200;

  // Get sticky note colors - default to warning (yellow) if no backgroundColor specified
  const getColors = () => {
    if (element.backgroundColor) {
      // Check if it matches one of our predefined sticky note colors
      const stickyColors = designSystem.colors.stickyNote;
      if (element.backgroundColor === stickyColors.yellow) {
        return getStickyNoteColors('yellow');
      } else if (element.backgroundColor === stickyColors.green) {
        return getStickyNoteColors('green');
      } else if (element.backgroundColor === stickyColors.blue) {
        return getStickyNoteColors('blue');
      } else if (element.backgroundColor === stickyColors.purple) {
        return getStickyNoteColors('purple');
      } else if (element.backgroundColor === stickyColors.orange) {
        return getStickyNoteColors('orange');
      } else {
        // Custom color - use it directly
        return {
          fill: element.backgroundColor,
          stroke: element.backgroundColor
        };
      }
    }
    
    // Default to warning[100] for sticky notes (200 doesn't exist in design system)
    return {
      fill: designSystem.colors.warning[100],
      stroke: designSystem.colors.warning[600]
    };
  };

  const colors = getColors();
  // Create a slightly darker header color by manipulating the hex color
  const darkenColor = (color: string, factor: number = 0.1): string => {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      const darkenValue = (val: number) => Math.max(0, Math.floor(val * (1 - factor)));
      
      return `#${darkenValue(r).toString(16).padStart(2, '0')}${darkenValue(g).toString(16).padStart(2, '0')}${darkenValue(b).toString(16).padStart(2, '0')}`;
    }
    return color; // Return original if not hex
  };

  const headerColor = darkenColor(colors.fill);

  // Handle double click for editing
  const handleDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    // onDoubleClick(e); // This will now be handled by KonvaCanvas to set isEditing
    if (onDoubleClick) onDoubleClick(e); // Propagate if needed for other selection logic
  }, [onDoubleClick]);

  // Handle single click for selection
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect(element.id, e);
  }, [onSelect, element.id]);

  // Handle drag end
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    onDragEnd(e);
  }, [onDragEnd]);

  // Rich text rendering logic
  const hasRichTextSegments = element.richTextSegments && element.richTextSegments.length > 0;
  const hasBasicText = element.text && element.text.trim() !== '';
  const hasContent = hasRichTextSegments || hasBasicText;
  
  // Get display text - prioritize rich text segments, fallback to basic text
  const getDisplayText = () => {
    if (hasRichTextSegments) {
      return UnifiedRichTextManager.segmentsToPlainText(element.richTextSegments!);
    }
    return hasBasicText ? element.text! : '';
  };
    const displayText = getDisplayText();

  if (isEditing) {
    return null; // KonvaCanvas will handle rendering the editor
  }
  return (
    <Group
      ref={ref}
      id={element.id}
      x={element.x}
      y={element.y}
      draggable={isDraggable}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragEnd={handleDragEnd}
    >
      {/* Drop shadow */}
      <Rect
        x={4}
        y={8}
        width={width}
        height={height}
        fill="rgba(0,0,0,0.15)"
        cornerRadius={designSystem.borderRadius.md}
        blur={8}
        listening={false}
      />

      {/* Main body */}
      <Rect
        width={width}
        height={height}
        fill={colors.fill}
        stroke={isSelected ? designSystem.colors.primary[500] : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        cornerRadius={designSystem.borderRadius.md}
        shadowColor="rgba(0,0,0,0.15)"
        shadowBlur={8}
        shadowOffsetY={4}
        shadowOpacity={1}
      />

      {/* Header bar (subtle top section) */}
      <Rect
        width={width}
        height={8}
        fill={headerColor}
        cornerRadius={[designSystem.borderRadius.md, designSystem.borderRadius.md, 0, 0]}
        listening={false}
      />

      {/* Rich text content rendering */}
      {hasContent && hasRichTextSegments && (
        element.richTextSegments!.map((segment, index) => {
          // Calculate text positioning for each segment
          // For now, render segments sequentially. In a full implementation,
          // you might want to calculate exact positioning based on text flow
          const segmentY = 20 + (index * (segment.fontSize || 14) * 1.4);
          
          // FIXED: Properly combine fontStyle and fontWeight for Konva
          let konvaFontStyle = segment.fontStyle || 'normal';
          if (segment.fontWeight === 'bold') {
            konvaFontStyle = konvaFontStyle === 'italic' ? 'bold italic' : 'bold';
          } else if (segment.fontWeight === 'normal' && konvaFontStyle === 'italic') {
            // Ensure 'normal' fontWeight with 'italic' style is just 'italic'
            konvaFontStyle = 'italic';
          }
          
          return (
            <Text
              key={index}
              x={10} // Basic padding
              y={segmentY} // Calculated Y position
              width={width - 32}
              height={height - 40}
              text={segment.text}
              fontSize={segment.fontSize || element.fontSize || 14}
              fontFamily={segment.fontFamily || element.fontFamily || designSystem.typography.fontFamily.sans}
              fill={segment.fill || element.textColor || designSystem.colors.secondary[900]}
              fontStyle={konvaFontStyle}
              textDecoration={segment.textDecoration || element.textDecoration || 'none'}
              align={element.textAlign || 'left'}
              verticalAlign="top"
              wrap="word"
              lineHeight={1.4}
              listening={false}
            />
          );
        })
      )}
      
      {/* FIXED: Trigger layer redraw after rich text segments are rendered */}
      {hasContent && hasRichTextSegments && (() => {
        // Immediate redraw to ensure rich text segments are visible
        if (stageRef.current) {
          triggerLayerRedraw({ current: stageRef.current }, { immediate: true, debug: false });
        }
        return null;
      })()}

      {/* Fallback to basic text if no rich text segments */}
      {hasContent && !hasRichTextSegments && (
        <Text
          x={16}
          y={20}
          width={width - 32}
          height={height - 40}
          text={displayText}
          fontSize={element.fontSize || 14}
          fontFamily={element.fontFamily || designSystem.typography.fontFamily.sans}
          fill={element.textColor || designSystem.colors.secondary[900]}
          fontStyle={element.fontStyle || 'normal'}
          textDecoration={element.textDecoration || 'none'}
          align={element.textAlign || 'left'}
          verticalAlign="top"
          wrap="word"
          lineHeight={1.4}
          listening={false}
        />
      )}

      {/* Placeholder text when no content */}
      {!hasContent && (
        <Text
          x={16}
          y={20}
          width={width - 32}
          height={height - 40}
          text="Double-click to add text"
          fontSize={14}
          fontFamily={designSystem.typography.fontFamily.sans}
          fill="rgba(0, 0, 0, 0.4)"
          fontStyle="italic"
          align="left"
          verticalAlign="top"
          wrap="word"
          lineHeight={1.4}
          listening={false}
        />
      )}

      {/* Selection border overlay */}
      {isSelected && (
        <Rect
          width={width}
          height={height}
          fill="transparent"
          stroke={designSystem.colors.primary[500]}
          strokeWidth={2}
          cornerRadius={designSystem.borderRadius.md}
          listening={false}          dash={[8, 4]}
        />
      )}
    </Group>
  );
});

StickyNoteElement.displayName = 'StickyNoteElement';

export default StickyNoteElement;
