FigJam‑Style Whiteboard App Architecture (Tauri + React + Konva)
Overview and Goals

We aim to build a desktop whiteboard app that mimics Figma’s FigJam in UX and feature set. FigJam is essentially a digital collaborative whiteboard
help.figma.com
, with tools for freeform drawing, diagramming, and idea organization. Our app will recreate those features for a single-user desktop context (no real-time collaboration or multi-user sync). Using Tauri (Rust) for the backend and React 19+ for the frontend, with vanilla Konva for canvas rendering, we can achieve a modern, lightweight app. Tauri lets us leverage Rust for filesystem access and performance, while using the system’s webview for UI – resulting in a small binary (~<20 MB) and low resource usage
highflux.io
. React will manage UI state and toolbars, and Konva gives low-level control over an HTML5 canvas for snappy, custom graphics. The goal is an ultra-performant FigJam clone: instant feedback to user actions, minimal input latency, and smooth handling of rich graphics even on older hardware.

Key features to implement (mirroring FigJam) include: placing text boxes, sticky notes, shapes (rectangles, circles, etc.), connectors (arrows/lines between elements), freehand drawing (marker/highlighter tools), tables, image embedding, and even “mind map” node diagrams. We’ll support selecting, dragging, resizing, rotating, and editing all these element types with intuitive mouse/keyboard interactions matching FigJam’s behavior
help.figma.com
help.figma.com
. In FigJam’s own terms, the whiteboard allows you to “collect inspiration: drop links and images, annotate with stickies; diagram with shapes and connectors; draw it out with the pen tool”
figma.com
 – our app will provide all these capabilities in a desktop setting. The UI will also include familiar toolbars and cues (e.g. a toolbar to pick tools like pointer, shape, sticky, connector, pen; on-canvas selection boxes and rotation handles; shortcuts like T for text, S for sticky, L for line, M for marker, etc. matching FigJam
help.figma.com
help.figma.com
).

Technical stack constraints: We will use React with no <ReactKonva> wrapper – instead, we’ll work with Konva’s canvas API directly. This gives fine-grained imperative control over drawing and better performance (avoiding React reconciling hundreds of <Konva> components). All rendering of shapes will be via Konva core objects (Stage, Layer, Shape, Text, Line, etc.) manipulated through React hooks. On the backend side, Tauri/Rust handles operations that need OS access: e.g. opening a file dialog to import an image, saving the board to disk (export as JSON or PNG), etc., via Tauri’s command IPC mechanism
twilio.com
. The entire app will be packaged by Tauri as a cross-platform desktop application (Windows, macOS, Linux), with the Rust core ensuring security (e.g. limited permissions) and performance-critical tasks as needed.

Below we break down the architecture by feature and module, detailing how to implement each in a FigJam-like manner, along with code snippets and design notes for React + Konva integration and performance optimizations.

Canvas Elements and Tools (FigJam Feature Parity)

Our canvas will support a variety of element types, each corresponding to a FigJam tool or object. All elements exist on an “infinite” board (we can implement an initially large stage with panning/zooming to simulate an infinite canvas). The fundamental canvas setup uses a single Konva Stage containing several Layers. We use multiple layers to isolate updates (e.g. a dedicated layer for transient drawings or selection highlights) so that updating one part doesn’t redraw everything
konvajs.org
. Each shape or object is a Konva node on a layer. Key element types include:

Sticky Notes – Stickies are “virtual Post-its,” a core FigJam element
help.figma.com
. In our app, a sticky note can be a Konva.Group consisting of a colored rectangle (Konva.Rect) and a Konva.Text for the text content. Stickies are created via the Sticky tool or pressing S
help.figma.com
. By default, we might give them a preset size and color (users can pick colors via a small palette UI). Users can type immediately after placing a sticky to edit its text. Under the hood, on creation we instantiate a Rect with fill color and a Text centered within it. The text is editable in-place (see Text Editing below). Stickies should be draggable, resizable, and rotatable just like shapes. (Konva’s shape props make this easy – e.g. setting draggable: true on the group or rect enables drag & drop natively
konvajs.org
.) FigJam stickies also display the author’s name by default
help.figma.com
, which we can omit or make optional for a single-user app. Aside from that, they behave like small text boxes with a colored background.

Text Boxes – The text tool allows adding text on the canvas for annotations or labels. In FigJam, a single click with the Text tool creates a textbox that grows horizontally (“point text”), and dragging to create a text area produces a fixed-width box that wraps text (“area text”)
help.figma.com
help.figma.com
. We will support both modes: if the user simply clicks, we create a Konva.Text with no explicit width (it will expand as one line until a line break is entered); if the user click-drags a box, we fix that width and allow multiline wrapping within it. The Konva.Text shape can display the text, but editing it requires special handling – canvas text is not directly editable. Konva’s docs advise using an HTML <textarea> overlay for text editing
konvajs.org
. We’ll implement a solution where on double-click (or Enter when selected) of a text element, we create a hidden textarea over the canvas at the text’s position to capture input. While editing, we hide the Konva.Text and show the textarea (styled with the same font, size, color for consistency). When the user finishes (e.g. presses Enter or defocuses), we set the Konva.Text’s text property to the textarea value, destroy the textarea, and show the Konva.Text again
konvajs.org
konvajs.org
. This approach yields a seamless in-place editing experience identical to FigJam’s. We also attach a Konva.Transformer with text elements to allow resizing the text box horizontally – this lets users toggle between one line and wrapped text. For example, we enable transformer anchors only on middle-left and middle-right of the text shape (so it only resizes width)
konvajs.org
. On transform, we update the text’s width and reset scale to 1 (Konva.Transformer by default uses scaling)
konvajs.org
. This matches FigJam’s behavior where you can drag the sides of a text box to set a wrap width. The text box should support basic rich text styles (bold, bullet lists, etc.); fully implementing rich text within a single Konva.Text is non-trivial (Konva.Text supports single-style only). However, FigJam text can have mixed styles. A simplification is to provide a small text formatting toolbar (bold, italic, list) that affects the entire textbox or selection. A more advanced approach could use multiple Konva.Text nodes or render HTML to canvas for truly mixed styles, but that’s beyond scope – instead, we can allow uniform styling per text box (with global font family/size and maybe bold/italic toggles). The user can create separate text boxes for differently styled text segments if needed. In summary, text boxes give in-place editable text with easy resizing, implemented via Konva.Text plus an HTML input hack for editing.

Shapes (Rectangles, Circles, etc.) – FigJam provides basic shapes (rectangle, oval, triangle, etc.) for diagramming
help.figma.com
. We will implement a set of shape tools (e.g. Rectangle, Circle, maybe Diamond, Arrow shape etc.) accessible via a Shapes menu. Konva supports primitive shapes like Konva.Rect, Konva.Circle, Konva.Line (for straight lines or arrows) and more. For a rectangle or ellipse, the user can click-drag to create it at a desired size (or click to drop a default size, like FigJam does
help.figma.com
). The shape can be filled or outlined: we’ll allow setting fill color and stroke (border) style via a properties bar (just as FigJam offers dashed or solid outlines, no fill etc.
help.figma.com
). Konva shapes have properties for fill, stroke, strokeWidth, dash pattern, etc., which we can expose in the UI. Each shape is draggable and transformable. We attach the Konva.Transformer to shape nodes when selected, which gives corner handles for resizing and a rotate handle. Konva’s transformer will handle maintaining aspect ratio if user holds Shift, etc., similar to FigJam. We just have to ensure to update the shape’s width/height on transform events (Konva by default scales shapes instead of changing width/height directly). For example, we can listen to the transform event and set node.width(node.width() * node.scaleX()); node.scaleX(1); (and similarly for height) to apply the resize
konvajs.org
. Shapes can also contain text labels – e.g. a rectangle with text inside is often used for flow charts. We can handle this by grouping a Konva.Rect with a Konva.Text (similar to how we do sticky notes) if the user wants text on a shape. One approach is to let the user double-click a shape to add text to it, effectively converting it into a group containing the shape and a centered text (or simply overlaying a text box on top). For simplicity, we might treat them as separate objects (the user can just create a text element and place it over a shape, or group them manually).

