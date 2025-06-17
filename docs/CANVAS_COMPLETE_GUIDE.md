# LibreOllama Canvas - Complete Guide

> **Status**: Production Ready | **Last Updated**: June 17, 2025  
> **Framework**: Konva.js + React-Konva + Zustand + TypeScript  
> **Route**: `/canvas`

## 🎯 Overview

LibreOllama Canvas is a professional-grade, infinite whiteboard system built with Konva.js and React. It provides a comprehensive set of tools for visual thinking, brainstorming, diagramming, and collaborative work - all while maintaining your privacy with local-only storage.

### Key Capabilities
- **15+ Element Types**: Text, shapes, tables, sticky notes, images, connectors, sections
- **Advanced Tables**: Excel-like functionality with rich text, resizing, dynamic structure
- **Rich Text Editing**: Real-time formatting with floating toolbars
- **Section Organization**: Group elements with visual containers
- **Pan & Zoom**: Smooth navigation with touch and keyboard support
- **Persistence**: Local storage with multiple canvas management
- **Import/Export**: Save and load canvas data

## 🏗️ Architecture

### Core Components

```
KonvaApp.tsx                    # Main canvas application
├── KonvaToolbar.tsx           # Tool selection and canvas controls
├── CanvasSidebar.tsx          # Canvas management and properties
├── KonvaCanvas.tsx            # Core rendering with Konva.js
└── Element Components/
    ├── EnhancedTableElement   # Advanced table functionality
    ├── StickyNoteElement      # Sticky note implementation
    ├── SectionElement         # Section containers
    ├── TextEditingOverlay     # Rich text editing
    └── Various shape/connector renderers
```

### State Management

**Store**: `konvaCanvasStore.ts` (Zustand + Immer)
- **Elements**: Record<string, CanvasElement> - All canvas objects
- **Sections**: Record<string, SectionElement> - Organizational containers
- **Tools**: Selected tool, editing states, canvas settings
- **History**: Undo/redo system with 50-state limit
- **Multi-Canvas**: Support for multiple canvases with persistence

### Data Model

```typescript
interface CanvasElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'pen' | 
        'triangle' | 'star' | 'sticky-note' | 'rich-text' | 'image' | 
        'connector' | 'section' | 'table';
  x: number;
  y: number;
  width?: number;
  height?: number;
  // ... extensive properties for styling, behavior, content
  sectionId?: string;           // Section membership
  richTextSegments?: RichTextSegment[]; // Rich text support
  enhancedTableData?: EnhancedTableData; // Advanced table data
}
```

## 🛠️ Features & Tools

### Basic Tools
- **Select** (MousePointer2): Element selection and manipulation
- **Pan** (Hand): Canvas navigation

### Content Creation
- **Text** (Type): Rich text with formatting options
- **Sticky Note** (StickyNote): Colored notes with text
- **Section** (Layout): Organizational containers
- **Table** (Table): Advanced spreadsheet-like tables
- **Image** (Image): Image embedding and manipulation

### Drawing Tools
- **Pen** (Pen): Freehand drawing
- **Shapes**: Rectangle, Circle, Triangle, Star
- **Connectors**: Lines and arrows with smart endpoints

### Canvas Actions
- **Clear**: Remove all elements
- **Undo/Redo**: 50-level history system
- **Zoom**: In, Out, Reset, Fit to content
- **Import/Export**: Canvas data persistence
- **Save/Load**: Tauri file system integration

## 📋 Enhanced Tables

### Features
- **Excel-like Interface**: Click to select, double-click to edit
- **Dynamic Structure**: Add/remove rows and columns on hover
- **8-Direction Resize**: Drag handles on all corners and edges
- **Rich Text Cells**: Formatting within individual cells
- **Header Support**: Special styling for header rows/columns
- **Context Menus**: Right-click for advanced operations

### Interaction Model
- **Boundary Controls**: Blue "+" buttons on grid line hover
- **Header Controls**: Red "−" buttons on row/column headers
- **Resize Handles**: Blue dots for 8-direction resizing
- **Cell Editing**: HTML overlay system for native text input

### Data Structure
```typescript
interface EnhancedTableData {
  rows: TableRow[];           // Dynamic row configuration
  columns: TableColumn[];     // Dynamic column configuration  
  cells: TableCell[][];       // 2D array of rich cell data
  styling: TableStyling;      // Global table appearance
}
```

## 🎨 Rich Text System

### Capabilities
- **Real-time Formatting**: Bold, italic, underline, colors
- **Floating Toolbar**: Context-sensitive formatting controls
- **Selection Detection**: Smart text selection handling
- **Font Management**: Family, size, weight, style options
- **Alignment**: Left, center, right text alignment
- **Links**: Hyperlink support with URL management

