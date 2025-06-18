import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

const SimpleFabricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric canvas with simple, direct configuration
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth - 256, // Account for sidebar
      height: window.innerHeight - 64, // Account for topbar
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
    });

    fabricRef.current = canvas;

    // Add basic tools functionality
    const addText = () => {
      const text = new fabric.IText('New Text', {
        left: 100,
        top: 100,
        fontSize: 20,
        fill: '#000000',
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      canvas.renderAll();
    };

    const addRectangle = () => {
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 100,
        fill: '#e3f2fd',
        stroke: '#333333',
        strokeWidth: 2,
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
    };

    const addCircle = () => {
      const circle = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: '#f3e5f5',
        stroke: '#333333',
        strokeWidth: 2,
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      canvas.renderAll();
    };

    const deleteSelected = () => {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length > 0) {
        activeObjects.forEach(obj => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    };

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);

    // Store functions for button access
    (window as any).canvasTools = {
      addText,
      addRectangle,
      addCircle,
      deleteSelected,
    };

    // Handle window resize
    const handleResize = () => {
      canvas.setWidth(window.innerWidth - 256);
      canvas.setHeight(window.innerHeight - 64);
      canvas.renderAll();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      delete (window as any).canvasTools;
      canvas.dispose();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Simple Toolbar */}
      <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200">
        <button
          onClick={() => (window as any).canvasTools?.addText()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add Text
        </button>
        <button
          onClick={() => (window as any).canvasTools?.addRectangle()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Add Rectangle
        </button>
        <button
          onClick={() => (window as any).canvasTools?.addCircle()}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Add Circle
        </button>
        <div className="ml-auto">
          <button
            onClick={() => (window as any).canvasTools?.deleteSelected()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete Selected
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default SimpleFabricCanvas;
