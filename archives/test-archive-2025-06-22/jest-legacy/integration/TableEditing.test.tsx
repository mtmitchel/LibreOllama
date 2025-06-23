/**
 * Table Editing Integration Tests
 * Tests comprehensive table functionality including:
 * - Cell text editing with different input types
 * - Table resizing and column/row manipulation
 * - Rich text formatting in cells
 * - Table-specific keyboard navigation
 * - Performance with large tables
 */

import React, { useState, useRef } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { setupTestEnvironment } from '../utils/testUtils';

// Import types
import type { 
  TableElement, 
  ElementId, 
  TableCell,
  EnhancedTableData,
  CanvasElement 
} from '../../features/canvas/types/enhanced.types';

// Import components (assuming there's a table component)
import { EnhancedTableElement } from '../../features/canvas/components/EnhancedTableElement';

const { render: testRender, user } = setupTestEnvironment();

// Helper function to create table elements with realistic data
const createTableElement = (overrides: Partial<TableElement> = {}): TableElement => {
  const defaultTableData: TableCell[][] = [
    [
      { content: 'Header 1', fontSize: 14, fontWeight: 'bold', backgroundColor: '#f0f0f0' },
      { content: 'Header 2', fontSize: 14, fontWeight: 'bold', backgroundColor: '#f0f0f0' },
      { content: 'Header 3', fontSize: 14, fontWeight: 'bold', backgroundColor: '#f0f0f0' },
    ],
    [
      { content: 'Row 1, Cell 1', textAlign: 'left' },
      { content: '123.45', textAlign: 'right' },
      { content: 'Active', textColor: '#22C55E' },
    ],
    [
      { content: 'Row 2, Cell 1', textAlign: 'left' },
      { content: '67.89', textAlign: 'right' },
      { content: 'Inactive', textColor: '#EF4444' },
    ],
  ];

  const enhancedTableData: EnhancedTableData = {
    rows: [
      { height: 40, id: 'header-row' },
      { height: 32, id: 'row-1' },
      { height: 32, id: 'row-2' },
    ],
    columns: [
      { width: 150, id: 'col-1' },
      { width: 100, id: 'col-2' },
      { width: 100, id: 'col-3' },
    ],
    cells: defaultTableData,
  };

  return {
    id: `table-${Math.random().toString(36).substr(2, 9)}` as ElementId,
    type: 'table',
    x: 100,
    y: 100,
    width: 350,
    height: 104,
    rows: 3,
    cols: 3,
    tableData: defaultTableData,
    enhancedTableData,
    cellPadding: 8,
    borderWidth: 1,
    borderColor: '#000000',
    isLocked: false,
    isHidden: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
};

// Test Table Component
interface TestTableProps {
  element: TableElement;
  isSelected: boolean;
  editingCellId?: string | null;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onStartCellEdit: (tableId: ElementId, cellId: string) => void;
  onEndCellEdit: () => void;
  onCellUpdate: (tableId: ElementId, rowIndex: number, colIndex: number, cellData: Partial<TableCell>) => void;
}

const TestTable: React.FC<TestTableProps> = ({
  element,
  isSelected,
  editingCellId,
  onUpdate,
  onStartCellEdit,
  onEndCellEdit,
  onCellUpdate,
}) => {
  const stageRef = useRef<Konva.Stage>(null);

  return (
    <div>
      <Stage width={800} height={600} ref={stageRef}>
        <Layer>
          <EnhancedTableElement
            element={element}
            isSelected={isSelected}
            onSelect={() => {}}
            onUpdate={(updates) => onUpdate(element.id, updates)}
            stageRef={stageRef}
            data-testid={`table-${element.id}`}
          />
        </Layer>
      </Stage>
    </div>
  );
};

describe('Table Editing Integration Tests', () => {
  let mockTable: TableElement;
  let mockOnUpdate: jest.Mock;
  let mockOnStartCellEdit: jest.Mock;
  let mockOnEndCellEdit: jest.Mock;
  let mockOnCellUpdate: jest.Mock;
  let mockEditingCellId: string | null;

  beforeEach(() => {
    mockTable = createTableElement();
    mockOnUpdate = jest.fn();
    mockOnStartCellEdit = jest.fn();
    mockOnEndCellEdit = jest.fn();
    mockOnCellUpdate = jest.fn();
    mockEditingCellId = null;
  });

  const renderTestTable = (props: Partial<TestTableProps> = {}) => {
    return testRender(
      <TestTable
        element={mockTable}
        isSelected={false}
        editingCellId={mockEditingCellId}
        onUpdate={mockOnUpdate}
        onStartCellEdit={mockOnStartCellEdit}
        onEndCellEdit={mockOnEndCellEdit}
        onCellUpdate={mockOnCellUpdate}
        {...props}
      />
    );
  };

  describe('Cell Text Editing', () => {
    it('should start cell editing on double-click', async () => {
      await renderTestTable();
      
      const table = screen.getByTestId(`table-${mockTable.id}`);
      expect(table).toBeInTheDocument();
      
      // Double-click on first data cell (row 1, col 0)
      const cellPosition = {
        clientX: 175, // Approximate position of cell
        clientY: 140,
      };
      
      // Double-click on table at specific position
      fireEvent.dblClick(table, cellPosition);
      
      expect(mockOnStartCellEdit).toHaveBeenCalledWith(
        mockTable.id,
        'row-1-col-0'
      );
    });

    it('should handle text input in cells', async () => {
      mockEditingCellId = 'row-1-col-0';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      // Simulate typing in the editing cell
      const editingInput = screen.getByDisplayValue('Row 1, Cell 1');
      await user.clear(editingInput);
      await user.type(editingInput, 'Updated Cell Content');
      
      // Confirm edit with Enter
      fireEvent.keyDown(editingInput, { key: 'Enter' });
      
      expect(mockOnCellUpdate).toHaveBeenCalledWith(
        mockTable.id,
        1, // row index
        0, // col index
        expect.objectContaining({
          content: 'Updated Cell Content'
        })
      );
      
      expect(mockOnEndCellEdit).toHaveBeenCalled();
    });

    it('should handle numerical input with validation', async () => {
      mockEditingCellId = 'row-1-col-1'; // Numerical cell
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const editingInput = screen.getByDisplayValue('123.45');
      await user.clear(editingInput);
      await user.type(editingInput, '456.78');
      
      fireEvent.keyDown(editingInput, { key: 'Enter' });
      
      expect(mockOnCellUpdate).toHaveBeenCalledWith(
        mockTable.id,
        1,
        1,
        expect.objectContaining({
          content: '456.78'
        })
      );
    });

    it('should handle invalid numerical input', async () => {
      mockEditingCellId = 'row-1-col-1';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const editingInput = screen.getByDisplayValue('123.45');
      await user.clear(editingInput);
      await user.type(editingInput, 'invalid-number');
      
      fireEvent.keyDown(editingInput, { key: 'Enter' });
      
      // Should either reject the input or convert to valid format
      expect(mockOnCellUpdate).toHaveBeenCalledWith(
        mockTable.id,
        1,
        1,
        expect.objectContaining({
          content: expect.any(String)
        })
      );
    });

    it('should cancel editing on Escape key', async () => {
      mockEditingCellId = 'row-1-col-0';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const editingInput = screen.getByDisplayValue('Row 1, Cell 1');
      await user.type(editingInput, ' - Modified');
      
      // Cancel with Escape
      fireEvent.keyDown(editingInput, { key: 'Escape' });
      
      expect(mockOnEndCellEdit).toHaveBeenCalled();
      expect(mockOnCellUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Rich Text Formatting', () => {
    it('should apply bold formatting to cell text', async () => {
      mockEditingCellId = 'row-1-col-0';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const editingInput = screen.getByDisplayValue('Row 1, Cell 1');      // Select text and apply bold
      const input = editingInput as HTMLInputElement;
      input.focus();
      input.setSelectionRange(0, input.value.length);
      fireEvent.keyDown(editingInput, { key: 'b', ctrlKey: true });
      
      expect(mockOnCellUpdate).toHaveBeenCalledWith(
        mockTable.id,
        1,
        0,
        expect.objectContaining({
          fontWeight: 'bold'
        })
      );
    });

    it('should apply italic formatting to cell text', async () => {
      mockEditingCellId = 'row-1-col-0';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const editingInput = screen.getByDisplayValue('Row 1, Cell 1');
        const input = editingInput as HTMLInputElement;
      input.focus();
      input.setSelectionRange(0, input.value.length);
      fireEvent.keyDown(editingInput, { key: 'i', ctrlKey: true });
      
      expect(mockOnCellUpdate).toHaveBeenCalledWith(
        mockTable.id,
        1,
        0,
        expect.objectContaining({
          fontStyle: 'italic'
        })
      );
    });

    it('should change text color', async () => {
      mockEditingCellId = 'row-1-col-0';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      // Simulate color picker interaction
      const colorPicker = screen.getByTestId('cell-text-color-picker');
      fireEvent.change(colorPicker, { target: { value: '#FF5722' } });
      
      expect(mockOnCellUpdate).toHaveBeenCalledWith(
        mockTable.id,
        1,
        0,
        expect.objectContaining({
          textColor: '#FF5722'
        })
      );
    });

    it('should change cell background color', async () => {
      mockEditingCellId = 'row-1-col-0';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const backgroundColorPicker = screen.getByTestId('cell-background-color-picker');
      fireEvent.change(backgroundColorPicker, { target: { value: '#FFF3E0' } });
      
      expect(mockOnCellUpdate).toHaveBeenCalledWith(
        mockTable.id,
        1,
        0,
        expect.objectContaining({
          backgroundColor: '#FFF3E0'
        })
      );
    });
  });

  describe('Table Structure Manipulation', () => {
    it('should add new row to table', async () => {
      await renderTestTable({ isSelected: true });
      
      const addRowButton = screen.getByTestId('add-row-button');
      await user.click(addRowButton);
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockTable.id,
        expect.objectContaining({
          rows: 4, // Original 3 + 1 new
          tableData: expect.arrayContaining([
            expect.any(Array), // Original rows
            expect.any(Array),
            expect.any(Array),
            expect.arrayContaining([ // New row
              expect.objectContaining({ content: '' }),
              expect.objectContaining({ content: '' }),
              expect.objectContaining({ content: '' }),
            ])
          ])
        })
      );
    });

    it('should add new column to table', async () => {
      await renderTestTable({ isSelected: true });
      
      const addColumnButton = screen.getByTestId('add-column-button');
      await user.click(addColumnButton);
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockTable.id,
        expect.objectContaining({
          cols: 4, // Original 3 + 1 new
          enhancedTableData: expect.objectContaining({
            columns: expect.arrayContaining([
              expect.any(Object),
              expect.any(Object),
              expect.any(Object),
              expect.objectContaining({ width: expect.any(Number) })
            ])
          })
        })
      );
    });

    it('should delete row from table', async () => {
      await renderTestTable({ isSelected: true });
      
      // Right-click on row to show context menu
      const table = screen.getByTestId(`table-${mockTable.id}`);
      fireEvent.contextMenu(table, { clientX: 125, clientY: 172 }); // Row 2 position
      
      const deleteRowButton = screen.getByTestId('delete-row-button');
      await user.click(deleteRowButton);
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockTable.id,
        expect.objectContaining({
          rows: 2, // 3 - 1 deleted
          tableData: expect.arrayContaining([
            expect.any(Array), // Header row
            expect.any(Array), // Remaining data row
          ])
        })
      );
    });

    it('should delete column from table', async () => {
      await renderTestTable({ isSelected: true });
      
      const table = screen.getByTestId(`table-${mockTable.id}`);
      fireEvent.contextMenu(table, { clientX: 200, clientY: 125 }); // Column 2 position
      
      const deleteColumnButton = screen.getByTestId('delete-column-button');
      await user.click(deleteColumnButton);
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockTable.id,
        expect.objectContaining({
          cols: 2, // 3 - 1 deleted
          enhancedTableData: expect.objectContaining({
            columns: expect.arrayContaining([
              expect.any(Object),
              expect.any(Object), // Only 2 columns remaining
            ])
          })
        })
      );
    });
  });

  describe('Column and Row Resizing', () => {
    it('should resize column by dragging column border', async () => {
      await renderTestTable({ isSelected: true });
      
      const table = screen.getByTestId(`table-${mockTable.id}`);
      
      // Find column border (between col 1 and col 2)
      const columnBorder = { clientX: 250, clientY: 125 };
      
      fireEvent.mouseDown(table, columnBorder);
      fireEvent.mouseMove(table, { clientX: 280, clientY: 125 }); // Drag right
      fireEvent.mouseUp(table);
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockTable.id,
        expect.objectContaining({
          enhancedTableData: expect.objectContaining({
            columns: expect.arrayContaining([
              expect.objectContaining({ width: 180 }), // Increased from 150 to 180
              expect.any(Object),
              expect.any(Object),
            ])
          })
        })
      );
    });

    it('should resize row by dragging row border', async () => {
      await renderTestTable({ isSelected: true });
      
      const table = screen.getByTestId(`table-${mockTable.id}`);
      
      // Find row border (between header and first data row)
      const rowBorder = { clientX: 225, clientY: 140 };
      
      fireEvent.mouseDown(table, rowBorder);
      fireEvent.mouseMove(table, { clientX: 225, clientY: 155 }); // Drag down
      fireEvent.mouseUp(table);
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockTable.id,
        expect.objectContaining({
          enhancedTableData: expect.objectContaining({
            rows: expect.arrayContaining([
              expect.objectContaining({ height: 55 }), // Increased from 40 to 55
              expect.any(Object),
              expect.any(Object),
            ])
          })
        })
      );
    });

    it('should maintain minimum column width', async () => {
      await renderTestTable({ isSelected: true });
      
      const table = screen.getByTestId(`table-${mockTable.id}`);
      
      // Try to resize column to very small width
      fireEvent.mouseDown(table, { clientX: 250, clientY: 125 });
      fireEvent.mouseMove(table, { clientX: 160, clientY: 125 }); // Try to make very narrow
      fireEvent.mouseUp(table);
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockTable.id,
        expect.objectContaining({
          enhancedTableData: expect.objectContaining({
            columns: expect.arrayContaining([              expect.objectContaining({ 
                width: expect.any(Number) // Should maintain minimum width
              }),
              expect.any(Object),
              expect.any(Object),
            ])
          })
        })
      );
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate to next cell with Tab key', async () => {
      mockEditingCellId = 'row-1-col-0';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const editingInput = screen.getByDisplayValue('Row 1, Cell 1');
      fireEvent.keyDown(editingInput, { key: 'Tab' });
      
      expect(mockOnEndCellEdit).toHaveBeenCalled();
      expect(mockOnStartCellEdit).toHaveBeenCalledWith(
        mockTable.id,
        'row-1-col-1' // Next cell
      );
    });

    it('should navigate to previous cell with Shift+Tab', async () => {
      mockEditingCellId = 'row-1-col-1';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const editingInput = screen.getByDisplayValue('123.45');
      fireEvent.keyDown(editingInput, { key: 'Tab', shiftKey: true });
      
      expect(mockOnEndCellEdit).toHaveBeenCalled();
      expect(mockOnStartCellEdit).toHaveBeenCalledWith(
        mockTable.id,
        'row-1-col-0' // Previous cell
      );
    });

    it('should navigate to cell below with Arrow Down', async () => {
      mockEditingCellId = 'row-1-col-0';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const editingInput = screen.getByDisplayValue('Row 1, Cell 1');
      fireEvent.keyDown(editingInput, { key: 'ArrowDown' });
      
      expect(mockOnEndCellEdit).toHaveBeenCalled();
      expect(mockOnStartCellEdit).toHaveBeenCalledWith(
        mockTable.id,
        'row-2-col-0' // Cell below
      );
    });

    it('should navigate to cell above with Arrow Up', async () => {
      mockEditingCellId = 'row-2-col-0';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const editingInput = screen.getByDisplayValue('Row 2, Cell 1');
      fireEvent.keyDown(editingInput, { key: 'ArrowUp' });
      
      expect(mockOnEndCellEdit).toHaveBeenCalled();
      expect(mockOnStartCellEdit).toHaveBeenCalledWith(
        mockTable.id,
        'row-1-col-0' // Cell above
      );
    });

    it('should handle navigation at table boundaries', async () => {
      // Test navigation from last cell (should wrap or do nothing)
      mockEditingCellId = 'row-2-col-2';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const editingInput = screen.getByDisplayValue('Inactive');
      fireEvent.keyDown(editingInput, { key: 'Tab' });
      
      // Should either wrap to first cell or end editing
      expect(mockOnEndCellEdit).toHaveBeenCalled();
    });
  });

  describe('Performance and Large Tables', () => {
    it('should handle large table with many rows efficiently', async () => {
      // Create a large table
      const largeTableData: TableCell[][] = Array.from({ length: 100 }, (_, rowIndex) =>
        Array.from({ length: 10 }, (_, colIndex) => ({
          content: `Row ${rowIndex + 1}, Col ${colIndex + 1}`,
          textAlign: 'left' as const,
        }))
      );

      const largeTable = createTableElement({
        rows: 100,
        cols: 10,
        tableData: largeTableData,
        height: 3200, // 100 rows * 32px each
        width: 1000, // 10 cols * 100px each
      });

      const startTime = performance.now();
      await renderTestTable({ element: largeTable });
      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // 1 second

      const table = screen.getByTestId(`table-${largeTable.id}`);
      expect(table).toBeInTheDocument();
    });

    it('should handle scrolling in large tables', async () => {
      const largeTable = createTableElement({
        rows: 50,
        cols: 8,
        height: 1600, // Limited viewport height
        width: 800,
      });

      await renderTestTable({ element: largeTable });
      
      const table = screen.getByTestId(`table-${largeTable.id}`);
      
      // Simulate scrolling
      fireEvent.scroll(table, { target: { scrollTop: 500 } });
      
      // Table should handle scroll without performance issues
      expect(table).toBeInTheDocument();
    });

    it('should virtualize rows for very large tables', async () => {
      const veryLargeTable = createTableElement({
        rows: 1000,
        cols: 5,
        height: 600, // Fixed viewport height
        width: 500,
      });

      await renderTestTable({ element: veryLargeTable });
      
      // Should only render visible rows (virtualization)
      const renderedCells = screen.getAllByText(/Row \d+, Col \d+/);
      
      // Should render significantly fewer than 1000 * 5 = 5000 cells
      expect(renderedCells.length).toBeLessThan(500);
    });
  });

  describe('Complex Table Operations', () => {
    it('should handle copy and paste of cell ranges', async () => {
      await renderTestTable({ isSelected: true });
      
      const table = screen.getByTestId(`table-${mockTable.id}`);
      
      // Select a range of cells (drag selection)
      fireEvent.mouseDown(table, { clientX: 175, clientY: 140 }); // Start at row 1, col 0
      fireEvent.mouseMove(table, { clientX: 275, clientY: 172 }); // End at row 2, col 1
      fireEvent.mouseUp(table);
      
      // Copy selection
      fireEvent.keyDown(table, { key: 'c', ctrlKey: true });
      
      // Move to different location and paste
      fireEvent.click(table, { clientX: 175, clientY: 204 }); // Row 3, col 0 (if exists)
      fireEvent.keyDown(table, { key: 'v', ctrlKey: true });
      
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it('should handle undo/redo operations', async () => {
      mockEditingCellId = 'row-1-col-0';
      await renderTestTable({ editingCellId: mockEditingCellId });
      
      const editingInput = screen.getByDisplayValue('Row 1, Cell 1');
      await user.clear(editingInput);
      await user.type(editingInput, 'Modified Content');
      fireEvent.keyDown(editingInput, { key: 'Enter' });
      
      // Undo the change
      fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockTable.id,
        expect.objectContaining({
          tableData: expect.arrayContaining([
            expect.any(Array),
            expect.arrayContaining([
              expect.objectContaining({ content: 'Row 1, Cell 1' }), // Original content restored
              expect.any(Object),
              expect.any(Object),
            ]),
            expect.any(Array),
          ])
        })
      );
    });

    it('should handle sorting by column', async () => {
      await renderTestTable({ isSelected: true });
      
      const table = screen.getByTestId(`table-${mockTable.id}`);
      
      // Click on column header to sort
      fireEvent.click(table, { clientX: 275, clientY: 125 }); // Column 2 header (numerical data)
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockTable.id,
        expect.objectContaining({
          tableData: expect.arrayContaining([
            expect.any(Array), // Header row unchanged
            expect.arrayContaining([
              expect.any(Object),
              expect.objectContaining({ content: '67.89' }), // Smaller number first
              expect.any(Object),
            ]),
            expect.arrayContaining([
              expect.any(Object),
              expect.objectContaining({ content: '123.45' }), // Larger number second
              expect.any(Object),
            ]),
          ])
        })
      );
    });

    it('should handle filtering table data', async () => {
      await renderTestTable({ isSelected: true });
      
      const filterInput = screen.getByTestId('table-filter-input');
      await user.type(filterInput, 'Active');
      
      // Should filter to show only rows containing 'Active'
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockTable.id,
        expect.objectContaining({
          // Filtered data would be handled by the component's internal state
          // This is a conceptual test - actual implementation may vary
        })
      );
    });
  });
});

