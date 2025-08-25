// src/features/canvas/core/UnifiedEventHandler.ts
import Konva from 'konva';
import { TextTool } from '../tools/TextTool';
import { RectangleTool } from '../tools/RectangleTool';
import { CircleTool } from '../tools/CircleTool';
import { TriangleTool } from '../tools/TriangleTool';
import { ITool } from '../tools/ShapeTools';
import { SelectTool, PanTool } from '../tools/ShapeTools';
import { StickyNoteTool } from '../tools/StickyNoteTool';
import { ConnectorTool } from '../tools/ConnectorTool';
import { PenTool, MarkerTool, HighlighterTool, EraserTool } from '../tools/PenTool';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';

export class UnifiedEventHandler {
  private stage: Konva.Stage;
  private tools: Map<string, ITool>;
  private activeTool: ITool | null = null;
  private unsubTool?: () => void;
  private unsubSelectedTool?: () => void;

  constructor(stage: Konva.Stage, store: any) {
    this.stage = stage;
    this.tools = new Map();

    // Register tools
    const textTool = new TextTool();
    const selectTool = new SelectTool();
    const panTool = new PanTool();
    const rectTool = new RectangleTool();
    const circleTool = new CircleTool();
    const triangleTool = new TriangleTool();
    const stickyTool = new StickyNoteTool();
    const connectorTool = new ConnectorTool();
    const penTool = new PenTool();
    const markerTool = new MarkerTool();
    const highlighterTool = new HighlighterTool();
    const eraserTool = new EraserTool();
    [selectTool, panTool, textTool, rectTool, circleTool, triangleTool, stickyTool, connectorTool, penTool, markerTool, highlighterTool, eraserTool].forEach(t => this.tools.set(t.type, t));
    
    // Set initial tool from store
    this.setActiveTool((store as any).selectedTool || 'select');

    // Subscribe to selectedTool changes
    this.unsubSelectedTool = useUnifiedCanvasStore.subscribe(
      (s) => s.selectedTool,
      (toolId) => {
        if (typeof toolId === 'string') {
          this.setActiveTool(toolId);
        }
      }
    );

    this.stage.on('mousedown', this.handleMouseDown.bind(this));
    this.stage.on('mousemove', this.handleMouseMove.bind(this));
    this.stage.on('mouseup', this.handleMouseUp.bind(this));
  }

  private applyCursor() {
    const cursor = this.activeTool?.cursor || 'default';
    this.stage.container().style.cursor = cursor;
  }

  private handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (this.activeTool?.onMouseDown) {
      this.activeTool.onMouseDown(e);
    }
  }

  private handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (this.activeTool && (this.activeTool as any).onMouseMove) {
      (this.activeTool as any).onMouseMove(e);
    }
  }

  private handleMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
    if (this.activeTool && (this.activeTool as any).onMouseUp) {
      (this.activeTool as any).onMouseUp(e);
    }
  }

  setActiveTool(toolId: string) {
    if (this.activeTool) {
      this.activeTool.deactivate();
    }
    this.activeTool = this.tools.get(toolId) || null;
    if (this.activeTool) {
      this.activeTool.activate();
    }
    this.applyCursor();
  }

  destroy() {
    this.stage.off('mousedown mousemove mouseup');
    if (this.unsubSelectedTool) this.unsubSelectedTool();
  }
}
