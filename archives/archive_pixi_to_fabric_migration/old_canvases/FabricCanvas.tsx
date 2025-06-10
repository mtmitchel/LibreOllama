/**
 * Production Fabric.js Canvas Component
 * Final implementation replacing PIXI.js with Fabric.js
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFabricCanvasStore } from '../stores/fabricCanvasStoreFixed';
import { useFabricElementCreation, DEFAULT_ELEMENT_CONFIGS } from '../lib/fabric-element-creation';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import { CanvasTool } from '../stores/canvasStore';

interface FabricCanvasProps {
  className?: string;
}

const FabricCanvas: React.FC<FabricCanvasProps> = ({ 
  className = "canvas-container flex flex-col h-screen" 
}) => {  // Store state
  const elements = useFabricCanvasStore((state) => state.elements);
  const selectedElementIds = useFabricCanvasStore((state) => state.selectedElementIds);
  const activeTool = useFabricCanvasStore((state) => state.activeTool);
  const isEditingText = useFabricCanvasStore((state) => state.isEditingText);
  const isCanvasReady = useFabricCanvasStore((state) => state.isCanvasReady);
  const history = useFabricCanvasStore((state) => state.history);
  const historyIndex = useFabricCanvasStore((state) => state.historyIndex);

  // Compute undo/redo availability
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Store actions
  const setFabricCanvas = useFabricCanvasStore((state) => state.setFabricCanvas);
  const setCanvasReady = useFabricCanvasStore((state) => state.setCanvasReady);
  const setSelectedElementIds = useFabricCanvasStore((state) => state.setSelectedElementIds);
  const setIsEditingText = useFabricCanvasStore((state) => state.setIsEditingText);
  const setActiveTool = useFabricCanvasStore((state) => state.setActiveTool);
  const updateElement = useFabricCanvasStore((state) => state.updateElement);
  const addToHistory = useFabricCanvasStore((state) => state.addToHistory);
  const deleteElement = useFabricCanvasStore((state) => state.deleteElement);
  const undo = useFabricCanvasStore((state) => state.undo);
  const redo = useFabricCanvasStore((state) => state.redo);
  const clearSelection = useFabricCanvasStore((state) => state.clearSelection);  // Local state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null!);
  const fabricCanvasRef = useRef<any>(null);
  const isInitializingRef = useRef<boolean>(false);
  
  // Toolbar state
  const [selectedShape, setSelectedShape] = useState('');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null!);
  
  // Welcome modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  // Element creation
  const generateId = useCallback(() => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const { createElementDirectly } = useFabricElementCreation(
    useFabricCanvasStore,
    generateId,
    canvasContainerRef
  );  // Canvas initialization with dynamic import
  useEffect(() => {
    const initCanvas = async () => {
      try {
        if (!canvasRef.current || isInitializingRef.current) return;
        
        // Prevent multiple initializations
        if (fabricCanvasRef.current) {
          console.log('Fabric.js canvas already initialized, skipping...');
          return;
        }

        isInitializingRef.current = true;
        console.log('Initializing Fabric.js canvas...');        // Clean up any existing canvas on the element
        const canvasElement = canvasRef.current;
        if (canvasElement && (canvasElement as any).fabric) {
          try {
            (canvasElement as any).fabric.dispose();
            delete (canvasElement as any).fabric;
          } catch (e) {
            console.warn('Error disposing existing fabric canvas:', e);
          }
        }

        // Dynamic import of Fabric.js
        const fabricModule = await import('fabric');
        const { Canvas } = fabricModule;

        // Get initial dimensions from container
        const container = canvasContainerRef.current;
        const rect = container?.getBoundingClientRect();
        const initialWidth = rect ? Math.max(800, rect.width - 20) : 1200;
        const initialHeight = rect ? Math.max(600, rect.height - 100) : 800;

        // Create the canvas with infinite canvas feel
        const canvas = new Canvas(canvasRef.current, {
          width: initialWidth,
          height: initialHeight,
          backgroundColor: '#ffffff',
          selection: true,
          preserveObjectStacking: true,
          imageSmoothingEnabled: false,
          enableRetinaScaling: true,
          allowTouchScrolling: false,
          stopContextMenu: true,
        });

        fabricCanvasRef.current = canvas;// Enable infinite panning
        canvas.on('mouse:wheel', function(opt: any) {
          const delta = opt.e.deltaY;
          let zoom = canvas.getZoom();
          zoom *= 0.999 ** delta;
          if (zoom > 20) zoom = 20;
          if (zoom < 0.01) zoom = 0.01;
          canvas.zoomToPoint(new fabricModule.Point(opt.e.offsetX, opt.e.offsetY), zoom);
          opt.e.preventDefault();
          opt.e.stopPropagation();
        });

        // Add custom properties for panning
        let isDragging = false;
        let lastPosX = 0;
        let lastPosY = 0;

        // Enable panning on middle mouse or when no object is selected
        canvas.on('mouse:down', function(opt: any) {
          const evt = opt.e;
          if (evt.button === 1 || (evt.altKey && evt.button === 0)) {
            isDragging = true;
            canvas.selection = false;
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
            canvas.setCursor('grab');
          }
        });

        canvas.on('mouse:move', function(opt: any) {
          if (isDragging) {
            const e = opt.e;
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

        canvas.on('mouse:up', function() {
          canvas.setViewportTransform(canvas.viewportTransform);
          isDragging = false;
          canvas.selection = true;
          canvas.setCursor('default');
        });

        // Set up object event handlers
        canvas.on('selection:created', (e: any) => {
          const selectedObjects = e.selected || [];
          const selectedIds = selectedObjects
            .map((obj: any) => obj.customId)
            .filter((id: any) => id) as string[];
          setSelectedElementIds(selectedIds);
        });

        canvas.on('selection:updated', (e: any) => {
          const selectedObjects = e.selected || [];
          const selectedIds = selectedObjects
            .map((obj: any) => obj.customId)
            .filter((id: any) => id) as string[];
          setSelectedElementIds(selectedIds);
        });

        canvas.on('selection:cleared', () => {
          setSelectedElementIds([]);
        });

        canvas.on('object:modified', (e: any) => {
          const fabricObject = e.target;
          const customId = fabricObject?.customId as string;
          if (customId) {
            updateElement(customId, {
              x: fabricObject.left,
              y: fabricObject.top,
              width: fabricObject.width * (fabricObject.scaleX || 1),
              height: fabricObject.height * (fabricObject.scaleY || 1),
              rotation: fabricObject.angle,
            });
            addToHistory();
          }
        });

        canvas.on('text:editing:entered', (e: any) => {
          const customId = e.target?.customId as string;
          if (customId) {
            setIsEditingText(true);
          }
        });

        canvas.on('text:editing:exited', (e: any) => {
          const customId = e.target?.customId as string;
          if (customId) {
            setIsEditingText(false);
            const newText = e.target?.text || '';
            updateElement(customId, { content: newText });
            addToHistory();
          }
        });

        canvas.on('mouse:dblclick', (e: any) => {
          const target = e.target;
          if (target && target.type === 'i-text') {
            target.enterEditing();
          }
        });        // Set canvas in store
        setFabricCanvas(canvas);
        setCanvasReady(true);
        isInitializingRef.current = false;

        console.log('🎉 Production Fabric.js Canvas initialized successfully!');

      } catch (error) {
        console.error('Failed to initialize Fabric.js canvas:', error);
        isInitializingRef.current = false;
      }
    };

    initCanvas();

    return () => {
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
          fabricCanvasRef.current = null;
          isInitializingRef.current = false;
        } catch (e) {
          console.warn('Error disposing fabric canvas on cleanup:', e);
        }
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle canvas resize
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      const newSize = {
        width: Math.max(800, rect.width - 20),
        height: Math.max(600, rect.height - 100),
      };

      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setDimensions(newSize);
        fabricCanvasRef.current.renderAll();
      }
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);
  // Toolbar handlers
  const handleToolSelect = useCallback((toolId: string, event?: React.MouseEvent) => {
    console.log('🔧 Tool selected:', toolId);
    
    if (toolId === 'shapes' && event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setDropdownPosition({
        left: rect.left,
        top: rect.top - 10
      });
      setShowShapeDropdown(!showShapeDropdown);
      return;
    }
    
    setShowShapeDropdown(false);
    
    if (toolId === 'select') {
      console.log('🔧 Setting tool to select');
      setActiveTool('select');
    } else if (toolId === 'delete') {
      console.log('🔧 Deleting selected elements:', selectedElementIds);
      selectedElementIds.forEach(id => {
        deleteElement(id);
      });
      if (selectedElementIds.length > 0) {
        addToHistory();
      }
      clearSelection();
    } else if (DEFAULT_ELEMENT_CONFIGS[toolId as keyof typeof DEFAULT_ELEMENT_CONFIGS]) {
      console.log('🔧 Creating element of type:', toolId);
      const config = DEFAULT_ELEMENT_CONFIGS[toolId as keyof typeof DEFAULT_ELEMENT_CONFIGS];
      if (config.type) {
        createElementDirectly({
          ...config,
          type: config.type
        });
      }
    }
  }, [setActiveTool, selectedElementIds, deleteElement, addToHistory, clearSelection, createElementDirectly, showShapeDropdown]);

  const handleShapeSelect = useCallback((shapeId: string) => {
    console.log('🔧 Shape selected:', shapeId);
    const config = DEFAULT_ELEMENT_CONFIGS[shapeId as keyof typeof DEFAULT_ELEMENT_CONFIGS];
    if (config?.type) {
      createElementDirectly({
        ...config,
        type: config.type
      });
    }
    setSelectedShape(shapeId);
    setShowShapeDropdown(false);
  }, [createElementDirectly]);

  const handleUndo = useCallback(() => {
    console.log('🔧 Undo clicked');
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    console.log('🔧 Redo clicked');
    redo();
  }, [redo]);

  const handleZoomIn = useCallback(() => {
    console.log('🔧 Zoom in clicked');
    if (fabricCanvasRef.current) {
      const center = fabricCanvasRef.current.getCenter();
      const currentZoom = fabricCanvasRef.current.getZoom();
      const newZoom = Math.min(currentZoom * 1.2, 20);
      fabricCanvasRef.current.zoomToPoint(center, newZoom);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    console.log('🔧 Zoom out clicked');
    if (fabricCanvasRef.current) {
      const center = fabricCanvasRef.current.getCenter();
      const currentZoom = fabricCanvasRef.current.getZoom();
      const newZoom = Math.max(currentZoom / 1.2, 0.01);
      fabricCanvasRef.current.zoomToPoint(center, newZoom);
    }
  }, []);

  const handleDelete = useCallback(() => {
    console.log('🔧 Delete clicked for elements:', selectedElementIds);
    selectedElementIds.forEach(id => {
      deleteElement(id);
    });
    if (selectedElementIds.length > 0) {
      addToHistory();
    }
    clearSelection();
  }, [selectedElementIds, deleteElement, addToHistory, clearSelection]);
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

  // Close welcome modal when user starts using the canvas
  useEffect(() => {
    if (Object.keys(elements).length > 0 && showWelcomeModal) {
      setShowWelcomeModal(false);
    }
  }, [elements, showWelcomeModal]);

  return (
    <div className={className}>      {/* Canvas Toolbar */}
      <CanvasToolbar
        activeTool={activeTool as CanvasTool}
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

      {/* Main canvas area */}
      <div 
        ref={canvasContainerRef}
        className="flex-1 relative bg-gray-100 overflow-hidden"
        style={{ minHeight: '600px' }}
      >
        {/* Canvas */}
        <div className="flex items-center justify-center w-full h-full">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 shadow-lg bg-white"
            style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
          />
        </div>        {/* Instructions overlay */}
        {isCanvasReady && Object.keys(elements).length === 0 && showWelcomeModal && (
          <div className="absolute top-8 left-8 bg-white/95 border border-gray-200 rounded-lg p-6 max-w-sm shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900">
                ✨ Welcome to Fabric.js Canvas!
              </h3>
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close welcome message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• <strong>Create:</strong> Use toolbar to add text & shapes</li>
              <li>• <strong>Move:</strong> Drag objects to reposition</li>
              <li>• <strong>Edit:</strong> Double-click text to edit</li>
              <li>• <strong>Resize:</strong> Use corner handles</li>
              <li>• <strong>Select:</strong> Click objects, Shift+click for multi-select</li>
              <li>• <strong>Pan:</strong> Alt+drag or middle mouse button</li>
              <li>• <strong>Zoom:</strong> Mouse wheel to zoom in/out</li>
            </ul>
          </div>
        )}

        {/* Status indicator */}
        <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-2 rounded-lg shadow-sm border">
          <div className="text-xs text-gray-600">
            <div><strong>Fabric.js Canvas</strong> - Production Ready</div>
            <div>Elements: {Object.keys(elements).length} | Selected: {selectedElementIds.length}</div>
            <div>Tool: {activeTool} | {isEditingText ? 'Editing Text' : 'Ready'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FabricCanvas;
