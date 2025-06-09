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
  
  // Get theme colors
  const themeColors = getThemeColors();
  const defaultColors = getDefaultElementColors('sticky-note');

  // Draw the sticky note background
  const drawBackground = useCallback((g: any) => {
    g.clear();
    
    // Validate dimensions with safety checks
    const width = Math.max(element.width || 200, 50); // Minimum width
    const height = Math.max(element.height || 150, 30); // Minimum height
    
    const backgroundColor = element.backgroundColor
      ? hexStringToNumber(element.backgroundColor)
      : defaultColors.background;
    g.beginFill(backgroundColor);
    
    // Add a subtle border using theme color
    g.lineStyle(1, defaultColors.border);
    
    // Draw rounded rectangle for sticky note with validated dimensions
    g.drawRoundedRect(0, 0, width, height, 8);
    g.endFill();
    
    // Selection indicator - use theme color
    if (isSelected) {
      g.lineStyle(2, themeColors.selectionBlue, 1);
      g.drawRoundedRect(-2, -2, width + 4, height + 4, 10);
    }
  }, [element.width, element.height, element.backgroundColor, isSelected, themeColors.selectionBlue, defaultColors.background, defaultColors.border]);

  const handlePointerDown = useCallback((e: any) => {
    // Always handle single click immediately
    if (onMouseDown) {
      onMouseDown(e, element.id);
    }
  }, [onMouseDown, element.id]);

  const handlePointerTap = useCallback((e: any) => {
    // Use Pixi's tap event for double-click detection
    const now = Date.now();
    const timeDiff = now - lastClickTime.current;
    
    if (timeDiff < 300 && onDoubleClick) {
      e.stopPropagation();
      onDoubleClick();
    }
    
    lastClickTime.current = now;
  }, [onDoubleClick]);


  // Text style for the sticky note content with theme-aware colors
  const textStyle = {
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: element.fontSize === 'small' ? 12 : element.fontSize === 'large' ? 18 : 14,
    fill: element.color ? hexStringToNumber(element.color) : defaultColors.text,
    wordWrap: true,
    wordWrapWidth: Math.max((element.width || 200) - 20, 50), // Padding with minimum
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
        pointerdown={handlePointerDown}  // Immediate selection
        pointertap={handlePointerTap}     // Double-click detection
        cursor="pointer"
      />
      
      {/* Text content - always render with fallback */}
      <Text
        x={element.x + 10} // Padding from left
        y={element.y + 10} // Padding from top
        text={element.content || 'Double-click to edit'}
        style={textStyle}
        interactive={false} // Background handles interaction
      />
    </>
  );
};

export default StickyNote;