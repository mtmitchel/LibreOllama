/**
 * Optimized Coordinate Service with Caching
 * Part of LibreOllama Canvas Refactoring - Phase 3
 * 
 * This service handles coordinate conversions between different coordinate spaces
 * with intelligent caching to avoid redundant calculations during drag operations.
 */

import { CanvasElement, SectionElement, Coordinates, ElementId, SectionId } from '../types/enhanced.types';

interface CoordinateCacheEntry {
  coords: Coordinates;
  timestamp: number;
  sectionVersion?: number | undefined;
  elementVersion?: number | undefined;
}

class CoordinateCache {
  private cache = new Map<ElementId, CoordinateCacheEntry>();
  private ttl = 1000; // 1 second TTL for cache entries
  private sectionVersions = new Map<SectionId, number>();

  get(elementId: ElementId): Coordinates | null {
    const entry = this.cache.get(elementId);
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(elementId);
      return null;
    }

    return entry.coords;
  }
  set(elementId: ElementId, coords: Coordinates, sectionId?: SectionId): void {
    const entry: CoordinateCacheEntry = {
      coords: { ...coords },
      timestamp: Date.now()
    };

    if (sectionId) {
      entry.sectionVersion = this.sectionVersions.get(sectionId);
    }

    this.cache.set(elementId, entry);
  }

  invalidate(elementId: ElementId): void {
    this.cache.delete(elementId);
  }

  invalidateSection(sectionId: SectionId): void {
    // Increment section version to invalidate all cached coordinates for this section
    const currentVersion = this.sectionVersions.get(sectionId) || 0;
    this.sectionVersions.set(sectionId, currentVersion + 1);

    // Remove all cached entries for elements in this section
    for (const [elementId, entry] of this.cache.entries()) {
      if (entry.sectionVersion !== undefined) {
        this.cache.delete(elementId);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.sectionVersions.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.cache.size > 0 ? 1 : 0 // Simplified for now
    };
  }
}

export class OptimizedCoordinateService {
  private static cache = new CoordinateCache();

  /**
   * Validate coordinates to ensure they are valid numbers
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
   */
  static sanitizeCoordinates(coords: Coordinates): Coordinates {
    const x = (typeof coords.x === 'number' && !isNaN(coords.x) && isFinite(coords.x)) ? coords.x : 0;
    const y = (typeof coords.y === 'number' && !isNaN(coords.y) && isFinite(coords.y)) ? coords.y : 0;
    
    // Round to 2 decimal places to prevent floating point precision issues
    return { 
      x: Math.round(x * 100) / 100, 
      y: Math.round(y * 100) / 100 
    };
  }

  /**
   * Convert element coordinates to absolute canvas coordinates with caching
   */
  static toAbsolute(
    element: CanvasElement, 
    sections: Map<SectionId, SectionElement>
  ): Coordinates {
    // Check cache first for immediate O(1) return
    const cached = this.cache.get(element.id);
    if (cached && this.validateCoordinates(cached)) {
      return cached;
    }

    // If not cached, perform the calculation
    let coords = this.sanitizeCoordinates({ x: element.x, y: element.y });

    // If element is in a section, add section offset recursively
    if (element.sectionId) {
      const section = sections.get(element.sectionId);
      if (section) {
        const sectionAbsolute = this.toAbsolute(section, sections);
        coords = this.sanitizeCoordinates({
          x: coords.x + sectionAbsolute.x,
          y: coords.y + sectionAbsolute.y
        });
      }
    }

    // Cache the result for next time
    this.cache.set(element.id, coords, element.sectionId || undefined);
    return coords;
  }

  /**
   * Convert absolute coordinates to section-relative coordinates
   */
  static toRelative(
    absoluteCoords: Coordinates, 
    section: SectionElement,
    sections: Map<SectionId, SectionElement>
  ): Coordinates {
    const sectionAbsolute = this.toAbsolute(section, sections);
    return this.sanitizeCoordinates({
      x: absoluteCoords.x - sectionAbsolute.x,
      y: absoluteCoords.y - sectionAbsolute.y
    });
  }

  /**
   * Safe coordinate conversion for drag operations
   * Returns both the converted coordinates and metadata about the conversion
   */
  static convertDragCoordinates(
    absolutePosition: Coordinates,
    element: CanvasElement,
    sections: Map<SectionId, SectionElement>
  ): {
    coordinates: Coordinates;
    sectionId: SectionId | null;
    needsUpdate: boolean;
  } {
    const sanitizedPosition = this.sanitizeCoordinates(absolutePosition);
    
    // Find if position is within any section
    const targetSection = this.findSectionAtPoint(sanitizedPosition, sections);
    
    if (targetSection && targetSection.id !== element.sectionId) {
      // Element is moving to a different section
      const relativeCoords = this.toRelative(sanitizedPosition, targetSection, sections);
      return {
        coordinates: relativeCoords,
        sectionId: targetSection.id,
        needsUpdate: true
      };
    } else if (!targetSection && element.sectionId) {
      // Element is moving out of a section to canvas
      return {
        coordinates: sanitizedPosition,
        sectionId: null,
        needsUpdate: true
      };
    } else if (element.sectionId && targetSection) {
      // Element staying in same section
      const relativeCoords = this.toRelative(sanitizedPosition, targetSection, sections);
      return {
        coordinates: relativeCoords,
        sectionId: element.sectionId,
        needsUpdate: false
      };
    } else {
      // Element staying on canvas
      return {
        coordinates: sanitizedPosition,
        sectionId: null,
        needsUpdate: false
      };
    }
  }

