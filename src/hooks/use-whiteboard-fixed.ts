import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  WhiteboardState,
  WhiteboardToolType,
  WhiteboardToolState,
  WhiteboardViewport,
  WhiteboardSelection,
  WhiteboardHistory,
  WhiteboardHistoryEntry,
  AnyWhiteboardElement,
  WhiteboardPoint,
  WhiteboardBounds,
  WhiteboardSettings
} from '../lib/whiteboard-types';
import {
  WhiteboardCoordinates,
  WhiteboardElementFactory,
  WhiteboardGrid,
  WhiteboardSelection as SelectionUtils,
  WhiteboardPerformance,
  QuadTreeSpatialIndex,
  PerformanceManager,
  ViewportManager,
  MemoryPools,
  BezierCurveFitter,
  PressureSensitivityHandler,
  ShapeRecognizer,
  FileFormatManagerImpl,
  RenderingBackendImpl,
  HybridRendererImpl,
  AdvancedExportEngineImpl,
  PerformanceBenchmarkSuite,
  WhiteboardMemoryPoolManager
} from '../lib/whiteboard-utils';
import { useAutoSave } from './use-auto-save';

interface UseWhiteboardOptions {
  initialState?: Partial<WhiteboardState>;
  enableAutoSave?: boolean;
  onSave?: (state: WhiteboardState) => Promise<void>;
  maxHistoryEntries?: number;
}

interface UseWhiteboardReturn {
  // State
  whiteboardState: WhiteboardState;
  toolState: WhiteboardToolState;
  viewport: WhiteboardViewport;
  selection: WhiteboardSelection;
  history: WhiteboardHistory;
  
  // Actions
  setActiveTool: (tool: WhiteboardToolType) => void;
  
  // Element operations
  createElement: (type: WhiteboardToolType, position: WhiteboardPoint, options?: any) => void;
  updateElement: (elementId: string, updates: Partial<AnyWhiteboardElement>) => void;
  deleteElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;
  moveElements: (elementIds: string[], delta: WhiteboardPoint) => void;
  
