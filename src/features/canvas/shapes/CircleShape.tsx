// src/components/canvas/shapes/CircleShape.tsx
import React, { useRef, useEffect, useCallback, useReducer, useState, useMemo } from 'react';
import { Group, Circle, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { CircleElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';
import { useDebounce } from '@/core/hooks/useDebounce';
import { getRequiredCircleRadius, SHAPE_FITTING_DEFAULTS, findOptimalCircleRadius } from '../utils/shapeFittingUtils';

// Resize constants for consistency
const RESIZE_CONSTANTS = {
  DEBOUNCE_THRESHOLD: SHAPE_FITTING_DEFAULTS.DEBOUNCE_THRESHOLD,
  IMMEDIATE_THRESHOLD: SHAPE_FITTING_DEFAULTS.IMMEDIATE_THRESHOLD,
  UPDATE_TIMEOUT: SHAPE_FITTING_DEFAULTS.UPDATE_TIMEOUT,
};

const EDITOR_WIDTH_MULT = 1.72; // 2% safety margin versus Konva measurement

/**
 * Robust text editor for circles, adapted from RectangleShape
 */
const createCircleTextEditor = (
  position: { left: number; top: number; width: number; height: number; fontSize: number },
  initialText: string,
  fontSize: number,
  fontFamily: string,
  onSave: (text: string) => void,
  onCancel: () => void,
  onTextChange: (newText: string) => void // Kept for API consistency
) => {
  const radius = position.width / 2;
  const textWidth = radius * EDITOR_WIDTH_MULT;
  const textHeight = radius * EDITOR_WIDTH_MULT;
  const konvaPadding = (radius * 2) * 0.04;

  const textLeft = position.left + radius * 0.15;
  const textTop = position.top + radius * 0.15;

  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    left: `${Math.round(textLeft)}px`,
    top: `${Math.round(textTop)}px`,
    width: `${Math.round(textWidth)}px`,
    height: `${Math.round(textHeight)}px`,
    zIndex: '2147483647',
    border: 'none',
    background: 'transparent',
    pointerEvents: 'auto',
  });

  // Contenteditable div for centered caret
  const editor = document.createElement('div');
  editor.contentEditable = 'true';
  editor.setAttribute('spellcheck', 'false');

  Object.assign(editor.style, {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    fontWeight: '400',
    lineHeight: '1',
    color: '#1F2937',
    background: 'transparent',
    border: 'none',
    padding: `${konvaPadding}px`,
    margin: '0',
    outline: 'none',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    textAlign: 'center',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
  });

  // Placeholder handling
  const placeholder = document.createElement('span');
  placeholder.style.opacity = '0.6';
  placeholder.style.fontStyle = 'italic';
  placeholder.textContent = 'Add text';

  if (initialText) {
    editor.textContent = initialText;
  } else {
    editor.textContent = '\u200B'; // invisible char so caret shows
    editor.appendChild(placeholder);
  }

  container.appendChild(editor);
  document.body.appendChild(container);

  // Keep fixed dimensions to match Konva Text exactly
  const autoGrow = () => {
    // No resizing - keep exact Konva Text dimensions
  };

  // Handle input with immediate visual feedback
  const handleInput = () => {
    hasUserInteracted = true;
    if (editor.innerText.trim().length === 0) {
      if (!editor.contains(placeholder)) editor.appendChild(placeholder);
    } else {
      if (editor.contains(placeholder)) editor.removeChild(placeholder);
    }
    const textVal = editor.innerText.replace(/\u200B/g, '');
    onTextChange(textVal);
  };

  autoGrow();
  editor.addEventListener('input', handleInput);

  let editorReady = false;
  let hasUserInteracted = false;

  const updatePosition = (newPos: { left: number; top: number; width: number; height: number; fontSize: number }) => {
    // Recalculate Konva Text positioning for new size
    const newRadius = newPos.width / 2;
    const newTextWidth = newRadius * EDITOR_WIDTH_MULT;
    const newTextHeight = newRadius * EDITOR_WIDTH_MULT;
    const newTextLeft = newPos.left + newRadius * 0.15;
    const newTextTop = newPos.top + newRadius * 0.15;
    
    Object.assign(container.style, {
      left: `${Math.round(newTextLeft)}px`,
      top: `${Math.round(newTextTop)}px`,
      width: `${Math.round(newTextWidth)}px`,
      height: `${Math.round(newTextHeight)}px`,
    });
    
    // Update position reference
    position.width = newPos.width;
    position.height = newPos.height;
    
    editor.style.fontSize = `${newPos.fontSize}px`;
    editor.style.padding = `${konvaPadding}px`;
  };

  // Use requestAnimationFrame for more reliable focus
  setTimeout(() => {
    if (document.body.contains(container)) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          editor.focus();
          editorReady = true;
        });
      });
    }
  }, 50); // Reduced delay

  const handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
      onCancel();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      cleanup();
      onSave(editor.innerText);
    }
  };

  const handleBlur = () => {
    if ((editorReady && hasUserInteracted) || editor.innerText.trim().length > 0) {
      cleanup();
      onSave(editor.innerText);
    } else {
      cleanup();
      onCancel();
    }
  };

  const cleanup = () => {
    // Remove all event listeners
    editor.removeEventListener('input', handleInput);
    editor.removeEventListener('keydown', handleKeyDown);
    editor.removeEventListener('blur', handleBlur);
    container.removeEventListener('click', handleContainerClick);
    
    // Remove from DOM
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  };

  const handleContainerClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (editorReady && !editor.contains(e.target as Node)) {
      editor.focus();
    }
  };

  editor.addEventListener('keydown', handleKeyDown);
  editor.addEventListener('blur', handleBlur);
  container.addEventListener('click', handleContainerClick);

  return { cleanup, updatePosition };
};

