import { ElementType, Point } from './canvas';

export enum ToolType {
  SELECT = 'select',
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
  PAN = 'pan',
  ZOOM = 'zoom',
  ERASER = 'eraser'
}

export interface Tool {
  id: ToolType;
  name: string;
  icon: string;
  description: string;
  category: ToolCategory;
  shortcut?: string;
  elementType?: ElementType;
  config?: ToolConfig;
}

export enum ToolCategory {
  SELECTION = 'selection',
  SHAPES = 'shapes',
  TEXT = 'text',
  DRAWING = 'drawing',
  NAVIGATION = 'navigation',
  UTILITIES = 'utilities'
}

export interface ToolConfig {
  autoSwitchToSelect?: boolean;
  preserveAspectRatio?: boolean;
  defaultStyle?: any;
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  snapToGrid?: boolean;
  showGuides?: boolean;
}

export interface ToolState {
  currentTool: ToolType;
  previousTool: ToolType;
  isDrawing: boolean;
  startPoint?: Point;
  currentPoint?: Point;
  previewElement?: any;
  toolConfig: Record<ToolType, ToolConfig>;
}

export interface DrawingState {
  isDrawing: boolean;
  startPoint: Point;
  currentPoint: Point;
  previewPoints: Point[];
  pressure: number;
  strokeWidth: number;
}

export interface TextEditingState {
  isEditing: boolean;
  elementId?: string;
  content: any; // Slate.js content
  selection: any; // Slate.js selection
  toolbarPosition?: Point;
  toolbarVisible: boolean;
}

export interface TableEditingState {
  isEditing: boolean;
  elementId?: string;
  selectedCell?: { row: number; col: number };
  selectedCells?: { startRow: number; startCol: number; endRow: number; endCol: number };
  isResizing: boolean;
  resizeHandle?: 'row' | 'col';
  resizeIndex?: number;
}

export interface ConnectorState {
  isConnecting: boolean;
  startElementId?: string;
  endElementId?: string;
  previewPath?: Point[];
  hoveredConnectionPoint?: string;
  snappedToElement?: boolean;
}

export interface SelectionState {
  isSelecting: boolean;
  selectionBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle?: string;
  dragOffset: Point;
  initialBounds: Record<string, { x: number; y: number; width: number; height: number }>;
}

export interface ToolbarConfig {
  position: 'top' | 'bottom' | 'left' | 'right' | 'floating';
  size: 'small' | 'medium' | 'large';
  orientation: 'horizontal' | 'vertical';
  collapsible: boolean;
  tools: ToolType[];
  groups: ToolGroup[];
}

export interface ToolGroup {
  id: string;
  name: string;
  tools: ToolType[];
  expanded: boolean;
}

export interface KeyboardShortcut {
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: string;
  description: string;
}

