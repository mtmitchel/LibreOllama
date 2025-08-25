import Konva from 'konva';
import { UnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { VanillaLayerManager } from '../layers/VanillaLayerManager';

export interface VanillaTool {
  activate(): void;
  deactivate(): void;
}

export class VanillaToolManager {
  private stage: Konva.Stage;
  private getState: () => UnifiedCanvasStore;
  private layers: VanillaLayerManager;
  private activeTool: VanillaTool | null = null;

  constructor(stage: Konva.Stage, getState: () => UnifiedCanvasStore, layers: VanillaLayerManager) {
    this.stage = stage;
    this.getState = getState;
    this.layers = layers;
  }

  setTool(toolName: string): void {
    if (this.activeTool) {
      this.activeTool.deactivate();
      this.activeTool = null;
    }

    switch (toolName) {
      case 'rectangle':
        this.activeTool = new VanillaRectangleTool(this.stage, this.getState, this.layers);
        break;
      case 'pen':
        this.activeTool = new VanillaPenTool(this.stage, this.getState, this.layers);
        break;
      case 'marker':
        this.activeTool = new VanillaPenTool(this.stage, this.getState, this.layers, { isMarker: true });
        break;
      case 'highlighter':
        this.activeTool = new VanillaPenTool(this.stage, this.getState, this.layers, { isHighlighter: true });
        break;
      case 'pan':
      case 'select':
      default:
        this.activeTool = null; // handled by event handler (pan/select)
        break;
    }

    this.activeTool?.activate();
  }
}

class VanillaRectangleTool implements VanillaTool {
  private stage: Konva.Stage;
  private getState: () => UnifiedCanvasStore;
  private layers: VanillaLayerManager;
  private isCreating = false;
  private startPoint: { x: number; y: number } | null = null;
  private previewRect: Konva.Rect | null = null;

  constructor(stage: Konva.Stage, getState: () => UnifiedCanvasStore, layers: VanillaLayerManager) {
    this.stage = stage;
    this.getState = getState;
    this.layers = layers;
  }

  activate(): void {
    this.stage.on('mousedown.rectTool', () => {
      const pointer = this.stage.getPointerPosition();
      if (!pointer) return;
      this.isCreating = true;
      this.startPoint = pointer;
      // preview on UI layer
      const ui = this.layers.getUiLayer();
      if (ui) {
        this.previewRect = new Konva.Rect({
          x: pointer.x,
          y: pointer.y,
          width: 0,
          height: 0,
          stroke: '#1e90ff',
          dash: [4, 4],
          strokeWidth: 1,
          listening: false,
        });
        ui.add(this.previewRect);
        ui.draw();
      }
    });

    this.stage.on('mousemove.rectTool', () => {
      if (!this.isCreating || !this.startPoint || !this.previewRect) return;
      const pointer = this.stage.getPointerPosition();
      if (!pointer) return;
      const x = Math.min(this.startPoint.x, pointer.x);
      const y = Math.min(this.startPoint.y, pointer.y);
      const w = Math.abs(pointer.x - this.startPoint.x);
      const h = Math.abs(pointer.y - this.startPoint.y);
      this.previewRect.position({ x, y });
      this.previewRect.size({ width: w, height: h });
      this.previewRect.getLayer()?.batchDraw();
    });

    this.stage.on('mouseup.rectTool', () => {
      if (!this.isCreating || !this.startPoint) return;
      const rect = this.previewRect;
      this.isCreating = false;
      this.startPoint = null;

      if (rect) {
        const { x, y, width, height } = rect.getClientRect({ skipShadow: true, skipStroke: true });
        rect.destroy();
        this.previewRect = null;
        // Create element in store
        this.getState().addElement({
          id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) as any,
          type: 'rectangle',
          x,
          y,
          width: Math.max(10, width),
          height: Math.max(10, height),
          fill: '#eceff1',
          stroke: '#90a4ae',
          strokeWidth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false,
        } as any);
      }
    });
  }

  deactivate(): void {
    this.stage.off('.rectTool');
    if (this.previewRect) {
      this.previewRect.destroy();
      this.previewRect = null;
    }
    this.isCreating = false;
    this.startPoint = null;
  }
}

class VanillaPenTool implements VanillaTool {
  private stage: Konva.Stage;
  private getState: () => UnifiedCanvasStore;
  private layers: VanillaLayerManager;
  private isDrawing = false;
  private previewLine: Konva.Line | null = null;
  private options: { isMarker?: boolean; isHighlighter?: boolean };

  constructor(stage: Konva.Stage, getState: () => UnifiedCanvasStore, layers: VanillaLayerManager, options?: { isMarker?: boolean; isHighlighter?: boolean }) {
    this.stage = stage;
    this.getState = getState;
    this.layers = layers;
    this.options = options || {};
  }

  activate(): void {
    this.stage.on('mousedown.penTool', () => {
      const p = this.stage.getPointerPosition();
      if (!p) return;
      this.isDrawing = true;
      const mode: 'pen' | 'marker' | 'highlighter' = this.options.isHighlighter ? 'highlighter' : (this.options.isMarker ? 'marker' : 'pen');
      this.getState().startDrawing(mode, { x: p.x, y: p.y });

      // Live preview on tool layer
      const toolLayer = this.layers.getToolLayer();
      if (toolLayer) {
        const isMarker = this.options.isMarker;
        const isHighlighter = this.options.isHighlighter;
        const color = isHighlighter ? this.getState().strokeConfig.highlighter.color : (isMarker ? this.getState().strokeConfig.marker.color : (this.getState() as any).penColor || '#000');
        const width = isHighlighter ? this.getState().strokeConfig.highlighter.width : (isMarker ? Math.max(this.getState().strokeConfig.marker.minWidth, Math.min(this.getState().strokeConfig.marker.maxWidth, 6)) : 2);
        const opacity = isHighlighter ? this.getState().strokeConfig.highlighter.opacity : (isMarker ? this.getState().strokeConfig.marker.opacity : 1);
        const gco = isHighlighter ? this.getState().strokeConfig.highlighter.blendMode : 'source-over';

        this.previewLine = new Konva.Line({
          points: [p.x, p.y],
          stroke: color,
          strokeWidth: width,
          lineCap: 'round',
          lineJoin: 'round',
          tension: 0.5,
          opacity: opacity,
          globalCompositeOperation: gco as any,
          listening: false,
        });
        toolLayer.add(this.previewLine);
        toolLayer.draw();
      }
    });

    this.stage.on('mousemove.penTool', () => {
      if (!this.isDrawing) return;
      const p = this.stage.getPointerPosition();
      if (!p) return;
      this.getState().updateDrawing({ x: p.x, y: p.y });

      if (this.previewLine) {
        const pts = this.previewLine.points();
        this.previewLine.points([...pts, p.x, p.y]);
        this.previewLine.getLayer()?.batchDraw();
      }
    });

    this.stage.on('mouseup.penTool', () => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.getState().finishDrawing();

      if (this.previewLine) {
        const layer = this.previewLine.getLayer();
        this.previewLine.destroy();
        this.previewLine = null;
        layer?.batchDraw();
      }
    });
  }

  deactivate(): void {
    this.stage.off('.penTool');
    this.isDrawing = false;
    if (this.previewLine) {
      const layer = this.previewLine.getLayer();
      this.previewLine.destroy();
      this.previewLine = null;
      layer?.batchDraw();
    }
  }
}
