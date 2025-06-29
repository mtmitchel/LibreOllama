// src/features/canvas/components/ui/LayersPanel.tsx
import React, { useState } from 'react';
import { useUnifiedCanvasStore } from '../../../../stores';
// import { Layer } from '../../stores/slices/layerStore'; // Legacy import - using simple interface
interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export const LayersPanel: React.FC = () => {
  // Simplified layers for unified store - TODO: implement full layer system
  const layers: Layer[] = [];
  const layerActions = {
    moveLayer: (fromIndex: number, toIndex: number) => {
      console.log('🔄 [LayersPanel] Moving layer from', fromIndex, 'to', toIndex);
      // TODO: Implement in unified store
    },
    toggleLayerVisibility: (layerId: string) => {
      console.log('👁️ [LayersPanel] Toggling visibility for layer:', layerId);
      // TODO: Implement in unified store
    },
    setLayerLocked: (layerId: string, locked: boolean) => {
      console.log('🔒 [LayersPanel] Setting layer lock:', layerId, locked);
      // TODO: Implement in unified store
    }
  };
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