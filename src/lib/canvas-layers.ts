/**
 * Layer management system for canvas elements
 * Provides z-ordering, grouping, and layer-based operations
 */

import { CanvasElement } from '@/stores/konvaCanvasStore';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
  elementIds: string[];
  color?: string; // Optional color coding for layers
}

export interface LayerManager {
  layers: Layer[];
  activeLayerId: string | null;
  createLayer: (name: string) => Layer;
  deleteLayer: (layerId: string) => void;
  moveElementToLayer: (elementId: string, layerId: string) => void;
  duplicateLayer: (layerId: string) => Layer;
  setLayerVisibility: (layerId: string, visible: boolean) => void;
  setLayerLocked: (layerId: string, locked: boolean) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  reorderLayers: (layerIds: string[]) => void;
  getElementLayer: (elementId: string) => Layer | null;
  getLayerElements: (layerId: string, elements: Record<string, CanvasElement>) => CanvasElement[];
}

/**
 * Create a new layer management system
 */
export const createLayerManager = (
  initialLayers: Layer[] = [],
  onLayersChange: (layers: Layer[]) => void
): LayerManager => {
  let layers = initialLayers.length > 0 ? [...initialLayers] : [
    {
      id: 'default',
      name: 'Default Layer',
      visible: true,
      locked: false,
      opacity: 1,
      zIndex: 0,
      elementIds: []
    }
  ];
  
  let activeLayerId = layers[0]?.id || null;

  const notifyChange = () => {
    onLayersChange([...layers]);
  };

  const generateLayerId = (): string => {
    return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createLayer = (name: string): Layer => {
    const maxZIndex = Math.max(...layers.map(l => l.zIndex), -1);
    
    const newLayer: Layer = {
      id: generateLayerId(),
      name: name || `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      zIndex: maxZIndex + 1,
      elementIds: []
    };

    layers.push(newLayer);
    activeLayerId = newLayer.id;
    notifyChange();
    
    return newLayer;
  };

  const deleteLayer = (layerId: string): void => {
    if (layers.length <= 1) {
      console.warn('Cannot delete the last layer');
      return;
    }

    const layerIndex = layers.findIndex(l => l.id === layerId);
    if (layerIndex === -1) return;

    const layerToDelete = layers[layerIndex];
    
    // Move elements to default layer or first available layer
    const defaultLayer = layers.find(l => l.id === 'default') || layers[0];
    if (defaultLayer && defaultLayer.id !== layerId) {
      defaultLayer.elementIds.push(...layerToDelete.elementIds);
    }

    layers.splice(layerIndex, 1);
    
    // Update active layer if deleted
    if (activeLayerId === layerId) {
      activeLayerId = layers[0]?.id || null;
    }

    notifyChange();
  };

  const moveElementToLayer = (elementId: string, targetLayerId: string): void => {
    // Remove from current layer
    layers.forEach(layer => {
      const index = layer.elementIds.indexOf(elementId);
      if (index > -1) {
        layer.elementIds.splice(index, 1);
      }
    });

    // Add to target layer
    const targetLayer = layers.find(l => l.id === targetLayerId);
    if (targetLayer) {
      targetLayer.elementIds.push(elementId);
      notifyChange();
    }
  };

  const duplicateLayer = (layerId: string): Layer => {
    const sourceLayer = layers.find(l => l.id === layerId);
    if (!sourceLayer) throw new Error('Layer not found');

    const duplicatedLayer: Layer = {
      ...sourceLayer,
      id: generateLayerId(),
      name: `${sourceLayer.name} Copy`,
      elementIds: [...sourceLayer.elementIds], // Copy element references
      zIndex: Math.max(...layers.map(l => l.zIndex)) + 1
    };

    layers.push(duplicatedLayer);
    notifyChange();
    
    return duplicatedLayer;
  };

  const setLayerVisibility = (layerId: string, visible: boolean): void => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      layer.visible = visible;
      notifyChange();
    }
  };

  const setLayerLocked = (layerId: string, locked: boolean): void => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      layer.locked = locked;
      notifyChange();
    }
  };

  const setLayerOpacity = (layerId: string, opacity: number): void => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
      notifyChange();
    }
  };

  const reorderLayers = (layerIds: string[]): void => {
    const reorderedLayers = layerIds
      .map(id => layers.find(l => l.id === id))
      .filter(Boolean) as Layer[];
    
    // Update z-indices based on new order
    reorderedLayers.forEach((layer, index) => {
      layer.zIndex = index;
    });

    layers = reorderedLayers;
    notifyChange();
  };

  const getElementLayer = (elementId: string): Layer | null => {
    return layers.find(layer => layer.elementIds.includes(elementId)) || null;
  };

  const getLayerElements = (layerId: string, elements: Record<string, CanvasElement>): CanvasElement[] => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return [];

    return layer.elementIds
      .map(id => elements[id])
      .filter(Boolean);
  };

  return {
    get layers() { return [...layers]; },
    get activeLayerId() { return activeLayerId; },
    createLayer,
    deleteLayer,
    moveElementToLayer,
    duplicateLayer,
    setLayerVisibility,
    setLayerLocked,
    setLayerOpacity,
    reorderLayers,
    getElementLayer,
    getLayerElements
  };
};
