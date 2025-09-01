// src/components/canvas/shapes/TextShape.tsx
import { useEffect, useRef, useCallback, memo, useMemo, type FC, type MutableRefObject } from 'react';
import { Text, Group, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { TextElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { useShapeCaching } from '../hooks/useShapeCaching';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';

import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';
import { measureText } from '../utils/textUtils';
import { debounce } from '../utils/debounce';
import { calculateScreenCoordinates } from '../utils/coordinateUtils';
// Removed devLog import - debug logging cleaned up for performance

interface TextShapeProps {
  element: TextElement;
  isSelected: boolean;
  konvaProps: Record<string, unknown>;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
  stageRef?: MutableRefObject<Konva.Stage | null> | undefined;
}

/**
 * HYBRID TEXT EDITING CONFIGURATION
 * DOM input during editing, canvas text when finalized - following FigJam patterns
 * Using consolidated config from textEditingUtils with local overrides
 */
const TEXT_CONFIG = {
  PADDING: 8,
  MIN_WIDTH: 80,
  MIN_HEIGHT: 32,
  LINE_HEIGHT: 1.25,
  FONT_WEIGHT: '400',
  LETTER_SPACING: 0,
  EDIT_BACKGROUND: '#ffffff',
  EDIT_BORDER: '2px solid #3b82f6',
  CURSOR_COLOR: '#3B82F6',
  CURSOR_WIDTH: 2,
  FONT_COLOR: '#1F2937',
} as const;

// Remove duplicate function - now using consolidated measureText from textUtils

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
  const textDimensions = measureText(element.text || 'A', element.fontSize || 16, fontFamily);
  const huggedDimensions = {
    width: textDimensions.width + TEXT_CONFIG.PADDING * 2,
    height: textDimensions.height + TEXT_CONFIG.PADDING * 2,
  };
  
  // Only update if dimensions actually changed to prevent unnecessary re-renders
  const needsUpdate = 
    Math.abs((element.width || 0) - huggedDimensions.width) > 2 ||
    Math.abs((element.height || 0) - huggedDimensions.height) > 2;
    
  if (needsUpdate) {
    // Auto-hug: update dimensions to fit text content
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
  position: { left: number; top: number; width: number; height: number; fontSize?: number },
  initialText: string,
  fontSize: number,
  fontFamily: string,
  backgroundColor: string | undefined,
  textColor: string,
  baseFontSize: number,
  getPosition: () => { left: number; top: number; width: number; height: number; fontSize?: number } | null,
  onSave: (text: string) => void,
  onCancel: () => void,
  onRealtimeUpdate?: (text: string, dimensions: { width: number; height: number }) => void
) => {
  const textarea = document.createElement('textarea');
  
  const scale = position.fontSize ? position.fontSize / baseFontSize : 1;

  // Style the textarea to match Konva text metrics precisely
  Object.assign(textarea.style, {
    position: 'fixed',
    left: `${position.left}px`,
    top: `${position.top}px`,
    width: `${position.width}px`,
    height: `${position.height}px`,
    fontSize: `${(position.fontSize || fontSize)}px`,
    fontFamily: fontFamily,
    fontWeight: String(TEXT_CONFIG.FONT_WEIGHT),
    lineHeight: String(TEXT_CONFIG.LINE_HEIGHT), // unitless multiplier
    color: 'transparent', // Keep text invisible; caret still visible
    background: 'transparent',
    border: '0',
    borderRadius: '0',
    padding: `${(TEXT_CONFIG.PADDING / 2) * scale}px`,
    resize: 'none',
    outline: 'none',
    zIndex: '10000',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    boxSizing: 'content-box', // critical: scrollHeight excludes padding
    textAlign: 'left',
    verticalAlign: 'top',
    letterSpacing: `${0}px`,
    caretColor: '#3B82F6',
    opacity: '0.01',
  } as CSSStyleDeclaration);

  // Prevent the stage from stealing focus or events while editing
  ;['pointerdown','mousedown','touchstart','wheel'].forEach((ev) => {
    textarea.addEventListener(ev, (e) => {
      e.stopImmediatePropagation?.();
      e.stopPropagation();
      // Do not preventDefault for keyboard text input
    }, { capture: true, passive: false } as any);
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
  const debouncedStoreUpdate = debounce(((text: string, dimensions: { width: number; height: number }) => {
    if (onRealtimeUpdate) {
      onRealtimeUpdate(text, dimensions);
    }
  }) as any, 150); // 150ms debounce - smooth typing without performance loss

  const handleInput = () => {
    const currentText = textarea.value;

    // When typing, keep measurement width matched to the frame width
    const pos = getPosition();
    if (pos) {
      textarea.style.left = `${pos.left}px`;
      textarea.style.top = `${pos.top}px`;
      textarea.style.width = `${pos.width}px`;
      if (pos.fontSize) textarea.style.fontSize = `${pos.fontSize}px`;
    }

    // Let the browser compute the height, then read scrollHeight
    textarea.style.height = 'auto';

    const DESCENDER_GUARD = 0.15; // ~15% of font size prevents caret clipping
    const effectiveFontPx = parseFloat(textarea.style.fontSize || String(fontSize));
    const guardPx = effectiveFontPx * DESCENDER_GUARD;
    const domH = textarea.scrollHeight + guardPx;
    textarea.style.height = `${domH}px`;

    // Convert DOM size back to canvas units using scale from getPosition
    const scale = (pos && pos.fontSize) ? (pos.fontSize / baseFontSize) : 1;
    const canvasH = domH / scale;
    const canvasW = pos ? pos.width / scale : parseFloat(textarea.style.width);
    const newDimensions = { width: canvasW, height: canvasH } as { width: number; height: number };

    debouncedStoreUpdate(currentText, newDimensions);
  };

  const commitWithMeasuredSize = () => {
    const text = textarea.value;
    try {
      const pos = getPosition();
      const scale = (pos && pos.fontSize) ? (pos.fontSize / baseFontSize) : 1;
      textarea.style.height = 'auto';
      const DESCENDER_GUARD = 0.15;
      const effectiveFontPx = parseFloat(textarea.style.fontSize || String(fontSize));
      const domH = textarea.scrollHeight + effectiveFontPx * DESCENDER_GUARD;
      const canvasH = domH / scale;
      const canvasW = pos ? pos.width / scale : parseFloat(textarea.style.width) / scale;
      if (onRealtimeUpdate) onRealtimeUpdate(text, { width: canvasW, height: canvasH });
    } catch {}
    cleanup();
    onSave(text);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
      onCancel();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitWithMeasuredSize();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitWithMeasuredSize();
    }
    // Allow Enter with Shift for new lines
  };


  const handleBlur = () => {
    const text = textarea.value;
    // Finalize height using Konva metrics and snap to DPR to avoid jump
    try {
      const dpr = window.devicePixelRatio || 1;
      const pos = getPosition();
      const scale = (pos && pos.fontSize) ? (pos.fontSize / baseFontSize) : 1;
      textarea.style.height = 'auto';
      const DESCENDER_GUARD = 0.15;
      const effectiveFontPx = parseFloat(textarea.style.fontSize || String(fontSize));
      const domH = textarea.scrollHeight + effectiveFontPx * DESCENDER_GUARD;
      const canvasH = domH / scale;
      const snappedH = Math.round(canvasH * dpr) / dpr;
      debouncedStoreUpdate(text, { width: pos ? pos.width / scale : 0, height: snappedH });
    } catch {}
    cleanup();
    onSave(text);
  };

  let rafId: number | null = null;

  const cleanup = () => {
    textarea.removeEventListener('input', handleInput);
    textarea.removeEventListener('keydown', handleKeyDown);
    textarea.removeEventListener('blur', handleBlur);
    if (rafId) cancelAnimationFrame(rafId);
    if (document.body.contains(textarea)) {
      document.body.removeChild(textarea);
    }
  };

  textarea.addEventListener('input', handleInput);
  textarea.addEventListener('keydown', handleKeyDown);
  textarea.addEventListener('blur', handleBlur);

  // Keep placement in sync with viewport pan/zoom
  const place = () => {
    const pos = getPosition();
    if (!pos) return;
    textarea.style.left = `${pos.left}px`;
    textarea.style.top = `${pos.top}px`;
    textarea.style.width = `${pos.width}px`;
    if (pos.fontSize) textarea.style.fontSize = `${pos.fontSize}px`;
  };

  const raf = () => {
    place();
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);

  return cleanup;
};

/**
 * TextShape - FigJam-style hybrid text editing
 */
export const TextShape: FC<TextShapeProps> = memo(({
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

  // React-Konva transformer pattern: manually attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && textNodeRef.current) {
      // Add null check for the nodes method to prevent test failures
      if (typeof transformerRef.current.nodes === 'function') {
        // Attach transformer to text node
        transformerRef.current.nodes([textNodeRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
        
        // Reset any unwanted scales that might have been applied
        const textNode = textNodeRef.current;
        if (textNode.scaleX() !== 1 || textNode.scaleY() !== 1) {
          textNode.scaleX(1);
          textNode.scaleY(1);
        }
      }
    } else if (transformerRef.current) {
      // Add null check for the nodes method to prevent test failures
      if (typeof transformerRef.current.nodes === 'function') {
        // Detach transformer when not selected
        transformerRef.current.nodes([]);
      }
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
  const measuredDimensions = useMemo(() => {
    const dimensions = measureText(displayText, finalFontSize, fontFamily);
    return dimensions;
  }, [displayText, finalFontSize, fontFamily]);

  const elementWidth = element.width || measuredDimensions.width;
  const elementHeight = element.height || measuredDimensions.height;
  
  // Ensure Group bounds are correct after any scaling or dimension changes
  useEffect(() => {
    if (groupRef.current) {
      const group = groupRef.current;
      // Force the group to update its bounds
      // Add defensive checks for test environment
      if (typeof group.width === 'function') {
        group.width(elementWidth);
      }
      if (typeof group.height === 'function') {
        group.height(elementHeight);
      }
      // Add defensive check for getLayer method
      if (typeof group.getLayer === 'function') {
        group.getLayer()?.batchDraw();
      }
      
      // Group bounds updated for element dimensions
    }
  }, [elementWidth, elementHeight, element.x, element.y, element.id]);

  /**
   * Calculate textarea position using unified coordinate utility
   * Now properly accounts for pan/zoom/rotation in a single utility
   */
  const calculateTextareaPosition = useCallback(() => {
    if (!stageRef?.current || !groupRef.current) {
      return null;
    }

    const stage = stageRef.current;
    const group = groupRef.current;
    
    // Use the unified coordinate utility that handles pan/zoom/rotation
    const screenPosition = calculateScreenCoordinates(stage, group, {
      includeRotation: true,
      baseFontSize: element.fontSize || 16
    });
    
    if (!screenPosition) {
      return null;
    }

    return {
      left: screenPosition.left,
      top: screenPosition.top,
      width: screenPosition.width,
      height: screenPosition.height,
      fontSize: screenPosition.fontSize || (element.fontSize || 16)
    };
  }, [element.fontSize, stageRef]);

  // Auto-start editing when this element is set as the editing target in the store
  useEffect(() => {
    if (textEditingElementId === element.id && !cleanupEditorRef.current) {
      
      // Function to attempt starting editing with retries
      const attemptStartEditing = (retryCount = 0) => {
        if (!stageRef?.current || !textNodeRef.current) {
          if (retryCount < 5) {
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
          element.fontSize || 16,
          () => calculateTextareaPosition(),
          (newText: string) => {
            
            const finalText = newText.trim();
            
            // Update element with new text first
            onUpdate(element.id, {
              text: finalText,
              updatedAt: Date.now()
            });
            
            
            // Clear editing state first
            cleanupEditorRef.current = null;
            setTextEditingElement(null);
            
            // First update the text content
            onUpdate(element.id, {
              text: finalText,
              updatedAt: Date.now()
            });
            
            // Then auto-hug and select in sequence using RAF for better performance
            requestAnimationFrame(() => {
              // Use the same approach as real-time updates - don't enforce minimums for final sizing
              const finalDimensions = measureText(
                finalText,
                element.fontSize || 16,
                element.fontFamily || getAvailableFontFamily(),
              );
              
              
              onUpdate(element.id, {
                width: Math.max(finalDimensions.width, 20), // Only ensure basic minimum
                height: Math.max(finalDimensions.height, 24),
                updatedAt: Date.now()
              });
              
              // Wait for auto-hug to complete, then select using RAF
              requestAnimationFrame(() => {
                const store = useUnifiedCanvasStore.getState();
                
                // Ensure we switch to select tool first
                store.setSelectedTool('select');
                
                // Clear and then select using RAF
                requestAnimationFrame(() => {
                  store.clearSelection();
                  requestAnimationFrame(() => {
                    store.selectElement(element.id, false);
                    
                    // Verify selection worked
                    requestAnimationFrame(() => {
                      const newState = useUnifiedCanvasStore.getState();
                      // Selection verification complete
                    });
                  });
                });
              });
            });
          },
          () => {
            // Clear editing state
            cleanupEditorRef.current = null;
            setTextEditingElement(null);
          },
          (text: string, dimensions: { width: number; height: number }) => {
            // Real-time update during typing (FigJam-style auto-hug)
            
            // Always update text content, but be more selective about dimension updates
            const currentWidth = element.width || 20;
            const currentHeight = element.height || 24;
            const widthDiff = Math.abs(currentWidth - dimensions.width);
            const heightDiff = Math.abs(currentHeight - dimensions.height);
            
            // Update if text changed or dimensions changed significantly
            if (text !== element.text || widthDiff > 3 || heightDiff > 2) {
              // Real-time update with dimension changes
              onUpdate(element.id, {
                text: text,
                width: Math.max(dimensions.width, 20), // Ensure minimum visual width
                height: Math.max(dimensions.height, 24), // Ensure minimum visual height
                updatedAt: Date.now()
              });
            }
          }
        );
        
        // Store cleanup function to track editing state
        cleanupEditorRef.current = cleanup;
      };
      
      // Start the attempt with RAF for better frame timing
      requestAnimationFrame(() => attemptStartEditing());
    }
  }, [textEditingElementId, element.id, calculateTextareaPosition, element.text, element.fontFamily, element.fontSize, textColor, onUpdate, setTextEditingElement, stageRef]);

  // Handle double-click to start editing
  const handleDoubleClick = useCallback(() => {
    // Aggressively clear cache before editing to avoid stale visuals
    try { textCaching.clearCaching(); } catch {}

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


    const cleanup = createTextEditor(
      positionData,
      element.text || '',
      positionData.fontSize,
      element.fontFamily || getAvailableFontFamily(),
      undefined, // TextElement doesn't have backgroundColor
      textColor,
      element.fontSize || 16,
      () => calculateTextareaPosition(),
      (newText: string) => {
        
        const finalText = newText.trim();
        
        // Update element with new text first
        onUpdate(element.id, {
          text: finalText,
          updatedAt: Date.now()
        });
        
        
        // Clear editing state first
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
        
        // First update the text content
        onUpdate(element.id, {
          text: finalText,
          updatedAt: Date.now()
        });
        
        // Then auto-hug and select in sequence using RAF for better performance
        requestAnimationFrame(() => {
          // Use the same approach as real-time updates - don't enforce minimums for final sizing
          const finalDimensions = measureText(
            finalText,
            element.fontSize || 16,
            element.fontFamily || getAvailableFontFamily(),
          );
          
          
          onUpdate(element.id, {
            width: Math.max(finalDimensions.width, 20), // Only ensure basic minimum
            height: Math.max(finalDimensions.height, 24),
            updatedAt: Date.now()
          });
          
          // Wait for auto-hug to complete, then select using RAF
          requestAnimationFrame(() => {
            const store = useUnifiedCanvasStore.getState();
            
            // Ensure we switch to select tool first
            store.setSelectedTool('select');
            
            // Clear and then select using RAF
            requestAnimationFrame(() => {
              store.clearSelection();
              requestAnimationFrame(() => {
                store.selectElement(element.id, false);
                
                // Verify selection worked
                requestAnimationFrame(() => {
                  const newState = useUnifiedCanvasStore.getState();
                  // Selection verification complete
                });
              });
            });
          });
        });
      },
      () => {
        // Clear editing state
        cleanupEditorRef.current = null;
        setTextEditingElement(null);
      },
              (text: string, dimensions: { width: number; height: number }) => {
          // Real-time update during typing (FigJam-style auto-hug)
          
          // Always update text content, but be more selective about dimension updates
          const currentWidth = element.width || 20;
          const currentHeight = element.height || 24;
          const widthDiff = Math.abs(currentWidth - dimensions.width);
          const heightDiff = Math.abs(currentHeight - dimensions.height);
          
          // Update if text changed or dimensions changed significantly
          if (text !== element.text || widthDiff > 3 || heightDiff > 2) {
            // Real-time update with dimension changes
            onUpdate(element.id, {
              text: text,
              width: Math.max(dimensions.width, 20), // Ensure minimum visual width
              height: Math.max(dimensions.height, 24), // Ensure minimum visual height
              updatedAt: Date.now()
            });
          }
        }
    );

    // Store cleanup function to track editing state
    cleanupEditorRef.current = cleanup;
  }, [element, onUpdate, calculateTextareaPosition, setTextEditingElement, textColor]);

  // Handle drag
  // Strategic shape caching for static text
  const textCaching = useShapeCaching({
    element: element as unknown as CanvasElement,
    cacheConfig: {
      enabled: true,
      sizeThreshold: require('../utils/performance/cacheTuning').getCacheThresholds().text.size,
      complexityThreshold: 3,
      forceCache: false
    },
    dependencies: [element.text, element.width, element.height, element.fontSize, element.fontFamily, element.fill]
  });

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Don't handle drag events while editing
    if (cleanupEditorRef.current) {
      return;
    }
    
    if (!groupRef.current) return;
    
    const group = groupRef.current;
    
    onUpdate(element.id, {
      x: group.x(),
      y: group.y(),
    });
  }, [element.id, onUpdate]);

  // Track when text editing ends to prevent immediate transforms
  const lastEditEndTime = useRef<number>(0);
  
  // Update last edit end time when editing completes
  useEffect(() => {
    if (textEditingElementId === element.id) {
      // Text editing started - reset timer
      lastEditEndTime.current = 0;
    } else if (lastEditEndTime.current === 0 && !textEditingElementId) {
      // Text editing ended - set timer
      lastEditEndTime.current = Date.now();
    }
  }, [textEditingElementId, element.id]);

  // React-Konva transform pattern: handle transform end on Text component
  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const target = e.target;
    
    // Only handle transforms from the transformer, not from the text node directly
    if (target.className !== 'Transformer') {
      return;
    }
    
    // Get the text node that's being transformed
    const nodes = (target as any).nodes();
    if (!nodes || nodes.length === 0) return;
    
    const textNode = nodes[0] as Konva.Text;
    if (!textNode || textNode.id() !== `${element.id}-text`) return;
    
    // Prevent transform handling during text editing
    if (cleanupEditorRef.current) {
      return;
    }
    
    // Prevent transforms immediately after text editing (auto-selection protection)
    const timeSinceEdit = Date.now() - lastEditEndTime.current;
    if (timeSinceEdit < 1000) { // 1 second protection window
      // Reset any unwanted scales
      textNode.scaleX(1);
      textNode.scaleY(1);
      return;
    }
    
    
    const scaleX = textNode.scaleX();
    const scaleY = textNode.scaleY();
    
    
    // Only apply scaling if there's a significant change AND user intentionally scaled
    // Ignore automatic scaling from selection/rendering
    if (Math.abs(scaleX - 1) < 0.15 && Math.abs(scaleY - 1) < 0.15) {
      // Reset any minor scale changes
      textNode.scaleX(1);
      textNode.scaleY(1);
      return;
    }
    
    // Additional check: ignore extreme scaling that might be from bugs
    if (scaleX > 3 || scaleY > 3 || scaleX < 0.3 || scaleY < 0.3) {
      textNode.scaleX(1);
      textNode.scaleY(1);
      return;
    }
    
    
    // Use average scale to maintain proportions
    const avgScale = (scaleX + scaleY) / 2;
    
    // Calculate new font size based on scale
    const currentFontSize = element.fontSize || 16;
    const newFontSize = Math.max(8, Math.min(72, currentFontSize * avgScale));
    
    
    // Reset scale after applying to fontSize
    textNode.scaleX(1);
    textNode.scaleY(1);
    
    // Calculate final dimensions based on new font size and auto-hug
    const finalDimensions = measureText(
      element.text || 'Text',
      newFontSize,
      element.fontFamily || getAvailableFontFamily(),
    );
    
    
    // Update element with new font size and auto-calculated dimensions
    onUpdate(element.id, {
      fontSize: newFontSize,
      width: Math.max(finalDimensions.width, 20),
      height: Math.max(finalDimensions.height, 24),
      x: textNode.x(),
      y: textNode.y(),
      updatedAt: Date.now()
    });
    
    
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
          // Handle group click events
        }}
        onMouseDown={(e) => {
          // Handle mouse down events
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
          ref={(node) => {
            textNodeRef.current = node as any;
            if (node) {
              textCaching.nodeRef.current = node as any;
              if (textCaching.shouldCache && !cleanupEditorRef.current) {
                setTimeout(() => textCaching.applyCaching(), 0);
              }
            }
          }}
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
          listening={true}
          opacity={displayOpacity}
          draggable={false}
          onClick={(e) => {
            // Handle text node click events
          }}
          onTransformEnd={(e) => {
            handleTransformEnd(e);
            setTimeout(() => textCaching.refreshCache(), 0);
          }}
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

// Archived (2025-09-01): Legacy react-konva text shape.
