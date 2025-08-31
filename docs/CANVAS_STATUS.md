# LibreOllama Canvas Status

## Current State

**Last Updated**: August 2025

## What's Working

- ✅ **Direct Konva Rendering**: All `react-konva` dependencies have been removed. The canvas is now rendered using the `CanvasRendererV2.ts` service.
- ✅ **Store-First Architecture**: The renderer follows the guide's store-first principle, rebuilding the canvas from serializable state.
- ✅ **Performance & Batching**: A `requestAnimationFrame` batching system (`scheduleDraw`) is in place, aligning with the guide's performance requirements.
- ✅ **Overlay System**: The overlay layer for selection highlights, transformers, and connector handles is correctly implemented as a non-listening singleton.
- ✅ **Text Area Editing**: Double-clicking to edit text via a DOM `<textarea>` is working as specified.

## What's Broken / Misaligned

- ❌ **Decentralized Event Handling**: This is the primary misalignment. Event listeners (`click`, `dragend`, `dblclick`) are attached directly to individual Konva nodes inside the renderer service. The guide mandates these be handled centrally at the `stage` level to avoid scattered logic. A comment in the code suggests the centralized approach was not working as expected.
- 🟡 **(Minor) Inconsistent Layer Naming**: The guide specifies a `Fast` layer for images. The implementation has a `preview` layer that is used for dragging, which is a minor deviation in naming and role.

## Immediate Actions Required

The priority is no longer removing `react-konva`, but refactoring the event model within the new renderer to fully align with the implementation guide.

### 1. Centralize Event Handling
- [ ] Refactor `CanvasRendererV2` to handle all pointer, drag, and double-click events via listeners on the main `Konva.Stage`.
- [ ] Remove all node-specific event listeners (e.g., `.on('click', ...)` and `.on('dragend', ...)` from `createStickyNote`, `createConnector`, etc.).
- [ ] Investigate and resolve the underlying issue that prevented the global, stage-level handlers from working correctly.

### 2. Align Layering Scheme
- [ ] Rename the `preview` layer to `fast` to align with the guide's terminology.
- [ ] Clarify and enforce the role of the `fast` layer (e.g., for images, or if it will also be used for drag operations).

## Implementation Priority

1.  **High**: Refactor to a centralized, renderer-owned event model.
2.  **Medium**: Align layer naming and roles.
3.  **Low**: Add advanced features (AI-assisted diagramming).

## Success Metrics

- [ ] Zero node-specific event handlers in `CanvasRendererV2`.
- [ ] All canvas interactions are managed by stage-level listeners.
- [ ] Performance benchmarks are maintained or improved after the refactor.
- [ ] Layer structure and naming perfectly match the `CANVAS_IMPLEMENTATION.md` guide.

## Notes

- The migration from `react-konva` is complete. The focus is now on fixing the architectural deviations in the new `CanvasRendererV2` service.
- Refer to the `CANVAS_IMPLEMENTATION.md` guide for the correct event handling blueprint.
