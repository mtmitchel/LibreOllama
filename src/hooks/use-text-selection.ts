import { useState, useEffect, useCallback, useRef } from 'react';
import { ContextualActionsService, type ActionContext, type ContextualAction } from '../lib/contextual-actions';

export interface TextSelection {
  text: string;
  range: Range | null;
  rect: DOMRect | null;
  element: Element | null;
}

export interface UseTextSelectionOptions {
  contentType: 'note' | 'task' | 'chat' | 'chat_session';
  contentId: string;
  onAction?: (actionId: string, context: ActionContext) => Promise<void>;
  disabled?: boolean;
}

export function useTextSelection({
  contentType,
  contentId,
  onAction,
  disabled = false
}: UseTextSelectionOptions) {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextualActions, setContextualActions] = useState<ContextualAction[]>([]);
  
  const selectionTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSelectionRef = useRef<string>('');

  const handleSelectionChange = useCallback(() => {
    if (disabled) return;

    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.rangeCount === 0) {
      setSelection(null);
      setShowContextMenu(false);
      return;
    }

    const range = windowSelection.getRangeAt(0);
    const selectedText = windowSelection.toString().trim();

    // Ignore if no text selected or same as last selection
    if (!selectedText || selectedText === lastSelectionRef.current) {
      return;
    }

    lastSelectionRef.current = selectedText;

    // Get the bounding rect of the selection
    const rect = range.getBoundingClientRect();
    const element = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer as Element;

    const newSelection: TextSelection = {
      text: selectedText,
      range: range.cloneRange(),
      rect,
      element
    };

    setSelection(newSelection);

    // Clear any existing timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // Delay showing context menu to avoid flickering
    selectionTimeoutRef.current = setTimeout(() => {
      if (selectedText.length > 0) {
        // Get contextual actions for this selection
        const context: ActionContext = {
          selectedText,
          currentContent: element?.textContent || '',
          contentType,
          contentId
        };

        const actions = ContextualActionsService.getContextualActions(context);
        setContextualActions(actions);
      }
    }, 150);
  }, [disabled, contentType, contentId]);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    if (disabled || !selection?.text) return;

    event.preventDefault();
    event.stopPropagation();

    // Position context menu near the selection but avoid screen edges
    const x = Math.min(event.clientX, window.innerWidth - 250);
    const y = Math.min(event.clientY, window.innerHeight - 300);

    setContextMenuPosition({ x, y });
    setShowContextMenu(true);
  }, [disabled, selection]);

  const handleActionClick = useCallback(async (action: ContextualAction) => {
    if (!selection) return;

    setShowContextMenu(false);

    const context: ActionContext = {
      selectedText: selection.text,
      currentContent: selection.element?.textContent || '',
      contentType,
      contentId
    };

    try {
      const result = await action.action(context);
      
      if (onAction) {
        await onAction(action.id, context);
      }

      // Clear selection after action
      window.getSelection()?.removeAllRanges();
      setSelection(null);
    } catch (error) {
      console.error('Failed to execute contextual action:', error);
    }
  }, [selection, contentType, contentId, onAction]);

  const hideContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setShowContextMenu(false);
    lastSelectionRef.current = '';
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (disabled) return;

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', hideContextMenu);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideContextMenu();
      }
    });

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', hideContextMenu);
      
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [disabled, handleSelectionChange, handleContextMenu, hideContextMenu]);

  return {
    selection,
    showContextMenu,
    contextMenuPosition,
    contextualActions,
    handleActionClick,
    hideContextMenu,
    clearSelection
  };
}