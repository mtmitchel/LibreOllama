import React, { useRef, useEffect, useState, useCallback } from 'react';
import { richTextManager } from './RichTextSystem/UnifiedRichTextManager';
import { StandardTextFormat, RichTextSegment, TextSelection } from '../../types/richText';
import { designSystem } from '../../styles/designSystem';

interface ContentEditableRichTextEditorProps {
  initialSegments: RichTextSegment[];
  onSegmentsChange: (segments: RichTextSegment[]) => void;
  onSelectionChange?: (format: Partial<StandardTextFormat>) => void;
  style?: React.CSSProperties;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const ContentEditableRichTextEditor = React.forwardRef<HTMLDivElement, ContentEditableRichTextEditorProps>(({
  initialSegments,
  onSegmentsChange,
  onSelectionChange,
  style,
  placeholder = "Type your text...",
  onKeyDown
}, ref) => {  const editorRef = useRef<HTMLDivElement>(null);
  const [currentSegments, setCurrentSegments] = useState<RichTextSegment[]>(initialSegments);
  const segmentsRef = useRef(currentSegments);
  // Detect if the initial text is placeholder text that should be cleared
  const isPlaceholderText = useCallback((text: string) => {
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
  }, []);

  // State to track if we've cleared placeholder text
  const [hasPlaceholderBeenCleared, setHasPlaceholderBeenCleared] = useState(false);

  // Combine internal ref with forwarded ref
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  // Keep ref in sync with state
  useEffect(() => {
    segmentsRef.current = currentSegments;
  }, [currentSegments]);  // Track if we're currently typing to prevent DOM updates
  const isTypingRef = useRef(false);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const lastCursorPositionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  
  // Helper to get plain text position from DOM position
  const getPlainTextPosition = useCallback((node: Node, offset: number): number => {
    if (!editorRef.current || !editorRef.current.isConnected || !(editorRef.current instanceof HTMLElement)) {
      console.warn('ContentEditableRichTextEditor: Invalid editor ref for getPlainTextPosition');
      return 0;
    }

    try {
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );

      let position = 0;
      let currentNode;

      while (currentNode = walker.nextNode()) {
        if (currentNode === node) {
          return position + offset;
        }
        position += currentNode.textContent?.length || 0;
      }

      return position;
    } catch (error) {
      console.error('ContentEditableRichTextEditor: Error in getPlainTextPosition:', error);
      return 0;
    }
  }, []);
  
  // Helper to restore selection after content update
  const restoreSelection = useCallback((start: number, end: number) => {
    if (!editorRef.current || !editorRef.current.isConnected || !(editorRef.current instanceof HTMLElement)) {
      console.warn('ContentEditableRichTextEditor: Invalid editor ref for restoreSelection');
      return;
    }

    try {
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );

      let position = 0;
      let currentNode;
      let startNode: Node | null = null;
      let endNode: Node | null = null;
      let startOffset = 0;
      let endOffset = 0;      while (currentNode = walker.nextNode()) {
        const nodeLength = currentNode.textContent?.length || 0;
        
        if (!startNode && position + nodeLength >= start) {
          startNode = currentNode;
          startOffset = start - position;
        }
        
        if (!endNode && position + nodeLength >= end) {
          endNode = currentNode;
          endOffset = end - position;
          break;
        }
        
        position += nodeLength;
      }

      if (startNode && endNode) {
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } catch (error) {
      console.error('ContentEditableRichTextEditor: Error in restoreSelection:', error);
    }
  }, []);
  
  // Store current cursor position
  const storeCursorPosition = useCallback(() => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const start = getPlainTextPosition(range.startContainer, range.startOffset);
      const end = getPlainTextPosition(range.endContainer, range.endOffset);
      lastCursorPositionRef.current = { start, end };
    }
  }, [getPlainTextPosition]);

  // Restore cursor position
  const restoreCursorPosition = useCallback(() => {
    if (!editorRef.current) return;
    
    const { start, end } = lastCursorPositionRef.current;
    restoreSelection(start, end);
  }, [restoreSelection]);

  // Update editor content when segments change externally (but not when typing)
  useEffect(() => {
    if (editorRef.current && editorRef.current.isConnected && !isTypingRef.current) {
      const html = richTextManager.segmentsToHtml(currentSegments);
      if (editorRef.current.innerHTML !== html) {
        // Store cursor position before update
        storeCursorPosition();
        editorRef.current.innerHTML = html;
        // Restore cursor position after update
        requestAnimationFrame(() => {
          if (editorRef.current && editorRef.current.isConnected) {
            restoreCursorPosition();
          }
        });
      }
    }
  }, [currentSegments, storeCursorPosition, restoreCursorPosition]);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && initialSegments.length > 0) {
      const html = richTextManager.segmentsToHtml(initialSegments);
      editorRef.current.innerHTML = html;
    }
  }, [initialSegments]);  // Handle content changes - use onBlur instead of onInput to prevent text reversal
  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;

    // Store cursor position before processing
    storeCursorPosition();

    // Get the current content
    const textContent = editorRef.current.textContent || '';
    const htmlContent = editorRef.current.innerHTML;

    // Prevent removal during editing mode
    if (isTypingRef.current && !textContent.trim()) {
      return; // Don't update empty content while typing
    }
    
    // For simple text (no HTML tags), create a basic segment
    if (textContent && htmlContent === textContent) {
      const simpleSegment: RichTextSegment[] = [{
        text: textContent,
        fontSize: 14,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fill: '#374151'
      }];
      
      setCurrentSegments(simpleSegment);
      onSegmentsChange(simpleSegment);
    } else {
      // Parse HTML content if formatting is present
      const newSegments = richTextManager.htmlToSegments(htmlContent);
      setCurrentSegments(newSegments);
      onSegmentsChange(newSegments);
    }
  }, [onSegmentsChange, storeCursorPosition]);
  // Handle typing input - minimal processing to prevent text reversal
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    // Set typing flag to prevent external HTML updates
    isTypingRef.current = true;
    
    // Clear any pending updates
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
    }

    // Check if we need to clear placeholder text on first input
    if (!hasPlaceholderBeenCleared && editorRef.current.textContent) {
      const currentText = editorRef.current.textContent;
      if (isPlaceholderText(currentText)) {
        // Clear the placeholder text and start fresh
        editorRef.current.innerHTML = '';
        setHasPlaceholderBeenCleared(true);
        
        // Let the user's input continue normally
        return;
      }
    }

    // Schedule content processing after user stops typing
    pendingUpdateRef.current = setTimeout(() => {
      isTypingRef.current = false;
      handleContentChange();
    }, 300); // Wait 300ms after last keystroke
  }, [handleContentChange, isPlaceholderText, hasPlaceholderBeenCleared]);

  // Handle selection changes to update current format
  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current || !onSelectionChange) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Get the current cursor position in plain text
    const range = selection.getRangeAt(0);
    const textBeforeCursor = editorRef.current.textContent?.substring(0, range.startOffset) || '';
    const position = textBeforeCursor.length;

    // Get formatting at cursor position
    const format = richTextManager.getFormattingAtPosition(segmentsRef.current, position);
    onSelectionChange(format);
  }, [onSelectionChange]);  // Apply formatting command to selected text
  const applyFormatting = useCallback((formatCommand: Partial<StandardTextFormat>) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Store current typing state and temporarily disable updates
    const wasTyping = isTypingRef.current;
    isTypingRef.current = true;

    // Get current selection range in plain text coordinates
    const range = selection.getRangeAt(0);
    
    // Calculate selection start/end in plain text
    const selectionStart = getPlainTextPosition(range.startContainer, range.startOffset);
    const selectionEnd = getPlainTextPosition(range.endContainer, range.endOffset);

    const textSelection: TextSelection = {
      start: selectionStart,
      end: selectionEnd
    };

    // Apply formatting to segments
    const newSegments = richTextManager.applyFormattingToSegments(
      segmentsRef.current,
      formatCommand,
      textSelection
    );

    // Update state and content
    setCurrentSegments(newSegments);
    onSegmentsChange(newSegments);

    // Update HTML content using requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      if (editorRef.current && editorRef.current.isConnected) {
        const html = richTextManager.segmentsToHtml(newSegments);
        editorRef.current.innerHTML = html;
        
        // Restore selection after DOM update
        requestAnimationFrame(() => {
          if (editorRef.current && editorRef.current.isConnected) {
            restoreSelection(selectionStart, selectionEnd);
            // Restore previous typing state
            isTypingRef.current = wasTyping;
          }
        });
      } else {
        // Handle cases where ref is no longer valid (e.g., component unmounted)
        isTypingRef.current = wasTyping; // Still restore typing state
      }
    });
  }, [onSegmentsChange, getPlainTextPosition, restoreSelection]);

  // Expose applyFormatting method to parent
  useEffect(() => {
    if (editorRef.current) {
      (editorRef.current as any).applyFormatting = applyFormatting;
    }
  }, [applyFormatting]);

  const defaultStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    padding: designSystem.spacing.sm,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: designSystem.colors.secondary[900],
    fontSize: '14px',
    fontFamily: designSystem.typography.fontFamily.sans,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    boxSizing: 'border-box',
    ...style
  };  // Prevent text selection conflicts
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleSelectStart = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
    };
  }, []);
  return (
    <div
      ref={combinedRef}
      contentEditable
      style={defaultStyle}
      onInput={handleInput}
      onBlur={handleContentChange}
      onSelect={handleSelectionChange}
      onKeyUp={handleSelectionChange}
      onMouseUp={handleSelectionChange}
      onMouseDown={(e) => {
        e.stopPropagation(); // Prevent canvas interactions
        handleMouseDown(e);
      }}
      onKeyDown={(e) => {
        // Stop propagation to prevent global keyboard shortcuts from interfering with text editing
        e.stopPropagation();
        
        // Handle placeholder text clearing on first meaningful keypress
        if (!hasPlaceholderBeenCleared && editorRef.current && editorRef.current.textContent) {
          const currentText = editorRef.current.textContent;
          // Check if this is a content-producing key (not navigation keys)
          const isContentKey = !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Tab', 'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key) && !e.ctrlKey && !e.metaKey;
          
          if (isContentKey && isPlaceholderText(currentText)) {
            // Clear placeholder text immediately
            editorRef.current.innerHTML = '';
            setHasPlaceholderBeenCleared(true);
            
            // Create empty segments to replace placeholder
            const emptySegments: RichTextSegment[] = [];
            setCurrentSegments(emptySegments);
            onSegmentsChange(emptySegments);
          }
        }
        
        // Call the provided onKeyDown handler if it exists
        if (onKeyDown) {
          onKeyDown(e);
        }
      }}
      data-placeholder={placeholder}
      suppressContentEditableWarning={true}
    />
  );
});

export default ContentEditableRichTextEditor;
