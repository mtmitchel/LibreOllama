/**
 * Fabric.js Canvas Component - Phase 2 Migration
 * Integrates Fabric.js with the new FabricCanvasStore and element creation system
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFabricCanvasStore, FabricCanvasElement } from '../stores/fabricCanvasStore';
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
  const fabricCanvas = useFabricCanvasStore((state) => state.fabricCanvas);
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
  const clearSelection = useFabricCanvasStore((state) => state.clearSelection);

  // Local state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [status, setStatus] = useState('Initializing Fabric.js canvas...');

  // Element creation
  const generateId = useCallback(() => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const { createElementDirectly } = useFabricElementCreation(
    useFabricCanvasStore,
    generateId,
    canvasContainerRef
  );

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const initCanvas = async () => {
      try {
        setStatus('Creating Fabric.js canvas...');

        const canvas = new fabric.Canvas(canvasRef.current, {
          width: canvasSize.width,
          height: canvasSize.height,
          backgroundColor: '#f8f9fa',
          selection: true,
          enableRetinaScaling: true,
          imageSmoothingEnabled: false,
        });

        fabricCanvasRef.current = canvas;
        setFabricCanvas(canvas);

        setStatus('Setting up event listeners...');

        // Object selection events
        canvas.on('selection:created', (e) => {
          const selectedObjects = e.selected || [];
          const selectedIds = selectedObjects
            .map(obj => obj.get('customId'))
            .filter(id => id) as string[];
          
          setSelectedElementIds(selectedIds);
          console.log('Fabric: Selection created:', selectedIds);
        });

        canvas.on('selection:updated', (e) => {
          const selectedObjects = e.selected || [];
          const selectedIds = selectedObjects
            .map(obj => obj.get('customId'))
            .filter(id => id) as string[];
          
          setSelectedElementIds(selectedIds);
          console.log('Fabric: Selection updated:', selectedIds);
        });

        canvas.on('selection:cleared', () => {
          setSelectedElementIds([]);
          console.log('Fabric: Selection cleared');
        });

        // Object modification events
        canvas.on('object:modified', (e) => {
          const fabricObject = e.target;
          const customId = fabricObject?.get('customId') as string;
          
          if (customId && fabricObject) {
            // Update our store when object is modified in Fabric.js
            const updates: Partial<FabricCanvasElement> = {
              x: fabricObject.left || 0,
              y: fabricObject.top || 0,
              width: fabricObject.width || 0,
              height: fabricObject.height || 0,
            };

            // Handle rotation and scaling
            if (fabricObject.angle) {
              updates.angle = fabricObject.angle;
            }
            if (fabricObject.scaleX && fabricObject.scaleY) {
              updates.scaleX = fabricObject.scaleX;
              updates.scaleY = fabricObject.scaleY;
            }

            updateElement(customId, updates);
            addToHistory(useFabricCanvasStore.getState().elements);
            console.log('Fabric: Object modified:', customId, updates);
          }
        });

        // Text editing events
        canvas.on('text:editing:entered', (e) => {
          const fabricObject = e.target;
          const customId = fabricObject?.get('customId') as string;
          
          if (customId) {
            setIsEditingText(customId);
            console.log('Fabric: Text editing started:', customId);
          }
        });

        canvas.on('text:editing:exited', (e) => {
          const fabricObject = e.target;
          const customId = fabricObject?.get('customId') as string;
          
          if (customId && fabricObject instanceof fabric.IText) {
            // Update text content in our store
            updateElement(customId, { content: fabricObject.text });
            setIsEditingText(null);
            addToHistory(useFabricCanvasStore.getState().elements);
            console.log('Fabric: Text editing finished:', customId, fabricObject.text);
          }
        });

        // Object movement events
        canvas.on('object:moving', (e) => {
          const fabricObject = e.target;
          const customId = fabricObject?.get('customId') as string;
          
          if (customId) {
            console.log('Fabric: Object moving:', customId);
          }
        });

        // Double-click to edit text
        canvas.on('mouse:dblclick', (e) => {
          const target = e.target;
          if (target && target instanceof fabric.IText) {
            target.enterEditing();
          }
        });

        setStatus('Canvas ready! Try creating some elements.');
        setCanvasReady(true);

        console.log('🎉 Fabric.js canvas migration component initialized successfully!');
        console.log('Canvas size:', canvas.getWidth(), 'x', canvas.getHeight());

      } catch (error) {
        console.error('Failed to initialize Fabric.js canvas:', error);
        setStatus('❌ Failed to initialize canvas');
      }
    };

    initCanvas();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
        setFabricCanvas(null);
        setCanvasReady(false);
      }
    };
  }, [canvasSize, setFabricCanvas, setCanvasReady, setSelectedElementIds, setIsEditingText, updateElement, addToHistory]);

  // Handle canvas resize
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      const newSize = {
        width: Math.max(400, rect.width - 20), // Leave some margin
        height: Math.max(300, rect.height - 100), // Leave space for toolbar
      };

      setCanvasSize(newSize);

      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setDimensions(newSize);
        fabricCanvasRef.current.renderAll();
      }
    };

    // Initial size
    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Canvas toolbar handlers
  const handleToolSelect = useCallback((toolId: string) => {
    if (toolId === 'select') {
      setActiveTool('select');
    } else if (toolId === 'delete') {
      // Delete selected elements
      selectedElementIds.forEach(id => {
        deleteElement(id);
      });
      if (selectedElementIds.length > 0) {
        addToHistory(useFabricCanvasStore.getState().elements);
      }
      clearSelection();
    } else if (DEFAULT_ELEMENT_CONFIGS[toolId]) {
      // Create element using the new system
      createElementDirectly(DEFAULT_ELEMENT_CONFIGS[toolId]);
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
      const newZoom = Math.min(currentZoom * 1.1, 3); // Max zoom 3x
      fabricCanvasRef.current.setZoom(newZoom);
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (fabricCanvasRef.current) {
      const currentZoom = fabricCanvasRef.current.getZoom();
      const newZoom = Math.max(currentZoom / 1.1, 0.1); // Min zoom 0.1x
      fabricCanvasRef.current.setZoom(newZoom);
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  return (
    <div className={className}>
      {/* Canvas Toolbar */}
      <CanvasToolbar
        activeTool={activeTool}
        onToolSelect={handleToolSelect}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canUndo={true} // TODO: Implement proper history tracking
        canRedo={true} // TODO: Implement proper history tracking
        selectedElementIds={selectedElementIds}
        onShapeSelect={handleToolSelect}
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
              <strong>Editing:</strong> {isEditingText || 'None'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FabricCanvasMigration;
