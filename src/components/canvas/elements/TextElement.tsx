import React, { useCallback } from 'react';
import { Text, Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';

interface TextElementProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const TextElement: React.FC<TextElementProps> = ({ element, isSelected, onMouseDown }) => {
  // Convert hex color to number for Pixi
  const hexToNumber = (hex: string | undefined): number => {
    if (!hex) return 0x000000;
    const cleaned = hex.replace('#', '');
    return parseInt(cleaned, 16);
  };

  // Text style configuration
  const textStyle = {
    fontFamily: 'Arial',
    fontSize: element.fontSize === 'small' ? 12 : element.fontSize === 'large' ? 24 : 16,
    fill: element.color ? hexToNumber(element.color) : 0x000000,
    wordWrap: true,
    wordWrapWidth: element.width || 200,
    align: element.textAlignment || 'left',
    fontWeight: element.isBold ? 'bold' : 'normal',
    fontStyle: element.isItalic ? 'italic' : 'normal',
  };

  // Draw selection background if selected
  const drawSelection = useCallback((g: any) => {
    if (!isSelected) return;
    
    g.clear();
    g.beginFill(0x007acc, 0.1); // Semi-transparent blue
    g.lineStyle(1, 0x007acc, 1);
    
    // Estimate text bounds for selection rectangle
    const textWidth = element.width || 200;
    const textHeight = element.height || 30;
    
    g.drawRect(-2, -2, textWidth + 4, textHeight + 4);
    g.endFill();
  }, [isSelected, element.width, element.height]);

  const handlePointerDown = useCallback((e: any) => {
    if (onMouseDown) {
      onMouseDown(e, element.id);
    }
  }, [onMouseDown, element.id]);

  return (
    <>
      {/* Selection background */}
      {isSelected && (
        <Graphics
          x={element.x}
          y={element.y}
          draw={drawSelection}
        />
      )}
      
      {/* Text content */}
      <Text
        x={element.x}
        y={element.y}
        text={element.content || 'Text'}
        style={textStyle}
        interactive
        pointerdown={handlePointerDown}
        cursor="text"
      />
    </>
  );
};

export default TextElement;