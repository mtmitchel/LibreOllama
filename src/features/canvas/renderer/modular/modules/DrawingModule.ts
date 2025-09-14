import Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot, CanvasEvent } from '../types';
import { useUnifiedCanvasStore, UnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { createElementId } from '../../../types/enhanced.types';
import { nanoid } from 'nanoid';
import { acquireNode, releaseNode } from '../../../utils/KonvaNodePool';
import { getContentPointer } from '../../../utils/pointer-to-content';

/**
 * DrawingModule handles pen, marker, and highlighter drawing functionality.
 * This module matches the exact behavior of the existing tool components
 * with high-performance preview layer management and RAF batching.
 */
export class DrawingModule implements RendererModule {
  private ctx!: ModuleContext;
  private store: UnifiedCanvasStore;
  private unsubscribeStore: (() => void) | null = null;

  // Drawing state
  private isDrawing: boolean = false;
  private currentTool: 'pen' | 'marker' | 'highlighter' | null = null;
  private points: number[] = [];
  private lastPoint: { x: number; y: number } | null = null;

  // Performance optimization - pooled preview line
  private pooledNode: Konva.Line | null = null;
  private previewLayer: Konva.Layer | null = null;

  // RAF batching
  private rafId: number = 0;
  private pendingUpdate: boolean = false;

  constructor() {
    this.store = useUnifiedCanvasStore.getState();
    this.unsubscribeStore = useUnifiedCanvasStore.subscribe(
      (state) => {
        this.store = state;
      }
    );
  }

  init(ctx: ModuleContext): void {
    this.ctx = ctx;

    // Set up preview layer reference
    const stage = this.ctx.konva.getStage();
    if (stage) {
      this.previewLayer = stage.findOne('.preview-fast-layer') as Konva.Layer | null;
      if (!this.previewLayer) {
        this.previewLayer = this.ctx.konva.getLayers().preview || this.ctx.konva.getLayers().main;
      }
    }

    this.bindEvents();
  }

  sync(snapshot: CanvasSnapshot): void {
    // No specific sync needed - drawing state is maintained locally
  }

  onEvent(evt: CanvasEvent, snapshot: CanvasSnapshot): boolean {
    // For now, drawing events are handled directly via stage event binding
    // This method is reserved for future centralized event system integration
    return false;
  }

  private bindEvents(): void {
    const stage = this.ctx.konva.getStage();
    if (!stage) return;

    stage.on('pointerdown mousedown', this.handlePointerDown);
    stage.on('pointermove mousemove', this.handlePointerMove);
    stage.on('pointerup mouseup', this.handlePointerUp);
  }

  private handlePointerDown = (e: Konva.KonvaEventObject<PointerEvent | MouseEvent>) => {
    try {
      const tool = this.store.selectedTool;
      if (!this.isDrawingTool(tool) || !this.ctx.konva.getStage()) return;

      const stage = this.ctx.konva.getStage()!;
      const pointer = getContentPointer(stage);
      if (!pointer) return;

      // Initialize drawing state
      this.isDrawing = true;
      this.currentTool = tool as 'pen' | 'marker' | 'highlighter';
      this.points = [];
      this.lastPoint = null;

      // Signal drawing start to store
      this.ctx.store.startDrawing(this.currentTool, pointer);

      // Add initial point with interpolation
      this.addPoint(pointer.x, pointer.y);

      // Set up preview line
      this.setupPreviewLine();

      e.evt.preventDefault();
    } catch (error) {
      console.error('[DrawingModule] Error handling pointer down:', error);
    }
  };

  private handlePointerMove = (e: Konva.KonvaEventObject<PointerEvent | MouseEvent>) => {
    try {
      if (!this.isDrawing || !this.currentTool || !this.ctx.konva.getStage()) return;

      const stage = this.ctx.konva.getStage()!;
      const pointer = getContentPointer(stage);
      if (!pointer) return;

      // Add point with interpolation for smooth drawing
      this.addPoint(pointer.x, pointer.y);

      // Update store (for any store-based preview)
      this.ctx.store.updateDrawing(pointer);

      // Batch preview updates with RAF
      this.schedulePreviewUpdate();

      e.evt.preventDefault();
    } catch (error) {
      console.error('[DrawingModule] Error handling pointer move:', error);
    }
  };

  private handlePointerUp = (e: Konva.KonvaEventObject<PointerEvent | MouseEvent>) => {
    try {
      if (!this.isDrawing || !this.currentTool) return;

      // Only commit meaningful strokes
      if (this.points.length >= 4) {
        this.commitDrawing();
      }

      // Signal drawing end to store
      this.ctx.store.finishDrawing();

      // Reset state
      this.resetDrawingState();

      e.evt.preventDefault();
    } catch (error) {
      console.error('[DrawingModule] Error handling pointer up:', error);
    }
  };

  private isDrawingTool(tool: string): boolean {
    return tool === 'pen' || tool === 'marker' || tool === 'highlighter';
  }

  private addPoint(x: number, y: number): void {
    const last = this.lastPoint;
    if (!last) {
      this.points.push(x, y);
      this.lastPoint = { x, y };
      return;
    }

    const dx = x - last.x;
    const dy = y - last.y;
    const dist = Math.hypot(dx, dy);
    const step = 2; // px - tunable for smoothness

    if (dist > step) {
      const n = Math.floor(dist / step);
      for (let i = 1; i <= n; i++) {
        const nx = last.x + (dx * (i / n));
        const ny = last.y + (dy * (i / n));
        this.points.push(nx, ny);
      }
    } else {
      this.points.push(x, y);
    }
    this.lastPoint = { x, y };
  }

  private setupPreviewLine(): void {
    if (!this.previewLayer || !this.currentTool) return;

    // Acquire pooled node for performance
    if (!this.pooledNode) {
      this.pooledNode = acquireNode('line') as Konva.Line;
      this.previewLayer.add(this.pooledNode);
    }

    // Configure line based on tool
    if (this.pooledNode) {
      const style = this.getToolStyle(this.currentTool);
      this.pooledNode.points(this.points);
      this.pooledNode.stroke(style.color);
      this.pooledNode.strokeWidth(style.width);
      this.pooledNode.opacity(style.opacity);
      this.pooledNode.lineCap(style.lineCap as any);
      this.pooledNode.lineJoin(style.lineJoin as any);
      this.pooledNode.tension(style.tension || 0);
      this.pooledNode.listening(false);
      this.pooledNode.perfectDrawEnabled(false);

      // Set blend mode for highlighter
      if (this.currentTool === 'highlighter') {
        this.pooledNode.globalCompositeOperation('multiply');
      } else {
        this.pooledNode.globalCompositeOperation('source-over');
      }
    }

    this.previewLayer.batchDraw();
  }

  private schedulePreviewUpdate(): void {
    if (this.pendingUpdate) return;

    this.pendingUpdate = true;
    this.rafId = requestAnimationFrame(() => {
      this.updatePreviewLine();
      this.pendingUpdate = false;
    });
  }

  private updatePreviewLine(): void {
    if (!this.pooledNode || !this.previewLayer) return;

    this.pooledNode.points(this.points);
    this.previewLayer.batchDraw();
  }

  private getToolStyle(tool: 'pen' | 'marker' | 'highlighter'): any {
    switch (tool) {
      case 'pen':
        return {
          color: this.store.penColor,
          width: 2,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
          tension: 0.5,
        };
      case 'marker':
        const markerConfig = this.store.strokeConfig?.marker;
        return {
          color: markerConfig?.color || '#FFFF00',
          width: markerConfig?.maxWidth || 8,
          opacity: markerConfig?.opacity || 0.7,
          lineCap: 'round',
          lineJoin: 'round',
          tension: markerConfig?.smoothness || 0.5,
        };
      case 'highlighter':
        const highlighterConfig = this.store.strokeConfig?.highlighter;
        return {
          color: highlighterConfig?.color || '#f7e36d',
          width: highlighterConfig?.width || 12,
          opacity: highlighterConfig?.opacity || 0.5,
          lineCap: 'round',
          lineJoin: 'round',
          blendMode: 'multiply',
        };
    }
  }

  private commitDrawing(): void {
    if (!this.currentTool || this.points.length < 4) return;

    switch (this.currentTool) {
      case 'pen':
        this.commitPenStroke();
        break;
      case 'marker':
        this.commitMarkerStroke();
        break;
      case 'highlighter':
        this.commitHighlighterStroke();
        break;
    }
  }

  private commitPenStroke(): void {
    const style = this.getToolStyle('pen');
    const penElement = {
      id: createElementId(nanoid()),
      type: 'pen' as const,
      points: this.points,
      strokeWidth: style.width,
      stroke: style.color,
      opacity: style.opacity,
      x: 0,
      y: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add to store using optimized drawing path
    if (this.store.addElementDrawing) {
      this.store.addElementDrawing(penElement as any);
    }
  }

  private commitMarkerStroke(): void {
    const style = this.getToolStyle('marker');
    const markerElement = {
      id: createElementId(nanoid()),
      type: 'marker' as const,
      points: this.points,
      strokeWidth: style.width,
      fill: style.color,
      style: 'solid',
      x: 0,
      y: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (this.store.addElementDrawing) {
      this.store.addElementDrawing(markerElement as any);
    }
  }

  private commitHighlighterStroke(): void {
    const style = this.getToolStyle('highlighter');
    const highlighterElement = {
      id: createElementId(nanoid()),
      type: 'highlighter' as const,
      points: this.points,
      strokeWidth: style.width,
      stroke: style.color,
      opacity: style.opacity,
      blendMode: style.blendMode,
      x: 0,
      y: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (this.store.addElementDrawing) {
      this.store.addElementDrawing(highlighterElement as any);
    }
  }


  private resetDrawingState(): void {
    this.isDrawing = false;
    this.currentTool = null;
    this.points = [];
    this.lastPoint = null;

    // Clear preview
    if (this.pooledNode) {
      this.pooledNode.points([]);
    }

    // Cancel any pending RAF
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.pendingUpdate = false;

    this.previewLayer?.batchDraw();
  }

  destroy(): void {
    // Cancel RAF
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }

    // Unbind stage events
    const stage = this.ctx?.konva?.getStage();
    if (stage) {
      stage.off('pointerdown mousedown', this.handlePointerDown);
      stage.off('pointermove mousemove', this.handlePointerMove);
      stage.off('pointerup mouseup', this.handlePointerUp);
    }

    // Release pooled node
    if (this.pooledNode) {
      this.pooledNode.remove();
      releaseNode(this.pooledNode, 'line');
      this.pooledNode = null;
    }

    // Clean up store subscription
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }

    // Reset state
    this.resetDrawingState();
  }
}