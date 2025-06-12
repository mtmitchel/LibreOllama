/**
 * Canvas Diagnostic Component
 * Tests Fabric.js canvas rendering and element creation
 */

import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

export const CanvasDiagnostic: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 400,
      backgroundColor: '#ffffff',
      selection: true,
    });
    fabricRef.current = canvas;

    // Test 1: Add text
    const text = new fabric.IText('Canvas Test - If you see this, text rendering works!', {
      left: 50,
      top: 50,
      fill: '#000000',
      fontSize: 20,
      fontWeight: 'bold',
    });
    canvas.add(text);

    // Test 2: Add rectangle
    const rect = new fabric.Rect({
      left: 50,
      top: 100,
      width: 200,
      height: 100,
      fill: '#00ff00',
      stroke: '#000000',
      strokeWidth: 2,
    });
    canvas.add(rect);

    // Test 3: Add circle
    const circle = new fabric.Circle({
      left: 300,
      top: 100,
      radius: 50,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 2,
    });
    canvas.add(circle);

    // Test 4: Add line
    const line = new fabric.Line([400, 100, 500, 200], {
      stroke: '#0000ff',
      strokeWidth: 3,
    });
    canvas.add(line);

    // Log canvas state
    console.log('Canvas Diagnostic:', {
      canvasElement: canvas.getElement(),
      objects: canvas.getObjects().map(obj => ({
        type: obj.type,
        visible: obj.visible,
        opacity: obj.opacity,
        fill: obj.fill,
      })),
      backgroundColor: canvas.backgroundColor,
      dimensions: {
        width: canvas.getWidth(),
        height: canvas.getHeight(),
      }
    });

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-xl font-bold mb-4">Canvas Diagnostic Test</h2>
      <div className="border-2 border-gray-300 inline-block">
        <canvas ref={canvasRef} />
      </div>
      <div className="mt-4 text-sm">
        <p>You should see:</p>
        <ul className="list-disc ml-6">
          <li>Black text saying "Canvas Test..."</li>
          <li>A green rectangle with black border</li>
          <li>A red circle with black border</li>
          <li>A blue line</li>
        </ul>
      </div>
    </div>
  );
};