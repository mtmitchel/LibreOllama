/**
 * Comprehensive Type Guards and Runtime Validation
 * Enhanced type safety with runtime validation for critical canvas operations
 */

import { CanvasElement, ElementId, CanvasTool } from '../types/enhanced.types';
import { Position, KonvaMouseEvent, KonvaDragEvent } from '../types/event.types';
import { canvasLog } from '../utils/canvasLogger';

// Validation result interface
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}

// Element type validation
export function isCanvasElement(value: unknown): value is CanvasElement {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.x === 'number' &&
    typeof obj.y === 'number'
  );
}

export function isElementId(value: unknown): value is ElementId {
  return typeof value === 'string' && value.length > 0;
}

export function isCanvasTool(value: unknown): value is CanvasTool {
  const validTools: CanvasTool[] = [
    'select', 'pan', 'text', 'rectangle', 'circle', 'line',
    'connector', 'connector-line', 'connector-arrow', 'pen',
    'triangle', 'sticky-note', 'image', 'table', 'section'
  ];
  return typeof value === 'string' && validTools.includes(value as CanvasTool);
}

// Position validation
export function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  return typeof obj.x === 'number' && typeof obj.y === 'number';
}

export function isValidPosition(position: Position): ValidationResult<Position> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (!Number.isFinite(position.x)) {
    errors.push({
      path: 'position.x',
      message: 'X coordinate must be a finite number',
      code: 'INVALID_X_COORDINATE',
      severity: 'error'
    });
  }
  
  if (!Number.isFinite(position.y)) {
    errors.push({
      path: 'position.y',
      message: 'Y coordinate must be a finite number',
      code: 'INVALID_Y_COORDINATE',
      severity: 'error'
    });
  }
  
  // Warn about extreme coordinates
  const MAX_COORDINATE = 1000000;
  if (Math.abs(position.x) > MAX_COORDINATE) {
    warnings.push({
      path: 'position.x',
      message: 'X coordinate is extremely large and may cause performance issues',
      code: 'EXTREME_X_COORDINATE'
    });
  }
  
  if (Math.abs(position.y) > MAX_COORDINATE) {
    warnings.push({
      path: 'position.y',
      message: 'Y coordinate is extremely large and may cause performance issues',
      code: 'EXTREME_Y_COORDINATE'
    });
  }
  
  return {
    isValid: errors.length === 0,
    data: position,
    errors,
    warnings
  };
}

