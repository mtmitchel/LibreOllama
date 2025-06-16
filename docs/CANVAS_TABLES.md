# Canvas Tables Documentation

> **Status**: Functional with Active Development | **Last Updated**: June 2025  
> **Components**: `EnhancedTableElement.tsx` + `TableCellEditor.tsx`  
> **Integration**: Konva Canvas + Zustand Store

## Overview

The Enhanced Tables system provides table editing within the LibreOllama Canvas, featuring inline text editing, dynamic structure management, and resize functionality. This is consolidated documentation covering all table-related features and implementation details.

> **⚠️ Current Status**: The table system is functional but still under active development. Some features may have limitations or require additional testing before production use.

## Key Features

### ✨ **Professional Interaction Model**
- **Boundary-Only Add Controls**: Blue circular "+" buttons appear on grid line hover
- **Header-Only Delete Controls**: Red circular "−" buttons appear on row/column headers
- **Clean Interface**: Controls only appear where they make sense
- **Flicker-Free Hover**: Large detection areas and delayed hover clearing prevent UI flicker

### 📝 **Inline Text Editing**
- **Double-Click Activation**: Click any cell to start editing
- **HTML Overlay System**: `TableCellEditor` component provides native text input
- **Keyboard Navigation**: Enter to save, Escape to cancel, Tab to move between cells
- **Real-Time Sync**: Text changes immediately update the store

### 🔧 **Dynamic Structure Management**
- **Add Rows/Columns**: Hover grid boundaries and click "+" to insert
- **Remove Rows/Columns**: Hover headers and click "−" to delete (minimum 1 row/column)
- **8-Handle Resize System**: Drag blue dot handles on all 8 directions (corners and edges)
- **Live Visual Feedback**: Real-time resize preview with visual updates
- **Custom Resize Controls**: Disabled conflicting Konva Transformer for cleaner experience

### 🎯 **Content Support**
- **Rich Text**: Basic text formatting within cells
- **Visual Feedback**: Hover highlights and interaction indicators

## Technical Implementation

### Data Model

```typescript
interface EnhancedTableData {
  rows: TableRow[];           // Dynamic row configuration
  columns: TableColumn[];     // Dynamic column configuration  
  cells: TableCell[][];       // 2D array of rich cell data
  styling: TableStyling;      // Global table appearance
}

interface TableRow {
  id: string;
  height: number;
  minHeight?: number;
  maxHeight?: number;
  isResizable: boolean;
  isHeader?: boolean;
}

interface TableColumn {
  id: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  isResizable: boolean;
  alignment?: 'left' | 'center' | 'right';
}

interface TableCell {
  text: string;
  richTextSegments?: RichTextSegment[];
  containedElementIds?: string[];
  styling?: CellStyling;
  alignment?: TextAlignment;
  padding?: number;
}
```

### Component Architecture

```
EnhancedTableElement.tsx (659 lines)
├── Table Rendering (Konva Groups, Rects, Text)
├── Hover Detection (Boundaries + Headers)
├── Event Handling (Click, Double-click, Mouse move)
├── Resize Logic (Global mouse tracking)
├── Add/Remove Controls (Dynamic positioning)
└── Integration with TableCellEditor

TableCellEditor.tsx
├── HTML Overlay Positioning
├── Keyboard Event Handling
├── Text Synchronization
```

## Resize System Implementation

### 8-Handle Resize System
The table resize system provides 8 directional handles:

**Corner Handles:**
- **Northwest (nw)**: Resize width and height, anchor: bottom-right
- **Northeast (ne)**: Resize width and height, anchor: bottom-left  
- **Southwest (sw)**: Resize width and height, anchor: top-right
- **Southeast (se)**: Resize width and height, anchor: top-left

**Edge Handles:**
- **North (n)**: Resize height only, anchor: bottom
- **South (s)**: Resize height only, anchor: top
- **East (e)**: Resize width only, anchor: left
- **West (w)**: Resize width only, anchor: right

### Performance Optimizations
- **Ref-based State**: Uses refs instead of state for resize operations to prevent unnecessary re-renders
- **Debounced Updates**: Resize operations are optimized to reduce computational overhead
- **Clean Event Handling**: Proper cleanup of global mouse events

### Known Issues & Fixes Applied

#### Fixed: Table Duplication Issue
**Root Cause**: Table creation was implemented in both `KonvaToolbar.tsx` and `KonvaCanvas.tsx`, causing duplicate table creation.

**Solution Applied**:
```typescript
// REMOVED: Duplicate table creation logic from handleStageClick in KonvaCanvas.tsx
// Table creation now handled exclusively by KonvaToolbar.tsx
// This prevents duplicate table creation when clicking on canvas
```

**Key Improvements**:
- Eliminated primary cause of table duplication
- Table creation now happens only from the toolbar
- Prevents conflicting creation logic between components

#### Fixed: Hover Flicker
**Problem**: Hover interactions were flickering and difficult to click
**Solution**: 
- Implemented 100ms debounced hover state clearing using timeout refs
- Added separate timeout management for boundary, header, and cell hovers
- Clear previous timeouts before setting new hover states

#### Fixed: Resize State Persistence
**Problem**: Tables would revert to original size after resizing
**Solution**: 
- Replaced state-based resize tracking with refs to prevent stale closure issues
- Proper state persistence on mouse up events
- Disabled conflicting Konva Transformer for tables

## Usage Guide

### Creating Tables
1. Select the Table tool from the toolbar
2. Click on the canvas to create a new table
3. Default tables start with 3x3 grid

### Editing Content
1. **Double-click** any cell to start editing
2. Type your content
3. Press **Enter** to save or **Escape** to cancel
4. Use **Tab** to move between cells

### Managing Structure
- **Add Row/Column**: Hover grid boundaries until "+" appears, then click
- **Remove Row/Column**: Hover row/column headers until "−" appears, then click
- **Resize Table**: Drag any of the 8 blue resize handles around the table perimeter

### Interaction Tips
- Use the **Select** tool to move tables around the canvas
- Tables can be moved when using either **Select** or **Table** tools
- Resize handles only appear when table is selected

## Development Notes

### Current Limitations
- Rich text formatting is basic (planned for future enhancement)
- Drag-and-drop of canvas elements into cells is planned but not fully implemented
- Some edge cases in resize behavior may need additional testing

### Architecture Considerations
- Component is well-integrated with Zustand store for state management
- Uses Konva.js for rendering performance
- HTML overlay system for text editing provides native input experience
- Global mouse event handling for smooth resize operations

### Testing Checklist
- [ ] Table creation from toolbar
- [ ] Cell editing (double-click, keyboard navigation)
- [ ] Row/column addition and removal
- [ ] All 8 resize handle directions
- [ ] Table movement with different tools
- [ ] State persistence after operations
- [ ] No duplicate table creation
- [ ] Hover interaction reliability

## Related Documentation
- [Canvas Complete Documentation](CANVAS_COMPLETE_DOCUMENTATION.md) - Main canvas system overview
- [Canvas Architecture Analysis](CANVAS_ARCHITECTURE_ANALYSIS.md) - Technical architecture details

---

*This document consolidates information from previous separate table documentation files to provide a single source of truth for table functionality.*
