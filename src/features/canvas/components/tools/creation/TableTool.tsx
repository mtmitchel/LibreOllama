/**
 * TableTool - Interactive table creation tool
 * Provides FigJam-style table creation with real-time preview
 */

import React, { useRef, useCallback, useState } from 'react';
import { Rect, Line, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { TableElement } from '../../../types/enhanced.types';
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
      rows: 1,
      cols: 1,
      cellWidth: 100,
      cellHeight: 40
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
    const cellWidth = 100;
    const cellHeight = 40;
    const cols = Math.max(1, Math.min(10, Math.floor(width / cellWidth) + 1));
    const rows = Math.max(1, Math.min(10, Math.floor(height / cellHeight) + 1));
    
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
    
    // Create table element
    const tableElement: TableElement = {
      id: nanoid() as any,
      type: 'table',
      x: preview.x,
      y: preview.y,
      width: preview.cols * preview.cellWidth,
      height: preview.rows * preview.cellHeight,
      rows: preview.rows,
      columns: preview.cols,
      cells: Array(preview.rows).fill(null).map(() => 
        Array(preview.cols).fill('')
      ),
      style: {
        borderColor: '#E5E7EB',
        borderWidth: 1,
        cellPadding: 8,
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        textColor: '#1F2937',
        backgroundColor: '#FFFFFF',
        headerBackgroundColor: '#F3F4F6',
        headerTextColor: '#111827'
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isLocked: false,
      isHidden: false
    };
    
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
  }, [isActive, isDrawing, preview, addElement, setSelectedTool]);
  
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
  
  // Render preview grid
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
        strokeWidth={1}
        opacity={0.6}
        dash={[4, 4]}
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
        strokeWidth={1}
        opacity={0.6}
        dash={[4, 4]}
        listening={false}
      />
    );
  }
  
  return (
    <Group listening={false}>
      {/* Preview background */}
      <Rect
        x={preview.x}
        y={preview.y}
        width={preview.cols * preview.cellWidth}
        height={preview.rows * preview.cellHeight}
        fill="#3B82F6"
        fillOpacity={0.1}
        listening={false}
      />
      
      {/* Grid lines */}
      {gridLines}
      
      {/* Size indicator */}
      <Text
        x={preview.x + (preview.cols * preview.cellWidth) / 2}
        y={preview.y - 20}
        text={`${preview.rows} × ${preview.cols}`}
        fontSize={12}
        fill="#3B82F6"
        align="center"
        listening={false}
      />
    </Group>
  );
}; 