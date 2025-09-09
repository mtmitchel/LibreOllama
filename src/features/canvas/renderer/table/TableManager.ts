/**
 * Table Management System
 * Integrates table overlay controls, cell editing, and table operations
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import type Konva from 'konva';
import type { ElementId, CanvasElement } from '../../types/enhanced.types';
import { TableOverlayManager, type TableConfig, type TableActionCallbacks } from './TableOverlayManager';
import { TableContextMenuManager } from './TableOverlayManager';
import { TableCellEditor, TableCellNavigationManager, type CellDimensions } from './TableCellEditor';

/**
 * Table store adapter interface
 */
export interface TableStoreAdapter {
  updateElement(id: ElementId, updates: any, options?: { skipHistory?: boolean }): void;
  getElement(id: ElementId): CanvasElement | undefined;
  addTableRow?(tableId: ElementId, index: number): void;
  removeTableRow?(tableId: ElementId, index: number): void;
  addTableColumn?(tableId: ElementId, index: number): void;
  removeTableColumn?(tableId: ElementId, index: number): void;
}

/**
 * Table manager configuration
 */
export interface TableManagerConfig {
  stage: Konva.Stage;
  overlayLayer: Konva.Layer;
  storeAdapter: TableStoreAdapter;
  scheduleDraw?: (layer: 'main' | 'overlay' | 'preview') => void;
  refreshTransformer?: (id?: ElementId) => void;
  debug?: {
    log?: boolean;
  };
}

/**
 * Table operation callbacks
 */
interface TableOperationCallbacks {
  onTableUpdate: (tableId: ElementId, updates: any) => void;
  onLayoutTable: (tableId: ElementId, tableNode: Konva.Group, config: any) => void;
}

/**
 * Table Manager
 * Orchestrates all table-related functionality including overlays, editing, and operations
 */
export class TableManager {
  private config: TableManagerConfig;
  private overlayManager: TableOverlayManager;
  private contextMenuManager: TableContextMenuManager;
  private cellEditor: TableCellEditor;
  private navigationManager: TableCellNavigationManager;
  private operationCallbacks?: TableOperationCallbacks;

  // State tracking
  private activeTableId: ElementId | null = null;
  private tableNodes = new Map<ElementId, Konva.Group>();

  constructor(config: TableManagerConfig) {
    this.config = config;

    // Initialize sub-managers
    this.overlayManager = new TableOverlayManager(config.overlayLayer);
    this.contextMenuManager = new TableContextMenuManager(config.stage);
    
    this.cellEditor = new TableCellEditor({
      stage: config.stage,
      updateCellCallback: this.handleCellUpdate.bind(this),
      scheduleDraw: config.scheduleDraw,
      debug: config.debug
    });

    this.navigationManager = new TableCellNavigationManager(this.cellEditor);

    if (config.debug?.log) {
      console.info('[TableManager] Initialized table management system');
    }
  }

  /**
   * Set table operation callbacks
   */
  setOperationCallbacks(callbacks: TableOperationCallbacks): void {
    this.operationCallbacks = callbacks;
  }

  /**
   * Register table node for management
   */
  registerTableNode(tableId: ElementId, tableNode: Konva.Group): void {
    this.tableNodes.set(tableId, tableNode);
    
    if (this.config.debug?.log) {
      console.debug('[TableManager] Registered table node:', tableId);
    }

    // Set up table-specific event handlers
    this.setupTableEvents(tableId, tableNode);
  }

  /**
   * Unregister table node
   */
  unregisterTableNode(tableId: ElementId): void {
    this.tableNodes.delete(tableId);
    
    // Clean up if this was the active table
    if (this.activeTableId === tableId) {
      this.clearActiveTable();
    }

    if (this.config.debug?.log) {
      console.debug('[TableManager] Unregistered table node:', tableId);
    }
  }

