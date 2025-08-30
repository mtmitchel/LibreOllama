# Canvas Migration Plan (Hybrid Strangler Approach)

Last updated: 2025-08-29

This document defines the authoritative plan for migrating the LibreOllama canvas from react-konva to a pure Konva renderer using a Hybrid "Strangler" pattern. The goals are immediate performance relief, zero business disruption, and a safe path to fully deprecate react-konva. This plan implements the KONVA_BASED_CANVAS.md blueprint.

## Summary
- Strategy: Hybrid migration with a fresh core (NonReactCanvasStage + Service Renderer) while legacy remains as fallback.
- Immediate fix: Keep React out of all hot drawing paths. Live previews and input handling are fully imperative.
- Compatibility: Preserve the existing Zustand store, element types, and history; add a state bridge where needed.
- Rollback: Feature flag for instant rollback to the legacy renderer.

## Why a Hybrid Strangler migration?
- Current state: Drawing path was mixing react-konva (declarative) with imperative Konva nodes causing layer replacement, lost refs, and frame drops.
- Risks of big-bang rewrite: High business disruption and time to parity.
- Benefits: Fresh imperative core eliminates architectural conflicts; gradual migration preserves stability.

## Phases

### Phase 1: Fresh Core (1–2 weeks) ✅ **COMPLETED**
- Implement a pure Konva canvas alongside legacy:
  - Components/services: src/features/canvas/components/NonReactCanvasStage.tsx and a forthcoming CanvasRendererV2 service.
  - Layers (imperative): background-layer, main-layer, preview-fast-layer, overlay-layer.
  - Drawing tools (Pen/Marker/Highlighter) render previews to preview-fast-layer only; pointer handlers attached directly to Stage (no React ownership in preview path).
- Feature flag rollout example:
  - USE_NEW_CANVAS = true → mount NonReactCanvasStage; otherwise legacy CanvasStage.
- Validation targets:
  - Canvas init < 50ms; 60fps drawing; tool switch < 16ms; zero pointer violations.

### Phase 2: State Bridge (3–5 days) 🔄 **NEXT**
- Build an adapter that translates the existing store's element map to the new renderer's diffing API.
- Preserve undo/redo; no changes to history semantics.
- No Konva nodes in the store — only serialisable element descriptors.

### Phase 3: Gradual Feature Migration (2–3 weeks)
- Migrate features one by one with A/B testing:
  - drawing-tools (critical), basic-shapes, text-editing, transformations (selection/resize/rotate), advanced-tools (images/connectors), background.
- After each feature migration, validate performance and parity.

### Phase 4: Legacy Cleanup (1 week)
- Remove react-konva dependencies from canvas.
- Delete unused legacy components; keep a short deprecation note.

## Architecture (V2)

- Renderer Service (ICanvasRenderer):
  - init(container), syncFromState(elements), destroy().
  - Imperatively creates Stage and Layers; manages nodes and Transformer in overlay.
- Layers:
  - background (listening=false), main (persisted elements), preview-fast-layer (live previews), overlay (selection/transformer/UI).
- Tools:
  - Pointer listeners on Stage. Preview nodes are pooled (KonvaNodePool) and drawn with batchDraw() on preview-fast-layer.
- Viewport:
  - Viewport state in Zustand; Stage scale/position updated imperatively on change.
- Performance:
  - Konva.pixelRatio = 1; perfectDraw disabled for heavy shapes; pooling; optional spatial index for large boards; minimal layers.

## Risk Mitigation

- Feature flag for rollback (localStorage or env-based switch).
- Performance monitoring: measure init time, pointer latency, batchDraw frequency.
- Data validation: element counts and properties match between legacy and V2 during transition.

## Timeline & Resourcing

- Phase 1: 1–2 weeks (1 senior dev) ✅ **COMPLETED**
- Phase 2: 3–5 days (1 senior dev) 🔄 **IN PROGRESS**
- Phase 3: 2–3 weeks (2 devs)
- Phase 4: 1 week (1 dev)

## Success Criteria

- Immediate: fluid drawing, instant tool switching, no pointer violations.
- Completion: all features preserved, react-konva removed from canvas, performance targets achieved, zero regression bugs.

## Status

- ✅ NonReactCanvasStage implemented and mounted in CanvasContainer.
- ✅ Pen/Marker/Highlighter attached to an imperative preview-fast-layer.
- 🔄 Next: Introduce CanvasRendererV2 service for persisted elements and overlay (selection/transformer), then migrate remaining features.

## References

- **Blueprint**: `docs/KONVA_BASED_CANVAS.md` - Complete migration blueprint
- **Current Status**: `docs/CANVAS_MIGRATION_STATUS.md` - Real-time progress tracking
- **Drawing Pipeline**: `docs/CANVAS_DRAWING_PIPELINE_STATUS.md` - Current implementation details
- **Architecture**: `docs/ARCHITECTURE.md` - Overall system architecture
