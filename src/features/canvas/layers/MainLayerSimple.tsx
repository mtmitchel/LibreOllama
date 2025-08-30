/**
 * MainLayerSimple - Minimal working implementation for debugging
 */

import React from 'react';
// react-konva removed from runtime per blueprint
import { PenTool } from '../components/tools/drawing/PenTool';
import { MarkerTool } from '../components/tools/drawing/MarkerTool';
import { HighlighterTool } from '../components/tools/drawing/HighlighterTool';
import { CanvasElement, ElementId } from '../types/enhanced.types';

interface MainLayerSimpleProps {
  selectedTool: string;
  stageRef?: React.RefObject<any>;
  isDrawing?: boolean;
  currentPath?: number[];
  elements?: Map<ElementId, CanvasElement>;
  [key: string]: any; // Accept other props but ignore them
}

// NO-OP MainLayerSimple per blueprint: react-konva removed from runtime.
export const MainLayerSimple: React.FC<MainLayerSimpleProps> = ({
  selectedTool,
  stageRef,
  isDrawing = false,
  currentPath = [],
  elements,
}) => {
  // Partition elements into stroke categories
  const { penElements, markerElements, highlighterElements } = React.useMemo(() => {
    const result = { penElements: [] as Array<{ id: ElementId; element: any }>, markerElements: [] as Array<{ id: ElementId; element: any }>, highlighterElements: [] as Array<{ id: ElementId; element: any }> };
    if (!elements) return result;
    for (const [id, element] of elements) {
      if ((element as any).points && Array.isArray((element as any).points)) {
        if (element.type === 'pen') {
          result.penElements.push({ id: id as ElementId, element });
        } else if (element.type === 'marker') {
          result.markerElements.push({ id: id as ElementId, element });
        } else if (element.type === 'highlighter') {
          result.highlighterElements.push({ id: id as ElementId, element });
        }
      }
    }
    return result;
  }, [elements]);

  // No-op: legacy react-konva main layer content removed from runtime.
  return null;
};

export default MainLayerSimple;