  /**
   * Show table overlay controls
   */
  showTableOverlay(tableId: ElementId): void {
    const tableNode = this.tableNodes.get(tableId);
    if (!tableNode) {
      console.warn('[TableManager] Table node not found:', tableId);
      return;
    }

    const element = this.config.storeAdapter.getElement(tableId);
    if (!element) {
      console.warn('[TableManager] Table element not found:', tableId);
      return;
    }

    const config = this.buildTableConfig(element);
    const callbacks = this.buildActionCallbacks(tableId, tableNode);

    this.overlayManager.renderTableControls(tableId, tableNode, config, callbacks);
    this.navigationManager.setCurrentTable(tableId, config.rows, config.cols);
    this.activeTableId = tableId;

    if (this.config.debug?.log) {
      console.info('[TableManager] Showing table overlay for:', tableId);
    }
  }

  /**
   * Clear table overlay controls
   */
  clearTableOverlay(): void {
    this.overlayManager.clearTableOverlay();
    this.navigationManager.clearCurrentTable();
    this.activeTableId = null;

    if (this.config.debug?.log) {
      console.debug('[TableManager] Cleared table overlay');
    }
  }

  /**
   * Update table overlay position (when table moves)
   */
  updateTableOverlayPosition(tableId: ElementId): void {
    if (!this.overlayManager.isActiveForTable(tableId)) return;

    const tableNode = this.tableNodes.get(tableId);
    if (!tableNode) return;

    const element = this.config.storeAdapter.getElement(tableId);
    if (!element) return;

    const config = this.buildTableConfig(element);
    const callbacks = this.buildActionCallbacks(tableId, tableNode);

    this.overlayManager.updateOverlayPosition(tableId, tableNode, config, callbacks);
  }

  /**
   * Open cell editor for specific cell
   */
  async openCellEditor(tableId: ElementId, row: number, col: number): Promise<void> {
    const tableNode = this.tableNodes.get(tableId);
    if (!tableNode) {
      console.warn('[TableManager] Table node not found for cell editing:', tableId);
      return;
    }

    const element = this.config.storeAdapter.getElement(tableId);
    if (!element) {
      console.warn('[TableManager] Table element not found for cell editing:', tableId);
      return;
    }

    // Calculate cell dimensions
    const dimensions = this.calculateCellDimensions(tableNode, element);
    
    // Get current cell content
    const cellContent = this.getCellContent(element, row, col);

    // Open cell editor
    await this.cellEditor.openCellEditor(
      tableId,
      tableNode,
      row,
      col,
      dimensions,
      cellContent
    );

    if (this.config.debug?.log) {
      console.info('[TableManager] Opened cell editor:', { tableId, row, col });
    }
  }

  /**
   * Close any open cell editor
   */
  closeCellEditor(): void {
    this.cellEditor.closeCellEditor();
  }

  /**
   * Check if currently editing a table cell
   */
  isEditingCell(): boolean {
    return this.cellEditor.isEditingCell();
  }

  /**
   * Get active table ID
   */
  getActiveTableId(): ElementId | null {
    return this.activeTableId;
  }

  /**
   * Clear active table
   */
  clearActiveTable(): void {
    this.clearTableOverlay();
    this.closeCellEditor();
    this.contextMenuManager.closeContextMenu();
  }

  /**
   * Destroy table manager and cleanup resources
   */
  destroy(): void {
    this.clearActiveTable();
    
    this.overlayManager.destroy();
    this.contextMenuManager.destroy();
    this.cellEditor.destroy();
    
    this.tableNodes.clear();

    if (this.config.debug?.log) {
      console.info('[TableManager] Destroyed table manager');
    }
  }

  // Private helper methods

