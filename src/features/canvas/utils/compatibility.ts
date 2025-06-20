/**
 * Canvas Compatibility Layer
 * Ensures backward compatibility during the transition period
 * 
 * This module provides:
 * - Type conversion between old and new formats
 * - Legacy API compatibility wrappers
 * - Migration utilities for existing data
 */

import { CanvasElement as LegacyCanvasElement } from '../../../types';
import { 
  CanvasElement, 
  ElementId, 
  SectionId,
  TextElement,
  RectangleElement,
  CircleElement,
  SectionElement
} from '../types/enhanced.types';

/**
 * Convert legacy canvas elements to enhanced typed elements
 */
export function convertLegacyToEnhanced(legacyElement: LegacyCanvasElement): CanvasElement {
  const baseElement = {
    id: ElementId(legacyElement.id),
    type: legacyElement.type,
    x: legacyElement.x,
    y: legacyElement.y,
    rotation: legacyElement.rotation || 0,
    isLocked: legacyElement.isLocked || false,
    isHidden: legacyElement.isHidden || false,
    sectionId: legacyElement.sectionId ? SectionId(legacyElement.sectionId) : null,
    createdAt: Date.now(), // Fallback for legacy elements
    updatedAt: Date.now(),
  };

  switch (legacyElement.type) {
    case 'text':
      return {
        ...baseElement,
        type: 'text',
        text: (legacyElement as any).text || '',
        fontSize: (legacyElement as any).fontSize,
        fontFamily: (legacyElement as any).fontFamily,
        fontStyle: (legacyElement as any).fontStyle,
        textAlign: (legacyElement as any).textAlign,
        textDecoration: (legacyElement as any).textDecoration,
        fill: (legacyElement as any).fill,
        width: (legacyElement as any).width,
        height: (legacyElement as any).height,
      } as TextElement;

    case 'rectangle':
      return {
        ...baseElement,
        type: 'rectangle',
        width: (legacyElement as any).width || 100,
        height: (legacyElement as any).height || 100,
        fill: (legacyElement as any).fill,
        stroke: (legacyElement as any).stroke,
        strokeWidth: (legacyElement as any).strokeWidth,
        cornerRadius: (legacyElement as any).cornerRadius,
      } as RectangleElement;

    case 'circle':
      return {
        ...baseElement,
        type: 'circle',
        radius: (legacyElement as any).radius || 50,
        fill: (legacyElement as any).fill,
        stroke: (legacyElement as any).stroke,
        strokeWidth: (legacyElement as any).strokeWidth,
      } as CircleElement;

    case 'section':
      return {
        ...baseElement,
        id: SectionId(legacyElement.id),
        type: 'section',
        width: (legacyElement as any).width || 200,
        height: (legacyElement as any).height || 150,
        title: (legacyElement as any).title,
        backgroundColor: (legacyElement as any).backgroundColor,
        borderColor: (legacyElement as any).borderColor,
        borderWidth: (legacyElement as any).borderWidth,
        cornerRadius: (legacyElement as any).cornerRadius,
        collapsed: (legacyElement as any).collapsed || false,
        childElementIds: ((legacyElement as any).childElementIds || []).map((id: string) => ElementId(id)),
      } as SectionElement;

    default:
      // For other types, create a basic structure
      return {
        ...baseElement,
        type: legacyElement.type,
        // Add any additional properties that might exist
        ...(legacyElement as any),
      } as CanvasElement;
  }
}

/**
 * Convert enhanced typed elements back to legacy format
 */
export function convertEnhancedToLegacy(enhancedElement: CanvasElement): LegacyCanvasElement {
  const baseElement = {
    id: enhancedElement.id as string, // Remove branding
    type: enhancedElement.type,
    x: enhancedElement.x,
    y: enhancedElement.y,
    rotation: enhancedElement.rotation,
    isLocked: enhancedElement.isLocked,
    isHidden: enhancedElement.isHidden,
    sectionId: enhancedElement.sectionId as string | null, // Remove branding
  };

  // Return with all the specific properties
  return {
    ...baseElement,
    ...(enhancedElement as any), // Include all type-specific properties
  } as LegacyCanvasElement;
}

/**
 * Batch convert legacy elements to enhanced format
 */
export function convertLegacyElementsMap(
  legacyElements: Record<string, LegacyCanvasElement>
): Map<ElementId, CanvasElement> {
  const enhancedMap = new Map<ElementId, CanvasElement>();
  
  Object.values(legacyElements).forEach(legacyElement => {
    const enhanced = convertLegacyToEnhanced(legacyElement);
    // Only add non-section elements to the elements map
    if (enhanced.type !== 'section') {
      enhancedMap.set(enhanced.id as ElementId, enhanced);
    }
  });

  return enhancedMap;
}

/**
 * Convert enhanced elements map back to legacy format
 */
export function convertEnhancedElementsMap(
  enhancedElements: Map<ElementId, CanvasElement>
): Record<string, LegacyCanvasElement> {
  const legacyMap: Record<string, LegacyCanvasElement> = {};
  
  enhancedElements.forEach((element, id) => {
    const legacy = convertEnhancedToLegacy(element);
    legacyMap[id as string] = legacy;
  });

  return legacyMap;
}