// Element validation
export function validateCanvasElement(element: unknown): ValidationResult<CanvasElement> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (!isCanvasElement(element)) {
    errors.push({
      path: 'element',
      message: 'Value is not a valid canvas element',
      code: 'INVALID_ELEMENT_STRUCTURE',
      severity: 'critical'
    });
    return { isValid: false, errors, warnings };
  }
  
  // Validate ID
  if (!element.id || typeof element.id !== 'string') {
    errors.push({
      path: 'element.id',
      message: 'Element ID must be a non-empty string',
      code: 'INVALID_ELEMENT_ID',
      severity: 'critical'
    });
  }
  
  // Validate type
  if (!element.type || typeof element.type !== 'string') {
    errors.push({
      path: 'element.type',
      message: 'Element type must be a non-empty string',
      code: 'INVALID_ELEMENT_TYPE',
      severity: 'error'
    });
  }
  
  // Validate position
  const positionResult = isValidPosition({ x: element.x, y: element.y });
  errors.push(...positionResult.errors);
  warnings.push(...positionResult.warnings);
  
  // Validate dimensions if present
  if ('width' in element && element.width !== undefined) {
    if (typeof element.width !== 'number' || element.width < 0) {
      errors.push({
        path: 'element.width',
        message: 'Width must be a non-negative number',
        code: 'INVALID_WIDTH',
        severity: 'error'
      });
    } else if (element.width === 0) {
      warnings.push({
        path: 'element.width',
        message: 'Element has zero width',
        code: 'ZERO_WIDTH'
      });
    }
  }
  
  if ('height' in element && element.height !== undefined) {
    if (typeof element.height !== 'number' || element.height < 0) {
      errors.push({
        path: 'element.height',
        message: 'Height must be a non-negative number',
        code: 'INVALID_HEIGHT',
        severity: 'error'
      });
    } else if (element.height === 0) {
      warnings.push({
        path: 'element.height',
        message: 'Element has zero height',
        code: 'ZERO_HEIGHT'
      });
    }
  }
  
  // Validate opacity if present
  if ('opacity' in element && element.opacity !== undefined) {
    if (typeof element.opacity !== 'number' || element.opacity < 0 || element.opacity > 1) {
      errors.push({
        path: 'element.opacity',
        message: 'Opacity must be a number between 0 and 1',
        code: 'INVALID_OPACITY',
        severity: 'error'
      });
    }
  }
  
  // Validate rotation if present
  if (element.rotation !== undefined) {
    if (typeof element.rotation !== 'number' || !Number.isFinite(element.rotation)) {
      errors.push({
        path: 'element.rotation',
        message: 'Rotation must be a finite number',
        code: 'INVALID_ROTATION',
        severity: 'error'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    data: element,
    errors,
    warnings
  };
}

// Event validation
export function isKonvaMouseEvent(value: unknown): value is KonvaMouseEvent {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  return (
    'evt' in obj &&
    obj.evt instanceof MouseEvent &&
    typeof obj.target === 'object'
  );
}

export function isKonvaDragEvent(value: unknown): value is KonvaDragEvent {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  return (
    'evt' in obj &&
    obj.evt instanceof DragEvent &&
    typeof obj.target === 'object'
  );
}

// Array validation
export function isCanvasElementArray(value: unknown): value is CanvasElement[] {
  if (!Array.isArray(value)) return false;
  return value.every(item => isCanvasElement(item));
}

export function validateElementArray(elements: unknown): ValidationResult<CanvasElement[]> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (!Array.isArray(elements)) {
    errors.push({
      path: 'elements',
      message: 'Elements must be an array',
      code: 'NOT_ARRAY',
      severity: 'critical'
    });
    return { isValid: false, errors, warnings };
  }
  
  const validElements: CanvasElement[] = [];
  const duplicateIds = new Set<string>();
  const seenIds = new Set<string>();
  
  elements.forEach((element, index) => {
    const elementResult = validateCanvasElement(element);
    
    // Add path context to errors
    elementResult.errors.forEach(error => {
      errors.push({
        ...error,
        path: `elements[${index}].${error.path}`
      });
    });
    
    elementResult.warnings.forEach(warning => {
      warnings.push({
        ...warning,
        path: `elements[${index}].${warning.path}`
      });
    });
    
    if (elementResult.isValid && elementResult.data) {
      // Check for duplicate IDs
      if (seenIds.has(elementResult.data.id)) {
        duplicateIds.add(elementResult.data.id);
        errors.push({
          path: `elements[${index}].id`,
          message: `Duplicate element ID: ${elementResult.data.id}`,
          code: 'DUPLICATE_ID',
          severity: 'critical'
        });
      } else {
        seenIds.add(elementResult.data.id);
        validElements.push(elementResult.data);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    data: validElements,
    errors,
    warnings
  };
}

// Color validation
export function isValidColor(color: unknown): color is string {
  if (typeof color !== 'string') return false;
  
  // Check for hex colors
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)) return true;
  
  // Check for rgb/rgba colors
  if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color)) return true;
  if (/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[0-1]?(\.\d+)?\s*\)$/.test(color)) return true;
  
  // Check for named colors (basic set)
  const namedColors = [
    'transparent', 'black', 'white', 'red', 'green', 'blue',
    'yellow', 'cyan', 'magenta', 'orange', 'purple', 'pink',
    'brown', 'gray', 'grey'
  ];
  return namedColors.includes(color.toLowerCase());
}