Connectors (Arrows/Lines) – Connectors are lines drawn between objects to show relationships (useful for flowcharts, mind maps, etc.). FigJam’s connector tool allows drawing a line between shapes or stickies, with automatic snapping to the object edges and optional elbow (right-angle) style
help.figma.com
. We will provide a Connector tool (perhaps shortcut L for straight line, Shift+L for elbow, matching FigJam
help.figma.com
). Using this tool, the user can drag from one shape to another to create a connection. We represent a connector as a Konva.Arrow shape (which is basically a line with an arrowhead). When the user starts dragging on a shape, we create an Arrow and update its end point with the cursor until released on another shape. We implement snapping so that if the end is near an object, it will attach to that object’s perimeter. Konva doesn’t have built-in attachment logic, so we handle it manually: for each connector, store references to the source and target object (their IDs). When those objects move, we update the arrow’s points. Specifically, on any shape’s dragmove event, we can update all connected arrow lines by setting their points array to [x1, y1, x2, y2] (e.g. line from center of obj1 to center of obj2)
konvajs.org
konvajs.org
. This ensures connectors follow the shapes in real time. (In code, we might maintain an adjacency list of object-to-connectors for efficiency.) To attach to the shape edge rather than center, we could calculate the intersection point on the shape’s boundary along the line, but an approximation is to offset by the shape’s radius/half-size as in Konva’s demo. For example, the Konva “Connected Objects” demo computes arrow endpoints slightly outside each circle’s center based on angle
konvajs.org
. We can use a similar technique or a simpler approach (like always end the line at the center of a shape for now). We support line styles: straight vs elbow. An elbow connector could be composed of two lines (or a polyline) – for simplicity, we might implement elbow by creating a connector with two segments (e.g. an L-shape polyline) if selected. We’ll also allow toggling arrowheads on either end (Konva.Arrow can have arrow at start or end). In FigJam, connectors can be directed or undirected; we provide a property to turn the arrow pointer on/off at each end. The connector lines can be styled dashed or solid as well. These options can appear in a small toolbar when a connector is selected (just as FigJam shows line style, end arrow type, color, etc.
help.figma.com
). In summary, connector creation involves drawing a new Arrow line and dynamically updating it while dragging, then permanently linking it to the two attached objects so that moving them triggers an update of the line’s coordinates
konvajs.org
konvajs.org
.

Freehand Drawing (Pen/Marker/Highlighter) – A crucial FigJam feature is the ability to scribble on the board with different drawing tools
help.figma.com
. We will implement a draw tool with modes for pen, marker, highlighter (and possibly eraser). The pen would be a normal opaque stroke, the highlighter might use semi-transparency or a specific blend mode (FigJam’s highlighter is usually semi-transparent), and an eraser can be implemented by drawing in “erase” mode that removes strokes. There are two main approaches to freehand drawing with Konva: vector drawing (create a new Konva.Line and add points as you draw) or bitmap drawing (draw directly on a canvas context)
konvajs.org
konvajs.org
. For performance and fidelity, we will use the manual canvas drawing approach. This involves having an off-screen <canvas> where we perform raw 2D drawing with the context, and then show that on our Konva stage as an Image. Konva allows using an HTMLCanvasElement as the source for a Konva.Image shape, effectively reflecting anything drawn on that canvas
konvajs.org
konvajs.org
. We will create an off-screen canvas of the same size as the board (or viewport) and add a Konva.Image that displays it on a drawing layer. When the user uses the pen tool, we listen for pointer down/move events on the stage: on down, begin a new path; on move, draw a line segment to the new pointer position on the off-screen canvas context
konvajs.org
konvajs.org
. We call layer.batchDraw() to update the Konva.Image quickly as we draw
konvajs.org
. This way, drawing is very responsive and we bypass generating potentially thousands of Konva.Line objects. For the marker vs highlighter: we can simply change strokeStyle and globalAlpha (or globalCompositeOperation) on the context. For example, a highlighter might use a semi-transparent stroke; an eraser can be implemented by setting context.globalCompositeOperation = 'destination-out' (as shown in Konva’s example) to punch through existing drawings
konvajs.org
konvajs.org
. We’ll provide color and brush size pickers for the pen tools. All drawings on the canvas can be kept in the off-screen bitmap (we could also maintain a vector representation for undo or for exporting as SVG, but a simpler route is to treat it like a raster layer). If vector lines are needed (for easier editing), we could opt to use Konva.Line nodes for each stroke instead (Konva’s “Free Drawing” simple demo uses a new Line for each stroke
konvajs.org
konvajs.org
). But the manual method with a single canvas is likely more performant for dense scribbles and allows smooth erasing
konvajs.org
. We can even combine approaches: basic pen could be vector (to allow selecting and moving a stroke after drawing), whereas highlighter and eraser operate on the bitmap layer. However, for consistency, we might keep all freehand drawings on the bitmap layer and later implement a selection for strokes if needed via vector data. The choice prioritizes performance: direct canvas drawing means minimal React overhead during drawing (no re-renders) and Konva can handle redrawing that single image quickly
konvajs.org
. This matches the FigJam experience (fluid ink strokes).

Tables – FigJam recently added tables as a way to organize information in rows and columns
help.figma.com
. We will include a Table tool to create simple tables. In FigJam, you click the table icon and drag out a grid size (e.g. 3x4) to create a table
help.figma.com
. We can implement that UX: when the table tool is active, dragging on the board draws a temporary grid highlight (e.g. using HTML overlay or Konva rectangles) and on release, we create the table of that size. A table can be represented as a group of many small elements, but to keep things efficient, we might treat the entire table as a higher-level object with its own data structure. One approach: maintain an internal 2D array of cell data (text and styling), and render the table as an HTML <table> over the canvas (for editing) or as Konva shapes for static display. However, rendering a potentially large table with Konva.Rect for each cell and Konva.Text for each cell text is feasible for moderate sizes. Suppose we create a Konva.Group for the table. Within it, we create Konva.Rect for each cell’s background and Konva.Text for each cell’s text. This is fine for, say, <50 cells. If tables can be larger, we might need to optimize (maybe only render visible cells, etc., but typical use might be small tables for sticky-note style usage). We will support basic table editing: the user can select cells (perhaps by clicking, with Shift or drag to select multiple cells similar to spreadsheets) and use a toolbar to style them (background color, text formatting)
help.figma.com
. Adding or removing rows/columns: we’ll mimic FigJam’s UI where hovering near the table edges shows a “+” to add a row or column
help.figma.com
help.figma.com
. Implementation: when table is selected or on hover, draw small Konva.Rect or HTML button at the edges which on click call a function to expand the array and re-render the table. We will handle resizing the table by simply allowing the whole group to be scaled via transformer or by dragging the table’s border (like resizing any object)
help.figma.com
. Inside, the cells could distribute space automatically or maintain their set width/height. (A simpler route: cells have uniform size that scales, but a more exact approach is adjusting one dimension when user drags a particular row/column border – this could be a future enhancement). For cell editing, we’ll use a similar strategy as text editing: on double-click a cell, open a small textarea over that cell to input text, then update the Konva.Text. We can support basic formatting: e.g. bold or strikethrough text (which could be applied by toggling fontStyle or using separate Konva.Text for styled segments, though Konva doesn’t support rich text natively). Possibly we restrict to plain text or simple markdown-like syntax. Nonetheless, at least multi-line text in cells should be supported. FigJam tables allow different text styles and even inside-cell stickies or stamps
help.figma.com
, but we can simplify to text only. We will allow aligning text left/center/right as well
help.figma.com
. Each cell’s content is just a text node we can style collectively by applying styles to the text shape. The table grouping helps treat the entire table as one object for moving, layering, or deleting. This grouping also makes selection easier (clicking any cell can set selection to the table as a whole, and maybe a second click focuses the cell). We should also implement navigation like Tab / Enter to move between cells
help.figma.com
. This can be handled when editing a cell: intercept Tab to commit current cell and move focus to next cell (we can track current cell indices). In summary, tables are a composite feature combining many small text boxes; we manage them with a specialized module for convenience.

