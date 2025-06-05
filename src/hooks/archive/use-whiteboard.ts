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
  WhiteboardPerformance
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

  // Auto-save setup
  const autoSave = useAutoSave<WhiteboardState>({
    contentType: 'whiteboard',
    contentId: whiteboardState.id,
    saveHandler: onSave || (async () => false),
    debounceMs: 1000,
    enableOptimisticUpdates: true
  });

  // Add history entry
  const addHistoryEntry = useCallback((entry: Omit<WhiteboardHistoryEntry, 'id' | 'timestamp'>) => {
    setWhiteboardState(prev => {
      const newEntry: WhiteboardHistoryEntry = {
        ...entry,
        id: `history-${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      const newUndoStack = [...prev.history.undoStack, newEntry];
      if (newUndoStack.length > maxHistoryEntries) {
        newUndoStack.shift();
      }

      return {
        ...prev,
        history: {
          ...prev.history,
          undoStack: newUndoStack,
          redoStack: [] // Clear redo stack on new action
        },
        updatedAt: new Date().toISOString()
      };
    });
  }, [maxHistoryEntries]);

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

    // Auto-select the new element
    selectElement(newElement.id);
  }, [toolState.toolOptions, updateWhiteboardState]);

  const updateElement = useCallback((
    elementId: string, 
    updates: Partial<AnyWhiteboardElement>
  ) => {
    updateWhiteboardState(
      prev => {
        const elementIndex = prev.elements.findIndex(el => el.id === elementId);
        if (elementIndex === -1) return prev;

        const oldElement = prev.elements[elementIndex];
        const newElement = { ...oldElement, ...updates, updatedAt: new Date().toISOString() };
        const newElements = [...prev.elements];
        newElements[elementIndex] = newElement;

        return { ...prev, elements: newElements };
      },
      {
        type: 'update',
        description: `Updated element`,
        elements: {
          before: [whiteboardState.elements.find(el => el.id === elementId)].filter(Boolean),
          after: [{ ...whiteboardState.elements.find(el => el.id === elementId), ...updates }].filter(Boolean)
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
          bounds
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
          bounds
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
        newElements = [...newElements, ...lastEntry.elements.before];
      } else if (lastEntry.elements.after && lastEntry.type === 'create') {
        const idsToRemove = lastEntry.elements.after.map(el => el.id);
        newElements = newElements.filter(el => !idsToRemove.includes(el.id));
      } else if (lastEntry.elements.before && lastEntry.type === 'update') {
        newElements = newElements.map(el => {
          const beforeElement = lastEntry.elements.before?.find(b => b.id === el.id);
          return beforeElement ? { ...el, ...beforeElement } : el;
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
        newElements = [...newElements, ...nextEntry.elements.after];
      } else if (nextEntry.elements.before && nextEntry.type === 'delete') {
        const idsToRemove = nextEntry.elements.before.map(el => el.id);
        newElements = newElements.filter(el => !idsToRemove.includes(el.id));
      } else if (nextEntry.elements.after && nextEntry.type === 'update') {
        newElements = newElements.map(el => {
          const afterElement = nextEntry.elements.after?.find(a => a.id === el.id);
          return afterElement ? { ...el, ...afterElement } : el;
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
    return SelectionUtils.getElementAtPoint(whiteboardState.elements, point);
  }, [whiteboardState.elements]);

  const getVisibleElements = useCallback((): AnyWhiteboardElement[] => {
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

  // Computed values
  const canUndo = whiteboardState.history.undoStack.length > 0;
  const canRedo = whiteboardState.history.redoStack.length > 0;

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
  }, []);

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
    
    // Internal
    updateContainerSize
  };
}