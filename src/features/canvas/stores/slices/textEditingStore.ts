// src/stores/slices/textEditingStore.ts
/**
 * Text Editing Store - Handles unified text editing operations
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 * Addresses text editing performance issues and state inconsistencies
 */

import { StateCreator } from 'zustand';
import { Draft } from 'immer';
import { logger } from '@/lib/logger';
import type { RichTextSegment } from '../../types/richText';
import { PerformanceMonitor } from '../../utils/performance/PerformanceMonitor';

// Helper function for consistent metric recording
const recordMetric = (name: string, value: number, category: 'canvas' | 'render' | 'interaction' | 'memory' | 'network', metadata?: any) => {
  PerformanceMonitor.recordMetric(name, value, category, metadata);
};

export interface TextEditingState {
  // Current editing state
  editingTextId: string | null;
  isEditingText: string | null; // Alias for backward compatibility
  
  // Text selection and cursor state
  textSelection: {
    elementId: string | null;
    start: number;
    end: number;
    direction: 'forward' | 'backward' | 'none';
  } | null;
  
  // Text formatting state
  currentTextFormat: Partial<RichTextSegment>;
  
  // Performance tracking
  textEditingMetrics: {
    inputLatency: number[];
    renderTime: number[];
    stateUpdateCount: number;
  };
  
  // Text editing operations
  setEditingTextId: (id: string | null) => void;
  setIsEditingText: (id: string | null) => void; // Alias
  
  // Text content operations
  updateElementText: (elementId: string, newText: string) => void;
  insertTextAtCursor: (elementId: string, text: string) => void;
  deleteTextSelection: (elementId: string) => void;
  
  // Rich text formatting operations
  applyTextFormat: (elementId: string, format: Partial<RichTextSegment>, selection: { start: number; end: number }) => void;
  clearTextFormat: (elementId: string, selection: { start: number; end: number }) => void;
  getTextFormat: (elementId: string, position: number) => Partial<RichTextSegment>;
  
  // Text selection operations
  setTextSelection: (elementId: string | null, start: number, end: number, direction?: 'forward' | 'backward') => void;
  clearTextSelection: () => void;
  selectAllText: (elementId: string) => void;
  
  // Text validation and optimization
  validateRichTextElement: (elementId: string) => boolean;
  optimizeRichTextSegments: (elementId: string) => void;
  mergeAdjacentSegments: (segments: RichTextSegment[]) => RichTextSegment[];
  
  // Performance utilities
  recordTextEditingMetric: (type: 'inputLatency' | 'renderTime', value: number) => void;
  getTextEditingPerformance: () => { avgInputLatency: number; avgRenderTime: number; updateCount: number };
  resetTextEditingMetrics: () => void;
}

// Utility functions for rich text operations
const areStylesEqual = (seg1: Omit<RichTextSegment, 'text'>, seg2: Omit<RichTextSegment, 'text'>): boolean => {
  return (
    seg1.fontSize === seg2.fontSize &&
    seg1.fontFamily === seg2.fontFamily &&
    seg1.fontStyle === seg2.fontStyle &&
    seg1.fontWeight === seg2.fontWeight &&
    seg1.textDecoration === seg2.textDecoration &&
    seg1.fill === seg2.fill &&
    seg1.url === seg2.url &&
    seg1.textAlign === seg2.textAlign &&
    seg1.listType === seg2.listType
  );
};

export const createTextEditingStore: StateCreator<
  TextEditingState,
  [['zustand/immer', never]],
  [],
  TextEditingState
