// src/features/canvas/core/TransformerController.ts
import Konva from 'konva';
import { ElementRegistry } from './ElementRegistry';
import { computeSnapPoints, getElementBounds, findAlignmentSnap, calculateSnapLines } from '../utils/snappingUtils';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
import { CanvasElement, ElementId, isCircleElement, isRectangleElement, isTriangleElement, isStickyNoteElement, isImageElement, isTextElement } from '../types/enhanced.types';

/**
 * Imperative centralized transformer controller
 * - Attaches a single Konva.Transformer to the selection
 * - Supports multi-select
 * - Persists transform (resize/rotate/position) back to store with undo-safe batching
 */
export class TransformerController {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private guideLayer?: Konva.Layer;
  private registry: ElementRegistry;
  private transformer: Konva.Transformer;
  private unsubSelection: () => void;
  private guideH?: Konva.Line;
  private guideV?: Konva.Line;
  private nodeDragListeners: Map<string, (e: any) => void> = new Map();

  constructor(stage: Konva.Stage, layer: Konva.Layer, registry: ElementRegistry, guideLayer?: Konva.Layer) {
    this.stage = stage;
    this.layer = layer;
    this.registry = registry;

    this.transformer = new Konva.Transformer({
      rotateAnchorOffset: 32,
      // Only four corner anchors
      enabledAnchors: ['top-left','top-right','bottom-left','bottom-right'],
      anchorStroke: '#3b82f6',
      anchorFill: '#ffffff',
      anchorSize: 8,
      borderStroke: '#3b82f6',
      ignoreStroke: true,
      keepRatio: false,
      visible: false,
    });
    this.layer.add(this.transformer);
    this.guideLayer = guideLayer;

    // Subscribe to selection changes
    this.unsubSelection = useUnifiedCanvasStore.subscribe(
      (s) => s.selectedElementIds,
      () => this.attachToSelection(),
      { equalityFn: (a, b) => a === b }
    );

    // Also re-attach when elements update (e.g., after creation/deletion)
    useUnifiedCanvasStore.subscribe((s) => s.elements, () => this.attachToSelection());

    // Persist updates when transform ends
    this.transformer.on('transform', this.handleTransform);
    this.transformer.on('dragstart', () => this.onTransformStart());
    this.transformer.on('transformstart', () => this.onTransformStart());
    this.transformer.on('dragend', () => this.onTransformEnd());
    this.transformer.on('transformend', this.handleTransformEnd);
  }

  destroy() {
    this.unsubSelection?.();
    this.transformer.off('transformend', this.handleTransformEnd);
    this.transformer.destroy();
    if (this.guideH) this.guideH.destroy();
    if (this.guideV) this.guideV.destroy();
    this.layer?.batchDraw();
  }

