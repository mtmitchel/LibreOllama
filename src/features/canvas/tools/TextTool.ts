// src/features/canvas/tools/TextTool.ts
import Konva from 'konva';
import { nanoid } from 'nanoid';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
import { TextElement, ElementId } from '../types/enhanced.types';
import { openTextEditorOverlay } from '../core/TextEditorOverlay';
// removed unused import

export type ToolType = string;

export interface ITool {
  readonly type: ToolType;
  readonly cursor: string;
  activate(): void;
  deactivate(): void;
  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void;
}

export class TextTool implements ITool {
  readonly type: ToolType = 'text';
  readonly cursor: string = 'crosshair';

  private start?: { x: number; y: number };
  private preview?: Konva.Rect;
  private hoverText?: Konva.Text;

  activate(): void {}
  deactivate(): void { this.cleanupPreview(); }

  onMouseDown(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = (stage as any).getRelativePointerPosition ? (stage as any).getRelativePointerPosition() : stage.getPointerPosition();
    if (!pos) return;
    this.start = { x: pos.x, y: pos.y };
    // Remove hover label immediately on press
    if (this.hoverText) { const layer = this.hoverText.getLayer(); this.hoverText.destroy(); layer?.batchDraw(); this.hoverText = undefined; }
  }

  onMouseMove(e: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = (stage as any).getRelativePointerPosition ? (stage as any).getRelativePointerPosition() : stage.getPointerPosition();
    if (!pos) return;

    // Show crosshair + hover text when no drag started
    const layers = stage.getChildren((n: any) => n instanceof Konva.Layer) as Konva.Layer[];
    const overlay = layers[layers.length - 1];
    if (!this.preview && !this.hoverText) {
      // Cursor itself is crosshair via CSS; show label snug next to cursor
      this.hoverText = new Konva.Text({ text: 'Add text', x: pos.x + 6, y: pos.y + 4, fontSize: 24, fontFamily: 'Inter, system-ui, Arial', fill: '#000000', listening: false });
      overlay.add(this.hoverText);
      overlay.batchDraw();
      return;
    }
    if (!this.preview && this.hoverText) {
      this.hoverText.position({ x: pos.x + 6, y: pos.y + 4 } as any);
      overlay.batchDraw();
      return;
    }

    // If dragging beyond threshold and no preview yet, create it
    if (this.start && !this.preview) {
      const dx = pos.x - this.start.x;
      const dy = pos.y - this.start.y;
      if (Math.hypot(dx, dy) >= 6) {
        const layers = stage.getChildren((n: any) => n instanceof Konva.Layer) as Konva.Layer[];
        const overlay = layers[layers.length - 1];
        this.preview = new Konva.Rect({ x: this.start.x, y: this.start.y, width: 2, height: 2, stroke: '#3b82f6', dash: [4, 4], listening: false });
        overlay.add(this.preview);
        overlay.batchDraw();
      } else {
        return;
      }
    }

    if (!this.start || !this.preview) return;
    const x = Math.min(this.start.x, pos.x);
    const y = Math.min(this.start.y, pos.y);
    const w = Math.max(2, Math.abs(pos.x - this.start.x));
    const h = Math.max(2, Math.abs(pos.y - this.start.y));
    this.preview.position({ x, y } as any);
    this.preview.size({ width: w, height: h } as any);
    this.preview.getLayer()?.batchDraw();
  }

  async onMouseUp(e: Konva.KonvaEventObject<MouseEvent>): Promise<void> {
    const stage = e.target.getStage();
    if (!stage || !this.start) { 
      this.cleanupPreview(); 
      return; 
    }
    // Remove hover guides
    if (this.hoverText) { this.hoverText.destroy(); this.hoverText = undefined; }

    let px = this.start.x;
    let py = this.start.y;
    let pw = 0;
    let ph = 0;
    let clickOnly = true;
    if (this.preview) {
      px = this.preview.x();
      py = this.preview.y();
      pw = this.preview.width();
      ph = this.preview.height();
      clickOnly = Math.hypot(pw, ph) < 6;
    }
    
    // Simple text measurement
    const fontSize = 24;
    const fontFamily = 'Inter, system-ui, Arial';
    const text = 'Add text';
    
    // Ensure font is loaded
    const primaryFamily = (fontFamily.split(',')[0] || 'Inter').trim().replace(/^"|"$/g, '');
    try { 
      await document.fonts.load(`${fontSize}px ${primaryFamily}`); 
      await (document as any).fonts.ready; 
    } catch {}
    
    // Measure text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${fontSize}px ${fontFamily}`;
    const textMetrics = ctx.measureText(text);
    const textWidth = Math.ceil(textMetrics.width);
    const textHeight = Math.ceil(fontSize * 1.2);
    
    const textDimensions = { width: textWidth, height: textHeight };

    const element: TextElement = {
      id: nanoid() as any,
      type: 'text',
      x: px,
      y: py,
      text: text,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: '#111827',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // Always use measured width (prevents overly large widths from temporary preview)
      width: textDimensions.width,
      height: clickOnly ? textDimensions.height : Math.max(textDimensions.height, ph),
    };

    const store = useUnifiedCanvasStore.getState();
    
    // Stage 1: Create element WITHOUT selection (industry standard)
    store.addElement(element as any);
    
    // Stage 2: Switch back to select tool immediately
    store.setSelectedTool('select');
    stage.container().style.cursor = 'default';

    // Open DOM editor overlay (wait for ElementRegistry to create and finalize dimensions)
    const tryOpen = () => {
      // ElementRegistry now creates a Group with Text child, not direct Text node
      const group = stage.findOne(`#${element.id}`) as Konva.Group | null;
      if (group && group.width() > 0) { // Ensure dimensions are set
        const textNode = group.findOne('Text') as Konva.Text | null;
        if (textNode) {
          // Wait one more frame to ensure Konva dimensions are finalized
          requestAnimationFrame(() => {
            openTextEditorOverlay(stage, textNode, element.id as ElementId, {
              initialText: 'Add text',
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              align: 'left',
            });
          });
          // Preview cleanup handled by cleanupPreview at end
          return;
        }
      }
      // Retry if group or text node not found yet
      setTimeout(tryOpen, 20);
    };
    setTimeout(tryOpen, 100); // Give more time for element creation

    this.cleanupPreview();
  }

  private cleanupPreview() {
    this.start = undefined;
    if (this.preview) { const layer = this.preview.getLayer(); this.preview.destroy(); layer?.batchDraw(); }
    this.preview = undefined;
    if (this.hoverText) { const layer = this.hoverText.getLayer(); this.hoverText.destroy(); layer?.batchDraw(); this.hoverText = undefined; }
  }
}
