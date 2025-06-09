import React, { useCallback, useRef } from 'react';
import { Graphics, Text } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';
import { hexStringToNumber, getThemeColors, getDefaultElementColors } from '../../../lib/theme-utils';

interface StickyNoteProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
  onDoubleClick?: () => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({ element, isSelected, onMouseDown, onDoubleClick }) => {
  const lastClickTime = useRef<number>(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Get theme colors
  const themeColors = getThemeColors();
  const defaultColors = getDefaultElementColors('sticky-note');

  // Draw the sticky note background
  const drawBackground = useCallback((g: any) => {
    g.clear();
    
    const backgroundColor = element.backgroundColor
      ? hexStringToNumber(element.backgroundColor)
      : defaultColors.background;
    g.beginFill(backgroundColor);
    
    // Add a subtle border using theme color
    g.lineStyle(1, defaultColors.border);
    
    // Draw rounded rectangle for sticky note
    g.drawRoundedRect(0, 0, element.width || 200, element.height || 150, 8);
    g.endFill();
    
    // Selection indicator - use theme color
    if (isSelected) {
      g.lineStyle(2, themeColors.selectionBlue, 1);
      g.drawRoundedRect(-2, -2, (element.width || 200) + 4, (element.height || 150) + 4, 10);
    }
  }, [element.width, element.height, element.backgroundColor, isSelected, themeColors.selectionBlue, defaultColors.background, defaultColors.border]);

  const handlePointerDown = useCallback((e: any) => {
    const now = Date.now();
    const timeDiff = now - lastClickTime.current;
    
    if (timeDiff < 300 && onDoubleClick) {
      // Double click detected
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
      }
      e.stopPropagation();
      onDoubleClick();
    } else {
      // Single click - delay to check for double click
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }
      clickTimeout.current = setTimeout(() => {
        if (onMouseDown) {
          onMouseDown(e, element.id);
        }
        clickTimeout.current = null;
      }, 300);
    }
    
    lastClickTime.current = now;
  }, [onMouseDown, onDoubleClick, element.id]);


  // Text style for the sticky note content with theme-aware colors
  const textStyle = {
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: element.fontSize === 'small' ? 12 : element.fontSize === 'large' ? 18 : 14,
    fill: element.color ? hexStringToNumber(element.color) : defaultColors.text,
    wordWrap: true,
    wordWrapWidth: (element.width || 200) - 20, // Padding
    align: element.textAlignment || 'left',
    fontWeight: element.isBold ? 'bold' : 'normal',
    fontStyle: element.isItalic ? 'italic' : 'normal',
  };

  return (
    <>
      {/* Background */}
      <Graphics
        x={element.x}
        y={element.y}
        draw={drawBackground}
        interactive
        pointerdown={handlePointerDown}
        cursor="pointer"
      />
      
      {/* Text content */}
      {element.content && (
        <Text
          x={element.x + 10} // Padding from left
          y={element.y + 10} // Padding from top
          text={element.content}
          style={textStyle}
        />
      )}
    </>
  );
};

export default StickyNote;