import React, { useCallback } from 'react';
import { Graphics, Text } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';

interface StickyNoteProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({ element, isSelected, onMouseDown }) => {
  // Convert hex color to number for Pixi
  const hexToNumber = (hex: string | undefined): number => {
    if (!hex) return 0xFFFFE0; // Default sticky note yellow
    const cleaned = hex.replace('#', '');
    return parseInt(cleaned, 16);
  };

  // Draw the sticky note background
  const drawBackground = useCallback((g: any) => {
    g.clear();
    
    const backgroundColor = hexToNumber(element.backgroundColor || '#FFFFE0');
    g.beginFill(backgroundColor);
    
    // Add a subtle border
    g.lineStyle(1, 0xE0E0E0);
    
    // Draw rounded rectangle for sticky note
    g.drawRoundedRect(0, 0, element.width || 200, element.height || 150, 8);
    g.endFill();
    
    // Selection indicator
    if (isSelected) {
      g.lineStyle(2, 0x007acc, 1);
      g.drawRoundedRect(-2, -2, (element.width || 200) + 4, (element.height || 150) + 4, 10);
    }
  }, [element.width, element.height, element.backgroundColor, isSelected]);

  const handlePointerDown = useCallback((e: any) => {
    if (onMouseDown) {
      onMouseDown(e, element.id);
    }
  }, [onMouseDown, element.id]);

  // Text style for the sticky note content
  const textStyle = {
    fontFamily: 'Arial',
    fontSize: element.fontSize === 'small' ? 12 : element.fontSize === 'large' ? 18 : 14,
    fill: element.color ? hexToNumber(element.color) : 0x000000,
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