  /**
   * Convert screen-space delta to canvas-space delta accounting for zoom
   */
  static screenDeltaToCanvasDelta(
    screenDelta: Coordinates, 
    canvasScale: number
  ): Coordinates {
    const scale = Math.max(0.1, Math.min(10, canvasScale)); // Clamp scale
    return this.sanitizeCoordinates({
      x: screenDelta.x / scale,
      y: screenDelta.y / scale
    });
  }

  /**
   * Batch apply delta to multiple elements while preserving their coordinate systems
   */
  static batchApplyDelta(
    elements: Map<ElementId, CanvasElement>,
    canvasDelta: Coordinates,
    sections: Map<SectionId, SectionElement>
  ): Map<ElementId, { x: number; y: number }> {
    const updates = new Map<ElementId, { x: number; y: number }>();
    const sanitizedDelta = this.sanitizeCoordinates(canvasDelta);

    for (const [elementId, element] of elements) {
      let newCoords: Coordinates;

      if (element.sectionId) {
        // Element is in a section - apply delta in section's coordinate space
        const currentAbsolute = this.toAbsolute(element, sections);
        const newAbsolute = this.sanitizeCoordinates({
          x: currentAbsolute.x + sanitizedDelta.x,
          y: currentAbsolute.y + sanitizedDelta.y
        });

        const section = sections.get(element.sectionId);
        if (section) {
          newCoords = this.toRelative(newAbsolute, section, sections);
        } else {
          newCoords = newAbsolute;
        }
      } else {
        // Element is on canvas - apply delta directly
        newCoords = this.sanitizeCoordinates({
          x: element.x + sanitizedDelta.x,
          y: element.y + sanitizedDelta.y
        });
      }

      updates.set(elementId, newCoords);
      
      // Invalidate cache for this element
      this.cache.invalidate(elementId);
    }

    return updates;
  }  /**
   * Find section at a given point
   */
  private static findSectionAtPoint(
    point: Coordinates,
    sections: Map<SectionId, SectionElement>
  ): SectionElement | null {
    const sanitizedPoint = this.sanitizeCoordinates(point);

    for (const section of sections.values()) {
      if (section.type === 'section') {
        const sectionAbsolute = this.toAbsolute(section, sections);
        const bounds = {
          left: sectionAbsolute.x,
          top: sectionAbsolute.y,
          right: sectionAbsolute.x + section.width,
          bottom: sectionAbsolute.y + section.height
        };

        if (
          sanitizedPoint.x >= bounds.left &&
          sanitizedPoint.x <= bounds.right &&
          sanitizedPoint.y >= bounds.top &&
          sanitizedPoint.y <= bounds.bottom
        ) {
          return section;
        }
      }
    }

    return null;
  }

  /**
   * Constrain element coordinates to stay within section bounds
   */
  static constrainToSection(
    coords: Coordinates,
    element: CanvasElement,
    section: SectionElement,
    padding: number = 5
  ): Coordinates {
    const sanitizedCoords = this.sanitizeCoordinates(coords);
    const elementWidth = 'width' in element ? (element.width as number) : 50;
    const elementHeight = 'height' in element ? (element.height as number) : 50;

    return this.sanitizeCoordinates({
      x: Math.max(
        padding, 
        Math.min(section.width - elementWidth - padding, sanitizedCoords.x)
      ),
      y: Math.max(
        padding, 
        Math.min(section.height - elementHeight - padding, sanitizedCoords.y)
      )
    });
  }

  /**
   * Get distance between two points
   */
  static getDistance(point1: Coordinates, point2: Coordinates): number {
    const p1 = this.sanitizeCoordinates(point1);
    const p2 = this.sanitizeCoordinates(point2);
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get the center point of a bounding box
   */
  static getCenter(element: CanvasElement): Coordinates {
    const width = 'width' in element ? (element.width as number) : 0;
    const height = 'height' in element ? (element.height as number) : 0;
    const radius = 'radius' in element ? (element.radius as number) : 0;

    return this.sanitizeCoordinates({
      x: element.x + (width || radius) / 2,
      y: element.y + (height || radius) / 2
    });
  }

  /**
   * Invalidate cache for specific element
   */
  static invalidateElementCache(elementId: ElementId): void {
    this.cache.invalidate(elementId);
  }

  /**
   * Invalidate cache for all elements in a section
   */
  static invalidateSectionCache(sectionId: SectionId): void {
    this.cache.invalidateSection(sectionId);
  }

  /**
   * Clear all coordinate caches
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    return this.cache.getStats();
  }
}
