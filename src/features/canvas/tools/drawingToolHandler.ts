
import { KonvaEventObject } from 'konva/lib/Node';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { ToolEventHandler } from '../utils/CanvasEventManager';

export const drawingToolHandler: ToolEventHandler = { 
  canHandle() {
    try { return !(window as any).__USE_COMPONENT_DRAWING__; } catch { return true; }
  },
  onPointerDown(e: KonvaEventObject<PointerEvent>): boolean {
    const { startDrawing, selectedTool } = useUnifiedCanvasStore.getState();
    const stage = e.target.getStage();
    if (!stage) return false;

    const pos = stage.getPointerPosition();
    if (!pos) return false;

    if (selectedTool === 'pen' || selectedTool === 'marker' || selectedTool === 'highlighter') {
      startDrawing(selectedTool, pos);
      return true;
    }
    return false;
  },

  onPointerMove(e: KonvaEventObject<PointerEvent>): boolean {
    const { updateDrawing, isDrawing } = useUnifiedCanvasStore.getState();
    if (!isDrawing) return false;

    const stage = e.target.getStage();
    if (!stage) return false;

    const pos = stage.getPointerPosition();
    if (!pos) return false;

    updateDrawing(pos);
    return true;
  },

  onPointerUp(e: KonvaEventObject<PointerEvent>): boolean {
    const { finishDrawing, isDrawing } = useUnifiedCanvasStore.getState();
    if (!isDrawing) return false;

    finishDrawing();
    return true;
  },
};
