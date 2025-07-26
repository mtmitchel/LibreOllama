import { useState, useEffect, useCallback } from 'react';

export interface TextSelection {
  text: string;
  range: Range | null;
  rect: {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null;
  isCollapsed: boolean;
}

export interface UseTextSelectionOptions {
  onSelectionChange?: (selection: TextSelection | null) => void;
  minLength?: number; // Minimum text length to trigger
}

export function useTextSelection(options: UseTextSelectionOptions = {}) {
  const { onSelectionChange, minLength = 3 } = options;
  const [selection, setSelection] = useState<TextSelection | null>(null);

  const getSelectionData = useCallback((): TextSelection | null => {
    const sel = window.getSelection();
    
    if (!sel || sel.rangeCount === 0) {
      return null;
    }

    const text = sel.toString().trim();
    if (text.length < minLength) {
      return null;
    }

    const range = sel.getRangeAt(0);
    let rect = range.getBoundingClientRect();
    
    // If rect is empty (common with textarea/input selections), try to get coordinates from the element
    if (rect.width === 0 && rect.height === 0) {
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
      
      // Check if we're in a textarea or input
      if (element && (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT')) {
        const input = element as HTMLTextAreaElement | HTMLInputElement;
        const inputRect = input.getBoundingClientRect();
        
        // Position menu near the input element (top-right corner)
        rect = {
          top: inputRect.top,
          left: inputRect.right,
          right: inputRect.right + 240, // approximate menu width
          bottom: inputRect.top + 24,
          width: 240,
          height: 24,
          x: inputRect.right,
          y: inputRect.top,
          toJSON: () => ({})
        } as DOMRect;
      } else if (element) {
        // For other elements, try to get a reasonable position
        const elementRect = element.getBoundingClientRect();
        rect = {
          top: elementRect.top,
          left: elementRect.left,
          right: elementRect.left + 240,
          bottom: elementRect.top + 24,
          width: 240,
          height: 24,
          x: elementRect.left,
          y: elementRect.top,
          toJSON: () => ({})
        } as DOMRect;
      }
    }
    
    // Create a truly static rect with only numeric values
    const staticRect = {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };

    return {
      text,
      range,
      rect: staticRect,
      isCollapsed: sel.isCollapsed
    };
  }, [minLength]);

  const handleSelectionChange = useCallback(() => {
    const selectionData = getSelectionData();
    setSelection(selectionData);
    onSelectionChange?.(selectionData);
  }, [getSelectionData, onSelectionChange]);

  // Debounced selection handler to avoid too many updates
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleSelectionChange, 50);
    };

    // Listen for selection changes
    document.addEventListener('selectionchange', debouncedHandler);
    // Also listen for mouseup to catch selection end
    document.addEventListener('mouseup', debouncedHandler);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('selectionchange', debouncedHandler);
      document.removeEventListener('mouseup', debouncedHandler);
    };
  }, [handleSelectionChange]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  const replaceSelection = useCallback((newText: string) => {
    if (!selection?.range) return;

    const sel = window.getSelection();
    if (!sel) return;

    // Check if we're in a BlockNote/ProseMirror editor
    const selectionNode = sel.anchorNode;
    const isInBlockNote = selectionNode && 
      (selectionNode as any).parentElement?.closest('.bn-editor, .ProseMirror');

    if (isInBlockNote) {
      // For BlockNote, we need to trigger an input event
      // to ensure the editor's state is properly updated
      document.execCommand('insertText', false, newText);
    } else {
      // For regular text, use the standard approach
      selection.range.deleteContents();
      
      const textNode = document.createTextNode(newText);
      selection.range.insertNode(textNode);
      
      selection.range.setStartAfter(textNode);
      selection.range.setEndAfter(textNode);
      
      sel.removeAllRanges();
      sel.addRange(selection.range);
    }
    
    clearSelection();
  }, [selection, clearSelection]);

  return {
    selection,
    clearSelection,
    replaceSelection,
    isTextSelected: selection !== null
  };
}