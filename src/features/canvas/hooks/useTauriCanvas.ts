// src/hooks/useTauriCanvas.ts
import { invoke } from '@tauri-apps/api/core';
import { useCanvasStore } from '../stores/canvasStore.enhanced';

export const useTauriCanvas = () => {
  const exportElements = useCanvasStore((state) => state.exportElements);
  const importElements = useCanvasStore((state) => state.importElements);
  const saveToFile = async (filename: string) => {
    try {
      const elements = exportElements();
      const data = JSON.stringify(elements);
      await invoke('save_canvas_data', { data, filename });
      console.log('Canvas saved successfully');
    } catch (error) {
      console.error('Error saving canvas:', error);
    }
  };

  const loadFromFile = async (filename: string) => {
    try {
      const data = await invoke('load_canvas_data', { filename });
      const elements = JSON.parse(data as string);
      importElements(elements);
      console.log('Canvas loaded successfully');
    } catch (error) {
      console.error('Error loading canvas:', error);
    }
  };

  return { saveToFile, loadFromFile };
};