interface CircleShapeProps {
  element: CircleElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null> | undefined;
}

export const CircleShape: React.FC<CircleShapeProps> = React.memo(({
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
  const circleRef = useRef<Konva.Circle>(null);
  const textNodeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const editorRef = useRef<any>(null);
  const isEditingRef = useRef<boolean>(false);
  const updateInProgressRef = useRef<boolean>(false); // For consistency
  const timeoutsRef = useRef<{ focus?: NodeJS.Timeout; resize?: NodeJS.Timeout }>({});
  const tweenRef = useRef<Konva.Tween | null>(null);

  const { radius = 50, fontSize = 14 } = element;
  const diameter = radius * 2;

  const [liveText, setLiveText] = useState('');
  const debouncedText = useDebounce(liveText, 100); // Faster response for immediate feedback

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  useEffect(() => {
    if (isSelected && transformerRef.current && circleRef.current) {
      if (typeof transformerRef.current.nodes === 'function') {
        transformerRef.current.nodes([circleRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [isSelected]);

  const calculateTextareaPosition = useCallback(() => {
    if (!stageRef?.current || !circleRef.current) return null;
    
    const stage = stageRef.current;
    const circle = circleRef.current;
    const container = stage.container();
    if (!container) return null;
    
    const containerRect = container.getBoundingClientRect();
    const scale = stage.scaleX();
    const stagePos = stage.getAbsolutePosition();
    
    // Get circle's absolute position (accounting for center offset)
    const circlePos = circle.getAbsolutePosition();
    
    return {
      left: containerRect.left + (circlePos.x - radius - stagePos.x) * scale,
      top: containerRect.top + (circlePos.y - radius - stagePos.y) * scale,
      width: diameter * scale,
      height: diameter * scale,
      fontSize: fontSize * scale
    };
  }, [stageRef, radius, diameter, fontSize]);

  // Debounced position updates for better performance
  const debouncedUpdatePosition = useMemo(
    () => {
      let timeout: NodeJS.Timeout | null = null;
      return (positionData: any) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (editorRef.current?.updatePosition) {
            editorRef.current.updatePosition(positionData);
          }
        }, 16); // 60fps
      };
    },
    []
  );

  // Reposition editor if shape resizes while editing (debounced)
  useEffect(() => {
    if (isEditingRef.current) {
      const positionData = calculateTextareaPosition();
      if (positionData) {
        debouncedUpdatePosition(positionData);
      }
    }
  }, [radius, calculateTextareaPosition, debouncedUpdatePosition]);

  // Stable circle resizing with inscribed square calculation
  useEffect(() => {
    if (!isEditingRef.current || !debouncedText || updateInProgressRef.current) {
      return;
    }

    updateInProgressRef.current = true;
    try {
      const targetRadius = findOptimalCircleRadius(
        debouncedText,
        fontSize,
        element.fontFamily || getAvailableFontFamily(),
        radius
      );

      if (Math.abs(targetRadius - radius) > RESIZE_CONSTANTS.DEBOUNCE_THRESHOLD) {
        // Kill any existing tween
        tweenRef.current?.destroy();

        const node = circleRef.current;
        if (!node) {
          onUpdate(element.id, { radius: Math.round(targetRadius) });
          return;
        }

        // Use a tween for smooth visual transition
        tweenRef.current = new Konva.Tween({
          node,
          radius: targetRadius,
          duration: 0.12, // 120ms for a quick but smooth feel
          easing: Konva.Easings.EaseOut,
          onFinish: () => {
            // Final update to ensure state is perfectly synced
            onUpdate(element.id, { radius: Math.round(targetRadius) });
          },
        });
        tweenRef.current.play();
      }
    } catch (e) {
      console.error('Circle text measurement error:', e);
    } finally {
      if (timeoutsRef.current.resize) clearTimeout(timeoutsRef.current.resize);
      timeoutsRef.current.resize = setTimeout(() => {
        updateInProgressRef.current = false;
      }, RESIZE_CONSTANTS.UPDATE_TIMEOUT);
    }
  }, [debouncedText, isEditingRef.current, fontSize, element.fontFamily, radius, onUpdate, element.id, calculateTextareaPosition]);

  // Handle text changes with immediate feedback for longer text
  const handleTextChange = useCallback((newText: string) => {
    if (!isEditingRef.current) return;
    setLiveText(newText);

    // Quick overflow check – if the text clearly exceeds current capacity, expand immediately
    if (newText && newText.length > 1) {
      try {
        const quickRadius = getRequiredCircleRadius(
          newText,
          fontSize,
          element.fontFamily || getAvailableFontFamily(),
          radius
        );
        const growDelta = quickRadius - radius;
        const shrinkDelta = radius - quickRadius;
        if (growDelta > 4) {
          onUpdate(element.id, { radius: Math.round(quickRadius) });
        } else if (shrinkDelta > 8) {
          onUpdate(element.id, { radius: Math.round(quickRadius) });
        }
      } catch (e) {
        // silent
      }
    }
  }, [fontSize, element.fontFamily, radius, onUpdate, element.id]);

  const startEditing = useCallback(() => {
    if (isEditingRef.current) {
      return;
    }
    
    isEditingRef.current = true;
    updateInProgressRef.current = false;
    setTextEditingElement(element.id);
    setLiveText(element.text || '');
    forceUpdate();

    const store = useUnifiedCanvasStore.getState();
    store.clearSelection();

    requestAnimationFrame(() => {
      const positionData = calculateTextareaPosition();
      if (!positionData) {
        console.error('❌ [CircleShape] Failed to calculate position');
        isEditingRef.current = false;
        setTextEditingElement(null);
        return;
      }
editorRef.current = createCircleTextEditor(
        positionData,
        element.text || '',
        positionData.fontSize,
        element.fontFamily || getAvailableFontFamily(),
        (newText: string) => {
isEditingRef.current = false;
          updateInProgressRef.current = false;
          setTextEditingElement(null);
          editorRef.current = null;
          
          const cleaned = newText.replace(/\u200B/g, '').trim();
          onUpdate(element.id, { text: cleaned, updatedAt: Date.now() });
          
          // Auto-switch to select tool
          setTimeout(() => {
            const store = useUnifiedCanvasStore.getState();
            store.setSelectedTool('select');
            store.selectElement(element.id, false);
          }, 100);
        },
        () => {
isEditingRef.current = false;
          updateInProgressRef.current = false;
          setTextEditingElement(null);
          editorRef.current = null;
        },
        handleTextChange
      );
    });
  }, [element, calculateTextareaPosition, setTextEditingElement, onUpdate, handleTextChange]);

  useEffect(() => {
    if (textEditingElementId === element.id && !isEditingRef.current) {
      startEditing();
    }
    
    if (textEditingElementId !== element.id && editorRef.current && isEditingRef.current) {
tweenRef.current?.destroy(); // Stop animation if editing is cancelled
      editorRef.current.cleanup();
      editorRef.current = null;
      isEditingRef.current = false;
      updateInProgressRef.current = false;
    }
    
    return () => {
      // Clear any pending timeouts
      if (timeoutsRef.current.resize) clearTimeout(timeoutsRef.current.resize);
      if (timeoutsRef.current.focus) clearTimeout(timeoutsRef.current.focus);
      
      if (editorRef.current) {
tweenRef.current?.destroy(); // Stop animation on unmount
        editorRef.current.cleanup();
        editorRef.current = null;
        isEditingRef.current = false;
        updateInProgressRef.current = false;
      }
    };
  }, [textEditingElementId, element.id]); // Remove startEditing dependency

  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = circleRef.current;
    if (!node) return;
    
    tweenRef.current?.destroy(); // Stop any resize animations before transform
    const scaleX = node.scaleX();
    
    // Reset scale and update radius
    node.scaleX(1);
    node.scaleY(1);
    
    onUpdate(element.id, {
      x: node.x(),
      y: node.y(),
      radius: Math.max(25, (element.radius || 50) * scaleX),
      updatedAt: Date.now()
    });
  }, [element.id, element.radius, onUpdate]);

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
        <Circle
          onDblClick={startEditing}
          ref={circleRef}
          x={radius}
          y={radius}
          radius={radius}
          fill={element.fill || '#FFFFFF'}
          stroke={element.stroke || '#D1D5DB'}
          strokeWidth={2}
          onTransformEnd={handleTransformEnd}
        />
        {/* Only show text when NOT editing - prevents dual display */}
        {!isCurrentlyEditing && (
          <Group
            clipFunc={(ctx) => {
              ctx.arc(radius, radius, radius, 0, Math.PI * 2, false);
            }}
          >
            <Text
              onDblClick={startEditing}
              ref={textNodeRef}
              x={radius - (radius * 0.85)} // Use much more horizontal space
              y={radius - (radius * 0.85)} // Use much more vertical space  
              width={radius * EDITOR_WIDTH_MULT}
              height={radius * EDITOR_WIDTH_MULT}
              text={displayText}
              fontSize={fontSize}
              fontFamily={getAvailableFontFamily()}
              fill={textColor}
              align="center"
              verticalAlign="middle"
              fontStyle={hasContent ? 'normal' : 'italic'}
              wrap="word"
              padding={diameter * 0.05} // Much less padding for more text space
              ellipsis={false}
            />
          </Group>
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
          keepRatio={true}
          boundBoxFunc={(oldBox, newBox) => {
            const size = Math.max(RESIZE_CONSTANTS.DEBOUNCE_THRESHOLD, newBox.width);
            return { ...newBox, width: size, height: size };
          }}
        />
      )}
    </>
  );
});

CircleShape.displayName = 'CircleShape';
