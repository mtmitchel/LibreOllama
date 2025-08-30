# Canvas Drawing Pipeline Status (Updated 2025-08-29)

This document describes the current, implemented drawing pipeline for the LibreOllama canvas and the guiding rules that stabilize performance and responsiveness during freehand drawing. This implementation follows the KONVA_BASED_CANVAS.md blueprint for migrating from react-konva to direct Konva usage.

## TL;DR
- We now use a single-source, imperative drawing pipeline (no react-konva) for Pen / Marker / Highlighter, following the blueprint's CanvasRenderer service approach.
- Progressive rendering is disabled while drawing to avoid chunking artefacts.
- Drawing previews render into a FastLayer when available and use batchDraw for smooth updates.
- Pen tool captures points at high frequency and interpolates between sparse events to eliminate angular segments.
- Store writes are avoided during preview; the store is updated once at the end of the stroke.

## Current Architecture (Blueprint-Aligned)

1) Single-source drawing (component-driven)
- The legacy/event-manager path for drawing is disabled; all drawing occurs via imperative tool listeners (stage.on pointer handlers).
- The flag `window.__USE_COMPONENT_DRAWING__ = true` is set during CanvasStage initialization.
- Tool handlers in CanvasEventManager (pen/marker/highlighter) short-circuit via `canHandle()` when this flag is true.
- Component tools (PenTool / MarkerTool / HighlighterTool) own the preview rendering entirely through Konva refs, pooled nodes, and `layer.batchDraw()`.

2) Progressive rendering gating
- MainLayer skips progressive rendering when `isDrawing === true`.
- Progressive rendering only engages when there are > 500 visible elements and the user is not actively drawing.

3) Layer selection for maximum throughput
- Drawing previews prefer a `FastLayer` if available, falling back to the first layer otherwise.
- Ref-based nodes are updated in place and drawn with `batchDraw()`.

4) High-frequency capture and interpolation (Pen)
- The Pen tool captures points on pointer events and interpolates between samples when gaps exceed a 2px step.
- This removes angular segments when drawing fast circles and curves.
- Marker/Highlighter use similar preview paths and will be upgraded to the same interpolation strategy next.

5) Store write policy during drawing
- No store writes during stroke preview; the preview is purely Konva-based.
- The store should be updated only on stroke commit (finishDrawing) to avoid thrashing large element sets and to keep history clean.

## Migration Status & Next Steps

**Current Phase**: Phase 1 (Fresh Core) - NonReactCanvasStage implemented
**Blueprint Alignment**: ✅ Drawing pipeline fully implements blueprint's imperative approach
**Next Phase**: Introduce CanvasRendererV2 service for persisted elements and overlay (selection/transformer)

## Flags & Tuning

- Component drawing flag: `window.__USE_COMPONENT_DRAWING__ = true` (default).
- Progressive rendering threshold: gated by `!isDrawing` and `visibleElements.length > 500`.
- Caching thresholds for Text/Image/Rectangle/Sticky are tuneable via `src/features/canvas/utils/performance/cacheTuning.ts`.
- Spatial indexing (QuadTree) is enabled for large element counts; metrics are exposed via `window.__SPATIAL_INDEX_LAST__` and consumed by `CanvasPerformanceMonitor`.

## Testing & Diagnostics

- Visual snapshot tests exist and should be extended to cover Text (multiline), Image (with filters), Sticky backgrounds, and rectangles under different styles.
- Performance tests include a basic QuadTree query benchmark.
- Optional (dev-only): add a diagnostics overlay to surface pointer frequency, points/sec, batchDraw counts, and active layer type during drawing.

## Known Next Steps

1) Apply interpolation to Marker/Highlighter and tune step sizes.
2) Add (optional) diagnostics overlay for draw metrics.
3) Ensure stroke commits (finishDrawing) perform minimal work and generate atomic history entries.
4) Expand visual regression tests and integrate with CI review gates.
5) Continue tuning progressive rendering thresholds based on observed usage patterns and perf metrics.

## References
- Event manager gating flag is set in `CanvasStage`.
- FastLayer preference and progressive gating live in `PenTool`/`MarkerTool`/`HighlighterTool` and `MainLayer`.
- Cache threshold tuning: `src/features/canvas/utils/performance/cacheTuning.ts`.
- Spatial index and metrics: `useSpatialIndexing` and `CanvasPerformanceMonitor`.
- **Blueprint Reference**: `docs/KONVA_BASED_CANVAS.md` - Current migration blueprint
- **Migration Plan**: `docs/CANVAS_MIGRATION_PLAN.md` - Implementation phases and timeline
