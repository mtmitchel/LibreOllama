# Canvas Tools

This directory contains all interactive tools for the canvas system.

## Tool Overview

### Drawing Tools
- `PenTool.ts` - Freehand drawing
- `DrawingTools.ts` - Base classes for drawing tools (Marker, Highlighter, Eraser)

### Shape Creation Tools
- `CircleTool.ts` - Circle creation
- `RectangleTool.ts` - Rectangle creation  
- `TriangleTool.ts` - Triangle creation
- `TextTool.ts` - Text element creation
- `StickyNoteTool.ts` - Sticky note creation
- `ConnectorTool.ts` - Connector line creation

### Base Classes
- `ShapeTools.ts` - Base tool interfaces and common tools (Select, Pan)
- `index.ts` - Tool exports

## Shape ↔ Tool Mapping

### Complete Mappings
| Shape | Tool | Status |
|-------|------|--------|
| `CircleShape.tsx` | `CircleTool.ts` | ✅ |
| `RectangleShape.tsx` | `RectangleTool.ts` | ✅ |
| `TriangleShape.tsx` | `TriangleTool.ts` | ✅ |
| `TextShape.tsx` | `TextTool.ts` | ✅ |
| `StickyNoteShape.tsx` | `StickyNoteTool.ts` | ✅ |
| `ConnectorShape.tsx` | `ConnectorTool.ts` | ✅ |
| `PenShape.tsx` | `PenTool.ts` | ✅ |

### Shapes Without Dedicated Tools
These shapes are created through alternative methods:

| Shape | Creation Method | Notes |
|-------|----------------|-------|
| `EditableNode.tsx` | Context menu / programmatic | General-purpose editable text node |
| `ImageShape.tsx` | Drag & drop / upload dialog | Images added via file operations |
| `SectionShape.tsx` | Toolbar section button | Area selection/grouping tool |

### Elements vs Shapes
- `TableElement.tsx` lives under `elements/` and represents complex table structures
- Table creation uses context menu or dedicated table commands
- No standalone `TableTool.ts` needed as tables are composite elements

## Architecture Notes

- Tools implement the `ITool` interface from `ShapeTools.ts`
- Tools are managed by `UnifiedEventHandler` in `../core/`
- Shape rendering is handled by components in `../shapes/`
- Tool selection state is managed in the unified canvas store