  private attachToSelection = () => {
    const { selectedElementIds } = useUnifiedCanvasStore.getState();
    // console.log('🔧 TransformerController attachToSelection called, selectedIds:', Array.from(selectedElementIds));
    
    if (!selectedElementIds || selectedElementIds.size === 0) {
      // console.log('🔧 No selection, hiding transformer');
      this.transformer.nodes([]);
      this.transformer.visible(false);
      this.layer.batchDraw();
      return;
    }

    const nodes: Konva.Node[] = [];
    selectedElementIds.forEach((id) => {
      const node = this.registry.get(id as ElementId);
      if (node) {
        // console.log('🔧 Found node for ID:', id, node);
        nodes.push(node);
      } else {
        // console.log('🔧 No node found for ID:', id);
      }
    });

    // detach old listeners
    this.nodeDragListeners.forEach((fn, key) => {
      const n = this.registry.get(key as unknown as ElementId);
      if (n) n.off('dragmove', fn);
    });
    this.nodeDragListeners.clear();

    // attach new listeners to show guides when dragging
    const store = useUnifiedCanvasStore.getState();
    const snapEnabled = (store as any).snapToGrid as boolean;

    nodes.forEach((n) => {
      // Detach previous dragmove listener for this node
      const prev = this.nodeDragListeners.get(n.id());
      if (prev) {
        try { n.off('dragmove', prev); } catch {}
      }
      const fn = (e: any) => this.updateGuides(e.target as Konva.Node, snapEnabled);
      n.on('dragmove', fn);
      this.nodeDragListeners.set(n.id(), fn);
    });

    // console.log('🔧 Setting transformer nodes:', nodes);
    // Ensure selected nodes are interactive (especially text groups created with listening:false)
    nodes.forEach((n) => {
      try {
        if (typeof (n as any).listening === 'function') (n as any).listening(true);
        if (typeof (n as any).draggable === 'function') (n as any).draggable(true);
        if ((n as any).getClassName && (n as any).getClassName() === 'Group') {
          const grp = n as Konva.Group;
          const textChild = grp.findOne('Text') as Konva.Text | null;
          const rectChild = grp.findOne('Rect') as Konva.Rect | null;
          if (textChild && typeof (textChild as any).listening === 'function') {
            (textChild as any).listening(true);
          }
          if (rectChild && typeof (rectChild as any).listening === 'function') {
            (rectChild as any).listening(true);
          }
          // Ensure the group has a hit area matching its bounds
          try { grp.off('mousedown.transformer-hit'); } catch {}
          grp.on('mousedown.transformer-hit', (evt) => {
            evt.cancelBubble = true; // keep selection
          });
        }
      } catch {}
    });

    // Ensure transformer is listening so its anchors receive pointer events
    try { this.transformer.listening(true); } catch {}
    this.transformer.nodes(nodes);
    this.transformer.visible(nodes.length > 0);
    this.layer.batchDraw();
  };

  private updateGuides(node: Konva.Node, snap: boolean) {
    if (!this.guideLayer) return;

    // Current node bounds in stage coordinates
    const rect = (node as any).getClientRect ? (node as any).getClientRect() : null;
    if (!rect) return;

    // Build a synthetic element-like object for the dragged node using its current rect
    const draggedEl = { x: rect.x, y: rect.y, width: rect.width, height: rect.height } as any;

    // Gather candidate elements: all non-selected elements
    const store = useUnifiedCanvasStore.getState();
    const selected = store.selectedElementIds || new Set<string>();
    const nodeId = (node.id && node.id()) || '';
    const elements = Array.from(store.elements.values()).filter((el) => el && el.id !== nodeId && !selected.has(el.id as any));

    // Compute guide lines and alignment deltas
    const lines = calculateSnapLines(draggedEl, elements, 8);

    // Optionally snap the node position while dragging
    if (snap && elements.length > 0) {
      const candidates = elements.map((e) => computeSnapPoints(e)).filter(Boolean) as Array<{ xs: number[]; ys: number[] }>;
      const draggedBounds = getElementBounds(draggedEl)!;
      const res = findAlignmentSnap(draggedBounds, candidates, 8);
      if (res.snapX != null) {
        // move node so that its aligned edge/center matches the snapX
        const currentX = (node as any).x?.();
        if (typeof currentX === 'number') {
          (node as any).x(currentX + res.dx);
        }
      }
      if (res.snapY != null) {
        const currentY = (node as any).y?.();
        if (typeof currentY === 'number') {
          (node as any).y(currentY + res.dy);
        }
      }
    }

    // Ensure guide line nodes are created
    if (!this.guideH) {
      this.guideH = new Konva.Line({ points: [0, 0, 0, 0], stroke: '#3b82f6', dash: [4, 4], listening: false });
      this.guideLayer.add(this.guideH);
    }
    if (!this.guideV) {
      this.guideV = new Konva.Line({ points: [0, 0, 0, 0], stroke: '#3b82f6', dash: [4, 4], listening: false });
      this.guideLayer.add(this.guideV);
    }

    // Default to hidden lines
    this.guideH.visible(false);
    this.guideV.visible(false);

    // Also publish to UI store for a declarative consumer if desired
    try { useUnifiedCanvasStore.getState().setSnapLines?.(lines as any); } catch {}

    // Apply calculated lines (vertical and/or horizontal)
    for (const l of lines) {
      const [x1, y1, x2, y2] = l.points;
      if (Math.abs(x1 - x2) < 0.5) {
        // vertical
        this.guideV.points(l.points as any);
        this.guideV.visible(true);
      } else if (Math.abs(y1 - y2) < 0.5) {
        // horizontal
        this.guideH.points(l.points as any);
        this.guideH.visible(true);
      }
    }

    this.guideLayer.batchDraw();
  }

