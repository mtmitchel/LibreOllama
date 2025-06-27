Of course. Here is Part 1 of the guide, written with moderate detail to provide a strong, practical foundation without being overwhelming.

***

### **The Definitive Guide: Advanced React Konva with TypeScript in Tauri**

### Part 1: Foundations & Core Concepts

This first part of the guide is designed to get you from a blank slate to a running, interactive canvas application. We will cover the essential setup, core architectural concepts, and the fundamental patterns you will use in every React Konva project. By the end of this section, you will have a solid foundation to build upon for the more advanced topics to come.

---

#### **1. Introduction**

##### **1.1. The Power of the Tech Stack: React Konva, TypeScript, and Tauri**

The combination of React Konva, TypeScript, and Tauri offers a unique and powerful synergy for building desktop applications. Each component plays a critical role:

*   **React Konva**: Provides a declarative, component-driven API for the HTML5 canvas. Instead of writing complex, imperative drawing commands, you define your scene with React components like `<Rect>` and `<Circle>`, managing their properties with state and props.
*   **TypeScript**: Adds a robust static typing system on top of JavaScript. This is invaluable in complex applications for preventing runtime errors, improving code maintainability, and enabling powerful autocompletion and refactoring in your editor.
*   **Tauri**: A modern framework for building lightweight, secure, and high-performance desktop applications using a Rust backend and a web-based frontend. It allows you to leverage your web development skills to create native experiences that are faster and more resource-efficient than traditional Electron apps.

Together, they allow you to build visually rich, interactive, and type-safe desktop applications with a familiar development workflow.

##### **1.2. Guide Objectives and Structure**

This guide will take you from the initial setup to advanced architectural patterns. Part 1 establishes the foundational knowledge required to be productive. Subsequent parts will build upon this foundation to explore complex interactivity, performance optimization, and sophisticated application architecture.

---

#### **2. Project Setup & Initial Configuration**

A correct initial setup is crucial for a smooth development experience. The following steps will create a complete, configured project environment.

##### **2.1. Scaffolding a New Tauri Project with `create-tauri-app`**

Tauri provides an interactive command-line interface (CLI) to scaffold a new project with your preferred frontend framework and language.

```bash
# Run the interactive setup command in your terminal
npm create tauri-app@latest my-advanced-canvas
```

During the prompts, make the following selections:
*   **What is your app name?**: `my-advanced-canvas`
*   **What should the window title be?**: `My Advanced Canvas`
*   **Which UI recipe would you like to add?**: `React`
*   **Would you like to setup TypeScript?**: `Yes`

This will create a new directory containing a Vite-powered React frontend and a Rust-based Tauri backend, all pre-configured to work together.

##### **2.2. Installing Dependencies: `react-konva`, `konva`, and `@types/konva`**

Navigate into your newly created project directory and install the necessary Konva libraries.

```bash
# Change into your project directory
cd my-advanced-canvas

# Install the Konva libraries
npm install react-konva konva --save
npm install @types/konva --save-dev
```

Here is the role of each package:
*   `konva`: This is the core 2D canvas engine. It is a high-performance library that handles all the low-level rendering, shape management, and event logic.
*   `react-konva`: This is the React wrapper around Konva. It exposes Konva's functionality as React components, allowing you to build your canvas declaratively.
*   `@types/konva`: While `react-konva` has some built-in types, this package provides the comprehensive TypeScript definitions for the core `konva` engine, ensuring full type safety for nodes, shapes, and event objects.

##### **2.3. Verifying TypeScript Configuration (`tsconfig.json`)**

The `create-tauri-app` template provides a solid `tsconfig.json`, but it's good practice to verify a few key settings that are critical for React with TypeScript:

*   `"jsx": "react-jsx"`: This enables the modern JSX transform, which is standard for React 17+ and doesn't require importing React into every component file.
*   `"strict": true`: Enables all strict type-checking options. This is highly recommended for catching potential errors early and writing more robust code.
*   `"moduleResolution": "bundler"` (or `"node"`): Ensures that TypeScript correctly resolves modules in the way that modern bundlers like Vite do.

---

#### **3. The Essentials in Action: A Fully-Typed Starter Component**

This single component demonstrates the core architecture and fundamental development patterns you will use throughout any React Konva application.

##### **3.1. The Core Architecture: Stage, Layer, and Shapes**

A React Konva scene is structured hierarchically:
*   **`<Stage>`**: The top-level component that represents the entire `<canvas>` element. It requires `width` and `height` props.
*   **`<Layer>`**: A distinct drawing layer within the Stage. Think of these as transparent sheets stacked on top of each other. Each Layer is its own canvas element, which is key for performance: when something changes in one layer, only that layer needs to be redrawn.
*   **Shape Components**: Components like `<Rect>`, `<Circle>`, and `<Text>` that you place inside a Layer to be rendered.

##### **3.2, 3.3, 3.4: A Practical Demonstration of Core Patterns**

