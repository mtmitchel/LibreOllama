import { CanvasElement, ElementId } from '../types/enhanced.types';
import { Position } from '../types/event.types';

// Snap line interface
interface SnapLine {
  points: [number, number, number, number]; // [x1, y1, x2, y2]
  type: 'horizontal' | 'vertical';
  elementId: ElementId;
}

// Snap point interface
interface SnapPoint extends Position {
  type: 'top-left' | 'top-center' | 'top-right' | 
        'middle-left' | 'middle-right' |
        'bottom-left' | 'bottom-center' | 'bottom-right';
  elementId?: ElementId;
}

// Element bounds interface
interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Helper function to get element bounds
function getElementBounds(element: CanvasElement): ElementBounds {
  let width = 100; // Default fallback
  let height = 100;
  
  // Handle different element types with proper type safety
  if (element.type === 'rectangle' || element.type === 'text' || element.type === 'sticky-note') {
    width = (element as any).width ?? 100;
    height = (element as any).height ?? 100;
  } else if (element.type === 'circle') {
    const radius = (element as any).radius ?? 50;
    width = radius * 2;
    height = radius * 2;
  }
  
  return {
    x: element.x,
    y: element.y,
    width,
    height
  };
}

// Basic snapping utilities (alignment-centric)
export function calculateSnapLines(draggedElement: CanvasElement, elements: CanvasElement[]): SnapLine[] {
  const snapLines: SnapLine[] = [];
  const draggedRect = getElementBounds(draggedElement);

  elements.forEach(element => {
    if (element.id === draggedElement.id) return; // Don't snap to self

    const targetRect = getElementBounds(element);

    // Horizontal snap lines
    // Top to top
    if (Math.abs(draggedRect.y - targetRect.y) < 5) {
      snapLines.push({ 
        points: [draggedRect.x, targetRect.y, draggedRect.x + draggedRect.width, targetRect.y], 
        type: 'horizontal',
        elementId: element.id as ElementId
      });
    }
    // Top to bottom
    if (Math.abs(draggedRect.y - (targetRect.y + targetRect.height)) < 5) {
      snapLines.push({ 
        points: [draggedRect.x, targetRect.y + targetRect.height, draggedRect.x + draggedRect.width, targetRect.y + targetRect.height], 
        type: 'horizontal',
        elementId: element.id as ElementId
      });
    }
    // Bottom to top
    if (Math.abs((draggedRect.y + draggedRect.height) - targetRect.y) < 5) {
      snapLines.push({ 
        points: [draggedRect.x, targetRect.y, draggedRect.x + draggedRect.width, targetRect.y], 
        type: 'horizontal',
        elementId: element.id as ElementId
      });
    }
    // Bottom to bottom
    if (Math.abs((draggedRect.y + draggedRect.height) - (targetRect.y + targetRect.height)) < 5) {
      snapLines.push({ 
        points: [draggedRect.x, targetRect.y + targetRect.height, draggedRect.x + draggedRect.width, targetRect.y + targetRect.height], 
        type: 'horizontal',
        elementId: element.id as ElementId
      });
    }
    // Center Y to Center Y
    if (Math.abs((draggedRect.y + draggedRect.height / 2) - (targetRect.y + targetRect.height / 2)) < 5) {
      snapLines.push({ 
        points: [draggedRect.x, targetRect.y + targetRect.height / 2, draggedRect.x + draggedRect.width, targetRect.y + targetRect.height / 2], 
        type: 'horizontal',
        elementId: element.id as ElementId
      });
    }

    // Vertical snap lines
    // Left to left
    if (Math.abs(draggedRect.x - targetRect.x) < 5) {
      snapLines.push({ 
        points: [targetRect.x, draggedRect.y, targetRect.x, draggedRect.y + draggedRect.height], 
        type: 'vertical',
        elementId: element.id as ElementId
      });
    }
    // Left to right
    if (Math.abs(draggedRect.x - (targetRect.x + targetRect.width)) < 5) {
      snapLines.push({ 
        points: [targetRect.x + targetRect.width, draggedRect.y, targetRect.x + targetRect.width, draggedRect.y + draggedRect.height], 
        type: 'vertical',
        elementId: element.id as ElementId
      });
    }
    // Right to left
    if (Math.abs((draggedRect.x + draggedRect.width) - targetRect.x) < 5) {
      snapLines.push({ 
        points: [targetRect.x, draggedRect.y, targetRect.x, draggedRect.y + draggedRect.height], 
        type: 'vertical',
        elementId: element.id as ElementId
      });
    }
    // Right to right
    if (Math.abs((draggedRect.x + draggedRect.width) - (targetRect.x + targetRect.width)) < 5) {
      snapLines.push({ 
        points: [targetRect.x + targetRect.width, draggedRect.y, targetRect.x + targetRect.width, draggedRect.y + draggedRect.height], 
        type: 'vertical',
        elementId: element.id as ElementId
      });
    }
    // Center X to Center X
    if (Math.abs((draggedRect.x + draggedRect.width / 2) - (targetRect.x + targetRect.width / 2)) < 5) {
      snapLines.push({ 
        points: [targetRect.x + targetRect.width / 2, draggedRect.y, targetRect.x + targetRect.width / 2, draggedRect.y + draggedRect.height], 
        type: 'vertical',
        elementId: element.id as ElementId
      });
    }
  });

  return snapLines;
}

