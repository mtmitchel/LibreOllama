/**
 * Keyboard Navigation Utilities for Canvas Elements
 * Implements comprehensive keyboard navigation, especially for tables
 */

import { TableElement } from '../../types/enhanced.types';

export interface TableCell {
  row: number;
  col: number;
}

export interface KeyboardNavigationState {
  currentCell?: TableCell;
  isEditing: boolean;
  tableId?: string;
}

/**
 * Enhanced keyboard navigation for table cells
 */
export function handleTableKeyboardNavigation(
  e: KeyboardEvent,
  currentCell: TableCell,
  tableElement: TableElement,
  callbacks: {
    selectCell: (tableId: string, cell: TableCell) => void;
    getCursorPosition?: () => number;
    getCellText?: () => string;
    startEdit?: () => void;
    finishEdit?: () => void;
  }
): boolean {
  const { rows, cols } = tableElement;
  let newCell = { ...currentCell };
  let shouldPreventDefault = false;

  const { selectCell, getCursorPosition, getCellText, startEdit, finishEdit } = callbacks;

  switch (e.key) {
    case 'Tab':
      e.preventDefault();
      shouldPreventDefault = true;
      
      if (e.shiftKey) {
        // Previous cell
        newCell.col--;
        if (newCell.col < 0) {
          newCell.col = cols - 1;
          newCell.row = Math.max(0, newCell.row - 1);
        }
      } else {
        // Next cell
        newCell.col++;
        if (newCell.col >= cols) {
          newCell.col = 0;
          newCell.row = Math.min(rows - 1, newCell.row + 1);
        }
      }
      break;

    case 'ArrowUp':
      if (!e.metaKey && !e.ctrlKey) {
        newCell.row = Math.max(0, newCell.row - 1);
        shouldPreventDefault = true;
      }
      break;

    case 'ArrowDown':
      if (!e.metaKey && !e.ctrlKey) {
        newCell.row = Math.min(rows - 1, newCell.row + 1);
        shouldPreventDefault = true;
      }
      break;

    case 'ArrowLeft':
      // Only navigate to previous cell if cursor is at beginning
      if (getCursorPosition && getCursorPosition() === 0) {
        newCell.col = Math.max(0, newCell.col - 1);
        shouldPreventDefault = true;
      }
      break;

    case 'ArrowRight':
      // Only navigate to next cell if cursor is at end
      if (getCursorPosition && getCellText && getCursorPosition() === getCellText().length) {
        newCell.col = Math.min(cols - 1, newCell.col + 1);
        shouldPreventDefault = true;
      }
      break;

    case 'Enter':
      if (e.shiftKey) {
        // Shift+Enter: Previous row
        newCell.row = Math.max(0, newCell.row - 1);
      } else {
        // Enter: Next row
        newCell.row = Math.min(rows - 1, newCell.row + 1);
      }
      shouldPreventDefault = true;
      break;

    case 'Escape':
      // Exit editing mode
      if (finishEdit) {
        finishEdit();
      }
      shouldPreventDefault = true;
      break;

    case 'F2':
      // Start editing mode
      if (startEdit) {
        startEdit();
      }
      shouldPreventDefault = true;
      break;

    case 'Home':
      if (e.ctrlKey) {
        // Ctrl+Home: First cell
        newCell = { row: 0, col: 0 };
      } else {
        // Home: First column in current row
        newCell.col = 0;
      }
      shouldPreventDefault = true;
      break;

    case 'End':
      if (e.ctrlKey) {
        // Ctrl+End: Last cell
        newCell = { row: rows - 1, col: cols - 1 };
      } else {
        // End: Last column in current row
        newCell.col = cols - 1;
      }
      shouldPreventDefault = true;
      break;

    case 'PageUp':
      // Page up: Move up 5 rows
      newCell.row = Math.max(0, newCell.row - 5);
      shouldPreventDefault = true;
      break;

    case 'PageDown':
      // Page down: Move down 5 rows
      newCell.row = Math.min(rows - 1, newCell.row + 5);
      shouldPreventDefault = true;
      break;

    default:
      // For other keys, don't prevent default to allow normal text input
      break;
  }

  // Only move to new cell if it's different
  if (shouldPreventDefault && (newCell.row !== currentCell.row || newCell.col !== currentCell.col)) {
    selectCell(tableElement.id, newCell);
  }

  return shouldPreventDefault;
}

/**
 * General canvas keyboard navigation
 */