The following `FoundationCanvas` component illustrates the three fundamental patterns for working with React Konva and TypeScript.

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva'; // Import Konva for its type definitions

const FoundationCanvas: React.FC = () => {
  // PATTERN 1: Declarative State Management
  // The shape's properties are driven by React state. To change the shape, you change the state.
  // This aligns with React's philosophy and makes your UI predictable.
  const [rect, setRect] = useState({
    x: 100,
    y: 100,
    width: 150,
    height: 100,
    isDragging: false,
  });

  // PATTERN 2: Imperative Access with Typed Refs
  // For features not available as props (like animations or caching), get direct access to the
  // Konva Node instance using a ref. Typing the ref with <Konva.Rect> gives you full autocompletion.
  const rectRef = useRef<Konva.Rect>(null);

  // We use the ref inside useEffect to trigger a Konva animation for visual feedback.
  useEffect(() => {
    // The `.to()` method is a Konva feature for creating tweens (animations).
    rectRef.current?.to({
      scaleX: rect.isDragging ? 1.1 : 1,
      scaleY: rect.isDragging ? 1.1 : 1,
      duration: 0.1,
    });
  }, [rect.isDragging]);

  // PATTERN 3: Handling Basic Interactivity with Typed Events
  // Event handlers receive a specifically typed KonvaEventObject. This ensures type-safe
  // access to the event's properties, like the target node that was dragged.
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // e.target is the Konva.Rect node itself. We can read its final position.
    setRect(prev => ({
      ...prev,
      isDragging: false,
      x: e.target.x(),
      y: e.target.y(),
    }));
  };

  const handleDragStart = () => {
    setRect(prev => ({ ...prev, isDragging: true }));
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Rect
          ref={rectRef}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={rect.isDragging ? 'hsl(210, 100%, 70%)' : 'hsl(210, 100%, 50%)'}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          shadowColor="black"
          shadowBlur={15}
          shadowOpacity={0.4}
          shadowOffsetX={5}
          shadowOffsetY={5}
          cornerRadius={10}
        />
      </Layer>
    </Stage>
  );
};

export default FoundationCanvas;

Of course. Here is Part 2 of the guide, written in detail to provide an in-depth exploration of the core interactivity mechanics.

***

### Part 2: Mastering Interactivity (In-Depth)

With the foundational setup complete, this section dives deep into the systems that bring a canvas to life: event handling, grouping complex objects, and creating sophisticated drag-and-drop mechanics. Mastering these concepts is the key to building applications that feel intuitive, responsive, and professional.

---

#### **4. Event Handling Mastery**

React Konva supports a rich event system that mirrors the DOM but is tailored for the canvas. Understanding its nuances is crucial for building anything beyond a static display.

##### **4.1. The Konva Event Object**

When an event fires on a Konva node (like `onClick`, `onDragMove`, or `onMouseEnter`), your handler function receives a single argument: the `Konva.KonvaEventObject`. This object is your gateway to understanding what happened and how to react. Its most critical properties are:

*   **`e.target`**: The Konva node that **originally triggered** the event. If a user clicks on a specific `<Circle>` within a `<Group>`, `e.target` will be that `Konva.Circle` instance, even if the event listener is on the parent group. This is the property you will use most often.
*   **`e.currentTarget`**: The Konva node that the **event listener is attached to**. In the same example, if the `onClick` handler is on the `<Group>`, `e.currentTarget` would be the `Konva.Group` instance. This is useful for event delegation patterns.
*   **`e.evt`**: The raw, underlying **native browser event** (e.g., `MouseEvent`, `TouchEvent`, `PointerEvent`). You need to access this for properties not abstracted by Konva, such as:
    *   `e.evt.button`: To detect left-clicks (0), middle-clicks (1), or right-clicks (2).
    *   `e.evt.preventDefault()`: To stop default browser actions, like scrolling on touch devices or the context menu appearing on a right-click.
    *   `e.evt.ctrlKey`, `e.evt.shiftKey`, `e.evt.altKey`: To detect modifier key presses during an event.

##### **4.2. Event Propagation: Bubbling and How to Control It**

By default, events in Konva "bubble" up the scene graph hierarchy. When you click a shape, the event fires on that shape, then its parent group, then that group's parent, and so on, up to the Layer and Stage. This allows you to create powerful, nested interactions.

However, sometimes you need to stop this chain. To prevent an event from bubbling further up, you set **`e.cancelBubble = true`**.

**Practical Use Case: A Composite Card Component**

Imagine a "card" component that should be selectable when clicked anywhere on its body, but has a small "delete" icon that should *only* perform a delete action, not select the card.

