// src/hooks/canvas/useSelectionManager.ts
import { useCallback } from 'react';
import { useSelection } from '../stores/konvaCanvasStore';

/**
 * useSelectionManager - Selection logic from selection store
 * - Integrates with selection store for element selection operations
 * - Provides convenient methods for selection management
 * - Handles multi-selection and selection rectangle logic
 */
export const useSelectionManager = () => {
  const {
    selectedElementIds,
    lastSelectedElementId,
    selectionRectangle,
    selectElement,
    deselectElement,
    toggleElementSelection,
    selectMultipleElements,
    clearSelection,
    isElementSelected,
    getSelectedElementIds,
    hasSelection
  } = useSelection();

  // Select a single element, optionally adding to current selection
  const selectSingle = useCallback((elementId: string, addToSelection: boolean = false) => {
    if (addToSelection) {
      toggleElementSelection(elementId);
    } else {
      selectElement(elementId);
    }
  }, [selectElement, toggleElementSelection]);

  // Select multiple elements by IDs
  const selectMultiple = useCallback((elementIds: string[], replaceSelection: boolean = true) => {
    selectMultipleElements(elementIds, replaceSelection);
  }, [selectMultipleElements]);

  // Toggle selection of an element
  const toggle = useCallback((elementId: string) => {
    toggleElementSelection(elementId);
  }, [toggleElementSelection]);

  // Deselect a specific element
  const deselect = useCallback((elementId: string) => {
    deselectElement(elementId);
  }, [deselectElement]);

  // Clear all selections
  const clear = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Check if element is selected
  const isSelected = useCallback((elementId: string) => {
    return isElementSelected(elementId);
  }, [isElementSelected]);

  // Get all selected element IDs
  const getSelectedIds = useCallback(() => {
    return getSelectedElementIds();
  }, [getSelectedElementIds]);

  // Get selection count
  const getSelectionCount = useCallback(() => {
    return selectedElementIds.length;
  }, [selectedElementIds]);

  // Check if multiple elements are selected
  const hasMultipleSelection = useCallback(() => {
    return selectedElementIds.length > 1;
  }, [selectedElementIds]);

  // Get the primary selected element (last selected)
  const getPrimarySelection = useCallback(() => {
    return lastSelectedElementId;
  }, [lastSelectedElementId]);

  // Select all elements in a given list
  const selectAll = useCallback((allElementIds: string[]) => {
    selectMultipleElements(allElementIds, true);
  }, [selectMultipleElements]);

  // Invert selection - select unselected, deselect selected
  const invertSelection = useCallback((allElementIds: string[]) => {
    const currentlySelected = new Set(selectedElementIds);
    const newSelection = allElementIds.filter(id => !currentlySelected.has(id));
    selectMultipleElements(newSelection, true);
  }, [selectedElementIds, selectMultipleElements]);

  // Select elements within a rectangular area
  const selectInRectangle = useCallback((
    rect: { x: number; y: number; width: number; height: number },
    elementPositions: Record<string, { x: number; y: number; width: number; height: number }>,
    addToSelection: boolean = false
  ) => {
    const elementsInRect: string[] = [];
    
    Object.entries(elementPositions).forEach(([id, pos]) => {
      // Check if element intersects with selection rectangle
      const intersects = !(
        pos.x + pos.width < rect.x ||
        pos.x > rect.x + rect.width ||
        pos.y + pos.height < rect.y ||
        pos.y > rect.y + rect.height
      );
      
      if (intersects) {
        elementsInRect.push(id);
      }
    });

    if (elementsInRect.length > 0) {
      selectMultipleElements(elementsInRect, !addToSelection);
    }
  }, [selectMultipleElements]);

  // Get selection bounds (bounding box of all selected elements)
  const getSelectionBounds = useCallback((
    elementPositions: Record<string, { x: number; y: number; width: number; height: number }>
  ) => {
    if (selectedElementIds.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedElementIds.forEach(id => {
      const pos = elementPositions[id];
      if (pos) {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + pos.width);
        maxY = Math.max(maxY, pos.y + pos.height);
      }
    });

    if (minX === Infinity) return null;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [selectedElementIds]);

  return {
    // State
    selectedElementIds,
    lastSelectedElementId,
    selectionRectangle,
    
    // Basic operations
    selectSingle,
    selectMultiple,
    toggle,
    deselect,
    clear,
    
    // Utility functions
    isSelected,
    getSelectedIds,
    getSelectionCount,
    hasMultipleSelection,
    hasSelection,
    getPrimarySelection,
    
    // Advanced operations
    selectAll,
    invertSelection,
    selectInRectangle,
    getSelectionBounds
  };
};