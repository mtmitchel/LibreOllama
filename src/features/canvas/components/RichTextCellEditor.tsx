import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../../styles/designSystem';
import { richTextManager } from './RichTextSystem/UnifiedRichTextManager';
import { StandardTextFormat, RichTextSegment } from '../../../types/richText';
import FloatingTextToolbar from './FloatingTextToolbar';
import ContentEditableRichTextEditor from './ContentEditableRichTextEditor';

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

export const RichTextCellEditor: React.FC<RichTextCellEditorProps> = ({
  isEditing,
  cellPosition,
  initialSegments,
  onRichTextChange,
  onFinishEditing,
  onCancelEditing,
  defaultFormat = {
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
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Centralized state for segments
  const [currentSegments, setCurrentSegments] = useState<RichTextSegment[]>(initialSegments);
  
  // Ref to keep track of the latest segments for callbacks
  const segmentsRef = useRef(currentSegments);
  useEffect(() => {
    segmentsRef.current = currentSegments;
  }, [currentSegments]);

  const [hasInitialized, setHasInitialized] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  
  // currentFormat reflects the format at the cursor or selection
  const [currentFormat, setCurrentFormat] = useState<Partial<StandardTextFormat>>(() => {
    if (initialSegments.length > 0) {
      return richTextManager.getFormattingAtPosition(initialSegments, 0);
    }
    return defaultFormat;
  });  // Validate props on mount and when they change - with improved debouncing
  const [isValidated, setIsValidated] = useState(false);
  
  useEffect(() => {
    const validateProps = () => {
      if (isEditing && !validateCellPosition(cellPosition)) {
        logError('RichTextCellEditor received invalid cellPosition, editor will not render');
        onCancelEditing();
        return false;
      }
      return true;
    };

    // FIXED: Remove unnecessary debouncing that was causing state issues
    const valid = validateProps();
    setIsValidated(valid);
  }, [isEditing, cellPosition, onCancelEditing]);
  // Initialize local state when editing starts - improved stability
  useEffect(() => {
    if (isEditing && !hasInitialized && isValidated) {
      const startingSegments = initialSegments && initialSegments.length > 0 
        ? initialSegments 
        : richTextManager.plainTextToSegments('', defaultFormat);

      setCurrentSegments(startingSegments);
      
      const formatAtStart = startingSegments.length > 0 
        ? richTextManager.getFormattingAtPosition(startingSegments, 0)
        : defaultFormat;
      setCurrentFormat(formatAtStart);

      // FIXED: Remove setTimeout to prevent race conditions
      if (editorRef.current) {
        try {
          editorRef.current.focus();
          setHasInitialized(true);
          setShowToolbar(true);
        } catch (error) {
          logError('ERROR during focus operation', error);
          onCancelEditing();
        }
      } else {
        // Retry focus on next frame if ref not ready
        requestAnimationFrame(() => {
          if (editorRef.current) {
            try {
              editorRef.current.focus();
              setHasInitialized(true);
              setShowToolbar(true);
            } catch (error) {
              logError('ERROR during delayed focus operation', error);
              onCancelEditing();
            }
          } else {
            logError('ERROR: Editor ref not available after retry, canceling edit');
            onCancelEditing();
          }
        });
      }
    } else if (!isEditing) {
      setHasInitialized(false);
      setShowToolbar(false);
    }
  }, [isEditing, hasInitialized, isValidated, onCancelEditing, initialSegments, defaultFormat]);

  // Effect to update internal state if initialSegments prop changes while not actively editing
  useEffect(() => {
    if (!isEditing) {
      setCurrentSegments(initialSegments);
      const newFormat = initialSegments.length > 0 
        ? richTextManager.getFormattingAtPosition(initialSegments, 0) 
        : defaultFormat;
      setCurrentFormat(newFormat);
    }
  }, [isEditing, initialSegments, defaultFormat]);

  // Handle segments change from the editor
  const handleSegmentsChange = useCallback((newSegments: RichTextSegment[]) => {
    setCurrentSegments(newSegments);
    // Immediately sync to parent for real-time updates
    onRichTextChange(newSegments);
  }, [onRichTextChange]);

  // Handle selection change to update toolbar format
  const handleSelectionChange = useCallback((format: Partial<StandardTextFormat>) => {
    setCurrentFormat(format);
    setShowToolbar(true);
  }, []);
  const handleSave = useCallback(() => {
    // Clear any pending timeout
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
    
    try {
      onFinishEditing(segmentsRef.current);
    } catch (error) {
      logError('ERROR during save operation', error);
      onFinishEditing(segmentsRef.current);
    }
  }, [onFinishEditing]);

  const handleCancel = useCallback(() => {
    // Clear any pending timeout
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
    
    try {
      onCancelEditing();
    } catch (error) {
      logError('ERROR during cancel operation', error);
      onCancelEditing();
    }
  }, [onCancelEditing]);

  // Debounced finish editing for empty text
  const handleDebouncedFinish = useCallback(() => {
    // Check if text is empty
    const plainText = richTextManager.segmentsToPlainText(segmentsRef.current);
    if (!plainText.trim()) {
      // Debounce the finish to prevent accidental deletion
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
      }
      finishTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 1000); // 1 second delay for empty text
    } else {
      handleSave();
    }
  }, [handleSave]);
  // Handle clicks outside to finish editing with debouncing
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      try {
        const target = e.target as Node;
        const targetElement = target as HTMLElement;
        
        if (editorRef.current && !editorRef.current.contains(target)) {
          const isToolbarClick = targetElement?.closest(
            '[data-floating-toolbar], [data-toolbar-button], [data-dropdown-content], [data-dropdown-container]'
          );
          if (!isToolbarClick) {
            handleDebouncedFinish();
          }
        }
      } catch (error) {
        logError('ERROR in click outside handler', error);
        handleSave();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
      // Cleanup timeout on unmount
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
      }
    };
  }, [isEditing, handleDebouncedFinish]);

  // Handle formatting commands from toolbar
  const handleFormattingChange = useCallback((command: string, value?: any) => {
    console.log(`[RICH TEXT] Received command: ${command}, value:`, value);
    
    if (!editorRef.current) return;

    // Get the applyFormatting method from the editor
    const editor = editorRef.current as any;
    if (editor.applyFormatting) {
      // Convert command to format object
      const formatCommand: Partial<StandardTextFormat> = {};
      
      // Toggle logic for boolean formats if value is not explicitly provided
      const toggleIfNeeded = (formatKey: keyof StandardTextFormat) => {
        if (value === undefined) {
          return !(currentFormat[formatKey] ?? false);
        }
        return value;
      };

      switch (command) {
        case 'bold': 
          formatCommand.bold = toggleIfNeeded('bold'); 
          break;
        case 'italic': 
          formatCommand.italic = toggleIfNeeded('italic'); 
          break;
        case 'underline': 
          formatCommand.underline = toggleIfNeeded('underline'); 
          break;
        case 'strikethrough': 
          formatCommand.strikethrough = toggleIfNeeded('strikethrough'); 
          break;
        case 'color': 
        case 'textColor': 
          formatCommand.textColor = value; 
          break;
        case 'align': 
        case 'textAlign': 
          formatCommand.textAlign = value; 
          break;
        case 'fontSize':
        case 'fontFamily':
        case 'listType':
        case 'isHyperlink':
        case 'hyperlinkUrl':
        case 'textStyle':
          (formatCommand as any)[command] = value;
          break;
        default:
          console.warn(`[RICH TEXT] Unknown formatting command: ${command}`);
          return;
      }

      // Apply the formatting
      editor.applyFormatting(formatCommand);
    }
  }, [currentFormat]);
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Stop propagation to prevent global keyboard shortcuts from interfering
    e.stopPropagation();
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  if (!isEditing) return null;
  // Editor positioning based on cell position - relative for Html wrapper compatibility
  const editorStyle: React.CSSProperties = {
    position: 'relative', // Changed from 'absolute' to 'relative' for Html wrapper
    top: 0,
    left: 0,
    width: cellPosition.width,
    height: cellPosition.height,
    zIndex: 1000,
    backgroundColor: designSystem.colors.primary[50],
    border: `2px solid ${designSystem.colors.primary[400]}`,
    borderRadius: designSystem.borderRadius.md,
    overflow: 'hidden',
    boxShadow: designSystem.shadows.lg,
  };

  // Toolbar positioning logic
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  
  useEffect(() => {
    if (showToolbar && editorRef.current && cellPosition) {
      // FIXED: Use relative positioning within the editor container
      // Since the toolbar is rendered inside the editor div, we can use simple relative positioning
      const toolbarHeightEstimate = 50;
      
      // Position above the editor by default
      let top = -toolbarHeightEstimate - 10;
      let left = 0;
      
      // If there's not enough space above, position below
      if (cellPosition.y < toolbarHeightEstimate + 20) {
        top = cellPosition.height + 10;
      }
      
      setToolbarPosition({ top, left });
    } else {
      setToolbarPosition(null);
    }
  }, [showToolbar, cellPosition]);
  
  return (
    // FIXED: Enhanced portal isolation with safer rendering approach
    isEditing && isValidated ? createPortal(
      <div 
        style={editorStyle} 
        data-rich-text-editor 
        data-portal-isolated="true"
        role="dialog" 
        aria-modal="true"
      >
        {showToolbar && toolbarPosition && (
          <FloatingTextToolbar
            targetRef={editorRef}
            style={{ 
              position: 'absolute', 
              top: `${toolbarPosition.top}px`, 
              left: `${toolbarPosition.left}px` 
            }}
            onCommand={handleFormattingChange}
            currentFormat={currentFormat}
          />
        )}
        <ContentEditableRichTextEditor
          ref={editorRef}
          initialSegments={currentSegments}
          onSegmentsChange={handleSegmentsChange}
          onSelectionChange={handleSelectionChange}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '100px',
          }}
          placeholder="Enter text..."
          onKeyDown={handleKeyDown}
        />
      </div>,
      // FIXED: Ensure we always render to document.body to avoid any Konva tree interference
      document.body 
    ) : null
  );
};

export default RichTextCellEditor;
