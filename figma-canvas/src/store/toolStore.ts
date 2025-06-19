import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { 
  ToolType, 
  ToolState, 
  DrawingState, 
  TextEditingState, 
  TableEditingState, 
  ConnectorState, 
  SelectionState,
  DEFAULT_TOOLS,
  Tool,
  ToolConfig
} from '../types/tools';
import { Point } from '../types/canvas';

interface ToolStore extends ToolState {
  // Tool management
  setTool: (tool: ToolType) => void;
  setPreviousTool: () => void;
  getToolConfig: (tool: ToolType) => ToolConfig;
  updateToolConfig: (tool: ToolType, config: Partial<ToolConfig>) => void;
  
  // Drawing state
  drawingState: DrawingState;
  setDrawingState: (state: Partial<DrawingState>) => void;
  startDrawing: (point: Point, pressure?: number) => void;
  updateDrawing: (point: Point, pressure?: number) => void;
  endDrawing: () => void;
  
  // Text editing state
  textEditingState: TextEditingState;
  setTextEditingState: (state: Partial<TextEditingState>) => void;
  startTextEditing: (elementId: string, content: any) => void;
  updateTextContent: (content: any) => void;
  updateTextSelection: (selection: any) => void;
  setTextToolbarPosition: (position: Point) => void;
  endTextEditing: () => void;
  
  // Table editing state
  tableEditingState: TableEditingState;
  setTableEditingState: (state: Partial<TableEditingState>) => void;
  startTableEditing: (elementId: string) => void;
  selectTableCell: (row: number, col: number) => void;
  selectTableCells: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
  startTableResize: (handle: 'row' | 'col', index: number) => void;
  endTableEditing: () => void;
  
  // Connector state
  connectorState: ConnectorState;
  setConnectorState: (state: Partial<ConnectorState>) => void;
  startConnecting: (elementId?: string) => void;
  updateConnectorPreview: (path: Point[]) => void;
  setHoveredConnectionPoint: (pointId?: string) => void;
  endConnecting: () => void;
  
  // Selection state
  selectionState: SelectionState;
  setSelectionState: (state: Partial<SelectionState>) => void;
  startSelecting: (point: Point) => void;
  updateSelectionBox: (startPoint: Point, currentPoint: Point) => void;
  startDragging: (offset: Point, initialBounds: Record<string, { x: number; y: number; width: number; height: number }>) => void;
  startResizing: (handle: string, initialBounds: Record<string, { x: number; y: number; width: number; height: number }>) => void;
  endSelection: () => void;
  
  // Tool utilities
  getActiveTool: () => Tool | undefined;
  isDrawingTool: (tool: ToolType) => boolean;
  isShapeTool: (tool: ToolType) => boolean;
  isTextTool: (tool: ToolType) => boolean;
  shouldAutoSwitchToSelect: (tool: ToolType) => boolean;
  
  // Keyboard shortcuts
  handleKeyboardShortcut: (key: string, modifiers: string[]) => boolean;
  
  // Tool state reset
  resetAllStates: () => void;
  resetDrawingState: () => void;
  resetTextEditingState: () => void;
  resetTableEditingState: () => void;
  resetConnectorState: () => void;
  resetSelectionState: () => void;
}

const initialDrawingState: DrawingState = {
  isDrawing: false,
  startPoint: { x: 0, y: 0 },
  currentPoint: { x: 0, y: 0 },
  previewPoints: [],
  pressure: 1,
  strokeWidth: 2
};

const initialTextEditingState: TextEditingState = {
  isEditing: false,
  elementId: undefined,
  content: undefined,
  selection: undefined,
  toolbarPosition: undefined,
  toolbarVisible: false
};

const initialTableEditingState: TableEditingState = {
  isEditing: false,
  elementId: undefined,
  selectedCell: undefined,
  selectedCells: undefined,
  isResizing: false,
  resizeHandle: undefined,
  resizeIndex: undefined
};

