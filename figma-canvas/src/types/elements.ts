import { CanvasElement, ElementType, Point, ElementStyle } from './canvas';

export interface ElementFactory {
  create(type: ElementType, props: Partial<CanvasElement>): CanvasElement;
  createFromTool(toolType: string, startPoint: Point, endPoint: Point): CanvasElement;
  duplicate(element: CanvasElement): CanvasElement;
}

export interface ElementRenderer {
  render(element: CanvasElement, isSelected: boolean, isHovered: boolean): React.ReactNode;
  getConnectionPoints(element: CanvasElement): ConnectionPoint[];
  getBounds(element: CanvasElement): { x: number; y: number; width: number; height: number };
  hitTest(element: CanvasElement, point: Point): boolean;
}

export interface ConnectionPoint {
  id: string;
  x: number;
  y: number;
  direction: 'top' | 'bottom' | 'left' | 'right' | 'center';
  elementId: string;
}

export interface ElementValidation {
  isValid(element: CanvasElement): boolean;
  getErrors(element: CanvasElement): string[];
  fix(element: CanvasElement): CanvasElement;
}

export interface ElementTransform {
  translate(element: CanvasElement, dx: number, dy: number): CanvasElement;
  resize(element: CanvasElement, newBounds: { x: number; y: number; width: number; height: number }): CanvasElement;
  rotate(element: CanvasElement, angle: number, origin?: Point): CanvasElement;
  scale(element: CanvasElement, scaleX: number, scaleY: number, origin?: Point): CanvasElement;
}

export interface ElementSerializer {
  serialize(element: CanvasElement): any;
  deserialize(data: any): CanvasElement;
  export(element: CanvasElement, format: 'svg' | 'png' | 'json'): string | Blob;
}

export interface TextElementConfig {
  defaultFontSize: number;
  defaultFontFamily: string;
  defaultColor: string;
  minFontSize: number;
  maxFontSize: number;
  availableFonts: string[];
  textAlign: ('left' | 'center' | 'right' | 'justify')[];
}

export interface ShapeElementConfig {
  defaultStyle: ElementStyle;
  availableShapes: string[];
  defaultCornerRadius: number;
  minCornerRadius: number;
  maxCornerRadius: number;
}

export interface TableElementConfig {
  defaultRows: number;
  defaultCols: number;
  minRows: number;
  maxRows: number;
  minCols: number;
  maxCols: number;
  defaultCellWidth: number;
  defaultCellHeight: number;
  defaultBorderWidth: number;
  defaultBorderColor: string;
  defaultBackgroundColor: string;
}

export interface StickyNoteConfig {
  defaultColor: string;
  availableColors: string[];
  defaultSize: { width: number; height: number };
  defaultFontSize: number;
}

export interface ConnectorConfig {
  defaultStyle: ElementStyle;
  connectionRadius: number;
  snapDistance: number;
  arrowSize: number;
  availablePathTypes: ('straight' | 'curved' | 'stepped')[];
}

export interface ElementBehavior {
  onCreate?: (element: CanvasElement) => CanvasElement;
  onUpdate?: (element: CanvasElement, changes: Partial<CanvasElement>) => CanvasElement;
  onDelete?: (element: CanvasElement) => void;
  onSelect?: (element: CanvasElement) => void;
  onDeselect?: (element: CanvasElement) => void;
  onMove?: (element: CanvasElement, newPosition: Point) => CanvasElement;
  onResize?: (element: CanvasElement, newBounds: { x: number; y: number; width: number; height: number }) => CanvasElement;
  onRotate?: (element: CanvasElement, newRotation: number) => CanvasElement;
}

export interface ElementAnimation {
  id: string;
  elementId: string;
  property: string;
  fromValue: any;
  toValue: any;
  duration: number;
  easing: string;
  delay: number;
  repeat: number;
  direction: 'normal' | 'reverse' | 'alternate';
}