### Implementation
- **RichTextSegment[]**: Granular text formatting
- **TextEditingOverlay**: HTML-based editing interface
- **Merge Optimization**: Automatic segment consolidation
- **Performance**: Memoized calculations and throttled updates

## 🗂️ Section System

### Features
- **Visual Organization**: Group related elements
- **Coordinate Management**: Automatic absolute/relative conversion
- **Section Templates**: Pre-configured section types
- **Hierarchical Structure**: Elements belong to sections
- **Visual Feedback**: Selection and hover states

### Use Cases
- **Mind Maps**: Organize thoughts by topic
- **User Flows**: Group interface screens
- **Process Diagrams**: Separate workflow stages
- **Content Organization**: Categorize different types of content

## 🔧 Technical Implementation

### Performance Optimizations
- **Ref-based Rendering**: Prevents unnecessary re-renders
- **Throttled Operations**: Smooth resize and interaction
- **Memory Management**: Efficient state updates with Immer
- **Canvas Redraw**: Optimized layer management
- **Event Debouncing**: Smooth user interactions

### Coordinate System
- **Local Coordinates**: Relative to parent section
- **Absolute Coordinates**: For hit testing and connectors
- **Screen Coordinates**: For UI overlays and interactions
- **Transform Management**: Automatic coordinate conversion

### Persistence
- **localStorage**: Browser-based canvas storage
- **Multiple Canvases**: Independent canvas management
- **Auto-save**: Automatic state persistence
- **Export/Import**: JSON-based data exchange
- **Tauri Integration**: File system operations

## 🚀 Usage Guide

### Getting Started
1. Navigate to `/canvas` in LibreOllama
2. Select a tool from the toolbar
3. Click on canvas to create elements
4. Use pan/zoom for navigation
5. Double-click text elements to edit

### Keyboard Shortcuts
- **Ctrl+Z/Cmd+Z**: Undo
- **Ctrl+Y/Cmd+Y**: Redo
- **Delete**: Remove selected element
- **Space+Drag**: Pan canvas
- **Mouse Wheel**: Zoom in/out

### Table Workflow
1. Select Table tool and click to create
2. Hover grid boundaries to add rows/columns
3. Double-click cells to edit content
4. Drag blue handles to resize
5. Use header controls to delete rows/columns

### Rich Text Editing
1. Double-click any text element
2. Select text to show formatting toolbar
3. Apply formatting (bold, italic, colors)
4. Press Enter to save, Escape to cancel
5. Use Tab to move between table cells

## 📁 File Organization

### Components (34+ files)
```
src/components/canvas/
├── KonvaApp.tsx              # Main application
├── KonvaCanvas.tsx           # Core rendering
├── CanvasSidebar.tsx         # Canvas management
├── EnhancedTableElement.tsx  # Advanced tables
├── TextEditingOverlay.tsx    # Rich text editing
├── StickyNoteElement.tsx     # Sticky notes
├── SectionElement.tsx        # Section containers
└── [25+ additional components]
```

### State & Types
```
src/stores/konvaCanvasStore.ts  # Main state management
src/types/
├── index.ts                  # Base interfaces
├── connector.ts              # Connector definitions
├── richText.ts              # Rich text types
└── section.ts               # Section system
```

### Utilities
```
src/utils/
├── canvasRedrawUtils.ts     # Performance optimization
└── coordinateService.ts     # Coordinate management

src/hooks/
├── usePanZoom.ts           # Pan/zoom functionality
└── useKeyboardShortcuts.ts  # Keyboard navigation
```

## 🎯 Development Status

### ✅ Completed Features
- Core canvas functionality with 15+ element types
- Advanced table system with Excel-like features
- Rich text editing with real-time formatting
- Section-based organization system
- Pan/zoom with smooth interactions
- Undo/redo history management
- Multi-canvas support with persistence
- Performance optimizations and memory management

### 🔄 Active Development
- Enhanced connector routing algorithms
- Advanced selection tools (multi-select, lasso)
- Template system for common layouts
- Collaboration features preparation
- Additional export formats

### 🎨 Design Philosophy
- **Privacy-First**: All data stored locally
- **Performance-Focused**: Smooth interactions at any scale
- **Professional-Grade**: Excel/Figma-level functionality
- **Intuitive**: Natural interaction patterns
- **Extensible**: Modular architecture for new features

---

*This documentation consolidates all canvas-related information for LibreOllama. For development details, see the source code in `src/components/canvas/` and `src/stores/konvaCanvasStore.ts`.*
