import React, { useEffect, useRef, useMemo } from 'react';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { PenTool } from './tools/drawing/PenTool';
import { MarkerTool } from './tools/drawing/MarkerTool';
import { HighlighterTool } from './tools/drawing/HighlighterTool';
import { StickyNoteTool } from './tools/creation/StickyNoteTool';
import { ConnectorTool } from './tools/creation/ConnectorTool';
import { ElementId, CanvasElement, createElementId, ConnectorElement, createGroupId, GroupId } from '../types/enhanced.types';
import { performanceLogger } from '../utils/performance/PerformanceLogger';
import { CanvasRendererV2 } from '../services/CanvasRendererV2';
import { getContentPointer } from '../utils/pointer-to-content';
import { nanoid } from 'nanoid';

interface NonReactCanvasStageProps {
  stageRef?: React.RefObject<Konva.Stage | null>;
  selectedTool?: string;
}

// Helper to create an efficient tiled dot-grid background (FigJam style)
const createDotGridHelper = (_viewportWidth: number, _viewportHeight: number) => {
  const dotRadius = 1;
  const dotSpacing = 20;
  const dotColor = 'rgba(0, 0, 0, 0.2)';

  // Build a tiny tile canvas and use it as a pattern
  const tile = document.createElement('canvas');
  tile.width = dotSpacing;
  tile.height = dotSpacing;
  const ctx = tile.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, tile.width, tile.height);
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(tile.width / 2, tile.height / 2, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  const patternRect = new Konva.Rect({
    x: -20000,
    y: -20000,
    width: 40000,
    height: 40000,
    listening: false,
    perfectDrawEnabled: false,
    name: 'dot-grid',
  });
  // Use Konva pattern fill API
  try {
    (patternRect as any).fillPatternImage(tile);
    (patternRect as any).fillPatternRepeat('repeat');
    (patternRect as any).fillPatternOffset({ x: 0, y: 0 });
    (patternRect as any).fillPriority('pattern');
  } catch {}

  return patternRect;
};

