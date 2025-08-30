Canvas migration (Phase 1) notes:
- OverlayLayer created and wired in CanvasLayerManager; Transformer moved inside overlay.
- ToolLayer detached from Stage; previews for Pen/Marker/Highlighter now render within MainLayer when active.
- Autosave debounce raised to 3s; gate by coarse JSON diff.

Next sustainable steps:
1) Remove UILayer.tsx and ToolLayer.tsx after verifying parity (will adjust imports and references).
2) Introduce useSpatialIndex hook and migrate from useSimpleViewportCulling.
3) Consolidate store modules (stickyNote/table→element, eraser→drawing, loading→ui). Carefully update types/selectors and component imports.
4) Verify selection/transformer interactivity with overlay (anchors listen = true); adjust listening flags if needed.

Cleanup reminder: delete this file before final commit.
