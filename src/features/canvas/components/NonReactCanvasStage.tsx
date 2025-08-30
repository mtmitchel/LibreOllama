import React, { useEffect, useRef, useMemo } from 'react';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { PenTool } from './tools/drawing/PenTool';
import { MarkerTool } from './tools/drawing/MarkerTool';
import { HighlighterTool } from './tools/drawing/HighlighterTool';
import { StickyNoteTool } from './tools/creation/StickyNoteTool';
import { ElementId, CanvasElement, createElementId } from '../types/enhanced.types';
import { performanceLogger } from '../utils/performance/PerformanceLogger';
import { CanvasRendererV2 } from '../services/CanvasRendererV2';
import { getContentPointer } from '../utils/coords';
import { nanoid } from 'nanoid';

interface NonReactCanvasStageProps {
  stageRef?: React.RefObject<Konva.Stage | null>;
  selectedTool?: string;
}

// Minimal imperative renderer for drawing tools and persisted strokes
export const NonReactCanvasStage: React.FC<NonReactCanvasStageProps> = ({ stageRef: externalStageRef, selectedTool: selectedToolProp }) => {
  const internalStageRef = useRef<Konva.Stage | null>(null);
  const stageRef = externalStageRef || internalStageRef;
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTool = selectedToolProp || useUnifiedCanvasStore(s => s.selectedTool);
  const viewport = useUnifiedCanvasStore(s => s.viewport);
  const elements = useUnifiedCanvasStore(s => s.elements);
  const zoomViewport = useUnifiedCanvasStore(s => s.zoomViewport);
  const setViewport = useUnifiedCanvasStore(s => s.setViewport);
  const selectedStickyNoteColor = useUnifiedCanvasStore(s => s.selectedStickyNoteColor);

  // Create stage and layers imperatively
  useEffect(() => {
    performanceLogger.initStart();
    if (!containerRef.current) return;
    // Avoid duplicate init
    if (stageRef.current) return;

    const container = containerRef.current;
    const stage = new Konva.Stage({
      container,
      width: container.clientWidth,
      height: container.clientHeight,
      listening: true,
    });

    // Background layer (simple solid bg for now)
    const backgroundLayer = new Konva.Layer({ listening: false, name: 'background-layer' });
    const bg = new Konva.Rect({ x: -20000, y: -20000, width: 40000, height: 40000, fill: '#fafafa', listening: false, perfectDrawEnabled: false });
    backgroundLayer.add(bg);

    // Main content layer (persisted elements)
    const mainLayer = new Konva.Layer({ listening: true, name: 'main-layer' });

    // Preview fast layer for live drawing
    const previewLayer = new Konva.Layer({ listening: false, name: 'preview-fast-layer' });

    // Overlay layer (reserved)
    const overlayLayer = new Konva.Layer({ listening: true, name: 'overlay-layer' });

    stage.add(backgroundLayer);
    stage.add(mainLayer);
    stage.add(previewLayer);
    stage.add(overlayLayer);

    stageRef.current = stage;

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

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      stage.size({ width: w, height: h });
      setViewport({ width: w, height: h });
      stage.batchDraw();
    });
    resizeObserver.observe(container);

    return () => {
      performanceLogger.stopFrameLoop();
      try { resizeObserver.disconnect(); } catch {}
      try { stage.destroy(); } catch {}
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

  // Imperative render via CanvasRendererV2
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    const mainLayer = stage.findOne<Konva.Layer>('.main-layer');
    const preview = stage.findOne<Konva.Layer>('.preview-fast-layer') as Konva.Layer | null;
    const overlay = stage.findOne<Konva.Layer>('.overlay-layer');
    if (!mainLayer || !overlay) return;

    const renderer: InstanceType<typeof CanvasRendererV2> = (window as any).__CANVAS_RENDERER_V2__ ||= new CanvasRendererV2();
    renderer.init(stage, { background: stage.findOne<Konva.Layer>('.background-layer')!, main: mainLayer, preview: (preview as any) || mainLayer, overlay }, {
      onUpdateElement: (id, updates) => useUnifiedCanvasStore.getState().updateElement(id as any, updates)
    });
    renderer.syncElements(elements as any);
  }, [elements]);

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

  // Optional: click-hit selection wiring (imperative) and double-click to edit
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;

    const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const target = e.target as Konva.Node;
      // If clicked on empty stage, clear selection
      if (target === stage) {
        useUnifiedCanvasStore.getState().clearSelection();
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

    // Double click to edit: ascend to group id and set text editing if supported
    const onDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const target = e.target as Konva.Node;
      const group = target.findAncestor((node: Konva.Node) => {
        return node.getClassName() === 'Group' && !!(node as Konva.Group).id();
      }, true) as Konva.Group | null;
      const id = group?.id?.() || (target as any).id?.();
      if (!id) return;
      const el = useUnifiedCanvasStore.getState().elements.get(id as any);
      if (!el) return;
      if (el.type === 'text' || el.type === 'sticky-note' || el.type === 'rectangle' || el.type === 'circle' || el.type === 'triangle') {
        useUnifiedCanvasStore.getState().setTextEditingElement(id as any);
      }
    };
    stage.on('dblclick.inlineEdit', onDblClick);

    return () => {
      try { stage.off('mousedown.select', onMouseDown); } catch {}
      try { stage.off('dblclick.inlineEdit', onDblClick); } catch {}
    };
  }, [stageRef]);

  // Text edit overlay for non-React path
  const textEditingElementId = useUnifiedCanvasStore(s => s.textEditingElementId);
  const setTextEditingElement = useUnifiedCanvasStore(s => s.setTextEditingElement);
  const viewportState = useUnifiedCanvasStore(s => s.viewport);

  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    if (!textEditingElementId) return;

    const renderer = (window as any).__CANVAS_RENDERER_V2__ as CanvasRendererV2;
    if (!renderer) return;

    let cancelled = false;

    const waitForNodeAndStart = () => {
      if (cancelled) return;
      const el = useUnifiedCanvasStore.getState().elements.get(textEditingElementId);
      if (!el) { return; }
      const node = (renderer as any).nodeMap.get(textEditingElementId) as Konva.Group | undefined;
      if (!node) {
        // Retry on next frame until node is available (e.g., right after creation)
        if (!((window as any).__EDIT_PROBE_LOGGED__)) { console.info('[EDIT] waiting for node', textEditingElementId); (window as any).__EDIT_PROBE_LOGGED__ = true; }
        requestAnimationFrame(waitForNodeAndStart);
        return;
      }
      console.info('[EDIT] node ready', textEditingElementId);

      if (el.type === 'sticky-note') {
        const frame = node.findOne<Konva.Rect>('.frame');
        const bg = node.findOne<Konva.Rect>('.bg');
                 const ktext = node.findOne<Konva.Text>('.text');
         const layer = node.getLayer();
         
         // Find transformer more reliably - look in the overlay layer
         const stage = layer?.getStage();
         const overlayLayer = stage?.findOne<Konva.Layer>('.overlay-layer');
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
        if (transformer && transformer.nodes) {
          try {
            transformer.nodes([frame]);
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
        textarea.addEventListener('keydown', (e) => {
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
        const width = (el.width || 180) * scale;
        const minHeight = Math.max(24, (el.height || 24) * scale);

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
        stage.batchDraw();

        const saveAndCleanup = () => {
            useUnifiedCanvasStore.getState().updateElement(el.id, { text: textarea.value });
            if (textNode) textNode.show();
            stage.batchDraw();
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
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
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
    </div>
  );
};

export default NonReactCanvasStage;
