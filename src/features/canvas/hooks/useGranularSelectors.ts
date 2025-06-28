// Granular Selectors for Canvas State Management
// Optimized selectors to prevent unnecessary re-renders

import type { CanvasElement } from '../types/enhanced.types';
import type { ElementId } from '../types/enhanced.types';
import { 
  useCanvasStore,
  useSelectedTool as useSelectedToolFromStore,
  canvasSelectors
} from '../../../stores';

// Element property selectors
export const useElementProperty = <T>(elementId: string, property: keyof CanvasElement): T | undefined => {
  return useCanvasStore(
    (state) => {
      const element = state.elements.get(elementId);
      return element ? (element as any)[property] as T : undefined;
    }
  );
};

// Element position selector
export const useElementPosition = (elementId: string) => {
  return useCanvasStore(
    (state) => {
      const element = state.elements.get(elementId);
      return element ? { x: element.x, y: element.y } : { x: 0, y: 0 };
    }
  );
};

// Element dimensions selector
export const useElementDimensions = (elementId: string) => {
  return useCanvasStore(
    (state) => {
      const element = state.elements.get(elementId);
      if (!element) return { width: 0, height: 0 };
      
      // Handle different element types
      if ('width' in element && 'height' in element) {
        return { width: element.width, height: element.height };
      } else if ('radius' in element) {
        return { width: (element as any).radius * 2, height: (element as any).radius * 2 };
      } else {
        return { width: 50, height: 50 }; // Default dimensions
      }
    }
  );
};

// Element style selector
export const useElementStyle = (elementId: string) => {
  return useCanvasStore(
    (state) => {
      const element = state.elements.get(elementId);
      if (!element) return {};
      
      return {
        fill: 'fill' in element ? element.fill : undefined,
        stroke: 'stroke' in element ? element.stroke : undefined,
        strokeWidth: 'strokeWidth' in element ? element.strokeWidth : undefined,
        opacity: 'opacity' in element ? element.opacity : 1,
      };
    }
  );
};

// Selection state selectors
export const useIsElementSelected = (elementId: string) => {
  return useCanvasStore((state) => state.selectedElementIds.has(elementId as ElementId));
};

// Element collection selectors
export const useSelectedElements = () => {
  return useCanvasStore(
    (state) => {
      const selectedIds = Array.from(state.selectedElementIds);
      return selectedIds
        .map((id: string) => state.elements.get(id))
        .filter((element) => element !== undefined);
    }
  );
};

// Elements by type selector
export const useElementsByType = (type: string) => {
  return useCanvasStore(
    (state) => Array.from(state.elements.values()).filter((element) => {
      return element.type === type;
    })
  );
};

// Canvas statistics selectors
export const useElementCount = () => {
  return useCanvasStore((state) => state.elements.size);
};

export const useSelectedCount = () => {
  return useCanvasStore((state) => state.selectedElementIds.size);
};

// Viewport and interaction selectors
export const useViewportBounds = () => {
  return useCanvasStore((state) => state.viewport);
};

export const useZoom = () => {
  return useCanvasStore((state) => state.viewport.scale);
};

export const usePan = () => {
  return useCanvasStore((state) => ({ x: state.viewport.x, y: state.viewport.y }));
};

// Tool and interaction state selectors
export const useCurrentTool = () => {
  return useCanvasStore(canvasSelectors.selectedTool);
};

export const useIsDrawing = () => {
  return useCanvasStore(canvasSelectors.isDrawing);
};

export const useCurrentPath = () => {
  return useCanvasStore((state) => state.currentPath || []);
};

// History selectors
export const useCanUndo = () => {
  return useCanvasStore((state) => state.canUndo);
};

export const useCanRedo = () => {
  return useCanvasStore((state) => state.canRedo);
};

// Text editing selectors
export const useEditingTextId = () => {
  return useCanvasStore((state) => state.textEditingElementId);
};

export const useIsEditingText = (elementId?: string) => {
  return useCanvasStore(
    (state) => elementId ? state.textEditingElementId === elementId : state.textEditingElementId !== null
  );
};

// Section selectors
export const useSections = () => {
  return useCanvasStore((state) => Array.from(state.sections.values()));
};

export const useSection = (sectionId: string) => {
  return useCanvasStore((state) => state.sections.get(sectionId));
};

export const useElementsInSection = (sectionId: string) => {
  return useCanvasStore(
    (state) => {
      const sectionElements = state.sectionElementMap.get(sectionId);
      if (!sectionElements) return [];
      
      return Array.from(sectionElements)
        .map(id => state.elements.get(id))
        .filter((element) => element !== undefined);
    }
  );
};

// Performance monitoring selector
export const useRenderingStats = () => {
  return useCanvasStore(
    (state) => ({
      totalElements: state.elements.size,
      selectedElements: state.selectedElementIds.size,
      sections: state.sections.size,
      isDrawing: state.isDrawing,
      currentTool: state.selectedTool,
    })
  );
};

// Re-export commonly used store hooks for convenience
export { useSelectedToolFromStore as useSelectedTool };

// Convenience selectors using unified store
export const useElements = () => useCanvasStore(canvasSelectors.elements);
export const useSelectedElementIds = () => useCanvasStore(canvasSelectors.selectedElementIds);
export const useElement = (id: string) => useCanvasStore((state) => state.elements.get(id));
