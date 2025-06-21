/**
 * Canvas Compatibility Layer
 * Ensures backward compatibility during the transition period from legacy stores
 * to the enhanced, unified store with new data structures (Map, Set).
 *
 * This module provides:
 * - Type conversion between old (Record<string, any>) and new (Map, Set with branded types) formats.
 * - Legacy API compatibility wrappers for services that need to function during the transition.
 * - A robust migration utility to automatically update legacy store state to the new format.
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
 * Converts a single legacy canvas element to the new enhanced, type-safe format.
 * This function handles all element types and assigns branded IDs.
 */
export function convertLegacyToEnhanced(legacyElement: LegacyCanvasElement): CanvasElement {
  const baseElement = {
    id: ElementId(legacyElement.id), // Apply branding
    type: legacyElement.type,
    x: legacyElement.x,
    y: legacyElement.y,
    rotation: legacyElement.rotation || 0,
    isLocked: legacyElement.isLocked || false,
    isHidden: legacyElement.isHidden || false,
    sectionId: legacyElement.sectionId ? SectionId(legacyElement.sectionId) : null,
    createdAt: (legacyElement as any).createdAt || Date.now(), // Preserve or add timestamp
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
        id: SectionId(legacyElement.id), // Re-brand as SectionId for sections
        type: 'section',
        width: (legacyElement as any).width || 200,
        height: (legacyElement as any).height || 150,
        title: (legacyElement as any).title || 'Section',
        backgroundColor: (legacyElement as any).backgroundColor,
        borderColor: (legacyElement as any).borderColor,
        borderWidth: (legacyElement as any).borderWidth,
        cornerRadius: (legacyElement as any).cornerRadius,
        collapsed: (legacyElement as any).collapsed || false,
        // Legacy property could be childElementIds or containedElementIds, the new property is childElementIds as per the type definition.
        childElementIds: ((legacyElement as any).childElementIds || (legacyElement as any).containedElementIds || []).map((id: string) => ElementId(id)),
      } as SectionElement;

    default:
      // For other types, create a basic structure
      return {
        ...baseElement,
        type: legacyElement.type,
        ...(legacyElement as any),
      } as CanvasElement;
  }
}

/**
 * Converts an enhanced, type-safe element back to the legacy format.
 * This is useful for interacting with parts of the system that have not yet been updated.
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

  return {
    ...baseElement,
    ...(enhancedElement as any),
  } as LegacyCanvasElement;
}

/**
 * Batch converts legacy elements and sections from Records or Arrays into a single enhanced Map.
 * This is the primary conversion utility for migrating to the new store structure.
 */
export function convertLegacyStateToEnhancedMap(
  legacyElements: Record<string, LegacyCanvasElement> | LegacyCanvasElement[],
  legacySections: Record<string, LegacyCanvasElement> | LegacyCanvasElement[] = {}
): Map<ElementId | SectionId, CanvasElement> {
  const enhancedMap = new Map<ElementId | SectionId, CanvasElement>();

  const processItems = (items: Record<string, LegacyCanvasElement> | LegacyCanvasElement[]) => {
    const itemsArray = Array.isArray(items) ? items : Object.values(items);
    itemsArray.forEach(item => {
      if (item && item.id) { // Basic validation
        const enhanced = convertLegacyToEnhanced(item);
        enhancedMap.set(enhanced.id, enhanced);
      }
    });
  };

  processItems(legacyElements);
  processItems(legacySections);

  return enhancedMap;
}

/**
 * Converts an enhanced elements Map back to a legacy Record format.
 */
export function convertEnhancedElementsMap(
  enhancedElements: Map<ElementId | SectionId, CanvasElement>
): Record<string, LegacyCanvasElement> {
  const legacyMap: Record<string, LegacyCanvasElement> = {};
  
  enhancedElements.forEach((element, id) => {
    const legacy = convertEnhancedToLegacy(element);
    legacyMap[id as string] = legacy;
  });

  return legacyMap;
}

/**
 * Migration utility to handle the transition of the entire Zustand store state.
 */
export class StoreMigrationUtility {
  /**
   * Migrates a legacy store state to the new enhanced format.
   * - Combines `elements` and `sections` Records into a single `elements` Map.
   * - Converts `selectedElementIds` Array to a Set.
   * - Deletes the obsolete `sections` and `sectionOrder` properties.
   */
  static migrateLegacyStore(legacyState: any): any {
    if (!this.needsMigration(legacyState)) {
      return legacyState;
    }
      
    console.log("⏳ [Compatibility] Starting store data migration to new format...");
    const migratedState = { ...legacyState };

    const legacyElements = legacyState.elements || {};
    const legacySections = legacyState.sections || {};

    // Create a single map for both elements and sections
    migratedState.elements = convertLegacyStateToEnhancedMap(legacyElements, legacySections);
    
    // Remove the old, separate sections properties
    delete migratedState.sections;
    delete migratedState.sectionOrder;

    // Migrate selected element IDs to a Set for efficient lookups
    if (legacyState.selectedElementIds && Array.isArray(legacyState.selectedElementIds)) {
      migratedState.selectedElementIds = new Set(
        legacyState.selectedElementIds.map((id: string) => ElementId(id))
      );
    }
    
    console.log("✅ [Compatibility] Store data successfully migrated.");
    return migratedState;
  }

  /**
   * Checks if a given store state requires migration.
   * Migration is needed if `elements` is not a Map, a `sections` property exists,
   * or `selectedElementIds` is an Array.
   */
  static needsMigration(state: any): boolean {
    return (
      (!!state.elements && !(state.elements instanceof Map)) ||
      (!!state.sections && typeof state.sections === 'object') ||
      (!!state.selectedElementIds && Array.isArray(state.selectedElementIds))
    );
  }
}

/**
 * A development utility for testing the compatibility layer and migration logic.
 */
export const CompatibilityTester = {
  testElementConversion(legacyElement: LegacyCanvasElement): boolean {
    try {
      const enhanced = convertLegacyToEnhanced(legacyElement);
      const backToLegacy = convertEnhancedToLegacy(enhanced);
      
      return (
        backToLegacy.id === legacyElement.id &&
        backToLegacy.type === legacyElement.type &&
        backToLegacy.x === legacyElement.x &&
        backToLegacy.y === legacyElement.y
      );
    } catch (error) {
      console.error('Element conversion test failed:', error);
      return false;
    }
  },

  validateStoreCompatibility(legacyState: any): { isCompatible: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      if (!StoreMigrationUtility.needsMigration(legacyState)) {
        return { isCompatible: true, issues: [] };
      }

      const migrated = StoreMigrationUtility.migrateLegacyStore(legacyState);
      
      if (!(migrated.elements instanceof Map)) {
        issues.push('Elements migration failed: result is not a Map.');
      }
      
      if (migrated.sections) {
        issues.push('`sections` property was not removed after migration.');
      }

      if (migrated.selectedElementIds && !(migrated.selectedElementIds instanceof Set)) {
        issues.push('`selectedElementIds` migration failed: result is not a Set.');
      }

      return {
        isCompatible: issues.length === 0,
        issues
      };
    } catch (error: any) {
      issues.push(`Migration process threw an error: ${error.message}`);
      return { isCompatible: false, issues };
    }
  }
};
