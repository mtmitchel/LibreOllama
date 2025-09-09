/**
 * Table Overlay Management System
 * Manages interactive table controls, cell editing, and overlay rendering
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import Konva from 'konva';
import type { ElementId, CanvasElement } from '../../types/enhanced.types';

/**
 * Table configuration data
 */
export interface TableConfig {
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  padding: number;
  enhancedTableData?: {
    cells?: Array<Array<{ content: string; [key: string]: any }>>;
    rows?: Array<{ height?: number; [key: string]: any }>;
    columns?: Array<{ width?: number; [key: string]: any }>;
  };
}

/**
 * Table overlay styles and dimensions
 */
export interface TableOverlayStyles {
  edgeWidth: number;
  buttonSize: number;
  backgroundColor: string;
  borderColor: string;
  hoverColor: string;
  deleteColor: string;
}

/**
 * Table action callbacks
 */
export interface TableActionCallbacks {
  addRow: (index: number) => void;
  deleteRow: (index: number) => void;
  addColumn: (index: number) => void;
  deleteColumn: (index: number) => void;
  editCell: (row: number, col: number) => void;
  showContextMenu: (event: Konva.KonvaEventObject<PointerEvent | MouseEvent>) => void;
}

/**
 * Table overlay button configuration
 */
interface TableOverlayButton {
  x: number;
  y: number;
  label: string;
  onClick: () => void;
  style: 'add' | 'delete';
}

/**
 * Table Overlay Manager
 * Manages interactive overlay controls for table elements
 */
export class TableOverlayManager {
  private overlayLayer: Konva.Layer;
  private controlsGroup: Konva.Group | null = null;
  private activeTableId: ElementId | null = null;
  private styles: TableOverlayStyles;

  constructor(overlayLayer: Konva.Layer, styles: Partial<TableOverlayStyles> = {}) {
    this.overlayLayer = overlayLayer;
    this.styles = {
      edgeWidth: 16,
      buttonSize: 18,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      hoverColor: '#3b82f6',
      deleteColor: '#ef4444',
      ...styles
    };
  }

  /**
   * Render interactive table overlay controls
   * @param tableId - Table element ID
   * @param tableNode - Konva table node
   * @param config - Table configuration
   * @param callbacks - Action callbacks
   */
  renderTableControls(
    tableId: ElementId,
    tableNode: Konva.Group,
    config: TableConfig,
    callbacks: TableActionCallbacks
  ): void {
    console.info('[TableOverlay] Rendering controls for table', tableId);

    // Clear existing controls
    this.clearTableOverlay();

    // Create or reuse controls group
    if (!this.controlsGroup) {
      this.controlsGroup = new Konva.Group({
        name: 'table-controls',
        listening: true,
        visible: true
      });
      this.overlayLayer.add(this.controlsGroup);
    } else {
      this.controlsGroup.visible(true);
      this.controlsGroup.destroyChildren();
    }

    this.activeTableId = tableId;

    try {
      // Get table bounds for positioning controls
      const rect = this.getTableBounds(tableNode);
      
      // Calculate cell dimensions
      const colWidth = rect.width / config.cols;
      const rowHeight = rect.height / config.rows;

      console.debug('[TableOverlay] Table bounds:', rect);
      console.debug('[TableOverlay] Cell dimensions:', { colWidth, rowHeight });

      // Render control zones
      this.renderColumnControls(rect, config, colWidth, callbacks);
      this.renderRowControls(rect, config, rowHeight, callbacks);

      // Update layer
      this.overlayLayer.batchDraw();
    } catch (error) {
      console.warn('[TableOverlay] Error rendering table controls:', error);
      // Keep the table ID active even if rendering fails
      this.overlayLayer.batchDraw();
    }
  }

  /**
   * Clear table overlay controls
   */
  clearTableOverlay(): void {
    if (!this.controlsGroup) return;

    console.debug('[TableOverlay] Clearing overlay controls');

    try {
      this.controlsGroup.destroyChildren();
      this.controlsGroup.visible(false);
    } catch (error) {
      console.warn('[TableOverlay] Error clearing overlay:', error);
    }

    this.activeTableId = null;
    this.overlayLayer.batchDraw();
  }

