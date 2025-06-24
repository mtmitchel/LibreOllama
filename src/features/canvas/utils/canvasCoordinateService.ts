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

import { CanvasElement, SectionElement, isRectangularElement, isCircleElement } from '../types/enhanced.types';
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
   * Validate coordinates to ensure they are valid numbers
   * @param coords Coordinates to validate
   * @returns True if coordinates are valid
   */
  static validateCoordinates(coords: Coordinates): boolean {
    return (
      typeof coords.x === 'number' &&
      typeof coords.y === 'number' &&
      !isNaN(coords.x) &&
      !isNaN(coords.y) &&
      isFinite(coords.x) &&
      isFinite(coords.y)
    );
  }

  /**
   * Sanitize coordinates to prevent invalid values and fix precision issues
   * @param coords Coordinates to sanitize
   * @returns Sanitized coordinates
   */
  static sanitizeCoordinates(coords: Coordinates): Coordinates {
    const x = (typeof coords.x === 'number' && !isNaN(coords.x) && isFinite(coords.x)) ? coords.x : 0;
    const y = (typeof coords.y === 'number' && !isNaN(coords.y) && isFinite(coords.y)) ? coords.y : 0;
    
    // Round to 2 decimal places to prevent floating point precision issues
    // This eliminates fractional coordinates like 0.3926189747841434
    return { 
      x: Math.round(x * 100) / 100, 
      y: Math.round(y * 100) / 100 
    };
  }

  /**
   * Convert element coordinates to absolute canvas coordinates
   * @param element The element to convert
   * @param sections Record of all sections
   * @returns Absolute coordinates (validated)
   */
  static toAbsolute(element: CanvasElement, sections: Record<string, SectionElement>): Coordinates {
    // Validate element coordinates first
    const elementCoords = this.sanitizeCoordinates({ x: element.x, y: element.y });
    
    // If element has no section, it's already in absolute coordinates
    if (!element.sectionId) {
      return elementCoords;
    }
    
    const section = sections[element.sectionId];
    if (!section) {
      return elementCoords;
    }
    
    // Validate section coordinates
    const sectionCoords = this.sanitizeCoordinates({ x: section.x, y: section.y });
    
    // Convert relative coordinates to absolute by adding section position
    const absoluteCoords = {
      x: sectionCoords.x + elementCoords.x,
      y: sectionCoords.y + elementCoords.y
    };
    
    return this.sanitizeCoordinates(absoluteCoords);
  }
  
  /**
   * Convert absolute coordinates to section-relative coordinates
   * @param absoluteCoords Absolute canvas coordinates
   * @param section The section to convert relative to
   * @returns Section-relative coordinates (validated)
   */
  static toRelative(absoluteCoords: Coordinates, section: SectionElement): Coordinates {
    const validAbsolute = this.sanitizeCoordinates(absoluteCoords);
    const validSection = this.sanitizeCoordinates({ x: section.x, y: section.y });
    
    const relativeCoords = {
      x: validAbsolute.x - validSection.x,
      y: validAbsolute.y - validSection.y
    };
    
    return this.sanitizeCoordinates(relativeCoords);
  }

  /**
   * Safe coordinate conversion for drag operations
   * Determines if element is in a section and converts coordinates appropriately
   * @param absolutePosition Absolute position from Konva node
   * @param element The element being dragged
   * @param sections All available sections
   * @returns Object with final coordinates and section assignment
   */
  static convertDragCoordinates(
    absolutePosition: Coordinates,
    element: CanvasElement,
    sections: Record<string, SectionElement>
  ): {
    coordinates: Coordinates;
    sectionId: string | null;
    needsUpdate: boolean;
  } {
    const validAbsolute = this.sanitizeCoordinates(absolutePosition);
    
    // Find which section (if any) contains this position
    const targetSectionId = this.findSectionAtPoint(validAbsolute, Object.values(sections));
    const currentSectionId = element.sectionId || null;
    
    let finalCoordinates: Coordinates;
    let needsUpdate = true; // FIXED: Always allow updates for testing and user interactions
    
    if (targetSectionId) {
      // Element is in a section - convert to relative coordinates
      const section = sections[targetSectionId];
      if (!section) {
        finalCoordinates = validAbsolute;
      } else {
        finalCoordinates = this.toRelative(validAbsolute, section);
      }
    } else {
      // Element is on main canvas - use absolute coordinates
      finalCoordinates = validAbsolute;
    }
    
    return {
      coordinates: finalCoordinates,
      sectionId: targetSectionId,
      needsUpdate
    };
  }

  /**
   * Convert screen-space delta to canvas-space delta
   * @param screenDelta Delta in screen coordinates (from pointer movement)
   * @param canvasScale Current canvas zoom scale
   * @returns Delta in canvas coordinate space
   */
  static screenDeltaToCanvasDelta(screenDelta: Coordinates, canvasScale: number): Coordinates {
    const validDelta = this.sanitizeCoordinates(screenDelta);
    const scale = Math.max(0.01, Math.min(100, canvasScale)); // Clamp scale to reasonable bounds
    
    return {
      x: validDelta.x / scale,
      y: validDelta.y / scale
    };
  }

  /**
   * Apply delta to element coordinates while preserving coordinate system
   * @param element Element to update
   * @param canvasDelta Delta in canvas coordinate space
   * @param sections All available sections
   * @returns New coordinates in the correct coordinate system
   */
  static applyDeltaToElement(
    element: CanvasElement,
    canvasDelta: Coordinates,
    _sections: Record<string, SectionElement>
  ): {
    coordinates: Coordinates;
    isValid: boolean;
  } {
    // const _validDelta = this.sanitizeCoordinates(canvasDelta);
    const currentCoords = this.sanitizeCoordinates({ x: element.x, y: element.y });
    
    const newCoords = {
      x: currentCoords.x + canvasDelta.x,
      y: currentCoords.y + canvasDelta.y
    };
    
    return { coordinates: this.sanitizeCoordinates(newCoords), isValid: true };
  }

  /**
   * Find which section contains a given point
   * @param point The point to check
   * @param sections Array of all sections
   * @returns The ID of the containing section, or null
   */
  static findSectionAtPoint(point: Coordinates, sections: SectionElement[]): string | null {
    const validPoint = this.sanitizeCoordinates(point);
    
    // Find the top-most section that contains the point
    const containingSection = sections
      .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
      .find(section => {
        // Simple rectangle intersection check without Konva dependency
        const isInside = validPoint.x >= section.x && 
                        validPoint.x <= section.x + section.width &&
                        validPoint.y >= section.y && 
                        validPoint.y <= section.y + section.height;
        return isInside;
      });
      
    return containingSection ? containingSection.id : null;
  }

  /**
   * Constrain an element's position within the boundaries of its section
   * @param relativePos The element's position relative to the section
   * @param element The element to constrain
   * @param section The section to constrain to
   * @param padding Optional padding inside the section boundary
   * @returns Constrained relative coordinates
   */
  static constrainToSection(
    relativePos: Coordinates,
    element: CanvasElement,
    section: SectionElement,
    padding = 10
  ): Coordinates {
    const validPos = this.sanitizeCoordinates(relativePos);
    
    let elementWidth = 0;
    let elementHeight = 0;

    if (isRectangularElement(element)) {
      elementWidth = element.width;
      elementHeight = element.height;
    } else if (isCircleElement(element)) {
      elementWidth = element.radius * 2;
      elementHeight = element.radius * 2;
    }
    
    const minX = padding;
    const maxX = section.width - elementWidth - padding;
    const minY = padding;
    const maxY = section.height - elementHeight - padding;
    
    const constrainedX = Math.max(minX, Math.min(maxX, validPos.x));
    const constrainedY = Math.max(minY, Math.min(maxY, validPos.y));
    
    return this.sanitizeCoordinates({ x: constrainedX, y: constrainedY });
  }

  /**
   * Check if two coordinate objects are equal
   * @param c1 First coordinate object
   * @param c2 Second coordinate object
   * @returns True if coordinates are equal
   */
  static coordinatesEqual(c1: Coordinates, c2: Coordinates): boolean {
    return c1.x === c2.x && c1.y === c2.y;
  }
}