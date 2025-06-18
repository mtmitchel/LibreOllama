import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../styles/designSystem';
import { richTextManager } from './RichTextSystem/UnifiedRichTextManager';
import { StandardTextFormat, RichTextSegment } from '../../types/richText';
import FloatingTextToolbar from './FloatingTextToolbar';
import ContentEditableRichTextEditor from './ContentEditableRichTextEditor';

interface CellPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UnifiedTableCellEditorProps {
  isEditing: boolean;
  cellPosition: CellPosition;
  initialSegments: RichTextSegment[];
  onSegmentsChange: (segments: RichTextSegment[]) => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
  defaultFormat?: Partial<StandardTextFormat>;
}

/**
 * Unified table cell editor that directly uses ContentEditableRichTextEditor
 * This component simplifies the editing flow by removing unnecessary portal complexity
 * and ensuring proper integration with the table component
 */
export const UnifiedTableCellEditor: React.FC<UnifiedTableCellEditorProps> = ({
  isEditing,
  cellPosition,
  initialSegments,
  onSegmentsChange,
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
  const [currentFormat, setCurrentFormat] = useState<Partial<StandardTextFormat>>(defaultFormat);
  const [showToolbar, setShowToolbar] = useState(false);
  
  // Focus and initialize when editing starts
  useEffect(() => {
    if (isEditing && editorRef.current) {
      const focusTimeout = setTimeout(() => {
        editorRef.current?.focus();
        setShowToolbar(true);
      }, 10);
      return () => clearTimeout(focusTimeout);
    } else if (!isEditing) {
      setShowToolbar(false);
    }
  }, [isEditing]);

  // Handle segments change from ContentEditableRichTextEditor
  const handleSegmentsChange = useCallback((newSegments: RichTextSegment[]) => {
    onSegmentsChange(newSegments);
  }, [onSegmentsChange]);

  // Handle selection change to update toolbar format
  const handleSelectionChange = useCallback((format: Partial<StandardTextFormat>) => {
    setCurrentFormat(format);
  }, []);

  // Handle keyboard events for table navigation and editing
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        // Prevent new lines in table cells unless Shift is held
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
        // Tab should finish editing and potentially move to next cell
        // The table component should handle cell navigation
        e.preventDefault();
        onFinishEditing();
        break;
    }
  }, [onFinishEditing, onCancelEditing]);

  // Handle clicks outside to finish editing
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (editorRef.current && !editorRef.current.contains(target)) {
        // Check if click is on toolbar or dropdown
        const isToolbarClick = target.closest(
          '[data-floating-toolbar], [data-toolbar-button], [data-dropdown-content], [data-dropdown-container]'
        );
        if (!isToolbarClick) {
          onFinishEditing();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, onFinishEditing]);
  // Handle formatting changes from toolbar
  const handleFormattingChange = useCallback((command: string, value?: any) => {
    if (editorRef.current) {
      // Convert command to format object
      const format: Partial<StandardTextFormat> = {};
      
      switch (command) {
        case 'bold':
          format.bold = value !== false;
          break;
        case 'italic':
          format.italic = value !== false;
          break;
        case 'underline':
          format.underline = value !== false;
          break;
        case 'strikethrough':
          format.strikethrough = value !== false;
          break;
        case 'fontSize':
          format.fontSize = value;
          break;
        case 'fontFamily':
          format.fontFamily = value;
          break;
        case 'textColor':
          format.textColor = value;
          break;
        case 'textAlign':
          format.textAlign = value;
          break;
        default:
          console.warn('Unknown formatting command:', command);
          return;
      }
      
      // Get current selection
      const selection = window.getSelection();
      let textSelection = { start: 0, end: 0 };
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Calculate text positions (simplified)
        textSelection = {
          start: range.startOffset,
          end: range.endOffset
        };
      }
      
      const currentSegments = richTextManager.htmlToSegments(editorRef.current.innerHTML);
      const updatedSegments = richTextManager.applyFormattingToSegments(
        currentSegments,
        format,
        textSelection
      );
      
      // Update editor content and notify parent
      const newHtml = richTextManager.segmentsToHtml(updatedSegments);
      editorRef.current.innerHTML = newHtml;
      onSegmentsChange(updatedSegments);
      
      // Update current format for toolbar
      setCurrentFormat(prev => ({ ...prev, ...format }));
    }
  }, [onSegmentsChange]);
  if (!isEditing) {
    return null;
  }

  // Safety check: ensure document.body is available for portal
  if (typeof document === 'undefined' || !document.body) {
    console.warn('UnifiedTableCellEditor: document.body not available for portal');
    return null;
  }

  // Position the editor as an overlay
  const editorStyle: React.CSSProperties = {
    position: 'absolute',
    top: cellPosition.y,
    left: cellPosition.x,
    width: cellPosition.width,
    height: cellPosition.height,
    zIndex: 1000,
    backgroundColor: designSystem.canvasStyles.background,
    border: `2px solid ${designSystem.colors.primary[500]}`,
    borderRadius: designSystem.borderRadius.md,
    overflow: 'hidden',
    boxShadow: designSystem.shadows.lg,
  };

  // Calculate toolbar position
  const toolbarPosition = showToolbar ? {
    top: cellPosition.y - 60, // Position above the cell
    left: cellPosition.x,
  } : null;
  return createPortal(
    <>
      {showToolbar && toolbarPosition && (
        <FloatingTextToolbar
          targetRef={editorRef}
          style={{ 
            position: 'absolute', 
            top: `${toolbarPosition.top}px`, 
            left: `${toolbarPosition.left}px`,
            zIndex: 1001,
          }}
          onCommand={handleFormattingChange}
          currentFormat={currentFormat}
        />
      )}
      <div style={editorStyle} data-unified-table-cell-editor role="dialog" aria-modal="true">
        <ContentEditableRichTextEditor
          ref={editorRef}
          initialSegments={initialSegments}
          onSegmentsChange={handleSegmentsChange}
          onSelectionChange={handleSelectionChange}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '100%',
            padding: '8px',
            fontSize: defaultFormat.fontSize,
            fontFamily: defaultFormat.fontFamily,
            color: defaultFormat.textColor,
            textAlign: defaultFormat.textAlign,
          }}
          placeholder="Enter text..."
          onKeyDown={handleKeyDown}
        />
      </div>
    </>,
    document.body,
    'unified-table-cell-editor' // Add a key to prevent portal conflicts
  );
};

export default UnifiedTableCellEditor;