```typescript
import React from 'react';
import { Stage, Layer, Group, Rect, Circle, Text } from 'react-konva';
import Konva from 'konva';

const CardComponent = ({ onSelect, onDelete }: { onSelect: () => void; onDelete: () => void }) => {
  const handleCardClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // This handler will run for any click within the group, unless stopped by a child.
    console.log('Card selected!');
    onSelect();
  };

  const handleDeleteIconClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // This is the crucial part: we stop the event here.
    e.cancelBubble = true;
    console.log('Delete icon clicked! Preventing card selection.');
    onDelete();
  };

  return (
    <Group x={50} y={50} onClick={handleCardClick}>
      {/* Card Body */}
      <Rect width={200} height={120} fill="lightgrey" stroke="black" cornerRadius={8} />
      <Text text="My Interactive Card" x={10} y={10} fontSize={16} />
      {/* Delete Icon */}
      <Circle x={185} y={15} radius={10} fill="red" stroke="white" strokeWidth={2} onClick={handleDeleteIconClick} />
    </Group>
  );
};
```
In this example, clicking the red circle will call `handleDeleteIconClick`, which sets `cancelBubble` to `true`. The event processing stops there, and `handleCardClick` on the parent `<Group>` is never called. Clicking anywhere else on the card will trigger `handleCardClick` as expected.

##### **4.3. High-Performance Event Delegation**

For scenes with hundreds or thousands of interactive shapes, attaching an event listener to every single one is inefficient and can cause performance issues. The more performant solution is **event delegation**.

You attach a *single* event listener to a common ancestor, typically the `<Layer>`. When an event occurs on any child shape, it bubbles up to the layer. You can then inspect `e.target` to identify which specific shape was the source of the event.

```typescript
const DelegatedScene = () => {
  // Imagine this array contains thousands of shape objects
  const shapes = [
    { id: 'rect-1', x: 20, y: 20, color: 'red' },
    { id: 'rect-2', x: 100, y: 50, color: 'green' },
    { id: 'circle-1', x: 200, y: 80, color: 'blue' },
  ];

  // A single click handler attached to the Layer
  const handleLayerClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedNode = e.target;
    
    // Check that we clicked a shape, not the empty space of the layer
    if (clickedNode.className !== 'Layer') {
      console.log(`Node with ID "${clickedNode.id()}" was clicked.`);
      // You can now perform logic based on the clicked node,
      // for example, updating its state in your application.
    }
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer onClick={handleLayerClick}>
        {shapes.map(shape => {
          if (shape.id.startsWith('rect')) {
            return <Rect key={shape.id} id={shape.id} x={shape.x} y={shape.y} width={50} height={50} fill={shape.color} />;
          } else {
            return <Circle key={shape.id} id={shape.id} x={shape.x} y={shape.y} radius={30} fill={shape.color} />;
          }
        })}
      </Layer>
    </Stage>
  );
};
```
This pattern is fundamental for building large-scale, performant applications like map editors or complex diagrams.

##### **4.4. Handling Mouse vs. Touch Events**

React Konva abstracts mouse and touch events into a single set of handlers (e.g., `onDragStart`, `onClick`). However, you can distinguish between them if needed by inspecting the native event: `'ontouchend' in window` can be a quick check, or more robustly, inspect the `e.evt` type (e.g., `e.evt instanceof MouseEvent`).

---

#### **5. Advanced Grouping and Scene Architecture**

The `<Group>` component is more than just a folder for shapes; it's a fundamental tool for creating composite objects and managing complex coordinate systems.

##### **5.1. Understanding Local vs. Global Coordinate Systems**

A child node's `(x, y)` coordinates are **relative to the top-left corner of its parent container**. This is a critical concept.

*   A `<Group>` at `x={100}, y={100}`.
*   Contains a `<Rect>` at `x={20}, y={20}`.
*   The rectangle's absolute (global) position on the stage is `(120, 120)`.

This feature allows you to design complex components with their origin at `(0, 0)`, making them self-contained and reusable. You can then place instances of this component anywhere on the stage simply by setting the parent `<Group>`'s position.

##### **5.2. Building Complex, Composite Components with `<Group>`**

By combining groups and relative coordinates, you can build reusable, encapsulated components.

```typescript
interface IconLabelProps {
  x: number;
  y: number;
  iconShape: 'circle' | 'square';
  labelText: string;
}

const IconLabel: React.FC<IconLabelProps> = ({ x, y, iconShape, labelText }) => {
  return (
    <Group x={x} y={y} draggable>
      {/* Icon - drawn at the group's local origin */}
      {iconShape === 'circle' ? (
        <Circle radius={15} fill="skyblue" />
      ) : (
        <Rect width={30} height={30} fill="lightgreen" cornerRadius={4} />
      )}
      {/* Label - positioned relative to the icon */}
      <Text
        text={labelText}
        x={40}
        y={-8} // Vertically center the text relative to the icon's center
        fontSize={18}
        fontStyle="bold"
      />
    </Group>
  );
};

// Usage in the main scene:
<IconLabel x={100} y={150} iconShape="circle" labelText="My First Item" />
<IconLabel x={100} y={200} iconShape="square" labelText="Another Item" />
```

##### **5.3. Dragging Groups vs. Dragging Individual Children**

