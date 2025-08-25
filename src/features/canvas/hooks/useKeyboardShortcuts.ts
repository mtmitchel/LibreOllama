// src/features/canvas/hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback, useMemo } from 'react';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
import { ElementId, CanvasElement } from '../types/enhanced.types';

export const useKeyboardShortcuts = () => {
  // PERFORMANCE OPTIMIZATION: Consolidate 12 individual subscriptions into 1 combined selector
  const canvasState = useUnifiedCanvasStore(useCallback((state) => ({
    // Read-only state for keyboard shortcuts
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    selectedElementIds: state.selectedElementIds,
    elementsSize: state.elements.size
  }), []));

  // Extract actions once (these don't cause re-renders)
  const actions = useMemo(() => {
    const store = useUnifiedCanvasStore.getState();
    return {
      undo: store.undo,
      redo: store.redo,
      deleteElement: store.deleteElement,
      addElement: store.addElement,
      getElementById: store.getElementById,
      clearSelection: store.clearSelection,
      setSelectedTool: store.setSelectedTool,
      selectElement: store.selectElement,
      getElements: () => useUnifiedCanvasStore.getState().elements
    };
  }, []);

  // Helper function to delete multiple elements
  const deleteElements = useCallback((ids: ElementId[]) => {
    ids.forEach(id => actions.deleteElement(id));
  }, [actions]);

  // Helper function to duplicate an element (simplified implementation)
  const duplicateElement = useCallback((id: ElementId) => {
    const element = actions.getElementById(id);
    if (element) {
      const newElement = {
        ...element,
        id: `${element.id}-copy-${Date.now()}` as ElementId,
        x: element.x + 20,
        y: element.y + 20,
        updatedAt: Date.now()
      };
      actions.addElement(newElement as CanvasElement);
    }
  }, [actions]);

  // Helper function to select all elements
  const selectAll = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 [KeyboardShortcuts] Select All - selecting', canvasState.elementsSize, 'elements');
    }
    
    // Clear current selection first
    actions.clearSelection();
    
    // Select all elements (get fresh state)
    const elements = actions.getElements();
    elements.forEach((element, elementId) => {
      actions.selectElement(elementId as ElementId, true); // true = additive selection
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [KeyboardShortcuts] Select All complete - selected', canvasState.elementsSize, 'elements');
    }
  }, [actions, canvasState.elementsSize]);

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

      const firstSelectedId: ElementId | null = canvasState.selectedElementIds.size > 0 ? (canvasState.selectedElementIds.values().next().value as ElementId) ?? null : null;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey && canvasState.canRedo) {
              actions.redo();
            } else if (canvasState.canUndo) {
              actions.undo();
            }
            break;
          case 'y':
            e.preventDefault();
            if (canvasState.canRedo) {
              actions.redo();
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
            if (canvasState.selectedElementIds.size > 0) {
              e.preventDefault();
              deleteElements(Array.from(canvasState.selectedElementIds) as ElementId[]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            actions.clearSelection();
            break;
          // Tool shortcuts
          case 'v':
            e.preventDefault();
            actions.setSelectedTool('select');
            break;
          case 'h':
            e.preventDefault();
            actions.setSelectedTool('pan');
            break;
          case 't':
            e.preventDefault();
            actions.setSelectedTool('text');
            break;
          case 'r':
            e.preventDefault();
            actions.setSelectedTool('rectangle');
            break;
          case 'c':
            e.preventDefault();
            actions.setSelectedTool('circle');
            break;
          case 'l':
            e.preventDefault();
            actions.setSelectedTool('line');
            break;
          case 'p':
            e.preventDefault();
            actions.setSelectedTool('pen');
            break;
          case 's':
            if (!e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              actions.setSelectedTool('star');
            }
            break;
          case 'n':
            e.preventDefault();
            actions.setSelectedTool('sticky-note');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasState, actions, deleteElements, duplicateElement, selectAll]); // PERFORMANCE: Reduced from 10 deps to 5
};
