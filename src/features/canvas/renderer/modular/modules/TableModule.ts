import type Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot, CanvasElement } from '../types';
import { TableElement, TableCell, EnhancedTableData, TableStyling } from '../../../types/enhanced.types';

/**
 * TableModule - Handles table element rendering and interaction in the modular canvas system
 *
 * Responsibilities:
 * - Render table structure (frame, grid lines, cell backgrounds, text content)
 * - Handle cell editing with DOM textarea overlays
 * - Manage table controls (add/remove rows/columns)
 * - Support context menus for table operations
 * - Maintain table overlay system for interactive controls
 */
export class TableModule implements RendererModule {
  private ctx!: ModuleContext;
  private nodeMap = new Map<string, Konva.Group>();
  private KonvaClass: typeof Konva | null = null;

  // Table overlay state for add/delete row/column controls
  private tableOverlay: {
    tableId: string;
    group: Konva.Group;
    controls: {
      addCol?: Konva.Group;
      addRow?: Konva.Group;
      delCol?: Konva.Group;
      delRow?: Konva.Group;
      hitTargets: Konva.Shape[];
    };
  } | null = null;

  // Table controls for selected tables
  private tableControlsGroup: Konva.Group | null = null;
  private tableControlsTargetId: string | null = null;

  // DOM overlay for cell editing
  private currentEditor?: HTMLTextAreaElement;
  private currentEditorWrapper?: HTMLDivElement;
  private currentEditingId: string | null = null;
  private currentEditingCell: { row: number; col: number } | null = null;

  async init(ctx: ModuleContext): Promise<void> {
    this.ctx = ctx;

    // Import Konva dynamically
    const KonvaModule = await import('konva');
    this.KonvaClass = KonvaModule.default;
  }

  sync(snapshot: CanvasSnapshot): void {
    if (!this.KonvaClass) return;

    const { main } = this.ctx.konva.getLayers();
    if (!main) return;

    // Track which tables are still present
    const currentTableIds = new Set<string>();

    // Process all table elements
    snapshot.elements.forEach((element, id) => {
      if (element.type === 'table') {
        currentTableIds.add(id);
        const tableElement = element as TableElement;

        let tableGroup = this.nodeMap.get(id);
        if (!tableGroup) {
          // Create new table
          tableGroup = this.createTable(tableElement);
          if (tableGroup) {
            this.nodeMap.set(id, tableGroup);
            main.add(tableGroup);
          }
        } else {
          // Update existing table
          this.updateTable(tableGroup, tableElement);
        }
      }
    });

    // Remove tables that no longer exist
    this.nodeMap.forEach((group, id) => {
      if (!currentTableIds.has(id)) {
        group.destroy();
        this.nodeMap.delete(id);

        // Clear table controls if this table was selected
        if (this.tableControlsTargetId === id) {
          this.clearTableControls();
        }
      }
    });

    // Update selection-based table controls
    this.updateTableControls(snapshot.selection);
  }

  private createTable(el: TableElement): Konva.Group | undefined {
    if (!this.KonvaClass) return undefined;

    const id = String(el.id);
    const w = Math.max(1, el.width || 200);
    const h = Math.max(1, el.height || 150);
    const rows = Math.max(1, el.rows || 1);
    const cols = Math.max(1, el.cols || 1);

    // Create main group with hit area
    const group = new this.KonvaClass.Group({
      id,
    });

    // Add hit area for selection
    const hitArea = new this.KonvaClass.Rect({
    });
    group.add(hitArea);

    // Frame (outer border)
    const frame = new this.KonvaClass.Rect({
    });
    group.add(frame);

    // Background rows group (for headers/alternate rows)
    const bgrows = new this.KonvaClass.Group({
    });
    group.add(bgrows);

    // Grid group (cell divider lines)
    const grid = new this.KonvaClass.Group({
    });
    group.add(grid);

    // Cells group (text content)
    const cells = new this.KonvaClass.Group({
    });
    group.add(cells);

    // Layout table content
    this.layoutTable(group, el);

    // Store metadata for overlay logic
    try {
      group.setAttr('__rows', rows);
      group.setAttr('__cols', cols);
      group.setAttr('__tableId', id);
    } catch (e) {
      console.warn('Failed to set table metadata:', e);
    }

    // Event handlers
    this.setupTableEventHandlers(group, el);

    return group;
  }

