/**
 * Canvas Data Validation System
 * Implements production-ready data validation and repair functionality
 * Based on the production readiness guidelines
 */

import { CanvasElement } from '../stores/types';

export interface CanvasData {
  elements: CanvasElement[];
  version?: number;
  metadata?: {
    created: string;
    modified: string;
    author?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  repaired: CanvasData;
  errors: string[];
  warnings: string[];
}

export class CanvasDataValidator {
  /**
   * Validates and repairs canvas data to ensure it's safe for production use
   */
  static validateAndRepair(data: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const repaired = structuredClone(data) as any;
    
    // Ensure basic structure exists
    if (!repaired || typeof repaired !== 'object') {
      errors.push('Invalid canvas data: not an object');
      return {
        valid: false,
        repaired: { elements: [], version: 2 },
        errors,
        warnings
      };
    }

    // Validate elements array
    if (!repaired.elements || !Array.isArray(repaired.elements)) {
      errors.push('Missing or invalid elements array');
      repaired.elements = [];
    }

    // Track element IDs for reference validation
    const elementIds = new Set<string>();
    const sectionIds = new Set<string>();

    // First pass: validate individual elements and collect IDs
    repaired.elements = repaired.elements.filter((el: any, index: number) => {
      if (!el || typeof el !== 'object') {
        errors.push(`Element at index ${index}: not an object`);
        return false;
      }

      if (!el.id || typeof el.id !== 'string') {
        errors.push(`Element at index ${index}: missing or invalid id`);
        return false;
      }

      if (elementIds.has(el.id)) {
        errors.push(`Duplicate element ID found: ${el.id}`);
        return false;
      }

      if (!el.type || typeof el.type !== 'string') {
        errors.push(`Element ${el.id}: missing or invalid type`);
        return false;
      }

      // Ensure coordinates are numbers
      el.x = Number(el.x) || 0;
      el.y = Number(el.y) || 0;

      // Ensure dimensions are positive numbers for elements that have them
      if ('width' in el) {
        el.width = Math.max(1, Number(el.width) || 100);
      }
      if ('height' in el) {
        el.height = Math.max(1, Number(el.height) || 100);
      }

      // Validate specific element types
      switch (el.type) {
        case 'section':
          sectionIds.add(el.id);
          if (!el.title) el.title = 'Untitled Section';
          if (!el.backgroundColor) el.backgroundColor = '#F9FAFB';
          if (!el.borderColor) el.borderColor = '#D1D5DB';
          el.borderWidth = Math.max(0, Number(el.borderWidth) || 2);
          break;

        case 'text':
          if (!el.text) el.text = 'Text';
          el.fontSize = Math.max(1, Number(el.fontSize) || 16);
          if (!el.fontFamily) el.fontFamily = 'Inter, sans-serif';
          if (!el.fill) el.fill = '#000000';
          break;

        case 'rectangle':
        case 'circle':
        case 'triangle':
        case 'star':
          if (!el.fill) el.fill = '#E5E7EB';
          if (!el.stroke) el.stroke = '#6B7280';
          el.strokeWidth = Math.max(0, Number(el.strokeWidth) || 1);
          break;

        case 'connector':
          // Validate connector endpoints
          if (!el.startPoint || typeof el.startPoint !== 'object') {
            el.startPoint = { x: el.x, y: el.y };
          }
          if (!el.endPoint || typeof el.endPoint !== 'object') {
            el.endPoint = { x: el.x + 100, y: el.y + 100 };
          }
          
          // Ensure endpoint coordinates are numbers
          el.startPoint.x = Number(el.startPoint.x) || 0;
          el.startPoint.y = Number(el.startPoint.y) || 0;
          el.endPoint.x = Number(el.endPoint.x) || 0;
          el.endPoint.y = Number(el.endPoint.y) || 0;
          break;

        case 'pen':
          if (!el.points || !Array.isArray(el.points)) {
            warnings.push(`Pen element ${el.id}: invalid or missing points array`);
            el.points = [el.x, el.y, el.x + 10, el.y + 10];
          }
          break;
      }

      elementIds.add(el.id);
      return true;
    });

    // Second pass: validate section references
    repaired.elements.forEach((el: any) => {
      if (el.sectionId) {
        if (!sectionIds.has(el.sectionId)) {
          errors.push(`Element ${el.id} references non-existent section ${el.sectionId}`);
          el.sectionId = null;
        }
      }
    });

    // Third pass: detect and break circular section references
    const checkCircularSectionReference = (sectionId: string, visited = new Set<string>()): boolean => {
      if (visited.has(sectionId)) return true;
      visited.add(sectionId);
      
      const section = repaired.elements.find((el: any) => el.id === sectionId && el.type === 'section');
      if (section?.sectionId) {
        return checkCircularSectionReference(section.sectionId, visited);
      }
      return false;
    };

    repaired.elements.forEach((el: any) => {
      if (el.type === 'section' && el.sectionId) {
        if (checkCircularSectionReference(el.id)) {
          errors.push(`Circular section reference detected for ${el.id}`);
          el.sectionId = null;
        }
      }
    });

    // Fourth pass: validate connector references
    repaired.elements.forEach((el: any) => {
      if (el.type === 'connector') {
        // Check startPoint connection
        if (el.startPoint?.connectedElementId && !elementIds.has(el.startPoint.connectedElementId)) {
          warnings.push(`Connector ${el.id} startPoint references non-existent element ${el.startPoint.connectedElementId}`);
          el.startPoint.connectedElementId = undefined;
        }
        
        // Check endPoint connection
        if (el.endPoint?.connectedElementId && !elementIds.has(el.endPoint.connectedElementId)) {
          warnings.push(`Connector ${el.id} endPoint references non-existent element ${el.endPoint.connectedElementId}`);
          el.endPoint.connectedElementId = undefined;
        }
      }
    });

    // Ensure version is set
    if (!repaired.version) {
      repaired.version = 2; // Current version
    }

    // Add metadata if missing
    if (!repaired.metadata) {
      repaired.metadata = {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      };
    } else {
      repaired.metadata.modified = new Date().toISOString();
    }

    console.log(`🔍 [DATA VALIDATOR] Validation complete:`, {
      elementsProcessed: repaired.elements.length,
      errorsFound: errors.length,
      warningsFound: warnings.length,
      valid: errors.length === 0
    });

    return {
      valid: errors.length === 0,
      repaired,
      errors,
      warnings
    };
  }

