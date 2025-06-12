# KonvaCanvas - Official Documentation

## Overview

The **KonvaCanvas** is the official, fully-featured whiteboard/drawing canvas implementation for LibreOllama. It provides a clean, modern interface with comprehensive drawing and annotation tools built on Konva.js + React-Konva.

**🚀 Current Status**: Production-ready and actively maintained
**📍 Location**: `src/components/Canvas/KonvaCanvas.tsx`
**🔗 Route**: `/canvas` (via KonvaApp)
**🔄 Migration**: Successfully migrated from Fabric.js to Konva.js (June 2025)

## Recent Updates ✨

### Design System Integration (June 2025)
- **🎨 LibreOllama Design System**: Toolbar now fully compliant with design system CSS variables
- **🚫 Removed Random Styling**: Eliminated random gradient backgrounds in favor of clean, flat design
- **📱 Responsive Design**: Proper breakpoints and mobile-friendly toolbar layout
- **🎯 Accessibility**: Focus states, proper contrast ratios, and keyboard navigation
- **🔧 CSS Architecture**: Modular CSS with BEM-style naming conventions

### Enhanced Toolbar Features
- **⚡ Connection Tool**: Added dynamic shape connection system with visual feedback
- **🎨 Lucide Icons**: Professional icon system replacing emoji-based icons
- **🎪 Interactive Feedback**: Hover states, active states, and smooth transitions
- **📊 Tool Grouping**: Logical organization of drawing tools vs action buttons
- **🎭 Tool Labels**: Dynamic label display for active tools

### Element Creation Improvements (June 2025)
- **⚡ Immediate Creation**: Fixed "click tool → click canvas → create element" flow to "click tool → create element immediately"
- **🎯 Direct Toolbar Actions**: Elements now appear instantly when toolbar buttons are clicked (except Select/Connect tools)
- **🔄 Streamlined UX**: Eliminated unwanted element duplication on canvas clicks
- **🧠 Smart Tool Handling**: Connection and select tools maintain click-to-use workflow for specialized interactions

## Features Complete ✅

### Core Drawing Tools
- **📝 Text**: Editable text with textarea overlay and multi-line support
- **📌 Sticky Notes**: Colored sticky note annotations with Group-based rendering
- **🟦 Shapes**: Rectangle, Circle, Triangle, Star with fill, stroke, and transparency
- **➖ Lines**: Straight lines with customizable stroke and caps
- **✏️ Freehand Drawing**: Pen tool for sketching with smooth strokes
- **⚡ Shape Connections**: Dynamic connection system between shapes with bezier curves

### Professional Editing Features
- **🎯 Selection & Movement**: Native Konva selection with transform handles
- **🔄 Resize & Rotate**: Professional transform handles with design system colors
- **🗑️ Delete**: Remove selected objects (Delete/Backspace keys)
- **📐 Design System**: Consistent styling using LibreOllama CSS variables
- **⌨️ Keyboard Shortcuts**: Delete, Escape key support
- **🔗 Connection Management**: Smart connection detection and validation

### Canvas Controls
- **💾 Save/Load**: JSON-based canvas persistence with Tauri backend
- **📱 Responsive**: Adaptive canvas sizing with mobile-optimized toolbar
- **🔍 Debug Mode**: Comprehensive logging for troubleshooting
- **📤 Export/Import**: JSON-based canvas data exchange

## Architecture

### Component Structure
```
KonvaApp.tsx
├── KonvaToolbar.tsx (Design system compliant toolbar)
│   ├── Tool buttons with Lucide icons
│   ├── Action buttons with proper styling
│   └── CSS-based responsive design
└── KonvaCanvas.tsx
    ├── Stage (Konva container)
    ├── Layer (Konva layer)
    ├── ConnectionLayer (For shape connections)
    ├── Elements rendering
    └── Transformer (Selection handles)
```

### Key Dependencies
- **konva**: Core canvas library (^9.2.0)
- **react-konva**: React wrapper for Konva.js (^18.2.10)
- **zustand**: State management with immer middleware
- **lucide-react**: Professional icon system
- **tailwindcss**: Utility-first CSS with design system variables

### New Components
- **ConnectionManager**: Dynamic shape connection system with bezier curves and smart detection
- **ConnectableShape**: React component for shapes with connection points and visual feedback
- **KonvaToolbar.css**: Modular CSS architecture using design system variables instead of inline styles

