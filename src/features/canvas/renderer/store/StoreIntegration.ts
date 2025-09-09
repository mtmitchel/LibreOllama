/**
 * Store Integration Layer for Canvas Text Editing
 * Centralized store access and synchronization for text editing operations
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import type { ElementId, CanvasElement } from '../../types/enhanced.types';

/**
 * Store update options
 */
export interface StoreUpdateOptions {
  skipHistory?: boolean;
  silent?: boolean;
  batch?: boolean;
}

/**
 * Element update data
 */
export interface ElementUpdateData {
  text?: string;
  width?: number;
  height?: number;
  radius?: number;
  radiusX?: number;
  radiusY?: number;
  fontSize?: number;
  fontFamily?: string;
  isEditing?: boolean;
  [key: string]: any;
}

/**
 * Store adapter interface
 * Abstracts store operations for testability and modularity
 */
export interface CanvasStoreAdapter {
  // Element operations
  updateElement(id: ElementId, updates: ElementUpdateData, options?: StoreUpdateOptions): void;
  selectElement(id: ElementId, additive?: boolean): void;
  getElement(id: ElementId): CanvasElement | undefined;
  
  // Selection operations  
  getSelectedElementIds(): Set<ElementId>;
  clearSelection(): void;
  
  // Table operations (for table overlay integration)
  addTableColumn?(tableId: ElementId, index: number): void;
  addTableRow?(tableId: ElementId, index: number): void;
  removeTableColumn?(tableId: ElementId, index: number): void;
  removeTableRow?(tableId: ElementId, index: number): void;
  
  // State operations
  saveSnapshot?(): void;
  reflowEdgesForElement?(id: ElementId): void;
  computeAndCommitDirtyEdges?(): void;
  
  // Utility
  isConnected(): boolean;
}

/**
 * Global store access implementation
 * Provides access to the unified canvas store via window global
 */
export class GlobalStoreAdapter implements CanvasStoreAdapter {
  private getStore(): any {
    try {
      return (window as any).__UNIFIED_CANVAS_STORE__;
    } catch {
      return null;
    }
  }

  /**
   * Check if store is available and connected
   */
  isConnected(): boolean {
    const store = this.getStore();
    return Boolean(store?.getState);
  }

  /**
   * Update element in store
   * @param id - Element ID
   * @param updates - Update data
   * @param options - Update options
   */
  updateElement(id: ElementId, updates: ElementUpdateData, options: StoreUpdateOptions = {}): void {
    try {
      const store = this.getStore();
      if (store?.getState?.().updateElement) {
        store.getState().updateElement(id, updates, options);
      }
    } catch (e) {
      console.warn('[StoreAdapter] Failed to update element:', e);
    }
  }

  /**
   * Select element in store
   * @param id - Element ID
   * @param additive - Whether to add to existing selection
   */
  selectElement(id: ElementId, additive: boolean = false): void {
    try {
      const store = this.getStore();
      if (store?.getState?.().selectElement) {
        store.getState().selectElement(id, additive);
      }
    } catch (e) {
      console.warn('[StoreAdapter] Failed to select element:', e);
    }
  }

  /**
   * Get element from store
   * @param id - Element ID
   */
  getElement(id: ElementId): CanvasElement | undefined {
    try {
      const store = this.getStore();
      return store?.getState()?.elements?.get(id);
    } catch (e) {
      console.warn('[StoreAdapter] Failed to get element:', e);
      return undefined;
    }
  }

  /**
   * Get selected element IDs
   */
  getSelectedElementIds(): Set<ElementId> {
    try {
      const store = this.getStore();
      return store?.getState()?.selectedElementIds || new Set();
    } catch (e) {
      console.warn('[StoreAdapter] Failed to get selected elements:', e);
      return new Set();
    }
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    try {
      const store = this.getStore();
      if (store?.getState?.().clearSelection) {
        store.getState().clearSelection();
      }
    } catch (e) {
      console.warn('[StoreAdapter] Failed to clear selection:', e);
    }
  }

