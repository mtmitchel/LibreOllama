# LibreOllama Canvas - Complete Documentation

> **Status**: Production Ready | **Last Updated**: January 2025  
> **Framework**: Konva.js + React-Konva + Zustand + TypeScript  
> **Route**: `/canvas`

## 🎯 Canvas is Production Ready!

Navigate to `/canvas` to access the fully-featured KonvaCanvas with all professional tools implemented using Konva.js + React-Konva.

## 🔧 Recent Updates (June 2025)

### ✅ Canvas Functionality Updates
1. **Import Error Fixed** – Resolved `useImage` import issue in ImageElement.tsx and KonvaCanvas.tsx
2. **Enhanced Element Dragging** – Elements can now be dragged when using Select or Pan tools
3. **Improved Text Editing** – Double-click to edit text works independent of selected tool
4. **Rich Text Formatting** – Real-time bold, italic, and underline formatting with visual feedback
5. **Context Menu Enhancements** – Persistent formatting menu with active state indicators
6. **Instant Tool Switching** – Removed setTimeout delays for improved responsiveness
7. **Dragging Logic** – Dragging disabled during text editing for better UX

## 🚀 Quick Start

### Getting Started
1. **Navigate** to `/canvas` in LibreOllama
2. **Select Tool** from the modern toolbar  
3. **Create Objects** by clicking on the canvas
4. **Interact** with objects using native Konva transform controls

### Basic Workflow
1. **Add Objects**: Select tool from toolbar, click canvas to create
2. **Move Objects**: Use Select or Pan tools to drag objects around canvas

## 📋 Canvas Table Implementation Fixes

### Recent Table Fixes Applied

#### 1. ✅ **Fixed Hover Flicker**
- **Problem**: Hover interactions were flickering and difficult to click
- **Solution**: 
  - Implemented proper 100ms debounced hover state clearing using timeout refs
  - Added separate timeout management for boundary, header, and cell hovers
  - Clear previous timeouts before setting new hover states
  - Added proper cleanup of all timeouts on component unmount
  - Modified mouse leave handlers to use delayed clearing

#### 2. ✅ **Fixed Text Editing Position**
- **Problem**: Text editing overlay was not positioned correctly, especially with pan/zoom
- **Solution**:
  - Added proper coordinate transformation accounting for canvas pan/zoom using stage transform
  - Added support for tables inside sections (converting relative to absolute coordinates)
  - Calculate screen coordinates properly using container rect and stage transformation
  - Scale cell dimensions according to current zoom level

#### 3. ✅ **Fixed Resize Functionality**
- **Problem**: Table resize was buggy with inconsistent coordinate systems
- **Solution**:
  - Fixed coordinate system consistency by using stage pointer position throughout
  - Properly update table data structure without overwriting the entire object
  - Calculate mouse deltas using consistent stage-relative coordinates
  - Maintain proportional scaling of all columns and rows

#### 4. ✅ **Fixed Table Duplication Issue**
- **Problem**: Tables were being created twice when clicking the table tool
- **Root Cause**: Duplicate table creation logic existed in both `KonvaToolbar.tsx` and `KonvaCanvas.tsx`
- **Solution**:
  - Removed table creation logic from `KonvaCanvas.tsx` to eliminate duplication
  - Tables are now created exclusively through `KonvaToolbar.tsx`
  - Added debouncing mechanism in toolbar to prevent rapid clicks
  - Enhanced stage click handling to avoid interference with table operations
- **Documentation**: See `TABLE_DUPLICATION_FIX.md` for detailed technical analysis

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
├── EnhancedTableElement.tsx        # FigJam-style tables with inline editing (659 lines)
├── TableCellEditor.tsx             # Inline table cell text editor
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
- **Enhanced Tables**: Professional FigJam-style tables with inline editing, dynamic row/column management, drag-and-drop support, and boundary-based controls
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

### Enhanced Tables Architecture

**FigJam-Style Table System**:
- Professional table editing with inline text editing and dynamic structure management
- Rich data model supporting flexible cell content, styling, and layout
- Boundary-based interaction model for intuitive row/column operations
- Drag-and-drop support for canvas elements into table cells

**Table Data Model**:
```typescript
interface EnhancedTableData {
  rows: TableRow[];           // Dynamic row configuration
  columns: TableColumn[];     // Dynamic column configuration  
  cells: TableCell[][];       // 2D array of rich cell data
  styling: TableStyling;      // Global table appearance
}

interface TableCell {
  text: string;               // Primary text content
  richTextSegments?: RichTextSegment[];  // Rich formatting
  containedElementIds?: string[];        // Drag-dropped elements
  styling?: CellStyling;      // Per-cell appearance
  alignment?: TextAlignment;   // Text alignment
}
```

**Interaction Features**:
- **Boundary Add Controls**: Blue circular "+" buttons appear on grid line hover for adding rows/columns
- **Header Delete Controls**: Red circular "−" buttons appear on row/column headers for deletion
- **Inline Text Editing**: Double-click any cell to edit with HTML overlay (`TableCellEditor`)
- **Resize Handles**: Blue circular handles on table edges for proportional resizing
- **Drag-and-Drop**: Canvas elements can be dragged into table cells for rich content
- **Keyboard Navigation**: Tab, Enter, and arrow keys for efficient cell navigation

**Technical Implementation**:
- **Hover Detection**: Large threshold areas (15px boundaries, 40px headers) prevent flicker
- **Event Handling**: Global mouse tracking for smooth resize operations
- **State Management**: Integrated with Zustand store via `addTableRow`, `removeTableColumn`, `updateTableCell` methods
- **Visual Feedback**: Hover highlights, selection borders, and smooth transitions
- **Performance**: Efficient rendering with Konva Groups and optimized event handling

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
- `createEnhancedTable()`: Create FigJam-style tables with rich data structure
- `updateTableCell()`: Update individual cell properties and content
- `addTableRow()` / `addTableColumn()`: Dynamic row/column insertion
- `removeTableRow()` / `removeTableColumn()`: Row/column deletion with cleanup
- `resizeTableRow()` / `resizeTableColumn()`: Manual resize operations
- `setTableSelection()`: Multi-selection state management
- `addElementToTableCell()`: Drag-and-drop support for canvas elements into cells

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