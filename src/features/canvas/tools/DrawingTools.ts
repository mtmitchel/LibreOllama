// src/features/canvas/tools/DrawingTools.ts
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';

export interface ITool {
  readonly type: string;
  readonly cursor: string;
  activate(): void;
  deactivate(): void;
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void;
  onMouseMove?(e: Konva.KonvaEventObject<MouseEvent>): void;
  onMouseUp?(e: Konva.KonvaEventObject<MouseEvent>): void;
}

abstract class BaseDrawingTool implements ITool {
  abstract readonly type: string;
  abstract readonly cursor: string;
  activate() {}
  deactivate() {}
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const store = useUnifiedCanvasStore.getState();
    store.startDrawing(this.type as any, pos);
  }
  onMouseMove(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    useUnifiedCanvasStore.getState().updateDrawing(pos);
  }
  onMouseUp(): void {
    useUnifiedCanvasStore.getState().finishDrawing();
  }
}

export class PenTool extends BaseDrawingTool {
  readonly type = 'pen';
  readonly cursor = 'crosshair';
}
export class MarkerTool extends BaseDrawingTool {
  readonly type = 'marker';
  readonly cursor = 'crosshair';
}
export class HighlighterTool extends BaseDrawingTool {
  readonly type = 'highlighter';
  readonly cursor = 'crosshair';
}
export class EraserTool extends BaseDrawingTool {
  readonly type = 'eraser';
  readonly cursor = 'crosshair';
}
