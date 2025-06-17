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
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentSegments, setCurrentSegments] = useState<RichTextSegment[]>(initialSegments);
  const segmentsRef = useRef(currentSegments);

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
  
  // Update editor content when segments change externally (but not when typing)
  useEffect(() => {
    if (editorRef.current && !isTypingRef.current) {
      const html = richTextManager.segmentsToHtml(currentSegments);
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
  }, [currentSegments]);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && initialSegments.length > 0) {
      const html = richTextManager.segmentsToHtml(initialSegments);
      editorRef.current.innerHTML = html;
    }
  }, [initialSegments]);  // Handle content changes - prevent DOM updates during typing
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    // Set typing flag to prevent HTML updates
    isTypingRef.current = true;

    // Get the current content
    const textContent = editorRef.current.textContent || '';
    const htmlContent = editorRef.current.innerHTML;
    
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

    // Reset typing flag after input is processed
    setTimeout(() => {
      isTypingRef.current = false;
    }, 100);
  }, [onSegmentsChange]);

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
  }, [onSelectionChange]);
  // Apply formatting command to selected text
  const applyFormatting = useCallback((formatCommand: Partial<StandardTextFormat>) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

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

    // Update HTML content
    const html = richTextManager.segmentsToHtml(newSegments);
    editorRef.current.innerHTML = html;    // Restore selection
    restoreSelection(selectionStart, selectionEnd);
  }, []);

  // Helper to get plain text position from DOM position
  const getPlainTextPosition = useCallback((node: Node, offset: number): number => {
    if (!editorRef.current) return 0;

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
  }, []);

  // Helper to restore selection after content update
  const restoreSelection = useCallback((start: number, end: number) => {
    if (!editorRef.current) return;

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
    let endOffset = 0;

    while (currentNode = walker.nextNode()) {
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
  }, []);

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
  };
  return (
    <div
      ref={combinedRef}
      contentEditable
      style={defaultStyle}
      onInput={handleInput}
      onSelect={handleSelectionChange}
      onKeyUp={handleSelectionChange}
      onMouseUp={handleSelectionChange}
      onKeyDown={(e) => {
        // Stop propagation to prevent global keyboard shortcuts from interfering with text editing
        e.stopPropagation();
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
