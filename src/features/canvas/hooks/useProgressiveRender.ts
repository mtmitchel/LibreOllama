/**
 * Progressive Rendering Hook for Large Element Counts
 * 
 * Renders elements in chunks to maintain 60fps performance
 * with 1000+ canvas elements using time-slicing approach
 */

import { useMemo, useRef, useEffect, useCallback } from 'react';
import { ElementId, CanvasElement } from '../types/enhanced.types';

interface ProgressiveRenderConfig {
  chunkSize: number;
  frameTime: number; // Target ms per frame
  priorityThreshold: number; // Elements within viewport get priority
}

interface ProgressiveRenderResult {
  visibleElements: CanvasElement[];
  isRendering: boolean;
  progress: number;
  renderChunk: (elements: CanvasElement[]) => void;
}

const DEFAULT_CONFIG: ProgressiveRenderConfig = {
  chunkSize: 50, // Elements per chunk
  frameTime: 16, // ~60fps (16ms per frame)
  priorityThreshold: 1000 // Max elements before chunking
};

export function useProgressiveRender(
  elements: CanvasElement[],
  viewport: { x: number; y: number; scale: number; width: number; height: number },
  config: Partial<ProgressiveRenderConfig> = {}
): ProgressiveRenderResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const renderQueueRef = useRef<CanvasElement[]>([]);
  const renderedElementsRef = useRef<CanvasElement[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const isRenderingRef = useRef(false);
  const progressRef = useRef(0);

  // Viewport culling - only render visible elements first
  const { priorityElements, deferredElements } = useMemo(() => {
    if (elements.length <= finalConfig.priorityThreshold) {
      return { priorityElements: elements, deferredElements: [] };
    }

    const viewportBounds = {
      left: viewport.x - 100, // Add padding for smooth scrolling
      top: viewport.y - 100,
      right: viewport.x + viewport.width / viewport.scale + 100,
      bottom: viewport.y + viewport.height / viewport.scale + 100,
    };

    const priority: CanvasElement[] = [];
    const deferred: CanvasElement[] = [];

    elements.forEach(element => {
      const isVisible = isElementInViewport(element, viewportBounds);
      if (isVisible) {
        priority.push(element);
      } else {
        deferred.push(element);
      }
    });

    return { priorityElements: priority, deferredElements: deferred };
  }, [elements, viewport, finalConfig.priorityThreshold]);

  // Progressive rendering with time-slicing
  const renderChunk = useCallback((elementsToRender: CanvasElement[]) => {
    if (isRenderingRef.current || elementsToRender.length === 0) return;

    isRenderingRef.current = true;
    renderQueueRef.current = [...elementsToRender];
    renderedElementsRef.current = [];
    progressRef.current = 0;

    const processChunk = () => {
      const startTime = performance.now();
      
      while (
        renderQueueRef.current.length > 0 && 
        performance.now() - startTime < finalConfig.frameTime
      ) {
        const chunk = renderQueueRef.current.splice(0, finalConfig.chunkSize);
        renderedElementsRef.current.push(...chunk);
        
        progressRef.current = (elementsToRender.length - renderQueueRef.current.length) / elementsToRender.length;
      }

      if (renderQueueRef.current.length > 0) {
        // More chunks to process
        rafIdRef.current = requestAnimationFrame(processChunk);
      } else {
        // Rendering complete
        isRenderingRef.current = false;
        progressRef.current = 1;
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(processChunk);
  }, [finalConfig.frameTime, finalConfig.chunkSize]);

  // Auto-start progressive rendering when elements change
  useEffect(() => {
    const allElements = [...priorityElements, ...deferredElements];
    if (allElements.length > finalConfig.priorityThreshold) {
      renderChunk(allElements);
    } else {
      // Small element count - render immediately
      renderedElementsRef.current = allElements;
      isRenderingRef.current = false;
      progressRef.current = 1;
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [priorityElements, deferredElements, renderChunk, finalConfig.priorityThreshold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    visibleElements: renderedElementsRef.current,
    isRendering: isRenderingRef.current,
    progress: progressRef.current,
    renderChunk,
  };
}

/**
 * Check if element intersects with viewport bounds
 */
function isElementInViewport(
  element: CanvasElement, 
  bounds: { left: number; top: number; right: number; bottom: number }
): boolean {
  const elementBounds = getElementBounds(element);
  
  return !(
    elementBounds.right < bounds.left ||
    elementBounds.left > bounds.right ||
    elementBounds.bottom < bounds.top ||
    elementBounds.top > bounds.bottom
  );
}

/**
 * Get element bounding box
 */
function getElementBounds(element: CanvasElement) {
  let width = 0;
  let height = 0;

  if ('radius' in element && element.radius) {
    width = height = element.radius * 2;
  } else if ('width' in element && 'height' in element && element.width && element.height) {
    width = element.width;
    height = element.height;
  } else if (element.type === 'text' && 'fontSize' in element) {
    // Estimate text bounds
    width = (element.text?.length || 0) * (element.fontSize || 16) * 0.6;
    height = (element.fontSize || 16) * 1.2;
  } else {
    // Default bounds for other elements
    width = height = 100;
  }

  return {
    left: element.x,
    top: element.y,
    right: element.x + width,
    bottom: element.y + height,
  };
}