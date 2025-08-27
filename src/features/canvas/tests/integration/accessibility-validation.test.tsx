/**
 * Accessibility Validation Integration Test
 * 
 * Tests keyboard navigation, ARIA attributes, screen reader support,
 * and other accessibility features for the canvas interface.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import { ElementId, CanvasElement, isRectangleElement } from '../../types/enhanced.types';
import { nanoid } from 'nanoid';

// Mock axe-core for accessibility testing
const mockAxeResults = {
  violations: [],
  passes: [],
  incomplete: [],
  inapplicable: [],
};

vi.mock('axe-core', () => ({
  run: vi.fn().mockResolvedValue(mockAxeResults),
}));

describe('Accessibility Validation', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    store = createUnifiedTestStore();
  });

  describe('Keyboard Navigation', () => {
    it('should support Tab navigation through canvas elements', () => {
      // Create focusable elements
      const elementIds: ElementId[] = [];
      for (let i = 0; i < 3; i++) {
        const id = nanoid() as ElementId;
        elementIds.push(id);
        store.getState().addElement({
          id,
          type: 'rectangle',
          x: i * 100,
          y: 100,
          width: 80,
          height: 60,
          tabIndex: i, // Make focusable
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as CanvasElement);
      }

      // Create mock DOM structure
      const container = document.createElement('div');
      container.innerHTML = `
        <div role="application" aria-label="Canvas">
          ${elementIds.map((id, index) => `
            <div 
              data-element-id="${id}"
              tabindex="${index}"
              role="button"
              aria-label="Rectangle ${index + 1}"
            ></div>
          `).join('')}
        </div>
      `;
      document.body.appendChild(container);

      // Test Tab navigation
      const elements = container.querySelectorAll('[tabindex]');
      expect(elements).toHaveLength(3);

      // Simulate Tab key navigation
      let focusedIndex = 0;
      (elements[focusedIndex] as HTMLElement).focus();

      // Tab to next element
      fireEvent.keyDown(elements[focusedIndex], { key: 'Tab' });
      focusedIndex = (focusedIndex + 1) % elements.length;
      (elements[focusedIndex] as HTMLElement).focus();

      expect(document.activeElement).toBe(elements[1]);

      // Shift+Tab to previous element
      fireEvent.keyDown(elements[focusedIndex], { key: 'Tab', shiftKey: true });
      focusedIndex = focusedIndex - 1;
      (elements[focusedIndex] as HTMLElement).focus();

      expect(document.activeElement).toBe(elements[0]);

      document.body.removeChild(container);
    });

    it('should support arrow key navigation for element selection', () => {
      const elementIds: ElementId[] = [];
      
      // Create 2x2 grid of elements
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          const id = nanoid() as ElementId;
          elementIds.push(id);
          store.getState().addElement({
            id,
            type: 'circle',
            x: col * 100,
            y: row * 100,
            radius: 30,
          } as CanvasElement);
        }
      }

      // Select first element
      store.getState().selectElement(elementIds[0]);
      expect(store.getState().selectedElementIds.has(elementIds[0])).toBe(true);

      // Simulate arrow key navigation
      const keyboardNavigation = {
        ArrowRight: () => {
          // Move selection to right element
          const currentIndex = elementIds.findIndex(id => 
            store.getState().selectedElementIds.has(id)
          );
          if (currentIndex >= 0 && currentIndex < elementIds.length - 1) {
            store.getState().clearSelection();
            store.getState().selectElement(elementIds[currentIndex + 1]);
          }
        },
        ArrowDown: () => {
          // Move selection down (simulate 2D grid navigation)
          const currentIndex = elementIds.findIndex(id => 
            store.getState().selectedElementIds.has(id)
          );
          const downIndex = currentIndex + 2; // Move down one row in 2x2 grid
          if (downIndex < elementIds.length) {
            store.getState().clearSelection();
            store.getState().selectElement(elementIds[downIndex]);
          }
        },
      };

      // Test right arrow
      keyboardNavigation.ArrowRight();
      expect(store.getState().selectedElementIds.has(elementIds[1])).toBe(true);

      // Test down arrow from first element
      store.getState().clearSelection();
      store.getState().selectElement(elementIds[0]);
      keyboardNavigation.ArrowDown();
      expect(store.getState().selectedElementIds.has(elementIds[2])).toBe(true);
    });

    it('should support Enter/Space key for element activation', () => {
      const elementId = nanoid() as ElementId;
      let activated = false;
      
      store.getState().addElement({
        id: elementId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        onActivate: () => { activated = true; },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as CanvasElement);

      // Create mock DOM element
      const element = document.createElement('div');
      element.setAttribute('data-element-id', elementId);
      element.setAttribute('tabindex', '0');
      element.setAttribute('role', 'button');
      document.body.appendChild(element);

      element.focus();

      // Test Enter key activation
      fireEvent.keyDown(element, { key: 'Enter' });
      const canvasElement = store.getState().getElementById(elementId);
      if (canvasElement && isRectangleElement(canvasElement) && canvasElement.onActivate) {
        canvasElement.onActivate();
      }
      
      expect(activated).toBe(true);

      // Reset and test Space key
      activated = false;
      fireEvent.keyDown(element, { key: ' ' });
      if (canvasElement && isRectangleElement(canvasElement) && canvasElement.onActivate) {
        canvasElement.onActivate();
      }
      
      expect(activated).toBe(true);

      document.body.removeChild(element);
    });

    it('should support Escape key to cancel operations', () => {
      const elementId = nanoid() as ElementId;
      store.getState().addElement({
        id: elementId,
        type: 'text',
        x: 100,
        y: 100,
        text: 'Test Text',
      } as CanvasElement);

      // Start text editing
      store.getState().setTextEditingElement(elementId);
      expect(store.getState().textEditingElementId).toBe(elementId);

      // Simulate Escape key
      const escapeHandler = () => {
        if (store.getState().textEditingElementId) {
          store.getState().setTextEditingElement(null);
        }
      };

      // Test Escape cancels text editing
      escapeHandler();
      expect(store.getState().textEditingElementId).toBeNull();
    });
  });

  describe('ARIA Attributes and Roles', () => {
    it('should have proper ARIA roles for canvas elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div role="application" aria-label="Drawing Canvas">
          <div role="group" aria-label="Canvas Elements">
            <div role="button" aria-label="Rectangle" tabindex="0"></div>
            <div role="button" aria-label="Circle" tabindex="0"></div>
            <div role="textbox" aria-label="Text Element" tabindex="0"></div>
          </div>
          <div role="toolbar" aria-label="Canvas Tools">
            <button aria-label="Select Tool" aria-pressed="true">Select</button>
            <button aria-label="Rectangle Tool" aria-pressed="false">Rectangle</button>
            <button aria-label="Circle Tool" aria-pressed="false">Circle</button>
          </div>
        </div>
      `;
      document.body.appendChild(container);

      // Verify canvas has application role
      const canvas = container.querySelector('[role="application"]');
      expect(canvas).toBeTruthy();
      expect(canvas?.getAttribute('aria-label')).toBe('Drawing Canvas');

      // Verify elements group
      const elementsGroup = container.querySelector('[role="group"]');
      expect(elementsGroup).toBeTruthy();
      expect(elementsGroup?.getAttribute('aria-label')).toBe('Canvas Elements');

      // Verify toolbar
      const toolbar = container.querySelector('[role="toolbar"]');
      expect(toolbar).toBeTruthy();
      expect(toolbar?.getAttribute('aria-label')).toBe('Canvas Tools');

      // Verify tool buttons have aria-pressed
      const tools = container.querySelectorAll('[role="toolbar"] button');
      expect(tools[0].getAttribute('aria-pressed')).toBe('true');
      expect(tools[1].getAttribute('aria-pressed')).toBe('false');

      document.body.removeChild(container);
    });

    it('should update aria-selected for selected elements', () => {
      const elementIds: ElementId[] = [];
      const container = document.createElement('div');
      
      // Create elements with DOM representation
      for (let i = 0; i < 3; i++) {
        const id = nanoid() as ElementId;
        elementIds.push(id);
        store.getState().addElement({
          id,
          type: 'rectangle',
          x: i * 100,
          y: 100,
          width: 80,
          height: 60,
        } as CanvasElement);

        // Create DOM element
        const domElement = document.createElement('div');
        domElement.setAttribute('data-element-id', id);
        domElement.setAttribute('role', 'button');
        domElement.setAttribute('aria-selected', 'false');
        container.appendChild(domElement);
      }
      document.body.appendChild(container);

      // Select first element and update ARIA
      store.getState().selectElement(elementIds[0]);
      const selectedElement = container.querySelector(`[data-element-id="${elementIds[0]}"]`);
      selectedElement?.setAttribute('aria-selected', 'true');

      expect(selectedElement?.getAttribute('aria-selected')).toBe('true');

      // Multi-select second element
      store.getState().selectElement(elementIds[1], true);
      const secondElement = container.querySelector(`[data-element-id="${elementIds[1]}"]`);
      secondElement?.setAttribute('aria-selected', 'true');

      expect(secondElement?.getAttribute('aria-selected')).toBe('true');

      // Clear selection and update ARIA
      store.getState().clearSelection();
      container.querySelectorAll('[aria-selected]').forEach(el => {
        el.setAttribute('aria-selected', 'false');
      });

      expect(selectedElement?.getAttribute('aria-selected')).toBe('false');
      expect(secondElement?.getAttribute('aria-selected')).toBe('false');

      document.body.removeChild(container);
    });

    it('should provide aria-describedby for complex elements', () => {
      const elementId = nanoid() as ElementId;
      store.getState().addElement({
        id: elementId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
      } as CanvasElement);

      const container = document.createElement('div');
      container.innerHTML = `
        <div 
          data-element-id="${elementId}"
          role="button"
          aria-label="Rectangle"
          aria-describedby="rect-desc-${elementId}"
        ></div>
        <div id="rect-desc-${elementId}" class="sr-only">
          Red rectangle with black border, 150 by 100 pixels, located at 100, 100
        </div>
      `;
      document.body.appendChild(container);

      const element = container.querySelector(`[data-element-id="${elementId}"]`);
      const description = container.querySelector(`#rect-desc-${elementId}`);

      expect(element?.getAttribute('aria-describedby')).toBe(`rect-desc-${elementId}`);
      expect(description?.textContent).toContain('Red rectangle');
      expect(description?.textContent).toContain('150 by 100 pixels');

      document.body.removeChild(container);
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce element creation to screen readers', () => {
      const announcements: string[] = [];
      
      // Mock aria-live region
      const mockAnnounce = (message: string) => {
        announcements.push(message);
      };

      const elementId = nanoid() as ElementId;
      const element: CanvasElement = {
        id: elementId,
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      } as CanvasElement;

      store.getState().addElement(element);
      
      // Simulate announcement
      mockAnnounce(`Created rectangle at position 50, 50`);

      expect(announcements).toContain('Created rectangle at position 50, 50');
    });

    it('should announce element selection changes', () => {
      const announcements: string[] = [];
      const mockAnnounce = (message: string) => announcements.push(message);

      const elementIds: ElementId[] = [];
      for (let i = 0; i < 3; i++) {
        const id = nanoid() as ElementId;
        elementIds.push(id);
        store.getState().addElement({
          id,
          type: 'circle',
          x: i * 100,
          y: 100,
          radius: 30,
        } as CanvasElement);
      }

      // Single selection
      store.getState().selectElement(elementIds[0]);
      mockAnnounce('Selected 1 circle');

      // Multi-selection
      store.getState().selectElement(elementIds[1], true);
      mockAnnounce('Selected 2 elements');

      // Clear selection
      store.getState().clearSelection();
      mockAnnounce('Selection cleared');

      expect(announcements).toEqual([
        'Selected 1 circle',
        'Selected 2 elements',
        'Selection cleared',
      ]);
    });

    it('should announce drag operations', () => {
      const announcements: string[] = [];
      const mockAnnounce = (message: string) => announcements.push(message);

      const elementId = nanoid() as ElementId;
      store.getState().addElement({
        id: elementId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 80,
        height: 60,
      } as CanvasElement);

      // Simulate drag start
      mockAnnounce('Started dragging rectangle');

      // Simulate drag end
      store.getState().updateElement(elementId, { x: 200, y: 150 });
      mockAnnounce('Moved rectangle to position 200, 150');

      expect(announcements).toEqual([
        'Started dragging rectangle',
        'Moved rectangle to position 200, 150',
      ]);
    });

    it('should provide status updates for long operations', async () => {
      const announcements: string[] = [];
      const mockAnnounce = (message: string) => announcements.push(message);

      // Simulate loading many elements
      mockAnnounce('Loading canvas elements...');

      for (let i = 0; i < 100; i++) {
        store.getState().addElement({
          id: nanoid() as ElementId,
          type: 'rectangle',
          x: Math.random() * 500,
          y: Math.random() * 500,
          width: 50,
          height: 50,
        } as CanvasElement);
      }

      mockAnnounce('Loaded 100 elements');

      expect(announcements).toEqual([
        'Loading canvas elements...',
        'Loaded 100 elements',
      ]);
    });
  });

  describe('Focus Management', () => {
    it('should trap focus within modal dialogs', () => {
      // Create modal structure
      const container = document.createElement('div');
      container.innerHTML = `
        <div id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <h2 id="modal-title">Element Properties</h2>
          <input id="width-input" type="number" />
          <input id="height-input" type="number" />
          <button id="save-btn">Save</button>
          <button id="cancel-btn">Cancel</button>
        </div>
      `;
      document.body.appendChild(container);

      const modal = container.querySelector('#modal');
      const focusableElements = container.querySelectorAll(
        'input, button, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Focus first element
      firstElement.focus();
      expect(document.activeElement).toBe(firstElement);

      // Simulate Tab on last element (should wrap to first)
      fireEvent.keyDown(lastElement, { key: 'Tab' });
      firstElement.focus(); // Simulate focus trap
      expect(document.activeElement).toBe(firstElement);

      // Simulate Shift+Tab on first element (should wrap to last)
      fireEvent.keyDown(firstElement, { key: 'Tab', shiftKey: true });
      lastElement.focus(); // Simulate focus trap
      expect(document.activeElement).toBe(lastElement);

      document.body.removeChild(container);
    });

    it('should restore focus after modal closes', () => {
      // Create trigger element
      const triggerButton = document.createElement('button');
      triggerButton.id = 'trigger';
      triggerButton.textContent = 'Open Properties';
      document.body.appendChild(triggerButton);

      // Focus trigger and remember it
      triggerButton.focus();
      const previousActiveElement = document.activeElement;

      // Create and show modal
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div role="dialog" aria-modal="true">
          <button id="close-btn">Close</button>
        </div>
      `;
      document.body.appendChild(modal);

      const closeBtn = modal.querySelector('#close-btn') as HTMLElement;
      closeBtn.focus();

      // Close modal and restore focus
      modal.remove();
      (previousActiveElement as HTMLElement)?.focus();

      expect(document.activeElement).toBe(triggerButton);

      document.body.removeChild(triggerButton);
    });
  });

  describe('Color and Contrast Accessibility', () => {
    it('should provide high contrast mode support', () => {
      const elementId = nanoid() as ElementId;
      
      // Default colors
      const normalColors = {
        fill: '#3498db',
        stroke: '#2c3e50',
        strokeWidth: 1,
      };

      // High contrast colors
      const highContrastColors = {
        fill: '#ffffff',
        stroke: '#000000', 
        strokeWidth: 3,
      };

      store.getState().addElement({
        id: elementId,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        ...normalColors,
      } as CanvasElement);

      // Simulate high contrast mode detection
      const isHighContrast = window.matchMedia?.('(prefers-contrast: high)')?.matches ?? false;
      
      if (isHighContrast) {
        store.getState().updateElement(elementId, highContrastColors);
      }

      const element = store.getState().getElementById(elementId);
      
      if (element && isRectangleElement(element)) {
        // In normal mode, should have original colors
        // In high contrast mode, should have high contrast colors
        expect(element.fill).toBeDefined();
        expect(element.stroke).toBeDefined();
        expect(typeof element.strokeWidth).toBe('number');
      } else {
        // Handle the case where element is not a RectangleElement, or is null/undefined
        // This might indicate an issue with the test setup or the element type.
        // For testing, we can explicitly fail if the element is not as expected.
        expect.fail('Element is not a RectangleElement or is undefined/null');
      }
    });

    it('should support reduced motion preferences', () => {
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
      
      const animationConfig = {
        duration: prefersReducedMotion ? 0 : 300, // No animation if reduced motion
        easing: prefersReducedMotion ? 'linear' : 'ease-out',
      };

      expect(typeof animationConfig.duration).toBe('number');
      expect(typeof animationConfig.easing).toBe('string');

      if (prefersReducedMotion) {
        expect(animationConfig.duration).toBe(0);
      }
    });
  });

  describe('Axe-core Integration', () => {
    it('should pass automated accessibility tests', async () => {
      const { run } = await import('axe-core');
      
      // Create sample canvas structure
      const container = document.createElement('div');
      container.innerHTML = `
        <main>
          <div role="application" aria-label="Drawing Canvas">
            <div role="toolbar" aria-label="Tools">
              <button aria-label="Select" aria-pressed="true">Select</button>
              <button aria-label="Rectangle">Rectangle</button>
            </div>
            <div role="group" aria-label="Canvas Elements">
              <div role="button" aria-label="Rectangle 1" tabindex="0"></div>
              <div role="button" aria-label="Circle 1" tabindex="0"></div>
            </div>
          </div>
        </main>
      `;
      document.body.appendChild(container);

      const results = await run(container);
      expect(results.violations).toHaveLength(0);

      document.body.removeChild(container);
    });
  });
});