  // Selection operations
  selectElement: (elementId: string, addToSelection?: boolean) => void;
  selectElements: (elementIds: string[]) => void;
  selectElementsInBounds: (bounds: WhiteboardBounds) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Viewport operations
  setViewport: (viewport: Partial<WhiteboardViewport>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomToSelection: () => void;
  resetZoom: () => void;
  panTo: (position: WhiteboardPoint) => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Utility functions
  screenToCanvas: (screenPoint: WhiteboardPoint) => WhiteboardPoint;
  canvasToScreen: (canvasPoint: WhiteboardPoint) => WhiteboardPoint;
  getElementAtPoint: (point: WhiteboardPoint) => AnyWhiteboardElement | null;
  getVisibleElements: () => AnyWhiteboardElement[];
  
  // Settings
  updateSettings: (settings: Partial<WhiteboardSettings>) => void;
  
  // Export/Import
  exportState: () => WhiteboardState;
  importState: (state: Partial<WhiteboardState>) => void;
  
  // Internal utilities
  updateContainerSize: (width: number, height: number) => void;
  
  // Performance and spatial indexing
  getPerformanceMetrics: () => import('../lib/whiteboard-types').PerformanceMetrics;
  getQuadTreeStats: () => import('../lib/whiteboard-types').QuadTreeStats;
  rebuildSpatialIndex: () => void;
  
  // Enhanced viewport management
  getViewportCullingStats: () => import('../lib/whiteboard-types').ViewportCullingStats;
  getElementLOD: (elementId: string) => import('../lib/whiteboard-types').ElementLOD;
  
  // Advanced Drawing Tools - Phase 1b
  bezierFitter: BezierCurveFitter;
  pressureHandler: PressureSensitivityHandler;
  shapeRecognizer: ShapeRecognizer;
  fitCurveToPoints: (points: WhiteboardPoint[], tolerance?: number) => import('../lib/whiteboard-types').BezierCurve[];
  recognizeDrawnShape: (points: WhiteboardPoint[]) => import('../lib/whiteboard-types').RecognizedShape | null;
  
  // File Format & Compression - Phase 1c
  fileManager: FileFormatManagerImpl;
  compressCanvas: () => Promise<ArrayBuffer>;
  loadFromCompressed: (data: ArrayBuffer) => Promise<void>;
  
  // GPU Rendering - Phase 1d
  renderingBackend: RenderingBackendImpl;
  hybridRenderer: HybridRendererImpl;
  switchRenderingBackend: (type: 'dom' | 'canvas2d' | 'webgl' | 'webgpu') => Promise<boolean>;
  
  // Advanced Export - Phase 1e
  exportEngine: AdvancedExportEngineImpl;
  exportAdvanced: (options: import('../lib/whiteboard-types').AdvancedExportOptions) => Promise<Blob | string | ArrayBuffer>;
  exportMultipleFormats: (formats: import('../lib/whiteboard-types').AdvancedExportOptions[]) => Promise<Map<string, import('../lib/whiteboard-types').ExportResult>>;
  
  // Performance Benchmarking - Phase 1f
  benchmarkSuite: PerformanceBenchmarkSuite;
  runPerformanceBenchmark: () => Promise<import('../lib/whiteboard-types').PerformanceBenchmark>;
  
  // Enhanced Memory Management
  memoryPoolManager: WhiteboardMemoryPoolManager;
  getMemoryPoolStats: () => { [key: string]: ObjectPoolStats };
  optimizeMemoryUsage: () => void;
}

const DEFAULT_VIEWPORT: WhiteboardViewport = {
  x: 0,
  y: 0,
  zoom: 1,
  bounds: { x: 0, y: 0, width: 0, height: 0 }
};

const DEFAULT_SETTINGS: WhiteboardSettings = {
  grid: {
    enabled: true,
    size: 20,
    snapEnabled: false,
    snapThreshold: 10,
    color: '#e5e7eb',
    opacity: 0.5,
    type: 'dots'
  },
  backgroundColor: '#ffffff',
  rulers: {
    enabled: false,
    units: 'px'
  },
  guides: {
    enabled: true,
    snapDistance: 5,
    color: '#3b82f6'
  },
  performance: {
    virtualizeElements: true,
    maxVisibleElements: 1000,
    renderQuality: 'high'
  }
};

export function useWhiteboard(options: UseWhiteboardOptions = {}): UseWhiteboardReturn {
  const {
    initialState,
    enableAutoSave = true,
    onSave,
    maxHistoryEntries = 50
  } = options;

  // Initialize whiteboard state
  const [whiteboardState, setWhiteboardState] = useState<WhiteboardState>(() => {
    const now = new Date().toISOString();
    return {
      id: initialState?.id || `whiteboard-${Date.now()}`,
      name: initialState?.name || 'Untitled Whiteboard',
      description: initialState?.description,
      elements: initialState?.elements || [],
      groups: initialState?.groups || [],
      layers: initialState?.layers || [
        {
          id: 'default',
          name: 'Default Layer',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          elementIds: [],
          order: 0
        }
      ],
      viewport: { ...DEFAULT_VIEWPORT, ...initialState?.viewport },
      settings: { ...DEFAULT_SETTINGS, ...initialState?.settings },
      selection: { elementIds: [], handles: { visible: true, resize: true, rotate: true } },
      history: {
        undoStack: [],
        redoStack: [],
        maxEntries: maxHistoryEntries
      },
      metadata: {
        author: 'user',
        collaborators: [],
        version: 1,
        tags: [],
        isPublic: false,
        lastAutoSave: now,
        ...initialState?.metadata
      },
      createdAt: initialState?.createdAt || now,
      updatedAt: now
    };
  });

  // Tool state
  const [toolState, setToolState] = useState<WhiteboardToolState>({
    activeTool: 'select',
    toolOptions: {
      stickyNote: {
        color: '#fef3c7',
        size: 'medium',
        autoResize: true
      },
      text: {
        font: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: 'normal',
          style: 'normal',
          decoration: 'none',
          align: 'left'
        },
        color: '#000000'
      },
      pen: {
        stroke: { width: 2, style: 'solid' },
        color: '#000000',
        smoothing: 0.5,
        pressureSensitive: false
      },
      shape: {
        shapeType: 'rectangle',
        color: { fill: '#3b82f6', stroke: '#1e40af', opacity: 1 },
        stroke: { width: 2, style: 'solid' }
      },
      line: {
        lineType: 'straight',
        color: '#374151',
        stroke: { width: 2, style: 'solid' },
        startArrow: 'none',
        endArrow: 'arrow'
      }
    }
  });

  // Container size ref for viewport calculations
  const containerRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // Spatial indexing and performance management
  const spatialIndexRef = useRef<QuadTreeSpatialIndex | null>(null);
  const performanceManagerRef = useRef<PerformanceManager | null>(null);
  const viewportManagerRef = useRef<ViewportManager | null>(null);
  const memoryPoolsRef = useRef<MemoryPools | null>(null);
  
