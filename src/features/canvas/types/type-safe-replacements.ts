/**
 * Type-Safe Replacements for Common 'any' Usage
 * Comprehensive type definitions to eliminate 'any' usage throughout the canvas system
 */

import { CanvasElement, ElementId, CircleElement, RectangleElement, TextElement, PenElement } from './enhanced.types';
import { KonvaMouseEvent, KonvaDragEvent, Position } from './event.types';

// Generic function type helpers
export type AnyFunction = (...args: unknown[]) => unknown;
export type AsyncFunction<T = unknown> = (...args: unknown[]) => Promise<T>;
export type EventHandler<T = Event> = (event: T) => void;
export type CallbackFunction<TArgs extends unknown[], TReturn = void> = (...args: TArgs) => TReturn;

// DOM and browser APIs
export interface PerformanceMemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemoryInfo;
}

export interface WindowWithGC extends Window {
  gc?: () => void;
  __CANVAS_STORE__?: unknown;
  __RAF_MANAGER_STATS__?: {
    activeCount: number;
    totalCreated: number;
    totalCanceled: number;
    longestRunning: number;
    frameBudgetExceeded?: number;
  };
  __CANVAS_MONITOR__?: unknown;
}

// Konva-specific types
export interface KonvaNodeProperties {
  id?: () => string;
  x?: () => number;
  y?: () => number;
  width?: () => number;
  height?: () => number;
  rotation?: () => number;
  scaleX?: () => number;
  scaleY?: () => number;
  destroy?: () => void;
  remove?: () => void;
}

// Element-specific types for handling different shapes
export interface CircleElementProperties {
  radius: number;
  centerX?: number;
  centerY?: number;
}

export interface RectangleElementProperties {
  width: number;
  height: number;
  cornerRadius?: number;
}

export interface TextElementProperties {
  text: string;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export interface LineElementProperties {
  points: number[];
  strokeWidth: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'bevel' | 'round' | 'miter';
}

// Enhanced element types with discriminated unions
export interface BaseElementProperties {
  id: ElementId;
  type: string;
  x: number;
  y: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  visible?: boolean;
  draggable?: boolean;
  isLocked?: boolean;
}

export type TypedCanvasElement = 
  | (BaseElementProperties & { type: 'circle' } & CircleElementProperties)
  | (BaseElementProperties & { type: 'rectangle' } & RectangleElementProperties)
  | (BaseElementProperties & { type: 'text' } & TextElementProperties)
  | (BaseElementProperties & { type: 'line' } & LineElementProperties)
  | (BaseElementProperties & { type: string }); // Fallback for other types

// Event-related type helpers
export interface EventWithModifiers {
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

export interface EventPosition extends Position {
  absolutePosition?: Position;
  relativePosition?: Position;
}

export interface EnhancedEventData {
  type: string;
  position: EventPosition | null;
  target?: {
    id: string;
    type: string;
    element?: CanvasElement;
  };
  modifiers?: EventWithModifiers;
  timestamp: number;
}

// Store and state management types
export interface StoreUpdate<T = unknown> {
  path: string;
  previousValue: T;
  newValue: T;
  timestamp: number;
  operation: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

// Performance monitoring types
export interface OperationTiming {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface MemorySnapshot {
  timestamp: number;
  usedMemory: number;
  totalMemory: number;
  elementCount: number;
  gcCount?: number;
}

// Utility types for common patterns
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonNullable<T> = T extends null | undefined ? never : T;

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Configuration and options types
export interface CommonOptions {
  enabled?: boolean;
  debug?: boolean;
  performance?: boolean;
}

export interface ThresholdConfig {
  min: number;
  max: number;
  warning?: number;
  error?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  jitter?: boolean;
}

// Error handling types
export interface ErrorContext {
  operation: string;
  elementId?: ElementId;
  timestamp: number;
  stack?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorHandler {
  (error: Error, context?: ErrorContext): void;
}

// Cache and memoization types
export interface CacheEntry<T = unknown> {
  value: T;
  timestamp: number;
  hits: number;
  size?: number;
  dependencies?: string[];
}

export interface CacheConfig {
  maxSize: number;
  maxAge: number;
  cleanupInterval: number;
  enableMetrics?: boolean;
}

// Spatial indexing types
export interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpatialNode<T = CanvasElement> {
  bounds: BoundingRect;
  items: T[];
  children?: SpatialNode<T>[];
  depth: number;
}

export interface SpatialQuery {
  bounds: BoundingRect;
  filter?: (item: CanvasElement) => boolean;
  limit?: number;
  sort?: (a: CanvasElement, b: CanvasElement) => number;
}

// Animation and transition types
export interface AnimationConfig {
  duration: number;
  easing?: string;
  delay?: number;
  loop?: boolean | number;
  yoyo?: boolean;
}

export interface TransformAnimation {
  from: Partial<CanvasElement>;
  to: Partial<CanvasElement>;
  config: AnimationConfig;
}

// Plugin and extension types
export interface PluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  options?: Record<string, unknown>;
  dependencies?: string[];
}

export interface PluginContext {
  canvas: unknown; // Canvas instance
  store: unknown; // Store instance  
  events: unknown; // Event system
  logger: unknown; // Logger instance
}

// Export helper functions for type narrowing
export function isCircleElement(element: CanvasElement): element is CircleElement {
  return element.type === 'circle';
}

export function isRectangleElement(element: CanvasElement): element is RectangleElement {
  return element.type === 'rectangle';
}

export function isTextElement(element: CanvasElement): element is TextElement {
  return element.type === 'text';
}

export function isLineElement(element: CanvasElement): element is PenElement {
  return element.type === 'pen';
}

export function hasKonvaProperties(obj: unknown): obj is KonvaNodeProperties {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

export function isEventWithModifiers(event: unknown): event is EventWithModifiers {
  return (
    typeof event === 'object' && 
    event !== null && 
    'ctrlKey' in event &&
    'shiftKey' in event &&
    'altKey' in event &&
    'metaKey' in event
  );
}

// Type assertion helpers
export function assertNonNull<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value == null) {
    throw new Error(message ?? 'Expected non-null value');
  }
}

export function assertIsElement(value: unknown): asserts value is CanvasElement {
  if (!value || typeof value !== 'object' || !('id' in value) || !('type' in value)) {
    throw new Error('Expected CanvasElement');
  }
}

export function assertIsFunction(value: unknown): asserts value is AnyFunction {
  if (typeof value !== 'function') {
    throw new Error('Expected function');
  }
}