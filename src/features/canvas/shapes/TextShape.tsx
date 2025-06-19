// src/components/canvas/shapes/TextShape.tsx
import React, { useEffect, useRef } from 'react';
import { Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { CanvasElement } from '../stores/types';
import { useCanvasStore } from '../stores/canvasStore.enhanced';
import { designSystem } from '../../../styles/designSystem';
import { createTextEditor } from '../utils/textEditingUtils';
import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';

interface TextShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null> | undefined;
  onTransformEnd: (element: CanvasElement, props: Partial<CanvasElement>) => void;
}

/**
 * TextShape - Optimized text component with portal-based inline editing
 * - Performance-optimized with React.memo
 * - Uses portal-based editing that stays aligned during canvas transformations
 * - Includes a safety net to prevent React-Konva from crashing on empty/whitespace text
 */
export const TextShape: React.FC<TextShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
  onUpdate,
  stageRef,
  onTransformEnd,
}) => {
  const textNodeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const { editingTextId, setEditingTextId } = useCanvasStore();
  const cleanupRef = useRef<(() => void) | null>(null);

  // Ensure fonts are loaded for better text rendering
  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  const handleDoubleClick = () => {
    setEditingTextId(element.id);
  };

  // Portal-based text editing effect
  useEffect(() => {
    if (editingTextId !== element.id || !stageRef?.current) {
      return;
    }

    const updatePosition = () => {
      const stage = stageRef.current;
      if (!stage) return;

      // Get the text element by ID to get its absolute position
      const textNode = stage.findOne(`#${element.id}`);
      if (!textNode) return;

      const textPos = textNode.getAbsolutePosition();
      const stageContainer = stage.container();
      if (!stageContainer) return;

      const containerRect = stageContainer.getBoundingClientRect();
      const transform = stage.getAbsoluteTransform();
      
      // Get stage scale
      const scale = stage.scaleX();
      
      // Calculate screen coordinates using the transform matrix
      const point = transform.point({
        x: textPos.x,
        y: textPos.y
      });
      
      const screenX = containerRect.left + point.x;
      const screenY = containerRect.top + point.y;
      const screenWidth = Math.max((element.width || 250) * scale, 150);
      const screenHeight = Math.max((element.fontSize || 24) * 2.5 * scale, 60);

      // Clean up any existing editor
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      // Create the text editor with enhanced logging
      cleanupRef.current = createTextEditor({
        position: {
          left: Math.round(screenX),
          top: Math.round(screenY),
          width: Math.round(screenWidth),
          height: Math.round(screenHeight),
        },
        initialText: element.text || '',
        onSave: (text: string) => {
          // Prevent saving whitespace-only text
          const newText = text.trim().length === 0 ? 'Text' : text;
          onUpdate(element.id, { text: newText });
          setEditingTextId(null);
          cleanupRef.current = null;
        },
        onCancel: () => {
          setEditingTextId(null);
          cleanupRef.current = null;
        },
        placeholder: 'Enter text...',
        fontSize: Math.max(12, Math.min(18, (element.fontSize || designSystem.typography.fontSize.xl) * scale * 0.7)),
        fontFamily: getAvailableFontFamily(),
        multiline: true
      });
    };

    // Initial position calculation
    updatePosition();

    // Listen for canvas transformations
    const stage = stageRef.current;
    const handleTransform = () => updatePosition();
    
    // Add event listeners for all transform events
    stage.on('transform dragmove wheel scalechange dragend transformend', handleTransform);
    
    // Also listen for window resize/scroll
    const handleWindowChange = () => updatePosition();
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange);

    // Cleanup function
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      
      stage.off('transform dragmove wheel scalechange dragend transformend', handleTransform);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange);
    };
  }, [editingTextId, element.id, element.text, element.width, element.fontSize, element.fontFamily, onUpdate, setEditingTextId, stageRef]);

  useEffect(() => {
    if (isSelected && transformerRef.current && textNodeRef.current) {
      // Defer attachment to the next tick to ensure the node is mounted.
      const timer = setTimeout(() => {
        if (transformerRef.current && textNodeRef.current) {
          transformerRef.current.nodes([textNodeRef.current]);
          transformerRef.current.getLayer()?.batchDraw();
        }
      }, 0);

      return () => clearTimeout(timer); // Cleanup the timeout
    } else if (!isSelected && transformerRef.current) {
      // No need to defer detaching
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, element.id]); // Add element.id to dependencies

  // FINAL SAFETY NET: Ensure we never pass an empty or whitespace-only string to Konva
  const safeText = (element.text && element.text.trim().length > 0) ? element.text : 'Text';
  const hasContent = element.text && element.text.trim().length > 0;
  const textColor = '#000000'; // Always black

  return (
    <>
      <Text
        {...konvaProps}
        id={element.id}
        text={safeText}
        fontSize={element.fontSize || designSystem.typography.fontSize.xl}
        fontFamily={getAvailableFontFamily()}
        fill={textColor}
        width={element.width || 250}
        fontStyle={hasContent ? (element.fontStyle || 'normal') : 'italic'}
        onDblClick={handleDoubleClick}
        ref={textNodeRef}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Prevent scaling below a certain size
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
          onTransformEnd={() => {
            const node = textNodeRef.current;
            if (!node) return;
            
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            
            // Reset scale before getting the new width/height
            node.scaleX(1);
            node.scaleY(1);
            
            const newWidth = Math.max(10, node.width() * scaleX);
            const newHeight = Math.max(10, node.height() * scaleY);
            
            onTransformEnd(element, {
              width: newWidth,
              height: newHeight,
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
            });
          }}
        />
      )}
    </>
  );
});

TextShape.displayName = 'TextShape';