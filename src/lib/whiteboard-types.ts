// Comprehensive Digital Canvas Types for Miro/FigJam-style functionality

export type CanvasToolType = 
  | 'select' 
  | 'sticky-note' 
  | 'text' 
  | 'pen' 
  | 'shape' 
  | 'line' 
  | 'arrow' 
  | 'frame' 
  | 'image'
  | 'eraser';

export type CanvasShapeType = 
  | 'rectangle' 
  | 'circle' 
  | 'diamond' 
  | 'triangle' 
  | 'star' 
  | 'hexagon';

export type CanvasLineType = 
  | 'straight' 
  | 'curved' 
  | 'connector' 
  | 'freehand';

export type CanvasArrowStyle = 
  | 'none' 
  | 'arrow' 
  | 'dot' 
  | 'diamond' 
  | 'circle';

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasColor {
  fill: string;
  stroke: string;
  opacity: number;
}

export interface CanvasFont {
  family: string;
  size: number;
  weight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  style: 'normal' | 'italic';
  decoration: 'none' | 'underline' | 'line-through';
  align: 'left' | 'center' | 'right' | 'justify';
}

export interface CanvasStroke {
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  dashPattern?: number[];
}

export interface CanvasTransform {
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
}

// Base element interface
export interface CanvasElement {
  id: string;
  type: 'sticky-note' | 'text' | 'shape' | 'line' | 'arrow' | 'drawing' | 'frame' | 'image' | 'connector';
  position: CanvasPoint;
  size: CanvasSize;
  transform: CanvasTransform;
  zIndex: number;
  color: CanvasColor;
  stroke: CanvasStroke;
  font?: CanvasFont;
    shadow?: {
      blur: number;
      offset: CanvasPoint;
      color: string;
    };
  };
  content?: string;
  metadata: {
    layer: number;
    locked: boolean;
    visible: boolean;
    groupId?: string;
    sourceId?: string; // Reference to original note/task/chat
    sourceType?: string;
    createdBy: string;
    tags: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

// Specific element types
export interface CanvasStickyNote extends CanvasElement {
  type: 'sticky-note';
  content: string;
  style: CanvasElement['style'] & {
    autoResize: boolean;
    maxWidth?: number;
    minWidth?: number;
  };
}

export interface CanvasTextBox extends CanvasElement {
  type: 'text';
  content: string;
  style: CanvasElement['style'] & {
    font: CanvasFont;
    lineHeight: number;
    letterSpacing: number;
    wordWrap: boolean;
  };
}

export interface CanvasShape extends CanvasElement {
  type: 'shape';
  shapeType: CanvasShapeType;
  style: CanvasElement['style'] & {
    borderRadius?: number;
    gradient?: {
      type: 'linear' | 'radial';
      colors: Array<{ color: string; stop: number }>;
      direction?: number;
    };
  };
}

export interface CanvasLine extends CanvasElement {
  type: 'line';
  lineType: CanvasLineType;
  points: CanvasPoint[];
  style: CanvasElement['style'] & {
    startArrow: CanvasArrowStyle;
    endArrow: CanvasArrowStyle;
    smooth: boolean;
    tension?: number;
  };
}

export interface CanvasArrow extends CanvasElement {
  type: 'arrow';
  startPoint: CanvasPoint;
  endPoint: CanvasPoint;
  controlPoints?: CanvasPoint[];
  style: CanvasElement['style'] & {
    startArrow: CanvasArrowStyle;
    endArrow: CanvasArrowStyle;
    curved: boolean;
  };
}

export interface CanvasDrawing extends CanvasElement {
  type: 'drawing';
  paths: Array<{
    id: string;
    points: CanvasPoint[];
    style: CanvasStroke & { color: string };
    closed: boolean;
  }>;
  style: CanvasElement['style'] & {
    pressure?: boolean;
    smoothing: number;
  };
}

export interface CanvasFrame extends CanvasElement {
  type: 'frame';
  title: string;
  childElements: string[]; // IDs of contained elements
  style: CanvasElement['style'] & {
    titleFont: CanvasFont;
    titlePosition: 'top' | 'bottom' | 'left' | 'right';
    padding: number;
    borderRadius: number;
  };
}

export interface CanvasImage extends CanvasElement {
  type: 'image';
  src: string;
  originalSize: CanvasSize;
  style: CanvasElement['style'] & {
    aspectRatio: 'preserve' | 'stretch' | 'crop';
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
  };
}

export interface CanvasConnector extends CanvasElement {
  type: 'connector';
  sourceElementId: string;
  targetElementId: string;
  sourceAnchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
  targetAnchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
  style: CanvasElement['style'] & {
    connectionType: 'straight' | 'curved' | 'orthogonal';
    startArrow: CanvasArrowStyle;
    endArrow: CanvasArrowStyle;
  };
}

// Union type for all element types
export type AnyCanvasElement = 
  | CanvasStickyNote 
  | CanvasTextBox 
  | CanvasShape 
  | CanvasLine 
  | CanvasArrow 
  | CanvasDrawing 
  | CanvasFrame 
  | CanvasImage 
  | CanvasConnector;

// Viewport and canvas state
export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
  bounds: CanvasBounds;
}

