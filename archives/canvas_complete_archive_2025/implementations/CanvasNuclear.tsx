import React, { useRef, useEffect, useState } from 'react';
import * as fabric from 'fabric';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import { useFabricCanvasStore, CanvasTool } from '../stores/fabricCanvasStore';

const CanvasNuclear: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [info, setInfo] = useState('Initializing...');

  // Store state
  const activeTool = useFabricCanvasStore((state) => state.activeTool);
  const setActiveTool = useFabricCanvasStore((state) => state.setActiveTool);

  const log = (message: string) => {
    console.log(`🚀 NUCLEAR: ${message}`);
    setInfo(prev => prev + '\n' + message);
  };

  // NUCLEAR CANVAS INITIALIZATION - NO HOOKS, NO COMPLEXITY
  useEffect(() => {
    if (!canvasRef.current) {
      log('❌ Canvas ref not available');
      return;
    }

    log('🎯 Starting NUCLEAR canvas initialization...');

    try {
      // Create canvas with minimal options
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        selection: true
      });

      log('✅ Fabric canvas created successfully');

      // Immediately add test objects
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 150,
        height: 100,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2
      });
      canvas.add(rect);
      log('✅ Red rectangle added');

      const text = new fabric.IText('NUCLEAR TEST - SUCCESS!', {
        left: 300,
        top: 150,
        fontSize: 24,
        fill: '#0000ff',
        fontWeight: 'bold'
      });
      canvas.add(text);
      log('✅ Blue text added');

      const circle = new fabric.Circle({
        left: 150,
        top: 250,
        radius: 50,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 2
      });
      canvas.add(circle);
      log('✅ Green circle added');

      // Force render
      canvas.renderAll();
      log('🎨 Canvas rendered with objects');

      // Set state
      setFabricCanvas(canvas);
      setIsReady(true);
      
      // Update store
      useFabricCanvasStore.getState().setFabricCanvas(canvas);
      useFabricCanvasStore.getState().setCanvasReady(true);

      log('🎉 NUCLEAR CANVAS INITIALIZATION COMPLETE!');

      return () => {
        canvas.dispose();
        log('🧹 Canvas disposed');
      };

    } catch (error) {
      log(`❌ NUCLEAR INITIALIZATION FAILED: ${error}`);
      console.error('Nuclear canvas error:', error);
    }
  }, []);

  const addRandomObject = () => {
    if (!fabricCanvas) {
      log('❌ Canvas not ready for adding objects');
      return;
    }

    const randomRect = new fabric.Rect({
      left: Math.random() * 400 + 50,
      top: Math.random() * 300 + 50,
      width: 80,
      height: 60,
      fill: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      stroke: '#000000',
      strokeWidth: 1
    });

    fabricCanvas.add(randomRect);
    fabricCanvas.renderAll();
    log(`✅ Added random object - total: ${fabricCanvas.getObjects().length}`);
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    log('🧹 Canvas cleared');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Simple toolbar */}
      <div className="bg-white border-b p-4 flex gap-4 items-center">
        <h1 className="text-xl font-bold text-red-600">🚀 NUCLEAR CANVAS</h1>
        <button 
          onClick={addRandomObject}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={!isReady}
        >
          Add Random Object
        </button>
        <button 
          onClick={clearCanvas}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          disabled={!isReady}
        >
          Clear Canvas
        </button>
        <div className={`px-3 py-1 rounded text-sm ${isReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isReady ? '✅ WORKING' : '⏳ Loading...'}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <canvas
            ref={canvasRef}
            className="border-2 border-red-500"
            style={{ display: 'block' }}
          />
        </div>
      </div>

      {/* Debug info */}
      <div className="bg-white border-t p-4 max-h-32 overflow-y-auto">
        <h3 className="font-bold mb-2">Nuclear Debug Log:</h3>
        <pre className="text-xs whitespace-pre-wrap text-gray-600">{info}</pre>
      </div>
    </div>
  );
};

export default CanvasNuclear;
