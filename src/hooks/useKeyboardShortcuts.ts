// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';
import { useCanvasStore } from '../stores';
import { ElementId } from '../features/canvas/types/enhanced.types';

export const useKeyboardShortcuts = () => {
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => state.canUndo);
  const canRedo = useCanvasStore((state) => state.canRedo);
  const deleteElement = useCanvasStore((state) => state.deleteElement);
  const addElement = useCanvasStore((state) => state.addElement);
  const getElementById = useCanvasStore((state) => state.getElementById);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const setSelectedTool = useCanvasStore((state) => state.setSelectedTool);

  // Helper function to delete multiple elements
  const deleteElements = (ids: ElementId[]) => {
    ids.forEach(id => deleteElement(id));
  };

  // Helper function to duplicate an element (simplified implementation)
  const duplicateElement = (id: ElementId) => {
    const element = getElementById(id);
    if (element) {
      const newElement = {
        ...element,
        id: `${element.id}-copy-${Date.now()}` as ElementId,
        x: element.x + 20,
        y: element.y + 20,
        updatedAt: Date.now()
      };
      addElement(newElement);
    }
  };

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

      const firstSelectedId: ElementId | null = selectedElementIds.size > 0 ? selectedElementIds.values().next().value ?? null : null;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey && canRedo) {
              redo();
            } else if (canUndo) {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            if (canRedo) {
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
            if (firstSelectedId) {
              duplicateElement(firstSelectedId);
            }
            break;
        }
      } else {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            if (selectedElementIds.size > 0) {
              e.preventDefault();
              deleteElements(Array.from(selectedElementIds));
            }
            break;
          case 'Escape':
            e.preventDefault();
            clearSelection();
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
  }, [undo, redo, canUndo, canRedo, selectedElementIds, deleteElements, duplicateElement, setSelectedTool, clearSelection]);
};
