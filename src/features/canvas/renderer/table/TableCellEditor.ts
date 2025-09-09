/**
 * Table Cell Editor System
 * Handles individual table cell editing with DOM overlay
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import type Konva from 'konva';
import type { ElementId, CanvasElement } from '../../types/enhanced.types';
import { DOMOverlayManager, type OverlayStyles } from '../overlay/DOMOverlayManager';

/**
 * Table cell editing configuration
 */
export interface TableCellEditorConfig {
  stage: Konva.Stage;
  updateCellCallback: (tableId: ElementId, row: number, col: number, content: string) => void;
  scheduleDraw?: (layer: 'main' | 'overlay' | 'preview') => void;
  debug?: {
    log?: boolean;
  };
}

/**
 * Cell editing session data
 */
interface CellEditingSession {
  tableId: ElementId;
  tableNode: Konva.Group;
  row: number;
  col: number;
  cellBounds: { x: number; y: number; width: number; height: number };
  textElement: HTMLElement;
  wrapperElement: HTMLElement;
  originalContent: string;
}

/**
 * Cell dimensions for positioning
 */
export interface CellDimensions {
  cellWidth: number;
  cellHeight: number;
  padding: number;
}

/**
 * Table Cell Editor
 * Manages DOM overlay editing for individual table cells
 */
export class TableCellEditor {
  private config: TableCellEditorConfig;
  private overlayManager: DOMOverlayManager;
  private currentSession: CellEditingSession | null = null;

  constructor(config: TableCellEditorConfig) {
    this.config = config;
    
    try {
      this.overlayManager = new DOMOverlayManager(config.stage.container());
    } catch (error) {
      console.error('[TableCellEditor] Failed to initialize overlay manager:', error);
      throw error;
    }
  }

  /**
   * Open cell editor for specific table cell
   * @param tableId - Table element ID
   * @param tableNode - Konva table node
   * @param row - Row index
   * @param col - Column index
   * @param dimensions - Cell dimensions
   * @param initialContent - Initial cell content
   */
  async openCellEditor(
    tableId: ElementId,
    tableNode: Konva.Group,
    row: number,
    col: number,
    dimensions: CellDimensions,
    initialContent: string = ''
  ): Promise<void> {
    // Close any existing editor
    this.closeCellEditor();

    if (this.config.debug?.log) {
      console.info('[TableCellEditor] Opening cell editor:', { tableId, row, col });
    }

    try {
      // Calculate cell position and bounds
      const cellBounds = this.calculateCellBounds(tableNode, row, col, dimensions);
      
      // Create DOM overlay for cell editing
      const textElement = this.overlayManager.createTextOverlay(
        false, // Use textarea for table cells
        initialContent,
        this.buildCellEditorStyles(dimensions)
      );

      // Position the overlay
      this.overlayManager.updateOverlayPosition(
        textElement,
        cellBounds.x,
        cellBounds.y,
        cellBounds.width,
        cellBounds.height
      );

      // Create editing session
      const session: CellEditingSession = {
        tableId,
        tableNode,
        row,
        col,
        cellBounds,
        textElement,
        wrapperElement: textElement.parentElement!,
        originalContent: initialContent
      };

      // Set up cell editing events
      this.setupCellEditingEvents(session);

      // Focus the editor
      await this.focusEditor(textElement);

      // Store session
      this.currentSession = session;

      if (this.config.debug?.log) {
        console.info('[TableCellEditor] Cell editor opened successfully');
      }

    } catch (error) {
      console.error('[TableCellEditor] Failed to open cell editor:', error);
      this.closeCellEditor();
      throw error;
    }
  }

  /**
   * Close current cell editor
   */
  closeCellEditor(): void {
    if (!this.currentSession) return;

    if (this.config.debug?.log) {
      console.info('[TableCellEditor] Closing cell editor');
    }

    try {
      // Remove the DOM overlay
      this.overlayManager.removeOverlay(this.currentSession.textElement);

      // Clear session
      this.currentSession = null;

    } catch (error) {
      console.error('[TableCellEditor] Error closing cell editor:', error);
    }
  }