export interface ElementConstraint {
  type: 'position' | 'size' | 'aspect-ratio' | 'connection';
  target?: string; // Target element ID for relative constraints
  value: any;
  enabled: boolean;
}

export interface LayerInfo {
  id: string;
  name: string;
  elementIds: string[];
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
}

export interface ElementGroup {
  id: string;
  name: string;
  elementIds: string[];
  locked: boolean;
  expanded: boolean;
  bounds: { x: number; y: number; width: number; height: number };
}

export interface ElementPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canMove: boolean;
  canResize: boolean;
  canRotate: boolean;
  canDuplicate: boolean;
  canStyle: boolean;
}

export interface ElementMetadata {
  version: string;
  author: string;
  createdWith: string;
  tags: string[];
  notes: string;
  url?: string;
  source?: string;
}

export interface CustomElementDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  defaultData: any;
  configSchema: any;
  renderer: ElementRenderer;
  behavior: ElementBehavior;
  validation: ElementValidation;
}

export const DEFAULT_ELEMENT_CONFIGS = {
  text: {
    defaultFontSize: 16,
    defaultFontFamily: 'Inter',
    defaultColor: '#000000',
    minFontSize: 8,
    maxFontSize: 128,
    availableFonts: [
      'Inter',
      'Roboto',
      'Open Sans',
      'Lato',
      'Montserrat',
      'Source Sans Pro',
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Georgia',
      'Courier New'
    ],
    textAlign: ['left', 'center', 'right', 'justify']
  } as TextElementConfig,
  
  shape: {
    defaultStyle: {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1
    },
    availableShapes: ['rectangle', 'circle', 'triangle', 'polygon', 'star'],
    defaultCornerRadius: 0,
    minCornerRadius: 0,
    maxCornerRadius: 50
  } as ShapeElementConfig,
  
  table: {
    defaultRows: 3,
    defaultCols: 3,
    minRows: 1,
    maxRows: 50,
    minCols: 1,
    maxCols: 20,
    defaultCellWidth: 100,
    defaultCellHeight: 40,
    defaultBorderWidth: 1,
    defaultBorderColor: '#cccccc',
    defaultBackgroundColor: '#ffffff'
  } as TableElementConfig,
  
  stickyNote: {
    defaultColor: '#ffeb3b',
    availableColors: [
      '#ffeb3b', // Yellow
      '#ff9800', // Orange
      '#f44336', // Red
      '#e91e63', // Pink
      '#9c27b0', // Purple
      '#673ab7', // Deep Purple
      '#3f51b5', // Indigo
      '#2196f3', // Blue
      '#03a9f4', // Light Blue
      '#00bcd4', // Cyan
      '#009688', // Teal
      '#4caf50', // Green
      '#8bc34a', // Light Green
      '#cddc39'  // Lime
    ],
    defaultSize: { width: 150, height: 150 },
    defaultFontSize: 14
  } as StickyNoteConfig,
  
  connector: {
    defaultStyle: {
      stroke: '#000000',
      strokeWidth: 2
    },
    connectionRadius: 8,
    snapDistance: 20,
    arrowSize: 8,
    availablePathTypes: ['straight', 'curved', 'stepped']
  } as ConnectorConfig
};

export interface ElementExportOptions {
  format: 'svg' | 'png' | 'pdf' | 'json';
  quality?: number;
  scale?: number;
  transparent?: boolean;
  includeMetadata?: boolean;
}

export interface ElementImportOptions {
  preserveIds?: boolean;
  offset?: Point;
  scale?: number;
  replaceExisting?: boolean;
}

export interface ElementClipboard {
  elements: CanvasElement[];
  timestamp: number;
  source: string;
}

export interface ElementSearch {
  query: string;
  filters: {
    type?: ElementType[];
    tags?: string[];
    author?: string;
    dateRange?: { start: Date; end: Date };
  };
  sortBy: 'relevance' | 'created' | 'modified' | 'name';
  sortOrder: 'asc' | 'desc';
}
