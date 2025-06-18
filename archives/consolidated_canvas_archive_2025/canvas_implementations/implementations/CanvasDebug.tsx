/**
 * NUCLEAR OPTION - Complete Canvas Rewrite
 * This is a from-scratch implementation with maximum debugging
 */

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

const CanvasDebug: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string[]>([]);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);

  const addStatus = (message: string) => {
    console.log(`[CANVAS DEBUG] ${message}`);
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addStatus('useEffect started');
    
    if (!canvasRef.current) {
      addStatus('ERROR: Canvas ref is null');
      return;
    }

    addStatus('Canvas ref found, creating Fabric canvas...');

    try {
      // Create Fabric canvas with explicit settings
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        renderOnAddRemove: true,
        selection: true,
        preserveObjectStacking: true
      });

      addStatus(`Fabric canvas created: ${canvas ? 'SUCCESS' : 'FAILED'}`);
      
      // Store reference
      setFabricCanvas(canvas);

      // Add test objects
      addStatus('Adding test rectangle...');
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 100,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        selectable: true,
        hasControls: true,
        hasBorders: true
      });
      canvas.add(rect);
      addStatus('Rectangle added');

      addStatus('Adding test circle...');
      const circle = new fabric.Circle({
        left: 350,
        top: 100,
        radius: 50,
        fill: '#0000ff',
        stroke: '#000000',
        strokeWidth: 2,
        selectable: true,
        hasControls: true,
        hasBorders: true
      });
      canvas.add(circle);
      addStatus('Circle added');

      addStatus('Adding test text...');
      const text = new fabric.IText('CANVAS WORKS!', {
        left: 100,
        top: 250,
        fontSize: 30,
        fill: '#000000',
        selectable: true,
        hasControls: true,
        hasBorders: true
      });
      canvas.add(text);
      addStatus('Text added');

      // Force render
      canvas.renderAll();
      addStatus('Canvas rendered');

      // Log everything
      const debugInfo = {
        canvasElement: canvas.getElement(),
        canvasContext: canvas.getContext(),
        objects: canvas.getObjects().map(obj => ({
          type: obj.type,
          visible: obj.visible,
          left: obj.left,
          top: obj.top,
          fill: obj.fill
        })),
        backgroundColor: canvas.backgroundColor,
        dimensions: {
          width: canvas.getWidth(),
          height: canvas.getHeight()
        }
      };
      
      console.log('CANVAS DEBUG INFO:', debugInfo);
      addStatus(`Objects on canvas: ${canvas.getObjects().length}`);

      // Cleanup
      return () => {
        addStatus('Cleaning up canvas...');
        canvas.dispose();
      };
    } catch (error) {
      addStatus(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Canvas initialization error:', error);
    }
  }, []);

  const addNewObject = () => {
    if (!fabricCanvas) {
      addStatus('ERROR: No fabric canvas available');
      return;
    }

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const rect = new fabric.Rect({
      left: Math.random() * 600,
      top: Math.random() * 400,
      width: 100,
      height: 100,
      fill: randomColor,
      stroke: '#000000',
      strokeWidth: 2
    });
    
    fabricCanvas.add(rect);
    fabricCanvas.renderAll();
    addStatus(`Added new rectangle with color ${randomColor}`);
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#000000', marginBottom: '20px' }}>Canvas Debug Mode</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={addNewObject}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add Random Rectangle
        </button>
      </div>

      <div style={{ 
        border: '3px solid #000000', 
        display: 'inline-block',
        backgroundColor: '#ffffff',
        marginBottom: '20px'
      }}>
        <canvas ref={canvasRef} />
      </div>

      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '20px', 
        borderRadius: '8px',
        maxWidth: '800px'
      }}>
        <h2 style={{ color: '#000000' }}>Debug Status:</h2>
        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: '12px',
          maxHeight: '300px',
          overflow: 'auto',
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {status.map((msg, i) => (
            <div key={i} style={{ color: msg.includes('ERROR') ? 'red' : 'black' }}>
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CanvasDebug;
