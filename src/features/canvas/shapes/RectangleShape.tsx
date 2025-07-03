// src/components/canvas/shapes/RectangleShape.tsx
import React, { useRef, useEffect, useCallback, useReducer, useState } from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { RectangleElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { measureTextDimensions } from '../utils/textEditingUtils';
import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';
import { useDebounce } from '@/core/hooks/useDebounce';

// Resize constants for consistency
const RESIZE_CONSTANTS = {
  DEBOUNCE_THRESHOLD: 5,      // Standardized across all shapes
  IMMEDIATE_THRESHOLD: 5,     // Standardized immediate feedback threshold
  TEXT_LENGTH_TRIGGER: 5,     // Standardized text length trigger
  UPDATE_TIMEOUT: 100,        // Timeout for update flag reset
  MIN_WIDTH: 60,             // Minimum rectangle width
  MIN_HEIGHT: 40,            // Minimum rectangle height
} as const;

/**
 * Simple, contained text editor with debounced shape updates
 */
const createRectangleTextEditor = (
  position: { left: number; top: number; width: number; height: number; fontSize: number },
  initialText: string,
  fontSize: number,
  fontFamily: string,
  onSave: (text: string) => void,
  onCancel: () => void,
  onTextChange: (newText: string) => void
) => {
  // Create completely invisible container for positioning only
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    left: `${Math.round(position.left)}px`,
    top: `${Math.round(position.top)}px`,
    width: `${Math.round(position.width)}px`,
    minHeight: `${Math.round(position.height)}px`,
    maxHeight: '400px', // Prevent excessive growth
    overflow: 'visible', // Allow content to be visible outside container
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '10000',
    border: 'none', // Remove visible border
    background: 'transparent', // Ensure no background
    pointerEvents: 'none', // Container itself doesn't capture events
  });

  // Textarea with auto-grow for immediate feedback
  const textarea = document.createElement('textarea');
  Object.assign(textarea.style, {
    width: '90%',
    height: 'auto',
    minHeight: '60px',
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    fontWeight: '400',
    lineHeight: '1.4',
    color: '#1F2937',
    background: 'transparent',
    border: 'none',
    padding: '8px',
    margin: '0',
    resize: 'none',
    outline: 'none',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    textAlign: 'center',
    boxSizing: 'border-box',
    pointerEvents: 'auto', // Textarea can capture events
  });

  textarea.value = initialText || '';
  textarea.placeholder = 'Add text';
  textarea.setAttribute('spellcheck', 'false');

  container.appendChild(textarea);
  document.body.appendChild(container);

  // Auto-grow textarea for immediate visual feedback
  const autoGrow = () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
    
    // Don't grow container visually since it should be invisible
    // Just let the textarea grow within the invisible container
  };

  // Handle input with immediate visual feedback
  const handleInput = () => {
    hasUserInteracted = true; // Track that user has typed something
    autoGrow(); // Immediate visual feedback
    onTextChange(textarea.value); // Trigger debounced shape update
    console.log('📝 [RectangleTextEditor] User typed:', {
      text: textarea.value.substring(0, 20) + '...',
      length: textarea.value.length,
      hasInteracted: hasUserInteracted
    });
  };

  autoGrow(); // Initial sizing
  textarea.addEventListener('input', handleInput);

  // Track if editor has been properly initialized
  let editorReady = false;
  let hasUserInteracted = false;

  // Focus and select with proper timing
  setTimeout(() => {
    if (document.body.contains(container)) {
      textarea.focus();
      textarea.select();
      editorReady = true;
      console.log('📝 [RectangleTextEditor] Editor focused and ready');
    }
  }, 100); // Longer delay to ensure proper focus

  // Event handlers
  const handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
      onCancel();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      cleanup();
      onSave(textarea.value);
    }
  };

  const handleBlur = () => {
    console.log('📝 [RectangleTextEditor] Blur event:', {
      editorReady,
      hasUserInteracted,
      textValue: textarea.value,
      textLength: textarea.value.length
    });
    
    // Only save if editor was ready and user interacted, OR if there's actual text
    if ((editorReady && hasUserInteracted) || textarea.value.trim().length > 0) {
      console.log('📝 [RectangleTextEditor] Saving on blur with text:', textarea.value);
      cleanup();
      onSave(textarea.value);
    } else {
      console.log('📝 [RectangleTextEditor] Ignoring premature blur - no user interaction');
      // Don't save, just cleanup the DOM elements
      cleanup();
      onCancel(); // Use cancel instead of save to preserve original text
    }
  };

  const cleanup = () => {
    console.log('🧹 [RectangleTextEditor] Cleaning up editor');
    textarea.removeEventListener('input', handleInput);
    textarea.removeEventListener('keydown', handleKeyDown);
    textarea.removeEventListener('blur', handleBlur);
    container.removeEventListener('click', handleContainerClick);
    if (document.body.contains(container)) {
      document.body.removeChild(container);
      console.log('🧹 [RectangleTextEditor] Container removed from DOM');
    } else {
      console.log('⚠️ [RectangleTextEditor] Container not found in DOM');
    }
  };

  // Ensure textarea stays focused if container is clicked
  const handleContainerClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (editorReady && !textarea.contains(e.target as Node)) {
      textarea.focus();
      console.log('📝 [RectangleTextEditor] Refocused textarea after container click');
    }
  };

  textarea.addEventListener('keydown', handleKeyDown);
  textarea.addEventListener('blur', handleBlur);
  container.addEventListener('click', handleContainerClick);

  return { cleanup };
};

