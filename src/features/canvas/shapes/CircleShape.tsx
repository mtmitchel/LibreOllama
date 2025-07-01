// src/components/canvas/shapes/CircleShape.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { Group, Circle, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { CircleElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { measureTextDimensions } from '../utils/textEditingUtils';
import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';
import { nanoid } from 'nanoid';

/**
 * Create text editor for circles - adapted from StickyNoteShape
 */
const createCircleTextEditor = (
  position: { left: number; top: number; width: number; height: number; fontSize: number },
  initialText: string,
  fontSize: number,
  fontFamily: string,
  onSave: (text: string) => void,
  onCancel: () => void
) => {
  console.log('🔵 [CircleTextEditor] Creating text editor:', position);

  const textarea = document.createElement('textarea');
  
  // Style the textarea to overlay the circle
  Object.assign(textarea.style, {
    position: 'fixed',
    left: `${Math.round(position.left)}px`,
    top: `${Math.round(position.top)}px`,
    width: `${Math.round(position.width)}px`,
    height: `${Math.round(position.height)}px`,
    fontSize: `${Math.max(11, Math.min(20, position.fontSize))}px`,
    fontFamily: fontFamily,
    fontWeight: '400',
    lineHeight: '1.4',
    color: '#FFFFFF',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '2px solid #22C55E',
    borderRadius: '50%',
    padding: '8px',
    resize: 'none',
    outline: 'none',
    zIndex: '10000',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    boxSizing: 'border-box',
    textAlign: 'center'
  });

  // Set initial value
  textarea.value = initialText || '';
  textarea.placeholder = 'Add text';
  textarea.setAttribute('spellcheck', 'false');
  
  document.body.appendChild(textarea);

  // Focus the textarea
  setTimeout(() => {
    if (document.body.contains(textarea)) {
      textarea.focus();
      if (!initialText || initialText.trim().length === 0) {
        textarea.setSelectionRange(0, 0);
      } else {
        textarea.select();
      }
    }
  }, 50);

  const handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      onSave(textarea.value);
    }
  };

  const handleBlur = () => {
    onSave(textarea.value);
  };

  const cleanup = () => {
    if (document.body.contains(textarea)) {
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('blur', handleBlur);
      document.body.removeChild(textarea);
    }
  };

  textarea.addEventListener('keydown', handleKeyDown);
  textarea.addEventListener('blur', handleBlur);

  return cleanup;
};

interface CircleShapeProps {
  element: CircleElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null> | undefined;
}

/**
 * CircleShape - Following exact StickyNoteShape pattern
 */
