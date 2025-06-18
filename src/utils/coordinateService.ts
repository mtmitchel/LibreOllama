/**
 * Coordinate Conversion Service
 * 
 * This service handles the conversion between different coordinate spaces in the canvas.
 * 
 * Coordinate System Design:
 * - Elements without a sectionId use absolute canvas coordinates
 * - Elements with a sectionId use section-relative coordinates
 * - Konva Groups handle the transform automatically during rendering
 * 
 * This approach eliminates the need for manual coordinate updates when sections move,
 * as the Group transform automatically positions child elements correctly.
 */

import { CanvasElement } from '../features/canvas/stores/konvaCanvasStore';
import { SectionElement } from '../types/section';
import { Coordinates, BoundingBox } from '../types/index';

export class CoordinateService {
  /**
   * Convert element coordinates to absolute canvas coordinates
   * @param element The element to convert
   * @param sections Record of all sections
   * @returns Absolute coordinates
   */
  static toAbsolute(element: CanvasElement, sections: Record<string, SectionElement>): Coordinates {
    // If element has no section, it's already in absolute coordinates
    if (!element.sectionId) {
      return { x: element.x, y: element.y };
    }
    
    const section = sections[element.sectionId];
    if (!section) {
      console.warn(`Section ${element.sectionId} not found for element ${element.id}`);
      return { x: element.x, y: element.y };
    }
    
    // Convert relative coordinates to absolute by adding section position
    return {
      x: section.x + element.x,
      y: section.y + element.y
    };
  }
  
  /**
   * Convert absolute coordinates to section-relative coordinates
   * @param absoluteCoords Absolute canvas coordinates
   * @param section The section to convert relative to
   * @returns Section-relative coordinates
   */
  static toRelative(absoluteCoords: Coordinates, section: SectionElement): Coordinates {
    return {
      x: absoluteCoords.x - section.x,
      y: absoluteCoords.y - section.y
    };
  }
  
  /**
   * Get the bounding box of an element in absolute coordinates
   * @param element The element to get bounds for
   * @param sections Record of all sections
   * @returns Bounding box in absolute coordinates
   */
  static getElementBounds(element: CanvasElement, sections: Record<string, SectionElement>): BoundingBox {
    const absolute = this.toAbsolute(element, sections);
    
    // Default dimensions if not specified
    const width = element.width || 100;
    const height = element.height || 100;
    
    return {
      x: absolute.x,
      y: absolute.y,
      width,
      height
    };
  }
  
  /**
   * Check if a point is inside an element's bounds
   * @param point Point in absolute coordinates
   * @param element The element to check
   * @param sections Record of all sections
   * @returns True if point is inside element
   */
  static isPointInElement(point: Coordinates, element: CanvasElement, sections: Record<string, SectionElement>): boolean {
    const bounds = this.getElementBounds(element, sections);
    
    return point.x >= bounds.x &&
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y &&
           point.y <= bounds.y + bounds.height;
  }
  
  /**
   * Find which section contains a given point
   * @param point Point in absolute coordinates
   * @param sections Record of all sections
   * @returns The section containing the point, or null
   */
  static findSectionAtPoint(point: Coordinates, sections: Record<string, SectionElement>): SectionElement | null {
    // Check sections in reverse order (top to bottom in rendering order)
    const sectionArray = Object.values(sections);
    
    for (let i = sectionArray.length - 1; i >= 0; i--) {
      const section = sectionArray[i];
      if (section && point.x >= section.x &&
          point.x <= section.x + section.width &&
          point.y >= section.y &&
          point.y <= section.y + section.height) {
        return section;
      }
    }
    
    return null;
  }
  
  /**
   * Calculate the distance between two points
   * @param p1 First point
   * @param p2 Second point
   * @returns Distance between points
   */
  static distance(p1: Coordinates, p2: Coordinates): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Get the center point of an element in absolute coordinates
   * @param element The element
   * @param sections Record of all sections
   * @returns Center point in absolute coordinates
   */
  static getElementCenter(element: CanvasElement, sections: Record<string, SectionElement>): Coordinates {
    const bounds = this.getElementBounds(element, sections);
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    };
  }
}