/**
 * Legacy API compatibility wrapper for coordinate service
 */
export class LegacyCoordinateServiceWrapper {
  static toAbsolute(
    element: LegacyCanvasElement, 
    sections: Record<string, LegacyCanvasElement>
  ): { x: number; y: number } {
    // Import the optimized service
    const { OptimizedCoordinateService } = require('../utils/OptimizedCoordinateService');
    
    // Convert to enhanced format
    const enhancedElement = convertLegacyToEnhanced(element);
    const enhancedSections = new Map<SectionId, SectionElement>();
    
    Object.values(sections)
      .filter(section => section.type === 'section')
      .forEach(section => {
        const enhanced = convertLegacyToEnhanced(section) as SectionElement;
        enhancedSections.set(enhanced.id, enhanced);
      });

    // Use optimized service
    return OptimizedCoordinateService.toAbsolute(enhancedElement, enhancedSections);
  }

  static toRelative(
    absoluteCoords: { x: number; y: number },
    section: LegacyCanvasElement,
    sections: Record<string, LegacyCanvasElement>
  ): { x: number; y: number } {
    const { OptimizedCoordinateService } = require('../utils/OptimizedCoordinateService');
    
    const enhancedSection = convertLegacyToEnhanced(section) as SectionElement;
    const enhancedSections = new Map<SectionId, SectionElement>();
    
    Object.values(sections)
      .filter(s => s.type === 'section')
      .forEach(s => {
        const enhanced = convertLegacyToEnhanced(s) as SectionElement;
        enhancedSections.set(enhanced.id, enhanced);
      });

    return OptimizedCoordinateService.toRelative(absoluteCoords, enhancedSection, enhancedSections);
  }
}

/**
 * Migration utility to gradually migrate store data
 */
export class StoreMigrationUtility {
  /**
   * Migrate legacy store state to enhanced format
   */
  static migrateLegacyStore(legacyState: any): any {
    const migratedState = { ...legacyState };

    // Migrate elements if they exist
    if (legacyState.elements) {
      if (Array.isArray(legacyState.elements)) {
        // Convert array to Map
        const elementsMap = new Map<ElementId, CanvasElement>();        legacyState.elements.forEach((element: LegacyCanvasElement) => {
          const enhanced = convertLegacyToEnhanced(element);
          if (enhanced.type !== 'section') {
            elementsMap.set(enhanced.id as ElementId, enhanced);
          }
        });
        migratedState.elements = elementsMap;
      } else if (typeof legacyState.elements === 'object') {
        // Convert Record to Map
        migratedState.elements = convertLegacyElementsMap(legacyState.elements);
      }
    }

    // Migrate sections if they exist
    if (legacyState.sections) {
      const sectionsMap = new Map<SectionId, SectionElement>();
      Object.values(legacyState.sections).forEach((section: any) => {
        if (section.type === 'section') {
          const enhanced = convertLegacyToEnhanced(section) as SectionElement;
          sectionsMap.set(enhanced.id, enhanced);
        }
      });
      migratedState.sections = sectionsMap;
    }

    // Migrate selected element IDs
    if (legacyState.selectedElementIds && Array.isArray(legacyState.selectedElementIds)) {
      migratedState.selectedElementIds = new Set(
        legacyState.selectedElementIds.map((id: string) => ElementId(id))
      );
    }

    return migratedState;
  }

  /**
   * Check if store needs migration
   */  static needsMigration(state: any): boolean {
    // Check for legacy formats
    return (
      (state.elements && !(state.elements instanceof Map)) ||
      (state.sections && !(state.sections instanceof Map)) ||
      (state.selectedElementIds && Array.isArray(state.selectedElementIds))
    );
  }
}

/**
 * Development utility for testing compatibility
 */
export const CompatibilityTester = {
  testElementConversion(legacyElement: LegacyCanvasElement): boolean {
    try {
      const enhanced = convertLegacyToEnhanced(legacyElement);
      const backToLegacy = convertEnhancedToLegacy(enhanced);
      
      // Basic validation
      return (
        backToLegacy.id === legacyElement.id &&
        backToLegacy.type === legacyElement.type &&
        backToLegacy.x === legacyElement.x &&
        backToLegacy.y === legacyElement.y
      );
    } catch (error) {
      console.error('Element conversion failed:', error);
      return false;
    }
  },

  validateStoreCompatibility(legacyState: any): { isCompatible: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      const migrated = StoreMigrationUtility.migrateLegacyStore(legacyState);
        // Validate migration was successful
      if (legacyState.elements && !(migrated.elements instanceof Map)) {
        issues.push('Elements migration failed');
      }
      
      if (legacyState.sections && !(migrated.sections instanceof Map)) {
        issues.push('Sections migration failed');
      }

      return {
        isCompatible: issues.length === 0,
        issues
      };
    } catch (error) {
      issues.push(`Migration error: ${error}`);
      return { isCompatible: false, issues };
    }
  }
};