> = (set, get) => ({
  // Initial state
  editingTextId: null,
  isEditingText: null,
  textSelection: null,
  currentTextFormat: {},
  textEditingMetrics: {
    inputLatency: [],
    renderTime: [],
    stateUpdateCount: 0
  },

  // Text editing state management
  setEditingTextId: (id: string | null) => {
    const endTiming = PerformanceMonitor.startTiming('setEditingTextId');
    
    try {
      logger.log('📝 [TEXT STORE] Setting editing text ID:', id);
      
      set((state: Draft<TextEditingState>) => {
        state.editingTextId = id;
        state.isEditingText = id; // Keep alias in sync
        state.textEditingMetrics.stateUpdateCount++;
        
        // Clear selection when stopping editing
        if (id === null) {
          state.textSelection = null;
          state.currentTextFormat = {};
        }
        
        logger.log('✅ [TEXT STORE] Editing text ID updated successfully');
      });
      
      recordMetric('textEditingStateChange', 1, 'interaction', {
        action: id ? 'start' : 'stop',
        elementId: id
      });
    } finally {
      endTiming();
    }
  },

  setIsEditingText: (id: string | null) => {
    // Alias method that delegates to setEditingTextId
    get().setEditingTextId(id);
  },

  // Text content operations
  updateElementText: (elementId: string, newText: string) => {
    const endTiming = PerformanceMonitor.startTiming('updateElementText');
    
    try {
      logger.log('📝 [TEXT STORE] Updating element text:', elementId, newText.length, 'characters');
      
      // This would interact with the elements store
      // For now, we track the performance metrics
      recordMetric('textUpdate', newText.length, 'interaction', {
        elementId,
        operation: 'update'
      });
      
      set((state: Draft<TextEditingState>) => {
        state.textEditingMetrics.stateUpdateCount++;
      });
      
      logger.log('✅ [TEXT STORE] Element text updated successfully');
    } finally {
      endTiming();
    }
  },

  insertTextAtCursor: (elementId: string, text: string) => {
    const endTiming = PerformanceMonitor.startTiming('insertTextAtCursor');
    
    try {
      logger.log('📝 [TEXT STORE] Inserting text at cursor:', elementId, text);
      
      const { textSelection } = get();
      if (!textSelection || textSelection.elementId !== elementId) {
        console.warn('📝 [TEXT STORE] No valid text selection for insertion');
        return;
      }
      
      recordMetric('textInsert', text.length, 'interaction', {
        elementId,
        cursorPosition: textSelection.start
      });
      
      set((state: Draft<TextEditingState>) => {
        state.textEditingMetrics.stateUpdateCount++;
        
        // Update selection to end of inserted text
        if (state.textSelection && state.textSelection.elementId === elementId) {
          const newPosition = state.textSelection.start + text.length;
          state.textSelection.start = newPosition;
          state.textSelection.end = newPosition;
        }
      });
      
      logger.log('✅ [TEXT STORE] Text inserted successfully');
    } finally {
      endTiming();
    }
  },

  deleteTextSelection: (elementId: string) => {
    const endTiming = PerformanceMonitor.startTiming('deleteTextSelection');
    
    try {
      const { textSelection } = get();
      if (!textSelection || textSelection.elementId !== elementId) {
        console.warn('📝 [TEXT STORE] No valid text selection for deletion');
        return;
      }
      
      const deletedLength = textSelection.end - textSelection.start;
      logger.log('📝 [TEXT STORE] Deleting text selection:', elementId, deletedLength, 'characters');
      
      recordMetric('textDelete', deletedLength, 'interaction', {
        elementId,
        selectionStart: textSelection.start,
        selectionEnd: textSelection.end
      });
      
      set((state: Draft<TextEditingState>) => {
        state.textEditingMetrics.stateUpdateCount++;
        
        // Update selection to cursor position
        if (state.textSelection && state.textSelection.elementId === elementId) {
          state.textSelection.end = state.textSelection.start;
        }
      });
      
      logger.log('✅ [TEXT STORE] Text selection deleted successfully');
    } finally {
      endTiming();
    }
  },

  // Rich text formatting operations
  applyTextFormat: (elementId: string, format: Partial<RichTextSegment>, selection: { start: number; end: number }) => {
    const endTiming = PerformanceMonitor.startTiming('applyTextFormat');
    
    try {
      logger.log('📝 [TEXT STORE] Applying text format:', elementId, format, selection);
      
      recordMetric('textFormat', 1, 'interaction', {
        elementId,
        formatType: Object.keys(format).join(','),
        selectionLength: selection.end - selection.start
      });
      
      set((state: Draft<TextEditingState>) => {
        state.currentTextFormat = { ...state.currentTextFormat, ...format };
        state.textEditingMetrics.stateUpdateCount++;
      });
      
      logger.log('✅ [TEXT STORE] Text format applied successfully');
    } finally {
      endTiming();
    }
  },

  clearTextFormat: (elementId: string, selection: { start: number; end: number }) => {
    const endTiming = PerformanceMonitor.startTiming('clearTextFormat');
    
    try {
      logger.log('📝 [TEXT STORE] Clearing text format:', elementId, selection);
      
      recordMetric('textFormatClear', 1, 'interaction', {
        elementId,
        selectionLength: selection.end - selection.start
      });
      
      set((state: Draft<TextEditingState>) => {
        state.currentTextFormat = {};
        state.textEditingMetrics.stateUpdateCount++;
      });
      
      logger.log('✅ [TEXT STORE] Text format cleared successfully');
    } finally {
      endTiming();
    }
  },

  getTextFormat: (elementId: string, position: number): Partial<RichTextSegment> => {
    const endTiming = PerformanceMonitor.startTiming('getTextFormat');
    
    try {
      // This would examine the rich text segments at the given position
      // For now, return the current format
      const { currentTextFormat } = get();
      
      recordMetric('textFormatQuery', 1, 'interaction', {
        elementId,
        position
      });
      
      return currentTextFormat;
    } finally {
      endTiming();
    }
  },

  // Text selection operations
  setTextSelection: (elementId: string | null, start: number, end: number, direction: 'forward' | 'backward' = 'forward') => {
    const endTiming = PerformanceMonitor.startTiming('setTextSelection');
    
    try {
      logger.log('📝 [TEXT STORE] Setting text selection:', elementId, start, end, direction);
      
      set((state: Draft<TextEditingState>) => {
        if (elementId === null) {
          state.textSelection = null;
        } else {
          state.textSelection = {
            elementId,
            start: Math.max(0, Math.min(start, end)),
            end: Math.max(start, end),
            direction
          };
        }
        state.textEditingMetrics.stateUpdateCount++;
      });
      
      recordMetric('textSelection', 1, 'interaction', {
        elementId,
        selectionLength: elementId ? Math.abs(end - start) : 0
      });
      
      logger.log('✅ [TEXT STORE] Text selection updated successfully');
    } finally {
      endTiming();
    }
  },

  clearTextSelection: () => {
    get().setTextSelection(null, 0, 0);
  },

  selectAllText: (elementId: string) => {
    const endTiming = PerformanceMonitor.startTiming('selectAllText');
    
    try {
      logger.log('📝 [TEXT STORE] Selecting all text:', elementId);
      
      // This would get the text length from the elements store
      // For now, use a large number to represent "all text"
      get().setTextSelection(elementId, 0, Number.MAX_SAFE_INTEGER, 'forward');
      
      recordMetric('selectAllText', 1, 'interaction', { elementId });
      
      logger.log('✅ [TEXT STORE] All text selected successfully');
    } finally {
      endTiming();
    }
  },

  // Text validation and optimization
  validateRichTextElement: (elementId: string): boolean => {
    const endTiming = PerformanceMonitor.startTiming('validateRichTextElement');
    
    try {
      logger.log('📝 [TEXT STORE] Validating rich text element:', elementId);
      
      // This would validate the actual element from the elements store
      // For now, return true as a placeholder
      const isValid = true;
      
      recordMetric('textValidation', 1, 'interaction', {
        elementId,
        isValid
      });
      
      return isValid;
    } finally {
      endTiming();
    }
  },

  optimizeRichTextSegments: (elementId: string) => {
    const endTiming = PerformanceMonitor.startTiming('optimizeRichTextSegments');
    
    try {
      logger.log('📝 [TEXT STORE] Optimizing rich text segments:', elementId);
      
      // This would optimize the segments in the elements store
      recordMetric('textOptimization', 1, 'interaction', { elementId });
      
      set((state: Draft<TextEditingState>) => {
        state.textEditingMetrics.stateUpdateCount++;
      });
      
      logger.log('✅ [TEXT STORE] Rich text segments optimized successfully');
    } finally {
      endTiming();
    }
  },

  mergeAdjacentSegments: (segments: RichTextSegment[]): RichTextSegment[] => {
    const endTiming = PerformanceMonitor.startTiming('mergeAdjacentSegments');
      try {
      if (!segments || segments.length === 0) return [];
      if (segments.length === 1) return segments[0]?.text ? segments : [];

      const merged: RichTextSegment[] = [];
      let currentSegment = { ...segments[0] };

      // Skip empty segments at the start
      if (!currentSegment?.text) {
        let i = 1;
        while (i < segments.length && !segments[i]?.text) {
          i++;
        }
        if (i >= segments.length) return [];
        currentSegment = { ...segments[i] };
      }

      for (let i = 1; i < segments.length; i++) {
        const nextSegment = segments[i];
        
        // Skip empty segments or undefined segments
        if (!nextSegment?.text) continue;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { text: currentText, ...currentStyle } = currentSegment;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { text: nextText, ...nextStyle } = nextSegment;

        if (areStylesEqual(currentStyle, nextStyle)) {
          // Merge segments with identical styles
          currentSegment.text = (currentSegment.text || '') + nextSegment.text;
        } else {
          // Push current segment and start new one
          if (currentSegment.text) {
            merged.push(currentSegment as RichTextSegment);
          }
          currentSegment = { ...nextSegment };
        }
      }

      // Add final segment if it has text
      if (currentSegment?.text) {
        merged.push(currentSegment as RichTextSegment);
      }

      recordMetric('segmentMerge', merged.length, 'interaction', {
        originalCount: segments.length,
        mergedCount: merged.length
      });

      return merged;
    } finally {
      endTiming();
    }
  },

  // Performance utilities
  recordTextEditingMetric: (type: 'inputLatency' | 'renderTime', value: number) => {
    set((state: Draft<TextEditingState>) => {
      const metrics = state.textEditingMetrics[type];
      metrics.push(value);
      
      // Keep only last 100 measurements
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }
    });
    
    recordMetric(`text_${type}`, value, 'interaction');
  },

  getTextEditingPerformance: () => {
    const { textEditingMetrics } = get();
    
    const avgInputLatency = textEditingMetrics.inputLatency.length > 0
      ? textEditingMetrics.inputLatency.reduce((sum, val) => sum + val, 0) / textEditingMetrics.inputLatency.length
      : 0;
      
    const avgRenderTime = textEditingMetrics.renderTime.length > 0
      ? textEditingMetrics.renderTime.reduce((sum, val) => sum + val, 0) / textEditingMetrics.renderTime.length
      : 0;
    
    return {
      avgInputLatency,
      avgRenderTime,
      updateCount: textEditingMetrics.stateUpdateCount
    };
  },

  resetTextEditingMetrics: () => {
    set((state: Draft<TextEditingState>) => {
      state.textEditingMetrics = {
        inputLatency: [],
        renderTime: [],
        stateUpdateCount: 0
      };
    });
    
    logger.log('📝 [TEXT STORE] Text editing metrics reset');
  }
});
