# Canvas Imperative Konva Migration – Status

## Current architecture
- Stage and layers created imperatively in `src/features/canvas/components/CanvasStage.tsx`.
- Background (white + dot grid) drawn imperatively and refreshed on zoom/resize.
- `CanvasRenderer` subscribes to `stores/unifiedCanvasStore` and syncs elements.
- `ElementRegistry` creates/updates/destroys nodes for: text, rectangle, circle, sticky note, image, connector, pen, triangle, table.
- `UnifiedEventHandler` delegates events and activates tools; `TextTool` implemented as class.

## What works now
- App loads a Konva stage with visible FigJam-style background.
- Wheel zoom with anchored zoom point.
- Viewport coupling: stage subscribes to store viewport (scale/position) and stays in sync.
- Pan gestures: spacebar or middle-mouse drag updates viewport while dragging.
- Store-driven element creation/update pipeline via `CanvasRenderer` + `ElementRegistry`.
- Dragging nodes persists back to the store.

## Removed/archived
- All react-konva layer system (`layers/*`) and transformer wrapper components.
- Legacy tool-layer and old `useCanvasToolSystem` hook.
- Legacy `ElementRenderer.tsx` and `KonvaElementBoundary.tsx`.
- Outdated docs replaced/archived.

## Gaps / next work
1) Snapping and rotation workflow
- TransformerController is active (multi-select, batching, basic alignment guides). Improve snapping granularity and rotation UX.

2) Tools
- Most class-based tools implemented (select, pan, text, rectangle, circle, triangle, sticky note, connector, pen/marker/highlighter/eraser). Table/section tool UX pending.
- Continue refining connector styles and behaviors.

3) Viewport
- Zoom-to-fit and reset helpers pending.

4) Store and history
- Ensure all renderer mutations flow through store actions with undo/redo-safe batches (ongoing validation).

5) Export/import
- JSON import/export endpoints aligned with new element schema.

6) Testing
- KonvaDirectRenderer initialized; integrate into drawing tools for high-frequency paths.
- Unit tests for `ElementRegistry`, `CanvasRenderer`, `TransformerController`, and tools; integration tests for selection/transform/zoom.

## Success criteria
- 60fps interactions; no memory leaks; undo/redo correct after transforms; packaged Tauri app < 50MB.

*Last updated: 2025-08-25*
