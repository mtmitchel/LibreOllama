// src/features/canvas/hooks/useCanvasDrawing.ts
import { useEffect } from 'react';
import { useCanvasStore } from '../../../stores';
import Konva from 'konva';

export const useCanvasDrawing = (stage: Konva.Stage | null) => {
  const selectedTool = useCanvasStore(state => state.selectedTool);
  const isDrawing = useCanvasStore(state => state.isDrawing);
  const startDrawing = useCanvasStore(state => state.startDrawing);
  const updateDrawing = useCanvasStore(state => state.updateDrawing);
  const finishDrawing = useCanvasStore(state => state.finishDrawing);

  useEffect(() => {
    if (!stage) return;

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (selectedTool !== 'pen' || e.target !== stage) return;
      
      const pos = stage.getPointerPosition();
      if (pos) {
        startDrawing(pos.x, pos.y, 'pen');
      }
    };

    const handleMouseMove = () => {
      if (selectedTool !== 'pen' || !isDrawing) return;

      const pos = stage.getPointerPosition();
      if (pos) {
        updateDrawing(pos.x, pos.y);
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
