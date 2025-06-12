import React, { useRef, useEffect, useState } from 'react';
import * as fabric from 'fabric';

const FinalWorkingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [status, setStatus] = useState('Initializing...');
  const [objectCount, setObjectCount] = useState(0);

  useEffect(() => {
    let canvas: fabric.Canvas | null = null;

    const initCanvas = async () => {
      try {
        if (!canvasRef.current) {
          setStatus('❌ Canvas element not found');
          return;
        }

        // Clean up any existing instance
        const existing = (canvasRef.current as any).__fabric;
        if (existing) {
          try {
            existing.dispose();
          } catch (e) {
            // Ignore disposal errors
          }
        }

        setStatus('🔄 Creating canvas...');
        
        canvas = new fabric.Canvas(canvasRef.current, {
          width: 1200,
          height: 800,
          backgroundColor: '#ffffff'
        });

        setFabricCanvas(canvas);
        setStatus('✅ Canvas ready!');

        // Add test objects
        setTimeout(() => {
          if (!canvas) return;
          
          const rect = new fabric.Rect({
            left: 100,
            top: 100,
            width: 150,
            height: 100,
            fill: '#ff0000',
            stroke: '#000',
            strokeWidth: 2
          });
          canvas.add(rect);

          const text = new fabric.IText('WORKING!', {
            left: 300,
            top: 150,
            fontSize: 24,
            fill: '#0000ff'
          });
          canvas.add(text);

          const circle = new fabric.Circle({
            left: 150,
            top: 250,
            radius: 50,
            fill: '#00ff00',
            stroke: '#000',
            strokeWidth: 2
          });
          canvas.add(circle);

          canvas.renderAll();
          setObjectCount(canvas.getObjects().length);
          setStatus(`🎉 SUCCESS! ${canvas.getObjects().length} objects`);
        }, 100);

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

  const addRect = () => {
    if (!fabricCanvas) return;
    const rect = new fabric.Rect({
      left: Math.random() * 800 + 50,
      top: Math.random() * 400 + 50,
      width: 80,
      height: 60,
      fill: `#${Math.floor(Math.random()*16777215).toString(16)}`
    });
    fabricCanvas.add(rect);
    fabricCanvas.renderAll();
    setObjectCount(fabricCanvas.getObjects().length);
  };

  const clear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    setObjectCount(0);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🎨 Working Canvas</h1>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded text-sm ${
              status.includes('SUCCESS') ? 'bg-green-100 text-green-800' :
              status.includes('Error') ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {status}
            </span>
            <span className="text-sm bg-gray-100 px-2 py-1 rounded">
              Objects: {objectCount}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-3 border-b">
        <div className="flex gap-3">
          <button
            onClick={addRect}
            disabled={!fabricCanvas}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Add Rectangle
          </button>
          <button
            onClick={clear}
            disabled={!fabricCanvas}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-100 p-6">
        <div className="border-4 border-blue-500 bg-white shadow-lg">
          <canvas ref={canvasRef} className="block" />
        </div>
      </div>

      <div className="bg-white border-t p-3">
        <div className="text-sm text-gray-600 text-center">
          Canvas Working - StrictMode Compatible
        </div>
      </div>
    </div>
  );
};

export default FinalWorkingCanvas;
