import React, { useState, useEffect, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';

interface CanvasTextInputProps {
  x: number;
  y: number;
  width: number;
  height: number;
  initialText: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fill: string;
  backgroundColor: string;
  isHeader: boolean;
  absolute?: boolean; // Optional prop for absolute positioning
  onSave: (text: string) => void;
  onCancel: () => void;
  onTab: (backward?: boolean) => void;
}

export const CanvasTextInput: React.FC<CanvasTextInputProps> = ({
  x,
  y,
  width,
  height,
  initialText,
  fontSize,
  fontFamily,
  fontWeight,
  fill,
  backgroundColor,
  isHeader,
  absolute = false, // Default to false for backward compatibility
  onSave,
  onCancel,
  onTab,
}) => {
  const [text, setText] = useState(initialText);
  const [cursorVisible, setCursorVisible] = useState(true);
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);
  const skipSaveRef = useRef(false);

  // Use refs to hold the latest callbacks to avoid stale closures in the main effect
  const onSaveRef = useRef(onSave);
  const onCancelRef = useRef(onCancel);
  const onTabRef = useRef(onTab);
  useEffect(() => {
    onSaveRef.current = onSave;
    onCancelRef.current = onCancel;
    onTabRef.current = onTab;
  }, [onSave, onCancel, onTab]);

  // Create hidden DOM textarea for actual text input
  useEffect(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text; // Use component state, not initialText prop
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textInputRef.current = textarea;

    // Focus the hidden textarea and select all text for immediate replacement
    textarea.focus();
    textarea.select(); // This ensures typing replaces placeholder text

    // Handle text input
    const handleInput = () => {
      setText(textarea.value);
    };

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        skipSaveRef.current = true;
        onSaveRef.current(textarea.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        skipSaveRef.current = true;
        onCancelRef.current();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        skipSaveRef.current = true;
        // Pass the most current text value directly to the save handler before tabbing
        onSaveRef.current(textarea.value);
        onTabRef.current(e.shiftKey);
      }
    };

    const handleBlur = () => {
      if (!skipSaveRef.current) {
        skipSaveRef.current = true;
        onSaveRef.current(textarea.value);
      }
    };

    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('blur', handleBlur);

    return () => {
      textarea.removeEventListener('input', handleInput);
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('blur', handleBlur);
      if (document.body.contains(textarea)) {
        document.body.removeChild(textarea);
      }
    };
  }, []); // This effect should only run once to create the textarea

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Calculate proper text dimensions - make text area much larger
  const textAreaWidth = Math.max(width - 8, 100); // Minimum 100px width
  const textAreaHeight = Math.max(height - 8, 30); // Minimum 30px height
  
  const displayText = text || (isHeader ? 'Column header' : 'Enter text');
  const isPlaceholder = !text;

  // Calculate cursor position more accurately
  const textWidth = text.length * fontSize * 0.6; // Better approximation
  const cursorX = Math.min(textWidth + 4, textAreaWidth - 4);

  return (
    <Group x={absolute ? 0 : x} y={absolute ? 0 : y}>
      {/* Background highlight for editing state */}
      <Rect
        width={textAreaWidth}
        height={textAreaHeight}
        fill={backgroundColor}
        stroke="#3B82F6"
        strokeWidth={2}
        cornerRadius={4}
        x={absolute ? x : 0}
        y={absolute ? y : 0}
      />
      
      {/* Text content */}
      <Text
        text={displayText}
        width={textAreaWidth - 12}
        height={textAreaHeight - 12}
        x={absolute ? x + 6 : 6}
        y={absolute ? y + 4 : 4}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        fill={isPlaceholder ? '#9CA3AF' : fill}
        fontStyle={isPlaceholder ? 'italic' : 'normal'}
        verticalAlign="top"
        align="left"
        wrap="word"
        padding={4}
      />
      
      {/* Cursor simulation */}
      {cursorVisible && (
        <Rect
          x={absolute ? x + cursorX + 6 : cursorX + 6}
          y={absolute ? y + 6 : 6}
          width={2}
          height={fontSize + 4}
          fill="#3B82F6"
        />
      )}
    </Group>
  );
}; 