/**
 * Stroke Slice for Unified Canvas Store
 * Manages drawing tool state and stroke operations
 */

import { StoreApi } from 'zustand';
import { 
  MarkerElement, 
  HighlighterElement, 
  WashiTapeElement,
  StrokeGroup,
  MarkerConfig,
  HighlighterConfig,
  WashiTapeConfig,
  EraserConfig,
  StrokeStyle,
  WASHI_PATTERNS
} from '../../types/drawing.types';
import { ElementId, GroupId } from '../../types/enhanced.types';
import { nanoid } from 'nanoid';

export interface StrokeSliceState {
  // Drawing tool configurations
  activeStrokeStyle: {
    marker: MarkerConfig;
    highlighter: HighlighterConfig;
    washiTape: WashiTapeConfig;
    eraser: EraserConfig;
  };
  
  // Stroke selection and editing
  selectedStrokeIds: Set<ElementId>;
  editingStrokeId: ElementId | null;
  strokeGroups: Map<GroupId, StrokeGroup>;
  
  // Drawing state
  isRecordingStroke: boolean;
  currentStrokeTool: 'marker' | 'highlighter' | 'washi-tape' | null;
  strokePreviewEnabled: boolean;
  
  // Performance settings
  strokeSimplification: boolean;
  strokeCaching: boolean;
  maxStrokePoints: number;
}

export interface StrokeSliceActions {
  // Style management
  updateMarkerStyle: (style: Partial<MarkerConfig>) => void;
  updateHighlighterStyle: (style: Partial<HighlighterConfig>) => void;
  updateWashiTapeStyle: (style: Partial<WashiTapeConfig>) => void;
  updateEraserStyle: (style: Partial<EraserConfig>) => void;
  
  // Stroke operations
  selectStroke: (id: ElementId, additive?: boolean) => void;
  selectMultipleStrokes: (ids: ElementId[]) => void;
  deselectStroke: (id: ElementId) => void;
  clearStrokeSelection: () => void;
  
  // Stroke editing
  startStrokeEditing: (id: ElementId) => void;
  finishStrokeEditing: () => void;
  updateStrokeStyle: (id: ElementId, style: Partial<StrokeStyle>) => void;
  
  // Group operations
  groupSelectedStrokes: () => GroupId | null;
  ungroupStrokes: (groupId: GroupId) => void;
  addStrokeToGroup: (strokeId: ElementId, groupId: GroupId) => void;
  removeStrokeFromGroup: (strokeId: ElementId, groupId: GroupId) => void;
  
  // Bulk operations
  applyStyleToSelectedStrokes: (style: Partial<StrokeStyle>) => void;
  deleteSelectedStrokes: () => void;
  duplicateSelectedStrokes: () => ElementId[];
  
  // Advanced operations
  smoothSelectedStrokes: (factor: number) => void;
  simplifySelectedStrokes: (tolerance: number) => void;
  reverseSelectedStrokes: () => void;
  
  // Drawing state
  setStrokeRecording: (isRecording: boolean, tool?: 'marker' | 'highlighter' | 'washi-tape') => void;
  toggleStrokePreview: () => void;
  
  // Settings
  updateStrokeSettings: (settings: {
    simplification?: boolean;
    caching?: boolean;
    maxPoints?: number;
  }) => void;
  
  // Presets
  loadMarkerPreset: (preset: 'thin' | 'medium' | 'thick' | 'calligraphy') => void;
  loadHighlighterPreset: (preset: 'yellow' | 'pink' | 'blue' | 'green') => void;
  loadWashiTapePreset: (preset: keyof typeof WASHI_PATTERNS) => void;
}

