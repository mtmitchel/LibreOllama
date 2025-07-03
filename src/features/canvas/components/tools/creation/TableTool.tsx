/**
 * TableTool - Interactive table creation tool
 * Provides FigJam-style table creation with real-time preview
 */

import React, { useEffect } from 'react';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { TableElement, ElementId } from '../../../types/enhanced.types';
import { nanoid } from 'nanoid';

interface TableToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

export const TableTool: React.FC<TableToolProps> = ({ stageRef, isActive }) => {
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const addElementToStickyNote = useUnifiedCanvasStore(state => state.addElementToStickyNote);
  const findStickyNoteAtPoint = useUnifiedCanvasStore(state => state.findStickyNoteAtPoint);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);

  useEffect(() => {
    if (!isActive || !stageRef.current) return;

    const stage = stageRef.current;

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // We only care about the primary button
      if (e.evt.button !== 0) return;
      
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
        width: 400, // Default width
        height: 150, // Default height
        rows: 3, // Required for store updateTableCell function
        cols: 2, // Required for store updateTableCell function
        isSelected: false,
        isLocked: false,
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // Default initial structure
        enhancedTableData: {
          rows: [
            { id: 'row-1', height: 50 },
            { id: 'row-2', height: 50 },
            { id: 'row-3', height: 50 },
          ],
          columns: [
            { id: 'col-1', width: 200 },
            { id: 'col-2', width: 200 },
          ],
          cells: [
            [{ content: 'Header 1' }, { content: 'Header 2' }],
            [{ content: '' }, { content: '' }],
            [{ content: '' }, { content: '' }],
          ],
        },
      };
      
      const parentStickyNoteId = findStickyNoteAtPoint(pos);
      if (parentStickyNoteId) {
        addElementToStickyNote(newTable, parentStickyNoteId);
      } else {
        addElement(newTable);
      }
      
      // Switch back to select tool and immediately highlight the new table
      setSelectedTool('select');

      // Give Konva a tick to register the new element, then select it
      setTimeout(() => {
        const store = useUnifiedCanvasStore.getState();
        store.clearSelection();
        setTimeout(() => {
          store.selectElement(newTable.id, false);
        }, 50);
      }, 50);
    };

    stage.on('mousedown.tabletool', handleMouseDown);

    return () => {
      stage.off('mousedown.tabletool');
    };
  }, [isActive, stageRef, addElement, addElementToStickyNote, findStickyNoteAtPoint, setSelectedTool]);

  return null; // The tool itself doesn't render anything, it just handles events
}; 