export interface CanvasGrid {
  enabled: boolean;
  size: number;
  snapEnabled: boolean;
  snapThreshold: number;
  color: string;
  opacity: number;
  type: 'dots' | 'lines' | 'graph';
}

export interface CanvasSettings {
  grid: CanvasGrid;
  backgroundColor: string;
  backgroundImage?: string;
  rulers: {
    enabled: boolean;
    units: 'px' | 'mm' | 'cm' | 'in';
  };
  guides: {
    enabled: boolean;
    snapDistance: number;
    color: string;
  };
  performance: {
    virtualizeElements: boolean;
    maxVisibleElements: number;
    renderQuality: 'low' | 'medium' | 'high';
  };
}

export interface CanvasHistory {
  undoStack: CanvasHistoryEntry[];
  redoStack: CanvasHistoryEntry[];
  maxEntries: number;
}

export interface CanvasHistoryEntry {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move' | 'resize' | 'style' | 'group' | 'ungroup';
  timestamp: string;
  elements: {
    before?: Partial<AnyCanvasElement>[];
    after?: Partial<AnyCanvasElement>[];
  };
  description: string;
}

export interface CanvasSelection {
  elementIds: string[];
  bounds?: CanvasBounds;
  handles: {
    visible: boolean;
    resize: boolean;
    rotate: boolean;
  };
}