## Implementation Details

### Design System Integration
The canvas now follows LibreOllama's design system principles:

```css
/* Toolbar styling using design system variables */
.konva-toolbar {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.konva-toolbar-tool-btn {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all 0.15s ease;
}

.konva-toolbar-tool-btn.active {
  background: var(--accent-primary);
  color: white;
  box-shadow: var(--shadow-sm);
}
```

### Canvas Initialization
```typescript
const KonvaCanvas: React.FC<KonvaCanvasProps> = ({ width, height }) => {
  const { elements, addElement, selectedTool } = useKonvaCanvasStore();

  return (
    <div className="konva-canvas-container">
      <Stage
        width={width}
        height={height}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {Object.values(elements).map(element => renderElement(element))}
          <Transformer 
            ref={transformerRef}
            borderStroke="var(--accent-primary)"
            anchorFill="var(--bg-surface)"
          />
        </Layer>
      </Stage>
    </div>
  );
};
```

### Toolbar-Driven Element Creation
Elements are now created immediately when toolbar buttons are clicked:

```typescript
const handleToolClick = (toolId: string) => {
  setSelectedTool(toolId);
  
  // Create element immediately for drawing tools
  if (toolId !== 'select' && toolId !== 'connect') {
    const { addElement, setSelectedElement } = useKonvaCanvasStore.getState();
    
    const newElement: CanvasElement = {
      id: generateId(),
      type: toolId,
      x: 400, // Center position
      y: 300,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2
    };
    
    addElement(newElement);
    setSelectedElement(newElement.id);
  }
};
```

### Connection System Architecture
The dynamic shape connection system provides professional diagramming capabilities:

```typescript
// Connection Manager initialization
const connectionManager = new ConnectionManager(stage, layer);

// Register shapes as connectable
connectionManager.registerConnectableShape(shape, [
  { x: 0, y: height / 2, type: 'input', id: 'left' },
  { x: width, y: height / 2, type: 'output', id: 'right' },
  { x: width / 2, y: 0, type: 'bidirectional', id: 'top' },
  { x: width / 2, y: height, type: 'bidirectional', id: 'bottom' }
]);

// Connections update automatically when shapes move
connection.source.shape.on('dragmove', updateConnection);
```

### State Management
The canvas uses Zustand with immer for reliable state management:
```typescript
export const useKonvaCanvasStore = create<CanvasState>()(
  immer((set, get) => ({
    elements: {},
    selectedTool: 'select',
    selectedElementId: null,
    
    addElement: (element) => {
      set((state) => {
        state.elements[element.id] = element;
        state.selectedElementId = element.id;
      });
    },
    
    updateElement: (id, updates) => {
      set((state) => {
        if (state.elements[id]) {
          Object.assign(state.elements[id], updates);
        }
      });
    }
  }))
);
```

## Usage Guide

### Basic Usage
1. Navigate to `/canvas` in the application
2. **New Workflow**: Click toolbar buttons to instantly create elements (except Select/Connect tools)
3. Click and drag to move objects around the canvas
4. Use transform handles to resize/rotate objects
5. Double-click text elements to edit with textarea overlay
6. Use Delete/Backspace to remove selected objects

### Toolbar Workflow Changes
- **Drawing Tools** (Text, Rectangle, Circle, etc.): Click button → Element appears immediately at canvas center
- **Select Tool**: Click to enable selection mode for existing objects
- **Connect Tool**: Click to enable connection mode between shapes
- **Pen Tool**: Click button → Element created, then draw on canvas for freehand paths

### Keyboard Shortcuts
- **Delete/Backspace**: Delete selected object
- **Escape**: Deselect all objects
- **Double-click**: Edit text (for text and sticky notes)

### Element Types
```typescript
interface CanvasElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'pen' | 'triangle' | 'star' | 'sticky-note';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  backgroundColor?: string; // for sticky notes
  textColor?: string; // for sticky notes
}
```

### Drawing Workflow
1. **Immediate Creation**: Click any drawing tool button to instantly create an element
2. **Positioning**: Elements appear at canvas center (400, 300) and can be moved immediately
3. **Selection**: Click on any object to select it (red transform handles appear)
4. **Editing**: Double-click text/sticky notes to edit content with textarea overlay
5. **Connections**: Use Connect tool to create dynamic connections between shapes
6. **Deletion**: Select object and press Delete/Backspace to remove

