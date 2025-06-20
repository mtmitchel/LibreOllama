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
      console.warn(`Section ${element.sectionId} not found for element ${element.id}`);
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
    let needsUpdate = false;
    
    if (targetSectionId) {
      // Element is in a section - convert to relative coordinates
      const section = sections[targetSectionId];
      if (!section) {
        console.warn(`Target section ${targetSectionId} not found during drag conversion`);
        finalCoordinates = validAbsolute;
        needsUpdate = true;
      } else {
        finalCoordinates = this.toRelative(validAbsolute, section);
        needsUpdate = (targetSectionId !== currentSectionId) || 
                     !this.coordinatesEqual(finalCoordinates, { x: element.x, y: element.y });
      }
    } else {
      // Element is on main canvas - use absolute coordinates
      finalCoordinates = validAbsolute;
      needsUpdate = (currentSectionId !== null) || 
                   !this.coordinatesEqual(finalCoordinates, { x: element.x, y: element.y });
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
    sections: Record<string, SectionElement>
  ): {
    coordinates: Coordinates;
    isValid: boolean;
  } {
    const validDelta = this.sanitizeCoordinates(canvasDelta);
    const currentCoords = this.sanitizeCoordinates({ x: element.x, y: element.y });
    
    // Calculate new coordinates by applying delta
    const newCoords = {
      x: currentCoords.x + validDelta.x,
      y: currentCoords.y + validDelta.y
    };
    
    // Validate the result
    const isValid = this.validateCoordinates(newCoords);
    
    return {
      coordinates: isValid ? newCoords : currentCoords,
      isValid
    };
  }

  /**
   * Batch apply delta to multiple elements while preserving their coordinate systems
   * @param elements Elements to update with their current coordinates
   * @param canvasDelta Delta in canvas coordinate space
   * @param sections All available sections
   * @returns Updates for each element that needs to be changed
   */
  static batchApplyDelta(
    elements: Record<string, CanvasElement>,
    canvasDelta: Coordinates,
    sections: Record<string, SectionElement>
  ): Record<string, { x: number; y: number }> {
    const updates: Record<string, { x: number; y: number }> = {};
    
    Object.entries(elements).forEach(([elementId, element]) => {
      const result = this.applyDeltaToElement(element, canvasDelta, sections);
      
      if (result.isValid && !this.coordinatesEqual(result.coordinates, { x: element.x, y: element.y })) {
        updates[elementId] = result.coordinates;
      }
    });
    
    return updates;
  }

  /**
   * Check if two coordinate pairs are equal within a small tolerance
   * @param coords1 First coordinate pair
   * @param coords2 Second coordinate pair
   * @param tolerance Tolerance for comparison (default: 0.5 pixels)
   * @returns True if coordinates are essentially equal
   */
  static coordinatesEqual(coords1: Coordinates, coords2: Coordinates, tolerance = 0.5): boolean {
    return Math.abs(coords1.x - coords2.x) < tolerance && 
           Math.abs(coords1.y - coords2.y) < tolerance;
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
        height: section.height,
        bounds: `(${section.x}, ${section.y}) to (${section.x + section.width}, ${section.y + section.height})`
      });

      const isInside = (
        worldPoint.x >= section.x &&
        worldPoint.x <= section.x + section.width &&
        worldPoint.y >= section.y &&
        worldPoint.y <= section.y + section.height
      );

      console.log(`🔍 [COORDINATE SERVICE] Point (${worldPoint.x}, ${worldPoint.y}) vs section bounds:`, {
        xInRange: `${worldPoint.x} >= ${section.x} && ${worldPoint.x} <= ${section.x + section.width} = ${worldPoint.x >= section.x && worldPoint.x <= section.x + section.width}`,
        yInRange: `${worldPoint.y} >= ${section.y} && ${worldPoint.y} <= ${section.y + section.height} = ${worldPoint.y >= section.y && worldPoint.y <= section.y + section.height}`,
        isInside
      });

      if (isInside) {
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

  /**
   * Constrain element coordinates to stay within section bounds
   * @param coords Coordinates to constrain (in section-relative coordinate space)
   * @param element Element being constrained (for dimensions)
   * @param section Section to constrain within
   * @param padding Optional padding from section edges
   * @returns Constrained coordinates (in section-relative coordinate space)
   */
  static constrainToSection(
    coords: Coordinates,
    element: CanvasElement,
    section: SectionElement,
    padding: number = 5  // Reduced from 10 to allow more freedom
  ): Coordinates {
    const elementWidth = element.width || 100;
    const elementHeight = element.height || 50;
    const titleBarHeight = section.titleBarHeight || 32;
    const sectionWidth = section.width || 300;
    const sectionHeight = section.height || 200;
    
    // Calculate bounds in section-relative coordinates (starting from 0,0)
    // Allow elements to get very close to the left edge (just 2px padding)
    const minX = 2;  // Minimal left padding
    const minY = titleBarHeight + padding;
    
    // Calculate maximum position where element can be placed
    // Allow more overflow - only require 20% of element to stay visible
    const visibleRatio = 0.2;  // Only 20% needs to stay visible
    const maxX = sectionWidth - (elementWidth * visibleRatio);
    const maxY = sectionHeight - (elementHeight * visibleRatio);
    
    // Ensure maxX/maxY are never less than minX/minY
    const clampedMaxX = Math.max(minX, maxX);
    const clampedMaxY = Math.max(minY, maxY);
    
    // Debug logging to understand constraint values
    console.log(`[ConstrainToSection] Element ${element.id}:`, {
      requested: coords,
      elementSize: { width: elementWidth, height: elementHeight },
      sectionSize: { width: sectionWidth, height: sectionHeight },
      bounds: { minX, minY, maxX: clampedMaxX, maxY: clampedMaxY },
      padding,
      titleBarHeight,
      visibleRatio,
      calculations: {
        maxXCalc: `${sectionWidth} - (${elementWidth} * ${visibleRatio}) = ${maxX}, clamped to ${clampedMaxX}`,
        maxYCalc: `${sectionHeight} - (${elementHeight} * ${visibleRatio}) = ${maxY}, clamped to ${clampedMaxY}`
      }
    });
    
    // Apply constraints - clamp coordinates to valid range
    const constrainedX = Math.max(minX, Math.min(clampedMaxX, coords.x));
    const constrainedY = Math.max(minY, Math.min(clampedMaxY, coords.y));
    
    const result = this.sanitizeCoordinates({ x: constrainedX, y: constrainedY });
    
    console.log(`[ConstrainToSection] Result:`, {
      original: coords,
      constrained: result,
      wasChanged: coords.x !== result.x || coords.y !== result.y
    });
    
    return result;
  }
}