// src/components/canvas/TextEditingOverlay.tsx
import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface TextEditingOverlayProps {
  isEditing: boolean;
  element: {
    id: string;
    x: number;
    y: number;
    text: string;
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    type: 'text' | 'sticky-note';
    backgroundColor?: string;
    textColor?: string;
  };
  editText: string;
  onEditTextChange: (text: string) => void;
  textareaPosition: { x: number; y: number; width: number; height: number } | null;
  onCancel: () => void;
  onDone: () => void;
  stageRef?: React.RefObject<any>;
}

export const TextEditingOverlay: React.FC<TextEditingOverlayProps> = ({
  isEditing,
  element,
  editText,
  onEditTextChange,
  textareaPosition,
  onCancel,
  onDone
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // LOCAL STATE: Use local state for textarea value to prevent global updates on every keystroke
  const [localText, setLocalText] = useState(editText);
  
  // Sync local state with prop changes when editing starts
  useEffect(() => {
    if (isEditing) {
      setLocalText(editText);
    }
  }, [isEditing, editText]);
  
  // Function to commit changes to global state
  const commitChanges = () => {
    onEditTextChange(localText);
    onDone();
  };
  
  // Function to cancel changes
  const cancelChanges = () => {
    setLocalText(editText); // Reset to original
    onCancel();
  };
  
  // Inject styles for FigJam-style textarea
  useEffect(() => {
    const styleId = 'figjam-textarea-styles';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.innerHTML = `
        .text-editing-textarea.figjam-style::placeholder {
          color: rgba(255, 255, 255, 0.6);
          font-style: normal;
        }
        
        .text-editing-textarea.figjam-style::-webkit-scrollbar {
          width: 8px;
        }
        
        .text-editing-textarea.figjam-style::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        .text-editing-textarea.figjam-style::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        
        .text-editing-textarea.figjam-style::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    return () => {
      // Cleanup is optional since we reuse the same style element
    };
  }, []);

  // Auto-focus textarea when editing starts - ONLY when editing state changes, not on text changes
  useEffect(() => {
    if (isEditing && textareaRef.current && textareaPosition) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          if (localText.trim() !== '') {
            textareaRef.current.select();
          }
        }
      }, 10);
    }
  }, [isEditing, textareaPosition]); // Deliberately exclude localText to prevent re-focus on each keystroke

  if (!isEditing || !textareaPosition) {
    console.log('🔍 [OVERLAY DEBUG] TextEditingOverlay early return:', {
      isEditing,
      hasTextareaPosition: !!textareaPosition,
      textareaPosition
    });
    return null;
  }

  console.log('🔍 [OVERLAY DEBUG] TextEditingOverlay rendering with props:', {
    isEditing,
    elementId: element.id,
    elementType: element.type,
    textareaPosition,
    localText: localText.substring(0, 50) + '...'
  });

  return (
    <>
      {/* Textarea overlay */}
      {createPortal(
        <textarea
          ref={textareaRef}
          value={localText}
          onChange={(e) => {
            e.stopPropagation(); // Prevent event bubbling that might cause re-renders
            console.log('🔍 [INPUT DEBUG] Textarea onChange triggered:', {
              currentValue: localText,
              newValue: e.target.value,
              inputLength: e.target.value.length,
              timestamp: Date.now()
            });
            // Update local state only, no global state update
            setLocalText(e.target.value);
          }}
          placeholder="Add text"
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              console.log('🔍 [TEXTAREA DEBUG] Enter key pressed - auto-saving');
              commitChanges();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              console.log('🔍 [TEXTAREA DEBUG] Escape key pressed - canceling');
              cancelChanges();
            }
          }}
          onBlur={() => {
            // Commit changes when focus is lost
            commitChanges();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: textareaPosition.x + 'px',
            top: textareaPosition.y + 'px',
            width: textareaPosition.width + 'px',
            height: textareaPosition.height + 'px',
            fontSize: (element.fontSize || 16) + 'px',
            fontFamily: element.fontFamily || 'Arial, sans-serif',
            color: '#ffffff', // White text for FigJam style
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            border: '3px solid #3B82F6',
            borderRadius: '12px', // Rounded corners for FigJam style
            padding: element.type === 'sticky-note' ? '12px' : '8px',
            resize: 'none',
            outline: 'none',
            backgroundColor: '#3B82F6', // Blue background for FigJam style
            boxSizing: 'border-box',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease-in-out',
            backdropFilter: 'blur(4px)',
            zIndex: 9999
          }}
          className="text-editing-textarea figjam-style"
        />,
        document.body
      )}

    </>
  );
};

export default TextEditingOverlay;