Mind Map Nodes – FigJam supports “Mind Maps,” which are essentially hierarchical node-link diagrams
help.figma.com
. In our app, we can treat a mind map as a special group of shapes and connectors arranged as a tree. The simplest approach: provide a Mind Map tool that on click creates a root node (could be a shape like a circle or rounded rectangle with text). That node has UI controls (little plus buttons) to add child nodes
help.figma.com
. Each child is another node (same element type) connected to the root by a connector line. Children can in turn have their own children, etc. Essentially, it’s just a structured way of creating shapes + connectors, with some auto-formatting. We might implement mind maps by maintaining a tree data structure (each node knows its children). When a new child is added, we position it automatically (e.g. to the right of the parent for a horizontal mind map, or below for a vertical layout). We can space siblings evenly. The connectors between nodes can be regular connector lines, or we may style them differently (maybe curved lines). If the user drags a node, we either allow freeform positioning (and just update connectors) or restrict it to preserve the hierarchy layout. FigJam likely auto-layouts the mind map initially, but lets you drag nodes around while keeping them attached
help.figma.com
. We will allow dragging a node; when moved, its children move along (treat the whole subtree as a group when dragging the parent). This can be done by grouping the parent and all descendants in a Konva.Group temporarily while dragging, or simply updating child positions relative to parent movement. For simplicity, we might not implement collapse/expand functionality (FigJam does not yet have collapse, as noted in forum requests). But we will include keyboard shortcuts like Cmd + Enter to add a child node and Cmd + Shift + Enter for a sibling, mirroring FigJam
help.figma.com
. Under the hood, a mind map node is just like any shape with text (similar to a sticky or a small rectangle) – we might use a rounded rectangle for a node. We reuse the text editing mechanism for node labels. The connectors between parent and child are just Konva.Arrow lines as described above (or possibly elbow lines for mind maps). We ensure when a node or its parent moves, the connecting line updates (same connector logic as before). FigJam also allows attaching existing objects into a mind map by dragging them onto a node
help.figma.com
; we could support that if, say, a user drags a sticky onto a mind map node, we remove the sticky from standalone layer and attach it as a child node. But initially, we can stick to creating nodes via the mind map tool. The Mind Map is essentially a higher-level combination of features (shapes + connectors + a bit of auto-layout). We can keep an internal representation to facilitate export (e.g. export the structure as an indented list or something). For the UI, when a mind map node is selected, we might show a context bar that has the “+” buttons in four directions (FigJam’s mind map plus appears on left/right to add sibling or child)
help.figma.com
. We will place small plus icons around the node (these can be HTML absolutely positioned or Konva icons in a layer) that the user can click to add a node in that direction. This spawns a new node, adds a connector, and focuses the text edit on the new node immediately (just like FigJam does). Styling: we can allow different colors for nodes or connector lines via the toolbar
help.figma.com
, though FigJam by default uses uniform styling for mindmap for simplicity. In sum, mind maps will be implemented as a special case of grouped shapes and connectors with some helper functions to build the hierarchy. This feature ties multiple modules together (dragging, connectors, text editing), demonstrating the flexibility of our core canvas.

Images and Media – The user should be able to insert images (e.g. to annotate or brainstorm over screenshots, etc.). Using Tauri, we can open a native file dialog for image files. Once an image file is chosen, we load it into the frontend (either by reading it via Rust and passing as base64, or more simply, using the tauri::api::dialog::FileDialog to get a path and letting the webview load it). Since Tauri’s security model might restrict direct file URIs, the safer path is to have a Rust command read the file bytes and encode them, then create a JavaScript Image object from that. Once loaded, we create a Konva.Image node with that image. Konva.Image needs a JS Image or Canvas element as its source; we can create a new Image(), set src to a base64 data URI from Rust, and on load event add it to a layer. The image element on the board should have resize handles (so we attach a Transformer to images as well). We also allow rotation (Transformer will give a rotate handle by default). Users can drag images to reposition. For removal, the user can press Delete when an image is selected (same for any object), or we might add a small “X” button in a corner of the selection bounding box (some apps do that). But Delete key and an edit menu entry suffice. Since images can potentially be large, we should consider performance: perhaps automatically downscale very large images when importing to not blow up memory. Also, Konva allows image caching and filtering if needed (we likely won’t use filters now, but could allow adjusting brightness, etc., in the future). Another media type might be supported in FigJam (like GIFs or stickers), but initially we focus on static images. Video or other media could theoretically be placed using Konva.Image (with a <video> element as source), but not necessary for our scope. The image tool is mostly straightforward – after import, it behaves like a rectangle that has an image fill. (Alternatively, we could use CSS to overlay images, but integrating via Konva gives us a unified canvas approach.)

Sections and Frames (optional): FigJam has a concept of “sections” which are like containers with a header that you can use to group content visually
help.figma.com
. This is more of an organizational aid. We may skip this in our first version (it doesn’t fundamentally change canvas implementation; if needed, a Section could be a semi-transparent rectangle label that can contain other objects, essentially another grouping mechanism). Similarly, FigJam files can have multiple pages; our app can simply allow multiple boards as separate files rather than a page system.

With the above elements, we cover essentially all the major FigJam tools
figma.com
figma.com
. Each element type is managed by React state (for business logic) and represented on the Konva canvas for interactivity. Next, we discuss how user interaction (selection, editing, grouping, etc.) is handled in a consistent way across these elements.

User Interaction and Editing Flows

A core requirement is that users can select, move, resize, rotate, and edit any element on the canvas with intuitive interactions, matching FigJam’s on-canvas patterns
help.figma.com
help.figma.com
. We leverage Konva’s capabilities and manage coordination with React state for these interactions:

Selection & Transform Handles: We maintain a single Konva.Transformer that is re-used to show selection for any selected nodes. When the user clicks an object, we set the Transformer’s nodes to that object (or multiple objects) and make it visible. The Transformer automatically draws the bounding box with resize handles around the target node(s)
konvajs.org
konvajs.org
. We configure the transformer’s allowed handles depending on the object type: for images and shapes, all corners and rotate handle are enabled; for text boxes, perhaps only side handles (as discussed); for connectors (lines), we might not use transformer at all (instead, clicking a line could show line-specific edit UI). The user can drag the handles to resize/scale or rotate, and Konva will update the node(s) accordingly. We listen to the transformer’s transformend events to, for example, finalize shape size changes (applying the new width/height as described earlier). Multi-selection is supported: Konva.Transformer can attach to multiple nodes at once. We allow multi-select by either Shift+Click on multiple objects or by dragging a marquee (lasso) selection box. For the marquee, we overlay a transparent rectangle as the user drags on empty space
konvajs.org
. On mouse down on the stage (if not on a shape), we start a selection rect at that point; on mouse move we update its size to follow the cursor (drawing it as a semi-transparent blue rectangle, for example)
konvajs.org
. When the user releases the mouse, we compute the selection: iterate through all shape nodes and use Konva’s Util.haveIntersection(rect, shape.getClientRect()) to test which objects intersect the selection area
konvajs.org
. Those objects become the selected nodes – we pass them to the Transformer (transformer.nodes([...])) to show a combined selection
konvajs.org
. This replicates FigJam’s drag-to-select multiple items. We also implement Shift/Ctrl + Click behavior: if the user holds Shift or Ctrl and clicks an object, we add it to the current selection (or remove it if it was already selected)
konvajs.org
. This logic can be done in the stage click handler: if (metaPressed) then toggle selection of e.target
konvajs.org
. By supporting both marquee and modifier-click selection, we cover standard multi-select interactions. Once multiple objects are selected, the Transformer will encompass them as a group, allowing group move/scale/rotate. (We ensure grouping constraints – e.g. rotating multiple shapes around their collective center – is handled by Transformer internally.)