  /**
   * Add table column
   * @param tableId - Table element ID
   * @param index - Column index
   */
  addTableColumn(tableId: ElementId, index: number): void {
    try {
      const store = this.getStore();
      if (store?.getState?.().addTableColumn) {
        store.getState().addTableColumn(tableId, index);
      }
    } catch (e) {
      console.warn('[StoreAdapter] Failed to add table column:', e);
    }
  }

  /**
   * Add table row
   * @param tableId - Table element ID
   * @param index - Row index
   */
  addTableRow(tableId: ElementId, index: number): void {
    try {
      const store = this.getStore();
      if (store?.getState?.().addTableRow) {
        store.getState().addTableRow(tableId, index);
      }
    } catch (e) {
      console.warn('[StoreAdapter] Failed to add table row:', e);
    }
  }

  /**
   * Remove table column
   * @param tableId - Table element ID
   * @param index - Column index
   */
  removeTableColumn(tableId: ElementId, index: number): void {
    try {
      const store = this.getStore();
      if (store?.getState?.().removeTableColumn) {
        store.getState().removeTableColumn(tableId, index);
      }
    } catch (e) {
      console.warn('[StoreAdapter] Failed to remove table column:', e);
    }
  }

  /**
   * Remove table row
   * @param tableId - Table element ID
   * @param index - Row index
   */
  removeTableRow(tableId: ElementId, index: number): void {
    try {
      const store = this.getStore();
      if (store?.getState?.().removeTableRow) {
        store.getState().removeTableRow(tableId, index);
      }
    } catch (e) {
      console.warn('[StoreAdapter] Failed to remove table row:', e);
    }
  }

  /**
   * Save snapshot for undo/redo
   */
  saveSnapshot(): void {
    try {
      const store = this.getStore();
      if (store?.getState?.().saveSnapshot) {
        store.getState().saveSnapshot();
      }
    } catch (e) {
      console.warn('[StoreAdapter] Failed to save snapshot:', e);
    }
  }

  /**
   * Reflow edges for element
   * @param id - Element ID
   */
  reflowEdgesForElement(id: ElementId): void {
    try {
      const store = this.getStore();
      if (store?.getState?.().reflowEdgesForElement) {
        store.getState().reflowEdgesForElement(id);
      }
    } catch (e) {
      console.warn('[StoreAdapter] Failed to reflow edges:', e);
    }
  }

  /**
   * Compute and commit dirty edges
   */
  computeAndCommitDirtyEdges(): void {
    try {
      const store = this.getStore();
      if (store?.getState?.().computeAndCommitDirtyEdges) {
        store.getState().computeAndCommitDirtyEdges();
      }
    } catch (e) {
      console.warn('[StoreAdapter] Failed to compute dirty edges:', e);
    }
  }
}

/**
 * Text editing store operations
 * High-level operations for text editing workflows
 */
export class TextEditingStoreManager {
  constructor(private adapter: CanvasStoreAdapter) {}

  /**
   * Start text editing session
   * @param elementId - Element ID
   * @param initialText - Initial text value
   */
  startEditing(elementId: ElementId, initialText?: string): void {
    // Mark element as editing to prevent canvas rendering conflicts
    this.adapter.updateElement(elementId, { 
      isEditing: true,
      ...(initialText !== undefined && { text: initialText })
    });

    // Ensure element is selected for proper transformer handling
    this.adapter.selectElement(elementId, false);
  }

  /**
   * Update text during live editing
   * @param elementId - Element ID
   * @param text - Current text value
   * @param skipHistory - Whether to skip history for live updates
   */
  updateTextLive(elementId: ElementId, text: string, skipHistory: boolean = true): void {
    this.adapter.updateElement(elementId, { text }, { skipHistory });
  }

