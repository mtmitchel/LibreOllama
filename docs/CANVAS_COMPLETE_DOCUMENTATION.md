# LibreOllama Canvas - Complete Documentation

> **Status**: Production Ready | **Last Updated**: January 2025  
> **Framework**: Konva.js + React-Konva + Zustand + TypeScript  
> **Route**: `/canvas`

## Overview

The LibreOllama Canvas is a sophisticated 2D graphics editing system built with Konva.js and React-Konva. It provides professional drawing tools, rich text editing, shape creation, section organization, and collaborative features with desktop integration via Tauri.

## Quick Start

1. **Access**: Navigate to `/canvas` in LibreOllama
2. **Create**: Select a tool from the toolbar and click to create elements
3. **Edit**: Double-click text elements to edit, use transform handles for shapes
4. **Organize**: Use sections to group related elements
5. **Save**: Canvas automatically saves to Tauri backend

## Architecture

### Technology Stack
- **Framework**: Konva.js + React-Konva (migrated from Fabric.js/PIXI.js)
- **State Management**: Zustand with Immer integration
- **Language**: TypeScript
- **Styling**: CSS Custom Properties + Design System
- **Icons**: Lucide React
- **Desktop Framework**: Tauri
- **Text Editing**: React Portals for HTML overlay system

### Component Flow
```
/canvas route
    ↓
App.tsx → KonvaApp.tsx → KonvaCanvas.tsx
    ↓
Konva.js + React-Konva + Zustand + TypeScript + Design System
```

### File Structure
```
src/components/canvas/
├── KonvaApp.tsx                    # Main canvas application (127 lines)
├── KonvaCanvas.tsx                 # Core canvas component (1766 lines)
├── KonvaDebugPanel.tsx             # Debug tools (118 lines)
├── ColorPicker.tsx                 # Color selection (193 lines)
├── UnifiedTextElement.tsx          # Text rendering (253 lines)
├── ImageElement.tsx                # Image handling (198 lines)
├── SectionElement.tsx              # Section containers
├── ConnectorRenderer.tsx           # Dynamic connectors
├── ConnectorTool.tsx               # Connector creation tool
├── RichTextRenderer.tsx            # Rich text display (166 lines)
├── TextEditingOverlay.tsx          # HTML overlay editing (280 lines)
├── FloatingTextToolbar.tsx         # Floating toolbar (401 lines)
├── StandardTextFormattingMenu.tsx  # Text formatting UI
├── ToolbarComponents.tsx           # UI component library (821 lines)
└── archive/                        # Archived components

src/stores/
└── konvaCanvasStore.ts             # Zustand state management (851 lines)

src/hooks/
├── usePanZoom.ts                   # Pan/zoom logic (78 lines)
├── useKeyboardShortcuts.ts         # Keyboard shortcuts
├── useTauriCanvas.ts               # Tauri backend integration
└── canvas/
    ├── useCanvasEvents.ts          # Event handling (347 lines)
    └── useCanvasSizing.ts          # Canvas sizing (89 lines)

src/types/
├── canvas.ts                       # Canvas element types
├── section.ts                      # Section system types
└── connector.ts                    # Connector types

src/styles/
├── designSystem.ts                 # LibreOllama design system
├── design-system.css               # CSS variables and global styles
├── konvaCanvas.css                 # Canvas-specific styles
└── canvas-enhancements.css         # Additional enhancements

src-tauri/src/commands/
└── canvas.rs                       # Save/load canvas data
```

## Features

### Drawing Tools
- **Text**: Click to add, double-click to edit with rich formatting
- **Shapes**: Rectangle, Circle, Triangle, Star with customizable styling
- **Lines**: Straight lines and arrows with stroke customization
- **Freehand**: Pen tool for sketching
- **Sticky Notes**: Colored annotation notes
- **Images**: Image upload and positioning
- **Sections**: FigJam-style organizational containers for grouping elements
- **Connectors**: Dynamic connectors that attach to shape anchor points

### Professional Features
- **Selection & Transform**: Professional transform handles with 8-direction resize
- **Rich Text Editor**: Bold, italic, underline formatting with floating toolbar
- **Section Management**: Hierarchical element organization with automatic coordinate conversion
- **Pan & Zoom**: Smooth viewport navigation with keyboard shortcuts
- **Keyboard Shortcuts**: Delete, Escape, and navigation keys
- **Save/Load**: JSON-based persistence with Tauri backend
- **Responsive Design**: Adaptive canvas sizing
- **Design System Integration**: Consistent styling
- **Visual Feedback**: Editing indicators, selection borders, and pulsing animations

### Text Editing Architecture

**Dual-Layer System**:
- **Display Layer**: Konva elements for optimized rendering
- **Edit Layer**: HTML overlay using React portals for native text input
- **Transition**: Seamless switching between display and edit modes
- **Visual Feedback**: Pulsing border animation and subtle page overlay

