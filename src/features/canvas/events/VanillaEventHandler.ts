import Konva from 'konva';
import { UnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { VanillaLayerManager } from '../layers/VanillaLayerManager';

export interface VanillaEventOptions {
  enablePanKey?: 'Space' | 'Alt' | 'Shift' | 'Control';
}

export class VanillaEventHandler {
  private stage: Konva.Stage;
  private getState: () => UnifiedCanvasStore;
  private isPanning = false;
  private lastPointer: { x: number; y: number } | null = null;
  private panKey: VanillaEventOptions['enablePanKey'];
  private layerManager?: VanillaLayerManager;

  private isSelecting = false;
  private selectionStart: { x: number; y: number } | null = null;
  private selectionRect: Konva.Rect | null = null;

  constructor(stage: Konva.Stage, getState: () => UnifiedCanvasStore, options?: VanillaEventOptions, layerManager?: VanillaLayerManager) {
    this.stage = stage;
    this.getState = getState;
    this.panKey = options?.enablePanKey ?? 'Space';
    this.layerManager = layerManager;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Click blank area to clear selection / start pan / start selection
    this.stage.on('mousedown.vanilla', (e) => {
      const isMiddle = (e.evt as MouseEvent).button === 1;
      const panKeyDown = this.isPanKeyDown();
      const isPanSelected = this.getState().selectedTool === 'pan';
      const pointer = this.stage.getPointerPosition() ?? null;

      if (isMiddle || panKeyDown || isPanSelected) {
        this.isPanning = true;
        this.lastPointer = pointer;
        return;
      }

      // If clicked on empty stage, begin drag-selection
      if (e.target === this.stage && pointer) {
        if (this.getState().selectedTool === 'select') {
          this.isSelecting = true;
          this.selectionStart = pointer;
          this.ensureSelectionRect();
          this.updateSelectionRect(pointer);
        }
        return;
      }
    });

    this.stage.on('mousemove.vanilla', () => {
      const pointer = this.stage.getPointerPosition();
      if (!pointer) return;

      if (this.isPanning && this.lastPointer) {
        const dx = pointer.x - this.lastPointer.x;
        const dy = pointer.y - this.lastPointer.y;
        const vp = this.getState().viewport;
        this.getState().setViewport({ x: vp.x + dx, y: vp.y + dy });
        this.lastPointer = pointer;
        return;
      }

      if (this.isSelecting && this.selectionStart) {
        this.updateSelectionRect(pointer);
      }
    });

    this.stage.on('mouseup.vanilla', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.lastPointer = null;
        return;
      }

      if (this.isSelecting) {
        this.finishSelection();
      }
    });

    // Keyboard panning modifier
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private ensureSelectionRect(): void {
    if (!this.layerManager) return;
    const ui = this.layerManager.getUiLayer();
    if (!ui) return;
    if (!this.selectionRect) {
      this.selectionRect = new Konva.Rect({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        stroke: '#1e90ff',
        strokeWidth: 1,
        dash: [4, 4],
        fill: 'rgba(30,144,255,0.08)',
        listening: false,
      });
      ui.add(this.selectionRect);
      ui.draw();
    }
  }

  private updateSelectionRect(pointer: { x: number; y: number }): void {
    if (!this.selectionRect || !this.selectionStart) return;
    const x = Math.min(this.selectionStart.x, pointer.x);
    const y = Math.min(this.selectionStart.y, pointer.y);
    const w = Math.abs(pointer.x - this.selectionStart.x);
    const h = Math.abs(pointer.y - this.selectionStart.y);

    this.selectionRect.position({ x, y });
    this.selectionRect.size({ width: w, height: h });
    this.selectionRect.getLayer()?.batchDraw();
  }

  private finishSelection(): void {
    this.isSelecting = false;

    const rect = this.selectionRect;
    if (rect && this.layerManager) {
      const r = rect.getClientRect({ skipShadow: true, skipStroke: true });
      const ids = this.layerManager.getElementsInRect({ x: r.x, y: r.y, width: r.width, height: r.height });

      // Update selection in store
      this.getState().clearSelection();
      ids.forEach((id) => this.getState().selectElement(id, true));

      // Remove selection rectangle entirely
      const layer = rect.getLayer();
      rect.destroy();
      this.selectionRect = null;
      layer?.batchDraw();
    }

    this.selectionStart = null;
  }

  private isPanKeyDown(): boolean {
    if (!this.panKey) return false;
    return this._panKeyPressed;
  }

  private _panKeyPressed = false;
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === this.panKey) {
      this._panKeyPressed = true;
      this.stage.container().style.cursor = 'grab';
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === this.panKey) {
      this._panKeyPressed = false;
      this.stage.container().style.cursor = 'default';
    }
  };

  destroy(): void {
    this.stage.off('.vanilla');
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
