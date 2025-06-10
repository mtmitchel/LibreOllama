import { useEffect } from 'react';
import { Canvas as FabricCanvasInstance } from 'fabric';
import { useFabricCanvasStore } from '../../stores/fabricCanvasStore'; // Adjust path as needed

export const useCanvasSelectionEvents = (canvas: FabricCanvasInstance | null) => {
  const setSelectedElementIds = useFabricCanvasStore((state) => state.setSelectedElementIds);
  // Potentially other store actions or state might be needed here

  useEffect(() => {
    if (!canvas) {
      return;
    }

    const onSelectionCreated = (e: any) => {
      // Logic to be moved from Canvas.tsx
      console.log('useCanvasSelectionEvents: selection:created', e);
      const selectedObjects = e.selected || [];
      const ids = selectedObjects.map((obj: any) => obj.customId).filter(Boolean);
      setSelectedElementIds(ids);
    };

    const onSelectionUpdated = (e: any) => {
      // Logic to be moved from Canvas.tsx
      console.log('useCanvasSelectionEvents: selection:updated', e);
      const selectedObjects = e.selected || [];
      const ids = selectedObjects.map((obj: any) => obj.customId).filter(Boolean);
      setSelectedElementIds(ids);
    };

    const onSelectionCleared = (e: any) => {
      // Logic to be moved from Canvas.tsx
      console.log('useCanvasSelectionEvents: selection:cleared', e);
      setSelectedElementIds([]);
    };

    canvas.on('selection:created', onSelectionCreated);
    canvas.on('selection:updated', onSelectionUpdated);
    canvas.on('selection:cleared', onSelectionCleared);

    return () => {
      canvas.off('selection:created', onSelectionCreated);
      canvas.off('selection:updated', onSelectionUpdated);
      canvas.off('selection:cleared', onSelectionCleared);
    };
  }, [canvas, setSelectedElementIds]);
};
