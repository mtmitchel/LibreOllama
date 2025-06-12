import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import { 
  MousePointer2, 
  Type, 
  StickyNote, 
  Image as ImageIcon,
  Pencil,
  Eraser,
  Minus,
  ArrowRight,
  RectangleHorizontal,
  Circle,
  Triangle,
  Square,
  Hexagon,
  Star
} from 'lucide-react';

type CanvasTool = 'select' | 'text' | 'sticky-note' | 'image' | 'pen' | 'eraser' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'triangle' | 'square' | 'hexagon' | 'star' | 'shapes';

interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

function PolishedCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [elements, setElements] = useState<Record<string, CanvasElement>>({});
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [selectedShape, setSelectedShape] = useState('');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1.0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Generate unique ID
  const generateId = useCallback(() => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add to history
  const addToHistory = useCallback(() => {
    const newState = { ...elements };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [elements, history, historyIndex]);

  // Canvas initialization
  useEffect(() => {
    let canvas: fabric.Canvas | null = null;

    const initCanvas = async () => {
      try {
        if (!canvasRef.current) return;

        // Clean up any existing instance
        const existing = (canvasRef.current as any).__fabric;
        if (existing) {
          try {
            existing.dispose();
          } catch (e) {
            // Ignore disposal errors
          }
        }

        canvas = new fabric.Canvas(canvasRef.current, {
          width: 1400,
          height: 900,
          backgroundColor: '#ffffff',
          selection: true,
          preserveObjectStacking: true
        });

        // Canvas event handlers
        canvas.on('object:added', () => {
          setElements(prev => ({ ...prev }));
        });

        canvas.on('object:removed', () => {
          setElements(prev => ({ ...prev }));
        });

        canvas.on('selection:created', (e) => {
          const selected = e.selected?.map((obj: any) => obj.customId).filter(Boolean) || [];
          setSelectedElementIds(selected);
        });

        canvas.on('selection:updated', (e) => {
          const selected = e.selected?.map((obj: any) => obj.customId).filter(Boolean) || [];
          setSelectedElementIds(selected);
        });

        canvas.on('selection:cleared', () => {
          setSelectedElementIds([]);
        });

        // Zoom with mouse wheel
        canvas.on('mouse:wheel', (opt) => {
          const delta = opt.e.deltaY;
          let newZoom = canvas.getZoom();
          newZoom *= 0.999 ** delta;
          if (newZoom > 20) newZoom = 20;
          if (newZoom < 0.01) newZoom = 0.01;
          canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), newZoom);
          setZoom(newZoom);
          opt.e.preventDefault();
          opt.e.stopPropagation();
        });

        setFabricCanvas(canvas);
        setIsReady(true);

        // Add welcome content
        setTimeout(() => {
          addWelcomeContent(canvas);
        }, 100);

      } catch (error: any) {
        console.error('Canvas initialization error:', error);
      }
    };

    initCanvas();

    return () => {
      if (canvas) {
        try {
          canvas.dispose();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  // Add welcome content
  const addWelcomeContent = (canvas: fabric.Canvas) => {
    // Welcome text
    const welcomeText = new fabric.IText('Welcome to LibreOllama Canvas', {
      left: 100,
      top: 100,
      fontSize: 32,
      fill: '#2563eb',
      fontWeight: 'bold',
      fontFamily: 'Inter, sans-serif'
    });
    welcomeText.customId = generateId();
    canvas.add(welcomeText);

    // Subtitle
    const subtitle = new fabric.IText('Click the toolbar below to start creating', {
      left: 100,
      top: 150,
      fontSize: 16,
      fill: '#64748b',
      fontFamily: 'Inter, sans-serif'
    });
    subtitle.customId = generateId();
    canvas.add(subtitle);

    // Sample shapes
    const rect = new fabric.Rect({
      left: 100,
      top: 200,
      width: 120,
      height: 80,
      fill: '#ef4444',
      stroke: '#dc2626',
      strokeWidth: 2,
      rx: 8,
      ry: 8
    });
    rect.customId = generateId();
    canvas.add(rect);

    const circle = new fabric.Circle({
      left: 250,
      top: 220,
      radius: 40,
      fill: '#10b981',
      stroke: '#059669',
      strokeWidth: 2
    });
    circle.customId = generateId();
    canvas.add(circle);

    const triangle = new fabric.Polygon([
      { x: 380, y: 200 },
      { x: 430, y: 280 },
      { x: 330, y: 280 }
    ], {
      fill: '#8b5cf6',
      stroke: '#7c3aed',
      strokeWidth: 2
    });
    triangle.customId = generateId();
    canvas.add(triangle);

    canvas.renderAll();
  };

  // Create element based on tool
  const createElement = useCallback((type: string, options: any = {}) => {
    if (!fabricCanvas) return;

    const id = generateId();
    let fabricObject: fabric.Object | null = null;

    const centerX = fabricCanvas.getWidth() / 2;
    const centerY = fabricCanvas.getHeight() / 2;

    switch (type) {
      case 'text':
        fabricObject = new fabric.IText('Click to edit text', {
          left: centerX - 50,
          top: centerY - 10,
          fontSize: 18,
          fill: '#000000',
          fontFamily: 'Inter, sans-serif',
          ...options
        });
        break;

      case 'sticky-note':
        const group = new fabric.Group([
          new fabric.Rect({
            width: 200,
            height: 150,
            fill: '#fef3c7',
            stroke: '#f59e0b',
            strokeWidth: 1,
            rx: 4,
            ry: 4
          }),
          new fabric.IText('Sticky note', {
            left: -90,
            top: -65,
            fontSize: 14,
            fill: '#92400e',
            fontFamily: 'Inter, sans-serif'
          })
        ], {
          left: centerX - 100,
          top: centerY - 75
        });
        fabricObject = group;
        break;

      case 'rectangle':
        fabricObject = new fabric.Rect({
          left: centerX - 60,
          top: centerY - 40,
          width: 120,
          height: 80,
          fill: '#3b82f6',
          stroke: '#1d4ed8',
          strokeWidth: 2,
          rx: 4,
          ry: 4,
          ...options
        });
        break;

      case 'circle':
        fabricObject = new fabric.Circle({
          left: centerX - 40,
          top: centerY - 40,
          radius: 40,
          fill: '#10b981',
          stroke: '#059669',
          strokeWidth: 2,
          ...options
        });
        break;

      case 'triangle':
        fabricObject = new fabric.Polygon([
          { x: 0, y: -40 },
          { x: 40, y: 40 },
          { x: -40, y: 40 }
        ], {
          left: centerX,
          top: centerY,
          fill: '#8b5cf6',
          stroke: '#7c3aed',
          strokeWidth: 2,
          ...options
        });
        break;

      case 'line':
        fabricObject = new fabric.Line([0, 0, 100, 0], {
          left: centerX - 50,
          top: centerY,
          stroke: '#374151',
          strokeWidth: 2,
          ...options
        });
        break;

      case 'arrow':
        const arrowHead = new fabric.Polygon([
          { x: 0, y: 0 },
          { x: -10, y: -5 },
          { x: -10, y: 5 }
        ], {
          fill: '#374151',
          left: 100,
          top: 0
        });

        const arrowLine = new fabric.Line([0, 0, 90, 0], {
          stroke: '#374151',
          strokeWidth: 2
        });

        fabricObject = new fabric.Group([arrowLine, arrowHead], {
          left: centerX - 50,
          top: centerY
        });
        break;
    }

    if (fabricObject) {
      (fabricObject as any).customId = id;
      fabricCanvas.add(fabricObject);
      fabricCanvas.setActiveObject(fabricObject);
      fabricCanvas.renderAll();
      addToHistory();
    }
  }, [fabricCanvas, generateId, addToHistory]);

  // Tool handlers
  const handleToolSelect = useCallback((toolId: string, event?: React.MouseEvent) => {
    if (toolId === 'shapes') {
      if (event && event.currentTarget instanceof HTMLElement) {
        const rect = event.currentTarget.getBoundingClientRect();
        setDropdownPosition({ top: rect.top - 200, left: rect.left });
      }
      setShowShapeDropdown(prev => !prev);
      return;
    }

    setShowShapeDropdown(false);
    setActiveTool(toolId as CanvasTool);

    // Handle immediate creation tools
    if (['text', 'sticky-note'].includes(toolId)) {
      createElement(toolId);
      setActiveTool('select');
    } else if (toolId === 'image') {
      handleImageUpload();
      setActiveTool('select');
    }
  }, [createElement]);

  const handleShapeSelect = useCallback((shapeId: string) => {
    setSelectedShape(shapeId);
    setShowShapeDropdown(false);
    createElement(shapeId);
    setActiveTool('select');
  }, [createElement]);

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && fabricCanvas) {
        const reader = new FileReader();
        reader.onload = (event) => {
          fabric.FabricImage.fromURL(event.target?.result as string).then((img) => {
            const scale = Math.min(300 / img.width!, 200 / img.height!);
            img.scale(scale);
            img.set({
              left: fabricCanvas.getWidth() / 2 - (img.width! * scale) / 2,
              top: fabricCanvas.getHeight() / 2 - (img.height! * scale) / 2,
            });
            (img as any).customId = generateId();
            fabricCanvas.add(img);
            fabricCanvas.renderAll();
            addToHistory();
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Action handlers
  const handleUndo = useCallback(() => {
    if (canUndo && fabricCanvas) {
      setHistoryIndex(prev => prev - 1);
      const previousState = history[historyIndex - 1];
      // Implement undo logic here
    }
  }, [canUndo, fabricCanvas, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo && fabricCanvas) {
      setHistoryIndex(prev => prev + 1);
      const nextState = history[historyIndex + 1];
      // Implement redo logic here
    }
  }, [canRedo, fabricCanvas, history, historyIndex]);

  const handleDelete = useCallback(() => {
    if (fabricCanvas && selectedElementIds.length > 0) {
      const activeObjects = fabricCanvas.getActiveObjects();
      activeObjects.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      setSelectedElementIds([]);
      addToHistory();
    }
  }, [fabricCanvas, selectedElementIds, addToHistory]);

  const handleZoomIn = useCallback(() => {
    if (fabricCanvas) {
      const newZoom = Math.min(zoom * 1.2, 20);
      fabricCanvas.zoomToPoint(
        new fabric.Point(fabricCanvas.getWidth() / 2, fabricCanvas.getHeight() / 2),
        newZoom
      );
      setZoom(newZoom);
    }
  }, [fabricCanvas, zoom]);

  const handleZoomOut = useCallback(() => {
    if (fabricCanvas) {
      const newZoom = Math.max(zoom / 1.2, 0.01);
      fabricCanvas.zoomToPoint(
        new fabric.Point(fabricCanvas.getWidth() / 2, fabricCanvas.getHeight() / 2),
        newZoom
      );
      setZoom(newZoom);
    }
  }, [fabricCanvas, zoom]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShapeDropdown(false);
      }
    };

    if (showShapeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShapeDropdown]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Canvas</h1>
            <p className="text-sm text-gray-600 mt-1">Create and design with powerful tools</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Ready
              </span>
              <span>Objects: {Object.keys(elements).length}</span>
              <span>Selected: {selectedElementIds.length}</span>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
            </div>
            
            {/* Status indicator */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isReady ? '✅ Canvas Ready' : '⏳ Loading...'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={canvasContainerRef}
          className="w-full h-full flex items-center justify-center p-8"
        >
          <div className="relative">
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              className="border border-gray-300 shadow-lg rounded-lg bg-white"
              style={{ 
                cursor: activeTool === 'select' ? 'default' : 'crosshair',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
            
            {/* Canvas overlay info */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-gray-600 shadow-sm">
              <div className="flex items-center gap-4">
                <span>Tool: <strong className="text-gray-900">{activeTool}</strong></span>
                <span>•</span>
                <span>Use mouse wheel to zoom</span>
                <span>•</span>
                <span>Alt+drag to pan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <CanvasToolbar
          activeTool={activeTool}
          selectedShape={selectedShape}
          showShapeDropdown={showShapeDropdown}
          dropdownPosition={dropdownPosition}
          dropdownRef={dropdownRef}
          canUndo={canUndo}
          canRedo={canRedo}
          onToolSelect={handleToolSelect}
          onShapeSelect={handleShapeSelect}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDelete={handleDelete}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      </div>
    </div>
  );
}

export default PolishedCanvas;
