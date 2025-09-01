Archived react-konva canvas path (2025-09-01)

This directory contains the legacy React-based canvas implementation that used react-konva.

Current production path uses:
- `components/NonReactCanvasStage.tsx` (stage)
- `services/CanvasRendererV2.ts` (renderer)

Moved modules include layers, shapes, legacy tools, transformer wrappers, and tests that depended on react-konva.

Reason: The project standardized on a direct Konva renderer with centralized stage-level events, per docs/CANVAS_IMPLEMENTATION.md and docs/CANVAS_STATUS.md.

