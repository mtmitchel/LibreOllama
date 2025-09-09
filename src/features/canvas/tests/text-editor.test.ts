import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CanvasTextEditor, type TextEditorConfig } from '../renderer/text/TextEditor';
import { MockStoreAdapter } from '../renderer/store/StoreIntegration';

// Mock Konva objects
const mockNode = {
  getClientRect: vi.fn(() => ({ 
    x: 100, 
    y: 50, 
    width: 200, 
    height: 100 
  })),
  getStage: vi.fn(() => mockStage),
  findOne: vi.fn()
} as any;

// Create a proper container hierarchy for overlay management
const createMockStageContainer = () => {
  const grandParent = document.createElement('div');
  grandParent.id = 'canvas-container-parent';
  
  const container = document.createElement('div');
  container.id = 'canvas-container';
  
  grandParent.appendChild(container);
  document.body.appendChild(grandParent);
  
  // Mock getBoundingClientRect for positioning
  container.getBoundingClientRect = vi.fn(() => ({ 
    left: 10, 
    top: 20, 
    width: 800, 
    height: 600,
    right: 810,
    bottom: 620,
    x: 10,
    y: 20
  }));
  
  // Mock contains method
  container.contains = vi.fn(() => false);
  
  return container;
};

let mockContainer: HTMLElement;

const mockStage = {
  container: vi.fn(() => mockContainer),
  scaleX: vi.fn(() => 1),
  on: vi.fn(),
  off: vi.fn()
} as any;

// Mock DOM elements
const createMockTextElement = (tagName: string = 'textarea') => {
  const element = document.createElement(tagName);
  const parent = document.createElement('div');
  parent.appendChild(element);
  document.body.appendChild(parent);
  
  // Mock focus method
  element.focus = vi.fn();
  if (tagName === 'textarea') {
    (element as HTMLTextAreaElement).setSelectionRange = vi.fn();
  }
  
  return element;
};

