// src/features/canvas/stores/modules/edgeModule.ts
import { ElementId, EdgeElement, EdgeEndpoint, EdgeRouting, PortKind } from '../../types/canvas-elements';
import { StoreModule, StoreSet, StoreGet } from './types';

/**
 * Edge draft state for interactive connector creation
 */
export interface EdgeDraft {
  from: {
    elementId: ElementId;
    portKind: PortKind;
  };
  toWorld?: { x: number; y: number };
  snap?: {
    elementId: ElementId;
    portKind: PortKind;
  };
}

/**
 * Edge module state
 */
export interface EdgeState {
  // All edges indexed by their element ID
  edges: Map<ElementId, EdgeElement>;
  
  // Draft state for interactive connector creation
  draft: EdgeDraft | null;
  
  // Performance: track which edges need reflow after element changes
  dirtyEdges: Set<ElementId>;
}

/**
 * Edge module actions
 */
export interface EdgeActions {
  // Edge CRUD
  addEdge: (partial: Omit<EdgeElement, 'points' | 'x' | 'y' | 'width' | 'height'>) => ElementId;
  updateEdge: (id: ElementId, updates: Partial<EdgeElement>) => void;
  removeEdge: (id: ElementId) => void;
  
  // Edge configuration
  updateEdgeEndpoints: (id: ElementId, source?: EdgeEndpoint, target?: EdgeEndpoint) => void;
  setEdgeRouting: (id: ElementId, routing: EdgeRouting) => void;
  
  // Reflow system
  reflowEdgesForElement: (movedElementId: ElementId) => void;
  markEdgesDirty: (edgeIds: ElementId[]) => void;
  clearDirtyEdges: () => void;
  
  // Interactive draft system
  startEdgeDraft: (from: { elementId: ElementId; portKind: PortKind }) => void;
  updateEdgeDraftPointer: (world: { x: number; y: number }) => void;
  updateEdgeDraftSnap: (snap: { elementId: ElementId; portKind: PortKind } | null) => void;
  commitEdgeDraftTo: (target?: { elementId: ElementId; portKind: PortKind }) => ElementId | null;
  cancelEdgeDraft: () => void;
  
  // Queries
  getEdgesConnectedTo: (elementId: ElementId) => EdgeElement[];
  getEdgeById: (id: ElementId) => EdgeElement | undefined;
}

/**
 * Creates the edge module with state and actions
 */
export const createEdgeModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<EdgeState, EdgeActions> => {
  // Cast functions for flexibility with store types
  const setState = set as any;
  const getState = get as any;

  return {
    state: {
      edges: new Map(),
      draft: null,
      dirtyEdges: new Set(),
    },

    actions: {
      addEdge: (partial) => {
        const id = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as ElementId;
        
        setState((state: any) => {
          // Calculate bounding box from endpoints (will be updated by routing)
          const minX = Math.min(partial.source.elementId.length, partial.target.elementId.length) * 10; // placeholder
          const minY = Math.min(partial.source.elementId.length, partial.target.elementId.length) * 10;
          
          const edge: EdgeElement = {
            ...partial,
            id,
            x: minX,
            y: minY,
            width: 100, // placeholder, will be recalculated
            height: 100,
            points: [], // will be calculated by routing
          };
          
          state.edges.set(id, edge);
          state.dirtyEdges.add(id);
        });
        
        return id;
      },

      updateEdge: (id, updates) => {
        setState((state: any) => {
          const edge = state.edges.get(id);
          if (edge) {
            Object.assign(edge, updates);
            state.dirtyEdges.add(id);
          }
        });
      },

      removeEdge: (id) => {
        setState((state: any) => {
          state.edges.delete(id);
          state.dirtyEdges.delete(id);
        });
      },

      updateEdgeEndpoints: (id, source, target) => {
        setState((state: any) => {
          const edge = state.edges.get(id);
          if (edge) {
            if (source) edge.source = source;
            if (target) edge.target = target;
            state.dirtyEdges.add(id);
          }
        });
      },

      setEdgeRouting: (id, routing) => {
        setState((state: any) => {
          const edge = state.edges.get(id);
          if (edge) {
            edge.routing = routing;
            state.dirtyEdges.add(id);
          }
        });
      },

      reflowEdgesForElement: (movedElementId) => {
        setState((state: any) => {
          // Find all edges connected to the moved element
          for (const [edgeId, edge] of state.edges) {
            if (edge.source.elementId === movedElementId || edge.target.elementId === movedElementId) {
              state.dirtyEdges.add(edgeId);
            }
          }
        });
      },

      markEdgesDirty: (edgeIds) => {
        setState((state: any) => {
          edgeIds.forEach(id => state.dirtyEdges.add(id));
        });
      },

      clearDirtyEdges: () => {
        setState((state: any) => {
          state.dirtyEdges.clear();
        });
      },

      // Interactive draft system
      startEdgeDraft: (from) => {
        setState((state: any) => {
          state.draft = { from };
        });
      },

      updateEdgeDraftPointer: (world) => {
        setState((state: any) => {
          if (state.draft) {
            state.draft.toWorld = world;
          }
        });
      },

      updateEdgeDraftSnap: (snap) => {
        setState((state: any) => {
          if (state.draft) {
            state.draft.snap = snap;
          }
        });
      },

      commitEdgeDraftTo: (target) => {
        const state = getState();
        if (!state.draft) return null;

        const finalTarget = target || state.draft.snap;
        if (!finalTarget) {
          // Cancel if no valid target
          setState((state: any) => { state.draft = null; });
          return null;
        }

        // Create the edge
        const edgeId = getState().addEdge({
          type: 'edge',
          source: state.draft.from,
          target: finalTarget,
          routing: 'straight',
          stroke: '#000000',
          strokeWidth: 2,
          selectable: true,
        });

        // Clear draft
        setState((state: any) => { state.draft = null; });
        
        return edgeId;
      },

      cancelEdgeDraft: () => {
        setState((state: any) => {
          state.draft = null;
        });
      },

      // Queries
      getEdgesConnectedTo: (elementId) => {
        const state = getState();
        const connected: EdgeElement[] = [];
        
        for (const edge of state.edges.values()) {
          if (edge.source.elementId === elementId || edge.target.elementId === elementId) {
            connected.push(edge);
          }
        }
        
        return connected;
      },

      getEdgeById: (id) => {
        const state = getState();
        return state.edges.get(id);
      },
    },
  };
};