  /**
   * Get active table ID
   */
  getActiveTableId(): ElementId | null {
    return this.activeTableId;
  }

  /**
   * Check if overlay is active for a table
   */
  isActiveForTable(tableId: ElementId): boolean {
    return this.activeTableId === tableId;
  }

  /**
   * Update overlay position when table moves
   */
  updateOverlayPosition(
    tableId: ElementId,
    tableNode: Konva.Group,
    config: TableConfig,
    callbacks: TableActionCallbacks
  ): void {
    if (!this.isActiveForTable(tableId)) return;
    
    // Re-render controls with updated position
    this.renderTableControls(tableId, tableNode, config, callbacks);
  }

  /**
   * Destroy overlay and cleanup resources
   */
  destroy(): void {
    this.clearTableOverlay();
    
    if (this.controlsGroup) {
      try {
        this.controlsGroup.destroy();
      } catch (error) {
        console.warn('[TableOverlay] Error destroying controls group:', error);
      }
      this.controlsGroup = null;
    }
  }

  // Private helper methods

  /**
   * Get table node bounds
   */
  private getTableBounds(tableNode: Konva.Group): { x: number; y: number; width: number; height: number } {
    try {
      // Try client rect first (includes transforms)
      const clientRect = (tableNode as any).getClientRect?.({ skipTransform: false });
      if (clientRect) {
        return {
          x: clientRect.x,
          y: clientRect.y,
          width: clientRect.width,
          height: clientRect.height
        };
      }

      // Fallback to basic bounds
      const rect = tableNode.getClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      };
    } catch (error) {
      console.warn('[TableOverlay] Error getting table bounds:', error);
      return { x: 0, y: 0, width: 100, height: 100 };
    }
  }

  /**
   * Render column add/delete controls
   */
  private renderColumnControls(
    rect: { x: number; y: number; width: number; height: number },
    config: TableConfig,
    colWidth: number,
    callbacks: TableActionCallbacks
  ): void {
    const { edgeWidth } = this.styles;

    // Column add zones (between columns and at edges)
    for (let c = 0; c <= config.cols; c++) {
      const x = rect.x + Math.round(c * colWidth);
      
      const zone = new Konva.Rect({
        x: x - edgeWidth / 2,
        y: rect.y - edgeWidth,
        width: edgeWidth,
        height: rect.height + edgeWidth * 2,
        opacity: 0,
        listening: true,
        name: `hover-col-add-${c}`
      });

      const buttonX = x - 9;
      const buttonY = rect.y - 22;

      this.createHoverButton(zone, {
        x: buttonX,
        y: buttonY,
        label: '+',
        onClick: () => callbacks.addColumn(c),
        style: 'add'
      });

      this.controlsGroup!.add(zone);
    }

    // Column delete zones (if more than 1 column)
    if (config.cols > 1) {
      for (let c = 0; c < config.cols; c++) {
        const x = rect.x + c * colWidth;
        const rowHeight = rect.height / config.rows;
        
        const zone = new Konva.Rect({
          x,
          y: rect.y,
          width: colWidth,
          height: Math.max(20, Math.min(40, rowHeight)),
          opacity: 0,
          listening: true,
          name: `hover-col-delete-${c}`
        });

        const buttonX = x + colWidth / 2 - 6;
        const buttonY = rect.y - 22;

        this.createHoverButton(zone, {
          x: buttonX,
          y: buttonY,
          label: '×',
          onClick: () => callbacks.deleteColumn(c),
          style: 'delete'
        });

        this.controlsGroup!.add(zone);
      }
    }
  }

  /**
   * Render row add/delete controls
   */
  private renderRowControls(
    rect: { x: number; y: number; width: number; height: number },
    config: TableConfig,
    rowHeight: number,
    callbacks: TableActionCallbacks
  ): void {
    const { edgeWidth } = this.styles;

    // Row add zones (between rows and at edges)
    for (let r = 0; r <= config.rows; r++) {
      const y = rect.y + Math.round(r * rowHeight);
      
      const zone = new Konva.Rect({
        x: rect.x - edgeWidth,
        y: y - edgeWidth / 2,
        width: rect.width + edgeWidth * 2,
        height: edgeWidth,
        opacity: 0,
        listening: true,
        name: `hover-row-add-${r}`
      });

      const buttonX = rect.x - 22;
      const buttonY = y - 9;

      this.createHoverButton(zone, {
        x: buttonX,
        y: buttonY,
        label: '+',
        onClick: () => callbacks.addRow(r),
        style: 'add'
      });

      this.controlsGroup!.add(zone);
    }

    // Row delete zones (if more than 1 row)
    if (config.rows > 1) {
      for (let r = 0; r < config.rows; r++) {
        const y = rect.y + r * rowHeight;
        const colWidth = rect.width / config.cols;
        const gutterWidth = Math.max(20, Math.min(40, colWidth / 3));
        
        const zone = new Konva.Rect({
          x: rect.x - gutterWidth,
          y,
          width: gutterWidth,
          height: rowHeight,
          opacity: 0,
          listening: true,
          name: `hover-row-delete-${r}`
        });

        const buttonX = rect.x - 22;
        const buttonY = y + rowHeight / 2 - 9;

        this.createHoverButton(zone, {
          x: buttonX,
          y: buttonY,
          label: '×',
          onClick: () => callbacks.deleteRow(r),
          style: 'delete'
        });

        this.controlsGroup!.add(zone);
      }
    }
  }

  /**
   * Create hover button that appears on zone hover
   */
  private createHoverButton(zone: Konva.Rect, button: TableOverlayButton): void {
    let buttonGroup: Konva.Group | null = null;

    const showButton = () => {
      if (buttonGroup) return; // Already showing

      buttonGroup = this.createButtonGroup(button);
      this.controlsGroup!.add(buttonGroup);
      this.overlayLayer.batchDraw();
    };

    const hideButton = () => {
      if (!buttonGroup) return; // Already hidden

      try {
        buttonGroup.destroy();
      } catch (error) {
        console.warn('[TableOverlay] Error destroying button:', error);
      }
      
      buttonGroup = null;
      this.overlayLayer.batchDraw();
    };

    // Set up hover events
    zone.on('mouseenter', showButton);
    zone.on('mouseleave', hideButton);

    // Handle cursor changes
    zone.on('mouseenter', () => {
      try {
        const container = this.overlayLayer.getStage()?.container();
        if (container) container.style.cursor = 'pointer';
      } catch (error) {
        console.warn('[TableOverlay] Error setting cursor:', error);
      }
    });

    zone.on('mouseleave', () => {
      try {
        const container = this.overlayLayer.getStage()?.container();
        if (container) container.style.cursor = '';
      } catch (error) {
        console.warn('[TableOverlay] Error resetting cursor:', error);
      }
    });
  }

  /**
   * Create button group with styling
   */
  private createButtonGroup(button: TableOverlayButton): Konva.Group {
    const group = new Konva.Group({
      x: button.x,
      y: button.y,
      listening: true
    });

    // Button background
    const background = new Konva.Rect({
      x: -9,
      y: -9,
      width: this.styles.buttonSize,
      height: this.styles.buttonSize,
      fill: this.styles.backgroundColor,
      stroke: button.style === 'add' ? this.styles.hoverColor : this.styles.deleteColor,
      strokeWidth: 1,
      cornerRadius: 3,
      listening: true
    });

    // Button text
    const text = new Konva.Text({
      x: -9,
      y: -9,
      width: this.styles.buttonSize,
      height: this.styles.buttonSize,
      text: button.label,
      fontSize: 12,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: button.style === 'add' ? this.styles.hoverColor : this.styles.deleteColor,
      align: 'center',
      verticalAlign: 'middle',
      listening: false
    });

    // Hit area for better click detection
    const hitArea = new Konva.Rect({
      x: -12,
      y: -12,
      width: 24,
      height: 24,
      fill: 'rgba(0,0,0,0.001)',
      listening: true,
      name: 'hit-area'
    });

    group.add(background, text, hitArea);

    // Handle click event
    group.on('click', (e) => {
      e.cancelBubble = true;
      button.onClick();
    });

    // Hover effects
    group.on('mouseenter', () => {
      background.fill(button.style === 'add' ? this.styles.hoverColor : this.styles.deleteColor);
      text.fill(this.styles.backgroundColor);
      this.overlayLayer.batchDraw();
    });

    group.on('mouseleave', () => {
      background.fill(this.styles.backgroundColor);
      text.fill(button.style === 'add' ? this.styles.hoverColor : this.styles.deleteColor);
      this.overlayLayer.batchDraw();
    });

    return group;
  }
}