// Dimension validation
export function isValidDimension(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

// Comprehensive element type guards
export function isRectangleElement(element: CanvasElement): element is CanvasElement & {
  type: 'rectangle';
  width: number;
  height: number;
} {
  return element.type === 'rectangle' && 
         typeof element.width === 'number' && 
         typeof element.height === 'number';
}

export function isCircleElement(element: CanvasElement): element is CanvasElement & {
  type: 'circle';
  radius: number;
} {
  return element.type === 'circle' && 
         typeof (element as any).radius === 'number';
}

export function isTextElement(element: CanvasElement): element is CanvasElement & {
  type: 'text';
  text: string;
  fontSize?: number;
} {
  return element.type === 'text' && 
         typeof (element as any).text === 'string';
}

// Runtime assertion functions
export function assertIsCanvasElement(value: unknown, context?: string): asserts value is CanvasElement {
  const result = validateCanvasElement(value);
  if (!result.isValid) {
    const contextStr = context ? ` in ${context}` : '';
    const errorMessages = result.errors.map(e => e.message).join(', ');
    throw new Error(`Invalid canvas element${contextStr}: ${errorMessages}`);
  }
}

export function assertIsPosition(value: unknown, context?: string): asserts value is Position {
  if (!isPosition(value)) {
    const contextStr = context ? ` in ${context}` : '';
    throw new Error(`Invalid position${contextStr}: expected object with x and y numbers`);
  }
  
  const result = isValidPosition(value);
  if (!result.isValid) {
    const contextStr = context ? ` in ${context}` : '';
    const errorMessages = result.errors.map(e => e.message).join(', ');
    throw new Error(`Invalid position${contextStr}: ${errorMessages}`);
  }
}

export function assertIsElementId(value: unknown, context?: string): asserts value is ElementId {
  if (!isElementId(value)) {
    const contextStr = context ? ` in ${context}` : '';
    throw new Error(`Invalid element ID${contextStr}: expected non-empty string`);
  }
}

// Safe conversion functions
export function safelyConvertToPosition(value: unknown): Position | null {
  try {
    if (!isPosition(value)) return null;
    const result = isValidPosition(value);
    return result.isValid ? value : null;
  } catch (error) {
    canvasLog.warn('🛡️ [TypeGuards] Failed to convert to position:', error);
    return null;
  }
}

export function safelyConvertToCanvasElement(value: unknown): CanvasElement | null {
  try {
    const result = validateCanvasElement(value);
    return result.isValid && result.data ? result.data : null;
  } catch (error) {
    canvasLog.warn('🛡️ [TypeGuards] Failed to convert to canvas element:', error);
    return null;
  }
}

// Validation utilities
export function validateAndLogErrors<T>(
  value: unknown,
  validator: (value: unknown) => ValidationResult<T>,
  context: string
): T | null {
  const result = validator(value);
  
  if (result.errors.length > 0) {
    canvasLog.error(`🛡️ [TypeGuards] Validation errors in ${context}:`, {
      errors: result.errors,
      warnings: result.warnings
    });
  } else if (result.warnings.length > 0) {
    canvasLog.warn(`🛡️ [TypeGuards] Validation warnings in ${context}:`, {
      warnings: result.warnings
    });
  }
  
  return result.isValid && result.data ? result.data : null;
}

// Batch validation
export function validateBatch<T>(
  values: unknown[],
  validator: (value: unknown) => ValidationResult<T>
): ValidationResult<T[]> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const validData: T[] = [];
  
  values.forEach((value, index) => {
    const result = validator(value);
    
    result.errors.forEach(error => {
      errors.push({
        ...error,
        path: `[${index}].${error.path}`
      });
    });
    
    result.warnings.forEach(warning => {
      warnings.push({
        ...warning,
        path: `[${index}].${warning.path}`
      });
    });
    
    if (result.isValid && result.data) {
      validData.push(result.data);
    }
  });
  
  return {
    isValid: errors.length === 0,
    data: validData,
    errors,
    warnings
  };
}

// Development mode validation wrapper
export function withValidation<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  validators: Array<(arg: unknown) => ValidationResult<unknown>>,
  fnName: string
): (...args: TArgs) => TReturn {
  if (process.env.NODE_ENV === 'production') {
    return fn; // Skip validation in production
  }
  
  return (...args: TArgs) => {
    args.forEach((arg, index) => {
      if (validators[index]) {
        const result = validators[index](arg);
        if (!result.isValid) {
          canvasLog.error(`🛡️ [TypeGuards] Validation failed for ${fnName} argument ${index}:`, {
            errors: result.errors,
            warnings: result.warnings,
            value: arg
          });
        }
      }
    });
    
    return fn(...args);
  };
}

export default {
  // Type guards
  isCanvasElement,
  isElementId,
  isCanvasTool,
  isPosition,
  isKonvaMouseEvent,
  isKonvaDragEvent,
  isCanvasElementArray,
  isValidColor,
  isValidDimension,
  isRectangleElement,
  isCircleElement,
  isTextElement,
  
  // Validation functions
  validateCanvasElement,
  validateElementArray,
  isValidPosition,
  
  // Assertion functions
  assertIsCanvasElement,
  assertIsPosition,
  assertIsElementId,
  
  // Safe conversion
  safelyConvertToPosition,
  safelyConvertToCanvasElement,
  
  // Utilities
  validateAndLogErrors,
  validateBatch,
  withValidation
};