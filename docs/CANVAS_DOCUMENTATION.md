# LibreOllama Canvas Documentation

> **Status**: Production Ready | **Last Updated**: January 2025  
> **Component**: `src/components/canvas/KonvaCanvas.tsx`  
> **Route**: `/canvas`  
> **Framework**: Konva.js + React-Konva

## Overview

The LibreOllama Canvas is a fully-featured whiteboard and drawing application built with Konva.js and React-Konva. It provides professional drawing tools, text editing, shape creation, and collaborative features.

## Quick Start

1. **Access**: Navigate to `/canvas` in LibreOllama
2. **Create**: Select a tool from the toolbar and click to create elements
3. **Edit**: Double-click text elements to edit, use transform handles for shapes
4. **Save**: Canvas automatically saves to Tauri backend

## Architecture

### Component Structure
```
/canvas route
    ↓
App.tsx → KonvaApp.tsx → KonvaCanvas.tsx
    ↓
Konva.js + React-Konva + Zustand + TypeScript
```

### Core Files
```
src/components/canvas/
├── KonvaApp.tsx              # Main canvas page wrapper
├── KonvaCanvas.tsx           # Core canvas rendering (633 lines)
├── UnifiedTextElement.tsx    # Text editing component (991 lines)
├── ImageElement.tsx          # Image handling
├── ConnectableShape.tsx      # Shapes with connection points
├── RichTextRenderer.tsx      # Rich text rendering
├── archive/                  # Archived/unused components
│   ├── README.md            # Documentation of archived components
│   ├── ConnectableShape.tsx # Connection feature (not implemented)
│   ├── SelectableText.tsx   # Replaced by UnifiedTextElement
│   ├── SimpleTextElement.tsx # Replaced by UnifiedTextElement
│   └── TextSelectionManager.ts # Text selection logic (not used)
└── ColorPicker.tsx           # Color selection

src/components/Toolbar/
└── KonvaToolbar.tsx          # Canvas toolbar

src/stores/
└── konvaCanvasStore.ts       # Zustand state management
```

## Features

### Drawing Tools
- **Text**: Click to add, double-click to edit with rich formatting
- **Shapes**: Rectangle, Circle, Triangle, Star with customizable styling
- **Lines**: Straight lines with stroke customization
- **Freehand**: Pen tool for sketching
- **Sticky Notes**: Colored annotation notes
- **Images**: Image upload and positioning

### Professional Features
- **Selection & Transform**: Professional transform handles
- **Rich Text Editor**: Bold, italic, underline formatting
- **Pan & Zoom**: Smooth viewport navigation
- **Keyboard Shortcuts**: Delete, Escape, and navigation keys
- **Save/Load**: JSON-based persistence with Tauri backend
- **Responsive Design**: Adaptive canvas sizing
- **Design System Integration**: Consistent styling

### Text Editing
- **Unified Component**: `UnifiedTextElement.tsx` handles all text types
- **Rich Formatting**: Real-time bold, italic, underline
- **Context Menu**: Persistent formatting menu during editing
- **Visual Feedback**: Editing indicators and active state highlighting
- **Multi-line Support**: Textarea overlay for complex text

## State Management

### Zustand Store (`konvaCanvasStore.ts`)
```typescript
interface CanvasState {
  elements: Record<string, CanvasElement>;
  selectedTool: string;
  selectedElementId: string | null;
  editingTextId: string | null;
  // ... actions
}
```

### Element Types
```typescript
interface CanvasElement {
  id: string;
  type: 'text' | 'sticky-note' | 'rectangle' | 'circle' | 'line' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  // ... type-specific properties
}
```

## Implementation Details

### Canvas Initialization
- Canvas size adapts to container with padding
- Stage ref managed by `KonvaApp.tsx`
- Pan/zoom state handled by `usePanZoom` hook
- Keyboard shortcuts via `useKeyboardShortcuts` hook

### Element Creation
- Tools create elements immediately when selected (except Select/Connect)
- Elements appear at canvas center with default properties
- Transform handles appear automatically for new elements

### Text Editing Flow
1. Double-click text element to enter edit mode
2. Textarea overlay appears with current text
3. Formatting menu provides rich text options
4. Click outside or press Escape to save changes

### Performance Optimizations
- Viewport culling for large numbers of elements
- Efficient re-rendering with React-Konva
- Debounced state updates
- Minimal logging in production

## Development

### Adding New Tools
1. Add tool to `KonvaToolbar.tsx`
2. Implement element creation in `KonvaCanvas.tsx`
3. Add element type to store interfaces
4. Create rendering component if needed

### Styling Guidelines
- Use `designSystem` constants for colors and typography
- Follow existing component patterns
- Maintain responsive design principles
- Use CSS modules or styled-components

### Testing
- Manual testing via `/canvas` route
- Test element creation, editing, and deletion
- Verify pan/zoom functionality
- Check save/load persistence

## Troubleshooting

### Common Issues
- **Elements not appearing**: Check tool selection and element creation logic
- **Text editing problems**: Verify `UnifiedTextElement` integration
- **Performance issues**: Check element count and viewport culling
- **Save/load failures**: Verify Tauri backend connection

### Debug Tools
- Browser dev tools for React components
- Konva debug mode for canvas rendering
- Zustand dev tools for state inspection
- Console logging (minimal in production)

## Migration History

### From Fabric.js to Konva.js (June 2025)
- **Reason**: Resolved invisible objects bug and React integration issues
- **Benefits**: Immediate element visibility, better performance, native React integration
- **Status**: Complete and production-ready

### Legacy Components (Deprecated)
- `SelectableText.tsx` - Replaced by `UnifiedTextElement.tsx`
- `SimpleTextElement.tsx` - Replaced by `UnifiedTextElement.tsx`
- Various Fabric.js components - Archived

## Future Enhancements

### Planned Features
- Real-time collaboration
- Advanced shape tools
- Layer management
- Export functionality
- Template system

### Technical Improvements
- WebGL rendering for better performance
- Advanced text formatting options
- Plugin architecture
- Improved mobile support

---

**Maintainers**: LibreOllama Development Team  
**Last Review**: January 2025  
**Next Review**: March 2025