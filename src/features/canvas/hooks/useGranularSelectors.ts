// Granular Selectors for Canvas State Management
// Optimized selectors to prevent unnecessary re-renders

import type { CanvasElement, ElementId, SectionId } from '../types/enhanced.types';
import { 
  useUnifiedCanvasStore,
  useSelectedTool as useSelectedToolFromStore,
  canvasSelectors
} from '../../../stores';

// Element property selectors
export const useElementProperty = <T>(elementId: string, property: keyof CanvasElement): T | undefined => {
  return useUnifiedCanvasStore(
    (state) => {
      const element = state.elements.get(elementId);
      return element ? (element as any)[property] as T : undefined;
    }
  );
};

// Element position selector
export const useElementPosition = (elementId: string) => {
  return useUnifiedCanvasStore(
    (state) => {
      const element = state.elements.get(elementId);
      return element ? { x: element.x, y: element.y } : { x: 0, y: 0 };
    }
  );
};

// Element dimensions selector
export const useElementDimensions = (elementId: string) => {
  return useUnifiedCanvasStore(
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

// Element style selector - Fixed memoization issue by including updatedAt
export const useElementStyle = (elementId: string) => {
  return useUnifiedCanvasStore(
    (state) => {
      const element = state.elements.get(elementId);
      if (!element) return { style: {}, updatedAt: 0 };
      
      return {
        style: {
          fill: 'fill' in element ? element.fill : undefined,
          backgroundColor: 'backgroundColor' in element ? element.backgroundColor : undefined,
          stroke: 'stroke' in element ? element.stroke : undefined,
          strokeWidth: 'strokeWidth' in element ? element.strokeWidth : undefined,
          opacity: 'opacity' in element ? element.opacity : 1,
        },
        updatedAt: element.updatedAt || 0  // Break memoization when element updates
      };
    }
  );
};

// Selection state selectors
export const useIsElementSelected = (elementId: string) => {
  return useUnifiedCanvasStore((state) => state.selectedElementIds.has(elementId as ElementId));
};

// Element collection selectors
export const useSelectedElements = () => {
  return useUnifiedCanvasStore(
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
  return useUnifiedCanvasStore(
    (state) => Array.from(state.elements.values()).filter((element) => {
      return element.type === type;
    })
  );
};

// Canvas statistics selectors
export const useElementCount = () => {
  return useUnifiedCanvasStore((state) => state.elements.size);
};

export const useSelectedCount = () => {
  return useUnifiedCanvasStore((state) => state.selectedElementIds.size);
};

// Viewport and interaction selectors
export const useViewportBounds = () => {
  return useUnifiedCanvasStore((state) => state.viewport);
};

export const useZoom = () => {
  return useUnifiedCanvasStore((state) => state.viewport.scale);
};

export const usePan = () => {
  return useUnifiedCanvasStore((state) => ({ x: state.viewport.x, y: state.viewport.y }));
};

// Tool and interaction state selectors
export const useCurrentTool = () => {
  return useUnifiedCanvasStore(canvasSelectors.selectedTool);
};

export const useIsDrawing = () => {
  return useUnifiedCanvasStore(canvasSelectors.isDrawing);
};

export const useCurrentPath = () => {
  return useUnifiedCanvasStore((state) => state.currentPath || []);
};

// History selectors
export const useCanUndo = () => {
  return useUnifiedCanvasStore((state) => state.canUndo);
};

export const useCanRedo = () => {
  return useUnifiedCanvasStore((state) => state.canRedo);
};

// Text editing selectors
export const useEditingTextId = () => {
  return useUnifiedCanvasStore((state) => state.textEditingElementId);
};

export const useIsEditingText = (elementId?: string) => {
  return useUnifiedCanvasStore(
    (state) => elementId ? state.textEditingElementId === elementId : state.textEditingElementId !== null
  );
};

// Section selectors
export const useSections = () => {
  return useUnifiedCanvasStore((state) => Array.from(state.sections.values()));
};

export const useSection = (sectionId: SectionId) => {
  return useUnifiedCanvasStore((state) => state.sections.get(sectionId));
};

export const useElementsInSection = (sectionId: SectionId) => {
  return useUnifiedCanvasStore(
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
  return useUnifiedCanvasStore(
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
export const useElements = () => useUnifiedCanvasStore(canvasSelectors.elements);
export const useSelectedElementIds = () => useUnifiedCanvasStore(canvasSelectors.selectedElementIds);
export const useElement = (id: string) => useUnifiedCanvasStore((state) => state.elements.get(id));
