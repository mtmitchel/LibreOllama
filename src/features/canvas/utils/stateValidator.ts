/**
 * State Validation System for Canvas Store
 * 
 * Prevents corruption by validating state integrity before and after operations
 * Includes automatic recovery mechanisms and corruption detection
 */

import { CanvasElement, ElementId, GroupId } from '../types/enhanced.types';

export enum ValidationLevel {
  BASIC = 'basic',         // Essential checks only
  STANDARD = 'standard',   // Most validation rules
  STRICT = 'strict',       // All validation rules + performance checks
}

export enum ValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ValidationError {
  id: string;
  severity: ValidationSeverity;
  message: string;
  field?: string;
  elementId?: ElementId;
  suggestedFix?: string;
  timestamp: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  fixed: ValidationError[];
  stats: ValidationStats;
}

export interface ValidationStats {
  totalElements: number;
  validElements: number;
  corruptedElements: number;
  orphanedElements: number;
  duplicateIds: number;
  missingReferences: number;
  validationTime: number;
}

export interface CanvasState {
  elements: Map<ElementId, CanvasElement>;
  selectedElementIds: Set<ElementId>;
  groups: Map<GroupId, Set<ElementId>>;
  elementToGroupMap: Map<ElementId, GroupId>;
  elementOrder: ElementId[];
  sections?: Map<string, any>;
  viewport?: {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  };
}

/**
 * Core validation rules for canvas elements
 */
const VALIDATION_RULES = {
  element: {
    hasId: (element: CanvasElement) => !!element.id,
    hasType: (element: CanvasElement) => !!element.type,
    hasPosition: (element: CanvasElement) => 
      typeof element.x === 'number' && typeof element.y === 'number',
    hasValidDimensions: (element: CanvasElement) => {
      if ('width' in element && 'height' in element) {
        return (element as any).width >= 0 && (element as any).height >= 0;
      }
      if ('radius' in element) {
        return (element as any).radius >= 0;
      }
      return true;
    },
    hasTimestamps: (element: CanvasElement) => 
      element.createdAt > 0 && element.updatedAt > 0,
    validGroupReference: (element: CanvasElement, state: CanvasState) => {
      if (!element.groupId) return true;
      return state.groups.has(element.groupId);
    }
  },

  state: {
    noDuplicateIds: (state: CanvasState) => {
      const ids = Array.from(state.elements.keys());
      return ids.length === new Set(ids).size;
    },
    elementsInOrder: (state: CanvasState) => {
      return state.elementOrder.every(id => state.elements.has(id));
    },
    orderHasAllElements: (state: CanvasState) => {
      const elementIds = new Set(state.elements.keys());
      const orderIds = new Set(state.elementOrder);
      return elementIds.size === orderIds.size && 
        [...elementIds].every(id => orderIds.has(id));
    },
    selectedElementsExist: (state: CanvasState) => {
      return [...state.selectedElementIds].every(id => state.elements.has(id));
    },
    groupIntegrity: (state: CanvasState) => {
      // All groups reference existing elements
      for (const [groupId, elementIds] of state.groups) {
        if (![...elementIds].every(id => state.elements.has(id))) {
          return false;
        }
      }
      // All element-to-group mappings are consistent
      for (const [elementId, groupId] of state.elementToGroupMap) {
        const group = state.groups.get(groupId);
        if (!group || !group.has(elementId)) {
          return false;
        }
      }
      return true;
    }
  }
};

export class StateValidator {
  private level: ValidationLevel = ValidationLevel.STANDARD;
  private autoFix = true;
  private validationHistory: ValidationResult[] = [];
  private readonly MAX_HISTORY = 100;

  constructor(level: ValidationLevel = ValidationLevel.STANDARD, autoFix = true) {
    this.level = level;
    this.autoFix = autoFix;
  }

  /**
   * Validate entire canvas state
   */
  validate(state: CanvasState): ValidationResult {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const fixed: ValidationError[] = [];

    // Create mutable copy for auto-fixing
    const workingState = this.autoFix ? this.cloneState(state) : state;

    // Run validation rules based on level
    this.validateElements(workingState, errors, warnings, fixed);
    this.validateStateIntegrity(workingState, errors, warnings, fixed);

    if (this.level === ValidationLevel.STRICT) {
      this.validatePerformance(workingState, errors, warnings, fixed);
    }

    const validationTime = performance.now() - startTime;
    const stats = this.generateStats(workingState, validationTime);

    const result: ValidationResult = {
      isValid: errors.filter(e => e.severity === ValidationSeverity.ERROR || 
                           e.severity === ValidationSeverity.CRITICAL).length === 0,
      errors,
      warnings,
      fixed,
      stats
    };

    // Store in history
    this.addToHistory(result);

    return result;
  }

