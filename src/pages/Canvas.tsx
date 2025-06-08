import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  MousePointer2, 
  Type, 
  StickyNote, 
  RectangleHorizontal, 
  Circle, 
  Share, 
  Pencil, 
  Plus,
  Trash2,
  Download,
  Upload,
  Triangle,
  Square,
  Hexagon,
  Star,
  ChevronDown,
  ChevronLeft,
  History,
  Undo,
  Redo,
  Minus,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Image,
  Eraser,
  Highlighter,
  Link,
  FileText,
  Pin,
  Bold,
  Italic,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useHeader } from '../contexts/HeaderContext';

// Throttle utility for performance optimization
const throttle = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: number | null = null;
  let lastExecTime = 0;
  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
};

interface CanvasElement {
  id: string;
  type: 'sticky-note' | 'rectangle' | 'circle' | 'text' | 'triangle' | 'square' | 'hexagon' | 'star' | 'drawing' | 'line' | 'arrow' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  backgroundColor?: string; // For text highlighting
  url?: string; // For clickable text links
  path?: string; // For drawing elements
  x2?: number; // For line/arrow end point
  y2?: number; // For line/arrow end point
  imageUrl?: string; // For image elements
  imageName?: string; // For image elements
  // Rich text formatting properties
  fontSize?: 'small' | 'medium' | 'large';
  isBold?: boolean;
  isItalic?: boolean;
  isBulletList?: boolean;
  textAlignment?: 'left' | 'center' | 'right';
}

