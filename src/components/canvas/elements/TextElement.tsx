import React, { useCallback, useRef } from 'react';
import { Text, Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';
import { hexStringToNumber, getThemeColors } from '../../../lib/theme-utils';

interface TextElementProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
  onDoubleClick?: () => void;
}

const TextElement: React.FC<TextElementProps> = ({ element, isSelected, onMouseDown, onDoubleClick }) => {
  const lastClickTime = useRef<number>(0);
  
  // Get theme colors
  const themeColors = getThemeColors();

  // Text style configuration with theme-aware colors
  const textStyle = {
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: element.fontSize === 'small' ? 12 : element.fontSize === 'large' ? 24 : 16,
    fill: element.color ? hexStringToNumber(element.color) : 0x000000, // Default to black if no color
    wordWrap: true,
    wordWrapWidth: Math.max(element.width || 200, 50), // Minimum word wrap width
    align: element.textAlignment || 'left',
    fontWeight: element.isBold ? 'bold' : 'normal',
    fontStyle: element.isItalic ? 'italic' : 'normal',
  };

  // Draw selection background if selected
  const drawSelection = useCallback((g: any) => {
    if (!isSelected) return;
    
    g.clear();
    g.beginFill(themeColors.selectionBlue, 0.1); // Semi-transparent theme color
    g.lineStyle(1, themeColors.selectionBlue, 1);
    
    // Estimate text bounds for selection rectangle with safety checks
    const textWidth = Math.max(element.width || 200, 50);
    const textHeight = Math.max(element.height || 30, 20);
    
    g.drawRect(-2, -2, textWidth + 4, textHeight + 4);
    g.endFill();
  }, [isSelected, element.width, element.height, themeColors.selectionBlue]);

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
      
      {/* Text content - always render with fallback */}
      <Text
        x={element.x}
        y={element.y}
        text={element.content || 'Double-click to edit'}
        style={textStyle}
        interactive={true}
        pointerdown={handlePointerDown}
        pointertap={handlePointerTap}
        cursor="text"
      />
    </>
  );
};

export default TextElement;