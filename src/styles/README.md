# Styles Directory

This directory contains all CSS and design system files for the LibreOllama application.

## File Organization

### Core Design System
- **`designSystem.ts`** - TypeScript design system configuration with colors, spacing, typography, and utility functions. Heavily used across canvas components.
- **`design-system.css`** - CSS custom properties and global design tokens. Imported in main.tsx.

### Application Styles
- **`App.css`** - Main application styles including focus mode, scrollbar customization, and canvas text editor fixes. Imported in main.tsx.

### Canvas-Specific Styles
- **`konvaCanvas.css`** - Core Konva canvas styles with modern polish, animations, and component-specific styling.
- **`canvas-enhancements.css`** - Modern UI enhancements for canvas including glassmorphism effects, button interactions, and container styling.
- **`canvas-fixes.css`** - Critical canvas fixes and compatibility adjustments. Imported in both App.css and main.tsx.
- **`canvas-sections-enhanced.css`** - Styles for canvas section elements including borders, handles, and labels.
- **`canvas-transform-enhanced.css`** - Styles for transform handles, rotation controls, and selection indicators.

### Text Editing
- **`text-editing-enhanced.css`** - Enhanced styles for text editing overlays, floating toolbars, and text formatting components.

## Import Hierarchy

```
main.tsx
├── design-system.css (global design tokens)
├── App.css (main app styles)
│   └── canvas-fixes.css (imported via @import)
└── canvas-fixes.css (direct import)

KonvaApp.tsx & KonvaCanvas.tsx
├── konvaCanvas.css (core canvas styles)
├── canvas-enhancements.css (modern UI enhancements)
├── canvas-sections-enhanced.css (section elements)
├── canvas-transform-enhanced.css (transform controls)
└── text-editing-enhanced.css (text editing)
```

## Cleanup History

### Removed Files
- **`canvasEnhancements.css`** - Deleted (unused, no imports found)
- **`enhanced-table.css`** - Moved to `src/components/canvas/backup/` (only used by backup components)

## Notes

- All canvas-related CSS files follow a consistent naming pattern: `canvas-*-enhanced.css`
- The design system uses both TypeScript (`designSystem.ts`) and CSS (`design-system.css`) approaches for maximum flexibility
- Canvas fixes are imported twice (via App.css and directly) to ensure compatibility
- All files are actively used and imported by components