  /**
   * Validate individual elements
   */
  private validateElements(
    state: CanvasState, 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    fixed: ValidationError[]
  ): void {
    for (const [elementId, element] of state.elements) {
      this.validateElement(elementId, element, state, errors, warnings, fixed);
    }
  }

  /**
   * Validate single element
   */
  private validateElement(
    elementId: ElementId,
    element: CanvasElement,
    state: CanvasState,
    errors: ValidationError[],
    warnings: ValidationError[],
    fixed: ValidationError[]
  ): void {
    // Basic validations
    if (!VALIDATION_RULES.element.hasId(element)) {
      errors.push({
        id: `missing-id-${elementId}`,
        severity: ValidationSeverity.CRITICAL,
        message: 'Element missing ID',
        elementId,
        field: 'id',
        suggestedFix: 'Generate new ID',
        timestamp: Date.now()
      });

      if (this.autoFix) {
        element.id = elementId; // Use the map key as ID
        fixed.push(errors[errors.length - 1]);
      }
    }

    if (!VALIDATION_RULES.element.hasType(element)) {
      errors.push({
        id: `missing-type-${elementId}`,
        severity: ValidationSeverity.CRITICAL,
        message: 'Element missing type',
        elementId,
        field: 'type',
        suggestedFix: 'Set default type',
        timestamp: Date.now()
      });

      if (this.autoFix) {
        (element as any).type = 'rectangle'; // Default type
        fixed.push(errors[errors.length - 1]);
      }
    }

    if (!VALIDATION_RULES.element.hasPosition(element)) {
      errors.push({
        id: `invalid-position-${elementId}`,
        severity: ValidationSeverity.ERROR,
        message: 'Element has invalid position',
        elementId,
        field: 'position',
        suggestedFix: 'Set position to (0, 0)',
        timestamp: Date.now()
      });

      if (this.autoFix) {
        element.x = element.x || 0;
        element.y = element.y || 0;
        fixed.push(errors[errors.length - 1]);
      }
    }

    if (!VALIDATION_RULES.element.hasValidDimensions(element)) {
      warnings.push({
        id: `invalid-dimensions-${elementId}`,
        severity: ValidationSeverity.WARNING,
        message: 'Element has invalid dimensions',
        elementId,
        field: 'dimensions',
        suggestedFix: 'Set minimum dimensions',
        timestamp: Date.now()
      });

      if (this.autoFix) {
        if ('width' in element && (element as any).width < 0) (element as any).width = 1;
        if ('height' in element && (element as any).height < 0) (element as any).height = 1;
        if ('radius' in element && (element as any).radius < 0) (element as any).radius = 1;
        fixed.push(warnings[warnings.length - 1]);
      }
    }

    // Standard level validations
    if (this.level !== ValidationLevel.BASIC) {
      if (!VALIDATION_RULES.element.hasTimestamps(element)) {
        warnings.push({
          id: `missing-timestamps-${elementId}`,
          severity: ValidationSeverity.WARNING,
          message: 'Element missing timestamps',
          elementId,
          field: 'timestamps',
          suggestedFix: 'Set current timestamp',
          timestamp: Date.now()
        });

        if (this.autoFix) {
          const now = Date.now();
          element.createdAt = element.createdAt || now;
          element.updatedAt = now;
          fixed.push(warnings[warnings.length - 1]);
        }
      }

      if (!VALIDATION_RULES.element.validGroupReference(element, state)) {
        errors.push({
          id: `invalid-group-ref-${elementId}`,
          severity: ValidationSeverity.ERROR,
          message: 'Element references non-existent group',
          elementId,
          field: 'groupId',
          suggestedFix: 'Remove group reference',
          timestamp: Date.now()
        });

        if (this.autoFix) {
          delete element.groupId;
          state.elementToGroupMap.delete(elementId);
          fixed.push(errors[errors.length - 1]);
        }
      }
    }
  }

