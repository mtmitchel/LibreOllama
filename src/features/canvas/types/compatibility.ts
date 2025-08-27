/**
 * Type Compatibility Layer
 * Bridges between legacy types and enhanced types during transition
 */

import { ElementId, SectionId } from './enhanced.types';
import type { CanvasElement as EnhancedCanvasElement } from './enhanced.types';
import type { CanvasElement as LegacyCanvasElement } from './enhanced.types';

// Type conversion utilities
export const toElementId = (id: string): ElementId => id as ElementId;
export const toSectionId = (id: string): SectionId => id as SectionId;
export const fromElementId = (id: ElementId): string => id as string;
export const fromSectionId = (id: SectionId): string => id as string;

// Helper to safely access Map with string keys
export function safeMapGet<T>(map: Map<string, T>, key: string | ElementId | SectionId): T | undefined {
  return map.get(key as string);
}

// Helper to safely set Map with string keys  
export function safeMapSet<T>(map: Map<string, T>, key: string | ElementId | SectionId, value: T): void {
  map.set(key as string, value);
}

// Helper to safely check Map has key
export function safeMapHas<T>(map: Map<string, T>, key: string | ElementId | SectionId): boolean {
  return map.has(key as string);
}

// Helper to safely delete from Map
export function safeMapDelete<T>(map: Map<string, T>, key: string | ElementId | SectionId): boolean {
  return map.delete(key as string);
}

// Helper functions for Set operations with ElementId
export function setHasElementId(set: Set<ElementId>, id: string | ElementId): boolean {
  return set.has(id as ElementId);
}

export function setAddElementId(set: Set<ElementId>, id: string | ElementId): void {
  set.add(id as ElementId);
}

export function setDeleteElementId(set: Set<ElementId>, id: string | ElementId): boolean {
  return set.delete(id as ElementId);
}

// Get first element from Set (replacement for array[0])
export function getFirstFromSet<T>(set: Set<T>): T | null {
  const iterator = set.values();
  const first = iterator.next();
  return first.done ? null : first.value;
}

// Convert Array to ElementId[]  
export function arrayToElementIds(ids: string[]): ElementId[] {
  return ids.map(id => toElementId(id));
}

// Convert ElementId[] to Array
export function elementIdsToArray(ids: ElementId[]): string[] {
  return ids.map(id => fromElementId(id));
}

// Convert Set<ElementId> to string[]
export function elementIdSetToArray(set: Set<ElementId>): string[] {
  return Array.from(set).map(id => fromElementId(id));
}

// Convert Set to Array for operations that need arrays
export function setToArray<T>(set: Set<T>): T[] {
  return Array.from(set);
}

// Type guard to check if element has required enhanced properties
export function hasEnhancedProperties(element: unknown): element is EnhancedCanvasElement {
  return Boolean(element && 
         typeof element === 'object' && 
         element !== null &&
         'createdAt' in element && 
         'updatedAt' in element &&
         typeof (element as any).createdAt === 'number' && 
         typeof (element as any).updatedAt === 'number');
}

// Convert legacy element to enhanced element
export function toEnhancedElement(legacyElement: LegacyCanvasElement): EnhancedCanvasElement {
  const now = Date.now();
  return {
    ...legacyElement,
    id: toElementId(legacyElement.id),
    sectionId: legacyElement.sectionId ? toSectionId(legacyElement.sectionId) : undefined,
    createdAt: now,
    updatedAt: now,
  } as EnhancedCanvasElement;
}

// Convert enhanced element to legacy element  
export function toLegacyElement(enhancedElement: EnhancedCanvasElement): LegacyCanvasElement {
  const { createdAt, updatedAt, ...legacy } = enhancedElement;
  return {
    ...legacy,
    id: enhancedElement.id as string,
    sectionId: enhancedElement.sectionId ? (enhancedElement.sectionId as string) : undefined,
  } as LegacyCanvasElement;
}
