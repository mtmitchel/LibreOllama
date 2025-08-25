// src/features/canvas/tools/StickyNoteTool.ts
import Konva from 'konva';
import { nanoid } from 'nanoid';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
import { StickyNoteElement, ElementId } from '../types/enhanced.types';

export interface ITool {
  readonly type: string;
  readonly cursor: string;
  activate(): void;
  deactivate(): void;
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void;
}

export class StickyNoteTool implements ITool {
  readonly type = 'sticky-note';
  readonly cursor = 'crosshair';
  activate() {}
  deactivate() {}
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const store = useUnifiedCanvasStore.getState();
    const color = (store as any).selectedStickyNoteColor || '#FFE299';

    const element: StickyNoteElement = {
      id: nanoid() as any,
      type: 'sticky-note',
      x: pos.x - 75,
      y: pos.y - 75,
      width: 150,
      height: 150,
      backgroundColor: color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isContainer: true,
      childElementIds: [],
    } as any;

    store.addElement(element as any);
    store.selectElement(element.id as ElementId);
  }
}