interface RectangleShapeProps {
  element: RectangleElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null> | undefined;
}

export const RectangleShape: React.FC<RectangleShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
  onUpdate,
  stageRef
}) => {
  const textEditingElementId = useUnifiedCanvasStore(state => state.textEditingElementId);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
  const groupRef = useRef<Konva.Group>(null);
  const rectRef = useRef<Konva.Rect>(null);
  const textNodeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const editorRef = useRef<any>(null);
  const isEditingRef = useRef<boolean>(false);
  const updateInProgressRef = useRef<boolean>(false); // Prevent recursive updates
  
  const { width = 120, height = 80, fontSize = 14 } = element;

  // Debounced text for final shape optimization
  const [liveText, setLiveText] = useState('');
  const debouncedText = useDebounce(liveText, 100); // Faster response for immediate feedback

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  useEffect(() => {
    if (isSelected && transformerRef.current && rectRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle debounced text changes for shape updates
  useEffect(() => {
    if (!isEditingRef.current || !debouncedText || updateInProgressRef.current) {
      return;
    }

    console.log('🔧 [RectangleShape] Debounced final optimization for text:', debouncedText.substring(0, 30) + '...');

    // Prevent recursive updates
    updateInProgressRef.current = true;

    try {
      const measuredDimensions = measureTextDimensions(
        debouncedText,
        fontSize,
        element.fontFamily || getAvailableFontFamily(),
        width - 20,
        true,
        true // Force word wrapping for rectangles
      );

      console.log('🔧 [RectangleShape] Final measured dimensions:', measuredDimensions);

      const targetHeight = Math.max(RESIZE_CONSTANTS.MIN_HEIGHT, measuredDimensions.height + 40);
      const finalHeight = Math.max(height, targetHeight);

      console.log('🔧 [RectangleShape] Final height calculation:', { 
        currentHeight: height, 
        measuredHeight: measuredDimensions.height,
        targetHeight,
        finalHeight,
        needsOptimization: Math.abs(finalHeight - height) > 2
      });

      // Consistent threshold for updates
      if (Math.abs(finalHeight - height) > RESIZE_CONSTANTS.DEBOUNCE_THRESHOLD) {
        console.log('🔧 [RectangleShape] FINAL optimization update:', { from: height, to: finalHeight });
        onUpdate(element.id, { height: finalHeight });
      } else {
        console.log('🔧 [RectangleShape] No final optimization needed:', { diff: Math.abs(finalHeight - height) });
      }
    } catch (error) {
      console.error('❌ [RectangleShape] Error measuring text:', error);
    } finally {
      // Reset update flag after a delay - store timeout for cleanup
      setTimeout(() => {
        updateInProgressRef.current = false;
      }, 100); // Consistent timeout duration
    }
  }, [debouncedText, isEditingRef.current, fontSize, element.fontFamily, width, height, onUpdate, element.id]);

  const calculateTextareaPosition = useCallback(() => {
    if (!stageRef?.current || !rectRef.current) return null;
    
    const stage = stageRef.current;
    const rect = rectRef.current;
    const container = stage.container();
    if (!container) return null;
    
    const containerRect = container.getBoundingClientRect();
    const scale = stage.scaleX();
    const stagePos = stage.getAbsolutePosition();
    
    const rectPos = rect.getAbsolutePosition();
    
    return {
      left: containerRect.left + (rectPos.x - stagePos.x) * scale,
      top: containerRect.top + (rectPos.y - stagePos.y) * scale,
      width: width * scale,
      height: height * scale,
      fontSize: fontSize * scale
    };
  }, [stageRef, width, height, fontSize]);

  // Handle live text changes with immediate visual feedback
  const handleTextChange = useCallback((newText: string) => {
    if (!isEditingRef.current) return;
    setLiveText(newText); // This will trigger debounced measurement
    
    // IMMEDIATE SHAPE UPDATE for fluid real-time feedback
    if (newText && newText.length > 5) { // Much lower trigger for immediate feedback
      try {
        const immediateMeasuredDimensions = measureTextDimensions(
          newText,
          fontSize,
          element.fontFamily || getAvailableFontFamily(),
          width - 20,
          true,
          true // Force word wrapping for rectangles
        );

        const immediateTargetHeight = Math.max(RESIZE_CONSTANTS.MIN_HEIGHT, immediateMeasuredDimensions.height + 40);
        const immediateFinalHeight = Math.max(height, immediateTargetHeight);

        // Standardized immediate feedback threshold
        if (Math.abs(immediateFinalHeight - height) > RESIZE_CONSTANTS.IMMEDIATE_THRESHOLD) {
          console.log('⚡ [RectangleShape] IMMEDIATE shape height update:', { 
            from: height, 
            to: immediateFinalHeight, 
            textLength: newText.length 
          });
          onUpdate(element.id, { height: immediateFinalHeight });
        }
      } catch (error) {
        console.error('❌ [RectangleShape] Error in immediate measurement:', error);
      }
    }
  }, [fontSize, element.fontFamily, width, height, onUpdate, element.id]);
  
  const startEditing = useCallback(() => {
    if (isEditingRef.current) {
      console.log('⚠️ [RectangleShape] Already editing - ignoring restart request');
      return;
    }
    
    console.log('🟦 [RectangleShape] Starting edit mode');
    isEditingRef.current = true;
    updateInProgressRef.current = false; // Reset update flag
    setTextEditingElement(element.id);
    setLiveText(element.text || '');
    forceUpdate();

    const store = useUnifiedCanvasStore.getState();
    store.clearSelection();

    requestAnimationFrame(() => {
      const positionData = calculateTextareaPosition();
      if (!positionData) {
        console.error('❌ [RectangleShape] Failed to calculate position');
        isEditingRef.current = false;
        setTextEditingElement(null);
        return;
      }
      
      console.log('📍 [RectangleShape] Editor position:', positionData);
      
      editorRef.current = createRectangleTextEditor(
        positionData,
        element.text || '',
        positionData.fontSize,
        element.fontFamily || getAvailableFontFamily(),
        (newText: string) => {
          console.log('💾 [RectangleShape] Saving text:', {
            originalText: newText,
            trimmedText: newText.trim(),
            textLength: newText.length,
            trimmedLength: newText.trim().length,
            elementId: element.id
          });
          isEditingRef.current = false;
          updateInProgressRef.current = false;
          setTextEditingElement(null);
          editorRef.current = null;
          
          // BACKUP: Force shape update on save to ensure it fits the final text
          if (newText && newText.trim().length > 0) {
            try {
              const finalMeasuredDimensions = measureTextDimensions(
                newText.trim(),
                fontSize,
                element.fontFamily || getAvailableFontFamily(),
                width - 20,
                true,
                true // Force word wrapping for rectangles
              );
              
              const finalTargetHeight = Math.max(RESIZE_CONSTANTS.MIN_HEIGHT, finalMeasuredDimensions.height + 40);
              const finalHeight = Math.max(height, finalTargetHeight);
              
              console.log('💾 [RectangleShape] Final measurement on save:', {
                textLength: newText.trim().length,
                measuredHeight: finalMeasuredDimensions.height,
                currentHeight: height,
                finalHeight,
                needsUpdate: finalHeight > height
              });
              
              // Update both text and height in one operation
              const updateData = { 
                text: newText.trim(), 
                height: finalHeight,
                updatedAt: Date.now() 
              };
              console.log('💾 [RectangleShape] Updating element with:', updateData);
              onUpdate(element.id, updateData);
            } catch (error) {
              console.error('❌ [RectangleShape] Error in final measurement:', error);
              // Fallback to just updating text
              const fallbackData = { text: newText.trim(), updatedAt: Date.now() };
              console.log('💾 [RectangleShape] Fallback update with:', fallbackData);
              onUpdate(element.id, fallbackData);
            }
          } else {
            // Empty text, just update
            const emptyData = { text: newText.trim(), updatedAt: Date.now() };
            console.log('💾 [RectangleShape] Empty text update with:', emptyData);
            onUpdate(element.id, emptyData);
          }
          
          setTimeout(() => {
            const store = useUnifiedCanvasStore.getState();
            store.setSelectedTool('select');
            store.selectElement(element.id, false);
          }, 100);
        },
        () => {
          console.log('❌ [RectangleShape] Edit cancelled');
          isEditingRef.current = false;
          updateInProgressRef.current = false;
          setTextEditingElement(null);
          editorRef.current = null;
          // DON'T update element on cancel - keep original text
        },
        handleTextChange
      );
    });
  }, [element, calculateTextareaPosition, setTextEditingElement, onUpdate, handleTextChange]);

  useEffect(() => {
    console.log('🔄 [RectangleShape] useEffect triggered:', {
      textEditingElementId,
      elementId: element.id,
      isCurrentlyEditing: isEditingRef.current,
      hasEditor: !!editorRef.current,
      shouldStartEditing: textEditingElementId === element.id && !isEditingRef.current
    });

    // Start editing only if not already editing
    if (textEditingElementId === element.id && !isEditingRef.current) {
      console.log('🟦 [RectangleShape] Starting new editing session');
      startEditing();
    }
    
    // Stop editing only if we're no longer the editing element AND we're currently editing
    if (textEditingElementId !== element.id && editorRef.current && isEditingRef.current) {
      console.log('🛑 [RectangleShape] Stopping editing session - different element selected');
      editorRef.current.cleanup();
      editorRef.current = null;
      isEditingRef.current = false;
      updateInProgressRef.current = false;
    }
    
    return () => {
      if (editorRef.current) {
        console.log('🧹 [RectangleShape] Component cleanup - removing editor');
        editorRef.current.cleanup();
        editorRef.current = null;
        isEditingRef.current = false;
        updateInProgressRef.current = false;
      }
    };
  }, [textEditingElementId, element.id]); // Remove startEditing dependency to prevent restart on shape updates

  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = rectRef.current;
    if (!node) return;
    
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);
    
    onUpdate(element.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(RESIZE_CONSTANTS.MIN_WIDTH, node.width() * scaleX),
      height: Math.max(RESIZE_CONSTANTS.MIN_HEIGHT, node.height() * scaleY),
      updatedAt: Date.now()
    });
  }, [element.id, onUpdate]);
  
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<any>) => {
    onUpdate(element.id, {
        x: e.target.x(),
        y: e.target.y(),
        updatedAt: Date.now()
    });
  }, [element.id, onUpdate]);

  const hasContent = element.text && element.text.trim().length > 0;
  const displayText = hasContent ? element.text! : 'Add text';
  const textColor = hasContent ? (element.textColor || '#1F2937') : 'rgba(31, 41, 55, 0.6)';
  
  const isCurrentlyEditing = textEditingElementId === element.id;
  const shouldAllowDrawing = ['pen', 'marker', 'highlighter', 'eraser'].includes(selectedTool);

  return (
    <>
      <Group
        {...konvaProps}
        ref={groupRef}
        id={element.id}
        onDblClick={startEditing}
        draggable={!shouldAllowDrawing}
        listening={!shouldAllowDrawing}
        onDragEnd={handleDragEnd}
      >
        <Rect
          ref={rectRef}
          width={width}
          height={height}
          fill={element.fill || '#FFFFFF'}
          stroke={element.stroke || '#D1D5DB'}
          strokeWidth={2}
          cornerRadius={4}
          onTransformEnd={handleTransformEnd}
        />
        {!isCurrentlyEditing && (
          <Text
            ref={textNodeRef}
            x={0}
            y={0}
            width={width}
            height={height}
            text={displayText}
            fontSize={fontSize}
            fontFamily={getAvailableFontFamily()}
            fill={textColor}
            align="center"
            verticalAlign="middle"
            fontStyle={hasContent ? 'normal' : 'italic'}
            wrap="word"
            padding={10}
          />
        )}
      </Group>
      {isSelected && !isCurrentlyEditing && (
        <Transformer
          ref={transformerRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={false}
          borderStroke="#3B82F6"
          borderStrokeWidth={1}
          anchorStroke="#3B82F6"
          anchorFill="#ffffff"
          anchorSize={6}
          ignoreStroke={true}
          boundBoxFunc={(oldBox, newBox) => ({
            ...newBox,
            width: Math.max(60, newBox.width),
            height: Math.max(40, newBox.height),
          })}
        />
      )}
    </>
  );
});

RectangleShape.displayName = 'RectangleShape';