export const createStrokeSlice = (
  set: StoreApi<any>['setState'],
  get: StoreApi<any>['getState']
): StrokeSliceState & StrokeSliceActions => ({
  // Initial state
  activeStrokeStyle: {
    marker: {
      color: '#000000',
      minWidth: 2,
      maxWidth: 6,
      smoothness: 0.5,
      widthVariation: false,
      pressureSensitive: false,
      opacity: 1
    },
    highlighter: {
      color: '#FFEB3B',
      width: 20,
      opacity: 0.4,
      blendMode: 'multiply',
      lockToElements: false
    },
    washiTape: {
      primaryColor: '#FF6B6B',
      secondaryColor: '#FFFFFF',
      width: 30,
      opacity: 0.8,
      pattern: WASHI_PATTERNS.DOTS,
      followCursor: true
    },
    eraser: {
      size: 20,
      mode: 'stroke',
      strength: 1.0
    }
  },
  
  selectedStrokeIds: new Set(),
  editingStrokeId: null,
  strokeGroups: new Map(),
  isRecordingStroke: false,
  currentStrokeTool: null,
  strokePreviewEnabled: true,
  strokeSimplification: true,
  strokeCaching: true,
  maxStrokePoints: 10000,

  // Actions
  updateMarkerStyle: (style) => set(state => {
    state.activeStrokeStyle.marker = {
      ...state.activeStrokeStyle.marker,
      ...style
    };
  }),

  updateHighlighterStyle: (style) => set(state => {
    state.activeStrokeStyle.highlighter = {
      ...state.activeStrokeStyle.highlighter,
      ...style
    };
  }),

  updateWashiTapeStyle: (style) => set(state => {
    state.activeStrokeStyle.washiTape = {
      ...state.activeStrokeStyle.washiTape,
      ...style
    };
  }),

  updateEraserStyle: (style) => set(state => {
    state.activeStrokeStyle.eraser = {
      ...state.activeStrokeStyle.eraser,
      ...style
    };
  }),

  selectStroke: (id, additive = false) => set(state => {
    if (!additive) {
      state.selectedStrokeIds.clear();
    }
    state.selectedStrokeIds.add(id);
  }),

  selectMultipleStrokes: (ids) => set(state => {
    state.selectedStrokeIds.clear();
    ids.forEach(id => state.selectedStrokeIds.add(id));
  }),

  deselectStroke: (id) => set(state => {
    state.selectedStrokeIds.delete(id);
  }),

  clearStrokeSelection: () => set(state => {
    state.selectedStrokeIds.clear();
    state.editingStrokeId = null;
  }),

  startStrokeEditing: (id) => set(state => {
    state.editingStrokeId = id;
    state.selectedStrokeIds.clear();
    state.selectedStrokeIds.add(id);
  }),

  finishStrokeEditing: () => set(state => {
    state.editingStrokeId = null;
  }),

  updateStrokeStyle: (id, style) => set(state => {
    const element = state.elements.get(id);
    if (element && 'style' in element) {
      element.style = { ...element.style, ...style };
      element.updatedAt = Date.now();
    }
  }),

  groupSelectedStrokes: () => {
    const state = get();
    const selectedIds = Array.from(state.selectedStrokeIds);
    
    if (selectedIds.length < 2) return null;
    
    const groupId = nanoid() as GroupId;
    
    set(draft => {
      // Calculate group bounds
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      selectedIds.forEach(id => {
        const element = draft.elements.get(id);
        if (element && element.points) {
          for (let i = 0; i < element.points.length; i += 2) {
            minX = Math.min(minX, element.points[i]);
            maxX = Math.max(maxX, element.points[i]);
            minY = Math.min(minY, element.points[i + 1]);
            maxY = Math.max(maxY, element.points[i + 1]);
          }
        }
      });
      
      const group: StrokeGroup = {
        id: groupId,
        strokeIds: selectedIds,
        bounds: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        },
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      };
      
      draft.strokeGroups.set(groupId, group);
      
      // Mark elements as grouped
      selectedIds.forEach(id => {
        const element = draft.elements.get(id);
        if (element) {
          element.groupId = groupId;
        }
      });
    });
    
    return groupId;
  },

  ungroupStrokes: (groupId) => set(state => {
    const group = state.strokeGroups.get(groupId);
    if (!group) return;
    
    // Remove group reference from strokes
    group.strokeIds.forEach(id => {
      const element = state.elements.get(id);
      if (element) {
        delete element.groupId;
      }
    });
    
    // Remove group
    state.strokeGroups.delete(groupId);
  }),

  addStrokeToGroup: (strokeId, groupId) => set(state => {
    const group = state.strokeGroups.get(groupId);
    const element = state.elements.get(strokeId);
    
    if (group && element && !group.strokeIds.includes(strokeId)) {
      group.strokeIds.push(strokeId);
      element.groupId = groupId;
      
      if (group.metadata) {
        group.metadata.updatedAt = Date.now();
      }
    }
  }),

  removeStrokeFromGroup: (strokeId, groupId) => set(state => {
    const group = state.strokeGroups.get(groupId);
    const element = state.elements.get(strokeId);
    
    if (group && element) {
      group.strokeIds = group.strokeIds.filter(id => id !== strokeId);
      delete element.groupId;
      
      if (group.metadata) {
        group.metadata.updatedAt = Date.now();
      }
      
      // Remove group if empty
      if (group.strokeIds.length === 0) {
        state.strokeGroups.delete(groupId);
      }
    }
  }),

  applyStyleToSelectedStrokes: (style) => set(state => {
    state.selectedStrokeIds.forEach(id => {
      const element = state.elements.get(id);
      if (element && 'style' in element) {
        element.style = { ...element.style, ...style };
        element.updatedAt = Date.now();
      }
    });
  }),

  deleteSelectedStrokes: () => set(state => {
    state.selectedStrokeIds.forEach(id => {
      // Remove from any groups
      state.strokeGroups.forEach((group, groupId) => {
        if (group.strokeIds.includes(id)) {
          group.strokeIds = group.strokeIds.filter(strokeId => strokeId !== id);
          if (group.strokeIds.length === 0) {
            state.strokeGroups.delete(groupId);
          }
        }
      });
      
      // Remove element
      state.elements.delete(id);
      state.elementOrder = state.elementOrder.filter(elementId => elementId !== id);
    });
    
    state.selectedStrokeIds.clear();
  }),

  duplicateSelectedStrokes: () => {
    const state = get();
    const selectedIds = Array.from(state.selectedStrokeIds);
    const newIds: ElementId[] = [];
    
    set(draft => {
      selectedIds.forEach(id => {
        const element = draft.elements.get(id);
        if (element && 'points' in element) {
          const newId = nanoid() as ElementId;
          const duplicated = {
            ...element,
            id: newId,
            x: element.x + 20, // Offset slightly
            y: element.y + 20,
            points: element.points ? [...element.points] : [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            groupId: undefined // Don't duplicate group membership
          };
          
          draft.elements.set(newId, duplicated);
          draft.elementOrder.push(newId);
          newIds.push(newId);
        }
      });
      
      // Select duplicated strokes
      draft.selectedStrokeIds.clear();
      newIds.forEach(id => draft.selectedStrokeIds.add(id));
    });
    
    return newIds;
  },

  smoothSelectedStrokes: (factor) => set(state => {
    // Implementation would use stroke manager to re-smooth existing strokes
    console.log('Smoothing selected strokes with factor:', factor);
  }),

  simplifySelectedStrokes: (tolerance) => set(state => {
    // Implementation would use Douglas-Peucker algorithm
    console.log('Simplifying selected strokes with tolerance:', tolerance);
  }),

  reverseSelectedStrokes: () => set(state => {
    state.selectedStrokeIds.forEach(id => {
      const element = state.elements.get(id);
      if (element && element.points) {
        // Reverse points array
        const reversed: number[] = [];
        for (let i = element.points.length - 2; i >= 0; i -= 2) {
          reversed.push(element.points[i], element.points[i + 1]);
        }
        element.points = reversed;
        element.updatedAt = Date.now();
      }
    });
  }),

  setStrokeRecording: (isRecording, tool) => set(state => {
    state.isRecordingStroke = isRecording;
    state.currentStrokeTool = isRecording ? tool || null : null;
  }),

  toggleStrokePreview: () => set(state => {
    state.strokePreviewEnabled = !state.strokePreviewEnabled;
  }),

  updateStrokeSettings: (settings) => set(state => {
    if (settings.simplification !== undefined) {
      state.strokeSimplification = settings.simplification;
    }
    if (settings.caching !== undefined) {
      state.strokeCaching = settings.caching;
    }
    if (settings.maxPoints !== undefined) {
      state.maxStrokePoints = settings.maxPoints;
    }
  }),

  // Preset loaders
  loadMarkerPreset: (preset) => set(state => {
    const presets = {
      thin: { minWidth: 1, maxWidth: 3, widthVariation: false },
      medium: { minWidth: 2, maxWidth: 6, widthVariation: true },
      thick: { minWidth: 4, maxWidth: 12, widthVariation: true },
      calligraphy: { minWidth: 1, maxWidth: 8, widthVariation: true, pressureSensitive: true }
    };
    
    state.activeStrokeStyle.marker = {
      ...state.activeStrokeStyle.marker,
      ...presets[preset]
    };
  }),

  loadHighlighterPreset: (preset) => set(state => {
    const presets = {
      yellow: { color: '#FFEB3B', opacity: 0.4 },
      pink: { color: '#E91E63', opacity: 0.3 },
      blue: { color: '#2196F3', opacity: 0.3 },
      green: { color: '#4CAF50', opacity: 0.4 }
    };
    
    state.activeStrokeStyle.highlighter = {
      ...state.activeStrokeStyle.highlighter,
      ...presets[preset]
    };
  }),

  loadWashiTapePreset: (preset) => set(state => {
    state.activeStrokeStyle.washiTape.pattern = WASHI_PATTERNS[preset];
  })
}); 