// src/components/Canvas/SelectableText.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Text, Group, Rect } from 'react-konva';
import { Html } from 'react-konva-utils';
import Konva from 'konva';
import { designSystem } from '../../styles/designSystem';

interface SelectableTextProps {
  element: {
    id: string;
    x: number;
    y: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    width?: number;
    height?: number;
  };
  isEditing: boolean;
  onTextUpdate: (elementId: string, newText: string) => void;
  onEditingCancel: () => void;
  onDblClick: () => void;
  onFormatChange?: (elementId: string, format: any, selection: { start: number; end: number }) => void;
  [key: string]: any; // For other Konva props
}

const SelectableText: React.FC<SelectableTextProps> = ({
  element,
  isEditing,
  onTextUpdate,
  onEditingCancel,
  onDblClick,
  onFormatChange,
  ...konvaProps
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const textRef = useRef<Konva.Text>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Default text properties using design system
  const text = element.text || 'Click to edit';
  const fontSize = element.fontSize || designSystem.typography.fontSize.base;
  const fontFamily = element.fontFamily || designSystem.typography.fontFamily.sans;
  const fill = element.fill || designSystem.colors.secondary[900];
  const width = element.width || 200;
  const height = element.height || Math.max(30, fontSize * 1.5);

  // Calculate textarea position when editing
  const getTextareaPosition = () => {
    if (!textRef.current) return { x: 0, y: 0 };
    
    const textNode = textRef.current;
    const stage = textNode.getStage();
    if (!stage) return { x: 0, y: 0 };

    // Get the text node's position in stage coordinates
    const textPosition = textNode.getAbsolutePosition();
    
    // Transform stage coordinates to screen coordinates
    const stageTransform = stage.getAbsoluteTransform();
    const screenPosition = stageTransform.point(textPosition);
    
    // Get stage container's position on screen
    const stageContainer = stage.container();
    const containerRect = stageContainer.getBoundingClientRect();
    
    return {
      x: containerRect.left + screenPosition.x,
      y: containerRect.top + screenPosition.y
    };
  };

  // Handle context menu
  const handleContextMenu = (e: any) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    
    const stage = e.target.getStage();
    const containerRect = stage.container().getBoundingClientRect();
    const pointerPosition = stage.getPointerPosition();
    
    setContextMenuPos({
      x: containerRect.left + pointerPosition.x,
      y: containerRect.top + pointerPosition.y
    });
    setShowContextMenu(true);
  };

  // Handle text selection for formatting
  const handleTextSelection = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start !== end) {
      setSelection({ start, end });
    } else {
      setSelection(null);
    }
  };

  // Apply text formatting
  const applyFormat = (format: any) => {
    if (!selection || !onFormatChange) return;
    
    onFormatChange(element.id, format, selection);
    setShowContextMenu(false);
  };

  // Add URL to selected text
  const addUrl = () => {
    if (!selection || !onFormatChange) return;
    
    const url = prompt('Enter URL:');
    if (url) {
      onFormatChange(element.id, { url }, selection);
    }
    setShowContextMenu(false);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  return (
    <>
      <Group {...konvaProps}>
        <Text
          ref={textRef}
          text={text}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fill={fill}
          width={width}
          height={height}
          align="left"
          verticalAlign="middle"
          onDblClick={onDblClick}
          onContextMenu={handleContextMenu}
          visible={!isEditing}
        />
        
        {/* Background rect for text bounds (only when selected) */}
        {konvaProps.draggable && !isEditing && (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="transparent"
            stroke={designSystem.colors.primary[500]}
            strokeWidth={1}
            dash={[2, 2]}
            listening={false}
          />
        )}
        {/* Inline text editor */}
        {isEditing && (
          <Html>
            <textarea
            ref={textareaRef}
            style={{
              position: 'absolute',
              left: '0px',
              top: '0px',
              width: `${width}px`,
              minHeight: `${height}px`,
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              color: fill,
              border: `2px solid ${designSystem.colors.primary[500]}`,
              borderRadius: '4px',
              padding: '4px',
              background: 'white',
              resize: 'both',
              overflow: 'auto',
              zIndex: 1000,
              outline: 'none',
              boxShadow: designSystem.shadows.lg
            }}
            defaultValue={text}
            autoFocus
            onBlur={(e) => {
              onTextUpdate(element.id, e.target.value);
              onEditingCancel();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onEditingCancel();
              } else if (e.key === 'Enter' && e.ctrlKey) {
                onTextUpdate(element.id, e.currentTarget.value);
                onEditingCancel();
              }
            }}
            onSelect={handleTextSelection}
          />
        </Html>
      )}
      </Group>

      {/* Context Menu */}
      {showContextMenu && selection && (
        <Html>
          <div
            style={{
              position: 'absolute',
              left: contextMenuPos.x,
              top: contextMenuPos.y,
              background: 'white',
              border: `1px solid ${designSystem.colors.secondary[300]}`,
              borderRadius: '8px',
              boxShadow: designSystem.shadows.lg,
              padding: '4px',
              zIndex: 1001,
              display: 'flex',
              gap: '4px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => applyFormat({ fontStyle: 'bold' })}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '4px',
                background: designSystem.colors.secondary[100],
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
              title="Bold"
            >
              B
            </button>
            <button
              onClick={() => applyFormat({ fontStyle: 'italic' })}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '4px',
                background: designSystem.colors.secondary[100],
                cursor: 'pointer',
                fontStyle: 'italic',
                fontSize: '14px'
              }}
              title="Italic"
            >
              I
            </button>
            <button
              onClick={() => applyFormat({ textDecoration: 'underline' })}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '4px',
                background: designSystem.colors.secondary[100],
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
              title="Underline"
            >
              U
            </button>
            <div style={{ width: '1px', background: designSystem.colors.secondary[300], margin: '0 4px' }} />
            <button
              onClick={addUrl}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '4px',
                background: designSystem.colors.secondary[100],
                cursor: 'pointer',
                fontSize: '14px'
              }}
              title="Add Link"
            >
              🔗
            </button>
          </div>
        </Html>
      )}
    </>
  );
};

export default SelectableText;