By default, making a `<Group>` draggable makes the entire unit movable. However, you might want to allow a child to be dragged independently *within* its parent group's coordinate system. To achieve this, make the child `draggable` and use `e.cancelBubble = true` on its `onDragStart` event to prevent the group from initiating a drag at the same time.

---

#### **6. Advanced Drag and Drop Patterns**

A professional drag-and-drop system provides clear user feedback and respects application rules.

##### **6.1. Pattern 1: Visual Feedback and Z-Index Management on Drag**

When a user drags an object, it should visually stand out and render on top of all other objects. This requires managing both a "dragging" state and reordering your state array.

```typescript
const DraggableList = () => {
  const [items, setItems] = useState([/* ...initial items */]);

  const handleDragStart = (id: string) => {
    setItems(prev => {
      const draggedItem = prev.find(item => item.id === id);
      if (!draggedItem) return prev;
      const others = prev.filter(item => item.id !== id);
      // Set the dragging state and move it to the end of the array to render on top
      return [...others, { ...draggedItem, isDragging: true }];
    });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, x: e.target.x(), y: e.target.y(), isDragging: false }
          : item
      )
    );
  };

  return (
    <Layer>
      {items.map(item => (
        <Rect
          key={item.id}
          id={item.id}
          /* ...props */
          scaleX={item.isDragging ? 1.1 : 1}
          shadowBlur={item.isDragging ? 15 : 5}
          draggable
          onDragStart={() => handleDragStart(item.id)}
          onDragEnd={(e) => handleDragEnd(e, item.id)}
        />
      ))}
    </Layer>
  );
};
```

##### **6.2. Pattern 2: Bounded Dragging and Grid Snapping with `dragBoundFunc`**

Use the `dragBoundFunc` prop to constrain an object's position during a drag. This function receives the node's desired position on every mouse movement and must return the corrected, valid position.

```typescript
const gridSize = 20;
const canvasWidth = 800;
const canvasHeight = 600;
const shapeWidth = 100;
const shapeHeight = 100;

const boundedAndSnappingDrag = (pos: { x: number; y: number }) => {
  // Snap to the nearest grid line
  let newX = Math.round(pos.x / gridSize) * gridSize;
  let newY = Math.round(pos.y / gridSize) * gridSize;

  // Constrain to canvas boundaries
  newX = Math.max(0, Math.min(canvasWidth - shapeWidth, newX));
  newY = Math.max(0, Math.min(canvasHeight - shapeHeight, newY));

  return { x: newX, y: newY };
};

return (
  <Rect
    draggable
    dragBoundFunc={boundedAndSnappingDrag}
    width={shapeWidth}
    height={shapeHeight}
    /* ...other props */
  />
);
```

##### **6.3. Implementing Custom Drop Zones and Hit Detection**

To detect when a dragged shape is over a valid "drop zone," you can use Konva's intersection methods inside the `onDragMove` event handler.