  /**
   * Set up table-specific event handlers
   */
  private setupTableEvents(tableId: ElementId, tableNode: Konva.Group): void {
    // Right-click context menu
    tableNode.on('contextmenu.table', (e) => {
      e.evt.preventDefault();
      this.showContextMenu(tableId, tableNode, e as any);
    });

    // Mouse leave to clear overlay (with delay)
    tableNode.on('mouseleave.table', () => {
      // Small delay to prevent flickering when moving between table and controls
      setTimeout(() => {
        if (this.activeTableId === tableId && !this.cellEditor.isEditingCell()) {
          // Only clear if mouse is not over controls
          const pointer = this.config.stage.getPointerPosition();
          if (pointer) {
            const overlayHit = this.overlayManager.getControlsGroup()?.getIntersection(pointer);
            if (!overlayHit) {
              this.clearTableOverlay();
            }
          }
        }
      }, 300);
    });

    // Double-click to edit cell
    tableNode.on('dblclick.table', (e) => {
      try {
        const element = this.config.storeAdapter.getElement(tableId);
        if (!element) return;

        const cellCoords = this.getCellCoordinatesFromEvent(tableNode, element, e);
        if (cellCoords) {
          this.openCellEditor(tableId, cellCoords.row, cellCoords.col);
        }
      } catch (error) {
        console.error('[TableManager] Error handling double-click:', error);
      }
    });
  }

  /**
   * Build table configuration from element
   */
  private buildTableConfig(element: CanvasElement): TableConfig {
    const tableEl = element as any;
    
    return {
      rows: Math.max(1, tableEl.rows || 1),
      cols: Math.max(1, tableEl.cols || 1),
      cellWidth: 100, // These will be calculated from actual table dimensions
      cellHeight: 40,
      padding: 8,
      enhancedTableData: tableEl.enhancedTableData || {
        cells: [],
        rows: [],
        columns: []
      }
    };
  }

  /**
   * Build action callbacks for table operations
   */
  private buildActionCallbacks(tableId: ElementId, tableNode: Konva.Group): TableActionCallbacks {
    return {
      addRow: (index: number) => this.addTableRow(tableId, index),
      deleteRow: (index: number) => this.deleteTableRow(tableId, index),
      addColumn: (index: number) => this.addTableColumn(tableId, index),
      deleteColumn: (index: number) => this.deleteTableColumn(tableId, index),
      editCell: (row: number, col: number) => this.openCellEditor(tableId, row, col),
      showContextMenu: (event) => this.showContextMenu(tableId, tableNode, event)
    };
  }

  /**
   * Show context menu for table
   */
  private showContextMenu(
    tableId: ElementId,
    tableNode: Konva.Group,
    event: Konva.KonvaEventObject<PointerEvent | MouseEvent>
  ): void {
    const actions = {
      addRowAbove: () => this.addTableRow(tableId, 0),
      addRowBelow: () => {
        const element = this.config.storeAdapter.getElement(tableId);
        const rows = element ? Math.max(1, (element as any).rows || 1) : 1;
        this.addTableRow(tableId, rows);
      },
      addColumnLeft: () => this.addTableColumn(tableId, 0),
      addColumnRight: () => {
        const element = this.config.storeAdapter.getElement(tableId);
        const cols = element ? Math.max(1, (element as any).cols || 1) : 1;
        this.addTableColumn(tableId, cols);
      },
      deleteTable: () => this.deleteTable(tableId)
    };

    this.contextMenuManager.showContextMenu(tableId, tableNode, event, actions);
  }

  /**
   * Add table row at index
   */
  private addTableRow(tableId: ElementId, index: number): void {
    if (this.config.debug?.log) {
      console.info('[TableManager] Adding row at index:', index);
    }

    try {
      if (this.config.storeAdapter.addTableRow) {
        this.config.storeAdapter.addTableRow(tableId, index);
      } else {
        // Fallback implementation
        const element = this.config.storeAdapter.getElement(tableId) as any;
        if (element) {
          const newRows = (element.rows || 1) + 1;
          const cells = this.cloneTableCells(element.enhancedTableData?.cells || [], newRows, element.cols || 1);
          
          this.config.storeAdapter.updateElement(tableId, {
            rows: newRows,
            enhancedTableData: { ...element.enhancedTableData, cells }
          });
        }
      }

      // Refresh overlay
      this.refreshTableAfterOperation(tableId);

    } catch (error) {
      console.error('[TableManager] Error adding table row:', error);
    }
  }

