import { useMemo } from 'react';

interface CanvasElement {
  id: string;
  type: 'sticky-note' | 'rectangle' | 'circle' | 'text' | 'triangle' | 'square' | 'hexagon' | 'star' | 'drawing' | 'line' | 'arrow' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  backgroundColor?: string;
  url?: string;
  path?: string;
  x2?: number;
  y2?: number;
  imageUrl?: string;
  imageName?: string;
  fontSize?: 'small' | 'medium' | 'large';
  isBold?: boolean;
  isItalic?: boolean;
  isBulletList?: boolean;
  textAlignment?: 'left' | 'center' | 'right';
}

interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface UseViewportCullingProps {
  elements: CanvasElement[];
  zoomLevel: number;
  panOffset: { x: number; y: number };
  canvasSize: { width: number; height: number };
}

/**
 * Custom hook for viewport culling - only renders elements visible in the current viewport
 * This improves performance by reducing the number of DOM elements rendered
 */
export function useViewportCulling({
  elements,
  zoomLevel,
  panOffset,
  canvasSize
}: UseViewportCullingProps) {
  const visibleElements = useMemo(() => {
    // Calculate viewport bounds in canvas coordinates
    const viewportBounds: ViewportBounds = {
      left: -panOffset.x - 100, // Add 100px buffer for smooth scrolling
      top: -panOffset.y - 100,
      right: (canvasSize.width / zoomLevel) - panOffset.x + 100,
      bottom: (canvasSize.height / zoomLevel) - panOffset.y + 100
    };

    return elements.filter(element => {
      // Get element bounds
      let elementLeft = element.x;
      let elementTop = element.y;
      let elementRight = element.x + (element.width || 100);
      let elementBottom = element.y + (element.height || 100);

      // Handle line and arrow elements that use x2, y2
      if (element.type === 'line' || element.type === 'arrow') {
        elementLeft = Math.min(element.x, element.x2 || element.x);
        elementTop = Math.min(element.y, element.y2 || element.y);
        elementRight = Math.max(element.x, element.x2 || element.x);
        elementBottom = Math.max(element.y, element.y2 || element.y);
      }

      // Handle drawing elements that span the entire canvas
      if (element.type === 'drawing') {
        return true; // Always render drawings as they can span large areas
      }

      // Check if element intersects with viewport
      return !(
        elementRight < viewportBounds.left ||
        elementLeft > viewportBounds.right ||
        elementBottom < viewportBounds.top ||
        elementTop > viewportBounds.bottom
      );
    });
  }, [elements, zoomLevel, panOffset, canvasSize]);

  return {
    visibleElements,
    totalElements: elements.length,
    culledElements: elements.length - visibleElements.length
  };
}
