/**
 * Enhanced Canvas Error Handling and Recovery System
 * Implements robust error handling for production readiness
 */

import type { CanvasElement, SectionElement, ConnectorElement, ElementId, SectionId } from '../../types/enhanced.types';

export interface CanvasDataValidator {
  validateAndRepair(data: unknown): { 
    valid: boolean; 
    repaired: CanvasData; 
    errors: string[]; 
    warnings: string[];
  };
}

export interface CanvasData {
  elements: CanvasElement[];
  sections: SectionElement[];
  metadata?: {
    version: string;
    timestamp: number;
    checksum?: string;
  };
}

export interface RecoveryOptions {
  autoRepair: boolean;
  preserveData: boolean;
  fallbackToDefaults: boolean;
  reportErrors: boolean;
}

export class CanvasErrorHandler {
  private errorCount = 0;
  private readonly maxErrors = 50;
  private recentErrors: Array<{ error: Error; timestamp: number; context: string }> = [];

  /**
   * Enhanced element deletion with safety checks
   */
  static safeDeleteElement(
    elementId: ElementId,
    elements: Map<ElementId, CanvasElement>,
    updateElement: (id: ElementId, updates: Partial<CanvasElement>) => void,
    currentEditingElement?: ElementId | null,
    cancelEdit?: () => void
  ): { success: boolean; affectedElements: ElementId[]; errors: string[] } {
    const errors: string[] = [];
    const affectedElements: ElementId[] = [elementId];

    try {
      const element = elements.get(elementId);
      if (!element) {
        errors.push(`Element ${elementId} not found`);
        return { success: false, affectedElements: [], errors };
      }

      // Check if element is being edited
      if (currentEditingElement === elementId && cancelEdit) {
        try {
          cancelEdit();
        } catch (error) {
          errors.push(`Failed to cancel edit: ${error}`);
        }
      }      // Handle connectors attached to this element
      const connectedConnectors = Array.from(elements.values())
        .filter((el): el is ConnectorElement => 
          el.type === 'connector' && (
            el.startElementId === elementId ||
            el.endElementId === elementId
          )
        );

      connectedConnectors.forEach(connector => {
        try {
          affectedElements.push(connector.id);
          
          if (connector.startElementId === elementId && connector.endElementId === elementId) {
            // Delete self-connected connector
            elements.delete(connector.id);
          } else {            // Convert to floating endpoint by removing references
            const updates: Partial<ConnectorElement> = {};
            if (connector.startElementId === elementId) {
              delete (updates as any).startElementId;
            }
            if (connector.endElementId === elementId) {
              delete (updates as any).endElementId;
            }
            updateElement(connector.id, updates);
          }
        } catch (error) {
          errors.push(`Failed to update connector ${connector.id}: ${error}`);
        }
      });      // Handle section children (only if deleting a section)
      if (element.type === 'section') {
        const sectionId = elementId as unknown as SectionId; // Safe cast since we know it's a section
        const children = Array.from(elements.values())
          .filter(el => 'sectionId' in el && el.sectionId === sectionId && el.type !== 'section') as CanvasElement[];

        children.forEach(child => {
          try {
            // Only regular elements can be in affectedElements
            if (child.type !== 'section') {
              affectedElements.push(child.id);
              updateElement(child.id, {
                sectionId: ('sectionId' in element ? element.sectionId : null) || null,
                // Adjust coordinates to maintain visual position
                x: child.x + element.x,
                y: child.y + element.y
              });
            }
          } catch (error) {
            errors.push(`Failed to relocate child element ${child.id}: ${error}`);
          }
        });
      }

      // Finally delete the element
      elements.delete(elementId);

      return { 
        success: errors.length === 0, 
        affectedElements, 
        errors 
      };

    } catch (error) {
      errors.push(`Critical error during deletion: ${error}`);
      return { success: false, affectedElements: [], errors };
    }
  }