const initialConnectorState: ConnectorState = {
  isConnecting: false,
  startElementId: undefined,
  endElementId: undefined,
  previewPath: undefined,
  hoveredConnectionPoint: undefined,
  snappedToElement: false
};

const initialSelectionState: SelectionState = {
  isSelecting: false,
  selectionBox: undefined,
  isDragging: false,
  isResizing: false,
  resizeHandle: undefined,
  dragOffset: { x: 0, y: 0 },
  initialBounds: {}
};

// Create default tool configs
const createDefaultToolConfigs = (): Record<ToolType, ToolConfig> => {
  const configs: Record<ToolType, ToolConfig> = {} as any;
  
  DEFAULT_TOOLS.forEach(tool => {
    configs[tool.id] = tool.config || {};
  });
  
  return configs;
};

export const useToolStore = create<ToolStore>()(
  immer((set, get) => ({
    // Initial state
    currentTool: ToolType.SELECT,
    previousTool: ToolType.SELECT,
    isDrawing: false,
    startPoint: undefined,
    currentPoint: undefined,
    previewElement: undefined,
    toolConfig: createDefaultToolConfigs(),
    
    // State objects
    drawingState: { ...initialDrawingState },
    textEditingState: { ...initialTextEditingState },
    tableEditingState: { ...initialTableEditingState },
    connectorState: { ...initialConnectorState },
    selectionState: { ...initialSelectionState },

    // Tool management
    setTool: (tool) => {
      set((state) => {
        state.previousTool = state.currentTool;
        state.currentTool = tool;
        
        // Reset relevant states when switching tools
        if (tool !== ToolType.FREEFORM) {
          state.drawingState = { ...initialDrawingState };
        }
        if (tool !== ToolType.TEXT) {
          state.textEditingState = { ...initialTextEditingState };
        }
        if (tool !== ToolType.TABLE) {
          state.tableEditingState = { ...initialTableEditingState };
        }
        if (tool !== ToolType.CONNECTOR) {
          state.connectorState = { ...initialConnectorState };
        }
        if (tool !== ToolType.SELECT) {
          state.selectionState = { ...initialSelectionState };
        }
      });
    },

    setPreviousTool: () => {
      const { previousTool } = get();
      get().setTool(previousTool);
    },

    getToolConfig: (tool) => {
      return get().toolConfig[tool] || {};
    },

    updateToolConfig: (tool, config) => {
      set((state) => {
        state.toolConfig[tool] = { ...state.toolConfig[tool], ...config };
      });
    },

    // Drawing state
    setDrawingState: (newState) => {
      set((state) => {
        Object.assign(state.drawingState, newState);
      });
    },

    startDrawing: (point, pressure = 1) => {
      set((state) => {
        state.drawingState = {
          isDrawing: true,
          startPoint: point,
          currentPoint: point,
          previewPoints: [point],
          pressure,
          strokeWidth: state.drawingState.strokeWidth
        };
      });
    },

    updateDrawing: (point, pressure = 1) => {
      set((state) => {
        state.drawingState.currentPoint = point;
        state.drawingState.pressure = pressure;
        state.drawingState.previewPoints.push(point);
      });
    },

    endDrawing: () => {
      set((state) => {
        state.drawingState = { ...initialDrawingState };
      });
    },

    // Text editing state
    setTextEditingState: (newState) => {
      set((state) => {
        Object.assign(state.textEditingState, newState);
      });
    },

    startTextEditing: (elementId, content) => {
      set((state) => {
        state.textEditingState = {
          isEditing: true,
          elementId,
          content,
          selection: undefined,
          toolbarPosition: undefined,
          toolbarVisible: true
        };
      });
    },

    updateTextContent: (content) => {
      set((state) => {
        state.textEditingState.content = content;
      });
    },

    updateTextSelection: (selection) => {
      set((state) => {
        state.textEditingState.selection = selection;
      });
    },

    setTextToolbarPosition: (position) => {
      set((state) => {
        state.textEditingState.toolbarPosition = position;
      });
    },

    endTextEditing: () => {
      set((state) => {
        state.textEditingState = { ...initialTextEditingState };
      });
    },

    // Table editing state
    setTableEditingState: (newState) => {
      set((state) => {
        Object.assign(state.tableEditingState, newState);
      });
    },

    startTableEditing: (elementId) => {
      set((state) => {
        state.tableEditingState = {
          isEditing: true,
          elementId,
          selectedCell: undefined,
          selectedCells: undefined,
          isResizing: false,
          resizeHandle: undefined,
          resizeIndex: undefined
        };
      });
    },

    selectTableCell: (row, col) => {
      set((state) => {
        state.tableEditingState.selectedCell = { row, col };
        state.tableEditingState.selectedCells = undefined;
      });
    },

    selectTableCells: (startRow, startCol, endRow, endCol) => {
      set((state) => {
        state.tableEditingState.selectedCells = { startRow, startCol, endRow, endCol };
        state.tableEditingState.selectedCell = undefined;
      });
    },

    startTableResize: (handle, index) => {
      set((state) => {
        state.tableEditingState.isResizing = true;
        state.tableEditingState.resizeHandle = handle;
        state.tableEditingState.resizeIndex = index;
      });
    },

    endTableEditing: () => {
      set((state) => {
        state.tableEditingState = { ...initialTableEditingState };
      });
    },

    // Connector state
    setConnectorState: (newState) => {
      set((state) => {
        Object.assign(state.connectorState, newState);
      });
    },

    startConnecting: (elementId) => {
      set((state) => {
        state.connectorState = {
          isConnecting: true,
          startElementId: elementId,
          endElementId: undefined,
          previewPath: undefined,
          hoveredConnectionPoint: undefined,
          snappedToElement: false
        };
      });
    },

    updateConnectorPreview: (path) => {
      set((state) => {
        state.connectorState.previewPath = path;
      });
    },

    setHoveredConnectionPoint: (pointId) => {
      set((state) => {
        state.connectorState.hoveredConnectionPoint = pointId;
        state.connectorState.snappedToElement = !!pointId;
      });
    },

    endConnecting: () => {
      set((state) => {
        state.connectorState = { ...initialConnectorState };
      });
    },

    // Selection state
    setSelectionState: (newState) => {
      set((state) => {
        Object.assign(state.selectionState, newState);
      });
    },

    startSelecting: (point) => {
      set((state) => {
        state.selectionState = {
          isSelecting: true,
          selectionBox: {
            x: point.x,
            y: point.y,
            width: 0,
            height: 0
          },
          isDragging: false,
          isResizing: false,
          resizeHandle: undefined,
          dragOffset: { x: 0, y: 0 },
          initialBounds: {}
        };
      });
    },

    updateSelectionBox: (startPoint, currentPoint) => {
      set((state) => {
        state.selectionState.selectionBox = {
          x: Math.min(startPoint.x, currentPoint.x),
          y: Math.min(startPoint.y, currentPoint.y),
          width: Math.abs(currentPoint.x - startPoint.x),
          height: Math.abs(currentPoint.y - startPoint.y)
        };
      });
    },

    startDragging: (offset, initialBounds) => {
      set((state) => {
        state.selectionState.isDragging = true;
        state.selectionState.dragOffset = offset;
        state.selectionState.initialBounds = initialBounds;
      });
    },

    startResizing: (handle, initialBounds) => {
      set((state) => {
        state.selectionState.isResizing = true;
        state.selectionState.resizeHandle = handle;
        state.selectionState.initialBounds = initialBounds;
      });
    },

    endSelection: () => {
      set((state) => {
        state.selectionState = { ...initialSelectionState };
      });
    },

    // Tool utilities
    getActiveTool: () => {
      const { currentTool } = get();
      return DEFAULT_TOOLS.find(tool => tool.id === currentTool);
    },

    isDrawingTool: (tool) => {
      return [ToolType.FREEFORM, ToolType.LINE].includes(tool);
    },

    isShapeTool: (tool) => {
      return [
        ToolType.RECTANGLE,
        ToolType.CIRCLE,
        ToolType.TRIANGLE,
        ToolType.ARROW
      ].includes(tool);
    },

    isTextTool: (tool) => {
      return [ToolType.TEXT, ToolType.STICKY_NOTE].includes(tool);
    },

    shouldAutoSwitchToSelect: (tool) => {
      const config = get().getToolConfig(tool);
      return config.autoSwitchToSelect || false;
    },

    // Keyboard shortcuts
    handleKeyboardShortcut: (key, modifiers) => {
      const shortcuts: Record<string, ToolType> = {
        'v': ToolType.SELECT,
        't': ToolType.TEXT,
        'r': ToolType.RECTANGLE,
        'c': ToolType.CIRCLE,
        'l': ToolType.LINE,
        'p': ToolType.FREEFORM,
        's': ToolType.STICKY_NOTE,
        'h': ToolType.PAN,
        'z': ToolType.ZOOM,
        'i': ToolType.IMAGE
      };

      const tool = shortcuts[key.toLowerCase()];
      if (tool && modifiers.length === 0) {
        get().setTool(tool);
        return true;
      }

      return false;
    },

    // State resets
    resetAllStates: () => {
      set((state) => {
        state.drawingState = { ...initialDrawingState };
        state.textEditingState = { ...initialTextEditingState };
        state.tableEditingState = { ...initialTableEditingState };
        state.connectorState = { ...initialConnectorState };
        state.selectionState = { ...initialSelectionState };
      });
    },

    resetDrawingState: () => {
      set((state) => {
        state.drawingState = { ...initialDrawingState };
      });
    },

    resetTextEditingState: () => {
      set((state) => {
        state.textEditingState = { ...initialTextEditingState };
      });
    },

    resetTableEditingState: () => {
      set((state) => {
        state.tableEditingState = { ...initialTableEditingState };
      });
    },

    resetConnectorState: () => {
      set((state) => {
        state.connectorState = { ...initialConnectorState };
      });
    },

    resetSelectionState: () => {
      set((state) => {
        state.selectionState = { ...initialSelectionState };
      });
    }
  }))
);

