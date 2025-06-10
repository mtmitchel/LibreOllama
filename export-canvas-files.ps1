# Canvas Files Export Script
# Exports all Canvas-related files from LibreOllama to a single text file
# Created: $(Get-Date)

# Set the project root directory
$projectRoot = "c:\Projects\LibreOllama"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$outputFile = Join-Path $desktopPath "LibreOllama-Canvas-Files-Export.txt"

# Canvas-related files to export
$canvasFiles = @(
    # Core Canvas Components
    "src\pages\Canvas.tsx",
    "src\components\CanvasWrapper.tsx",
    
    # State Management
    "src\stores\fabricCanvasStore.ts",
    "src\contexts\FabricCanvasContext.tsx",
    
    # Canvas Components
    "src\components\canvas\CanvasToolbar.tsx",
    "src\components\canvas\PastCanvasesSidebar.tsx",
    "src\components\canvas\TextFormattingToolbar.tsx",
    
    # Custom Hooks
    "src\hooks\canvas\useFabric.ts",
    "src\hooks\canvas\useCanvasPanning.ts",
    "src\hooks\canvas\useCanvasSelectionEvents.ts",
    "src\hooks\canvas\useCanvasEvents.ts",
    
    # Utility Libraries
    "src\lib\fabric-element-creation.ts",
    "src\lib\canvas-coordinates.ts",
    "src\lib\canvas-layers.ts",
    
    # Integration Points
    "src\App.tsx",
    "src\components\CommandPalette.tsx",
    
    # Styling & Theming
    "src\styles\design-system.css",
    "src\styles\App.css",
    "src\lib\theme-utils.ts",
    
    # Type Definitions
    "src\types\fabric.d.ts",
    "src\types\index.ts",
    
    # Testing & Validation
    "src\tests\canvas-rendering-validation.ts",
    "tests\test-canvas-interactions.html",
    
    # Configuration
    "vite.config.ts",
    "package.json"
)

# Analysis content
$analysisContent = @"
# Canvas System Architecture - Complete File Analysis

I've conducted a comprehensive review of the LibreOllama codebase and identified all Canvas-related files and their interconnections. Here's the complete Canvas ecosystem:

## 🎯 Core Canvas Files

### Main Canvas Component
- Canvas.tsx (src/pages/Canvas.tsx) - **Primary production canvas component** (654 lines)
- CanvasWrapper.tsx (src/components/CanvasWrapper.tsx) - Wrapper component handling React StrictMode

### State Management
- fabricCanvasStore.ts (src/stores/fabricCanvasStore.ts) - **Central Zustand store** for all canvas state (935+ lines)
- FabricCanvasContext.tsx (src/contexts/FabricCanvasContext.tsx) - React context for Fabric.js canvas instance

### Canvas Components
- CanvasToolbar.tsx (src/components/canvas/CanvasToolbar.tsx) - Main toolbar with tools and shapes (156 lines)
- PastCanvasesSidebar.tsx (src/components/canvas/PastCanvasesSidebar.tsx) - Sidebar for saved canvases (126 lines)
- TextFormattingToolbar.tsx (src/components/canvas/TextFormattingToolbar.tsx) - Text formatting controls (188 lines)

### Custom Hooks
- useFabric.ts (src/hooks/canvas/useFabric.ts) - **Core Fabric.js lifecycle management** (221 lines)
- useCanvasPanning.ts (src/hooks/canvas/useCanvasPanning.ts) - Pan and zoom functionality (97 lines)
- useCanvasSelectionEvents.ts (src/hooks/canvas/useCanvasSelectionEvents.ts) - Selection event handling
- useCanvasEvents.ts (src/hooks/canvas/useCanvasEvents.ts) - General canvas event management

### Utility Libraries
- fabric-element-creation.ts (src/lib/fabric-element-creation.ts) - **Element creation utilities** (314 lines)
- canvas-coordinates.ts (src/lib/canvas-coordinates.ts) - Coordinate system utilities (308 lines)
- canvas-layers.ts (src/lib/canvas-layers.ts) - Layer management system (210 lines)

## 🔗 Integration Points

### Application Integration
- App.tsx (src/App.tsx) - Routes Canvas and handles special layout for canvas page
- CommandPalette.tsx (src/components/CommandPalette.tsx) - Includes \"Go to Canvas\" command
- Projects.tsx (src/pages/Projects.tsx) - References canvas project type

### Styling & Theming
- design-system.css (src/styles/design-system.css) - Canvas-specific CSS variables and styles
- App.css (src/styles/App.css) - Canvas container and text editor styles
- theme-utils.ts (src/lib/theme-utils.ts) - Theme-aware canvas colors