interface SavedCanvas {
  id: string;
  name: string;
  elements: CanvasElement[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

interface ResizeHandle {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right';
  x: number;
  y: number;
}

type CanvasTool = 'select' | 'text' | 'sticky-note' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'pen' | 'shapes' | 'undo' | 'redo' | 'zoom-in' | 'zoom-out' | 'image' | 'eraser' | 'highlighter';

interface ShapeType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  element: 'rectangle' | 'circle' | 'triangle' | 'square' | 'hexagon' | 'star';
}

const Canvas: React.FC = () => {
  const { setHeaderProps } = useHeader();  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [selectedShape, setSelectedShape] = useState<string>('rectangle');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [showPastCanvases, setShowPastCanvases] = useState(true);
  const [hoveredCanvas, setHoveredCanvas] = useState<string | null>(null);
  const [pinnedCanvases, setPinnedCanvases] = useState<Set<string>>(new Set());const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
    // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  // Line/Arrow creation state
  const [isCreatingLine, setIsCreatingLine] = useState(false);
  const [lineStartPoint, setLineStartPoint] = useState<{ x: number; y: number } | null>(null);  // Dropdown positioning state
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);
  // Text formatting state
  const [isEditingText, setIsEditingText] = useState<string | null>(null);
  const [showTextFormatting, setShowTextFormatting] = useState(false);
  const [textFormattingPosition, setTextFormattingPosition] = useState<{ left: number; top: number } | null>(null);
  // Undo/Redo functionality
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save current state to history
  const saveToHistory = useCallback((newElements: CanvasElement[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newElements]);
      // Limit history to last 50 states
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setElements(previousState);
      setHistoryIndex(prev => prev - 1);
      setSelectedElement(null);
    }
  }, [history, historyIndex]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setElements(nextState);
      setHistoryIndex(prev => prev + 1);
      setSelectedElement(null);
    }
  }, [history, historyIndex]);

  // Can undo/redo checks
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;  const savedCanvases: SavedCanvas[] = [
    {
      id: '1',
      name: 'Project Brainstorming',
      elements: [],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T12:30:00Z'
    },
    {
      id: '2', 
      name: 'User Flow Design',
      elements: [],
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-14T16:45:00Z'
    },
    {
      id: '3',
      name: 'Architecture Planning',
      elements: [],
      createdAt: '2024-01-13T09:15:00Z', 
      updatedAt: '2024-01-13T11:00:00Z'
    }
  ];
  
  const [elements, setElements] = useState<CanvasElement[]>([
    {
      id: '1',
      type: 'sticky-note',
      x: 50,
      y: 120,
      width: 180,
      height: 180,
      content: 'Brainstorm ideas for the new feature',
      color: '#facc15'
    },
    {
      id: '2',
      type: 'sticky-note',
      x: 280,
      y: 120,
      width: 180,
      height: 180,
      content: 'User research findings',
      color: '#fb7185'
    },
    {
      id: '3',
      type: 'rectangle',
      x: 500,
      y: 150,
      width: 120,
      height: 80,
      color: 'var(--accent-primary)'
    },
    {
      id: '4',
      type: 'circle',
      x: 100,
      y: 350,
      width: 100,
      height: 100,
      color: '#10b981'
    },    {
      id: '5',
      type: 'text',
      x: 300,
      y: 50,
      width: 300,
      height: 40,
      content: 'Project Brainstorming Session',
      fontSize: 'large',
      isBold: true,
      textAlignment: 'center'
    }
  ]);
  
  const [selectedElement, setSelectedElement] = useState<string | null>(null);  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const shapes: ShapeType[] = [
    { id: 'rectangle', name: 'Rectangle', icon: RectangleHorizontal, element: 'rectangle' },
    { id: 'circle', name: 'Circle', icon: Circle, element: 'circle' },
    { id: 'triangle', name: 'Triangle', icon: Triangle, element: 'triangle' },
    { id: 'square', name: 'Square', icon: Square, element: 'square' },
    { id: 'hexagon', name: 'Hexagon', icon: Hexagon, element: 'hexagon' },
    { id: 'star', name: 'Star', icon: Star, element: 'star' },
  ];  const tools = [
    { id: 'select', icon: MousePointer2, title: 'Select' },
    { id: 'undo', icon: Undo, title: 'Undo' },
    { id: 'redo', icon: Redo, title: 'Redo' },
    { id: 'zoom-in', icon: ZoomIn, title: 'Zoom In' },
    { id: 'zoom-out', icon: ZoomOut, title: 'Zoom Out' },
    { id: 'image', icon: Image, title: 'Add Image' },
    { id: 'text', icon: Type, title: 'Text' },
    { id: 'highlighter', icon: Highlighter, title: 'Text Highlighter' },
    { id: 'sticky-note', icon: StickyNote, title: 'Sticky Note' },
    { id: 'shapes', icon: () => {
      const SelectedShapeIcon = shapes.find(s => s.id === selectedShape)?.icon || RectangleHorizontal;
      return (
        <div className="flex items-center gap-1">
          <SelectedShapeIcon size={16} />
          <ChevronDown size={10} />
        </div>
      );
    }, title: 'Shapes' },
    { id: 'line', icon: Minus, title: 'Line' },
    { id: 'arrow', icon: ArrowRight, title: 'Arrow' },
    { id: 'pen', icon: Pencil, title: 'Pen' },
    { id: 'eraser', icon: Eraser, title: 'Eraser' },
    { id: 'delete', icon: Trash2, title: 'Delete Selected' }
  ];

  // Resize handle functions
  const getResizeHandles = (element: CanvasElement): ResizeHandle[] => {
    if (!element.width || !element.height) return [];
    
    const handles: ResizeHandle[] = [
      { position: 'top-left', x: element.x - 4, y: element.y - 4 },
      { position: 'top-right', x: element.x + element.width - 4, y: element.y - 4 },
      { position: 'bottom-left', x: element.x - 4, y: element.y + element.height - 4 },
      { position: 'bottom-right', x: element.x + element.width - 4, y: element.y + element.height - 4 },
      { position: 'top', x: element.x + element.width / 2 - 4, y: element.y - 4 },
      { position: 'bottom', x: element.x + element.width / 2 - 4, y: element.y + element.height - 4 },
      { position: 'left', x: element.x - 4, y: element.y + element.height / 2 - 4 },
      { position: 'right', x: element.x + element.width - 4, y: element.y + element.height / 2 - 4 }
    ];
    
    return handles;
  };
  const handleResizeStart = (e: React.MouseEvent, handle: string, element: CanvasElement) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartSize({ 
      width: element.width || 100, 
      height: element.height || 100 
    });
    
    // Set the element position as well for resize calculations
    setResizeStartPos({ 
      x: e.clientX, 
      y: e.clientY,
      elementX: element.x,
      elementY: element.y
    } as any);
  };const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeHandle || !selectedElement) return;

    const deltaX = e.clientX - resizeStartPos.x;
    const deltaY = e.clientY - resizeStartPos.y;

    setElements(prevElements => prevElements.map(el => {
      if (el.id !== selectedElement) return el;

      let newWidth = resizeStartSize.width;
      let newHeight = resizeStartSize.height;
      let newX = el.x;
      let newY = el.y;

      switch (resizeHandle) {
        case 'top-left':
          newWidth = Math.max(20, resizeStartSize.width - deltaX);
          newHeight = Math.max(20, resizeStartSize.height - deltaY);
          newX = el.x + (resizeStartSize.width - newWidth);
          newY = el.y + (resizeStartSize.height - newHeight);
          break;
        case 'top-right':
          newWidth = Math.max(20, resizeStartSize.width + deltaX);
          newHeight = Math.max(20, resizeStartSize.height - deltaY);
          newY = el.y + (resizeStartSize.height - newHeight);
          break;
        case 'bottom-left':
          newWidth = Math.max(20, resizeStartSize.width - deltaX);
          newHeight = Math.max(20, resizeStartSize.height + deltaY);
          newX = el.x + (resizeStartSize.width - newWidth);
          break;
        case 'bottom-right':
          newWidth = Math.max(20, resizeStartSize.width + deltaX);
          newHeight = Math.max(20, resizeStartSize.height + deltaY);
          break;
        case 'top':
          newHeight = Math.max(20, resizeStartSize.height - deltaY);
          newY = el.y + (resizeStartSize.height - newHeight);
          break;
        case 'bottom':
          newHeight = Math.max(20, resizeStartSize.height + deltaY);
          break;
        case 'left':
          newWidth = Math.max(20, resizeStartSize.width - deltaX);
          newX = el.x + (resizeStartSize.width - newWidth);
          break;
        case 'right':
          newWidth = Math.max(20, resizeStartSize.width + deltaX);
          break;
      }

      return { ...el, x: newX, y: newY, width: newWidth, height: newHeight };
    }));
  }, [isResizing, resizeHandle, selectedElement, resizeStartPos, resizeStartSize]);
  // Throttled resize move for better performance
  const throttledResizeMove = useMemo(
    () => throttle(handleResizeMove, 8), // ~120fps for smoother resize
    [handleResizeMove]
  );
  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      saveToHistory(elements);
    }
    setIsResizing(false);
    setResizeHandle(null);
  }, [isResizing, elements, saveToHistory]);
  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', throttledResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', throttledResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, throttledResizeMove, handleResizeEnd]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3)); // Max zoom 3x
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.25)); // Min zoom 0.25x
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Image upload functionality
  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newElement: CanvasElement = {
        id: Date.now().toString(),
        type: 'image',
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        imageUrl,
        imageName: file.name
      };

      const newElements = [...elements, newElement];
      setElements(newElements);
      saveToHistory(newElements);
      setActiveTool('select');
    };
    reader.readAsDataURL(file);
  }, [elements, saveToHistory]);

  // Image paste functionality
  const handlePasteImage = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageUpload(file);
        }
        break;
      }
    }
  }, [handleImageUpload]);

  // Add paste listener
  useEffect(() => {
    document.addEventListener('paste', handlePasteImage);
    return () => {
      document.removeEventListener('paste', handlePasteImage);
    };
  }, [handlePasteImage]);
  // Click outside handler for dropdown and text formatting
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {      // Handle shapes dropdown
      if (showShapeDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Also check if click is not on the shapes button itself
        const shapesButton = document.querySelector('[data-tool="shapes"]');
        if (shapesButton && !shapesButton.contains(event.target as Node)) {
          setShowShapeDropdown(false);
          setDropdownPosition(null);
          setActiveTool('select'); // Reset tool to prevent unwanted shape placement
        }
      }
      
      // Handle text formatting toolbar
      if (showTextFormatting && event.target) {
        const target = event.target as Element;
        // Don't close if clicking on the formatting toolbar itself or text inputs
        const isClickOnToolbar = target.closest('.text-formatting-toolbar');
        const isClickOnTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        
        if (!isClickOnToolbar && !isClickOnTextInput) {
          setShowTextFormatting(false);
          setIsEditingText(null);
          setTextFormattingPosition(null);
        }
      }
    };

    if (showShapeDropdown || showTextFormatting) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showShapeDropdown, showTextFormatting]);

  const handleNewCanvas = useCallback(() => {
    setElements([]);
    saveToHistory([]);
    setSelectedElement(null);
  }, [saveToHistory]);

  const handleShareCanvas = useCallback(() => {
    console.log('Share canvas clicked');
  }, []);
  const handleDeleteElement = useCallback(() => {
    if (selectedElement) {
      const newElements = elements.filter(el => el.id !== selectedElement);
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedElement(null);
    }
  }, [selectedElement, elements, saveToHistory]);

  const handleExportCanvas = useCallback(() => {
    const canvasData = {
      elements,
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        elementCount: elements.length
      }
    };
    
    const dataStr = JSON.stringify(canvasData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'canvas-export.json';
    link.click();
    
    URL.revokeObjectURL(link.href);
  }, [elements]);

  const handleImportCanvas = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {      try {
        const canvasData = JSON.parse(e.target?.result as string);
        if (canvasData.elements && Array.isArray(canvasData.elements)) {
          setElements(canvasData.elements);
          saveToHistory(canvasData.elements);
          setSelectedElement(null);
        }
      } catch (error) {
        console.error('Failed to import canvas:', error);
        alert('Failed to import canvas. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    event.target.value = '';
  }, []);  const handleLoadCanvas = useCallback((canvas: SavedCanvas) => {
    setElements(canvas.elements);
    saveToHistory(canvas.elements);
    setSelectedElement(null);
  }, [saveToHistory]);

  useEffect(() => {
    setHeaderProps({
      title: "Canvas",
      primaryAction: {
        label: 'New canvas',
        onClick: handleNewCanvas,
        icon: <Plus size={16} />
      },
      secondaryActions: [
        {
          label: 'Export',
          onClick: handleExportCanvas,
          icon: <Download size={16} />,
          variant: 'secondary'
        },
        {
          label: 'Import',
          onClick: () => document.getElementById('canvas-import')?.click(),
          icon: <Upload size={16} />,
          variant: 'secondary'
        },
        {
          label: 'Share',
          onClick: handleShareCanvas,
          icon: <Share size={16} />,
          variant: 'secondary'
        }
      ]
    });
  }, [setHeaderProps, handleNewCanvas, handleShareCanvas, handleExportCanvas]);

  // Helper function to place elements immediately when tools are selected
  const placeElementImmediately = useCallback((toolType: string, shapeType?: string) => {
    // Place element at center of visible canvas area
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const centerX = (canvasRect.width / 2 / zoomLevel) - panOffset.x;
    const centerY = (canvasRect.height / 2 / zoomLevel) - panOffset.y;

    const elementType = toolType === 'shapes' && shapeType ? shapeType : toolType;
      const newElement: CanvasElement = {
      id: Date.now().toString(),
      type: elementType as CanvasElement['type'],
      x: centerX - 60, // Offset to center the element
      y: centerY - 40,
      width: toolType === 'sticky-note' ? 180 : toolType === 'text' ? 200 : 120,
      height: toolType === 'sticky-note' ? 180 : toolType === 'text' ? 60 : 80,
      content: toolType === 'sticky-note' ? '' : toolType === 'text' ? 'New text' : undefined,
      color: toolType === 'sticky-note' ? '#facc15' : 
             toolType === 'rectangle' || elementType === 'rectangle' ? '#3b82f6' : 
             toolType === 'circle' || elementType === 'circle' ? '#10b981' : 
             elementType === 'triangle' ? '#8b5cf6' :
             elementType === 'square' ? '#f59e0b' :
             elementType === 'star' ? '#f59e0b' :
             elementType === 'hexagon' ? '#06b6d4' :
             undefined
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElement(newElement.id); // Auto-select the new element
    setActiveTool('select'); // Return to select tool
  }, [elements, saveToHistory, zoomLevel, panOffset]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select' || isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Adjust coordinates for zoom and pan
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const x = (rawX / zoomLevel) - panOffset.x;
    const y = (rawY / zoomLevel) - panOffset.y;

    if (activeTool === 'pen') {
      setIsDrawing(true);
      setCurrentPath(`M ${x} ${y}`);
      return;
    }

    // Handle line and arrow creation (two-click process)
    if (activeTool === 'line' || activeTool === 'arrow') {
      if (!isCreatingLine) {
        // First click - start the line/arrow
        setIsCreatingLine(true);
        setLineStartPoint({ x, y });
        return;
      } else {
        // Second click - complete the line/arrow
        if (lineStartPoint) {
          const newElement: CanvasElement = {
            id: Date.now().toString(),
            type: activeTool,
            x: lineStartPoint.x,
            y: lineStartPoint.y,
            x2: x,
            y2: y,
            color: '#000000'
          };

          const newElements = [...elements, newElement];
          setElements(newElements);
          saveToHistory(newElements);
          setIsCreatingLine(false);
          setLineStartPoint(null);
          setActiveTool('select');
          return;
        }
      }
    }

    const elementType = activeTool === 'shapes' ? selectedShape : activeTool;
      const newElement: CanvasElement = {
      id: Date.now().toString(),
      type: elementType as CanvasElement['type'],
      x,
      y,
      width: activeTool === 'sticky-note' ? 180 : activeTool === 'text' ? 200 : 120,
      height: activeTool === 'sticky-note' ? 180 : activeTool === 'text' ? 60 : 80,
      content: activeTool === 'sticky-note' ? '' : activeTool === 'text' ? 'New text' : undefined,
      color: activeTool === 'sticky-note' ? '#facc15' : activeTool === 'rectangle' ? '#3b82f6' : activeTool === 'circle' ? '#10b981' : undefined
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setActiveTool('select');
  }, [activeTool, isDragging, selectedShape, isCreatingLine, lineStartPoint, elements, saveToHistory, zoomLevel, panOffset]);  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDrawing && activeTool === 'pen') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const x = (rawX / zoomLevel) - panOffset.x;
      const y = (rawY / zoomLevel) - panOffset.y;
      
      setCurrentPath(prev => `${prev} L ${x} ${y}`);
      return;
    }

    if (!isDragging || !selectedElement) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Adjust coordinates for zoom and pan
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const newX = (rawX / zoomLevel) - panOffset.x - dragOffset.x;
    const newY = (rawY / zoomLevel) - panOffset.y - dragOffset.y;

    setElements(prevElements => prevElements.map(el => 
      el.id === selectedElement 
        ? { ...el, x: newX, y: newY }
        : el
    ));
  }, [isDragging, selectedElement, dragOffset, isDrawing, activeTool, zoomLevel, panOffset]);
  // Throttled mouse move for better performance
  const throttledMouseMove = useMemo(
    () => throttle(handleMouseMove, 8), // ~120fps for smoother dragging
    [handleMouseMove]
  );

  // Add mouse move handler for line/arrow preview
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isCreatingLine && lineStartPoint) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Adjust mouse position for zoom and pan
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      setMousePos({
        x: (rawX / zoomLevel) - panOffset.x,
        y: (rawY / zoomLevel) - panOffset.y
      });
    }
    
    throttledMouseMove(e);
  }, [isCreatingLine, lineStartPoint, throttledMouseMove, zoomLevel, panOffset]);const handleMouseUp = useCallback(() => {
    if (isDrawing && currentPath) {
      const newDrawing: CanvasElement = {
        id: Date.now().toString(),
        type: 'drawing',
        x: 0,
        y: 0,
        path: currentPath,
        color: '#000000'
      };
      
      const newElements = [...elements, newDrawing];
      setElements(newElements);
      saveToHistory(newElements);
      setCurrentPath('');
      setIsDrawing(false);
      setActiveTool('select');
      return;
    }

    // Save to history when dragging ends
    if (isDragging) {
      saveToHistory(elements);
    }

    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, [isDrawing, currentPath, elements, saveToHistory, isDragging]);  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    // Handle eraser tool - remove element on click
    if (activeTool === 'eraser') {
      const newElements = elements.filter(el => el.id !== elementId);
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedElement(null);
      return;
    }

    // Handle highlighter tool - add background color to text elements
    if (activeTool === 'highlighter' && element.type === 'text') {
      setElements(prevElements => prevElements.map(el => 
        el.id === elementId 
          ? { ...el, backgroundColor: el.backgroundColor ? undefined : '#ffeb3b' }
          : el
      ));
      saveToHistory(elements.map(el => 
        el.id === elementId 
          ? { ...el, backgroundColor: el.backgroundColor ? undefined : '#ffeb3b' }
          : el
      ));
      return;
    }

    if (activeTool !== 'select') return;

    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate offset accounting for zoom and pan
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const adjustedX = (rawX / zoomLevel) - panOffset.x;
    const adjustedY = (rawY / zoomLevel) - panOffset.y;
    
    setDragOffset({
      x: adjustedX - element.x,
      y: adjustedY - element.y
    });
  }, [elements, activeTool, zoomLevel, panOffset, saveToHistory]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }
      
      // Element deletion
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        handleDeleteElement();
      }      // Tool selection shortcuts
      if (e.key === 'Escape') {
        setSelectedElement(null);
        setActiveTool('select');
        // Also close shapes dropdown if open
        if (showShapeDropdown) {
          setShowShapeDropdown(false);
          setDropdownPosition(null);
        }
      }
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 't' || e.key === 'T') setActiveTool('text');
      if (e.key === 'n' || e.key === 'N') setActiveTool('sticky-note');
      if (e.key === 'r' || e.key === 'R') setActiveTool('shapes');
      if (e.key === 'p' || e.key === 'P') setActiveTool('pen');
      if (e.key === 'e' || e.key === 'E') setActiveTool('eraser');
      if (e.key === 'h' || e.key === 'H') setActiveTool('highlighter');
      if (e.key === 'l' || e.key === 'L') setActiveTool('line');
      if (e.key === 'a' || e.key === 'A') setActiveTool('arrow');
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, handleDeleteElement, handleUndo, handleRedo]);
  // Text formatting helper functions
  const updateTextFormatting = useCallback((elementId: string, formatProperty: keyof CanvasElement, value: any) => {
    setElements(prevElements => {
      const newElements = prevElements.map(el => 
        el.id === elementId 
          ? { ...el, [formatProperty]: value }
          : el
      );
      // Save to history for formatting changes
      if (formatProperty !== 'content') {
        saveToHistory(newElements);
      }
      return newElements;
    });
  }, [saveToHistory]);

  const toggleTextFormat = useCallback((elementId: string, formatType: 'isBold' | 'isItalic' | 'isBulletList') => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    const currentValue = element[formatType];
    updateTextFormatting(elementId, formatType, !currentValue);
  }, [elements, updateTextFormatting]);

  const setTextFontSize = useCallback((elementId: string, fontSize: 'small' | 'medium' | 'large') => {
    updateTextFormatting(elementId, 'fontSize', fontSize);
  }, [updateTextFormatting]);

  const setTextAlignment = useCallback((elementId: string, alignment: 'left' | 'center' | 'right') => {
    updateTextFormatting(elementId, 'textAlignment', alignment);
  }, [updateTextFormatting]);

  const getTextStyles = useCallback((element: CanvasElement) => {
    const styles: React.CSSProperties = {};
    
    // Font size
    if (element.fontSize === 'small') styles.fontSize = '14px';
    else if (element.fontSize === 'large') styles.fontSize = '24px';
    else styles.fontSize = '18px'; // medium default
    
    // Font weight
    if (element.isBold) styles.fontWeight = 'bold';
    
    // Font style
    if (element.isItalic) styles.fontStyle = 'italic';
    
    // Text alignment
    if (element.textAlignment) styles.textAlign = element.textAlignment;
    
    return styles;
  }, []);

  const formatBulletText = useCallback((text: string) => {
    if (!text) return text;
    
    // Split text by lines and add bullet points if not already present
    const lines = text.split('\n');
    return lines.map(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('•')) {
        return `• ${trimmedLine}`;
      }
      return line;
    }).join('\n');
  }, []);

  const removeBulletFormatting = useCallback((text: string) => {
    if (!text) return text;
    
    // Remove bullet points from text
    const lines = text.split('\n');
    return lines.map(line => {
      return line.replace(/^•\s*/, '');
    }).join('\n');
  }, []);  // Text Formatting Toolbar Component
  const TextFormattingToolbar = ({ elementId, element, position }: { 
    elementId: string; 
    element: CanvasElement; 
    position: { left: number; top: number } 
  }) => {
    // Ensure toolbar stays within viewport bounds
    const adjustedPosition = {
      left: Math.max(10, Math.min(position.left, window.innerWidth - 320)), // 320px toolbar width + 10px margin
      top: Math.max(10, Math.min(position.top, window.innerHeight - 200)) // 200px toolbar height + 10px margin
    };

    return (
      <div 
        className="fixed z-50 text-formatting-toolbar" 
        style={{
          left: `${adjustedPosition.left}px`,
          top: `${adjustedPosition.top}px`
        }}
      >
        <Card className="p-4 min-w-80 shadow-xl border border-border-subtle bg-bg-primary">
          <div className="flex flex-col gap-3">
            {/* Font Size Row */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary mr-3 min-w-fit font-medium">Size:</span>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map(size => (
                  <Button
                    key={size}
                    variant={element.fontSize === size ? 'primary' : 'ghost'}
                    size="sm"
                    className="h-9 px-4 text-sm capitalize font-medium"
                    onClick={() => setTextFontSize(elementId, size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>            {/* Formatting Options Row */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary mr-3 min-w-fit font-medium">Format:</span>
              <div className="flex gap-2">
                <Button
                  variant={element.isBold ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-10 w-10 p-2 flex items-center justify-center"
                  onClick={() => toggleTextFormat(elementId, 'isBold')}
                  title="Bold"
                >
                  <Bold size={20} />
                </Button>
                <Button
                  variant={element.isItalic ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-10 w-10 p-2 flex items-center justify-center"
                  onClick={() => toggleTextFormat(elementId, 'isItalic')}
                  title="Italic"
                >
                  <Italic size={20} />
                </Button>
                <Button
                  variant={element.isBulletList ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-10 w-10 p-2 flex items-center justify-center"
                  onClick={() => {
                    const currentElement = elements.find(el => el.id === elementId);
                    if (currentElement?.content) {
                      const newContent = currentElement.isBulletList 
                        ? removeBulletFormatting(currentElement.content)
                        : formatBulletText(currentElement.content);
                      updateTextFormatting(elementId, 'content', newContent);
                    }
                    toggleTextFormat(elementId, 'isBulletList');
                  }}
                  title="Bullet List"
                >
                  <List size={20} />
                </Button>
              </div>
            </div>            {/* Alignment Row */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary mr-3 min-w-fit font-medium">Align:</span>
              <div className="flex gap-2">
                <Button
                  variant={element.textAlignment === 'left' ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-10 w-10 p-2 flex items-center justify-center"
                  onClick={() => setTextAlignment(elementId, 'left')}
                  title="Align Left"
                >
                  <AlignLeft size={20} />
                </Button>
                <Button
                  variant={element.textAlignment === 'center' ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-10 w-10 p-2 flex items-center justify-center"
                  onClick={() => setTextAlignment(elementId, 'center')}
                  title="Align Center"
                >
                  <AlignCenter size={20} />
                </Button>
                <Button
                  variant={element.textAlignment === 'right' ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-10 w-10 p-2 flex items-center justify-center"
                  onClick={() => setTextAlignment(elementId, 'right')}
                  title="Align Right"
                >
                  <AlignRight size={20} />
                </Button>
              </div>
            </div>            {/* URL Row */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary mr-3 min-w-fit font-medium">Link:</span>
              <div className="flex gap-2">
                <Button
                  variant={element.url ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-10 px-4 text-sm flex items-center gap-2 font-medium"
                  onClick={() => {
                    const url = prompt('Enter URL (leave empty to remove link):', element.url || '');
                    if (url !== null) {
                      setElements(prevElements => prevElements.map(el => 
                        el.id === elementId 
                          ? { ...el, url: url || undefined }
                          : el
                      ));
                      saveToHistory(elements.map(el => 
                        el.id === elementId 
                          ? { ...el, url: url || undefined }
                          : el
                      ));
                    }
                  }}
                  title="Add/Edit URL"
                >
                  <Link size={18} />
                  {element.url ? 'Edit' : 'Add'} URL
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-bg-app overflow-hidden flex p-4 gap-4">      {/* Past Canvases Sidebar */}
      {showPastCanvases && (
        <Card className="w-80 flex-shrink-0 p-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Past Canvases</h3>
            <button
              className="p-1 hover:bg-bg-tertiary rounded-md transition-colors text-text-secondary hover:text-text-primary"
              onClick={() => setShowPastCanvases(false)}
              aria-label="Collapse Past Canvases sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
            <div className="space-y-3">
            {savedCanvases.map((canvas) => (
              <div
                key={canvas.id}
                className="relative"
                onMouseEnter={() => setHoveredCanvas(canvas.id)}
                onMouseLeave={() => setHoveredCanvas(null)}
              >
                <Card
                  className="p-3 cursor-pointer hover:bg-bg-subtle transition-colors"
                  onClick={() => handleLoadCanvas(canvas)}
                >
                  <h4 className="font-medium text-text-primary mb-1 pr-8">
                    {canvas.name}
                    {pinnedCanvases.has(canvas.id) && (
                      <Pin size={12} className="inline ml-2 text-accent" />
                    )}
                  </h4>
                  <p className="text-sm text-text-secondary mb-2">
                    Updated: {new Date(canvas.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="text-xs text-text-secondary">
                    {canvas.elements.length} elements
                  </div>
                </Card>
                
                {/* Hover Menu */}
                {hoveredCanvas === canvas.id && (
                  <div className="absolute top-2 right-2 bg-bg-primary border border-border-subtle rounded-md shadow-lg z-20 p-1 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        // PDF Export functionality
                        const canvasData = {
                          name: canvas.name,
                          elements: canvas.elements,
                          createdAt: canvas.createdAt,
                          updatedAt: canvas.updatedAt
                        };
                        const dataStr = JSON.stringify(canvasData, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(dataBlob);
                        link.download = `${canvas.name.replace(/\s+/g, '_')}_export.json`;
                        link.click();
                        URL.revokeObjectURL(link.href);
                      }}
                      title="Export as JSON (PDF export coming soon)"
                    >
                      <FileText size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinnedCanvases(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(canvas.id)) {
                            newSet.delete(canvas.id);
                          } else {
                            newSet.add(canvas.id);
                          }
                          return newSet;
                        });
                      }}
                      title={pinnedCanvases.has(canvas.id) ? "Unpin" : "Pin"}
                    >
                      <Pin size={12} className={pinnedCanvases.has(canvas.id) ? "text-accent" : ""} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${canvas.name}"?`)) {
                          // In a real app, this would delete from the backend
                          console.log(`Delete canvas: ${canvas.name}`);
                        }
                      }}
                      title="Delete Canvas"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col gap-4">        {/* Enhanced Toolbar with Shape Dropdown */}
        <div className="relative flex gap-4 items-center">
          <Card padding="none" className="p-2 flex gap-0.5 items-center justify-center">{tools.map(tool => (
              <div key={tool.id} className="relative">                <Button
                  title={tool.title}
                  variant={activeTool === tool.id ? 'primary' : 'ghost'}
                  size="icon"
                  data-tool={tool.id}                  onClick={(e) => {
                    if (tool.id === 'delete') {
                      handleDeleteElement();
                    } else if (tool.id === 'undo') {
                      handleUndo();
                    } else if (tool.id === 'redo') {
                      handleRedo();
                    } else if (tool.id === 'zoom-in') {
                      handleZoomIn();
                    } else if (tool.id === 'zoom-out') {
                      handleZoomOut();
                    } else if (tool.id === 'image') {
                      document.getElementById('image-upload')?.click();                    } else if (tool.id === 'shapes') {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDropdownPosition({
                        left: rect.left,
                        top: rect.bottom + 8
                      });
                      setShowShapeDropdown(!showShapeDropdown);
                      // Don't set activeTool here - only set it when a shape is actually selected
                    } else if (tool.id === 'text' || tool.id === 'sticky-note') {
                      // Place elements immediately for text and sticky-note tools
                      placeElementImmediately(tool.id);
                      setShowShapeDropdown(false);
                    } else if (tool.id === 'highlighter') {
                      // Highlighter tool for text elements
                      setActiveTool('highlighter');
                      setShowShapeDropdown(false);
                    } else if (tool.id === 'eraser') {
                      // Eraser tool for removing elements
                      setActiveTool('eraser');
                      setShowShapeDropdown(false);
                    } else if (tool.id === 'pen' || tool.id === 'line' || tool.id === 'arrow') {
                      // These tools still require canvas interaction
                      setActiveTool(tool.id as CanvasTool);
                      setShowShapeDropdown(false);
                    } else {
                      setActiveTool(tool.id as CanvasTool);
                      setShowShapeDropdown(false);
                    }
                  }}
                  disabled={(tool.id === 'delete' && !selectedElement) || (tool.id === 'undo' && !canUndo) || (tool.id === 'redo' && !canRedo)}
                >
                  <tool.icon size={16} />
                </Button>
                {/* Fixed Shape Dropdown */}                {tool.id === 'shapes' && showShapeDropdown && dropdownPosition && (
                  <div 
                    ref={dropdownRef}
                    className="fixed z-50" 
                    style={{
                      left: `${dropdownPosition.left}px`,
                      top: `${dropdownPosition.top}px`
                    }}
                  >
                    <Card className="p-2 min-w-48 shadow-xl border border-border-subtle bg-bg-primary">
                      <div className="grid grid-cols-2 gap-1">
                        {shapes.map(shape => (
                          <Button
                            key={shape.id}
                            variant={selectedShape === shape.id ? 'primary' : 'ghost'}
                            size="sm"
                            className="justify-start gap-2 h-8 text-xs"                            onClick={() => {
                              setSelectedShape(shape.id);
                              setShowShapeDropdown(false);
                              setDropdownPosition(null);
                              // Place shape immediately (no need to manipulate activeTool)
                              placeElementImmediately('shapes', shape.element);
                            }}
                          >
                            <shape.icon size={12} />
                            <span>{shape.name}</span>
                          </Button>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            ))}
          </Card>          {/* Past Canvases Toggle - Only show when sidebar is collapsed */}
          {!showPastCanvases && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPastCanvases(true)}
              title="Show Past Canvases"
            >
              <History size={16} />
            </Button>
          )}

          {/* Zoom Level Display - More Discreet and inline */}
          {zoomLevel !== 1 && (
            <div className="bg-black/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded opacity-60 hover:opacity-90 transition-opacity duration-200">
              <button
                onClick={handleZoomReset}
                title="Reset zoom (click to reset to 100%)"
                className="flex items-center gap-1 hover:underline cursor-pointer"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
            </div>
          )}        </div>

        {/* Hidden file input for import functionality */}
        <input
          id="canvas-import"
          type="file"
          accept=".json"
          onChange={handleImportCanvas}
          style={{ display: 'none' }}
        />
        
        {/* Hidden file input for image upload */}
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImageUpload(file);
            }
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />        {/* Enhanced Canvas Area */}
        <div 
          ref={canvasRef}          className={`flex-1 bg-bg-surface border border-border-subtle rounded-lg shadow-sm relative overflow-hidden transition-all duration-200 ${
            activeTool === 'pen' ? 'cursor-crosshair' : 
            activeTool === 'eraser' ? 'cursor-pointer' :
            activeTool === 'highlighter' ? 'cursor-pointer' :
            activeTool !== 'select' ? 'cursor-copy' : 'cursor-default'
          }`}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Canvas content with zoom and pan transforms */}
          <div
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%',
              transition: 'transform 0.1s ease-out'
            }}
          >            {elements.map(element => {
              const isSelected = selectedElement === element.id;
              
              // Define render functions for each element type
              const renderElement = () => {
                switch (element.type) {                  case 'sticky-note':
                    return (
                      <Card
                        key={element.id}
                        className={`absolute cursor-move p-3 transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
                        }`}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width,
                          height: element.height,
                          backgroundColor: element.color || '#facc15'
                        }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      >
                        {element.url ? (
                          <a
                            href={element.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <textarea
                              defaultValue={element.content}
                              placeholder="Type your note..."
                              onMouseDown={(e) => e.stopPropagation()}
                              className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-gray-800 placeholder-gray-500 pointer-events-none"
                              style={{
                                ...getTextStyles(element),
                                whiteSpace: 'pre-wrap'
                              }}
                              readOnly
                            />
                            <Link size={12} className="absolute bottom-1 right-1" />
                          </a>
                        ) : (
                          <textarea
                            defaultValue={element.content}                            placeholder="Type your note..."
                            onMouseDown={(e) => e.stopPropagation()}
                            className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-gray-800 placeholder-gray-500"
                            style={{
                              ...getTextStyles(element),
                              whiteSpace: 'pre-wrap'
                            }}
                            onFocus={(e) => {
                              setIsEditingText(element.id);
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTextFormattingPosition({
                                left: rect.left,
                                top: rect.bottom + 8
                              });
                              setShowTextFormatting(true);
                            }}
                            onBlur={() => {
                              setIsEditingText(null);
                              setShowTextFormatting(false);
                            }}
                            onChange={(e) => {
                              updateTextFormatting(element.id, 'content', e.target.value);
                            }}                            onInput={(e) => {
                              // Save content immediately on input for sticky notes
                              setElements(prevElements => prevElements.map(el => 
                                el.id === element.id 
                                  ? { ...el, content: (e.target as HTMLTextAreaElement).value }
                                  : el
                              ));
                            }}
                          />
                        )}
                      </Card>
                    );
                  case 'rectangle':
                  case 'square':
                    return (
                      <div
                        key={element.id}
                        className={`absolute cursor-move rounded-md transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
                        }`}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width,
                          height: element.height,
                          backgroundColor: element.color || '#3b82f6'
                        }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      />
                    );
                  case 'circle':
                    return (
                      <div
                        key={element.id}
                        className={`absolute cursor-move rounded-full transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
                        }`}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width,
                          height: element.height,
                          backgroundColor: element.color || '#10b981'
                        }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      />
                    );
                  case 'triangle':
                    return (
                      <div
                        key={element.id}
                        className={`absolute cursor-move transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
                        }`}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: 0,
                          height: 0,
                          borderLeft: `${(element.width || 60) / 2}px solid transparent`,
                          borderRight: `${(element.width || 60) / 2}px solid transparent`,
                          borderBottom: `${element.height || 60}px solid ${element.color || '#8b5cf6'}`,
                        }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      />
                    );
                  case 'star':
                    return (
                      <div
                        key={element.id}
                        className={`absolute cursor-move transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
                        }`}
                        style={{ left: element.x, top: element.y }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      >
                        <svg width={element.width || 60} height={element.height || 60}>
                          <polygon
                            points="30,2 37,20 57,20 42,32 48,52 30,40 12,52 18,32 3,20 23,20"
                            fill={element.color || '#f59e0b'}
                          />
                        </svg>
                      </div>
                    );
                  case 'hexagon':
                    return (
                      <div
                        key={element.id}
                        className={`absolute cursor-move transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
                        }`}
                        style={{ left: element.x, top: element.y }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      >
                        <svg width={element.width || 60} height={element.height || 60}>
                          <polygon
                            points="30,2 52,15 52,45 30,58 8,45 8,15"
                            fill={element.color || '#06b6d4'}
                          />
                        </svg>
                      </div>
                    );
                  case 'drawing':
                    return (
                      <svg
                        key={element.id}
                        className={`absolute cursor-move transition-all duration-200 pointer-events-none ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2' : ''
                        }`}
                        style={{ left: 0, top: 0, width: '100%', height: '100%' }}
                      >                        <path
                          d={element.path}
                          stroke={element.color || '#000000'}
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    );                  case 'text':
                    return (
                      <div
                        key={element.id}
                        className={`absolute cursor-move p-1 transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2 rounded px-2 py-1 bg-white/80' : ''
                        }`}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width,
                          height: element.height,
                          backgroundColor: element.backgroundColor || 'transparent',
                          borderRadius: element.backgroundColor ? '4px' : '0',
                          padding: element.backgroundColor ? '4px 8px' : '4px',
                        }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      >
                        {element.url ? (
                          <a
                            href={element.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                            onClick={(e) => e.stopPropagation()}
                          >                            {element.isBulletList ? (
                              <textarea
                                defaultValue={element.content}
                                className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-accent rounded pointer-events-none resize-none"
                                style={{
                                  ...getTextStyles(element),
                                  whiteSpace: 'pre-wrap',
                                  overflow: 'hidden'
                                }}
                                readOnly
                              />
                            ) : (
                              <input 
                                type="text"
                                defaultValue={element.content}
                                className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-accent rounded pointer-events-none"
                                style={{
                                  ...getTextStyles(element),
                                  minHeight: '100%'
                                }}
                                readOnly
                              />
                            )}
                            <Link size={12} className="inline ml-1" />
                          </a>
                        ) : (
                          <>                            {element.isBulletList ? (
                              <textarea
                                defaultValue={element.content}
                                className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-accent rounded text-text-primary resize-none"
                                style={{
                                  ...getTextStyles(element),
                                  whiteSpace: 'pre-wrap',
                                  overflow: 'hidden'
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onFocus={(e) => {
                                  setIsEditingText(element.id);
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTextFormattingPosition({
                                    left: rect.left,
                                    top: rect.bottom + 8
                                  });
                                  setShowTextFormatting(true);
                                }}
                                onBlur={() => {
                                  setIsEditingText(null);
                                  setShowTextFormatting(false);
                                }}                                onChange={(e) => {
                                  updateTextFormatting(element.id, 'content', e.target.value);
                                }}
                              />
                            ) : (
                              <input 
                                type="text"
                                defaultValue={element.content}
                                className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-accent rounded text-text-primary"
                                style={{
                                  ...getTextStyles(element),
                                  minHeight: '100%'
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onFocus={(e) => {
                                  setIsEditingText(element.id);
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTextFormattingPosition({
                                    left: rect.left,
                                    top: rect.bottom + 8
                                  });
                                  setShowTextFormatting(true);
                                }}
                                onBlur={() => {
                                  setIsEditingText(null);
                                  setShowTextFormatting(false);
                                }}                                onChange={(e) => {
                                  updateTextFormatting(element.id, 'content', e.target.value);
                                }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                  case 'line':
                    return (
                      <svg
                        key={element.id}
                        className={`absolute cursor-move transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2' : ''
                        }`}
                        style={{
                          left: Math.min(element.x, element.x2 || element.x) - 2,
                          top: Math.min(element.y, element.y2 || element.y) - 2,
                          width: Math.abs((element.x2 || element.x) - element.x) + 4,
                          height: Math.abs((element.y2 || element.y) - element.y) + 4,
                          pointerEvents: 'auto'
                        }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      >                        <line
                          x1={element.x - Math.min(element.x, element.x2 || element.x) + 2}
                          y1={element.y - Math.min(element.y, element.y2 || element.y) + 2}
                          x2={(element.x2 || element.x) - Math.min(element.x, element.x2 || element.x) + 2}
                          y2={(element.y2 || element.y) - Math.min(element.y, element.y2 || element.y) + 2}
                          stroke={element.color || '#000000'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    );
                  case 'arrow':
                    return (
                      <svg
                        key={element.id}
                        className={`absolute cursor-move transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2' : ''
                        }`}
                        style={{
                          left: Math.min(element.x, element.x2 || element.x) - 10,
                          top: Math.min(element.y, element.y2 || element.y) - 10,
                          width: Math.abs((element.x2 || element.x) - element.x) + 20,
                          height: Math.abs((element.y2 || element.y) - element.y) + 20,
                          pointerEvents: 'auto'
                        }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      >
                        <defs>
                          <marker
                            id={`arrowhead-${element.id}`}
                            markerWidth="10"
                            markerHeight="7"
                            refX="10"
                            refY="3.5"
                            orient="auto"
                          >
                            <polygon
                              points="0 0, 10 3.5, 0 7"
                              fill={element.color || '#000000'}
                            />
                          </marker>
                        </defs>                        <line
                          x1={element.x - Math.min(element.x, element.x2 || element.x) + 10}
                          y1={element.y - Math.min(element.y, element.y2 || element.y) + 10}
                          x2={(element.x2 || element.x) - Math.min(element.x, element.x2 || element.x) + 10}
                          y2={(element.y2 || element.y) - Math.min(element.y, element.y2 || element.y) + 10}
                          stroke={element.color || '#000000'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          markerEnd={`url(#arrowhead-${element.id})`}
                        />
                      </svg>
                    );
                  case 'image':
                    return (
                      <div
                        key={element.id}
                        className={`absolute cursor-move transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
                        }`}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width,
                          height: element.height,
                        }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                      >
                        <img
                          src={element.imageUrl}
                          alt={element.imageName || 'Canvas image'}
                          className="w-full h-full object-cover rounded"
                          draggable={false}
                        />
                      </div>
                    );
                  default:
                    return null;
                }
              };

              return (
                <div key={element.id}>
                  {renderElement()}
                  
                  {/* Resize handles for selected elements */}
                  {isSelected && element.width && element.height && (
                    <>
                      {getResizeHandles(element).map((handle) => (
                        <div
                          key={handle.position}
                          className="absolute w-2 h-2 bg-accent border border-white rounded-sm cursor-pointer hover:bg-accent-hover z-10"
                          style={{
                            left: handle.x,
                            top: handle.y,
                            cursor: handle.position.includes('left') || handle.position.includes('right') 
                              ? 'ew-resize' 
                              : handle.position.includes('top') || handle.position.includes('bottom')
                              ? 'ns-resize'
                              : handle.position === 'top-left' || handle.position === 'bottom-right'
                              ? 'nw-resize'
                              : 'ne-resize'
                          }}
                          onMouseDown={(e) => handleResizeStart(e, handle.position, element)}
                        />
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>          
          {/* Current drawing path preview */}
          {isDrawing && currentPath && (
            <div
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: '0 0',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >              <svg style={{ width: '100%', height: '100%' }}>
                <path
                  d={currentPath}
                  stroke="#000000"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          )}
          
          {/* Line/Arrow preview */}
          {isCreatingLine && lineStartPoint && (activeTool === 'line' || activeTool === 'arrow') && (
            <div
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: '0 0',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              <svg style={{ width: '100%', height: '100%' }}>                {activeTool === 'line' && (
                  <line
                    x1={lineStartPoint.x}
                    y1={lineStartPoint.y}
                    x2={mousePos.x}
                    y2={mousePos.y}
                    stroke="#666666"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="5,5"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {activeTool === 'arrow' && (
                  <>
                    <defs>
                      <marker
                        id="preview-arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="10"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill="#666666"
                        />
                      </marker>
                    </defs>
                    <line
                      x1={lineStartPoint.x}
                      y1={lineStartPoint.y}
                      x2={mousePos.x}
                      y2={mousePos.y}
                      stroke="#666666"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="5,5"
                      vectorEffect="non-scaling-stroke"
                      markerEnd="url(#preview-arrowhead)"
                    />
                  </>
                )}              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Text Formatting Toolbar */}
      {showTextFormatting && isEditingText && textFormattingPosition && (
        <TextFormattingToolbar 
          elementId={isEditingText}
          element={elements.find(el => el.id === isEditingText)!}
          position={textFormattingPosition}
        />
      )}
    </div>
  );
};

export default Canvas;
