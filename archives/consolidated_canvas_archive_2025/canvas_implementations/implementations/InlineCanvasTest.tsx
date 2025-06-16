/**
 * Ultra-simple inline test - no external CSS, no complexity
 */
import React, { useEffect, useRef } from 'react';

const InlineCanvasTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Use dynamic import to ensure Fabric is loaded
    import('fabric').then((fabricModule) => {
      const fabric = fabricModule;
      
      // Create canvas with inline element
      const canvas = new fabric.Canvas(canvasRef.current);
      
      // Set size after creation
      canvas.setWidth(800);
      canvas.setHeight(400);
      canvas.backgroundColor = 'white';
      
      // Add a big red square
      const rect = new fabric.Rect({
        left: 200,
        top: 100,
        width: 400,
        height: 200,
        fill: 'red'
      });
      canvas.add(rect);
      
      // Force render
      canvas.renderAll();
      
      // Log success
      console.log('INLINE TEST SUCCESS:', {
        canvas: canvas,
        objects: canvas.getObjects()
      });
    }).catch(error => {
      console.error('FABRIC IMPORT FAILED:', error);
    });
  }, []);

  return (
    <div>
      <h1>Inline Canvas Test</h1>
      <p>You should see a BIG RED RECTANGLE below:</p>
      <canvas 
        ref={canvasRef}
        width={800}
        height={400}
        style={{
          border: '5px solid black',
          display: 'block',
          backgroundColor: 'white'
        }}
      />
    </div>
  );
};

export default InlineCanvasTest;