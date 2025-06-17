import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../styles/designSystem';
import { richTextManager } from './RichTextSystem/UnifiedRichTextManager';
import { StandardTextFormat, RichTextSegment, TextSelection } from '../../types/richText';
import FloatingTextToolbar from './FloatingTextToolbar';

// Error logging utility for production safety
const logError = (message: string, error?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[RICH TEXT EDITOR] ${message}`, error || '');
  }
};

// Define CellPosition interface
interface CellPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Define RichTextCellEditorProps interface
interface RichTextCellEditorProps {
  isEditing: boolean;
  cellPosition: CellPosition;
  initialSegments: RichTextSegment[]; 
  onRichTextChange: (segments: RichTextSegment[]) => void; 
  onFinishEditing: (finalSegments: RichTextSegment[]) => void; 
  onCancelEditing: () => void;
  defaultFormat?: Partial<StandardTextFormat>;
}


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

// Helper function to convert plain text to rich text segments using the unified system
// This can be removed if UnifiedRichTextManager.plainTextToSegments is used directly or if not needed here.
// const plainTextToSegments = (text: string, format: Partial<StandardTextFormat>): RichTextSegment[] => {
//   if (!text) return [];
//   return richTextManager.plainTextToSegments(text, format);
// };


export const RichTextCellEditor: React.FC<RichTextCellEditorProps> = ({
  isEditing,
  cellPosition,
  initialSegments,
  onRichTextChange,
  onFinishEditing,
  onCancelEditing,
  defaultFormat = { // Provide sensible defaults for base formatting
    fontSize: 14,
    fontFamily: designSystem.typography.fontFamily.sans,
    textColor: designSystem.colors.secondary[800],
    textAlign: 'left',
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    listType: 'none',
    isHyperlink: false,
    hyperlinkUrl: '',
    textStyle: 'default',
  },
  // getStageRef, // Uncomment if used
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // toolbarRef can be removed if FloatingTextToolbar manages its own ref and click-outside is handled differently
  // const toolbarRef = useRef<HTMLDivElement>(null); 

  // Centralized state for segments and their plain text representation
  const [currentSegments, setCurrentSegments] = useState<RichTextSegment[]>(initialSegments);
  const [plainText, setPlainText] = useState<string>(() => richTextManager.segmentsToPlainText(initialSegments));

  // Ref to keep track of the latest segments for callbacks that might not have the latest state
  const segmentsRef = useRef(currentSegments);
  useEffect(() => {
    segmentsRef.current = currentSegments;
  }, [currentSegments]);

  const [hasInitialized, setHasInitialized] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  
  // currentFormat reflects the format at the cursor or selection
  const [currentFormat, setCurrentFormat] = useState<Partial<StandardTextFormat>>(() => {
    // Initialize currentFormat based on the first segment or defaults
    if (initialSegments.length > 0) {
      return richTextManager.getFormattingAtPosition(initialSegments, 0);
    }
    return defaultFormat;
  });


  // Validate props on mount and when they change
  useEffect(() => {
    if (isEditing && !validateCellPosition(cellPosition)) {
      logError('RichTextCellEditor received invalid cellPosition, editor will not render');
      onCancelEditing();
      return;
    }
  }, [isEditing, cellPosition, onCancelEditing]);

  // Initialize local state when editing starts
  useEffect(() => {
    if (isEditing && !hasInitialized) {
      // Initialize from `initialSegments` prop
      const startingSegments = initialSegments && initialSegments.length > 0 
        ? initialSegments 
        : richTextManager.plainTextToSegments('', defaultFormat); // Start with empty if no initial segments

      setCurrentSegments(startingSegments);
      setPlainText(richTextManager.segmentsToPlainText(startingSegments));
      
      // Update currentFormat based on the initial segments or defaultFormat
      const formatAtStart = startingSegments.length > 0 
        ? richTextManager.getFormattingAtPosition(startingSegments, 0)
        : defaultFormat;
      setCurrentFormat(formatAtStart);

      const focusTimeout = setTimeout(() => {
        if (textareaRef.current) {
          try {
            textareaRef.current.focus();
            // Select all text by default, or restore previous selection if available
            textareaRef.current.select(); 
            setHasInitialized(true);
            setShowToolbar(true); 
            // Update toolbar based on initial selection (whole text)
            // This will be further updated by handleTextSelection/handleSelectionChange
            const initialFormat = richTextManager.getFormattingAtPosition(startingSegments, 0); // Or based on selection
            setCurrentFormat(initialFormat);

          } catch (error) {
            logError('ERROR during focus operation', error);
            onCancelEditing();
          }
        } else {
          logError('ERROR: Textarea ref not available, canceling edit');
          onCancelEditing();
        }
      }, 10); // Small delay to ensure DOM is ready

      return () => clearTimeout(focusTimeout);
    } else if (!isEditing) {
      setHasInitialized(false);
      setShowToolbar(false);
    }
  }, [isEditing, hasInitialized, onCancelEditing, initialSegments, defaultFormat]);

  // Effect to update internal state if initialSegments prop changes while not actively editing
  useEffect(() => {
    if (!isEditing) {
      setCurrentSegments(initialSegments);
      setPlainText(richTextManager.segmentsToPlainText(initialSegments));
      const newFormat = initialSegments.length > 0 
        ? richTextManager.getFormattingAtPosition(initialSegments, 0) 
        : defaultFormat;
      setCurrentFormat(newFormat);
    }
  }, [isEditing, initialSegments, defaultFormat]);


  // Handle text selection changes to update currentFormat for the toolbar
  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current || !isEditing || !hasInitialized) return;

    const ta = textareaRef.current;
    const start = ta.selectionStart;

    setShowToolbar(true); // Keep toolbar visible during selection

    if (segmentsRef.current.length === 0) {
      setCurrentFormat(defaultFormat); // Use default if no text/segments
      return;
    }
    
    // If there's a selection, getFormattingAtPosition might need to consider the range.
    // For simplicity, using the start of the selection.
    // UnifiedRichTextManager could be enhanced to provide mixed formatting status for a range.
    const formatAtCursor = richTextManager.getFormattingAtPosition(segmentsRef.current, start);
    setCurrentFormat(prev => ({...prev, ...formatAtCursor})); 

  }, [isEditing, hasInitialized, defaultFormat]);


  const handleSave = useCallback(() => {
    try {
      onFinishEditing(segmentsRef.current); // Pass the latest segments
    } catch (error) {
      logError('ERROR during save operation', error);
      onFinishEditing(segmentsRef.current); // Ensure editing finishes even on error
    }
  }, [onFinishEditing]);

  const handleCancel = useCallback(() => {
    try {
      // No need to reset state here as the component will unmount or props will reset it
      onCancelEditing();
    } catch (error) {
      logError('ERROR during cancel operation', error);
      onCancelEditing(); // Ensure cancel is called
    }
  }, [onCancelEditing]);

  // Handle clicks outside to finish editing
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      try {
        const target = e.target as Node;
        const targetElement = target as HTMLElement;
        
        // Check if the click is outside the editor and any associated toolbar/dropdown
        if (textareaRef.current && !textareaRef.current.contains(target)) {
          const isToolbarClick = targetElement?.closest(
            '[data-floating-toolbar], [data-toolbar-button], [data-dropdown-content], [data-dropdown-container]'
          );
          if (!isToolbarClick) {
            handleSave();
          }
        }
      } catch (error) {
        logError('ERROR in click outside handler', error);
        handleSave();
      }
    };

    // CRITICAL FIX: Attach the event listener on the next event loop cycle.
    // This prevents it from capturing the same click that opened the editor.
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isEditing, handleSave]);

  // Handle format change from FloatingTextToolbar
  const handleFormattingChange = useCallback((command: string, value?: any) => {
    if (!textareaRef.current) return;

    const selection: TextSelection = {
      start: textareaRef.current.selectionStart,
      end: textareaRef.current.selectionEnd,
    };

    let cmdString: string = command;
    let cmdValue: any = value;

    // Toggle logic for boolean formats if value is not explicitly provided
    const toggleIfNeeded = (formatKey: keyof StandardTextFormat) => {
      if (value === undefined) {
        return !(currentFormat[formatKey] ?? false); // Toggle based on currentFormat
      }
      return value;
    };

    switch (command) {
      case 'bold': cmdValue = toggleIfNeeded('bold'); break;
      case 'italic': cmdValue = toggleIfNeeded('italic'); break;
      case 'underline': cmdValue = toggleIfNeeded('underline'); break;
      case 'strikethrough': cmdValue = toggleIfNeeded('strikethrough'); break;
      case 'color': cmdString = 'textColor'; cmdValue = value; break; // `value` should be color string
      case 'align': cmdString = 'textAlign'; cmdValue = value; break; // `value` should be 'left', 'center', 'right'
      // Direct assignment for other commands
      case 'fontSize':
      case 'fontFamily':
      case 'textColor': // Handles direct textColor set
      case 'textAlign': // Handles direct textAlign set
      case 'listType':
      case 'isHyperlink':
      case 'hyperlinkUrl':
      case 'textStyle':
        cmdValue = value;
        break;
      default:
        // Check if it's a valid StandardTextFormat key before warning
        if (!(command in ({} as StandardTextFormat))) {
           logError(`Unknown or unhandled command: ${command}`);
        } else {
          // If it's a known key but not handled above, it might be a direct assignment
          cmdString = command; // Ensure cmdString is set
          cmdValue = value;
        }
        // If still not a valid key after mapping, return
        if (!(cmdString in ({} as StandardTextFormat))) {
          return;
        }
        break;
    }
    
    if (!(cmdString in ({} as StandardTextFormat))) {
        logError(`Mapped command '${cmdString}' is not a valid StandardTextFormat key.`);
        return;
    }

    // Use segmentsRef.current for the most up-to-date segments
    const newSegments = richTextManager.applyFormattingToSegments(
      segmentsRef.current, // Current segments
      { [cmdString]: cmdValue }, // Format object
      selection // Selection range
    );

    if (newSegments) {
      setCurrentSegments(newSegments); // Update state
      const newPlainText = richTextManager.segmentsToPlainText(newSegments);
      setPlainText(newPlainText);

      onRichTextChange(newSegments); // Notify parent of change
      
      // Update currentFormat based on the new state at the cursor
      // Need to wait for textarea to re-render if selection changes due to formatting
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const formatAtCursor = richTextManager.getFormattingAtPosition(newSegments, textareaRef.current.selectionStart);
          setCurrentFormat(prev => ({ ...prev, ...formatAtCursor }));
          textareaRef.current.focus(); // Re-focus
        }
      });
    } else {
      logError(`Formatting command '${cmdString}' failed`);
    }
  }, [currentFormat, onRichTextChange]); // Added currentFormat to dependencies


  // Function to toggle basic formats, used by keyboard shortcuts
  const handleFormatToggle = useCallback((command: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    // Value is undefined, handleFormattingChange will toggle
    handleFormattingChange(command);
  }, [handleFormattingChange]);

  // Handle text input in the textarea
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newRawText = e.target.value;
    if (!textareaRef.current) return;

    const selectionStart = textareaRef.current.selectionStart;
    const selectionEnd = textareaRef.current.selectionEnd;

    // Determine the base format for the new/changed text.
    // This should ideally come from the character *before* the change,
    // or the surrounding selection's format if replacing text.
    // For simplicity, using currentFormat at the start of the selection.
    // UnifiedRichTextManager could offer more sophisticated logic here.
    const formatForChange = richTextManager.getFormattingAtPosition(
      segmentsRef.current, // Use ref
      selectionStart > 0 ? selectionStart -1 : 0 // Format of char before cursor or start
    );
    
    // A more robust approach would involve diffing old and new plain text
    // and applying changes segment by segment, or using a more advanced
    // text-to-segments conversion in UnifiedRichTextManager that can handle partial updates.
    // For now, re-convert the whole text with the format at the cursor.
    // This is a simplification and might lose some formatting fidelity on complex edits.
    const newSegments = richTextManager.plainTextToSegments(newRawText, formatForChange);

    setCurrentSegments(newSegments);
    setPlainText(newRawText);
    onRichTextChange(newSegments);

    // Restore cursor position after state update and re-render
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        // If text was added/removed, selectionStart might be the new cursor pos
        // If replacing, selectionEnd might be the same as selectionStart
        textareaRef.current.selectionStart = selectionStart;
        textareaRef.current.selectionEnd = selectionEnd; 
      }
    });

  }, [onRichTextChange]); // Removed currentFormat, using segmentsRef and getFormattingAtPosition
  
  // Update currentFormat when selection changes in textarea (e.g., arrow keys, mouse click)
  const handleSelectionChange = useCallback(() => {
    if (textareaRef.current && isEditing && hasInitialized) {
      const formatAtCursor = richTextManager.getFormattingAtPosition(segmentsRef.current, textareaRef.current.selectionStart);
      setCurrentFormat(prev => ({ ...prev, ...formatAtCursor }));
    }
  }, [isEditing, hasInitialized]);


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
            // Add Ctrl+Shift+S for strikethrough as an example, Ctrl+S is usually save
            case 's':
              if (e.shiftKey) { 
                e.preventDefault();
                handleFormatToggle('strikethrough');
              }
              // If not Shift+S, and it's Ctrl+S, it might be a save shortcut (handled elsewhere or by browser)
              break;
            case 'enter': 
              if (!e.shiftKey) { 
                e.preventDefault();
                handleSave();
              }
              // Shift+Enter allows default behavior (new line in textarea)
              break;
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleCancel();
        } else if (e.key === 'Enter' && !e.shiftKey) {
           // This case might be redundant if already handled by Ctrl/Meta+Enter
           // but can be a standalone save on Enter without modifiers.
           // The above Ctrl/Meta+Enter is more specific.
           // If plain Enter should save, uncomment and adjust.
          // e.preventDefault();
          // handleSave();
        }
      } catch (error) {
        logError('ERROR in keydown handler', error);
      }
    };

    if (isEditing) {
      const taRef = textareaRef.current;
      taRef?.addEventListener('keydown', handleKeyDown);
      // Listen for selectionchange on the document to catch all selection updates
      document.addEventListener('selectionchange', handleSelectionChange); 
      return () => {
        taRef?.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, [isEditing, handleSave, handleCancel, handleFormatToggle, handleSelectionChange]);

  if (!isEditing || !validateCellPosition(cellPosition)) {
    return null;
  }

  const { x, y, width, height } = cellPosition;

  // Dynamic style for the textarea container
  const editorStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    zIndex: 1000, 
    backgroundColor: designSystem.colors.secondary[100] || designSystem.colors.secondary[50],
    border: `1px solid ${designSystem.colors.primary[500]}`,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderRadius: designSystem.borderRadius.md,
    overflow: 'visible', // Allow toolbar to overflow if positioned outside
    display: 'flex', 
    flexDirection: 'column',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%', 
    padding: designSystem.spacing.sm, 
    border: 'none',
    outline: 'none',
    resize: 'none',
    lineHeight: 1.5, // Use fixed value as designSystem.typography.lineHeights is not available
    backgroundColor: 'transparent', 
    color: designSystem.colors.secondary[900], // Dark text for better visibility
    fontSize: '14px',
    fontFamily: designSystem.typography.fontFamily.sans,
    boxSizing: 'border-box',
    whiteSpace: 'pre-wrap', // Important for newlines and spaces
    overflowWrap: 'break-word', // Ensure long words wrap
  };
  
  // Toolbar positioning logic
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (showToolbar && textareaRef.current && cellPosition) {
      const textareaRect = textareaRef.current.getBoundingClientRect();
      // Toolbar positioning relative to the viewport, as it's portal'd to document.body
      
      const toolbarHeightEstimate = 50; // Increased height estimate for better spacing
      let top = textareaRect.top - toolbarHeightEstimate - 10; // More space above textarea
      let left = textareaRect.left;

      // Adjust if toolbar would go off-screen (viewport relative)
      if (top < 10) { // If too close to top of viewport
        top = textareaRect.bottom + 10; // Position below with more space
      }
      if (left < 10) left = 10;
      
      // Consider toolbar width if it can be determined or estimated
      // const toolbarWidthEstimate = 200; 
      // if (left + toolbarWidthEstimate > window.innerWidth - 5) {
      //   left = window.innerWidth - toolbarWidthEstimate - 5;
      // }

      setToolbarPosition({ top, left });
    } else {
      setToolbarPosition(null);
    }
  }, [showToolbar, cellPosition]); // Removed getStageRef as toolbar is body-relative

  // Add debug logging for toolbar visibility
  console.log('[Toolbar Debug]', {
    isEditing,
    showToolbar,
    toolbarPosition,
    textareaRefExists: !!textareaRef.current,
    cellPosition,
    currentFormat
  });

  return createPortal(
    <div style={editorStyle} data-rich-text-editor role="dialog" aria-modal="true">
      {showToolbar && toolbarPosition && textareaRef.current && (
        <FloatingTextToolbar
          targetRef={textareaRef} // Pass targetRef for positioning
          style={{ position: 'absolute', top: `${toolbarPosition.top}px`, left: `${toolbarPosition.left}px` }} // Add style prop back for correct positioning
          onCommand={handleFormattingChange}
          currentFormat={currentFormat}
        />
      )}
      <textarea
        ref={textareaRef}
        style={textareaStyle}
        value={plainText} // Bind to plainText state
        onChange={handleTextChange}
        onSelect={handleTextSelection} // Update format on selection
        onKeyDown={(e) => { // Inline keydown for Enter/Escape if global handler is removed or simplified
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        }}
        // onBlur is tricky with toolbars. Click-outside is generally better.
        // onBlur={(e) => {
        //   // Avoid blur when clicking on the toolbar
        //   const toolbarElement = document.querySelector('[data-floating-toolbar]');
        //   if (toolbarElement && e.relatedTarget && toolbarElement.contains(e.relatedTarget as Node)) {
        //     return; 
        //   }
        //   handleSave(); 
        // }}
        placeholder="Enter text..."
        spellCheck={false} // Explicitly false
        aria-label="Rich text editor"
      />
    </div>,
    document.body 
  );
};

export default RichTextCellEditor;