**Rich Text Implementation**:
- Segment-based text rendering with `RichTextSegment` interface
- Automatic segment merging via `mergeSegments()` for performance
- Support for nested formatting (bold + italic + underline)
- Real-time format preview before applying changes
- Smart formatting menu that appears only when text is selected
- Automatic menu positioning to avoid viewport edges

### Section System Architecture

**Hierarchical Organization**:
- FigJam-style sections for grouping related elements
- Automatic coordinate conversion between absolute and section-relative coordinates
- Drag behavior: sections move all contained elements together
- Visual containment with customizable styling
- Template support for common use cases

**Coordinate System**:
- Elements without `sectionId` use absolute canvas coordinates
- Elements with `sectionId` use section-relative coordinates
- Konva Groups handle transforms automatically during rendering
- No manual coordinate updates when moving sections

## State Management

### Zustand Store (`konvaCanvasStore.ts`)
```typescript
interface CanvasState {
  elements: Record<string, CanvasElement>;
  sections: Record<string, SectionElement>;
  selectedTool: string;
  selectedElementId: string | null;
  editingTextId: string | null;
  // ... other state properties
}
```

### Key Store Methods
- `addElement()`: Add new canvas elements
- `updateElement()`: Update existing elements
- `setSelectedElement()`: Handle element selection
- `createSection()`: Create new sections
- `updateElementSection()`: Manage section membership
- `applyTextFormat()`: Apply rich text formatting

## Development Guidelines

### Component Development
1. **Type Safety**: Use TypeScript interfaces for all props and state
2. **Performance**: Leverage Konva's efficient rendering and React-Konva optimizations
3. **State Management**: Use Zustand store for all canvas state
4. **Styling**: Follow design system patterns and CSS custom properties
5. **Testing**: Use debug panel for development and testing

### Code Organization
- Keep components focused and single-responsibility
- Use custom hooks for complex logic
- Separate rendering logic from business logic
- Follow established naming conventions

### Performance Considerations
- Use `useMemo` and `useCallback` for expensive operations
- Leverage Konva's built-in optimizations
- Implement viewport culling for large canvases
- Optimize text rendering with segment merging

## Migration Status

The codebase has successfully migrated from a multi-library approach to Konva.js:
- ✅ **Core Rendering**: Fully migrated to Konva.js
- ✅ **Section System**: Complete hierarchical organization with coordinate conversion
- ✅ **Text Editing**: Advanced rich text with floating toolbar and selection detection
- ✅ **Event Handling**: Consolidated to Konva event system
- ✅ **State Management**: Fully consolidated in Zustand store
- ✅ **Transform System**: Professional resize handles for all element types

## Known Issues & Solutions

### Resolved Issues
- ✅ **Element Draggability**: Elements inside sections are now properly draggable
- ✅ **Section Resizing**: Sections can be resized with full 8-handle support
- ✅ **Text Editing Visibility**: Elements remain visible during text editing
- ✅ **Rich Text Menu**: Formatting menu appears only when text is selected
- ✅ **Coordinate Conversion**: Automatic conversion between absolute and relative coordinates

### Development Notes
- Multiple `UnifiedTextElement` variants exist for development iterations
- Archive folder contains historical implementations for reference
- Debug panel available for development and troubleshooting

## API Reference

### Canvas Element Interface
```typescript
interface CanvasElement {
  id: string;
  type: 'text' | 'sticky-note' | 'rectangle' | 'circle' | 'line' | 'image' | 'arrow' | 'pen' | 'triangle' | 'star';
  x: number;
  y: number;
  width?: number;
  height?: number;
  sectionId?: string;
  // ... type-specific properties
}
```

### Section Element Interface
```typescript
interface SectionElement {
  id: string;
  type: 'section';
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  backgroundColor: string;
  borderColor: string;
  containedElementIds: string[];
  // ... other section properties
}
```

### Rich Text Segment Interface
```typescript
interface RichTextSegment {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fontWeight?: string;
  textDecoration?: string;
  fill?: string;
  url?: string;
}
```

## Troubleshooting

### Common Issues
1. **Elements not appearing**: Check element coordinates and canvas bounds
2. **Transform handles not working**: Verify element selection state
3. **Text editing issues**: Ensure proper overlay positioning
4. **Section coordinate problems**: Check section membership and coordinate conversion

### Debug Tools
- Use `KonvaDebugPanel` for real-time state inspection
- Browser DevTools for performance profiling
- Console logging for event debugging
- Canvas coordinate visualization

## Contributing

When contributing to the canvas system:
1. Follow TypeScript best practices
2. Use the established component patterns
3. Test with the debug panel
4. Update documentation for new features
5. Consider performance implications
6. Follow the design system guidelines

---

*This documentation consolidates all canvas-related information into a single, comprehensive guide. For specific implementation details, refer to the source code and inline comments.*