export const DEFAULT_TOOLS: Tool[] = [
  {
    id: ToolType.SELECT,
    name: 'Select',
    icon: 'mouse-pointer',
    description: 'Select and move objects',
    category: ToolCategory.SELECTION,
    shortcut: 'V',
    config: {
      autoSwitchToSelect: false,
      showGuides: true
    }
  },
  {
    id: ToolType.TEXT,
    name: 'Text',
    icon: 'type',
    description: 'Add text',
    category: ToolCategory.TEXT,
    shortcut: 'T',
    elementType: ElementType.TEXT,
    config: {
      autoSwitchToSelect: true,
      minSize: { width: 100, height: 24 }
    }
  },
  {
    id: ToolType.RECTANGLE,
    name: 'Rectangle',
    icon: 'square',
    description: 'Draw rectangle',
    category: ToolCategory.SHAPES,
    shortcut: 'R',
    elementType: ElementType.RECTANGLE,
    config: {
      autoSwitchToSelect: true,
      snapToGrid: true,
      minSize: { width: 10, height: 10 }
    }
  },
  {
    id: ToolType.CIRCLE,
    name: 'Circle',
    icon: 'circle',
    description: 'Draw circle',
    category: ToolCategory.SHAPES,
    shortcut: 'C',
    elementType: ElementType.CIRCLE,
    config: {
      autoSwitchToSelect: true,
      preserveAspectRatio: true,
      snapToGrid: true,
      minSize: { width: 10, height: 10 }
    }
  },
  {
    id: ToolType.TRIANGLE,
    name: 'Triangle',
    icon: 'triangle',
    description: 'Draw triangle',
    category: ToolCategory.SHAPES,
    elementType: ElementType.TRIANGLE,
    config: {
      autoSwitchToSelect: true,
      snapToGrid: true,
      minSize: { width: 10, height: 10 }
    }
  },
  {
    id: ToolType.ARROW,
    name: 'Arrow',
    icon: 'arrow-up-right',
    description: 'Draw arrow',
    category: ToolCategory.SHAPES,
    elementType: ElementType.ARROW,
    config: {
      autoSwitchToSelect: true,
      minSize: { width: 20, height: 5 }
    }
  },
  {
    id: ToolType.LINE,
    name: 'Line',
    icon: 'minus',
    description: 'Draw line',
    category: ToolCategory.DRAWING,
    shortcut: 'L',
    elementType: ElementType.LINE,
    config: {
      autoSwitchToSelect: true
    }
  },
  {
    id: ToolType.FREEFORM,
    name: 'Pen',
    icon: 'pen-tool',
    description: 'Freeform drawing',
    category: ToolCategory.DRAWING,
    shortcut: 'P',
    elementType: ElementType.FREEFORM,
    config: {
      autoSwitchToSelect: false
    }
  },
  {
    id: ToolType.STICKY_NOTE,
    name: 'Sticky Note',
    icon: 'sticky-note',
    description: 'Add sticky note',
    category: ToolCategory.TEXT,
    shortcut: 'S',
    elementType: ElementType.STICKY_NOTE,
    config: {
      autoSwitchToSelect: true,
      minSize: { width: 100, height: 100 }
    }
  },
  {
    id: ToolType.TABLE,
    name: 'Table',
    icon: 'table',
    description: 'Insert table',
    category: ToolCategory.TEXT,
    elementType: ElementType.TABLE,
    config: {
      autoSwitchToSelect: true,
      minSize: { width: 200, height: 150 }
    }
  },
  {
    id: ToolType.CONNECTOR,
    name: 'Connector',
    icon: 'git-branch',
    description: 'Connect elements',
    category: ToolCategory.UTILITIES,
    elementType: ElementType.CONNECTOR,
    config: {
      autoSwitchToSelect: true
    }
  },
  {
    id: ToolType.IMAGE,
    name: 'Image',
    icon: 'image',
    description: 'Add image',
    category: ToolCategory.UTILITIES,
    shortcut: 'I',
    elementType: ElementType.IMAGE,
    config: {
      autoSwitchToSelect: true,
      preserveAspectRatio: true
    }
  },
  {
    id: ToolType.SECTION,
    name: 'Section',
    icon: 'layout',
    description: 'Create section',
    category: ToolCategory.UTILITIES,
    elementType: ElementType.SECTION,
    config: {
      autoSwitchToSelect: true,
      minSize: { width: 200, height: 200 }
    }
  },
  {
    id: ToolType.PAN,
    name: 'Pan',
    icon: 'hand',
    description: 'Pan canvas',
    category: ToolCategory.NAVIGATION,
    shortcut: 'H',
    config: {
      autoSwitchToSelect: false
    }
  },
  {
    id: ToolType.ZOOM,
    name: 'Zoom',
    icon: 'zoom-in',
    description: 'Zoom canvas',
    category: ToolCategory.NAVIGATION,
    shortcut: 'Z',
    config: {
      autoSwitchToSelect: false
    }
  }
];

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'v', modifiers: [], action: 'select_tool', description: 'Select tool' },
  { key: 't', modifiers: [], action: 'text_tool', description: 'Text tool' },
  { key: 'r', modifiers: [], action: 'rectangle_tool', description: 'Rectangle tool' },
  { key: 'c', modifiers: [], action: 'circle_tool', description: 'Circle tool' },
  { key: 'l', modifiers: [], action: 'line_tool', description: 'Line tool' },
  { key: 'p', modifiers: [], action: 'pen_tool', description: 'Pen tool' },
  { key: 's', modifiers: [], action: 'sticky_note_tool', description: 'Sticky note tool' },
  { key: 'h', modifiers: [], action: 'pan_tool', description: 'Pan tool' },
  { key: 'z', modifiers: [], action: 'zoom_tool', description: 'Zoom tool' },
  { key: 'i', modifiers: [], action: 'image_tool', description: 'Image tool' },
  
  // Edit operations
  { key: 'z', modifiers: ['ctrl'], action: 'undo', description: 'Undo' },
  { key: 'y', modifiers: ['ctrl'], action: 'redo', description: 'Redo' },
  { key: 'z', modifiers: ['ctrl', 'shift'], action: 'redo', description: 'Redo (alternative)' },
  { key: 'c', modifiers: ['ctrl'], action: 'copy', description: 'Copy' },
  { key: 'v', modifiers: ['ctrl'], action: 'paste', description: 'Paste' },
  { key: 'x', modifiers: ['ctrl'], action: 'cut', description: 'Cut' },
  { key: 'd', modifiers: ['ctrl'], action: 'duplicate', description: 'Duplicate' },
  { key: 'a', modifiers: ['ctrl'], action: 'select_all', description: 'Select all' },
  
  // Navigation
  { key: '0', modifiers: ['ctrl'], action: 'zoom_to_fit', description: 'Zoom to fit' },
  { key: '1', modifiers: ['ctrl'], action: 'zoom_to_100', description: 'Zoom to 100%' },
  { key: '2', modifiers: ['ctrl'], action: 'zoom_to_200', description: 'Zoom to 200%' },
  { key: '+', modifiers: ['ctrl'], action: 'zoom_in', description: 'Zoom in' },
  { key: '-', modifiers: ['ctrl'], action: 'zoom_out', description: 'Zoom out' },
  
  // Layers
  { key: ']', modifiers: ['ctrl'], action: 'bring_forward', description: 'Bring forward' },
  { key: '[', modifiers: ['ctrl'], action: 'send_backward', description: 'Send backward' },
  { key: ']', modifiers: ['ctrl', 'shift'], action: 'bring_to_front', description: 'Bring to front' },
  { key: '[', modifiers: ['ctrl', 'shift'], action: 'send_to_back', description: 'Send to back' },
  
  // Tools
  { key: 'Delete', modifiers: [], action: 'delete', description: 'Delete selected' },
  { key: 'Backspace', modifiers: [], action: 'delete', description: 'Delete selected' },
  { key: 'Escape', modifiers: [], action: 'deselect', description: 'Deselect' },
  { key: 'Enter', modifiers: [], action: 'edit_text', description: 'Edit text' },
  { key: 'g', modifiers: ['ctrl'], action: 'group', description: 'Group elements' },
  { key: 'g', modifiers: ['ctrl', 'shift'], action: 'ungroup', description: 'Ungroup elements' }
];
