import React, { useCallback, useRef } from 'react';
import { Graphics, Text } from '@pixi/react';
import { CanvasElement, useCanvasStore } from '../../../stores/canvasStore';
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
  
  // Check if we're currently editing this sticky note
  const isEditingText = useCanvasStore((state) => state.isEditingText);
  
  // Don't render if we're currently editing this sticky note
  if (isEditingText === element.id) {
    return null;
  }

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
    // Stop propagation to prevent canvas-level handlers from interfering
    e.stopPropagation(); // Stops Pixi event bubbling
    if (e.data?.originalEvent) {
      e.data.originalEvent.stopPropagation(); // Stops DOM event bubbling
      e.data.originalEvent.stopImmediatePropagation(); // Stops other DOM listeners on the same element
    }
    if (onMouseDown) {
      onMouseDown(e, element.id);
    }
  }, [onMouseDown, element.id]);

  const handlePointerTap = useCallback((e: any) => {
    const now = Date.now(); // Define now
    const timeDiff = now - lastClickTime.current;
    
    if (timeDiff < 300 && onDoubleClick) {
      // Stop propagation for the tap event as well if it results in a double-click action
      e.stopPropagation(); // Stops Pixi event bubbling
      if (e.data?.originalEvent) {
        e.data.originalEvent.stopPropagation(); // Stops DOM event bubbling
        e.data.originalEvent.stopImmediatePropagation(); 
      }
      onDoubleClick();
    }
    
    lastClickTime.current = now;
  }, [onDoubleClick, lastClickTime]); // Added lastClickTime to dependencies


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

  // --- START STICKYNOTE GRAPHICS DEBUGGING ---
  // console.log(`StickyNote: Rendering <Graphics> for element ${element.id} to test invariant violation`);
  // return (
  //   <Graphics
  //     x={element.x}
  //     y={element.y}
  //     draw={g => {
  //       g.beginFill(0x0000ff); // Blue square for sticky note debug
  //       g.drawRect(0, 0, Math.max(element.width || 50, 50), Math.max(element.height || 50, 50));
  //       g.endFill();
  //     }}
  //     interactive
  //     pointerdown={handlePointerDown}
  //     pointertap={handlePointerTap}
  //     cursor="pointer"
  //   />
  // );
  // --- END STICKYNOTE GRAPHICS DEBUGGING ---

  // Original Return:
  return (
    <>
      {/* Background */}
      <Graphics
        x={element.x}
        y={element.y}
        draw={drawBackground}
        interactive
        eventMode={'static'}
        pointerdown={(e) => {
          handlePointerDown(e); // This will now call the useCallback version with stopPropagation
        }}
        pointertap={(e) => {
          handlePointerTap(e); // This will now call the useCallback version with stopPropagation
        }}
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