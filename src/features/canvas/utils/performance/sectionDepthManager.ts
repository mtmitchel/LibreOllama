/**
 * Section Depth Management and Optimization
 * Prevents deeply nested sections and optimizes coordinate calculations
 */

import { SectionElement, SectionId, ElementId } from '../../types/enhanced.types';

export const MAX_SECTION_DEPTH = 10;
export const COORDINATE_CACHE_SIZE = 1000;

// Simple memoization cache for coordinate calculations
interface MemoizeOptions {
  maxSize: number;
  equals?: (a: any[], b: any[]) => boolean;
}

function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoizeOptions = { maxSize: 100 }
): T {
  const cache = new Map();
  const { maxSize, equals = (a, b) => a[0] === b[0] } = options;

  return ((...args: any[]) => {
    // Find existing cache entry
    for (const [cachedArgs, result] of cache.entries()) {
      if (equals(args, cachedArgs)) {
        return result;
      }
    }

    // Calculate new result
    const result = fn(...args);

    // Add to cache, maintaining size limit
    if (cache.size >= maxSize) {
      // Remove oldest entry (first in Map)
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(args, result);
    return result;
  }) as T;
}

/**
 * Calculate the depth of a section in the hierarchy
 */
export function getSectionDepth(
  sectionId: SectionId, 
  sections: Map<SectionId, SectionElement>
): number {
  let depth = 0;
  let currentId: SectionId | null = sectionId;
  const visited = new Set<SectionId>();
  
  while (currentId && depth < MAX_SECTION_DEPTH) {
    // Prevent infinite loops from circular references
    if (visited.has(currentId)) {
      console.warn(`Circular section reference detected: ${currentId}`);
      break;
    }
    
    visited.add(currentId);
    
    const section = sections.get(currentId);
    if (!section?.sectionId) break;
    
    currentId = section.sectionId;
    depth++;
  }
  
  if (depth >= MAX_SECTION_DEPTH) {
    console.warn(`Maximum section depth (${MAX_SECTION_DEPTH}) exceeded for section ${sectionId}`);
  }
  
  return depth;
}

/**
 * Check if adding a section as a child would exceed depth limits
 */
export function wouldExceedDepthLimit(
  parentSectionId: SectionId,
  childSectionId: SectionId,
  sections: Map<SectionId, SectionElement>
): boolean {
  const parentDepth = getSectionDepth(parentSectionId, sections);
  const childDepth = getSectionDepth(childSectionId, sections);
  
  // If child becomes nested under parent, its depth would be parentDepth + 1 + childDepth
  const wouldBeDepth = parentDepth + 1 + childDepth;
  
  return wouldBeDepth > MAX_SECTION_DEPTH;
}

/**
 * Check for circular section references
 */
export function wouldCreateCircularReference(
  elementId: ElementId | SectionId,
  targetSectionId: SectionId,
  sections: Map<SectionId, SectionElement>
): boolean {
  // If the element being moved is not a section, it can't create circular references
  const element = sections.get(elementId as SectionId);
  if (!element || element.type !== 'section') {
    return false;
  }
  
  // Check if targetSectionId is already a descendant of elementId
  let currentId: SectionId | null = targetSectionId;
  const visited = new Set<SectionId>();
  
  while (currentId) {
    if (visited.has(currentId)) {
      // Circular reference in existing hierarchy
      return true;
    }
    
    if (currentId === elementId) {
      // Target section is already a descendant of the element
      return true;
    }
    
    visited.add(currentId);
    
    const section = sections.get(currentId);
    if (!section?.sectionId) break;
    
    currentId = section.sectionId;
  }
  
  return false;
}

/**
 * Optimized coordinate calculation with memoization
 */
export const memoizedGetAbsolutePosition = memoize(
  (elementId: ElementId, elements: Map<ElementId, any>, sections: Map<SectionId, SectionElement>) => {
    const element = elements.get(elementId);
    if (!element) return { x: 0, y: 0 };
    
    let totalX = element.x || 0;
    let totalY = element.y || 0;
    let currentSectionId = element.sectionId;
    
    // Traverse up the section hierarchy
    while (currentSectionId) {
      const section = sections.get(currentSectionId);
      if (!section) break;
      
      totalX += section.x || 0;
      totalY += section.y || 0;
      
      currentSectionId = section.sectionId;
    }
    
    return { x: totalX, y: totalY };
  },
  {
    maxSize: COORDINATE_CACHE_SIZE,
    equals: (a, b) => a[0] === b[0] // Compare by elementId
  }
);

/**
 * Validate section hierarchy integrity
 */
export function validateSectionHierarchy(
  sections: Map<SectionId, SectionElement>
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const [sectionId, section] of sections) {
    // Check for self-reference
    if (section.sectionId === sectionId) {
      errors.push(`Section ${sectionId} references itself`);
      continue;
    }
    
    // Check for circular references
    if (section.sectionId && wouldCreateCircularReference(sectionId, section.sectionId, sections)) {
      errors.push(`Circular reference detected for section ${sectionId}`);
    }
    
    // Check depth
    const depth = getSectionDepth(sectionId, sections);
    if (depth > MAX_SECTION_DEPTH) {
      errors.push(`Section ${sectionId} exceeds maximum depth (${depth} > ${MAX_SECTION_DEPTH})`);
    } else if (depth > MAX_SECTION_DEPTH * 0.8) {
      warnings.push(`Section ${sectionId} is approaching maximum depth (${depth}/${MAX_SECTION_DEPTH})`);
    }
    
    // Check for orphaned sections (parent doesn't exist)
    if (section.sectionId && !sections.has(section.sectionId)) {
      errors.push(`Section ${sectionId} references non-existent parent ${section.sectionId}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Auto-repair section hierarchy issues
 */
export function repairSectionHierarchy(
  sections: Map<SectionId, SectionElement>
): {
  repairedSections: Map<SectionId, SectionElement>;
  changes: string[];
} {
  const repairedSections = new Map(sections);
  const changes: string[] = [];
  
  for (const [sectionId, section] of repairedSections) {
    let modified = false;
    const updatedSection = { ...section };
    
    // Fix self-references
    if (section.sectionId === sectionId) {
      updatedSection.sectionId = null;
      changes.push(`Removed self-reference for section ${sectionId}`);
      modified = true;
    }
    
    // Fix orphaned parent references
    if (section.sectionId && !repairedSections.has(section.sectionId)) {
      updatedSection.sectionId = null;
      changes.push(`Removed orphaned parent reference for section ${sectionId}`);
      modified = true;
    }
    
    // Fix circular references
    if (section.sectionId && wouldCreateCircularReference(sectionId, section.sectionId, repairedSections)) {
      updatedSection.sectionId = null;
      changes.push(`Removed circular reference for section ${sectionId}`);
      modified = true;
    }
    
    // Fix excessive depth by moving to root
    if (getSectionDepth(sectionId, repairedSections) > MAX_SECTION_DEPTH) {
      updatedSection.sectionId = null;
      changes.push(`Moved section ${sectionId} to root due to excessive depth`);
      modified = true;
    }
    
    if (modified) {
      repairedSections.set(sectionId, updatedSection);
    }
  }
  
  return {
    repairedSections,
    changes
  };
}

/**
 * Get all descendant sections of a given section
 */
export function getDescendantSections(
  sectionId: SectionId,
  sections: Map<SectionId, SectionElement>
): SectionId[] {
  const descendants: SectionId[] = [];
  
  for (const [childId, child] of sections) {
    if (child.sectionId === sectionId) {
      descendants.push(childId);
      // Recursively get descendants of this child
      descendants.push(...getDescendantSections(childId, sections));
    }
  }
  
  return descendants;
}

/**
 * Performance monitoring for section operations
 */
export class SectionPerformanceMonitor {
  private static metrics = {
    coordinateCalculations: 0,
    hierarchyValidations: 0,
    depthCalculations: 0,
    lastReset: Date.now()
  };
  
  static recordCoordinateCalculation(): void {
    this.metrics.coordinateCalculations++;
  }
  
  static recordHierarchyValidation(): void {
    this.metrics.hierarchyValidations++;
  }
  
  static recordDepthCalculation(): void {
    this.metrics.depthCalculations++;
  }
  
  static getMetrics() {
    const now = Date.now();
    const timeElapsed = (now - this.metrics.lastReset) / 1000; // seconds
    
    return {
      ...this.metrics,
      timeElapsed,
      coordinateCalculationsPerSecond: this.metrics.coordinateCalculations / timeElapsed,
      hierarchyValidationsPerSecond: this.metrics.hierarchyValidations / timeElapsed,
      depthCalculationsPerSecond: this.metrics.depthCalculations / timeElapsed
    };
  }
  
  static reset(): void {
    this.metrics = {
      coordinateCalculations: 0,
      hierarchyValidations: 0,
      depthCalculations: 0,
      lastReset: Date.now()
    };
  }
}

export default {
  getSectionDepth,
  wouldExceedDepthLimit,
  wouldCreateCircularReference,
  memoizedGetAbsolutePosition,
  validateSectionHierarchy,
  repairSectionHierarchy,
  getDescendantSections,
  SectionPerformanceMonitor,
  MAX_SECTION_DEPTH
};
