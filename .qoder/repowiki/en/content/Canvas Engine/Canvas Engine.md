# Canvas Engine

<cite>
**Referenced Files in This Document**   
- [CanvasContainer.tsx](file://src/features/canvas/components/CanvasContainer.tsx)
- [NonReactCanvasStage.tsx](file://src/features/canvas/components/NonReactCanvasStage.tsx)
- [unifiedCanvasStore.ts](file://src/features/canvas/stores/unifiedCanvasStore.ts)
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)
- [index.ts](file://src/features/canvas/renderer/index.ts)
- [types.ts](file://src/features/canvas/renderer/types.ts)
- [store-adapter.ts](file://src/features/canvas/renderer/store-adapter.ts)
- [CANVAS_SYSTEM_DOCUMENTATION.md](file://src/features/canvas/CANVAS_SYSTEM_DOCUMENTATION.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
The Canvas Engine in LibreOllama is a high-performance drawing and collaboration tool designed to deliver a seamless user experience for creating diagrams, visual content, and interactive designs. Built on modern web technologies, the engine leverages Konva.js for rendering and React-Konva for integration with the React ecosystem. This documentation provides a comprehensive overview of the system's architecture, detailing its component interactions, rendering pipeline, and optimization strategies. The engine supports real-time collaboration, accessibility compliance, and advanced performance optimizations to ensure smooth operation even with complex canvases.

## Project Structure
The Canvas Engine is organized within the `src/features/canvas` directory, which contains a modular and well-structured codebase. The project is divided into several key subdirectories: `components` for UI elements, `hooks` for reusable logic, `renderer` for rendering logic, `services` for business logic, `stores` for state management, `types` for type definitions, and `utils` for utility functions. This structure promotes separation of concerns and facilitates maintainability. The engine integrates with the broader LibreOllama application through the `CanvasContainer` component, which serves as the entry point for the canvas feature.

```mermaid
graph TD
A[CanvasContainer] --> B[NonReactCanvasStage]
B --> C[CanvasRendererV2]
B --> D[unifiedCanvasStore]
C --> E[Renderer Modules]
D --> F[Store Modules]
E --> G[LayerManager]
E --> H[NodeFactory]
E --> I[TransformerController]
F --> J[ElementModule]
F --> K[SelectionModule]
F --> L[ViewportModule]
```

**Diagram sources**
- [CanvasContainer.tsx](file://src/features/canvas/components/CanvasContainer.tsx)
- [NonReactCanvasStage.tsx](file://src/features/canvas/components/NonReactCanvasStage.tsx)
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)
- [unifiedCanvasStore.ts](file://src/features/canvas/stores/unifiedCanvasStore.ts)

**Section sources**
- [CanvasContainer.tsx](file://src/features/canvas/components/CanvasContainer.tsx)
- [NonReactCanvasStage.tsx](file://src/features/canvas/components/NonReactCanvasStage.tsx)

## Core Components
The Canvas Engine consists of several core components that work together to provide a rich drawing experience. The `CanvasContainer` component serves as the main container for the canvas, integrating the stage, toolbar, and sidebar. The `NonReactCanvasStage` component manages the Konva stage and layers, handling user interactions and rendering. The `unifiedCanvasStore` provides centralized state management using Zustand, while the `CanvasRendererV2` class orchestrates the rendering process, coordinating between the store and the Konva stage. These components are designed to be modular and reusable, allowing for easy extension and maintenance.

**Section sources**
- [CanvasContainer.tsx](file://src/features/canvas/components/CanvasContainer.tsx)
- [NonReactCanvasStage.tsx](file://src/features/canvas/components/NonReactCanvasStage.tsx)
- [unifiedCanvasStore.ts](file://src/features/canvas/stores/unifiedCanvasStore.ts)
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)

## Architecture Overview
The Canvas Engine follows a modular architecture that separates concerns between rendering, state management, and user interface. The system is built around a central `CanvasRendererV2` class that coordinates the rendering process, working in conjunction with a `unifiedCanvasStore` for state management. The renderer uses Konva.js to manage multiple layers, including background, main content, preview, and overlay layers. This layered approach allows for efficient rendering and interaction handling. The engine supports a wide range of element types, including shapes, text, images, and connectors, each with its own rendering and interaction logic.

```mermaid
classDiagram
class CanvasRendererV2 {
+layers : RendererLayers
+nodeMap : Map~string, Node~
+transformer : Transformer
+syncElements(elements)
+syncSelection(ids)
+init(stage, layers, callbacks)
}
class unifiedCanvasStore {
+elements : Map~ElementId, CanvasElement~
+selectedElementIds : Set~ElementId~
+viewport : ViewportState
+addElement(element)
+updateElement(id, updates)
+deleteElement(id)
+selectElement(id)
}
class NonReactCanvasStage {
+stageRef : RefObject~Stage~
+containerRef : RefObject~HTMLDivElement~
+useEffect for stage initialization
+useEffect for viewport sync
+useEffect for renderer initialization
}
CanvasRendererV2 --> unifiedCanvasStore : "reads state"
CanvasRendererV2 --> NonReactCanvasStage : "renders to stage"
unifiedCanvasStore --> CanvasRendererV2 : "notifies of changes"
NonReactCanvasStage --> CanvasRendererV2 : "provides stage and layers"
```

**Diagram sources**
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)
- [unifiedCanvasStore.ts](file://src/features/canvas/stores/unifiedCanvasStore.ts)
- [NonReactCanvasStage.tsx](file://src/features/canvas/components/NonReactCanvasStage.tsx)

## Detailed Component Analysis

### Canvas Renderer Analysis
The `CanvasRendererV2` class is the heart of the Canvas Engine, responsible for coordinating the rendering process and managing interactions between the Konva stage and the application state. It uses a modular architecture with specialized classes for different aspects of rendering, such as `LayerManager` for layer management, `NodeFactory` for node creation and pooling, and `TransformerController` for selection and transformation. The renderer supports a wide range of element types, each with its own rendering logic, and provides a clean API for creating, updating, and deleting elements.

#### For Object-Oriented Components:
```mermaid
classDiagram
class CanvasRendererV2 {
+layers : RendererLayers
+nodeMap : Map~string, Node~
+transformer : Transformer
+syncElements(elements)
+syncSelection(ids)
+init(stage, layers, callbacks)
}
class LayerManager {
+init(stage)
+get(name)
+getAll()
+batchDraw(names)
+listenTo(event, handler)
}
class NodeFactory {
+create(element)
+update(node, element)
+get(id)
+release(node)
+dispose()
}
class TransformerController {
+init(overlayLayer)
+attach(nodes)
+detach()
+updateForElement(element)
+dispose()
}
CanvasRendererV2 --> LayerManager : "uses"
CanvasRendererV2 --> NodeFactory : "uses"
CanvasRendererV2 --> TransformerController : "uses"
```

**Diagram sources**
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)
- [renderer/index.ts](file://src/features/canvas/renderer/index.ts)

#### For API/Service Components:
```mermaid
sequenceDiagram
participant UI as "UI Component"
participant Renderer as "CanvasRendererV2"
participant Store as "unifiedCanvasStore"
participant Konva as "Konva Stage"
UI->>Renderer : syncElements(elements)
Renderer->>Store : subscribe to element changes
Renderer->>Renderer : create/update/delete nodes
Renderer->>Konva : add nodes to main layer
Renderer->>Konva : batchDraw main layer
UI->>Renderer : syncSelection(ids)
Renderer->>Store : subscribe to selection changes
Renderer->>Renderer : find nodes by id
Renderer->>Renderer : attach transformer to nodes
Renderer->>Konva : batchDraw overlay layer
Konva->>Renderer : dragstart event
Renderer->>Store : setDragging(true)
Konva->>Renderer : dragend event
Renderer->>Store : updateElement position
Renderer->>Store : setDragging(false)
```

**Diagram sources**
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)
- [unifiedCanvasStore.ts](file://src/features/canvas/stores/unifiedCanvasStore.ts)

#### For Complex Logic Components:
```mermaid
flowchart TD
Start([Renderer Initialization]) --> CreateLayers["Create Layers: background, main, preview, overlay"]
CreateLayers --> SetupEventHandlers["Setup Stage Event Handlers"]
SetupEventHandlers --> InitializeModules["Initialize Renderer Modules"]
InitializeModules --> ConnectStore["Connect to unifiedCanvasStore"]
ConnectStore --> SetupSubscriptions["Setup Store Subscriptions"]
SetupSubscriptions --> Ready([Renderer Ready])
Ready --> SyncElements["Sync Elements from Store"]
SyncElements --> UpdateExisting["Update Existing Nodes"]
UpdateExisting --> CreateNew["Create New Nodes"]
CreateNew --> RemoveOrphaned["Remove Orphaned Nodes"]
RemoveOrphaned --> BatchDraw["Batch Draw Main Layer"]
Ready --> HandleUserInput["Handle User Input"]
HandleUserInput --> DoubleClick["Double-click to Edit"]
DoubleClick --> OpenEditor["Open Text Editor"]
OpenEditor --> UpdateStore["Update Store with New Text"]
UpdateStore --> SyncCircle["Sync Circle Text (if applicable)"]
SyncCircle --> BatchDraw
HandleUserInput --> Click["Click to Select"]
Click --> UpdateSelection["Update Selection in Store"]
UpdateSelection --> SyncSelection["Sync Selection to Transformer"]
SyncSelection --> BatchDrawOverlay["Batch Draw Overlay Layer"]
```

**Diagram sources**
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)
- [unifiedCanvasStore.ts](file://src/features/canvas/stores/unifiedCanvasStore.ts)

**Section sources**
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)
- [index.ts](file://src/features/canvas/renderer/index.ts)

### State Management Analysis
The `unifiedCanvasStore` is a Zustand-based store that provides centralized state management for the Canvas Engine. It composes multiple focused modules for better maintainability, including `elementModule` for element CRUD operations, `selectionModule` for multi-selection management, `viewportModule` for pan/zoom state, and `historyModule` for undo/redo operations. The store uses Immer for immutable updates and supports persistence through localStorage. This modular approach allows for better code organization and easier testing.

#### For Object-Oriented Components:
```mermaid
classDiagram
class unifiedCanvasStore {
+elements : Map~ElementId, CanvasElement~
+selectedElementIds : Set~ElementId~
+viewport : ViewportState
+history : HistoryState
+addElement(element)
+updateElement(id, updates)
+deleteElement(id)
+selectElement(id)
+undo()
+redo()
}
class ElementModule {
+elements : Map~ElementId, CanvasElement~
+elementOrder : ElementId[]
+addElement(element)
+updateElement(id, updates)
+deleteElement(id)
+clearAllElements()
}
class SelectionModule {
+selectedElementIds : Set~ElementId~
+lastSelectedElementId : ElementId | null
+selectElement(id, addToSelection)
+clearSelection()
+toggleSelection(id)
}
class ViewportModule {
+viewport : ViewportState
+setViewport(viewport)
+zoomViewport(scale, x, y)
+panViewport(dx, dy)
}
class HistoryModule {
+history : Array[]HistoryItem~~
+currentIndex : number
+createCheckpoint(label)
+undo()
+redo()
+canUndo()
+canRedo()
}
unifiedCanvasStore --> ElementModule : "composes"
unifiedCanvasStore --> SelectionModule : "composes"
unifiedCanvasStore --> ViewportModule : "composes"
unifiedCanvasStore --> HistoryModule : "composes"
```

**Diagram sources**
- [unifiedCanvasStore.ts](file://src/features/canvas/stores/unifiedCanvasStore.ts)

#### For API/Service Components:
```mermaid
sequenceDiagram
participant UI as "UI Component"
participant Store as "unifiedCanvasStore"
participant Renderer as "CanvasRendererV2"
UI->>Store : addElement(element)
Store->>Store : Add element to elements map
Store->>Store : Add element ID to elementOrder
Store->>Renderer : notify of element addition
Renderer->>Renderer : create new node
Renderer->>Konva : add node to main layer
Renderer->>Konva : batchDraw main layer
UI->>Store : updateElement(id, updates)
Store->>Store : Update element in elements map
Store->>Renderer : notify of element update
Renderer->>Renderer : update existing node
Renderer->>Konva : batchDraw main layer
UI->>Store : selectElement(id)
Store->>Store : Add ID to selectedElementIds
Store->>Store : Set lastSelectedElementId
Store->>Renderer : notify of selection change
Renderer->>Renderer : attach transformer to selected nodes
Renderer->>Konva : batchDraw overlay layer
UI->>Store : undo()
Store->>Store : Apply previous state from history
Store->>Renderer : notify of state change
Renderer->>Renderer : sync elements and selection
Renderer->>Konva : batchDraw layers
```

**Diagram sources**
- [unifiedCanvasStore.ts](file://src/features/canvas/stores/unifiedCanvasStore.ts)
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)

**Section sources**
- [unifiedCanvasStore.ts](file://src/features/canvas/stores/unifiedCanvasStore.ts)

### Rendering Pipeline Analysis
The rendering pipeline in the Canvas Engine is designed to be efficient and responsive, handling user input and state changes in a coordinated manner. The pipeline begins with user input, which is processed by the `NonReactCanvasStage` component and translated into actions on the `unifiedCanvasStore`. The `CanvasRendererV2` class listens for changes to the store and updates the Konva stage accordingly. This separation of concerns allows for a clean and maintainable codebase, with clear boundaries between input handling, state management, and rendering.

#### For Complex Logic Components:
```mermaid
flowchart TD
Start([User Input]) --> ProcessInput["Process Input in NonReactCanvasStage"]
ProcessInput --> UpdateStore["Update unifiedCanvasStore"]
UpdateStore --> NotifyRenderer["Notify CanvasRendererV2 of Change"]
NotifyRenderer --> SyncElements["Sync Elements to Konva Nodes"]
SyncElements --> UpdateExisting["Update Existing Nodes"]
UpdateExisting --> CreateNew["Create New Nodes"]
CreateNew --> RemoveOrphaned["Remove Orphaned Nodes"]
RemoveOrphaned --> BatchDraw["Batch Draw Layers"]
BatchDraw --> HandleSelection["Handle Selection Changes"]
HandleSelection --> FindNodes["Find Nodes by ID"]
FindNodes --> AttachTransformer["Attach Transformer to Nodes"]
AttachTransformer --> BatchDrawOverlay["Batch Draw Overlay Layer"]
BatchDraw --> HandleTransform["Handle Transform Events"]
HandleTransform --> UpdateStorePosition["Update Store with New Position"]
UpdateStorePosition --> SyncToRenderer["Sync to Renderer"]
SyncToRenderer --> BatchDraw
BatchDraw --> HandleText["Handle Text Editing"]
HandleText --> CreateTextarea["Create DOM Textarea"]
CreateTextarea --> UpdateStoreText["Update Store with New Text"]
UpdateStoreText --> SyncToRenderer["Sync to Renderer"]
SyncToRenderer --> BatchDraw
```

**Diagram sources**
- [NonReactCanvasStage.tsx](file://src/features/canvas/components/NonReactCanvasStage.tsx)
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)
- [unifiedCanvasStore.ts](file://src/features/canvas/stores/unifiedCanvasStore.ts)

**Section sources**
- [NonReactCanvasStage.tsx](file://src/features/canvas/components/NonReactCanvasStage.tsx)

## Dependency Analysis
The Canvas Engine has a well-defined dependency structure that promotes modularity and maintainability. The core dependencies include Konva.js for rendering, React-Konva for React integration, and Zustand for state management. The engine also uses Immer for immutable updates and supports persistence through localStorage. The modular architecture of the `unifiedCanvasStore` allows for easy extension and testing, with each module responsible for a specific aspect of state management. The `CanvasRendererV2` class depends on the store for state and the Konva stage for rendering, but has no direct dependencies on the UI components, allowing for greater flexibility in the user interface.

```mermaid
graph TD
A[Canvas Engine] --> B[Konva.js]
A --> C[React-Konva]
A --> D[Zustand]
A --> E[Immer]
A --> F[localStorage]
B --> G[HTML5 Canvas]
C --> H[React]
D --> I[JavaScript]
E --> J[JavaScript]
F --> K[Browser Storage]
```

**Diagram sources**
- [package.json](file://package.json)

**Section sources**
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)
- [unifiedCanvasStore.ts](file://src/features/canvas/stores/unifiedCanvasStore.ts)

## Performance Considerations
The Canvas Engine includes several performance optimizations to ensure smooth operation even with complex canvases. These include object pooling for node reuse, viewport culling to hide off-screen elements, progressive rendering for large canvases, and shape caching for pre-computed element rendering. The engine also uses RAF (RequestAnimationFrame) coordination for single animation frame scheduling and debounced operations for rate-limited user actions. Memory management is handled through weak map caching and automatic garbage collection, with memory pressure detection for auto-cleanup on low memory.

**Section sources**
- [CANVAS_SYSTEM_DOCUMENTATION.md](file://src/features/canvas/CANVAS_SYSTEM_DOCUMENTATION.md)

## Troubleshooting Guide
When troubleshooting issues with the Canvas Engine, start by checking the browser console for any error messages. Common issues include problems with the Konva stage initialization, which can be caused by incorrect container sizing or missing dependencies. If elements are not rendering correctly, verify that the `unifiedCanvasStore` is properly synchronized with the `CanvasRendererV2`. For performance issues, check the browser's performance profiler to identify any bottlenecks in the rendering pipeline. If the canvas is not responding to user input, ensure that the event handlers are properly attached to the Konva stage.

**Section sources**
- [NonReactCanvasStage.tsx](file://src/features/canvas/components/NonReactCanvasStage.tsx)
- [CanvasRendererV2.ts](file://src/features/canvas/services/CanvasRendererV2.ts)

## Conclusion
The Canvas Engine in LibreOllama is a sophisticated and well-architected drawing and collaboration tool that leverages modern web technologies to deliver a high-performance user experience. Its modular design, with clear separation of concerns between rendering, state management, and user interface, makes it both maintainable and extensible. The engine's support for real-time collaboration, accessibility compliance, and advanced performance optimizations ensures that it can handle complex use cases while remaining responsive and user-friendly. By following the principles of clean code and modular architecture, the Canvas Engine provides a solid foundation for future enhancements and integrations.