Grouping and Arrangement: Users may want to permanently group several elements to move them as one (beyond just multi-selecting them each time). We can provide a Group command (e.g. Ctrl+G) that takes the currently selected nodes and creates a Konva.Group containing them. Konva makes this straightforward: we create a new Group node, add the selected shape nodes as children of that group, and add the group to the layer (removing the individuals from the root layer). The Transformer will then treat the group as a single entity. Grouping is especially useful for things like a shape with a text label – grouping them means the text moves with the shape automatically. We’ll also allow Ungroup (Ctrl+Shift+G) which simply flattens the group’s children back to the layer. Note that grouping changes the z-index stacking (grouped items are now together). We must update our internal state to reflect group membership (e.g. nested data structure or an ID reference that these are grouped). In the scope of this app, grouping is mostly for user convenience and doesn’t require special canvas support beyond Konva.Group (which is provided). Konva.Group inherits from Konva.Node and can be transformed or listened to just like shapes. It does introduce a subtlety for connectors: if shapes get grouped, connectors attached to a shape might need to now point to the group or track the shape’s new absolute position. We may decide that grouping objects that have connectors is not allowed (or simply handle it by updating connector targets to the group node). In many cases, grouping is done for layout, and connectors often connect groups as well (which conceptually means connecting to one of the group’s members). For a simpler approach, when moving a group, we could still update connectors by considering the absolute positions of the shapes inside – since Konva’s node.getClientRect() will give the global bounds of a shape even if inside a group. So our connector update logic can remain unchanged (just always compute positions in absolute coordinates).

Editing Text/Elements: As discussed, double-click triggers text edit mode for stickies and text boxes. For shapes that contain text (if we allow directly editing shape labels), similar logic applies. We unify this by: if an object has an editable text property, on double-click we create a textarea for that object’s text. We also consider keyboard shortcuts: e.g. pressing Enter when a shape is selected could also start editing its text (FigJam does this for stickies). We also incorporate FigJam’s behavior of pressing Enter on an empty sticky deletes it (maybe not needed, but could be a nice touch). For other property editing, such as changing a shape’s color or a connector’s style, we provide a contextual toolbar (just like FigJam’s floating toolbar that appears above a selection). For example, if a shape is selected, we show a small bar with color picker (fill and border), border style toggle (dashed/solid), and maybe layering controls (bring to front/back). If a text is selected, the bar would have font size, bold/italic, color. These UI elements are built in React (likely positioned in an overlay div above the canvas, using the selected node’s bounding box to position). We can get the bounding box via selectedNode.getClientRect() and then position an HTML element accordingly. This is exactly how Figma/FigJam overlay their tools on selection. This approach keeps the canvas purely for the drawing content, and we use normal HTML for tool widgets (which is easier than drawing UI in canvas). We just have to update those widgets when selection changes.

Keyboard Shortcuts: We will implement common shortcuts to streamline workflow:

Delete or Backspace: delete the selected object(s) (we remove them from the Konva layer and from our state).

Arrow Keys: nudge selected object by a few pixels (update its x/y by e.g. 1px, with Shift for larger moves).

Ctrl/Cmd + G: group selection (as above); Ctrl + Shift + G: ungroup.

Copy/Cut/Paste: possibly allow copying objects – we can serialize the object(s) to JSON and put on clipboard (or a simpler approach: store a reference in memory) and then duplicate them on paste.

Undo/Redo: as a desktop app, we should integrate undo/redo. This can be done by keeping a history stack of state changes (since our state is basically the list of all objects and their properties). We can integrate with Tauri’s menu or use Ctrl+Z / Ctrl+Y to undo/redo. Each user action (add object, move, delete, edit text, etc.) would push a new state snapshot or diff. For brevity, we won’t detail the full undo mechanism, but it’s an important part of a polished UX.

Tool selection: single letters for tools (V for pointer, T for text, S for sticky, R for rectangle, O for oval, L for line, M for marker, etc., matching FigJam defaults as much as possible).

Others: e.g. FigJam allows holding Space to temporarily switch to hand tool (pan the canvas), or holding Shift while drawing a connector to switch between straight/elbow. We can emulate these behaviors.

Canvas Panning/Zooming: FigJam’s canvas is pannable/zoomable (mouse wheel or pinch to zoom). We will implement panning by making the Konva stage draggable (Konva.Stage has a draggable property, but if we want to only pan when a specific tool or when spacebar is held, we might instead implement our own pan: on space+drag, set stage.position accordingly). Alternatively, we can have a separate invisible layer for background which on drag moves all layers (Konva doesn’t directly support moving the origin of the stage except by setting stage.x/y). Actually, Konva’s stage itself is not meant to be moved because it’s tied to the container. A known method is to put content in a big Layer and move that layer (like a camera transform). We can have a “viewport” group containing all other objects, and translate that group on pan and scale it on zoom. That is a design decision: simplest is to use stage.scale and stage.position to implement zoom & pan, which Konva does support (stage.scale({x: s, y: s}); stage.position({x: offsetX, y: offsetY}); then call stage.batchDraw). We must also set stage.draggable(true) if we want to drag-pan directly, but that may conflict with selecting objects. FigJam uses a hand tool or spacebar for panning to avoid conflict. We can mimic that: only enable stage drag when spacebar is held (we can toggle stage.draggable on key down of space and off on key up). Zoom on Ctrl + mousewheel can adjust stage.scale around the pointer. This gives an infinite canvas feel. We will also provide reset zoom and fit options for convenience.

Summing up, the interaction model is designed to match FigJam’s feel: direct manipulation of objects on canvas with immediate visual feedback, rich multi-select and grouping, and smooth editing of text and connectors. React will handle many of the UI state aspects (which object is selected, what tool is active, what properties are set in the toolbar) while Konva deals with rendering and hit detection for the shapes (e.g. we listen to Konva events for clicks on shapes to trigger selection, etc.).

React Integration and State Management

To ensure high performance, we avoid re-rendering the entire React component tree on every canvas update. We treat the Konva canvas as an imperative drawing surface that we update as needed. The React state (or a Zustand store, etc.) will keep a model of the board (list of objects with their properties) which can be saved/loaded, but we won’t bind each piece of state to a live React component via react-konva (which could cause needless reconciliations for hundreds of objects). Instead, our integration strategy is:

Use a top-level React component (e.g. <Whiteboard />) that on mount creates the Konva Stage. For example, in a useEffect, we do something like:

useEffect(() => {
  const stage = new Konva.Stage({ container: 'canvasContainer', width: initWidth, height: initHeight });
  const layer = new Konva.Layer();
  stage.add(layer);
  // store references
  stageRef.current = stage;
  layerRef.current = layer;

  // set up transformer
  transformerRef.current = new Konva.Transformer();
  layer.add(transformerRef.current);
  // global click to handle deselect
  stage.on('click', (e) => {
    if (e.target === stage) {
      transformerRef.current.nodes([]);
      setSelected([]); // update React state
    }
  });
  // ...other event setup...
}, []);


Here we create one Layer for all objects (we could also use multiple layers: e.g. one for connectors underneath shapes, one for UI stuff above, etc., to optimize redraws). We also create a Transformer and add it to the layer (but do not attach nodes yet)
konvajs.org
. We add event listeners on the stage for selection/deselection – if click on empty canvas, clear selection
konvajs.org
. If click on a shape, we select it (and possibly handle multi-select logic as shown earlier). We might keep selection in React state (selectedIds list) for use in toolbars, but we won’t necessarily re-render canvas on that (instead, we directly call transformer.nodes(selectedShapes) to update the visual selection). Essentially, we use React state for semantic state (like “which tool is active”, “properties of the selected shape”) and use Konva’s own state for the visual representation.

Rendering/Updating shapes: When a new object is added (say the user creates a sticky), we can either (a) directly create the corresponding Konva shape and add to layer, or (b) add to React state and rely on an effect to materialize it. A hybrid approach is fine: e.g. keep an array of objects in state for saving, but also create the shape immediately for responsiveness. We might do: const newSticky = { id: ..., type: 'sticky', x: 100, y: 100, text: 'Hello', ... }; setObjects([...objects, newSticky]); and also in the same event handler create a Konva.Group and children for it. This can lead to duplicate sources of truth if not careful. Alternatively, we manage a central model and have a function renderObjects(model) that creates/updates all Konva nodes to match the model. This could be called on load or after major changes. But doing this diff manually is essentially reimplementing React reconcilers. To keep things simpler but efficient: we will manually update Konva shapes on most interactions (since we have direct access to them via refs), and only rely on React state for undo/redo or export. This means, for instance, when moving a shape via drag, we handle that entirely in Konva (the shape’s position is updated by Konva internally on dragmove, and on dragend we update our state model for that object’s x,y). We do not cause a React re-render on every drag tick. This significantly reduces overhead. Only at the end of the drag do we sync the final position into our state (so that if the user saves or if we need to show coordinates in UI, it’s updated). This pattern – limit React updates for continuous interactions – keeps things smooth. Similarly for drawing with the pen: we won’t touch React state for each drawn point; we only perhaps store the final drawn stroke in state if we want, or not at all if we treat the drawing canvas as immutable bitmap.

Custom Hooks and Separation of Concerns: We can create React hooks or context providers to manage certain aspects. For example, a useTool(toolType) hook or context can provide the current active tool and handle global key events to switch tools. We might have a useSelection hook to get and set the selected object IDs, which also controls the Konva.Transformer (by calling transformer.nodes() whenever the selection changes). A hook could wrap the creation of the selection marquee: e.g. useMarqueeSelection(stageRef, layerRef, setSelected) to attach the mousedown/mousemove/mouseup events for drawing the selection rect and selecting objects
konvajs.org
konvajs.org
. By organizing these as hooks or separate modules, our main Whiteboard component can remain readable.

State Data Structure: We maintain a list (or map by id) of all elements on the board. Each element has properties: id, type (text, sticky, rect, circle, arrow, table, mindNode, image, etc.), geometric props (x, y, width, height, rotation), style props (fill, stroke, etc.), and content (like text for text-bearing types, or points for connectors, or cells for tables). This can be a single source of truth for saving/loading. We can easily serialize this to JSON (and even reuse FigJam’s file format if known, but likely just our own JSON schema). The serialization will be handled by Rust when saving to file (see below). For runtime use, we may not always need the full model populated for ephemeral elements (like the freehand drawing layer might not list every stroke in the object list unless we choose to). But having as much as possible in the model is helpful for features like undo or future real-time sync. The model can be stored in a React useState or a Zustand store for easier manipulation without causing huge re-renders (Zustand could allow fine-grained selection of state slices). Since the app could involve dozens or hundreds of elements, a state management library that avoids rendering unless necessary is ideal (the README of LibreOllama notes they use Zustand for predictable state
GitHub
). We can follow that example to handle state changes efficiently.

Project Structure: We can structure the code similar to the LibreOllama project (which also is Tauri+React with a canvas)
GitHub
. For instance:

The React app (frontend) lives in src/ with possibly a feature module like src/features/canvas containing components and hooks for the whiteboard.

The Rust backend in src-tauri/ with modules for commands (e.g. a file command, an image command, etc.)
GitHub
.

We could have a CanvasContext in React providing refs to Konva stage/layers and perhaps the model state.

Each tool (text tool, shape tool, etc.) can be implemented in its own module, exporting functions to activate the tool and handle pointer events. For example, the text tool module might expose startText(x,y) to place a text at a position and enter edit mode.

UI components like color pickers, toolbars, etc. in a components folder, separate from the canvas logic.

This separation keeps our React UI (toolbars, dialogs, menus) decoupled from the Konva canvas imperative logic, communicating via shared state and refs. It’s important that the canvas can operate independently at 60fps even if React is busy with something else. By offloading drawing to Konva and Rust, we achieve that.

Tauri Backend Integration

Using Tauri for our backend means we have a Rust process that can perform privileged operations and communicate with the front-end (the React/JS code running in WebView). Key responsibilities of the backend in this app:

File I/O and Persistence: The app should allow saving the board to a file (likely JSON or a custom file format) and loading it back. We’ll implement Tauri commands for these. For example, a Rust function #[tauri::command] fn save_board(path: &str, data: String) -> Result<(), String> that takes a file path and the board data (serialized as JSON string) and writes it to disk
twilio.com
. Similarly, a load_board(path) that reads the file and returns the data string. We might use Rust’s serde for serialization of our state data structure. On the front-end, we call these via window.__TAURI__.invoke('save_board', { path, data }) (Tauri’s JS API for invoking commands). We can trigger the native file dialog using Tauri’s dialog APIs or build a custom in-app dialog; Tauri provides open and save dialog functions which we can call from Rust or via tauri.invoke as well. We ensure that these operations run off the main thread if they are heavy (Tauri commands are asynchronous by nature, and we can perform file writes without blocking the UI). Once saved, the user can later open the file to restore the board – we parse JSON into our state and then regenerate Konva objects accordingly. Because our model includes all object properties, restoring state is straightforward.

Image Loading: As mentioned, loading an image might involve reading file bytes in Rust. We can register a command like open_image(path: String) -> Result<String, String> that returns a base64 data URL or raw bytes. Alternatively, we could use the <input type="file"> in the webview to get an image without involving Rust (since images might not require special permission). However, using Tauri’s dialog has the advantage of uniform native UI and working outside browser sandbox. We will go with Tauri’s dialog: the user triggers “Insert Image”, we call tauri::dialog::FileDialogBuilder::new().add_filter("Image", &["png","jpg"...]).pick_file(...) via a command, get the path, then either read it in Rust or pass the path back to JS and let JS create an Image. For security, Tauri requires enabling the asset-protocol or using the fs allowlist to access arbitrary files, which we can configure for image types. In any case, after loading, the image is converted to a Konva.Image on the canvas as described.

Exporting to PNG/SVG: We might allow exporting the current board as an image (PNG or SVG). Konva can help here: it has methods stage.toDataURL({ pixelRatio: 2 }) for PNG snapshots and stage.toJSON() for a JSON of the drawing. It also can export to an SVG string by custom serialization (there’s a method stage.toSVG() in Konva). If we want high-resolution exports or PDF, a server-side or Rust-side library might be needed, but Konva’s client-side export is usually enough. We can do this entirely in the front-end (e.g. get a data URL and then call a Tauri file save dialog to save it). Or we could pass the data URL to Rust to decode and write as binary. Either way, Tauri can handle writing to disk. We should note that exporting large boards to a single image might be memory heavy; an optimization is to allow exporting a selected area or individual items as needed.

