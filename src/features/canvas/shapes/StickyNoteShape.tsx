// src/features/canvas/shapes/StickyNoteShape.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { Group, Rect, Text, Transformer, Line, Circle, Image } from 'react-konva';
import Konva from 'konva';
import { StickyNoteElement, ElementId, CanvasElement, isMarkerElement, isHighlighterElement, isTextElement, isConnectorElement, isImageElement, isTableElement, isPenElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { measureTextDimensions } from '../utils/textEditingUtils';
import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';
import { logger } from "@/core/lib/logger";
import { nanoid } from 'nanoid';

/**
 * Create text editor for sticky notes - adapted from TextShape
 */
const createStickyNoteTextEditor = (
  position: { left: number; top: number; width: number; height: number; fontSize: number },
  initialText: string,
  fontSize: number,
  fontFamily: string,
  backgroundColor: string | undefined,
  textColor: string,
  onSave: (text: string, isBlurringToCanvas?: boolean) => void,
  onCancel: () => void,
  onRealtimeUpdate?: (text: string, dimensions: { width: number; height: number }) => void
) => {
const textarea = document.createElement('textarea');
  
  // Style the textarea to overlay the sticky note
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
    color: textColor,
    background: backgroundColor || 'rgba(255, 255, 255, 0.95)',
    border: 'none', // Remove blue border during editing
    borderRadius: '8px',
    padding: '12px',
    resize: 'none',
    outline: 'none',
    zIndex: '10000',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    boxSizing: 'border-box'
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

  const handleInput = () => {
    const text = textarea.value;
// Real-time updates disabled to prevent typing interference
    // if (onRealtimeUpdate) {
    //   const dimensions = measureTextDimensions(text, fontSize, fontFamily, 600, false);
    //   onRealtimeUpdate(text, dimensions);
    // }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
if (e.key === 'Escape') {
      e.preventDefault();
cleanup();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
const text = textarea.value;
      cleanup();
      onSave(text);
    }
    // Allow Enter for line breaks in sticky notes
  };

  const handleDocumentMousedown = (e: MouseEvent) => {
    if (!textarea.contains(e.target as Node)) {
const text = textarea.value;
      cleanup();
      onSave(text, true);
    }
  };

  const cleanup = () => {
textarea.removeEventListener('input', handleInput);
    textarea.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('mousedown', handleDocumentMousedown);
    // Delay removal to next tick to allow click event to propagate to canvas
    setTimeout(() => {
      if (document.body.contains(textarea)) {
        document.body.removeChild(textarea);
      }
    }, 0);
  };

  textarea.addEventListener('input', handleInput);
  textarea.addEventListener('keydown', handleKeyDown);
  // Use a global mousedown listener to detect clicks outside
  setTimeout(() => {
    window.addEventListener('mousedown', handleDocumentMousedown);
  }, 0);

  return cleanup;
};

interface StickyNoteShapeProps {
  element: StickyNoteElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null> | undefined;
}

/**
 * StickyNoteShape - Follows exact same pattern as TextShape but with sticky note styling
 * - Uses createTextEditor for text input (same as TextShape)
 * - Proper Transformer with corner-only handles
 * - Sticky note background color and styling
 * - Alt+drag duplication support
 */
export const StickyNoteShape: React.FC<StickyNoteShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
  onUpdate,
  stageRef
}) => {
  // Store selectors - same pattern as TextShape
  const textEditingElementId = useUnifiedCanvasStore(state => state.textEditingElementId);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const getStickyNoteChildren = useUnifiedCanvasStore(state => state.getStickyNoteChildren);
  const addElementToStickyNote = useUnifiedCanvasStore(state => state.addElementToStickyNote);
  const findStickyNoteAtPoint = useUnifiedCanvasStore(state => state.findStickyNoteAtPoint);
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  
  // Refs - sticky note specific pattern
  const groupRef = useRef<Konva.Group>(null);
  const rectRef = useRef<Konva.Rect>(null); // Main shape for transformer
  const textNodeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const cleanupEditorRef = useRef<(() => void) | null>(null);
  const isDuplicating = useRef<boolean>(false);
  
  const width = element.width || 180;
  const height = element.height || 180;
  
  // Ensure fonts are loaded
  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  // Attach transformer to rect when selected - standard Konva pattern
  useEffect(() => {
    if (isSelected && transformerRef.current && rectRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
}
  }, [isSelected, element.id]);

  // Calculate textarea position for text editing - simplified version of TextShape
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
      left: containerRect.left + (groupPos.x + 15) * scale,
      top: containerRect.top + (groupPos.y + 15) * scale, 
      width: Math.max((width - 30) * scale, 120),
      height: Math.max((height - 30) * scale, 60),
      fontSize: Math.max(11, Math.min(16, (element.fontSize || 14) * scale))
    };
  }, [stageRef, width, height, element.fontSize]);

  // Handle double-click to start editing - same pattern as TextShape
  const handleDoubleClick = useCallback(() => {
// If already editing, don't start another editor
    if (cleanupEditorRef.current) {
return;
    }
    
    // If any text element is being edited globally, don't start new editing
    if (textEditingElementId && textEditingElementId !== element.id) {
return;
    }
    
    if (!stageRef?.current) {
return;
    }

    // Deselect element when entering edit mode to hide transformer
    const store = useUnifiedCanvasStore.getState();
    store.clearSelection();

    const positionData = calculateTextareaPosition();
    if (!positionData) {
return;
    }
const cleanup = createStickyNoteTextEditor(
      positionData,
      element.text || '',
      positionData.fontSize,
      element.fontFamily || getAvailableFontFamily(),
      element.backgroundColor,
      element.textColor || '#1F2937',
      (newText: string, isBlurringToCanvas?: boolean) => {
const finalText = newText.trim();
        
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
        
        onUpdate(element.id, {
          text: finalText,
          updatedAt: Date.now()
        });
        
        if (isBlurringToCanvas) {
          useUnifiedCanvasStore.getState().clearSelection();
        } else {
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
        }
      },
      () => {
cleanupEditorRef.current = null;
        setTextEditingElement(null);
      }
      // Removed real-time updates to prevent text input interference
    );

    cleanupEditorRef.current = cleanup;
  }, [element, calculateTextareaPosition, setTextEditingElement, onUpdate, stageRef]);

  // Alt+drag duplication handler
  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // Check if Alt key is pressed during drag start
    const nativeEvent = e.evt as DragEvent;
    if (nativeEvent.altKey) {
      isDuplicating.current = true;
      
      // Create duplicate element
      const duplicatedElement: StickyNoteElement = {
        ...element,
        id: nanoid() as ElementId,
        x: element.x + 20, // Offset slightly
        y: element.y + 20,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Add the duplicate to canvas
      addElement(duplicatedElement);
      
      logger.log('🗒️ [STICKY NOTE] Alt+drag duplication created:', duplicatedElement.id);
    }
  }, [element, addElement]);

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

  // Add drag move handler to force re-renders during drag for smooth child element movement
  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Force a re-render to update child element positions during drag
    // This is needed because child elements use the current visual position
    if (groupRef.current) {
      groupRef.current.getLayer()?.batchDraw();
    }
  }, []);

  // Transform handler - standard Konva pattern for Rect
  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const rect = rectRef.current;
    if (!rect) return;
    
    const scaleX = rect.scaleX();
    const scaleY = rect.scaleY();
    
    // Calculate new dimensions
    const newWidth = Math.max(120, rect.width() * scaleX);
    const newHeight = Math.max(80, rect.height() * scaleY);
    
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
}, [element.id, onUpdate]);

  // Text editing effect - same pattern as TextShape but triggered programmatically
  useEffect(() => {
if (textEditingElementId !== element.id || !stageRef?.current) {
      if (textEditingElementId === element.id && !stageRef?.current) {
}
      return;
    }

    const positionData = calculateTextareaPosition();
    if (!positionData) {
return;
    }
const cleanup = createStickyNoteTextEditor(
      positionData,
      element.text || '',
      positionData.fontSize,
      element.fontFamily || getAvailableFontFamily(),
      element.backgroundColor,
      element.textColor || '#1F2937',
      (newText: string, isBlurringToCanvas?: boolean) => {
const finalText = newText.trim();

        cleanupEditorRef.current = null;
        setTextEditingElement(null);

        onUpdate(element.id, {
          text: finalText,
          updatedAt: Date.now()
        });

        if (isBlurringToCanvas) {
          // User clicked away on canvas; simply clear selection.
          useUnifiedCanvasStore.getState().clearSelection();
        } else {
          // For standard programmatic edit completion, keep selection workflow.
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
        }
      },
      () => {
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
      }
      // Removed real-time updates to prevent text input interference
    );

    cleanupEditorRef.current = cleanup;

    return () => {
      if (cleanupEditorRef.current) {
        cleanupEditorRef.current();
        cleanupEditorRef.current = null;
      }
    };
  }, [textEditingElementId, element.id, calculateTextareaPosition, element.text, element.fontFamily, element.backgroundColor, element.textColor, onUpdate, setTextEditingElement, stageRef]);
  
  const hasContent = element.text && element.text.trim().length > 0;
  const displayText = hasContent ? element.text! : 'Add text';
  const textColor = hasContent 
    ? (element.textColor || '#1F2937')
    : '#9CA3AF'; // Light gray for placeholder
  
  // Use the element's background color or default soft pastel yellow
  const backgroundColor = element.backgroundColor || '#FFF2CC';
  
  // Calculate border color (slightly darker than background) for new soft pastels
  const getBorderColor = (bgColor: string): string => {
    // Simple darkening for soft pastel colors
    const colorMap: Record<string, string> = {
      '#FFF2CC': '#F4E4A6', // Soft Yellow
      '#E8F5E8': '#D4E6D4', // Soft Green
      '#E0F7F7': '#C7E9E9', // Soft Teal
      '#E6F3FF': '#CCE7FF', // Soft Blue
      '#F0E6FF': '#E1CCFF', // Soft Violet
      '#FFE6F2': '#FFCCDD', // Soft Pink
      '#FFE8E6': '#FFCCCC', // Soft Coral
      '#FFF0E6': '#FFD9B3', // Soft Peach
      '#FFFFFF': '#E5E7EB', // White
      '#F5F5F5': '#E0E0E0', // Soft Gray
      // Legacy colors for backward compatibility
      '#FFE299': '#F4E4A6', // Old yellow
    };
    
    return colorMap[bgColor] || '#E0E0E0';
  };

  const borderColor = getBorderColor(backgroundColor);
  
  // Dynamic font size calculation based on element dimensions (with reasonable bounds)
  const baseFontSize = element.fontSize || 14;
  const finalFontSize = Math.max(10, Math.min(18, baseFontSize));

  // Get child elements if this is a container
  const childElements = element.isContainer ? getStickyNoteChildren(element.id) : [];

  // Render child elements with proper clipping
  const renderChildElements = () => {
    if (!element.isContainer || !childElements.length) return null;

    // Get the current visual position of the group (handles drag state)
    const currentX = groupRef.current?.x() ?? element.x;
    const currentY = groupRef.current?.y() ?? element.y;

    return childElements.map(child => {
      // Adjust child position relative to sticky note's current visual position
      const relativeX = child.x - currentX;
      const relativeY = child.y - currentY;

      if (isMarkerElement(child)) {
        // Render marker strokes
        return (
          <Line
            key={child.id}
            points={child.points.map((point, index) => 
              index % 2 === 0 ? point - currentX : point - currentY
            )}
            stroke={child.style.color}
            strokeWidth={child.style.width}
            opacity={child.style.opacity}
            lineCap="round"
            lineJoin="round"
            tension={child.style.smoothness * 0.5}
            globalCompositeOperation="source-over"
            listening={false}
            clipX={0}
            clipY={0}
            clipWidth={width}
            clipHeight={height}
          />
        );
      }

      if (isHighlighterElement(child)) {
        // Render highlighter strokes
        return (
          <Line
            key={child.id}
            points={child.points.map((point, index) => 
              index % 2 === 0 ? point - currentX : point - currentY
            )}
            stroke={child.style.color}
            strokeWidth={child.style.width}
            opacity={child.style.opacity}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation="source-over"
            listening={false}
            clipX={0}
            clipY={0}
            clipWidth={width}
            clipHeight={height}
          />
        );
      }

      if (isTextElement(child)) {
        // Render text elements
        return (
          <Text
            key={child.id}
            x={relativeX}
            y={relativeY}
            text={child.text}
            fontSize={child.fontSize || 14}
            fontFamily={child.fontFamily || getAvailableFontFamily()}
            fill={child.fill || '#000000'}
            width={child.width}
            height={child.height}
            wrap="word"
            align={child.textAlign || 'left'}
            listening={false}
            clipX={0}
            clipY={0}
            clipWidth={width}
            clipHeight={height}
          />
        );
      }

      if (isConnectorElement(child)) {
        // Render connector lines/arrows
        const pathPoints = child.pathPoints || [
          child.startPoint.x - currentX, child.startPoint.y - currentY,
          child.endPoint.x - currentX, child.endPoint.y - currentY
        ];

        return (
          <Line
            key={child.id}
            points={pathPoints}
            stroke={child.stroke || '#6366F1'}
            strokeWidth={child.strokeWidth || 2}
            listening={false}
            clipX={0}
            clipY={0}
            clipWidth={width}
            clipHeight={height}
          />
        );
      }

      if (isImageElement(child)) {
        // For images, we'll need to handle them differently since they require image loading
        // For now, render a placeholder rectangle
        return (
          <Rect
            key={child.id}
            x={relativeX}
            y={relativeY}
            width={child.width}
            height={child.height}
            fill="#E5E7EB"
            stroke="#9CA3AF"
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
            clipX={0}
            clipY={0}
            clipWidth={width}
            clipHeight={height}
          />
        );
      }

      if (isPenElement(child)) {
        return (
          <Line
            key={child.id}
            points={child.points.map((point, index) =>
              index % 2 === 0 ? point - currentX : point - currentY
            )}
            stroke={child.stroke || '#000000'}
            strokeWidth={child.strokeWidth || 2}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
            globalCompositeOperation="source-over"
            listening={false}
            clipX={0}
            clipY={0}
            clipWidth={width}
            clipHeight={height}
          />
        );
      }

      // For other element types, render a simple placeholder
      return (
        <Rect
          key={child.id}
          x={relativeX}
          y={relativeY}
          width={(child as any).width || 20}
          height={(child as any).height || 20}
          fill="#F3F4F6"
          stroke="#D1D5DB"
          strokeWidth={1}
          listening={false}
          clipX={0}
          clipY={0}
          clipWidth={width}
          clipHeight={height}
        />
      );
    });
  };

  // Determine if events should pass through for drawing tools
      const drawingTools = ['pen', 'marker', 'highlighter', 'eraser'];
  const shouldAllowDrawing = drawingTools.includes(selectedTool);

  // Filter out stroke-related properties from konvaProps to prevent blue borders
  const { stroke, strokeWidth, shadowColor, shadowBlur, shadowOpacity, ...filteredKonvaProps } = konvaProps;

  return (
    <>
      <Group
        {...filteredKonvaProps}
        ref={groupRef}
        id={element.id}
        onDblClick={handleDoubleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        draggable={!shouldAllowDrawing}
        listening={!shouldAllowDrawing}
      >
        {/* Sticky note background */}
        <Rect
          ref={rectRef}
          width={width}
          height={height}
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={1}
          cornerRadius={8}
          onTransformEnd={handleTransformEnd}
        />
        
        {/* Child elements - rendered with clipping */}
        <Group
          clipX={5}
          clipY={5}
          clipWidth={width - 10}
          clipHeight={height - 10}
        >
          {renderChildElements()}
        </Group>

        {/* Text content - positioned above child elements */}
        <Text
          ref={textNodeRef}
          x={15}
          y={15}
          width={width - 30}
          height={Math.min(height - 30, hasContent ? 40 : height - 30)}
          text={displayText}
          fontSize={finalFontSize}
          fontFamily={getAvailableFontFamily()}
          fill={textColor}
          wrap="word"
          align="left"
          verticalAlign="top"
          fontStyle={hasContent ? 'normal' : 'italic'}
          lineHeight={1.4}
          onTransformEnd={handleTransformEnd}
        />
      </Group>
      
      {/* Transformer with corner-only handles - same pattern as TextShape */}
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
            const MIN_WIDTH = 120;
            const MIN_HEIGHT = 80;
            
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

StickyNoteShape.displayName = 'StickyNoteShape';

