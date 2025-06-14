// src/components/canvas/TextEditingOverlay.tsx
import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StandardTextFormattingMenu } from './StandardTextFormattingMenu';

interface TextFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  fontSize: number;
  color: string;
  fontFamily: string;
  listType: 'none' | 'bullet' | 'numbered';
  isHyperlink: boolean;
  hyperlinkUrl: string;
}

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
  showFormatMenu: boolean;
  textareaPosition: { x: number; y: number; width: number; height: number } | null;
  menuPosition: { x: number; y: number } | null;
  previewFormat: TextFormat;
  appliedFormats?: Set<string>;
  onFormatting: (type: string, value?: any) => void;
  onCancel: () => void;
  onDone: () => void;
  stageRef?: React.RefObject<any>;
}

export const TextEditingOverlay: React.FC<TextEditingOverlayProps> = ({
  isEditing,
  element,
  editText,
  onEditTextChange,
  showFormatMenu,
  textareaPosition,
  menuPosition,
  previewFormat,
  onFormatting,
  onCancel,
  onDone
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
          if (editText.trim() !== '') {
            textareaRef.current.select();
          }
        }
      }, 10);
    }
  }, [isEditing, textareaPosition]); // Remove editText dependency to prevent re-focus on each keystroke

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
    menuPosition,
    showFormatMenu,
    editText: editText.substring(0, 50) + '...'
  });

  // Helper function to format text with bullets for preview
  const formatTextForPreview = (text: string, listType: 'none' | 'bullet' | 'numbered'): string => {
    if (listType === 'none') return text;
    
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.trim() === '') return line; // Keep empty lines as is
      
      // Remove existing bullet/number if present
      const cleanLine = line.replace(/^(\s*)(•\s*|\d+\.\s*)/, '$1');
      
      if (listType === 'bullet') {
        const indentMatch = line.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';
        return indent + '• ' + cleanLine.trim();
      } else if (listType === 'numbered') {
        const indentMatch = line.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';
        return indent + `${index + 1}. ` + cleanLine.trim();
      }
      return line;
    }).join('\n');
  };

  // Helper function to clean text when saving (remove formatting characters)
  const cleanTextForSaving = (text: string): string => {
    return text.split('\n').map(line => {
      // Remove bullet points and numbers but keep the text
      return line.replace(/^(\s*)(•\s*|\d+\.\s*)/, '$1');
    }).join('\n');
  };

  const displayText = formatTextForPreview(editText, previewFormat.listType);

  return (
    <>
      {/* Textarea overlay */}
      {createPortal(
        <textarea
          ref={textareaRef}
          value={displayText}
          onChange={(e) => {
            e.stopPropagation(); // Prevent event bubbling that might cause re-renders
            console.log('🔍 [INPUT DEBUG] Textarea onChange triggered:', {
              currentValue: editText,
              newValue: e.target.value,
              inputLength: e.target.value.length,
              timestamp: Date.now()
            });
            // Clean the text before saving to remove formatting characters
            const cleanedText = cleanTextForSaving(e.target.value);
            onEditTextChange(cleanedText);
          }}
          placeholder="Add text"
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              console.log('🔍 [TEXTAREA DEBUG] Enter key pressed - auto-saving');
              onDone();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              console.log('🔍 [TEXTAREA DEBUG] Escape key pressed - canceling');
              onCancel();
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: textareaPosition.x + 'px',
            top: textareaPosition.y + 'px',
            width: textareaPosition.width + 'px',
            height: textareaPosition.height + 'px',
            fontSize: previewFormat.fontSize + 'px',
            fontFamily: previewFormat.fontFamily,
            color: '#ffffff', // White text for FigJam style
            fontWeight: previewFormat.bold ? 'bold' : 'normal',
            fontStyle: previewFormat.italic ? 'italic' : 'normal',
            textDecoration: [
              previewFormat.underline || previewFormat.isHyperlink ? 'underline' : '',
              previewFormat.strikethrough ? 'line-through' : ''
            ].filter(Boolean).join(' ') || 'none',
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

      {/* Formatting menu overlay */}
      {showFormatMenu && menuPosition && (
        <>
          {console.log('🐛 [DEBUG] TextEditingOverlay rendering StandardTextFormattingMenu with position:', menuPosition)}
          {createPortal(
            <StandardTextFormattingMenu
              position={{
                x: menuPosition.x,
                y: menuPosition.y
              }}
              width={Math.max(320, textareaPosition?.width || 320)}
              format={{
                bold: previewFormat.bold,
                italic: previewFormat.italic,
                underline: previewFormat.underline,
                strikethrough: previewFormat.strikethrough,
                fontSize: previewFormat.fontSize,
                color: previewFormat.color,
                fontFamily: previewFormat.fontFamily,
                listType: previewFormat.listType,
                isHyperlink: previewFormat.isHyperlink,
                hyperlinkUrl: previewFormat.hyperlinkUrl
              }}
              onFormatChange={(formatUpdates) => {
                Object.entries(formatUpdates).forEach(([key, value]) => {
                  if (key === 'bold' || key === 'italic' || key === 'underline' || key === 'strikethrough' || key === 'isHyperlink') {
                    onFormatting(key);
                  } else {
                    onFormatting(key, value);
                  }
                });
              }}
              onClose={onCancel}
              onDone={onDone}
              showDoneButton={true}
            />,
            document.body
          )}
        </>
      )}
    </>
  );
};

export default TextEditingOverlay;