Other Native Integrations: If needed, Tauri can also handle things like clipboard access (copy/paste), although modern web can do clipboard in JS for text and images. For copying complex shapes, we might implement a custom JSON copy to clipboard using Tauri’s clipboard API. Another thing is system dialogs like an “Are you sure you want to delete” or “Unsaved changes” on exit – Tauri can intercept the close event and we can prompt the user. Also, if we want an auto-update mechanism, Tauri would require some work (the HighFlux reddit thread noted the lack of easy auto-update for desktop apps
reddit.com
). That’s outside our immediate scope, but worth knowing if we plan distribution.

Security: Tauri by default is quite secure (it doesn’t expose a NodeJS environment, and we must whitelist APIs). We will whitelist only the necessary file system scope (perhaps the directory the user chooses to save files, or broad read/write if we trust user’s own files). We use commands for specific tasks rather than opening up a general file access. Also, any heavy computation (if in future we add something like image processing or large data handling) can be done in Rust for better performance. Right now, the app is mostly I/O bound and UI bound, so Rust’s main job is file management and hosting the webview. Rust could also be used to offload any complex calculations (imagine implementing alignment algorithms or large data import). In our design, most of the logic is on the front-end, which is fine given modern CPUs and the not-extremely-large data (unless a user spams thousands of objects, which Konva can handle but might slow down – if that becomes a performance problem, we might indeed need more optimizations).

Example: Saving a Board – When the user clicks “Save” or presses Ctrl+S, we call a React handler that gathers the current state (our objects list). We then do something like:

const dataStr = JSON.stringify({ objects: objectList });
await window.__TAURI__.invoke("save_board", { path: savePath, data: dataStr });


On the Rust side, save_board (marked as a command in src-tauri/src/commands/fs.rs maybe) receives the path and data string, then uses std::fs to write it. If successful, we might send a success message back (or simply resolve the promise). For loading, similarly:

const dataStr = await window.__TAURI__.invoke("load_board", { path });
const boardData = JSON.parse(dataStr);
// then update state and re-render Konva objects accordingly


Example: Calling a Rust image open – Alternatively, for images we might do:

// JS:
const result = await window.__TAURI__.invoke("open_image_dialog");
if(result?.path) {
  const imgBytesBase64 = await window.__TAURI__.invoke("read_image_file", { path: result.path });
  loadImageOnCanvas(imgBytesBase64);
}


Where open_image_dialog uses Tauri’s dialog to get path, and read_image_file returns a base64. This may be overkill, since we could just do window.__TAURI__.invoke("open_image_dialog") which itself could read and return the base64. (Or even simpler, use the new Tauri API that allows returning a path and then use the <img src="tauri://..."> protocol if configured.)

The main point is, Tauri gives us the freedom to interact with the OS for file access, which a purely web app cannot do securely. For example, FigJam in the browser can only import images via input or clipboard, but cannot save to a user-chosen location. Our desktop app can allow a more native experience (File > Save, etc.).

Finally, we ensure the app packaging via Tauri is configured properly. We’ll include any necessary Tauri plugins (perhaps none for now, unless we use plugin for auto-update or so). The release build will produce an installer or bundle for each OS. We sign the app on macOS and set app icons, etc. The resulting app will be lightweight – e.g. HighFlux’s app was <20 MB for all three platforms
highflux.io
 – and efficient in memory use (using the OS webview and Rust’s low footprint). Users can then run this app to create FigJam-like boards offline, with all data stored locally.

Performance Considerations

Performance is a top priority. We want the canvas interactions to be realtime and smooth, even with many elements. Several strategies are employed to achieve this:

Minimize Re-renders and Computation: We adhere to the rule “compute as little as possible, draw as little as possible”
konvajs.org
. This means we avoid heavy calculations in tight event loops and we avoid redrawing things that haven’t changed. For instance, when dragging an object, we do not re-compute layouts of other objects or re-render React; Konva only redraws the relevant layer. We take advantage of Konva’s internal optimization: each Layer is its own canvas that can be drawn independently
konvajs.org
. So moving one shape on layer1 doesn’t require re-drawing shapes on layer2, etc. We will logically separate layers if needed: e.g. put all static background elements (like maybe a grid or background image) on one layer that rarely updates, main shapes on another, and perhaps guidelines/feedback on a top layer. Konva can efficiently handle even thousands of objects if they are just being moved without redrawing everything.

Layer Redraw Control: By default, Konva will redraw the layer when a shape property changes or during drag. We can further optimize by using layer.batchDraw() in scenarios of rapid drawing (like our freehand pen). batchDraw() throttles the redraws internally to about ~60 FPS
konvajs.org
, preventing overwork on each mousemove event. We used this in the drawing tool implementation. We can also call layer.batchDraw() after a batch of updates to draw them all at once, rather than multiple discrete draws.

Throttling: For events like window resizing or continuous pointer moves, we throttle the handlers. For example, if we implemented live preview of connecting lines while dragging one end, we ensure the updateLine function isn’t called more often than the screen can refresh (we can use requestAnimationFrame or a throttle of ~16ms). Similarly, if we had real-time collaboration (which we don’t in this version), we’d throttle network updates. In our single-user case, throttling mainly applies to UI feedback that might be too fast. Most modern systems can handle continuous updates at 60fps, but if we encounter performance drops (e.g. dragging 100 selected objects at once), we could throttle position updates slightly (Konva’s transformer moves them together anyway, but updating our state or checking collisions might be heavy if done per pixel).

Object Caching: Konva supports caching shapes to a bitmap to speed up complex drawing
konvajs.org
. If we have shapes with many points or applied filters/shadows, caching them once can improve redraw speed. In our use, most shapes are simple (rectangles, text) so caching isn’t necessary. One place it might help is the table – a table with many cells could be cached as one bitmap when not editing, to avoid drawing dozens of small rects/texts repeatedly. We can consider calling tableGroup.cache() which will render the group to a hidden canvas and then Konva will treat it as an image until it needs to change
konvajs.org
. This can greatly improve performance for static groups or complex shapes. We must uncache or redraw when the content changes (Konva provides node.cache() and node.clearCache() methods
konvajs.org
konvajs.org
). Another usage: if the user pastes a large image, Konva draws it directly, which is fine, but if we applied a heavy filter to it (like blur), caching the filtered result avoids recalculating the filter each frame.

Reducing Event Listeners: We ensure not every shape is listening for every event if not needed. Konva has an option listening: false on shapes to omit them from hit detection
konvajs.org
. For example, if we put a large static background grid as a shape, we can set listening false so Konva doesn’t include it in event hit tests, speeding up events. Similarly, during a drag of one object, we might temporarily set other layers’ listening to false to avoid unnecessary hit checks on them. Konva’s pointer events are pretty optimized, but it’s a trick that can help if performance suffers with thousands of objects.