export function getSnapPoints(element: CanvasElement): SnapPoint[] {
  if (!element) return [];
  const bounds = getElementBounds(element);
  const { x, y, width, height } = bounds;

  return [
    { x, y, type: 'top-left' },
    { x: x + width / 2, y, type: 'top-center' },
    { x: x + width, y, type: 'top-right' },
    { x, y: y + height / 2, type: 'middle-left' },
    { x: x + width, y: y + height / 2, type: 'middle-right' },
    { x, y: y + height, type: 'bottom-left' },
    { x: x + width / 2, y: y + height, type: 'bottom-center' },
    { x: x + width, y: y + height, type: 'bottom-right' },
  ];
}

export function findNearestSnapPoint(
  position: Position, 
  elements: CanvasElement[], 
  threshold = 20
): (SnapPoint & { distance: number }) | null {
  let nearestSnapPoint: (SnapPoint & { distance: number }) | null = null;
  let minDistance = threshold;

  elements.forEach(element => {
    const snapPoints = getSnapPoints(element);
    snapPoints.forEach(snapPoint => {
      const distance = Math.sqrt((position.x - snapPoint.x) ** 2 + (position.y - snapPoint.y) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        nearestSnapPoint = { 
          ...snapPoint, 
          elementId: element.id as ElementId,
          distance 
        };
      }
    });
  });

  return nearestSnapPoint;
}

export function applySnapping(
  element: CanvasElement, 
  newPosition: { x: number; y: number }, 
  allElements: CanvasElement[], 
  threshold = 5
): { x: number; y: number; snapped: boolean } {
  const snappedElement = { ...element, x: newPosition.x, y: newPosition.y };
  const snapLines = calculateSnapLines(snappedElement, allElements);
  const snappedBounds = getElementBounds(snappedElement);
  
  let adjustedX = newPosition.x;
  let adjustedY = newPosition.y;
  let hasSnapped = false;

  snapLines.forEach(snapLine => {
    if (snapLine.type === 'horizontal') {
      const snapY = snapLine.points[1]; // y coordinate of horizontal line
      if (Math.abs(snappedElement.y - snapY) < threshold) {
        adjustedY = snapY;
        hasSnapped = true;
      } else if (Math.abs((snappedElement.y + snappedBounds.height) - snapY) < threshold) {
        adjustedY = snapY - snappedBounds.height;
        hasSnapped = true;
      }
    } else if (snapLine.type === 'vertical') {
      const snapX = snapLine.points[0]; // x coordinate of vertical line
      if (Math.abs(snappedElement.x - snapX) < threshold) {
        adjustedX = snapX;
        hasSnapped = true;
      } else if (Math.abs((snappedElement.x + snappedBounds.width) - snapX) < threshold) {
        adjustedX = snapX - snappedBounds.width;
        hasSnapped = true;
      }
    }
  });

  return { x: adjustedX, y: adjustedY, snapped: hasSnapped };
}

export function createBoundBoxFunc(
  element: CanvasElement,
  allElements: CanvasElement[],
  enableSnapping = true
): (oldBox: any, newBox: any) => any {
  return (oldBox: any, newBox: any) => {
    if (!enableSnapping) {
      return newBox;
    }

    // Apply snapping to the transformed position
    const snappingResult = applySnapping(
      element,
      { x: newBox.x, y: newBox.y },
      allElements
    );

    return {
      ...newBox,
      x: snappingResult.x,
      y: snappingResult.y,
    };
  };
}
