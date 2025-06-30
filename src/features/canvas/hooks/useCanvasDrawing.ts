// src/features/canvas/hooks/useCanvasDrawing.ts
import { useEffect } from 'react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import Konva from 'konva';

export const useCanvasDrawing = (stage: Konva.Stage | null) => {
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  const isDrawing = useUnifiedCanvasStore(state => state.isDrawing);
  const startDrawing = useUnifiedCanvasStore(state => state.startDrawing);
  const updateDrawing = useUnifiedCanvasStore(state => state.updateDrawing);
  const finishDrawing = useUnifiedCanvasStore(state => state.finishDrawing);

  useEffect(() => {
    if (!stage) return;

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (selectedTool !== 'pen' || e.target !== stage) return;
      
      const pos = stage.getPointerPosition();
      if (pos) {
        startDrawing('pen', { x: pos.x, y: pos.y });
      }
    };

    const handleMouseMove = () => {
      if (selectedTool !== 'pen' || !isDrawing) return;

      const pos = stage.getPointerPosition();
      if (pos) {
        updateDrawing({ x: pos.x, y: pos.y });
      }
    };

    const handleMouseUp = () => {
      if (selectedTool !== 'pen' || !isDrawing) return;
      finishDrawing();
    };

    stage.on('mousedown.drawing', handleMouseDown);
    stage.on('mousemove.drawing', handleMouseMove);
    stage.on('mouseup.drawing touchend.drawing', handleMouseUp);

    return () => {
      stage.off('mousedown.drawing');
      stage.off('mousemove.drawing');
      stage.off('mouseup.drawing touchend.drawing');
    };
  }, [stage, selectedTool, isDrawing, startDrawing, updateDrawing, finishDrawing]);
};
