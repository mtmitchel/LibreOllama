import { ToolType } from './tools';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  skewX: number;
  skewY: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  backgroundColor: string;
  infiniteCanvas: boolean;
}

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface CanvasState {
  elements: Record<string, CanvasElement>;
  selectedIds: string[];
  clipboard: CanvasElement[];
  viewport: Viewport;
  settings: CanvasSettings;
  selectionBox: SelectionBox;
  isDragging: boolean;
  isResizing: boolean;
  currentTool: ToolType;
  mode: CanvasMode;
}

export enum CanvasMode {
  SELECT = 'select',
  DRAW = 'draw',
  TEXT = 'text',
  SHAPE = 'shape',
  CONNECTOR = 'connector',
  PAN = 'pan',
  ZOOM = 'zoom'
}

export interface HistoryState {
  id: string;
  timestamp: number;
  elements: Record<string, CanvasElement>;
  selectedIds: string[];
  viewport: Viewport;
  description: string;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  parentId?: string;
  groupId?: string;
  style: ElementStyle;
  data: ElementData;
  createdAt: number;
  modifiedAt: number;
}

export interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDashArray?: number[];
  borderRadius?: number;
  shadow?: Shadow;
  gradient?: Gradient;
}

export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface Gradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  angle?: number;
}

export interface GradientStop {
  color: string;
  offset: number;
}

export type ElementData = 
  | TextElementData
  | ShapeElementData
  | TableElementData
  | StickyNoteData
  | ConnectorData
  | ImageData
  | SectionData
  | FreeformData
  | ArrowData
  | LineData
  | CustomShapeData
  | SymbolData
  | MediaData
  | GroupData
  | FrameData;

export interface TextElementData {
  content: any; // Slate.js content
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textDecoration: string;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  backgroundColor: string;
  padding: number;
  autoSize: boolean;
}

export interface ShapeElementData {
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'star';
  cornerRadius?: number;
  sides?: number; // for polygon
  points?: number; // for star
}

export interface TableElementData {
  rows: number;
  cols: number;
  cellData: TableCell[][];
  columnWidths: number[];
  rowHeights: number[];
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
  alternateRowColor?: string;
}

export interface TableCell {
  content: any; // Slate.js content
  style: ElementStyle;
  rowSpan: number;
  colSpan: number;
}

export interface StickyNoteData {
  content: any; // Slate.js content
  color: string;
  fontSize: number;
  fontFamily: string;
}

export interface ConnectorData {
  startElementId?: string;
  endElementId?: string;
  startPoint: Point;
  endPoint: Point;
  startConnectionPoint?: ConnectionPoint;
  endConnectionPoint?: ConnectionPoint;
  pathType: 'straight' | 'curved' | 'stepped';
  arrowStart: boolean;
  arrowEnd: boolean;
  points: Point[]; // For complex paths
}

export interface ConnectionPoint {
  id: string;
  x: number;
  y: number;
  direction: 'top' | 'bottom' | 'left' | 'right';
}

export interface ImageData {
  src: string;
  alt: string;
  preserveAspectRatio: boolean;
  cropData?: CropData;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SectionData {
  title: string;
  color: string;
  collapsed: boolean;
  childIds: string[];
}

export interface FreeformData {
  points: Point[];
  pressure: number[];
  strokeWidth: number;
  strokeColor: string;
  smoothing: number;
}

export interface ArrowData {
  startPoint: Point;
  endPoint: Point;
  arrowheadType: 'triangle' | 'circle' | 'diamond' | 'none';
  arrowheadSize: number;
}

export interface LineData {
  points: Point[];
  strokeWidth: number;
  strokeColor: string;
  strokeDashArray: number[];
}

export interface CustomShapeData {
  path: string; // SVG path data
  viewBox: string;
}

export interface SymbolData {
  symbolId: string;
  symbolType: string;
  symbolData: any;
}

export interface MediaData {
  mediaType: 'video' | 'audio' | 'embed';
  src: string;
  thumbnail?: string;
  autoPlay: boolean;
  controls: boolean;
}

export interface GroupData {
  childIds: string[];
  name: string;
}

export interface FrameData {
  childIds: string[];
  name: string;
  showInLayers: boolean;
  clipContent: boolean;
}

export enum ElementType {
  TEXT = 'text',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  TRIANGLE = 'triangle',
  ARROW = 'arrow',
  LINE = 'line',
  FREEFORM = 'freeform',
  STICKY_NOTE = 'sticky_note',
  TABLE = 'table',
  CONNECTOR = 'connector',
  IMAGE = 'image',
  SECTION = 'section',
  CUSTOM_SHAPE = 'custom_shape',
  SYMBOL = 'symbol',
  MEDIA = 'media',
  GROUP = 'group',
  FRAME = 'frame'
}

export interface CanvasEvent {
  type: string;
  target?: CanvasElement;
  point: Point;
  originalEvent: Event;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export interface DragEvent extends CanvasEvent {
  delta: Point;
  startPoint: Point;
  currentPoint: Point;
}

export interface ResizeHandle {
  id: string;
  position: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
  x: number;
  y: number;
  cursor: string;
}
