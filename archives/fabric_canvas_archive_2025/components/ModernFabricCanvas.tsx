import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Minus, 
  ArrowRight, 
  Pencil,
  Image as ImageIcon,
  StickyNote,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Undo2,
  Redo2,
  Palette
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  icon: React.ElementType;
  action?: () => void;
}

const ModernFabricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTool, setActiveTool] = useState<string>('select');
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [showGrid, setShowGrid] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Save canvas state to history
  const saveHistory = useCallback(() => {
    if (!fabricRef.current) return;
    const currentState = JSON.stringify(fabricRef.current.toJSON());
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep]);

  // Undo
  const undo = useCallback(() => {
    if (historyStep > 0 && fabricRef.current) {
      const newStep = historyStep - 1;
      fabricRef.current.loadFromJSON(history[newStep], () => {
        fabricRef.current?.requestRenderAll();
        setHistoryStep(newStep);
      });
    }
  }, [history, historyStep]);

  // Redo
  const redo = useCallback(() => {
    if (historyStep < history.length - 1 && fabricRef.current) {
      const newStep = historyStep + 1;
      fabricRef.current.loadFromJSON(history[newStep], () => {
        fabricRef.current?.requestRenderAll();
        setHistoryStep(newStep);
      });
    }
  }, [history, historyStep]);

  // Helper function to configure object controls
  const configureObjectControls = useCallback((obj: fabric.Object) => {
    obj.set({
      transparentCorners: false,
      cornerColor: '#3b82f6',
      cornerStrokeColor: '#3b82f6',
      borderColor: '#3b82f6',
      cornerSize: 8,
      cornerStyle: 'circle',
      selectable: true,
      moveable: true,
      hasControls: true,
      hasBorders: true,
      lockUniScaling: false,
    });
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log('Initializing Fabric.js canvas...');
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth - 256,
      height: window.innerHeight - 64,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      allowTouchScrolling: false,
      hoverCursor: 'pointer',
      moveCursor: 'move',
      defaultCursor: 'default',
    });

    fabricRef.current = canvas;
    
    console.log('Canvas initialized:', canvas);
    
    // Test object creation
    setTimeout(() => {
      console.log('Creating test rectangle...');
      const testRect = new fabric.Rect({
        left: 50,
        top: 50,
        width: 100,
        height: 80,
        fill: 'red',
        stroke: 'blue',
        strokeWidth: 2,
        selectable: true,
        moveable: true,
        hasControls: true,
        hasBorders: true,
      });
      canvas.add(testRect);
      canvas.requestRenderAll();
      console.log('Test rectangle added:', testRect);
    }, 1000);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeObject = canvas.getActiveObject();
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeObject) {
          canvas.remove(activeObject);
          canvas.requestRenderAll();
          saveHistory();
        }
      }
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Mouse wheel zoom
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Panning with middle mouse or alt+drag
    let isPanning = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent;
      if (evt.altKey || evt.button === 1) {
        isPanning = true;
        canvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isPanning) {
        const e = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          canvas.requestRenderAll();
          lastPosX = e.clientX;
          lastPosY = e.clientY;
        }
      }
    });

    canvas.on('mouse:up', () => {
      isPanning = false;
      canvas.selection = true;
    });

    // Save history on object modifications
    canvas.on('object:modified', () => {
      saveHistory();
    });

    // Ensure new objects have proper controls
    canvas.on('object:added', (e) => {
      if (e.target && !e.target.get('_controlsConfigured')) {
        configureObjectControls(e.target);
        e.target.set('_controlsConfigured', true);
      }
    });

    // Save history after drawing is complete
    canvas.on('path:created', () => {
      saveHistory();
    });

    // Window resize
    const handleResize = () => {
      canvas.setWidth(window.innerWidth - 256);
      canvas.setHeight(window.innerHeight - 64);
      canvas.requestRenderAll();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, [configureObjectControls, saveHistory]);

  // Tool functions
  const addText = useCallback(() => {
    console.log('addText called, fabricRef.current:', fabricRef.current);
    if (!fabricRef.current) return;
    const text = new fabric.IText('Type here...', {
      left: fabricRef.current.width / 2 - 50,
      top: fabricRef.current.height / 2 - 10,
      fontSize: 20,
      fill: currentColor,
      fontFamily: 'Inter, system-ui, sans-serif',
    });
    configureObjectControls(text);
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    fabricRef.current.requestRenderAll();
    console.log('Text object added:', text);
    saveHistory();
  }, [currentColor, saveHistory, configureObjectControls]);

  const addStickyNote = useCallback(() => {
    if (!fabricRef.current) return;
    const rect = new fabric.Rect({
      width: 200,
      height: 200,
      fill: '#fef3c7',
      stroke: '#f59e0b',
      strokeWidth: 1,
      rx: 5,
      ry: 5,
    });
    const text = new fabric.IText('Note...', {
      left: 10,
      top: 10,
      fontSize: 16,
      fill: '#92400e',
      fontFamily: 'Inter, system-ui, sans-serif',
      width: 180,
    });
    const group = new fabric.Group([rect, text], {
      left: fabricRef.current.width / 2 - 100,
      top: fabricRef.current.height / 2 - 100,
    });
    configureObjectControls(group);
    fabricRef.current.add(group);
    fabricRef.current.setActiveObject(group);
    fabricRef.current.requestRenderAll();
    saveHistory();
  }, [saveHistory, configureObjectControls]);

  const addRectangle = useCallback(() => {
    console.log('addRectangle called, fabricRef.current:', fabricRef.current);
    if (!fabricRef.current) return;
    const rect = new fabric.Rect({
      left: fabricRef.current.width / 2 - 75,
      top: fabricRef.current.height / 2 - 50,
      width: 150,
      height: 100,
      fill: currentColor + '20',
      stroke: currentColor,
      strokeWidth: 2,
      rx: 8,
      ry: 8,
    });
    configureObjectControls(rect);
    fabricRef.current.add(rect);
    fabricRef.current.setActiveObject(rect);
    fabricRef.current.requestRenderAll();
    console.log('Rectangle added:', rect);
    saveHistory();
  }, [currentColor, saveHistory, configureObjectControls]);

  const addCircle = useCallback(() => {
    if (!fabricRef.current) return;
    const circle = new fabric.Circle({
      left: fabricRef.current.width / 2 - 50,
      top: fabricRef.current.height / 2 - 50,
      radius: 50,
      fill: currentColor + '20',
      stroke: currentColor,
      strokeWidth: 2,
    });
    configureObjectControls(circle);
    fabricRef.current.add(circle);
    fabricRef.current.setActiveObject(circle);
    fabricRef.current.requestRenderAll();
    saveHistory();
  }, [currentColor, saveHistory, configureObjectControls]);

  const addTriangle = useCallback(() => {
    if (!fabricRef.current) return;
    const triangle = new fabric.Triangle({
      left: fabricRef.current.width / 2 - 50,
      top: fabricRef.current.height / 2 - 50,
      width: 100,
      height: 100,
      fill: currentColor + '20',
      stroke: currentColor,
      strokeWidth: 2,
    });
    configureObjectControls(triangle);
    fabricRef.current.add(triangle);
    fabricRef.current.setActiveObject(triangle);
    fabricRef.current.requestRenderAll();
    saveHistory();
  }, [currentColor, saveHistory, configureObjectControls]);

  const addLine = useCallback(() => {
    if (!fabricRef.current) return;
    const line = new fabric.Line([50, 100, 200, 100], {
      left: fabricRef.current.width / 2 - 75,
      top: fabricRef.current.height / 2,
      stroke: currentColor,
      strokeWidth: 3,
      strokeLineCap: 'round',
    });
    configureObjectControls(line);
    fabricRef.current.add(line);
    fabricRef.current.setActiveObject(line);
    fabricRef.current.requestRenderAll();
    saveHistory();
  }, [currentColor, saveHistory, configureObjectControls]);

  const addArrow = useCallback(() => {
    if (!fabricRef.current) return;
    const line = new fabric.Line([50, 100, 200, 100], {
      stroke: currentColor,
      strokeWidth: 3,
    });
    
    const triangle = new fabric.Triangle({
      left: 200,
      top: 100,
      width: 15,
      height: 15,
      fill: currentColor,
      angle: 90,
      originX: 'center',
      originY: 'center',
    });
    
    const arrow = new fabric.Group([line, triangle], {
      left: fabricRef.current.width / 2 - 100,
      top: fabricRef.current.height / 2,
    });
    
    configureObjectControls(arrow);
    fabricRef.current.add(arrow);
    fabricRef.current.setActiveObject(arrow);
    fabricRef.current.requestRenderAll();
    saveHistory();
  }, [currentColor, saveHistory, configureObjectControls]);

  const toggleDrawing = useCallback(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    
    canvas.isDrawingMode = !canvas.isDrawingMode;
    
    if (canvas.isDrawingMode) {
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = currentColor;
        canvas.freeDrawingBrush.width = 3;
      }
      setActiveTool('draw');
    } else {
      setActiveTool('select');
    }
    canvas.requestRenderAll();
  }, [currentColor]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.FabricImage.fromURL(event.target?.result as string)
        .then((img) => {
          if (!fabricRef.current) return;
          
          // Scale image to fit
          const maxSize = 400;
          const scale = Math.min(maxSize / img.width!, maxSize / img.height!);
          img.scale(scale);
          
          img.set({
            left: fabricRef.current.width / 2 - (img.width! * scale) / 2,
            top: fabricRef.current.height / 2 - (img.height! * scale) / 2,
          });
          
          configureObjectControls(img);
          fabricRef.current.add(img);
          fabricRef.current.setActiveObject(img);
          fabricRef.current.requestRenderAll();
          saveHistory();
        })
        .catch((error) => {
          console.error('Error loading image:', error);
        });
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [saveHistory, configureObjectControls]);

  const deleteSelected = useCallback(() => {
    if (!fabricRef.current) return;
    const activeObject = fabricRef.current.getActiveObject();
    if (activeObject) {
      fabricRef.current.remove(activeObject);
      fabricRef.current.requestRenderAll();
      saveHistory();
    }
  }, [saveHistory]);

  const exportCanvas = useCallback(() => {
    if (!fabricRef.current) return;
    const dataURL = fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement('a');
    link.download = `canvas-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid(!showGrid);
    // TODO: Implement actual grid overlay
  }, [showGrid]);

  const zoomIn = useCallback(() => {
    if (!fabricRef.current) return;
    const zoom = fabricRef.current.getZoom();
    fabricRef.current.setZoom(Math.min(zoom * 1.2, 20));
    fabricRef.current.requestRenderAll();
  }, []);

  const zoomOut = useCallback(() => {
    if (!fabricRef.current) return;
    const zoom = fabricRef.current.getZoom();
    fabricRef.current.setZoom(Math.max(zoom / 1.2, 0.1));
    fabricRef.current.requestRenderAll();
  }, []);

  const tools: Tool[] = [
    { id: 'text', name: 'Text', icon: Type, action: addText },
    { id: 'sticky', name: 'Sticky Note', icon: StickyNote, action: addStickyNote },
    { id: 'rectangle', name: 'Rectangle', icon: Square, action: addRectangle },
    { id: 'circle', name: 'Circle', icon: Circle, action: addCircle },
    { id: 'triangle', name: 'Triangle', icon: Triangle, action: addTriangle },
    { id: 'line', name: 'Line', icon: Minus, action: addLine },
    { id: 'arrow', name: 'Arrow', icon: ArrowRight, action: addArrow },
    { id: 'draw', name: 'Draw', icon: Pencil, action: toggleDrawing },
    { id: 'image', name: 'Image', icon: ImageIcon, action: () => fileInputRef.current?.click() },
  ];

  const actionTools = [
    { id: 'undo', name: 'Undo', icon: Undo2, action: undo, disabled: historyStep <= 0 },
    { id: 'redo', name: 'Redo', icon: Redo2, action: redo, disabled: historyStep >= history.length - 1 },
    { id: 'delete', name: 'Delete', icon: Trash2, action: deleteSelected },
    { id: 'grid', name: 'Grid', icon: Grid3x3, action: toggleGrid, active: showGrid },
    { id: 'zoomIn', name: 'Zoom In', icon: ZoomIn, action: zoomIn },
    { id: 'zoomOut', name: 'Zoom Out', icon: ZoomOut, action: zoomOut },
    { id: 'export', name: 'Export', icon: Download, action: exportCanvas },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Modern Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Main Tools */}
          <div className="flex items-center gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id);
                    tool.action?.();
                  }}
                  className={`
                    px-3 py-2 rounded-lg flex items-center gap-2 transition-all
                    ${activeTool === tool.id 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'hover:bg-gray-100 text-gray-700'
                    }
                  `}
                  title={tool.name}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tool.name}</span>
                </button>
              );
            })}
            
            {/* Color Picker */}
            <div className="flex items-center gap-2 ml-4 px-3 py-2 bg-gray-50 rounded-lg">
              <Palette size={18} className="text-gray-600" />
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-2 border-gray-300"
                title="Color"
              />
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1">
            {actionTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={tool.action}
                  disabled={tool.disabled}
                  className={`
                    p-2 rounded-lg transition-all
                    ${tool.active 
                      ? 'bg-blue-100 text-blue-600' 
                      : tool.disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-gray-100 text-gray-600'
                    }
                  `}
                  title={tool.name}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <canvas 
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{ backgroundColor: '#ffffff' }}
        />
        
        {/* Grid Overlay (visual only) */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent 20px)',
              backgroundSize: '20px 20px',
            }}
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Tool: {activeTool}</span>
            <span>Objects: {fabricRef.current?.getObjects().length || 0}</span>
            <span>Zoom: {Math.round((fabricRef.current?.getZoom() || 1) * 100)}%</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Alt+Drag to pan</span>
            <span>Scroll to zoom</span>
            <span>Del to delete</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernFabricCanvas;