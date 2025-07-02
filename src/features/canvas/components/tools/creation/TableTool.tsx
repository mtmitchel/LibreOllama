/**
 * TableTool - Interactive table creation tool
 * Provides FigJam-style table creation with real-time preview
 */

import React, { useRef, useCallback, useState } from 'react';
import { Rect, Line, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { TableElement, ElementId } from '../../../types/enhanced.types';
import { nanoid } from 'nanoid';

interface TableToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

interface TablePreview {
  x: number;
  y: number;
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
}

export const TableTool: React.FC<TableToolProps> = ({ stageRef, isActive }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [preview, setPreview] = useState<TablePreview | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);
  const findStickyNoteAtPoint = useUnifiedCanvasStore(state => state.findStickyNoteAtPoint);
  const addElementToStickyNote = useUnifiedCanvasStore(state => state.addElementToStickyNote);
  
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    setIsDrawing(true);
    startPointRef.current = { x: pointer.x, y: pointer.y };
    setPreview({
      x: pointer.x,
      y: pointer.y,
      rows: 2,
      cols: 2,
      cellWidth: 200,
      cellHeight: 44
    });
  }, [isActive, stageRef]);
  
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isActive || !isDrawing || !startPointRef.current || !stageRef.current) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const startPos = startPointRef.current;
    const width = Math.abs(pointer.x - startPos.x);
    const height = Math.abs(pointer.y - startPos.y);
    
    // Calculate number of rows and columns based on drag distance
    const cellWidth = 200;
    const cellHeight = 44;
    const cols = Math.max(2, Math.min(8, Math.floor(width / cellWidth) + 1));
    const rows = Math.max(2, Math.min(8, Math.floor(height / cellHeight) + 1));
    
    setPreview({
      x: Math.min(pointer.x, startPos.x),
      y: Math.min(pointer.y, startPos.y),
      rows,
      cols,
      cellWidth,
      cellHeight
    });
  }, [isActive, isDrawing, stageRef]);
  
  const handlePointerUp = useCallback(() => {
    if (!isActive || !isDrawing || !preview) return;
    
    setIsDrawing(false);
    
    // Create enhanced table element with proper structure
    const tableElement: TableElement = {
      id: nanoid() as ElementId,
      type: 'table',
      x: preview.x,
      y: preview.y,
      width: preview.cols * preview.cellWidth,
      height: preview.rows * preview.cellHeight,
      rows: preview.rows,
      cols: preview.cols,
      
      // Enhanced table data structure
      enhancedTableData: {
        rows: Array(preview.rows).fill(null).map((_, i) => ({ 
          height: preview.cellHeight, 
          id: `row-${i}` 
        })),
        columns: Array(preview.cols).fill(null).map((_, i) => ({ 
          width: preview.cellWidth, 
          id: `col-${i}` 
        })),
        cells: Array(preview.rows).fill(null).map((rowIndex, r) => 
          Array(preview.cols).fill(null).map((_, c) => ({
            content: (r === 0 && c === 0) ? 'Header' : 
                    (r === 0) ? `Column ${c + 1}` :
                    (c === 0) ? `Row ${r}` : '',
            text: (r === 0 && c === 0) ? 'Header' : 
                  (r === 0) ? `Column ${c + 1}` :
                  (c === 0) ? `Row ${r}` : '',
            backgroundColor: (r === 0 || c === 0) ? '#F8FAFC' : 'white',
            textColor: '#1F2937',
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            textAlign: 'left',
            verticalAlign: 'middle'
          }))
        )
      },
      
      // Legacy compatibility fields (will be ignored in favor of enhancedTableData)
      tableData: Array(preview.rows).fill(null).map(() => 
        Array(preview.cols).fill({ text: '' })
      ),
      
      // Modern styling
      cellPadding: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      cellWidth: preview.cellWidth,
      cellHeight: preview.cellHeight,
      
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLocked: false,
      isHidden: false
    };
    
    console.log('📋 [TableTool] Creating table with enhanced structure:', {
      id: tableElement.id,
      dimensions: { rows: preview.rows, cols: preview.cols },
      size: { width: tableElement.width, height: tableElement.height },
      enhancedData: tableElement.enhancedTableData
    });
    
    addElement(tableElement);
    
    // Check if the table was created within a sticky note container
    const tableCenter = {
      x: preview.x + (preview.cols * preview.cellWidth) / 2,
      y: preview.y + (preview.rows * preview.cellHeight) / 2
    };
    const stickyNoteId = findStickyNoteAtPoint(tableCenter);
    
    if (stickyNoteId) {
      console.log('📋 [TableTool] Adding table to sticky note container:', stickyNoteId);
      addElementToStickyNote(tableElement.id, stickyNoteId);
    }
    
    setSelectedTool('select');
    
    // Reset
    setPreview(null);
    startPointRef.current = null;
  }, [isActive, isDrawing, preview, addElement, setSelectedTool, findStickyNoteAtPoint, addElementToStickyNote]);
  
  // Event listeners
  React.useEffect(() => {
    if (!isActive || !stageRef.current) return;
    
    const stage = stageRef.current;
    
    stage.on('pointerdown', handlePointerDown);
    stage.on('pointermove', handlePointerMove);
    stage.on('pointerup pointercancel', handlePointerUp);
    
    return () => {
      stage.off('pointerdown', handlePointerDown);
      stage.off('pointermove', handlePointerMove);
      stage.off('pointerup pointercancel', handlePointerUp);
    };
  }, [isActive, handlePointerDown, handlePointerMove, handlePointerUp]);
  
  if (!isActive || !isDrawing || !preview) return null;
  
  // Render modern preview grid
  const gridLines: JSX.Element[] = [];
  
  // Horizontal lines
  for (let i = 0; i <= preview.rows; i++) {
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[
          preview.x,
          preview.y + i * preview.cellHeight,
          preview.x + preview.cols * preview.cellWidth,
          preview.y + i * preview.cellHeight
        ]}
        stroke="#3B82F6"
        strokeWidth={i === 0 || i === preview.rows ? 2 : 1}
        opacity={0.8}
        dash={i === 0 || i === preview.rows ? [] : [4, 4]}
        listening={false}
      />
    );
  }
  
  // Vertical lines
  for (let i = 0; i <= preview.cols; i++) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[
          preview.x + i * preview.cellWidth,
          preview.y,
          preview.x + i * preview.cellWidth,
          preview.y + preview.rows * preview.cellHeight
        ]}
        stroke="#3B82F6"
        strokeWidth={i === 0 || i === preview.cols ? 2 : 1}
        opacity={0.8}
        dash={i === 0 || i === preview.cols ? [] : [4, 4]}
        listening={false}
      />
    );
  }
  
  return (
    <Group listening={false}>
      {/* Modern preview background */}
      <Rect
        x={preview.x}
        y={preview.y}
        width={preview.cols * preview.cellWidth}
        height={preview.rows * preview.cellHeight}
        fill="#EFF6FF"
        fillOpacity={0.6}
        stroke="#3B82F6"
        strokeWidth={2}
        cornerRadius={8}
        shadowColor="rgba(59, 130, 246, 0.15)"
        shadowBlur={8}
        shadowOffset={{ x: 0, y: 4 }}
        listening={false}
      />
      
      {/* Grid lines */}
      {gridLines}
      
      {/* Size indicator with modern styling */}
      <Group>
        <Rect
          x={preview.x + (preview.cols * preview.cellWidth) / 2 - 25}
          y={preview.y - 35}
          width={50}
          height={24}
          fill="white"
          stroke="#3B82F6"
          strokeWidth={1}
          cornerRadius={4}
          shadowColor="rgba(59, 130, 246, 0.1)"
          shadowBlur={4}
          shadowOffset={{ x: 0, y: 2 }}
          listening={false}
        />
        <Text
          x={preview.x + (preview.cols * preview.cellWidth) / 2}
          y={preview.y - 28}
          text={`${preview.rows} × ${preview.cols}`}
          fontSize={12}
          fontFamily="Inter, sans-serif"
          fill="#3B82F6"
          fontWeight="500"
          align="center"
          listening={false}
        />
      </Group>
    </Group>
  );
}; 