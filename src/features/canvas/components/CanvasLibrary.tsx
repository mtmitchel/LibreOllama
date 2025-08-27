/**
 * CanvasLibrary - UI for managing saved canvases
 * 
 * Provides functionality to:
 * - List saved canvases
 * - Load a saved canvas
 * - Delete saved canvases
 * - Show canvas metadata (name, date, size)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTauriCanvas } from '../hooks/useTauriCanvas';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { canvasLog } from '../utils/canvasLogger';

interface SavedCanvas {
  filename: string;
  displayName: string;
  size?: number;
  lastModified?: Date;
}

interface CanvasLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CanvasLibrary: React.FC<CanvasLibraryProps> = ({ isOpen, onClose }) => {
  const [savedCanvases, setSavedCanvases] = useState<SavedCanvas[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCanvas, setSelectedCanvas] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const { loadFromFile } = useTauriCanvas();
  const clearCanvas = useUnifiedCanvasStore(state => state.clearCanvas);
  const importElements = useUnifiedCanvasStore(state => state.importElements);

  // Fetch list of saved canvases
  const fetchCanvases = useCallback(async () => {
    setLoading(true);
    try {
      const files = await invoke<string[]>('list_canvas_files');
      const canvases: SavedCanvas[] = files.map(filename => ({
        filename,
        displayName: filename.replace('.json', '').replace(/-/g, ' '),
        // TODO: Get actual file metadata
      }));
      setSavedCanvases(canvases);
      canvasLog.info('Loaded canvas list:', canvases.length);
    } catch (error) {
      canvasLog.error('Failed to list canvases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCanvases();
    }
  }, [isOpen, fetchCanvases]);

  const handleLoad = async (filename: string) => {
    setLoading(true);
    try {
      canvasLog.info('Loading canvas:', filename);
      
      // Clear existing canvas
      clearCanvas();
      
      // Load the saved canvas
      const elements = await loadFromFile(filename);
      
      // Import elements into store
      if (elements && Array.isArray(elements)) {
        importElements(elements);
        canvasLog.info('Canvas loaded successfully:', elements.length, 'elements');
        onClose();
      } else {
        throw new Error('Invalid canvas data');
      }
    } catch (error) {
      canvasLog.error('Failed to load canvas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (deleteConfirm !== filename) {
      setDeleteConfirm(filename);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    setLoading(true);
    try {
      await invoke('delete_canvas_file', { filename });
      canvasLog.info('Canvas deleted:', filename);
      setDeleteConfirm(null);
      fetchCanvases(); // Refresh list
    } catch (error) {
      canvasLog.error('Failed to delete canvas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-[600px] max-h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Canvas Library</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Canvas List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : savedCanvases.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No saved canvases found
            </div>
          ) : (
            <div className="space-y-2">
              {savedCanvases.map((canvas) => (
                <div
                  key={canvas.filename}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border
                    ${selectedCanvas === canvas.filename ? 'border-primary bg-primary/5' : 'border-border hover:bg-gray-50 dark:hover:bg-gray-800'}
                    cursor-pointer transition-colors
                  `}
                  onClick={() => setSelectedCanvas(canvas.filename)}
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{canvas.displayName}</h3>
                    <p className="text-sm text-gray-500">
                      {canvas.lastModified ? new Date(canvas.lastModified).toLocaleDateString() : canvas.filename}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoad(canvas.filename);
                      }}
                      className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                      disabled={loading}
                    >
                      Load
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(canvas.filename);
                      }}
                      className={`
                        px-3 py-1 text-sm rounded
                        ${deleteConfirm === canvas.filename 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }
                      `}
                      disabled={loading}
                    >
                      {deleteConfirm === canvas.filename ? 'Confirm' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={fetchCanvases}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            disabled={loading}
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};