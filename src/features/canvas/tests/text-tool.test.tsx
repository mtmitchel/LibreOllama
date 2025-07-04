import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TextTool } from '../components/tools/creation/TextTool';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import Konva from 'konva';

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

// Mock textEditingUtils
vi.mock('../utils/textEditingUtils', () => ({
  createTextEditor: vi.fn().mockReturnValue(() => {})
}));

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

  it('should show preview box on mouse move', async () => {
    const { container } = render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Get the event handler that was registered
    const pointerMoveHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointermove'
    )?.[1];

    expect(pointerMoveHandler).toBeDefined();

    // Simulate pointer move
    const mockEvent = {
      target: mockStage,
      evt: { clientX: 150, clientY: 150 }
    };
    
    pointerMoveHandler(mockEvent);

    // Wait for state update
    await waitFor(() => {
      const previewBox = container.querySelector('rect[stroke="#3B82F6"]');
      expect(previewBox).toBeTruthy();
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

    // Get the event handler that was registered
    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown'
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
          width: 200,
          height: 50,
          text: '', // Should start with empty text
          fontSize: 20,
          fill: '#000000'
        })
      );
    });
  });

  it('should start text editor after creating element', async () => {
    const createTextEditor = await import('../utils/textEditingUtils').then(m => m.createTextEditor);
    
    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Get the event handler
    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown'
    )?.[1];

    // Simulate click
    const mockEvent = {
      target: mockStage,
      evt: { clientX: 200, clientY: 200 }
    };
    
    pointerDownHandler(mockEvent);

    // Wait for text editor creation
    await waitFor(() => {
      expect(createTextEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          position: expect.objectContaining({
            left: expect.any(Number),
            top: expect.any(Number),
            width: 200,
            height: 50
          }),
          initialText: '',
          placeholder: 'Add text',
          multiline: true,
          showHelper: false
        })
      );
    });
  });

  it('should switch to select tool after saving text', async () => {
    const { setSelectedTool, selectElement } = useUnifiedCanvasStore.getState();
    const setSelectedToolSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'setSelectedTool');
    const selectElementSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'selectElement');

    // Mock createTextEditor to capture onSave callback
    let onSaveCallback: ((text: string) => void) | null = null;
    const createTextEditor = await import('../utils/textEditingUtils').then(m => m.createTextEditor);
    (createTextEditor as any).mockImplementation((options: any) => {
      onSaveCallback = options.onSave;
      return () => {};
    });

    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Create element by clicking
    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown'
    )?.[1];

    pointerDownHandler({
      target: mockStage,
      evt: { clientX: 200, clientY: 200 }
    });

    // Get the created element ID
    const { elements } = useUnifiedCanvasStore.getState();
    const createdElement = Array.from(elements.values())[0];

    // Simulate saving text
    expect(onSaveCallback).toBeDefined();
    onSaveCallback!('Hello World');

    // Wait for tool switch
    await waitFor(() => {
      expect(selectElementSpy).toHaveBeenCalledWith(createdElement.id, false);
      expect(setSelectedToolSpy).toHaveBeenCalledWith('select');
    }, { timeout: 500 });
  });

  it('should protect selection when saving', async () => {
    // Mock window.__protectSelection
    window.__protectSelection = vi.fn();

    // Mock createTextEditor
    let onSaveCallback: ((text: string) => void) | null = null;
    const createTextEditor = await import('../utils/textEditingUtils').then(m => m.createTextEditor);
    (createTextEditor as any).mockImplementation((options: any) => {
      onSaveCallback = options.onSave;
      return () => {};
    });

    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Create element
    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown'
    )?.[1];

    pointerDownHandler({
      target: mockStage,
      evt: { clientX: 200, clientY: 200 }
    });

    // Save text
    onSaveCallback!('Test');

    expect(window.__protectSelection).toHaveBeenCalled();
  });

  it('should delete element on cancel', async () => {
    const { deleteElement } = useUnifiedCanvasStore.getState();
    const deleteElementSpy = vi.spyOn(useUnifiedCanvasStore.getState(), 'deleteElement');

    // Mock createTextEditor
    let onCancelCallback: (() => void) | null = null;
    const createTextEditor = await import('../utils/textEditingUtils').then(m => m.createTextEditor);
    (createTextEditor as any).mockImplementation((options: any) => {
      onCancelCallback = options.onCancel;
      return () => {};
    });

    render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    // Create element
    const pointerDownHandler = mockStage.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown'
    )?.[1];

    pointerDownHandler({
      target: mockStage,
      evt: { clientX: 200, clientY: 200 }
    });

    // Get created element ID
    const { elements } = useUnifiedCanvasStore.getState();
    const createdElement = Array.from(elements.values())[0];

    // Cancel editing
    expect(onCancelCallback).toBeDefined();
    onCancelCallback!();

    expect(deleteElementSpy).toHaveBeenCalledWith(createdElement.id);
  });

  it('should clean up on unmount', () => {
    const { unmount } = render(
      <svg>
        <TextTool stageRef={stageRef} isActive={true} />
      </svg>
    );

    unmount();

    // Verify event listeners were removed
    expect(mockStage.off).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(mockStage.off).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(mockStage.off).toHaveBeenCalledWith('pointerleave', expect.any(Function));
    expect(mockStage.off).toHaveBeenCalledWith('pointerenter', expect.any(Function));
  });
}); 
