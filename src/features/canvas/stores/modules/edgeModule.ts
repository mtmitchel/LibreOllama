// src/features/canvas/stores/modules/edgeModule.ts
import { ElementId, EdgeElement, EdgeEndpoint, EdgeRouting, PortKind } from '../../types/canvas-elements';
import { updateEdgeGeometry } from '../../utils/routing';
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
  // Connector type (line or arrow)
  connectorType?: 'line' | 'arrow';
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
  addEdge: (partial: Omit<EdgeElement, 'points' | 'x' | 'y' | 'width' | 'height'> & { 
    points?: number[], 
    x?: number, 
    y?: number, 
    width?: number, 
    height?: number 
  }) => ElementId;
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
  startEdgeDraft: (from: { elementId: ElementId; portKind: PortKind }, connectorType?: 'line' | 'arrow') => void;
  updateEdgeDraftPointer: (world: { x: number; y: number }) => void;
  updateEdgeDraftSnap: (snap: { elementId: ElementId; portKind: PortKind } | null) => void;
  commitEdgeDraftTo: (target?: { elementId: ElementId; portKind: PortKind }) => ElementId | null;
  cancelEdgeDraft: () => void;
  
  // Edge endpoint dragging
  updateEdgeEndpointPreview: (id: ElementId, endpoint: 'start' | 'end', x: number, y: number) => void;
  commitEdgeEndpoint: (id: ElementId, endpoint: 'start' | 'end', snap?: { elementId: ElementId; portKind: PortKind }) => void;
  
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
          
          // Skip routing for free-form edges (they already have their points)
          if ((!src || !tgt) && edge.points && edge.points.length >= 4) {
            // Free-form edge - already has points, just ensure bounding box is correct
            const aabb = toAABB(edge.points);
            updates.push({ id, updates: aabb as any });
            return;
          }
          
          // Skip if both elements are missing
          if (!src || !tgt) return;

          // Compute geometry in world coords using routing utils
          try {
            const geom = updateEdgeGeometry(edge as any, src as any, tgt as any);
            if (geom?.points && Array.isArray(geom.points)) {
              // Bounding box available if needed: const aabb = toAABB(geom.points);
              updates.push({ id, updates: { ...geom, points: [...geom.points] } as any });
            }
          } catch (e) {
            console.warn('[edgeModule] routing/updateEdgeGeometry failed', e);
          }
        });

        if (updates.length) {
          // Commit to edges map immutably so subscribers fire
          setState((st: any) => {
            const nextEdges = new Map(st.edges);
            updates.forEach(({ id, updates: up }) => {
              const prev = nextEdges.get(id);
              if (prev) nextEdges.set(id, { ...prev, ...up });
            });
            st.edges = nextEdges;
            st.dirtyEdges = new Set();
          });
        }
      },
      addEdge: (partial) => {
        const id = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as ElementId;
        
        setState((state: any) => {
          // Use provided dimensions if available (for free-form edges), otherwise use placeholders
          const edge: EdgeElement = {
            ...partial,
            id,
            x: partial.x ?? 0,
            y: partial.y ?? 0,
            width: partial.width ?? 100,
            height: partial.height ?? 100,
            points: partial.points ?? [], // Use provided points or empty array
          };
          
          const next = new Map(state.edges);
          next.set(id, edge);
          state.edges = next;
          state.dirtyEdges.add(id);
        });
        
        return id;
      },

      updateEdge: (id, updates) => {
        setState((state: any) => {
          const prev = state.edges.get(id);
          if (prev) {
            const next = new Map(state.edges);
            next.set(id, { ...prev, ...updates });
            state.edges = next;
            state.dirtyEdges.add(id);
          }
        });
      },

      removeEdge: (id) => {
        setState((state: any) => {
          const next = new Map(state.edges);
          next.delete(id);
          state.edges = next;
          state.dirtyEdges.delete(id);
          // Also remove from selection to clear overlay
          if (state.selectedElementIds && state.selectedElementIds instanceof Set) {
            const nextSel = new Set(state.selectedElementIds);
            nextSel.delete(id);
            state.selectedElementIds = nextSel;
            state.lastSelectedElementId = nextSel.size ? Array.from(nextSel).at(-1) : null;
          }
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
      startEdgeDraft: (from, connectorType = 'line') => {
        setState((state: any) => {
          state.draft = { 
            from, 
            connectorType,
            pointer: null,  // Will be set by first updateEdgeDraftPointer call
            toWorld: null,
            snap: null,
            snapTarget: null
          };
        });
      },

      updateEdgeDraftPointer: (world) => {
        setState((state: any) => {
          if (state.draft) {
            // If this is the first pointer update, save it as the start position
            if (!state.draft.pointer) {
              state.draft.pointer = world;
            }
            state.draft.toWorld = world;
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
        
        // Handle free-floating edges (no start or end element)
        const hasStartElement = state.draft.from.elementId && state.draft.from.elementId !== '';
        const hasEndElement = finalTarget && finalTarget.elementId && finalTarget.elementId !== '';
        
        // For completely free-floating edges or edges with only one endpoint
        if (!hasEndElement && state.draft.toWorld) {
          // Calculate start position - either from element or from pointer when draft started
          let startX = 0, startY = 0;
          if (hasStartElement) {
            // Get element position for start point - will be calculated by routing
            const element = (getState() as any).elements?.get(state.draft.from.elementId);
            if (element) {
              startX = element.x || 0;
              startY = element.y || 0;
            }
          } else {
            // Use pointer position as start (free-floating start)
            startX = state.draft.pointer?.x || state.draft.toWorld.x - 100;
            startY = state.draft.pointer?.y || state.draft.toWorld.y - 100;
          }
          
          // Calculate bounding box for the edge
          const minX = Math.min(startX, state.draft.toWorld.x);
          const minY = Math.min(startY, state.draft.toWorld.y);
          const maxX = Math.max(startX, state.draft.toWorld.x);
          const maxY = Math.max(startY, state.draft.toWorld.y);
          
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
            subType: state.draft.connectorType || 'line',
            // Store the actual world positions in points
            points: [
              startX, startY,
              state.draft.toWorld.x, state.draft.toWorld.y
            ],
            // Set proper dimensions for rendering
            x: minX,
            y: minY,
            width: Math.max(1, maxX - minX),
            height: Math.max(1, maxY - minY)
          });
          
          // Mark the new edge as dirty so it gets rendered
          setState((state: any) => { 
            state.draft = null;
            state.dirtyEdges.add(edgeId);
          });
          
          // Immediately compute geometry
          try { (getState() as any).computeAndCommitDirtyEdges?.(); } catch {}
          
          return edgeId;
        }
        
        if (!finalTarget) {
          // Cancel if no valid target and no world position
          setState((state: any) => { state.draft = null; });
          return null;
        }

        // Determine routing from current tool (line = straight, else orthogonal)
        const currentTool = (getState() as any)?.selectedTool as string | undefined;
        const routing: EdgeRouting = (currentTool === 'connector-line' || currentTool === 'connector-arrow') ? 'straight' : 'orthogonal';

        // Create connected edge with explicit ports
        const edgeId = getState().addEdge({
          type: 'edge',
          source: state.draft.from,
          target: finalTarget,
          routing,
          stroke: '#10b981',  // Green for connected
          strokeWidth: 2,
          selectable: true,
          subType: state.draft.connectorType || 'line',  // Use the connector type from draft
        });

        // Immediately compute routed points and commit
        try { (getState() as any).computeAndCommitDirtyEdges?.(); } catch {}

        // Mark neighbors for reflow so subsequent moves stay connected
        try {
          const api = getState() as any;
          const neighbors = [state.draft.from.elementId, finalTarget.elementId].filter(Boolean);
          neighbors.forEach((id) => api.reflowEdgesForElement?.(id));
        } catch {}

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
      
      // Edge endpoint dragging
      updateEdgeEndpointPreview: (id, endpoint, x, y) => {
        setState((state: any) => {
          const edge = state.edges.get(id);
          if (!edge || !edge.points || edge.points.length < 4) return;
          
          // Update preview points (mutable during drag)
          if (endpoint === 'start') {
            edge.points[0] = x;
            edge.points[1] = y;
          } else {
            edge.points[edge.points.length - 2] = x;
            edge.points[edge.points.length - 1] = y;
          }
        });
      },
      
      commitEdgeEndpoint: (id, endpoint, snap) => {
        setState((state: any) => {
          const edge = state.edges.get(id);
          if (!edge) return;
          
          const next = new Map(state.edges);
          const updatedEdge = { ...edge };
          
          if (endpoint === 'start') {
            if (snap) {
              updatedEdge.source = {
                elementId: snap.elementId,
                portKind: snap.portKind
              };
            } else if (edge.points && edge.points.length >= 4) {
              // Free-floating start
              updatedEdge.source = {
                elementId: '' as ElementId,
                portKind: 'CENTER' as PortKind
              };
              // Keep the dragged position in points
              updatedEdge.points = [...edge.points];
            }
          } else {
            if (snap) {
              updatedEdge.target = {
                elementId: snap.elementId,
                portKind: snap.portKind
              };
            } else if (edge.points && edge.points.length >= 4) {
              // Free-floating end
              updatedEdge.target = {
                elementId: '' as ElementId,
                portKind: 'CENTER' as PortKind
              };
              // Keep the dragged position in points
              updatedEdge.points = [...edge.points];
            }
          }
          
          // Recalculate bounding box
          if (updatedEdge.points && updatedEdge.points.length >= 4) {
            const minX = Math.min(...updatedEdge.points.filter((_, i) => i % 2 === 0));
            const minY = Math.min(...updatedEdge.points.filter((_, i) => i % 2 === 1));
            const maxX = Math.max(...updatedEdge.points.filter((_, i) => i % 2 === 0));
            const maxY = Math.max(...updatedEdge.points.filter((_, i) => i % 2 === 1));
            updatedEdge.x = minX;
            updatedEdge.y = minY;
            updatedEdge.width = Math.max(1, maxX - minX);
            updatedEdge.height = Math.max(1, maxY - minY);
          }
          
          next.set(id, updatedEdge);
          state.edges = next;
          state.dirtyEdges.add(id);
        });
        
        // Trigger reflow if connected to elements
        const state = getState();
        const edge = state.edges.get(id);
        if (edge) {
          if (edge.source.elementId) {
            getState().reflowEdgesForElement(edge.source.elementId);
          }
          if (edge.target.elementId) {
            getState().reflowEdgesForElement(edge.target.elementId);
          }
          getState().computeAndCommitDirtyEdges();
        }
      },
    },
  };
};
