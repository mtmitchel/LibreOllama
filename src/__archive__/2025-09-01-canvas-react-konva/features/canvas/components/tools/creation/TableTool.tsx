/**
 * TableTool - Interactive table creation tool
 * Provides modern table creation with inline editing and add/delete functionality
 */

import React from 'react';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';

import { useShallow } from 'zustand/react/shallow';
import { TableElement, ElementId } from '../../../types/enhanced.types';
import { nanoid } from 'nanoid';

interface TableToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const TableTool: React.FC<TableToolProps> = ({ stageRef, isActive }) => {
  // Cursor management is handled by CanvasStage's centralized cursor system

  // Store actions using grouped selectors for optimization
  const toolActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      addElement: state.addElement,
      setSelectedTool: state.setSelectedTool
    }))
  );
  const stickyNoteActions = useUnifiedCanvasStore(
    useShallow((state) => ({
      addElementToStickyNote: state.addElementToStickyNote,
      findStickyNoteAtPoint: state.findStickyNoteAtPoint
    }))
  );

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;
    
    // We only care about the primary button
    if (e.evt.button !== 0) return;
    
    const stage = stageRef.current;
    
    // Get canvas position using Konva's built-in coordinate conversion
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const newTable: TableElement = {
      id: nanoid() as ElementId,
      type: 'table',
      x: pos.x,
      y: pos.y,
      width: 300, // Smaller default for 2x2 table
      height: 100, // Smaller for 2 rows
      rows: 2, // Simple 2x2 table
      cols: 2, // Simple 2x2 table
      isLocked: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // Simple table structure without placeholder content
      enhancedTableData: {
        rows: [
          { id: 'row-1', height: 50 },
          { id: 'row-2', height: 50 },
        ],
        columns: [
          { id: 'col-1', width: 150 },
          { id: 'col-2', width: 150 },
        ],
        cells: [
          [
            { content: '' }, 
            { content: '' }
          ],
          [
            { content: '' }, 
            { content: '' }
          ],
        ],
        // Modern table styling
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
      },
    };
    
    const parentStickyNoteId = stickyNoteActions.findStickyNoteAtPoint(pos);
    if (parentStickyNoteId) {
      stickyNoteActions.addElementToStickyNote(newTable.id, parentStickyNoteId);
    } else {
      toolActions.addElement(newTable);
    }
    
    // Switch back to select tool and immediately highlight the new table
    toolActions.setSelectedTool('select');

    // Give Konva a tick to register the new element, then select it
    setTimeout(() => {
      const store = useUnifiedCanvasStore.getState();
      store.clearSelection();
      setTimeout(() => {
        store.selectElement(newTable.id, false);
      }, 50);
    }, 50);
  };

  

  return null; // The tool itself doesn't render anything, it just handles events
}; 
// Archived (2025-09-01): Legacy react-konva table tool.