// Minimal imperative renderer for drawing tools and persisted strokes
export const NonReactCanvasStage: React.FC<NonReactCanvasStageProps> = ({ stageRef: externalStageRef, selectedTool: selectedToolProp }) => {
  const internalStageRef = useRef<Konva.Stage | null>(null);
  const stageRef = externalStageRef || internalStageRef;
  const containerRef = useRef<HTMLDivElement>(null);

  // Typed layer helpers (guards) — prefer these over ad‑hoc findOne calls
  type Layers = { stage: Konva.Stage; main: Konva.Layer; overlay: Konva.Layer; background: Konva.Layer; preview: Konva.Layer };
  const requireLayers = (stage?: Konva.Stage | null): Layers | null => {
    if (!stage) return null;
    const main = stage.findOne<Konva.Layer>('.main-layer') || null;
    const overlay = stage.findOne<Konva.Layer>('.overlay-layer') || null;
    const background = stage.findOne<Konva.Layer>('.background-layer') || null;
    const preview = stage.findOne<Konva.Layer>('.preview-fast-layer') || main;
    if (!main || !overlay || !background) return null;
    return { stage, main, overlay, background, preview: (preview as Konva.Layer) };
  };

  const batchDraw = (which: 'stage' | 'main' | 'overlay' | 'preview' = 'stage') => {
    const L = requireLayers(stageRef.current); if (!L) return;
    if (which === 'stage') L.stage.batchDraw();
    if (which === 'main') L.main.batchDraw();
    if (which === 'overlay') L.overlay.batchDraw();
    if (which === 'preview') L.preview.batchDraw();
  };

  const findOnMain = <T extends Konva.Node = Konva.Node>(sel: string): T | null => {
    const L = requireLayers(stageRef.current); if (!L) return null;
    return L.main.findOne<T>(sel) ?? null;
  };
  const findOnOverlay = <T extends Konva.Node = Konva.Node>(sel: string): T | null => {
    const L = requireLayers(stageRef.current); if (!L) return null;
    return L.overlay.findOne<T>(sel) ?? null;
  };

  const selectedTool = selectedToolProp || useUnifiedCanvasStore(s => s.selectedTool);
  const viewport = useUnifiedCanvasStore(s => s.viewport);
  const elements = useUnifiedCanvasStore(s => s.elements);
  const zoomViewport = useUnifiedCanvasStore(s => s.zoomViewport);
  const setViewport = useUnifiedCanvasStore(s => s.setViewport);
  const selectedStickyNoteColor = useUnifiedCanvasStore(s => s.selectedStickyNoteColor);
  const addElement = useUnifiedCanvasStore(s => s.addElement);
  const setSelectedTool = useUnifiedCanvasStore(s => s.setSelectedTool);
  const selectElement = useUnifiedCanvasStore(s => s.selectElement);
  const draft = useUnifiedCanvasStore(s => s.draft);

  // Create stage and layers imperatively
  useEffect(() => {
    performanceLogger.initStart();
    if (!containerRef.current) return;
    // Avoid duplicate init
    if (stageRef.current) return;

    const container = containerRef.current;
    // TEST 5: Ensure integer CSS sizing
    const width = Math.floor(container.clientWidth);
    const height = Math.floor(container.clientHeight);
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.transform = ''; // No CSS transforms
    
    const stage = new Konva.Stage({
      container,
      width: width,
      height: height,
      listening: true,
    });
    // Do not allow stage panning via drag; we pan via dedicated interactions
    try { stage.draggable(false); } catch {}

    // Background layer with FigJam-style dot grid
    const backgroundLayer = new Konva.Layer({ listening: false, name: 'background-layer' });
    
    // Solid background (FigJam uses a light gray)
    const bg = new Konva.Rect({ 
      x: -20000, 
      y: -20000, 
      width: 40000, 
      height: 40000, 
      fill: '#f5f5f5', // FigJam-style light gray
      listening: false, 
      perfectDrawEnabled: false 
    });
    backgroundLayer.add(bg);
    
    // Add dot grid to background
    const dotsGroup = createDotGridHelper(width, height);
    backgroundLayer.add(dotsGroup);

    // Main content layer (persisted elements)
    const mainLayer = new Konva.Layer({ listening: true, name: 'main-layer' });
    // Note: hitGraphEnabled is deprecated, listening: true handles hit detection

    // Preview fast layer for live drawing
    const previewLayer = new Konva.Layer({ listening: true, name: 'preview-fast-layer' });

    // Overlay layer (transformer needs to be interactive)
    const overlayLayer = new Konva.Layer({ listening: true, name: 'overlay-layer' });

    stage.add(backgroundLayer);
    stage.add(mainLayer);
    stage.add(previewLayer);
    stage.add(overlayLayer);

    stageRef.current = stage;

    // Initialize viewport size (do not offset position to avoid misalignment)
    try {
      setViewport({ width, height });
    } catch {}

    // Mark init end and start a frame loop for FPS
    performanceLogger.initEnd();
    performanceLogger.startFrameLoop();

    // Wheel zoom (simple, centralized)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = (e as any).deltaY as number;
      const direction = delta > 0 ? -1 : 1;
      const factor = 1.1;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const newScale = Math.max(0.1, Math.min(10, direction > 0 ? oldScale * factor : oldScale / factor));
      zoomViewport(newScale, pointer.x, pointer.y);
    };
    stage.on('wheel', (evt) => onWheel(evt.evt));

    // Resize observer with debouncing for performance
    let resizeTimeout: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        for (const entry of entries) {
          if (entry.target === container) {
            // Use contentRect for more accurate dimensions
            const w = Math.floor(entry.contentRect.width);
            const h = Math.floor(entry.contentRect.height);
            
            // Skip if dimensions haven't actually changed
            const currentSize = stage.size();
            if (currentSize.width === w && currentSize.height === h) {
              return;
            }
            
            console.log('[ResizeObserver] Container resized:', { from: currentSize, to: { width: w, height: h } });
            container.style.width = `${w}px`;
            container.style.height = `${h}px`;
            stage.size({ width: w, height: h });
            setViewport({ width: w, height: h });
            stage.batchDraw();
          }
        }
      }, 16); // Debounce at ~60fps
    });
    resizeObserver.observe(container);

    return () => {
      performanceLogger.stopFrameLoop();
      clearTimeout(resizeTimeout);
      try { resizeObserver.disconnect(); } catch {}
      try { 
        // Clean up renderer before destroying stage
        const renderer = (window as any).__CANVAS_RENDERER_V2__;
        if (renderer) {
          delete (window as any).__CANVAS_RENDERER_V2__;
        }
        stage.destroy(); 
      } catch {}
      stageRef.current = null;
    };
  }, [stageRef, setViewport, zoomViewport]);

  // Sync stage transform with store viewport
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    stage.scale({ x: viewport.scale, y: viewport.scale });
    stage.position({ x: viewport.x, y: viewport.y });
    stage.batchDraw();
    try { (window as any).CANVAS_PERF?.incBatchDraw?.('stage'); } catch {}
  }, [viewport.scale, viewport.x, viewport.y]);

  // Initialize renderer once when stage is ready
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    const layers = requireLayers(stage);
    if (!layers) return;

    // Expose store to window for renderer access
    (window as any).__UNIFIED_CANVAS_STORE__ = useUnifiedCanvasStore;
    
    // Only create and initialize renderer if it doesn't exist
    if (!(window as any).__CANVAS_RENDERER_V2__) {
      const renderer = new CanvasRendererV2();
      (window as any).__CANVAS_RENDERER_V2__ = renderer;
      renderer.init(stage, { background: layers.background, main: layers.main, preview: layers.preview || layers.main, overlay: layers.overlay }, {
        onUpdateElement: (id, updates) => useUnifiedCanvasStore.getState().updateElement(id as any, updates)
      });
      
      // Store the refreshTransformer function globally for table operations
      // Since Zustand stores are frozen, we can't add properties dynamically
      // Instead, store it on the window object alongside the renderer
      (window as any).__REFRESH_TRANSFORMER__ = (elementId?: string) => {
        renderer.refreshTransformer(elementId);
      };
    }
  }, [stageRef.current]); // Only depend on stage existence

  // Sync elements to renderer when they change
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    const renderer: InstanceType<typeof CanvasRendererV2> | undefined = (window as any).__CANVAS_RENDERER_V2__;
    if (!renderer) return;
    
    // Render from a unified list containing elements and edges
    const combined: any[] = [
      ...Array.from((useUnifiedCanvasStore.getState().elements as any).values()),
      ...Array.from((useUnifiedCanvasStore.getState().edges as any).values()),
    ];
    renderer.syncElements(combined);
  }, [elements, useUnifiedCanvasStore(s => s.edges), useUnifiedCanvasStore(s => s.selectedElementIds)]);

  // Wire selection state to Konva.Transformer
  const [lastSelectedElementId, selectionSize] = useUnifiedCanvasStore(
    useShallow((s) => [s.lastSelectedElementId, s.selectedElementIds.size])
  );
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    const renderer: InstanceType<typeof CanvasRendererV2> | undefined = (window as any).__CANVAS_RENDERER_V2__;
    if (!renderer) return;
    // Read the latest selection from the store and pass a fresh Set to renderer
    const sel = (useUnifiedCanvasStore.getState() as any).selectedElementIds;
    const ids = sel instanceof Set ? new Set(sel as Set<ElementId>) : new Set<ElementId>();
    renderer.syncSelection(ids as any);
  }, [lastSelectedElementId, selectionSize]);

  // Pure Konva Text Tool Implementation - Watch for selectedTool changes
  const currentSelectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  
  useEffect(() => {
    const s = stageRef.current;
    if (!s) return;
    const stage: Konva.Stage = s;
    console.log('[TEXT-DEBUG] Text tool effect running, stage exists:', !!stage, 'selectedTool:', currentSelectedTool);
    if (!currentSelectedTool) return; // Don't initialize if tool is undefined
    
    // Ensure container is positioned
    const container = stage.container();
    if (container) {
      container.style.position = 'relative';
    }
    
    const L = requireLayers(stage);
    const overlayLayer = L?.overlay || null;
    const mainLayer = L?.main || null;
    console.log('[TEXT-DEBUG] Layers found - overlay:', !!overlayLayer, 'main:', !!mainLayer);
    if (!overlayLayer || !mainLayer) {
      console.error('[TEXT-DEBUG] Missing required layers, cannot initialize text tool');
      return;
    }
    
    let tool: 'select' | 'text' = 'select';
    let cursorGhost: Konva.Group | null = null;
    let textarea: HTMLTextAreaElement | null = null;
    
    // Coordinate transformation helpers (using stage transform since no viewport group)
    
    // Stage px → World units
    function stageToWorld(pt: { x: number; y: number }) {
      const inv = stage.getAbsoluteTransform().copy().invert();
      return inv.point(pt);
    }
    
    // World units → Stage px
    function worldToStage(pt: { x: number; y: number }) {
      const tr = stage.getAbsoluteTransform();
      return tr.point(pt);
    }
    
    // World rect → DOM CSS pixels (relative to page)
    function worldRectToDOM(x: number, y: number, w: number, h: number) {
      const topLeft = worldToStage({ x, y });
      const rect = stage.container().getBoundingClientRect();
      const scale = stage.scaleX(); // Assuming uniform scale
      return {
        left: rect.left + topLeft.x,
        top: rect.top + topLeft.y,
        width: w * scale,
        height: h * scale,
      };
    }
    
    // Get current scale
    function viewportScale() {
      const s = stage.getAbsoluteScale();
      return { x: s.x, y: s.y };
    }
    
    const PADDING = 8;
    const BASE_FONT = 24;  // Changed to 24 as requested
    const MIN_W = 120;
    const DESCENDER_GUARD = 0.15;
    
    function useTextTool() {
      tool = 'text';
      stage.container().style.cursor = 'crosshair';
      overlayLayer!.moveToTop();
      
      // Cursor "Text" ghost that follows the mouse
      cursorGhost?.destroy();
      cursorGhost = new Konva.Group({ listening: false });
      const ghostText = new Konva.Text({ 
        text: 'Text', 
        fontSize: 24, 
        fill: '#2B2B2B', 
        x: 0, y: 0 
      });
      cursorGhost.add(ghostText);
      overlayLayer!.add(cursorGhost);
      overlayLayer!.batchDraw();
      
      stage.on('mousemove.text', (e) => {
        const p = stage.getPointerPosition();
        if (!p) return;
        // Convert stage coordinates to world coordinates for proper positioning
        const worldPos = stageToWorld(p);
        cursorGhost?.position({ x: worldPos.x + 12, y: worldPos.y + 12 });
        overlayLayer!.batchDraw();
      });
      
      // click to create
      stage.on('mousedown.text', handleTextMouseDown);
      console.info('[TEXT] tool active');
    }
    
    function leaveTextTool() {
      tool = 'select';
      stage.container().style.cursor = 'default';
      stage.off('.text');
      cursorGhost?.destroy();
      cursorGhost = null;
      overlayLayer!.batchDraw();
    }
    
    function handleTextMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
      console.log('[TEXT-DEBUG] MouseDown - tool:', tool, 'target:', e.target.getClassName());
      if (tool !== 'text') return;
      // Treat clicks not on element groups (with id) as empty clicks (incl. background rects)
      const target = e.target as Konva.Node;
      const elementGroup = target.findAncestor((node: Konva.Node) => node.getClassName() === 'Group' && !!(node as Konva.Group).id(), true) as Konva.Group | null;
      if (elementGroup && elementGroup.id()) return;
      
      const p = stage.getPointerPosition(); 
      if (!p) return;
      
      const world = stageToWorld(p);
      
      // 1) Create text element in store
      const textElement = {
        id: createElementId(nanoid()),
        type: 'text' as const,
        x: world.x,
        y: world.y,
        width: 60,  // Small initial width that will expand
        height: BASE_FONT,  // Exact font height - no padding
        text: '',
        fontSize: BASE_FONT,
        fontFamily: 'Inter, system-ui, Arial',
        fill: '#111827',
        fontStyle: 'normal',
        textAlign: 'left' as const,
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isHidden: false
      };
      
      // Add to store
      useUnifiedCanvasStore.getState().addElement(textElement);

      // Switch back to select tool immediately after creating text element
      useUnifiedCanvasStore.getState().setSelectedTool('select');
      leaveTextTool();

      // Wait for renderer to create the node, then start editing (retry a few frames)
      let tries = 0;
      const tryOpen = () => {
        const renderer = (window as any).__CANVAS_RENDERER_V2__ as CanvasRendererV2;
        if (!renderer) { if (tries++ < 10) return requestAnimationFrame(tryOpen); else return; }
        const node = (renderer as any).nodeMap.get(textElement.id) as Konva.Group | undefined;
        if (!node) { if (tries++ < 10) return requestAnimationFrame(tryOpen); else return; }

        const ktext = node.findOne<Konva.Text>('.text');
        const frame = node.findOne<Konva.Rect>('.hit-area');
        if (!ktext || !frame) { if (tries++ < 10) return requestAnimationFrame(tryOpen); else return; }

        startTextEdit({ group: node, ktext, frame, world, elementId: textElement.id });
      };
      requestAnimationFrame(tryOpen);
    }
    
    function startTextEdit({ group, ktext, frame, world, elementId }: any) {
      stage.draggable(false); // freeze panning during edit
      
      textarea?.remove();
      textarea = document.createElement('textarea');
      const el = textarea;
      // Identify as an active canvas text editor to bypass global shortcuts
      el.setAttribute('data-role', 'canvas-text-editor');
      el.setAttribute('data-text-editing', 'true');
      
      // Style: content-box so scrollHeight ignores padding (critical)
      Object.assign(el.style, {
        position: 'fixed',  // Fixed positioning relative to viewport for proper placement
        boxSizing: 'border-box',  // Include border in dimensions
        border: '1px solid #3B82F6',
        borderRadius: '4px',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.95)',
        whiteSpace: 'pre-wrap', // Wrap immediately at editor width
        wordBreak: 'break-word', // Allow word breaking to wrap
        fontFamily: ktext.fontFamily() || 'Inter, system-ui, Arial',
        color: '#111827',
        zIndex: '9999',
      } as CSSStyleDeclaration);
      
      // Font scaled by viewport scale - no padding
      const sc = viewportScale();
      el.style.fontSize = `${ktext.fontSize() * sc.y}px`;
      el.style.lineHeight = '1';  // Normal line height to show full text
      el.style.padding = '0 1px';  // Absolute minimum: 1px horizontal only
      
      // prevent stage from stealing focus
      ['pointerdown','mousedown','touchstart','wheel'].forEach(ev =>
        el.addEventListener(ev, e => e.stopPropagation(), { capture: true, passive: false })
      );
      
      // Append to document.body since we're using fixed positioning
      document.body.appendChild(el);
      
      // Convert the element's actual world rect to DOM px
      // Use the group's actual position, not the click position
      const worldX = group.x();
      const worldY = group.y();
      const worldW = frame.width();
      const worldH = frame.height();
      const dom = worldRectToDOM(worldX, worldY, worldW, worldH);
      
      el.style.left = `${dom.left}px`;
      el.style.top = `${dom.top}px`;
      el.style.width = `${dom.width}px`;  // Set initial width to match frame
      // Allow contraction after typing by keeping a small minimum width
      el.style.minWidth = `8px`;
      // Set initial height to match what liveGrow will set
      el.style.height = `${ktext.fontSize() * sc.y + 2}px`;  // Same as in liveGrow
      
      el.value = '';
      el.focus();
      setTimeout(() => el.setSelectionRange(el.value.length, el.value.length), 0);

      // Mark element as editing to prevent renderer from drawing duplicate text
      try { useUnifiedCanvasStore.getState().updateElement(elementId as ElementId, { isEditing: true }); } catch {}
      
      // Hide Konva text during edit
      ktext.visible(false);
      mainLayer?.batchDraw();
      
      el.addEventListener('input', () => liveGrow(el, { group, ktext, frame, elementId }));
      el.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && !e.shiftKey) { 
          e.preventDefault(); 
          finalizeText(el, { group, ktext, frame, elementId }, 'commit'); 
        }
        if (e.key === 'Escape') { 
          e.preventDefault(); 
          finalizeText(el, { group, ktext, frame, elementId }, 'cancel'); 
        }
      });
      el.addEventListener('blur', () => finalizeText(el, { group, ktext, frame, elementId }, 'commit'));
      
      console.info('[TEXT] textarea mounted');
    }
    
    function liveGrow(el: HTMLTextAreaElement, note: { group: Konva.Group; ktext: Konva.Text; frame: Konva.Rect; elementId: string }) {
      const { group, ktext, frame, elementId } = note;
      
      // mirror for measurement
      ktext.text(el.value || ' ');  // Use space for empty to maintain height
      
      const sc = viewportScale();
      
      // Measure content width and adjust both expand and shrink in real time
      const textWidth = Math.ceil(ktext.getTextWidth());
      const padding = 10; // small buffer to avoid immediate edge hits
      const minWorldWidth = Math.max(12, Math.ceil(ktext.fontSize()));
      const neededWorldW = Math.max(minWorldWidth, textWidth + padding);
      const currentWorldW = frame.width();

      if (Math.abs(neededWorldW - currentWorldW) > 0.5) {
        // Update frame and DOM width
        frame.width(neededWorldW);
        el.style.width = `${neededWorldW * sc.x}px`;

        // Redraw layer for visual feedback
        mainLayer?.batchDraw();

        // Update store width + text (skipHistory defaults to true in store)
        useUnifiedCanvasStore.getState().updateElement(elementId as ElementId, {
          width: neededWorldW,
          text: el.value
        });
      } else {
        // Keep text in sync without width change
        useUnifiedCanvasStore.getState().updateElement(elementId as ElementId, {
          text: el.value
        });
      }
      
      // Don't set ktext.width() - let it render naturally without clipping
      ktext.width(undefined);  // Remove width constraint so text isn't clipped
      
      // Keep text position consistent
      ktext.position({ x: 0.5, y: 0 });  // Almost no padding
      
      // Set exact height to font size - accounting for border-box
      el.style.height = `${ktext.fontSize() * sc.y + 2}px`;  // Font size + 2px for borders (1px top + 1px bottom)
    }
    
        function finalizeText(el: HTMLTextAreaElement, note: { group: Konva.Group; ktext: Konva.Text; frame: Konva.Rect; elementId: string }, mode: 'commit'|'cancel') {
      const { group, ktext, frame, elementId } = note;
      
      if (mode === 'commit' && el.value.trim().length) {
        // show Konva text
        ktext.visible(true);
        ktext.text(el.value);
        ktext.width(undefined); // Remove width constraint to measure natural size
        
        // Measure actual text bounds to make frame hug text perfectly
        ktext._clearCache();
        const metrics = ktext.measureSize(ktext.text());
        const textWidth = Math.ceil(metrics.width) + 8; // More horizontal padding
        const textHeight = Math.ceil(metrics.height * 1.2); // Increased vertical padding to prevent clipping
        
        // Update frame to perfectly hug the text with no bottom gap
        frame.width(textWidth);
        frame.height(textHeight);
        
        // Position text with small padding to prevent clipping
        ktext.position({ x: 4, y: 2 });
        
        // Update store with final text and width only (height is intrinsic); clear editing flag
        useUnifiedCanvasStore.getState().updateElement(elementId as ElementId, { 
          text: el.value,
          width: textWidth,
          isEditing: false
        });
        
        mainLayer?.batchDraw();
        
        // Select the element to show resize handles
        useUnifiedCanvasStore.getState().clearSelection();
        useUnifiedCanvasStore.getState().selectElement(elementId as ElementId, false);
        
        // Attach transformer to the GROUP and set up proper resize handling
        const renderer = (window as any).__CANVAS_RENDERER_V2__ as CanvasRendererV2;
        const transformer = (window as any).__CANVAS_TRANSFORMER__ as Konva.Transformer;
        if (renderer && transformer && group && frame) {
          console.log('[RESIZE] Setting up transformer for text element', elementId);
          
          // Make the group draggable
          group.draggable(true);
          
          // Attach transformer to the GROUP
          transformer.nodes([group]);
          transformer.visible(true);
          transformer.keepRatio(false); // keepRatio is false to allow separate vertical/horizontal scaling
          transformer.enabledAnchors(['top-left','top-right','bottom-left','bottom-right','middle-left','middle-right','top-center','bottom-center']);
          transformer.anchorSize(8);
          transformer.borderStroke('#3B82F6');
          transformer.borderStrokeWidth(1);
          
          // Delegate resize behavior to CanvasRendererV2 to avoid duplicate handlers
          try {
            renderer.syncSelection(new Set([elementId] as any));
          } catch {}

          group.on('dragend', () => {
            useUnifiedCanvasStore.getState().updateElement(elementId as ElementId, {
              x: group.x(),
              y: group.y(),
            });
          });

          overlayLayer?.batchDraw();
        }
      } else {
        // cancel or empty: delete the element (clear editing flag first just in case)
        try { useUnifiedCanvasStore.getState().updateElement(elementId as ElementId, { isEditing: false }); } catch {}
        useUnifiedCanvasStore.getState().deleteElement(elementId as ElementId);
      }
      
      // Safely remove textarea if it still exists
      if (el && el.parentNode) {
        el.remove();
      }
      textarea = null;
      
      // Keep stage non-draggable so element drags don't pan the canvas
      try { stage.draggable(false); } catch {}
      leaveTextTool();
      
      // Switch back to select tool
      useUnifiedCanvasStore.getState().setSelectedTool('select');
      
      console.info('[TEXT] finalized', mode);
    }
    
    // Initialize based on current tool
    // Note: Text CREATION is handled here, text EDITING is handled by CanvasRendererV2
    if (currentSelectedTool === 'text') {
      useTextTool();
    }
    
    return () => {
      leaveTextTool();
      textarea?.remove();
    };
  }, [currentSelectedTool]); // Re-run when selectedTool changes

  // Optional: click-hit selection wiring (imperative) and double-click to edit
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;

    const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const target = e.target as Konva.Node;
      const currentTool = useUnifiedCanvasStore.getState().selectedTool;
      
      // Text tool is handled in its own effect above
      if (currentTool === 'text') return;
      
      // If clicked on empty stage or layer with select tool, clear selection
      // BUT only if the event wasn't cancelled by a child element (e.cancelBubble = true)
      if ((target === stage || target.getClassName() === 'Layer') && currentTool === 'select' && !e.cancelBubble) {
        useUnifiedCanvasStore.getState().clearSelection();
        
        // Hide the transformer
        const transformer = (window as any).__CANVAS_TRANSFORMER__ as Konva.Transformer;
        if (transformer) {
          transformer.nodes([]);
          transformer.visible(false);
          const overlayLayer = requireLayers(stage)?.overlay || null;
          if (overlayLayer) {
            overlayLayer.batchDraw();
          }
        }
        return;
      }
      // Ascend to the nearest Group with an id
      const group = target.findAncestor((node: Konva.Node) => {
        return node.getClassName() === 'Group' && !!(node as Konva.Group).id();
      }, true) as Konva.Group | null;
      if (group && group.id()) {
        const multi = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        useUnifiedCanvasStore.getState().selectElement(group.id() as ElementId, multi);
        return;
      }
      // Fallback: try direct id on the target
      const rawId = (target as any).id?.();
      if (rawId) {
        const multi = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        useUnifiedCanvasStore.getState().selectElement(rawId as ElementId, multi);
      }
      // else: clicks on transformer anchors or non-element shapes do nothing
    };

    stage.on('mousedown.select', onMouseDown);

    // Remove any legacy inline edit handlers - renderer handles all events now
    stage.off('.inlineEdit');

    return () => {
      try { stage.off('mousedown.select', onMouseDown); } catch {}
      stage.off('.inlineEdit'); // Clean up on unmount
    };
  }, [stageRef]);

  // Text edit overlay for non-React path - DISABLED: Renderer handles all text editing
  // Bridge: when store requests edit, delegate to RendererV2.openTextareaEditor
  const textEditingElementId = useUnifiedCanvasStore(s => s.textEditingElementId);
  const setTextEditingElement = useUnifiedCanvasStore(s => s.setTextEditingElement);
  const viewportState = useUnifiedCanvasStore(s => s.viewport);

  // Minimal bridge: if store sets textEditingElementId, ask renderer to open editor
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    if (!textEditingElementId) return;
    const renderer = (window as any).__CANVAS_RENDERER_V2__ as any;
    if (!renderer) return;
    let cancelled = false;
    let tries = 0;
    const attempt = () => {
      if (cancelled) return;
      const node = renderer?.nodeMap?.get?.(textEditingElementId) as Konva.Node | undefined;
      if (node) {
        try {
          renderer.openTextareaEditor?.(textEditingElementId, node);
        } catch (e) {
          console.warn('[NonReactCanvasStage] Failed to open editor via renderer:', e);
        }
      } else if (tries < 8) {
        tries++;
        requestAnimationFrame(attempt);
      }
    };
    attempt();
    return () => { cancelled = true; };
  }, [textEditingElementId, stageRef]);

  // Legacy heavy overlay path below remains disabled; kept for reference
  useEffect(() => {
    // DISABLED: All text editing is now handled by CanvasRendererV2
    return;

    const renderer = (window as any).__CANVAS_RENDERER_V2__ as CanvasRendererV2;
    if (!renderer) return;

    let cancelled = false;

    const waitForNodeAndStart = () => {
      if (cancelled) return;
      const el = useUnifiedCanvasStore.getState().elements.get(textEditingElementId as any);
      if (!el) { return; }
      const node = (renderer as any).nodeMap.get(textEditingElementId) as Konva.Group | undefined;
      if (!node) {
        // Retry on next frame until node is available (e.g., right after creation)
        if (!((window as any).__EDIT_PROBE_LOGGED__)) { console.info('[EDIT] waiting for node', textEditingElementId); (window as any).__EDIT_PROBE_LOGGED__ = true; }
        requestAnimationFrame(waitForNodeAndStart);
        return;
      }
      console.info('[EDIT] node ready', textEditingElementId);

      // Handle text element editing
      if (el.type === 'text') {
        const textNode = node.findOne<Konva.Text>('.text');
        if (!textNode) {
          console.warn('[EDIT] Text node not found in group');
          return;
        }
        
        const layer = node.getLayer();
        if (!layer) return;
        
        const textarea = document.createElement('textarea');
        const container = containerRef.current!;
        
        const { x: vx, y: vy, scale } = viewportState;
        
        // Style textarea for text editing
        Object.assign(textarea.style, {
          position: 'absolute',
          boxSizing: 'border-box',
          border: '2px solid #3B82F6',
          borderRadius: '4px',
          outline: 'none',
          resize: 'none',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.95)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: textNode.fontFamily() || 'Inter, system-ui, Arial',
          fontSize: `${(textNode.fontSize() || 16) * scale}px`,
          lineHeight: String(textNode.lineHeight() || 1.2),
          padding: '4px 8px',
          color: textNode.fill() || '#000',
          zIndex: '1000',
          minWidth: '120px',
          minHeight: '32px'
        } as CSSStyleDeclaration as any);
        
        // Position textarea
        textarea.style.left = `${vx + el.x * scale}px`;
        textarea.style.top = `${vy + el.y * scale}px`;
        textarea.style.width = `${(el.width || 120) * scale}px`;
        
        textarea.setAttribute('data-element-id', String(textEditingElementId));
        textarea.setAttribute('data-role', 'canvas-text-editor');
        // Mark as active text editing target so global shortcuts ignore it
        textarea.setAttribute('data-text-editing', 'true');
        textarea.value = textNode.text() || '';
        
        container.appendChild(textarea);
        
        // Hide Konva text during edit
        textNode.visible(false);
        layer.batchDraw();
        
        // Focus textarea
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.select();
        });
        
        // Handle input
        const onInput = () => {
          const newText = textarea.value;
          textNode.text(newText);
          
          // Measure text and update width if needed
          const measuredWidth = Math.ceil(textNode.width());
          const newWidth = Math.max(120, measuredWidth + 16);
          
          if (newWidth !== el.width) {
            useUnifiedCanvasStore.getState().updateElement(el.id, { 
              width: newWidth,
              text: newText 
            });
            textarea.style.width = `${newWidth * scale}px`;
          }
        };
        
        // Handle exit
        const onExitEdit = () => {
          const finalText = textarea.value.trim();
          
          if (finalText) {
            useUnifiedCanvasStore.getState().updateElement(el.id, { 
              text: finalText 
            });
          } else {
            // Delete empty text element
            useUnifiedCanvasStore.getState().deleteElement(el.id);
          }
          
          textNode.visible(true);
          layer.batchDraw();
          try { container.removeChild(textarea); } catch {}
          setTextEditingElement(null);
        };
        
        // Event listeners
        textarea.addEventListener('input', onInput);
        textarea.addEventListener('blur', onExitEdit);
        textarea.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onExitEdit();
          } else if (e.key === 'Escape') {
            textarea.value = textNode.text() || '';
            onExitEdit();
          }
        });
        
        // Stop propagation
        ['pointerdown', 'mousedown', 'touchstart', 'wheel'].forEach(ev =>
          textarea.addEventListener(ev, e => e.stopPropagation(), { capture: true, passive: false })
        );
        
        cleanup = () => {
          try { container.removeChild(textarea); } catch {}
        };
        
        return;
      }

      if (el.type === 'sticky-note') {
        const frame = node.findOne<Konva.Rect>('.frame');
        const bg = node.findOne<Konva.Rect>('.bg');
                 const ktext = node.findOne<Konva.Text>('.text');
         const layer = node.getLayer();
         
         // Find transformer more reliably - look in the overlay layer
         const stage = layer?.getStage();
         const overlayLayer = requireLayers(stage)?.overlay || null;
         let transformer = overlayLayer?.findOne('Transformer') as Konva.Transformer;
         
         // If transformer not found in overlay, try to find it anywhere in the stage
         if (!transformer) {
           transformer = stage?.findOne('Transformer') as Konva.Transformer;
         }
         
         // Last resort: use global transformer reference
         if (!transformer) {
           transformer = (window as any).__CANVAS_TRANSFORMER__ as Konva.Transformer;
         }

        // Check if nodes are valid and not destroyed
        if (!frame || !bg || !ktext || !layer) {
          console.warn('[EDIT] Missing required nodes for sticky note editing');
          return;
        }
        
        // Additional check for destroyed nodes
        try {
          // Test if nodes are still valid by accessing a property
          frame.width();
          bg.width();
          ktext.text();
        } catch (e) {
          console.warn('[EDIT] One or more nodes have been destroyed, cannot edit');
          return;
        }

        const textarea = document.createElement('textarea');
        const container = containerRef.current!;

        const PADDING = 12;
        const MIN_W = 120;
        const MIN_H = 80;
        const LINE_HEIGHT = 1.25; // Match the lineHeight used in CanvasRendererV2
        const DESCENDER_GUARD = 0.15; // ~15% of font size helps prevent caret clipping

        const { x: vx, y: vy, scale } = viewportState;

        // onEnterEdit: neutralize any frame scale to commit absolute width/height
        if (frame.scaleX() !== 1 || frame.scaleY() !== 1) {
          frame.width(frame.width() * frame.scaleX());
          frame.height(frame.height() * frame.scaleY());
          frame.scale({ x: 1, y: 1 });
        }
        
        // Only attach transformer if it exists and is valid
        // IMPORTANT: Attach to the group (node), not the frame, to keep hit-area and children aligned
        if (transformer && transformer.nodes) {
          try {
            transformer.nodes([node]);
          } catch (e) {
            console.warn('[EDIT] Could not attach transformer:', e);
            // Continue without transformer - editing can still work
          }
        }

        const w = Math.max(MIN_W, frame.width());
        
        // mountTextarea - Style textarea with exact specifications from instructions
        Object.assign(textarea.style, {
            position: 'absolute',
            boxSizing: 'content-box',  // critical for scrollHeight correctness
            border: '0',
            outline: 'none',
            resize: 'none',
            overflow: 'hidden',
            background: 'transparent',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: ktext.fontFamily() || 'Inter, system-ui, Arial',
            fontSize: `${ktext.fontSize() * scale}px`,
            lineHeight: String(ktext.lineHeight()),  // unitless to match Konva
            letterSpacing: `${ktext.letterSpacing() || 0}px`,
            padding: `${PADDING * scale}px`,
            color: '#000',
            zIndex: '1000'
        } as CSSStyleDeclaration as any);
        
        // placeTextarea - Position relative to viewport
        textarea.style.left = `${vx + el.x * scale}px`;
        textarea.style.top = `${vy + el.y * scale}px`;
        // With content-box: total rendered width = width + padding-left + padding-right
        // So to fit in frame width w, we need: width = w - 2*PADDING (in canvas units), then scale
        textarea.style.width = `${(w - 2 * PADDING) * scale}px`;

        // Tag textarea for future updates during viewport changes
        textarea.setAttribute('data-element-id', String(textEditingElementId));
        textarea.setAttribute('data-role', 'canvas-text-editor');
        textarea.setAttribute('autocomplete', 'off');
        textarea.setAttribute('autocorrect', 'off');
        textarea.setAttribute('autocapitalize', 'off');
        textarea.setAttribute('spellcheck', 'false');
        textarea.style.visibility = 'hidden';

        // Initial setup - prepare Konva text for measurement with consistent padding
        // Match the exact logic from CanvasRendererV2.createStickyNote
        ktext.width(w - 2 * PADDING);
        ktext.position({ x: PADDING, y: PADDING });
        
        // Start with current frame height
        const currentH = frame.height();
        
        // Don't change dimensions during initial setup
        layer.batchDraw();

        container.appendChild(textarea);
        textarea.value = ktext.text();
        
        // Perform initial sizing with actual content
        textarea.style.height = 'auto';
        const fontSize = ktext.fontSize();
        const guardPx = fontSize * scale * DESCENDER_GUARD;
        const initialDomH = textarea.scrollHeight + guardPx;
        textarea.style.height = `${initialDomH}px`;
        
        const initialCanvasH = initialDomH / scale;
        const initialH = Math.max(MIN_H, Math.ceil(initialCanvasH));
        
        try {
          if (initialH !== frame.height()) {
            frame.height(initialH);
            bg.height(initialH);
            if (transformer && transformer.forceUpdate) {
              transformer.forceUpdate();
            }
            layer.batchDraw();
          }
        } catch (e) {
          console.warn('[EDIT] Failed to set initial height - node may be destroyed:', e);
        }
        
        textarea.style.visibility = 'visible';
        
        // Focus with requestAnimationFrame as per instructions
        requestAnimationFrame(() => {
          textarea.focus();
          console.info('[EDIT] textarea mounted', textEditingElementId);
        });

        // Hide Konva text during edit (optional as per instructions)
        ktext.visible(false);
        layer.batchDraw();

        // liveGrow - Auto-expand while typing with consistent padding
        const onInput = () => {
          if (document.activeElement !== textarea) return;

          try {
            // Mirror into Konva for measurement; keep width synced with consistent padding
            ktext.text(textarea.value);
            ktext.width(w - 2 * PADDING);
            ktext.position({ x: PADDING, y: PADDING });

            // Read DOM height (content-box) + small guard for descenders
            textarea.style.height = 'auto';
            const fontSize = ktext.fontSize();
            const guardPx = fontSize * scale * DESCENDER_GUARD;
            const domH = textarea.scrollHeight + guardPx;
            textarea.style.height = `${domH}px`;

            const canvasH = domH / scale;
            const H = Math.max(MIN_H, Math.ceil(canvasH));

            if (H !== frame.height()) {
              frame.height(H);
              bg.height(H);
              if (transformer && transformer.forceUpdate) {
                transformer.forceUpdate();
              }
              layer.batchDraw();
            }
          } catch (e) {
            console.warn('[EDIT] Error in onInput handler - node may be destroyed:', e);
            // If nodes are destroyed, clean up the textarea
            if (textarea && textarea.parentNode) {
              textarea.blur();
            }
          }
        };

        // finalize - Compute final height on blur (no jump)
        const snapDPR = (v: number) => {
          const d = window.devicePixelRatio || 1;
          return Math.round(v * d) / d;
        };

        const onExitEdit = () => {
          try {
            // Use the current DOM measurement for final height
            textarea.style.height = 'auto';
            const fontSize = ktext.fontSize();
            const guardPx = fontSize * scale * DESCENDER_GUARD;
            const finalDomH = textarea.scrollHeight + guardPx;
            
            const finalCanvasH = finalDomH / scale;
            const finalH = snapDPR(Math.max(MIN_H, Math.ceil(finalCanvasH)));

            // Neutralize scale if needed
            if (frame.scaleX() !== 1 || frame.scaleY() !== 1) {
              frame.width(frame.width() * frame.scaleX());
              frame.height(frame.height() * frame.scaleY());
              frame.scale({ x: 1, y: 1 });
            }

            // Update Konva text with consistent padding logic
            ktext.text(textarea.value);
            ktext.width(w - 2 * PADDING);
            ktext.position({ x: PADDING, y: PADDING });

            if (finalH !== frame.height()) {
              frame.height(finalH);
              bg.height(finalH);
            }

            // Update store with final values
            if (finalH !== el.height || el.text !== textarea.value) {
              useUnifiedCanvasStore.getState().updateElement(el.id, { height: finalH, text: textarea.value });
            }

            ktext.visible(true);
            layer.batchDraw();
          } catch (e) {
            console.warn('[EDIT] Error in onExitEdit - nodes may be destroyed:', e);
            // Even if nodes are destroyed, try to save the text
            try {
              if (el && textarea.value !== el.text) {
                useUnifiedCanvasStore.getState().updateElement(el.id, { text: textarea.value });
              }
            } catch {}
          }
          
          // Always clean up textarea and state
          try { container.removeChild(textarea); } catch {}
          setTextEditingElement(null);
        };

        // Stop the stage from stealing focus
        ['pointerdown', 'mousedown', 'touchstart', 'wheel'].forEach(ev =>
          textarea.addEventListener(ev, e => e.stopPropagation(), { capture: true, passive: false })
        );
        textarea.addEventListener('input', onInput);
        textarea.addEventListener('blur', onExitEdit);
        // Stop propagation so global key handlers (delete/backspace) don't interfere
        textarea.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
                onExitEdit();
            }
        });

        // Register cleanup handler for effect unmount
        cleanup = () => {
            try {
                container.removeChild(textarea);
            } catch (e) {}
        };
        return;
    } else {
        // Generic text editing for other elements
        const container = containerRef.current!;
        const textarea = document.createElement('textarea');

        const { scale, x: vx, y: vy } = viewportState;
        // Helper to get element dimensions safely
        const getElDimensions = () => {
          if ('width' in el && typeof el.width === 'number') {
            return { width: el.width, height: ('height' in el && typeof el.height === 'number') ? el.height : 24 };
          }
          if (el.type === 'circle' && 'radius' in el && typeof el.radius === 'number') {
            return { width: el.radius * 2, height: el.radius * 2 };
          }
          return { width: 180, height: 24 };
        };
        const dims = getElDimensions();
        const width = dims.width * scale;
        const minHeight = Math.max(24, dims.height * scale);

        Object.assign(textarea.style, {
            position: 'absolute',
            left: `${vx + el.x * scale}px`,
            top: `${vy + el.y * scale}px`,
            width: `${width}px`,
            minHeight: `${minHeight}px`,
            fontSize: `${((el as any).fontSize || 14) * scale}px`,
            fontFamily: (el as any).fontFamily || 'Inter, system-ui, sans-serif',
            lineHeight: String((el as any).lineHeight ?? 1.4),
            color: (el as any).textColor || '#111827',
            background: 'transparent',
            border: '1px solid #3b82f6',
            outline: 'none',
            borderRadius: '4px',
            padding: `${12 * scale}px`,
            zIndex: '1000',
            resize: 'none',
            overflowY: 'hidden',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            boxSizing: 'border-box',
        } as CSSStyleDeclaration as any);

        textarea.value = (el as any).text || '';
        container.appendChild(textarea);
        setTimeout(() => textarea.focus(), 0);

        const textNode = node.findOne('Text');
        if (textNode) textNode.hide();
        stageRef.current?.batchDraw();

        const saveAndCleanup = () => {
            useUnifiedCanvasStore.getState().updateElement(el.id, { text: textarea.value });
            if (textNode) textNode.show();
            stageRef.current?.batchDraw();
            try { container.removeChild(textarea); } catch {}
            setTextEditingElement(null);
        }

        // Prevent event propagation into Konva while editing
        textarea.addEventListener('mousedown', (evt) => evt.stopPropagation());
        textarea.addEventListener('blur', saveAndCleanup);
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                saveAndCleanup();
            }
        });

        // Register cleanup handler for effect unmount
        cleanup = () => {
            try {
                container.removeChild(textarea);
            } catch (e) {}
        };
        return;
    }

    };

    let cleanup: (() => void) | undefined;
    waitForNodeAndStart();

    return () => { cancelled = true; try { cleanup?.(); } catch {} };

    // While editing, reflow the textarea position/size on viewport changes
  }, [textEditingElementId, setTextEditingElement, stageRef, viewportState]);

  // DraftEdge rendering - imperative overlay for live edge preview
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const overlayLayer = requireLayers(stage)?.overlay || null;
    if (!overlayLayer) return;

    let draftLine: Konva.Line | null = overlayLayer.findOne<Konva.Line>('.draft-line') || null;
    
    if (draft) {
      // Calculate draft points
      const sourceElement = elements.get(draft.from.elementId);
      if (!sourceElement) {
        if (draftLine) {
          draftLine.destroy();
          draftLine = null;
          overlayLayer.batchDraw();
        }
        return;
      }

      // Get source port world position
      const sourcePort = { nx: 0, ny: 0 }; // Default to center for now
      // Helper to get element dimensions safely
      const getElWidth = (el: any) => {
        if ('width' in el && typeof el.width === 'number') return el.width;
        if (el.type === 'circle' && 'radius' in el && typeof el.radius === 'number') return el.radius * 2;
        return 100;
      };
      const getElHeight = (el: any) => {
        if ('height' in el && typeof el.height === 'number') return el.height;
        if (el.type === 'circle' && 'radius' in el && typeof el.radius === 'number') return el.radius * 2;
        return 100;
      };
      const sourceWorldPos = {
        x: sourceElement.x + getElWidth(sourceElement) * (sourcePort.nx + 0.5),
        y: sourceElement.y + getElHeight(sourceElement) * (sourcePort.ny + 0.5)
      };

      // Target position - either snapped port or pointer position
      let targetPos = draft.pointer || { x: sourceWorldPos.x, y: sourceWorldPos.y };
      if (draft.snapTarget) {
        const targetElement = elements.get(draft.snapTarget.elementId);
        if (targetElement) {
          const targetPort = { nx: 0, ny: 0 }; // Default to center for now
          targetPos = {
            x: targetElement.x + getElWidth(targetElement) * (targetPort.nx + 0.5),
            y: targetElement.y + getElHeight(targetElement) * (targetPort.ny + 0.5)
          };
        }
      }

      const points = [sourceWorldPos.x, sourceWorldPos.y, targetPos.x, targetPos.y];

      // Create or update draft line
      if (!draftLine) {
        draftLine = new Konva.Line({
          points,
          stroke: draft.snapTarget ? '#10b981' : '#6b7280', // Green if snapped, gray if not
          strokeWidth: 2,
          dash: [6, 4],
          lineCap: 'round',
          listening: false,
          name: 'draft-line'
        });
        overlayLayer.add(draftLine);
      } else {
        draftLine.points(points);
        draftLine.stroke(draft.snapTarget ? '#10b981' : '#6b7280');
      }

      overlayLayer.batchDraw();
    } else {
      // No draft - remove draft line
      if (draftLine) {
        draftLine.destroy();
        draftLine = null;
        overlayLayer.batchDraw();
      }
    }

    // Cleanup on unmount
    return () => {
      const currentDraftLine = overlayLayer.findOne<Konva.Line>('.draft-line');
      if (currentDraftLine) {
        currentDraftLine.destroy();
        overlayLayer.batchDraw();
      }
    };
  }, [draft, elements, stageRef]);

  // Reflow active editor on viewport changes (placeTextarea)
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const { scale, x: vx, y: vy } = viewportState;
    const active = container.querySelector('textarea[data-role="canvas-text-editor"]') as HTMLTextAreaElement | null;
    if (!active) return;

    const elId = active.getAttribute('data-element-id');
    if (!elId) return;
    const el = useUnifiedCanvasStore.getState().elements.get(elId as any);
    if (!el) return;

    // placeTextarea - Position and size relative to viewport
    const PADDING = 12;
    const renderer = (window as any).__CANVAS_RENDERER_V2__ as CanvasRendererV2;
    if (!renderer) return;
    const node = (renderer as any).nodeMap.get(elId) as Konva.Group | undefined;
    if (!node) return;
    const frame = node.findOne<Konva.Rect>('.frame');
    if (!frame) return;
    
    const frameW = frame.width();
    active.style.left = `${vx + el.x * scale}px`;
    active.style.top = `${vy + el.y * scale}px`;
    // With content-box: width property = desired inner width (frameW - 2*PADDING for left+right)
    active.style.width = `${(frameW - 2 * PADDING) * scale}px`;
    active.style.fontSize = `${16 * scale}px`; // Keep consistent with createStickyNote fontSize
    active.style.padding = `${PADDING * scale}px`;
  }, [viewportState]);

  // Font-loaded re-measure pass to correct initial measurement mismatches
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if ('fonts' in document && (document as any).fonts?.ready) {
          await (document as any).fonts.ready;
          if (cancelled) return;
          const stage = stageRef.current; if (!stage) return;
          const renderer: InstanceType<typeof CanvasRendererV2> | undefined = (window as any).__CANVAS_RENDERER_V2__;
          if (!renderer) return;
          renderer.syncElements(useUnifiedCanvasStore.getState().elements as any);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [stageRef]);


  // Mount tool components that attach listeners imperatively and draw to Layer
  // Force a resize check on every render and when window resizes
  React.useLayoutEffect(() => {
    const checkAndResize = () => {
      if (!stageRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      
      // Force the container to recalculate its dimensions
      container.style.width = '';
      container.style.height = '';
      container.offsetHeight; // Force reflow
      
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      
      // Skip if dimensions are invalid
      if (w <= 0 || h <= 0) return;
      
      // Log parent dimensions too
      const parent = container.parentElement;
      const parentRect = parent?.getBoundingClientRect();
      
      console.log('[NonReactCanvasStage] Resize check:', { 
        container: {
          width: rect.width, 
          height: rect.height,
          clientWidth: container.clientWidth,
          clientHeight: container.clientHeight
        },
        parent: parent ? {
          width: parentRect?.width,
          height: parentRect?.height
        } : 'no parent',
        stage: stageRef.current ? stageRef.current.size() : 'no stage'
      });
      
      // Only update if size actually changed
      const currentSize = stageRef.current.size();
      if (currentSize.width !== w || currentSize.height !== h) {
        console.log('[NonReactCanvasStage] Resizing stage:', { from: currentSize, to: { width: w, height: h } });
        stageRef.current.size({ width: w, height: h });
        setViewport({ width: w, height: h });
        
        // Force all layers to redraw
        stageRef.current.getLayers().forEach(layer => {
          layer.batchDraw();
        });
        
        // Update background dots if needed
        const backgroundLayer = stageRef.current.findOne<Konva.Layer>('.background-layer');
        if (backgroundLayer) {
          const dotsGroup = backgroundLayer.findOne<Konva.Rect>('.dot-grid');
          if (dotsGroup) {
            dotsGroup.destroy();
            // Recreate dots for new size
            const newDotsGroup = createDotGridHelper(w, h);
            backgroundLayer.add(newDotsGroup);
            backgroundLayer.batchDraw();
          }
        }
      }
    };
    
    // Check immediately
    checkAndResize();
    
    // Also check on window resize
    window.addEventListener('resize', checkAndResize);
    
    // Use a small delay to ensure DOM has updated after sidebar toggle
    const timeoutId = setTimeout(checkAndResize, 100);
    
    return () => {
      window.removeEventListener('resize', checkAndResize);
      clearTimeout(timeoutId);
    };
  });

  // Lightweight Table creation tool (click to place)
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    if (selectedTool !== 'table') return;

    const onClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const ptr = stage.getPointerPosition();
      if (!ptr) return;
      // Convert to world coords
      const world = stage.getAbsoluteTransform().copy().invert().point(ptr);

      const rows = 3, cols = 3;
      const cellW = 120, cellH = 36;
      const width = cols * cellW;
      const height = rows * cellH;

      const tableEl = {
        id: (nanoid() as any),
        type: 'table' as const,
        x: Math.round(world.x - width / 2),
        y: Math.round(world.y - height / 2),
        width,
        height,
        rows,
        cols,
        cellWidth: cellW,
        cellHeight: cellH,
        fontSize: 13,
        fontFamily: 'Inter, system-ui, sans-serif',
        borderColor: '#d1d5db',
        borderWidth: 1,
        cellPadding: 8,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false,
      } as any;

      addElement(tableEl);
      setSelectedTool('select');
      // select new table
      setTimeout(() => selectElement(tableEl.id as any, false), 0);
    };

    stage.on('click.table-create', onClick);
    return () => {
      stage.off('click.table-create', onClick as any);
    };
  }, [selectedTool, stageRef]);

  // Basic Shapes creation (circle, triangle, mindmap)
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    const tool = selectedTool;
    if (!tool || (tool !== 'draw-circle' && tool !== 'draw-triangle' && tool !== 'mindmap')) return;

    const onClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const ptr = stage.getPointerPosition();
      if (!ptr) return;
      const world = stage.getAbsoluteTransform().copy().invert().point(ptr);


      if (tool === 'draw-circle') {
        const radius = 65; // Increased default size by ~25%
        const diameter = radius * 2;
        const circleEl = {
          id: (nanoid() as any),
          type: 'circle' as const,
          x: Math.round(world.x - radius),
          y: Math.round(world.y - radius),
          radius,
          // width/height are helpful for transformer/spatial index; keep them in sync with radius
          width: diameter,
          height: diameter,
          fill: '#ffffff',
          stroke: '#d1d5db',
          strokeWidth: 1,
          text: '',
          fontSize: 14,
          fontFamily: 'Inter, system-ui, sans-serif',
          textColor: '#374151',
          padding: 16, // Consistent padding
          newlyCreated: true,
          isEditing: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false,
        } as any;
        addElement(circleEl);
        setSelectedTool('select');
        setTimeout(() => selectElement(circleEl.id as any, false), 0);
        return;
      }

      if (tool === 'draw-triangle') {
        const width = 120;
        const height = 160;
        const triEl = {
          id: (nanoid() as any),
          type: 'triangle' as const,
          x: Math.round(world.x - width / 2),
          y: Math.round(world.y - height / 2),
          width,
          height,
          fill: '#ffffff',
          stroke: '#d1d5db',
          strokeWidth: 1,
          text: '',
          fontSize: undefined,
          fontFamily: 'Inter, system-ui, sans-serif',
          textColor: '#111827',
          newlyCreated: true,
          isEditing: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false,
        } as any;
        addElement(triEl);
        setSelectedTool('select');
        setTimeout(() => selectElement(triEl.id as any, false), 0);
        return;
      }

      if (tool === 'mindmap') {
        // Central topic (bold, larger)
        const centerW = 280;
        const centerH = 44;
        const groupId = createGroupId(nanoid());
        const centerId = nanoid() as any;
        const center = {
          id: centerId,
          type: 'text' as const,
          x: Math.round(world.x - centerW / 2),
          y: Math.round(world.y - centerH / 2),
          width: centerW,
          height: centerH,
          text: 'Any question or topic',
          fontSize: 24,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontStyle: 'bold',
          textColor: '#111827',
          groupId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false,
        } as any;
        addElement(center);

        // Sub-topics to the right
        const gapX = 220;
        const gapY = 70;
        const subW = 160;
        const subH = 32;
        const subs = [
          { text: 'A concept', dy: -gapY },
          { text: 'An idea', dy: 0 },
          { text: 'A thought', dy: gapY },
        ].map((s) => {
          const id = nanoid() as any;
          const el = {
            id,
            type: 'text' as const,
            x: Math.round(world.x + gapX),
            y: Math.round(world.y + s.dy - subH / 2),
            width: subW,
            height: subH,
            text: s.text,
            fontSize: 16,
            fontFamily: 'Inter, system-ui, sans-serif',
            textColor: '#374151',
            groupId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isLocked: false,
            isHidden: false,
          } as any;
          addElement(el);
          return el;
        });

        // Edges from center to sub-topics with gentle curves (not grouped; they reflow with nodes)
        const centerRight = {
          x: center.x + centerW,
          y: center.y + centerH / 2,
        };
        subs.forEach((sub) => {
          const targetLeft = { x: sub.x, y: sub.y + subH / 2 };
          const mid = {
            x: (centerRight.x + targetLeft.x) / 2,
            y: centerRight.y + (targetLeft.y - centerRight.y) * 0.35,
          };

          const edgeId = useUnifiedCanvasStore.getState().addEdge({
            type: 'edge',
            source: { elementId: centerId, portKind: 'E' },
            target: { elementId: sub.id as any, portKind: 'W' },
            routing: 'straight',
            stroke: '#9CA3AF',
            strokeWidth: 2,
            selectable: true,
          } as any);

          // Immediately define a curved path and mark as curved
          useUnifiedCanvasStore.getState().updateEdge(edgeId, {
            points: [centerRight.x, centerRight.y, mid.x, mid.y, targetLeft.x, targetLeft.y],
            curved: true,
          } as any);
        });

        setSelectedTool('select');
        setTimeout(() => selectElement(centerId as any, false), 0);
        return;
      }
    };

    stage.on('click.shape-create', onClick);
    return () => {
      stage.off('click.shape-create', onClick as any);
    };
  }, [selectedTool, stageRef]);

  // Global Delete key handling for edges and elements
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;

      // Do not interfere with typing inside inputs/textareas/contenteditable or our editors
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName?.toLowerCase();
        const isTyping =
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          (target as any).isContentEditable === true ||
          target.getAttribute?.('data-role') === 'canvas-text-editor' ||
          target.hasAttribute?.('data-text-editing');
        if (isTyping) return;
      }
      const store = useUnifiedCanvasStore.getState();
      const ids = Array.from(store.selectedElementIds || []);
      if (ids.length === 0) return;
      e.preventDefault();
      ids.forEach((id) => {
        if ((store as any).edges && (store as any).edges.has(id)) {
          (store as any).removeEdge(id as any);
        } else {
          store.deleteElement(id as any);
        }
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="canvas-container"
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        display: 'block'
      }}>
      {(stageRef && (selectedTool === 'pen' || selectedTool === 'pan')) && (
        <PenTool stageRef={stageRef} isActive={true} />
      )}
      {stageRef && selectedTool === 'marker' && (
        <MarkerTool
          stageRef={stageRef}
          isActive={true}
          strokeStyle={{ color: '#000', width: 4, opacity: 0.9, smoothness: 0.2, lineCap: 'round', lineJoin: 'round' }}
        />
      )}
      {stageRef && selectedTool === 'highlighter' && (
        <HighlighterTool
          stageRef={stageRef}
          isActive={true}
          strokeStyle={{ color: '#f7e36d', width: 12, opacity: 0.5, blendMode: 'multiply' }}
        />
      )}
      {stageRef && selectedTool === 'sticky-note' && (
        <StickyNoteTool stageRef={stageRef} isActive={true} />
      )}
      {stageRef && selectedTool === 'connector-line' && (
        <ConnectorTool stageRef={stageRef} isActive={true} connectorType="line" />
      )}
      {stageRef && selectedTool === 'connector-arrow' && (
        <ConnectorTool stageRef={stageRef} isActive={true} connectorType="arrow" />
      )}
      {/* Table creation is handled imperatively via stage click when tool is active */}
    </div>
  );
};

export default NonReactCanvasStage;
