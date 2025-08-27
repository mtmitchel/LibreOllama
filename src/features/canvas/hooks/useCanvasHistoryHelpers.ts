/**
 * Canvas History Helpers - Ensure atomic history operations
 * 
 * This module provides helpers to ensure history entries are only added
 * on final events (onDragEnd, onTransformEnd, text-edit commit) and not
 * on intermediate events.
 */

import { useCallback } from 'react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { ElementId, CanvasElement, ElementOrSectionId } from '../types/enhanced.types';

interface HistoryOptions {
  skipHistory?: boolean;
  historyAction?: string;
}

/**
 * Hook that provides atomic update handlers for canvas operations
 * Ensures history is only added on final events
 */
export const useCanvasHistoryHelpers = () => {
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const addToHistory = useUnifiedCanvasStore(state => state.addToHistory);
  const batchUpdate = useUnifiedCanvasStore(state => state.batchUpdate);

  /**
   * Handle drag move events - NO history entry
   * Used for intermediate drag updates
   */
  const handleDragMove = useCallback((
    elementId: ElementId,
    position: { x: number; y: number }
  ) => {
    // Update without adding history (uses new default skipHistory=true)
    updateElement(elementId, position);
  }, [updateElement]);

  /**
   * Handle drag end events - ADD history entry
   * Used for final drag position
   */
  const handleDragEnd = useCallback((
    elementId: ElementId,
    position: { x: number; y: number }
  ) => {
    // Update element position
    updateElement(elementId, position);
    
    // Explicitly add history for the completed drag operation
    addToHistory('Move Element');
  }, [updateElement, addToHistory]);

  /**
   * Handle transform events during transformation - NO history
   */
  const handleTransforming = useCallback((
    elementId: ElementId,
    transforms: Partial<CanvasElement>
  ) => {
    // Update without history during transformation
    updateElement(elementId, transforms);
  }, [updateElement]);

  /**
   * Handle transform end events - ADD history entry
   * Used when transformation is complete
   */
  const handleTransformEnd = useCallback((
    elementId: ElementId,
    transforms: Partial<CanvasElement>
  ) => {
    // Update with final transform values
    updateElement(elementId, transforms);
    
    // Add history for the completed transformation
    const action = transforms.rotation !== undefined ? 'Rotate Element' : 'Transform Element';
    addToHistory(action);
  }, [updateElement, addToHistory]);

  /**
   * Handle text editing updates - NO history during typing
   */
  const handleTextEditing = useCallback((
    elementId: ElementId,
    text: string,
    dimensions?: { width: number; height: number }
  ) => {
    // Update text without history during editing
    const updates: Partial<CanvasElement> = { text };
    if (dimensions && 'width' in updates && 'height' in updates) {
      (updates as any).width = dimensions.width;
      (updates as any).height = dimensions.height;
    }
    
    updateElement(elementId, updates);
  }, [updateElement]);

  /**
   * Handle text edit commit - ADD history entry
   * Used when text editing is complete (blur, enter, escape)
   */
  const handleTextEditCommit = useCallback((
    elementId: ElementId,
    finalText: string,
    dimensions?: { width: number; height: number }
  ) => {
    // Update with final text
    const updates: Partial<CanvasElement> = { text: finalText };
    if (dimensions && 'width' in updates && 'height' in updates) {
      (updates as any).width = dimensions.width;
      (updates as any).height = dimensions.height;
    }
    
    updateElement(elementId, updates);
    
    // Add history for the completed text edit
    addToHistory('Edit Text');
  }, [updateElement, addToHistory]);

  /**
   * Batch multiple element updates with a single history entry
   * Used for operations that affect multiple elements
   */
  const handleBatchUpdate = useCallback((
    updates: Array<{ id: ElementOrSectionId; updates: Partial<CanvasElement> }>,
    historyAction: string
  ) => {
    // Perform batch update without individual history entries
    batchUpdate(updates, { skipHistory: true });
    
    // Add single history entry for the batch
    addToHistory(historyAction);
  }, [batchUpdate, addToHistory]);

  /**
   * Helper to wrap any operation to ensure it doesn't add history
   * Useful for intermediate updates during complex operations
   */
  const withoutHistory = useCallback(<T extends any[], R>(
    operation: (...args: T) => R
  ) => {
    return (...args: T): R => {
      // Store current updateElement to temporarily override
      const originalUpdateElement = useUnifiedCanvasStore.getState().updateElement;
      
      // Override updateElement to always skip history
      useUnifiedCanvasStore.setState({
        updateElement: (id, updates, options = {}) => {
          originalUpdateElement(id, updates, { ...options, skipHistory: true });
        }
      });
      
      try {
        // Execute the operation
        return operation(...args);
      } finally {
        // Restore original updateElement
        useUnifiedCanvasStore.setState({ updateElement: originalUpdateElement });
      }
    };
  }, []);

  return {
    // Intermediate event handlers (no history)
    handleDragMove,
    handleTransforming,
    handleTextEditing,
    
    // Final event handlers (add history)
    handleDragEnd,
    handleTransformEnd,
    handleTextEditCommit,
    
    // Batch operations
    handleBatchUpdate,
    
    // Utility
    withoutHistory
  };
};