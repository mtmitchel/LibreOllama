// src/components/canvas/shapes/TextShape.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { Text, Group, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { TextElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { designSystem } from '../../../core/design-system';
import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';

interface TextShapeProps {
  element: TextElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null> | undefined;
}

/**
 * HYBRID TEXT EDITING CONFIGURATION
 * DOM input during editing, canvas text when finalized - following FigJam patterns
 */
const TEXT_CONFIG = {
  PADDING: 8,
  MIN_WIDTH: 80,
  MIN_HEIGHT: 32,
  MAX_WIDTH: 800,
  MAX_HEIGHT: 600,
  LINE_HEIGHT: 1.25,
  FONT_WEIGHT: '400',
  LETTER_SPACING: 0, // Number, not string
  EDIT_BACKGROUND: '#ffffff',
  EDIT_BORDER: '2px solid #3b82f6',
  FONT_COLOR: '#000000',
} as const;

/**
 * Measure text dimensions using Konva's native measurement
 */
const measureTextDimensions = (text: string, fontSize: number, fontFamily: string, maxWidth: number = 600) => {
  if (!text || text.trim().length === 0) {
    return {
      width: TEXT_CONFIG.MIN_WIDTH,
      height: TEXT_CONFIG.MIN_HEIGHT,
    };
  }

  const tempText = new Konva.Text({
    text: text,
    fontSize: fontSize,
    fontFamily: fontFamily,
    fontWeight: TEXT_CONFIG.FONT_WEIGHT,
    lineHeight: TEXT_CONFIG.LINE_HEIGHT,
    letterSpacing: TEXT_CONFIG.LETTER_SPACING,
    wrap: 'word',
    width: maxWidth - TEXT_CONFIG.PADDING,
  });

  const textWidth = tempText.getTextWidth();
  const textHeight = tempText.height(); // Use height() instead of deprecated getTextHeight()

  tempText.destroy();

  return {
    width: Math.min(Math.max(textWidth + TEXT_CONFIG.PADDING, TEXT_CONFIG.MIN_WIDTH), maxWidth),
    height: Math.max(textHeight + TEXT_CONFIG.PADDING, TEXT_CONFIG.MIN_HEIGHT),
  };
};

/**
 * Create positioned DOM textarea for editing
 */
const createTextEditor = (
  position: { left: number; top: number; width: number; height: number },
  initialText: string,
  fontSize: number,
  fontFamily: string,
  onSave: (text: string) => void,
  onCancel: () => void
) => {
  const textarea = document.createElement('textarea');
  
  // Calculate initial dimensions based on content
  const hasContent = initialText.trim().length > 0;
  const lineCount = hasContent ? initialText.split('\n').length : 1;
  const lineHeight = fontSize * TEXT_CONFIG.LINE_HEIGHT;
  
  // For new text: compact size. For existing text: match content size
  const initialWidth = hasContent ? Math.max(200, position.width) : Math.max(150, position.width);
  const initialHeight = hasContent 
    ? Math.max(lineCount * lineHeight + 16, 40) // Content-based height with padding
    : Math.max(40, lineHeight + 16); // Single line height
  
  console.log('🎯 [TextEditor] Creating textarea with dimensions:', {
    hasContent,
    lineCount,
    lineHeight,
    initialWidth,
    initialHeight,
    fontSize,
    initialText: initialText.substring(0, 50) + (initialText.length > 50 ? '...' : '')
  });
  
  // Style to match canvas text exactly with proper auto-sizing
  Object.assign(textarea.style, {
    position: 'fixed',
    left: `${position.left}px`,
    top: `${position.top}px`,
    width: `${initialWidth}px`,
    height: `${initialHeight}px`,
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    fontWeight: TEXT_CONFIG.FONT_WEIGHT,
    lineHeight: TEXT_CONFIG.LINE_HEIGHT.toString(),
    color: '#000000',
    background: '#ffffff',
    border: '2px solid #3b82f6',
    borderRadius: '4px',
    padding: '8px',
    resize: 'none',
    outline: 'none',
    zIndex: '10000',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    boxSizing: 'border-box',
    textAlign: 'left',
    verticalAlign: 'top',
    // Allow for smooth height transitions
    transition: 'height 0.1s ease',
  });

  // Set value and placeholder
  textarea.value = initialText;
  textarea.placeholder = 'Add text';
  textarea.setAttribute('autocomplete', 'off');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('autocapitalize', 'off');
  textarea.setAttribute('spellcheck', 'false');

  document.body.appendChild(textarea);
  
  // Auto-resize function to adjust height as content changes
  const autoResize = () => {
    // Reset height to measure scroll height
    textarea.style.height = 'auto';
    
    // Calculate required height
    const contentHeight = textarea.scrollHeight;
    const minHeight = lineHeight + 16; // Single line + padding
    const maxHeight = lineHeight * 10 + 16; // Max 10 lines + padding
    
    const newHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
    
    // Enable scrolling if content exceeds max height
    textarea.style.overflow = newHeight >= maxHeight ? 'auto' : 'hidden';
  };
  
  // Initial sizing
  autoResize();
  
  textarea.focus();
  
  // For new elements (empty text), position cursor at start
  if (initialText.trim().length === 0) {
    textarea.setSelectionRange(0, 0);
  } else {
    textarea.select();
  }

  const handleInput = () => {
    autoResize();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
      onCancel();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = textarea.value;
      cleanup();
      onSave(text);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const text = textarea.value;
      cleanup();
      onSave(text);
    }
    // Allow Enter with Shift for new lines
  };

  const handleBlur = () => {
    const text = textarea.value;
    cleanup();
    onSave(text);
  };

  const cleanup = () => {
    textarea.removeEventListener('input', handleInput);
    textarea.removeEventListener('keydown', handleKeyDown);
    textarea.removeEventListener('blur', handleBlur);
    if (document.body.contains(textarea)) {
      document.body.removeChild(textarea);
    }
  };

  textarea.addEventListener('input', handleInput);
  textarea.addEventListener('keydown', handleKeyDown);
  textarea.addEventListener('blur', handleBlur);

  return cleanup;
};

