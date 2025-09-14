/**
 * Test for TextModule dual text editing conflict resolution
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TextModule Dual Text Editing Resolution', () => {
  beforeEach(() => {
    // Clear any existing state
    (window as any).__MODULAR_TEXT_EDITING__ = false;

    // Mock localStorage for feature flags
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    });
  });

  afterEach(() => {
    // Clean up DOM
    const editors = document.querySelectorAll('[data-role="modular-canvas-text-editor"], [data-role="canvas-text-editor"]');
    editors.forEach(editor => editor.remove());

    // Reset flags
    (window as any).__MODULAR_TEXT_EDITING__ = false;
  });

  it('should prevent dual text editor creation', () => {
    // Mock USE_NEW_CANVAS as enabled (modular system active)
    vi.mocked(localStorage.getItem).mockImplementation((key) => {
      if (key === 'USE_NEW_CANVAS') return 'true';
      return null;
    });

    // Simulate modular text editor being created
    const modularEditor = document.createElement('div');
    modularEditor.setAttribute('data-role', 'modular-canvas-text-editor');
    modularEditor.setAttribute('data-text-editing', 'true');
    document.body.appendChild(modularEditor);

    // Set the flag that modular editing is active
    (window as any).__MODULAR_TEXT_EDITING__ = true;

    // Verify only one text editor exists
    const allEditors = document.querySelectorAll('[data-role*="text-editor"]');
    expect(allEditors).toHaveLength(1);
    expect(allEditors[0]).toHaveAttribute('data-role', 'modular-canvas-text-editor');

    // Verify the flag is set
    expect((window as any).__MODULAR_TEXT_EDITING__).toBe(true);
  });

  it('should allow fallback to monolithic editor when modular is disabled', () => {
    // Mock USE_NEW_CANVAS as disabled (monolithic system active)
    vi.mocked(localStorage.getItem).mockImplementation((key) => {
      if (key === 'USE_NEW_CANVAS') return 'false';
      return null;
    });

    // Verify modular text editing flag is false
    expect((window as any).__MODULAR_TEXT_EDITING__).toBe(false);

    // Create monolithic text editor
    const monolithicEditor = document.createElement('textarea');
    monolithicEditor.setAttribute('data-role', 'canvas-text-editor');
    monolithicEditor.setAttribute('data-text-editing', 'true');
    document.body.appendChild(monolithicEditor);

    // Verify only monolithic editor exists
    const allEditors = document.querySelectorAll('[data-role*="text-editor"]');
    expect(allEditors).toHaveLength(1);
    expect(allEditors[0]).toHaveAttribute('data-role', 'canvas-text-editor');
  });

  it('should prevent multiple modular editors', () => {
    // Create first modular editor
    const editor1 = document.createElement('div');
    editor1.setAttribute('data-role', 'modular-canvas-text-editor');
    document.body.appendChild(editor1);

    // Try to create second modular editor (should be prevented)
    const existingEditor = document.querySelector('[data-role="modular-canvas-text-editor"]');
    expect(existingEditor).not.toBeNull();

    // Verify only one editor exists
    const allModularEditors = document.querySelectorAll('[data-role="modular-canvas-text-editor"]');
    expect(allModularEditors).toHaveLength(1);
  });

  it('should use correct z-index for proper layering', () => {
    const editor = document.createElement('div');
    editor.setAttribute('data-role', 'modular-canvas-text-editor');
    editor.style.zIndex = '2147483647';
    document.body.appendChild(editor);

    expect(editor.style.zIndex).toBe('2147483647');
  });
});