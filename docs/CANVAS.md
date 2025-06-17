# LibreOllama Canvas System

> **Status**: Production Ready | **Last Updated**: June 2025  
> **Framework**: Konva.js + React-Konva + Zustand + TypeScript  
> **Route**: `/canvas`

## Overview

LibreOllama's Canvas is a professional-grade infinite whiteboard built with Konva.js and React. It provides a complete visual workspace for brainstorming, diagramming, mind-mapping, and collaborative visual thinking with advanced features comparable to tools like FigJam and Miro.

## 🎯 Key Features

### **Element Types (15 Total)**
- **Text & Content**: Text, Rich Text, Sticky Notes
- **Shapes**: Rectangle, Circle, Triangle, Star  
- **Drawing**: Pen tool, Images
- **Layout**: Sections (for organization), Enhanced Tables
- **Connections**: Lines, Arrows, Smart Connectors

### **Professional Interactions**
- **Pan & Zoom**: Smooth wheel zoom, touch support, zoom-to-fit
- **Selection**: Multi-select, transform handles, keyboard navigation
- **Rich Text Editing**: Floating toolbar, inline formatting, live preview
- **Enhanced Tables**: 8-handle resize, inline cell editing, dynamic rows/columns
- **Sections**: Hierarchical organization with automatic coordinate conversion
- **Smart Connectors**: Element-to-element connections with path routing

### **Advanced Functionality**
- **Undo/Redo**: 50-state history with granular action tracking
- **Persistence**: Auto-save to localStorage, multiple canvas support
- **Keyboard Shortcuts**: Full keyboard navigation and tool switching
- **File Operations**: Import/Export via Tauri integration
- **Performance**: Optimized rendering, throttled operations, efficient updates

## 🏗 Architecture

### **Core Components**

```
KonvaApp.tsx              → Main canvas application layout
├── KonvaToolbar.tsx      → Tool selection and canvas controls
├── CanvasSidebar.tsx     → Canvas management and properties
└── KonvaCanvas.tsx       → Core Konva rendering engine
    ├── Element Renderers
    │   ├── UnifiedTextElement.tsx
    │   ├── StickyNoteElement.tsx
    │   ├── EnhancedTableElement.tsx
    │   ├── SectionElement.tsx
    │   ├── ConnectorRenderer.tsx
    │   └── Shape/Image Renderers
    ├── Text Editing
    │   ├── TextEditingOverlay.tsx
    │   ├── RichTextCellEditor.tsx
    │   └── StandardTextFormattingMenu.tsx
    └── UI Components
        ├── ColorPicker.tsx
        └── ToolbarComponents.tsx
```

### **State Management**

**Store**: `konvaCanvasStore.ts` (Zustand + Immer)
- **Elements**: Record<string, CanvasElement> - All canvas objects
- **Sections**: Record<string, SectionElement> - Organizational containers  
- **Canvas State**: Selected tool, editing mode, canvas size
- **History**: 50-state undo/redo with action descriptions
- **Multi-Canvas**: Support for multiple canvases with persistence

### **Hook System**
- **usePanZoom**: Wheel/touch zoom, pan, scale clamping (0.1x - 10x)
- **useKeyboardShortcuts**: Tool switching, navigation, actions
- **useTauriCanvas**: File I/O integration with Tauri backend
- **Canvas-specific hooks**: Sizing, events, element management

## 🛠 Tools & Interface

### **Toolbar Organization**

**Basic Tools**
- **Select**: Element selection and manipulation
- **Pan**: Canvas navigation mode

**Content Tools**  
- **Text**: Rich text elements with formatting
- **Sticky Note**: Colored notes with text
- **Section**: Organizational containers
- **Table**: Enhanced tables with inline editing

**Drawing Tools**
- **Pen**: Freehand drawing
- **Image**: Image placement and manipulation

**Shape Tools** (Dropdown)
- **Shapes**: Rectangle, Circle, Triangle, Star
- **Connectors**: Line, Arrow with smart routing

