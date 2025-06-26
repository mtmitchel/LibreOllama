// src/features/canvas/components/ui/LayersPanel.tsx
import React, { useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore.enhanced';
import { Layer } from '../../stores/slices/layerStore';

export const LayersPanel: React.FC = () => {
  const { layers, layerActions } = useCanvasStore((state) => state);
  const [draggedLayer, setDraggedLayer] = useState<Layer | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, layer: Layer) => {
    setDraggedLayer(layer);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layer.id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetLayer: Layer) => {
    e.preventDefault();
    if (!draggedLayer) return;

    const fromIndex = layers.findIndex((layer) => layer.id === draggedLayer.id);
    const toIndex = layers.findIndex((layer) => layer.id === targetLayer.id);

    if (fromIndex !== -1 && toIndex !== -1) {
      layerActions.moveLayer(fromIndex, toIndex);
    }

    setDraggedLayer(null);
  };

  return (
    <div className="bg-gray-800 text-white p-2 rounded-lg">
      <h3 className="text-lg font-bold mb-2">Layers</h3>
      <div>
        {layers.map((layer: Layer) => (
          <div
            key={layer.id}
            draggable
            onDragStart={(e) => handleDragStart(e, layer)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, layer)}
            className="flex items-center justify-between p-1 mb-1 bg-gray-700 rounded cursor-move"
          >
            <span>{layer.name}</span>
            <div className="flex items-center">
              <button onClick={() => layerActions.toggleLayerVisibility(layer.id)} className="mr-2">
                {layer.visible ? '👁️' : '🙈'}
              </button>
              <button onClick={() => layerActions.setLayerLocked(layer.id, !layer.locked)}>
                {layer.locked ? '🔒' : '🔓'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};