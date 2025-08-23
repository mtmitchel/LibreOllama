// src/components/canvas/shapes/TextShape.tsx
import { useEffect, useRef, useCallback, memo, useState, type FC, type MutableRefObject } from 'react';
import { Text, Group, Transformer, Rect } from 'react-konva';
import Konva from 'konva';
import { TextElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { devLog } from '../../../utils/devLog';
import { measureTextDimensions } from '../utils/textEditingUtils';
import { useCursor } from '../contexts/CursorContext';

interface TextShapeProps {
  element: TextElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  stageRef: MutableRefObject<Konva.Stage | null>;
}

const TextShape: FC<TextShapeProps> = memo(({ element, isSelected, konvaProps, onUpdate, stageRef }) => {
  const textNodeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { setCursor } = useCursor();

  const textEditingElementId = useUnifiedCanvasStore(state => state.textEditingElementId);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const isEditing = textEditingElementId === element.id;

  const wasEditingRef = useRef(false);
  useEffect(() => {
    if (wasEditingRef.current && !isEditing) {
      const store = useUnifiedCanvasStore.getState();
      store.setSelectedTool('select');
      setTimeout(() => {
        store.selectElement(element.id, false);
      }, 50);
    }
    wasEditingRef.current = isEditing;
  }, [isEditing, element.id]);

  // Programmatically start editing when the store indicates this element should be edited
  useEffect(() => {
    if (isEditing) {
      // Detach transformer when editing starts
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
    }
  }, [isEditing]);

  const updateCallback = useCallback((text: string, dimensions?: { width: number; height: number }) => {
    onUpdate(element.id, { text, ...dimensions, updatedAt: Date.now() });
  }, [element.id, onUpdate]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const textNode = textNodeRef.current;
    const stage = stageRef.current;
    if (!textNode || !stage) {
      return;
    }
    
    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    const scale = stage.scaleX();

    const textarea = document.createElement('textarea');
    textareaRef.current = textarea;
    textarea.value = element.text || '';
    
    Object.assign(textarea.style, {
      position: 'fixed',
      top: `${stageBox.top + textPosition.y}px`,
      left: `${stageBox.left + textPosition.x}px`,
      width: `${(textNode.width()) * scale}px`,
      height: `${(textNode.height() - textNode.padding()) * scale}px`,
      fontSize: `${textNode.fontSize() * scale}px`,
      fontFamily: textNode.fontFamily(),
      lineHeight: String(textNode.lineHeight()),
      border: '1px solid #4A90E2',
      padding: '0px',
      margin: '0',
      resize: 'none',
      overflow: 'hidden',
      background: 'white',
      zIndex: '10000',
    });

    document.body.appendChild(textarea);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.select();
    });

    const handleAutoResize = () => {
      requestAnimationFrame(() => {
        const measured = measureTextDimensions(
          textarea.value,
          textNode.fontSize(),
          textNode.fontFamily(),
          600 // Max content width before wrapping
        );
        
        const padding = textNode.padding() || 0;
        const newWidth = measured.width + (padding * 2);
        const newHeight = measured.height + (padding * 2);

        textarea.style.width = `${newWidth * scale}px`;
        textarea.style.height = `${newHeight * scale}px`;
      });
    };

    const handleComplete = () => {
      if (textareaRef.current) {
        const newText = textareaRef.current.value;
        // After editing, we want the Konva.Text to auto-size to the content.
        // Setting width and height to undefined lets Konva calculate the tightest fit.
        updateCallback(newText, { width: undefined, height: undefined });
      }
        setTextEditingElement(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleComplete();
      } else if (e.key === 'Escape') {
        setTextEditingElement(null);
      }
    };

    textarea.addEventListener('input', handleAutoResize);
    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('blur', handleComplete);
    handleAutoResize(); 

    return () => {
      textarea.removeEventListener('input', handleAutoResize);
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('blur', handleComplete);
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
      textareaRef.current = null;
    };
  }, [isEditing, element, updateCallback, stageRef, setTextEditingElement]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (isSelected && !isEditing) {
      transformer.nodes([textNodeRef.current]);
      transformer.getLayer()?.batchDraw();
      
      // Wait for transformer to be ready, then bind cursor events
      setTimeout(() => {
        const rotater = transformer.findOne('.rotater');
        if (rotater) {
          const handleMouseEnter = () => setCursor('grab');
          const handleMouseLeave = () => setCursor('default');
          const handleMouseDown = () => setCursor('grabbing');
          const handleMouseUp = () => setCursor('default');
          
          rotater.on('mouseenter', handleMouseEnter);
          rotater.on('mouseleave', handleMouseLeave);
          rotater.on('mousedown', handleMouseDown);
          rotater.on('mouseup', handleMouseUp);
          
          // Also listen for global mouseup to handle cases where mouse is released outside the rotater
          const handleGlobalMouseUp = () => setCursor('default');
          document.addEventListener('mouseup', handleGlobalMouseUp);
          
          // Store cleanup functions
          (rotater as any)._cursorCleanup = () => {
            rotater.off('mouseenter', handleMouseEnter);
            rotater.off('mouseleave', handleMouseLeave);
            rotater.off('mousedown', handleMouseDown);
            rotater.off('mouseup', handleMouseUp);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
          };
        }
      }, 10);
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }

    return () => {
      const rotater = transformer.findOne('.rotater');
      if (rotater && (rotater as any)._cursorCleanup) {
        (rotater as any)._cursorCleanup();
        delete (rotater as any)._cursorCleanup;
      }
    };
  }, [isSelected, isEditing, setCursor]);
  
  const handleDoubleClick = useCallback(() => {
    setTextEditingElement(element.id);
  }, [element.id, setTextEditingElement]);

  return (
    <>
      <Group {...konvaProps} id={element.id} x={element.x} y={element.y} onDblClick={handleDoubleClick}>
          <Rect
            width={element.width}
            height={element.height}
            fill={'white'}
            visible={!isEditing}
        />
        <Text
          ref={textNodeRef}
          text={element.text}
          visible={!isEditing}
          fontSize={element.fontSize}
          fontFamily={element.fontFamily}
          fill={element.fill}
          width={element.width}
          height={element.height}
          padding={element.padding}
          lineHeight={element.lineHeight}
          listening={!isEditing}
        />
      </Group>
      {isSelected && !isEditing && (
        <Transformer
          ref={transformerRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          padding={0}
          anchorSize={8}
          anchorFill="#ffffff"
          anchorStroke="#3B82F6"
          anchorStrokeWidth={2}
          borderStroke="#3B82F6"
          borderStrokeWidth={2}
          rotateEnabled={true}
          rotationSnaps={[0, 90, 180, 270]}
          rotateAnchorOffset={25}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
});

TextShape.displayName = 'TextShape';

export { TextShape };

