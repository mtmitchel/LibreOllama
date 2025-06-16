import { useRef, useCallback, useEffect } from 'react';
import * as fabric from 'fabric';

/**
 * Custom hook to manage the lifecycle of a Fabric.js canvas instance.
 * It handles initialization and disposal of the canvas.
 *
 * @param onLoad A callback function that is invoked when the canvas is initialized.
 *               It receives the Fabric.js canvas instance as an argument.
 *               It can optionally return a cleanup function that will be called
 *               when the canvas is disposed.
 * @param canvasOptions Optional Fabric.js canvas options for initialization.
 * @returns A ref callback to be passed to the HTML canvas element.
 */
export const useFabric = (
  onLoad?: (canvas: fabric.Canvas) => (() => void) | void,
  canvasOptions?: any
) => {
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const disposeRef = useRef<(() => void) | void | null>(null);
  const nodeRef = useRef<HTMLCanvasElement | null>(null);

  // Clean up function
  const cleanup = useCallback(() => {
    if (disposeRef.current) {
      disposeRef.current();
      disposeRef.current = null;
    }
    
    if (fabricCanvasRef.current) {
      try {
        // Remove ALL event listeners before disposal
        const canvas = fabricCanvasRef.current;
        canvas.off(); // This removes all event listeners at once
        
        // Get canvas element BEFORE disposal to avoid accessing disposed state
        let canvasElement = null;
        try {
          canvasElement = canvas.getElement();
        } catch (e) {
          // Canvas element might already be disposed, that's ok
        }
        
        // Properly dispose of the Fabric canvas
        canvas.dispose();
        
        // Critical for GC - remove canvas element from DOM if it exists
        if (canvasElement && canvasElement.remove) {
          canvasElement.remove();
        }
      } catch (error) {
        console.warn('Error disposing Fabric canvas:', error);
      }
      fabricCanvasRef.current = null;
    }

    // Clear any Fabric.js internal references
    if (nodeRef.current) {
      try {
        // Remove Fabric's internal canvas wrapper if it exists
        const wrapper = nodeRef.current.parentElement;
        if (wrapper && wrapper.classList.contains('canvas-container')) {
          // Move the canvas back to its original position
          const parent = wrapper.parentElement;
          if (parent) {
            parent.insertBefore(nodeRef.current, wrapper);
            parent.removeChild(wrapper);
          }
        }
        
        // Clear any data attributes or properties Fabric might have added
        nodeRef.current.removeAttribute('data-fabric-id');
        delete (nodeRef.current as any).__fabric;
        
        // Reset canvas styles that Fabric might have modified
        nodeRef.current.style.position = '';
        nodeRef.current.style.left = '';
        nodeRef.current.style.top = '';
        nodeRef.current.style.touchAction = '';
        
        // Clear canvas context to prevent memory leaks
        const ctx = nodeRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, nodeRef.current.width, nodeRef.current.height);
        }
      } catch (error) {
        console.warn('Error cleaning up canvas element:', error);
      }
    }
  }, []);

  // Effect to clean up on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const ref = useCallback((node: HTMLCanvasElement | null) => {
    // If node is being removed
    if (!node) {
      cleanup();
      nodeRef.current = null;
      return;
    }

    // If it's the same node and we already have a canvas, do nothing
    if (node === nodeRef.current && fabricCanvasRef.current) {
      return;
    }

    // Clean up any existing canvas
    cleanup();
    nodeRef.current = node;

    // Get theme-aware canvas background color
    const getCanvasBackgroundColor = () => {
      // ALWAYS return white - canvas should NEVER be black
      // Try to get CSS custom property value
      if (typeof window !== 'undefined') {
        try {
          const rootStyles = getComputedStyle(document.documentElement);
          const canvasBg = rootStyles.getPropertyValue('--canvas-bg').trim();
          if (canvasBg && canvasBg !== 'transparent' && canvasBg !== '') {
            console.log('🎨 Canvas background from CSS:', canvasBg);
            return canvasBg;
          }
        } catch (error) {
          console.warn('Error reading CSS canvas background:', error);
        }
      }
      // GUARANTEED fallback to white - canvas must never be black
      console.log('🎨 Canvas background fallback: white');
      return '#ffffff';
    };

    // Default options (moved outside try block for catch block access)
    const customDefaultOptions = {
      width: 800,
      height: 600,
      backgroundColor: getCanvasBackgroundColor(),
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: false,
      imageSmoothingEnabled: false,
      enableRetinaScaling: true,
      allowTouchScrolling: false,
      stopContextMenu: true,
    };

    // Initialize new canvas
    try {
      // Merge options
      const mergedOptions = { ...customDefaultOptions, ...canvasOptions };

      // Validate dimensions
      if (typeof mergedOptions.width !== 'number') {
        console.warn('useFabric: Canvas width is not a number. Using default.');
        mergedOptions.width = customDefaultOptions.width;
      }
      if (typeof mergedOptions.height !== 'number') {
        console.warn('useFabric: Canvas height is not a number. Using default.');
        mergedOptions.height = customDefaultOptions.height;
      }

      // Create the Fabric canvas
      fabricCanvasRef.current = new fabric.Canvas(node, mergedOptions);
      
      // CRITICAL: Force immediate render after creation
      console.log('🎨 useFabric: Canvas created, forcing initial render...');
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.renderAll();
        console.log('✅ useFabric: Initial render completed');
      }

      // Call onLoad callback if provided
      if (onLoad && fabricCanvasRef.current) {
        disposeRef.current = onLoad(fabricCanvasRef.current);
      }
    } catch (error: any) {
      // Handle specific Fabric.js errors
      if (error?.message?.includes('already been initialized')) {
        console.warn('Canvas initialization conflict detected. This might be due to React StrictMode.');
        
        // Try to recover by forcing cleanup and retrying once
        try {
          // Force cleanup of any existing Fabric instance
          const wrapper = node.parentElement;
          if (wrapper && wrapper.classList.contains('canvas-container')) {
            const parent = wrapper.parentElement;
            if (parent) {
              parent.insertBefore(node, wrapper);
              parent.removeChild(wrapper);
            }
          }
          
          // Recreate merged options for retry
          const retryMergedOptions = { ...customDefaultOptions, ...canvasOptions };
          
          // Retry initialization
          fabricCanvasRef.current = new fabric.Canvas(node, retryMergedOptions);
          
          if (onLoad && fabricCanvasRef.current) {
            disposeRef.current = onLoad(fabricCanvasRef.current);
          }
        } catch (retryError) {
          console.error('Failed to initialize Fabric canvas after retry:', retryError);
        }
      } else {
        console.error('Error creating Fabric canvas:', error);
      }
    }
  }, [onLoad, canvasOptions, cleanup]);

  return ref;
};
