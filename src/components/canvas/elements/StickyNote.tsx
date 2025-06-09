import React, { useCallback, useRef } from 'react';
import { Graphics, Text } from '../../../lib/pixi-setup';
import { FederatedPointerEvent } from 'pixi.js'; // Import FederatedPointerEvent from pixi.js
import { CanvasElement, useCanvasStore } from '../../../stores/canvasStore';
import { hexStringToNumber, getThemeColors, getDefaultElementColors } from '../../../lib/theme-utils';

interface StickyNoteProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: FederatedPointerEvent, elementId: string) => void; // Updated type
  onDoubleClick?: (e: FederatedPointerEvent) => void; // Updated type, pass event
}

const StickyNote: React.FC<StickyNoteProps> = ({ element, isSelected, onMouseDown, onDoubleClick }) => {
  const clickCount = useRef<number>(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Get theme colors
  const themeColors = getThemeColors();
  const defaultColors = getDefaultElementColors('sticky-note');
  
  // Check if we're currently editing this sticky note
  const isEditingText = useCanvasStore((state) => state.isEditingText);
  const setPendingDoubleClick = useCanvasStore((state) => state.setPendingDoubleClick);
  const clearPendingDoubleClick = useCanvasStore((state) => state.clearPendingDoubleClick);
  
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
    
    // PIXI v8: Use fill instead of beginFill/endFill
    g.roundRect(0, 0, width, height, 8);
    g.fill({
      color: backgroundColor,
      alpha: 1
    });
    
    // Add a subtle border using theme color
    g.setStrokeStyle({
      width: 1,
      color: defaultColors.border,
      alpha: 1
    });
    g.roundRect(0, 0, width, height, 8);
    g.stroke();
    
    // Selection indicator - use theme color
    if (isSelected) {
      g.setStrokeStyle({
        width: 2,
        color: themeColors.selectionBlue,
        alpha: 1
      });
      g.roundRect(-2, -2, width + 4, height + 4, 10);
      g.stroke();
    }
  }, [element.width, element.height, element.backgroundColor, isSelected, themeColors.selectionBlue, defaultColors.background, defaultColors.border]);

  const handlePointerDown = useCallback((e: FederatedPointerEvent) => { // Updated type
    // Stop propagation to prevent canvas-level handlers from interfering
    e.stopPropagation(); // Stops Pixi event bubbling
    // CRITICAL: Also stop the original DOM event from bubbling to React handlers
    if (e.data?.originalEvent && typeof e.data.originalEvent.stopPropagation === 'function') {
      e.data.originalEvent.stopPropagation();
    }
    if (onMouseDown) {
      onMouseDown(e, element.id);
    }
  }, [onMouseDown, element.id]);

  const handlePointerTap = useCallback((e: FederatedPointerEvent) => {
    console.log(`StickyNote: INNER handlePointerTap for ${element.id}, time: ${Date.now()}`);
    console.log(`StickyNote: Current clickCount: ${clickCount.current}, onDoubleClick exists: ${!!onDoubleClick}`);
    
    clickCount.current += 1;
    
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    
    if (clickCount.current === 1) {
      console.log(`StickyNote: First click detected for ${element.id}, setting pending double-click`);
      // Set pending double-click protection
      setPendingDoubleClick(element.id);
      
      clickTimeout.current = setTimeout(() => {
        console.log(`StickyNote: Double-click timeout expired for ${element.id}, resetting`);
        clickCount.current = 0;
        // Clear pending double-click after timeout
        clearPendingDoubleClick();
      }, 300); // Changed from 500ms to 300ms
    } else if (clickCount.current === 2) {
      console.log(`StickyNote: Second click detected for ${element.id}, attempting double-click`);
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
      }
      clickCount.current = 0;
      
      if (onDoubleClick) {
        console.log(`StickyNote: Triggering double-click for ${element.id}, event:`, e);
        console.log(`StickyNote: onDoubleClick function:`, onDoubleClick.toString());
        e.stopPropagation();
        // CRITICAL: Also stop the original DOM event from bubbling to React handlers
        if (e.data?.originalEvent && typeof e.data.originalEvent.stopPropagation === 'function') {
          e.data.originalEvent.stopPropagation();
        }
        onDoubleClick(e);
        // Clear pending double-click after successful double-click
        clearPendingDoubleClick();
      } else {
        console.log(`StickyNote: No onDoubleClick handler provided for ${element.id}`);
      }
    }
  }, [onDoubleClick, element.id, setPendingDoubleClick, clearPendingDoubleClick]);


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
        pointerdown={(e: FederatedPointerEvent) => { // Updated type
          // Stop both Pixi and DOM event propagation immediately
          e.stopPropagation();
          if (e.data?.originalEvent && typeof e.data.originalEvent.stopPropagation === 'function') {
            e.data.originalEvent.stopPropagation();
          }
          handlePointerDown(e);
        }}
        pointertap={(e: FederatedPointerEvent) => { // Updated type
          // Stop both Pixi and DOM event propagation immediately
          e.stopPropagation();
          if (e.data?.originalEvent && typeof e.data.originalEvent.stopPropagation === 'function') {
            e.data.originalEvent.stopPropagation();
          }
          handlePointerTap(e);
        }}
        cursor="pointer"
      />
      
      {/* Text content - always render with fallback */}
      <Text
        x={element.x + 10} // Padding from left
        y={element.y + 10} // Padding from top
        text={element.content || 'Double-click to edit'}
        style={textStyle}
        eventMode="none" // Background handles interaction
      />
    </>
  );
};

export default StickyNote;