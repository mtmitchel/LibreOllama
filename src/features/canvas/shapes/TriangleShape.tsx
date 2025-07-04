// src/components/canvas/shapes/TriangleShape.tsx
import React, { useRef, useEffect, useCallback, useReducer, useState, useMemo } from 'react';
import { Group, Line, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { TriangleElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { ensureFontsLoaded, getAvailableFontFamily } from '../utils/fontLoader';
import { useDebounce } from '@/core/hooks/useDebounce';
import { getRequiredTriangleSize, SHAPE_FITTING_DEFAULTS, findOptimalTriangleWidth } from '../utils/shapeFittingUtils';

// Resize constants for consistency
const RESIZE_CONSTANTS = {
  DEBOUNCE_THRESHOLD: SHAPE_FITTING_DEFAULTS.DEBOUNCE_THRESHOLD,
  IMMEDIATE_THRESHOLD: 0.2, // 20% capacity change for more responsive feedback
  UPDATE_TIMEOUT: SHAPE_FITTING_DEFAULTS.UPDATE_TIMEOUT,
};

/**
 * Robust text editor for triangles, adapted from RectangleShape
 */
const createTriangleTextEditor = (
  position: { left: number; top: number; width: number; height: number; fontSize: number },
  initialText: string,
  fontSize: number,
  fontFamily: string,
  onSave: (text: string) => void,
  onCancel: () => void,
  onTextChange: (newText: string) => void
) => {
  // Container that covers the full triangle area
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    left: `${Math.round(position.left)}px`,
    top: `${Math.round(position.top)}px`,
    width: `${Math.round(position.width)}px`,
    height: `${Math.round(position.height)}px`,
    overflow: 'hidden',
    zIndex: '10000',
    border: 'none',
    background: 'transparent',
    pointerEvents: 'none',
    // Triangle clipping to match the shape
    clipPath: `polygon(50% 0%, 100% 100%, 0% 100%)`,
  });

  // Contenteditable div for centred editing
  const editor = document.createElement('div');
  editor.contentEditable = 'true';
  editor.setAttribute('spellcheck', 'false');

  const padding = 8;

  const computeEditorWidth = (w: number, h: number) => {
    // Match the display text width (70% of triangle width)
    return w * 0.7;
  };

  const setEditorGeometry = (w: number, h: number) => {
    const textW = computeEditorWidth(w, h);
    Object.assign(editor.style, {
      width: `${textW}px`,
      left: '50%',
      transform: `translateX(-${textW / 2}px) translateY(-50%)`,
    });
  };

  Object.assign(editor.style, {
    height: '35%',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    fontWeight: '400',
    lineHeight: '1.4',
    color: '#1F2937',
    background: 'transparent',
    border: 'none',
    padding: `${padding}px`,
    margin: '0',
    outline: 'none',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    textAlign: 'center',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    position: 'absolute',
    top: '70%',
  });

  // initial geometry
  setEditorGeometry(position.width, position.height);

  const placeholder = document.createElement('span');
  placeholder.style.opacity = '0.6';
  placeholder.style.fontStyle = 'italic';
  placeholder.textContent = 'Add text';

  if (initialText) {
    editor.textContent = initialText;
  } else {
    editor.textContent = '\u200B';
    editor.appendChild(placeholder);
  }

  container.appendChild(editor);
  document.body.appendChild(container);

  const autoGrow = () => {
    setEditorGeometry(position.width, position.height);
  };

  const handleInput = () => {
    hasUserInteracted = true;
    if (editor.innerText.trim().length === 0) {
      if (!editor.contains(placeholder)) editor.appendChild(placeholder);
    } else {
      if (editor.contains(placeholder)) editor.removeChild(placeholder);
    }
    onTextChange(editor.innerText.replace(/\u200B/g, ''));
  };

  editor.addEventListener('input', handleInput);

  let editorReady = false;
  let hasUserInteracted = false;

  const updatePosition = (newPos: { left: number; top: number; width: number; height: number; fontSize: number }) => {
    // Update container to cover the entire triangle area
    Object.assign(container.style, {
      left: `${Math.round(newPos.left)}px`,
      top: `${Math.round(newPos.top)}px`,
      width: `${Math.round(newPos.width)}px`,
      height: `${Math.round(newPos.height)}px`,
    });
    
    // Update position reference for autoGrow
    position.width = newPos.width;
    position.height = newPos.height;
    
    editor.style.fontSize = `${newPos.fontSize}px`;
    setEditorGeometry(newPos.width, newPos.height);
  };

  // Use requestAnimationFrame for more reliable focus
  setTimeout(() => {
    if (document.body.contains(container)) {
      requestAnimationFrame(() => {
        editor.focus();
        editorReady = true;
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
      onSave(editor.innerText.replace(/\u200B/g, ''));
    }
  };

  const handleBlur = () => {
    if ((editorReady && hasUserInteracted) || editor.innerText.trim().length > 0) {
      cleanup();
      onSave(editor.innerText.replace(/\u200B/g, ''));
    } else {
      cleanup();
      onCancel();
    }
  };

  const cleanup = () => {
    editor.removeEventListener('input', handleInput);
    editor.removeEventListener('keydown', handleKeyDown);
    editor.removeEventListener('blur', handleBlur);
    container.removeEventListener('click', handleContainerClick);
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

interface TriangleShapeProps {
  element: TriangleElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  stageRef?: React.MutableRefObject<Konva.Stage | null> | undefined;
}

export const TriangleShape: React.FC<TriangleShapeProps> = React.memo(({
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
  const triangleRef = useRef<Konva.Line>(null);
  const textNodeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const editorRef = useRef<any>(null);
  const isEditingRef = useRef<boolean>(false);
  const updateInProgressRef = useRef<boolean>(false);
  const timeoutsRef = useRef<{ focus?: NodeJS.Timeout; resize?: NodeJS.Timeout }>({});
  const tweenRef = useRef<Konva.Tween | null>(null);
  
  const { width = 120, height = 100, fontSize = 14 } = element;
  
  const [liveText, setLiveText] = useState('');
  const debouncedText = useDebounce(liveText, 100); // Faster response for immediate feedback

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  useEffect(() => {
    if (isSelected && transformerRef.current && triangleRef.current) {
      transformerRef.current.nodes([triangleRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const calculateTextareaPosition = useCallback(() => {
    if (!stageRef?.current || !triangleRef.current) return null;
    
    const stage = stageRef.current;
    const triangle = triangleRef.current;
    const container = stage.container();
    if (!container) return null;
    
    const containerRect = container.getBoundingClientRect();
    const scale = stage.scaleX();
    const stagePos = stage.getAbsolutePosition();
    
    // Get triangle's absolute position
    const trianglePos = triangle.getAbsolutePosition();
    
    return {
      left: containerRect.left + (trianglePos.x - stagePos.x) * scale,
      top: containerRect.top + (trianglePos.y - stagePos.y) * scale,
      width: width * scale,
      height: height * scale,
      fontSize: fontSize * scale
    };
  }, [stageRef, width, height, fontSize]);

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

  // Cached triangle geometry calculations for performance
  const calculateTriangleTextWidth = useCallback((baseWidth: number, triangleHeight: number, textPosition: number) => {
    const heightFromTop = textPosition * triangleHeight;
    const widthRatio = (triangleHeight - heightFromTop) / triangleHeight;
    return baseWidth * widthRatio;
  }, []);

  // Cache expensive geometry calculations
  const cachedTriangleGeometry = useMemo(() => {
    const triangleHeight = (Math.sqrt(3) / 2) * width;
    const textStartHeight = 0.6; // 60% from top
    const textEndHeight = 0.9;   // 90% from top
    const avgWidth = (calculateTriangleTextWidth(width, triangleHeight, textStartHeight) + 
                      calculateTriangleTextWidth(width, triangleHeight, textEndHeight)) / 2;
    return { triangleHeight, avgWidth: avgWidth * 0.9 };
  }, [width, height, calculateTriangleTextWidth]);

  // Reposition editor if shape resizes while editing (debounced)
  useEffect(() => {
    if (isEditingRef.current) {
      const positionData = calculateTextareaPosition();
      if (positionData) {
        debouncedUpdatePosition(positionData);
      }
    }
  }, [width, height, calculateTextareaPosition, debouncedUpdatePosition]);

  // Geometry-aware triangle resizing with proportional scaling
  useEffect(() => {
    if (!isEditingRef.current || !debouncedText || updateInProgressRef.current) {
      return;
    }
    
    updateInProgressRef.current = true;
    try {
      const { width: targetWidth, height: targetHeight } = findOptimalTriangleWidth(
        debouncedText,
        fontSize,
        element.fontFamily || getAvailableFontFamily(),
        width,
        SHAPE_FITTING_DEFAULTS.MAX_WIDTH
      );

      if ((targetWidth - width) > RESIZE_CONSTANTS.DEBOUNCE_THRESHOLD) {
        tweenRef.current?.destroy();

        const node = triangleRef.current;
        if (!node) {
          onUpdate(element.id, { width: targetWidth, height: targetHeight });
          return;
        }

        tweenRef.current = new Konva.Tween({
          node,
          width: targetWidth,
          height: targetHeight,
          duration: 0.12,
          easing: Konva.Easings.EaseOut,
          onFinish: () => {
            onUpdate(element.id, { width: targetWidth, height: targetHeight });
          }
        });
        tweenRef.current.play();
      }
    } catch(e) {
        console.error('Triangle resize error:', e);
    } finally {
        if (timeoutsRef.current.resize) clearTimeout(timeoutsRef.current.resize);
        timeoutsRef.current.resize = setTimeout(() => {
            updateInProgressRef.current = false;
        }, RESIZE_CONSTANTS.UPDATE_TIMEOUT);
    }
  }, [debouncedText, isEditingRef.current, fontSize, element.fontFamily, width, height, onUpdate, element.id, calculateTextareaPosition, calculateTriangleTextWidth]);

  // Handle text changes with triangle-aware immediate feedback
  const handleTextChange = useCallback((newText: string) => {
    if (!isEditingRef.current) return;
    setLiveText(newText);
    
    // Quick overflow check: grow immediately if capacity exceeded markedly
    if (newText && newText.length > 1) {
      try {
        const { width: targetW, height: targetH } = getRequiredTriangleSize(
          newText,
          fontSize,
          element.fontFamily || getAvailableFontFamily(),
          width
        );
        if (targetW - width > RESIZE_CONSTANTS.DEBOUNCE_THRESHOLD) {
          onUpdate(element.id, { width: targetW, height: targetH });
        }
      } catch {}
    }
  }, [fontSize, element.fontFamily, width, height, onUpdate, element.id, calculateTriangleTextWidth]);
  
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
        console.error('❌ [TriangleShape] Failed to calculate position');
        isEditingRef.current = false;
        setTextEditingElement(null);
        return;
      }
editorRef.current = createTriangleTextEditor(
        positionData,
        element.text || '',
        positionData.fontSize,
        element.fontFamily || getAvailableFontFamily(),
        (newText: string) => {
isEditingRef.current = false;
          updateInProgressRef.current = false;
          setTextEditingElement(null);
          editorRef.current = null;
          
          onUpdate(element.id, { text: newText.trim(), updatedAt: Date.now() });
          
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
    // Start editing only if not already editing
    if (textEditingElementId === element.id && !isEditingRef.current) {
      startEditing();
    }
    
    // Stop editing only if we're no longer the editing element AND we're currently editing
    if (textEditingElementId !== element.id && editorRef.current && isEditingRef.current) {
tweenRef.current?.destroy();
      editorRef.current.cleanup();
      editorRef.current = null;
      isEditingRef.current = false;
      updateInProgressRef.current = false;
      if (timeoutsRef.current.focus) clearTimeout(timeoutsRef.current.focus);
      
      if (editorRef.current) {
tweenRef.current?.destroy();
        editorRef.current.cleanup();
        editorRef.current = null;
        isEditingRef.current = false;
        updateInProgressRef.current = false;
      }
    }
    
    return () => {
      // Clear any pending timeouts
      if (timeoutsRef.current.resize) clearTimeout(timeoutsRef.current.resize);
      if (timeoutsRef.current.focus) clearTimeout(timeoutsRef.current.focus);
      
      if (editorRef.current) {
tweenRef.current?.destroy();
        editorRef.current.cleanup();
        editorRef.current = null;
        isEditingRef.current = false;
        updateInProgressRef.current = false;
      }
    };
  }, [textEditingElementId, element.id]); // Remove startEditing dependency

  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = triangleRef.current;
    if (!node) return;
    
    tweenRef.current?.destroy();
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale and update dimensions
    node.scaleX(1);
    node.scaleY(1);
    
    onUpdate(element.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(SHAPE_FITTING_DEFAULTS.MIN_WIDTH, (element.width || 120) * scaleX),
      height: Math.max(SHAPE_FITTING_DEFAULTS.MIN_HEIGHT, (element.height || 100) * scaleY),
      updatedAt: Date.now()
    });
  }, [element.id, element.width, element.height, onUpdate]);
  
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

  // Calculate triangle points
  const trianglePoints = [
    width/2, 0,        // Top point
    width, height,     // Bottom right
    0, height,         // Bottom left
    width/2, 0         // Close the path
  ];

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
        onDblClick={startEditing}
        draggable={!shouldAllowDrawing}
        listening={!shouldAllowDrawing}
        onDragEnd={handleDragEnd}
      >
        <Line
          onDblClick={startEditing}
          ref={triangleRef}
          points={trianglePoints}
          fill={element.fill || '#FFFFFF'}
          stroke={element.stroke || '#D1D5DB'}
          strokeWidth={2}
          closed={true}
          onTransformEnd={handleTransformEnd}
          keepRatio={true}
        />

        {/* Only show text when NOT editing - prevents dual display */}
        {!isCurrentlyEditing && (
          <Group
            clipFunc={(ctx) => {
              // Clip to triangle shape
              ctx.moveTo(width/2, 0);
              ctx.lineTo(width, height);
              ctx.lineTo(0, height);
              ctx.closePath();
            }}
          >
                        <Text
              onDblClick={startEditing}
              ref={textNodeRef}
              x={width * 0.15} // Position for 70% width centered
              y={height * 0.6} // Start at 60% (75% - 15% for half of 30% height)
              width={width * 0.7} // Increased width to fit "Add text" better
              height={height * 0.3} // Match the 30% from editor
              text={displayText}
              fontSize={fontSize}
              fontFamily={getAvailableFontFamily()}
              fill={textColor}
              align="center"
              verticalAlign="middle" // Center within the text area
              fontStyle={hasContent ? 'normal' : 'italic'}
              wrap="word"
              padding={4} // Minimal padding for triangle geometry
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
          boundBoxFunc={(oldBox, newBox) => {
            return {
              ...newBox,
              width: Math.max(60, newBox.width || 0),
              height: Math.max(40, newBox.height || 0),
            }
          }}
        />
      )}
    </>
  );
});

TriangleShape.displayName = 'TriangleShape';

