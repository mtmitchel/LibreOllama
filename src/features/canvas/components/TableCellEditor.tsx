// src/features/canvas/components/TableCellEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { designSystem } from '../../../styles/designSystem';

interface TableCellEditorProps {
  isEditing: boolean;
  cellText: string;
  position: { x: number; y: number };
  cellSize: { width: number; height: number };
  onSave: (text: string) => void;
  onCancel: () => void;
}

/**
 * TableCellEditor - Portal-based table cell editing overlay
 * Specifically designed for editing table cells
 */
export const TableCellEditor: React.FC<TableCellEditorProps> = ({
  isEditing,
  cellText,
  position,
  cellSize,
  onSave,
  onCancel
}) => {
  const [text, setText] = useState(cellText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      setText(cellText);
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing, cellText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    onSave(text);
  };

  if (!isEditing) return null;

  const editorStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: Math.max(cellSize.width, 100),
    height: Math.max(cellSize.height, 30),
    zIndex: 10000,
    border: `2px solid ${designSystem.colors.primary[500]}`,
    borderRadius: '4px',
    padding: '8px',
    fontSize: '14px',
    fontFamily: designSystem.typography.fontFamily.sans,
    backgroundColor: 'white',
    resize: 'none',
    outline: 'none',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  return ReactDOM.createPortal(
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={editorStyle}
      placeholder="Enter cell text..."
    />,
    document.body
  );
};