// Custom hooks for specific tool states
export const useDrawingTool = () => {
  const store = useToolStore();
  return {
    isDrawing: store.drawingState.isDrawing,
    startDrawing: store.startDrawing,
    updateDrawing: store.updateDrawing,
    endDrawing: store.endDrawing,
    drawingState: store.drawingState
  };
};

export const useTextTool = () => {
  const store = useToolStore();
  return {
    isEditing: store.textEditingState.isEditing,
    startTextEditing: store.startTextEditing,
    updateTextContent: store.updateTextContent,
    updateTextSelection: store.updateTextSelection,
    setTextToolbarPosition: store.setTextToolbarPosition,
    endTextEditing: store.endTextEditing,
    textEditingState: store.textEditingState
  };
};

export const useTableTool = () => {
  const store = useToolStore();
  return {
    isEditing: store.tableEditingState.isEditing,
    startTableEditing: store.startTableEditing,
    selectTableCell: store.selectTableCell,
    selectTableCells: store.selectTableCells,
    startTableResize: store.startTableResize,
    endTableEditing: store.endTableEditing,
    tableEditingState: store.tableEditingState
  };
};

export const useConnectorTool = () => {
  const store = useToolStore();
  return {
    isConnecting: store.connectorState.isConnecting,
    startConnecting: store.startConnecting,
    updateConnectorPreview: store.updateConnectorPreview,
    setHoveredConnectionPoint: store.setHoveredConnectionPoint,
    endConnecting: store.endConnecting,
    connectorState: store.connectorState
  };
};

export const useSelectionTool = () => {
  const store = useToolStore();
  return {
    isSelecting: store.selectionState.isSelecting,
    startSelecting: store.startSelecting,
    updateSelectionBox: store.updateSelectionBox,
    startDragging: store.startDragging,
    startResizing: store.startResizing,
    endSelection: store.endSelection,
    selectionState: store.selectionState
  };
};
