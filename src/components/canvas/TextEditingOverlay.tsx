// src/components/canvas/TextEditingOverlay.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TextEditingOverlayProps {
  position: { x: number; y: number; width?: number; height?: number };
  text: string;
  onTextChange: (text: string) => void;
  onBlur: () => void;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: string;
  maxWidth?: number;
  rotation: number;
  scale: number;
}

const TextEditingOverlay: React.FC<TextEditingOverlayProps> = ({
  position,
  text,
  onTextChange,
  onBlur,
  fontSize,
  fontFamily,
  color,
  align,
  maxWidth,
  rotation,
  scale,
}) => {
  const [localText, setLocalText] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      
      // Check if the initial text is placeholder text
      if (isPlaceholderText(text)) {
        // Select all for easy replacement, but don't set hasPlaceholderBeenCleared yet
        textareaRef.current.select();
      } else {
        textareaRef.current.select();
      }
      
      adjustTextareaHeight();
    }
  }, []);

  useEffect(() => {
    setLocalText(text);
  }, [text]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    // If this is the first input and we haven't cleared placeholder yet
    if (!hasPlaceholderBeenCleared && isPlaceholderText(localText)) {
      // Clear placeholder and start fresh with the new input
      setHasPlaceholderBeenCleared(true);
      setLocalText(newText);
      onTextChange(newText);
    } else {
      setLocalText(newText);
      onTextChange(newText);
    }
    
    adjustTextareaHeight();
  };

  const handleBlur = () => {
    onBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Stop propagation to prevent global keyboard shortcuts from interfering
    e.stopPropagation();
    
    // Handle placeholder text clearing on first meaningful keypress
    if (!hasPlaceholderBeenCleared && textareaRef.current) {
      const currentText = textareaRef.current.value;
      // Check if this is a content-producing key (not navigation keys)
      const isContentKey = !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Tab', 'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key) && !e.ctrlKey && !e.metaKey;
      
      if (isContentKey && isPlaceholderText(currentText)) {
        // Clear placeholder text immediately on the next input
        setHasPlaceholderBeenCleared(true);
      }
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      onBlur();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onBlur();
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        zIndex: 1000,
        pointerEvents: 'auto',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: position.width ? `${position.width}px` : 'auto',
        height: position.height ? `${position.height}px` : 'auto',
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: 'left top',
      }}
    >
      <textarea
        ref={textareaRef}
        value={localText}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Enter text..."
        autoFocus
        style={{
          border: '2px solid #0066cc',
          outline: 'none',
          background: 'white',
          padding: '4px 8px',
          resize: 'none',
          overflow: 'hidden',
          lineHeight: '1.2',
          minWidth: '100px',
          minHeight: '1.2em',
          width: '100%',
          height: '100%',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
          color: color,
          textAlign: align as any,
          maxWidth: maxWidth ? `${maxWidth}px` : undefined,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
};

export default TextEditingOverlay;