  /**
   * Update element dimensions during auto-resize
   * @param elementId - Element ID
   * @param dimensions - New dimensions
   * @param skipHistory - Whether to skip history for live updates
   */
  updateDimensions(
    elementId: ElementId, 
    dimensions: { width?: number; height?: number; radius?: number; radiusX?: number; radiusY?: number },
    skipHistory: boolean = true
  ): void {
    this.adapter.updateElement(elementId, dimensions, { skipHistory });
  }

  /**
   * Commit text editing session
   * @param elementId - Element ID
   * @param finalText - Final text value
   * @param finalDimensions - Final dimensions if changed
   */
  commitEditing(
    elementId: ElementId, 
    finalText: string, 
    finalDimensions?: { width?: number; height?: number; radius?: number; radiusX?: number; radiusY?: number }
  ): void {
    // Update with final values (creates history entry)
    this.adapter.updateElement(elementId, {
      text: finalText,
      isEditing: false,
      ...finalDimensions
    });

    // Save snapshot for undo/redo
    this.adapter.saveSnapshot?.();

    // Reflow connected edges if element size changed
    if (finalDimensions) {
      this.adapter.reflowEdgesForElement?.(elementId);
    }
  }

  /**
   * Cancel text editing session
   * @param elementId - Element ID
   * @param originalText - Original text to restore
   * @param originalDimensions - Original dimensions to restore
   */
  cancelEditing(
    elementId: ElementId,
    originalText?: string,
    originalDimensions?: { width?: number; height?: number; radius?: number; radiusX?: number; radiusY?: number }
  ): void {
    // Restore original state
    this.adapter.updateElement(elementId, {
      isEditing: false,
      ...(originalText !== undefined && { text: originalText }),
      ...originalDimensions
    });

    // Ensure element stays selected
    this.adapter.selectElement(elementId, false);
  }

  /**
   * Get current element data
   * @param elementId - Element ID
   */
  getElement(elementId: ElementId): CanvasElement | undefined {
    return this.adapter.getElement(elementId);
  }

  /**
   * Get selected elements
   */
  getSelectedElementIds(): Set<ElementId> {
    return this.adapter.getSelectedElementIds();
  }

  /**
   * Check if store is available
   */
  isConnected(): boolean {
    return this.adapter.isConnected();
  }
}

/**
 * Mock store adapter for testing
 */
export class MockStoreAdapter implements CanvasStoreAdapter {
  private elements = new Map<ElementId, CanvasElement>();
  private selectedIds = new Set<ElementId>();
  
  // Track method calls for testing
  public updateElementCalls: Array<{ id: ElementId; updates: ElementUpdateData; options?: StoreUpdateOptions }> = [];
  public selectElementCalls: Array<{ id: ElementId; additive: boolean }> = [];

  isConnected(): boolean {
    return true;
  }

  updateElement(id: ElementId, updates: ElementUpdateData, options?: StoreUpdateOptions): void {
    this.updateElementCalls.push({ id, updates, options });
    
    const existing = this.elements.get(id);
    if (existing) {
      this.elements.set(id, { ...existing, ...updates });
    }
  }

  selectElement(id: ElementId, additive: boolean = false): void {
    this.selectElementCalls.push({ id, additive });
    
    if (!additive) {
      this.selectedIds.clear();
    }
    this.selectedIds.add(id);
  }

  getElement(id: ElementId): CanvasElement | undefined {
    return this.elements.get(id);
  }

  getSelectedElementIds(): Set<ElementId> {
    return new Set(this.selectedIds);
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  // Table operations - no-op in mock
  addTableColumn() {}
  addTableRow() {}
  removeTableColumn() {}
  removeTableRow() {}
  
  // State operations - no-op in mock
  saveSnapshot() {}
  reflowEdgesForElement() {}
  computeAndCommitDirtyEdges() {}

  // Test utilities
  setElement(id: ElementId, element: CanvasElement): void {
    this.elements.set(id, element);
  }

  reset(): void {
    this.elements.clear();
    this.selectedIds.clear();
    this.updateElementCalls = [];
    this.selectElementCalls = [];
  }
}