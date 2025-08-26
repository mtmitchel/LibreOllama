import { CanvasElement } from '../types/enhanced.types';

// Basic snapping utilities
export function calculateSnapLines(draggedElement: CanvasElement, elements: CanvasElement[]): any[] {
  const snapLines: any[] = [];
  const draggedRect = { x: draggedElement.x, y: draggedElement.y, width: draggedElement.width, height: draggedElement.height };

  elements.forEach(element => {
    if (element.id === draggedElement.id) return; // Don't snap to self

    const targetRect = { x: element.x, y: element.y, width: element.width, height: element.height };

    // Horizontal snap lines
    // Top to top
    if (Math.abs(draggedRect.y - targetRect.y) < 5) {
      snapLines.push({ points: [draggedRect.x, targetRect.y, draggedRect.x + draggedRect.width, targetRect.y], type: 'horizontal' });
    }
    // Top to bottom
    if (Math.abs(draggedRect.y - (targetRect.y + targetRect.height)) < 5) {
      snapLines.push({ points: [draggedRect.x, targetRect.y + targetRect.height, draggedRect.x + draggedRect.width, targetRect.y + targetRect.height], type: 'horizontal' });
    }
    // Bottom to top
    if (Math.abs((draggedRect.y + draggedRect.height) - targetRect.y) < 5) {
      snapLines.push({ points: [draggedRect.x, targetRect.y, draggedRect.x + draggedRect.width, targetRect.y], type: 'horizontal' });
    }
    // Bottom to bottom
    if (Math.abs((draggedRect.y + draggedRect.height) - (targetRect.y + targetRect.height)) < 5) {
      snapLines.push({ points: [draggedRect.x, targetRect.y + targetRect.height, draggedRect.x + draggedRect.width, targetRect.y + targetRect.height], type: 'horizontal' });
    }
    // Center Y to Center Y
    if (Math.abs((draggedRect.y + draggedRect.height / 2) - (targetRect.y + targetRect.height / 2)) < 5) {
      snapLines.push({ points: [draggedRect.x, targetRect.y + targetRect.height / 2, draggedRect.x + draggedRect.width, targetRect.y + targetRect.height / 2], type: 'horizontal' });
    }

    // Vertical snap lines
    // Left to left
    if (Math.abs(draggedRect.x - targetRect.x) < 5) {
      snapLines.push({ points: [targetRect.x, draggedRect.y, targetRect.x, draggedRect.y + draggedRect.height], type: 'vertical' });
    }
    // Left to right
    if (Math.abs(draggedRect.x - (targetRect.x + targetRect.width)) < 5) {
      snapLines.push({ points: [targetRect.x + targetRect.width, draggedRect.y, targetRect.x + targetRect.width, draggedRect.y + draggedRect.height], type: 'vertical' });
    }
    // Right to left
    if (Math.abs((draggedRect.x + draggedRect.width) - targetRect.x) < 5) {
      snapLines.push({ points: [targetRect.x, draggedRect.y, targetRect.x, draggedRect.y + draggedRect.height], type: 'vertical' });
    }
    // Right to right
    if (Math.abs((draggedRect.x + draggedRect.width) - (targetRect.x + targetRect.width)) < 5) {
      snapLines.push({ points: [targetRect.x + targetRect.width, draggedRect.y, targetRect.x + targetRect.width, draggedRect.y + draggedRect.height], type: 'vertical' });
    }
    // Center X to Center X
    if (Math.abs((draggedRect.x + draggedRect.width / 2) - (targetRect.x + targetRect.width / 2)) < 5) {
      snapLines.push({ points: [targetRect.x + targetRect.width / 2, draggedRect.y, targetRect.x + targetRect.width / 2, draggedRect.y + draggedRect.height], type: 'vertical' });
    }
  });

  return snapLines;
}

export function getSnapPoints(element: any): any[] {
  if (!element) return [];
  const { x, y, width, height } = element;
  if (width === undefined || height === undefined) return [];

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

export function findNearestSnapPoint(position: any, elements: CanvasElement[], threshold = 20): any | null {
  let nearestSnapPoint = null;
  let minDistance = threshold;

  elements.forEach(element => {
    const snapPoints = getSnapPoints(element);
    snapPoints.forEach(snapPoint => {
      const distance = Math.sqrt((position.x - snapPoint.x) ** 2 + (position.y - snapPoint.y) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        nearestSnapPoint = { ...snapPoint, elementId: element.id };
      }
    });
  });

  return nearestSnapPoint;
}