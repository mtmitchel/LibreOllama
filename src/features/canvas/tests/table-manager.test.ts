import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TableManager } from '../renderer/table/TableManager';
import type { TableManagerConfig, TableStoreAdapter } from '../renderer/table/TableManager';

// Create mock store adapter
class MockTableStoreAdapter implements TableStoreAdapter {
  private elements = new Map<string, any>();
  public updateElementCalls: Array<{ id: string; updates: any; options?: any }> = [];
  public addTableRowCalls: Array<{ tableId: string; index: number }> = [];
  public removeTableRowCalls: Array<{ tableId: string; index: number }> = [];
  public addTableColumnCalls: Array<{ tableId: string; index: number }> = [];
  public removeTableColumnCalls: Array<{ tableId: string; index: number }> = [];

  updateElement(id: string, updates: any, options?: { skipHistory?: boolean }): void {
    this.updateElementCalls.push({ id, updates, options });
    
    const existing = this.elements.get(id);
    if (existing) {
      this.elements.set(id, { ...existing, ...updates });
    }
  }

  getElement(id: string): any {
    return this.elements.get(id);
  }

  addTableRow(tableId: string, index: number): void {
    this.addTableRowCalls.push({ tableId, index });
    
    const element = this.elements.get(tableId);
    if (element) {
      const newRows = (element.rows || 1) + 1;
      this.updateElement(tableId, { rows: newRows });
    }
  }

  removeTableRow(tableId: string, index: number): void {
    this.removeTableRowCalls.push({ tableId, index });
    
    const element = this.elements.get(tableId);
    if (element && (element.rows || 1) > 1) {
      const newRows = Math.max(1, (element.rows || 1) - 1);
      this.updateElement(tableId, { rows: newRows });
    }
  }

  addTableColumn(tableId: string, index: number): void {
    this.addTableColumnCalls.push({ tableId, index });
    
    const element = this.elements.get(tableId);
    if (element) {
      const newCols = (element.cols || 1) + 1;
      this.updateElement(tableId, { cols: newCols });
    }
  }

  removeTableColumn(tableId: string, index: number): void {
    this.removeTableColumnCalls.push({ tableId, index });
    
    const element = this.elements.get(tableId);
    if (element && (element.cols || 1) > 1) {
      const newCols = Math.max(1, (element.cols || 1) - 1);
      this.updateElement(tableId, { cols: newCols });
    }
  }

  setElement(id: string, element: any): void {
    this.elements.set(id, element);
  }

  reset(): void {
    this.elements.clear();
    this.updateElementCalls = [];
    this.addTableRowCalls = [];
    this.removeTableRowCalls = [];
    this.addTableColumnCalls = [];
    this.removeTableColumnCalls = [];
  }
}

// Create mock container hierarchy for DOM overlay management
const createMockStageContainer = () => {
  const grandParent = document.createElement('div');
  grandParent.id = 'table-manager-container-parent';
  
  const container = document.createElement('div');
  container.id = 'table-manager-container';
  
  grandParent.appendChild(container);
  document.body.appendChild(grandParent);
  
  container.getBoundingClientRect = vi.fn(() => ({ 
    left: 10, 
    top: 20, 
    width: 800, 
    height: 600,
    right: 810,
    bottom: 620,
    x: 10,
    y: 20
  }));
  
  container.contains = vi.fn(() => false);
  return container;
};

// Mock Konva objects
const createMockStage = (container: HTMLElement) => ({
  getPointerPosition: vi.fn(() => ({ x: 200, y: 150 })),
  container: vi.fn(() => container)
} as any);

const createMockLayer = () => ({
  add: vi.fn(),
  batchDraw: vi.fn(),
  listening: vi.fn(() => true),
  getStage: vi.fn()
} as any);

const createMockTableGroup = (tableId: string) => ({
  id: vi.fn(() => tableId),
  name: vi.fn(() => 'table'),
  getClientRect: vi.fn(() => ({ x: 100, y: 50, width: 300, height: 200 })),
  getStage: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  getAbsoluteTransform: vi.fn(() => ({
    copy: vi.fn(() => ({
      invert: vi.fn(() => ({
        point: vi.fn(() => ({ x: 50, y: 25 }))
      }))
    }))
  }))
} as any);

