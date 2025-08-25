import React, { useRef, useEffect } from 'react';
import Konva from 'konva';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';
import { CanvasRenderer } from '../core/CanvasRenderer';
import { UnifiedEventHandler } from '../core/UnifiedEventHandler';
import { TransformerController } from '../core/TransformerController';
import { CursorProvider } from '../contexts/CursorContext';
import { KonvaDirectRenderer } from '../renderers/KonvaDirectRenderer';

export const CanvasStage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const backgroundLayerRef = useRef<Konva.Layer | null>(null);
  const mainLayerRef = useRef<Konva.Layer | null>(null);
  const overlayLayerRef = useRef<Konva.Layer | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const directRendererRef = useRef<KonvaDirectRenderer | null>(null);
  const eventHandlerRef = useRef<UnifiedEventHandler | null>(null);
  const transformerRef = useRef<TransformerController | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Draw subtle FigJam-style dot grid background
  const drawBackground = () => {
    const stage = stageRef.current;
    const layer = backgroundLayerRef.current;
    if (!stage || !layer) return;

    const width = stage.width();
    const height = stage.height();

    layer.destroyChildren();

    // Solid white
    const backgroundRect = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: '#ffffff',
      listening: false,
      name: 'background-color'
    });
    layer.add(backgroundRect);

    // Dot grid
    const GRID_SIZE = 20;
    const DOT_RADIUS = 1.5;
    const DOT_COLOR = 'rgba(0, 0, 0, 0.12)';

    const stagePos = stage.position();
    const offsetX = ((-stagePos.x % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
    const offsetY = ((-stagePos.y % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;

    const padding = GRID_SIZE * 2;
    for (let x = -padding + offsetX; x <= width + padding; x += GRID_SIZE) {
      for (let y = -padding + offsetY; y <= height + padding; y += GRID_SIZE) {
        layer.add(
          new Konva.Circle({
            x,
            y,
            radius: DOT_RADIUS,
            fill: DOT_COLOR,
            listening: false,
            perfectDrawEnabled: false,
            name: 'dot'
          })
        );
      }
    }

    layer.batchDraw();
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const stage = new Konva.Stage({
      container,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
      draggable: false,
    });
    stageRef.current = stage;
    // Initialize viewport size in store
    try { useUnifiedCanvasStore.getState().setViewport({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) }); } catch {}

    // Background layer below content
    const backgroundLayer = new Konva.Layer();
    stage.add(backgroundLayer);
    backgroundLayerRef.current = backgroundLayer;

    const mainLayer = new Konva.Layer();
    stage.add(mainLayer);
    mainLayerRef.current = mainLayer;

    const overlayLayer = new Konva.Layer({ name: 'overlay', listening: false });
    stage.add(overlayLayer);
    overlayLayerRef.current = overlayLayer;

    rendererRef.current = new CanvasRenderer(mainLayer);
    directRendererRef.current = new KonvaDirectRenderer({ stage });
    // Dynamically set the direct renderer context without top-level await
    import('../renderers/DirectRendererContext')
      .then(({ setDirectRenderer }) => { setDirectRenderer(directRendererRef.current); })
      .catch(() => {});
    eventHandlerRef.current = new UnifiedEventHandler(stage, useUnifiedCanvasStore.getState());
    // Central Transformer
    transformerRef.current = new TransformerController(stage, mainLayer, rendererRef.current.getRegistry(), overlayLayer);

    // Zoom on wheel -> update store viewport
    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const scaleBy = 1.05;
      const store = useUnifiedCanvasStore.getState();
      const { viewport } = store;
      const oldScale = viewport.scale || 1;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = {
        x: (pointer.x - (viewport.x || 0)) / oldScale,
        y: (pointer.y - (viewport.y || 0)) / oldScale,
      };
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      // Use store helpers to keep everything in sync
      store.setViewport({ scale: newScale, x: newPos.x, y: newPos.y });
    };
    stage.on('wheel', handleWheel);

    // Subscribe to viewport changes and reflect on stage
    const unsubViewport = useUnifiedCanvasStore.subscribe(
      (s) => s.viewport,
      (vp) => {
        stage.scale({ x: vp.scale, y: vp.scale });
        stage.position({ x: vp.x, y: vp.y } as any);
        stage.batchDraw();
        drawBackground();
      }
    );

    // Initial draw
    drawBackground();

    // ResizeObserver to keep stage sized to container
    const ro = new ResizeObserver(() => {
      if (!stageRef.current || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      stageRef.current.size({ width: Math.max(1, r.width), height: Math.max(1, r.height) });
      try { useUnifiedCanvasStore.getState().setViewport({ width: Math.max(1, r.width), height: Math.max(1, r.height) }); } catch {}
      drawBackground();
    });
    ro.observe(container);
    resizeObserverRef.current = ro;

    // Pan gestures (space or middle mouse)
    let isPanning = false;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.code === 'Space') {
        (stage as any)._spaceKeyActive = true;
        stage.container().style.cursor = 'grab';
      }
    };
    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.code === 'Space') {
        (stage as any)._spaceKeyActive = false;
        if (!isPanning) {
          stage.container().style.cursor = 'default';
        }
      }
    };
    const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // middle mouse or holding space while clicking
      const spaceDown = (e.evt as any).spaceKeyActive === true;
      if (e.evt.button === 1 || e.evt.buttons === 4 || spaceDown) {
        stage.draggable(true);
        isPanning = true;
      }
    };
    const onMouseUp = () => {
      if (isPanning) {
        stage.draggable(false);
        isPanning = false;
        if (!(stage as any)._spaceKeyActive) {
          stage.container().style.cursor = 'default';
        }
      }
    };
    const onDragMove = () => {
      const store = useUnifiedCanvasStore.getState();
      // Keep viewport and stage perfectly in sync during drags
      store.setViewport({ x: stage.x(), y: stage.y() });
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    stage.on('mousedown', onMouseDown);
    stage.on('mouseup', onMouseUp);
    stage.on('dragmove', onDragMove);

    return () => {
      resizeObserverRef.current?.disconnect();
      stage.off('wheel', handleWheel);
      rendererRef.current?.destroy();
      // Reset direct renderer via dynamic import without await
      import('../renderers/DirectRendererContext')
        .then(({ setDirectRenderer }) => { setDirectRenderer(null); })
        .catch(() => {});
      directRendererRef.current?.dispose();
      eventHandlerRef.current?.destroy();
      transformerRef.current?.destroy();
      stage.destroy();
      // Unsubscribe viewport
      try { (unsubViewport as any)?.(); } catch {}
      // Remove pan listeners
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      stage.off('mousedown', onMouseDown);
      stage.off('mouseup', onMouseUp);
      stage.off('dragmove', onDragMove);
      overlayLayerRef.current?.destroy();
    };
  }, []);

  return (
    <CursorProvider>
      <div
        ref={containerRef}
        data-testid="canvas-stage-container"
        style={{ width: '100%', height: '100%', background: '#ffffff', position: 'relative' }}
      />
    </CursorProvider>
  );
};