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
  rotation: _, // Unused when positioned via Html wrapper
  scale: __, // Unused when positioned via Html wrapper
}) => {
  const [localText, setLocalText] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasPlaceholderBeenCleared, setHasPlaceholderBeenCleared] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    // Also check for table header patterns like "Header 1", "Header 2", etc.
    const headerPattern = /^Header \d+$/;
    return placeholderTexts.includes(text.trim()) || headerPattern.test(text.trim());
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
    // Debounce blur to prevent immediate element removal
    // This allows users to click back into the textarea if needed
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    
    blurTimeoutRef.current = setTimeout(() => {
      // Only call onBlur if text is not empty or is placeholder text
      if (localText.trim() || isPlaceholderText(localText)) {
        onBlur();
      } else {
        // Empty text - still call onBlur but with a longer delay to prevent accidental deletion
        setTimeout(onBlur, 1000);
      }
    }, 100);
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
    
    // Handle Enter and Escape keys
    if (e.key === 'Escape') {
      e.preventDefault();
      // Cancel any pending blur timeout
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      onBlur();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Cancel any pending blur timeout
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      onBlur();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', // Changed from 'absolute' to 'relative' for Html wrapper compatibility
        zIndex: 1000,
        pointerEvents: 'auto',
        left: position.x ? `${position.x}px` : '0px',
        top: position.y ? `${position.y}px` : '0px',
        width: position.width ? `${position.width}px` : 'auto',
        height: position.height ? `${position.height}px` : 'auto',
        // Remove transform as it's now handled by the Html wrapper
      }}
      onMouseDown={(e) => e.stopPropagation()} // Prevent canvas interactions
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
          userSelect: 'text', // Ensure text selection works within textarea
        }}
        onMouseDown={(e) => e.stopPropagation()} // Allow text selection in textarea
      />
    </div>
  );
};

export default TextEditingOverlay;