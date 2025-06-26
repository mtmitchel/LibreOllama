// src/components/canvas/shapes/CachedTableShape.tsx
/**
 * Cached Table Shape Component
 * Part of Phase 4.2 - Shape Caching Implementation
 * 
 * Provides strategic caching for table elements which are among the most complex
 * canvas shapes with multiple cells, text rendering, and interactive elements.
 */

import React, { useMemo } from 'react';
import { Group, Rect, Text } from 'react-konva';
import { CanvasElement, TableElement, isTableElement } from '../types/enhanced.types';
import { designSystem } from '../../../design-system';
import { CachedShape } from './CachedShape';

interface CachedTableShapeProps {
  element: TableElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

/**
 * CachedTableShape - High-performance table rendering with strategic caching
 * 
 * Features:
 * - Caches table cells as groups for faster rendering
 * - Invalidates cache when table structure or content changes
 * - Optimized for tables with many cells or complex formatting
 */
export const CachedTableShape: React.FC<CachedTableShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps
}) => {
  // Extract table properties with defaults
  const rows = element.rows || 2;
  const cols = element.cols || 2;
  const cellWidth = element.cellWidth || 100;
  const cellHeight = element.cellHeight || 40;
  const tableData = element.tableData || [];
  
  // Calculate table dimensions
  const tableWidth = cols * cellWidth;
  const tableHeight = rows * cellHeight;

  // Cache dependencies for tables include structure and content
  const cacheDependencies = useMemo(() => [
    rows,
    cols,
    cellWidth,
    cellHeight,
    JSON.stringify(tableData), // Content changes
    element.enhancedTableData ? JSON.stringify(element.enhancedTableData) : null,
    isSelected
  ], [rows, cols, cellWidth, cellHeight, tableData, element.enhancedTableData, isSelected]);

  // Determine if table should be cached (always cache tables with 6+ cells)
  const shouldCacheTable = rows * cols >= 6;

  // Render table cells
  const renderTableCells = useMemo(() => {
    const cells = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellX = col * cellWidth;
        const cellY = row * cellHeight;
        const cellData = tableData[row]?.[col];
        const cellText = cellData && typeof cellData === 'object' ? cellData.content : (typeof cellData === 'string' ? cellData : `R${row + 1}C${col + 1}`);
        
        cells.push(
          <Group key={`cell-${row}-${col}`}>
            <Rect
              x={cellX}
              y={cellY}
              width={cellWidth}
              height={cellHeight}
              fill={designSystem.colors.secondary[50]}
              stroke={designSystem.colors.secondary[300]}
              strokeWidth={1}
            />
            <Text
              x={cellX + 8}
              y={cellY + 8}
              width={cellWidth - 16}
              height={cellHeight - 16}
              text={cellText}
              fontSize={14}
              fontFamily={designSystem.typography.fontFamily.sans}
              fill={designSystem.colors.secondary[800]}
              verticalAlign="top"
              wrap="word"
              ellipsis={true}
            />
          </Group>
        );
      }
    }
    
    return cells;
  }, [rows, cols, cellWidth, cellHeight, tableData]);

  return (
    <CachedShape
      element={element}
      cacheDependencies={cacheDependencies}
      cacheConfig={{
        // Always cache tables - they're complex by nature
        forceCache: shouldCacheTable,
        enabled: true,
        complexityThreshold: 1 // Lower threshold for tables
      }}
      {...konvaProps}
    >
      {/* Table background */}
      <Rect
        x={0}
        y={0}
        width={tableWidth}
        height={tableHeight}
        fill="white"
        stroke={isSelected ? designSystem.colors.primary[500] : designSystem.colors.secondary[200]}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
      />
      
      {/* Table cells */}
      {renderTableCells}
      
      {/* Selection indicator */}
      {isSelected && (
        <Rect
          x={-2}
          y={-2}
          width={tableWidth + 4}
          height={tableHeight + 4}
          stroke={designSystem.colors.primary[500]}
          strokeWidth={2}
          fill="transparent"
          dash={[8, 4]}
        />
      )}
    </CachedShape>
  );
});

CachedTableShape.displayName = 'CachedTableShape';

