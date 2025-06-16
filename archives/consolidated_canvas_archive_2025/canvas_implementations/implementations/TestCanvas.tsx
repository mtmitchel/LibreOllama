import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

const TestCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create a basic Fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff'
    });

    // Add a simple rectangle
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 2
    });
    canvas.add(rect);

    // Add text
    const text = new fabric.IText('THIS SHOULD BE VISIBLE', {
      left: 100,
      top: 250,
      fontSize: 30,
      fill: 'black'
    });
    canvas.add(text);

    // Log everything
    console.log('CANVAS TEST:', {
      canvas: canvas,
      objects: canvas.getObjects(),
      element: canvas.getElement(),
      backgroundColor: canvas.backgroundColor
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h1 style={{ color: 'black', marginBottom: '20px' }}>Basic Fabric.js Test</h1>
      <div style={{ border: '2px solid black', display: 'inline-block' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ marginTop: '20px', color: 'black' }}>
        You should see:<br />
        - A red rectangle with black border<br />
        - Black text saying "THIS SHOULD BE VISIBLE"
      </p>
    </div>
  );
};

export default TestCanvas;