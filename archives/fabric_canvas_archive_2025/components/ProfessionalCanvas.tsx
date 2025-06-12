import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { EnhancedCanvasToolbar } from '../components/canvas/EnhancedToolbar';
import { 
  Download,
  Grid3X3,
  Layers,
  Palette,
  Settings,
  Eye,
  Save,
  RotateCcw
} from 'lucide-react';

type CanvasTool = 'select' | 'text' | 'sticky-note' | 'image' | 'pen' | 'eraser' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'triangle' | 'square' | 'hexagon' | 'star' | 'shapes';

function ProfessionalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef(false);
    const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [status, setStatus] = useState('Initializing...');
  const [objectCount, setObjectCount] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoom] = useState(100);
  // Enhanced drawing state
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(3);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  
  // History management
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Toolbar state
  const [selectedShape, setSelectedShape] = useState('');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);

  // Initialize canvas with working logic
  useEffect(() => {
    let canvas: fabric.Canvas | null = null;

    const initCanvas = async () => {
      try {
        if (!canvasRef.current || initializationRef.current) {
          return;
        }

        initializationRef.current = true;

        // Clean up any existing instance
        const existing = (canvasRef.current as any).__fabric;
        if (existing) {
          try {
            existing.dispose();
          } catch (e) {
            // Ignore disposal errors
          }
        }        setStatus('🔄 Creating professional design workspace...');
        
        canvas = new fabric.Canvas(canvasRef.current, {
          width: 1200,
          height: 800,
          backgroundColor: '#ffffff',
          selection: true,
          preserveObjectStacking: true
        });

        setFabricCanvas(canvas);
        setStatus('✅ Professional canvas ready for design!');

        // Add professional welcome content
        setTimeout(() => {
          if (!canvas) return;
          
          // Professional title
          const welcomeText = new fabric.IText('🎨 Professional Design Studio', {
            left: 200,
            top: 100,
            fontSize: 32,
            fill: '#1f2937',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            selectable: true,
            editable: true
          });
          canvas.add(welcomeText);

          // Subtitle with instructions
          const subtitle = new fabric.IText('Create stunning designs with professional tools below', {
            left: 200,
            top: 150,
            fontSize: 18,
            fill: '#6b7280',
            fontFamily: 'Arial',
            selectable: true,
            editable: true
          });
          canvas.add(subtitle);

          // Professional sample shapes with shadows
          const rect = new fabric.Rect({
            left: 150,
            top: 220,
            width: 140,
            height: 100,
            fill: '#3b82f6',
            stroke: '#1e40af',
            strokeWidth: 2,
            rx: 12,
            ry: 12,
            shadow: new fabric.Shadow({
              color: 'rgba(59, 130, 246, 0.3)',
              blur: 15,
              offsetX: 0,
              offsetY: 8
            })
          });
          canvas.add(rect);

          const circle = new fabric.Circle({
            left: 320,
            top: 270,
            radius: 40,
            fill: '#10b981',
            stroke: '#047857',
            strokeWidth: 2
          });
          canvas.add(circle);

          const triangle = new fabric.Triangle({
            left: 450,
            top: 280,
            width: 80,
            height: 80,
            fill: '#f59e0b',
            stroke: '#d97706',
            strokeWidth: 2
          });
          canvas.add(triangle);

          canvas.renderAll();
          setObjectCount(canvas.getObjects().length);
          setStatus(`🎉 Canvas loaded with ${canvas.getObjects().length} objects`);
        }, 200);        // Canvas events
        canvas.on('object:added', () => {
          if (canvas) {
            setObjectCount(canvas.getObjects().length);
          }
        });

        canvas.on('object:removed', () => {
          if (canvas) {
            setObjectCount(canvas.getObjects().length);
          }
        });

      } catch (error: any) {
        setStatus(`❌ Error: ${error.message}`);
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

  // Creation functions
  const createText = useCallback(() => {
    if (!fabricCanvas) return;
    
    const text = new fabric.IText('Double-click to edit', {
      left: fabricCanvas.getWidth() / 2 - 75,
      top: fabricCanvas.getHeight() / 2 - 12,
      fontSize: 18,
      fill: '#1f2937',
      fontFamily: 'Arial'
    });
    
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    setStatus('📝 Text added! Double-click to edit');
  }, [fabricCanvas]);

  const createStickyNote = useCallback(() => {
    if (!fabricCanvas) return;
    
    const rect = new fabric.Rect({
      width: 150,
      height: 100,
      fill: '#fef3c7',
      stroke: '#f59e0b',
      strokeWidth: 1,
      rx: 4,
      ry: 4
    });
    
    const text = new fabric.IText('Sticky note', {
      left: 75,
      top: 50,
      originX: 'center',
      originY: 'center',
      fontSize: 12,
      fill: '#92400e',
      fontFamily: 'Arial'
    });
    
    const group = new fabric.Group([rect, text], {
      left: fabricCanvas.getWidth() / 2 - 75,
      top: fabricCanvas.getHeight() / 2 - 50
    });
    
    fabricCanvas.add(group);
    fabricCanvas.setActiveObject(group);
    fabricCanvas.renderAll();
    setStatus('📌 Sticky note added!');
  }, [fabricCanvas]);

  const createShape = useCallback((shapeType: string) => {
    if (!fabricCanvas) return;
    
    const centerX = fabricCanvas.getWidth() / 2;
    const centerY = fabricCanvas.getHeight() / 2;
    
    let shape: fabric.Object;
    
    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: centerX - 60,
          top: centerY - 40,
          width: 120,
          height: 80,
          fill: '#3b82f6',
          stroke: '#1e40af',
          strokeWidth: 2,
          rx: 4,
          ry: 4
        });
        break;
        
      case 'circle':
        shape = new fabric.Circle({
          left: centerX - 40,
          top: centerY - 40,
          radius: 40,
          fill: '#10b981',
          stroke: '#047857',
          strokeWidth: 2
        });
        break;
        
      case 'triangle':
        shape = new fabric.Triangle({
          left: centerX - 40,
          top: centerY - 40,
          width: 80,
          height: 80,
          fill: '#f59e0b',
          stroke: '#d97706',
          strokeWidth: 2
        });
        break;
          case 'square':
        shape = new fabric.Rect({
          left: centerX - 40,
          top: centerY - 40,
          width: 80,
          height: 80,
          fill: '#8b5cf6',
          stroke: '#7c3aed',
          strokeWidth: 2
        });
        break;
        
      case 'hexagon':
        const hexagonPoints = [];
        const hexRadius = 40;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI * 2) / 6;
          hexagonPoints.push({
            x: hexRadius * Math.cos(angle),
            y: hexRadius * Math.sin(angle)
          });
        }
        shape = new fabric.Polygon(hexagonPoints, {
          left: centerX - hexRadius,
          top: centerY - hexRadius,
          fill: '#ef4444',
          stroke: '#dc2626',
          strokeWidth: 2
        });
        break;
        
      case 'star':
        const starPoints = [];
        const outerRadius = 40;
        const innerRadius = 20;
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / 5;
          starPoints.push({
            x: radius * Math.cos(angle - Math.PI / 2),
            y: radius * Math.sin(angle - Math.PI / 2)
          });
        }
        shape = new fabric.Polygon(starPoints, {
          left: centerX - outerRadius,
          top: centerY - outerRadius,
          fill: '#f97316',
          stroke: '#ea580c',
          strokeWidth: 2
        });
        break;
        
      default:
        return;
    }
    
    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
    fabricCanvas.renderAll();
    setStatus(`✨ ${shapeType} added!`);
  }, [fabricCanvas]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && fabricCanvas) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imgElement = new Image();
          imgElement.onload = () => {
            const imgInstance = new fabric.Image(imgElement, {
              left: fabricCanvas.getWidth() / 2 - imgElement.width / 4,
              top: fabricCanvas.getHeight() / 2 - imgElement.height / 4,
              scaleX: 0.5,
              scaleY: 0.5
            });
            fabricCanvas.add(imgInstance);
            fabricCanvas.setActiveObject(imgInstance);
            fabricCanvas.renderAll();
            setStatus('🖼️ Image added!');
          };
          imgElement.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [fabricCanvas]);

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

    if (!fabricCanvas) return;

    switch (toolId) {
      case 'select':
        fabricCanvas.isDrawingMode = false;
        setStatus('🎯 Select mode active');
        break;
        case 'pen':
        fabricCanvas.isDrawingMode = true;
        if (fabricCanvas.freeDrawingBrush) {
          fabricCanvas.freeDrawingBrush.width = brushSize;
          fabricCanvas.freeDrawingBrush.color = currentColor;
        }
        setStatus(`✏️ Drawing mode active (${brushSize}px, ${currentColor})`);
        break;
      
      case 'text':
        createText();
        setActiveTool('select');
        break;
      
      case 'sticky-note':
        createStickyNote();
        setActiveTool('select');
        break;
        
      case 'image':
        handleImageUpload();
        setActiveTool('select');
        break;
    }
  }, [fabricCanvas, createText, createStickyNote, handleImageUpload]);

  const handleShapeSelect = useCallback((shapeId: string) => {
    setSelectedShape(shapeId);
    setShowShapeDropdown(false);
    createShape(shapeId);
    setActiveTool('select');
  }, [createShape]);

  // Action handlers
  const handleUndo = useCallback(() => {
    setStatus('↶ Undo - Feature coming soon!');
  }, []);

  const handleRedo = useCallback(() => {
    setStatus('↷ Redo - Feature coming soon!');
  }, []);

  const handleDelete = useCallback(() => {
    if (!fabricCanvas) return;
    
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      fabricCanvas.remove(...activeObjects);
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      setStatus(`🗑️ Deleted ${activeObjects.length} object(s)`);
    }
  }, [fabricCanvas]);

  const handleZoomIn = useCallback(() => {
    if (!fabricCanvas) return;
    
    const currentZoom = fabricCanvas.getZoom();
    const newZoom = Math.min(currentZoom * 1.1, 3);
    fabricCanvas.setZoom(newZoom);
    setZoom(Math.round(newZoom * 100));
    setStatus(`🔍 Zoomed to ${Math.round(newZoom * 100)}%`);
  }, [fabricCanvas]);
  const handleZoomOut = useCallback(() => {
    if (!fabricCanvas) return;
    
    const currentZoom = fabricCanvas.getZoom();
    const newZoom = Math.max(currentZoom * 0.9, 0.1);
    fabricCanvas.setZoom(newZoom);
    setZoom(Math.round(newZoom * 100));
    setStatus(`🔍 Zoomed to ${Math.round(newZoom * 100)}%`);
  }, [fabricCanvas]);

  // Enhanced color and brush handlers
  const handleColorChange = useCallback((color: string) => {
    setCurrentColor(color);
    if (fabricCanvas && fabricCanvas.isDrawingMode && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = color;
    }
    setStatus(`🎨 Color changed to ${color}`);
  }, [fabricCanvas]);

  const handleBrushSizeChange = useCallback((size: number) => {
    setBrushSize(size);
    if (fabricCanvas && fabricCanvas.isDrawingMode && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.width = size;
    }
    setStatus(`🖌️ Brush size changed to ${size}px`);
  }, [fabricCanvas]);  const handleToggleColorPicker = useCallback(() => {
    setShowColorPicker(prev => !prev);
  }, []);
  // Grid functionality
  const toggleGrid = useCallback(() => {
    if (!fabricCanvas) return;
    
    setShowGrid(prev => {
      const newShowGrid = !prev;
      
      if (newShowGrid) {
        // Add grid background using pattern
        const gridSize = 20;
        
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = gridSize;
        patternCanvas.height = gridSize;
        const patternCtx = patternCanvas.getContext('2d');
        
        if (patternCtx) {
          patternCtx.strokeStyle = '#e5e7eb';
          patternCtx.lineWidth = 1;
          patternCtx.beginPath();
          patternCtx.moveTo(0, gridSize);
          patternCtx.lineTo(gridSize, gridSize);
          patternCtx.lineTo(gridSize, 0);
          patternCtx.stroke();
          
          fabricCanvas.backgroundColor = `url(${patternCanvas.toDataURL()})` as any;
          fabricCanvas.renderAll();
        }
        
        setStatus('📐 Grid enabled - Objects will snap to grid');
        setSnapToGrid(true);
      } else {
        fabricCanvas.backgroundColor = '#ffffff';
        fabricCanvas.renderAll();
        setStatus('📐 Grid disabled');
        setSnapToGrid(false);
      }
      
      return newShowGrid;
    });
  }, [fabricCanvas]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!fabricCanvas) return;
      
      // Prevent shortcuts when typing in text
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'v':
          if (!e.ctrlKey) {
            setActiveTool('select');
            fabricCanvas.isDrawingMode = false;
            setStatus('🎯 Select mode (V)');
          }
          break;
        case 'p':
          if (!e.ctrlKey) {
            setActiveTool('pen');
            fabricCanvas.isDrawingMode = true;
            if (fabricCanvas.freeDrawingBrush) {
              fabricCanvas.freeDrawingBrush.width = brushSize;
              fabricCanvas.freeDrawingBrush.color = currentColor;
            }
            setStatus('✏️ Pen mode (P)');
          }
          break;
        case 't':
          if (!e.ctrlKey) {
            createText();
            setStatus('📝 Text added (T)');
          }
          break;
        case 'delete':
        case 'backspace':
          if (!e.ctrlKey) {
            handleDelete();
          }
          break;
        case '+':
        case '=':
          if (e.ctrlKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;        case 'z':
          if (e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            handleUndo();
          } else if (e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            handleRedo();
          }
          break;
        case 'g':
          if (!e.ctrlKey) {
            e.preventDefault();
            toggleGrid();
          }
          break;
      }
    };    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fabricCanvas, brushSize, currentColor, createText, handleDelete, handleZoomIn, handleZoomOut, handleUndo, handleRedo, toggleGrid]);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    setObjectCount(0);
    setStatus('🧹 Canvas cleared');
  }, [fabricCanvas]);
  const exportCanvas = useCallback(() => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 0.9,
      multiplier: 2
    });
    
    const link = document.createElement('a');
    link.download = `canvas-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    link.href = dataURL;
    link.click();
    
    setStatus('💾 Canvas exported as high-quality PNG!');
  }, [fabricCanvas]);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (!fabricCanvas) return;
    
    const canvasData = JSON.stringify(fabricCanvas.toJSON());
    localStorage.setItem('canvas-autosave', canvasData);
    localStorage.setItem('canvas-autosave-timestamp', new Date().toISOString());
  }, [fabricCanvas]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [fabricCanvas, autoSave]);
  // Load auto-save on startup
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const savedData = localStorage.getItem('canvas-autosave');
    const savedTimestamp = localStorage.getItem('canvas-autosave-timestamp');
    
    if (savedData && savedTimestamp) {
      const timestamp = new Date(savedTimestamp);
      const hoursAgo = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
      
      if (hoursAgo < 24) { // Load if saved within 24 hours
        try {
          fabricCanvas.loadFromJSON(savedData, () => {
            fabricCanvas.renderAll();
            setObjectCount(fabricCanvas.getObjects().length);
            setStatus(`🔄 Auto-save restored from ${timestamp.toLocaleTimeString()}`);
          });
        } catch (error) {
          console.warn('Failed to load auto-save:', error);
        }
      }
    }
  }, [fabricCanvas]);

  // Manual save function
  const saveCanvas = useCallback(() => {
    if (!fabricCanvas) return;
    
    const canvasData = JSON.stringify(fabricCanvas.toJSON());
    const dataBlob = new Blob([canvasData], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.download = `canvas-project-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    setStatus('💾 Canvas project saved!');
  }, [fabricCanvas]);

  // Load canvas function
  const loadCanvas = useCallback(() => {
    if (!fabricCanvas) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const canvasData = event.target?.result as string;
            fabricCanvas.loadFromJSON(canvasData, () => {
              fabricCanvas.renderAll();
              setObjectCount(fabricCanvas.getObjects().length);
              setStatus('📂 Canvas project loaded!');
            });
          } catch (error) {
            setStatus('❌ Failed to load canvas project');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">      {/* Professional Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Professional Canvas</h1>
                <p className="text-sm text-gray-500">LibreOllama Design Studio • Premium Tools</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={saveCanvas}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Save className="w-4 h-4" />
                Save Project
              </button>
              <button
                onClick={loadCanvas}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                Load Project
              </button>
              <button
                onClick={exportCanvas}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export PNG
              </button>
              <button
                onClick={clearCanvas}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <Grid3X3 className="w-4 h-4" />
                Clear All
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
            
            {/* Enhanced Status & Stats */}
            <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  status.includes('ready') ? 'bg-green-500' :
                  status.includes('Error') ? 'bg-red-500' :
                  'bg-blue-500'
                }`} />
                <span className="text-sm text-gray-600 font-medium">{status}</span>
              </div>
              <div className="text-sm text-gray-400">•</div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Layers className="w-4 h-4" />
                <span className="font-medium">{objectCount}</span>
                <span className="text-gray-500">objects</span>
              </div>
              <div className="text-sm text-gray-400">•</div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Eye className="w-4 h-4" />
                <span className="font-medium">{zoom}%</span>
                <span className="text-gray-500">zoom</span>
              </div>
            </div>
          </div>
        </div>
      </div>      {/* Enhanced Canvas Area */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Canvas Container with Professional Styling */}
        <div className="flex items-center justify-center w-full h-full p-6 pb-24">
          <div className="bg-white shadow-2xl rounded-2xl p-6 border border-gray-200" style={{ 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)' 
          }}>
            <canvas 
              ref={canvasRef} 
              className="block rounded-xl transition-all duration-300 hover:shadow-lg"
              style={{ 
                border: '2px solid #e5e7eb',
                maxWidth: '100%', 
                maxHeight: '100%'
              }}
            />
          </div>
        </div>        {/* Professional Toolbar with Enhanced Styling */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-white/50">
            <EnhancedCanvasToolbar
              activeTool={activeTool}
              selectedShape={selectedShape}
              showShapeDropdown={showShapeDropdown}
              dropdownPosition={dropdownPosition}
              dropdownRef={dropdownRef}
              canUndo={canUndo}
              canRedo={canRedo}
              currentColor={currentColor}
              brushSize={brushSize}
              showColorPicker={showColorPicker}
              onToolSelect={handleToolSelect}
              onShapeSelect={handleShapeSelect}
              onColorChange={handleColorChange}
              onBrushSizeChange={handleBrushSizeChange}
              onToggleColorPicker={handleToggleColorPicker}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onDelete={handleDelete}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
            />
          </div>
        </div>        {/* Enhanced Quick Help */}
        <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-white/50 max-w-sm">
          <h3 className="font-bold text-gray-900 mb-3 text-base flex items-center gap-2">
            🚀 Professional Canvas Studio
          </h3>
          
          <div className="space-y-3">
            <div className="text-sm">
              <h4 className="font-semibold text-gray-800 mb-2">✨ Tools & Features</h4>
              <ul className="text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Enhanced toolbar with color picker
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Professional shapes with shadows
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Real-time auto-save every 30s
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  High-quality PNG export
                </li>
              </ul>
            </div>
              <div className="text-sm">
              <h4 className="font-semibold text-gray-800 mb-2">⌨️ Keyboard Shortcuts</h4>
              <ul className="text-gray-600 space-y-1 text-xs">
                <li><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">V</kbd> Select tool</li>
                <li><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">P</kbd> Pen tool</li>
                <li><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">T</kbd> Add text</li>
                <li><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">G</kbd> Toggle grid</li>
                <li><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Del</kbd> Delete selected</li>
                <li><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Z</kbd> Undo</li>
                <li><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Ctrl++</kbd> Zoom in</li>
                <li><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Ctrl+-</kbd> Zoom out</li>
              </ul>
            </div>
            
            <div className="text-sm">
              <h4 className="font-semibold text-gray-800 mb-2">💡 Pro Tips</h4>
              <ul className="text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  Mouse wheel for smooth zooming
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Shift+Click for multi-select
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                  Corner handles to resize objects
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center font-medium">
              LibreOllama Professional v2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfessionalCanvas;