export interface CanvasGroup {
  id: string;
  name: string;
  elementIds: string[];
  collapsed: boolean;
  style?: {
    borderColor: string;
    backgroundColor: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  elementIds: string[];
  order: number;
}

// Main canvas state
export interface CanvasState {
  id: string;
  name: string;
  description?: string;
  elements: AnyCanvasElement[];
  groups: CanvasGroup[];
  layers: CanvasLayer[];
  viewport: CanvasViewport;
  settings: CanvasSettings;
  selection: CanvasSelection;
  history: CanvasHistory;
  metadata: {
    author: string;
    collaborators: string[];
    version: number;
    template?: string;
    tags: string[];
    isPublic: boolean;
    lastAutoSave: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Tool state and options
export interface CanvasToolState {
  activeTool: CanvasToolType;
  toolOptions: {
    stickyNote: {
      color: string;
      size: 'small' | 'medium' | 'large';
      autoResize: boolean;
    };
    text: {
      font: CanvasFont;
      color: string;
    };
    pen: {
      stroke: CanvasStroke;
      color: string;
      smoothing: number;
      pressureSensitive: boolean;
    };
    shape: {
      shapeType: CanvasShapeType;
      color: CanvasColor;
      stroke: CanvasStroke;
    };
    line: {
      lineType: CanvasLineType;
      color: string;
      stroke: CanvasStroke;
      startArrow: CanvasArrowStyle;
      endArrow: CanvasArrowStyle;
    };
  };
}

// Templates and presets
export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  category: 'brainstorming' | 'planning' | 'analysis' | 'design' | 'education' | 'custom';
  thumbnail: string;
  elements: AnyCanvasElement[];
  settings: CanvasSettings;
  tags: string[];
  isBuiltIn: boolean;
  usageCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

// AI integration types
export interface CanvasAISuggestion {
  id: string;
  type: 'element' | 'layout' | 'content' | 'connection' | 'organization';
  title: string;
  description: string;
  confidence: number;
  targetElementIds?: string[];
  suggestedElements?: Partial<AnyCanvasElement>[];
  suggestedChanges?: {
    elementId: string;
    changes: Partial<AnyCanvasElement>;
  }[];
  reasoning: string;
  actions: Array<{
    id: string;
    label: string;
    action: string;
  }>;
  createdAt: string;
}

export interface CanvasAIContext {
  elements: AnyCanvasElement[];
  userIntent?: string;
  sessionHistory: string[];
  relatedContent: {
    notes: string[];
    tasks: string[];
    chats: string[];
  };
}

// Export and import types
export interface CanvasExportOptions {
  format: 'json' | 'svg' | 'png' | 'pdf' | 'jpg';
  quality: 'low' | 'medium' | 'high';
  includeBackground: boolean;
  selectedOnly: boolean;
  scale: number;
  bounds?: CanvasBounds;
}

export interface CanvasImportData {
  type: 'json' | 'image' | 'svg';
  data: string | ArrayBuffer;
  position?: CanvasPoint;
  preserveIds: boolean;
}

// Event types for interactions
export interface CanvasEvent {
  type: string;
  timestamp: string;
  elementId?: string;
  data: Record<string, any>;
}

export interface CanvasInteractionEvent extends CanvasEvent {
  type: 'element:click' | 'element:doubleclick' | 'element:hover' | 'canvas:click' | 'canvas:drag';
  position: CanvasPoint;
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
}

// Performance monitoring
export interface CanvasPerformanceMetrics {
  renderTime: number;
  elementCount: number;
  visibleElementCount: number;
  memoryUsage: number;
  frameRate: number;
  lastUpdate: string;
}

// Spatial indexing interfaces
export interface QuadTreeNode {
  bounds: CanvasBounds;
  elements: AnyCanvasElement[];
  children: QuadTreeNode[] | null;
  maxElements: number;
  maxDepth: number;
  depth: number;
}

export interface QuadTreeStats {
  totalNodes: number;
  leafNodes: number;
  maxDepth: number;
  totalElements: number;
  averageElementsPerNode: number;
  memoryUsage: number;
}

// Enhanced performance monitoring
export interface PerformanceMetrics {
  renderTime: number;
  interactionLatency: number;
  memoryUsage: number;
  elementCount: number;
  quadTreeDepth: number;
  viewportCulledElements: number;
  spatialQueryTime: number;
  lastFrameTime: number;
  frameRate: number;
}

export interface FrameRateMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  samples: number[];
}

export interface MemoryMetrics {
  used: number;
  allocated: number;
  peak: number;
  pooledObjects: number;
}

// Viewport management
export interface ViewportCullingStats {
  totalElements: number;
  visibleElements: number;
  culledElements: number;
  lodReductions: number;
  renderTimeSaved: number;
}

export enum ElementLOD {
  FULL_DETAIL = 'full',
  MEDIUM_DETAIL = 'medium',
  LOW_DETAIL = 'low',
  HIDDEN = 'hidden'
}

export interface LODSettings {
  fullDetailZoom: number;
  mediumDetailZoom: number;
  lowDetailZoom: number;
  hideZoom: number;
}

// Memory pooling interfaces
export interface PoolableObject {
  reset(): void;
}

export interface ObjectPool<T extends PoolableObject> {
  acquire(): T;
  release(item: T): void;
  size(): number;
  clear(): void;
  stats(): ObjectPoolStats;
}

export interface ObjectPoolStats {
  totalCreated: number;
  currentlyPooled: number;
  currentlyInUse: number;
  peakUsage: number;
  hitRate: number;
}

// Advanced Drawing Tools - Phase 1b
export interface BezierCurve {
  startPoint: CanvasPoint;
  controlPoint1: CanvasPoint;
  controlPoint2: CanvasPoint;
  endPoint: CanvasPoint;
  length: number;
}

export interface BezierCurveFitter {
  fitCurve(points: CanvasPoint[], tolerance: number): BezierCurve[];
  optimizePath(points: CanvasPoint[]): CanvasPoint[];
  simplifyPath(points: CanvasPoint[], tolerance: number): CanvasPoint[];
}

export interface PressureSensitivityHandler {
  processPressure(event: PointerEvent): number;
  adaptStrokeWidth(pressure: number, baseWidth: number): number;
  adaptOpacity(pressure: number, baseOpacity: number): number;
}

export type RecognizedShapeType = 'line' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'star';

export interface RecognizedShape {
  type: RecognizedShapeType;
  bounds: CanvasBounds;
  points: CanvasPoint[];
  confidence: number;
  suggestedElement: Partial<AnyCanvasElement>;
}

export interface ShapeRecognizer {
  recognizeShape(points: CanvasPoint[]): RecognizedShape | null;
  confidence: number;
  supportedShapes: RecognizedShapeType[];
}

// File Format & Compression - Phase 1c
export interface OptimizedFileFormat {
  header: {
    version: string;
    compression: 'brotli' | 'gzip' | 'none';
    elementCount: number;
    canvasBounds: CanvasBounds;
    created: number;
    modified: number;
    checksum: string;
  };
  spatialIndex: SerializedQuadTree;
  elements: CompressedElementData;
  metadata: CanvasMetadata;
}

export interface SerializedQuadTree {
  bounds: CanvasBounds;
  maxElements: number;
  maxDepth: number;
  nodes: SerializedQuadTreeNode[];
}

export interface SerializedQuadTreeNode {
  id: string;
  bounds: CanvasBounds;
  elementIds: string[];
  parentId?: string;
  childIds: string[];
  depth: number;
}

export interface CompressedElementData {
  format: 'json' | 'binary';
  size: number;
  originalSize: number;
  compressionRatio: number;
  data: ArrayBuffer | string;
}

export interface CanvasMetadata {
  title: string;
  description: string;
  author: string;
  tags: string[];
  thumbnail?: string;
  lastModified: number;
  version: number;
}

export interface FileFormatManager {
  compress(data: CanvasState): Promise<ArrayBuffer>;
  decompress(data: ArrayBuffer): Promise<CanvasState>;
  validate(data: ArrayBuffer): Promise<boolean>;
  migrate(data: ArrayBuffer, fromVersion: string): Promise<ArrayBuffer>;
  createChecksum(data: ArrayBuffer): string;
}

// GPU Rendering Preparation - Phase 1d
export interface RenderingCapabilities {
  maxTextureSize: number;
  supportsInstancedRendering: boolean;
  supportsComputeShaders: boolean;
  maxVertexAttributes: number;
  memoryLimits: {
    vertices: number;
    textures: number;
    uniforms: number;
  };
}

export interface RenderingBackend {
  type: 'dom' | 'canvas2d' | 'webgl' | 'webgpu';
  capabilities: RenderingCapabilities;
  initialize(): Promise<boolean>;
  render(elements: WhiteboardElement[], viewport: WhiteboardBounds): void;
  dispose(): void;
}

export interface HybridRenderer {
  selectOptimalBackend(elements: CanvasElement[]): RenderingBackend;
  fallbackToCompatibleBackend(): RenderingBackend;
  renderWithBackend(backend: RenderingBackend, elements: CanvasElement[]): void;
}

// Advanced Export System - Phase 1e
export interface AdvancedExportOptions {
  format: 'svg' | 'png' | 'pdf' | 'json';
  quality: number; // 0.1 to 1.0
  dpi: number;
  bounds?: CanvasBounds;
  backgroundTransparent: boolean;
  includeHiddenElements: boolean;
  compression?: 'none' | 'lossless' | 'lossy';
  parallelProcessing?: boolean;
}

export interface ExportResult {
  format: string;
  data: Blob | string | ArrayBuffer;
  size: number;
  processingTime: number;
  quality: number;
}

export interface AdvancedExportEngine {
  exportToSVG(elements: CanvasElement[], options: AdvancedExportOptions): Promise<string>;
  exportToPNG(elements: CanvasElement[], options: AdvancedExportOptions): Promise<Blob>;
  exportToPDF(elements: CanvasElement[], options: AdvancedExportOptions): Promise<ArrayBuffer>;
  exportToJSON(state: CanvasState, options: AdvancedExportOptions): Promise<string>;
  exportMultipleFormats(
    elements: CanvasElement[],
    formats: AdvancedExportOptions[]
  ): Promise<Map<string, ExportResult>>;
}

// Performance Benchmarking
export interface PerformanceBenchmark {
  elementCreation: number; // ms per element
  spatialQueries: number; // ms per query
  renderTime: number; // ms per frame
  memoryUsage: number; // bytes
  fileLoadTime: number; // ms
  fileSaveTime: number; // ms
  exportTime: number; // ms
  timestamp: number;
}

// Enhanced Memory Pooling
export interface PoolableCanvasPoint extends CanvasPoint, PoolableObject {}
export interface PoolableCanvasBounds extends CanvasBounds, PoolableObject {}
export interface PoolableCanvasElement extends CanvasElement, PoolableObject {}
export interface PoolableCanvasPointArray extends Array<CanvasPoint>, PoolableObject {}
export interface PoolableDOMMatrix extends DOMMatrix, PoolableObject {}
export interface PoolableEvent extends Event, PoolableObject {}

export interface CanvasMemoryPools {
  points: ObjectPool<PoolableCanvasPoint>;
  bounds: ObjectPool<PoolableCanvasBounds>;
  elements: ObjectPool<PoolableCanvasElement>;
  pathPoints: ObjectPool<PoolableCanvasPointArray>;
  transformMatrix: ObjectPool<PoolableDOMMatrix>;
  events: ObjectPool<PoolableEvent>;
}