import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { ElementId, TableElement } from '../types/enhanced.types';

// Mock the CanvasRendererV2
const mockRefreshTransformer = vi.fn();
(window as any).__CANVAS_RENDERER_V2__ = {
  refreshTransformer: mockRefreshTransformer
};

describe('Table Transformer Refresh', () => {
  beforeEach(() => {
    // Reset the store and mocks
    useUnifiedCanvasStore.getState().clearAllElements();
    mockRefreshTransformer.mockClear();
    
    // Setup the refreshTransformer method on the store
    const store = useUnifiedCanvasStore.getState();
    (store as any).refreshTransformer = mockRefreshTransformer;
  });

  it('should refresh transformer when adding table row', async () => {
    const store = useUnifiedCanvasStore.getState();
    
    // Create a test table
    const tableId = 'test-table-1' as ElementId;
    const table: TableElement = {
      id: tableId,
      type: 'table',
      x: 100,
      y: 100,
      width: 240,
      height: 80,
      rows: 2,
      cols: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLocked: false,
      isHidden: false
    };
    
    store.addElement(table);
    
    // Clear any calls from element creation
    mockRefreshTransformer.mockClear();
    
    // Add a row to trigger transformer refresh
    store.addTableRow(tableId);
    
    // Wait for the setTimeout in the addTableRow implementation
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 50); // Wait longer to ensure timeout completes
    });
    
    // Verify transformer refresh was called with the table ID
    expect(mockRefreshTransformer).toHaveBeenCalledWith(tableId);
  });

  it('should refresh transformer when removing table row', async () => {
    const store = useUnifiedCanvasStore.getState();
    
    // Create a test table with 3 rows so we can remove one
    const tableId = 'test-table-2' as ElementId;
    const table: TableElement = {
      id: tableId,
      type: 'table',
      x: 100,
      y: 100,
      width: 240,
      height: 120,
      rows: 3,
      cols: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLocked: false,
      isHidden: false
    };
    
    store.addElement(table);
    mockRefreshTransformer.mockClear();
    
    // Remove a row
    store.removeTableRow(tableId, 1);
    
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });
    
    expect(mockRefreshTransformer).toHaveBeenCalledWith(tableId);
  });

  it('should refresh transformer when adding table column', async () => {
    const store = useUnifiedCanvasStore.getState();
    
    const tableId = 'test-table-3' as ElementId;
    const table: TableElement = {
      id: tableId,
      type: 'table',
      x: 100,
      y: 100,
      width: 240,
      height: 80,
      rows: 2,
      cols: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLocked: false,
      isHidden: false
    };
    
    store.addElement(table);
    mockRefreshTransformer.mockClear();
    
    // Add a column
    store.addTableColumn(tableId);
    
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });
    
    expect(mockRefreshTransformer).toHaveBeenCalledWith(tableId);
  });

  it('should refresh transformer when removing table column', async () => {
    const store = useUnifiedCanvasStore.getState();
    
    // Create a table with 3 columns so we can remove one
    const tableId = 'test-table-4' as ElementId;
    const table: TableElement = {
      id: tableId,
      type: 'table',
      x: 100,
      y: 100,
      width: 360,
      height: 80,
      rows: 2,
      cols: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLocked: false,
      isHidden: false
    };
    
    store.addElement(table);
    mockRefreshTransformer.mockClear();
    
    // Remove a column
    store.removeTableColumn(tableId, 1);
    
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });
    
    expect(mockRefreshTransformer).toHaveBeenCalledWith(tableId);
  });

  it('should verify table dimensions are updated correctly', () => {
    const store = useUnifiedCanvasStore.getState();
    
    const tableId = 'test-table-5' as ElementId;
    const table: TableElement = {
      id: tableId,
      type: 'table',
      x: 100,
      y: 100,
      width: 240,
      height: 80,
      rows: 2,
      cols: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLocked: false,
      isHidden: false
    };
    
    store.addElement(table);
    
    // Add a row - should increase height by 40px
    store.addTableRow(tableId);
    
    const updatedTable1 = store.getElementById(tableId) as TableElement;
    expect(updatedTable1.height).toBe(120); // 80 + 40
    expect(updatedTable1.rows).toBe(3);
    
    // Add a column - should increase width by 120px
    store.addTableColumn(tableId);
    
    const updatedTable2 = store.getElementById(tableId) as TableElement;
    expect(updatedTable2.width).toBe(360); // 240 + 120
    expect(updatedTable2.cols).toBe(3);
  });
});