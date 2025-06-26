// src/features/canvas/utils/snappingUtils.ts
import { CanvasElement } from '../types/enhanced.types';
import { SnapLine } from '../stores/slices/snappingStore';

const getElementPoints = (element: CanvasElement) => {
  const { x, y } = element;
  
  // Get width and height based on element type
  let width = 0;
  let height = 0;
  
  if ('width' in element && 'height' in element) {
    width = element.width || 0;
    height = element.height || 0;
  } else if (element.type === 'circle' && 'radius' in element) {
    width = height = (element.radius || 0) * 2;
  } else if (element.type === 'pen' && 'points' in element) {
    // For pen elements, calculate bounding box from points
    const points = element.points || [];
    if (points.length >= 4) {
      const xCoords = points.filter((_, i) => i % 2 === 0);
      const yCoords = points.filter((_, i) => i % 2 === 1);
      width = Math.max(...xCoords) - Math.min(...xCoords);
      height = Math.max(...yCoords) - Math.min(...yCoords);
    }
  }
  
  return {
    vertical: [x, x + width / 2, x + width],
    horizontal: [y, y + height / 2, y + height],
  };
};

export const calculateSnapLines = (
  draggedElement: CanvasElement,
  elements: CanvasElement[],
  snapTolerance: number
): SnapLine[] => {
  const snapLines: SnapLine[] = [];
  const draggedPoints = getElementPoints(draggedElement);

  elements.forEach((element) => {
    if (element.id === draggedElement.id) return;

    const elementPoints = getElementPoints(element);

    // Vertical snap lines
    draggedPoints.vertical.forEach((draggedPoint) => {
      elementPoints.vertical.forEach((elementPoint) => {
        if (Math.abs(draggedPoint - elementPoint) < snapTolerance) {
          snapLines.push({
            points: [elementPoint, -10000, elementPoint, 10000],
            stroke: '#ff0000',
          });
        }
      });
    });

    // Horizontal snap lines
    draggedPoints.horizontal.forEach((draggedPoint) => {
      elementPoints.horizontal.forEach((elementPoint) => {
        if (Math.abs(draggedPoint - elementPoint) < snapTolerance) {
          snapLines.push({
            points: [-10000, elementPoint, 10000, elementPoint],
            stroke: '#ff0000',
          });
        }
      });
    });
  });

  return snapLines;
};