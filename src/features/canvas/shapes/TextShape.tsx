// src/components/canvas/shapes/TextShape.tsx
import React, { useEffect, useRef, useCallback, memo } from 'react';
import { Text, Group, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { TextElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { designSystem } from '../../../core/design-system';
import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';
import { measureTextDimensions, CANVAS_TEXT_CONFIG } from '../utils/textEditingUtils';
import { debounce } from '../utils/debounce';
import { devLog } from '../../../utils/devLog';

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
 * Using consolidated config from textEditingUtils with local overrides
 */
const TEXT_CONFIG = {
  ...CANVAS_TEXT_CONFIG,
  EDIT_BACKGROUND: '#ffffff',
  EDIT_BORDER: '2px solid #3b82f6',
} as const;

// Remove duplicate function - now using consolidated measureTextDimensions from textEditingUtils

/**
 * Auto-hug utility: Ensures text element always tightly fits its content
 */
const autoHugTextContent = (
  element: TextElement,
  fontFamily: string,
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void
) => {
  if (!element.text || element.text.trim().length === 0) return;
  
  const currentFontSize = element.fontSize || 16;
  const huggedDimensions = measureTextDimensions(
    element.text,
    currentFontSize,
    fontFamily,
    600,
    true // Enforce minimums for final auto-hug
  );
  
  // Only update if dimensions actually changed to prevent unnecessary re-renders
  const needsUpdate = 
    Math.abs((element.width || 0) - huggedDimensions.width) > 2 ||
    Math.abs((element.height || 0) - huggedDimensions.height) > 2;
    
  if (needsUpdate) {
    devLog.debug('🤏 [TextShape] Auto-hugging text content:', {
      elementId: element.id,
      oldDimensions: { width: element.width, height: element.height },
      newDimensions: huggedDimensions
    });
    
    onUpdate(element.id, {
      width: huggedDimensions.width,
      height: huggedDimensions.height,
      updatedAt: Date.now()
    });
  }
};

/**
 * Create positioned DOM textarea for editing
 */
const createTextEditor = (
  position: { left: number; top: number; width: number; height: number },
  initialText: string,
  fontSize: number,
  fontFamily: string,
  backgroundColor: string | undefined,
  textColor: string,
  onSave: (text: string) => void,
  onCancel: () => void,
  onRealtimeUpdate?: (text: string, dimensions: { width: number; height: number }) => void
) => {
  const textarea = document.createElement('textarea');
  
  devLog.debug('🎯 [TextEditor] Creating textarea with exact dimensions:', {
    position,
    fontSize,
    initialText: initialText.substring(0, 50) + (initialText.length > 50 ? '...' : '')
  });
  
  // Style to be completely invisible - user sees the canvas text box instead
  Object.assign(textarea.style, {
    position: 'fixed',
    left: `${position.left}px`,
    top: `${position.top}px`,
    width: `${position.width}px`,
    height: `${position.height}px`,
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    fontWeight: TEXT_CONFIG.FONT_WEIGHT,
    lineHeight: TEXT_CONFIG.LINE_HEIGHT.toString(),
    color: 'transparent', // Make text invisible - user sees canvas version
    background: 'transparent',
    border: 'none',
    borderRadius: '0',
    padding: `${TEXT_CONFIG.PADDING / 2}px`,
    resize: 'none',
    outline: 'none',
    zIndex: '10000',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    boxSizing: 'border-box',
    textAlign: 'left',
    verticalAlign: 'top',
    caretColor: '#3B82F6', // Show blue cursor
    // Invisible textarea - user interacts with canvas visually
    opacity: 0.01, // Almost invisible but still functional
  });

  // Set value and placeholder
  textarea.value = initialText;
  textarea.placeholder = 'Add text';
  textarea.setAttribute('autocomplete', 'off');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('autocapitalize', 'off');
  textarea.setAttribute('spellcheck', 'false');

  document.body.appendChild(textarea);
  
  textarea.focus();
  
  // For new elements (empty text), position cursor at start
  if (initialText.trim().length === 0) {
    textarea.setSelectionRange(0, 0);
  } else {
    textarea.select();
  }

  // PERFORMANCE OPTIMIZATION: Debounced store updates
  const debouncedStoreUpdate = debounce((text: string, dimensions: { width: number; height: number }) => {
    if (onRealtimeUpdate) {
      if (process.env.NODE_ENV === 'development') {
        devLog.debug('📝 [TextEditor] Debounced store update:', { text: text.substring(0, 20), dimensions });
      }
      onRealtimeUpdate(text, dimensions);
    }
  }, 150); // 150ms debounce - smooth typing without performance loss

  const handleInput = () => {
    // Auto-expand text box as user types (FigJam behavior)
    const currentText = textarea.value;
    // Always measure with actual text or minimum placeholder size
    const textToMeasure = currentText.trim().length > 0 ? currentText : 'Add text';
    // Use enforceMinimums: false for real-time updates to get true text dimensions
    const newDimensions = measureTextDimensions(textToMeasure, fontSize, fontFamily, 600, false);
    
    if (process.env.NODE_ENV === 'development') {
      devLog.debug('📝 [TextEditor] Input event - measuring:', { 
        currentText: currentText.substring(0, 20), 
        textToMeasure, 
        newDimensions 
      });
    }
    
    // Update textarea size IMMEDIATELY for responsive UX
    textarea.style.width = `${newDimensions.width}px`;
    textarea.style.height = `${newDimensions.height}px`;
    
    // Update canvas element with DEBOUNCING to reduce performance impact
    debouncedStoreUpdate(currentText, newDimensions);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    devLog.debug('📝 [TextEditor] Key pressed:', e.key);
    if (e.key === 'Escape') {
      e.preventDefault();
      devLog.debug('📝 [TextEditor] Escape - cancelling');
      cleanup();
      onCancel();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      devLog.debug('📝 [TextEditor] Enter - saving');
      const text = textarea.value;
      cleanup();
      onSave(text);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      devLog.debug('📝 [TextEditor] Tab - saving');
      const text = textarea.value;
      cleanup();
      onSave(text);
    }
    // Allow Enter with Shift for new lines
  };

  const handleBlur = () => {
    devLog.debug('📝 [TextEditor] Blur event - saving');
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
export const TextShape: React.FC<TextShapeProps> = memo(({
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
  devLog.debug('🎯 [TextShape] *** RENDERING TEXT ELEMENT ***:', {
    id: element.id,
    text: element.text?.substring(0, 30) + (element.text?.length > 30 ? '...' : ''),
    position: { x: element.x, y: element.y },
    dimensions: { width: element.width, height: element.height },
    fontSize: element.fontSize,
    isSelected,
    isEditing: !!cleanupEditorRef.current,
    textEditingElementId,
    isEditingThis: textEditingElementId === element.id,
    showBlueBorder: (!!cleanupEditorRef.current || (!element.text || element.text.trim().length === 0))
  });

  // React-Konva transformer pattern: manually attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && textNodeRef.current) {
      // Attach transformer to text node
      transformerRef.current.nodes([textNodeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
      devLog.debug('🔄 [TextShape] Transformer attached for element:', element.id);
      
      // Reset any unwanted scales that might have been applied
      const textNode = textNodeRef.current;
      if (textNode.scaleX() !== 1 || textNode.scaleY() !== 1) {
        devLog.debug('🔄 [TextShape] Resetting unwanted scales on selection:', { scaleX: textNode.scaleX(), scaleY: textNode.scaleY() });
        textNode.scaleX(1);
        textNode.scaleY(1);
      }
    } else if (transformerRef.current) {
      // Detach transformer when not selected
      transformerRef.current.nodes([]);
      devLog.debug('🔄 [TextShape] Transformer detached for element:', element.id);
    }
  }, [isSelected, element.id]);

  // Ensure fonts are loaded
  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  // Auto-hug effect: Ensure text always tightly fits content when text/fontSize changes
  useEffect(() => {
    // Skip if we're currently editing to avoid interference
    if (cleanupEditorRef.current) return;
    
    // Skip if no text content
    if (!element.text || element.text.trim().length === 0) return;
    
    // Auto-hug the content to ensure tight bounds
    autoHugTextContent(element, element.fontFamily || getAvailableFontFamily(), onUpdate);
  }, [element.text, element.fontSize, element.fontFamily, onUpdate]); // Trigger on text or fontSize changes

  // Text properties
  const finalFontSize = element.fontSize || 16;
  const textColor = element.fill || TEXT_CONFIG.FONT_COLOR;
  const fontFamily = element.fontFamily || getAvailableFontFamily();
  
  // Determine what text to display
  const isEditing = !!cleanupEditorRef.current;
  const hasText = element.text && element.text.trim().length > 0;
  
  let displayText: string;
  let displayColor: string;
  let displayOpacity: number;
  
  if (isEditing) {
    // During editing: show current text or placeholder
    displayText = hasText ? element.text : 'Add text';
    displayColor = hasText ? textColor : '#94A3B8';
    displayOpacity = hasText ? 1 : 0.8;
  } else {
    // Not editing: show text or hide
    displayText = hasText ? element.text : 'Text';
    displayColor = textColor;
    displayOpacity = hasText ? 1 : 0;
  }

  // Calculate dimensions based on actual content or placeholder
  const measuredDimensions = React.useMemo(() => {
    const dimensions = measureTextDimensions(displayText, finalFontSize, fontFamily, 600, true);
    devLog.debug('📐 [TextShape] Calculated dimensions:', {
      displayText: displayText.substring(0, 20),
      fontSize: finalFontSize,
      calculated: dimensions,
      current: { width: element.width, height: element.height }
    });
    return dimensions;
  }, [displayText, finalFontSize, fontFamily]);

  const elementWidth = element.width || measuredDimensions.width;
  const elementHeight = element.height || measuredDimensions.height;
  
  // Ensure Group bounds are correct after any scaling or dimension changes
  React.useEffect(() => {
    if (groupRef.current) {
      const group = groupRef.current;
      // Force the group to update its bounds
      group.width(elementWidth);
      group.height(elementHeight);
      group.getLayer()?.batchDraw();
      
      devLog.debug('🔧 [TextShape] Updated Group bounds:', {
        elementId: element.id,
        groupBounds: { width: elementWidth, height: elementHeight },
        groupPosition: { x: element.x, y: element.y }
      });
    }
  }, [elementWidth, elementHeight, element.x, element.y, element.id]);

  /**
   * Calculate textarea position based on text bounds and canvas transforms
   */
  const calculateTextareaPosition = useCallback(() => {
    if (!stageRef?.current || !groupRef.current) {
return null;
    }

    const stage = stageRef.current;
    const group = groupRef.current;
    
    // Get the actual rendered bounds of the group (including any transforms)
    const groupBounds = group.getClientRect();
    
    // Get stage position and scale
    const stageBox = stage.container().getBoundingClientRect();
    const stageAttrs = stage.attrs;
    const stageScale = stageAttrs.scaleX || 1;
    
    // Calculate screen position accounting for stage transform
    const screenX = stageBox.left + (groupBounds.x - (stageAttrs.x || 0)) * stageScale;
    const screenY = stageBox.top + (groupBounds.y - (stageAttrs.y || 0)) * stageScale;
    
    // For scaled elements, we want the textarea to match the visual size
    const scaledWidth = groupBounds.width * stageScale;
    const scaledHeight = groupBounds.height * stageScale;
    
    // Get the current font size (may be scaled)
    const currentFontSize = element.fontSize || 16;
    // Note: TextElement doesn't have scaleX, so we assume no element-level scaling
    const effectiveScale = stageScale;
    const effectiveFontSize = currentFontSize * effectiveScale;
    
    devLog.debug('📐 [TextShape] Position calculation:', {
      groupBounds,
      stageBox,
      stageScale,
      effectiveScale,
      screenPosition: { x: screenX, y: screenY },
      dimensions: { width: scaledWidth, height: scaledHeight },
      fontSize: { current: currentFontSize, effective: effectiveFontSize }
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
      devLog.debug('🔄 [TextShape] *** STORE TRIGGERED EDITING ***:', element.id);
      
      // Function to attempt starting editing with retries
      const attemptStartEditing = (retryCount = 0) => {
        if (!stageRef?.current || !textNodeRef.current) {
          if (retryCount < 5) {
            devLog.debug(`⏳ [TextShape] Refs not ready, retrying... (${retryCount + 1}/5)`);
            setTimeout(() => attemptStartEditing(retryCount + 1), 100);
            return;
          } else {
setTextEditingElement(null); // Clear the editing state
            return;
          }
        }
        
        const positionData = calculateTextareaPosition();
        if (!positionData) {
setTextEditingElement(null); // Clear the editing state
          return;
        }
        
        devLog.debug('✏️ [TextShape] *** STARTING PROGRAMMATIC EDIT MODE ***:', positionData);
        
        // Deselect element when entering edit mode to hide transformer
        const store = useUnifiedCanvasStore.getState();
        store.clearSelection();
        
        const cleanup = createTextEditor(
          positionData,
          element.text || '',
          positionData.fontSize,
          element.fontFamily || getAvailableFontFamily(),
          undefined, // TextElement doesn't have backgroundColor
          textColor,
          (newText: string) => {
            devLog.debug('💾 [TextShape] Saving programmatic text:', newText);
            
            const finalText = newText.trim();
            
            // Update element with new text first
            onUpdate(element.id, {
              text: finalText,
              updatedAt: Date.now()
            });
            
            devLog.debug('💾 [TextShape] *** STARTING SAVE SEQUENCE ***:', { finalText, elementId: element.id });
            
            // Clear editing state first
            cleanupEditorRef.current = null;
            setTextEditingElement(null);
            
            // First update the text content
            onUpdate(element.id, {
              text: finalText,
              updatedAt: Date.now()
            });
            
            // Then auto-hug and select in sequence
            setTimeout(() => {
              devLog.debug('💾 [TextShape] Auto-hugging content');
              // Use the same approach as real-time updates - don't enforce minimums for final sizing
              const finalDimensions = measureTextDimensions(
                finalText,
                element.fontSize || 16,
                element.fontFamily || getAvailableFontFamily(),
                600,
                false // Don't enforce minimums - keep true text dimensions
              );
              
              devLog.debug('💾 [TextShape] Final auto-hug dimensions:', finalDimensions);
              
              onUpdate(element.id, {
                width: Math.max(finalDimensions.width, 20), // Only ensure basic minimum
                height: Math.max(finalDimensions.height, 24),
                updatedAt: Date.now()
              });
              
              // Wait longer for auto-hug to complete, then select
              setTimeout(() => {
                const store = useUnifiedCanvasStore.getState();
                devLog.debug('🎯 [TextShape] *** ATTEMPTING AUTO-SELECT ***:', element.id);
                
                // Ensure we switch to select tool first
                store.setSelectedTool('select');
                
                // Clear and then select
                setTimeout(() => {
                  store.clearSelection();
                  setTimeout(() => {
                    store.selectElement(element.id, false);
                    devLog.debug('✅ [TextShape] Auto-selection complete');
                    
                    // Verify selection worked
                    setTimeout(() => {
                      const newState = useUnifiedCanvasStore.getState();
                      devLog.debug('🔍 [TextShape] Selection verification:', {
                        selectedIds: Array.from(newState.selectedElementIds),
                        targetId: element.id,
                        isSelected: newState.selectedElementIds.has(element.id),
                        currentTool: newState.selectedTool
                      });
                    }, 100);
                  }, 50);
                }, 50);
              }, 200); // Longer delay for auto-hug to complete
            }, 50);
          },
          () => {
            devLog.debug('❌ [TextShape] Programmatic edit cancelled');
            // Clear editing state
            cleanupEditorRef.current = null;
            setTextEditingElement(null);
          },
          (text: string, dimensions: { width: number; height: number }) => {
            // Real-time update during typing (FigJam-style auto-hug)
            devLog.debug('🔄 [TextShape] Real-time update:', { text: text.substring(0, 20), dimensions });
            
            // Always update text content, but be more selective about dimension updates
            const currentWidth = element.width || 20;
            const currentHeight = element.height || 24;
            const widthDiff = Math.abs(currentWidth - dimensions.width);
            const heightDiff = Math.abs(currentHeight - dimensions.height);
            
            // Update if text changed or dimensions changed significantly
            if (text !== element.text || widthDiff > 3 || heightDiff > 2) {
              devLog.debug('🔄 [TextShape] Applying real-time update - change detected:', {
                textChanged: text !== element.text,
                widthDiff,
                heightDiff
              });
              
              onUpdate(element.id, {
                text: text,
                width: Math.max(dimensions.width, 20), // Ensure minimum visual width
                height: Math.max(dimensions.height, 24), // Ensure minimum visual height
                updatedAt: Date.now()
              });
            } else {
              devLog.debug('🔄 [TextShape] Skipping real-time update - change too small');
            }
          }
        );
        
        // Store cleanup function to track editing state
        cleanupEditorRef.current = cleanup;
      };
      
      // Start the attempt with a small initial delay
      setTimeout(() => attemptStartEditing(), 50);
    }
  }, [textEditingElementId, element.id, calculateTextareaPosition, element.text, element.fontFamily, element.fontSize, textColor, onUpdate, setTextEditingElement, stageRef]);

  // Handle double-click to start editing
  const handleDoubleClick = useCallback(() => {
    devLog.debug('🖱️ [TextShape] Double-click detected, entering edit mode');
    
    // If already editing, don't start another editor
    if (cleanupEditorRef.current) {
      devLog.debug('⚠️ [TextShape] Already in edit mode, ignoring double-click');
      return;
    }
    
    // If any text element is being edited globally, don't start new editing
    if (textEditingElementId && textEditingElementId !== element.id) {
      devLog.debug('⚠️ [TextShape] Another text element is being edited, ignoring double-click');
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

    devLog.debug('✏️ [TextShape] Starting edit mode with position:', positionData);

    const cleanup = createTextEditor(
      positionData,
      element.text || '',
      positionData.fontSize,
      element.fontFamily || getAvailableFontFamily(),
      undefined, // TextElement doesn't have backgroundColor
      textColor,
      (newText: string) => {
        devLog.debug('💾 [TextShape] Saving text:', newText);
        
        const finalText = newText.trim();
        
        // Update element with new text first
        onUpdate(element.id, {
          text: finalText,
          updatedAt: Date.now()
        });
        
        devLog.debug('💾 [TextShape] *** DOUBLE-CLICK SAVE SEQUENCE ***:', { finalText, elementId: element.id });
        
        // Clear editing state first
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
        
        // First update the text content
        onUpdate(element.id, {
          text: finalText,
          updatedAt: Date.now()
        });
        
        // Then auto-hug and select in sequence
        setTimeout(() => {
          devLog.debug('💾 [TextShape] Auto-hugging content (double-click)');
          // Use the same approach as real-time updates - don't enforce minimums for final sizing
          const finalDimensions = measureTextDimensions(
            finalText,
            element.fontSize || 16,
            element.fontFamily || getAvailableFontFamily(),
            600,
            false // Don't enforce minimums - keep true text dimensions
          );
          
          devLog.debug('💾 [TextShape] Final auto-hug dimensions (double-click):', finalDimensions);
          
          onUpdate(element.id, {
            width: Math.max(finalDimensions.width, 20), // Only ensure basic minimum
            height: Math.max(finalDimensions.height, 24),
            updatedAt: Date.now()
          });
          
          // Wait longer for auto-hug to complete, then select
          setTimeout(() => {
            const store = useUnifiedCanvasStore.getState();
            devLog.debug('🎯 [TextShape] *** ATTEMPTING AUTO-SELECT (double-click) ***:', element.id);
            
            // Ensure we switch to select tool first
            store.setSelectedTool('select');
            
            // Clear and then select
            setTimeout(() => {
              store.clearSelection();
              setTimeout(() => {
                store.selectElement(element.id, false);
                devLog.debug('✅ [TextShape] Auto-selection complete (double-click)');
                
                // Verify selection worked
                setTimeout(() => {
                  const newState = useUnifiedCanvasStore.getState();
                  devLog.debug('🔍 [TextShape] Selection verification (double-click):', {
                    selectedIds: Array.from(newState.selectedElementIds),
                    targetId: element.id,
                    isSelected: newState.selectedElementIds.has(element.id),
                    currentTool: newState.selectedTool
                  });
                }, 100);
              }, 50);
            }, 50);
          }, 200); // Longer delay for auto-hug to complete
        }, 50);
      },
      () => {
        devLog.debug('❌ [TextShape] Edit cancelled');
        // Clear editing state
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
      },
              (text: string, dimensions: { width: number; height: number }) => {
          // Real-time update during typing (FigJam-style auto-hug)
          devLog.debug('🔄 [TextShape] Real-time update:', { text: text.substring(0, 20), dimensions });
          
          // Always update text content, but be more selective about dimension updates
          const currentWidth = element.width || 20;
          const currentHeight = element.height || 24;
          const widthDiff = Math.abs(currentWidth - dimensions.width);
          const heightDiff = Math.abs(currentHeight - dimensions.height);
          
          // Update if text changed or dimensions changed significantly
          if (text !== element.text || widthDiff > 3 || heightDiff > 2) {
            devLog.debug('🔄 [TextShape] Applying real-time update - change detected:', {
              textChanged: text !== element.text,
              widthDiff,
              heightDiff
            });
            
            onUpdate(element.id, {
              text: text,
              width: Math.max(dimensions.width, 20), // Ensure minimum visual width
              height: Math.max(dimensions.height, 24), // Ensure minimum visual height
              updatedAt: Date.now()
            });
          } else {
            devLog.debug('🔄 [TextShape] Skipping real-time update - change too small');
          }
        }
    );

    // Store cleanup function to track editing state
    cleanupEditorRef.current = cleanup;
  }, [element, onUpdate, calculateTextareaPosition, setTextEditingElement, textColor]);

  // Handle drag
  const handleDragEnd = React.useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Don't handle drag events while editing
    if (cleanupEditorRef.current) {
      devLog.debug('🚫 [TextShape] Drag ignored - text editing in progress');
      return;
    }
    
    if (!groupRef.current) return;
    
    const group = groupRef.current;
    devLog.debug('🎯 [TextShape] Drag end - updating position:', { x: group.x(), y: group.y() });
    
    onUpdate(element.id, {
      x: group.x(),
      y: group.y(),
    });
  }, [element.id, onUpdate]);

  // Track when text editing ends to prevent immediate transforms
  const lastEditEndTime = React.useRef<number>(0);
  
  // Update last edit end time when editing completes
  React.useEffect(() => {
    if (textEditingElementId === element.id) {
      // Text editing started - reset timer
      lastEditEndTime.current = 0;
    } else if (lastEditEndTime.current === 0 && !textEditingElementId) {
      // Text editing ended - set timer
      lastEditEndTime.current = Date.now();
    }
  }, [textEditingElementId, element.id]);

  // React-Konva transform pattern: handle transform end on Text component
  const handleTransformEnd = React.useCallback((e: Konva.KonvaEventObject<Event>) => {
    const target = e.target;
    
    // Only handle transforms from the transformer, not from the text node directly
    if (target.className !== 'Transformer') {
      devLog.debug('🔄 [TextShape] Transform ignored - not from Transformer:', target.className);
      return;
    }
    
    // Get the text node that's being transformed
    const nodes = (target as any).nodes();
    if (!nodes || nodes.length === 0) return;
    
    const textNode = nodes[0] as Konva.Text;
    if (!textNode || textNode.id() !== `${element.id}-text`) return;
    
    // Prevent transform handling during text editing
    if (cleanupEditorRef.current) {
      devLog.debug('🔄 [TextShape] Transform ignored - text editing in progress');
      return;
    }
    
    // Prevent transforms immediately after text editing (auto-selection protection)
    const timeSinceEdit = Date.now() - lastEditEndTime.current;
    if (timeSinceEdit < 1000) { // 1 second protection window
      devLog.debug('🔄 [TextShape] Transform ignored - too soon after text editing:', timeSinceEdit + 'ms');
      // Reset any unwanted scales
      textNode.scaleX(1);
      textNode.scaleY(1);
      return;
    }
    
    devLog.debug('🔄 [TextShape] Transform end - checking scales');
    
    const scaleX = textNode.scaleX();
    const scaleY = textNode.scaleY();
    
    devLog.debug('🔄 [TextShape] Transform scales:', { scaleX, scaleY });
    
    // Only apply scaling if there's a significant change AND user intentionally scaled
    // Ignore automatic scaling from selection/rendering
    if (Math.abs(scaleX - 1) < 0.15 && Math.abs(scaleY - 1) < 0.15) {
      devLog.debug('🔄 [TextShape] Scale change too small, ignoring');
      // Reset any minor scale changes
      textNode.scaleX(1);
      textNode.scaleY(1);
      return;
    }
    
    // Additional check: ignore extreme scaling that might be from bugs
    if (scaleX > 3 || scaleY > 3 || scaleX < 0.3 || scaleY < 0.3) {
      devLog.debug('🔄 [TextShape] Extreme scaling detected, ignoring and resetting:', { scaleX, scaleY });
      textNode.scaleX(1);
      textNode.scaleY(1);
      return;
    }
    
    devLog.debug('🔄 [TextShape] Applying proportional scaling');
    
    // Use average scale to maintain proportions
    const avgScale = (scaleX + scaleY) / 2;
    
    // Calculate new font size based on scale
    const currentFontSize = element.fontSize || 16;
    const newFontSize = Math.max(8, Math.min(72, currentFontSize * avgScale));
    
    devLog.debug('🔄 [TextShape] Scaling font:', { currentFontSize, avgScale, newFontSize });
    
    // Reset scale after applying to fontSize
    textNode.scaleX(1);
    textNode.scaleY(1);
    
    // Calculate final dimensions based on new font size and auto-hug
    const finalDimensions = measureTextDimensions(
      element.text || 'Text',
      newFontSize,
      element.fontFamily || getAvailableFontFamily(),
      600,
      false // Don't enforce minimums for text scaling
    );
    
    devLog.debug('🔄 [TextShape] Final dimensions:', finalDimensions);
    
    // Update element with new font size and auto-calculated dimensions
    onUpdate(element.id, {
      fontSize: newFontSize,
      width: Math.max(finalDimensions.width, 20),
      height: Math.max(finalDimensions.height, 24),
      x: textNode.x(),
      y: textNode.y(),
      updatedAt: Date.now()
    });
    
    devLog.debug('✅ [TextShape] Transform complete with auto-hug');
    
  }, [element, onUpdate]);

  return (
    <>
      {/* Always render the canvas element - show blue border during editing */}
      <Group
        {...konvaProps}
        ref={groupRef}
        id={element.id}
        x={element.x}
        y={element.y}
        width={elementWidth}
        height={elementHeight}
        rotation={element.rotation || 0}
        draggable={true} // Always draggable, but handle editing state in event handlers
        onDragEnd={handleDragEnd}
        onDblClick={handleDoubleClick}
        onClick={(e) => {
          devLog.debug('🖱️ [TextShape] Group clicked:', { 
            elementId: element.id, 
            targetId: e.target.id(),
            targetClass: e.target.className,
            editing: !!cleanupEditorRef.current 
          });
        }}
        onMouseDown={(e) => {
          devLog.debug('🖱️ [TextShape] Group mouse down:', { 
            elementId: element.id, 
            targetId: e.target.id(),
            targetClass: e.target.className 
          });
        }}
        listening={true} // Always listen for interactions
      >
        {/* Blue border during editing OR for new empty elements (FigJam style) */}
        {(cleanupEditorRef.current || (!element.text || element.text.trim().length === 0)) && (
          <Rect
            x={-2}
            y={-2}
            width={elementWidth + 4}
            height={elementHeight + 4}
            stroke="#3B82F6"
            strokeWidth={2}
            fill="rgba(255, 255, 255, 0.95)"
            cornerRadius={4}
            listening={false}
          />
        )}
        
        {/* Main text */}
        <Text
          ref={textNodeRef}
          id={`${element.id}-text`}
          x={TEXT_CONFIG.PADDING / 2}
          y={TEXT_CONFIG.PADDING / 2}
          width={elementWidth - TEXT_CONFIG.PADDING}
          height={elementHeight - TEXT_CONFIG.PADDING}
          text={displayText}
          fontSize={finalFontSize}
          fontFamily={fontFamily}
          fontWeight={TEXT_CONFIG.FONT_WEIGHT}
          fill={displayColor}
          align={element.textAlign || 'left'}
          verticalAlign='top'
          wrap='word'
          lineHeight={TEXT_CONFIG.LINE_HEIGHT}
          letterSpacing={TEXT_CONFIG.LETTER_SPACING}
          listening={true} // Enable listening to help with click detection
          opacity={displayOpacity}
          draggable={false}
          onClick={(e) => {
            devLog.debug('🖱️ [TextShape] Text clicked:', { 
              elementId: element.id, 
              textNodeId: e.target.id(),
              editing: !!cleanupEditorRef.current 
            });
          }}
          onTransformEnd={handleTransformEnd}
        />
      </Group>
      
      {/* React-Konva Transformer - only render when selected and not editing */}
      {isSelected && !cleanupEditorRef.current && (
        <Transformer
          ref={transformerRef}
          flipEnabled={false}
          rotateEnabled={false}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          anchorSize={8}
          anchorFill="#ffffff"
          anchorStroke="#3B82F6"
          anchorStrokeWidth={2}
          borderStroke="#3B82F6"
          borderStrokeWidth={2}
          borderDash={[]}
          padding={0}
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) => {
            // Prevent making text too small
            if (newBox.width < 30 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
      
      {/* No hidden group needed - main group handles all states */}
    </>
  );
}, (prevProps, nextProps) => {
  // Memoization comparison function for performance
  return (
    prevProps.element.id === nextProps.element.id &&
    prevProps.element.x === nextProps.element.x &&
    prevProps.element.y === nextProps.element.y &&
    prevProps.element.text === nextProps.element.text &&
    prevProps.element.fontSize === nextProps.element.fontSize &&
    prevProps.element.updatedAt === nextProps.element.updatedAt &&
    prevProps.isSelected === nextProps.isSelected
  );
});

TextShape.displayName = 'TextShape';

