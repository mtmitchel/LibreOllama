/**
 * Fabric.js Canvas Component - Phase 2 Migration (Fixed)
 * Integrates Fabric.js with the new FabricCanvasStore and element creation system
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFabricCanvasStore, FabricCanvasElement } from '../stores/fabricCanvasStoreFixed';
import { useFabricElementCreation, DEFAULT_ELEMENT_CONFIGS } from '../lib/fabric-element-creation';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';

interface FabricCanvasMigrationProps {
  className?: string;
}

const FabricCanvasMigration: React.FC<FabricCanvasMigrationProps> = ({ 
  className = "canvas-container flex flex-col h-screen" 
}) => {
  // Store state
  const elements = useFabricCanvasStore((state) => state.elements);
  const selectedElementIds = useFabricCanvasStore((state) => state.selectedElementIds);
  const activeTool = useFabricCanvasStore((state) => state.activeTool);
  const isEditingText = useFabricCanvasStore((state) => state.isEditingText);
  const isCanvasReady = useFabricCanvasStore((state) => state.isCanvasReady);

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
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [status, setStatus] = useState('Initializing Fabric.js canvas...');
  
  // Local state for toolbar
  const [selectedShape, setSelectedShape] = useState('');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null!);

  // Element creation
  const generateId = useCallback(() => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const { createElementDirectly } = useFabricElementCreation(
    useFabricCanvasStore,
    generateId,
    canvasContainerRef
  );

  // Canvas initialization with dynamic import
  useEffect(() => {
    const initCanvas = async () => {
      try {
        if (!canvasRef.current) {
          setStatus('Canvas element not found');
          return;
        }

        setStatus('Loading Fabric.js...');
        
        // Dynamic import of Fabric.js
        const fabricModule = await import('fabric');
        const { Canvas } = fabricModule;

        setStatus('Creating canvas...');

        // Create the canvas
        const canvas = new Canvas(canvasRef.current, {
          width: canvasSize.width,
          height: canvasSize.height,
          backgroundColor: '#ffffff',
          selection: true,
          preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;

        // Set up event handlers
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
              width: fabricObject.width * fabricObject.scaleX,
              height: fabricObject.height * fabricObject.scaleY,
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
            updateElement(customId, { text: newText });
            addToHistory();
          }
        });

        canvas.on('object:moving', (e: any) => {
          const fabricObject = e.target;
          const customId = fabricObject?.customId as string;
          if (customId) {
            updateElement(customId, {
              x: fabricObject.left,
              y: fabricObject.top,
            });
          }
        });

        canvas.on('mouse:dblclick', (e: any) => {
          const target = e.target;
          if (target && target.type === 'i-text') {
            target.enterEditing();
          }
        });

        // Set canvas in store
        setFabricCanvas(canvas);
        setCanvasReady(true);
        setStatus('Canvas ready');

      } catch (error) {
        console.error('Failed to initialize Fabric.js canvas:', error);
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initCanvas();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [canvasSize, setFabricCanvas, setCanvasReady, setSelectedElementIds, updateElement, addToHistory, setIsEditingText]);

  // Handle canvas resize
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      const newSize = {
        width: Math.max(400, rect.width - 20),
        height: Math.max(300, rect.height - 100),
      };

      setCanvasSize(newSize);

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

  // Canvas toolbar handlers
  const handleToolSelect = useCallback((toolId: string) => {
    if (toolId === 'select') {
      setActiveTool('select');
    } else if (toolId === 'delete') {
      selectedElementIds.forEach(id => {
        deleteElement(id);
      });
      if (selectedElementIds.length > 0) {
        addToHistory();
      }
      clearSelection();
    } else if (DEFAULT_ELEMENT_CONFIGS[toolId as keyof typeof DEFAULT_ELEMENT_CONFIGS]) {
      const config = DEFAULT_ELEMENT_CONFIGS[toolId as keyof typeof DEFAULT_ELEMENT_CONFIGS];
      if (config.type) {
        createElementDirectly({
          ...config,
          type: config.type
        });
      }
    }
  }, [setActiveTool, selectedElementIds, deleteElement, addToHistory, clearSelection, createElementDirectly]);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  const handleZoomIn = useCallback(() => {
    if (fabricCanvasRef.current) {
      const currentZoom = fabricCanvasRef.current.getZoom();
      const newZoom = Math.min(currentZoom * 1.1, 3);
      fabricCanvasRef.current.setZoom(newZoom);
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (fabricCanvasRef.current) {
      const currentZoom = fabricCanvasRef.current.getZoom();
      const newZoom = Math.max(currentZoom / 1.1, 0.1);
      fabricCanvasRef.current.setZoom(newZoom);
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  return (
    <div className={className}>
      {/* Canvas Toolbar */}      <CanvasToolbar
        activeTool={activeTool}
        selectedShape={selectedShape}
        showShapeDropdown={showShapeDropdown}
        dropdownPosition={dropdownPosition}
        dropdownRef={dropdownRef}
        onToolSelect={handleToolSelect}
        onShapeSelect={handleToolSelect}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canUndo={true}
        canRedo={true}
      />

      {/* Main canvas area */}
      <div 
        ref={canvasContainerRef}
        className="flex-1 relative bg-gray-50 overflow-hidden"
        style={{ minHeight: '400px' }}
      >
        {/* Status indicator */}
        <div className="absolute top-4 left-4 z-10 bg-white/90 px-3 py-2 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-700">
            Fabric.js Migration - Phase 2
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {status}
          </div>
          <div className="text-xs text-gray-500">
            Elements: {Object.keys(elements).length} | 
            Selected: {selectedElementIds.length} |
            Tool: {activeTool}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex items-center justify-center w-full h-full p-4">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-lg shadow-lg bg-white"
          />
        </div>

        {/* Instructions */}
        {isCanvasReady && Object.keys(elements).length === 0 && (
          <div className="absolute bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
            <h3 className="font-medium text-blue-900 mb-2">
              ✨ Fabric.js Migration Ready!
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Click toolbar buttons to create elements</li>
              <li>• Drag objects to move them</li>
              <li>• Double-click text to edit</li>
              <li>• Use handles to resize/rotate</li>
              <li>• Shift+click for multi-selection</li>
            </ul>
          </div>
        )}
      </div>

      {/* Debug info (development only) */}
      {import.meta.env.DEV && (
        <div className="bg-gray-100 border-t p-2 text-xs font-mono">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <strong>Canvas:</strong> {isCanvasReady ? '✅ Ready' : '⏳ Loading'}
            </div>
            <div>
              <strong>Elements:</strong> {Object.keys(elements).length}
            </div>
            <div>
              <strong>Selected:</strong> {selectedElementIds.join(', ') || 'None'}
            </div>
            <div>
              <strong>Editing:</strong> {typeof isEditingText === 'string' ? isEditingText : (isEditingText ? 'Yes' : 'None')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FabricCanvasMigration;