  /**
   * Delete table row at index
   */
  private deleteTableRow(tableId: ElementId, index: number): void {
    if (this.config.debug?.log) {
      console.info('[TableManager] Deleting row at index:', index);
    }

    try {
      if (this.config.storeAdapter.removeTableRow) {
        this.config.storeAdapter.removeTableRow(tableId, index);
      } else {
        // Fallback implementation
        const element = this.config.storeAdapter.getElement(tableId) as any;
        if (element && (element.rows || 1) > 1) {
          const newRows = Math.max(1, (element.rows || 1) - 1);
          const cells = this.cloneTableCells(element.enhancedTableData?.cells || [], newRows, element.cols || 1);
          
          this.config.storeAdapter.updateElement(tableId, {
            rows: newRows,
            enhancedTableData: { ...element.enhancedTableData, cells }
          });
        }
      }

      // Refresh overlay
      this.refreshTableAfterOperation(tableId);

    } catch (error) {
      console.error('[TableManager] Error deleting table row:', error);
    }
  }

  /**
   * Add table column at index
   */
  private addTableColumn(tableId: ElementId, index: number): void {
    if (this.config.debug?.log) {
      console.info('[TableManager] Adding column at index:', index);
    }

    try {
      if (this.config.storeAdapter.addTableColumn) {
        this.config.storeAdapter.addTableColumn(tableId, index);
      } else {
        // Fallback implementation
        const element = this.config.storeAdapter.getElement(tableId) as any;
        if (element) {
          const newCols = (element.cols || 1) + 1;
          const cells = this.cloneTableCells(element.enhancedTableData?.cells || [], element.rows || 1, newCols);
          
          this.config.storeAdapter.updateElement(tableId, {
            cols: newCols,
            enhancedTableData: { ...element.enhancedTableData, cells }
          });
        }
      }

      // Refresh overlay
      this.refreshTableAfterOperation(tableId);

    } catch (error) {
      console.error('[TableManager] Error adding table column:', error);
    }
  }

  /**
   * Delete table column at index
   */
  private deleteTableColumn(tableId: ElementId, index: number): void {
    if (this.config.debug?.log) {
      console.info('[TableManager] Deleting column at index:', index);
    }

    try {
      if (this.config.storeAdapter.removeTableColumn) {
        this.config.storeAdapter.removeTableColumn(tableId, index);
      } else {
        // Fallback implementation
        const element = this.config.storeAdapter.getElement(tableId) as any;
        if (element && (element.cols || 1) > 1) {
          const newCols = Math.max(1, (element.cols || 1) - 1);
          const cells = this.cloneTableCells(element.enhancedTableData?.cells || [], element.rows || 1, newCols);
          
          this.config.storeAdapter.updateElement(tableId, {
            cols: newCols,
            enhancedTableData: { ...element.enhancedTableData, cells }
          });
        }
      }

      // Refresh overlay
      this.refreshTableAfterOperation(tableId);

    } catch (error) {
      console.error('[TableManager] Error deleting table column:', error);
    }
  }

  /**
   * Delete entire table
   */
  private deleteTable(tableId: ElementId): void {
    if (this.config.debug?.log) {
      console.info('[TableManager] Deleting table:', tableId);
    }

    try {
      // Clear any active editing
      this.clearActiveTable();
      
      // Remove from store (implementation depends on store interface)
      // This would typically be handled by the parent renderer
      console.warn('[TableManager] Table deletion not implemented - should be handled by parent');

    } catch (error) {
      console.error('[TableManager] Error deleting table:', error);
    }
  }

  /**
   * Handle cell content update
   */
  private handleCellUpdate(tableId: ElementId, row: number, col: number, content: string): void {
    if (this.config.debug?.log) {
      console.info('[TableManager] Updating cell content:', { tableId, row, col, content });
    }

    try {
      const element = this.config.storeAdapter.getElement(tableId) as any;
      if (!element) return;

      // Update cell content in enhanced table data
      const cells = element.enhancedTableData?.cells || [];
      const updatedCells = this.cloneTableCells(cells, element.rows || 1, element.cols || 1);
      
      // Ensure row exists
      if (!updatedCells[row]) {
        updatedCells[row] = [];
      }
      
      // Update cell content
      updatedCells[row][col] = { 
        ...(updatedCells[row][col] || {}), 
        content 
      };

      // Update element in store
      this.config.storeAdapter.updateElement(tableId, {
        enhancedTableData: {
          ...element.enhancedTableData,
          cells: updatedCells
        }
      });

      // Schedule redraw
      if (this.config.scheduleDraw) {
        this.config.scheduleDraw('main');
      }

    } catch (error) {
      console.error('[TableManager] Error updating cell:', error);
    }
  }

