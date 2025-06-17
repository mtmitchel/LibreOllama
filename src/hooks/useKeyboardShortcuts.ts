// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';
import { useKonvaCanvasStore } from '../stores/konvaCanvasStore';

export const useKeyboardShortcuts = () => {
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    selectedElementId, 
    deleteElement,
    duplicateElement,
    setSelectedTool,
    setSelectedElement
  } = useKonvaCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs, textareas, or contentEditable elements
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.contentEditable === 'true')
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey && canRedo()) {
              redo();
            } else if (canUndo()) {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            if (canRedo()) {
              redo();
            }
            break;
          case '0':
            e.preventDefault();
            // Reset zoom - handled by canvas component
            (window as any).resetZoom?.();
            break;
          case '1':
            e.preventDefault();
            // Zoom to fit - handled by canvas component
            (window as any).zoomToFit?.();
            break;
          case '=':
          case '+':
            e.preventDefault();
            // Zoom in - handled by canvas component
            (window as any).zoomIn?.();
            break;
          case '-':
            e.preventDefault();
            // Zoom out - handled by canvas component
            (window as any).zoomOut?.();
            break;
          case 'a':
            e.preventDefault();
            // Select all - future feature
            break;
          case 'd':
            e.preventDefault();
            if (selectedElementId) {
              duplicateElement(selectedElementId);
            }
            break;
        }
      } else {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            if (selectedElementId) {
              e.preventDefault();
              deleteElement(selectedElementId);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setSelectedElement(null);
            break;
          // Tool shortcuts
          case 'v':
            e.preventDefault();
            setSelectedTool('select');
            break;
          case 'h':
            e.preventDefault();
            setSelectedTool('pan');
            break;
          case 't':
            e.preventDefault();
            setSelectedTool('text');
            break;
          case 'r':
            e.preventDefault();
            setSelectedTool('rectangle');
            break;
          case 'c':
            e.preventDefault();
            setSelectedTool('circle');
            break;
          case 'l':
            e.preventDefault();
            setSelectedTool('line');
            break;
          case 'p':
            e.preventDefault();
            setSelectedTool('pen');
            break;
          case 's':
            if (!e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              setSelectedTool('star');
            }
            break;
          case 'n':
            e.preventDefault();
            setSelectedTool('sticky-note');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, selectedElementId, deleteElement, duplicateElement, setSelectedTool, setSelectedElement]);
};
