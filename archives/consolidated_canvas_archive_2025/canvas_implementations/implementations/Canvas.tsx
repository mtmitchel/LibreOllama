/**
 * Unified Fabric.js Canvas Component
 * The single, production-ready canvas implementation for LibreOllama
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as fabric from 'fabric';
import { useFabricCanvasStore, CanvasTool } from '../stores/fabricCanvasStore';
import { useFabricElementCreation, DEFAULT_ELEMENT_CONFIGS } from '../lib/fabric-element-creation';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import { useFabric } from '../hooks/canvas/useFabric'; // Import the new hook
import FabricCanvasContext from '../contexts/FabricCanvasContext';
import { useCanvasPanning } from '../hooks/canvas/useCanvasPanning';
import { useCanvasSelectionEvents } from '../hooks/canvas/useCanvasSelectionEvents';

interface CanvasProps {
  className?: string;
}

const Canvas: React.FC<CanvasProps> = ({ 
  className = "canvas-container flex flex-col h-screen" 
}) => {
  // Store state (remains the same)
  const elements = useFabricCanvasStore((state) => state.elements);
  const selectedElementIds = useFabricCanvasStore((state) => state.selectedElementIds);
  const activeTool = useFabricCanvasStore((state) => state.activeTool);
  const isEditingText = useFabricCanvasStore((state) => state.isEditingText);
  const isCanvasReady = useFabricCanvasStore((state) => state.isCanvasReady);
  const history = useFabricCanvasStore((state) => state.history);
  const historyIndex = useFabricCanvasStore((state) => state.historyIndex);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Store actions (remains the same)
  const setFabricCanvas = useFabricCanvasStore((state) => state.setFabricCanvas);
  const setCanvasReady = useFabricCanvasStore((state) => state.setCanvasReady);
  // const setSelectedElementIds = useFabricCanvasStore((state) => state.setSelectedElementIds); // No longer used directly here
  const setIsEditingText = useFabricCanvasStore((state) => state.setIsEditingText);
  const setActiveTool = useFabricCanvasStore((state) => state.setActiveTool);
  const updateElement = useFabricCanvasStore((state) => state.updateElement);
  const addToHistory = useFabricCanvasStore((state) => state.addToHistory);
  const deleteElement = useFabricCanvasStore((state) => state.deleteElement);
  const undo = useFabricCanvasStore((state) => state.undo);
  const redo = useFabricCanvasStore((state) => state.redo);
  const clearSelection = useFabricCanvasStore((state) => state.clearSelection);

  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  // fabricCanvasRef and canvasRef are now managed by useFabric or its callback
  // fabricInstance is now primarily managed by the Zustand store
  const fabricInstance = useFabricCanvasStore((state) => state.fabricCanvas);

  // Toolbar state (remains the same)
  const [selectedShape, setSelectedShape] = useState('');
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Welcome modal state (remains the same)
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  // Element creation (remains the same)
  const generateId = useCallback(() => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const { createElementDirectly } = useFabricElementCreation(
    useFabricCanvasStore,
    generateId,
    canvasContainerRef
  );

  useCanvasPanning(fabricInstance);
  useCanvasSelectionEvents(fabricInstance);

  // Callback for useFabric hook when canvas is loaded
  const handleCanvasLoad = useCallback((canvas: fabric.Canvas) => {
    console.log('🎨 Canvas.tsx: Fabric canvas loaded via useFabric hook.');
    setFabricCanvas(canvas); // Update store
    setCanvasReady(true);

    // CRITICAL: Force proper canvas setup for visibility
    console.log('🔧 Setting up canvas for proper rendering...');
    
    // Ensure canvas has proper dimensions
    const canvasElement = canvas.getElement();
    if (canvasElement) {
      console.log('📏 Canvas element dimensions:', {
        width: canvasElement.width,
        height: canvasElement.height,
        clientWidth: canvasElement.clientWidth,
        clientHeight: canvasElement.clientHeight,
        style: canvasElement.style.cssText
      });
      
      // Force canvas dimensions if they're not set properly
      if (canvasElement.width === 0 || canvasElement.height === 0) {
        console.log('⚠️ Canvas has zero dimensions, forcing 800x600');
        canvas.setDimensions({ width: 800, height: 600 });
      }
    }

    // CRITICAL: Reset viewport to ensure elements are visible
    console.log('🔍 Resetting canvas viewport to default state');
    canvas.setZoom(1.0);
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0]; // Identity matrix
    
    // Force multiple render calls to ensure visibility
    canvas.renderAll();
    requestAnimationFrame(() => {
      canvas.renderAll();
      console.log('🎨 Double render completed');
    });

    // CRITICAL: Restore existing elements when canvas is reinitialized
    const currentElements = useFabricCanvasStore.getState().elements;
    const elementIds = Object.keys(currentElements);
    
    if (elementIds.length > 0) {
      console.log('🔄 Canvas reinitialized - checking if elements need to be restored');
      console.log('🔄 Store has', elementIds.length, 'elements, canvas has', canvas.getObjects().length, 'objects');
      
      // Only restore if canvas is empty but store has elements
      if (canvas.getObjects().length === 0) {
        console.log('🔄 Restoring', elementIds.length, 'elements to empty canvas');
        
        // Restore elements by recreating their Fabric objects
        elementIds.forEach(elementId => {
          const element = currentElements[elementId];
          if (element && !element.fabricObject) {
            console.log('🔄 Recreating Fabric object for:', element.id, element.type);
            // The store's addElement will handle creating the Fabric object
            const state = useFabricCanvasStore.getState();
            state.createFabricObject(element).then((fabricObject: any) => {
              if (fabricObject && canvas && !canvas.isDisposed) {
                fabricObject.customId = element.id;
                canvas.add(fabricObject);
                canvas.renderAll();
                console.log('✅ Restored element:', element.id);
              }
            });
          }
        });
      }
    }

    // Event listeners setup
    const handleWheel = (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    };


    const onObjectModified = (e: any) => {
      const fabricObject = e.target;
      const customId = fabricObject?.customId as string;
      if (customId) {
        updateElement(customId, {
          x: fabricObject.left,
          y: fabricObject.top,
          width: fabricObject.width * (fabricObject.scaleX || 1),
          height: fabricObject.height * (fabricObject.scaleY || 1),
          rotation: fabricObject.angle,
        });
        addToHistory();
      }
    };

    const onTextEditingEntered = (e: any) => {
      const customId = e.target?.customId as string;
      if (customId) setIsEditingText(true);
    };
    const onTextEditingExited = (e: any) => {
      const customId = e.target?.customId as string;
      if (customId) {
        setIsEditingText(false);
        const newText = e.target?.text || '';
        updateElement(customId, { content: newText });
        addToHistory();
      }
    };
    const onMouseDblClick = (e: any) => {
      const target = e.target;
      if (target && target.type === 'i-text') target.enterEditing();
    };

    // Attach event listeners with validation
    const validateCanvas = (canvas: any) => {
      return canvas && !canvas.isDisposed && canvas.getElement && typeof canvas.getElement === 'function';
    };
    
    if (!validateCanvas(canvas)) {
      console.warn('Canvas validation failed during event setup');
      return;
    }

    // Optimized event handling - attach all handlers
    canvas.on('mouse:wheel', handleWheel);
    canvas.on('object:modified', onObjectModified);
    canvas.on('text:editing:entered', onTextEditingEntered);
    canvas.on('text:editing:exited', onTextEditingExited);
    canvas.on('mouse:dblclick', onMouseDblClick);

    // Return cleanup function
    return () => {
      console.log('🧹 Canvas.tsx: Cleaning up Fabric canvas events via useFabric hook.');
      
      // Optimized cleanup - remove specific handlers to avoid issues with Fabric.js typing
      canvas.off('mouse:wheel', handleWheel);
      canvas.off('object:modified', onObjectModified);
      canvas.off('text:editing:entered', onTextEditingEntered);
      canvas.off('text:editing:exited', onTextEditingExited);
      canvas.off('mouse:dblclick', onMouseDblClick);
      
      setFabricCanvas(null); // Clear from store
      setCanvasReady(false);
    };
  }, [setFabricCanvas, setCanvasReady, updateElement, addToHistory, setIsEditingText]); // Dependencies for handleCanvasLoad

  // Calculate initial dimensions (example, adjust as needed)
  // These could also be managed by a resize observer on canvasContainerRef for more dynamic updates
  const [canvasDimens, setCanvasDimens] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      setCanvasDimens({
        width: Math.max(800, rect.width > 20 ? rect.width - 20 : 800),
        height: Math.max(600, rect.height > 100 ? rect.height - 100 : 600),
      });
    }
  }, []); // Run once on mount to get initial dimensions

  // Memoize canvasOptions to prevent unnecessary re-renders and re-initialization of useFabric
  const memoizedCanvasOptions = useMemo(() => ({
    width: canvasDimens.width,
    height: canvasDimens.height,
    // Other specific options for this canvas instance can be passed here.
    // Note: useFabric already includes its own defaults like renderOnAddRemove: false etc.
  }), [canvasDimens.width, canvasDimens.height]);

  // DIRECT CANVAS INITIALIZATION - BYPASS PROBLEMATIC HOOK
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) {
      console.log('❌ Canvas ref not available');
      return;
    }

    console.log('🚀 DIRECT: Starting canvas initialization...');

    try {
      // Create canvas directly without hook
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: canvasDimens.width,
        height: canvasDimens.height,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true
      });

      console.log('✅ DIRECT: Fabric canvas created');

      // Call the existing handleCanvasLoad logic
      handleCanvasLoad(canvas);

      return () => {
        console.log('🧹 DIRECT: Disposing canvas');
        canvas.dispose();
      };

    } catch (error) {
      console.error('❌ DIRECT: Canvas initialization failed:', error);
    }
  }, [canvasDimens.width, canvasDimens.height, handleCanvasLoad]);

  // Remove the problematic useFabric hook
  // const fabricCanvasRefSetter = useFabric(handleCanvasLoad, memoizedCanvasOptions);

  // Update canvas size when container resizes
  useEffect(() => {
    const updateSize = () => {
      if (!canvasContainerRef.current || !fabricInstance || !isCanvasReady) {
        return; // Exit if container, canvas, or canvas readiness is not available
      }
      
      // Additional safety check for canvas internal structure
      try {
        const container = canvasContainerRef.current;
        const rect = container.getBoundingClientRect();
        const newWidth = Math.max(800, rect.width > 20 ? rect.width - 20 : 800);
        const newHeight = Math.max(600, rect.height > 100 ? rect.height - 100 : 600);

        if (fabricInstance.width !== newWidth || fabricInstance.height !== newHeight) {
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            if (fabricInstance && fabricInstance.getElement()) {
              fabricInstance.setDimensions({ width: newWidth, height: newHeight });
              fabricInstance.calcOffset(); // Recalculate canvas offsets for correct mouse interaction
              
              // Use safe rendering with context validation
              try {
                const ctx = fabricInstance.getContext();
                if (ctx && typeof ctx.clearRect === 'function') {
                  fabricInstance.renderAll();
                } else {
                  console.warn('Canvas context not ready during resize, skipping render');
                }
              } catch (error) {
                console.warn('Canvas resize render error:', error);
              }
            }
          });
        }
      } catch (error) {
        console.warn('Canvas resize error:', error);
      }
    };

    // Delay initial size update to ensure canvas is fully initialized
    if (fabricInstance && canvasContainerRef.current && isCanvasReady) {
      const timeoutId = setTimeout(updateSize, 100);
      window.addEventListener('resize', updateSize);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updateSize);
      };
    }
  }, [fabricInstance, isCanvasReady]);

  // Add mouse event handlers for drawing tools
  useEffect(() => {
    if (!fabricInstance || !isCanvasReady) return;

    let isDrawingShape = false;
    let startPoint: { x: number; y: number } | null = null;
    let tempShape: any = null;

    const handleMouseDown = (opt: any) => {
      if (activeTool === 'select' || activeTool === 'pen' || activeTool === 'eraser') return;
      
      const pointer = fabricInstance.getPointer(opt.e);
      isDrawingShape = true;
      startPoint = { x: pointer.x, y: pointer.y };

      // Create temporary shape based on active tool
      if (['line', 'arrow'].includes(activeTool)) {
        // For line and arrow, we'll create them on mouse up
        return;
      }
    };

    const handleMouseMove = () => {
      if (!isDrawingShape || !startPoint) return;
      
      // Update temporary shape size
      if (tempShape) {
        // This would be for real-time preview, but we'll keep it simple for now
      }
    };

    const handleMouseUp = (opt: any) => {
      if (!isDrawingShape || !startPoint) return;
      
      const pointer = fabricInstance.getPointer(opt.e);
      const endPoint = { x: pointer.x, y: pointer.y };
      
      // Calculate dimensions
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);
      const x = Math.min(startPoint.x, endPoint.x);
      const y = Math.min(startPoint.y, endPoint.y);
      
      // Create element based on tool
      if (width > 5 || height > 5) { // Minimum size threshold
        let elementConfig: any = {};
        
        if (activeTool === 'line') {
          elementConfig = {
            ...DEFAULT_ELEMENT_CONFIGS.line,
            type: 'line',
            points: [startPoint, endPoint],
            x: startPoint.x,
            y: startPoint.y,
            width: endPoint.x - startPoint.x,
            height: endPoint.y - startPoint.y,
          };
        } else if (activeTool === 'arrow') {
          elementConfig = {
            ...DEFAULT_ELEMENT_CONFIGS.arrow,
            type: 'arrow' as any,
            x,
            y,
            width,
            height,
          };
        }
        
        if (elementConfig.type) {
          const newElement = {
            id: generateId(),
            ...elementConfig,
          };
          
          createElementDirectly(newElement);
          addToHistory();
        }
      }
      
      // Reset drawing state
      isDrawingShape = false;
      startPoint = null;
      tempShape = null;
      setActiveTool('select');
    };

    // Add event listeners
    fabricInstance.on('mouse:down', handleMouseDown);
    fabricInstance.on('mouse:move', handleMouseMove);
    fabricInstance.on('mouse:up', handleMouseUp);

    // Cleanup
    return () => {
      fabricInstance.off('mouse:down', handleMouseDown);
      fabricInstance.off('mouse:move', handleMouseMove);
      fabricInstance.off('mouse:up', handleMouseUp);
    };
  }, [fabricInstance, isCanvasReady, activeTool, generateId, createElementDirectly, addToHistory, setActiveTool]);

  const handleToolSelect = useCallback((toolId: string, event?: React.MouseEvent<Element>) => {
    console.log('🚀 DEBUG: handleToolSelect called with:', toolId);
    
    if (toolId === 'shapes') {
      if (event && event.currentTarget instanceof HTMLElement) {
        const rect = event.currentTarget.getBoundingClientRect();
        setDropdownPosition({ top: rect.bottom, left: rect.left }); 
      }
      setShowShapeDropdown(prev => !prev);
      return;
    }
    setShowShapeDropdown(false);

    const tool = toolId as CanvasTool; 
    setActiveTool(tool); 
    console.log('🚀 DEBUG: Tool set to:', tool);

    // Create element immediately for certain tools
    if (['text', 'sticky-note'].includes(tool) && fabricInstance && canvasContainerRef.current) {
      console.log('🚀 DEBUG: Creating element immediately for tool:', tool);
      console.log('🚀 DEBUG: fabricInstance available:', !!fabricInstance);
      console.log('🚀 DEBUG: canvasContainerRef.current available:', !!canvasContainerRef.current);
      
      const centerX = fabricInstance.getWidth() / 2;
      const centerY = fabricInstance.getHeight() / 2;
      console.log('🚀 DEBUG: Canvas center calculated:', { centerX, centerY });
      
      const elementConfig = DEFAULT_ELEMENT_CONFIGS[tool] || {};
      const newElement = {
        id: generateId(),
        type: tool as any,
        x: centerX - (elementConfig.width || 100) / 2, 
        y: centerY - (elementConfig.height || 100) / 2,
        ...elementConfig,
      };
      console.log('🚀 DEBUG: Element created:', newElement);

      createElementDirectly(newElement);
      console.log('🚀 DEBUG: createElementDirectly called');
      addToHistory();
      setActiveTool('select'); // Switch back to select tool after creating
    } else if (tool === 'image') {
      // Handle image upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imgElement = new Image();
            imgElement.onload = () => {
              if (fabricInstance) {
                import('fabric').then(({ FabricImage }) => {
                  FabricImage.fromURL(event.target?.result as string).then((img) => {
                    const scale = Math.min(400 / imgElement.width, 300 / imgElement.height);
                    img.scale(scale);
                    
                    const centerX = fabricInstance.getWidth() / 2;
                    const centerY = fabricInstance.getHeight() / 2;
                    img.set({
                      left: centerX - (imgElement.width * scale) / 2,
                      top: centerY - (imgElement.height * scale) / 2,
                    });
                    
                    const imageElement = {
                      id: generateId(),
                      type: 'image' as const,
                      x: img.left || 0,
                      y: img.top || 0,
                      width: imgElement.width * scale,
                      height: imgElement.height * scale,
                      src: event.target?.result as string,
                    };
                    
                    // Add to store
                    const { addElement } = useFabricCanvasStore.getState();
                    addElement(imageElement);
                    addToHistory();
                  });
                });
              }
            };
            imgElement.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      setActiveTool('select');
    } else if (fabricInstance) {
      // Handle drawing tools
      fabricInstance.isDrawingMode = tool === 'pen' || tool === 'eraser';
      if (fabricInstance.isDrawingMode && fabricInstance.freeDrawingBrush) {
        if (tool === 'pen') {
          fabricInstance.freeDrawingBrush.width = 3;
          fabricInstance.freeDrawingBrush.color = '#000000';
        } else if (tool === 'eraser') {
          fabricInstance.freeDrawingBrush.width = 20;
        }
      }
      
      // Update cursor based on tool
      if (['line', 'arrow'].includes(tool)) {
        fabricInstance.defaultCursor = 'crosshair';
      } else {
        fabricInstance.defaultCursor = 'default';
      }
    }
  }, [setActiveTool, fabricInstance, setShowShapeDropdown, setDropdownPosition, generateId, createElementDirectly, addToHistory]);

  const handleShapeSelect = useCallback((shape: string) => {
    setSelectedShape(shape);
    setActiveTool(shape as CanvasTool); 
    setShowShapeDropdown(false);

    if (fabricInstance && canvasContainerRef.current) {
      const centerX = fabricInstance.getWidth() / 2;
      const centerY = fabricInstance.getHeight() / 2;
      
      const elementConfig = DEFAULT_ELEMENT_CONFIGS[shape] || {};
      const newElement = {
        id: generateId(),
        type: shape as any,
        x: centerX - (elementConfig.width || 100) / 2, 
        y: centerY - (elementConfig.height || 100) / 2,
        ...elementConfig,
      };

      createElementDirectly(newElement);
      addToHistory();
      setActiveTool('select'); 
    }
  }, [setActiveTool, generateId, createElementDirectly, addToHistory, fabricInstance]);

  // Zoom handlers (use fabricInstance)
  const handleZoomIn = useCallback(() => {
    if (fabricInstance) {
      const currentZoom = fabricInstance.getZoom();
      fabricInstance.zoomToPoint(new fabric.Point(fabricInstance.getWidth() / 2, fabricInstance.getHeight() / 2), Math.min(currentZoom * 1.2, 20));
    }
  }, [fabricInstance]);

  const handleZoomOut = useCallback(() => {
    if (fabricInstance) {
      const currentZoom = fabricInstance.getZoom();
      fabricInstance.zoomToPoint(new fabric.Point(fabricInstance.getWidth() / 2, fabricInstance.getHeight() / 2), Math.max(currentZoom / 1.2, 0.01));
    }
  }, [fabricInstance]);

  // Undo/Redo handlers (no change needed)
  const handleUndo = useCallback(() => {
    if (canUndo) undo();
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (canRedo) redo();
  }, [canRedo, redo]);

  // Delete handler (no change needed)
  const handleDelete = useCallback(() => {
    selectedElementIds.forEach(id => {
      deleteElement(id);
    });
    if (selectedElementIds.length > 0) {
      addToHistory();
    }
    clearSelection();
  }, [selectedElementIds, deleteElement, addToHistory, clearSelection]);

  // Close dropdown when clicking outside (no change needed)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShapeDropdown(false);
      }
    };

    if (showShapeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShapeDropdown]);

  // Close welcome modal when user starts using the canvas (no change needed)
  useEffect(() => {
    if (Object.keys(elements).length > 0 && showWelcomeModal) {
      setShowWelcomeModal(false);
    }
  }, [elements, showWelcomeModal]);

  // TEMPORARY: Add test elements when canvas is ready + FIX VIEWPORT
  useEffect(() => {
    if (isCanvasReady && fabricInstance && Object.keys(elements).length === 0) {
      console.log('🚀 Adding test elements for debugging...');
      
      // CRITICAL: Reset canvas viewport to ensure visibility
      console.log('🔍 Current canvas state:', {
        zoom: fabricInstance.getZoom(),
        viewportTransform: fabricInstance.viewportTransform,
        width: fabricInstance.getWidth(),
        height: fabricInstance.getHeight(),
        objectCount: fabricInstance.getObjects().length
      });
      
      // Reset zoom to 1.0 and center viewport
      fabricInstance.setZoom(1.0);
      fabricInstance.viewportTransform = [1, 0, 0, 1, 0, 0]; // Reset to identity matrix
      
      // BYPASS STORE SYSTEM - Add objects directly to Fabric
      setTimeout(() => {
        try {
          // Clear any existing objects first
          fabricInstance.clear();
          fabricInstance.backgroundColor = '#ffffff';
          
          // Add objects directly to Fabric canvas without store
          const directRect = new fabric.Rect({
            left: 100,
            top: 100,
            width: 150,
            height: 100,
            fill: '#ff0000',
            stroke: '#000000',
            strokeWidth: 2
          });
          
          fabricInstance.add(directRect);
          console.log('✅ Direct red rectangle added');
          
          const directText = new fabric.IText('DIRECT TEST - VISIBLE?', {
            left: 300,
            top: 150,
            fontSize: 24,
            fill: '#0000ff',
            fontWeight: 'bold'
          });
          
          fabricInstance.add(directText);
          console.log('✅ Direct blue text added');
          
          const directCircle = new fabric.Circle({
            left: 150,
            top: 250,
            radius: 50,
            fill: '#00ff00',
            stroke: '#000000',
            strokeWidth: 2
          });
          
          fabricInstance.add(directCircle);
          console.log('✅ Direct green circle added');
          
          // FORCE canvas render after adding elements
          fabricInstance.renderAll();
          console.log('🎨 Direct objects rendered - should be visible now!');
          
          // AGGRESSIVE FIX: Check if canvas context is working properly
          const canvasElement = fabricInstance.getElement();
          if (canvasElement) {
            const ctx = canvasElement.getContext('2d');
            if (ctx) {
              console.log('🧪 CONTEXT TEST: Drawing directly to 2D context...');
              
              // Draw directly on canvas context to test if it's visible
              ctx.save();
              ctx.fillStyle = 'orange';
              ctx.fillRect(500, 50, 100, 100);
              ctx.fillStyle = 'purple';
              ctx.font = '16px Arial';
              ctx.fillText('DIRECT CONTEXT', 520, 100);
              ctx.restore();
              
              console.log('🧪 Direct context drawing completed');
            }
            
            // Force canvas to recalculate everything
            console.log('🔄 Forcing canvas recalculation...');
            fabricInstance.calcOffset();
            fabricInstance.setCoords();
            fabricInstance.renderAll();
            
            // Try setting object coordinates explicitly
            const objects = fabricInstance.getObjects();
            objects.forEach((obj: any, index: number) => {
              console.log(`🔧 Object ${index}: ${obj.type} at (${obj.left}, ${obj.top})`);
              obj.setCoords();
            });
            
            // Final render
            fabricInstance.renderAll();
          }
          
          // Log final state for debugging
          console.log('🔍 Final direct canvas state:', {
            zoom: fabricInstance.getZoom(),
            viewportTransform: fabricInstance.viewportTransform,
            objectCount: fabricInstance.getObjects().length,
            objects: fabricInstance.getObjects().map((obj: any) => ({
              type: obj.type,
              left: obj.left,
              top: obj.top,
              width: obj.width,
              height: obj.height,
              visible: obj.visible,
              fill: obj.fill
            }))
          });
          
        } catch (error) {
          console.error('❌ Error adding direct objects:', error);
        }
      }, 500); // Small delay to ensure canvas is fully ready
    }
  }, [isCanvasReady, fabricInstance, elements]);

  return (
    <FabricCanvasContext.Provider value={{ fabricCanvas: fabricInstance }}>
      <div className={className}>
      {/* Canvas Toolbar (no change needed) */}
      <CanvasToolbar
        activeTool={activeTool as CanvasTool}
        selectedShape={selectedShape}
        showShapeDropdown={showShapeDropdown}
        dropdownPosition={dropdownPosition}
        dropdownRef={dropdownRef}
        onToolSelect={handleToolSelect}
        onShapeSelect={handleShapeSelect}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={handleDelete}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Main canvas area */}
      <div 
        ref={canvasContainerRef}
        className="flex-1 relative bg-bg-secondary overflow-hidden"
        style={{ minHeight: '600px' }}
      >
        {/* Canvas */}
        <div className="flex items-center justify-center w-full h-full canvas-wrapper">
          <div className="canvas-container">
            <canvas
              ref={canvasRef} // Use direct ref instead of hook ref
              className="border-4 border-red-500 shadow-lg bg-white fabric-main-canvas"
              data-fabric="true"
              style={{ 
                cursor: activeTool === 'select' ? 'default' : 'crosshair',
                minWidth: '800px',
                minHeight: '600px',
                maxWidth: '100%',
                maxHeight: '100%',
                opacity: 1,
                visibility: 'visible',
                zIndex: 1,
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* Welcome modal */}
        {isCanvasReady && Object.keys(elements).length === 0 && showWelcomeModal && (
          <div className="absolute top-8 left-8 bg-white/95 border border-gray-200 rounded-lg p-6 max-w-sm shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900">
                ✨ Welcome to Canvas!
              </h3>
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• <strong>Create:</strong> Use toolbar to add text & shapes</li>
              <li>• <strong>Move:</strong> Drag objects to reposition</li>
              <li>• <strong>Edit:</strong> Double-click text to edit</li>
              <li>• <strong>Resize:</strong> Use corner handles</li>
              <li>• <strong>Select:</strong> Click objects, Shift+click for multi-select</li>
              <li>• <strong>Pan:</strong> Alt+drag or middle mouse button</li>
              <li>• <strong>Zoom:</strong> Mouse wheel to zoom in/out</li>
            </ul>
          </div>
        )}

        {/* Status indicator */}
        <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-2 rounded-lg shadow-sm border">
          <div className="text-xs text-gray-600">
            <div>Elements: {Object.keys(elements).length} | Selected: {selectedElementIds.length}</div>
            <div>Tool: {activeTool} | {isEditingText ? 'Editing Text' : 'Ready'}</div>
            <div>History: {historyIndex + 1}/{history.length}</div>
            <div className={isCanvasReady ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              Canvas Ready: {isCanvasReady ? '✅ YES' : '❌ NO'} | Fabric Objects: {fabricInstance?.getObjects?.()?.length || 'N/A'}
            </div>
            <div className="text-blue-600 font-bold">🚀 DIRECT INIT MODE</div>
          </div>
        </div>

        {/* Debug button */}
        <button 
          className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-2 rounded-lg text-xs z-50"
          onClick={() => {
            alert('🚀 DEBUG BUTTON CLICKED!');
            console.log('🚀 DEBUG BUTTON CLICKED!');
            
            console.log('🚀 DEBUG STATE:', {
              elements: Object.keys(elements).length,
              fabricInstance: !!fabricInstance,
              isCanvasReady,
              fabricObjects: fabricInstance?.getObjects?.()?.length || 0
            });
            
            // Test canvas visibility and styling
            if (fabricInstance && isCanvasReady) {
              const canvasElement = fabricInstance.getElement();
              const canvasStyles = window.getComputedStyle(canvasElement);
              
              console.log('🧪 CANVAS ELEMENT DEBUG:', {
                display: canvasStyles.display,
                visibility: canvasStyles.visibility,
                opacity: canvasStyles.opacity,
                position: canvasStyles.position,
                zIndex: canvasStyles.zIndex,
                transform: canvasStyles.transform,
                overflow: canvasStyles.overflow,
                width: canvasElement.width,
                height: canvasElement.height,
                clientWidth: canvasElement.clientWidth,
                clientHeight: canvasElement.clientHeight,
                offsetWidth: canvasElement.offsetWidth,
                offsetHeight: canvasElement.offsetHeight
              });
              
              // Test if canvas context is working
              const ctx = canvasElement.getContext('2d');
              if (ctx) {
                console.log('🧪 CANVAS CONTEXT TEST:');
                // Draw a direct rectangle on canvas context
                ctx.fillStyle = 'red';
                ctx.fillRect(50, 50, 100, 100);
                ctx.fillStyle = 'blue';
                ctx.font = '20px Arial';
                ctx.fillText('RAW CANVAS TEST', 200, 100);
                console.log('✅ Drew directly to canvas context');
              }
              
              console.log('🧪 MANUAL TEST: Creating direct Fabric object...');
              alert('Adding green rectangle and blue text...');
              
              try {
                const directRect = new fabric.Rect({
                  left: 400,
                  top: 50,
                  width: 100,
                  height: 80,
                  fill: '#00ff00',
                  stroke: '#000000',
                  strokeWidth: 2
                });
                
                fabricInstance.add(directRect);
                console.log('🧪 Direct rectangle added');
                
                const directText = new fabric.IText('MANUAL TEST', {
                  left: 400,
                  top: 200,
                  fontSize: 20,
                  fill: '#0000ff'
                });
                
                fabricInstance.add(directText);
                console.log('🧪 Direct text added');
                
                fabricInstance.renderAll();
                console.log('🧪 Canvas rendered');
                
                alert('Direct elements added! Check console for details.');
                
              } catch (error) {
                console.error('🧪 Error creating direct elements:', error);
                alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
              }
            } else {
              alert(`Canvas not ready! fabricInstance: ${!!fabricInstance}, isCanvasReady: ${isCanvasReady}`);
            }
          }}
        >
          🚀 DIRECT INIT - DEBUG
        </button>
      </div>
    </div>
    </FabricCanvasContext.Provider>
  );
};

export default Canvas;
