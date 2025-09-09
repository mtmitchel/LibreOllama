/**
 * State validation utilities for canvas store
 */

import { CanvasElement } from '../types/enhanced.types';

export enum ValidationLevel {
  MINIMAL = 'minimal',
  STANDARD = 'standard',
  STRICT = 'strict'
}

export interface StateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  fixed?: number;
  stats?: {
    elementsChecked: number;
    issuesFound: number;
  };
}

// Legacy alias for compatibility
export type ValidationResult = StateValidationResult;

export function validateCanvasElement(element: any): StateValidationResult {
  const errors: string[] = [];
  
  if (!element) {
    errors.push('Element is null or undefined');
    return { isValid: false, errors };
  }
  
  if (!element.id) {
    errors.push('Element missing required id field');
  }
  
  if (!element.type) {
    errors.push('Element missing required type field');
  }
  
  if (typeof element.x !== 'number') {
    errors.push('Element missing or invalid x coordinate');
  }
  
  if (typeof element.y !== 'number') {
    errors.push('Element missing or invalid y coordinate');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateCanvasState(elements: CanvasElement[]): StateValidationResult {
  const errors: string[] = [];
  
  if (!Array.isArray(elements)) {
    errors.push('Elements must be an array');
    return { isValid: false, errors };
  }
  
  elements.forEach((element, index) => {
    const result = validateCanvasElement(element);
    if (!result.isValid) {
      errors.push(`Element at index ${index}: ${result.errors.join(', ')}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// State validator object for backward compatibility
class StateValidator {
  private level: ValidationLevel = ValidationLevel.STANDARD;

  setLevel(level: ValidationLevel): void {
    this.level = level;
  }

  validate(state: any): StateValidationResult {
    if (Array.isArray(state)) {
      return validateCanvasState(state);
    } else {
      return validateCanvasElement(state);
    }
  }
}

export const stateValidator = new StateValidator();