Drag Optimizations: When dragging multiple objects or especially when dragging connectors connected to objects, redrawing many elements can cause stutter. One Konva tip is to move the dragged item to a top layer while dragging so that Konva only needs to redraw that top layer continuously, and the rest of the scene stays static
konvajs.org
. After drop, you move it back to the main layer. We can implement this: when a dragstart occurs on a shape (or group), if multiple objects are selected, create a temporary layer above all others, move those nodes to it (or clone them), and hide them on the original layer. Then as you drag, only that layer is dirtied each frame. On dragend, move them back to the original layer and destroy the temp layer. This trick can maintain high FPS even when dragging a bunch of items at once
konvajs.org
. We should ensure connectors attached to dragged shapes also get drawn in that layer or otherwise updated – an easier way might be to include connectors in the selection group so they move together (since connectors will anyway redraw if endpoints move, but if endpoints are moving on a static layer, maybe better to bring connectors along). We need to test if it’s necessary; if performance is fine without it for moderate numbers, we might skip complexity. But it’s a known optimization.

Konva Version and Canvas: We will use the latest Konva (at least v8 or v9) which has various performance improvements. The underlying canvas is 2D, which relies on the GPU for final compositing. If the board gets extremely large (dimensions), we should be careful: a huge canvas (e.g. 10000x10000 px) can be slow to manage. We might limit the stage size or implement a concept of virtual viewport (only render objects within view). However, Konva does not virtualize rendering – all shapes on stage will be drawn whether in view or not. If we needed to scale to extremely large content, we could implement culling manually (e.g. remove or hide objects far off-screen). But for typical use (brainstorm boards that maybe span a few screens worth of content), it’s fine. We can define a maximum board size and allow panning within it. Or implement infinite scroll by moving objects relative to an origin – possibly overkill.

Older Hardware: On older machines, two main issues: limited GPU capability (canvas may render slower) and high memory usage if not careful. We mitigate this by keeping the canvas resolution reasonable. Also by not creating too many DOM elements or heavy React components (our UI is minimal aside from canvas). The memory footprint of the app is largely the WebView and any large images in memory. We could implement an image memory optimization (like only keep a low-res version until needed), but likely unnecessary for moderate usage. The Rust side is very lightweight (just idle unless doing file ops). We also avoid using heavy Node or Electron which would eat RAM – Tauri’s advantage is using the OS’s webview and Rust which is quite lean. This means our app could run smoothly even on a machine where Electron apps struggle (for example, Tauri doesn’t bundle Chromium, saving hundreds of MB of RAM).

In practice, an important measure of performance is user experience smoothness: we want dragging to feel immediate, drawing to have no lag, typing to be as if a native app. We have structured the system to deliver that: direct canvas drawing for pointer interactions, no expensive bridging on each frame, and using Rust for any blocking tasks so the UI thread remains free. We also make use of requestAnimationFrame for any custom animations or feedback loops.

To validate performance, we should test scenarios like: 1) 50 sticky notes on screen, multi-select all, drag them – should remain ~60fps; 2) draw rapidly with pen for a long stroke – should not glitch; 3) resize a large image – should resize in realtime; 4) lots of connectors between many nodes – moving a node updates connectors swiftly. If any of these are slow, apply the optimizations discussed (layer isolation, etc.). Konva is known to handle a large number of nodes (there are demos of 10k shapes at 60fps
konvajs.org
), so we have confidence the underlying library can handle our needs, as long as we use it properly.

Code Examples and Illustrations

Below are a few focused examples (in pseudo-code/actual code) demonstrating how to implement certain parts of the system:

1. Initializing Konva Stage in React (without ReactKonva):

function WhiteboardCanvas() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const transformerRef = useRef(null);

  useEffect(() => {
    // Create Konva Stage on mount
    stageRef.current = new Konva.Stage({
      container: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
    });
    layerRef.current = new Konva.Layer();
    stageRef.current.add(layerRef.current);

    // Create a Transformer and add to layer (initially with no nodes)
    transformerRef.current = new Konva.Transformer();
    layerRef.current.add(transformerRef.current);

    // Global stage events
    stageRef.current.on('mousedown', (e) => {
      if (e.target === stageRef.current) {
        // Clicked empty canvas – clear selection
        transformerRef.current.nodes([]);
        setSelectedObjects([]);  // update React state for selection list
        return;
      }
      // Marquee selection start logic (if tool is selection and clicked stage)
      if (e.target === stageRef.current && tool === 'select') {
        startMarquee(e.evt.layerX, e.evt.layerY);
        return;
      }
      // If clicked a shape:
      const clickedNode = e.target;
      if (tool === 'select') {
        if (e.evt.shiftKey || e.evt.ctrlKey) {
          // multi-select toggle
          toggleSelectObject(clickedNode);
        } else {
          selectSingleObject(clickedNode);
        }
      }
    });
    stageRef.current.on('mousemove', (e) => {
      updateMarquee(e.evt.layerX, e.evt.layerY);
    });
    stageRef.current.on('mouseup', () => {
      finishMarqueeSelection();  // selects nodes in marquee area
    });
  }, []);

  // Whenever selectedObjects state changes, update Transformer nodes
  useEffect(() => {
    const konvaNodes = selectedObjects.map(id => layerRef.current.findOne(`#${id}`));
    transformerRef.current.nodes(konvaNodes);
    layerRef.current.batchDraw();
  }, [selectedObjects]);

  return <div ref={containerRef} id="canvasContainer" style={{ width: '100%', height: '100%' }} />;
}


In the above snippet, we see how we create the stage and layer, and use Konva’s event system directly (not using any ReactKonva components)
twilio.com
. We maintain references to stage, layer, and the transformer. We handle selection logic manually: clicking on the stage clears selection, clicking on shapes selects them, with support for Shift-multi-select. We also started sketching marquee (selection rectangle) logic with startMarquee etc., which would create or show a Konva.Rect for the selection area and later compute intersections
konvajs.org
konvajs.org
. We update the Konva.Transformer’s nodes whenever the React state selectedObjects changes, so that the visual selection matches the state. We call layer.batchDraw() after updating transformer to redraw efficiently. By giving each shape a unique id (we plan to set each Konva node’s id to our object’s id for easy find), we can retrieve them via layer.findOne('#id') when needed (Konva’s selector by id).

2. Drag and Drop of Shapes with Connectors Update:

Let’s show how a shape drag is set up and how we update connectors in response. Suppose we have a Konva.Circle representing a node in a mind map, and connectors (Konva.Arrow) that connect it to other nodes. We can do:

// Assuming we have references to connectors mapping and Konva nodes by id
node.on('dragmove', () => {
  // On every move, update any attached connectors
  connectors.forEach(conn => {
    if(conn.fromId === node.id() || conn.toId === node.id()) {
      updateConnectorLine(conn);
    }
  });
});


And updateConnectorLine might be:

function updateConnectorLine(conn) {
  const line = layer.findOne(`#${conn.id}`);  // find Konva.Arrow by id
  const fromNode = layer.findOne(`#${conn.fromId}`);
  const toNode = layer.findOne(`#${conn.toId}`);
  if (!line || !fromNode || !toNode) return;
  const startPos = fromNode.position();
  const endPos = toNode.position();
  // If we want the line to anchor at the edge of a circle or rect, we can calculate offset:
  if (fromNode.className === 'Circle') {
    // example: offset by circle radius
    const radius = fromNode.radius();
    const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
    startPos.x += Math.cos(angle) * radius;
    startPos.y += Math.sin(angle) * radius;
  }
  // similar for endPos with toNode
  // (For rectangles, use half width/height and determine side, etc.)
  line.points([startPos.x, startPos.y, endPos.x, endPos.y]);
  line.getLayer().batchDraw();
}


This demonstrates manually updating a connector’s points whenever a linked object moves
konvajs.org
konvajs.org
. We retrieve objects by id and set new line coordinates. We then call batchDraw on the line’s layer to efficiently redraw just that layer. If connectors are on the same layer as shapes, that’s fine – batchDraw will redraw everything on that layer (the shape and line, which is acceptable). We could also have placed connectors on a separate layer behind shapes; in that case we’d call connectorsLayer.batchDraw(). The above uses a simple linear connection from center to center; as noted, one can refine the endpoint calculation to attach neatly to shape edges.