  private clearGuides() {
    if (this.guideH) this.guideH.destroy();
    if (this.guideV) this.guideV.destroy();
    this.guideH = undefined;
    this.guideV = undefined;
    try { useUnifiedCanvasStore.getState().setSnapLines?.([] as any); } catch {}
    this.guideLayer?.batchDraw();
  }

  private handleTransform = () => {
    // Grid snapping (first pass) using UI flags
    const store = useUnifiedCanvasStore.getState();
    const snap = (store as any).snapToGrid as boolean;
    const grid = 10; // base grid size

    if (!snap) return;

    const nodes = this.transformer.nodes();
    if (!nodes || nodes.length === 0) return;

    for (const node of nodes) {
      const x = (node as any).x?.();
      const y = (node as any).y?.();
      if (typeof x === 'number' && typeof y === 'number') {
        const gx = Math.round(x / grid) * grid;
        const gy = Math.round(y / grid) * grid;
        (node as any).x(gx);
        (node as any).y(gy);
      }
    }
    this.layer.batchDraw();
  };

  private onTransformStart() {
    try { (useUnifiedCanvasStore.getState() as any).setCaretVisible?.(false); } catch {}
  }

  private handleTransformEnd = () => {
    this.clearGuides();
    const store = useUnifiedCanvasStore.getState();
    const nodes = this.transformer.nodes();
    if (!nodes || nodes.length === 0) return;

    const updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }> = [];

    for (const node of nodes) {
      const id = node.id() as ElementId;
      const element = store.elements.get(id);
      if (!element) continue;

      // If this is our text group, write width/height back to element for persistence
      if (isTextElement(element)) {
        const w = (node as any).width?.();
        const h = (node as any).height?.();
        if (typeof w === 'number') (next as any).width = w;
        if (typeof h === 'number') (next as any).height = h;
      }

      // Common transforms
      const rotation = (node as any).rotation?.() ?? 0;
      const x = (node as any).x?.() ?? element.x;
      const y = (node as any).y?.() ?? element.y;
      const scaleX = (node as any).scaleX?.() ?? 1;
      const scaleY = (node as any).scaleY?.() ?? 1;

      const nodeWidth = (node as any).width?.() ?? (node as any).radius?.() * 2 ?? (element as any).width;
      const nodeHeight = (node as any).height?.() ?? (node as any).radius?.() * 2 ?? (element as any).height;

      const next: Partial<CanvasElement> = { x, y, rotation };

      if (isRectangleElement(element) || isStickyNoteElement(element) || isImageElement(element)) {
        const newWidth = Math.max(1, nodeWidth * scaleX);
        const newHeight = Math.max(1, nodeHeight * scaleY);
        next.width = newWidth as any;
        next.height = newHeight as any;
      } else if (isCircleElement(element)) {
        const newRadius = Math.max(1, ((node as any).radius?.() ?? element.radius) * Math.max(scaleX, scaleY));
        next.radius = newRadius as any;
      } else if (isTriangleElement(element)) {
        // For triangles stored as points, approximate by scaling width/height if available
        const newWidth = Math.max(1, nodeWidth * scaleX);
        const newHeight = Math.max(1, nodeHeight * scaleY);
        (next as any).width = newWidth;
        (next as any).height = newHeight;
      }

      updates.push({ id, updates: next });

      // Reset node scales to 1 to avoid compounding
      if (typeof (node as any).scaleX === 'function') {
        (node as any).scaleX(1);
      }
      if (typeof (node as any).scaleY === 'function') {
        (node as any).scaleY(1);
      }
    }

    if (updates.length > 0) {
      // Batch update to create a single undo entry
      store.batchUpdate(updates, { skipHistory: false });
    }

    this.layer.batchDraw();
    try { (useUnifiedCanvasStore.getState() as any).setCaretVisible?.(true); } catch {}
  };
}
