/**
 * Table Data Model - Rich Text Segments Integration
 * 
 * This module provides standardized interfaces and utilities for table cell data
 * that align with the rich text segment format used throughout the application.
 * 
 * Key Features:
 * - Unified rich text segments support in table cells
 * - Backward compatibility with plain text
 * - Serialization/deserialization for copy-paste and undo/redo
 * - Type-safe cell data manipulation
 * 
 * @version 1.0.0
 * @author LibreOllama Team
 */

import { RichTextSegment, StandardTextFormat } from '../types/richText';
import { richTextManager } from '../components/canvas/RichTextSystem/UnifiedRichTextManager';

/**
 * Enhanced TableCell interface with standardized rich text segments support
 */
export interface TableCellData {
  /** Unique identifier for the cell */
  id: string;
  /** Plain text content (for backward compatibility and plain text fallback) */
  text?: string;
  /** Rich text content as standardized segments */
  segments: RichTextSegment[];
  /** IDs of canvas elements contained within this cell */
  containedElementIds: string[];
  /** Cell styling properties */
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  padding?: number;
  /** Whether this cell is a header cell */
  isHeader?: boolean;
}

/**
 * Table row configuration
 */
export interface TableRowData {
  id: string;
  height: number;
  minHeight?: number;
  maxHeight?: number;
  isResizable?: boolean;
  backgroundColor?: string;
  isHeader?: boolean;
}

/**
 * Table column configuration
 */
export interface TableColumnData {
  id: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  isResizable?: boolean;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

/**
 * Complete table data structure with rich text support
 */
export interface TableDataModel {
  /** Array of row configurations */
  rows: TableRowData[];
  /** Array of column configurations */
  columns: TableColumnData[];
  /** 2D array of cells [row][col] with rich text segments */
  cells: TableCellData[][];
  /** Table-level configuration */
  showGridLines?: boolean;
  cornerRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  defaultCellPadding?: number;
  autoResizeRows?: boolean;
  allowDragAndDrop?: boolean;
  keyboardNavigationEnabled?: boolean;
}

/**
 * Default formatting for new table cells
 */
export const DEFAULT_CELL_FORMAT: StandardTextFormat = {
  fontSize: 14,
  fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
  textColor: '#1E293B',
  textAlign: 'left',
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  listType: 'none',
  isHyperlink: false,
  hyperlinkUrl: '',
  textStyle: 'default'
};

/**
 * Default formatting for header cells
 */
export const DEFAULT_HEADER_FORMAT: StandardTextFormat = {
  ...DEFAULT_CELL_FORMAT,
  bold: true,
  fontSize: 16
};

/**
 * Utility class for table cell data operations
 */
export class TableCellDataUtils {
  /**
   * Creates a new table cell with rich text segments
   */
  static createCell(
    id: string,
    text: string = '',
    isHeader: boolean = false,
    format?: Partial<StandardTextFormat>
  ): TableCellData {
    const cellFormat = isHeader 
      ? { ...DEFAULT_HEADER_FORMAT, ...format }
      : { ...DEFAULT_CELL_FORMAT, ...format };

    const segments = text 
      ? richTextManager.plainTextToSegments(text, cellFormat)
      : [];

    return {
      id,
      text,
      segments,
      containedElementIds: [],
      backgroundColor: isHeader ? '#F3F4F6' : '#FFFFFF',
      textColor: cellFormat.textColor,
      fontSize: cellFormat.fontSize,
      fontFamily: cellFormat.fontFamily,
      textAlign: cellFormat.textAlign,
      verticalAlign: 'middle',
      padding: 8,
      isHeader
    };
  }

  /**
   * Updates cell content with new rich text segments
   */
  static updateCellSegments(
    cell: TableCellData,
    segments: RichTextSegment[]
  ): TableCellData {
    const plainText = richTextManager.segmentsToPlainText(segments);
    
    return {
      ...cell,
      segments,
      text: plainText // Keep plain text in sync
    };
  }

  /**
   * Converts plain text to rich text segments for existing cells
   */
  static upgradeToRichText(
    cell: TableCellData,
    format?: Partial<StandardTextFormat>
  ): TableCellData {
    if (cell.segments && cell.segments.length > 0) {
      // Already has rich text segments
      return cell;
    }

    const cellFormat = cell.isHeader 
      ? { ...DEFAULT_HEADER_FORMAT, ...format }
      : { ...DEFAULT_CELL_FORMAT, ...format };

    const segments = cell.text 
      ? richTextManager.plainTextToSegments(cell.text, cellFormat)
      : [];

    return {
      ...cell,
      segments
    };
  }

