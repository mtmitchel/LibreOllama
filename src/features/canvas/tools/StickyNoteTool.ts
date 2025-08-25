// src/features/canvas/tools/StickyNoteTool.ts
import Konva from 'konva';
import { nanoid } from 'nanoid';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
import { StickyNoteElement, ElementId } from '../types/enhanced.types';
import { StickyPreview } from '../core/StickyPreview';
import { openTextEditorOverlay } from '../core/TextEditorOverlay';

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
  private stage?: Konva.Stage;

  activate() {
    // Wire up stage events for live preview
    const store = useUnifiedCanvasStore.getState();
    this.stage = store.stage;
    if (this.stage) {
      this.stage.on('mousemove.sticky-preview', this.onMouseMove.bind(this));
      this.stage.on('mouseleave.sticky-preview', this.onMouseLeave.bind(this));
    }
  }

  deactivate() { 
    try { 
      StickyPreview.hide(); 
      if (this.stage) {
        this.stage.off('mousemove.sticky-preview');
        this.stage.off('mouseleave.sticky-preview');
      }
    } catch {} 
  }

  onMouseLeave(): void {
    try { StickyPreview.hide(); StickyPreview.destroy?.(); } catch {}
  }
  // Live hover preview that follows the cursor before creation
  onMouseMove(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = (stage as any).getRelativePointerPosition ? (stage as any).getRelativePointerPosition() : stage.getPointerPosition();
    if (!pos) return;
    const size = 150; // default sticky note size in stage units
    
    // Get selected color from store for preview
    const store = useUnifiedCanvasStore.getState();
    const color = (store as any).selectedStickyNoteColor || '#FFE299';
    
    // Pass raw cursor position; preview will center itself and use the selected color
    StickyPreview.showAt(stage, pos.x, pos.y, size, size, '');
    // Update the preview color directly
    if ((StickyPreview as any).frame) {
      (StickyPreview as any).frame.style.background = color;
    }
  }
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const store = useUnifiedCanvasStore.getState();
    const color = (store as any).selectedStickyNoteColor || '#FFE299';

    // Prevent sticky notes from overlapping with toolbar (bottom 100px)
    const minY = 75; // Half height of sticky note
    const maxY = stage.height() - 175; // Stage height minus sticky note height minus toolbar space
    const constrainedY = Math.max(minY, Math.min(maxY, pos.y - 75));

    const element: StickyNoteElement = {
      id: nanoid() as any,
      type: 'sticky-note',
      x: pos.x - 75,
      y: constrainedY,
      width: 150,
      height: 150,
      backgroundColor: color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isContainer: true,
      childElementIds: [],
    } as any;

    // Hide hover preview at creation moment to avoid flicker
    try { StickyPreview.hide(); } catch {}

    store.addElement(element as any);

    // Ensure layer draws so Konva node exists
    try { this.stage?.findOne('Layer')?.batchDraw(); } catch {}

    // Begin inline text editing immediately on the sticky note's Text node
    const tryOpenEditor = (attempt = 0) => {
      if (attempt > 10) return; // give up after a few frames
      const group = stage.findOne(`#${element.id}`) as Konva.Group | null;
      if (!group) {
        requestAnimationFrame(() => tryOpenEditor(attempt + 1));
        return;
      }
      const textNode = group.findOne('Text') as Konva.Text | null;
      if (!textNode) {
        requestAnimationFrame(() => tryOpenEditor(attempt + 1));
        return;
      }
      // Block outside-click until focus confirmed
      try { (store as any).setBlockOutsideClicks?.(true); } catch {}
      openTextEditorOverlay(stage, textNode, element.id as ElementId, {
        initialText: '',
        fontSize: (element.fontSize as any) ?? 16,
        fontFamily: (element.fontFamily as any) ?? 'Inter, system-ui, Arial',
        align: 'left',
        mode: 'multiline',
      } as any);
      // Defer switching tools until focus is set (microtask)
      queueMicrotask(() => {
        try { (store as any).setSelectedTool?.('select'); } catch {}
        try { (store as any).setBlockOutsideClicks?.(false); } catch {}
      });
    };
    // Defer to next frame so ElementRegistry can mount nodes; ensure after paint
    requestAnimationFrame(() => tryOpenEditor());

    // Switch tool back to select and default cursor
    (store as any).setSelectedTool?.('select');
    stage.container().style.cursor = 'default';
  }
}
