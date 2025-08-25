import { nanoid } from 'nanoid';
import { 
  MarkerConfig, 
  HighlighterConfig, 
  EraserConfig 
} from '../../types/drawing.types';
import { StoreModule, StoreSet, StoreGet } from './types';

/**
 * Drawing module state
 */
export interface DrawingState {
  isDrawing: boolean;
  currentPath?: number[];
  drawingTool: 'pen' | 'marker' | 'highlighter' | null;
  drawingStartPoint: { x: number; y: number } | null;
  drawingCurrentPoint: { x: number; y: number } | null;
  
  // Draft section for live preview
  draftSection: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  
  // Drawing tool configurations (removed washiTape)
  strokeConfig: {
    marker: MarkerConfig;
    highlighter: HighlighterConfig;
    eraser: EraserConfig;
  };
}

/**
 * Drawing module actions
 */
export interface DrawingActions {
  // Drawing operations
  startDrawing: (tool: 'pen' | 'marker' | 'highlighter', point: { x: number; y: number }) => void;
  updateDrawing: (point: { x: number; y: number }) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  
  // Draft sections
  startDraftSection: (point: { x: number; y: number }) => void;
  updateDraftSection: (point: { x: number; y: number }) => void;
  commitDraftSection: () => string | null;
  cancelDraftSection: () => void;
  
  // Stroke Configuration
  updateStrokeConfig: (tool: 'marker' | 'highlighter' | 'eraser', config: Partial<MarkerConfig | HighlighterConfig | EraserConfig>) => void;
}

/**
 * Creates the drawing module
 */
export const createDrawingModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<DrawingState, DrawingActions> => {
  return {
    state: {
      isDrawing: false,
      drawingTool: null,
      drawingStartPoint: null,
      draftSection: null,
      drawingCurrentPoint: null,
      
      strokeConfig: {
        marker: {
          color: '#000000',
          minWidth: 2,
          maxWidth: 20,
          opacity: 1,
          smoothness: 0.5,
          widthVariation: true,
          pressureSensitive: true
        },
        highlighter: {
          color: '#FFFF00',
          width: 16,
          opacity: 0.4,
          blendMode: 'multiply',
          lockToElements: false
        },
        eraser: {
          size: 30,
          mode: 'stroke',
          strength: 1
        }
      },
    },
    
    actions: {
      startDrawing: (tool, point) => {
        set(state => {
          state.isDrawing = true;
          state.drawingTool = tool;
          state.drawingStartPoint = point;
          state.currentPath = [point.x, point.y];
          state.drawingCurrentPoint = point;
        });
      },
      
      updateDrawing: (point) => {
        set(state => {
          if (state.isDrawing && state.currentPath) {
            state.currentPath.push(point.x, point.y);
            state.drawingCurrentPoint = point;
          }
        });
      },
      
      finishDrawing: () => {
        const state = get();
        if (state.isDrawing && state.currentPath && state.currentPath.length >= 4) {
          const tool = state.drawingTool || 'pen';

          if (tool === 'pen') {
            const color = (get() as any).penColor || '#000000';
            const penElement = {
              id: nanoid(),
              type: 'pen',
              x: 0,
              y: 0,
              points: [...state.currentPath],
              stroke: color,
              strokeWidth: 2,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              isLocked: false,
              isHidden: false
            };
            get().addElement(penElement as any);
          }

          if (tool === 'marker') {
            const cfg = state.strokeConfig.marker;
            const width = Math.max(cfg.minWidth, Math.min(cfg.maxWidth, 6));
            const markerElement = {
              id: nanoid(),
              type: 'marker',
              x: 0,
              y: 0,
              points: [...state.currentPath],
              rawPoints: undefined,
              style: {
                color: cfg.color,
                width,
                opacity: cfg.opacity,
                smoothness: cfg.smoothness,
                lineCap: 'round',
                lineJoin: 'round',
                widthVariation: cfg.widthVariation,
                minWidth: cfg.minWidth,
                maxWidth: cfg.maxWidth,
                pressureSensitive: cfg.pressureSensitive,
              },
              createdAt: Date.now(),
              updatedAt: Date.now(),
              isLocked: false,
              isHidden: false,
            };
            get().addElement(markerElement as any);
          }

          if (tool === 'highlighter') {
            const cfg = state.strokeConfig.highlighter;
            const highlighterElement = {
              id: nanoid(),
              type: 'highlighter',
              x: 0,
              y: 0,
              points: [...state.currentPath],
              rawPoints: undefined,
              style: {
                color: cfg.color,
                width: cfg.width,
                opacity: cfg.opacity,
                smoothness: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
                blendMode: cfg.blendMode,
                baseOpacity: cfg.opacity,
                highlightColor: cfg.color,
              },
              createdAt: Date.now(),
              updatedAt: Date.now(),
              isLocked: false,
              isHidden: false,
            };
            get().addElement(highlighterElement as any);
          }
        }
        
        // Reset drawing state
        set(state => {
          state.isDrawing = false;
          state.drawingTool = null;
          state.drawingStartPoint = null;
          state.currentPath = undefined;
          state.drawingCurrentPoint = null;
        });
      },
      
      cancelDrawing: () => {
        set(state => {
          state.isDrawing = false;
          state.drawingTool = null;
          state.drawingStartPoint = null;
          state.currentPath = undefined;
          state.drawingCurrentPoint = null;
        });
      },

      // Section draft operations  
      startDraftSection: (point) => {
        set(state => {
          state.draftSection = {
            id: nanoid(),
            x: point.x,
            y: point.y,
            width: 0,
            height: 0
          };
        });
      },
      
      updateDraftSection: (point) => {
        set(state => {
          if (state.draftSection) {
            const startX = state.draftSection.x;
            const startY = state.draftSection.y;
            
            // Calculate normalized bounds (handle drag in any direction)
            const x = Math.min(point.x, startX);
            const y = Math.min(point.y, startY);
            const width = Math.abs(point.x - startX);
            const height = Math.abs(point.y - startY);
            
            state.draftSection.x = x;
            state.draftSection.y = y;
            state.draftSection.width = width;
            state.draftSection.height = height;
          }
        });
      },
      
      commitDraftSection: () => {
        const state = get();
        if (state.draftSection && state.draftSection.width > 10 && state.draftSection.height > 10) {
          const sectionId = get().createSection?.(
            state.draftSection.x,
            state.draftSection.y,
            state.draftSection.width,
            state.draftSection.height
          );
          
          // Clear draft
          set(state => {
            state.draftSection = null;
          });
          
          return sectionId;
        }
        return null;
      },

      cancelDraftSection: () => {
        set(state => { state.draftSection = null; });
      },

      // Stroke config updates
      updateStrokeConfig: (tool, config) => {
        set(state => {
          state.strokeConfig[tool] = { ...(state.strokeConfig as any)[tool], ...(config as any) } as any;
        });
      },
    },
  };
};