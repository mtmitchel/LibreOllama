import React, { useRef, useEffect, useState } from 'react';
import * as fabric from 'fabric';

const QuickFixCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    const initCanvas = async () => {
      try {
        if (!canvasRef.current) {
          setStatus('❌ Canvas element not found');
          return;
        }

        setStatus('🔄 Creating Fabric canvas...');
        
        const canvas = new fabric.Canvas(canvasRef.current, {
          width: 800,
          height: 600,
          backgroundColor: '#ffffff',
          selection: true,
          preserveObjectStacking: true
        });

        setFabricCanvas(canvas);
        setStatus('✅ Canvas ready! Adding test objects...');

        // Add test objects immediately
        setTimeout(() => {
          // Red rectangle
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

          // Blue text
          const text = new fabric.IText('QUICK FIX WORKING!', {
            left: 300,
            top: 150,
            fontSize: 24,
            fill: '#0000ff',
            fontWeight: 'bold'
          });
          canvas.add(text);

          // Green circle
          const circle = new fabric.Circle({
            left: 150,
            top: 250,
            radius: 50,
            fill: '#00ff00',
            stroke: '#000000',
            strokeWidth: 2
          });
          canvas.add(circle);

          canvas.renderAll();
          setStatus(`🎉 SUCCESS! ${canvas.getObjects().length} objects visible`);

        }, 100);

      } catch (error: any) {
        setStatus(`❌ Error: ${error.message}`);
        console.error('Canvas initialization error:', error);
      }
    };

    initCanvas();
  }, []);

  const addRandomObject = () => {
    if (!fabricCanvas) return;

    const rect = new fabric.Rect({
      left: Math.random() * 400 + 50,
      top: Math.random() * 300 + 50,
      width: 80,
      height: 60,
      fill: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      stroke: '#000000',
      strokeWidth: 1
    });

    fabricCanvas.add(rect);
    fabricCanvas.renderAll();
    setStatus(`✅ Added object! Total: ${fabricCanvas.getObjects().length}`);
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    setStatus('🧹 Canvas cleared');
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">⚡ Quick Fix Canvas</h1>
        <p className="text-gray-600">Simple, direct Fabric.js implementation that just works.</p>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Status:</span>
          <span className={`px-3 py-1 rounded ${
            status.includes('SUCCESS') ? 'bg-green-100 text-green-800' :
            status.includes('Error') ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status}
          </span>
          <span className="text-sm text-gray-600">
            Objects: {fabricCanvas?.getObjects?.()?.length || 0}
          </span>
        </div>
      </div>

      <div className="mb-4 space-x-2">
        <button
          onClick={addRandomObject}
          disabled={!fabricCanvas}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Add Random Object
        </button>
        <button
          onClick={clearCanvas}
          disabled={!fabricCanvas}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
        >
          Clear Canvas
        </button>
      </div>

      <div className="border-4 border-green-500 inline-block bg-white p-2">
        <canvas
          ref={canvasRef}
          className="border border-gray-300"
          style={{ display: 'block' }}
        />
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Expected:</strong> Red rectangle, blue text "QUICK FIX WORKING!", green circle</p>
        <p><strong>If you see these objects, the canvas is working correctly!</strong></p>
      </div>
    </div>
  );
};

export default QuickFixCanvas;