  // Advanced systems - Phase 1b-1f
  const bezierFitterRef = useRef<BezierCurveFitter | null>(null);
  const pressureHandlerRef = useRef<PressureSensitivityHandler | null>(null);
  const shapeRecognizerRef = useRef<ShapeRecognizer | null>(null);
  const fileManagerRef = useRef<FileFormatManagerImpl | null>(null);
  const renderingBackendRef = useRef<RenderingBackendImpl | null>(null);
  const hybridRendererRef = useRef<HybridRendererImpl | null>(null);
  const exportEngineRef = useRef<AdvancedExportEngineImpl | null>(null);
  const benchmarkSuiteRef = useRef<PerformanceBenchmarkSuite | null>(null);
  const memoryPoolManagerRef = useRef<WhiteboardMemoryPoolManager | null>(null);

  // Initialize performance systems
  useEffect(() => {
    // Initialize spatial index with default bounds (will be updated when container size is set)
    const initialBounds = { x: -10000, y: -10000, width: 20000, height: 20000 };
    spatialIndexRef.current = new QuadTreeSpatialIndex(initialBounds);
    performanceManagerRef.current = new PerformanceManager();
    viewportManagerRef.current = new ViewportManager(whiteboardState.viewport);
    memoryPoolsRef.current = new MemoryPools();

    // Initialize advanced systems - Phase 1b-1f
    bezierFitterRef.current = new BezierCurveFitter();
    pressureHandlerRef.current = new PressureSensitivityHandler();
    shapeRecognizerRef.current = new ShapeRecognizer();
    fileManagerRef.current = new FileFormatManagerImpl();
    renderingBackendRef.current = new RenderingBackendImpl('canvas2d');
    hybridRendererRef.current = new HybridRendererImpl();
    exportEngineRef.current = new AdvancedExportEngineImpl();
    benchmarkSuiteRef.current = new PerformanceBenchmarkSuite();
    memoryPoolManagerRef.current = new WhiteboardMemoryPoolManager();

    // Initialize rendering backend
    renderingBackendRef.current.initialize();

    // Populate spatial index with existing elements
    whiteboardState.elements.forEach(element => {
      spatialIndexRef.current?.insert(element);
    });
  }, []);

  // Update viewport manager when viewport changes
  useEffect(() => {
    if (viewportManagerRef.current) {
      viewportManagerRef.current.updateViewport(whiteboardState.viewport);
    }
  }, [whiteboardState.viewport]);

  // Update performance metrics when elements change
  useEffect(() => {
    if (performanceManagerRef.current) {
      performanceManagerRef.current.updateElementCount(whiteboardState.elements.length);
      if (spatialIndexRef.current) {
        const stats = spatialIndexRef.current.getStats();
        performanceManagerRef.current.updateQuadTreeDepth(stats.maxDepth);
      }
    }
  }, [whiteboardState.elements.length]);

  // Auto-save setup
  const autoSave = useAutoSave<WhiteboardState>({
    contentType: 'canvas',
    contentId: whiteboardState.id,
    saveHandler: async (data) => {
      if (onSave) {
        await onSave(data);
        return true;
      }
      return false;
    },
    debounceMs: 1000,
    enableOptimisticUpdates: true
  });

  // Update whiteboard with history tracking
  const updateWhiteboardState = useCallback((
    updater: (prev: WhiteboardState) => WhiteboardState,
    historyEntry?: Omit<WhiteboardHistoryEntry, 'id' | 'timestamp'>
  ) => {
    setWhiteboardState(prev => {
      const newState = updater(prev);
      
      if (historyEntry) {
        const entry: WhiteboardHistoryEntry = {
          ...historyEntry,
          id: `history-${Date.now()}`,
          timestamp: new Date().toISOString()
        };

        const newUndoStack = [...prev.history.undoStack, entry];
        if (newUndoStack.length > maxHistoryEntries) {
          newUndoStack.shift();
        }

        newState.history = {
          ...newState.history,
          undoStack: newUndoStack,
          redoStack: []
        };
      }

      newState.updatedAt = new Date().toISOString();
      
      if (enableAutoSave) {
        autoSave.autoSave(newState);
      }

      return newState;
    });
  }, [maxHistoryEntries, enableAutoSave, autoSave]);

  // Tool operations
  const setActiveTool = useCallback((tool: WhiteboardToolType) => {
    setToolState(prev => ({ ...prev, activeTool: tool }));
  }, []);

