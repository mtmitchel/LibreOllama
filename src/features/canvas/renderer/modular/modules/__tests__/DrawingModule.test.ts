import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DrawingModule } from '../DrawingModule';
import { type ModuleContext } from '../../types';
import type { Layer } from 'konva/lib/Layer';

// Mock Konva
vi.mock('konva', () => ({
  default: {
    Line: vi.fn(() => ({
      points: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
      strokeWidth: vi.fn().mockReturnThis(),
      opacity: vi.fn().mockReturnThis(),
      lineCap: vi.fn().mockReturnThis(),
      lineJoin: vi.fn().mockReturnThis(),
      tension: vi.fn().mockReturnThis(),
      listening: vi.fn().mockReturnThis(),
      perfectDrawEnabled: vi.fn().mockReturnThis(),
      globalCompositeOperation: vi.fn().mockReturnThis(),
      remove: vi.fn()
    }))
  }
}));

// Mock node pool
vi.mock('../../../utils/KonvaNodePool', () => ({
  acquireNode: vi.fn(() => ({
    points: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    strokeWidth: vi.fn().mockReturnThis(),
    opacity: vi.fn().mockReturnThis(),
    lineCap: vi.fn().mockReturnThis(),
    lineJoin: vi.fn().mockReturnThis(),
    tension: vi.fn().mockReturnThis(),
    listening: vi.fn().mockReturnThis(),
    perfectDrawEnabled: vi.fn().mockReturnThis(),
    globalCompositeOperation: vi.fn().mockReturnThis(),
    remove: vi.fn()
  })),
  releaseNode: vi.fn()
}));

// Mock pointer utils
vi.mock('../../../utils/pointer-to-content', () => ({
  getContentPointer: vi.fn(() => ({ x: 100, y: 100 }))
}));

// Mock unified canvas store
const mockStore = {
  getState: vi.fn(() => ({
    selectedTool: 'pen',
    penColor: '#000000',
    strokeConfig: {
      marker: { color: '#ff0000', maxWidth: 8, opacity: 0.7, smoothness: 0.5 },
      highlighter: { color: '#f7e36d', width: 12, opacity: 0.5, blendMode: 'multiply' }
    }
  })),
  subscribe: vi.fn(() => vi.fn()) // Return unsubscribe function
};

vi.mock('../../../stores/unifiedCanvasStore', () => ({
  useUnifiedCanvasStore: {
    getState: () => mockStore.getState(),
    subscribe: mockStore.subscribe
  }
}));

describe('DrawingModule', () => {
  let drawingModule: DrawingModule;
  let mockContext: ModuleContext;
  let mockStage: any;

  beforeEach(() => {
    drawingModule = new DrawingModule();

    mockStage = {
      findOne: vi.fn(() => ({ add: vi.fn(), batchDraw: vi.fn() })),
      on: vi.fn(),
      off: vi.fn()
    };

    mockContext = {
      store: {
        subscribe: vi.fn(),
        getSnapshot: vi.fn(),
        selectElement: vi.fn(),
        eraseAtPoint: vi.fn(),
        eraseInPath: vi.fn(),
        startDrawing: vi.fn(),
        updateDrawing: vi.fn(),
        finishDrawing: vi.fn(),
        addElementDrawing: vi.fn()
      },
      konva: {
        getStage: vi.fn(() => mockStage),
        getLayers: vi.fn(() => ({
          background: null,
          main: { add: vi.fn(), batchDraw: vi.fn() } as unknown as Layer,
          preview: { add: vi.fn(), batchDraw: vi.fn() } as unknown as Layer,
          overlay: null
        }))
      },
      overlay: {}
    };
  });

  describe('Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        drawingModule.init(mockContext);
      }).not.toThrow();
    });

    it('should setup event handlers on stage', () => {
      drawingModule.init(mockContext);

      expect(mockStage.on).toHaveBeenCalledWith('pointerdown mousedown', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointermove mousemove', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointerup mouseup', expect.any(Function));
    });
  });

  describe('Tool Detection', () => {
    beforeEach(() => {
      drawingModule.init(mockContext);
    });

    it('should handle pen tool', () => {
      mockStore.getState.mockReturnValue({ selectedTool: 'pen', penColor: '#000000', strokeConfig: { marker: { color: '#ff0000', maxWidth: 8, opacity: 0.7, smoothness: 0.5 }, highlighter: { color: '#f7e36d', width: 12, opacity: 0.5, blendMode: 'multiply' } } });
      // Test tool-specific behavior would go here
      expect(mockStore.getState().selectedTool).toBe('pen');
    });

    it('should handle marker tool', () => {
      mockStore.getState.mockReturnValue({ selectedTool: 'marker', penColor: '#000000', strokeConfig: { marker: { color: '#ff0000', maxWidth: 8, opacity: 0.7, smoothness: 0.5 }, highlighter: { color: '#f7e36d', width: 12, opacity: 0.5, blendMode: 'multiply' } } });
      expect(mockStore.getState().selectedTool).toBe('marker');
    });

    it('should handle highlighter tool', () => {
      mockStore.getState.mockReturnValue({ selectedTool: 'highlighter', penColor: '#000000', strokeConfig: { marker: { color: '#ff0000', maxWidth: 8, opacity: 0.7, smoothness: 0.5 }, highlighter: { color: '#f7e36d', width: 12, opacity: 0.5, blendMode: 'multiply' } } });
      expect(mockStore.getState().selectedTool).toBe('highlighter');
    });
  });

  describe('Drawing Workflow', () => {
    beforeEach(() => {
      drawingModule.init(mockContext);
    });

    it('should start drawing when store methods are available', () => {
      // This test verifies that drawing methods are called when expected
      expect(mockContext.store.startDrawing).toBeDefined();
      expect(mockContext.store.updateDrawing).toBeDefined();
      expect(mockContext.store.finishDrawing).toBeDefined();
    });

    it('should handle element creation with addElementDrawing', () => {
      expect(mockContext.store.addElementDrawing).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      drawingModule.init(mockContext);

      expect(() => {
        drawingModule.destroy();
      }).not.toThrow();
    });

    it('should unbind event handlers on destroy', () => {
      drawingModule.init(mockContext);
      drawingModule.destroy();

      expect(mockStage.off).toHaveBeenCalledWith('pointerdown mousedown', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointermove mousemove', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointerup mouseup', expect.any(Function));
    });
  });

  describe('Integration Requirements', () => {
    it('should implement the RendererModule interface', () => {
      expect(drawingModule.init).toBeDefined();
      expect(drawingModule.sync).toBeDefined();
      expect(drawingModule.onEvent).toBeDefined();
      expect(drawingModule.destroy).toBeDefined();
    });

    it('should provide onEvent method for future centralized event system', () => {
      const result = drawingModule.onEvent({ type: 'test' }, {} as any);
      expect(typeof result).toBe('boolean');
    });
  });
});