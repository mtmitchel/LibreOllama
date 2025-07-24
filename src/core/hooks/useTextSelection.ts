import { useState, useEffect, useCallback } from 'react';

export interface TextSelection {
  text: string;
  range: Range | null;
  rect: DOMRect | null;
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
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      return null;
    }

    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();

    if (text.length < minLength) {
      return null;
    }

    // Get bounding rect for positioning the menu
    const rect = range.getBoundingClientRect();

    return {
      text,
      range,
      rect,
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
      timeoutId = setTimeout(handleSelectionChange, 200);
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