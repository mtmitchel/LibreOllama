/**
 * Simplified Fabric.js Canvas Component
 * Following the developer guide best practices
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, Rect, Circle, IText, Point } from 'fabric';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import { CanvasTool } from '../stores/canvasStore';

interface SimpleFabricCanvasProps {
  className?: string;
}

const SimpleFabricCanvas: React.FC<SimpleFabricCanvasProps> = ({ 
  className = "canvas-container flex flex-col h-screen" 
}) => {  // Simple state management - following guide recommendations
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Local state for toolbar
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [selectedShape, setSelectedShape] = useState('');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Canvas size state
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  // Initialize Fabric canvas following guide recommendations
  const initCanvas = useCallback(() => {
    if (!canvasRef.current) {
      console.error('❌ Canvas element not found');
      return;
    }

    if (fabricCanvasRef.current) {
      console.log('🔄 Canvas already initialized, disposing old one');
      fabricCanvasRef.current.dispose();
    }

    console.log('🎨 Initializing Fabric.js canvas with size:', canvasSize);
    const fabricCanvas = new Canvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = fabricCanvas;
    console.log('✅ Fabric.js canvas initialized:', fabricCanvas);    // Simple zoom implementation following guide
    fabricCanvas.on('mouse:wheel', (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = fabricCanvas.getZoom();
      zoom *= 0.999 ** delta;
      
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      
      fabricCanvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });    // Simple panning
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    fabricCanvas.on('mouse:down', (opt: any) => {
      const evt = opt.e;
      if (evt.altKey) {
        isDragging = true;
        fabricCanvas.selection = false;
        lastPosX = (evt as MouseEvent).clientX;
        lastPosY = (evt as MouseEvent).clientY;
      }
    });

    fabricCanvas.on('mouse:move', (opt: any) => {
      if (isDragging) {
        const e = opt.e as MouseEvent;
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          fabricCanvas.requestRenderAll();
          lastPosX = e.clientX;
          lastPosY = e.clientY;
        }
      }
    });

    fabricCanvas.on('mouse:up', () => {
      isDragging = false;
      fabricCanvas.selection = true;
    });

    // Text editing - works out of the box as guide mentions
    fabricCanvas.on('text:editing:entered', () => {
      console.log('📝 Text editing started');
    });

    fabricCanvas.on('text:editing:exited', () => {
      console.log('📝 Text editing finished');
    });

    // Selection handling
    fabricCanvas.on('selection:created', () => {
      console.log('✅ Object selected');
    });

    fabricCanvas.on('selection:cleared', () => {
      console.log('❌ Selection cleared');
    });

    setIsCanvasReady(true);
    console.log('✨ Simplified Fabric.js canvas ready!');

    return () => {
      fabricCanvas.dispose();
    };
  }, [canvasSize]);

  // Initialize canvas
  useEffect(() => {
    const cleanup = initCanvas();
    return cleanup;
  }, [initCanvas]);

  // Handle container resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(width - 40, 400);
        const newHeight = Math.max(height - 40, 300);
        
        setCanvasSize({ width: newWidth, height: newHeight });
        
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.setDimensions({ width: newWidth, height: newHeight });
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Simplified toolbar handlers following guide
  const handleToolSelect = useCallback((toolId: string, event?: React.MouseEvent) => {
    console.log('🔧 Tool selected:', toolId);
    console.log('🔧 Canvas ref current:', fabricCanvasRef.current);
    
    if (toolId === 'shapes' && event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setDropdownPosition({ left: rect.left, top: rect.bottom + 5 });
      setShowShapeDropdown(prev => !prev);
      return;
    }
    
    setShowShapeDropdown(false);
    setActiveTool(toolId as CanvasTool);

    // Simple shape creation
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      console.log('🔧 Creating shape:', toolId);
      
      switch (toolId) {
        case 'text':
          const text = new IText('Click to edit', {
            left: 100,
            top: 100,
            fontFamily: 'Arial',
            fontSize: 20,
            fill: '#000000'
          });
          canvas.add(text);
          canvas.setActiveObject(text);
          console.log('✅ Text added to canvas');
          break;
          
        case 'rectangle':
          const rect = new Rect({
            left: 100,
            top: 100,
            width: 100,
            height: 80,
            fill: '#4f46e5',
            stroke: '#1e1b4b',
            strokeWidth: 2
          });
          canvas.add(rect);
          canvas.setActiveObject(rect);
          console.log('✅ Rectangle added to canvas');
          break;
          
        case 'circle':
          const circle = new Circle({
            left: 100,
            top: 100,
            radius: 50,
            fill: '#10b981',
            stroke: '#065f46',
            strokeWidth: 2
          });
          canvas.add(circle);
          canvas.setActiveObject(circle);
          console.log('✅ Circle added to canvas');
          break;
          
        default:
          console.log('🔧 Tool not implemented yet:', toolId);
      }
      
      canvas.renderAll();
      setShowWelcomeModal(false);
    } else {
      console.error('❌ Canvas not initialized yet');
    }
  }, []);

  const handleShapeSelect = useCallback((shapeId: string) => {
    console.log('🔧 Shape selected:', shapeId);
    setSelectedShape(shapeId);
    setShowShapeDropdown(false);
    handleToolSelect(shapeId);
  }, [handleToolSelect]);

  const handleUndo = useCallback(() => {
    console.log('🔧 Undo clicked');
    // TODO: Implement simple undo/redo using Fabric.js state
  }, []);

  const handleRedo = useCallback(() => {
    console.log('🔧 Redo clicked');
    // TODO: Implement simple undo/redo using Fabric.js state
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
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    console.log('🔧 Zoom out clicked');
    if (fabricCanvasRef.current) {
      const center = fabricCanvasRef.current.getCenter();
      const currentZoom = fabricCanvasRef.current.getZoom();
      const newZoom = Math.max(currentZoom / 1.2, 0.01);
      fabricCanvasRef.current.zoomToPoint(new Point(center.left, center.top), newZoom);
    }
  }, []);

  // Auto-hide welcome modal when user adds first object
  useEffect(() => {
    if (fabricCanvasRef.current && showWelcomeModal) {
      const objects = fabricCanvasRef.current.getObjects();
      if (objects.length > 0) {
        setShowWelcomeModal(false);
      }
    }
  });

  return (
    <div className={className}>
      {/* Simplified Toolbar */}      <CanvasToolbar
        activeTool={activeTool}
        selectedShape={selectedShape}
        showShapeDropdown={showShapeDropdown}
        dropdownPosition={dropdownPosition}
        dropdownRef={dropdownRef}
        onToolSelect={handleToolSelect}
        onShapeSelect={handleShapeSelect}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={handleDelete}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-gray-100 overflow-hidden"
        style={{ minHeight: '600px' }}
      >
        {/* Canvas */}
        <div className="flex items-center justify-center w-full h-full p-5">
          <canvas 
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="border border-gray-300 bg-white shadow-lg rounded-lg"
          />
        </div>

        {/* Welcome Modal */}
        {showWelcomeModal && (
          <div className="absolute top-6 left-6 bg-white p-4 rounded-lg shadow-lg border max-w-md">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                ✨ Simplified Fabric.js Canvas!
              </h3>
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• <strong>Create:</strong> Click toolbar buttons to add shapes/text</li>
              <li>• <strong>Edit:</strong> Double-click text to edit (works automatically!)</li>
              <li>• <strong>Move:</strong> Drag objects to reposition</li>
              <li>• <strong>Resize:</strong> Use corner handles (built-in)</li>
              <li>• <strong>Select:</strong> Click objects, Shift+click for multi-select</li>
              <li>• <strong>Pan:</strong> Alt+drag to pan around</li>
              <li>• <strong>Zoom:</strong> Mouse wheel to zoom</li>
            </ul>
          </div>
        )}

        {/* Status */}
        <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-2 rounded-lg shadow-sm border">
          <div className="text-xs text-gray-600">
            <div><strong>Simplified Fabric.js</strong> - {isCanvasReady ? 'Ready' : 'Loading...'}</div>
            <div>Objects: {fabricCanvasRef.current?.getObjects().length || 0}</div>
            <div>Tool: {activeTool}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleFabricCanvas;
