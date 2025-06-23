// src/components/canvas/UnifiedTextEditor.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../../design-system/designSystem';

interface UnifiedTextEditorProps {
  isEditing: boolean;
  element: {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    textColor?: string;
    fill?: string;
    backgroundColor?: string;
    type: 'text' | 'sticky-note';
  };
  editText: string;
  onTextChange: (text: string) => void;
  onTextSelection: (selection: { start: number; end: number } | null) => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
  position: { x: number; y: number; width: number; height: number };
}

export const UnifiedTextEditor: React.FC<UnifiedTextEditorProps> = ({
  isEditing,
  element,
  editText,
  onTextChange,
  onTextSelection,
  onFinishEditing,
  onCancelEditing,
  position
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hasPlaceholderBeenCleared, setHasPlaceholderBeenCleared] = useState(false);

  // Detect if the text is placeholder text that should be cleared
  const isPlaceholderText = (text: string) => {
    if (!text) return false;
    const placeholderTexts = [
      'Double-click to edit',
      'Double-click to add text',
      'Click to edit',
      'Enter text...',
      'Type your text...'
    ];
    return placeholderTexts.includes(text.trim());
  };
  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (isEditing && !hasInitialized && textareaRef.current) {
      const focusTimeout = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          
          // If the initial text is placeholder text, select it all for easy replacement
          if (isPlaceholderText(editText)) {
            textareaRef.current.select();
          } else {
            textareaRef.current.select();
          }
          
          setHasInitialized(true);
        }
      }, 10);
      
      return () => clearTimeout(focusTimeout);
    } else if (!isEditing) {
      setHasInitialized(false);
      setHasPlaceholderBeenCleared(false); // Reset when not editing
    }
    return undefined;
  }, [isEditing, hasInitialized, editText]);

  // Handle text selection for formatting
  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start !== end) {
      onTextSelection({ start, end });
    } else {
      onTextSelection(null);
    }
  }, [onTextSelection]);
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;

      // Handle placeholder text clearing on first meaningful keypress
      if (!hasPlaceholderBeenCleared && textareaRef.current) {
        const currentText = textareaRef.current.value;
        // Check if this is a content-producing key (not navigation keys)
        const isContentKey = !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Tab', 'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key) && !e.ctrlKey && !e.metaKey;
        
        if (isContentKey && isPlaceholderText(currentText)) {
          // Mark that we'll clear placeholder on the next input
          setHasPlaceholderBeenCleared(true);
        }
      }

      switch (e.key) {
        case 'Enter':
          if (!e.shiftKey) {
            e.preventDefault();
            onFinishEditing();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onCancelEditing();
          break;
        case 'Tab':
          e.preventDefault();
          onFinishEditing();
          break;
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown, { passive: false });
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isEditing, onFinishEditing, onCancelEditing, hasPlaceholderBeenCleared]);

  // Handle clicks outside to finish editing
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isEditing || !textareaRef.current) return;
      
      const target = e.target as Element;
      if (target && !textareaRef.current.contains(target)) {
        // Check if click is on FloatingTextToolbar
        const isToolbarClick = target.closest('[data-floating-toolbar]') !== null;
        if (!isToolbarClick) {
          onFinishEditing();
        }
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside, { capture: true });
      return () => document.removeEventListener('mousedown', handleClickOutside, { capture: true });
    }
    return undefined;
  }, [isEditing, onFinishEditing]);

  if (!isEditing) return null;

  const textareaStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${position.width}px`,
    height: `${position.height}px`,
    border: `2px solid ${designSystem.colors.primary[500]}`,
    borderRadius: '4px',
    padding: '8px',
    fontSize: `${element.fontSize || 16}px`,
    fontFamily: element.fontFamily || designSystem.typography.fontFamily.sans,
    color: element.textColor || element.fill || designSystem.colors.secondary[800],
    backgroundColor: element.type === 'sticky-note' 
      ? (element.backgroundColor || designSystem.colors.warning[100])
      : designSystem.canvasStyles.background,
    resize: 'none' as const,
    outline: 'none',
    overflow: 'hidden' as const,
    zIndex: 2000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    lineHeight: '1.4',
    boxSizing: 'border-box' as const,
    wordWrap: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
  };

  // Create or get a dedicated portal container
  const getPortalTarget = () => {
    let portalContainer = document.getElementById('unified-text-editor-portal');
    
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'unified-text-editor-portal';
      portalContainer.style.position = 'absolute';
      portalContainer.style.top = '0';
      portalContainer.style.left = '0';
      portalContainer.style.pointerEvents = 'none';
      portalContainer.style.zIndex = '2000';
      document.body.appendChild(portalContainer);
    }
    return portalContainer;
  };

  const portalTarget = getPortalTarget();
  if (!portalTarget) return null;
  return createPortal(
    <div style={{ position: 'absolute', pointerEvents: 'auto', zIndex: 2000 }}>
      <textarea
        ref={textareaRef}
        style={textareaStyle}
        value={editText}
        onChange={(e) => {
          const newText = e.target.value;
          
          // If this is the first input and we haven't cleared placeholder yet
          if (!hasPlaceholderBeenCleared && isPlaceholderText(editText)) {
            // Clear placeholder and start fresh with the new input
            setHasPlaceholderBeenCleared(true);
            onTextChange(newText);
          } else {
            onTextChange(newText);
          }
        }}
        onSelect={handleTextSelection}
        onMouseUp={handleTextSelection}
        onKeyUp={handleTextSelection}
        placeholder="Type here..."
        spellCheck={false}
        autoComplete="off"
        data-testid="unified-text-editor"
        aria-label="Edit text"
      />
    </div>,
    portalTarget
  );
};

export default UnifiedTextEditor;