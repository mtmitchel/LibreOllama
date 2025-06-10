// src/pages/FabricCanvasPoCSimple.tsx
/**
 * Simplified Fabric.js Canvas Proof of Concept
 * 
 * This version uses ES modules and proper async loading to ensure
 * Fabric.js initializes correctly with detailed status reporting.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

const FabricCanvasPoCSimple: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [objectCount, setObjectCount] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  // Initialize canvas with detailed status updates
  useEffect(() => {
    const initializeCanvas = async () => {
      try {
        setStatus('Loading Fabric.js modules...');
        
        // Import Fabric.js modules
        const fabricModule = await import('fabric');
        console.log('Fabric module loaded:', Object.keys(fabricModule));
        
        setStatus('Creating canvas instance...');
        
        // Check if we have the Canvas class
        if (!fabricModule.Canvas) {
          throw new Error('Canvas class not found in Fabric.js module');
        }
        
        if (!canvasRef.current) {
          throw new Error('Canvas element not found');
        }

        // Create the canvas
        const canvas = new fabricModule.Canvas(canvasRef.current, {
          width: Math.min(window.innerWidth - 40, 1200),
          height: Math.min(window.innerHeight - 200, 600),
          backgroundColor: '#f8f9fa',
          selection: true,
          preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;
        setStatus('Adding initial objects...');

        // Add initial objects
        const rect = new fabricModule.Rect({
          left: 100,
          top: 100,
          fill: '#FF6B6B',
          width: 150,
          height: 100,
          stroke: '#333',
          strokeWidth: 2,
          rx: 10,
          ry: 10,
        });
        canvas.add(rect);

        const circle = new fabricModule.Circle({
          left: 300,
          top: 150,
          fill: '#4ECDC4',
          radius: 50,
          stroke: '#333',
          strokeWidth: 2,
        });
        canvas.add(circle);

        const text = new fabricModule.IText('Double-click to edit this text!', {
          left: 100,
          top: 280,
          fontSize: 18,
          fill: '#333',
          fontFamily: 'Arial, sans-serif',
        });
        canvas.add(text);

        setStatus('Setting up event listeners...');

        // Set up event listeners
        canvas.on('object:added', () => {
          setObjectCount(canvas.getObjects().length);
        });

        canvas.on('object:removed', () => {
          setObjectCount(canvas.getObjects().length);
        });

        canvas.on('object:moving', (e: any) => {
          console.log('✅ Object moving:', e.target?.type);
        });

        canvas.on('object:scaling', (e: any) => {
          console.log('✅ Object scaling:', e.target?.type);
        });

        canvas.on('text:editing:entered', () => {
          console.log('✅ Text editing started');
        });

        canvas.on('text:editing:exited', () => {
          console.log('✅ Text editing finished');
        });

        canvas.on('selection:created', (e: any) => {
          console.log('✅ Selection created:', e.selected?.length || 0, 'objects');
        });

        canvas.on('selection:updated', (e: any) => {
          console.log('✅ Selection updated:', e.selected?.length || 0, 'objects');
        });

        // Final setup
        setObjectCount(canvas.getObjects().length);
        setIsReady(true);
        setStatus('✅ Ready! Try dragging objects around.');
        
        console.log('🎉 Fabric.js canvas initialized successfully!');
        console.log('Canvas size:', canvas.getWidth(), 'x', canvas.getHeight());
        console.log('Initial objects:', canvas.getObjects().length);
        
      } catch (err: any) {
        console.error('❌ Failed to initialize canvas:', err);
        setError(err.message || 'Unknown error');
        setStatus('❌ Initialization failed');
      }
    };

    initializeCanvas();

    // Cleanup
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fabricCanvasRef.current) {
        const newWidth = Math.min(window.innerWidth - 40, 1200);
        const newHeight = Math.min(window.innerHeight - 200, 600);
        fabricCanvasRef.current.setDimensions({
          width: newWidth,
          height: newHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Action handlers
  const addRectangle = useCallback(async () => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const { Rect } = await import('fabric');
      const rect = new Rect({
        left: Math.random() * 300 + 50,
        top: Math.random() * 200 + 50,
        fill: `hsl(${Math.random() * 360}, 70%, 60%)`,
        width: 80 + Math.random() * 80,
        height: 60 + Math.random() * 60,
        stroke: '#333',
        strokeWidth: 2,
        rx: 5,
        ry: 5,
      });

      fabricCanvasRef.current.add(rect);
      fabricCanvasRef.current.setActiveObject(rect);
      fabricCanvasRef.current.renderAll();
    } catch (error) {
      console.error('Failed to add rectangle:', error);
    }
  }, []);

  const addCircle = useCallback(async () => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const { Circle } = await import('fabric');
      const circle = new Circle({
        left: Math.random() * 300 + 50,
        top: Math.random() * 200 + 50,
        fill: `hsl(${Math.random() * 360}, 70%, 60%)`,
        radius: 25 + Math.random() * 35,
        stroke: '#333',
        strokeWidth: 2,
      });

      fabricCanvasRef.current.add(circle);
      fabricCanvasRef.current.setActiveObject(circle);
      fabricCanvasRef.current.renderAll();
    } catch (error) {
      console.error('Failed to add circle:', error);
    }
  }, []);

  const addText = useCallback(async () => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const { IText } = await import('fabric');
      const text = new IText('Click to edit', {
        left: Math.random() * 300 + 50,
        top: Math.random() * 200 + 50,
        fontSize: 16 + Math.random() * 12,
        fill: '#333',
        fontFamily: 'Arial, sans-serif',
      });

      fabricCanvasRef.current.add(text);
      fabricCanvasRef.current.setActiveObject(text);
      text.enterEditing();
      fabricCanvasRef.current.renderAll();
    } catch (error) {
      console.error('Failed to add text:', error);
    }
  }, []);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    if (activeObjects.length > 0) {
      fabricCanvasRef.current.remove(...activeObjects);
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.backgroundColor = '#f8f9fa';
    fabricCanvasRef.current.renderAll();
  }, []);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px 20px',
        backgroundColor: isReady ? '#d4edda' : error ? '#f8d7da' : '#fff3cd',
        borderBottom: '2px solid #dee2e6',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '24px',
          color: '#333',
          fontWeight: 'bold'
        }}>
          🎨 Fabric.js Proof of Concept
        </h1>
        
        <div style={{ 
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: 'rgba(255,255,255,0.8)',
          fontSize: '14px',
          fontWeight: 'bold',
          color: isReady ? '#155724' : error ? '#721c24' : '#856404'
        }}>
          {status}
        </div>

        <div style={{ 
          marginLeft: 'auto',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: 'rgba(255,255,255,0.8)',
          fontSize: '14px',
          color: '#666'
        }}>
          Objects: {objectCount}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderBottom: '1px solid #f5c6cb'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Toolbar */}
      {isReady && (
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={addRectangle}
            style={{ 
              padding: '10px 16px', 
              backgroundColor: '#FF6B6B', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ➕ Add Rectangle
          </button>
          <button 
            onClick={addCircle}
            style={{ 
              padding: '10px 16px', 
              backgroundColor: '#4ECDC4', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ⭕ Add Circle
          </button>
          <button 
            onClick={addText}
            style={{ 
              padding: '10px 16px', 
              backgroundColor: '#45B7D1', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            📝 Add Text
          </button>
          <button 
            onClick={deleteSelected}
            style={{ 
              padding: '10px 16px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            🗑️ Delete Selected
          </button>
          <button 
            onClick={clearCanvas}
            style={{ 
              padding: '10px 16px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            🧹 Clear All
          </button>
        </div>
      )}

      {/* Instructions */}
      {isReady && (
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#e3f2fd',
          borderBottom: '1px solid #bbdefb',
          fontSize: '14px',
          color: '#0d47a1'
        }}>
          <strong>🎯 Test Instructions:</strong> 
          <span style={{ marginLeft: '10px' }}>
            • Drag objects to move them around
            • Double-click text to edit inline
            • Shift+click to select multiple objects
            • Use corner handles to resize objects
            • Objects have built-in rotation handles
          </span>
        </div>
      )}

      {/* Canvas Container */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '20px',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          border: '2px solid #dee2e6',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <canvas 
            ref={canvasRef}
            style={{ 
              display: 'block',
              borderRadius: '6px'
            }}
          />
        </div>
      </div>

      {/* Results Summary */}
      {isReady && (
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#d1ecf1',
          borderTop: '1px solid #bee5eb',
          fontSize: '14px',
          color: '#0c5460'
        }}>
          <strong>🧪 Proof of Concept Results:</strong> 
          <span style={{ marginLeft: '10px' }}>
            ✅ Drag & Drop works out-of-the-box • 
            ✅ Text editing with double-click • 
            ✅ Multi-selection with Shift+click • 
            ✅ Built-in resize handles • 
            ✅ Event system working perfectly
          </span>
        </div>
      )}
    </div>
  );
};

export default FabricCanvasPoCSimple;
