import React, { useCallback, useRef, useEffect } from 'react';
import { Text, Container, Graphics } from '../../../lib/pixi-setup';
import { FederatedPointerEvent, Graphics as PIXIGraphics } from 'pixi.js'; // Import FederatedPointerEvent from pixi.js
import { CanvasElement, useCanvasStore } from '../../../stores/canvasStore';
import { hexStringToNumber } from '../../../lib/theme-utils';

interface TextElementProps {
  element: CanvasElement;
  onMouseDown?: (e: FederatedPointerEvent, elementId: string) => void; // Updated type
  onDoubleClick?: (e: FederatedPointerEvent) => void; // Updated type, pass event
}

const TextElement: React.FC<TextElementProps> = ({ element, onMouseDown, onDoubleClick }) => {
  const clickCount = useRef<number>(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const graphicsRef = useRef<PIXIGraphics | null>(null);
  
  // Check if we're currently editing this text element
  const isEditingText = useCanvasStore((state) => state.isEditingText);
  const setPendingDoubleClick = useCanvasStore((state) => state.setPendingDoubleClick);
  const clearPendingDoubleClick = useCanvasStore((state) => state.clearPendingDoubleClick);
  
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
    console.log('TextElement: Event details:', {
      eventPhase: e.eventPhase,
      bubbles: e.bubbles,
      cancelable: e.cancelable,
      defaultPrevented: e.defaultPrevented,
      propagationStopped: e.propagationStopped,
      target: e.target,
      currentTarget: e.currentTarget,
      originalEvent: e.data?.originalEvent
    });
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
    console.log(`TextElement: INNER handlePointerTap for ${element.id}, time: ${Date.now()}`);
    console.log(`TextElement: Current clickCount: ${clickCount.current}, onDoubleClick exists: ${!!onDoubleClick}`);
    console.log('TextElement: PointerTap event details:', {
      eventPhase: e.eventPhase,
      bubbles: e.bubbles,
      cancelable: e.cancelable,
      defaultPrevented: e.defaultPrevented,
      propagationStopped: e.propagationStopped,
      detail: e.detail,
      originalEvent: e.data?.originalEvent,
      originalEventType: e.data?.originalEvent?.type,
      originalEventDetail: e.data?.originalEvent?.detail
    });
    
    clickCount.current += 1;
    
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    
    if (clickCount.current === 1) {
      console.log(`TextElement: First click detected for ${element.id}, setting pending double-click`);
      // Set pending double-click protection
      setPendingDoubleClick(element.id);
      
      clickTimeout.current = setTimeout(() => {
        console.log(`TextElement: Double-click timeout expired for ${element.id}, resetting`);
        clickCount.current = 0;
        // Clear pending double-click after timeout
        clearPendingDoubleClick();
      }, 300); // Changed from 500ms to 300ms
    } else if (clickCount.current === 2) {
      console.log(`TextElement: Second click detected for ${element.id}, attempting double-click`);
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
      }
      clickCount.current = 0;
      
      if (onDoubleClick) {
        console.log(`TextElement: Triggering double-click for ${element.id}, event:`, e);
        console.log(`TextElement: onDoubleClick function:`, onDoubleClick.toString());
        console.log(`TextElement: About to call onDoubleClick...`);
        e.stopPropagation();
        // CRITICAL: Also stop the original DOM event from bubbling to React handlers
        if (e.data?.originalEvent && typeof e.data.originalEvent.stopPropagation === 'function') {
          e.data.originalEvent.stopPropagation();
        }
        try {
          onDoubleClick(e);
          console.log(`TextElement: onDoubleClick called successfully`);
        } catch (error) {
          console.error(`TextElement: Error calling onDoubleClick:`, error);
        }
        // Clear pending double-click after successful double-click
        clearPendingDoubleClick();
      } else {
        console.log(`TextElement: No onDoubleClick handler provided for ${element.id}`);
      }
    }
  }, [onDoubleClick, element.id, setPendingDoubleClick, clearPendingDoubleClick]);

  // --- START AGGRESSIVE DEBUGGING --- 
  // Add a test for native dblclick event
  const handleDoubleClick = useCallback((e: FederatedPointerEvent) => {
    console.log(`TextElement: NATIVE DBLCLICK event fired for ${element.id}!`);
    console.log(`TextElement: Native dblclick event details:`, {
      type: e.type,
      detail: e.detail,
      target: e.target,
      currentTarget: e.currentTarget,
      originalEvent: e.data?.originalEvent
    });
    
    e.stopPropagation();
    if (e.data?.originalEvent && typeof e.data.originalEvent.stopPropagation === 'function') {
      e.data.originalEvent.stopPropagation();
    }
    
    if (onDoubleClick) {
      console.log(`TextElement: Calling onDoubleClick from native dblclick`);
      onDoubleClick(e);
    }
  }, [onDoubleClick, element.id]);

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
  // Add a debug log to check if the component is rendering
  console.log(`TextElement: Rendering Text component for ${element.id} with Graphics overlay`);
  
  const width = Math.max(element.width || 200, 50);
  const height = Math.max(element.height || 50, 20);
  
  return (
    <>
      {/* Text content - render first */}
      <Text
        x={element.x}
        y={element.y}
        text={element.content || 'Double-click to edit'}
        style={textStyle}
        eventMode="none"
      />
      
      {/* Transparent Graphics overlay for interaction */}
      <Graphics
        x={element.x}
        y={element.y}
        eventMode="static"
        cursor="pointer"
        draw={(g) => {
          g.clear();
          g.beginFill(0x000000, 0.01); // Nearly transparent
          g.drawRect(0, 0, width, height);
          g.endFill();
          console.log(`TextElement: Graphics overlay drawn for ${element.id} at (${element.x}, ${element.y}) with size ${width}x${height}`);
        }}
        pointerdown={(e: FederatedPointerEvent) => {
          console.log(`TextElement: Graphics POINTERDOWN on ${element.id}`);
          console.log(`TextElement: Graphics Interactive: ${e.currentTarget?.interactive}`);
          // Stop both Pixi and DOM event propagation immediately
          e.stopPropagation();
          if (e.data?.originalEvent && typeof e.data.originalEvent.stopPropagation === 'function') {
            e.data.originalEvent.stopPropagation();
          }
          handlePointerDown(e);
        }}
        pointertap={(e: FederatedPointerEvent) => {
          console.log(`TextElement: Graphics POINTERTAP on ${element.id}`);
          console.log(`TextElement: Event timestamp: ${Date.now()}, Event detail: ${e.detail}`);
          // Stop both Pixi and DOM event propagation immediately
          e.stopPropagation();
          if (e.data?.originalEvent && typeof e.data.originalEvent.stopPropagation === 'function') {
            e.data.originalEvent.stopPropagation();
          }
          handlePointerTap(e);
        }}
        // DIAGNOSTIC: Add DOM event handlers to test if this is actually a div
        onClick={(e: any) => {
          console.log(`TextElement: DOM onClick detected on ${element.id} - This confirms we're using mock PIXI components!`);
          console.log(`TextElement: Event target tagName:`, e.target?.tagName);
          console.log(`TextElement: Event target data-pixi-component:`, e.target?.getAttribute?.('data-pixi-component'));
        }}
        onDoubleClick={(e: any) => {
          console.log(`TextElement: DOM onDoubleClick detected on ${element.id} - Using this as fallback!`);
          console.log(`TextElement: Event target tagName:`, e.target?.tagName);
          if (onDoubleClick) {
            onDoubleClick(e);
          }
        }}
      />
    </>
  );
};

export default TextElement;