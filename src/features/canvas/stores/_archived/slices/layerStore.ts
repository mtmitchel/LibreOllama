// src/features/canvas/stores/slices/layerStore.ts
import { StateCreator } from 'zustand';
import { CanvasStore } from '../types';
import { LayerId } from '../../types/enhanced.types';

export interface Layer {
  id: LayerId;
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface LayerState {
  layers: Layer[];
  layerActions: {
    setLayers: (layers: Layer[]) => void;
    moveLayer: (fromIndex: number, toIndex: number) => void;
    toggleLayerVisibility: (layerId: LayerId) => void;
    setLayerLocked: (layerId: LayerId, locked: boolean) => void;
  };
}

export const createLayerSlice: StateCreator<
  CanvasStore,
  [],
  [],
  LayerState
> = (set, get) => {
  const initialLayers: Layer[] = [
    { id: LayerId('background'), name: 'Background', visible: true, locked: false },
    { id: LayerId('main'), name: 'Main Content', visible: true, locked: false },
    { id: LayerId('connector'), name: 'Connectors', visible: true, locked: false },
    { id: LayerId('ui'), name: 'UI', visible: true, locked: true },
  ];

  return {
    layers: initialLayers,
    layerActions: {
      setLayers: (layers: Layer[]) => set({ layers }),
      moveLayer: (fromIndex: number, toIndex: number) => {
        const { layers } = get();
        const newLayers = [...layers];
        const [movedLayer] = newLayers.splice(fromIndex, 1);
        newLayers.splice(toIndex, 0, movedLayer);
        set({ layers: newLayers });
      },
      toggleLayerVisibility: (layerId: LayerId) => {
        set((state) => ({
          layers: state.layers.map((layer) =>
            layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
          ),
        }));
      },
      setLayerLocked: (layerId: LayerId, locked: boolean) => {
        set((state) => ({
          layers: state.layers.map((layer) =>
            layer.id === layerId ? { ...layer, locked } : layer
          ),
        }));
      },
    },
  };
};
