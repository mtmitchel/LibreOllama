import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TextEditorEventManager,
  CompositionStateManager,
  KeyboardEventUtils,
  TimerManager,
  type TextEditingEventConfig
} from '../renderer/events/EventManager';

// Mock Konva Stage
const mockStage = {
  container: vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })),
  on: vi.fn(),
  off: vi.fn()
} as any;

describe('Event Management System', () => {
  describe('TextEditorEventManager', () => {
    let eventManager: TextEditorEventManager;
    let textElement: HTMLTextAreaElement;
    let wrapperElement: HTMLDivElement;

    beforeEach(() => {
      eventManager = new TextEditorEventManager();
      textElement = document.createElement('textarea');
      wrapperElement = document.createElement('div');
      document.body.appendChild(wrapperElement);
      wrapperElement.appendChild(textElement);
    });

    afterEach(() => {
      eventManager.cleanupAll();
      document.body.removeChild(wrapperElement);
    });

    it('binds keyboard events', () => {
      const onKeyDown = vi.fn();
      const config: TextEditingEventConfig = { onKeyDown };

      const binding = eventManager.bindTextEditingEvents(
        'test-element',
        textElement,
        wrapperElement,
        mockStage,
        config
      );

      expect(binding.handlers.keydown).toBe(onKeyDown);
      expect(eventManager.hasActiveBindings('test-element')).toBe(true);
      expect(eventManager.getActiveBindingCount()).toBe(1);

      // Simulate keydown event
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      textElement.dispatchEvent(keyEvent);

      expect(onKeyDown).toHaveBeenCalledWith(keyEvent);
    });

    it('binds input events', () => {
      const onInput = vi.fn();
      const config: TextEditingEventConfig = { onInput };

      eventManager.bindTextEditingEvents(
        'test-element',
        textElement,
        wrapperElement,
        mockStage,
        config
      );

      // Simulate input event
      const inputEvent = new InputEvent('input');
      textElement.dispatchEvent(inputEvent);

      expect(onInput).toHaveBeenCalledWith(inputEvent);
    });

    it('binds composition events', () => {
      const onCompositionStart = vi.fn();
      const onCompositionEnd = vi.fn();
      const config: TextEditingEventConfig = { 
        onCompositionStart, 
        onCompositionEnd 
      };

      const binding = eventManager.bindTextEditingEvents(
        'test-element',
        textElement,
        wrapperElement,
        mockStage,
        config
      );

      expect(binding.handlers.compositionStart).toBe(onCompositionStart);
      expect(binding.handlers.compositionEnd).toBe(onCompositionEnd);

      // Simulate composition events
      const startEvent = new CompositionEvent('compositionstart');
      const endEvent = new CompositionEvent('compositionend');
      
      textElement.dispatchEvent(startEvent);
      textElement.dispatchEvent(endEvent);

      expect(onCompositionStart).toHaveBeenCalled();
      expect(onCompositionEnd).toHaveBeenCalled();
    });

    it('binds stage transform events', () => {
      const onStageTransform = vi.fn();
      const onWheel = vi.fn();
      const config: TextEditingEventConfig = { 
        onStageTransform,
        onWheel 
      };

      eventManager.bindTextEditingEvents(
        'test-element',
        textElement,
        wrapperElement,
        mockStage,
        config
      );

      expect(mockStage.on).toHaveBeenCalledWith('dragmove.editor', expect.any(Function));
      // The container() method returns a mock object, so we need to verify the method was called
      expect(mockStage.container).toHaveBeenCalled();
    });

    it('binds document mouse events', () => {
      const onDocumentMouseDown = vi.fn();
      const config: TextEditingEventConfig = { onDocumentMouseDown };

      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      
      eventManager.bindTextEditingEvents(
        'test-element',
        textElement,
        wrapperElement,
        mockStage,
        config
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        onDocumentMouseDown,
        true
      );

      addEventListenerSpy.mockRestore();
    });

    it('cleans up individual element events', () => {
      const onKeyDown = vi.fn();
      const config: TextEditingEventConfig = { onKeyDown };

      eventManager.bindTextEditingEvents(
        'test-element',
        textElement,
        wrapperElement,
        mockStage,
        config
      );

      expect(eventManager.hasActiveBindings('test-element')).toBe(true);

      eventManager.cleanupElement('test-element');

      expect(eventManager.hasActiveBindings('test-element')).toBe(false);
      expect(eventManager.getActiveBindingCount()).toBe(0);
    });

    it('cleans up all events', () => {
      const config: TextEditingEventConfig = { 
        onKeyDown: vi.fn(),
        onInput: vi.fn() 
      };

      eventManager.bindTextEditingEvents(
        'element-1',
        textElement,
        wrapperElement,
        mockStage,
        config
      );

      eventManager.bindTextEditingEvents(
        'element-2', 
        textElement,
        wrapperElement,
        mockStage,
        config
      );

      expect(eventManager.getActiveBindingCount()).toBe(2);

      eventManager.cleanupAll();

      expect(eventManager.getActiveBindingCount()).toBe(0);
      expect(eventManager.hasActiveBindings('element-1')).toBe(false);
      expect(eventManager.hasActiveBindings('element-2')).toBe(false);
    });
  });

  describe('CompositionStateManager', () => {
    let compositionManager: CompositionStateManager;

    beforeEach(() => {
      compositionManager = new CompositionStateManager();
    });

    afterEach(() => {
      compositionManager.clearAll();
    });

    it('manages composition state', () => {
      expect(compositionManager.isComposing('test-element')).toBe(false);
      expect(compositionManager.getComposingCount()).toBe(0);

      compositionManager.startComposition('test-element');

      expect(compositionManager.isComposing('test-element')).toBe(true);
      expect(compositionManager.getComposingCount()).toBe(1);

      compositionManager.endComposition('test-element');

      expect(compositionManager.isComposing('test-element')).toBe(false);
      expect(compositionManager.getComposingCount()).toBe(0);
    });

    it('handles multiple compositions', () => {
      compositionManager.startComposition('element-1');
      compositionManager.startComposition('element-2');

      expect(compositionManager.getComposingCount()).toBe(2);
      expect(compositionManager.isComposing('element-1')).toBe(true);
      expect(compositionManager.isComposing('element-2')).toBe(true);

      compositionManager.clearAll();

      expect(compositionManager.getComposingCount()).toBe(0);
      expect(compositionManager.isComposing('element-1')).toBe(false);
      expect(compositionManager.isComposing('element-2')).toBe(false);
    });
  });

  describe('KeyboardEventUtils', () => {
    it('identifies escape key', () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const legacyEscapeEvent = new KeyboardEvent('keydown', { keyCode: 27 });
      const otherEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      expect(KeyboardEventUtils.isEscape(escapeEvent)).toBe(true);
      expect(KeyboardEventUtils.isEscape(legacyEscapeEvent)).toBe(true);
      expect(KeyboardEventUtils.isEscape(otherEvent)).toBe(false);
    });

    it('identifies enter key', () => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const legacyEnterEvent = new KeyboardEvent('keydown', { keyCode: 13 });
      const otherEvent = new KeyboardEvent('keydown', { key: 'Tab' });

      expect(KeyboardEventUtils.isEnter(enterEvent)).toBe(true);
      expect(KeyboardEventUtils.isEnter(legacyEnterEvent)).toBe(true);
      expect(KeyboardEventUtils.isEnter(otherEvent)).toBe(false);
    });

    it('identifies tab key', () => {
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      const legacyTabEvent = new KeyboardEvent('keydown', { keyCode: 9 });
      const otherEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      expect(KeyboardEventUtils.isTab(tabEvent)).toBe(true);
      expect(KeyboardEventUtils.isTab(legacyTabEvent)).toBe(true);
      expect(KeyboardEventUtils.isTab(otherEvent)).toBe(false);
    });

    it('detects modifier keys', () => {
      const ctrlEvent = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      const metaEvent = new KeyboardEvent('keydown', { key: 'a', metaKey: true });
      const altEvent = new KeyboardEvent('keydown', { key: 'a', altKey: true });
      const shiftEvent = new KeyboardEvent('keydown', { key: 'a', shiftKey: true });
      const plainEvent = new KeyboardEvent('keydown', { key: 'a' });

      expect(KeyboardEventUtils.hasModifiers(ctrlEvent)).toBe(true);
      expect(KeyboardEventUtils.hasModifiers(metaEvent)).toBe(true);
      expect(KeyboardEventUtils.hasModifiers(altEvent)).toBe(true);
      expect(KeyboardEventUtils.hasModifiers(shiftEvent)).toBe(true);
      expect(KeyboardEventUtils.hasModifiers(plainEvent)).toBe(false);
    });

    it('builds modifier string', () => {
      const multiModifierEvent = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        shiftKey: true
      });

      const singleModifierEvent = new KeyboardEvent('keydown', {
        key: 'a',
        altKey: true
      });

      const noModifierEvent = new KeyboardEvent('keydown', { key: 'a' });

      expect(KeyboardEventUtils.getModifierString(multiModifierEvent)).toBe('Ctrl+Shift');
      expect(KeyboardEventUtils.getModifierString(singleModifierEvent)).toBe('Alt');
      expect(KeyboardEventUtils.getModifierString(noModifierEvent)).toBe('');
    });

    it('identifies commit combinations', () => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const shiftEnterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      const otherEvent = new KeyboardEvent('keydown', { key: 'Tab' });

      expect(KeyboardEventUtils.isCommitCombination(enterEvent)).toBe(true);
      expect(KeyboardEventUtils.isCommitCombination(shiftEnterEvent)).toBe(true);
      expect(KeyboardEventUtils.isCommitCombination(otherEvent)).toBe(false);
    });

    it('identifies cancel combinations', () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const otherEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      expect(KeyboardEventUtils.isCancelCombination(escapeEvent)).toBe(true);
      expect(KeyboardEventUtils.isCancelCombination(otherEvent)).toBe(false);
    });
  });

  describe('TimerManager', () => {
    let timerManager: TimerManager;

    beforeEach(() => {
      timerManager = new TimerManager();
      vi.useFakeTimers();
    });

    afterEach(() => {
      timerManager.clearAllTimers();
      vi.useRealTimers();
    });

    it('manages timers for elements', () => {
      const timerId = setTimeout(() => {}, 1000);
      
      timerManager.addTimer('test-element', timerId);

      expect(timerManager.getTimerCount('test-element')).toBe(1);
      expect(timerManager.getTotalTimerCount()).toBe(1);

      timerManager.clearTimers('test-element');

      expect(timerManager.getTimerCount('test-element')).toBe(0);
      expect(timerManager.getTotalTimerCount()).toBe(0);
    });

    it('manages multiple timers', () => {
      const timer1 = setTimeout(() => {}, 1000);
      const timer2 = setTimeout(() => {}, 2000);
      const timer3 = setTimeout(() => {}, 3000);

      timerManager.addTimer('element-1', timer1);
      timerManager.addTimer('element-1', timer2);
      timerManager.addTimer('element-2', timer3);

      expect(timerManager.getTimerCount('element-1')).toBe(2);
      expect(timerManager.getTimerCount('element-2')).toBe(1);
      expect(timerManager.getTotalTimerCount()).toBe(3);

      timerManager.clearAllTimers();

      expect(timerManager.getTotalTimerCount()).toBe(0);
    });
  });
});