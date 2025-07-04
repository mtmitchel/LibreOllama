import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TextTool } from '../components/tools/creation/TextTool';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import Konva from 'konva';
import { ElementId, StickyNoteElement } from '../types/enhanced.types';
import { createUnifiedTestStore } from '../../../tests/helpers/createUnifiedTestStore';

// Add global type declaration for test
declare global {
  interface Window {
    __protectSelection?: any;
  }
}

// Mock Konva
vi.mock('konva', () => ({
  default: {
    Stage: vi.fn().mockImplementation(() => ({
      container: vi.fn().mockReturnValue({
        style: {},
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600
        })
      }),
      getPointerPosition: vi.fn().mockReturnValue({ x: 100, y: 100 }),
      getAbsoluteTransform: vi.fn().mockReturnValue({
        copy: vi.fn().mockReturnThis(),
        invert: vi.fn().mockReturnThis(),
        point: vi.fn((p) => p),
        getMatrix: vi.fn().mockReturnValue([1, 0, 0, 1, 0, 0])
      }),
      scaleX: vi.fn().mockReturnValue(1),
      scaleY: vi.fn().mockReturnValue(1),
      on: vi.fn(),
      off: vi.fn()
    }))
  }
}));

// Note: textEditingUtils is not directly used by TextTool anymore
// TextTool sets store state and TextShape handles the actual editing

