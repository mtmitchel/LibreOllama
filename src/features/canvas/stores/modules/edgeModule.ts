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
  // Current pointer position for drawing preview
  pointer?: { x: number; y: number };
  // Current snap target for visual feedback
  snapTarget?: {
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
  // Compute and persist geometry for dirty edges (RAF-batched by caller)
  computeAndCommitDirtyEdges: () => void;
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
      computeAndCommitDirtyEdges: () => {
        const state = getState() as any;
        const elems: Map<ElementId, any> = state.elements;
        const edges: Map<ElementId, EdgeElement> = state.edges;
        if (!edges || edges.size === 0) return;

        const updates: Array<{ id: ElementId; updates: Partial<EdgeElement> }> = [];
        const toAABB = (pts: number[]) => {
          let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
          for (let i=0;i<pts.length;i+=2){const x=pts[i],y=pts[i+1]; if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;}
          return { x:minX, y:minY, width:Math.max(1,maxX-minX), height:Math.max(1,maxY-minY) };
        };
        edges.forEach((edge, id) => {
          if (!state.dirtyEdges?.has(id)) return;
          const src = elems.get(edge.source.elementId);
          const tgt = elems.get(edge.target.elementId);
          if (!src || !tgt) return;

          // Compute geometry in world coords using routing utils
          try {
            const { updateEdgeGeometry } = require('../../utils/routing') as typeof import('../../utils/routing');
            const geom = updateEdgeGeometry(edge as any, src as any, tgt as any);
            if (geom?.points && Array.isArray(geom.points)) {
              const aabb = toAABB(geom.points);
              try {
                const { createSpatialIndex } = require('../../utils/spatial-index');
                // In this store context, we cannot access the renderer's instance; callers should also update the index.
                // We include this for future plumbing; no-op here as we don't hold a global index.
              } catch {}

              updates.push({ id, updates: { ...geom, points: [...geom.points] } as any });
            }
          } catch (e) {
            console.warn('[edgeModule] routing/updateEdgeGeometry failed', e);
          }
        });

        if (updates.length) {
          // Commit immutably so subscribers fire
          state.batchUpdate(updates, { skipHistory: true, skipValidation: true });
          state.clearDirtyEdges();
        }
      },
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
            state.draft.pointer = world; // Keep both for compatibility during migration
          }
        });
      },

      updateEdgeDraftSnap: (snap) => {
        setState((state: any) => {
          if (state.draft) {
            state.draft.snap = snap;
            state.draft.snapTarget = snap; // Keep both for compatibility during migration
          }
        });
      },

      commitEdgeDraftTo: (target) => {
        const state = getState();
        if (!state.draft) return null;

        const finalTarget = target || state.draft.snap;
        
        // For free-floating edges without a target, use the current pointer position
        if (!finalTarget && state.draft.toWorld) {
          // Create a free-floating edge using world position
          const edgeId = getState().addEdge({
            type: 'edge',
            source: state.draft.from,
            target: {
              elementId: '' as ElementId,  // No target element
              portKind: 'CENTER'
            },
            routing: 'straight',
            stroke: '#374151',
            strokeWidth: 2,
            selectable: true,
            // Store the end position in points directly
            points: [
              0, 0,  // Will be calculated by routing
              state.draft.toWorld.x - 100, state.draft.toWorld.y - 100  // Temporary points
            ]
          });
          
          // Clear draft
          setState((state: any) => { state.draft = null; });
          return edgeId;
        }
        
        if (!finalTarget) {
          // Cancel if no valid target and no world position
          setState((state: any) => { state.draft = null; });
          return null;
        }

        // Create connected edge
        const edgeId = getState().addEdge({
          type: 'edge',
          source: state.draft.from,
          target: finalTarget,
          routing: 'straight',
          stroke: '#10b981',  // Green for connected
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