import { useState } from 'react';

// Canvas element interface
export interface CanvasElement {
  id: string;
  type: 'sticky-note' | 'rectangle' | 'circle' | 'text' | 'triangle' | 'square' | 'hexagon' | 'star' | 'drawing' | 'line' | 'arrow' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  backgroundColor?: string;
  url?: string;
  path?: string;
  x2?: number;
  y2?: number;
  imageUrl?: string;
  imageName?: string;
  fontSize?: 'small' | 'medium' | 'large';
  isBold?: boolean;
  isItalic?: boolean;
  isBulletList?: boolean;
  textAlignment?: 'left' | 'center' | 'right';
}

export interface SavedCanvas {
  id: string;
  name: string;
  elements: CanvasElement[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export type CanvasTool = 'select' | 'text' | 'sticky-note' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'pen' | 'shapes' | 'undo' | 'redo' | 'zoom-in' | 'zoom-out' | 'image' | 'eraser' | 'highlighter';

export interface UseCanvasStateReturn {
  // Elements and selection
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  selectedElement: string | null;
  setSelectedElement: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Tools and modes
  activeTool: CanvasTool;
  setActiveTool: React.Dispatch<React.SetStateAction<CanvasTool>>;
  selectedShape: string;
  setSelectedShape: React.Dispatch<React.SetStateAction<string>>;
  
  // UI state
  showShapeDropdown: boolean;
  setShowShapeDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  showPastCanvases: boolean;
  setShowPastCanvases: React.Dispatch<React.SetStateAction<boolean>>;
  hoveredCanvas: string | null;
  setHoveredCanvas: React.Dispatch<React.SetStateAction<string | null>>;
  pinnedCanvases: Set<string>;
  setPinnedCanvases: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // Preview state for drawing tools
  isPreviewing: boolean;
  setIsPreviewing: React.Dispatch<React.SetStateAction<boolean>>;
  previewElement: CanvasElement | null;
  setPreviewElement: React.Dispatch<React.SetStateAction<CanvasElement | null>>;
  
  // Resize state
  isResizing: boolean;
  setIsResizing: React.Dispatch<React.SetStateAction<boolean>>;
  resizeHandle: string | null;
  setResizeHandle: React.Dispatch<React.SetStateAction<string | null>>;
  resizeStartPos: { x: number; y: number };
  setResizeStartPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  resizeStartSize: { width: number; height: number };
  setResizeStartSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
  
  // Zoom and pan
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  panOffset: { x: number; y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  
  // Text formatting
  isEditingText: string | null;
  setIsEditingText: React.Dispatch<React.SetStateAction<string | null>>;
  showTextFormatting: boolean;
  setShowTextFormatting: React.Dispatch<React.SetStateAction<boolean>>;
  textFormattingPosition: { left: number; top: number } | null;
  setTextFormattingPosition: React.Dispatch<React.SetStateAction<{ left: number; top: number } | null>>;
  
  // History
  history: CanvasElement[][];
  setHistory: React.Dispatch<React.SetStateAction<CanvasElement[][]>>;
  historyIndex: number;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  
  // Drag state
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  dragStartPos: { x: number; y: number };
  setDragStartPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  dragStartElementPos: { x: number; y: number };
  setDragStartElementPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  
  // Dropdown positioning
  dropdownPosition: { left: number; top: number } | null;
  setDropdownPosition: React.Dispatch<React.SetStateAction<{ left: number; top: number } | null>>;
  // Mouse position for line preview
  mousePos: { x: number; y: number };
  setMousePos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  
  // Saved canvases
  savedCanvases: SavedCanvas[];
  setSavedCanvases: React.Dispatch<React.SetStateAction<SavedCanvas[]>>;
}

export const useCanvasState = (): UseCanvasStateReturn => {
  // Function to generate initial demo elements based on available viewport
  const generateInitialElements = (): CanvasElement[] => {
    // Use a very conservative estimate to ensure visibility even in tiny windows
    // Elements will be clustered in the top-left corner for maximum compatibility
    const baseSize = 80; // Small base size for elements
    const spacing = 90; // Tight spacing between elements
    
    return [
      {
        id: '1',
        type: 'sticky-note',
        x: 10,
        y: 40,
        width: baseSize,
        height: baseSize,
        content: 'Ideas',
        color: '#facc15'
      },
      {
        id: '2',
        type: 'sticky-note',
        x: 10 + spacing,
        y: 40,
        width: baseSize,
        height: baseSize,
        content: 'Research',
        color: '#fb7185'
      },
      {
        id: '3',
        type: 'rectangle',
        x: 10,
        y: 40 + spacing,
        width: 60,
        height: 40,
        color: 'var(--accent-primary)'
      },
      {
        id: '4',
        type: 'circle',
        x: 80,
        y: 40 + spacing,
        width: 50,
        height: 50,
        color: '#10b981'
      },
      {
        id: '5',
        type: 'text',
        x: 10,
        y: 10,
        width: 180,
        height: 25,
        content: 'Project Brainstorming',
        fontSize: 'medium',
        isBold: true,
        textAlignment: 'left'
      }
    ];
  };

  // Initial demo elements - positioned to be visible even in small viewports
  const initialElements: CanvasElement[] = generateInitialElements();

  // Core state
  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  
  // Tool state
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [selectedShape, setSelectedShape] = useState<string>('rectangle');
  
  // UI state
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [showPastCanvases, setShowPastCanvases] = useState(true);
  const [hoveredCanvas, setHoveredCanvas] = useState<string | null>(null);
  const [pinnedCanvases, setPinnedCanvases] = useState<Set<string>>(new Set());
  
  // Preview state for drawing tools
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewElement, setPreviewElement] = useState<CanvasElement | null>(null);
  
  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragStartElementPos, setDragStartElementPos] = useState({ x: 0, y: 0 });
  
  // Zoom and pan - Initialize with elements visible in center of screen
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 100, y: 100 }); // Start with small positive offset
  
  // Text formatting
  const [isEditingText, setIsEditingText] = useState<string | null>(null);
  const [showTextFormatting, setShowTextFormatting] = useState(false);
  const [textFormattingPosition, setTextFormattingPosition] = useState<{ left: number; top: number } | null>(null);
  
  // History
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Dropdown positioning
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);
  // Mouse position for line preview
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Saved canvases management
  const [savedCanvases, setSavedCanvases] = useState<SavedCanvas[]>([]);

  return {
    // Elements and selection
    elements,
    setElements,
    selectedElement,
    setSelectedElement,
    
    // Tools and modes
    activeTool,
    setActiveTool,
    selectedShape,
    setSelectedShape,
    
    // UI state
    showShapeDropdown,
    setShowShapeDropdown,
    showPastCanvases,
    setShowPastCanvases,
    hoveredCanvas,
    setHoveredCanvas,
    pinnedCanvases,
    setPinnedCanvases,
    
    // Preview state
    isPreviewing,
    setIsPreviewing,
    previewElement,
    setPreviewElement,
    
    // Resize state
    isResizing,
    setIsResizing,
    resizeHandle,
    setResizeHandle,
    resizeStartPos,
    setResizeStartPos,
    resizeStartSize,
    setResizeStartSize,
    
    // Drag state
    isDragging,
    setIsDragging,
    dragStartPos,
    setDragStartPos,
    dragStartElementPos,
    setDragStartElementPos,
    
    // Zoom and pan
    zoomLevel,
    setZoomLevel,
    panOffset,
    setPanOffset,
    
    // Text formatting
    isEditingText,
    setIsEditingText,
    showTextFormatting,
    setShowTextFormatting,
    textFormattingPosition,
    setTextFormattingPosition,
    
    // History
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    
    // Dropdown positioning
    dropdownPosition,
    setDropdownPosition,
      // Mouse position
    mousePos,
    setMousePos,
    
    // Saved canvases
    savedCanvases,
    setSavedCanvases
  };
};
