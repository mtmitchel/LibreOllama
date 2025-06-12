// src/hooks/useTauriCanvas.ts
import { invoke } from '@tauri-apps/api/core';
import { useKonvaCanvasStore } from '../stores/konvaCanvasStore';

export const useTauriCanvas = () => {
  const { exportCanvas, importCanvas } = useKonvaCanvasStore();

  const saveToFile = async (filename: string) => {
    try {
      const elements = exportCanvas();
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
      importCanvas(elements);
      console.log('Canvas loaded successfully');
    } catch (error) {
      console.error('Error loading canvas:', error);
    }
  };

  return { saveToFile, loadFromFile };
};