```typescript
const DragAndDropScene = () => {
  const [isOverDropZone, setIsOverDropZone] = useState(false);
  const dropZoneRef = useRef<Konva.Rect>(null);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const draggedShape = e.target;
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;
    
    // Konva doesn't have a simple "intersects" method, so we check bounding boxes.
    const draggedBox = draggedShape.getClientRect();
    const dropZoneBox = dropZone.getClientRect();

    const isIntersecting = !(
      draggedBox.x > dropZoneBox.x + dropZoneBox.width ||
      draggedBox.x + draggedBox.width < dropZoneBox.x ||
      draggedBox.y > dropZoneBox.y + dropZoneBox.height ||
      draggedBox.y + draggedBox.height < dropZoneBox.y
    );

    setIsOverDropZone(isIntersecting);
  };

  const handleDragEnd = () => {
    if (isOverDropZone) {
      console.log('Dropped successfully on the zone!');
    }
    setIsOverDropZone(false);
  };

  return (
    <Layer>
      <Rect ref={dropZoneRef} x={300} y={100} width={200} height={200} fill={isOverDropZone ? 'lightgreen' : 'lightgrey'} />
      <Rect draggable onDragMove={handleDragMove} onDragEnd={handleDragEnd} /* ...props */ />
    </Layer>
  );
};

Of course. Here is Part 3 of the guide, written in detail to cover the implementation of advanced features and the architectural patterns necessary for building complex, scalable applications.

***

### Part 3: Building Complex Applications & Features

With a mastery of core interactivity, we can now move on to building the complex features and robust architecture that define professional-grade applications. This section covers the implementation of advanced tools like transformers and drawing palettes, alongside the architectural patterns required to keep your application scalable, maintainable, and bug-free.

---

#### **7. Implementing Advanced Tools**

Beyond simple shapes, users often need tools to manipulate content in sophisticated ways. Here, we cover two of the most common advanced tools: a selection transformer and a free-drawing pen.

##### **7.1. The Select-and-Transform Tool (`<Transformer>`)**

The `<Transformer>` component provides intuitive, user-friendly handles for resizing, rotating, and skewing selected objects. Its implementation is one of the few areas in React Konva that requires a more imperative approach, blending declarative rendering with direct node manipulation via refs.

**The Implementation Pattern:**

1.  **State Management for Selection**: Your application state needs to track which shape(s) are currently selected. A simple `selectedId: string | null` is a good starting point.
2.  **Conditional Rendering**: The `<Transformer>` component should only be rendered when a shape is selected.
3.  **Imperative Attachment via Refs**: The `<Transformer>` needs to be explicitly told which Konva node to attach to. This is done using refs and a `useEffect` hook.
4.  **Handling the `onTransformEnd` Event**: This is the most critical and complex step. The transformer works by modifying a node's `scale` and `rotation` properties. To make this change permanent and avoid compounding transformations, you must:
    *   Read the final `scaleX`, `scaleY`, and `rotation` from the node.
    *   Apply these transformations to your shape's data in React state (e.g., `newWidth = oldWidth * scaleX`).
    *   **Imperatively reset the node's scale back to `1`**. This is essential.

**Detailed Example: A Selectable and Transformable Rectangle**

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import Konva from 'konva';

const TransformerRect = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected) {
      // If this component is selected, attach the transformer to its ref.
      trRef.current?.nodes([shapeRef.current!]);
      // Force a redraw of the layer to ensure the transformer is visible.
      trRef.current?.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    // Read the scale and position from the transformed node.
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newX = node.x();
    const newY = node.y();

    // IMPORTANT: reset scale for the next transform.
    node.scaleX(1);
    node.scaleY(1);

    // Update the state with the new dimensions and position.
    // Use Math.max to prevent the shape from having a negative or zero width.
    onChange({
      ...shapeProps,
      x: newX,
      y: newY,
      width: Math.max(5, shapeProps.width * scaleX),
      height: Math.max(5, shapeProps.height * scaleY),
    });
  };

  return (
    <>
      <Rect
        onClick={onSelect}
        onTap={onSelect} // for mobile
        ref={shapeRef}
        {...shapeProps}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          // Customize the transformer's appearance and behavior.
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size of the shape.
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};
```
This pattern can be extended to handle multi-selection by passing an array of node refs to `trRef.current.nodes([...])`.

##### **7.2. The Free-Drawing Tool (Pen/Eraser)**

Implementing a free-drawing tool requires capturing a sequence of pointer positions and rendering them as a continuous line.

**The Implementation Pattern:**

1.  **State for Lines**: Maintain an array in your state to hold all the lines drawn by the user. Each line object should contain its properties (e.g., color, stroke width) and an array of points (`[x1, y1, x2, y2, ...]`).
2.  **`isDrawing` Flag**: Use a `useRef` (`isDrawing.current`) to track whether the user is actively drawing (i.e., the mouse button is down). Using a ref prevents a re-render on every `mousemove` event, which is crucial for performance.
3.  **Event Handlers on the Stage**:
    *   `onMouseDown`: Set `isDrawing.current = true` and create a new line object in your state with the initial pointer position.
    *   `onMouseMove`: If `isDrawing.current` is true, get the new pointer position and append it to the `points` array of the *last* line object in your state.
    *   `onMouseUp`: Set `isDrawing.current = false`.

**Detailed Example: A Simple Drawing Canvas**

```typescript
import React, { useState, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';

interface LineData {
  points: number[];
  tool: 'pen' | 'eraser';
}

const DrawingCanvas = () => {
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [lines, setLines] = useState<LineData[]>([]);
  const isDrawing = useRef(false);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    setLines([...lines, { tool, points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    setLines(prevLines => {
      // Get the last line and append the new point.
      const lastLine = prevLines[prevLines.length - 1];
      const newPoints = lastLine.points.concat([point.x, point.y]);
      // Create a new lastLine object and replace it in a new array.
      return [...prevLines.slice(0, -1), { ...lastLine, points: newPoints }];
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div>
      <div>
        <button onClick={() => setTool('pen')}>Pen</button>
        <button onClick={() => setTool('eraser')}>Eraser</button>
      </div>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight - 50}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.tool === 'eraser' ? '#ffffff' : '#000000'} // Eraser is just a white line
              strokeWidth={line.tool === 'eraser' ? 20 : 5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              // The eraser tool uses a different composite operation.
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
```

---

#### **8. Architectural Patterns for Scalability**

As your application grows, the way you structure your code and manage state becomes paramount. Ad-hoc state management will lead to bugs and performance issues.

##### **8.1. State Management for Heterogeneous Shapes with Discriminated Unions**

For any application with more than one type of shape, you need a robust way to model your data. TypeScript's **discriminated unions** are the perfect tool for this. You define a common `type` property that allows TypeScript to narrow down the specific shape type within your code.

