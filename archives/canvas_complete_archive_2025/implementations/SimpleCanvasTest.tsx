import React, { useRef, useEffect, useState } from 'react';
import * as fabric from 'fabric';

const SimpleCanvasTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [info, setInfo] = useState<string>('Initializing...');

  const log = (message: string) => {
    console.log(message);
    setInfo(prev => prev + '\n' + message);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Create Fabric canvas with minimal options
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true
      });

      setFabricCanvas(canvas);
      log('✅ Canvas created successfully');

      // Add test objects immediately
      setTimeout(() => {
        try {
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
          log('✅ Added red rectangle');

          // Blue text
          const text = new fabric.IText('SIMPLE TEST', {
            left: 300,
            top: 150,
            fontSize: 24,
            fill: '#0000ff',
            fontWeight: 'bold'
          });

          canvas.add(text);
          log('✅ Added blue text');

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
          log('✅ Added green circle');

          // Force render
          canvas.renderAll();
          log('✅ Canvas rendered');

          // Log state
          log(`📊 Objects: ${canvas.getObjects().length}`);
          log(`📊 Zoom: ${canvas.getZoom()}`);
          log(`📊 Viewport: [${canvas.viewportTransform.join(', ')}]`);

        } catch (error) {
          log(`❌ Error adding objects: ${error}`);
        }
      }, 100);

      return () => {
        canvas.dispose();
      };
    } catch (error) {
      log(`❌ Error creating canvas: ${error}`);
    }
  }, []);

  const addMoreObjects = () => {
    if (!fabricCanvas) return;

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
    log(`✅ Added random rectangle - total objects: ${fabricCanvas.getObjects().length}`);
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    log('🧹 Canvas cleared');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🧪 Simple Canvas Test</h1>
      
      <div className="mb-4">
        <button 
          onClick={addMoreObjects}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600"
        >
          Add Random Object
        </button>
        <button 
          onClick={clearCanvas}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear Canvas
        </button>
      </div>

      <div className="border-4 border-red-500 inline-block bg-white p-2">
        <canvas
          ref={canvasRef}
          className="border border-black"
          style={{ display: 'block' }}
        />
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded max-w-2xl">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <pre className="text-sm whitespace-pre-wrap">{info}</pre>
      </div>
    </div>
  );
};

export default SimpleCanvasTest;
