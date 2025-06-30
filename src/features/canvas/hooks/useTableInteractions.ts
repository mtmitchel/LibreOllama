import { useCallback } from 'react';
import Konva from 'konva';

type CellIdentifier = {
  row: number;
  col: number;
};

type InteractionCallbacks = {
  onSelectCell: (cell: CellIdentifier) => void;
  onStartEditingCell: (cell: CellIdentifier) => void;
};

/**
 * A hook to manage user interactions with a table element.
 * It distinguishes between clicks (for selection) and double-clicks (for editing).
 * @param onSelectCell Callback for when a cell is selected.
 * @param onStartEditingCell Callback for when cell editing should begin.
 * @returns A handler function to be attached to the table group's click/tap events.
 */
export const useTableInteractions = ({ onSelectCell, onStartEditingCell }: InteractionCallbacks) => {
  const handleCellInteraction = useCallback((evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Stop event propagation to prevent the element behind the table from being selected
    evt.cancelBubble = true;

    const target = evt.target;
    const row = target.getAttr('data-row-index');
    const col = target.getAttr('data-col-index');

    if (row === undefined || col === undefined) {
      return; // Click was not on a cell
    }
    
    const cell: CellIdentifier = { row, col };

    if (evt.type === 'dblclick' || evt.type === 'dbltap') {
      onStartEditingCell(cell);
    } else {
      onSelectCell(cell);
    }
  }, [onSelectCell, onStartEditingCell]);

  return { handleCellInteraction };
}; 