/**
 * Table Context Menu Manager
 * Handles right-click context menu for table operations
 */
export class TableContextMenuManager {
  private stage: Konva.Stage;
  private activeMenu: HTMLElement | null = null;

  constructor(stage: Konva.Stage) {
    this.stage = stage;
  }

  /**
   * Show table context menu
   */
  showContextMenu(
    tableId: ElementId,
    tableNode: Konva.Group,
    event: Konva.KonvaEventObject<PointerEvent | MouseEvent>,
    actions: {
      addRowAbove: () => void;
      addRowBelow: () => void;
      addColumnLeft: () => void;
      addColumnRight: () => void;
      deleteTable: () => void;
    }
  ): void {
    event.evt.preventDefault();
    this.closeContextMenu();

    console.info('[TableContextMenu] Showing context menu for table', tableId);

    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;

    this.activeMenu = this.createContextMenuDOM(pointer, actions);
    document.body.appendChild(this.activeMenu);

    // Close on outside click
    const closeHandler = (e: MouseEvent) => {
      if (!this.activeMenu?.contains(e.target as Node)) {
        this.closeContextMenu();
        document.removeEventListener('click', closeHandler);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeHandler);
    }, 0);
  }

  /**
   * Close active context menu
   */
  closeContextMenu(): void {
    if (this.activeMenu) {
      try {
        this.activeMenu.remove();
      } catch (error) {
        console.warn('[TableContextMenu] Error removing menu:', error);
      }
      this.activeMenu = null;
    }
  }

  /**
   * Destroy context menu manager
   */
  destroy(): void {
    this.closeContextMenu();
  }

  // Private helper methods

  /**
   * Create context menu DOM element
   */
  private createContextMenuDOM(
    pointer: { x: number; y: number },
    actions: {
      addRowAbove: () => void;
      addRowBelow: () => void;
      addColumnLeft: () => void;
      addColumnRight: () => void;
      deleteTable: () => void;
    }
  ): HTMLElement {
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: fixed;
      left: ${pointer.x}px;
      top: ${pointer.y}px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      font-family: Inter, system-ui, sans-serif;
      font-size: 14px;
      min-width: 160px;
      padding: 4px 0;
    `;

    const menuItems = [
      { label: 'Add Row Above', action: actions.addRowAbove },
      { label: 'Add Row Below', action: actions.addRowBelow },
      { label: '---', action: null },
      { label: 'Add Column Left', action: actions.addColumnLeft },
      { label: 'Add Column Right', action: actions.addColumnRight },
      { label: '---', action: null },
      { label: 'Delete Table', action: actions.deleteTable, dangerous: true }
    ];

    menuItems.forEach(item => {
      if (item.label === '---') {
        const divider = document.createElement('div');
        divider.style.cssText = `
          height: 1px;
          background: #e5e7eb;
          margin: 4px 0;
        `;
        menu.appendChild(divider);
        return;
      }

      const menuItem = document.createElement('div');
      menuItem.textContent = item.label;
      menuItem.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        color: ${item.dangerous ? '#ef4444' : '#374151'};
        transition: background-color 0.15s;
      `;

      menuItem.onmouseenter = () => {
        menuItem.style.backgroundColor = '#f3f4f6';
      };

      menuItem.onmouseleave = () => {
        menuItem.style.backgroundColor = '';
      };

      menuItem.onclick = () => {
        if (item.action) {
          item.action();
          this.closeContextMenu();
        }
      };

      menu.appendChild(menuItem);
    });

    return menu;
  }
}