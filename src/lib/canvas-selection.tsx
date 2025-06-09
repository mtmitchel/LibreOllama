/**
 * Marquee (drag-to-select) selection system for canvas
 */

import React, { useCallback, useRef, useState } from 'react';
import { Graphics } from 'pixi.js';
import { Point, Bounds } from './canvas-coordinates';
import { graphicsPool } from './canvas-performance';
import { CanvasElement } from '@/stores/canvasStore';

export interface MarqueeState {
  isActive: boolean;
  startPoint: Point;
  currentPoint: Point;
  bounds: Bounds;
}

export interface MarqueeSelectionHook {
  marqueeState: MarqueeState | null;
  startMarqueeSelection: (startPoint: Point) => void;
  updateMarqueeSelection: (currentPoint: Point) => void;
  endMarqueeSelection: () => string[];
  renderMarquee: () => JSX.Element | null;
}

/**
 * Hook for managing marquee selection
 */
export const useMarqueeSelection = (
  elements: Record<string, CanvasElement>,
  onSelectionChange: (selectedIds: string[], addToSelection?: boolean) => void
): MarqueeSelectionHook => {
  const [marqueeState, setMarqueeState] = useState<MarqueeState | null>(null);
  const marqueeGraphics = useRef<Graphics | null>(null);

  const startMarqueeSelection = useCallback((startPoint: Point) => {
    setMarqueeState({
      isActive: true,
      startPoint,
      currentPoint: startPoint,
      bounds: { x: startPoint.x, y: startPoint.y, width: 0, height: 0 }
    });
  }, []);

  const updateMarqueeSelection = useCallback((currentPoint: Point) => {
    setMarqueeState(prev => {
      if (!prev) return null;

      const bounds = calculateMarqueeBounds(prev.startPoint, currentPoint);
      
      return {
        ...prev,
        currentPoint,
        bounds
      };
    });
  }, []);

  const endMarqueeSelection = useCallback((): string[] => {
    if (!marqueeState) return [];

    const selectedIds = getElementsInBounds(elements, marqueeState.bounds);
    setMarqueeState(null);
    
    return selectedIds;
  }, [marqueeState, elements]);

  const renderMarquee = useCallback(() => {
    if (!marqueeState?.isActive) return null;

    return (
      <MarqueeRenderer 
        bounds={marqueeState.bounds}
        ref={marqueeGraphics}
      />
    );
  }, [marqueeState]);

  return {
    marqueeState,
    startMarqueeSelection,
    updateMarqueeSelection,
    endMarqueeSelection,
    renderMarquee
  };
};

/**
 * Calculate marquee bounds from start and current points
 */
const calculateMarqueeBounds = (start: Point, current: Point): Bounds => {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);

  return { x, y, width, height };
};

/**
 * Get elements that intersect with marquee bounds
 */
const getElementsInBounds = (
  elements: Record<string, CanvasElement>, 
  bounds: Bounds
): string[] => {
  const selectedIds: string[] = [];

  Object.entries(elements).forEach(([id, element]) => {
    if (isElementInBounds(element, bounds)) {
      selectedIds.push(id);
    }
  });

  return selectedIds;
};

/**
 * Check if element intersects with bounds
 */
const isElementInBounds = (element: CanvasElement, bounds: Bounds): boolean => {
  const elementBounds = getElementBounds(element);
  
  return !(
    elementBounds.x + elementBounds.width < bounds.x ||
    elementBounds.y + elementBounds.height < bounds.y ||
    elementBounds.x > bounds.x + bounds.width ||
    elementBounds.y > bounds.y + bounds.height
  );
};

/**
 * Get element bounds for intersection testing
 */
const getElementBounds = (element: CanvasElement): Bounds => {
  const width = element.width || 100;
  const height = element.height || 100;
  
  // Handle different element types
  switch (element.type) {
    case 'text':
    case 'sticky-note':
      return {
        x: element.x,
        y: element.y,
        width: width,
        height: height
      };
    
    case 'line':
      if (element.points && element.points.length >= 2) {
        const xs = element.points.map(p => p.x);
        const ys = element.points.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        
        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
      }
      break;
    
    case 'drawing':
      if (element.points && element.points.length > 0) {
        const xs = element.points.map(p => p.x);
        const ys = element.points.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        
        return {
          x: minX,
          y: minY,
          width: maxX - minX + 10, // Add some padding for stroke
          height: maxY - minY + 10
        };
      }
      break;
  }

  // Default rectangular bounds
  return {
    x: element.x,
    y: element.y,
    width: width,
    height: height
  };
};

/**
 * Marquee visual renderer component
 */
interface MarqueeRendererProps {
  bounds: Bounds;
}

const MarqueeRenderer = React.forwardRef<Graphics, MarqueeRendererProps>(
  ({ bounds }, ref) => {
    const draw = useCallback((g: Graphics) => {
      g.clear();
      
      // Draw marquee rectangle
      g.setStrokeStyle({
        width: 1,
        color: 0x007ACC, // VS Code blue
        alpha: 0.8
      });
      
      g.setFillStyle({
        color: 0x007ACC,
        alpha: 0.1
      });
      
      g.rect(bounds.x, bounds.y, bounds.width, bounds.height);
      g.fill();
      g.stroke();
      
      // Store reference for cleanup
      if (ref && typeof ref !== 'function') {
        ref.current = g;
      }
    }, [bounds, ref]);

    return (
      <Graphics
        draw={draw}
        x={0}
        y={0}
        interactive={false}
        eventMode="none"
      />
    );
  }
);

MarqueeRenderer.displayName = 'MarqueeRenderer';

/**
 * Enhanced selection manager with marquee support
 */
export class SelectionManager {
  private selectedIds = new Set<string>();
  private onSelectionChange: (ids: string[]) => void;

  constructor(onSelectionChange: (ids: string[]) => void) {
    this.onSelectionChange = onSelectionChange;
  }

  select(id: string, addToSelection = false): void {
    if (addToSelection) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
      } else {
        this.selectedIds.add(id);
      }
    } else {
      this.selectedIds.clear();
      this.selectedIds.add(id);
    }
    
    this.notifyChange();
  }

  selectMultiple(ids: string[], addToSelection = false): void {
    if (!addToSelection) {
      this.selectedIds.clear();
    }
    
    ids.forEach(id => this.selectedIds.add(id));
    this.notifyChange();
  }

  deselect(id: string): void {
    this.selectedIds.delete(id);
    this.notifyChange();
  }

  clear(): void {
    this.selectedIds.clear();
    this.notifyChange();
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  private notifyChange(): void {
    this.onSelectionChange(this.getSelectedIds());
  }
}