  /**
   * Commit current cell edit
   */
  commitCellEdit(): void {
    if (!this.currentSession) return;

    const session = this.currentSession;
    
    if (this.config.debug?.log) {
      console.info('[TableCellEditor] Committing cell edit:', { 
        tableId: session.tableId, 
        row: session.row, 
        col: session.col 
      });
    }

    try {
      // Get final content
      const finalContent = this.getCellEditorValue(session.textElement);

      // Update the cell via callback
      this.config.updateCellCallback(
        session.tableId,
        session.row,
        session.col,
        finalContent
      );

      // Schedule redraw
      if (this.config.scheduleDraw) {
        this.config.scheduleDraw('main');
      }

    } catch (error) {
      console.error('[TableCellEditor] Error committing cell edit:', error);
    } finally {
      this.closeCellEditor();
    }
  }

  /**
   * Cancel current cell edit
   */
  cancelCellEdit(): void {
    if (!this.currentSession) return;

    if (this.config.debug?.log) {
      console.info('[TableCellEditor] Canceling cell edit');
    }

    // Simply close without saving changes
    this.closeCellEditor();
  }

  /**
   * Check if currently editing a cell
   */
  isEditingCell(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Get current editing session info
   */
  getCurrentEditingInfo(): { tableId: ElementId; row: number; col: number } | null {
    if (!this.currentSession) return null;
    
    return {
      tableId: this.currentSession.tableId,
      row: this.currentSession.row,
      col: this.currentSession.col
    };
  }

  /**
   * Destroy cell editor and cleanup resources
   */
  destroy(): void {
    this.closeCellEditor();
    this.overlayManager.cleanup();
  }

  // Private helper methods

  /**
   * Calculate cell bounds for positioning
   */
  private calculateCellBounds(
    tableNode: Konva.Group,
    row: number,
    col: number,
    dimensions: CellDimensions
  ): { x: number; y: number; width: number; height: number } {
    try {
      // Get table bounds
      const tableRect = (tableNode as any).getClientRect?.({ skipTransform: false }) 
        ?? tableNode.getClientRect();
      
      // Get stage container bounds for absolute positioning
      const containerRect = this.config.stage.container().getBoundingClientRect();

      // Calculate cell position within table
      const cellX = col * dimensions.cellWidth;
      const cellY = row * dimensions.cellHeight;

      // Convert to absolute screen coordinates
      const absoluteX = containerRect.left + tableRect.x + cellX + dimensions.padding;
      const absoluteY = containerRect.top + tableRect.y + cellY + dimensions.padding;

      // Calculate cell content area
      const contentWidth = dimensions.cellWidth - (dimensions.padding * 2);
      const contentHeight = dimensions.cellHeight - (dimensions.padding * 2);

      return {
        x: Math.round(absoluteX),
        y: Math.round(absoluteY),
        width: Math.max(10, Math.round(contentWidth)),
        height: Math.max(10, Math.round(contentHeight))
      };

    } catch (error) {
      console.warn('[TableCellEditor] Error calculating cell bounds:', error);
      return { x: 0, y: 0, width: 100, height: 30 };
    }
  }

  /**
   * Build overlay styles for cell editor
   */
  private buildCellEditorStyles(dimensions: CellDimensions): OverlayStyles {
    return {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      lineHeight: '1.4',
      background: '#ffffff',
      border: '2px solid #3b82f6',
      borderRadius: '2px',
      padding: '2px 4px',
      margin: '0',
      outline: 'none',
      resize: 'none',
      overflow: 'hidden',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      zIndex: '1000'
    };
  }

  /**
   * Set up cell editing event handlers
   */
  private setupCellEditingEvents(session: CellEditingSession): void {
    const textElement = session.textElement;

    // Handle Enter key to commit
    textElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.commitCellEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelCellEdit();
      }
    });

    // Handle blur to commit
    textElement.addEventListener('blur', () => {
      // Small delay to allow for focus to move to other elements
      setTimeout(() => {
        if (this.currentSession === session) {
          this.commitCellEdit();
        }
      }, 100);
    });

    // Handle clicks outside to commit
    const handleOutsideClick = (e: MouseEvent) => {
      if (!session.wrapperElement.contains(e.target as Node) &&
          !session.tableNode.getStage()?.container().contains(e.target as Node)) {
        this.commitCellEdit();
        document.removeEventListener('mousedown', handleOutsideClick);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    // Store cleanup for session
    (session as any).__cleanup = () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }

  /**
   * Focus the cell editor with retry mechanism
   */
  private async focusEditor(textElement: HTMLElement): Promise<void> {
    const tryFocus = (attempt: number = 0): Promise<void> => {
      return new Promise((resolve) => {
        try {
          textElement.focus();
          
          // Select all text for easy replacement
          if (textElement instanceof HTMLTextAreaElement) {
            textElement.setSelectionRange(0, textElement.value.length);
          }
          
          resolve();
        } catch (error) {
          if (attempt < 3) {
            setTimeout(() => {
              tryFocus(attempt + 1).then(resolve);
            }, 50);
          } else {
            console.warn('[TableCellEditor] Failed to focus editor:', error);
            resolve();
          }
        }
      });
    };

    return tryFocus();
  }

  /**
   * Get current cell editor value
   */
  private getCellEditorValue(textElement: HTMLElement): string {
    if (textElement instanceof HTMLTextAreaElement) {
      return textElement.value;
    } else if (textElement instanceof HTMLDivElement) {
      return textElement.innerText || '';
    }
    return '';
  }
}