### Type Definitions
- fabric.d.ts (src/types/fabric.d.ts) - Fabric.js type extensions
- index.ts (src/types/index.ts) - General type exports

### Testing & Validation
- canvas-rendering-validation.ts (src/tests/canvas-rendering-validation.ts) - Canvas rendering test script
- test-canvas-interactions.html (tests/test-canvas-interactions.html) - Canvas interaction tests

### Configuration
- vite.config.ts (vite.config.ts) - Includes Fabric.js in build configuration
- package.json (package.json) - Fabric.js dependency

## 🏗️ Architecture Overview

The Canvas system follows a **centralized architecture** with:

1. **Single Source of Truth**: useFabricCanvasStore manages all canvas state
2. **Fabric.js Integration**: useFabric handles canvas lifecycle
3. **Element Creation**: useFabricElementCreation creates canvas elements
4. **Event Management**: Multiple hooks handle different aspects of canvas interaction
5. **Component Composition**: Modular toolbar and sidebar components

## 📊 Dependencies Flow

```
App.tsx
└── CanvasWrapper.tsx
    └── Canvas.tsx (Main Component)
        ├── fabricCanvasStore.ts (State)
        ├── useFabric.ts (Core Hook)
        ├── fabric-element-creation.ts (Utils)
        ├── CanvasToolbar.tsx (UI)
        ├── useCanvasPanning.ts (Interaction)
        ├── useCanvasSelectionEvents.ts (Selection)
        └── FabricCanvasContext.tsx (Context)
```

This represents a **complete, production-ready Canvas system** built on Fabric.js with comprehensive state management, event handling, and UI components. All files are actively used and interconnected to provide a professional-grade infinite whiteboard experience.

"@

Write-Host "Starting Canvas Files Export..." -ForegroundColor Green
Write-Host "Project Root: $projectRoot" -ForegroundColor Yellow
Write-Host "Output File: $outputFile" -ForegroundColor Yellow

# Initialize output file with header
$header = @"
================================================================================
LibreOllama Canvas System - Complete File Export
Generated: $(Get-Date)
Project: LibreOllama
Exported Files: $($canvasFiles.Count) files
================================================================================

"@

$header | Out-File -FilePath $outputFile -Encoding UTF8

# Add analysis first
"CANVAS SYSTEM ANALYSIS" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"=" * 80 | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8
$analysisContent | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"=" * 80 | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"CANVAS FILES CONTENT" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"=" * 80 | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8

# Export each file
$exportedCount = 0
$skippedFiles = @()

foreach ($file in $canvasFiles) {
    $fullPath = Join-Path $projectRoot $file
    
    if (Test-Path $fullPath) {
        Write-Host "Exporting: $file" -ForegroundColor Cyan
        
        # File header
        $fileHeader = @"

################################################################################
FILE: $file
FULL PATH: $fullPath
SIZE: $((Get-Item $fullPath).Length) bytes
LAST MODIFIED: $((Get-Item $fullPath).LastWriteTime)
################################################################################

"@
        
        $fileHeader | Out-File -FilePath $outputFile -Append -Encoding UTF8
        
        # File content
        try {
            Get-Content $fullPath -Encoding UTF8 | Out-File -FilePath $outputFile -Append -Encoding UTF8
            $exportedCount++
        }
        catch {
            "ERROR: Could not read file content - $($_.Exception.Message)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            $skippedFiles += $file
        }
        
        # File footer
        "`n################################################################################`n" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    }
    else {
        Write-Host "File not found: $file" -ForegroundColor Red
        $skippedFiles += $file
        "FILE NOT FOUND: $file" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    }
}

# Summary
$summary = @"

================================================================================
EXPORT SUMMARY
================================================================================
Total files processed: $($canvasFiles.Count)
Successfully exported: $exportedCount
Skipped/Not found: $($skippedFiles.Count)

"@

if ($skippedFiles.Count -gt 0) {
    $summary += "Skipped files:`n"
    foreach ($skipped in $skippedFiles) {
        $summary += "- $skipped`n"
    }
}

$summary += "`nExport completed: $(Get-Date)`n"
$summary += "Output file: $outputFile`n"
$summary += "================================================================================`n"

$summary | Out-File -FilePath $outputFile -Append -Encoding UTF8

Write-Host "`nExport completed!" -ForegroundColor Green
Write-Host "Exported $exportedCount files to: $outputFile" -ForegroundColor Yellow

if ($skippedFiles.Count -gt 0) {
    Write-Host "Warning: $($skippedFiles.Count) files were skipped or not found" -ForegroundColor Red
}

# Open the output file
Write-Host "Opening output file..." -ForegroundColor Green
Start-Process notepad.exe $outputFile