describe('CanvasTextEditor', () => {
  let textEditor: CanvasTextEditor;
  let mockStoreAdapter: MockStoreAdapter;
  let config: TextEditorConfig;

  beforeEach(() => {
    mockStoreAdapter = new MockStoreAdapter();
    mockContainer = createMockStageContainer();
    
    config = {
      stage: mockStage,
      storeAdapter: mockStoreAdapter,
      updateElementCallback: vi.fn(),
      refreshTransformer: vi.fn(),
      scheduleDraw: vi.fn(),
      syncSelection: vi.fn(),
      debug: {
        outlineOverlay: false,
        log: true,
        zeroBaseline: false
      }
    };

    textEditor = new CanvasTextEditor(config);
  });

  afterEach(() => {
    textEditor.destroy();
    // Clean up any remaining DOM elements
    document.querySelectorAll('div[id="__canvas_overlay_root__"]').forEach(el => el.remove());
    document.querySelectorAll('textarea, div[contenteditable]').forEach(el => {
      const parent = el.parentElement;
      if (parent && parent.parentElement === document.body) {
        parent.remove();
      } else {
        el.remove();
      }
    });
    // Clean up mock container
    document.querySelectorAll('#canvas-container-parent').forEach(el => el.remove());
  });

  describe('Editor Lifecycle', () => {
    it('opens editor for text element', async () => {
      const element = {
        id: 'text-1',
        type: 'text',
        x: 100,
        y: 50,
        width: 200,
        height: 100,
        text: 'Hello World',
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#000000'
      } as any;

      mockStoreAdapter.setElement('text-1', element);

      await textEditor.openEditor('text-1', mockNode, element);

      expect(textEditor.isEditingElement('text-1')).toBe(true);
      expect(textEditor.getCurrentEditingId()).toBe('text-1');
      
      // Check store interaction
      const updateCalls = mockStoreAdapter.updateElementCalls;
      expect(updateCalls.length).toBeGreaterThan(0);
      expect(updateCalls[0].updates).toMatchObject({
        isEditing: true,
        text: 'Hello World'
      });
    });

    it('opens editor for circle element with contenteditable', async () => {
      const element = {
        id: 'circle-1',
        type: 'circle',
        x: 100,
        y: 50,
        radius: 50,
        text: 'Circle Text',
        fontSize: 16,
        color: '#333333'
      } as any;

      mockStoreAdapter.setElement('circle-1', element);

      await textEditor.openEditor('circle-1', mockNode, element);

      expect(textEditor.isEditingElement('circle-1')).toBe(true);
      
      // Should create contenteditable for circles
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      expect(overlayRoot).toBeTruthy();
      expect(overlayRoot!.children.length).toBe(1);
      
      // Get the wrapper div and its child
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      expect(wrapper).toBeTruthy();
      expect(wrapper.children.length).toBe(1);
      
      // Get the actual contenteditable element
      const contentEditableElement = wrapper.children[0] as HTMLElement;
      expect(contentEditableElement).toBeTruthy();
      expect(contentEditableElement.contentEditable).toBe('true');
    });

    it('opens editor for sticky note element', async () => {
      const element = {
        id: 'sticky-1',
        type: 'sticky',
        x: 100,
        y: 50,
        width: 150,
        height: 80,
        text: 'Sticky Note',
        fill: '#ffeb3b'
      } as any;

      mockStoreAdapter.setElement('sticky-1', element);

      await textEditor.openEditor('sticky-1', mockNode, element);

      expect(textEditor.isEditingElement('sticky-1')).toBe(true);
      
      // Should create textarea for sticky notes
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      expect(overlayRoot).toBeTruthy();
      expect(overlayRoot!.children.length).toBe(1);
      
      // Get the wrapper div and its child
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      expect(wrapper).toBeTruthy();
      expect(wrapper.children.length).toBe(1);
      
      // Get the actual textarea element
      const textareaElement = wrapper.children[0] as HTMLTextAreaElement;
      expect(textareaElement).toBeTruthy();
      expect(textareaElement.tagName).toBe('TEXTAREA');
    });

    it('closes current editor', async () => {
      const element = {
        id: 'text-1',
        type: 'text',
        text: 'Test'
      } as any;

      await textEditor.openEditor('text-1', mockNode, element);
      expect(textEditor.isEditingElement('text-1')).toBe(true);

      textEditor.closeCurrentEditor();
      
      expect(textEditor.isEditingElement('text-1')).toBe(false);
      expect(textEditor.getCurrentEditingId()).toBe(null);
    });

    it('closes existing editor when opening new one', async () => {
      const element1 = {
        id: 'text-1',
        type: 'text',
        text: 'First'
      } as any;

      const element2 = {
        id: 'text-2', 
        type: 'text',
        text: 'Second'
      } as any;

      await textEditor.openEditor('text-1', mockNode, element1);
      expect(textEditor.getCurrentEditingId()).toBe('text-1');

      await textEditor.openEditor('text-2', mockNode, element2);
      expect(textEditor.getCurrentEditingId()).toBe('text-2');
      expect(textEditor.isEditingElement('text-1')).toBe(false);
    });
  });

  describe('Text Editor Actions', () => {
    let testElement: any;

    beforeEach(async () => {
      testElement = {
        id: 'test-element',
        type: 'text',
        x: 100,
        y: 50,
        width: 200,
        height: 100,
        text: 'Original Text',
        fontSize: 14
      };

      mockStoreAdapter.setElement('test-element', testElement);
      await textEditor.openEditor('test-element', mockNode, testElement);
    });

    it('commits current edit', () => {
      // Mock the textarea value
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = 'Updated Text';
      }

      textEditor.commitCurrentEdit();

      expect(textEditor.getCurrentEditingId()).toBe(null);
      
      // Check store was updated with final text
      const updateCalls = mockStoreAdapter.updateElementCalls;
      const commitCall = updateCalls.find(call => 
        call.updates.text === 'Updated Text' && 
        call.updates.isEditing === false
      );
      expect(commitCall).toBeDefined();
    });

    it('cancels current edit', () => {
      textEditor.cancelCurrentEdit();

      expect(textEditor.getCurrentEditingId()).toBe(null);
      
      // Check store was reverted
      const updateCalls = mockStoreAdapter.updateElementCalls;
      const cancelCall = updateCalls.find(call => 
        call.updates.text === 'Original Text' && 
        call.updates.isEditing === false
      );
      expect(cancelCall).toBeDefined();
    });
  });

  describe('Event Handling', () => {
    let testElement: any;

    beforeEach(async () => {
      testElement = {
        id: 'test-element',
        type: 'text',
        text: 'Test Text'
      };

      await textEditor.openEditor('test-element', mockNode, testElement);
    });

    it('handles escape key to cancel editing', () => {
      const textarea = document.querySelector('textarea');
      expect(textarea).toBeTruthy();

      // Simulate escape key
      const escapeEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        keyCode: 27, 
        cancelable: true 
      });
      
      textarea?.dispatchEvent(escapeEvent);

      expect(textEditor.getCurrentEditingId()).toBe(null);
    });

    it('handles input events for live updates', () => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();

      if (textarea) {
        textarea.value = 'Live Update';
        
        // Simulate input event
        const inputEvent = new InputEvent('input');
        textarea.dispatchEvent(inputEvent);

        // Check store was updated with skipHistory
        const updateCalls = mockStoreAdapter.updateElementCalls;
        const liveUpdateCall = updateCalls.find(call => 
          call.updates.text === 'Live Update' &&
          call.options?.skipHistory === true
        );
        expect(liveUpdateCall).toBeDefined();
      }
    });

    it('handles blur event to commit editing', (done) => {
      const textarea = document.querySelector('textarea');
      expect(textarea).toBeTruthy();

      if (textarea) {
        textarea.value = 'Blur Test';
        
        // Simulate blur event
        const blurEvent = new FocusEvent('blur');
        textarea.dispatchEvent(blurEvent);

        // Wait for the timeout in blur handler
        setTimeout(() => {
          expect(textEditor.getCurrentEditingId()).toBe(null);
          done();
        }, 150);
      } else {
        done();
      }
    });
  });

  describe('Element Type Handling', () => {
    it('calculates correct positioning for circle elements', async () => {
      const circleElement = {
        id: 'circle-1',
        type: 'circle',
        radius: 75,
        text: 'Circle Text'
      } as any;

      // Mock specific dimensions for circle
      mockNode.getClientRect.mockReturnValue({
        x: 50,
        y: 25,
        width: 150, // diameter
        height: 150
      });

      await textEditor.openEditor('circle-1', mockNode, circleElement);

      // Verify contenteditable was created (circles use contenteditable)
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      const contentEditableElement = wrapper.children[0] as HTMLElement;
      expect(contentEditableElement).toBeTruthy();
      expect(contentEditableElement.contentEditable).toBe('true');
      
      expect(textEditor.isEditingElement('circle-1')).toBe(true);
    });

    it('calculates correct positioning for rectangle elements', async () => {
      const rectElement = {
        id: 'rect-1',
        type: 'rectangle',
        width: 200,
        height: 100,
        text: 'Rectangle Text'
      } as any;

      await textEditor.openEditor('rect-1', mockNode, rectElement);

      // Verify textarea was created (rectangles use textarea)
      const overlayRoot = document.querySelector('#__canvas_overlay_root__');
      const wrapper = overlayRoot!.children[0] as HTMLElement;
      const textareaElement = wrapper.children[0] as HTMLTextAreaElement;
      expect(textareaElement).toBeTruthy();
      expect(textareaElement.tagName).toBe('TEXTAREA');
      
      expect(textEditor.isEditingElement('rect-1')).toBe(true);
    });

    it('handles sticky note elements', async () => {
      const stickyElement = {
        id: 'sticky-1',
        type: 'sticky',
        width: 150,
        height: 80,
        text: 'Sticky Note',
        fill: '#ffeb3b'
      } as any;

      await textEditor.openEditor('sticky-1', mockNode, stickyElement);

      expect(textEditor.isEditingElement('sticky-1')).toBe(true);
    });
  });

  describe('Cleanup and Destruction', () => {
    it('cleans up all resources on destroy', async () => {
      const element = {
        id: 'test-element',
        type: 'text',
        text: 'Test'
      } as any;

      await textEditor.openEditor('test-element', mockNode, element);
      expect(textEditor.getCurrentEditingId()).toBe('test-element');

      textEditor.destroy();

      expect(textEditor.getCurrentEditingId()).toBe(null);
      
      // Verify DOM cleanup
      const overlays = document.querySelectorAll('div[id="__canvas_overlay_root__"]');
      
      // Check that overlay root either doesn't exist or is empty
      if (overlays.length > 0) {
        const overlayRoot = overlays[0] as HTMLElement;
        expect(overlayRoot.children.length).toBe(0);
      }
    });

    it('handles errors gracefully during operations', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create an element that will cause errors
      const problematicElement = {
        id: 'bad-element',
        type: 'unknown-type'
      } as any;

      // Mock stage container to return null (simulate error condition)
      mockStage.container.mockReturnValue(null);

      try {
        await textEditor.openEditor('bad-element', mockNode, problematicElement);
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(textEditor.getCurrentEditingId()).toBe(null);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Store Integration', () => {
    it('integrates properly with store adapter', async () => {
      const element = {
        id: 'store-test',
        type: 'text',
        text: 'Store Test',
        width: 100,
        height: 50
      } as any;

      mockStoreAdapter.setElement('store-test', element);

      await textEditor.openEditor('store-test', mockNode, element);

      // Verify store calls
      expect(mockStoreAdapter.updateElementCalls.length).toBeGreaterThan(0);
      expect(mockStoreAdapter.selectElementCalls.length).toBeGreaterThan(0);

      textEditor.commitCurrentEdit();

      // Verify commit calls
      const commitCall = mockStoreAdapter.updateElementCalls.find(call => 
        call.updates.isEditing === false
      );
      expect(commitCall).toBeDefined();
    });
  });
});