  /**
   * Validate state integrity
   */
  private validateStateIntegrity(
    state: CanvasState,
    errors: ValidationError[],
    warnings: ValidationError[],
    fixed: ValidationError[]
  ): void {
    // Check for duplicate IDs
    if (!VALIDATION_RULES.state.noDuplicateIds(state)) {
      errors.push({
        id: 'duplicate-ids',
        severity: ValidationSeverity.CRITICAL,
        message: 'Duplicate element IDs detected',
        suggestedFix: 'Generate unique IDs',
        timestamp: Date.now()
      });
    }

    // Check element order consistency
    if (!VALIDATION_RULES.state.elementsInOrder(state)) {
      warnings.push({
        id: 'missing-elements-in-order',
        severity: ValidationSeverity.WARNING,
        message: 'Element order references non-existent elements',
        field: 'elementOrder',
        suggestedFix: 'Sync element order',
        timestamp: Date.now()
      });

      if (this.autoFix) {
        state.elementOrder = state.elementOrder.filter(id => state.elements.has(id));
        fixed.push(warnings[warnings.length - 1]);
      }
    }

    if (!VALIDATION_RULES.state.orderHasAllElements(state)) {
      warnings.push({
        id: 'incomplete-element-order',
        severity: ValidationSeverity.WARNING,
        message: 'Element order missing some elements',
        field: 'elementOrder',
        suggestedFix: 'Add missing elements to order',
        timestamp: Date.now()
      });

      if (this.autoFix) {
        const orderSet = new Set(state.elementOrder);
        for (const elementId of state.elements.keys()) {
          if (!orderSet.has(elementId)) {
            state.elementOrder.push(elementId);
          }
        }
        fixed.push(warnings[warnings.length - 1]);
      }
    }

    // Check selection integrity
    if (!VALIDATION_RULES.state.selectedElementsExist(state)) {
      warnings.push({
        id: 'invalid-selection',
        severity: ValidationSeverity.WARNING,
        message: 'Selection includes non-existent elements',
        field: 'selectedElementIds',
        suggestedFix: 'Remove invalid selections',
        timestamp: Date.now()
      });

      if (this.autoFix) {
        const validSelections = [...state.selectedElementIds].filter(id => 
          state.elements.has(id)
        );
        state.selectedElementIds = new Set(validSelections);
        fixed.push(warnings[warnings.length - 1]);
      }
    }

    // Check group integrity
    if (!VALIDATION_RULES.state.groupIntegrity(state)) {
      errors.push({
        id: 'group-integrity',
        severity: ValidationSeverity.ERROR,
        message: 'Group references are inconsistent',
        field: 'groups',
        suggestedFix: 'Rebuild group references',
        timestamp: Date.now()
      });

      if (this.autoFix) {
        this.repairGroupIntegrity(state);
        fixed.push(errors[errors.length - 1]);
      }
    }
  }

