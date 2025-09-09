/**
 * Event Management Layer for Canvas Text Editing
 * Centralized event handling for text editing overlays
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import type Konva from 'konva';
import type { ElementId, CanvasElement } from '../../types/enhanced.types';

/**
 * Event handler function types
 */
export type KeyboardEventHandler = (event: KeyboardEvent) => void;
export type MouseEventHandler = (event: MouseEvent) => void;
export type InputEventHandler = (event: Event) => void;
export type WheelEventHandler = (event: WheelEvent) => void;
export type StageEventHandler = () => void;
export type CompositionEventHandler = () => void;

/**
 * Event cleanup function type
 */
export type EventCleanupFunction = () => void;

/**
 * Text editing event configuration
 */
export interface TextEditingEventConfig {
  onKeyDown?: KeyboardEventHandler;
  onBlur?: (event: FocusEvent) => void;
  onInput?: InputEventHandler;
  onCompositionStart?: CompositionEventHandler;
  onCompositionEnd?: CompositionEventHandler;
  onWheel?: WheelEventHandler;
  onStageTransform?: StageEventHandler;
  onDocumentMouseDown?: MouseEventHandler;
}

/**
 * Event binding result
 */
export interface EventBindingResult {
  cleanup: EventCleanupFunction;
  handlers: {
    keydown?: KeyboardEventHandler;
    blur?: (event: FocusEvent) => void;
    input?: InputEventHandler;
    compositionStart?: CompositionEventHandler;
    compositionEnd?: CompositionEventHandler;
    wheel?: WheelEventHandler;
    stageTransform?: StageEventHandler;
    documentMouseDown?: MouseEventHandler;
  };
}

/**
 * Text Editor Event Manager
 * Handles all event binding and cleanup for text editing overlays
 */
export class TextEditorEventManager {
  private activeBindings: Map<string, EventBindingResult> = new Map();

  /**
   * Bind events for a text editing element
   * @param elementId - Element ID being edited
   * @param textElement - DOM element (textarea or contenteditable)
   * @param wrapperElement - Wrapper element
   * @param stage - Konva stage
   * @param config - Event configuration
   * @returns Event binding result with cleanup function
   */
  bindTextEditingEvents(
    elementId: ElementId,
    textElement: HTMLElement,
    wrapperElement: HTMLElement,
    stage: Konva.Stage,
    config: TextEditingEventConfig
  ): EventBindingResult {
    const handlers: EventBindingResult['handlers'] = {};
    const eventListeners: Array<() => void> = [];

    // Keyboard events
    if (config.onKeyDown) {
      handlers.keydown = config.onKeyDown;
      textElement.addEventListener('keydown', config.onKeyDown);
      eventListeners.push(() => textElement.removeEventListener('keydown', config.onKeyDown!));
    }

    // Blur events
    if (config.onBlur) {
      handlers.blur = config.onBlur;
      textElement.addEventListener('blur', config.onBlur);
      eventListeners.push(() => textElement.removeEventListener('blur', config.onBlur!));
    }

    // Input events
    if (config.onInput) {
      handlers.input = config.onInput;
      textElement.addEventListener('input', config.onInput);
      eventListeners.push(() => textElement.removeEventListener('input', config.onInput!));
    }

    // Composition events for IME support
    if (config.onCompositionStart) {
      handlers.compositionStart = config.onCompositionStart;
      textElement.addEventListener('compositionstart', config.onCompositionStart);
      eventListeners.push(() => textElement.removeEventListener('compositionstart', config.onCompositionStart!));
    }

    if (config.onCompositionEnd) {
      handlers.compositionEnd = config.onCompositionEnd;
      textElement.addEventListener('compositionend', config.onCompositionEnd);
      eventListeners.push(() => textElement.removeEventListener('compositionend', config.onCompositionEnd!));
    }

    // Stage transform events (zoom/pan)
    if (config.onWheel && config.onStageTransform) {
      handlers.wheel = config.onWheel;
      handlers.stageTransform = config.onStageTransform;

      const wheelHandler = () => config.onStageTransform!();
      const dragMoveHandler = () => config.onStageTransform!();

      // Wheel events on container
      const container = stage.container();
      container?.addEventListener('wheel', wheelHandler, { passive: true });
      eventListeners.push(() => container?.removeEventListener('wheel', wheelHandler));

      // Stage drag events
      stage.on('dragmove.editor', dragMoveHandler);
      eventListeners.push(() => stage.off('dragmove.editor'));
    }

    // Document mouse events (for detecting outside clicks)
    if (config.onDocumentMouseDown) {
      handlers.documentMouseDown = config.onDocumentMouseDown;
      document.addEventListener('mousedown', config.onDocumentMouseDown, true);
      eventListeners.push(() => document.removeEventListener('mousedown', config.onDocumentMouseDown!, true));
    }

    // Create cleanup function
    const cleanup = () => {
      console.info('[EventManager] Cleaning up text editing events for', elementId);
      
      // Remove all event listeners
      eventListeners.forEach(removeListener => {
        try {
          removeListener();
        } catch (e) {
          console.warn('Failed to remove event listener:', e);
        }
      });

      // Remove from active bindings
      this.activeBindings.delete(elementId);
    };

    const binding: EventBindingResult = {
      cleanup,
      handlers
    };

    // Store binding for management
    this.activeBindings.set(elementId, binding);

    return binding;
  }