```typescript
// types/shapes.ts
interface BaseShape {
  id: string;
  x: number;
  y: number;
  rotation: number;
  // ... other common properties
}

export type Shape = BaseShape & (
  | { type: 'rectangle'; width: number; height: number; fill: string; }
  | { type: 'circle'; radius: number; fill: string; }
  | { type: 'image'; src: string; width: number; height: number; }
  // You can add more shape types here.
);
```

**Using the Discriminated Union:**

This pattern allows you to have a single `shapes: Shape[]` array in your state and render the correct component with full type safety.

```typescript
// ShapeRenderer.tsx
const renderShape = (shape: Shape) => {
  switch (shape.type) {
    case 'rectangle':
      return <Rect key={shape.id} {...shape} />;
    case 'circle':
      return <Circle key={shape.id} {...shape} />;
    case 'image':
      // The `use-image` hook is a great utility for this.
      const [image] = useImage(shape.src);
      return <Image key={shape.id} image={image} {...shape} />;
    default:
      // This ensures that if you add a new shape type, TypeScript will warn you
      // if you forget to handle it in the renderer.
      const _exhaustiveCheck: never = shape;
      return null;
  }
};
```

##### **8.2. Implementing a Robust Undo/Redo System with State History**

The most reliable way to implement undo/redo is to treat your application's state as immutable and keep a history of its snapshots. **Do not try to "reverse" operations.**

**The Pattern:**

1.  **State History**: Use a `useRef` to store the history to prevent it from causing re-renders. It will hold an array of your entire application state snapshots (`history.current: AppState[]`).
2.  **History Pointer**: A second `useRef` (`historyStep.current: number`) will track your current position within the history array.
3.  **Record Changes**: When a user performs an action that changes the state (e.g., moves a shape, adds a new one), you create a new state object. Then, you discard any "future" states from your history (if the user has previously undone actions) and push the new state onto the end of the history array.
4.  **Undo/Redo Actions**:
    *   **Undo**: Decrement `historyStep.current` and set the application state to `history.current[historyStep.current]`.
    *   **Redo**: Increment `historyStep.current` and set the state.

##### **8.3. Organizing Code: Project Structure for Large Canvas Apps**

As your app grows, a flat file structure becomes unmanageable. Organize your code by feature or domain.

```
src/
├── components/
│   ├── canvas/             # Canvas-specific components (e.g., TransformerNode, IconLabel)
│   │   └── shapes/         # Reusable shape renderers (e.g., SmartRect, SmartCircle)
│   └── ui/                   # Regular UI components (e.g., Toolbar, PropertyPanel)
├── hooks/                    # Custom React hooks (e.g., useSelection, useUndoRedo)
├── state/                    # State management logic (e.g., stores, contexts)
├── types/                    # Centralized TypeScript types (e.g., shapes.ts)
└── utils/                    # Utility functions (e.g., math helpers, history manager)
```

##### **8.4. Advanced State Management: When to Move Beyond `useState`**

For very large or complex applications, passing state and callbacks down through many layers of components (`prop drilling`) becomes cumbersome. This is when you should consider a more centralized state management solution.

*   **React Context**: Good for providing state to a deep tree of components without prop drilling. However, be aware that any update to the context will cause *all* components consuming that context to re-render. Split your context into smaller, more specific providers (e.g., `SelectionContext`, `ToolContext`) to mitigate this.
*   **Zustand / Redux Toolkit**: For applications with highly complex, interconnected state, these libraries provide more powerful tools for managing state, optimizing renders, and handling asynchronous logic. Zustand is often praised for its simplicity and minimal boilerplate, making it an excellent first step beyond `useState` and `useContext`.

Of course. Here is the final part of the guide, Part 4, written in detail to cover performance optimization, deployment strategies, and specific Tauri integration patterns.

***

### Part 4: Performance, Optimization, & Deployment

Building a feature-rich canvas application is only half the battle. Ensuring it runs smoothly, especially with large numbers of objects or on less powerful hardware, is what distinguishes a professional product from a prototype. This section covers the critical techniques for optimizing performance and leveraging the native capabilities of Tauri to create a truly polished desktop application.

---

#### **9. Performance Optimization for Large Canvases**

When your canvas application scales to hundreds or thousands of interactive shapes, performance becomes the primary concern. A sluggish UI is a frustrating UI. The following techniques are essential for maintaining a high frame rate and a responsive feel.

##### **9.1. Strategic Layering: Using `<FastLayer>` for Static Content**

The layering system in Konva is its most fundamental performance feature. Each `<Layer>` is a separate `<canvas>` element. When you update a shape, only its containing layer is redrawn. However, there is still a cost associated with managing many layers.

**Best Practices:**