  /**
   * Validate performance characteristics
   */
  private validatePerformance(
    state: CanvasState,
    errors: ValidationError[],
    warnings: ValidationError[],
    fixed: ValidationError[]
  ): void {
    const elementCount = state.elements.size;
    
    if (elementCount > 10000) {
      warnings.push({
        id: 'high-element-count',
        severity: ValidationSeverity.WARNING,
        message: `High element count: ${elementCount}`,
        suggestedFix: 'Consider pagination or virtual scrolling',
        timestamp: Date.now()
      });
    }

    if (elementCount > 50000) {
      errors.push({
        id: 'critical-element-count',
        severity: ValidationSeverity.ERROR,
        message: `Critical element count: ${elementCount}`,
        suggestedFix: 'Implement element culling',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Repair group integrity
   */
  private repairGroupIntegrity(state: CanvasState): void {
    // Rebuild element-to-group mapping
    state.elementToGroupMap.clear();
    
    for (const [groupId, elementIds] of state.groups) {
      // Remove non-existent elements from groups
      const validElementIds = [...elementIds].filter(id => state.elements.has(id));
      state.groups.set(groupId, new Set(validElementIds));
      
      // Update element-to-group mapping
      validElementIds.forEach(elementId => {
        state.elementToGroupMap.set(elementId, groupId);
        
        // Update element's groupId
        const element = state.elements.get(elementId);
        if (element) {
          element.groupId = groupId;
        }
      });
    }

    // Remove empty groups
    for (const [groupId, elementIds] of state.groups) {
      if (elementIds.size === 0) {
        state.groups.delete(groupId);
      }
    }
  }

  /**
   * Generate validation statistics
   */
  private generateStats(state: CanvasState, validationTime: number): ValidationStats {
    let validElements = 0;
    let corruptedElements = 0;
    
    for (const element of state.elements.values()) {
      if (this.isElementValid(element)) {
        validElements++;
      } else {
        corruptedElements++;
      }
    }

    return {
      totalElements: state.elements.size,
      validElements,
      corruptedElements,
      orphanedElements: this.countOrphanedElements(state),
      duplicateIds: 0, // Would need special tracking
      missingReferences: this.countMissingReferences(state),
      validationTime
    };
  }

  /**
   * Check if element is valid
   */
  private isElementValid(element: CanvasElement): boolean {
    return VALIDATION_RULES.element.hasId(element) &&
           VALIDATION_RULES.element.hasType(element) &&
           VALIDATION_RULES.element.hasPosition(element);
  }

  /**
   * Count orphaned elements
   */
  private countOrphanedElements(state: CanvasState): number {
    return state.elementOrder.length - state.elements.size;
  }

  /**
   * Count missing references
   */
  private countMissingReferences(state: CanvasState): number {
    let count = 0;
    
    // Check group references
    for (const element of state.elements.values()) {
      if (element.groupId && !state.groups.has(element.groupId)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Clone state for auto-fixing with null safety
   */
  private cloneState(state: CanvasState): CanvasState {
    // Handle null/undefined state
    if (!state) {
      return {
        elements: new Map(),
        selectedElementIds: new Set(),
        groups: new Map(),
        elementToGroupMap: new Map(),
        elementOrder: [],
        sections: undefined,
        viewport: undefined,
      };
    }

    // Safe cloning with comprehensive null/undefined checks
    return {
      elements: (state.elements instanceof Map) ? new Map(state.elements) : new Map(),
      selectedElementIds: (state.selectedElementIds instanceof Set) ? new Set(state.selectedElementIds) : new Set(),
      groups: (state.groups instanceof Map) 
        ? new Map(Array.from(state.groups.entries() || []).map(([k, v]) => [k, (v instanceof Set) ? new Set(v) : new Set()]))
        : new Map(),
      elementToGroupMap: (state.elementToGroupMap instanceof Map) ? new Map(state.elementToGroupMap) : new Map(),
      elementOrder: Array.isArray(state.elementOrder) ? [...state.elementOrder] : [],
      sections: (state.sections instanceof Map) ? new Map(state.sections) : undefined,
      viewport: (state.viewport && typeof state.viewport === 'object') ? { ...state.viewport } : undefined,
    };
  }

  /**
   * Add result to history
   */
  private addToHistory(result: ValidationResult): void {
    this.validationHistory.push(result);
    
    if (this.validationHistory.length > this.MAX_HISTORY) {
      this.validationHistory.shift();
    }
  }

  /**
   * Get validation history
   */
  getHistory(): ValidationResult[] {
    return [...this.validationHistory];
  }

  /**
   * Get validation summary
   */
  getSummary(): {
    totalValidations: number;
    averageValidationTime: number;
    totalErrors: number;
    totalWarnings: number;
    autoFixSuccessRate: number;
  } {
    if (this.validationHistory.length === 0) {
      return {
        totalValidations: 0,
        averageValidationTime: 0,
        totalErrors: 0,
        totalWarnings: 0,
        autoFixSuccessRate: 0
      };
    }

    const totalErrors = this.validationHistory.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = this.validationHistory.reduce((sum, r) => sum + r.warnings.length, 0);
    const totalFixed = this.validationHistory.reduce((sum, r) => sum + r.fixed.length, 0);
    const averageTime = this.validationHistory.reduce((sum, r) => sum + r.stats.validationTime, 0) / this.validationHistory.length;

    return {
      totalValidations: this.validationHistory.length,
      averageValidationTime: averageTime,
      totalErrors,
      totalWarnings,
      autoFixSuccessRate: totalFixed / (totalErrors + totalWarnings) || 0
    };
  }

  /**
   * Set validation level
   */
  setLevel(level: ValidationLevel): void {
    this.level = level;
  }

  /**
   * Set auto-fix mode
   */
  setAutoFix(autoFix: boolean): void {
    this.autoFix = autoFix;
  }
}

// Export singleton validator
export const stateValidator = new StateValidator();

/**
 * Validation decorator for store methods
 */
export function withValidation(
  level: ValidationLevel = ValidationLevel.STANDARD,
  validateBefore = false,
  validateAfter = true
) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = function (this: any, ...args: any[]) {
      const state = this as CanvasState;

      // Validate before if requested
      if (validateBefore) {
        const beforeResult = stateValidator.validate(state);
        if (!beforeResult.isValid) {
          console.warn(`⚠️ Validation failed before ${propertyKey}:`, beforeResult.errors);
        }
      }

      // Execute original method
      const result = originalMethod.apply(this, args);

      // Validate after if requested
      if (validateAfter) {
        const afterResult = stateValidator.validate(state);
        if (!afterResult.isValid) {
          console.error(`🔴 Validation failed after ${propertyKey}:`, afterResult.errors);
        }
      }

      return result;
    } as T;

    return descriptor;
  };
}