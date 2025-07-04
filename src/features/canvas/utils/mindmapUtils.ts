import { nanoid } from 'nanoid';
import { TextElement, ConnectorElement, ElementId } from '../types/enhanced.types';

export const createMindmapStructure = (x: number, y: number) => {
  const centralNode: TextElement = {
    id: nanoid() as ElementId,
    type: 'text',
    x: x - 90,
    y: y - 12,
    text: 'Any question or topic',
    fontSize: 18,
    fontFamily: 'Inter, sans-serif',
    fill: '#1F2937',
    isLocked: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isHidden: false,
  };

  const childNodesData = [
    { text: 'A concept', offsetX: 160, offsetY: -80 },
    { text: 'An idea', offsetX: 160, offsetY: 0 },
    { text: 'A thought', offsetX: 160, offsetY: 80 },
  ];

  const childNodes: TextElement[] = childNodesData.map(child => {
    return {
      id: nanoid() as ElementId,
      type: 'text',
      x: x + child.offsetX,
      y: y + child.offsetY - 10,
      text: child.text,
      fontSize: 16,
      fontFamily: 'Inter, sans-serif',
      fill: '#374151',
      isLocked: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isHidden: false,
    };
  });

  const connectors: ConnectorElement[] = childNodes.map((childNode, index) => {
    const startX = x + 90; // Closer to the end of central text
    const startY = y;

    const endX = childNode.x - 10; // Left edge of child text
    const endY = childNode.y + 10; // Center of child text

    // Create smooth curves for top and bottom, straight line for middle
    let intermediatePoints: { x: number; y: number }[] = [];
    
    if (index === 0) { // Top curve (A concept)
      const controlX1 = startX + 25;
      const controlY1 = startY - 15;
      const controlX2 = endX - 25;
      const controlY2 = endY + 15;
      intermediatePoints = [{ x: controlX1, y: controlY1 }, { x: controlX2, y: controlY2 }];
    } else if (index === 2) { // Bottom curve (A thought)
      const controlX1 = startX + 25;
      const controlY1 = startY + 15;
      const controlX2 = endX - 25;
      const controlY2 = endY - 15;
      intermediatePoints = [{ x: controlX1, y: controlY1 }, { x: controlX2, y: controlY2 }];
    }
    // Middle line (An idea) has no intermediate points, so it's straight

    return {
      id: nanoid() as ElementId,
      type: 'connector',
      subType: 'curved',
      startElementId: centralNode.id,
      endElementId: childNode.id,
      startPoint: { x: startX, y: startY },
      endPoint: { x: endX, y: endY },
      intermediatePoints,
      stroke: '#9CA3AF',
      strokeWidth: 1.5,
      connectorStyle: {
        endArrow: 'none',
        strokeDashArray: [],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      x: 0,
      y: 0,
    };
  });

  return {
    centralNode,
    childNodes,
    connectors,
  };
}; 