  /**
   * Clean up events for a specific element
   * @param elementId - Element ID to clean up
   */
  cleanupElement(elementId: ElementId): void {
    const binding = this.activeBindings.get(elementId);
    if (binding) {
      binding.cleanup();
    }
  }

  /**
   * Clean up all active bindings
   */
  cleanupAll(): void {
    console.info('[EventManager] Cleaning up all text editing events');
    
    for (const binding of this.activeBindings.values()) {
      try {
        binding.cleanup();
      } catch (e) {
        console.warn('Failed to cleanup event binding:', e);
      }
    }
    
    this.activeBindings.clear();
  }

  /**
   * Get active binding count
   */
  getActiveBindingCount(): number {
    return this.activeBindings.size;
  }

  /**
   * Check if element has active bindings
   * @param elementId - Element ID to check
   */
  hasActiveBindings(elementId: ElementId): boolean {
    return this.activeBindings.has(elementId);
  }
}

/**
 * Composition State Manager for IME support
 */
export class CompositionStateManager {
  private composingElements: Set<ElementId> = new Set();

  /**
   * Mark element as composing
   * @param elementId - Element ID
   */
  startComposition(elementId: ElementId): void {
    this.composingElements.add(elementId);
    console.debug('[CompositionState] Started composition for', elementId);
  }

  /**
   * Mark element as no longer composing
   * @param elementId - Element ID
   */
  endComposition(elementId: ElementId): void {
    this.composingElements.delete(elementId);
    console.debug('[CompositionState] Ended composition for', elementId);
  }

  /**
   * Check if element is currently composing
   * @param elementId - Element ID
   */
  isComposing(elementId: ElementId): boolean {
    return this.composingElements.has(elementId);
  }

  /**
   * Clear all composition states
   */
  clearAll(): void {
    this.composingElements.clear();
  }

  /**
   * Get composing element count
   */
  getComposingCount(): number {
    return this.composingElements.size;
  }
}

/**
 * Keyboard Event Utilities
 */
export class KeyboardEventUtils {
  /**
   * Check if key combination matches escape
   * @param event - Keyboard event
   */
  static isEscape(event: KeyboardEvent): boolean {
    return event.key === 'Escape' || event.keyCode === 27;
  }

  /**
   * Check if key combination matches enter
   * @param event - Keyboard event
   */
  static isEnter(event: KeyboardEvent): boolean {
    return event.key === 'Enter' || event.keyCode === 13;
  }

  /**
   * Check if key combination matches tab
   * @param event - Keyboard event
   */
  static isTab(event: KeyboardEvent): boolean {
    return event.key === 'Tab' || event.keyCode === 9;
  }

  /**
   * Check if event includes modifier keys
   * @param event - Keyboard event
   */
  static hasModifiers(event: KeyboardEvent): boolean {
    return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
  }

  /**
   * Get modifier key combination string
   * @param event - Keyboard event
   */
  static getModifierString(event: KeyboardEvent): string {
    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.metaKey) modifiers.push('Meta');
    if (event.altKey) modifiers.push('Alt');  
    if (event.shiftKey) modifiers.push('Shift');
    return modifiers.join('+');
  }

  /**
   * Check for commit combination (Enter or Shift+Enter)
   * @param event - Keyboard event
   */
  static isCommitCombination(event: KeyboardEvent): boolean {
    return this.isEnter(event) && (event.shiftKey || !event.shiftKey);
  }

  /**
   * Check for cancel combination (Escape)
   * @param event - Keyboard event
   */
  static isCancelCombination(event: KeyboardEvent): boolean {
    return this.isEscape(event);
  }
}

/**
 * Timer Management Utilities
 */
export class TimerManager {
  private timers: Map<string, number[]> = new Map();

  /**
   * Add timer for an element
   * @param elementId - Element ID
   * @param timerId - Timer ID
   */
  addTimer(elementId: ElementId, timerId: number): void {
    const existing = this.timers.get(elementId) || [];
    existing.push(timerId);
    this.timers.set(elementId, existing);
  }

  /**
   * Clear all timers for an element
   * @param elementId - Element ID
   */
  clearTimers(elementId: ElementId): void {
    const timers = this.timers.get(elementId) || [];
    timers.forEach(timerId => {
      try {
        clearTimeout(timerId);
      } catch (e) {
        console.warn('Failed to clear timer:', e);
      }
    });
    this.timers.delete(elementId);
  }

  /**
   * Clear all timers
   */
  clearAllTimers(): void {
    for (const elementId of this.timers.keys()) {
      this.clearTimers(elementId);
    }
  }

  /**
   * Get timer count for element
   * @param elementId - Element ID
   */
  getTimerCount(elementId: ElementId): number {
    return this.timers.get(elementId)?.length || 0;
  }

  /**
   * Get total timer count
   */
  getTotalTimerCount(): number {
    let total = 0;
    for (const timers of this.timers.values()) {
      total += timers.length;
    }
    return total;
  }
}