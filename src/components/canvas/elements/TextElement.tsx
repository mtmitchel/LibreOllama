import React, { useCallback, useRef } from 'react';
import { Text } from '@pixi/react';
import { FederatedPointerEvent } from 'pixi.js'; // Import FederatedPointerEvent from pixi.js
import { CanvasElement, useCanvasStore } from '../../../stores/canvasStore';
import { hexStringToNumber } from '../../../lib/theme-utils';

interface TextElementProps {
  element: CanvasElement;
  onMouseDown?: (e: FederatedPointerEvent, elementId: string) => void; // Updated type
  onDoubleClick?: (e: FederatedPointerEvent) => void; // Updated type, pass event
}

const TextElement: React.FC<TextElementProps> = ({ element, onMouseDown, onDoubleClick }) => {
  const lastClickTime = useRef<number>(0);
  
  // Check if we're currently editing this text element
  const isEditingText = useCanvasStore((state) => state.isEditingText);
  
  // Don't render if we're currently editing this text element
  if (isEditingText === element.id) {
    return null;
  }

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
  // --- START TEMPORARY DEBUGGING ---
  if (import.meta.env.DEV) {
    console.log('TextElement rendering with props:', element);
    console.log('TextElement style object:', textStyle);
  }
  // --- END TEMPORARY DEBUGGING ---

  const handlePointerDown = useCallback((e: FederatedPointerEvent) => { // Updated type
    console.log('TextElement: INNER handlePointerDown triggered for element:', element.id); // MODIFIED LOG
    // Stop propagation to prevent canvas-level handlers from interfering
    e.stopPropagation(); // Stops Pixi event bubbling
    // No need to check for e.data.originalEvent for stopPropagation here as FederatedPointerEvent handles it.
    if (onMouseDown) {
      onMouseDown(e, element.id);
    }
  }, [onMouseDown, element.id]);

  const handlePointerTap = useCallback((e: FederatedPointerEvent) => { // Updated type
    console.log(`TextElement: INNER handlePointerTap for ${element.id}, time: ${Date.now()}`); // MODIFIED LOG
    const now = Date.now(); // Define now
    const timeDiff = now - lastClickTime.current;
    
    if (timeDiff < 300 && onDoubleClick) {
      // Stop propagation for the tap event as well if it results in a double-click action
      e.stopPropagation(); // Stops Pixi event bubbling
      onDoubleClick(e); // Pass event
    }
    
    lastClickTime.current = now;
  }, [onDoubleClick, lastClickTime]); // Added lastClickTime to dependencies

  // --- START AGGRESSIVE DEBUGGING --- 
  // Return ONLY the Text component to isolate it.
  // return (
  //   <Text
  //     x={Number(element.x) || 0}
  //     y={Number(element.y) || 0}
  //     text={"DEBUG"} // Hardcoded text
  //     style={{ fill: 0xff0000, fontSize: 20 }} // Even simpler, hardcoded style
  //   />
  // );
  // --- END AGGRESSIVE DEBUGGING --- 

  // Original return statement (commented out):
  return (
    <>
      {/* Text content - always render with fallback */}
      <Text
        x={element.x}
        y={element.y}
        text={element.content || 'Double-click to edit'}
        style={textStyle}
        interactive={true}
        eventMode={'static'} // Added for PixiJS v7+ event handling
        pointerdown={(e: FederatedPointerEvent) => { // Updated type
          console.log(`TextElement: NATIVE PIXI POINTERDOWN on ${element.id} --- Target matches currentTarget: ${e.target === e.currentTarget}`);
          // Prevent this event from bubbling to the canvas container in React
          // e.stopPropagation(); // Already called in handlePointerDown
          handlePointerDown(e); // This will now call the useCallback version with stopPropagation
        }}
        pointertap={(e: FederatedPointerEvent) => { // Updated type
          console.log(`TextElement: NATIVE PIXI POINTERTAP on ${element.id}`);
          // We also stop propagation here to be thorough
          // e.stopPropagation(); // Already called in handlePointerTap if it leads to double click
          handlePointerTap(e); // This will now call the useCallback version with stopPropagation
         }}
         cursor="text"
       />
    </>
  );
};

export default TextElement;