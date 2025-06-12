import React, { useRef, useEffect, useState } from 'react';
import * as fabric from 'fabric';

interface CanvasProps {
  className?: string;
}

const WorkingCanvas: React.FC<CanvasProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  useEffect(() => {
    let canvas: fabric.Canvas | null = null;

    const initCanvas = async () => {
      try {
        if (!canvasRef.current) {
          setStatus('❌ Canvas element not found');
          return;
        }

        // Check if canvas is already initialized
        if (fabricCanvas) {
          setStatus('✅ Canvas already initialized');
          return;
        }

        // Check for existing fabric instance
        const existingCanvas = (canvasRef.current as any).__fabric;
        if (existingCanvas) {
          console.log('🔄 Disposing existing canvas instance');
          try {
            existingCanvas.dispose();
          } catch (e) {
            console.warn('Error disposing existing canvas:', e);
          }
        }

        setStatus('🔄 Creating Fabric canvas...');
        
        canvas = new fabric.Canvas(canvasRef.current, {
          width: 1200,
          height: 800,
          backgroundColor: '#ffffff',
          selection: true,
          preserveObjectStacking: true
        });

        setFabricCanvas(canvas);
        setIsReady(true);
        setStatus('✅ Canvas ready!');        // Add test objects
        setTimeout(() => {
          if (!canvas) return;
          
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
          const text = new fabric.IText('WORKING CANVAS!', {
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

    // Cleanup function
    return () => {
      if (canvas) {
        try {
          canvas.dispose();
          canvas = null;
        } catch (e) {
          console.warn('Error disposing canvas on cleanup:', e);
        }
      }
    };
  }, []); // Empty dependency array to run only once

  const addRandomRect = () => {
    if (!fabricCanvas) return;
    
    const rect = new fabric.Rect({
      left: Math.random() * 800 + 50,
      top: Math.random() * 400 + 50,
      width: 80,
      height: 60,
      fill: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      stroke: '#000000',
      strokeWidth: 1
    });

    fabricCanvas.add(rect);
    fabricCanvas.renderAll();
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
  };

  return (
    <div className={`flex flex-col h-screen ${className}`}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
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
            <span className="text-sm text-gray-600">
              Objects: {fabricCanvas?.getObjects?.()?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-100 px-6 py-3 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={addRandomRect}
            disabled={!isReady}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Add Rectangle
          </button>
          <button
            onClick={clearCanvas}
            disabled={!isReady}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="border-4 border-blue-500 bg-white shadow-lg">
          <canvas
            ref={canvasRef}
            className="block"
            style={{ cursor: 'default' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t px-6 py-2">
        <div className="text-sm text-gray-600">
          Canvas Ready: {isReady ? '✅ YES' : '❌ NO'} | 
          Zoom: {fabricCanvas?.getZoom?.()?.toFixed(2) || 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default WorkingCanvas;