1.  **Separate Static from Dynamic**: Place content that rarely or never changes (like a background grid, a static watermark, or a non-interactive map image) on its own dedicated layer. Place highly dynamic content (like moving shapes, cursors, or selection boxes) on a different layer.
2.  **Use `<FastLayer>` for Non-Interactive Content**: For layers that contain purely decorative, non-interactive elements, use the `<FastLayer>` component instead of `<Layer>`. `FastLayer` skips the complex hit graph generation used for event detection, which can make it render up to **twice as fast**. It is the perfect choice for a background layer.

    ```typescript
    import { Stage, FastLayer, Layer, Rect, Grid } from 'react-konva';
    
    const OptimizedScene = () => (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        {/* This layer is for static, non-interactive background elements. It will render very quickly. */}
        <FastLayer>
          {/* A custom grid component or a large background image would go here. */}
        </FastLayer>
    
        {/* This layer is for the main, interactive content. */}
        <Layer>
          {/* Draggable shapes, text, etc. */}
        </Layer>
    
        {/* A top layer for UI elements that must always be on top, like tool cursors or selection boxes. */}
        <Layer>
          {/* Selection transformer, drawing tool previews, etc. */}
        </Layer>
      </Stage>
    );
    ```
3.  **Limit Layer Count**: While layers are good, having too many (e.g., > 10) can create overhead from managing numerous canvas elements. A common recommendation is to keep the number of layers between 3 and 5 for optimal balance. Use `<Group>`s within a layer to organize content before reaching for a new `<Layer>`.

##### **9.2. Shape Caching with `.cache()` for Complex Graphics**

Caching is a powerful technique for dramatically speeding up the rendering of complex objects. When you cache a node (which can be a single shape or a large group), Konva pre-renders it to an off-screen bitmap image. On subsequent redraws, Konva simply draws this single image to the canvas instead of re-executing all the drawing commands for the node and its children.

**When to Cache:**
*   Groups with many nested children.
*   Shapes with complex styles like shadows, strokes with dashes, or gradients.
*   Any node that has filters applied (e.g., Blur, Noise). Caching is **required** for filters to work.
*   Shapes that are visually complex but do not change on every frame.

**How to Implement Caching:**

```typescript
import React, { useRef, useEffect } from 'react';
import { Group, Star } from 'react-konva';
import Konva from 'konva';

const ComplexCachedGroup = () => {
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    // Cache the group after its initial render.
    if (groupRef.current) {
      // You can pass dimensions to cache() to be more precise,
      // or let Konva calculate them automatically.
      groupRef.current.cache();
    }

    // IMPORTANT: It's good practice to clear the cache when the component unmounts
    // to free up memory, although Konva handles garbage collection well.
    return () => {
      groupRef.current?.clearCache();
    };
  }, []);

  // If the content of the group ever changes (e.g., a child's color),
  // you must re-cache it:
  // groupRef.current.clearCache();
  // groupRef.current.cache();

  return (
    <Group ref={groupRef} x={150} y={150}>
      {/* Imagine dozens or hundreds of shapes here */}
      <Star numPoints={5} innerRadius={20} outerRadius={40} fill="yellow" stroke="black" strokeWidth={4} shadowBlur={10} />
      <Star x={50} y={50} numPoints={6} innerRadius={25} outerRadius={50} fill="red" stroke="black" strokeWidth={4} />
    </Group>
  );
};
```

##### **9.3. Virtualization: Off-Screen Culling for Massive Datasets**

This is the most impactful optimization for applications that handle vast, zoomable, and pannable canvases with thousands of objects (e.g., diagramming tools, map renderers, level editors). The core idea is simple: **don't waste time rendering things the user can't see.**

**The Implementation Pattern:**

1.  **Track the Viewport**: Your application state needs to know the current camera position (`camera.x`, `camera.y`) and zoom level.
2.  **Calculate Visibility**: In your component's render logic, before you map over your full array of shapes, filter it down to only the shapes whose bounding boxes intersect with the current visible area of the canvas.
3.  **Render the Visible Set**: Use the filtered array for your `.map()` call.
4.  **Memoize the Calculation**: This filtering logic can be computationally intensive itself. Wrap it in a `useMemo` hook so that it only re-runs when the shapes, camera position, or zoom level change.

**Detailed Example:**

```typescript
import React, { useMemo } from 'react';
// Assuming you have state for camera, viewport dimensions, and all shapes.

const VirtualizedCanvas = ({ allShapes, camera, viewportWidth, viewportHeight }) => {
  const visibleShapes = useMemo(() => {
    const buffer = 100; // An extra buffer to prevent shapes from "popping in" at the edges.
    const viewportLeft = camera.x;
    const viewportTop = camera.y;
    const viewportRight = camera.x + viewportWidth;
    const viewportBottom = camera.y + viewportHeight;

    return allShapes.filter(shape => {
      // Basic Axis-Aligned Bounding Box (AABB) intersection test.
      const shapeRight = shape.x + shape.width;
      const shapeBottom = shape.y + shape.height;

      return (
        shape.x < viewportRight + buffer &&
        shapeRight > viewportLeft - buffer &&
        shape.y < viewportBottom + buffer &&
        shapeBottom > viewportTop - buffer
      );
    });
  }, [allShapes, camera, viewportWidth, viewportHeight]);

  console.log(`Rendering ${visibleShapes.length} out of ${allShapes.length} total shapes.`);

  return (
    <Layer>
      {visibleShapes.map(shape => (
        <Rect key={shape.id} {...shape} />
      ))}
    </Layer>
  );
};
```

