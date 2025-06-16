import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../styles/designSystem';
import type { RichTextSegment } from '../../types/richText';
import FloatingTextToolbar from './FloatingTextToolbar';
import {
  StandardTextFormat,
  FormattingCommand,
  TextSelection,
  DEFAULT_TEXT_FORMAT,
  DEFAULT_STYLE_PRESETS
} from '../../types/richText';
import { richTextManager } from './RichTextSystem/UnifiedRichTextManager';
import { validateTextFormat } from './RichTextSystem/TextFormatValidator';

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

// Using StandardTextFormat from the unified rich text system
// No need for local TextFormat interface - using StandardTextFormat directly

// Error logging utility for production safety
const logError = (message: string, error?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[RICH TEXT EDITOR] ${message}`, error || '');
  }
};

// Validation utility for cell position
const validateCellPosition = (position: CellPosition): boolean => {
  if (!position || typeof position !== 'object') {
    return false;
  }
  
  const { x, y, width, height } = position;
  const isValid =
    typeof x === 'number' && isFinite(x) &&
    typeof y === 'number' && isFinite(y) &&
    typeof width === 'number' && isFinite(width) && width > 0 &&
    typeof height === 'number' && isFinite(height) && height > 0;
  
  return isValid;
};

// Helper function to convert rich text segments to plain text
const segmentsToPlainText = (segments: RichTextSegment[]): string => {
  return segments.map(segment => segment.text).join('');
};

// Helper function to convert plain text to rich text segments using the unified system
const plainTextToSegments = (text: string, format: Partial<StandardTextFormat>): RichTextSegment[] => {
  if (!text) return [];
  
  return richTextManager.plainTextToSegments(text, format);
};

// Helper to check if a command is a style preset
const isStylePresetCommand = (command: string): boolean => {
  return command.startsWith('preset-'); // e.g., "preset-heading1"
};

// Apply formatting using the unified rich text manager
const applyFormattingToSegments = (
  segments: RichTextSegment[],
  formatToApply: keyof StandardTextFormat,
  value: any,
  selection: TextSelection | null
): RichTextSegment[] => {
  
  
  // Translate command if needed
  const translatedCommand = richTextManager.translateCommand(String(formatToApply));
  if (!translatedCommand) {
    console.warn('❌ [APPLY-FORMAT] Invalid command:', String(formatToApply));
    return segments;
  }

  const command: FormattingCommand = {
    command: translatedCommand,
    value,
    selection: selection || undefined
  };

  const result = richTextManager.applyFormattingToSegments(segments, command);
  
  if (result.success) {
    return result.segments;
  } else {
    return segments;
  }
};

// Get current formatting state using unified manager
const getFormattingState = (textarea: HTMLTextAreaElement, segments: RichTextSegment[]): Partial<StandardTextFormat> => {
  const position = textarea.selectionStart;
  return richTextManager.getFormattingAtPosition(segments, position);
};

// Get list type for selection using unified manager
const getListTypeForSelection = (textarea: HTMLTextAreaElement, segments: RichTextSegment[]): 'none' | 'bullet' | 'numbered' => {
  const position = textarea.selectionStart;
  const format = richTextManager.getFormattingAtPosition(segments, position);
  return format.listType || 'none';
};


export const RichTextCellEditor: React.FC<RichTextCellEditorProps> = ({
  isEditing,
  cellPosition,
  cellText,
  richTextSegments = [],
  onTextChange, // This is for plain text
  onRichTextChange, // This is for RichTextSegment[] for non-table elements
  // For table elements, onRichTextChange is expected to be part of a different prop structure
  // or handled by a more specific callback if this editor is used directly by table cells.
  // The original code had a more complex onRichTextChange for tables.
  // Let's assume the provided onRichTextChange is the generic one.

  onFinishEditing,
  onCancelEditing,
  fontSize = 14,
  fontFamily = designSystem.typography.fontFamily.sans,
  textColor = designSystem.colors.secondary[800],
  textAlign = 'left',
  // The following props were inferred from the broken edit, they need to be formally added if used
  // updateToolbarState, elementId, cellId, rowIndex, colIndex, isTableElement (or similar context)
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const getStageRef = useCallback(() => {
    const canvasContainer = document.querySelector('.konva-canvas-container canvas');
    if (canvasContainer) {
      const konvaStage = (canvasContainer as any).__konvaStage;
      return konvaStage || null;
    }
    return null;
  }, []);
  // FIXED: Simplified state management - single source of truth
  const [editorState, setEditorState] = useState(() => {
    const initialSegments = richTextSegments.length > 0
      ? richTextSegments
      : plainTextToSegments(cellText, {
          fontSize,
          fontFamily,
          textColor,
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          textAlign: textAlign as 'left' | 'center' | 'right',
          listType: 'none',
          isHyperlink: false,
          hyperlinkUrl: '',
          textStyle: 'default'
        });
    
    return {
      segments: initialSegments,
      plainText: richTextManager.segmentsToPlainText(initialSegments) || cellText
    };
  });
  
  // Keep ref for callbacks that need immediate access
  const editorStateRef = useRef(editorState);
  useEffect(() => {
    editorStateRef.current = editorState;
  }, [editorState]);

  const [hasInitialized, setHasInitialized] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<StandardTextFormat>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    fontSize: fontSize,
    fontFamily: fontFamily,
    textColor: textColor,
    listType: 'none',
    isHyperlink: false,
    hyperlinkUrl: '',
    textAlign: textAlign as 'left' | 'center' | 'right',
    textStyle: 'default'
  });
  
  // Validate props on mount and when they change
  useEffect(() => {
    if (isEditing && !validateCellPosition(cellPosition)) {
      logError('RichTextCellEditor received invalid cellPosition, editor will not render');
      onCancelEditing();
      return;
    }
  }, [isEditing, cellPosition, onCancelEditing]);

  // Initialize local state when editing starts, but don't sync during active editing
  useEffect(() => {
    if (isEditing && !hasInitialized) {
      // FIXED: Initialize with simplified state
      const initialSegments = richTextSegments.length > 0
        ? richTextSegments
        : plainTextToSegments(cellText, {
            fontSize,
            fontFamily,
            textColor,
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
            textAlign: textAlign as 'left' | 'center' | 'right',
            listType: 'none',
            isHyperlink: false,
            hyperlinkUrl: '',
            textStyle: 'default'
          });
      
      const initialText = richTextManager.segmentsToPlainText(initialSegments) || cellText;
      
      setEditorState({
        segments: initialSegments,
        plainText: initialText
      });


      const focusTimeout = setTimeout(() => {
        if (textareaRef.current) {
          try {
            textareaRef.current.focus();
            textareaRef.current.select();
            setHasInitialized(true);
            setShowToolbar(true); // Show toolbar
            // Update toolbar based on initial state
            if (textareaRef.current) {
                 // Commented out - these are currently unused
                 // const currentFormats = getFormattingState(textareaRef.current, localSegmentsRef.current);
                 // const activeListType = getListTypeForSelection(textareaRef.current, localSegmentsRef.current);
                 // updateToolbarState({ ...currentFormats, listType: activeListType || 'none' });
                 // ^ updateToolbarState needs to be passed as a prop if used here
            }

          } catch (error) {
            logError('ERROR during focus operation', error);
            onCancelEditing();
          }
        } else {
          logError('ERROR: Textarea ref not available, canceling edit');
          onCancelEditing();
        }
      }, 10);
      
      return () => clearTimeout(focusTimeout);
    } else if (!isEditing) {
      setHasInitialized(false);
      setShowToolbar(false);
    }
  }, [isEditing, hasInitialized, onCancelEditing, cellText, richTextSegments, fontSize, fontFamily, textColor, textAlign]);

  // Only sync with props when not editing or when editing session starts
  useEffect(() => {
    if (!isEditing) {
      const newSegments = richTextSegments.length > 0 ? richTextSegments : [];
      const newText = richTextManager.segmentsToPlainText(newSegments) || cellText;
      setEditorState({
        segments: newSegments,
        plainText: newText
      });
    }
  }, [isEditing, cellText, richTextSegments]);



  // Handle text selection for formatting
  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;

    // Always show toolbar for table cell editing, regardless of selection
    setShowToolbar(true);

    if (editorState.segments.length === 0) {
      return;
    }

    let currentPos = 0;
    let formatFound = false;

    for (const segment of editorState.segments) {
      const segmentEnd = currentPos + segment.text.length;

      if (start >= currentPos && start <= segmentEnd) {
        setCurrentFormat({
          bold: segment.fontWeight === 'bold',
          italic: segment.fontStyle === 'italic',
          underline: segment.textDecoration?.includes('underline') || false,
          strikethrough: segment.textDecoration?.includes('line-through') || false,
          fontSize: segment.fontSize || fontSize,
          fontFamily: segment.fontFamily || fontFamily,
          textColor: segment.fill || textColor,
          listType: 'none', // Not stored in RichTextSegment yet
          isHyperlink: !!segment.url,
          hyperlinkUrl: segment.url || '',
          textAlign: textAlign as 'left' | 'center' | 'right', // Element level property, not segment level
          textStyle: 'default' // Not stored in RichTextSegment yet
        });
        formatFound = true;
        break;
      }
      currentPos = segmentEnd;
    }

    if (!formatFound && start === editorState.plainText.length && editorState.segments.length > 0) {
      const lastSegment = editorState.segments[editorState.segments.length - 1];
      if (lastSegment) {
        setCurrentFormat({
          bold: lastSegment.fontWeight === 'bold',
          italic: lastSegment.fontStyle === 'italic',
          underline: lastSegment.textDecoration?.includes('underline') || false,
          strikethrough: lastSegment.textDecoration?.includes('line-through') || false,
          fontSize: lastSegment.fontSize || fontSize,
          fontFamily: lastSegment.fontFamily || fontFamily,
          textColor: lastSegment.fill || textColor,
          listType: 'none', // Not stored in RichTextSegment yet
          isHyperlink: !!lastSegment.url,
          hyperlinkUrl: lastSegment.url || '',
          textAlign: textAlign as 'left' | 'center' | 'right', // Element level property, not segment level
          textStyle: 'default' // Not stored in RichTextSegment yet
        });
      }
    }
  }, [editorState.segments, fontSize, fontFamily, textColor, editorState.plainText.length]);

  // Enhanced keyboard event handling
  const handleSave = useCallback(() => {
    try {
      // For plain text saving (if still needed by some parent)
      onTextChange(richTextManager.segmentsToPlainText(editorStateRef.current.segments));
      
      // For rich text saving
      if (onRichTextChange) {
        onRichTextChange(editorStateRef.current.segments);
      }
      onFinishEditing();
    } catch (error) {
      logError('ERROR during save operation', error);
      onFinishEditing(); // Ensure editing finishes even on error
    }
  }, [onTextChange, onRichTextChange, onFinishEditing]);

  const handleCancel = useCallback(() => {
    try {
      const resetSegments = richTextSegments.length > 0 ? richTextSegments : [];
      const resetText = richTextManager.segmentsToPlainText(resetSegments) || cellText;
      setEditorState({
        segments: resetSegments,
        plainText: resetText
      });
      onCancelEditing();
    } catch (error) {
      logError('ERROR during cancel operation', error);
      onCancelEditing();
    }
  }, [cellText, richTextSegments, onCancelEditing]);

  // Handle clicks outside to finish editing
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isEditing || !textareaRef.current) return;
      
      try {
        const target = e.target as Node;
        const targetElement = target as HTMLElement;
        
        console.log('🔍 [CLICK OUTSIDE DEBUG] Click detected', {
          target: target,
          targetTagName: targetElement?.tagName,
          targetClassName: targetElement?.className,
          hasToolbarRef: !!toolbarRef.current,
          toolbarRefDOM: toolbarRef.current,
          containsInTextarea: textareaRef.current.contains(target),
          containsInToolbar: toolbarRef.current?.contains(target),
          toolbarData: targetElement?.dataset?.floatingToolbar,
          toolbarButton: targetElement?.dataset?.toolbarButton,
          dropdownButton: targetElement?.dataset?.dropdownButton
        });
        
        // Check if click is inside toolbar using data attributes (more reliable)
        const isInsideToolbar = targetElement?.closest('[data-floating-toolbar]') ||
                               targetElement?.closest('[data-toolbar-button]') ||
                               targetElement?.closest('[data-dropdown-button]') ||
                               targetElement?.closest('[data-dropdown-content]') ||
                               targetElement?.closest('[data-dropdown-container]');
        
        console.log('🔍 [CLICK OUTSIDE DEBUG] Final decision', {
          isInsideToolbar: !!isInsideToolbar,
          willSave: !isInsideToolbar
        });
        
        if (target &&
            !textareaRef.current.contains(target) &&
            !isInsideToolbar) {
          
          handleSave();
        } else {
          
        }
      } catch (error) {
        logError('ERROR in click outside handler', error);
        handleSave();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside, { capture: true });
      return () => document.removeEventListener('mousedown', handleClickOutside, { capture: true });
    }
  }, [isEditing, handleSave]);

  // Handle format change for FloatingTextToolbar
  const handleFormattingChange = useCallback((command: string, value?: any) => {
    if (!textareaRef.current) return;

    
    
    

    let newSegments: RichTextSegment[] | null = null;
    const currentSelection: TextSelection | null = textareaRef.current ?
      { start: textareaRef.current.selectionStart, end: textareaRef.current.selectionEnd } : null;

    if (isStylePresetCommand(command)) {
      // Handle style presets using the unified manager
      const presetName = command.substring('preset-'.length); // e.g., "heading1" from "preset-heading1"
      const presets = richTextManager.getStylePresets();
      const preset = presets.find(p => p.id === presetName);
      
      if (preset) {
        const result = richTextManager.applyStylePreset(editorStateRef.current.segments, preset.id);
        if (result.success) {
          newSegments = result.segments;
        } else {
          console.error(`❌ [EDITOR] Style preset error: ${result.error}`);
          newSegments = [...editorStateRef.current.segments];
        }
      } else {
        console.warn(`⚠️ [EDITOR] Style preset "${presetName}" not found.`);
        newSegments = [...editorStateRef.current.segments];
      }
    } else {
      // Handle individual formatting commands
      newSegments = applyFormattingToSegments(
        editorStateRef.current.segments,
        command as keyof StandardTextFormat,
        value,
        currentSelection
      );
    }

    if (newSegments && Array.isArray(newSegments)) {
      const newPlainText = richTextManager.segmentsToPlainText(newSegments);
      
      // FIXED: Update unified state
      setEditorState({
        segments: newSegments,
        plainText: newPlainText
      });
      
      // Call onRichTextChange immediately for user-initiated formatting changes
      if (onRichTextChange) {
        onRichTextChange(newSegments);
      }
      
      // Update textarea if needed
      if (textareaRef.current && textareaRef.current.value !== newPlainText) {
        // Preserve cursor position if possible (simplified)
        const currentCursorPos = textareaRef.current.selectionStart;
        // Restore cursor position after text update
        setTimeout(() => {
          if (textareaRef.current) {
            try {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = Math.min(currentCursorPos, newPlainText.length);
            } catch (e) {
              console.warn("Error restoring cursor position", e);
            }
          }
        }, 0);
      }
    } else {
      console.warn('[RichTextCellEditor] newSegments is null, not an array, or empty after formatting. No update. Command:', command, 'Value:', value, 'Result:', newSegments);
    }

    // Update toolbar state based on the new selection/formatting
    setTimeout(() => {
      if (textareaRef.current) {
        const currentFormats = getFormattingState(textareaRef.current, editorStateRef.current.segments);
        const activeListType = getListTypeForSelection(textareaRef.current, editorStateRef.current.segments);
        setCurrentFormat((prev: StandardTextFormat) => ({...prev, ...currentFormats, listType: activeListType || 'none'}));
      }
    }, 0);
  }, [onRichTextChange]);

  // Handle format toggle for keyboard shortcuts
  const handleFormatToggle = useCallback((formatType: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    handleFormattingChange(formatType);
  }, [handleFormattingChange]);

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
            case 't':
              
              e.preventDefault();
              handleFormatToggle('strikethrough');
              break;
          }
        }
        
        switch (e.key) {
          case 'Enter':
            if (!e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
            break;
          case 'Escape':
            e.preventDefault();
            handleCancel();
            break;
          case 'Tab':
            e.preventDefault();
            handleSave();
            break;
        }
      } catch (error) {
        logError('ERROR in keyboard event handler', error);
        handleCancel();
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown, { passive: false });
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditing, handleSave, handleCancel, handleFormatToggle]);

  // Handle text change - update editorState with unified approach
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newText = e.target.value;

      // Get current cursor position to find which segment's format to carry over (simplified)
      const cursorPos = e.target.selectionStart;
      let formatToCarry: Partial<StandardTextFormat> = {
        fontSize: currentFormat.fontSize,
        fontFamily: currentFormat.fontFamily,
        textColor: currentFormat.textColor,
        bold: currentFormat.bold,
        italic: currentFormat.italic,
        underline: currentFormat.underline,
        strikethrough: currentFormat.strikethrough,
      };

      if (editorStateRef.current.segments.length > 0) {
          let charCount = 0;
          for (const segment of editorStateRef.current.segments) {
              charCount += segment.text.length;
              if (cursorPos <= charCount) {
                  formatToCarry = {
                      fontSize: segment.fontSize,
                      fontFamily: segment.fontFamily,
                      textColor: segment.fill,
                      bold: segment.fontWeight === 'bold',
                      italic: segment.fontStyle === 'italic',
                      underline: segment.textDecoration?.includes('underline'),
                      strikethrough: segment.textDecoration?.includes('line-through'),
                  };
                  break;
              }
          }
      }
      
      const newSegments = plainTextToSegments(newText, formatToCarry);
      
      // FIXED: Update unified state
      setEditorState({
        segments: newSegments,
        plainText: newText
      });
      
      // Call onRichTextChange immediately for user-initiated text changes
      if (onRichTextChange && newSegments.length > 0) {
        onRichTextChange(newSegments);
      }

    } catch (error) {
      logError('ERROR handling text change', error);
    }
  }, [currentFormat, onRichTextChange]);

  // Handle blur - simplified to prevent race conditions
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    try {
      // Check if focus is moving to toolbar using multiple methods
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      const isMovingToToolbar = (relatedTarget && toolbarRef.current?.contains(relatedTarget)) ||
                               relatedTarget?.closest('[data-floating-toolbar]') ||
                               relatedTarget?.closest('[data-toolbar-button]') ||
                               relatedTarget?.closest('[data-dropdown-button]') ||
                               relatedTarget?.closest('[data-dropdown-content]') ||
                               relatedTarget?.closest('[data-dropdown-container]');
      
      if (isMovingToToolbar) {
        
        return;
      }
      
      // Use requestAnimationFrame instead of setTimeout for better timing
      requestAnimationFrame(() => {
        // Final check that focus hasn't moved to toolbar using data attributes
        const activeElement = document.activeElement as HTMLElement;
        const focusOnToolbar = (toolbarRef.current?.contains(activeElement)) ||
                              activeElement?.closest('[data-floating-toolbar]') ||
                              activeElement?.closest('[data-toolbar-button]') ||
                              activeElement?.closest('[data-dropdown-button]') ||
                              activeElement?.closest('[data-dropdown-content]') ||
                              activeElement?.closest('[data-dropdown-container]');
        
        if (focusOnToolbar) {
          
          return;
        }
        
        handleSave();
      });
    } catch (error) {
      logError('ERROR in blur handler', error);
      requestAnimationFrame(() => handleCancel());
    }
  }, [handleSave, handleCancel]);

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
    return null;
  }

  // Validate position before rendering
  if (!validateCellPosition(cellPosition)) {
    return null;
  }

  // Create textarea style
  const createTextareaStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      left: Math.max(0, cellPosition.x),
      top: Math.max(0, cellPosition.y),
      width: Math.max(50, cellPosition.width),
      height: Math.max(20, cellPosition.height),
      border: `2px solid ${designSystem.colors.primary[500]}`,
      borderRadius: '4px',
      padding: '8px',
      fontSize: `${Math.max(10, Math.min(24, currentFormat.fontSize || fontSize))}px`,
      fontFamily: currentFormat.fontFamily || fontFamily || designSystem.typography.fontFamily.sans,
      color: currentFormat.textColor || textColor || designSystem.colors.secondary[800],
      backgroundColor: designSystem.canvasStyles.background,
      resize: 'none' as const,
      outline: 'none',
      overflow: 'hidden' as const,
      textAlign: currentFormat.textAlign || textAlign || 'left',
      zIndex: 2000,
      boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
      lineHeight: '1.4',
      boxSizing: 'border-box' as const,
      wordWrap: 'break-word' as const,
      whiteSpace: 'pre-wrap' as const,
      // Add formatting preview styles
      fontWeight: currentFormat.bold ? 'bold' : 'normal',
      fontStyle: currentFormat.italic ? 'italic' : 'normal',
      textDecoration: (() => {
        const decorations = [];
        if (currentFormat.underline) decorations.push('underline');
        if (currentFormat.strikethrough) decorations.push('line-through');
        return decorations.join(' ') || 'none';
      })(),
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
    return null;
  }

  try {
    const textareaStyle = createTextareaStyle();
    
    const portalContent = (
      <div
        style={{ position: 'absolute', pointerEvents: 'auto', zIndex: 2000 }}
        onClick={handleEditorClick}
        onMouseDown={handleEditorMouseDown}
      >
        <textarea
          ref={textareaRef}
          style={textareaStyle}
          value={editorState.plainText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onSelect={handleTextSelection}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          placeholder="Type here..."
          spellCheck={false}
          autoComplete="off"
          data-testid="rich-text-cell-editor"
          data-table-cell-editor="true"
          aria-label="Edit cell text"
        />
        
      </div>
    );
    
    const floatingToolbar = showToolbar && (
      <FloatingTextToolbar
        element={{
          id: 'table-cell',
          x: cellPosition.x,
          y: cellPosition.y,
          width: cellPosition.width,
          height: cellPosition.height
        }}
        isVisible={true}
        format={{
          bold: currentFormat.bold,
          italic: currentFormat.italic,
          underline: currentFormat.underline,
          strikethrough: currentFormat.strikethrough,
          fontSize: currentFormat.fontSize,
          color: currentFormat.textColor, // FloatingTextToolbar still expects 'color'
          fontFamily: currentFormat.fontFamily,
          listType: currentFormat.listType,
          isHyperlink: currentFormat.isHyperlink,
          hyperlinkUrl: currentFormat.hyperlinkUrl
        }}
        onFormatChange={handleFormattingChange}
        onDone={handleSave}
        onCancel={handleCancel}
        stageRef={{ current: getStageRef() }}
      />
    );

    return (
      <>
        {createPortal(portalContent, portalTarget)}
        {floatingToolbar}
      </>
    );
  } catch (error) {
    logError('ERROR rendering RichTextCellEditor', error);
    setTimeout(() => handleCancel(), 0);
    return null;
  }
};

export default RichTextCellEditor;