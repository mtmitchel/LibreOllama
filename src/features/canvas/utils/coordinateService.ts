/**
 * Coordinate Conversion Service - FIXED VERSION
 * 
 * This service handles the conversion between different coordinate spaces in the canvas.
 * Fixed to remove circular dependencies.
 * 
 * Coordinate System Design:
 * - Elements without a sectionId use absolute canvas coordinates
 * - Elements with a sectionId use section-relative coordinates
 * - Konva Groups handle the transform automatically during rendering
 * 
 * This approach eliminates the need for manual coordinate updates when sections move,
 * as the Group transform automatically positions child elements correctly.
 */

import { CanvasElement } from '../../../types';
import { SectionElement } from '../../../types/section';
import Konva from 'konva';

// Define coordinate types locally since they're simple
export interface Coordinates {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
   * @param point Point in world coordinates
   * @param sections Array of all sections
   * @param stage Optional Konva stage for coordinate transformation
   * @returns The section containing the point, or null
   */
  static findSectionAtPoint(
    point: { x: number; y: number }, 
    sections: SectionElement[], 
    stage?: Konva.Stage | null
  ): string | null {
    console.log('🔍 [COORDINATE SERVICE] findSectionAtPoint called with:', point);

    let worldPoint = point;

    // If stage is provided and has a pointer position, use it for more accurate detection
    if (stage) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        // Transform the screen-based point to canvas-based (world) coordinates
        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        worldPoint = transform.point(pointerPosition);
      }
    }

    console.log('🔍 [COORDINATE SERVICE] World point:', worldPoint);
    console.log('🔍 [COORDINATE SERVICE] Checking sections:', { 
      sections, 
      isArray: Array.isArray(sections), 
      length: sections ? sections.length : 'N/A' 
    });

    // Ensure sections is an array
    if (!Array.isArray(sections)) {
      console.warn('⚠️ [COORDINATE SERVICE] sections is not an array, converting or returning null');
      if (!sections) {
        return null;
      }
      // If sections is a record, convert to array
      if (typeof sections === 'object') {
        sections = Object.values(sections);
      } else {
        return null;
      }
    }

    for (const section of sections) {
      console.log(`🔍 [COORDINATE SERVICE] Checking section ${section.id}:`, {
        x: section.x,
        y: section.y,
        width: section.width,
        height: section.height
      });

      if (
        worldPoint.x >= section.x &&
        worldPoint.x <= section.x + section.width &&
        worldPoint.y >= section.y &&
        worldPoint.y <= section.y + section.height
      ) {
        console.log(`✅ [COORDINATE SERVICE] Found section for point:`, section.id);
        return section.id;
      }
    }

    console.log('❌ [COORDINATE SERVICE] No section found for point:', worldPoint);
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