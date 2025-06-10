// src/pages/FabricCanvasPoC.tsx
/**
 * Fabric.js Canvas Proof of Concept
 * 
 * This component demonstrates basic Fabric.js functionality to validate
 * that it can replace our current PIXI.js implementation and solve
 * our core dragging and interaction issues.
 * 
 * Key features to test:
 * - Object creation (rectangles, circles, text)
 * - Drag and drop (should work out-of-the-box)
 * - Selection and multi-selection
 * - Text editing
 * - Basic canvas operations (zoom, pan)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, Rect, Circle, IText, Triangle, version } from 'fabric';

const FabricCanvasPoC: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [objectCount, setObjectCount] = useState(0);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      console.log('Initializing Fabric.js canvas...');
      
      const canvas = new Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight - 100, // Space for toolbar
        backgroundColor: '#f8f9fa',
        selection: true, // Enable group selection
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = canvas;

      // Test: Add a draggable rectangle
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: '#FF6B6B',
        width: 150,
        height: 100,
        stroke: '#333',
        strokeWidth: 2,
        rx: 10, // Rounded corners
        ry: 10,
      });
      canvas.add(rect);

      // Test: Add a draggable circle
      const circle = new Circle({
        left: 300,
        top: 150,
        fill: '#4ECDC4',
        radius: 50,
        stroke: '#333',
        strokeWidth: 2,
      });
      canvas.add(circle);

      // Test: Add editable text
      const text = new IText('Double-click to edit this text!', {
        left: 100,
        top: 250,
        fontSize: 20,
        fill: '#333',
        fontFamily: 'Arial',
        editable: true,
      });
      canvas.add(text);

      // Test: Add a triangle
      const triangle = new Triangle({
        left: 500,
        top: 100,
        fill: '#FFE66D',
        width: 100,
        height: 100,
        stroke: '#333',
        strokeWidth: 2,
      });
      canvas.add(triangle);

      // Listen for object events to test interactivity
      canvas.on('object:added', () => {
        setObjectCount(canvas.getObjects().length);
      });

      canvas.on('object:removed', () => {
        setObjectCount(canvas.getObjects().length);
      });

      canvas.on('object:moving', (e) => {
        console.log('Object moving:', e.target?.type);
      });

      canvas.on('object:scaling', (e) => {
        console.log('Object scaling:', e.target?.type);
      });

      canvas.on('text:editing:entered', () => {
        console.log('Text editing started');
      });

      canvas.on('text:editing:exited', () => {
        console.log('Text editing finished');
      });

      setIsReady(true);
      setObjectCount(canvas.getObjects().length);
    }

    // Handle window resize
    const handleResize = () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setDimensions({
          width: window.innerWidth,
          height: window.innerHeight - 100,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // Test functions for various canvas operations
  const addRectangle = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const rect = new fabric.Rect({
      left: Math.random() * 400 + 50,
      top: Math.random() * 300 + 50,
      fill: `hsl(${Math.random() * 360}, 70%, 60%)`,
      width: 100 + Math.random() * 100,
      height: 60 + Math.random() * 60,
      stroke: '#333',
      strokeWidth: 2,
      rx: 5,
      ry: 5,
    });

    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    fabricCanvasRef.current.renderAll();
  }, []);

  const addCircle = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const circle = new fabric.Circle({
      left: Math.random() * 400 + 50,
      top: Math.random() * 300 + 50,
      fill: `hsl(${Math.random() * 360}, 70%, 60%)`,
      radius: 30 + Math.random() * 40,
      stroke: '#333',
      strokeWidth: 2,
    });

    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
    fabricCanvasRef.current.renderAll();
  }, []);

  const addText = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const text = new fabric.IText('New Text Element', {
      left: Math.random() * 400 + 50,
      top: Math.random() * 300 + 50,
      fontSize: 16 + Math.random() * 16,
      fill: '#333',
      fontFamily: 'Arial',
      editable: true,
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    text.enterEditing();
    fabricCanvasRef.current.renderAll();
  }, []);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    fabricCanvasRef.current.remove(...activeObjects);
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();
  }, []);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.backgroundColor = '#f8f9fa';
    fabricCanvasRef.current.renderAll();
  }, []);
  const enablePanning = useCallback(() => {
    console.log('Panning enabled - use mouse wheel to zoom, drag canvas background to pan');
    // Note: Basic panning will work with default Fabric.js behavior
    // For advanced panning, we can implement it in Phase 2
  }, []);

  const resetView = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    fabricCanvasRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvasRef.current.renderAll();
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Simple Toolbar */}
      <div style={{
        padding: '10px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>Fabric.js Proof of Concept</h2>
        
        <div style={{ display: 'flex', gap: '5px' }}>
          <button 
            onClick={addRectangle}
            style={{ padding: '8px 12px', backgroundColor: '#FF6B6B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Rectangle
          </button>
          <button 
            onClick={addCircle}
            style={{ padding: '8px 12px', backgroundColor: '#4ECDC4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Circle
          </button>
          <button 
            onClick={addText}
            style={{ padding: '8px 12px', backgroundColor: '#45B7D1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Text
          </button>
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
          <button 
            onClick={deleteSelected}
            style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Delete Selected
          </button>
          <button 
            onClick={clearCanvas}
            style={{ padding: '8px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear All
          </button>
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
          <button 
            onClick={enablePanning}
            style={{ padding: '8px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Enable Pan (Alt+Drag)
          </button>
          <button 
            onClick={resetView}
            style={{ padding: '8px 12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reset View
          </button>
        </div>

        <div style={{ marginLeft: 'auto', color: '#666' }}>
          Status: {isReady ? 'Ready' : 'Loading...'} | Objects: {objectCount}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        padding: '10px',
        backgroundColor: '#e3f2fd',
        borderBottom: '1px solid #ddd',
        fontSize: '14px',
        color: '#0d47a1'
      }}>
        <strong>Test Instructions:</strong> 
        • Drag objects around (should work smoothly out-of-the-box) 
        • Double-click text to edit 
        • Hold Shift to select multiple objects 
        • Use Alt+Drag to pan the canvas 
        • Right-click for context menu (if available)
      </div>

      {/* Canvas Container */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas 
          ref={canvasRef}
          style={{ 
            display: 'block',
            border: '1px solid #ddd',
            cursor: 'default'
          }}
        />
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div><strong>Fabric.js PoC Debug</strong></div>
          <div>Canvas Ready: {isReady ? 'Yes' : 'No'}</div>
          <div>Objects: {objectCount}</div>
          <div>Fabric Version: {(fabric as any).version || 'Unknown'}</div>
        </div>
      )}
    </div>
  );
};

export default FabricCanvasPoC;
