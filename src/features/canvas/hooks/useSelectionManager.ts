// src/hooks/canvas/useSelectionManager.ts
import { useCallback } from 'react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { toElementId, arrayToElementIds } from '../types/compatibility';

/**
 * useSelectionManager - Selection logic from selection store
 * - Integrates with selection store for element selection operations
 * - Provides convenient methods for selection management
 * - Handles multi-selection and selection rectangle logic
 */
export const useSelectionManager = () => {
  // Get selection state and actions from unified store
  const selectedElementIds = useUnifiedCanvasStore((state) => state.selectedElementIds);
  const lastSelectedElementId = useUnifiedCanvasStore((state) => state.lastSelectedElementId);
  const selectElement = useUnifiedCanvasStore((state) => state.selectElement);
  const deselectElement = useUnifiedCanvasStore((state) => state.deselectElement);
  const clearSelection = useUnifiedCanvasStore((state) => state.clearSelection);
  const getSelectedElements = useUnifiedCanvasStore((state) => state.getSelectedElements);
  
  // Derived methods for compatibility
  const hasSelection = selectedElementIds.size > 0;
  const isElementSelected = useCallback((elementId: string) => {
    return selectedElementIds.has(toElementId(elementId));
  }, [selectedElementIds]);
  
  const toggleElementSelection = useCallback((elementId: string) => {
    const id = toElementId(elementId);
    if (selectedElementIds.has(id)) {
      deselectElement(id);
    } else {
      selectElement(id, true); // multiSelect = true
    }
  }, [selectedElementIds, selectElement, deselectElement]);
  
  const selectMultipleElements = useCallback((elementIds: string[]) => {
    clearSelection();
    elementIds.forEach(id => selectElement(toElementId(id), true));
  }, [clearSelection, selectElement]);
  // Select a single element, optionally adding to current selection
  const selectSingle = useCallback((elementId: string, addToSelection: boolean = false) => {
    if (addToSelection) {
      toggleElementSelection(elementId);
    } else {
      selectElement(toElementId(elementId));
    }
  }, [selectElement, toggleElementSelection]);
  // Select multiple elements by IDs
  const selectMultiple = useCallback((elementIds: string[], replaceSelection: boolean = true) => {
    selectMultipleElements(arrayToElementIds(elementIds), replaceSelection);
  }, [selectMultipleElements]);
  // Toggle selection of an element
  const toggle = useCallback((elementId: string) => {
    toggleElementSelection(toElementId(elementId));
  }, [toggleElementSelection]);
  // Deselect a specific element
  const deselect = useCallback((elementId: string) => {
    deselectElement(toElementId(elementId));
  }, [deselectElement]);

  // Clear all selections
  const clear = useCallback(() => {
    clearSelection();
  }, [clearSelection]);
  // Check if element is selected
  const isSelected = useCallback((elementId: string) => {
    return isElementSelected(toElementId(elementId));
  }, [isElementSelected]);

  // Get all selected element IDs
  const getSelectedIds = useCallback(() => {
    return Array.from(selectedElementIds);
  }, [selectedElementIds]);

  // Get selection count
  const getSelectionCount = useCallback(() => {
    return selectedElementIds.size;
  }, [selectedElementIds]);

  // Check if multiple elements are selected
  const hasMultipleSelection = useCallback(() => {
    return selectedElementIds.size > 1;
  }, [selectedElementIds]);

  // Get the primary selected element (last selected)
  const getPrimarySelection = useCallback(() => {
    return lastSelectedElementId;
  }, [lastSelectedElementId]);
  // Select all elements in a given list
  const selectAll = useCallback((allElementIds: string[]) => {
    selectMultipleElements(arrayToElementIds(allElementIds), true);
  }, [selectMultipleElements]);

  // Invert selection - select unselected, deselect selected
  const invertSelection = useCallback((allElementIds: string[]) => {
    const currentlySelected = new Set(selectedElementIds);
    const newSelection = allElementIds.filter(id => !currentlySelected.has(toElementId(id)));
    selectMultipleElements(arrayToElementIds(newSelection), true);
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
    });    if (elementsInRect.length > 0) {
      selectMultipleElements(arrayToElementIds(elementsInRect), !addToSelection);
    }
  }, [selectMultipleElements]);

  // Get selection bounds (bounding box of all selected elements)
  const getSelectionBounds = useCallback((
    elementPositions: Record<string, { x: number; y: number; width: number; height: number }>
  ) => {
    if (selectedElementIds.size === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedElementIds.forEach((id: string) => {
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