### Enhanced Features
- **No Canvas Clicks Required**: Elements create instantly on toolbar button press
- **Smart Tool Handling**: Select and Connect tools maintain click-to-use workflow
- **Visual Feedback**: Active tools show in toolbar with design system styling
- **Professional Icons**: Lucide React icons for all tools (MousePointer2, Type, Square, etc.)
- **Design System Integration**: All styling uses CSS variables (--accent-primary, --bg-surface, etc.)

## Customization

### Adding New Tools
To add a new drawing tool:

1. Add tool definition to the `tools` array:
```typescript
{ 
  id: 'star', 
  name: 'Star', 
  icon: Star, 
  action: addStar 
}
```

2. Create the action function:
```typescript
const addStar = () => {
  // Create star using fabric.Polygon or custom shape
  const star = new fabric.Polygon(starPoints, {
    fill: currentColor + '20',
    stroke: currentColor,
    strokeWidth: 2,
  });
  canvas.add(star);
  canvas.setActiveObject(star);
  saveHistory();
};
```

### Styling
The canvas uses Tailwind CSS classes for styling. Key style patterns:
- Primary actions: `bg-blue-500 text-white`
- Hover states: `hover:bg-gray-100`
- Disabled states: `text-gray-300 cursor-not-allowed`
- Active states: `bg-blue-100 text-blue-600`

### Canvas Options
Modify canvas behavior by adjusting initialization options:
```typescript
{
  selection: true,           // Enable object selection
  renderOnAddRemove: false,  // Manual rendering for performance
  enableRetinaScaling: true, // High DPI support
  stopContextMenu: true,     // Disable right-click menu
}
```

## Performance Considerations

### Optimization Strategies
1. **Batch Operations**: Group multiple canvas updates
2. **Manual Rendering**: Use `requestRenderAll()` instead of automatic
3. **Object Caching**: Fabric.js caches object rendering by default
4. **Viewport Culling**: Only render visible objects (automatic)

### Large Canvas Tips
- Limit history stack size (e.g., max 50 states)
- Use object grouping for complex drawings
- Consider pagination for many objects
- Implement viewport-based loading for huge canvases

## Troubleshooting

### Common Issues

1. **Objects Not Visible**
   - Check canvas background color
   - Verify object fill/stroke colors
   - Ensure canvas is rendering (`canvas.requestRenderAll()`)

2. **Objects Not Movable**
   - Verify `selection: true` in canvas options
   - Check object `selectable` property
   - Ensure no active drawing mode

3. **Performance Issues**
   - Reduce number of objects
   - Disable automatic rendering
   - Use simpler shapes (less points)
   - Clear history periodically

### Debug Commands
Add these to console for debugging:
```javascript
// Get canvas instance
const canvas = fabricRef.current;

// Log all objects
console.log(canvas.getObjects());

// Check canvas state
console.log({
  zoom: canvas.getZoom(),
  selection: canvas.selection,
  isDrawingMode: canvas.isDrawingMode,
  backgroundColor: canvas.backgroundColor
});

// Force render
canvas.requestRenderAll();
```

## Future Enhancements

### Planned Features
- [ ] Layers panel
- [ ] Text formatting toolbar
- [ ] Shape library (more shapes)
- [ ] Collaboration cursors
- [ ] Save/Load to database
- [ ] Templates system
- [ ] Advanced grid snapping
- [ ] Measurement tools

### API Integration
The canvas can be extended to:
- Auto-save to backend
- Load from saved state
- Export to various formats
- Real-time collaboration
- AI-powered suggestions

## Migration Guide

### From SimpleFabricCanvas
1. Replace import in CanvasWrapper
2. No API changes needed
3. All features are additive

### From Other Canvas Libraries
1. Map drawing APIs to Fabric.js
2. Convert coordinate systems if needed
3. Update event handlers to Fabric.js events
4. Migrate serialization format

## Resources

- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Fabric.js Examples](http://fabricjs.com/demos/)
- [Fabric.js GitHub](https://github.com/fabricjs/fabric.js)
- [Canvas API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

*Last Updated: December 2024*
*Version: 1.0.0*