  private updateTable(group: Konva.Group, el: TableElement): void {
    const w = Math.max(1, el.width || 200);
    const h = Math.max(1, el.height || 150);

    // Update position and size
    group.position({ x: el.x || 0, y: el.y || 0 });
    group.width(w);
    group.height(h);

    // Update hit area
    const hitArea = group.findOne<Konva.Rect>('.hit-area');
    if (hitArea) {
      hitArea.width(w);
      hitArea.height(h);
    }

    // Update frame
    const frame = group.findOne<Konva.Rect>('.frame');
    if (frame) {
      frame.width(w);
      frame.height(h);
      frame.fill((el as any).fill || '#ffffff');
      frame.stroke(el.borderColor || '#d1d5db');
      frame.strokeWidth(el.borderWidth ?? 1);
      (frame as any).strokeScaleEnabled(false);
    }

    // Re-layout table content
    this.layoutTable(group, el);

    // Clear any existing overlays since layout changed
    this.clearTableOverlay();
  }

  private layoutTable(group: Konva.Group, el: TableElement): void {
    if (!this.KonvaClass) return;

    const rows = Math.max(1, el.rows || (el.enhancedTableData?.rows?.length || 1));
    const cols = Math.max(1, el.cols || (el.enhancedTableData?.columns?.length || 1));
    const w = Math.max(1, el.width || 200);
    const h = Math.max(1, el.height || 150);

    // Calculate cell dimensions
    const cellW = Math.max(1, Math.floor(w / cols));
    const cellH = Math.max(1, Math.floor(h / rows));

    const bgRowsGroup = group.findOne<Konva.Group>('.bgrows');
    const gridGroup = group.findOne<Konva.Group>('.grid');
    const cellsGroup = group.findOne<Konva.Group>('.cells');

    if (!bgRowsGroup || !gridGroup || !cellsGroup) return;

    // Clear existing content
    try {
      bgRowsGroup.destroyChildren();
      gridGroup.destroyChildren();
      cellsGroup.destroyChildren();
    } catch (e) {
      console.warn('Failed to clear table content:', e);
    }

    // Get styling
    const styling = el.enhancedTableData?.styling || {} as TableStyling;
    const headerBg = styling.headerBackgroundColor || '#f3f4f6';
    const altBg = styling.alternateRowColor || '#f9fafb';
    const stroke = el.borderColor || '#9ca3af';
    const strokeWidth = el.borderWidth ?? 1;

    // Draw row backgrounds (header + alternate rows)
    for (let r = 0; r < rows; r++) {
      const y = r * cellH;
      const fill = r === 0 ? headerBg : (r % 2 === 1 ? altBg : 'transparent');
      if (fill && fill !== 'transparent') {
        bgRowsGroup.add(new this.KonvaClass.Rect({
          y,
          fill,
        }));
      }
    }

    // Draw grid lines
    // Vertical lines
    for (let c = 1; c < cols; c++) {
      const x = Math.round(c * cellW);
      gridGroup.add(new this.KonvaClass.Line({
        stroke,
        strokeWidth,
      }));
    }

    // Horizontal lines
    for (let r = 1; r < rows; r++) {
      const y = Math.round(r * cellH);
      gridGroup.add(new this.KonvaClass.Line({
        stroke,
        strokeWidth,
      }));
    }

    // Fill cells with text content
    const data = el.enhancedTableData?.cells || el.tableData || [];
    const fontSize = styling.fontSize || (el as any).fontSize || 13;
    const fontFamily = styling.fontFamily || (el as any).fontFamily || 'Inter, system-ui, sans-serif';
    const textColor = styling.headerTextColor || (el as any).textColor || '#111827';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellData = Array.isArray(data) && data[r] && data[r][c] ? data[r][c] : null;
        const content = cellData?.content ?? cellData?.text ?? '';

        if (content) {
          const tx = new this.KonvaClass.Text({
            fontSize,
            fontFamily,
          });

          // Text alignment and wrapping
          (tx as any).wrap('word');
          (tx as any).align(cellData?.textAlign || 'center');
          (tx as any).verticalAlign(cellData?.verticalAlign || 'middle');
          (tx as any).lineHeight(1.25);

          cellsGroup.add(tx);
        }
      }
    }
  }

  private setupTableEventHandlers(group: Konva.Group, el: TableElement): void {
    // Right-click context menu
    group.on('contextmenu.table', (e) => {
      this.showTableContextMenu(group, el, e as any);
    });

    // Mouse leave - clear overlays
    group.on('mouseleave.table', () => {
      this.clearTableOverlay();
    });

    // Double-click for cell editing
    group.on('dblclick.table', (e) => {
      this.handleTableDoubleClick(group, el, e as any);
    });

    // Mouse move for hover effects and overlay updates
    group.on('mousemove.table', (e) => {
      this.updateTableOverlayForPointer(group, el);
    });
  }

  private showTableContextMenu(group: Konva.Group, el: TableElement, evt: Konva.KonvaEventObject<PointerEvent | MouseEvent>): void {
    // Implementation would show context menu for table operations
    // For now, just prevent default context menu
    evt.evt.preventDefault();
  }

  private handleTableDoubleClick(group: Konva.Group, el: TableElement, evt: Konva.KonvaEventObject<PointerEvent | MouseEvent>): void {
    const stage = this.ctx.konva.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert to table local coordinates
    const local = group.getAbsoluteTransform().copy().invert().point(pointer);

    const rows = Math.max(1, el.rows || 1);
    const cols = Math.max(1, el.cols || 1);
    const w = Math.max(1, el.width || 200);
    const h = Math.max(1, el.height || 150);

    const cellW = Math.floor(w / cols);
    const cellH = Math.floor(h / rows);

    // Determine which cell was clicked
    const col = Math.floor(local.x / cellW);
    const row = Math.floor(local.y / cellH);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      this.openCellEditor(group, el, row, col, { cellW, cellH });
    }
  }

  private openCellEditor(group: Konva.Group, el: TableElement, row: number, col: number, dims: { cellW: number; cellH: number }): void {
    const stage = this.ctx.konva.getStage();
    if (!stage) return;

    const container = stage.container();
    if (!container) return;

    // Close any existing editor
    this.closeCellEditor();

    // CRITICAL FIX: Use proper coordinate transformation for table cell editors
    // This matches the TextModule fix to handle layer-based panning coordinate system
    const containerRect = container.getBoundingClientRect();

    // Get table world position and convert to screen coordinates properly
    const snapshot = this.ctx.store.getSnapshot();
    const { viewport } = snapshot;

    // Convert table world coordinates to screen coordinates
    const tableScreenX = el.x * viewport.scale + viewport.x;
    const tableScreenY = el.y * viewport.scale + viewport.y;

    // Calculate cell position within the table (scaled)
    const cellOffsetX = col * dims.cellW * viewport.scale;
    const cellOffsetY = row * dims.cellH * viewport.scale;

    // Final DOM position
    const leftPx = containerRect.left + tableScreenX + cellOffsetX;
    const topPx = containerRect.top + tableScreenY + cellOffsetY;

    // Get current cell content
    const data = el.enhancedTableData?.cells || el.tableData || [];
    const cellData = Array.isArray(data) && data[row] && data[row][col] ? data[row][col] : null;
    const currentText = cellData?.content ?? cellData?.text ?? '';

    // Create editor wrapper with properly scaled dimensions
    this.currentEditorWrapper = document.createElement('div');
    const scaledCellW = dims.cellW * viewport.scale;
    const scaledCellH = dims.cellH * viewport.scale;
    this.currentEditorWrapper.style.cssText = `
      position: fixed;
      left: ${leftPx}px;
      top: ${topPx}px;
      width: ${scaledCellW}px;
      height: ${scaledCellH}px;
      z-index: 9999;
      pointer-events: auto;
      border: 2px solid #3B82F6;
      background: white;
    `;

    // Create textarea
    this.currentEditor = document.createElement('textarea');
    this.currentEditor.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      resize: none;
      padding: 4px;
      font-family: Inter, system-ui, sans-serif;
      font-size: 13px;
      background: white;
    `;

    this.currentEditor.value = currentText;
    this.currentEditorWrapper.appendChild(this.currentEditor);
    document.body.appendChild(this.currentEditorWrapper);

    // Track editing state
    this.currentEditingId = String(el.id);
    this.currentEditingCell = { row, col };

    // Focus and select all text
    this.currentEditor.focus();
    this.currentEditor.select();

    // Handle editor events
    this.currentEditor.addEventListener('blur', () => {
      this.commitCellEdit();
    });

    this.currentEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.commitCellEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeCellEditor();
      }
    });
  }

  private commitCellEdit(): void {
    if (!this.currentEditor || !this.currentEditingId || !this.currentEditingCell) {
      return;
    }

    const newText = this.currentEditor.value;
    const { row, col } = this.currentEditingCell;

    // Update cell content via store
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      if (store?.getState?.().updateTableCell) {
        store.getState().updateTableCell(this.currentEditingId, row, col, newText);
      }
    } catch (e) {
      console.warn('Failed to update table cell:', e);
    }

    this.closeCellEditor();
  }

  private closeCellEditor(): void {
    if (this.currentEditorWrapper) {
      document.body.removeChild(this.currentEditorWrapper);
      this.currentEditorWrapper = undefined;
    }

    this.currentEditor = undefined;
    this.currentEditingId = null;
    this.currentEditingCell = null;
  }

  private updateTableOverlayForPointer(group: Konva.Group, el: TableElement): void {
    // Implementation would update overlay controls based on pointer position
    // This would show add/remove row/column controls when hovering near edges
  }

  private clearTableOverlay(): void {
    if (this.tableOverlay) {
      try {
        this.tableOverlay.group.destroy();
      } catch (e) {
        console.warn('Failed to destroy table overlay:', e);
      }
      this.tableOverlay = null;
    }
  }

  private updateTableControls(selection: Set<string>): void {
    // Show table controls when a single table is selected
    const selectedIds = Array.from(selection);

    if (selectedIds.length === 1) {
      const tableGroup = this.nodeMap.get(selectedIds[0]);
      if (tableGroup && tableGroup.name() === 'table') {
        this.renderTableControls(selectedIds[0]);
        return;
      }
    }

    // Clear controls if no table selected or multiple items selected
    this.clearTableControls();
  }

  private renderTableControls(tableId: string): void {
    if (!this.KonvaClass) return;

    const { overlay } = this.ctx.konva.getLayers();
    if (!overlay) return;

    const tableGroup = this.nodeMap.get(tableId);
    if (!tableGroup || tableGroup.name() !== 'table') return;

    // Create or reuse table controls group
    if (!this.tableControlsGroup) {
      this.tableControlsGroup = new this.KonvaClass.Group({
      });
      overlay.add(this.tableControlsGroup);
    } else {
      this.tableControlsGroup.visible(true);
      this.tableControlsGroup.destroyChildren();
    }

    this.tableControlsTargetId = tableId;

    // Get table dimensions and position
    const tableRect = (tableGroup as any).getClientRect?.({ skipTransform: false }) ?? tableGroup.getClientRect();

    // Add simple control indicators (placeholder implementation)
    const controlSize = 20;
    const controlColor = '#3B82F6';

    // Add column control (right side)
    const addColControl = new this.KonvaClass.Rect({
    });

    const addColText = new this.KonvaClass.Text({
    });

    // Add row control (bottom)
    const addRowControl = new this.KonvaClass.Rect({
    });

    const addRowText = new this.KonvaClass.Text({
    });

    // Add event handlers
    addColControl.on('click.table-control', () => {
      try {
        const store = (window as any).__UNIFIED_CANVAS_STORE__;
        if (store?.getState?.().addTableColumn) {
          store.getState().addTableColumn(tableId, -1); // Add at end
        }
      } catch (e) {
        console.warn('Failed to add table column:', e);
      }
    });

    addRowControl.on('click.table-control', () => {
      try {
        const store = (window as any).__UNIFIED_CANVAS_STORE__;
        if (store?.getState?.().addTableRow) {
          store.getState().addTableRow(tableId, -1); // Add at end
        }
      } catch (e) {
        console.warn('Failed to add table row:', e);
      }
    });

    this.tableControlsGroup.add(addColControl);
    this.tableControlsGroup.add(addColText);
    this.tableControlsGroup.add(addRowControl);
    this.tableControlsGroup.add(addRowText);
  }

  private clearTableControls(): void {
    if (this.tableControlsGroup) {
      try {
        this.tableControlsGroup.destroyChildren();
        this.tableControlsGroup.visible(false);
      } catch (e) {
        console.warn('Failed to clear table controls:', e);
      }
    }
    this.tableControlsTargetId = null;
  }

  destroy(): void {
    // Close any open cell editor
    this.closeCellEditor();

    // Clear overlays
    this.clearTableOverlay();
    this.clearTableControls();

    // Clean up all table nodes
    this.nodeMap.forEach((group) => {
      try {
        group.destroy();
      } catch (e) {
        console.warn('Failed to destroy table group:', e);
      }
    });
    this.nodeMap.clear();

    // Clean up Konva reference
    this.KonvaClass = null;
  }
}