  /**
   * Refresh table after operation
   */
  private refreshTableAfterOperation(tableId: ElementId): void {
    // Trigger table layout update if callback available
    if (this.operationCallbacks?.onLayoutTable) {
      const tableNode = this.tableNodes.get(tableId);
      const element = this.config.storeAdapter.getElement(tableId);
      
      if (tableNode && element) {
        this.operationCallbacks.onLayoutTable(tableId, tableNode, element);
      }
    }

    // Refresh transformer
    if (this.config.refreshTransformer) {
      this.config.refreshTransformer(tableId);
    }

    // Schedule redraw
    if (this.config.scheduleDraw) {
      this.config.scheduleDraw('main');
    }

    // Update overlay if active
    if (this.activeTableId === tableId) {
      setTimeout(() => {
        this.showTableOverlay(tableId);
      }, 50);
    }
  }

  /**
   * Calculate cell dimensions
   */
  private calculateCellDimensions(tableNode: Konva.Group, element: CanvasElement): CellDimensions {
    const tableEl = element as any;
    const rect = tableNode.getClientRect();
    
    const rows = Math.max(1, tableEl.rows || 1);
    const cols = Math.max(1, tableEl.cols || 1);
    
    return {
      cellWidth: rect.width / cols,
      cellHeight: rect.height / rows,
      padding: 8
    };
  }

  /**
   * Get cell content from element data
   */
  private getCellContent(element: CanvasElement, row: number, col: number): string {
    const tableEl = element as any;
    const cells = tableEl.enhancedTableData?.cells || [];
    
    if (cells[row] && cells[row][col]) {
      return cells[row][col].content || '';
    }
    
    return '';
  }

  /**
   * Get cell coordinates from click event
   */
  private getCellCoordinatesFromEvent(
    tableNode: Konva.Group, 
    element: CanvasElement, 
    event: Konva.KonvaEventObject<any>
  ): { row: number; col: number } | null {
    try {
      const stagePos = this.config.stage.getPointerPosition();
      if (!stagePos) return null;

      const local = (tableNode as any).getAbsoluteTransform().copy().invert().point(stagePos);
      const dimensions = this.calculateCellDimensions(tableNode, element);
      
      const col = Math.min(
        Math.max(1, (element as any).cols || 1) - 1, 
        Math.max(0, Math.floor(local.x / dimensions.cellWidth))
      );
      const row = Math.min(
        Math.max(1, (element as any).rows || 1) - 1, 
        Math.max(0, Math.floor(local.y / dimensions.cellHeight))
      );

      return { row, col };
    } catch (error) {
      console.warn('[TableManager] Error getting cell coordinates:', error);
      return null;
    }
  }

  /**
   * Clone table cells array with new dimensions
   */
  private cloneTableCells(
    cells: Array<Array<{ content: string; [key: string]: any }>>, 
    newRows: number, 
    newCols: number
  ): Array<Array<{ content: string; [key: string]: any }>> {
    const newCells: Array<Array<{ content: string; [key: string]: any }>> = [];
    
    for (let r = 0; r < newRows; r++) {
      const row: Array<{ content: string; [key: string]: any }> = [];
      for (let c = 0; c < newCols; c++) {
        if (cells[r] && cells[r][c]) {
          row[c] = { ...cells[r][c] };
        } else {
          row[c] = { content: '' };
        }
      }
      newCells[r] = row;
    }
    
    return newCells;
  }

  // Getter for overlay controls group (for event checking)
  private getControlsGroup(): Konva.Group | null {
    return (this.overlayManager as any).controlsGroup || null;
  }
}