// src/components/canvas/shapes/TextShape.tsx
import React, { useEffect, useRef } from 'react';
import { Text } from 'react-konva';
import Konva from 'konva';
import { CanvasElement } from '../stores/types';
import { useTextEditing } from '../stores/canvasStore';
import { designSystem } from '../../../styles/designSystem';
import { createTextEditor } from '../utils/textEditingUtils';
import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';

interface TextShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null> | undefined;
}

/**
 * TextShape - Optimized text component with portal-based inline editing
 * - Performance-optimized with React.memo
 * - Uses portal-based editing that stays aligned during canvas transformations
 */
export const TextShape: React.FC<TextShapeProps> = React.memo(({
  element,
  isSelected: _isSelected,
  konvaProps,
  onUpdate,
  stageRef
}) => {
  const { editingTextId, setEditingTextId } = useTextEditing();
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

      // Create the text editor
      cleanupRef.current = createTextEditor({
        position: {
          left: Math.round(screenX),
          top: Math.round(screenY),
          width: Math.round(screenWidth),
          height: Math.round(screenHeight),
        },
        initialText: element.text || '',
        onSave: (text: string) => {
          onUpdate(element.id, { text });
          setEditingTextId(null);
          cleanupRef.current = null;
        },
        onCancel: () => {
          setEditingTextId(null);
          cleanupRef.current = null;
        },        placeholder: 'Enter text...',
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
    stage.on('transform', handleTransform);
    stage.on('dragmove', handleTransform);
    stage.on('wheel', handleTransform);
    stage.on('scalechange', handleTransform);
    stage.on('dragend', handleTransform);
    stage.on('transformend', handleTransform);
    
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
      
      stage.off('transform', handleTransform);
      stage.off('dragmove', handleTransform);
      stage.off('wheel', handleTransform);
      stage.off('scalechange', handleTransform);
      stage.off('dragend', handleTransform);
      stage.off('transformend', handleTransform);
        window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange);
    };
  }, [editingTextId, element.id, element.text, element.width, element.fontSize, element.fontFamily, onUpdate, setEditingTextId, stageRef]);  const hasContent = element.text && element.text.trim().length > 0;  const displayText = hasContent ? element.text : 'Double-click to edit';
  const textColor = '#000000'; // Always black
  
  return (
    <Text
      {...konvaProps}
      id={element.id}
      text={displayText}
      fontSize={element.fontSize || designSystem.typography.fontSize.xl}
      fontFamily={getAvailableFontFamily()}
      fill={textColor}
      width={element.width || 250}
      fontStyle={hasContent ? (element.fontStyle || 'normal') : 'italic'}
      onDblClick={handleDoubleClick}
    />
  );
});

TextShape.displayName = 'TextShape';