  // Element operations
  const createElement = useCallback((
    type: WhiteboardToolType, 
    position: WhiteboardPoint, 
    options: any = {}
  ) => {
    let newElement: AnyWhiteboardElement;

    switch (type) {
      case 'sticky-note':
        newElement = WhiteboardElementFactory.createStickyNote(
          position,
          options.content || 'New sticky note',
          options.color || toolState.toolOptions.stickyNote.color
        );
        break;
      case 'text':
        newElement = WhiteboardElementFactory.createTextBox(
          position,
          options.content || 'Enter text...',
          options.font || toolState.toolOptions.text.font
        );
        break;
      case 'shape':
        newElement = WhiteboardElementFactory.createShape(
          position,
          options.shapeType || toolState.toolOptions.shape.shapeType,
          options.size || { width: 100, height: 100 }
        );
        break;
      case 'arrow':
        newElement = WhiteboardElementFactory.createArrow(
          position,
          options.endPoint || { x: position.x + 100, y: position.y }
        );
        break;
      case 'frame':
        newElement = WhiteboardElementFactory.createFrame(
          position,
          options.size || { width: 300, height: 200 },
          options.title || 'Frame'
        );
        break;
      default:
        return;
    }

    updateWhiteboardState(
      prev => ({
        ...prev,
        elements: [...prev.elements, newElement]
      }),
      {
        type: 'create',
        description: `Created ${type}`,
        elements: { after: [newElement] }
      }
    );

    // Add to spatial index
    spatialIndexRef.current?.insert(newElement);

    // Auto-select the new element
    selectElement(newElement.id);
  }, [toolState.toolOptions, updateWhiteboardState]);

  const updateElement = useCallback((
    elementId: string,
    updates: Record<string, any>
  ) => {
    updateWhiteboardState(
      prev => {
        const elementIndex = prev.elements.findIndex(el => el.id === elementId);
        if (elementIndex === -1) return prev;

        const oldElement = prev.elements[elementIndex];
        const newElement = { ...oldElement, ...updates, updatedAt: new Date().toISOString() } as AnyWhiteboardElement;
        const newElements = [...prev.elements];
        newElements[elementIndex] = newElement;

        // Update spatial index
        spatialIndexRef.current?.update(newElement);

        return { ...prev, elements: newElements };
      },
      {
        type: 'update',
        description: `Updated element`,
        elements: {
          before: whiteboardState.elements.filter(el => el.id === elementId),
          after: whiteboardState.elements.filter(el => el.id === elementId).map(el => ({ ...el, ...updates } as AnyWhiteboardElement))
        }
      }
    );
  }, [updateWhiteboardState, whiteboardState.elements]);

  const deleteElement = useCallback((elementId: string) => {
    const elementToDelete = whiteboardState.elements.find(el => el.id === elementId);
    if (!elementToDelete) return;

    updateWhiteboardState(
      prev => ({
        ...prev,
        elements: prev.elements.filter(el => el.id !== elementId),
        selection: {
          ...prev.selection,
          elementIds: prev.selection.elementIds.filter(id => id !== elementId)
        }
      }),
      {
        type: 'delete',
        description: `Deleted element`,
        elements: { before: [elementToDelete] }
      }
    );

    // Remove from spatial index
    spatialIndexRef.current?.remove(elementId);
  }, [whiteboardState.elements, updateWhiteboardState]);