/**
 * TextShape - FigJam-style hybrid text editing
 */
export const TextShape: React.FC<TextShapeProps> = ({
  element,
  isSelected,
  konvaProps,
  onUpdate,
  stageRef,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const textNodeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const cleanupEditorRef = useRef<(() => void) | null>(null);

  // Store state for programmatic text editing
  const textEditingElementId = useUnifiedCanvasStore(state => state.textEditingElementId);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);

  // Using direct textarea approach with store integration
  console.log('🎯 [TextShape] Rendering text element:', {
    id: element.id,
    text: element.text?.substring(0, 30) + (element.text?.length > 30 ? '...' : ''),
    position: { x: element.x, y: element.y },
    dimensions: { width: element.width, height: element.height },
    fontSize: element.fontSize
  });

  // Ensure fonts are loaded
  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  // Text properties
  const safeText = (element.text && element.text.trim().length > 0) ? element.text : 'Text';
  const finalFontSize = element.fontSize || 16;
  const textColor = element.fill || TEXT_CONFIG.FONT_COLOR;
  const fontFamily = element.fontFamily || getAvailableFontFamily();

  // Calculate dimensions based on actual content
  const measuredDimensions = React.useMemo(
    () => measureTextDimensions(safeText, finalFontSize, fontFamily),
    [safeText, finalFontSize, fontFamily]
  );

  const elementWidth = element.width || measuredDimensions.width;
  const elementHeight = element.height || measuredDimensions.height;

  // Always show canvas text (no editing state to hide it)
  const shouldShowCanvasText = element.text && element.text.trim().length > 0;
  // Always render Text component for ref purposes, even if invisible
  const shouldRenderTextForRef = true;

  // Auto-resize when text changes significantly
  React.useEffect(() => {
    if (element.text && element.text.trim().length > 0) {
      const currentWidth = element.width || measuredDimensions.width;
      const currentHeight = element.height || measuredDimensions.height;
      
      const widthDiff = Math.abs(measuredDimensions.width - currentWidth);
      const heightDiff = Math.abs(measuredDimensions.height - currentHeight);
      
      if (widthDiff > 10 || heightDiff > 10) {
        onUpdate(element.id, {
          width: measuredDimensions.width,
          height: measuredDimensions.height
        });
      }
    }
  }, [element.text, element.id, onUpdate, measuredDimensions.width, measuredDimensions.height]);

  /**
   * Calculate textarea position based on text bounds and canvas transforms
   */
  const calculateTextareaPosition = useCallback(() => {
    if (!stageRef?.current || !textNodeRef.current) {
      console.warn('⚠️ [TextShape] Missing stage or text ref for position calculation');
      return null;
    }

    const stage = stageRef.current;
    const textNode = textNodeRef.current;
    
    // Get the actual rendered bounds of the text (including any scaling)
    const textBounds = textNode.getClientRect();
    
    // Get stage position and scale
    const stageBox = stage.container().getBoundingClientRect();
    const stageAttrs = stage.attrs;
    const stageScale = stageAttrs.scaleX || 1;
    
    // Calculate screen position accounting for stage transform
    const screenX = stageBox.left + (textBounds.x - (stageAttrs.x || 0)) * stageScale;
    const screenY = stageBox.top + (textBounds.y - (stageAttrs.y || 0)) * stageScale;
    
    // For scaled text, we want the textarea to match the visual size
    const scaledWidth = textBounds.width * stageScale;
    const scaledHeight = textBounds.height * stageScale;
    
    // Get the current font size (may be scaled)
    const currentFontSize = element.fontSize || 16;
    const effectiveScale = (element.scaleX || 1) * stageScale;
    const effectiveFontSize = currentFontSize * effectiveScale;
    
    console.log('📐 [TextShape] Position calculation:', {
      textBounds,
      stageBox,
      stageScale,
      effectiveScale,
      screenPosition: { x: screenX, y: screenY },
      dimensions: { width: scaledWidth, height: scaledHeight },
      fontSize: { current: currentFontSize, effective: effectiveFontSize },
      element: { 
        text: element.text?.substring(0, 30) + (element.text?.length > 30 ? '...' : ''),
        scale: { x: element.scaleX, y: element.scaleY }
      }
    });

    return {
      left: screenX,
      top: screenY,
      width: scaledWidth,
      height: scaledHeight,
      fontSize: effectiveFontSize
    };
  }, [element, stageRef]);

  // Auto-start editing when this element is set as the editing target in the store
  useEffect(() => {
    if (textEditingElementId === element.id && !cleanupEditorRef.current) {
      console.log('🔄 [TextShape] Store triggered editing for element:', element.id);
      
      // Function to attempt starting editing with retries
      const attemptStartEditing = (retryCount = 0) => {
        if (!stageRef?.current || !textNodeRef.current) {
          if (retryCount < 5) {
            console.log(`⏳ [TextShape] Refs not ready, retrying... (${retryCount + 1}/5)`);
            setTimeout(() => attemptStartEditing(retryCount + 1), 100);
            return;
          } else {
            console.warn('⚠️ [TextShape] Cannot start programmatic editing - missing refs after retries');
            setTextEditingElement(null); // Clear the editing state
            return;
          }
        }
        
        const positionData = calculateTextareaPosition();
        if (!positionData) {
          console.warn('⚠️ [TextShape] Cannot calculate position for programmatic editing');
          setTextEditingElement(null); // Clear the editing state
          return;
        }
        
        console.log('✏️ [TextShape] Starting programmatic edit mode with position:', positionData);
        
        const cleanup = createTextEditor(
          positionData,
          element.text || '',
          positionData.fontSize,
          element.fontFamily || TEXT_CONFIG.FONT_FAMILY,
          (newText: string) => {
            console.log('💾 [TextShape] Saving programmatic text:', newText);
            
            const finalText = newText.trim();
            
            // Calculate new dimensions for the text
            const newDimensions = measureTextDimensions(finalText, element.fontSize || 16, element.fontFamily || TEXT_CONFIG.FONT_FAMILY);
            
            // Update element with new text and auto-calculated dimensions
            onUpdate(element.id, {
              text: finalText,
              width: newDimensions.width,
              height: newDimensions.height,
              updatedAt: Date.now()
            });
            
            // Clear editing state
            cleanupEditorRef.current = null;
            setTextEditingElement(null);
            
            // Auto-select the text element and switch to select tool (FigJam-style UX)
            setTimeout(() => {
              const store = useUnifiedCanvasStore.getState();
              store.selectElement(element.id, false); // Select this element exclusively
              store.setSelectedTool('select'); // Switch to select tool for immediate interaction
              console.log('✅ [TextShape] Auto-selected text element and switched to select tool');
            }, 50);
          },
          () => {
            console.log('❌ [TextShape] Programmatic edit cancelled');
            // Clear editing state
            cleanupEditorRef.current = null;
            setTextEditingElement(null);
          }
        );
        
        // Store cleanup function to track editing state
        cleanupEditorRef.current = cleanup;
      };
      
      // Start the attempt with a small initial delay
      setTimeout(() => attemptStartEditing(), 50);
    }
  }, [textEditingElementId, element.id, calculateTextareaPosition, element.text, element.fontFamily, element.fontSize, onUpdate, setTextEditingElement, stageRef]);

  // Handle double-click to start editing
  const handleDoubleClick = useCallback(() => {
    console.log('🖱️ [TextShape] Double-click detected, entering edit mode');
    
    // If already editing, don't start another editor
    if (cleanupEditorRef.current) {
      console.log('⚠️ [TextShape] Already in edit mode, ignoring double-click');
      return;
    }
    
    if (!stageRef?.current) {
      console.warn('⚠️ [TextShape] No stage ref available for editing');
      return;
    }

    const positionData = calculateTextareaPosition();
    if (!positionData) {
      console.warn('⚠️ [TextShape] Could not calculate textarea position');
      return;
    }

    console.log('✏️ [TextShape] Starting edit mode with position:', positionData);

    const cleanup = createTextEditor(
      positionData,
      element.text || '',
      positionData.fontSize,
      element.fontFamily || TEXT_CONFIG.FONT_FAMILY,
      (newText: string) => {
        console.log('💾 [TextShape] Saving text:', newText);
        
        const finalText = newText.trim();
        
        // Calculate new dimensions for the text
        const newDimensions = measureTextDimensions(finalText, element.fontSize || 16, element.fontFamily || TEXT_CONFIG.FONT_FAMILY);
        
        // Update element with new text and auto-calculated dimensions
        onUpdate(element.id, {
          text: finalText,
          width: newDimensions.width,
          height: newDimensions.height,
          updatedAt: Date.now()
        });
        
        // Clear editing state
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
        
        // Auto-select the text element and switch to select tool (FigJam-style UX)
        setTimeout(() => {
          const store = useUnifiedCanvasStore.getState();
          store.selectElement(element.id, false); // Select this element exclusively
          store.setSelectedTool('select'); // Switch to select tool for immediate interaction
          console.log('✅ [TextShape] Auto-selected text element and switched to select tool');
        }, 50);
      },
      () => {
        console.log('❌ [TextShape] Edit cancelled');
        // Clear editing state
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
      }
    );

    // Store cleanup function to track editing state
    cleanupEditorRef.current = cleanup;
  }, [element, onUpdate, calculateTextareaPosition, setTextEditingElement]);

  // Handle transformer
  useEffect(() => {
    if (isSelected && !cleanupEditorRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.forceUpdate();
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, groupRef.current, transformerRef.current]);

  // Handle drag
  const handleDragEnd = React.useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (!groupRef.current) return;
    
    const group = groupRef.current;
    onUpdate(element.id, {
      x: group.x(),
      y: group.y(),
    });
  }, [element.id, onUpdate]);

  // Handle transform (including rotation)
  const handleTransformEnd = React.useCallback(() => {
    if (!groupRef.current) return;

    const group = groupRef.current;
    const scaleX = group.scaleX();
    const scaleY = group.scaleY();
    const rotation = group.rotation();

    // Prepare updates object
    const updates: any = {
      x: group.x(),
      y: group.y(),
    };

    // Handle rotation (always store rotation, even if 0)
    updates.rotation = rotation;
    if (rotation !== 0) {
      console.log('🔄 [TextShape] Rotation updated:', rotation, 'degrees');
    }

    // Handle scaling
    if (scaleX !== 1 || scaleY !== 1) {
      const newWidth = Math.max(TEXT_CONFIG.MIN_WIDTH, elementWidth * scaleX);
      const newHeight = Math.max(TEXT_CONFIG.MIN_HEIGHT, elementHeight * scaleY);
      const fontScale = Math.sqrt(scaleX * scaleY);
      const newFontSize = Math.max(8, Math.min(72, finalFontSize * fontScale));

      updates.width = newWidth;
      updates.height = newHeight;
      updates.fontSize = newFontSize;

      // Reset scale after applying to dimensions
      group.scaleX(1);
      group.scaleY(1);
    }

    onUpdate(element.id, updates);
  }, [element.id, onUpdate, elementWidth, elementHeight, finalFontSize]);

  // Handle rotation start for cursor feedback
  const handleRotateStart = React.useCallback(() => {
    console.log('🔄 [TextShape] Started rotating element:', element.id);
    if (stageRef?.current) {
      stageRef.current.container().style.cursor = 'grabbing';
    }
  }, [element.id, stageRef]);

  // Handle rotation end for cursor reset
  const handleRotateEnd = React.useCallback(() => {
    console.log('🔄 [TextShape] Finished rotating element:', element.id);
    if (stageRef?.current) {
      stageRef.current.container().style.cursor = 'default';
    }
  }, [element.id, stageRef]);





  return (
    <>
      {/* Only render the canvas element when NOT editing to prevent ghosting */}
      {!cleanupEditorRef.current && (
        <Group
          {...konvaProps}
          ref={groupRef}
          id={element.id}
          x={element.x}
          y={element.y}
          width={elementWidth}
          height={elementHeight}
          rotation={element.rotation || 0}
          draggable={true}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          onDblClick={handleDoubleClick}
          listening={true}
        >
          {/* Background (when set) */}
          {element.backgroundColor && (
            <Rect
              x={0}
              y={0}
              width={elementWidth}
              height={elementHeight}
              fill={element.backgroundColor}
              cornerRadius={3}
              listening={false}
            />
          )}
          
          {/* Main text - always render for ref, but only visible if there's actual text content */}
          {shouldRenderTextForRef && (
            <Text
              ref={textNodeRef}
              x={TEXT_CONFIG.PADDING / 2}
              y={TEXT_CONFIG.PADDING / 2}
              width={elementWidth - TEXT_CONFIG.PADDING}
              height={elementHeight - TEXT_CONFIG.PADDING}
              text={shouldShowCanvasText ? safeText : 'Text'} // Use placeholder for positioning when empty
              fontSize={finalFontSize}
              fontFamily={fontFamily}
              fontWeight={TEXT_CONFIG.FONT_WEIGHT}
              fill={textColor}
              align={element.textAlign || 'left'}
              verticalAlign='top'
              wrap='word'
              lineHeight={TEXT_CONFIG.LINE_HEIGHT}
              letterSpacing={TEXT_CONFIG.LETTER_SPACING}
              listening={true}
              opacity={shouldShowCanvasText ? 1 : 0} // Hide when empty but keep for positioning
            />
          )}
        </Group>
      )}
      
      {/* Hidden placeholder group during editing - maintains refs but invisible */}
      {cleanupEditorRef.current && (
        <Group
          {...konvaProps}
          ref={groupRef}
          id={element.id}
          x={element.x}
          y={element.y}
          width={elementWidth}
          height={elementHeight}
          visible={false} // Completely hidden during editing
          listening={false}
          onDblClick={handleDoubleClick}
        />
      )}
      
      {/* Transformer for resizing and rotation - only when not editing */}
      {isSelected && !cleanupEditorRef.current && (
        <Transformer
          ref={transformerRef}
          borderStroke="#007AFF"
          borderStrokeWidth={2}
          borderDash={[]}
          anchorStroke="#007AFF"
          anchorFill="#FFFFFF"
          anchorStrokeWidth={2}
          anchorSize={8}
          anchorCornerRadius={2}
          rotateEnabled={false}
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
          ]}
          keepRatio={false}
          flipEnabled={false}
          padding={5}

          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < TEXT_CONFIG.MIN_WIDTH || 
                Math.abs(newBox.height) < TEXT_CONFIG.MIN_HEIGHT) {
              return oldBox;
            }
            if (Math.abs(newBox.width) > TEXT_CONFIG.MAX_WIDTH || 
                Math.abs(newBox.height) > TEXT_CONFIG.MAX_HEIGHT) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

TextShape.displayName = 'TextShape';