  /**
   * Quick validation for runtime checks (lighter than full validation)
   */
  static quickValidate(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const typedData = data as any;
    
    if (!Array.isArray(typedData.elements)) return false;
    
    // Check for basic element structure
    return typedData.elements.every((el: any) => 
      el && 
      typeof el === 'object' && 
      typeof el.id === 'string' && 
      typeof el.type === 'string' &&
      typeof el.x === 'number' &&
      typeof el.y === 'number'
    );
  }

  /**
   * Validate specific element type constraints
   */
  static validateElementType(element: any): string[] {
    const errors: string[] = [];

    switch (element.type) {
      case 'section':
        if (typeof element.width !== 'number' || element.width <= 0) {
          errors.push('Section must have positive width');
        }
        if (typeof element.height !== 'number' || element.height <= 0) {
          errors.push('Section must have positive height');
        }
        break;

      case 'text':
        if (!element.text || typeof element.text !== 'string') {
          errors.push('Text element must have text content');
        }
        break;

      case 'connector':
        if (!element.startPoint || !element.endPoint) {
          errors.push('Connector must have start and end points');
        }
        break;
    }

    return errors;
  }
}

/**
 * Migration utilities for upgrading old canvas data formats
 */
export class CanvasDataMigrator {
  /**
   * Migrate canvas data from version 1 to version 2
   * (absolute coordinates to relative coordinates in sections)
   */
  static migrateV1ToV2(oldData: any): CanvasData {
    console.log('🔄 [DATA MIGRATOR] Starting v1 to v2 migration...');
    
    const migrated = structuredClone(oldData);
    
    // Convert old absolute coordinates to new relative system
    const sections = migrated.elements.filter((el: any) => el.type === 'section');
    const elements = migrated.elements.filter((el: any) => el.type !== 'section');
    
    elements.forEach((element: any) => {
      if (element.sectionId) {
        const section = sections.find((s: any) => s.id === element.sectionId);
        if (section) {
          // Old system stored absolute coordinates, new system needs relative
          element.x -= section.x;
          element.y -= section.y;
          console.log(`🔄 [DATA MIGRATOR] Converted element ${element.id} to relative coordinates`);
        }
      }
    });
    
    // Set version marker
    migrated.version = 2;
    
    console.log('✅ [DATA MIGRATOR] Migration complete');
    return migrated;
  }

  /**
   * Auto-detect version and migrate if needed
   */
  static autoMigrate(data: any): CanvasData {
    const version = data.version || 1;
    
    switch (version) {
      case 1:
        return this.migrateV1ToV2(data);
      case 2:
      default:
        return data;
    }
  }
}
