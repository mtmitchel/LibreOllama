# KonvaCanvas - Official Documentation

## Overview

The **KonvaCanvas** is the official, fully-featured whiteboard/drawing canvas implementation for LibreOllama. It provides a clean, modern interface with comprehensive drawing and annotation tools built on Konva.js + React-Konva.

**🚀 Current Status**: Production-ready and actively maintained
**📍 Location**: `src/components/Canvas/KonvaCanvas.tsx`
**🔗 Route**: `/canvas` (via KonvaApp)
**🔄 Migration**: Successfully migrated from Fabric.js to Konva.js (June 2025)

## Features Complete ✅

### Core Drawing Tools
- **📝 Text**: Editable text with textarea overlay and multi-line support
- **📌 Sticky Notes**: Colored sticky note annotations with Group-based rendering
- **🟦 Shapes**: Rectangle, Circle, Triangle, Star with fill, stroke, and transparency
- **➖ Lines**: Straight lines with customizable stroke and caps
- **✏️ Freehand Drawing**: Pen tool for sketching with smooth strokes

### Professional Editing Features
- **🎯 Selection & Movement**: Native Konva selection with transform handles
- **🔄 Resize & Rotate**: Professional transform handles with red accent styling
- **🗑️ Delete**: Remove selected objects (Delete/Backspace keys)
- **📐 Professional Design**: Design system with gradients and animations
- **⌨️ Keyboard Shortcuts**: Delete, Escape key support

### Canvas Controls
- **💾 Save/Load**: JSON-based canvas persistence with Tauri backend
- **📱 Responsive**: Adaptive canvas sizing
- **🔍 Debug Mode**: Comprehensive logging for troubleshooting

## Architecture

### Component Structure
```
KonvaApp.tsx
├── KonvaToolbar.tsx (Professional toolbar)
└── KonvaCanvas.tsx
    ├── Stage (Konva container)
    ├── Layer (Konva layer)
    ├── Elements rendering
    └── Transformer (Selection handles)
```

### Key Dependencies
- **konva**: Core canvas library
- **react-konva**: React wrapper for Konva.js
- **zustand**: State management with immer middleware

## Implementation Details

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
            borderStroke="#EF4444"
            anchorFill="#FFFFFF"
          />
        </Layer>
      </Stage>
    </div>
  );
};
```

### Object Creation Pattern
Each drawing tool follows a similar pattern:
1. Handle stage click event
2. Create CanvasElement object
3. Add to Zustand store
4. Element automatically renders via React-Konva

Example:
```typescript
const handleStageClick = (e: any) => {
  if (selectedTool === 'rectangle') {
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'rectangle',
      x: pointerPosition.x,
      y: pointerPosition.y,
      width: 100,
      height: 80,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2
    };
    addElement(newElement);
  }
};
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
2. Use toolbar buttons to select tools
3. Click on canvas to create elements
4. Click and drag to move objects
5. Use transform handles to resize/rotate
6. Double-click text elements to edit

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
1. Select a tool from the toolbar
2. For shapes/text: Click the button to add at default position
3. For drawing: Click pencil tool, then draw on canvas
4. For images: Click image button and select file

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