export const CircleShape: React.FC<CircleShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
  onUpdate,
  stageRef
}) => {
  // Store selectors - same pattern as StickyNoteShape
  const textEditingElementId = useUnifiedCanvasStore(state => state.textEditingElementId);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  
  // Refs - same pattern as StickyNoteShape
  const groupRef = useRef<Konva.Group>(null);
  const circleRef = useRef<Konva.Circle>(null); // Main shape for transformer
  const textNodeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const cleanupEditorRef = useRef<(() => void) | null>(null);
  const isDuplicating = useRef<boolean>(false);
  
  const radius = element.radius || 50;
  const diameter = radius * 2;
  
  // Ensure fonts are loaded
  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  // Attach transformer to circle when selected - standard Konva pattern
  useEffect(() => {
    if (isSelected && transformerRef.current && circleRef.current) {
      transformerRef.current.nodes([circleRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
      console.log('🔄 [CircleShape] Transformer attached to circle:', element.id);
    }
  }, [isSelected, element.id]);

  // Calculate textarea position for text editing - same as StickyNoteShape
  const calculateTextareaPosition = useCallback(() => {
    if (!stageRef?.current || !groupRef.current) return null;

    const stage = stageRef.current;
    const group = groupRef.current;
    const container = stage.container();
    if (!container) return null;

    const containerRect = container.getBoundingClientRect();
    const scale = stage.scaleX();
    const groupPos = group.getAbsolutePosition();

    return {
      left: containerRect.left + (groupPos.x + radius/2) * scale,
      top: containerRect.top + (groupPos.y + radius - 10) * scale, 
      width: Math.max(radius * scale, 80),
      height: Math.max(20 * scale, 20),
      fontSize: Math.max(11, Math.min(16, (element.fontSize || 14) * scale))
    };
  }, [stageRef, radius, element.fontSize]);

  // Handle double-click to start editing - same pattern as StickyNoteShape
  const handleDoubleClick = useCallback(() => {
    console.log('🔵 [CircleShape] Double-click detected, entering edit mode');
    
    if (cleanupEditorRef.current) {
      console.log('⚠️ [CircleShape] Already in edit mode, ignoring double-click');
      return;
    }
    
    if (textEditingElementId && textEditingElementId !== element.id) {
      console.log('⚠️ [CircleShape] Another text element is being edited, ignoring double-click');
      return;
    }
    
    if (!stageRef?.current) {
      console.warn('⚠️ [CircleShape] No stage ref available for editing');
      return;
    }

    // CRITICAL: Set text editing state FIRST to hide Konva Text immediately
    setTextEditingElement(element.id);

    // Deselect element when entering edit mode to hide transformer
    const store = useUnifiedCanvasStore.getState();
    store.clearSelection();

    const positionData = calculateTextareaPosition();
    if (!positionData) {
      console.warn('⚠️ [CircleShape] Could not calculate textarea position');
      setTextEditingElement(null); // Reset if we can't create editor
      return;
    }

    console.log('✏️ [CircleShape] Starting edit mode with position:', positionData);

    const cleanup = createCircleTextEditor(
      positionData,
      element.text || '',
      positionData.fontSize,
      element.fontFamily || getAvailableFontFamily(),
      (newText: string) => {
        console.log('💾 [CircleShape] Saving text:', newText);
        
        const finalText = newText.trim();
        
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
        
        onUpdate(element.id, {
          text: finalText,
          updatedAt: Date.now()
        });
        
        // Auto-switch to select tool and select element
        setTimeout(() => {
          const store = useUnifiedCanvasStore.getState();
          store.setSelectedTool('select');
          
          setTimeout(() => {
            store.clearSelection();
            setTimeout(() => {
              store.selectElement(element.id, false);
            }, 50);
          }, 50);
        }, 100);
      },
      () => {
        console.log('❌ [CircleShape] Edit cancelled');
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
      }
    );

    cleanupEditorRef.current = cleanup;
  }, [element, calculateTextareaPosition, setTextEditingElement, onUpdate, stageRef]);

  // Transform handler - standard Konva pattern for Circle
  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const circle = circleRef.current;
    if (!circle) return;
    
    const scaleX = circle.scaleX();
    const scaleY = circle.scaleY();
    
    // Calculate new radius (use average of scales to maintain circle shape)
    const newRadius = Math.max(25, element.radius * ((scaleX + scaleY) / 2));
    
    // Reset scale to 1 (standard Konva pattern)
    circle.scaleX(1);
    circle.scaleY(1);
    
    // Update element dimensions
    onUpdate(element.id, {
      x: circle.x(),
      y: circle.y(),
      radius: newRadius,
      updatedAt: Date.now()
    });
    
    console.log('🔄 [CircleShape] Transform complete:', { newRadius });
  }, [element.id, element.radius, onUpdate]);

  // Text editing effect - same pattern as StickyNoteShape
  useEffect(() => {
    if (textEditingElementId !== element.id || !stageRef?.current) {
      // Clean up any existing editor when this element is no longer being edited
      if (cleanupEditorRef.current && textEditingElementId !== element.id) {
        console.log('🔵 [CircleShape] Cleaning up editor - element no longer being edited');
        cleanupEditorRef.current();
        cleanupEditorRef.current = null;
      }
      return;
    }

    // Prevent multiple editors for the same element
    if (cleanupEditorRef.current) {
      console.log('🔵 [CircleShape] Editor already exists, skipping creation');
      return;
    }

    const positionData = calculateTextareaPosition();
    if (!positionData) {
      console.warn('🔵 [CircleShape] ⚠️ Could not calculate position data for text editing');
      return;
    }

    console.log('🔵 [CircleShape] *** STARTING PROGRAMMATIC TEXT EDITING ***', element.id);

    const cleanup = createCircleTextEditor(
      positionData,
      element.text || '',
      positionData.fontSize,
      element.fontFamily || getAvailableFontFamily(),
      (newText: string) => {
        console.log('💾 [CircleShape] Saving programmatic text:', newText);
        
        const finalText = newText.trim();
        
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
        
        onUpdate(element.id, {
          text: finalText,
          updatedAt: Date.now()
        });
        
        // Auto-switch to select tool and select element
        setTimeout(() => {
          const store = useUnifiedCanvasStore.getState();
          store.setSelectedTool('select');
          
          setTimeout(() => {
            store.clearSelection();
            setTimeout(() => {
              store.selectElement(element.id, false);
            }, 50);
          }, 50);
        }, 100);
      },
      () => {
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
      }
    );

    cleanupEditorRef.current = cleanup;

    return () => {
      if (cleanupEditorRef.current) {
        cleanupEditorRef.current();
        cleanupEditorRef.current = null;
      }
    };
  }, [textEditingElementId, element.id, calculateTextareaPosition, element.text, element.fontFamily, onUpdate, setTextEditingElement, stageRef]);
  
  const hasContent = element.text && element.text.trim().length > 0;
  const displayText = hasContent ? element.text! : 'Add text';
  const textColor = hasContent 
    ? (element.textColor || '#FFFFFF')
    : 'rgba(255, 255, 255, 0.6)'; // Semi-transparent for placeholder
  
  // Check if this element is currently being edited
  const isCurrentlyEditing = textEditingElementId === element.id;
  
  // Determine if events should pass through for drawing tools
  const drawingTools = ['pen', 'marker', 'highlighter', 'washi-tape', 'eraser'];
  const shouldAllowDrawing = drawingTools.includes(selectedTool);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (isDuplicating.current) {
      isDuplicating.current = false;
      return;
    }
    
    // Update position for normal drag
    const group = e.target as Konva.Group;
    onUpdate(element.id, {
      x: group.x(),
      y: group.y(),
      updatedAt: Date.now()
    });
  }, [element.id, onUpdate]);

  // Handle click events for selection
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Don't interfere with double-click
    if (e.evt.detail === 2) return;
    
    // Call the original click handler from konvaProps
    if (konvaProps.onClick) {
      konvaProps.onClick(e);
    }
  }, [konvaProps]);

  return (
    <>
      <Group
        {...konvaProps}
        ref={groupRef}
        id={element.id}
        onClick={handleClick}
        onDblClick={handleDoubleClick}
        onDragEnd={handleDragEnd}
        draggable={!shouldAllowDrawing}
        listening={!shouldAllowDrawing}
      >
        {/* Circle background */}
        <Circle
          ref={circleRef}
          x={radius}
          y={radius}
          radius={radius}
          fill={element.fill || '#22C55E'}
          stroke={element.stroke || '#16A34A'}
          strokeWidth={element.strokeWidth || 2}
          onTransformEnd={handleTransformEnd}
        />

        {/* Text content - ONLY render when NOT being edited */}
        {!isCurrentlyEditing && (
          <Text
            ref={textNodeRef}
            x={radius/2}
            y={radius - (element.fontSize || 14)/2}
            width={radius}
            height={element.fontSize || 14}
            text={displayText}
            fontSize={element.fontSize || 14}
            fontFamily={getAvailableFontFamily()}
            fill={textColor}
            align="center"
            verticalAlign="middle"
            fontStyle={hasContent ? 'normal' : 'italic'}
            ellipsis={true}
            wrap="none"
            onTransformEnd={handleTransformEnd}
          />
        )}
      </Group>
      
      {/* Transformer with corner-only handles - same pattern as StickyNoteShape */}
      {isSelected && !cleanupEditorRef.current && (
        <Transformer
          ref={transformerRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={false}
          borderStroke="#22C55E"
          borderStrokeWidth={1}
          anchorStroke="#22C55E"
          anchorFill="#ffffff"
          anchorSize={6}
          anchorStrokeWidth={1}
          keepRatio={true} // Keep circular shape
          ignoreStroke={true}
          boundBoxFunc={(oldBox, newBox) => {
            const MIN_SIZE = 50;
            const size = Math.max(MIN_SIZE, Math.max(newBox.width, newBox.height));
            
            return {
              ...newBox,
              width: size,
              height: size,
            };
          }}
        />
      )}
    </>
  );
});

CircleShape.displayName = 'CircleShape';
