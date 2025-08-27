// Section types for FigJam-style organizational containers

export interface SectionElement {
  id: string;
  type: 'section';
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  cornerRadius: number;
  isHidden: boolean;
  isLocked: boolean;
  containedElementIds: string[];
  templateType?: string; // For section templates
  // Visual customization
  titleBarHeight?: number;
  titleFontSize?: number;
  titleColor?: string;
  opacity?: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SectionTemplate {
  id: string;
  title: string;
  backgroundColor: string;
  borderColor: string;
  width: number;
  height: number;
  elements: Array<{
    type: string;
    text?: string;
    x: number;
    y: number;
    fontSize?: number;
    fontWeight?: string;
    fill?: string;
    width?: number;
    height?: number;
  }>;
}

// Predefined section templates
export const sectionTemplates: Record<string, SectionTemplate> = {
  brainstorm: {
    id: 'brainstorm',
    title: 'Brainstorm',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: '#FFC107',
    width: 400,
    height: 300,
    elements: [
      { 
        type: 'text', 
        text: 'Ideas', 
        fontSize: 18, 
        fontWeight: 'bold',
        x: 20,
        y: 50
      },
      { 
        type: 'sticky-note', 
        text: 'Idea 1', 
        x: 20, 
        y: 90,
        width: 160,
        height: 80
      },
      { 
        type: 'sticky-note', 
        text: 'Idea 2', 
        x: 200, 
        y: 90,
        width: 160,
        height: 80
      }
    ]
  },
  retrospective: {
    id: 'retrospective',
    title: 'Retrospective',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22C55E',
    width: 600,
    height: 350,
    elements: [
      { 
        type: 'text', 
        text: 'What went well?', 
        x: 20, 
        y: 50,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#22C55E'
      },
      { 
        type: 'text', 
        text: 'What could improve?', 
        x: 310, 
        y: 50,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#EF4444'
      },
      { 
        type: 'sticky-note', 
        text: '', 
        x: 20, 
        y: 90,
        width: 250,
        height: 100
      },
      { 
        type: 'sticky-note', 
        text: '', 
        x: 310, 
        y: 90,
        width: 250,
        height: 100
      }
    ]
  },
  userStoryMap: {
    id: 'userStoryMap',
    title: 'User Story Map',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: '#6366F1',
    width: 700,
    height: 400,
    elements: [
      { 
        type: 'text', 
        text: 'User Activities', 
        x: 20, 
        y: 50,
        fontSize: 16,
        fontWeight: 'bold'
      },
      { 
        type: 'text', 
        text: 'User Tasks', 
        x: 20, 
        y: 150,
        fontSize: 14
      },
      { 
        type: 'text', 
        text: 'User Stories', 
        x: 20, 
        y: 250,
        fontSize: 14
      }
    ]
  },
  kanban: {
    id: 'kanban',
    title: 'Kanban Board',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderColor: '#EC4899',
    width: 800,
    height: 500,
    elements: [
      { 
        type: 'text', 
        text: 'To Do', 
        x: 20, 
        y: 50,
        fontSize: 18,
        fontWeight: 'bold'
      },
      { 
        type: 'text', 
        text: 'In Progress', 
        x: 280, 
        y: 50,
        fontSize: 18,
        fontWeight: 'bold'
      },
      { 
        type: 'text', 
        text: 'Done', 
        x: 540, 
        y: 50,
        fontSize: 18,
        fontWeight: 'bold'
      }
    ]
  }
};

import { CanvasElement } from './enhanced.types';

// Helper functions for section operations
export function getElementBounds(element: CanvasElement): BoundingBox {
  // Handle different element types with proper type safety
  let width = 100; // Default fallback
  let height = 100;
  let x = element.x;
  let y = element.y;
  
  // Check if element has width/height properties
  if ('width' in element && element.width !== undefined) {
    width = element.width;
  }
  if ('height' in element && element.height !== undefined) {
    height = element.height;
  }
  
  // Special handling for circles
  if (element.type === 'circle' && 'radius' in element) {
    const radius = (element as any).radius ?? 50;
    width = radius * 2;
    height = radius * 2;
    x = element.x - radius; // Adjust to top-left corner
    y = element.y - radius;
  }
  
  return { x, y, width, height };
}

export function isElementInSection(element: CanvasElement, section: SectionElement): boolean {
  const elementBounds = getElementBounds(element);
  
  // For more robust section detection, require that the element's center 
  // is within the content area of the section (not just the title bar)
  const centerX = elementBounds.x + elementBounds.width / 2;
  const centerY = elementBounds.y + elementBounds.height / 2;
  
  const titleBarHeight = section.titleBarHeight || 40;
  const contentY = section.y + titleBarHeight;
  const contentHeight = section.height - titleBarHeight;
  
  return centerX >= section.x + 10 && // Add some margin
         centerX <= section.x + section.width - 10 &&
         centerY >= contentY + 10 && // Must be in content area, not title bar
         centerY <= contentY + contentHeight - 10;
}

export function doSectionsOverlap(section1: SectionElement, section2: SectionElement): boolean {
  return !(section1.x + section1.width < section2.x ||
           section2.x + section2.width < section1.x ||
           section1.y + section1.height < section2.y ||
           section2.y + section2.height < section1.y);
}

// Coordinate conversion utilities
export function convertAbsoluteToRelative(
  element: CanvasElement, 
  section: SectionElement
): { x: number; y: number } {
  return {
    x: element.x - section.x,
    y: element.y - section.y
  };
}

export function convertRelativeToAbsolute(relativeCoords: { x: number; y: number }, section: SectionElement): { x: number; y: number } {
  return {
    x: relativeCoords.x + section.x,
    y: relativeCoords.y + section.y
  };
}
