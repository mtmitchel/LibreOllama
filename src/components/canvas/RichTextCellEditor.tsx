import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../styles/designSystem';
import { RichTextSegment } from '../../stores/konvaCanvasStore';

interface CellPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RichTextCellEditorProps {
  isEditing: boolean;
  cellPosition: CellPosition;
  cellText: string;
  richTextSegments?: RichTextSegment[];
  onTextChange: (text: string) => void;
  onRichTextChange?: (segments: RichTextSegment[]) => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

interface TextFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number;
  fontFamily: string;
  textColor: string;
}

// Debug logging utility
const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[RichTextCellEditor] ${message}`, data || '');
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

// Helper function to convert rich text segments to plain text
const segmentsToPlainText = (segments: RichTextSegment[]): string => {
  return segments.map(segment => segment.text).join('');
};

// Helper function to convert plain text to rich text segments
const plainTextToSegments = (text: string, format: Partial<TextFormat>): RichTextSegment[] => {
  if (!text) return [];
  
  return [{
    text,
    fontSize: format.fontSize,
    fontFamily: format.fontFamily,
    fontStyle: format.italic ? 'italic' : 'normal',
    fontWeight: format.bold ? 'bold' : 'normal',
    textDecoration: format.underline ? 'underline' : '',
    fill: format.textColor
  }];
};

// Helper function to apply formatting to selected text
const applyFormatToSelection = (
  segments: RichTextSegment[],
  selectionStart: number,
  selectionEnd: number,
  format: Partial<TextFormat>
): RichTextSegment[] => {
  if (segments.length === 0) return [];
  
  const result: RichTextSegment[] = [];
  let currentPos = 0;
  
  for (const segment of segments) {
    const segmentStart = currentPos;
    const segmentEnd = currentPos + segment.text.length;
    
    // Segment is completely before selection
    if (segmentEnd <= selectionStart) {
      result.push({ ...segment });
    }
    // Segment is completely after selection
    else if (segmentStart >= selectionEnd) {
      result.push({ ...segment });
    }
    // Segment overlaps with selection
    else {
      // Part before selection
      if (segmentStart < selectionStart) {
        result.push({
          ...segment,
          text: segment.text.substring(0, selectionStart - segmentStart)
        });
      }
      
      // Part within selection (apply formatting)
      const overlapStart = Math.max(0, selectionStart - segmentStart);
      const overlapEnd = Math.min(segment.text.length, selectionEnd - segmentStart);
      
      if (overlapStart < overlapEnd) {
        result.push({
          ...segment,
          text: segment.text.substring(overlapStart, overlapEnd),
          fontSize: format.fontSize ?? segment.fontSize,
          fontFamily: format.fontFamily ?? segment.fontFamily,
          fontStyle: format.italic !== undefined ? (format.italic ? 'italic' : 'normal') : segment.fontStyle,
          fontWeight: format.bold !== undefined ? (format.bold ? 'bold' : 'normal') : segment.fontWeight,
          textDecoration: format.underline !== undefined ? (format.underline ? 'underline' : '') : segment.textDecoration,
          fill: format.textColor ?? segment.fill
        });
      }
      
      // Part after selection
      if (segmentEnd > selectionEnd) {
        result.push({
          ...segment,
          text: segment.text.substring(selectionEnd - segmentStart)
        });
      }
    }
    
    currentPos = segmentEnd;
  }
  
  return result.filter(segment => segment.text.length > 0);
};

export const RichTextCellEditor: React.FC<RichTextCellEditorProps> = ({
  isEditing,
  cellPosition,
  cellText,
  richTextSegments = [],
  onTextChange,
  onRichTextChange,
  onFinishEditing,
  onCancelEditing,
  fontSize = 14,
  fontFamily = designSystem.typography.fontFamily.sans,
  textColor = designSystem.colors.secondary[800],
  textAlign = 'left'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [localText, setLocalText] = useState(cellText);
  const [localSegments, setLocalSegments] = useState<RichTextSegment[]>(richTextSegments);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [currentFormat, setCurrentFormat] = useState<TextFormat>({
    bold: false,
    italic: false,
    underline: false,
    fontSize: fontSize,
    fontFamily: fontFamily,
    textColor: textColor
  });
  
  // Validate props on mount and when they change
  useEffect(() => {
    if (isEditing && !validateCellPosition(cellPosition)) {
      logDebug('RichTextCellEditor received invalid cellPosition, editor will not render');
      onCancelEditing();
      return;
    }
  }, [isEditing, cellPosition, onCancelEditing]);

  // Sync local text and segments with prop changes
  useEffect(() => {
    if (cellText !== localText) {
      logDebug('Syncing local text with prop change', { from: localText, to: cellText });
      setLocalText(cellText);
    }
  }, [cellText, localText]);

  useEffect(() => {
    if (richTextSegments !== localSegments) {
      logDebug('Syncing local segments with prop change');
      setLocalSegments(richTextSegments);
      if (richTextSegments.length > 0) {
        setLocalText(segmentsToPlainText(richTextSegments));
      }
    }
  }, [richTextSegments, localSegments]);

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
      
      const focusTimeout = setTimeout(() => {
        if (textareaRef.current) {
          try {
            textareaRef.current.focus();
            textareaRef.current.select();
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
      }, 10);
      
      return () => clearTimeout(focusTimeout);
    } else if (!isEditing) {
      setHasInitialized(false);
      setShowToolbar(false);
    }
  }, [isEditing, hasInitialized, onCancelEditing]);

  // Handle text selection for formatting
  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start !== end) {
      setSelectionRange({ start, end });
      setShowToolbar(true);
      
      // Analyze current format at selection
      if (localSegments.length > 0) {
        // Find the format of the first character in selection
        let currentPos = 0;
        for (const segment of localSegments) {
          if (currentPos + segment.text.length > start) {
            setCurrentFormat({
              bold: segment.fontWeight === 'bold',
              italic: segment.fontStyle === 'italic',
              underline: segment.textDecoration?.includes('underline') || false,
              fontSize: segment.fontSize || fontSize,
              fontFamily: segment.fontFamily || fontFamily,
              textColor: segment.fill || textColor
            });
            break;
          }
          currentPos += segment.text.length;
        }
      }
    } else {
      setSelectionRange(null);
      setShowToolbar(false);
    }
  }, [localSegments, fontSize, fontFamily, textColor]);

  // Enhanced keyboard event handling
  const handleSave = useCallback(() => {
    try {
      logDebug('Saving cell text', { text: localText, segments: localSegments });
      onTextChange(localText);
      if (onRichTextChange && localSegments.length > 0) {
        onRichTextChange(localSegments);
      }
      onFinishEditing();
    } catch (error) {
      logDebug('Error during save operation', error);
      onFinishEditing();
    }
  }, [localText, localSegments, onTextChange, onRichTextChange, onFinishEditing]);

  const handleCancel = useCallback(() => {
    try {
      logDebug('Canceling edit, reverting text', { from: localText, to: cellText });
      setLocalText(cellText);
      setLocalSegments(richTextSegments);
      onCancelEditing();
    } catch (error) {
      logDebug('Error during cancel operation', error);
      onCancelEditing();
    }
  }, [localText, cellText, richTextSegments, onCancelEditing]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;

      try {
        // Handle formatting shortcuts
        if (e.ctrlKey || e.metaKey) {
          switch (e.key.toLowerCase()) {
            case 'b':
              e.preventDefault();
              handleFormatToggle('bold');
              break;
            case 'i':
              e.preventDefault();
              handleFormatToggle('italic');
              break;
            case 'u':
              e.preventDefault();
              handleFormatToggle('underline');
              break;
          }
        }
        
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
        if (target && 
            !textareaRef.current.contains(target) && 
            !toolbarRef.current?.contains(target)) {
          logDebug('Click outside detected, saving');
          handleSave();
        }
      } catch (error) {
        logDebug('Error in click outside handler', error);
        handleSave();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside, { capture: true });
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, { capture: true });
        logDebug('Click outside event listener cleaned up');
      };
    }
  }, [isEditing, handleSave]);

  // Handle format toggle
  const handleFormatToggle = useCallback((formatType: 'bold' | 'italic' | 'underline') => {
    if (!selectionRange || !textareaRef.current) return;
    
    const newFormat = {
      ...currentFormat,
      [formatType]: !currentFormat[formatType]
    };
    
    setCurrentFormat(newFormat);
    
    // Apply formatting to selection
    if (localSegments.length === 0) {
      // Convert plain text to segments first
      const segments = plainTextToSegments(localText, currentFormat);
      const formattedSegments = applyFormatToSelection(
        segments,
        selectionRange.start,
        selectionRange.end,
        { [formatType]: newFormat[formatType] }
      );
      setLocalSegments(formattedSegments);
    } else {
      const formattedSegments = applyFormatToSelection(
        localSegments,
        selectionRange.start,
        selectionRange.end,
        { [formatType]: newFormat[formatType] }
      );
      setLocalSegments(formattedSegments);
    }
  }, [selectionRange, currentFormat, localSegments, localText]);

  // Handle text change
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newText = e.target.value;
      logDebug('Text changed', { from: localText, to: newText });
      setLocalText(newText);
      
      // Reset segments when text changes significantly
      if (localSegments.length > 0 && newText !== segmentsToPlainText(localSegments)) {
        setLocalSegments([]);
      }
    } catch (error) {
      logDebug('Error handling text change', error);
    }
  }, [localText, localSegments]);

  // Handle blur
  const handleBlur = useCallback(() => {
    try {
      // Don't save on blur if toolbar is being used
      if (showToolbar && toolbarRef.current?.contains(document.activeElement)) {
        return;
      }
      logDebug('Textarea blurred, saving text');
      handleSave();
    } catch (error) {
      logDebug('Error in blur handler', error);
      handleCancel();
    }
  }, [handleSave, handleCancel, showToolbar]);

  // Handle click outside to prevent event bubbling
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  // Handle mouse down to prevent drag events
  const handleEditorMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

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

  // Create textarea style
  const createTextareaStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: Math.max(0, cellPosition.x),
      top: Math.max(0, cellPosition.y),
      width: Math.max(50, cellPosition.width),
      height: Math.max(20, cellPosition.height),
      border: `2px solid ${designSystem.colors.primary[500]}`,
      borderRadius: '4px',
      padding: '8px',
      fontSize: `${Math.max(10, Math.min(24, fontSize))}px`,
      fontFamily: fontFamily || designSystem.typography.fontFamily.sans,
      color: textColor || designSystem.colors.secondary[800],
      backgroundColor: designSystem.canvasStyles.background,
      resize: 'none' as const,
      outline: 'none',
      overflow: 'hidden' as const,
      textAlign: textAlign || 'left',
      zIndex: 2000,
      boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
      lineHeight: '1.4',
      boxSizing: 'border-box' as const,
      wordWrap: 'break-word' as const,
      whiteSpace: 'pre-wrap' as const,
    };

    logDebug('Created textarea style', baseStyle);
    return baseStyle;
  };

  // Create toolbar style
  const createToolbarStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      left: Math.max(0, cellPosition.x),
      top: Math.max(0, cellPosition.y - 45),
      display: 'flex',
      gap: '4px',
      padding: '6px',
      backgroundColor: 'white',
      border: `1px solid ${designSystem.colors.primary[300]}`,
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      zIndex: 2001,
      fontSize: '12px'
    };
  };

  // Create or get a dedicated portal container that's guaranteed to be outside React-Konva
  const getPortalTarget = () => {
    let portalContainer = document.getElementById('rich-text-editor-portal');
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'rich-text-editor-portal';
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
  if (!portalTarget) {
    logDebug('Portal target could not be created');
    return null;
  }

  try {
    const textareaStyle = createTextareaStyle();
    const toolbarStyle = createToolbarStyle();
    
    return createPortal(
      <div 
        style={{ position: 'absolute', pointerEvents: 'auto', zIndex: 2000 }}
        onClick={handleEditorClick}
        onMouseDown={handleEditorMouseDown}
      >
        <textarea
          ref={textareaRef}
          style={textareaStyle}
          value={localText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onSelect={handleTextSelection}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          placeholder="Type here..."
          spellCheck={false}
          autoComplete="off"
          data-testid="rich-text-cell-editor"
          aria-label="Edit cell text"
        />
        
        {showToolbar && selectionRange && (
          <div ref={toolbarRef} style={toolbarStyle}>
            <button
              type="button"
              onClick={() => handleFormatToggle('bold')}
              style={{
                padding: '4px 8px',
                border: 'none',
                borderRadius: '3px',
                backgroundColor: currentFormat.bold ? designSystem.colors.primary[500] : 'transparent',
                color: currentFormat.bold ? 'white' : designSystem.colors.secondary[700],
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Bold (Ctrl+B)"
            >
              B
            </button>
            
            <button
              type="button"
              onClick={() => handleFormatToggle('italic')}
              style={{
                padding: '4px 8px',
                border: 'none',
                borderRadius: '3px',
                backgroundColor: currentFormat.italic ? designSystem.colors.primary[500] : 'transparent',
                color: currentFormat.italic ? 'white' : designSystem.colors.secondary[700],
                fontStyle: 'italic',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            
            
            <button
              type="button"
              onClick={() => handleFormatToggle('underline')}
              style={{
                padding: '4px 8px',
                border: 'none',
                borderRadius: '3px',
                backgroundColor: currentFormat.underline ? designSystem.colors.primary[500] : 'transparent',
                color: currentFormat.underline ? 'white' : designSystem.colors.secondary[700],
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Underline (Ctrl+U)"
            >
              U
            </button>
          </div>
        )}
      </div>,
      portalTarget
    );
  } catch (error) {
    logDebug('Error rendering RichTextCellEditor', error);
    setTimeout(() => handleCancel(), 0);
    return null;
  }
};

export default RichTextCellEditor;