  /**
   * Validate and repair canvas data
   */
  static createValidator(): CanvasDataValidator {
    return {
      validateAndRepair(data: unknown): { 
        valid: boolean; 
        repaired: CanvasData; 
        errors: string[]; 
        warnings: string[];
      } {
        const errors: string[] = [];
        const warnings: string[] = [];
        const repaired = structuredClone(data) as any;

        // Ensure basic structure
        if (!repaired || typeof repaired !== 'object') {
          errors.push('Invalid data structure');
          return {
            valid: false,
            repaired: { elements: [], sections: [] },
            errors,
            warnings
          };
        }

        // Validate elements array
        if (!repaired.elements || !Array.isArray(repaired.elements)) {
          errors.push('Missing or invalid elements array');
          repaired.elements = [];
        }

        // Validate sections array
        if (!repaired.sections || !Array.isArray(repaired.sections)) {
          warnings.push('Missing sections array, creating empty array');
          repaired.sections = [];
        }

        // Validate each element
        repaired.elements = repaired.elements.filter((el: any, index: number) => {
          if (!el || typeof el !== 'object') {
            errors.push(`Element at index ${index} is not an object`);
            return false;
          }

          if (!el.id || typeof el.id !== 'string') {
            errors.push(`Element at index ${index} missing valid id`);
            return false;
          }

          if (!el.type || typeof el.type !== 'string') {
            errors.push(`Element ${el.id} missing valid type`);
            return false;
          }

          // Ensure coordinates are numbers
          if (typeof el.x !== 'number' || isNaN(el.x)) {
            warnings.push(`Element ${el.id} has invalid x coordinate, setting to 0`);
            el.x = 0;
          }

          if (typeof el.y !== 'number' || isNaN(el.y)) {
            warnings.push(`Element ${el.id} has invalid y coordinate, setting to 0`);
            el.y = 0;
          }

          // Validate section references
          if (el.sectionId && typeof el.sectionId === 'string') {
            const sectionExists = repaired.sections.some((s: any) => s.id === el.sectionId);
            if (!sectionExists) {
              warnings.push(`Element ${el.id} references non-existent section ${el.sectionId}, removing reference`);
              el.sectionId = null;
            }
          }

          return true;
        });

        // Check for circular section references
        const checkCircular = (sectionId: string, visited = new Set<string>()): boolean => {
          if (visited.has(sectionId)) return true;
          visited.add(sectionId);

          const section = repaired.sections.find((s: any) => s.id === sectionId);
          if (section?.sectionId && typeof section.sectionId === 'string') {
            return checkCircular(section.sectionId, visited);
          }
          return false;
        };

        repaired.sections.forEach((section: any) => {
          if (section.type === 'section' && section.sectionId && checkCircular(section.id)) {
            errors.push(`Circular section reference detected for ${section.id}, removing parent reference`);
            section.sectionId = null;
          }
        });

        // Check for duplicate IDs
        const seenIds = new Set<string>();
        const duplicates = new Set<string>();

        [...repaired.elements, ...repaired.sections].forEach((item: any) => {
          if (seenIds.has(item.id)) {
            duplicates.add(item.id);
          } else {
            seenIds.add(item.id);
          }
        });

        if (duplicates.size > 0) {
          errors.push(`Duplicate IDs found: ${Array.from(duplicates).join(', ')}`);
          
          // Remove duplicates, keeping first occurrence
          const uniqueElements = [];
          const uniqueSections = [];
          const processedIds = new Set<string>();

          for (const el of repaired.elements) {
            if (!processedIds.has(el.id)) {
              uniqueElements.push(el);
              processedIds.add(el.id);
            }
          }

          for (const section of repaired.sections) {
            if (!processedIds.has(section.id)) {
              uniqueSections.push(section);
              processedIds.add(section.id);
            }
          }

          repaired.elements = uniqueElements;
          repaired.sections = uniqueSections;
        }

        return {
          valid: errors.length === 0,
          repaired,
          errors,
          warnings
        };
      }
    };
  }

  /**
   * Record error for tracking
   */
  recordError(error: Error, context: string): void {
    this.errorCount++;
    this.recentErrors.push({
      error,
      timestamp: Date.now(),
      context
    });

    // Limit recent errors array size
    if (this.recentErrors.length > 100) {
      this.recentErrors = this.recentErrors.slice(-50);
    }

    // Log error
    console.error(`Canvas Error [${context}]:`, error);

    // If too many errors, suggest refresh
    if (this.errorCount > this.maxErrors) {
      console.error('Too many canvas errors detected. Consider refreshing the page.');
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    recentErrors: number;
    errorRate: number;
    topContexts: Array<{ context: string; count: number }>;
  } {
    const now = Date.now();
    const recentErrorsCount = this.recentErrors.filter(
      e => now - e.timestamp < 60000 // Last minute
    ).length;

    // Group by context
    const contextCounts = new Map<string, number>();
    this.recentErrors.forEach(({ context }) => {
      contextCounts.set(context, (contextCounts.get(context) || 0) + 1);
    });

    const topContexts = Array.from(contextCounts.entries())
      .map(([context, count]) => ({ context, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.errorCount,
      recentErrors: recentErrorsCount,
      errorRate: this.recentErrors.length > 0 ? recentErrorsCount / this.recentErrors.length : 0,
      topContexts
    };
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errorCount = 0;
    this.recentErrors = [];
  }
}

// Global error handler instance
export const canvasErrorHandler = new CanvasErrorHandler();
