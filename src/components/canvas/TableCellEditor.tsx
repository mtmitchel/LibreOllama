// src/components/canvas/TableCellEditor.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../styles/designSystem';

interface CellPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TableCellEditorProps {
  isEditing: boolean;
  cellPosition: CellPosition;
  cellText: string;
  onTextChange: (text: string) => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

// Debug logging utility
const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[TableCellEditor] ${message}`, data || '');
  }
};

// Validation utility for cell position
const validateCellPosition = (position: CellPosition): boolean => {
  if (!position || typeof position !== 'object') {
    logDebug('Invalid position: not an object', position);
    return false;
  }
  
  const { x, y, width, height } = position;
  const isValid =
    typeof x === 'number' && isFinite(x) &&
    typeof y === 'number' && isFinite(y) &&
    typeof width === 'number' && isFinite(width) && width > 0 &&
    typeof height === 'number' && isFinite(height) && height > 0;
    
  if (!isValid) {
    logDebug('Invalid position values', { x, y, width, height });
  }
  
  return isValid;
};

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
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Validate props on mount and when they change
  useEffect(() => {
    if (isEditing && !validateCellPosition(cellPosition)) {
      logDebug('TableCellEditor received invalid cellPosition, editor will not render');
      onCancelEditing();
      return;
    }
  }, [isEditing, cellPosition, onCancelEditing]);

  // Sync local text with prop changes
  useEffect(() => {
    if (cellText !== localText) {
      logDebug('Syncing local text with prop change', { from: localText, to: cellText });
      setLocalText(cellText);
    }
  }, [cellText, localText]);

  // Enhanced focus management with error handling
  const focusAndSelectText = useCallback(() => {
    if (!textareaRef.current) {
      logDebug('Focus attempt failed: textarea ref is null');
      return false;
    }
    
    try {
      textareaRef.current.focus();
      textareaRef.current.select();
      logDebug('Successfully focused and selected text');
      return true;
    } catch (error) {
      logDebug('Error during focus/select operation', error);
      return false;
    }
  }, []);

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (isEditing && !hasInitialized) {
      logDebug('Initializing editor focus');
      
      // Use a short timeout to ensure the element is in the DOM before focusing
      const focusTimeout = setTimeout(() => {
        if (textareaRef.current) {
          try {
            textareaRef.current.focus();
            textareaRef.current.select(); // Select all text for better UX
            setHasInitialized(true);
            logDebug('Successfully focused and selected text');
          } catch (error) {
            logDebug('Error during focus operation', error);
            onCancelEditing();
          }
        } else {
          logDebug('Textarea ref not available, canceling edit');
          onCancelEditing();
        }
      }, 10); // Short delay to ensure DOM element is ready
      
      return () => clearTimeout(focusTimeout);
    } else if (!isEditing) {
      setHasInitialized(false);
    }
  }, [isEditing, hasInitialized, onCancelEditing]);

  // Enhanced keyboard event handling with error boundaries
  const handleSave = useCallback(() => {
    try {
      logDebug('Saving cell text', { text: localText });
      onTextChange(localText);
      onFinishEditing();
    } catch (error) {
      logDebug('Error during save operation', error);
      // Fallback: still try to finish editing
      onFinishEditing();
    }
  }, [localText, onTextChange, onFinishEditing]);

  const handleCancel = useCallback(() => {
    try {
      logDebug('Canceling edit, reverting text', { from: localText, to: cellText });
      setLocalText(cellText);
      onCancelEditing();
    } catch (error) {
      logDebug('Error during cancel operation', error);
      // Fallback: still try to cancel editing
      onCancelEditing();
    }
  }, [localText, cellText, onCancelEditing]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;

      try {
        switch (e.key) {
          case 'Enter':
            if (!e.shiftKey) {
              e.preventDefault();
              logDebug('Enter key pressed, saving');
              handleSave();
            }
            break;
          case 'Escape':
            e.preventDefault();
            logDebug('Escape key pressed, canceling');
            handleCancel();
            break;
          case 'Tab':
            e.preventDefault();
            logDebug('Tab key pressed, saving and moving');
            handleSave();
            break;
        }
      } catch (error) {
        logDebug('Error in keyboard event handler', error);
        // Failsafe: cancel editing on any error
        handleCancel();
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown, { passive: false });
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        logDebug('Keyboard event listener cleaned up');
      };
    }
  }, [isEditing, handleSave, handleCancel]);

  // Handle clicks outside to finish editing
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isEditing || !textareaRef.current) return;
      
      try {
        const target = e.target as Node;
        if (target && !textareaRef.current.contains(target)) {
          logDebug('Click outside detected, saving');
          handleSave();
        }
      } catch (error) {
        logDebug('Error in click outside handler', error);
        // Failsafe: still try to save
        handleSave();
      }
    };

    if (isEditing) {
      // Use capture phase to handle clicks before other handlers
      document.addEventListener('mousedown', handleClickOutside, { capture: true });
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, { capture: true });
        logDebug('Click outside event listener cleaned up');
      };
    }
  }, [isEditing, handleSave]);

  // Early return if not editing
  if (!isEditing) {
    logDebug('Not editing, returning null');
    return null;
  }

  // Validate position before rendering
  if (!validateCellPosition(cellPosition)) {
    logDebug('Invalid cell position, cannot render editor');
    return null;
  }

  // Enhanced textarea change handler with validation
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newText = e.target.value;
      logDebug('Text changed', { from: localText, to: newText });
      setLocalText(newText);
    } catch (error) {
      logDebug('Error handling text change', error);
    }
  }, [localText]);

  // Enhanced blur handler with error handling
  const handleBlur = useCallback(() => {
    try {
      logDebug('Textarea blurred, saving text');
      handleSave();
    } catch (error) {
      logDebug('Error in blur handler', error);
      // Fallback to cancel on error
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  // Create enhanced textarea style with validation
  const createTextareaStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: Math.max(0, cellPosition.x),
      top: Math.max(0, cellPosition.y),
      width: Math.max(50, cellPosition.width), // Minimum width
      height: Math.max(20, cellPosition.height), // Minimum height
      border: `2px solid ${designSystem.colors.primary[500]}`,
      borderRadius: '4px',
      padding: '8px',
      fontSize: `${Math.max(10, Math.min(24, fontSize))}px`, // Clamp font size
      fontFamily: fontFamily || designSystem.typography.fontFamily.sans,
      color: textColor || designSystem.colors.secondary[800],
      backgroundColor: designSystem.canvasStyles.background,
      resize: 'none' as const,
      outline: 'none',
      overflow: 'hidden' as const,
      textAlign: textAlign || 'left',
      zIndex: 1000,
      boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
      lineHeight: '1.4',
      // Additional robustness properties
      boxSizing: 'border-box' as const,
      wordWrap: 'break-word' as const,
      whiteSpace: 'pre-wrap' as const,
    };

    logDebug('Created textarea style', baseStyle);
    return baseStyle;
  };

  // Ensure portal target exists
  const portalTarget = document.body;
  if (!portalTarget) {
    logDebug('Portal target (document.body) not available');
    return null;
  }

  try {
    const textareaStyle = createTextareaStyle();
    
    return createPortal(
      <textarea
        ref={textareaRef}
        style={textareaStyle}
        value={localText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder="Type here..."
        spellCheck={false}
        autoComplete="off"
        data-testid="table-cell-editor"
        aria-label="Edit cell text"
      />,
      portalTarget
    );
  } catch (error) {
    logDebug('Error rendering TableCellEditor', error);
    // Graceful fallback - cancel editing if render fails
    setTimeout(() => handleCancel(), 0);
    return null;
  }
};

export default TableCellEditor;