/**
 * Table Cell Navigation Manager
 * Handles keyboard navigation between table cells
 */
export class TableCellNavigationManager {
  private cellEditor: TableCellEditor;
  private currentTable: { tableId: ElementId; rows: number; cols: number } | null = null;

  constructor(cellEditor: TableCellEditor) {
    this.cellEditor = cellEditor;
  }

  /**
   * Set current table for navigation
   */
  setCurrentTable(tableId: ElementId, rows: number, cols: number): void {
    this.currentTable = { tableId, rows, cols };
  }

  /**
   * Navigate to adjacent cell
   */
  navigateToCell(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    if (!this.currentTable || !this.cellEditor.isEditingCell()) {
      return false;
    }

    const editingInfo = this.cellEditor.getCurrentEditingInfo();
    if (!editingInfo || editingInfo.tableId !== this.currentTable.tableId) {
      return false;
    }

    // Calculate target cell
    let targetRow = editingInfo.row;
    let targetCol = editingInfo.col;

    switch (direction) {
      case 'up':
        targetRow = Math.max(0, targetRow - 1);
        break;
      case 'down':
        targetRow = Math.min(this.currentTable.rows - 1, targetRow + 1);
        break;
      case 'left':
        targetCol = Math.max(0, targetCol - 1);
        break;
      case 'right':
        targetCol = Math.min(this.currentTable.cols - 1, targetCol + 1);
        break;
    }

    // Check if actually moved
    if (targetRow === editingInfo.row && targetCol === editingInfo.col) {
      return false;
    }

    console.debug('[TableCellNavigation] Navigating from cell', 
      `(${editingInfo.row},${editingInfo.col})`, 'to', `(${targetRow},${targetCol})`);

    // Commit current edit and move to new cell
    this.cellEditor.commitCellEdit();

    // TODO: Trigger opening of new cell editor
    // This would require coordination with the table overlay manager
    // For now, we just commit and let the user click the new cell

    return true;
  }

  /**
   * Clear current table navigation context
   */
  clearCurrentTable(): void {
    this.currentTable = null;
  }
}