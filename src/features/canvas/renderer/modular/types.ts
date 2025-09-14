import type Konva from 'konva';

export type ElementId = string;

export interface CanvasElement {
  id: ElementId;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  [key: string]: any;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
  width?: number;
  height?: number;
}

export interface HistoryState {
  canUndo?: boolean;
  canRedo?: boolean;
}

export interface EdgeGraph {
  // id -> edge data
  [key: string]: any;
}

export interface CanvasSnapshot {
  elements: Map<ElementId, CanvasElement>;
  selection: Set<ElementId>;
  viewport: ViewportState;
  history: HistoryState;
  edges?: Map<string, any>;
  draft?: any;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface StoreAdapter {
  subscribe(listener: () => void): () => void;
  getSnapshot(): CanvasSnapshot;
  selectElement(id: ElementId | null, multi?: boolean): void;
  eraseAtPoint(x: number, y: number, eraserSize: number): void;
  eraseInPath(path: number[], eraserSize: number): void;
  startDrawing(tool: 'pen' | 'pencil' | 'marker' | 'highlighter' | 'eraser', point: { x: number; y: number }): void;
  updateDrawing(point: { x: number; y: number }): void;
  finishDrawing(): void;
  addElementDrawing?(element: CanvasElement): void;
  strokeConfig?: any;
}

export interface KonvaAdapter {
  getStage(): Konva.Stage | null;
  getLayers(): { background: Konva.Layer | null; main: Konva.Layer | null; preview: Konva.Layer | null; overlay: Konva.Layer | null };
}

export interface OverlayAdapter {
  // Reserved for DOM overlays if needed
}

export interface MetricsAdapter {
  log?(event: string, data?: any): void;
}

export interface ModuleContext {
  store: StoreAdapter;
  konva: KonvaAdapter;
  overlay: OverlayAdapter;
  metrics?: MetricsAdapter;
  flags?: FeatureFlags;
}

export type CanvasEvent = { type: string; [key: string]: any };

export interface RendererModule {
  init(ctx: ModuleContext): void | Promise<void>;
  sync(snapshot: CanvasSnapshot): void;
  onEvent?(evt: CanvasEvent, snapshot: CanvasSnapshot): boolean;
  destroy(): void;
}