  const duplicateElement = useCallback((elementId: string) => {
    const originalElement = whiteboardState.elements.find(el => el.id === elementId);
    if (!originalElement) return;

    const newElement: AnyWhiteboardElement = {
      ...originalElement,
      id: `${originalElement.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: originalElement.position.x + 20,
        y: originalElement.position.y + 20
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateWhiteboardState(
      prev => ({
        ...prev,
        elements: [...prev.elements, newElement]
      }),
      {
        type: 'create',
        description: `Duplicated element`,
        elements: { after: [newElement] }
      }
    );

    // Add to spatial index
    spatialIndexRef.current?.insert(newElement);

    selectElement(newElement.id);
  }, [whiteboardState.elements, updateWhiteboardState]);

  const moveElements = useCallback((elementIds: string[], delta: WhiteboardPoint) => {
    if (elementIds.length === 0) return;

    const elementsToMove = whiteboardState.elements.filter(el => elementIds.includes(el.id));
    
    updateWhiteboardState(
      prev => ({
        ...prev,
        elements: prev.elements.map(element => 
          elementIds.includes(element.id)
            ? {
                ...element,
                position: {
                  x: element.position.x + delta.x,
                  y: element.position.y + delta.y
                },
                updatedAt: new Date().toISOString()
              }
            : element
        )
      }),
      {
        type: 'move',
        description: `Moved ${elementIds.length} element(s)`,
        elements: {
          before: elementsToMove,
          after: elementsToMove.map(el => ({
            ...el,
            position: { x: el.position.x + delta.x, y: el.position.y + delta.y }
          }))
        }
      }
    );
  }, [whiteboardState.elements, updateWhiteboardState]);

  // Selection operations
  const selectElement = useCallback((elementId: string, addToSelection = false) => {
    setWhiteboardState(prev => {
      const newElementIds = addToSelection && prev.selection.elementIds.includes(elementId)
        ? prev.selection.elementIds.filter(id => id !== elementId)
        : addToSelection
        ? [...prev.selection.elementIds, elementId]
        : [elementId];

      const selectedElements = prev.elements.filter(el => newElementIds.includes(el.id));
      const bounds = WhiteboardCoordinates.getSelectionBounds(selectedElements);

      return {
        ...prev,
        selection: {
          ...prev.selection,
          elementIds: newElementIds,
          bounds: bounds || undefined
        }
      };
    });
  }, []);

  const selectElements = useCallback((elementIds: string[]) => {
    setWhiteboardState(prev => {
      const selectedElements = prev.elements.filter(el => elementIds.includes(el.id));
      const bounds = WhiteboardCoordinates.getSelectionBounds(selectedElements);

      return {
        ...prev,
        selection: {
          ...prev.selection,
          elementIds,
          bounds: bounds || undefined
        }
      };
    });
  }, []);

  const selectElementsInBounds = useCallback((bounds: WhiteboardBounds) => {
    const elementsInBounds = SelectionUtils.getElementsInBounds(whiteboardState.elements, bounds);
    selectElements(elementsInBounds.map(el => el.id));
  }, [whiteboardState.elements, selectElements]);

  const clearSelection = useCallback(() => {
    setWhiteboardState(prev => ({
      ...prev,
      selection: {
        ...prev.selection,
        elementIds: [],
        bounds: undefined
      }
    }));
  }, []);

  const selectAll = useCallback(() => {
    selectElements(whiteboardState.elements.map(el => el.id));
  }, [whiteboardState.elements, selectElements]);

  // Viewport operations
  const setViewport = useCallback((viewport: Partial<WhiteboardViewport>) => {
    setWhiteboardState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, ...viewport }
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setViewport({ zoom: Math.min(3, whiteboardState.viewport.zoom * 1.2) });
  }, [whiteboardState.viewport.zoom, setViewport]);

  const zoomOut = useCallback(() => {
    setViewport({ zoom: Math.max(0.1, whiteboardState.viewport.zoom / 1.2) });
  }, [whiteboardState.viewport.zoom, setViewport]);

  const resetZoom = useCallback(() => {
    setViewport({ zoom: 1, x: 0, y: 0 });
  }, [setViewport]);

  const zoomToFit = useCallback(() => {
    if (whiteboardState.elements.length === 0) return;

    const bounds = WhiteboardCoordinates.getSelectionBounds(whiteboardState.elements);
    if (!bounds) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current;
    const padding = 50;

    const scaleX = (containerWidth - padding * 2) / bounds.width;
    const scaleY = (containerHeight - padding * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1);

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    setViewport({
      zoom: scale,
      x: containerWidth / 2 - centerX * scale,
      y: containerHeight / 2 - centerY * scale
    });
  }, [whiteboardState.elements, setViewport]);

  const zoomToSelection = useCallback(() => {
    if (whiteboardState.selection.elementIds.length === 0) return;

    const selectedElements = whiteboardState.elements.filter(el => 
      whiteboardState.selection.elementIds.includes(el.id)
    );
    const bounds = WhiteboardCoordinates.getSelectionBounds(selectedElements);
    if (!bounds) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current;
    const padding = 50;

    const scaleX = (containerWidth - padding * 2) / bounds.width;
    const scaleY = (containerHeight - padding * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY, 2);

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    setViewport({
      zoom: scale,
      x: containerWidth / 2 - centerX * scale,
      y: containerHeight / 2 - centerY * scale
    });
  }, [whiteboardState.elements, whiteboardState.selection.elementIds, setViewport]);

  const panTo = useCallback((position: WhiteboardPoint) => {
    const { width: containerWidth, height: containerHeight } = containerRef.current;
    setViewport({
      x: containerWidth / 2 - position.x * whiteboardState.viewport.zoom,
      y: containerHeight / 2 - position.y * whiteboardState.viewport.zoom
    });
  }, [whiteboardState.viewport.zoom, setViewport]);

  // History operations
  const undo = useCallback(() => {
    setWhiteboardState(prev => {
      if (prev.history.undoStack.length === 0) return prev;

      const lastEntry = prev.history.undoStack[prev.history.undoStack.length - 1];
      const newUndoStack = prev.history.undoStack.slice(0, -1);
      const newRedoStack = [...prev.history.redoStack, lastEntry];

      // Apply the undo operation
      let newElements = [...prev.elements];
      
      if (lastEntry.elements.before && lastEntry.type === 'delete') {
        newElements = [...newElements, ...(lastEntry.elements.before as AnyWhiteboardElement[])];
      } else if (lastEntry.elements.after && lastEntry.type === 'create') {
        const idsToRemove = lastEntry.elements.after.map(el => el.id).filter(Boolean);
        newElements = newElements.filter(el => !idsToRemove.includes(el.id));
      } else if (lastEntry.elements.before && lastEntry.type === 'update') {
        newElements = newElements.map(el => {
          const beforeElement = lastEntry.elements.before?.find(b => b && b.id === el.id);
          return beforeElement ? { ...el, ...beforeElement } as AnyWhiteboardElement : el;
        });
      }

      return {
        ...prev,
        elements: newElements,
        history: {
          ...prev.history,
          undoStack: newUndoStack,
          redoStack: newRedoStack
        },
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const redo = useCallback(() => {
    setWhiteboardState(prev => {
      if (prev.history.redoStack.length === 0) return prev;

      const nextEntry = prev.history.redoStack[prev.history.redoStack.length - 1];
      const newRedoStack = prev.history.redoStack.slice(0, -1);
      const newUndoStack = [...prev.history.undoStack, nextEntry];

      // Apply the redo operation
      let newElements = [...prev.elements];
      
      if (nextEntry.elements.after && nextEntry.type === 'create') {
        newElements = [...newElements, ...(nextEntry.elements.after as AnyWhiteboardElement[])];
      } else if (nextEntry.elements.before && nextEntry.type === 'delete') {
        const idsToRemove = nextEntry.elements.before.map(el => el.id).filter(Boolean);
        newElements = newElements.filter(el => !idsToRemove.includes(el.id));
      } else if (nextEntry.elements.after && nextEntry.type === 'update') {
        newElements = newElements.map(el => {
          const afterElement = nextEntry.elements.after?.find(a => a && a.id === el.id);
          return afterElement ? { ...el, ...afterElement } as AnyWhiteboardElement : el;
        });
      }

      return {
        ...prev,
        elements: newElements,
        history: {
          ...prev.history,
          undoStack: newUndoStack,
          redoStack: newRedoStack
        },
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  // Utility functions
  const screenToCanvas = useCallback((screenPoint: WhiteboardPoint): WhiteboardPoint => {
    return WhiteboardCoordinates.screenToCanvas(screenPoint, whiteboardState.viewport);
  }, [whiteboardState.viewport]);

  const canvasToScreen = useCallback((canvasPoint: WhiteboardPoint): WhiteboardPoint => {
    return WhiteboardCoordinates.canvasToScreen(canvasPoint, whiteboardState.viewport);
  }, [whiteboardState.viewport]);

  const getElementAtPoint = useCallback((point: WhiteboardPoint): AnyWhiteboardElement | null => {
    // Use spatial index for faster lookup
    if (spatialIndexRef.current) {
      const candidates = spatialIndexRef.current.queryPoint(point);
      return SelectionUtils.getElementAtPoint(candidates, point);
    }
    return SelectionUtils.getElementAtPoint(whiteboardState.elements, point);
  }, [whiteboardState.elements]);

  const getVisibleElements = useCallback((): AnyWhiteboardElement[] => {
    // Use enhanced viewport manager with spatial indexing
    if (viewportManagerRef.current && spatialIndexRef.current) {
      return viewportManagerRef.current.getVisibleElements(
        spatialIndexRef.current,
        containerRef.current
      );
    }
    return WhiteboardPerformance.getVisibleElements(
      whiteboardState.elements,
      whiteboardState.viewport,
      containerRef.current
    );
  }, [whiteboardState.elements, whiteboardState.viewport]);

  // Settings
  const updateSettings = useCallback((settings: Partial<WhiteboardSettings>) => {
    setWhiteboardState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
      updatedAt: new Date().toISOString()
    }));
  }, []);

  // Export/Import
  const exportState = useCallback((): WhiteboardState => {
    return whiteboardState;
  }, [whiteboardState]);

  const importState = useCallback((state: Partial<WhiteboardState>) => {
    setWhiteboardState(prev => ({
      ...prev,
      ...state,
      updatedAt: new Date().toISOString()
    }));
  }, []);

  // Update container size when needed
  const updateContainerSize = useCallback((width: number, height: number) => {
    containerRef.current = { width, height };
    setWhiteboardState(prev => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        bounds: { x: 0, y: 0, width, height }
      }
    }));

    // Update spatial index bounds if needed
    if (spatialIndexRef.current) {
      const newBounds = { x: -width, y: -height, width: width * 2, height: height * 2 };
      spatialIndexRef.current = new QuadTreeSpatialIndex(newBounds);
      // Repopulate with elements
      whiteboardState.elements.forEach(element => {
        spatialIndexRef.current?.insert(element);
      });
    }
  }, [whiteboardState.elements]);

  // Performance and spatial indexing methods
  const getPerformanceMetrics = useCallback(() => {
    return performanceManagerRef.current?.getMetrics() || {
      renderTime: 0,
      interactionLatency: 0,
      memoryUsage: 0,
      elementCount: whiteboardState.elements.length,
      quadTreeDepth: 0,
      viewportCulledElements: 0,
      spatialQueryTime: 0,
      lastFrameTime: 0,
      frameRate: 60
    };
  }, [whiteboardState.elements.length]);

  const getQuadTreeStats = useCallback(() => {
    return spatialIndexRef.current?.getStats() || {
      totalNodes: 0,
      leafNodes: 0,
      maxDepth: 0,
      totalElements: 0,
      averageElementsPerNode: 0,
      memoryUsage: 0
    };
  }, []);

  const rebuildSpatialIndex = useCallback(() => {
    if (spatialIndexRef.current) {
      spatialIndexRef.current.rebuild(whiteboardState.elements);
    }
  }, [whiteboardState.elements]);

  const getViewportCullingStats = useCallback(() => {
    if (viewportManagerRef.current) {
      const visibleElements = getVisibleElements();
      return viewportManagerRef.current.cullingStats(
        whiteboardState.elements.length,
        visibleElements
      );
    }
    return {
      totalElements: whiteboardState.elements.length,
      visibleElements: whiteboardState.elements.length,
      culledElements: 0,
      lodReductions: 0,
      renderTimeSaved: 0
    };
  }, [whiteboardState.elements, getVisibleElements]);

  const getElementLOD = useCallback((elementId: string) => {
    const element = whiteboardState.elements.find(el => el.id === elementId);
    if (element && viewportManagerRef.current) {
      return viewportManagerRef.current.getElementLOD(element);
    }
    return 'full' as import('../lib/whiteboard-types').ElementLOD;
  }, [whiteboardState.elements]);

  // Advanced Drawing Tools - Phase 1b Methods
  const fitCurveToPoints = useCallback((points: WhiteboardPoint[], tolerance?: number) => {
    return bezierFitterRef.current?.fitCurve(points, tolerance) || [];
  }, []);

  const recognizeDrawnShape = useCallback((points: WhiteboardPoint[]) => {
    return shapeRecognizerRef.current?.recognizeShape(points) || null;
  }, []);

  // File Format & Compression - Phase 1c Methods
  const compressCanvas = useCallback(async (): Promise<ArrayBuffer> => {
    if (fileManagerRef.current) {
      return fileManagerRef.current.compress(whiteboardState);
    }
    throw new Error('File manager not initialized');
  }, [whiteboardState]);

  const loadFromCompressed = useCallback(async (data: ArrayBuffer): Promise<void> => {
    if (fileManagerRef.current) {
      const state = await fileManagerRef.current.decompress(data);
      importState(state);
    }
  }, []);

  // GPU Rendering - Phase 1d Methods
  const switchRenderingBackend = useCallback(async (type: 'dom' | 'canvas2d' | 'webgl' | 'webgpu'): Promise<boolean> => {
    const newBackend = new RenderingBackendImpl(type);
    const success = await newBackend.initialize();
    if (success) {
      renderingBackendRef.current?.dispose();
      renderingBackendRef.current = newBackend;
      return true;
    }
    return false;
  }, []);

  // Advanced Export - Phase 1e Methods
  const exportAdvanced = useCallback(async (options: import('../lib/whiteboard-types').AdvancedExportOptions): Promise<Blob | string | ArrayBuffer> => {
    if (!exportEngineRef.current) {
      throw new Error('Export engine not initialized');
    }

    const elementsToExport = options.bounds
      ? whiteboardState.elements.filter(element => {
          const elementBounds = WhiteboardCoordinates.getElementBounds(element);
          return WhiteboardCoordinates.boundsIntersect(elementBounds, options.bounds!);
        })
      : whiteboardState.elements;

    switch (options.format) {
      case 'svg':
        return exportEngineRef.current.exportToSVG(elementsToExport, options);
      case 'png':
        return exportEngineRef.current.exportToPNG(elementsToExport, options);
      case 'pdf':
        return exportEngineRef.current.exportToPDF(elementsToExport, options);
      case 'json':
        return exportEngineRef.current.exportToJSON(whiteboardState, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }, [whiteboardState]);

  const exportMultipleFormats = useCallback(async (formats: import('../lib/whiteboard-types').AdvancedExportOptions[]): Promise<Map<string, import('../lib/whiteboard-types').ExportResult>> => {
    if (!exportEngineRef.current) {
      throw new Error('Export engine not initialized');
    }

    const elements = whiteboardState.elements;
    return exportEngineRef.current.exportMultipleFormats(elements, formats);
  }, [whiteboardState.elements]);

  // Performance Benchmarking - Phase 1f Methods
  const runPerformanceBenchmark = useCallback(async (): Promise<import('../lib/whiteboard-types').PerformanceBenchmark> => {
    if (!benchmarkSuiteRef.current) {
      throw new Error('Benchmark suite not initialized');
    }
    return benchmarkSuiteRef.current.runBenchmark(whiteboardState.elements);
  }, [whiteboardState.elements]);

  // Enhanced Memory Management Methods
  const getMemoryPoolStats = useCallback(() => {
    return memoryPoolManagerRef.current?.getOverallStats() || {};
  }, []);

  const optimizeMemoryUsage = useCallback(() => {
    // Trigger garbage collection on memory pools
    memoryPoolManagerRef.current?.clearAll();
    
    // Rebuild spatial index for optimal performance
    rebuildSpatialIndex();
    
    // Log optimization
    console.log('Memory optimization completed');
  }, []);

  // Computed values
  const canUndo = whiteboardState.history.undoStack.length > 0;
  const canRedo = whiteboardState.history.redoStack.length > 0;

  return {
    // State
    whiteboardState,
    toolState,
    viewport: whiteboardState.viewport,
    selection: whiteboardState.selection,
    history: whiteboardState.history,
    
    // Actions
    setActiveTool,
    
    // Element operations
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,
    moveElements,
    
    // Selection operations
    selectElement,
    selectElements,
    selectElementsInBounds,
    clearSelection,
    selectAll,
    
    // Viewport operations
    setViewport,
    zoomIn,
    zoomOut,
    zoomToFit,
    zoomToSelection,
    resetZoom,
    panTo,
    
    // History operations
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Utility functions
    screenToCanvas,
    canvasToScreen,
    getElementAtPoint,
    getVisibleElements,
    
    // Settings
    updateSettings,
    
    // Export/Import
    exportState,
    importState,
    
    // Internal utilities
    updateContainerSize,
    
    // Performance and spatial indexing
    getPerformanceMetrics,
    getQuadTreeStats,
    rebuildSpatialIndex,
    
    // Enhanced viewport management
    getViewportCullingStats,
    getElementLOD,
    
    // Advanced Drawing Tools - Phase 1b
    bezierFitter: bezierFitterRef.current!,
    pressureHandler: pressureHandlerRef.current!,
    shapeRecognizer: shapeRecognizerRef.current!,
    fitCurveToPoints,
    recognizeDrawnShape,
    
    // File Format & Compression - Phase 1c
    fileManager: fileManagerRef.current!,
    compressCanvas,
    loadFromCompressed,
    
    // GPU Rendering - Phase 1d
    renderingBackend: renderingBackendRef.current!,
    hybridRenderer: hybridRendererRef.current!,
    switchRenderingBackend,
    
    // Advanced Export - Phase 1e
    exportEngine: exportEngineRef.current!,
    exportAdvanced,
    exportMultipleFormats,
    
    // Performance Benchmarking - Phase 1f
    benchmarkSuite: benchmarkSuiteRef.current!,
    runPerformanceBenchmark,
    
    // Enhanced Memory Management
    memoryPoolManager: memoryPoolManagerRef.current!,
    getMemoryPoolStats,
    optimizeMemoryUsage
  };
}