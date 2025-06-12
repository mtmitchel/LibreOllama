import React, { useRef, useCallback } from 'react';
import { Text, Group, Rect } from 'react-konva';
import { CanvasElement } from '../../stores/konvaCanvasStore';

interface SimpleTextElementProps {
  element: CanvasElement;
  isSelected: boolean;
  isDraggable?: boolean;
  onUpdate: (elementId: string, updates: any) => void;
  onSelect: (elementId: string) => void;
}

const SimpleTextElement: React.FC<SimpleTextElementProps> = ({
  element,
  isSelected,
  isDraggable = false,
  onUpdate,
  onSelect
}) => {
  const textRef = useRef<any>(null);

  // Handle double-click to start editing
  const handleDoubleClick = useCallback((e: any) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    
    // Create textarea overlay
    const stage = e.target.getStage();
    const textPosition = textRef.current.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    
    const textarea = document.createElement('textarea');
    textarea.value = element.text || '';
    textarea.style.position = 'absolute';
    textarea.style.left = `${stageBox.left + textPosition.x}px`;
    textarea.style.top = `${stageBox.top + textPosition.y}px`;
    textarea.style.width = `${element.width || 200}px`;
    textarea.style.height = `${element.height || 50}px`;
    textarea.style.fontSize = `${element.fontSize || 16}px`;
    textarea.style.fontFamily = element.fontFamily || 'Arial';
    textarea.style.color = element.fill || '#000000';
    textarea.style.border = '2px solid #2196F3';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '5px';
    textarea.style.resize = 'none';
    textarea.style.outline = 'none';
    textarea.style.backgroundColor = 'white';
    textarea.style.zIndex = '1000';
    
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    const removeTextarea = () => {
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
    };
    
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onUpdate(element.id, { text: textarea.value });
        removeTextarea();
      } else if (e.key === 'Escape') {
        removeTextarea();
      }
    });
    
    textarea.addEventListener('blur', () => {
      onUpdate(element.id, { text: textarea.value });
      removeTextarea();
    });
    
  }, [element, onUpdate]);

  // Handle single click for selection
  const handleClick = useCallback((e: any) => {
    e.cancelBubble = true;
    onSelect(element.id);
  }, [element.id, onSelect]);
  // Parse font style for bold/italic
  const getFontStyle = () => {
    // For React-Konva, we just return normal since fontStyle is handled differently
    return 'normal';
  };

  // Check if this is a sticky note
  const isStickyNote = element.type === 'sticky-note';

  if (isStickyNote) {
    // Render sticky note with background
    return (      <Group
        ref={textRef}
        id={element.id}
        x={element.x}
        y={element.y}
        onClick={handleClick}
        onDblClick={handleDoubleClick}
        draggable={isDraggable}
      >
        <Rect
          width={element.width || 150}
          height={element.height || 100}
          fill={element.backgroundColor || '#FEF3C7'}
          stroke={isSelected ? '#2196F3' : '#F59E0B'}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={8}
          shadowColor="rgba(0, 0, 0, 0.15)"
          shadowBlur={6}
          shadowOffset={{ x: 2, y: 2 }}
          shadowOpacity={0.8}
        />
        <Text
          x={10}
          y={10}
          text={element.text || 'Double-click to edit'}
          fontSize={element.fontSize || 14}
          fontFamily={element.fontFamily || 'Arial'}
          fill={element.textColor || '#333333'}
          width={(element.width || 150) - 20}
          height={(element.height || 100) - 20}
          align="left"
          verticalAlign="top"
          wrap="word"
          lineHeight={1.2}
        />
      </Group>
    );
  }

  return (    <Text
      ref={textRef}
      id={element.id}
      x={element.x}
      y={element.y}
      text={element.text || 'Double-click to edit'}
      fontSize={element.fontSize || 16}
      fontFamily={element.fontFamily || 'Arial'}
      fill={element.fill || '#000000'}
      fontStyle={getFontStyle()}
      width={element.width}
      height={element.height}
      onClick={handleClick}
      onDblClick={handleDoubleClick}
      draggable={isDraggable}
      stroke={isSelected ? '#2196F3' : undefined}
      strokeWidth={isSelected ? 1 : 0}
      perfectDrawEnabled={false}
    />
  );
};

export default SimpleTextElement;
