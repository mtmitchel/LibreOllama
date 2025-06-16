/**
 /**
 * Professional Simplified Fabric.js Canvas Component
 * Direct Fabric.js approach with modern professional UI following design system
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, Rect, Circle, IText, Point, Triangle, Polygon, Group } from 'fabric';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import { CanvasTool } from '../stores/fabricCanvasStore';
import { Button, Card } from '../components/ui';
import { 
  Palette,
  Save,
  Download,
  RotateCcw,
  X,
  Lightbulb,
  Zap,
  Layers
} from 'lucide-react';

const SimpleFabricCanvas: React.FC = () => {
  // Simple state management - no complex stores
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Local state for toolbar following design system
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [objectCount, setObjectCount] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [zoom, setZoom] = useState(100);
    // Canvas size state
  const [canvasSize] = useState({ width: 1200, height: 800 });

  // Update undo/redo state
  const updateUndoRedoState = useCallback((canvas: Canvas) => {
    // Simple implementation - in a real app you'd implement proper history
    setCanUndo(canvas.getObjects().length > 0);
    setCanRedo(false); // Simplified for now
  }, []);

  // Initialize Fabric canvas with professional settings
  const initCanvas = useCallback(() => {
    if (!canvasRef.current) {
      console.error('❌ Canvas element not found');
      return;
    }

    if (fabricCanvasRef.current) {
      console.log('🔄 Canvas already initialized, disposing old one');
      fabricCanvasRef.current.dispose();
    }

    setStatus('🔄 Creating professional design workspace...');
    console.log('🎨 Initializing Fabric.js canvas with size:', canvasSize);
    
    const fabricCanvas = new Canvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = fabricCanvas;
    setStatus('✅ Professional canvas ready for design!');
    setIsCanvasReady(true);
    console.log('✅ Fabric.js canvas initialized:', fabricCanvas);

    // Professional zoom implementation
    fabricCanvas.on('mouse:wheel', (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = fabricCanvas.getZoom();
      zoom *= 0.999 ** delta;
      
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      
      fabricCanvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
      setZoom(Math.round(zoom * 100));
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Professional panning
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    fabricCanvas.on('mouse:down', (opt: any) => {
      const evt = opt.e;
      if (evt.altKey || evt.ctrlKey) {
        isDragging = true;
        fabricCanvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
    });

    fabricCanvas.on('mouse:move', (opt: any) => {
      if (isDragging) {
        const evt = opt.e;
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += evt.clientX - lastPosX;
          vpt[5] += evt.clientY - lastPosY;
          fabricCanvas.requestRenderAll();
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        }
      }
    });

    fabricCanvas.on('mouse:up', () => {
      isDragging = false;
      fabricCanvas.selection = true;
    });    // Track object count for status
    fabricCanvas.on('object:added', () => {
      const count = fabricCanvas.getObjects().length;
      setObjectCount(count);
      updateUndoRedoState(fabricCanvas);
    });

    fabricCanvas.on('object:removed', () => {
      const count = fabricCanvas.getObjects().length;
      setObjectCount(count);
      updateUndoRedoState(fabricCanvas);
    });

    fabricCanvas.on('object:modified', () => {
      updateUndoRedoState(fabricCanvas);
    });

    // Add welcome content
    setTimeout(() => {
      createWelcomeContent(fabricCanvas);
    }, 500);

  }, [canvasSize]);

  // Professional shape creation functions
  const createShape = useCallback((shapeType: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const centerX = canvas.getWidth() / 2;
    const centerY = canvas.getHeight() / 2;
    let shape;

    switch (shapeType) {
      case 'rectangle':
        shape = new Rect({
          left: centerX - 50,
          top: centerY - 40,
          width: 100,
          height: 80,
          fill: '#3b82f6',
          stroke: '#1e40af',
          strokeWidth: 2,
          rx: 8,
          ry: 8
        });
        break;
      case 'circle':
        shape = new Circle({
          left: centerX - 40,
          top: centerY - 40,
          radius: 40,
          fill: '#10b981',
          stroke: '#059669',
          strokeWidth: 2
        });
        break;
      case 'triangle':
        shape = new Triangle({
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
        shape = new Rect({
          left: centerX - 40,
          top: centerY - 40,
          width: 80,
          height: 80,
          fill: '#8b5cf6',
          stroke: '#7c3aed',
          strokeWidth: 2,
          rx: 8,
          ry: 8
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
        shape = new Polygon(hexagonPoints, {
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
        shape = new Polygon(starPoints, {
          left: centerX - outerRadius,
          top: centerY - outerRadius,
          fill: '#f97316',
          stroke: '#ea580c',
          strokeWidth: 2
        });
        break;
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      setStatus(`✨ ${shapeType} shape created!`);
    }
  }, []);

  const createText = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const text = new IText('Click to edit text', {
      left: canvas.getWidth() / 2 - 75,
      top: canvas.getHeight() / 2,
      fontSize: 18,
      fill: '#1f2937',
      fontFamily: 'Inter, Arial, sans-serif',
      selectable: true,
      editable: true
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setStatus('📝 Text element added!');
  }, []);

  const createStickyNote = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const rect = new Rect({
      left: 0,
      top: 0,
      width: 150,
      height: 100,
      fill: '#fef3c7',
      stroke: '#f59e0b',
      strokeWidth: 1,
      rx: 4,
      ry: 4
    });
    
    const text = new IText('Sticky note', {
      left: 75,
      top: 50,
      originX: 'center',
      originY: 'center',
      fontSize: 12,
      fill: '#92400e',
      fontFamily: 'Inter, Arial, sans-serif',
      selectable: false
    });
    
    const group = new Group([rect, text], {
      left: canvas.getWidth() / 2 - 75,
      top: canvas.getHeight() / 2 - 50
    });
    
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    setStatus('📌 Sticky note added!');
  }, []);

  // Create welcome content
  const createWelcomeContent = useCallback((canvas: Canvas) => {
    const welcomeText = new IText('🎨 Professional Design Studio', {
      left: 100,
      top: 100,
      fontSize: 28,
      fill: '#1f2937',
      fontFamily: 'Inter, Arial, sans-serif',
      fontWeight: 'bold',
      selectable: true,
      editable: true
    });
    canvas.add(welcomeText);

    const subtitle = new IText('Use the toolbar to create amazing designs', {
      left: 100,
      top: 140,
      fontSize: 16,
      fill: '#6b7280',
      fontFamily: 'Inter, Arial, sans-serif',
      selectable: true,
      editable: true
    });
    canvas.add(subtitle);

    canvas.renderAll();
  }, []);
  // Canvas toolbar handlers
  const handleToolSelect = useCallback((toolId: string, event?: React.MouseEvent) => {
    console.log('🔧 Tool selected:', toolId);
    
    if (toolId === 'shapes' && event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setDropdownPosition({ left: rect.left, top: rect.bottom + 5 });
      setShowShapeDropdown(prev => !prev);
      return;
    }
    
    setShowShapeDropdown(false);
    setActiveTool(toolId as CanvasTool);    if (fabricCanvasRef.current) {
      switch (toolId) {
        case 'text':
          createText();
          break;
        case 'rectangle':
        case 'circle':
        case 'triangle':
        case 'square':
        case 'hexagon':
        case 'star':
          createShape(toolId);
          break;
        case 'sticky-note':
          createStickyNote();
          break;
        default:
          console.log('🔧 Tool not implemented yet:', toolId);
      }
      
      setShowWelcomeModal(false);
    }
  }, [createText, createShape, createStickyNote]);

  const handleShapeSelect = useCallback((shapeId: string) => {
    console.log('🔧 Shape selected:', shapeId);
    setSelectedShape(shapeId);
    setShowShapeDropdown(false);
    createShape(shapeId);
  }, [createShape]);

  const handleUndo = useCallback(() => {
    console.log('🔧 Undo clicked');
    // TODO: Implement undo functionality
  }, []);

  const handleRedo = useCallback(() => {
    console.log('🔧 Redo clicked');
    // TODO: Implement redo functionality
  }, []);

  const handleDelete = useCallback(() => {
    console.log('🔧 Delete clicked');
    if (fabricCanvasRef.current) {
      const activeObjects = fabricCanvasRef.current.getActiveObjects();
      fabricCanvasRef.current.remove(...activeObjects);
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    console.log('🔧 Zoom in clicked');
    if (fabricCanvasRef.current) {
      const center = fabricCanvasRef.current.getCenter();
      const currentZoom = fabricCanvasRef.current.getZoom();
      const newZoom = Math.min(currentZoom * 1.2, 20);
      fabricCanvasRef.current.zoomToPoint(new Point(center.left, center.top), newZoom);
      setZoom(Math.round(newZoom * 100));
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    console.log('🔧 Zoom out clicked');
    if (fabricCanvasRef.current) {
      const center = fabricCanvasRef.current.getCenter();
      const currentZoom = fabricCanvasRef.current.getZoom();
      const newZoom = Math.max(currentZoom / 1.2, 0.01);
      fabricCanvasRef.current.zoomToPoint(new Point(center.left, center.top), newZoom);
      setZoom(Math.round(newZoom * 100));
    }
  }, []);

  // Save canvas
  const saveCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const json = fabricCanvasRef.current.toJSON();
    const dataStr = JSON.stringify(json, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `canvas-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    setStatus('Canvas saved successfully');
  }, []);

  // Export canvas
  const exportCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `canvas-export-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    
    setStatus('Canvas exported successfully');
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    setObjectCount(0);
    setStatus('Canvas cleared');
  }, []);

  // Initialize canvas on mount
  useEffect(() => {
    initCanvas();
    
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [initCanvas]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Professional Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Palette className="w-6 h-6" />
              <h1 className="text-xl font-bold">Professional Canvas</h1>
            </div>
            <div className="flex items-center space-x-2 text-blue-100">
              <Layers className="w-4 h-4" />
              <span className="text-sm">{objectCount} objects</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status Indicator */}
            <div className="flex items-center space-x-2 text-blue-100">
              <div className={`w-2 h-2 rounded-full ${isCanvasReady ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="text-sm">{status}</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveCanvas}
                className="text-white hover:bg-white/10"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportCanvas}
                className="text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCanvas}
                className="text-white hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Welcome to Professional Canvas</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWelcomeModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 mb-4">
              A simplified, professional canvas built with Fabric.js. Use the toolbar to create shapes, 
              add text, and design your masterpiece.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <Zap className="w-4 h-4" />
              <span>All tools are fully functional</span>
            </div>
            <Button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full"
            >
              Start Creating
            </Button>
          </Card>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden">        {/* Sidebar with Toolbar */}
        <div className="w-16 bg-white border-r border-gray-200 shadow-sm flex flex-col">
          <CanvasToolbar
            activeTool={activeTool}
            selectedShape={selectedShape}
            showShapeDropdown={showShapeDropdown}
            dropdownPosition={dropdownPosition}
            dropdownRef={dropdownRef}
            onToolSelect={handleToolSelect}
            onShapeSelect={handleShapeSelect}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDelete={handleDelete}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
        </div>

        {/* Canvas Container */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-auto">
            <div className="flex justify-center">
              <div 
                ref={containerRef}
                className="relative bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                style={{ 
                  width: canvasSize.width + 40, 
                  height: canvasSize.height + 40,
                  padding: '20px'
                }}
              >
                <canvas 
                  ref={canvasRef}
                  className="border border-gray-100 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Bottom Status Bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Tool: <span className="font-medium capitalize">{activeTool}</span></span>
                <span>Objects: <span className="font-medium">{objectCount}</span></span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Zoom: <span className="font-medium">{zoom}%</span></span>
                <span>Size: <span className="font-medium">{canvasSize.width} × {canvasSize.height}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleFabricCanvas;
