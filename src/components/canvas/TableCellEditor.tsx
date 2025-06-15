// src/components/canvas/TableCellEditor.tsx
import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../styles/designSystem';

interface TableCellEditorProps {
  isEditing: boolean;
  cellPosition: { x: number; y: number; width: number; height: number };
  cellText: string;
  onTextChange: (text: string) => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export const TableCellEditor: React.FC<TableCellEditorProps> = ({
  isEditing,
  cellPosition,
  cellText,
  onTextChange,
  onFinishEditing,
  onCancelEditing,
  fontSize = 14,
  fontFamily = designSystem.typography.fontFamily.sans,
  textColor = designSystem.colors.secondary[800],
  textAlign = 'left'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localText, setLocalText] = useState(cellText);

  // Sync local text with prop changes
  useEffect(() => {
    setLocalText(cellText);
  }, [cellText]);

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 10);
    }
  }, [isEditing]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;

      switch (e.key) {
        case 'Enter':
          if (!e.shiftKey) {
            e.preventDefault();
            onTextChange(localText);
            onFinishEditing();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setLocalText(cellText); // Reset to original text
          onCancelEditing();
          break;
        case 'Tab':
          e.preventDefault();
          onTextChange(localText);
          onFinishEditing();
          break;
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditing, localText, cellText, onTextChange, onFinishEditing, onCancelEditing]);

  // Handle clicks outside to finish editing
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isEditing && textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        onTextChange(localText);
        onFinishEditing();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing, localText, onTextChange, onFinishEditing]);

  if (!isEditing) {
    return null;
  }

  const textareaStyle: React.CSSProperties = {
    position: 'absolute',
    left: cellPosition.x,
    top: cellPosition.y,
    width: cellPosition.width,
    height: cellPosition.height,
    border: `2px solid ${designSystem.colors.primary[500]}`,
    borderRadius: '4px',
    padding: '8px',
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    color: textColor,
    backgroundColor: designSystem.canvasStyles.background,
    resize: 'none',
    outline: 'none',
    overflow: 'hidden',
    textAlign: textAlign,
    zIndex: 1000,
    boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
    lineHeight: '1.4'
  };

  return createPortal(
    <textarea
      ref={textareaRef}
      style={textareaStyle}
      value={localText}
      onChange={(e) => setLocalText(e.target.value)}
      onBlur={() => {
        onTextChange(localText);
        onFinishEditing();
      }}
      placeholder="Type here..."
      spellCheck={false}
    />,
    document.body
  );
};

export default TableCellEditor;