3. Freehand Drawing Implementation (Konva.Image with Offscreen Canvas):

// During initialization:
const drawingCanvas = document.createElement('canvas');
drawingCanvas.width = stage.width();
drawingCanvas.height = stage.height();
const ctx = drawingCanvas.getContext('2d');
ctx.lineJoin = 'round';
ctx.lineCap = 'round';
ctx.strokeStyle = currentPenColor;
ctx.lineWidth = currentPenWidth;

const imageNode = new Konva.Image({
  image: drawingCanvas,
  listening: false,  // so it doesn't block events
});
drawingLayer.add(imageNode);

// Drawing tool event:
let isDrawing = false;
let lastPos = null;

stage.on('mousedown touchstart', (e) => {
  if (currentTool !== 'draw') return;
  isDrawing = true;
  lastPos = stage.getPointerPosition();
});

stage.on('mouseup touchend', () => {
  if (currentTool !== 'draw') return;
  isDrawing = false;
});

stage.on('mousemove touchmove', (e) => {
  if (!isDrawing || currentTool !== 'draw') return;
  const pos = stage.getPointerPosition();
  if (!pos) return;
  ctx.beginPath();
  ctx.moveTo(lastPos.x, lastPos.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  lastPos = pos;
  imageNode.getLayer().batchDraw();  // redraw the layer to show new stroke:contentReference[oaicite:101]{index=101}
});


This code (influenced by the Konva free-draw demo) sets up an offscreen canvas and a Konva.Image to display it. On each mouse move while drawing, we draw a line segment on the canvas and refresh the image node on the layer
konvajs.org
konvajs.org
. We set listening: false on the image so that we don’t accidentally select it or block other events (since it covers the whole stage). This allows drawing over other objects; the drawing will appear on top of them if this drawingLayer is above others. If we want the drawing to go under objects (like a highlight beneath stickies), we could put the drawing layer below. We might even have two drawing layers (e.g. highlighter under and marker over), depending on design. The snippet as is draws on top of everything on that layer. Note also we should update ctx.strokeStyle and ctx.lineWidth if the user changes pen color or size. If an eraser mode is set, we do ctx.globalCompositeOperation = 'destination-out' to erase, and when finished, set it back to source-over. This matches the Konva manual drawing example where they toggle GCO for brush/eraser
konvajs.org
.

4. Using Tauri Commands (Rust) – Example: Save and Load

Rust side (src-tauri/src/commands.rs):

use std::fs;
#[tauri::command]
fn save_board(path: String, data: String) -> Result<(), String> {
    fs::write(&path, data).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_board(path: String) -> Result<String, String> {
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(data)
}


These simple commands write the JSON string to file and read it back. We would register these in Tauri (in tauri::Builder in main.rs). The frontend usage:

// Save function in JS/React
async function saveFile() {
  const json = JSON.stringify({objects: state.objects});
  try {
    await window.__TAURI__.invoke("save_board", { path: currentFilePath, data: json });
    alert("File saved!");
  } catch (err) {
    console.error("Save failed", err);
  }
}

// Load function in JS/React
async function loadFile(filePath) {
  try {
    const jsonData = await window.__TAURI__.invoke("load_board", { path: filePath });
    const obj = JSON.parse(jsonData);
    setState({ objects: obj.objects });
    // Reconstruct Konva nodes: 
    // iterate obj.objects and create each shape on canvas via Konva (or trigger a full re-render if we integrated differently)
    redrawCanvasFromState(obj.objects);
  } catch (err) {
    console.error("Load failed", err);
  }
}


We might integrate the file dialogs like:

async function showSaveDialog() {
  const path = await window.__TAURI__.dialog.save({ defaultPath: "board.json" });
  if (path) {
    setCurrentFilePath(path);
    saveFile();
  }
}


(using Tauri’s JS API for dialogs). The specifics may vary, but this demonstrates how straightforward it is to call Rust from JS for file operations
twilio.com
. We wrap these in UI elements (menu or buttons).

5. Project Structure Note:

Given our multi-tool, multi-feature app, a modular structure is beneficial. For example:

src/
  components/  (React UI components like Toolbars, ColorPicker, etc.)
  canvas/
    CanvasContainer.jsx (the WhiteboardCanvas component)
    hooks/
      useSelection.js, useDrag.js, useDrawTool.js, etc.
    tools/
      textTool.js, shapeTool.js, connectorTool.js, mindmapTool.js (logic for each tool)
    canvasState.js (maybe Zustand store or context for canvas model and actions)
  App.jsx (main app, sets up toolbar and CanvasContainer)


And in src-tauri/:

src-tauri/
  src/
    main.rs (Tauri setup, command registration)
    commands.rs (our save_board, load_board, etc.)


This separation ensures clarity. E.g., the textTool.js might export functions to create a text node at a given position (which creates Konva.Text, attaches events like dblclick to edit, etc.). The useDrawTool hook sets up the stage events for drawing when the pen tool is active (like the code above).

LibreOllama’s example project structure shows a similar breakdown with features and commands
GitHub
. We can take inspiration from that to keep our code organized and scalable.

Conclusion

This architecture blueprint outlines how to build a FigJam-grade whiteboard application on the desktop leveraging React 19+, Tauri (Rust), and Konva (Canvas). By carefully mirroring FigJam’s feature set and interaction design – from sticky notes and text editing to connectors, tables, and freehand drawing – we ensure a familiar and intuitive UX
figma.com
help.figma.com
. The use of Konva’s imperative API (instead of the ReactKonva abstraction) is intentional to achieve fine-tuned performance control
konvajs.org
. We coordinate state in React for high-level logic and use Konva for fast rendering and event handling at the graphics layer. Tauri enables a lightweight, secure backend for file access and packaging, without the bloat of Electron, keeping the app footprint minimal and cross-platform
highflux.io
.

In essence, we combine the strengths of each technology: Rust/Tauri for system integration and speed, React for flexible UI and state management, and Konva/Canvas for high-performance drawing. The result is a modern desktop whiteboard that feels as responsive and feature-rich as FigJam – including the ability to **“visualize your ideas” with images, **“map out processes” with shapes/connectors, and **“sketch freely” with pen tools
figma.com
 – all while running smoothly on a typical user’s machine. By following the design and optimization techniques described (layered rendering, throttled updates, minimal React overhead, etc.), developers can ensure the app provides instant, fluid interactions even as the canvas grows complex. This blueprint serves as a foundation to implement the app, with code samples and patterns that demonstrate how to adapt Konva’s imperative rendering to React’s ecosystem and how to integrate Rust backend functionality in a clean, user-focused way. With this approach, we recreate the FigJam experience as a standalone desktop program, achieving both fidelity to FigJam’s proven UX and the performance benefits of a native application
GitHub
figma.com
.

Sources:

Figma FigJam documentation and help articles for feature behavior and UX standards
help.figma.com
help.figma.com
help.figma.com
help.figma.com
.

Konva library documentation and examples for canvas drawing, text editing, and performance tips
konvajs.org
konvajs.org
konvajs.org
.

HighFlux and Twilio blogs for insights on using Tauri with React (showcasing the lightweight, cross-platform benefits and using Tauri’s command system)
highflux.io
twilio.com
.

LibreOllama project for structural guidance and confirmation that such an app (canvas with many element types, connectors, etc.) is feasible with this stack
GitHub
GitHub
.

FigJam promotional content for confirmation of feature list (e.g. tables, sticky notes, drawing tools)
figma.com
figma.com
, ensuring we haven’t missed a crucial feature in our blueprint.