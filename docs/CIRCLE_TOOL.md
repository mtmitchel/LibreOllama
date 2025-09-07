# Circle Tool — Comprehensive Guide

Last updated: 2025-09-02

This document describes the Circle Tool end-to-end: how to create and edit circles, how resizing works, how the DOM editor is aligned with the Konva scene, and which parts of the code implement this behavior. It reflects the current state of the codebase (CanvasRendererV2 with direct Konva, store-first architecture).

--------------------------------------------------------------------------------

## TL;DR

- Circle elements render as a center-origin Konva.Group containing:
  - A Circle/Ellipse shape at (0,0) (name: `shape`)
  - A Text node clipped to an inner content area
  - A Rect hit-area (name: `hit-area`) centered on the group
- For perfect circles, text uses the inscribed square for a prominent, readable layout.
- Text is left-aligned with a small left indent.
- Double-click to edit in a DOM `<textarea>` that is strictly aligned to the inscribed square, using content-box sizing and a minimum one-line height (no caret jump).
- Resize uses Transformer with proportion lock and BR-only anchor for circles; geometry is normalized on commit.
- All circle components (shape, text, hit-area) stay aligned together through create, edit, move, resize, and commit.

--------------------------------------------------------------------------------

## Data model (store)

A circle element in the unified canvas store typically contains:

```ts
interface CircleElement {
  id: string;
  type: 'circle';
  // Center position (world units)
  x: number;
  y: number;
  // Geometry
  radius?: number;      // for perfect circles
  radiusX?: number;     // for ellipses
  radiusY?: number;     // for ellipses
  width?: number;       // convenience (≈ 2 * radiusX)
  height?: number;      // convenience (≈ 2 * radiusY)

  // Styling
  fill?: string;        // shape fill
  stroke?: string;      // outline color
  strokeWidth?: number;

  // Text
  text?: string;
  textColor?: string;   // default fallback #111827
  fontSize?: number;    // default ~14
  fontFamily?: string;  // default 'Inter, system-ui, sans-serif'
  lineHeight?: number;  // default 1.2
  padding?: number;     // inner padding; also used for editor placement

  // Editing flags (transient)
  newlyCreated?: boolean;
  isEditing?: boolean;
}
```

Notes
- x,y represent the group center (not the top-left corner). Width/height are derived from radii and are used by selection and spatial index.
- Either `radius` (perfect circle) or `radiusX/radiusY` (ellipse) may be present; the renderer handles both.

--------------------------------------------------------------------------------

## Rendering (Konva)

Implemented in: `src/features/canvas/services/CanvasRendererV2.ts`

Relevant methods
- `createCircle(el)` and `updateCircle(group, el)` — create/update the group, shape, text, and hit-area
- `syncCircleText(el, group)` — center-origin layout and text bounds inside circle/ellipse
- `openTextareaEditor(elId, node)` — DOM textarea overlay for text editing, aligned to the shape

Structure
- Group (name: `circle`) at position (x,y)
- Visual:
  - Circle (Konva.Circle) or Ellipse (Konva.Ellipse) at (0,0), name: `shape`
  - Content group with clipping; text node inside it
- Hit-area:
  - Konva.Rect, name: `hit-area`, centered on (0,0), sized to cover the full circle/ellipse bounds

### Text bounds

- Perfect circle: text area is an inscribed square (side = √2 × (radius - padding - stroke/2)). This makes the text area visually prominent and balanced.
- Ellipse: text area is the largest axis-aligned rectangle inside the ellipse using exact elliptical math. This prevents text spillover.
- The text is left-aligned with a small left indent (≈ 50% of padding) for readability.

--------------------------------------------------------------------------------

## User interactions

### Create
- From the toolbar, select Shapes → Circle (id: `draw-circle`).
- Click on the canvas to place a circle at the pointer location.
- The newly created circle selects and auto-opens the text editor.

### Edit text
- Double-click a circle to edit its text.
- The editor uses a DOM `<textarea>` that:
  - aligns to the inscribed square (or elliptical rectangle for ellipses),
  - uses `box-sizing: content-box`,
  - enforces a minimum 1-line height to prevent caret jumps,
  - left aligns text and maintains a small left indent,
  - matches canvas font size, family, and line-height.
- Keys:
  - Enter — commit (Shift+Enter inserts newline)
  - Escape — cancel
  - Blur/click outside — commit

### Move
- Drag the circle; all parts (shape, hit-area, text) move together since they are children of the same group.

### Resize
- Select the circle; the transformer attaches with:
  - keepRatio: true
  - rotate: off (for circles)
  - enabledAnchors: bottom-right only (BR)
- On transformend (mouse-up), the renderer converts scale → radii/width/height and resets scale to 1. The text area is recomputed from the final geometry.

### Color/visibility
- Text color falls back to `#111827` for visibility if a custom `textColor` is not provided. The DOM editor also sets `webkitTextFillColor` to ensure visible text on Chromium/Edge.

