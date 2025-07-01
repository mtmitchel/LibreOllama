// src/components/canvas/shapes/RectangleShape.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { RectangleElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { measureTextDimensions } from '../utils/textEditingUtils';
import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';
import { nanoid } from 'nanoid';

/**
 * Create text editor for rectangles - adapted from StickyNoteShape
 */
const createRectangleTextEditor = (
  position: { left: number; top: number; width: number; height: number; fontSize: number },
  initialText: string,
  fontSize: number,
  fontFamily: string,
  onSave: (text: string) => void,
  onCancel: () => void
) => {
  console.log('🟨 [RectangleTextEditor] Creating text editor:', position);

  const textarea = document.createElement('textarea');
  
  // Style the textarea to overlay the rectangle
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
    background: 'rgba(59, 130, 246, 0.1)',
    border: '2px solid #3B82F6',
    borderRadius: '4px',
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

interface RectangleShapeProps {
  element: RectangleElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null> | undefined;
}

/**
 * RectangleShape - Following exact StickyNoteShape pattern
 */
export const RectangleShape: React.FC<RectangleShapeProps> = React.memo(({
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
  const rectRef = useRef<Konva.Rect>(null); // Main shape for transformer
  const textNodeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const cleanupEditorRef = useRef<(() => void) | null>(null);
  const isDuplicating = useRef<boolean>(false);
  
  const width = element.width || 120;
  const height = element.height || 80;
  
  // Ensure fonts are loaded
  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  // Attach transformer to rect when selected - standard Konva pattern
  useEffect(() => {
    if (isSelected && transformerRef.current && rectRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
      console.log('🔄 [RectangleShape] Transformer attached to rect:', element.id);
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
      left: containerRect.left + (groupPos.x + 8) * scale,
      top: containerRect.top + (groupPos.y + height/2 - 10) * scale, 
      width: Math.max((width - 16) * scale, 120),
      height: Math.max(20 * scale, 20),
      fontSize: Math.max(11, Math.min(16, (element.fontSize || 14) * scale))
    };
  }, [stageRef, width, height, element.fontSize]);

  // Handle double-click to start editing - same pattern as StickyNoteShape
  const handleDoubleClick = useCallback(() => {
    console.log('🟨 [RectangleShape] Double-click detected, entering edit mode');
    
    if (cleanupEditorRef.current) {
      console.log('⚠️ [RectangleShape] Already in edit mode, ignoring double-click');
      return;
    }
    
    if (textEditingElementId && textEditingElementId !== element.id) {
      console.log('⚠️ [RectangleShape] Another text element is being edited, ignoring double-click');
      return;
    }
    
    if (!stageRef?.current) {
      console.warn('⚠️ [RectangleShape] No stage ref available for editing');
      return;
    }

    // CRITICAL: Set text editing state FIRST to hide Konva Text immediately
    setTextEditingElement(element.id);

    // Deselect element when entering edit mode to hide transformer
    const store = useUnifiedCanvasStore.getState();
    store.clearSelection();

    const positionData = calculateTextareaPosition();
    if (!positionData) {
      console.warn('⚠️ [RectangleShape] Could not calculate textarea position');
      setTextEditingElement(null); // Reset if we can't create editor
      return;
    }

    console.log('✏️ [RectangleShape] Starting edit mode with position:', positionData);

    const cleanup = createRectangleTextEditor(
      positionData,
      element.text || '',
      positionData.fontSize,
      element.fontFamily || getAvailableFontFamily(),
      (newText: string) => {
        console.log('💾 [RectangleShape] Saving text:', newText);
        
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
        console.log('❌ [RectangleShape] Edit cancelled');
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
      }
    );

    cleanupEditorRef.current = cleanup;
  }, [element, calculateTextareaPosition, setTextEditingElement, onUpdate, stageRef]);

  // Transform handler - standard Konva pattern for Rect
  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const rect = rectRef.current;
    if (!rect) return;
    
    const scaleX = rect.scaleX();
    const scaleY = rect.scaleY();
    
    // Calculate new dimensions
    const newWidth = Math.max(60, rect.width() * scaleX);
    const newHeight = Math.max(40, rect.height() * scaleY);
    
    // Reset scale to 1 (standard Konva pattern)
    rect.scaleX(1);
    rect.scaleY(1);
    
    // Update element dimensions
    onUpdate(element.id, {
      x: rect.x(),
      y: rect.y(),
      width: newWidth,
      height: newHeight,
      updatedAt: Date.now()
    });
    
    console.log('🔄 [RectangleShape] Transform complete:', { newWidth, newHeight });
  }, [element.id, onUpdate]);

  // Text editing effect - same pattern as StickyNoteShape
  useEffect(() => {
    if (textEditingElementId !== element.id || !stageRef?.current) {
      // Clean up any existing editor when this element is no longer being edited
      if (cleanupEditorRef.current && textEditingElementId !== element.id) {
        console.log('🟨 [RectangleShape] Cleaning up editor - element no longer being edited');
        cleanupEditorRef.current();
        cleanupEditorRef.current = null;
      }
      return;
    }

    // Prevent multiple editors for the same element
    if (cleanupEditorRef.current) {
      console.log('🟨 [RectangleShape] Editor already exists, skipping creation');
      return;
    }

    const positionData = calculateTextareaPosition();
    if (!positionData) {
      console.warn('🟨 [RectangleShape] ⚠️ Could not calculate position data for text editing');
      return;
    }

    console.log('🟨 [RectangleShape] *** STARTING PROGRAMMATIC TEXT EDITING ***', element.id);

    const cleanup = createRectangleTextEditor(
      positionData,
      element.text || '',
      positionData.fontSize,
      element.fontFamily || getAvailableFontFamily(),
      (newText: string) => {
        console.log('💾 [RectangleShape] Saving programmatic text:', newText);
        
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
        {/* Rectangle background */}
        <Rect
          ref={rectRef}
          width={width}
          height={height}
          fill={element.fill || '#3B82F6'}
          stroke={element.stroke || '#1E40AF'}
          strokeWidth={element.strokeWidth || 2}
          cornerRadius={element.cornerRadius || 4}
          onTransformEnd={handleTransformEnd}
        />

        {/* Text content - ONLY render when NOT being edited */}
        {!isCurrentlyEditing && (
          <Text
            ref={textNodeRef}
            x={8}
            y={height/2 - (element.fontSize || 14)/2}
            width={width - 16}
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
          borderStroke="#3B82F6"
          borderStrokeWidth={1}
          anchorStroke="#3B82F6"
          anchorFill="#ffffff"
          anchorSize={6}
          anchorStrokeWidth={1}
          keepRatio={false}
          ignoreStroke={true}
          boundBoxFunc={(oldBox, newBox) => {
            const MIN_WIDTH = 60;
            const MIN_HEIGHT = 40;
            
            return {
              ...newBox,
              width: Math.max(MIN_WIDTH, newBox.width),
              height: Math.max(MIN_HEIGHT, newBox.height),
            };
          }}
        />
      )}
    </>
  );
});

RectangleShape.displayName = 'RectangleShape';
