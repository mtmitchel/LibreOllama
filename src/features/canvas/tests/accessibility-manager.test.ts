/**
 * Tests for AccessibilityManager
 * Comprehensive test coverage for keyboard navigation, focus management, and ARIA support
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Konva from 'konva';
import { AccessibilityManager, type AccessibilityConfig, type AccessibilityStoreAdapter } from '../renderer/accessibility/AccessibilityManager';
import type { ElementId } from '../types/enhanced.types';

describe('AccessibilityManager', () => {
  let stage: Konva.Stage;
  let nodeMap: Map<string, Konva.Node>;
  let storeAdapter: AccessibilityStoreAdapter;
  let config: AccessibilityConfig;
  let container: HTMLDivElement;
  let scheduleDraw: ReturnType<typeof vi.fn>;
  let onTextEditorOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup DOM container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Create Konva stage
    stage = new Konva.Stage({
      container,
      width: 800,
      height: 600
    });

    // Setup node map with test nodes
    nodeMap = new Map();
    
    // Create test nodes
    const layer = new Konva.Layer();
    stage.add(layer);

    // Create test elements
    const rect1 = new Konva.Rect({ id: 'rect1', x: 100, y: 100, width: 100, height: 50 });
    const rect2 = new Konva.Rect({ id: 'rect2', x: 300, y: 200, width: 100, height: 50 });
    const circle1 = new Konva.Circle({ id: 'circle1', x: 500, y: 300, radius: 30 });

    const group1 = new Konva.Group();
    const group2 = new Konva.Group();
    const group3 = new Konva.Group();

    group1.add(rect1);
    group2.add(rect2);
    group3.add(circle1);

    layer.add(group1);
    layer.add(group2);
    layer.add(group3);

    nodeMap.set('rect1', rect1);
    nodeMap.set('rect2', rect2);
    nodeMap.set('circle1', circle1);

    // Setup mock store adapter
    storeAdapter = {
      getElements: vi.fn().mockReturnValue([
        ['rect1' as ElementId, { id: 'rect1', type: 'rectangle' }],
        ['rect2' as ElementId, { id: 'rect2', type: 'rectangle' }],
        ['circle1' as ElementId, { id: 'circle1', type: 'circle' }]
      ]),
      getSelectedElementIds: vi.fn().mockReturnValue(new Set<ElementId>())
    };

    // Setup mock callbacks
    scheduleDraw = vi.fn();
    onTextEditorOpen = vi.fn();

    // Create config
    config = {
      stage,
      nodeMap,
      storeAdapter,
      scheduleDraw,
      onTextEditorOpen,
      debug: { log: false }
    };
  });

  afterEach(() => {
    // Cleanup
    stage.destroy();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize accessibility manager with default config', () => {
      const manager = new AccessibilityManager(config);
      
      expect(manager).toBeDefined();
      expect(manager.getFocusedElementId()).toBeNull();
    });

    it('should setup stage container accessibility attributes', () => {
      new AccessibilityManager(config);
      
      expect(container.getAttribute('tabindex')).toBe('0');
      expect(container.getAttribute('role')).toBe('application');
      expect(container.getAttribute('aria-label')).toBe('Editable shapes canvas');
    });

    it('should handle missing stage container gracefully', () => {
      // Create mock stage that simulates missing container
      const mockStage = {
        container: vi.fn().mockReturnValue(null),
        width: vi.fn().mockReturnValue(800),
        height: vi.fn().mockReturnValue(600)
      } as any;

      const configWithoutContainer = { ...config, stage: mockStage };
      
      expect(() => new AccessibilityManager(configWithoutContainer)).not.toThrow();
    });

    it('should initialize with debug logging enabled', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugConfig = { ...config, debug: { log: true } };
      
      new AccessibilityManager(debugConfig);
      
      expect(consoleSpy).toHaveBeenCalledWith('[AccessibilityManager] Initialized accessibility system');
      consoleSpy.mockRestore();
    });
  });

  describe('Focus Management', () => {
    let manager: AccessibilityManager;

    beforeEach(() => {
      manager = new AccessibilityManager(config);
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should set focused element correctly', () => {
      manager.setFocusedElement('rect1' as ElementId);
      
      expect(manager.getFocusedElementId()).toBe('rect1');
      expect(scheduleDraw).toHaveBeenCalledWith('main');
    });

    it('should clear focus state', () => {
      manager.setFocusedElement('rect1' as ElementId);
      manager.clearFocus();
      
      expect(manager.getFocusedElementId()).toBeNull();
      expect(scheduleDraw).toHaveBeenCalledWith('main');
    });

    it('should check if element is focused', () => {
      manager.setFocusedElement('rect1' as ElementId);
      
      expect(manager.isElementFocused('rect1' as ElementId)).toBe(true);
      expect(manager.isElementFocused('rect2' as ElementId)).toBe(false);
    });

    it('should handle setting focus on non-existent element', () => {
      expect(() => manager.setFocusedElement('nonexistent' as ElementId)).not.toThrow();
      expect(manager.getFocusedElementId()).toBe('nonexistent');
    });

    it('should create focus ring on focused element', () => {
      manager.setFocusedElement('rect1' as ElementId);
      
      const rect = nodeMap.get('rect1') as Konva.Rect;
      const group = rect.parent as Konva.Group;
      const focusRing = group.findOne('.focus-ring');
      
      expect(focusRing).toBeDefined();
      expect(focusRing?.name()).toBe('focus-ring');
    });

    it('should clear previous focus ring when setting new focus', () => {
      // Set initial focus
      manager.setFocusedElement('rect1' as ElementId);
      const rect1 = nodeMap.get('rect1') as Konva.Rect;
      const group1 = rect1.parent as Konva.Group;
      const focusRing1 = group1.findOne('.focus-ring');
      expect(focusRing1).toBeDefined();

      // Set new focus
      manager.setFocusedElement('rect2' as ElementId);
      
      // Previous focus ring should be removed
      const prevFocusRing = group1.findOne('.focus-ring');
      expect(prevFocusRing).toBeUndefined();

      // New focus ring should exist
      const rect2 = nodeMap.get('rect2') as Konva.Rect;
      const group2 = rect2.parent as Konva.Group;
      const focusRing2 = group2.findOne('.focus-ring');
      expect(focusRing2).toBeDefined();
    });
  });

  describe('Keyboard Navigation', () => {
    let manager: AccessibilityManager;

    beforeEach(() => {
      manager = new AccessibilityManager(config);
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should navigate to next element with ArrowRight', () => {
      manager.setFocusedElement('rect1' as ElementId);
      
      // Simulate ArrowRight key press
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      container.dispatchEvent(event);
      
      expect(manager.getFocusedElementId()).toBe('rect2');
    });

    it('should navigate to next element with ArrowDown', () => {
      manager.setFocusedElement('rect1' as ElementId);
      
      // Simulate ArrowDown key press
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      container.dispatchEvent(event);
      
      expect(manager.getFocusedElementId()).toBe('rect2');
    });

    it('should navigate to previous element with ArrowLeft', () => {
      manager.setFocusedElement('rect2' as ElementId);
      
      // Simulate ArrowLeft key press
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      container.dispatchEvent(event);
      
      expect(manager.getFocusedElementId()).toBe('rect1');
    });

    it('should navigate to previous element with ArrowUp', () => {
      manager.setFocusedElement('rect2' as ElementId);
      
      // Simulate ArrowUp key press
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      container.dispatchEvent(event);
      
      expect(manager.getFocusedElementId()).toBe('rect1');
    });

    it('should wrap around when navigating forward from last element', () => {
      manager.setFocusedElement('circle1' as ElementId); // Last element
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      container.dispatchEvent(event);
      
      expect(manager.getFocusedElementId()).toBe('rect1'); // First element
    });

    it('should wrap around when navigating backward from first element', () => {
      manager.setFocusedElement('rect1' as ElementId); // First element
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      container.dispatchEvent(event);
      
      expect(manager.getFocusedElementId()).toBe('circle1'); // Last element
    });

    it('should open text editor on Enter key', () => {
      manager.setFocusedElement('rect1' as ElementId);
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      container.dispatchEvent(event);
      
      expect(onTextEditorOpen).toHaveBeenCalledWith('rect1', nodeMap.get('rect1'));
    });

    it('should clear focus on Escape key', () => {
      manager.setFocusedElement('rect1' as ElementId);
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      container.dispatchEvent(event);
      
      expect(manager.getFocusedElementId()).toBeNull();
    });

    it('should not respond to keyboard events when no element is focused', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      container.dispatchEvent(event);
      
      expect(manager.getFocusedElementId()).toBeNull();
    });

    it('should handle keyboard navigation with empty elements list', () => {
      storeAdapter.getElements = vi.fn().mockReturnValue([]);
      manager.setFocusedElement('rect1' as ElementId);
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      container.dispatchEvent(event);
      
      // Should remain focused on same element when no elements available
      expect(manager.getFocusedElementId()).toBe('rect1');
    });
  });

  describe('Text Editor Accessibility', () => {
    let manager: AccessibilityManager;

    beforeEach(() => {
      manager = new AccessibilityManager(config);
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should setup ARIA attributes for text editor', () => {
      const textarea = document.createElement('textarea');
      
      manager.setupTextEditorAccessibility(textarea, true);
      
      expect(textarea.getAttribute('role')).toBe('textbox');
      expect(textarea.getAttribute('aria-multiline')).toBe('true');
      expect(textarea.getAttribute('tabindex')).toBe('0');
      expect(textarea.getAttribute('autofocus')).toBe('true');
    });

    it('should setup ARIA attributes for single-line text editor', () => {
      const input = document.createElement('input');
      
      manager.setupTextEditorAccessibility(input, false);
      
      expect(input.getAttribute('role')).toBe('textbox');
      expect(input.getAttribute('aria-multiline')).toBe('false');
    });

    it('should preserve existing tabindex when setting up accessibility', () => {
      const element = document.createElement('div');
      element.setAttribute('tabindex', '5');
      
      manager.setupTextEditorAccessibility(element);
      
      expect(element.getAttribute('tabindex')).toBe('5');
    });

    it('should focus text editor with retry mechanism', async () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      
      const focusSpy = vi.spyOn(textarea, 'focus');
      
      await manager.focusTextEditor(textarea);
      
      // Should call focus immediately
      expect(focusSpy).toHaveBeenCalled();
      
      // Should schedule retry timers
      expect((textarea as any).__focusTimers).toBeDefined();
      expect((textarea as any).__focusTimers.length).toBe(3);
      
      document.body.removeChild(textarea);
    });

    it('should cleanup focus timers', () => {
      const textarea = document.createElement('textarea');
      const mockTimers = [
        setTimeout(() => {}, 100),
        setTimeout(() => {}, 200),
        setTimeout(() => {}, 300)
      ];
      (textarea as any).__focusTimers = mockTimers;
      
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      manager.cleanupTextEditorFocus(textarea);
      
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(3);
      expect((textarea as any).__focusTimers).toBeUndefined();
    });

    it('should handle focus errors gracefully', async () => {
      const element = document.createElement('div');
      element.focus = vi.fn().mockImplementation(() => {
        throw new Error('Focus failed');
      });
      
      await expect(manager.focusTextEditor(element)).resolves.not.toThrow();
    });
  });

  describe('Focus Ring Animation', () => {
    let manager: AccessibilityManager;

    beforeEach(() => {
      manager = new AccessibilityManager(config);
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should create animated focus ring', () => {
      manager.setFocusedElement('rect1' as ElementId);
      
      const rect = nodeMap.get('rect1') as Konva.Rect;
      const group = rect.parent as Konva.Group;
      const focusRing = group.findOne('.focus-ring') as Konva.Circle;
      
      expect(focusRing).toBeDefined();
      expect(focusRing.stroke()).toBe('#007AFF');
      expect(focusRing.dash()).toEqual([5, 5]);
      expect((focusRing as any).focusAnimation).toBeDefined();
    });

    it('should stop animation when clearing focus', () => {
      manager.setFocusedElement('rect1' as ElementId);
      
      const rect = nodeMap.get('rect1') as Konva.Rect;
      const group = rect.parent as Konva.Group;
      const focusRing = group.findOne('.focus-ring') as Konva.Circle;
      const animation = (focusRing as any).focusAnimation;
      const stopSpy = vi.spyOn(animation, 'stop');
      
      manager.clearFocus();
      
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should calculate focus ring radius based on node size', () => {
      manager.setFocusedElement('rect1' as ElementId);
      
      const rect = nodeMap.get('rect1') as Konva.Rect;
      const group = rect.parent as Konva.Group;
      const focusRing = group.findOne('.focus-ring') as Konva.Circle;
      
      // Should be calculated based on max(width, height) / 2 + default radius (8)
      const expectedRadius = Math.max(100, 50) / 2 + 8; // 58
      expect(focusRing.radius()).toBe(expectedRadius);
    });
  });

  describe('Style Updates', () => {
    let manager: AccessibilityManager;

    beforeEach(() => {
      manager = new AccessibilityManager(config);
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should update focus ring styles', () => {
      const newStyles = {
        stroke: '#FF0000',
        strokeWidth: 3,
        animationSpeed: 100
      };
      
      manager.updateStyles(newStyles);
      manager.setFocusedElement('rect1' as ElementId);
      
      const rect = nodeMap.get('rect1') as Konva.Rect;
      const group = rect.parent as Konva.Group;
      const focusRing = group.findOne('.focus-ring') as Konva.Circle;
      
      expect(focusRing.stroke()).toBe('#FF0000');
      expect(focusRing.strokeWidth()).toBe(3);
    });
  });

  describe('Error Handling', () => {
    let manager: AccessibilityManager;

    beforeEach(() => {
      manager = new AccessibilityManager(config);
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should handle store adapter errors gracefully', () => {
      storeAdapter.getElements = vi.fn().mockImplementation(() => {
        throw new Error('Store error');
      });
      
      manager.setFocusedElement('rect1' as ElementId);
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      expect(() => container.dispatchEvent(event)).not.toThrow();
    });

    it('should handle missing nodes gracefully', () => {
      expect(() => manager.setFocusedElement('nonexistent' as ElementId)).not.toThrow();
    });

    it('should handle node without parent gracefully', () => {
      const orphanNode = new Konva.Rect({ x: 0, y: 0, width: 50, height: 50 });
      nodeMap.set('orphan', orphanNode);
      
      expect(() => manager.setFocusedElement('orphan' as ElementId)).not.toThrow();
    });
  });

  describe('Cleanup and Destruction', () => {
    let manager: AccessibilityManager;

    beforeEach(() => {
      manager = new AccessibilityManager(config);
    });

    it('should remove event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');
      
      manager.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should clear focus state on destroy', () => {
      manager.setFocusedElement('rect1' as ElementId);
      
      manager.destroy();
      
      expect(manager.getFocusedElementId()).toBeNull();
    });

    it('should handle destroy when container is not available', () => {
      // Create mock stage that simulates missing container
      const mockStage = {
        container: vi.fn().mockReturnValue(null),
        width: vi.fn().mockReturnValue(800),
        height: vi.fn().mockReturnValue(600)
      } as any;
      
      const configWithoutContainer = { ...config, stage: mockStage };
      const manager = new AccessibilityManager(configWithoutContainer);
      
      expect(() => manager.destroy()).not.toThrow();
    });

    it('should be safe to call destroy multiple times', () => {
      expect(() => {
        manager.destroy();
        manager.destroy();
      }).not.toThrow();
    });
  });

  describe('Debug Logging', () => {
    it('should log debug messages when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugConfig = { ...config, debug: { log: true } };
      
      const manager = new AccessibilityManager(debugConfig);
      manager.setFocusedElement('rect1' as ElementId);
      manager.clearFocus();
      
      expect(consoleSpy).toHaveBeenCalledWith('[AccessibilityManager] Initialized accessibility system');
      expect(consoleSpy).toHaveBeenCalledWith('[AccessibilityManager] Focus set to element: rect1');
      expect(consoleSpy).toHaveBeenCalledWith('[AccessibilityManager] Focus cleared');
      
      manager.destroy();
      consoleSpy.mockRestore();
    });
  });
});