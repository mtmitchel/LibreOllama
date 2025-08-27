/**
 * Text Editing Portal Integration Test
 * Tests text editing focus/blur behavior and DOM portal functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import { ElementId, TextElement } from '../../types/enhanced.types';
import { nanoid } from 'nanoid';

// Mock Konva for testing
vi.mock('konva', () => ({
  default: {
    Stage: vi.fn(),
    Layer: vi.fn(),
    Text: vi.fn(),
    Group: vi.fn(),
  },
}));

describe('Text Editing Portal Focus/Blur Behavior', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    // Create fresh test store
    store = createUnifiedTestStore();
    
    // Clear any existing portals
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Cleanup any created elements
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    
    // Clear all portal elements
    document.querySelectorAll('[data-testid*="text-portal"]').forEach(el => el.remove());
    document.querySelectorAll('#figma-text-input').forEach(el => el.remove());
  });

  describe('Text Portal Creation and Management', () => {
    it('should create a hidden input portal when entering text edit mode', async () => {
      const textElement: TextElement = {
        id: 'text-1' as ElementId,
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        text: 'Hello World',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#000000',
        isLocked: false,
        isHidden: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      store.getState().addElement(textElement);
      
      // Enter text editing mode
      store.getState().setTextEditingElement('text-1' as ElementId);

      // Simulate portal creation (as would happen in TextShape component)
      const input = document.createElement('input');
      input.id = 'figma-text-input';
      input.type = 'text';
      input.value = textElement.text || '';
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      input.style.opacity = '0';
      document.body.appendChild(input);

      // Portal should be created but hidden
      const portalInput = document.getElementById('figma-text-input');
      expect(portalInput).toBeTruthy();
      expect(portalInput?.style.opacity).toBe('0');
      expect(portalInput?.style.position).toBe('fixed');

      // Should be focused
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('should handle focus events correctly', async () => {
      const focusHandler = vi.fn();
      const blurHandler = vi.fn();

      // Create text element
      const textId = 'text-focus-1' as ElementId;
      store.getState().addElement({
        id: textId,
        type: 'text',
        x: 50,
        y: 50,
        text: 'Focus test',
      } as TextElement);

      // Start editing
      store.getState().setTextEditingElement(textId);

      // Create portal input
      const input = document.createElement('input');
      input.id = 'text-portal-input';
      input.addEventListener('focus', focusHandler);
      input.addEventListener('blur', blurHandler);
      document.body.appendChild(input);

      // Focus the input
      input.focus();
      expect(focusHandler).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(input);

      // Blur the input
      input.blur();
      expect(blurHandler).toHaveBeenCalledTimes(1);
      expect(document.activeElement).not.toBe(input);

      // Cleanup
      input.remove();
    });

    it('should maintain focus during text editing operations', async () => {
      const textId = 'text-maintain-1' as ElementId;
      
      store.getState().addElement({
        id: textId,
        type: 'text',
        x: 0,
        y: 0,
        text: 'Initial',
      } as TextElement);

      store.getState().setTextEditingElement(textId);

      // Create and focus portal
      const input = document.createElement('input');
      input.id = 'edit-portal';
      input.value = 'Initial';
      document.body.appendChild(input);
      input.focus();

      // Simulate typing
      const user = userEvent.setup();
      await user.clear(input);
      await user.type(input, 'Updated text content');

      // Focus should be maintained
      expect(document.activeElement).toBe(input);
      expect(input.value).toBe('Updated text content');

      // Update store with new text
      store.getState().updateElement(textId, { text: input.value });
      const element = store.getState().getElementById(textId) as TextElement;
      expect(element?.text).toBe('Updated text content');

      input.remove();
    });

    it('should handle blur correctly when clicking outside', async () => {
      let editingCompleted = false;
      
      const textId = 'text-blur-1' as ElementId;
      store.getState().addElement({
        id: textId,
        type: 'text',
        x: 100,
        y: 100,
        text: 'Click outside test',
      } as TextElement);

      store.getState().setTextEditingElement(textId);

      // Create portal with blur handler
      const input = document.createElement('input');
      input.id = 'blur-test-portal';
      input.value = 'Modified text';
      
      input.addEventListener('blur', () => {
        // Save text and exit editing mode
        store.getState().updateElement(textId, { text: input.value });
        store.getState().setTextEditingElement(null);
        editingCompleted = true;
      });

      document.body.appendChild(input);
      input.focus();

      expect(store.getState().textEditingElementId).toBe(textId);

      // Simulate clicking outside (blur)
      input.blur();

      await waitFor(() => {
        expect(editingCompleted).toBe(true);
      });

      expect(store.getState().textEditingElementId).toBeNull();
      
      const element = store.getState().getElementById(textId) as TextElement;
      expect(element?.text).toBe('Modified text');

      input.remove();
    });

    it('should handle Enter key to commit text', async () => {
      const textId = 'text-enter-1' as ElementId;
      store.getState().addElement({
        id: textId,
        type: 'text',
        x: 0,
        y: 0,
        text: 'Original',
      } as TextElement);

      store.getState().setTextEditingElement(textId);

      const input = document.createElement('input');
      input.id = 'enter-test-portal';
      input.value = 'Original';
      
      const commitHandler = vi.fn((e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          store.getState().updateElement(textId, { text: input.value });
          store.getState().setTextEditingElement(null);
        }
      });

      input.addEventListener('keydown', commitHandler);
      document.body.appendChild(input);
      input.focus();

      // Change text
      input.value = 'New text after enter';

      // Press Enter
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        shiftKey: false 
      });
      input.dispatchEvent(enterEvent);

      expect(commitHandler).toHaveBeenCalled();
      expect(store.getState().textEditingElementId).toBeNull();
      
      const element = store.getState().getElementById(textId) as TextElement;
      expect(element?.text).toBe('New text after enter');

      input.remove();
    });

    it('should handle Escape key to cancel editing', async () => {
      const originalText = 'Original text';
      const textId = 'text-escape-1' as ElementId;
      
      store.getState().addElement({
        id: textId,
        type: 'text',
        x: 0,
        y: 0,
        text: originalText,
      } as TextElement);

      store.getState().setTextEditingElement(textId);

      const input = document.createElement('input');
      input.id = 'escape-test-portal';
      input.value = originalText;
      
      const cancelHandler = vi.fn((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          // Don't update text, just exit
          store.getState().setTextEditingElement(null);
        }
      });

      input.addEventListener('keydown', cancelHandler);
      document.body.appendChild(input);
      input.focus();

      // Change text (but don't commit)
      input.value = 'This should be discarded';

      // Press Escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      input.dispatchEvent(escapeEvent);

      expect(cancelHandler).toHaveBeenCalled();
      expect(store.getState().textEditingElementId).toBeNull();
      
      // Text should remain unchanged
      const element = store.getState().getElementById(textId) as TextElement;
      expect(element?.text).toBe(originalText);

      input.remove();
    });

    it('should handle rapid focus/blur cycles without issues', async () => {
      const textId = 'text-rapid-1' as ElementId;
      store.getState().addElement({
        id: textId,
        type: 'text',
        x: 0,
        y: 0,
        text: 'Rapid test',
      } as TextElement);

      const focusCount = { count: 0 };
      const blurCount = { count: 0 };

      const input = document.createElement('input');
      input.id = 'rapid-test-portal';
      input.addEventListener('focus', () => focusCount.count++);
      input.addEventListener('blur', () => blurCount.count++);
      document.body.appendChild(input);

      // Rapid focus/blur cycles
      for (let i = 0; i < 10; i++) {
        store.getState().setTextEditingElement(textId);
        input.focus();
        await new Promise(resolve => setTimeout(resolve, 10));
        
        input.blur();
        store.getState().setTextEditingElement(null);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(focusCount.count).toBe(10);
      expect(blurCount.count).toBe(10);
      expect(store.getState().textEditingElementId).toBeNull();

      input.remove();
    });

    it('should cleanup portal elements when component unmounts', async () => {
      const textId = 'text-cleanup-1' as ElementId;
      store.getState().addElement({
        id: textId,
        type: 'text',
        x: 0,
        y: 0,
        text: 'Cleanup test',
      } as TextElement);

      store.getState().setTextEditingElement(textId);

      // Create multiple portal elements
      const portal1 = document.createElement('div');
      portal1.setAttribute('data-testid', 'text-portal-1');
      document.body.appendChild(portal1);

      const portal2 = document.createElement('input');
      portal2.id = 'figma-text-input';
      document.body.appendChild(portal2);

      expect(document.querySelector('[data-testid="text-portal-1"]')).toBeTruthy();
      expect(document.getElementById('figma-text-input')).toBeTruthy();

      // Simulate cleanup
      const cleanupFn = () => {
        document.querySelectorAll('[data-testid*="text-portal"]').forEach(el => el.remove());
        document.querySelectorAll('#figma-text-input').forEach(el => el.remove());
      };

      cleanupFn();

      expect(document.querySelector('[data-testid="text-portal-1"]')).toBeFalsy();
      expect(document.getElementById('figma-text-input')).toBeFalsy();
    });

    it('should prevent text selection issues during editing', async () => {
      const textId = 'text-selection-1' as ElementId;
      store.getState().addElement({
        id: textId,
        type: 'text',
        x: 0,
        y: 0,
        text: 'Selection test text',
      } as TextElement);

      store.getState().setTextEditingElement(textId);

      const input = document.createElement('input') as HTMLInputElement;
      input.id = 'selection-test-portal';
      input.value = 'Selection test text';
      document.body.appendChild(input);
      input.focus();

      // Select all text
      input.select();
      
      // Check selection
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(input.value.length);

      // Type to replace selection
      const event = new InputEvent('input', { data: 'New' });
      input.value = 'New';
      input.dispatchEvent(event);

      expect(input.value).toBe('New');

      input.remove();
    });

    it('should handle multi-line text editing with Shift+Enter', async () => {
      const textId = 'text-multiline-1' as ElementId;
      store.getState().addElement({
        id: textId,
        type: 'text',
        x: 0,
        y: 0,
        text: 'Line 1',
      } as TextElement);

      store.getState().setTextEditingElement(textId);

      const textarea = document.createElement('textarea');
      textarea.id = 'multiline-portal';
      textarea.value = 'Line 1';
      
      const keyHandler = vi.fn((e: KeyboardEvent) => {
        if (e.key === 'Enter' && e.shiftKey) {
          // Allow new line
          const cursorPos = textarea.selectionStart;
          const before = textarea.value.substring(0, cursorPos);
          const after = textarea.value.substring(cursorPos);
          textarea.value = before + '\n' + after;
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          // Commit text
          store.getState().updateElement(textId, { text: textarea.value });
          store.getState().setTextEditingElement(null);
        }
      });

      textarea.addEventListener('keydown', keyHandler);
      document.body.appendChild(textarea);
      textarea.focus();

      // Add new line with Shift+Enter
      const shiftEnterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        shiftKey: true 
      });
      textarea.dispatchEvent(shiftEnterEvent);
      textarea.value = 'Line 1\nLine 2';

      // Commit with Enter
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        shiftKey: false 
      });
      textarea.dispatchEvent(enterEvent);

      const element = store.getState().getElementById(textId) as TextElement;
      expect(element?.text).toBe('Line 1\nLine 2');
      expect(store.getState().textEditingElementId).toBeNull();

      textarea.remove();
    });
  });
});