##### **9.4. Granular Optimizations**

*   **`listening={false}`**: For any shape or group that is purely decorative and does not need to respond to mouse or touch events, set this prop. This excludes it from the hit graph, saving memory and speeding up event detection for other shapes.
*   **`perfectDrawEnabled={false}`**: Konva uses a feature called `perfectDraw` to ensure that strokes on shapes render perfectly without artifacts, especially when semi-transparent fills are used. This feature uses an extra off-screen canvas, which consumes memory. For shapes where perfect stroke rendering is not critical, disabling this can provide a performance boost.

---

#### **10. Tauri Integration: Bridging Web and Desktop**

Leveraging Tauri's APIs transforms your web application into a true desktop citizen.

##### **10.1. Creating a Native File Export Feature**

Give your users a professional export experience by using Tauri's native file save dialog instead of a simple browser download link.

**The Process Flow:**
1.  Use Konva's `toDataURL()` method to get a base64-encoded image of the stage.
2.  Use the `fetch` API to convert this data URL into a binary format (`ArrayBuffer`).
3.  Call Tauri's `save` dialog API to let the user choose a file name and location.
4.  If the user confirms, use Tauri's `writeBinaryFile` API to save the data to the chosen path.

**Detailed Example:**

```typescript
import { save } from '@tauri-apps/api/dialog';
import { writeBinaryFile } from '@tauri-apps/api/fs';
import Konva from 'konva';

const exportCanvas = async (stageRef: React.RefObject<Konva.Stage>) => {
  const stage = stageRef.current;
  if (!stage) return;

  try {
    // 1. Get the data URL. Use a high pixelRatio for better quality.
    const dataURL = stage.toDataURL({ mimeType: 'image/png', pixelRatio: 2 });

    // 3. Open the native save dialog.
    const filePath = await save({
      title: 'Save Canvas as PNG',
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    });

    if (filePath) {
      // 2. Convert data URL to binary data (Uint8Array).
      // This is a common pattern for handling base64 data.
      const response = await fetch(dataURL);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const data = new Uint8Array(buffer);

      // 4. Write the file using Tauri's native API.
      await writeBinaryFile(filePath, data);
      console.log(`Canvas successfully saved to: ${filePath}`);
    }
  } catch (err) {
    console.error('Failed to export canvas:', err);
  }
};
```

##### **10.2. Persistent State with the Tauri Store Plugin**

To make your application feel like a native tool, it should remember the user's work between sessions. The `tauri-plugin-store` is perfect for this.

**The Implementation Pattern:**

1.  **Setup**: Follow the plugin's installation instructions to add it to your project.
2.  **Initialize the Store**: Create a store instance, which corresponds to a file on the user's disk.
3.  **Load State on Mount**: In a `useEffect` hook with an empty dependency array, attempt to load the saved state from the store. If it exists, populate your application's state with it.
4.  **Save State on Change**: In another `useEffect` hook that depends on your main application state, save the new state to the store. **Crucially, debounce this save operation.** Writing to the disk on every single state change (e.g., during a drag) is a major performance killer.

**Detailed Example:**

```typescript
import { Store } from 'tauri-plugin-store-api';
import { useState, useEffect } from 'react';

// Initialize the store. This will create a '.app-state.dat' file in your app's data directory.
const store = new Store('.app-state.dat');

const usePersistentState = (initialState) => {
  const [appState, setAppState] = useState(initialState);

  // Load state from disk on initial component mount.
  useEffect(() => {
    store.get('canvasAppState').then(savedState => {
      if (savedState !== null) {
        setAppState(savedState);
      }
    });
  }, []);

  // Save state to disk whenever it changes.
  useEffect(() => {
    // Debounce the save operation to prevent excessive disk writes.
    const timer = setTimeout(() => {
      store.set('canvasAppState', appState).then(() => store.save());
    }, 500); // Save 500ms after the last change.

    return () => {
      clearTimeout(timer); // Clean up the timer on unmount or if state changes again.
    };
  }, [appState]);

  return [appState, setAppState];
};

// Usage in your main component:
// const [appState, setAppState] = usePersistentState({ shapes: [], camera: ... });
```

---

### **11. Conclusion**

This guide has journeyed from the foundational setup of a React Konva project in Tauri to the advanced architectural and performance strategies required for building complex, professional-grade applications. By mastering the core principles of event handling, state management, and component architecture, and by applying targeted performance optimizations and deep Tauri integration, you are now equipped to create sophisticated, feature-rich, and highly responsive desktop experiences.

The key takeaways are to always think declaratively, manage state deliberately, optimize proactively, and leverage the native capabilities of your deployment environment. With these principles, you can build truly powerful graphical tools.