export function handleCanvasKeyboardNavigation(
  e: KeyboardEvent,
  context: {
    selectedElements: string[];
    canvasSize: { width: number; height: number };
    tool: string;
  },
  actions: {
    moveElements: (elementIds: string[], delta: { x: number; y: number }) => void;
    deleteElements: (elementIds: string[]) => void;
    selectAll: () => void;
    undo: () => void;
    redo: () => void;
    copy: () => void;
    paste: () => void;
    duplicate: () => void;
  }
): boolean {
  const { selectedElements } = context;
  const { moveElements, deleteElements, selectAll, undo, redo, copy, paste, duplicate } = actions;

  let shouldPreventDefault = false;

  // Movement keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedElements.length > 0) {
    const moveDistance = e.shiftKey ? 10 : 1; // Shift for larger movements
    let delta = { x: 0, y: 0 };

    switch (e.key) {
      case 'ArrowUp':
        delta.y = -moveDistance;
        break;
      case 'ArrowDown':
        delta.y = moveDistance;
        break;
      case 'ArrowLeft':
        delta.x = -moveDistance;
        break;
      case 'ArrowRight':
        delta.x = moveDistance;
        break;
    }

    moveElements(selectedElements, delta);
    shouldPreventDefault = true;
  }

  // Action keys
  switch (e.key) {
    case 'Delete':
    case 'Backspace':
      if (selectedElements.length > 0) {
        deleteElements(selectedElements);
        shouldPreventDefault = true;
      }
      break;

    case 'a':
    case 'A':
      if (e.ctrlKey || e.metaKey) {
        selectAll();
        shouldPreventDefault = true;
      }
      break;

    case 'z':
    case 'Z':
      if (e.ctrlKey || e.metaKey) {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        shouldPreventDefault = true;
      }
      break;

    case 'y':
    case 'Y':
      if (e.ctrlKey || e.metaKey) {
        redo();
        shouldPreventDefault = true;
      }
      break;

    case 'c':
    case 'C':
      if ((e.ctrlKey || e.metaKey) && selectedElements.length > 0) {
        copy();
        shouldPreventDefault = true;
      }
      break;

    case 'v':
    case 'V':
      if (e.ctrlKey || e.metaKey) {
        paste();
        shouldPreventDefault = true;
      }
      break;

    case 'd':
    case 'D':
      if ((e.ctrlKey || e.metaKey) && selectedElements.length > 0) {
        duplicate();
        shouldPreventDefault = true;
      }
      break;

    case 'Escape':
      // Clear selection or exit current tool
      if (selectedElements.length > 0) {
        // Clear selection action would go here
        shouldPreventDefault = true;
      }
      break;

    default:
      break;
  }

  return shouldPreventDefault;
}

/**
 * Setup keyboard event listeners for canvas
 */
export function setupCanvasKeyboardHandlers(
  canvasContainer: HTMLElement,
  handlers: {
    onTableNavigation?: (e: KeyboardEvent, cell: TableCell, tableId: string) => boolean;
    onCanvasNavigation?: (e: KeyboardEvent) => boolean;
    onToolChange?: (tool: string) => void;
  }
): () => void {
  const { onTableNavigation, onCanvasNavigation, onToolChange } = handlers;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Tool shortcuts
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      switch (e.key) {
        case 'v':
        case 'V':
          onToolChange?.('select');
          e.preventDefault();
          return;
        case 'h':
        case 'H':
          onToolChange?.('pan');
          e.preventDefault();
          return;
        case 'p':
        case 'P':
          onToolChange?.('pen');
          e.preventDefault();
          return;
        case 't':
        case 'T':
          onToolChange?.('text');
          e.preventDefault();
          return;
        case 'r':
        case 'R':
          onToolChange?.('draw-rectangle');
          e.preventDefault();
          return;
        case 'c':
        case 'C':
          if (!e.ctrlKey && !e.metaKey) {
            onToolChange?.('draw-circle');
            e.preventDefault();
            return;
          }
          break;
      }
    }

    // Let table navigation handle table-specific keys
    if (onTableNavigation) {
      // This would need to be implemented with actual table context
      // For now, it's a placeholder
    }

    // Handle general canvas navigation
    if (onCanvasNavigation) {
      const handled = onCanvasNavigation(e);
      if (handled) {
        e.preventDefault();
      }
    }
  };

  // Make canvas container focusable
  canvasContainer.tabIndex = 1;
  canvasContainer.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    canvasContainer.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Accessibility helpers for keyboard navigation
 */
export const KeyboardAccessibility = {
  /**
   * Announce navigation changes to screen readers
   */
  announceNavigation(message: string): void {
    // Create or update live region for screen reader announcements
    let liveRegion = document.getElementById('canvas-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'canvas-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = message;
  },

  /**
   * Setup ARIA labels for canvas elements
   */
  setupAriaLabels(element: HTMLElement, label: string, description?: string): void {
    element.setAttribute('aria-label', label);
    if (description) {
      element.setAttribute('aria-description', description);
    }
  },

  /**
   * Cleanup accessibility elements
   */
  cleanup(): void {
    const liveRegion = document.getElementById('canvas-live-region');
    if (liveRegion) {
      liveRegion.remove();
    }
  }
};

export default {
  handleTableKeyboardNavigation,
  handleCanvasKeyboardNavigation,
  setupCanvasKeyboardHandlers,
  KeyboardAccessibility
};
