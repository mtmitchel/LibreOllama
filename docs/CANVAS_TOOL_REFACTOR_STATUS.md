# Canvas Tool Architecture Refactor — Reality Check and Current Status

Summary
- The migration to an imperative Konva pipeline is well underway and running in the app.
- Tools are implemented as lightweight TypeScript classes and managed by a single UnifiedEventHandler.
- Element synchronization is handled by an ElementRegistry + CanvasRenderer that listens to the unified Zustand store.
- A centralized TransformerController is integrated for selection/transform operations.
- A MemoryManager and KonvaDirectRenderer exist in the codebase but are not yet wired into the runtime.
 - MemoryManager exists but is not wired into the runtime. KonvaDirectRenderer is initialized in `CanvasStage` and exposed via context; tools are not yet using it for high-frequency updates.
- There is no ToolRegistry or ToolEventDelegate in the current implementation; references to those in older docs were aspirational.
- Some legacy react-konva components remain for tests/archives but are not used in runtime.

What’s implemented today (as verified in code)
- Unified event handling: src/features/canvas/core/UnifiedEventHandler.ts
  - Registers and switches tools based on store.selectedTool
  - Handles stage-level mousedown/mousemove/mouseup and delegates to active tool
- Tool classes: src/features/canvas/tools/
  - SelectTool, PanTool, RectangleTool, CircleTool, TriangleTool
  - TextTool, StickyNoteTool
  - Drawing tools: PenTool, MarkerTool, HighlighterTool, EraserTool
  - ConnectorTool (basic line flow)
- Rendering pipeline
  - CanvasRenderer (src/features/canvas/core/CanvasRenderer.ts)
  - ElementRegistry (src/features/canvas/core/ElementRegistry.ts)
  - Imperative Konva Stage + Layers in CanvasStage (src/features/canvas/components/CanvasStage.tsx)
- Selection/Transform
  - TransformerController (src/features/canvas/core/TransformerController.ts) attached in CanvasStage; supports multi-select, resets scales, batches store persistence, and shows basic alignment guides.
- Store
  - Modular unified store (src/features/canvas/stores/unifiedCanvasStore.ts) with element/selection/history/viewport modules

Not yet integrated (available but inactive)
- MemoryManager (src/features/canvas/core/MemoryManager.ts)
- ToolRegistry / ToolEventDelegate (do not exist — superseded by UnifiedEventHandler approach)

Status by area
- Foundation
  - ITool-style interfaces exist within tools (simple, per-file interfaces)
  - UnifiedEventHandler active in runtime
  - CanvasRenderer + ElementRegistry active in runtime
  - MemoryManager present; DirectRenderer initialized but not used by tools
- Tool migration
  - Core tools (select, pan): implemented
  - Shape tools (rectangle, circle, triangle): implemented
  - Text, Sticky Note: implemented
  - Drawing tools (pen/marker/highlighter/eraser): implemented
  - Connector: basic line version implemented; advanced styles pending
  - Table/Section: data types supported; tool UX pending
- Testing
  - Legacy tests reference react-konva components
  - New imperative path needs dedicated tests for tools, transformer, and renderer

Performance notes
- No formal benchmark data captured yet in this pipeline
- Subjectively smooth for common operations; further gains expected when DirectRenderer is integrated for drawing paths

Immediate next steps
- Wire MemoryManager into ElementRegistry/CanvasStage to ensure explicit cleanup
- Integrate KonvaDirectRenderer for drawing tools to bypass generic updates on high-frequency paths
- Replace remaining runtime usages of react-konva (keep archived/tests isolated) and update tests
- Expand tests: tool switching, selection/transform edge cases, memory leak checks

File map (key runtime pieces)
- Stage & Layers: src/features/canvas/components/CanvasStage.tsx
- Renderer: src/features/canvas/core/CanvasRenderer.ts
- Registry: src/features/canvas/core/ElementRegistry.ts
- Events/Tools: src/features/canvas/core/UnifiedEventHandler.ts, src/features/canvas/tools/*
- Transformer: src/features/canvas/core/TransformerController.ts
- Store: src/features/canvas/stores/unifiedCanvasStore.ts

Changelog (doc updates)
- Removed claims about ToolRegistry/ToolEventDelegate being implemented
- Clarified that MemoryManager/KonvaDirectRenderer exist but are not yet wired
- Updated tool and runtime integration status to match code

Last updated: 2025-08-25
Status: Core runtime working; refactor integration ongoing