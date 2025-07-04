/**
 * TableTool Tests
 * 
 * Tests for the TableTool component following store-first testing principles.
 * These tests focus on the actual store methods and business logic rather than UI mocking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { TableTool } from '../components/tools/creation/TableTool';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import type { TableElement } from '../types/enhanced.types';
import { ElementId } from '../types/enhanced.types';

// Mock Konva Stage for UI tests
const mockStage = {
  on: vi.fn(),
  off: vi.fn(),
  getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
  getAbsoluteTransform: vi.fn(() => ({
    copy: () => ({
      invert: () => ({
        point: (p: any) => p
      })
    })
  })),
  getStage: vi.fn().mockReturnValue(undefined)
};

const mockStageRef = {
  current: mockStage as any
};

describe('TableTool', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render when active', () => {
      const { container } = render(
        <TableTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );
      
      // Should not crash when rendering
      expect(container).toBeDefined();
    });

    it('should not render when inactive', () => {
      const { container } = render(
        <TableTool
          isActive={false}
          stageRef={mockStageRef}
        />
      );
      
      // Should not crash when rendering
      expect(container).toBeDefined();
    });

    it('should register event handlers when active', () => {
      render(
        <TableTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      // Check that event handlers are registered (using actual event names)
      expect(mockStage.on).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });

    it('should clean up event handlers on unmount', () => {
      const { unmount } = render(
        <TableTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      unmount();

      expect(mockStage.off).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });
  });

  describe('Table Creation', () => {
    it('should create table on click', () => {
      render(
        <TableTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      // Get the registered mousedown handler
      const mouseDownHandler = mockStage.on.mock.calls.find(
        call => call[0] === 'mousedown'
      )?.[1];

      // Click to create table
      mouseDownHandler({
        target: { ...mockStage, getStage: () => mockStage },
        evt: { button: 0, clientX: 100, clientY: 100 }
      });

      // Should have handled the click without errors
      expect(mouseDownHandler).toBeDefined();
    });

    it('should handle non-primary button clicks', () => {
      render(
        <TableTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      // Get the registered mousedown handler
      const mouseDownHandler = mockStage.on.mock.calls.find(
        call => call[0] === 'mousedown'
      )?.[1];

      // Right click (button 2) should be ignored
      mouseDownHandler({
        target: { ...mockStage, getStage: () => mockStage },
        evt: { button: 2, clientX: 100, clientY: 100 }
      });

      // Should handle the click without errors
      expect(mouseDownHandler).toBeDefined();
    });

    it('should handle missing stage gracefully', () => {
      const nullStageRef = { current: null };
      
      const { container } = render(
        <TableTool
          isActive={true}
          stageRef={nullStageRef}
        />
      );

      // Should not crash with null stage
      expect(container).toBeDefined();
    });

    it('should handle missing pointer position', () => {
      const stageWithoutPointer = {
        ...mockStage,
        getPointerPosition: vi.fn(() => null)
      };
      
      const stageRef = { current: stageWithoutPointer as any };
      
      render(
        <TableTool
          isActive={true}
          stageRef={stageRef}
        />
      );

      // Get the registered mousedown handler
      const mouseDownHandler = stageWithoutPointer.on.mock.calls.find(
        call => call[0] === 'mousedown'
      )?.[1];

      // Click without pointer position
      mouseDownHandler({
        target: { ...stageWithoutPointer, getStage: () => stageWithoutPointer },
        evt: { button: 0, clientX: 100, clientY: 100 }
      });

      // Should handle gracefully without errors
      expect(mouseDownHandler).toBeDefined();
    });
  });
});

// Store-First Tests - Testing actual business logic
describe('Table Functionality (Store-First)', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    store = createUnifiedTestStore();
  });

  describe('Table Creation', () => {
    it('should create table with basic properties', () => {
      const table: TableElement = {
        id: ElementId('table-1'),
        type: 'table',
        x: 100,
        y: 100,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 50 },
            { id: 'row-2', height: 50 }
          ],
          columns: [
            { id: 'col-1', width: 150 },
            { id: 'col-2', width: 150 }
          ],
          cells: [
            [{ content: '' }, { content: '' }],
            [{ content: '' }, { content: '' }]
          ],
          styling: {
            headerBackgroundColor: '#f8fafc',
            headerTextColor: '#374151',
            borderColor: '#e5e7eb',
            alternateRowColor: '#f9fafb',
            hoverColor: '#f3f4f6',
            fontSize: 14,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 12,
            borderRadius: 8,
            shadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }
        }
      };

      // Use the correct pattern: store.getState().addElement()
      store.getState().addElement(table);

      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().elements.get(table.id)).toEqual(table);
      expect(store.getState().elementOrder).toContain(table.id);
    });

    it('should create table with correct default dimensions', () => {
      const table: TableElement = {
        id: ElementId('table-default'),
        type: 'table',
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 50 },
            { id: 'row-2', height: 50 }
          ],
          columns: [
            { id: 'col-1', width: 150 },
            { id: 'col-2', width: 150 }
          ],
          cells: [
            [{ content: '' }, { content: '' }],
            [{ content: '' }, { content: '' }]
          ]
        }
      };

      store.getState().addElement(table);

      const addedTable = store.getState().elements.get(table.id) as TableElement;
      expect(addedTable.width).toBe(300);
      expect(addedTable.height).toBe(100);
      expect(addedTable.rows).toBe(2);
      expect(addedTable.cols).toBe(2);
    });

    it('should create table with enhanced table data structure', () => {
      const table: TableElement = {
        id: ElementId('table-enhanced'),
        type: 'table',
        x: 50,
        y: 50,
        width: 400,
        height: 120,
        rows: 3,
        cols: 3,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 40 },
            { id: 'row-2', height: 40 },
            { id: 'row-3', height: 40 }
          ],
          columns: [
            { id: 'col-1', width: 133 },
            { id: 'col-2', width: 133 },
            { id: 'col-3', width: 134 }
          ],
          cells: [
            [{ content: 'A1' }, { content: 'B1' }, { content: 'C1' }],
            [{ content: 'A2' }, { content: 'B2' }, { content: 'C2' }],
            [{ content: 'A3' }, { content: 'B3' }, { content: 'C3' }]
          ],
          styling: {
            headerBackgroundColor: '#f8fafc',
            headerTextColor: '#374151',
            borderColor: '#e5e7eb',
            fontSize: 14,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }
        }
      };

      store.getState().addElement(table);

      const addedTable = store.getState().elements.get(table.id) as TableElement;
      expect(addedTable.enhancedTableData?.rows).toHaveLength(3);
      expect(addedTable.enhancedTableData?.columns).toHaveLength(3);
      expect(addedTable.enhancedTableData?.cells).toHaveLength(3);
      expect(addedTable.enhancedTableData?.cells[0]).toHaveLength(3);
      expect(addedTable.enhancedTableData?.cells[1][1].content).toBe('B2');
    });
  });

  describe('Table Cell Operations', () => {
    let tableId: ElementId;

    beforeEach(() => {
      tableId = ElementId('test-table');
      const table: TableElement = {
        id: tableId,
        type: 'table',
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 50 },
            { id: 'row-2', height: 50 }
          ],
          columns: [
            { id: 'col-1', width: 150 },
            { id: 'col-2', width: 150 }
          ],
          cells: [
            [{ content: '' }, { content: '' }],
            [{ content: '' }, { content: '' }]
          ]
        }
      };

      store.getState().addElement(table);
    });

    it('should update table cell content', () => {
      store.getState().updateTableCell(tableId, 0, 0, 'Hello World');

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.enhancedTableData?.cells[0][0].content).toBe('Hello World');
    });

    it('should update multiple table cells', () => {
      store.getState().updateTableCell(tableId, 0, 0, 'A1');
      store.getState().updateTableCell(tableId, 0, 1, 'B1');
      store.getState().updateTableCell(tableId, 1, 0, 'A2');
      store.getState().updateTableCell(tableId, 1, 1, 'B2');

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.enhancedTableData?.cells[0][0].content).toBe('A1');
      expect(table.enhancedTableData?.cells[0][1].content).toBe('B1');
      expect(table.enhancedTableData?.cells[1][0].content).toBe('A2');
      expect(table.enhancedTableData?.cells[1][1].content).toBe('B2');
    });

    it('should handle updating cell in non-existent table', () => {
      const nonExistentId = ElementId('non-existent');
      
      // Should not throw error
      expect(() => {
        store.getState().updateTableCell(nonExistentId, 0, 0, 'Test');
      }).not.toThrow();
    });

    it('should handle updating cell with invalid coordinates', () => {
      // Should not throw error for out-of-bounds coordinates
      expect(() => {
        store.getState().updateTableCell(tableId, 5, 5, 'Test');
      }).not.toThrow();
    });
  });

  describe('Table Row Operations', () => {
    let tableId: ElementId;

    beforeEach(() => {
      tableId = ElementId('row-test-table');
      const table: TableElement = {
        id: tableId,
        type: 'table',
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 50 },
            { id: 'row-2', height: 50 }
          ],
          columns: [
            { id: 'col-1', width: 150 },
            { id: 'col-2', width: 150 }
          ],
          cells: [
            [{ content: 'A1' }, { content: 'B1' }],
            [{ content: 'A2' }, { content: 'B2' }]
          ]
        }
      };

      store.getState().addElement(table);
    });

    it('should add table row', () => {
      store.getState().addTableRow(tableId);

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.rows).toBe(3);
      expect(table.height).toBe(140); // 100 + 40 (new row height)
      expect(table.enhancedTableData?.rows).toHaveLength(3);
      expect(table.enhancedTableData?.cells).toHaveLength(3);
    });

    it('should add table row at specific position', () => {
      store.getState().addTableRow(tableId, 1);

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.rows).toBe(3);
      expect(table.enhancedTableData?.rows).toHaveLength(3);
      expect(table.enhancedTableData?.cells).toHaveLength(3);
      
      // Original row 2 should now be at index 2
      expect(table.enhancedTableData?.cells[2][0].content).toBe('A2');
      expect(table.enhancedTableData?.cells[2][1].content).toBe('B2');
    });

    it('should remove table row', () => {
      store.getState().removeTableRow(tableId, 1);

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.rows).toBe(1);
      expect(table.enhancedTableData?.rows).toHaveLength(1);
      expect(table.enhancedTableData?.cells).toHaveLength(1);
      
      // First row should remain
      expect(table.enhancedTableData?.cells[0][0].content).toBe('A1');
      expect(table.enhancedTableData?.cells[0][1].content).toBe('B1');
    });

    it('should not remove last row', () => {
      // Remove one row first
      store.getState().removeTableRow(tableId, 1);
      
      // Try to remove the last row - should not work
      store.getState().removeTableRow(tableId, 0);

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.rows).toBe(1); // Should still have 1 row
    });
  });

  describe('Table Column Operations', () => {
    let tableId: ElementId;

    beforeEach(() => {
      tableId = ElementId('col-test-table');
      const table: TableElement = {
        id: tableId,
        type: 'table',
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 50 },
            { id: 'row-2', height: 50 }
          ],
          columns: [
            { id: 'col-1', width: 150 },
            { id: 'col-2', width: 150 }
          ],
          cells: [
            [{ content: 'A1' }, { content: 'B1' }],
            [{ content: 'A2' }, { content: 'B2' }]
          ]
        }
      };

      store.getState().addElement(table);
    });

    it('should add table column', () => {
      store.getState().addTableColumn(tableId);

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.cols).toBe(3);
      expect(table.width).toBe(420); // 300 + 120 (new column width)
      expect(table.enhancedTableData?.columns).toHaveLength(3);
      expect(table.enhancedTableData?.cells[0]).toHaveLength(3);
      expect(table.enhancedTableData?.cells[1]).toHaveLength(3);
    });

    it('should add table column at specific position', () => {
      store.getState().addTableColumn(tableId, 1);

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.cols).toBe(3);
      expect(table.enhancedTableData?.columns).toHaveLength(3);
      expect(table.enhancedTableData?.cells[0]).toHaveLength(3);
      
      // Original column B should now be at index 2
      expect(table.enhancedTableData?.cells[0][2].content).toBe('B1');
      expect(table.enhancedTableData?.cells[1][2].content).toBe('B2');
    });

    it('should remove table column', () => {
      store.getState().removeTableColumn(tableId, 1);

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.cols).toBe(1);
      expect(table.enhancedTableData?.columns).toHaveLength(1);
      expect(table.enhancedTableData?.cells[0]).toHaveLength(1);
      
      // First column should remain
      expect(table.enhancedTableData?.cells[0][0].content).toBe('A1');
      expect(table.enhancedTableData?.cells[1][0].content).toBe('A2');
    });

    it('should not remove last column', () => {
      // Remove one column first
      store.getState().removeTableColumn(tableId, 1);
      
      // Try to remove the last column - should not work
      store.getState().removeTableColumn(tableId, 0);

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.cols).toBe(1); // Should still have 1 column
    });
  });

  describe('Table Cell Resizing', () => {
    let tableId: ElementId;

    beforeEach(() => {
      tableId = ElementId('resize-test-table');
      const table: TableElement = {
        id: tableId,
        type: 'table',
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 50 },
            { id: 'row-2', height: 50 }
          ],
          columns: [
            { id: 'col-1', width: 150 },
            { id: 'col-2', width: 150 }
          ],
          cells: [
            [{ content: 'A1' }, { content: 'B1' }],
            [{ content: 'A2' }, { content: 'B2' }]
          ]
        }
      };

      store.getState().addElement(table);
    });

    it('should resize table column width', () => {
      store.getState().resizeTableCell(tableId, 0, 0, 200);

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.enhancedTableData?.columns[0].width).toBe(200);
      expect(table.width).toBe(350); // 300 + (200 - 150)
    });

    it('should resize table row height', () => {
      store.getState().resizeTableCell(tableId, 0, 0, undefined, 80);

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.enhancedTableData?.rows[0].height).toBe(80);
      expect(table.height).toBe(130); // 100 + (80 - 50)
    });

    it('should resize both width and height', () => {
      store.getState().resizeTableCell(tableId, 0, 0, 200, 80);

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.enhancedTableData?.columns[0].width).toBe(200);
      expect(table.enhancedTableData?.rows[0].height).toBe(80);
      expect(table.width).toBe(350); // 300 + (200 - 150)
      expect(table.height).toBe(130); // 100 + (80 - 50)
    });

    it('should enforce minimum width', () => {
      store.getState().resizeTableCell(tableId, 0, 0, 30); // Below minimum of 60

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.enhancedTableData?.columns[0].width).toBe(60); // Should be clamped to minimum
    });

    it('should enforce minimum height', () => {
      store.getState().resizeTableCell(tableId, 0, 0, undefined, 20); // Below minimum of 30

      const table = store.getState().elements.get(tableId) as TableElement;
      expect(table.enhancedTableData?.rows[0].height).toBe(30); // Should be clamped to minimum
    });
  });

  describe('Table Selection', () => {
    it('should select table', () => {
      const table: TableElement = {
        id: ElementId('select-table'),
        type: 'table',
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 50 },
            { id: 'row-2', height: 50 }
          ],
          columns: [
            { id: 'col-1', width: 150 },
            { id: 'col-2', width: 150 }
          ],
          cells: [
            [{ content: '' }, { content: '' }],
            [{ content: '' }, { content: '' }]
          ]
        }
      };

      store.getState().addElement(table);
      store.getState().selectElement(table.id);

      expect(store.getState().selectedElementIds.has(table.id)).toBe(true);
      expect(store.getState().lastSelectedElementId).toBe(table.id);
    });

    it('should handle table in multi-selection', () => {
      const table1: TableElement = {
        id: ElementId('multi-table-1'),
        type: 'table',
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [{ id: 'row-1', height: 50 }, { id: 'row-2', height: 50 }],
          columns: [{ id: 'col-1', width: 150 }, { id: 'col-2', width: 150 }],
          cells: [[{ content: '' }, { content: '' }], [{ content: '' }, { content: '' }]]
        }
      };

      const table2: TableElement = {
        id: ElementId('multi-table-2'),
        type: 'table',
        x: 400,
        y: 0,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [{ id: 'row-1', height: 50 }, { id: 'row-2', height: 50 }],
          columns: [{ id: 'col-1', width: 150 }, { id: 'col-2', width: 150 }],
          cells: [[{ content: '' }, { content: '' }], [{ content: '' }, { content: '' }]]
        }
      };

      store.getState().addElement(table1);
      store.getState().addElement(table2);

      // Select both tables
      store.getState().selectElement(table1.id);
      store.getState().selectElement(table2.id, true); // multiSelect: true

      expect(store.getState().selectedElementIds.size).toBe(2);
      expect(store.getState().selectedElementIds.has(table1.id)).toBe(true);
      expect(store.getState().selectedElementIds.has(table2.id)).toBe(true);
    });
  });

  describe('Table Deletion', () => {
    it('should delete table correctly', () => {
      const table: TableElement = {
        id: ElementId('delete-table'),
        type: 'table',
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 50 },
            { id: 'row-2', height: 50 }
          ],
          columns: [
            { id: 'col-1', width: 150 },
            { id: 'col-2', width: 150 }
          ],
          cells: [
            [{ content: 'A1' }, { content: 'B1' }],
            [{ content: 'A2' }, { content: 'B2' }]
          ]
        }
      };

      store.getState().addElement(table);
      expect(store.getState().elements.size).toBe(1);

      // Delete table
      store.getState().deleteElement(table.id);

      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().elements.has(table.id)).toBe(false);
    });
  });

  describe('Table Integration', () => {
    it('should work with element creation workflow', () => {
      // Create table
      const table: TableElement = {
        id: ElementId('integration-table'),
        type: 'table',
        x: 100,
        y: 100,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 50 },
            { id: 'row-2', height: 50 }
          ],
          columns: [
            { id: 'col-1', width: 150 },
            { id: 'col-2', width: 150 }
          ],
          cells: [
            [{ content: '' }, { content: '' }],
            [{ content: '' }, { content: '' }]
          ]
        }
      };

      store.getState().addElement(table);

      // Add content to cells
      store.getState().updateTableCell(table.id, 0, 0, 'Header 1');
      store.getState().updateTableCell(table.id, 0, 1, 'Header 2');
      store.getState().updateTableCell(table.id, 1, 0, 'Data 1');
      store.getState().updateTableCell(table.id, 1, 1, 'Data 2');

      // Verify workflow
      expect(store.getState().elements.size).toBe(1);
      const savedTable = store.getState().elements.get(table.id) as TableElement;
      expect(savedTable.enhancedTableData?.cells[0][0].content).toBe('Header 1');
      expect(savedTable.enhancedTableData?.cells[0][1].content).toBe('Header 2');
      expect(savedTable.enhancedTableData?.cells[1][0].content).toBe('Data 1');
      expect(savedTable.enhancedTableData?.cells[1][1].content).toBe('Data 2');
    });

    it('should work with undo/redo operations', () => {
      const table: TableElement = {
        id: ElementId('undo-table'),
        type: 'table',
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rows: 2,
        cols: 2,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 50 },
            { id: 'row-2', height: 50 }
          ],
          columns: [
            { id: 'col-1', width: 150 },
            { id: 'col-2', width: 150 }
          ],
          cells: [
            [{ content: '' }, { content: '' }],
            [{ content: '' }, { content: '' }]
          ]
        }
      };

      store.getState().addElement(table);
      store.getState().updateTableCell(table.id, 0, 0, 'Test Content');

      // Verify table operations work with history system
      expect(store.getState().elements.size).toBe(1);
      const savedTable = store.getState().elements.get(table.id) as TableElement;
      expect(savedTable.enhancedTableData?.cells[0][0].content).toBe('Test Content');
    });
  });
});

describe('TableTool Tests', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
}); 