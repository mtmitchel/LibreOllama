// src/features/canvas/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { ElementId, CanvasElement } from '../types/enhanced.types';

export const useKeyboardShortcuts = () => {
  const undo = useUnifiedCanvasStore((state) => state.undo);
  const redo = useUnifiedCanvasStore((state) => state.redo);
  const canUndo = useUnifiedCanvasStore((state) => state.canUndo);
  const canRedo = useUnifiedCanvasStore((state) => state.canRedo);
  const deleteElement = useUnifiedCanvasStore((state) => state.deleteElement);
  const addElement = useUnifiedCanvasStore((state) => state.addElement);
  const getElementById = useUnifiedCanvasStore((state) => state.getElementById);
  const selectedElementIds = useUnifiedCanvasStore((state) => state.selectedElementIds);
  const clearSelection = useUnifiedCanvasStore((state) => state.clearSelection);
  const setSelectedTool = useUnifiedCanvasStore((state) => state.setSelectedTool);
  const elements = useUnifiedCanvasStore((state) => state.elements);
  const selectElement = useUnifiedCanvasStore((state) => state.selectElement);

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
      addElement(newElement as CanvasElement);
    }
  };

  // Helper function to select all elements
  const selectAll = () => {
    console.log('🎯 [KeyboardShortcuts] Select All - selecting', elements.size, 'elements');
    
    // Clear current selection first
    clearSelection();
    
    // Select all elements
    elements.forEach((element, elementId) => {
      selectElement(elementId as ElementId, true); // true = additive selection
    });
    
    console.log('✅ [KeyboardShortcuts] Select All complete - selected', elements.size, 'elements');
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

      const firstSelectedId: ElementId | null = selectedElementIds.size > 0 ? (selectedElementIds.values().next().value as ElementId) ?? null : null;

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
            // Reset to 100% - handled by canvas component
            (window as any).resetTo100?.();
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
            selectAll();
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
              deleteElements(Array.from(selectedElementIds) as ElementId[]);
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
  }, [undo, redo, canUndo, canRedo, selectedElementIds, deleteElements, duplicateElement, selectAll, setSelectedTool, clearSelection]);
};
