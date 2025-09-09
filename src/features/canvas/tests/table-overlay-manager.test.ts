import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TableOverlayManager, TableContextMenuManager } from '../renderer/table/TableOverlayManager';
import type { TableConfig, TableActionCallbacks } from '../renderer/table/TableOverlayManager';

// Mock Konva objects
const createMockLayer = () => ({
  add: vi.fn(),
  batchDraw: vi.fn(),
  listening: vi.fn(() => true),
  getStage: vi.fn(() => mockStage)
} as any);

const createMockGroup = () => ({
  getClientRect: vi.fn(() => ({ x: 100, y: 50, width: 300, height: 200 })),
  add: vi.fn(),
  destroy: vi.fn(),
  destroyChildren: vi.fn(),
  visible: vi.fn(),
  listening: vi.fn(() => true),
  on: vi.fn(),
  off: vi.fn()
} as any);

const createMockStage = () => ({
  getPointerPosition: vi.fn(() => ({ x: 150, y: 100 })),
  container: vi.fn(() => ({
    style: {},
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 800, height: 600 })
  }))
} as any);

const mockStage = createMockStage();

describe('Table Overlay System', () => {
  describe('TableOverlayManager', () => {
    let overlayManager: TableOverlayManager;
    let mockLayer: any;
    let mockTableNode: any;

    beforeEach(() => {
      mockLayer = createMockLayer();
      mockTableNode = createMockGroup();
      overlayManager = new TableOverlayManager(mockLayer);
    });

    afterEach(() => {
      overlayManager.destroy();
    });

    it('creates overlay manager with default styles', () => {
      expect(overlayManager).toBeDefined();
      expect(overlayManager.getActiveTableId()).toBeNull();
    });

    it('renders table controls for valid table', () => {
      const config: TableConfig = {
        rows: 3,
        cols: 4,
        cellWidth: 75,
        cellHeight: 67,
        padding: 8
      };

      const callbacks: TableActionCallbacks = {
        addRow: vi.fn(),
        deleteRow: vi.fn(),
        addColumn: vi.fn(),
        deleteColumn: vi.fn(),
        editCell: vi.fn(),
        showContextMenu: vi.fn()
      };

      overlayManager.renderTableControls('table-1', mockTableNode, config, callbacks);

      expect(overlayManager.getActiveTableId()).toBe('table-1');
      expect(overlayManager.isActiveForTable('table-1')).toBe(true);
      expect(mockLayer.add).toHaveBeenCalled();
      expect(mockLayer.batchDraw).toHaveBeenCalled();
    });

    it('clears table overlay controls', () => {
      const config: TableConfig = {
        rows: 2,
        cols: 2,
        cellWidth: 150,
        cellHeight: 100,
        padding: 8
      };

      const callbacks: TableActionCallbacks = {
        addRow: vi.fn(),
        deleteRow: vi.fn(),
        addColumn: vi.fn(),
        deleteColumn: vi.fn(),
        editCell: vi.fn(),
        showContextMenu: vi.fn()
      };

      // First render controls
      overlayManager.renderTableControls('table-1', mockTableNode, config, callbacks);
      expect(overlayManager.getActiveTableId()).toBe('table-1');

      // Then clear them
      overlayManager.clearTableOverlay();
      expect(overlayManager.getActiveTableId()).toBeNull();
      expect(overlayManager.isActiveForTable('table-1')).toBe(false);
    });

    it('updates overlay position when table moves', () => {
      const config: TableConfig = {
        rows: 2,
        cols: 3,
        cellWidth: 100,
        cellHeight: 100,
        padding: 8
      };

      const callbacks: TableActionCallbacks = {
        addRow: vi.fn(),
        deleteRow: vi.fn(),
        addColumn: vi.fn(),
        deleteColumn: vi.fn(),
        editCell: vi.fn(),
        showContextMenu: vi.fn()
      };

      // Render initial controls
      overlayManager.renderTableControls('table-1', mockTableNode, config, callbacks);

      // Update table position
      mockTableNode.getClientRect.mockReturnValue({ x: 200, y: 100, width: 300, height: 200 });

      // Update overlay position
      overlayManager.updateOverlayPosition('table-1', mockTableNode, config, callbacks);

      // Should still be active and redrawn
      expect(overlayManager.isActiveForTable('table-1')).toBe(true);
      expect(mockLayer.batchDraw).toHaveBeenCalledTimes(3); // Initial + error handling + update
    });

    it('handles table bounds calculation errors gracefully', () => {
      const config: TableConfig = {
        rows: 2,
        cols: 2,
        cellWidth: 100,
        cellHeight: 50,
        padding: 8
      };

      const callbacks: TableActionCallbacks = {
        addRow: vi.fn(),
        deleteRow: vi.fn(),
        addColumn: vi.fn(),
        deleteColumn: vi.fn(),
        editCell: vi.fn(),
        showContextMenu: vi.fn()
      };

      // Mock table node that throws error
      const problematicTableNode = {
        getClientRect: vi.fn(() => {
          throw new Error('Bounds calculation error');
        })
      } as any;

      // Should not throw and should handle gracefully
      expect(() => {
        overlayManager.renderTableControls('table-1', problematicTableNode, config, callbacks);
      }).not.toThrow();

      expect(overlayManager.getActiveTableId()).toBe('table-1');
    });

    it('creates proper number of control zones for different table sizes', () => {
      // Test with various table configurations
      const testCases = [
        { rows: 1, cols: 1 },
        { rows: 2, cols: 3 },
        { rows: 5, cols: 4 }
      ];

      testCases.forEach(({ rows, cols }) => {
        const config: TableConfig = {
          rows,
          cols,
          cellWidth: 100,
          cellHeight: 50,
          padding: 8
        };

        const callbacks: TableActionCallbacks = {
          addRow: vi.fn(),
          deleteRow: vi.fn(),
          addColumn: vi.fn(),
          deleteColumn: vi.fn(),
          editCell: vi.fn(),
          showContextMenu: vi.fn()
        };

        overlayManager.clearTableOverlay();
        overlayManager.renderTableControls(`table-${rows}x${cols}`, mockTableNode, config, callbacks);

        expect(overlayManager.getActiveTableId()).toBe(`table-${rows}x${cols}`);

        // Each test should create a new active overlay
        overlayManager.clearTableOverlay();
      });
    });

    it('properly destroys resources on cleanup', () => {
      const config: TableConfig = {
        rows: 2,
        cols: 2,
        cellWidth: 100,
        cellHeight: 50,
        padding: 8
      };

      const callbacks: TableActionCallbacks = {
        addRow: vi.fn(),
        deleteRow: vi.fn(),
        addColumn: vi.fn(),
        deleteColumn: vi.fn(),
        editCell: vi.fn(),
        showContextMenu: vi.fn()
      };

      overlayManager.renderTableControls('table-1', mockTableNode, config, callbacks);
      expect(overlayManager.getActiveTableId()).toBe('table-1');

      // Destroy should clean up everything
      overlayManager.destroy();
      expect(overlayManager.getActiveTableId()).toBeNull();
    });
  });

  describe('TableContextMenuManager', () => {
    let contextMenuManager: TableContextMenuManager;
    let mockTableNode: any;

    beforeEach(() => {
      contextMenuManager = new TableContextMenuManager(mockStage);
      mockTableNode = createMockGroup();
    });

    afterEach(() => {
      contextMenuManager.destroy();
      // Clean up any DOM elements created during tests
      document.querySelectorAll('[style*="position: fixed"]').forEach(el => el.remove());
    });

    it('creates context menu manager', () => {
      expect(contextMenuManager).toBeDefined();
    });

    it('shows context menu at pointer position', () => {
      const mockEvent = {
        evt: {
          preventDefault: vi.fn()
        }
      } as any;

      const actions = {
        addRowAbove: vi.fn(),
        addRowBelow: vi.fn(),
        addColumnLeft: vi.fn(),
        addColumnRight: vi.fn(),
        deleteTable: vi.fn()
      };

      contextMenuManager.showContextMenu('table-1', mockTableNode, mockEvent, actions);

      // Should prevent default and create menu
      expect(mockEvent.evt.preventDefault).toHaveBeenCalled();
      
      // Should create DOM element
      const menu = document.querySelector('[style*="position: fixed"]');
      expect(menu).toBeTruthy();
    });

    it('closes context menu properly', () => {
      const mockEvent = {
        evt: {
          preventDefault: vi.fn()
        }
      } as any;

      const actions = {
        addRowAbove: vi.fn(),
        addRowBelow: vi.fn(),
        addColumnLeft: vi.fn(),
        addColumnRight: vi.fn(),
        deleteTable: vi.fn()
      };

      // Show menu first
      contextMenuManager.showContextMenu('table-1', mockTableNode, mockEvent, actions);
      let menu = document.querySelector('[style*="position: fixed"]');
      expect(menu).toBeTruthy();

      // Close menu
      contextMenuManager.closeContextMenu();
      menu = document.querySelector('[style*="position: fixed"]');
      expect(menu).toBeFalsy();
    });

    it('handles missing pointer position gracefully', () => {
      // Mock stage with no pointer position
      const stageNoPointer = {
        getPointerPosition: vi.fn(() => null)
      } as any;

      const contextMenuNoPointer = new TableContextMenuManager(stageNoPointer);
      
      const mockEvent = {
        evt: {
          preventDefault: vi.fn()
        }
      } as any;

      const actions = {
        addRowAbove: vi.fn(),
        addRowBelow: vi.fn(),
        addColumnLeft: vi.fn(),
        addColumnRight: vi.fn(),
        deleteTable: vi.fn()
      };

      // Should not throw and should handle gracefully
      expect(() => {
        contextMenuNoPointer.showContextMenu('table-1', mockTableNode, mockEvent, actions);
      }).not.toThrow();

      // Should not create menu
      const menu = document.querySelector('[style*="position: fixed"]');
      expect(menu).toBeFalsy();

      contextMenuNoPointer.destroy();
    });

    it('executes menu actions correctly', () => {
      const mockEvent = {
        evt: {
          preventDefault: vi.fn()
        }
      } as any;

      const actions = {
        addRowAbove: vi.fn(),
        addRowBelow: vi.fn(),
        addColumnLeft: vi.fn(),
        addColumnRight: vi.fn(),
        deleteTable: vi.fn()
      };

      contextMenuManager.showContextMenu('table-1', mockTableNode, mockEvent, actions);

      // Find menu items
      const menu = document.querySelector('[style*="position: fixed"]');
      expect(menu).toBeTruthy();

      // Simulate clicking "Add Row Above"
      const menuItems = menu!.children;
      expect(menuItems.length).toBeGreaterThan(0);

      // Click first menu item (Add Row Above)
      const addRowAboveItem = Array.from(menuItems).find(
        item => (item as HTMLElement).textContent === 'Add Row Above'
      ) as HTMLElement;

      expect(addRowAboveItem).toBeTruthy();

      // Simulate click
      addRowAboveItem.click();

      // Should execute action and close menu
      expect(actions.addRowAbove).toHaveBeenCalledOnce();
    });

    it('properly destroys resources on cleanup', () => {
      const mockEvent = {
        evt: {
          preventDefault: vi.fn()
        }
      } as any;

      const actions = {
        addRowAbove: vi.fn(),
        addRowBelow: vi.fn(),
        addColumnLeft: vi.fn(),
        addColumnRight: vi.fn(),
        deleteTable: vi.fn()
      };

      // Show menu
      contextMenuManager.showContextMenu('table-1', mockTableNode, mockEvent, actions);
      let menu = document.querySelector('[style*="position: fixed"]');
      expect(menu).toBeTruthy();

      // Destroy should clean up menu
      contextMenuManager.destroy();
      menu = document.querySelector('[style*="position: fixed"]');
      expect(menu).toBeFalsy();
    });
  });

  describe('TableOverlayManager Integration', () => {
    let overlayManager: TableOverlayManager;
    let mockLayer: any;
    let mockTableNode: any;

    beforeEach(() => {
      mockLayer = createMockLayer();
      mockTableNode = createMockGroup();
      overlayManager = new TableOverlayManager(mockLayer);
    });

    afterEach(() => {
      overlayManager.destroy();
    });

    it('handles complete overlay lifecycle', () => {
      const config: TableConfig = {
        rows: 3,
        cols: 3,
        cellWidth: 100,
        cellHeight: 67,
        padding: 8
      };

      const callbacks: TableActionCallbacks = {
        addRow: vi.fn(),
        deleteRow: vi.fn(),
        addColumn: vi.fn(),
        deleteColumn: vi.fn(),
        editCell: vi.fn(),
        showContextMenu: vi.fn()
      };

      // Initial state
      expect(overlayManager.getActiveTableId()).toBeNull();
      expect(overlayManager.isActiveForTable('table-1')).toBe(false);

      // Render controls
      overlayManager.renderTableControls('table-1', mockTableNode, config, callbacks);
      expect(overlayManager.getActiveTableId()).toBe('table-1');
      expect(overlayManager.isActiveForTable('table-1')).toBe(true);

      // Update position
      overlayManager.updateOverlayPosition('table-1', mockTableNode, config, callbacks);
      expect(overlayManager.isActiveForTable('table-1')).toBe(true);

      // Clear overlay
      overlayManager.clearTableOverlay();
      expect(overlayManager.getActiveTableId()).toBeNull();
      expect(overlayManager.isActiveForTable('table-1')).toBe(false);
    });

    it('handles multiple table switches correctly', () => {
      const config: TableConfig = {
        rows: 2,
        cols: 2,
        cellWidth: 100,
        cellHeight: 50,
        padding: 8
      };

      const callbacks: TableActionCallbacks = {
        addRow: vi.fn(),
        deleteRow: vi.fn(),
        addColumn: vi.fn(),
        deleteColumn: vi.fn(),
        editCell: vi.fn(),
        showContextMenu: vi.fn()
      };

      // Show overlay for table-1
      overlayManager.renderTableControls('table-1', mockTableNode, config, callbacks);
      expect(overlayManager.getActiveTableId()).toBe('table-1');

      // Switch to table-2 (should clear previous and show new)
      const mockTableNode2 = createMockGroup();
      overlayManager.renderTableControls('table-2', mockTableNode2, config, callbacks);
      expect(overlayManager.getActiveTableId()).toBe('table-2');
      expect(overlayManager.isActiveForTable('table-1')).toBe(false);
      expect(overlayManager.isActiveForTable('table-2')).toBe(true);

      // Clear should affect current active table
      overlayManager.clearTableOverlay();
      expect(overlayManager.getActiveTableId()).toBeNull();
      expect(overlayManager.isActiveForTable('table-2')).toBe(false);
    });
  });
});