--------------------------------------------------------------------------------

## Behavior details

- Center-origin: the group position is always at the geometric center. Internal children (shape, text, hit-area) are positioned relative to (0,0).
- Alignment guarantee: create → edit → commit → move → resize → reselect paths all recompute text bounds from the same geometry and keep all nodes in sync.
- Vertical growth on overflow: during editing, if text height exceeds the inscribed area, the renderer may expand `radiusY` (ellipse vertical growth) to avoid clipping. Horizontal radius (radiusX) remains fixed. On commit, final geometry is persisted.
- RAF-batched redraw: draw calls coalesce via `scheduleDraw` to maintain 60fps.

### Auto-grow while typing (perfect circles)

- The renderer computes the minimal circle radius required to contain the current text at a fixed `fontSize` using `requiredRadiusForText(...)`.
- Measurement sequence:
  - Seed: `wrap('none')`, `width = 'auto'`, set text, measure natural width.
  - Refine (few iterations): `wrap('word')`, set finite width (inscribed square side), set text, read `getSelfRect()` for content width/height.
  - Map the required content side to circle radius: `r = (side + 2*padding)/sqrt(2) + stroke/2`.
- All measurements are finite-guarded; no `Infinity`/`NaN` assignments are allowed.

--------------------------------------------------------------------------------

## Code examples

### Create a circle programmatically

```ts
import { useUnifiedCanvasStore } from '@/features/canvas/stores/unifiedCanvasStore';

const addCircle = () => {
  const store = useUnifiedCanvasStore.getState();
  const id = crypto.randomUUID();
  const radius = 65;
  store.addElement({
    id,
    type: 'circle',
    x: 400,          // center X
    y: 300,          // center Y
    radius,
    width: radius * 2,
    height: radius * 2,
    fill: '#ffffff',
    stroke: '#d1d5db',
    strokeWidth: 1,
    text: 'Hello',
    textColor: '#111827',
    fontSize: 14,
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: 16,
  });
  store.selectElement(id as any, false);
};
```

### Open the editor for an existing circle

```ts
import { useUnifiedCanvasStore } from '@/features/canvas/stores/unifiedCanvasStore';

const openCircleEditor = (id: string) => {
  const store = useUnifiedCanvasStore.getState();
  // Renderer listens to double-click, but you can also trigger editing via:
  store.setTextEditingElement?.(id as any);
  // CanvasRendererV2.openTextareaEditor aligns and mounts the textarea.
};
```

### Resize behavior (what happens under the hood)

On transform end (`transformend.renderer` in CanvasRendererV2):

- Read applied scale sx/sy
- Neutralize group scale to 1
- Compute new width/height and radii (radiusX/radiusY)
- Update hit-area to match the new bounds
- Persist `{ width, height, radiusX, radiusY, (radius) }` to the store
- Recompute text area (inscribed square for circle; elliptical rectangle for ellipse)
- Force transformer update so the frame hugs the new geometry

### Text area computation (circle)

```ts
// Pseudo-code derived from syncCircleText
const r = Math.max(1, radius - padding - strokeWidth/2);
const side = Math.SQRT2 * r;     // inscribed square side length
textNode.width(side);
textNode.height(side);
textNode.x(-side / 2 + leftIndent);
textNode.y(-measuredTextHeight / 2 + baselineOffset);
// Text is left-aligned, ellipsis/wrap depends on textFit; default wrap is 'word'
```

--------------------------------------------------------------------------------

## Troubleshooting & tips

- Text appears misaligned after resize: ensure `transformend` fires; the renderer re-normalizes the node (scale→size) and refreshes the transformer.
- Caret jumps at first character: verify the textarea uses `box-sizing: content-box` and minimum one-line height. This is the default in CanvasRendererV2.
- Text not visible while editing: the editor enforces `color` and `-webkit-text-fill-color` to the chosen or fallback color.
- Resizing feels wrong: by design, circles use keepRatio with the BR handle only and rotation disabled for consistent geometry.

--------------------------------------------------------------------------------

## Pointers in code

- Renderer: `src/features/canvas/services/CanvasRendererV2.ts`
  - `createCircle`, `updateCircle`
  - `syncCircleText` (inscribed rectangle logic and left indent)
  - `openTextareaEditor` (DOM editor alignment, content-box, min one-line)
  - `syncSelection` (transformer configuration for circles)
- Stage & Tools: `src/features/canvas/components/NonReactCanvasStage.tsx`
  - Circle creation tool (`selectedTool === 'draw-circle'`)
  - Global event listeners and bridge to renderer editor

--------------------------------------------------------------------------------

## UX rationale

- Inscribed square in perfect circles keeps text legible and visually centered without odd line wrapping at the edges.
- Left alignment with a small indent reads better for short and long notes.
- Content-box textarea with one-line minimum eliminates caret "jump" and allows precise vertical growth.
- Center-origin grouping keeps all pieces in sync during drag and resize and simplifies math for consistent alignment.
