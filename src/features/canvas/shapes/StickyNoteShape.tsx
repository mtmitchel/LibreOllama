// src/features/canvas/shapes/StickyNoteShape.tsx
import React, { useEffect, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { StickyNoteElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { designSystem } from '../../../core/design-system';
import { createTextEditor } from '../utils/textEditingUtils';
import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';
import { logger } from "@/core/lib/logger";

interface StickyNoteShapeProps {
  element: StickyNoteElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null> | undefined;
}

/**
 * StickyNoteShape - Optimized sticky note component with portal-based editing
 * - Performance-optimized with React.memo
 * - Uses portal-based editing that stays aligned during canvas transformations
 */
export const StickyNoteShape: React.FC<StickyNoteShapeProps> = React.memo(({
  element,
  konvaProps,
  onUpdate,
  stageRef
}) => {
  // Use individual primitive selectors for React 19 compatibility - UNIFIED STORE
  const editingTextId = useUnifiedCanvasStore(state => state.textEditingElementId);
  const setEditingTextId = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const cleanupRef = useRef<(() => void) | null>(null);
  const width = element.width || 200;
  const height = element.height || 100;
  
  // Ensure fonts are loaded for better text rendering
  useEffect(() => {
    ensureFontsLoaded();
  }, []);
    const handleDoubleClick = () => {
    logger.log('🔧 [STICKY NOTE] Double-click detected, starting text edit for:', element.id);
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

      // Get the sticky note group by ID to get its absolute position
      const groupNode = stage.findOne(`#${element.id}`);
      if (!groupNode) return;

      const groupPos = groupNode.getAbsolutePosition();
      const stageContainer = stage.container();
      if (!stageContainer) return;

      const containerRect = stageContainer.getBoundingClientRect();
      const transform = stage.getAbsoluteTransform();
      
      // Get stage scale
      const scale = stage.scaleX();
      
      // Calculate screen coordinates using the transform matrix
      const point = transform.point({
        x: groupPos.x + 10, // Account for text padding
        y: groupPos.y + 10
      });
      
      const screenX = containerRect.left + point.x;
      const screenY = containerRect.top + point.y;
      const screenWidth = Math.max((width - 20) * scale, 120); // Account for padding
      const screenHeight = Math.max((height - 20) * scale, 60);

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
          cleanupRef.current = null;        },        placeholder: 'Enter note text...',
        fontSize: Math.max(11, Math.min(16, (element.fontSize || designSystem.typography.fontSize.sm) * scale)),
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
  }, [editingTextId, element.id, element.text, element.fontSize, width, height, onUpdate, setEditingTextId, stageRef]);
  const hasContent = element.text && element.text.trim().length > 0;
  const displayText = hasContent ? element.text! : 'Double-click to edit';
  const textColor = hasContent 
    ? (element.textColor || designSystem.colors.secondary[900])
    : '#FF6B6B'; // Bright red for placeholder
  
  // Dynamic font size calculation based on element dimensions
  const baseFontSize = element.fontSize || designSystem.typography.fontSize.sm;
  const scaledFontSize = Math.max(8, Math.min(72, height * 0.15));
  const finalFontSize = element.fontSize ? baseFontSize : scaledFontSize;

  return (
    <Group
      {...konvaProps}
      id={element.id}
      onDblClick={handleDoubleClick}
    >
      {/* Background */}
      <Rect
        width={width}
        height={height}
        fill="#ffeb3b"
        stroke="#fbc02d"
        strokeWidth={2}
        cornerRadius={4}        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={5}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.3}
      />
      {/* Text content */}
      <Text
        x={10}
        y={10}
        width={width - 20}
        height={height - 20}
        text={displayText}
        fontSize={finalFontSize}
        fontFamily={getAvailableFontFamily()}
        fill={textColor}
        wrap="word"
        align={'left'}
        verticalAlign="top"
        fontStyle={hasContent ? 'normal' : 'italic'}
        shadowColor={hasContent ? 'transparent' : '#FF6B6B'}
        shadowBlur={hasContent ? 0 : 3}
        shadowOffset={hasContent ? { x: 0, y: 0 } : { x: 1, y: 1 }}
      />
    </Group>
  );
});

StickyNoteShape.displayName = 'StickyNoteShape';