describe('TextTool', () => {
  let stageRef: React.RefObject<Konva.Stage>;
  let mockStage: any;

  beforeEach(() => {
    // Reset store
    useUnifiedCanvasStore.setState({
      elements: new Map(),
      selectedElementIds: new Set(),
      selectedTool: 'text',
      textEditingElementId: null
    });

    // Create mock stage
    mockStage = new Konva.Stage({
      container: document.createElement('div'),
      width: 800,
      height: 600
    });
    
    // Add missing methods that TextTool expects
    mockStage.id = vi.fn().mockReturnValue('');
    mockStage.getType = vi.fn().mockReturnValue('Stage');
    
    stageRef = { current: mockStage };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render when active', () => {
    const { container } = render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );
    
    expect(container).toBeTruthy();
  });

  it('should not render when inactive', () => {
    const { container } = render(
      <svg>
        <TextTool stageRef={stageRef} isActive={false} />
      </svg>
    );
    
    const group = container.querySelector('g');
    expect(group).toBeNull();
  });

  it('should set crosshair cursor when active', () => {
    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    expect(mockStage.container().style.cursor).toBe('crosshair');
  });

  it('should show placement guide on mouse move', async () => {
    const { container } = render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Get the event handler that was registered (with namespace)
    const pointerMoveHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointermove.textTool'
    )?.[1];

    expect(pointerMoveHandler).toBeDefined();

    // Simulate pointer move
    const mockEvent = {
      target: mockStage,
      evt: { clientX: 150, clientY: 150 }
    };
    
    pointerMoveHandler(mockEvent);

    // Wait for state update - check for "Add text" label instead of preview box
    await waitFor(() => {
      const addTextLabel = container.querySelector('div[data-testid="konva-text"][text="Add text"]');
      expect(addTextLabel).toBeTruthy();
    });
  });

  it('should create text element on click', async () => {
    const { addElement } = useUnifiedCanvasStore.getState();
    const addElementSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'addElement');

    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Get the event handler that was registered (with namespace)
    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown.textTool'
    )?.[1];

    expect(pointerDownHandler).toBeDefined();

    // Simulate pointer down on stage
    const mockEvent = {
      target: mockStage,
      evt: { clientX: 200, clientY: 200 }
    };
    
    pointerDownHandler(mockEvent);

    // Wait for element creation
    await waitFor(() => {
      expect(addElementSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text',
          x: 100,
          y: 100,
          text: '', // Should start with empty text
          fontSize: 16,
          fill: '#000000'
        })
      );
    });
  });

  it('should start text editing after creating element', async () => {
    const { setTextEditingElement } = useUnifiedCanvasStore.getState();
    const setTextEditingElementSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'setTextEditingElement');
    
    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Get the event handler (with namespace)
    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown.textTool'
    )?.[1];

    // Simulate click
    const mockEvent = {
      target: mockStage,
      evt: { clientX: 200, clientY: 200 }
    };
    
    pointerDownHandler(mockEvent);

    // Wait for store state to be set for text editing
    await waitFor(() => {
      expect(setTextEditingElementSpy).toHaveBeenCalled();
    });

    // Verify an element was created and editing state was set
    const { elements } = useUnifiedCanvasStore.getState();
    const createdElement = Array.from(elements.values())[0];
    expect(createdElement).toBeDefined();
    expect(createdElement.type).toBe('text');
  });

  it('should set text editing element in store after creating text', async () => {
    const setTextEditingElementSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'setTextEditingElement');

    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Create element by clicking (with namespace)
    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown.textTool'
    )?.[1];

    pointerDownHandler({
      target: mockStage,
      evt: { clientX: 200, clientY: 200 }
    });

    // Wait for editing state to be set
    await waitFor(() => {
      expect(setTextEditingElementSpy).toHaveBeenCalled();
    });

    // Get the created element ID
    const { elements } = useUnifiedCanvasStore.getState();
    const createdElement = Array.from(elements.values())[0];
    
    // Verify the correct element ID was set for editing
    expect(setTextEditingElementSpy).toHaveBeenCalledWith(createdElement.id);
  });

  it('should handle text editing workflow through store state', async () => {
    const addElementSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'addElement');
    const setTextEditingElementSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'setTextEditingElement');

    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Create element (with namespace)
    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown.textTool'
    )?.[1];

    pointerDownHandler({
      target: mockStage,
      evt: { clientX: 200, clientY: 200 }
    });

    // Wait for element creation and editing state
    await waitFor(() => {
      expect(addElementSpy).toHaveBeenCalled();
      expect(setTextEditingElementSpy).toHaveBeenCalled();
    });

    // Verify the workflow: element created, then editing started
    const { elements, textEditingElementId } = useUnifiedCanvasStore.getState();
    const createdElement = Array.from(elements.values())[0];
    
    expect(createdElement.type).toBe('text');
    expect((createdElement as any).text).toBe(''); // Starts with empty text
    expect(textEditingElementId).toBe(createdElement.id);
  });

  it('should create text elements with correct initial properties', async () => {
    const addElementSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'addElement');

    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Create element (with namespace)
    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown.textTool'
    )?.[1];

    pointerDownHandler({
      target: mockStage,
      evt: { clientX: 150, clientY: 100 }
    });

    // Wait for element creation
    await waitFor(() => {
      expect(addElementSpy).toHaveBeenCalled();
    });

    // Verify the element was created with correct properties
    const createdElement = addElementSpy.mock.calls[0][0];
    expect(createdElement).toMatchObject({
      type: 'text',
      x: 100, // Transformed position
      y: 100,
      text: '', // Starts empty for immediate editing
      fontSize: 16,
      fill: '#000000',
      fontFamily: expect.stringContaining('Inter'),
      width: 20, // Minimal starting width
      height: 24 // Minimal starting height
    });
  });

  it('should handle text element positioning correctly', async () => {
    const addElementSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'addElement');

    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Create element at specific position
    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown.textTool'
    )?.[1];

    pointerDownHandler({
      target: mockStage,
      evt: { clientX: 300, clientY: 250 }
    });

    // Wait for element creation
    await waitFor(() => {
      expect(addElementSpy).toHaveBeenCalled();
    });

    // Verify position is correctly transformed
    const createdElement = addElementSpy.mock.calls[0][0];
    expect(createdElement.x).toBe(100); // Transformed by mock transform
    expect(createdElement.y).toBe(100);
  });

  it('should only create text on stage clicks, not element clicks', async () => {
    const addElementSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'addElement');

    // Create a mock element target (not the stage)
    const mockElement = {
      ...mockStage,
      id: vi.fn().mockReturnValue('existing-element-id'),
      getType: vi.fn().mockReturnValue('Rect')
    };

    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown.textTool'
    )?.[1];

    // Click on existing element (should be ignored)
    pointerDownHandler({
      target: mockElement,
      evt: { clientX: 200, clientY: 200 }
    });

    // Wait a bit to ensure no element is created
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify no element was created
    expect(addElementSpy).not.toHaveBeenCalled();
  });

  it('should handle sticky note integration', async () => {
    const addElementSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'addElement');
    const findStickyNoteAtPointSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'findStickyNoteAtPoint');
    const addElementToStickyNoteSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'addElementToStickyNote');

    // Mock finding a sticky note at the click position
    findStickyNoteAtPointSpy.mockReturnValue(ElementId('mock-sticky-note-id'));

    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown.textTool'
    )?.[1];

    pointerDownHandler({
      target: mockStage,
      evt: { clientX: 200, clientY: 200 }
    });

    // Wait for element creation and sticky note integration
    await waitFor(() => {
      expect(addElementSpy).toHaveBeenCalled();
      expect(addElementToStickyNoteSpy).toHaveBeenCalled();
    });

    const createdElement = addElementSpy.mock.calls[0][0];
    expect(addElementToStickyNoteSpy).toHaveBeenCalledWith(createdElement.id, 'sticky-note-id');
  });

  it('should clean up on unmount', () => {
    const { unmount } = render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    unmount();

    // Verify event listeners were removed (with namespaces)
    expect(mockStage.off).toHaveBeenCalledWith('pointermove.textTool', expect.any(Function));
    expect(mockStage.off).toHaveBeenCalledWith('pointerdown.textTool', expect.any(Function));
    expect(mockStage.off).toHaveBeenCalledWith('pointerleave.textTool', expect.any(Function));
    expect(mockStage.off).toHaveBeenCalledWith('pointerenter.textTool', expect.any(Function));
  });
}); 
