// src/features/canvas/tools/ConnectorTool.ts
import Konva from 'konva';
import { nanoid } from 'nanoid';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
import { ConnectorElement, ElementId } from '../types/enhanced.types';

export interface ITool {
  readonly type: string;
  readonly cursor: string;
  activate(): void;
  deactivate(): void;
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void;
  onMouseMove?(e: Konva.KonvaEventObject<MouseEvent>): void;
  onMouseUp?(e: Konva.KonvaEventObject<MouseEvent>): void;
}

export class ConnectorTool implements ITool {
  readonly type = 'connector';
  readonly cursor = 'crosshair';
  private draftId: ElementId | null = null;

  activate() {}
  deactivate() {
    this.draftId = null;
  }

  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const store = useUnifiedCanvasStore.getState();

    if (!this.draftId) {
      const element: ConnectorElement = {
        id: nanoid() as any,
        type: 'connector',
        subType: 'line',
        x: 0,
        y: 0,
        startPoint: { x: pos.x, y: pos.y },
        endPoint: { x: pos.x, y: pos.y },
        stroke: '#111827',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any;
      store.addElement(element as any);
      this.draftId = element.id as ElementId;
    } else {
      // Finish connector on second click
      const id = this.draftId;
      const element = store.elements.get(id);
      if (element && element.type === 'connector') {
        store.updateElement(id, { endPoint: { x: pos.x, y: pos.y }, updatedAt: Date.now() } as any);
        store.addToHistory('add-connector');
      }
      this.draftId = null;
    }
  }

  onMouseMove(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (!this.draftId) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const store = useUnifiedCanvasStore.getState();
    const id = this.draftId;
    const element = store.elements.get(id);
    if (element && element.type === 'connector') {
      store.updateElement(id, { endPoint: { x: pos.x, y: pos.y }, updatedAt: Date.now() } as any, { skipHistory: true });
    }
  }
}