  /**
   * Serializes cell data for copy-paste and persistence
   */
  static serialize(cell: TableCellData): string {
    try {
      return JSON.stringify({
        id: cell.id,
        text: cell.text,
        segments: cell.segments,
        containedElementIds: cell.containedElementIds,
        backgroundColor: cell.backgroundColor,
        textColor: cell.textColor,
        fontSize: cell.fontSize,
        fontFamily: cell.fontFamily,
        fontStyle: cell.fontStyle,
        textAlign: cell.textAlign,
        verticalAlign: cell.verticalAlign,
        padding: cell.padding,
        isHeader: cell.isHeader
      });
    } catch (error) {
      console.error('Failed to serialize table cell data:', error);
      return JSON.stringify({ id: cell.id, text: cell.text || '', segments: [] });
    }
  }

  /**
   * Deserializes cell data from copy-paste or persistence
   */
  static deserialize(data: string, fallbackId?: string): TableCellData {
    try {
      const parsed = JSON.parse(data);
      
      // Validate required properties
      if (!parsed.id && !fallbackId) {
        throw new Error('Cell ID is required');
      }

      // Ensure segments array exists
      if (!Array.isArray(parsed.segments)) {
        parsed.segments = [];
      }

      // Upgrade from plain text if segments are empty but text exists
      if (parsed.segments.length === 0 && parsed.text) {
        const format = {
          fontSize: parsed.fontSize || DEFAULT_CELL_FORMAT.fontSize,
          fontFamily: parsed.fontFamily || DEFAULT_CELL_FORMAT.fontFamily,
          textColor: parsed.textColor || DEFAULT_CELL_FORMAT.textColor,
          textAlign: parsed.textAlign || DEFAULT_CELL_FORMAT.textAlign,
          bold: parsed.isHeader || false
        };
        parsed.segments = richTextManager.plainTextToSegments(parsed.text, format);
      }

      return {
        id: parsed.id || fallbackId || `cell_${Date.now()}`,
        text: parsed.text || '',
        segments: parsed.segments || [],
        containedElementIds: Array.isArray(parsed.containedElementIds) ? parsed.containedElementIds : [],
        backgroundColor: parsed.backgroundColor || '#FFFFFF',
        textColor: parsed.textColor || DEFAULT_CELL_FORMAT.textColor,
        fontSize: parsed.fontSize || DEFAULT_CELL_FORMAT.fontSize,
        fontFamily: parsed.fontFamily || DEFAULT_CELL_FORMAT.fontFamily,
        fontStyle: parsed.fontStyle,
        textAlign: parsed.textAlign || 'left',
        verticalAlign: parsed.verticalAlign || 'middle',
        padding: parsed.padding || 8,
        isHeader: parsed.isHeader || false
      };
    } catch (error) {
      console.error('Failed to deserialize table cell data:', error);
      
      // Return a safe fallback cell
      return this.createCell(
        fallbackId || `cell_${Date.now()}`,
        typeof data === 'string' ? data : ''
      );
    }
  }

  /**
   * Creates a copy of cell data for duplication operations
   */
  static clone(cell: TableCellData, newId?: string): TableCellData {
    return {
      ...cell,
      id: newId || `${cell.id}_copy_${Date.now()}`,
      containedElementIds: [...cell.containedElementIds],
      segments: cell.segments.map(segment => ({ ...segment }))
    };
  }

  /**
   * Validates cell data structure
   */
  static validate(cell: any): cell is TableCellData {
    return (
      cell &&
      typeof cell === 'object' &&
      typeof cell.id === 'string' &&
      Array.isArray(cell.segments) &&
      Array.isArray(cell.containedElementIds)
    );
  }
}

/**
 * Utility functions for table data model operations
 */
export class TableDataModelUtils {
  /**
   * Creates a new table with rich text support
   */
  static createTable(
    tableId: string,
    rows: number = 3,
    cols: number = 3
  ): TableDataModel {
    // Create rows
    const tableRows: TableRowData[] = Array(rows).fill(null).map((_, index) => ({
      id: `row_${tableId}_${index}`,
      height: index === 0 ? 60 : 50, // Header row slightly taller
      minHeight: 30,
      isResizable: true,
      isHeader: index === 0
    }));

    // Create columns
    const tableColumns: TableColumnData[] = Array(cols).fill(null).map((_, index) => ({
      id: `col_${tableId}_${index}`,
      width: 120,
      minWidth: 60,
      isResizable: true,
      textAlign: 'left'
    }));

    // Create cells with rich text segments
    const tableCells: TableCellData[][] = Array(rows).fill(null).map((_, rowIndex) =>
      Array(cols).fill(null).map((_, colIndex) => {
        const isHeader = rowIndex === 0;
        const cellId = `cell_${tableId}_${rowIndex}_${colIndex}`;
        const cellText = isHeader ? `Header ${colIndex + 1}` : '';
        
        return TableCellDataUtils.createCell(cellId, cellText, isHeader);
      })
    );

    return {
      rows: tableRows,
      columns: tableColumns,
      cells: tableCells,
      showGridLines: true,
      cornerRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      defaultCellPadding: 8,
      autoResizeRows: true,
      allowDragAndDrop: true,
      keyboardNavigationEnabled: true
    };
  }