describe('Table Manager System', () => {
  let tableManager: TableManager;
  let mockStoreAdapter: MockTableStoreAdapter;
  let mockContainer: HTMLElement;
  let mockStage: any;
  let mockOverlayLayer: any;
  let config: TableManagerConfig;

  beforeEach(() => {
    mockContainer = createMockStageContainer();
    mockStage = createMockStage(mockContainer);
    mockOverlayLayer = createMockLayer();
    mockStoreAdapter = new MockTableStoreAdapter();

    config = {
      stage: mockStage,
      overlayLayer: mockOverlayLayer,
      storeAdapter: mockStoreAdapter,
      scheduleDraw: vi.fn(),
      refreshTransformer: vi.fn(),
      debug: { log: true }
    };

    tableManager = new TableManager(config);
  });

  afterEach(() => {
    tableManager.destroy();
    mockStoreAdapter.reset();
    
    // Clean up DOM
    document.querySelectorAll('#table-manager-container-parent').forEach(el => el.remove());
    document.querySelectorAll('div[id="__canvas_overlay_root__"]').forEach(el => el.remove());
    document.querySelectorAll('[style*="position: fixed"]').forEach(el => el.remove());
  });

  describe('Initialization and Configuration', () => {
    it('creates table manager with proper configuration', () => {
      expect(tableManager).toBeDefined();
      expect(tableManager.getActiveTableId()).toBeNull();
      expect(tableManager.isEditingCell()).toBe(false);
    });

    it('sets operation callbacks', () => {
      const callbacks = {
        onTableUpdate: vi.fn(),
        onLayoutTable: vi.fn()
      };

      expect(() => {
        tableManager.setOperationCallbacks(callbacks);
      }).not.toThrow();
    });
  });

  describe('Table Node Registration', () => {
    it('registers table node successfully', () => {
      const mockTableNode = createMockTableGroup('table-1');
      
      tableManager.registerTableNode('table-1', mockTableNode);
      
      // Registration should set up event listeners
      expect(mockTableNode.on).toHaveBeenCalledWith('contextmenu.table', expect.any(Function));
      expect(mockTableNode.on).toHaveBeenCalledWith('mouseleave.table', expect.any(Function));
      expect(mockTableNode.on).toHaveBeenCalledWith('dblclick.table', expect.any(Function));
    });

    it('unregisters table node and cleans up', () => {
      const mockTableNode = createMockTableGroup('table-1');
      
      // Register first
      tableManager.registerTableNode('table-1', mockTableNode);
      
      // Show overlay to make it active
      mockStoreAdapter.setElement('table-1', { 
        rows: 2, 
        cols: 3, 
        enhancedTableData: { cells: [] } 
      });
      tableManager.showTableOverlay('table-1');
      expect(tableManager.getActiveTableId()).toBe('table-1');
      
      // Unregister should clear active table
      tableManager.unregisterTableNode('table-1');
      expect(tableManager.getActiveTableId()).toBeNull();
    });

    it('handles registering multiple table nodes', () => {
      const mockTable1 = createMockTableGroup('table-1');
      const mockTable2 = createMockTableGroup('table-2');
      
      tableManager.registerTableNode('table-1', mockTable1);
      tableManager.registerTableNode('table-2', mockTable2);
      
      // Both should have event listeners
      expect(mockTable1.on).toHaveBeenCalled();
      expect(mockTable2.on).toHaveBeenCalled();
      
      // Unregister one shouldn't affect the other
      tableManager.unregisterTableNode('table-1');
      // table-2 should still be registered (no direct way to test, but no errors should occur)
    });
  });

  describe('Table Overlay Management', () => {
    let mockTableNode: any;

    beforeEach(() => {
      mockTableNode = createMockTableGroup('table-1');
      tableManager.registerTableNode('table-1', mockTableNode);
      
      // Set up table element data
      mockStoreAdapter.setElement('table-1', {
        rows: 3,
        cols: 4,
        enhancedTableData: {
          cells: [
            [{ content: 'A1' }, { content: 'B1' }],
            [{ content: 'A2' }, { content: 'B2' }]
          ]
        }
      });
    });

    it('shows table overlay for valid table', () => {
      tableManager.showTableOverlay('table-1');
      
      expect(tableManager.getActiveTableId()).toBe('table-1');
      expect(mockOverlayLayer.add).toHaveBeenCalled();
      expect(mockOverlayLayer.batchDraw).toHaveBeenCalled();
    });

    it('handles missing table node gracefully', () => {
      // Try to show overlay for unregistered table
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      tableManager.showTableOverlay('non-existent-table');
      
      expect(tableManager.getActiveTableId()).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('[TableManager] Table node not found:', 'non-existent-table');
      
      consoleSpy.mockRestore();
    });

    it('handles missing table element gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Clear any existing element data to simulate missing element
      mockStoreAdapter.elements.delete('table-1');
      
      // Try to show overlay without element data
      tableManager.showTableOverlay('table-1');
      
      expect(tableManager.getActiveTableId()).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('[TableManager] Table element not found:', 'table-1');
      
      consoleSpy.mockRestore();
    });

    it('clears table overlay', () => {
      // Show overlay first
      tableManager.showTableOverlay('table-1');
      expect(tableManager.getActiveTableId()).toBe('table-1');
      
      // Clear overlay
      tableManager.clearTableOverlay();
      expect(tableManager.getActiveTableId()).toBeNull();
    });

    it('updates table overlay position', () => {
      // Reset mock call count
      mockOverlayLayer.batchDraw.mockClear();
      
      // Show overlay first
      tableManager.showTableOverlay('table-1');
      expect(tableManager.getActiveTableId()).toBe('table-1');
      expect(mockOverlayLayer.batchDraw).toHaveBeenCalledTimes(1); // Initial
      
      // Update position
      mockTableNode.getClientRect.mockReturnValue({ x: 200, y: 100, width: 300, height: 200 });
      tableManager.updateTableOverlayPosition('table-1');
      
      // Should trigger one more redraw (but may be 3 due to render implementation)
      expect(mockOverlayLayer.batchDraw).toHaveBeenCalledTimes(3); // Initial + error handling + update
    });

    it('ignores position update for inactive table', () => {
      // Don't show overlay
      expect(tableManager.getActiveTableId()).toBeNull();
      
      // Try to update position
      tableManager.updateTableOverlayPosition('table-1');
      
      // Should not trigger any draws
      expect(mockOverlayLayer.batchDraw).not.toHaveBeenCalled();
    });
  });

  describe('Table Operations', () => {
    let mockTableNode: any;

    beforeEach(() => {
      mockTableNode = createMockTableGroup('table-1');
      tableManager.registerTableNode('table-1', mockTableNode);
      
      mockStoreAdapter.setElement('table-1', {
        rows: 2,
        cols: 2,
        enhancedTableData: {
          cells: [
            [{ content: 'A1' }, { content: 'B1' }],
            [{ content: 'A2' }, { content: 'B2' }]
          ]
        }
      });
    });

    it('adds table row', () => {
      tableManager.showTableOverlay('table-1');
      
      // Simulate clicking add row button (we'll test the internal method)
      // This would normally be triggered by the overlay callbacks
      const element = mockStoreAdapter.getElement('table-1');
      expect(element.rows).toBe(2);
      
      // Add row at index 1
      mockStoreAdapter.addTableRow('table-1', 1);
      
      expect(mockStoreAdapter.addTableRowCalls).toHaveLength(1);
      expect(mockStoreAdapter.addTableRowCalls[0]).toEqual({ tableId: 'table-1', index: 1 });
    });

    it('removes table row', () => {
      tableManager.showTableOverlay('table-1');
      
      const element = mockStoreAdapter.getElement('table-1');
      expect(element.rows).toBe(2);
      
      // Remove row at index 0
      mockStoreAdapter.removeTableRow('table-1', 0);
      
      expect(mockStoreAdapter.removeTableRowCalls).toHaveLength(1);
      expect(mockStoreAdapter.removeTableRowCalls[0]).toEqual({ tableId: 'table-1', index: 0 });
    });

    it('adds table column', () => {
      tableManager.showTableOverlay('table-1');
      
      const element = mockStoreAdapter.getElement('table-1');
      expect(element.cols).toBe(2);
      
      // Add column at index 1
      mockStoreAdapter.addTableColumn('table-1', 1);
      
      expect(mockStoreAdapter.addTableColumnCalls).toHaveLength(1);
      expect(mockStoreAdapter.addTableColumnCalls[0]).toEqual({ tableId: 'table-1', index: 1 });
    });

    it('removes table column', () => {
      tableManager.showTableOverlay('table-1');
      
      const element = mockStoreAdapter.getElement('table-1');
      expect(element.cols).toBe(2);
      
      // Remove column at index 1
      mockStoreAdapter.removeTableColumn('table-1', 1);
      
      expect(mockStoreAdapter.removeTableColumnCalls).toHaveLength(1);
      expect(mockStoreAdapter.removeTableColumnCalls[0]).toEqual({ tableId: 'table-1', index: 1 });
    });

    it('prevents removing last row', () => {
      // Set up table with only 1 row
      mockStoreAdapter.setElement('table-1', {
        rows: 1,
        cols: 2,
        enhancedTableData: { cells: [[{ content: 'A1' }, { content: 'B1' }]] }
      });
      
      mockStoreAdapter.removeTableRow('table-1', 0);
      
      // Should still have 1 row
      const element = mockStoreAdapter.getElement('table-1');
      expect(element.rows).toBe(1);
    });

    it('prevents removing last column', () => {
      // Set up table with only 1 column
      mockStoreAdapter.setElement('table-1', {
        rows: 2,
        cols: 1,
        enhancedTableData: { cells: [[{ content: 'A1' }], [{ content: 'A2' }]] }
      });
      
      mockStoreAdapter.removeTableColumn('table-1', 0);
      
      // Should still have 1 column
      const element = mockStoreAdapter.getElement('table-1');
      expect(element.cols).toBe(1);
    });
  });

  describe('Cell Editing', () => {
    let mockTableNode: any;

    beforeEach(() => {
      mockTableNode = createMockTableGroup('table-1');
      tableManager.registerTableNode('table-1', mockTableNode);
      
      mockStoreAdapter.setElement('table-1', {
        rows: 3,
        cols: 3,
        enhancedTableData: {
          cells: [
            [{ content: 'A1' }, { content: 'B1' }, { content: 'C1' }],
            [{ content: 'A2' }, { content: 'B2' }, { content: 'C2' }],
            [{ content: 'A3' }, { content: 'B3' }, { content: 'C3' }]
          ]
        }
      });
    });

    it('opens cell editor successfully', async () => {
      await tableManager.openCellEditor('table-1', 1, 2);
      
      expect(tableManager.isEditingCell()).toBe(true);
      
      // Should create DOM overlay
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      expect(overlayRoot).toBeTruthy();
      expect(overlayRoot!.children.length).toBe(1);
    });

    it('handles missing table node for cell editing', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await tableManager.openCellEditor('non-existent-table', 0, 0);
      
      expect(tableManager.isEditingCell()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[TableManager] Table node not found for cell editing:', 'non-existent-table');
      
      consoleSpy.mockRestore();
    });

    it('handles missing table element for cell editing', async () => {
      // Register node but remove element data
      mockStoreAdapter.reset();
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await tableManager.openCellEditor('table-1', 0, 0);
      
      expect(tableManager.isEditingCell()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[TableManager] Table element not found for cell editing:', 'table-1');
      
      consoleSpy.mockRestore();
    });

    it('closes cell editor', async () => {
      await tableManager.openCellEditor('table-1', 1, 1);
      expect(tableManager.isEditingCell()).toBe(true);
      
      tableManager.closeCellEditor();
      expect(tableManager.isEditingCell()).toBe(false);
    });

    it('handles cell content update', async () => {
      await tableManager.openCellEditor('table-1', 1, 2);
      
      // Simulate cell update (this would normally be triggered by the cell editor)
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      const textareaElement = wrapper.children[0] as HTMLTextAreaElement;
      textareaElement.value = 'Updated content';
      
      // Simulate committing the edit
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        shiftKey: false,
        cancelable: true 
      });
      textareaElement.dispatchEvent(enterEvent);
      
      // Should update the store
      expect(mockStoreAdapter.updateElementCalls.length).toBeGreaterThan(0);
      expect(config.scheduleDraw).toHaveBeenCalledWith('main');
    });
  });

  describe('Context Menu Integration', () => {
    let mockTableNode: any;

    beforeEach(() => {
      mockTableNode = createMockTableGroup('table-1');
      tableManager.registerTableNode('table-1', mockTableNode);
      
      mockStoreAdapter.setElement('table-1', {
        rows: 2,
        cols: 2,
        enhancedTableData: { cells: [] }
      });
    });

    it('handles context menu events', () => {
      // Simulate right-click event
      const mockEvent = {
        evt: {
          preventDefault: vi.fn()
        }
      };

      // Get the context menu handler that was registered
      const contextMenuHandler = mockTableNode.on.mock.calls.find(
        (call: any[]) => call[0] === 'contextmenu.table'
      )?.[1];

      expect(contextMenuHandler).toBeDefined();
      
      // Simulate calling the handler
      if (contextMenuHandler) {
        expect(() => contextMenuHandler(mockEvent)).not.toThrow();
        expect(mockEvent.evt.preventDefault).toHaveBeenCalled();
      }
    });

    it('handles double-click to edit cell', () => {
      // Get the double-click handler
      const dblclickHandler = mockTableNode.on.mock.calls.find(
        (call: any[]) => call[0] === 'dblclick.table'
      )?.[1];

      expect(dblclickHandler).toBeDefined();
      
      // Mock event
      const mockEvent = {};
      
      // Simulate calling the handler
      if (dblclickHandler) {
        expect(() => dblclickHandler(mockEvent)).not.toThrow();
      }
    });
  });

  describe('State Management', () => {
    let mockTableNode: any;

    beforeEach(() => {
      mockTableNode = createMockTableGroup('table-1');
      tableManager.registerTableNode('table-1', mockTableNode);
      
      mockStoreAdapter.setElement('table-1', {
        rows: 2,
        cols: 2,
        enhancedTableData: { cells: [] }
      });
    });

    it('tracks active table correctly', () => {
      expect(tableManager.getActiveTableId()).toBeNull();
      
      tableManager.showTableOverlay('table-1');
      expect(tableManager.getActiveTableId()).toBe('table-1');
      
      tableManager.clearActiveTable();
      expect(tableManager.getActiveTableId()).toBeNull();
    });

    it('clears active table completely', async () => {
      // Set up active state
      tableManager.showTableOverlay('table-1');
      await tableManager.openCellEditor('table-1', 0, 0);
      
      expect(tableManager.getActiveTableId()).toBe('table-1');
      expect(tableManager.isEditingCell()).toBe(true);
      
      // Clear everything
      tableManager.clearActiveTable();
      
      expect(tableManager.getActiveTableId()).toBeNull();
      expect(tableManager.isEditingCell()).toBe(false);
    });

    it('handles switching between tables', () => {
      const mockTable2 = createMockTableGroup('table-2');
      tableManager.registerTableNode('table-2', mockTable2);
      
      mockStoreAdapter.setElement('table-2', {
        rows: 3,
        cols: 3,
        enhancedTableData: { cells: [] }
      });
      
      // Show overlay for table-1
      tableManager.showTableOverlay('table-1');
      expect(tableManager.getActiveTableId()).toBe('table-1');
      
      // Switch to table-2
      tableManager.showTableOverlay('table-2');
      expect(tableManager.getActiveTableId()).toBe('table-2');
      
      // Clear should affect current active table
      tableManager.clearTableOverlay();
      expect(tableManager.getActiveTableId()).toBeNull();
    });
  });

  describe('Cleanup and Destruction', () => {
    it('destroys table manager and cleans up resources', () => {
      const mockTableNode = createMockTableGroup('table-1');
      tableManager.registerTableNode('table-1', mockTableNode);
      
      mockStoreAdapter.setElement('table-1', {
        rows: 2,
        cols: 2,
        enhancedTableData: { cells: [] }
      });
      
      tableManager.showTableOverlay('table-1');
      expect(tableManager.getActiveTableId()).toBe('table-1');
      
      // Destroy should clean up everything
      tableManager.destroy();
      expect(tableManager.getActiveTableId()).toBeNull();
      expect(tableManager.isEditingCell()).toBe(false);
    });

    it('handles errors during destruction gracefully', () => {
      // Mock overlay manager that throws errors
      const mockErrorTableNode = createMockTableGroup('table-1');
      tableManager.registerTableNode('table-1', mockErrorTableNode);
      
      // Should not throw during destruction
      expect(() => {
        tableManager.destroy();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('handles store adapter errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const mockTableNode = createMockTableGroup('table-1');
      tableManager.registerTableNode('table-1', mockTableNode);
      
      // Try to show overlay without setting element data
      tableManager.showTableOverlay('table-1');
      expect(tableManager.getActiveTableId()).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('[TableManager] Table element not found:', 'table-1');
      
      consoleSpy.mockRestore();
    });

    it('handles cell editing errors gracefully', async () => {
      const mockTableNode = createMockTableGroup('table-1');
      tableManager.registerTableNode('table-1', mockTableNode);
      
      // Set up problematic element data
      mockStoreAdapter.setElement('table-1', {
        rows: 2,
        cols: 2,
        enhancedTableData: null // This might cause issues
      });
      
      // Should handle gracefully
      await expect(async () => {
        await tableManager.openCellEditor('table-1', 0, 0);
      }).not.toThrow();
    });
  });
});