**Canvas Actions**
- **File**: Import, Export, Save, Load via Tauri
- **Edit**: Undo, Redo, Delete, Clear Canvas
- **View**: Zoom In/Out, Reset Zoom, Zoom to Fit
- **Layout**: Sidebar toggle, element organization

## 📊 Enhanced Tables

### **Features**
- **8-Handle Resize**: Drag blue dot handles on all directions
- **Inline Editing**: Double-click cells for text editing
- **Dynamic Structure**: Add/remove rows and columns via hover controls
- **Rich Content**: Rich text formatting within cells
- **Professional UX**: Boundary controls, header management, hover feedback

### **Data Model**
```typescript
interface EnhancedTableData {
  rows: TableRow[];           // Dynamic row configuration
  columns: TableColumn[];     // Dynamic column configuration  
  cells: TableCell[][];       // 2D array of rich cell data
  styling: TableStyling;      // Global table appearance
}
```

### **Interactions**
- **Add Row/Column**: Hover grid boundaries → click blue "+" button
- **Remove Row/Column**: Hover headers → click red "−" button
- **Resize**: Drag blue handles for proportional or directional scaling
- **Edit Text**: Double-click cell → HTML overlay editor with keyboard navigation

## 🎨 Rich Text System

### **Capabilities**
- **Formatting**: Bold, italic, underline, font size, colors
- **Alignment**: Left, center, right text alignment
- **Lists**: Bullet points and numbered lists
- **Links**: Hyperlink support with URL validation
- **Live Preview**: Real-time formatting with floating toolbar

### **Implementation**
- **Unified System**: Consistent across text elements, sticky notes, and table cells
- **Segment-Based**: RichTextSegment arrays for precise formatting control
- **Performance**: Optimized merging and validation with memoization
- **HTML Overlay**: Native text input with position synchronization

## 🔧 Technical Details

### **Performance Optimizations**
- **Ref-Based Updates**: Prevent unnecessary re-renders during operations
- **Throttled Operations**: Smooth resize and interaction handling
- **Efficient Rendering**: Minimal DOM updates, optimized Konva usage
- **Memory Management**: Automatic cleanup, bounded history size

### **Coordinate System**
- **Hierarchical**: Local coordinates within sections, absolute for positioning
- **Automatic Conversion**: Seamless coordinate transformation
- **Hit Testing**: Accurate element selection and interaction
- **Section Support**: Elements properly contained within organizational sections

### **Data Persistence**
- **LocalStorage**: Automatic canvas state preservation
- **Multi-Canvas**: Support for multiple named canvases
- **File I/O**: Import/export via Tauri for cross-device sharing
- **Auto-Save**: Changes saved immediately to prevent data loss

## 🚀 Usage Examples

### **Basic Workflow**
1. **Select Tool**: Choose from toolbar (Select, Text, Shapes, etc.)
2. **Create Element**: Click on canvas to place new elements
3. **Edit Content**: Double-click text elements for inline editing
4. **Transform**: Use selection handles for resize, rotate, move
5. **Organize**: Group elements in sections for better structure
6. **Connect**: Use connectors to show relationships between elements

### **Table Creation**
1. Select **Table** tool from toolbar
2. Click on canvas to place default 3x3 table
3. **Edit cells**: Double-click any cell to add content
4. **Resize**: Drag blue dot handles to adjust size
5. **Modify structure**: Hover boundaries/headers for add/remove controls

### **Rich Text Editing**
1. Create **Text** element or **Sticky Note**
2. Double-click to enter edit mode
3. **Format text**: Use floating toolbar for bold, italic, colors
4. **Finish**: Click outside or press Escape to save changes

## 🎯 Current Status

✅ **Complete Features**
- All 15 element types fully functional
- Rich text editing system operational
- Enhanced tables with resize and editing
- Pan/zoom with touch support
- Undo/redo with 50-state history
- Multi-canvas support with persistence
- File import/export via Tauri
- Keyboard shortcuts and navigation

🔧 **Active Development**
- Performance optimizations
- Additional connector types
- Advanced section features
- Extended keyboard shortcuts

The Canvas system represents a mature, professional-grade whiteboard solution suitable for complex visual work while maintaining excellent performance and user experience.