  /**
   * Serializes entire table data for persistence
   */
  static serialize(tableData: TableDataModel): string {
    try {
      const serialized = {
        rows: tableData.rows,
        columns: tableData.columns,
        cells: tableData.cells.map(row => 
          row.map(cell => TableCellDataUtils.serialize(cell))
        ),
        showGridLines: tableData.showGridLines,
        cornerRadius: tableData.cornerRadius,
        borderWidth: tableData.borderWidth,
        borderColor: tableData.borderColor,
        defaultCellPadding: tableData.defaultCellPadding,
        autoResizeRows: tableData.autoResizeRows,
        allowDragAndDrop: tableData.allowDragAndDrop,
        keyboardNavigationEnabled: tableData.keyboardNavigationEnabled
      };

      return JSON.stringify(serialized);
    } catch (error) {
      console.error('Failed to serialize table data:', error);
      throw error;
    }
  }

  /**
   * Deserializes table data from persistence
   */
  static deserialize(data: string, tableId: string): TableDataModel {
    try {
      const parsed = JSON.parse(data);

      // Deserialize cells
      const cells: TableCellData[][] = parsed.cells.map((row: any[], rowIndex: number) =>
        row.map((cellData: any, colIndex: number) => {
          const fallbackId = `cell_${tableId}_${rowIndex}_${colIndex}`;
          return typeof cellData === 'string' 
            ? TableCellDataUtils.deserialize(cellData, fallbackId)
            : TableCellDataUtils.deserialize(JSON.stringify(cellData), fallbackId);
        })
      );

      return {
        rows: parsed.rows || [],
        columns: parsed.columns || [],
        cells,
        showGridLines: parsed.showGridLines ?? true,
        cornerRadius: parsed.cornerRadius ?? 8,
        borderWidth: parsed.borderWidth ?? 1,
        borderColor: parsed.borderColor ?? '#E5E7EB',
        defaultCellPadding: parsed.defaultCellPadding ?? 8,
        autoResizeRows: parsed.autoResizeRows ?? true,
        allowDragAndDrop: parsed.allowDragAndDrop ?? true,
        keyboardNavigationEnabled: parsed.keyboardNavigationEnabled ?? true
      };
    } catch (error) {
      console.error('Failed to deserialize table data:', error);
      
      // Return a safe fallback table
      return this.createTable(tableId, 3, 3);
    }
  }

  /**
   * Upgrades legacy table data to rich text format
   */
  static upgradeFromLegacy(
    legacyTableData: any,
    tableId: string
  ): TableDataModel {
    if (!legacyTableData) {
      return this.createTable(tableId, 3, 3);
    }

    // Handle different legacy formats
    if (legacyTableData.cells && Array.isArray(legacyTableData.cells)) {
      // Already in enhanced format, but may need segments upgrade
      const upgradedCells = legacyTableData.cells.map((row: any[], rowIndex: number) =>
        row.map((cell: any, colIndex: number) => {
          if (TableCellDataUtils.validate(cell)) {
            return TableCellDataUtils.upgradeToRichText(cell);
          }
          
          // Convert from old format
          const cellId = `cell_${tableId}_${rowIndex}_${colIndex}`;
          const cellText = typeof cell === 'string' ? cell : (cell?.text || '');
          const isHeader = rowIndex === 0;
          
          return TableCellDataUtils.createCell(cellId, cellText, isHeader);
        })
      );

      return {
        ...legacyTableData,
        cells: upgradedCells
      };
    }    // Handle simple array format
    if (Array.isArray(legacyTableData)) {
      const rows = legacyTableData.length;
      const cols = legacyTableData[0]?.length || 3;
      
      const tableCells: TableCellData[][] = legacyTableData.map((row: any[], rowIndex: number) =>
        row.map((cellText: any, colIndex: number) => {
          const cellId = `cell_${tableId}_${rowIndex}_${colIndex}`;
          const text = typeof cellText === 'string' ? cellText : (cellText?.text || '');
          const isHeader = rowIndex === 0;
          
          return TableCellDataUtils.createCell(cellId, text, isHeader);
        })
      );

      const newTable = this.createTable(tableId, rows, cols);
      newTable.cells = tableCells;
      return newTable;
    }

    // Fallback to default table
    return this.createTable(tableId, 3, 3);
  }
}

export default {
  TableCellDataUtils,
  TableDataModelUtils,
  DEFAULT_CELL_FORMAT,
  DEFAULT_HEADER_FORMAT
};
