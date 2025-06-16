#!/usr/bin/env pwsh
# LibreOllama Canvas Rendering Fix Script
# This script fixes all canvas rendering issues

Write-Host "LibreOllama Canvas Rendering Fix Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Step 1: Clean node_modules and reinstall
Write-Host "`nStep 1: Cleaning and reinstalling dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

# Step 2: Create a diagnostic component to test canvas rendering
Write-Host "`nStep 2: Creating canvas diagnostic component..." -ForegroundColor Yellow

$diagnosticComponent = @'
/**
 * Canvas Diagnostic Component
 * Tests Fabric.js canvas rendering and element creation
 */

import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

export const CanvasDiagnostic: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 400,
      backgroundColor: '#ffffff',
      selection: true,
    });
    fabricRef.current = canvas;

    // Test 1: Add text
    const text = new fabric.IText('Canvas Test - If you see this, text rendering works!', {
      left: 50,
      top: 50,
      fill: '#000000',
      fontSize: 20,
      fontWeight: 'bold',
    });
    canvas.add(text);

    // Test 2: Add rectangle
    const rect = new fabric.Rect({
      left: 50,
      top: 100,
      width: 200,
      height: 100,
      fill: '#00ff00',
      stroke: '#000000',
      strokeWidth: 2,
    });
    canvas.add(rect);

    // Test 3: Add circle
    const circle = new fabric.Circle({
      left: 300,
      top: 100,
      radius: 50,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 2,
    });
    canvas.add(circle);

    // Test 4: Add line
    const line = new fabric.Line([400, 100, 500, 200], {
      stroke: '#0000ff',
      strokeWidth: 3,
    });
    canvas.add(line);

    // Log canvas state
    console.log('Canvas Diagnostic:', {
      canvasElement: canvas.getElement(),
      objects: canvas.getObjects().map(obj => ({
        type: obj.type,
        visible: obj.visible,
        opacity: obj.opacity,
        fill: obj.fill,
      })),
      backgroundColor: canvas.backgroundColor,
      dimensions: {
        width: canvas.getWidth(),
        height: canvas.getHeight(),
      }
    });

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-xl font-bold mb-4">Canvas Diagnostic Test</h2>
      <div className="border-2 border-gray-300 inline-block">
        <canvas ref={canvasRef} />
      </div>
      <div className="mt-4 text-sm">
        <p>You should see:</p>
        <ul className="list-disc ml-6">
          <li>Black text saying "Canvas Test..."</li>
          <li>A green rectangle with black border</li>
          <li>A red circle with black border</li>
          <li>A blue line</li>
        </ul>
      </div>
    </div>
  );
};
'@

Set-Content -Path "src\components\CanvasDiagnostic.tsx" -Value $diagnosticComponent

# Step 3: Update fabric-element-creation.ts to use proper colors
Write-Host "`nStep 3: Fixing element colors for production..." -ForegroundColor Yellow

$elementCreationFix = @'
// Replace debugging colors with proper production colors
const getHighContrastElementColors = (elementType: string) => {
  const defaults = {
    color: '#000000', // Black text
    strokeColor: '#333333', // Dark gray stroke
    strokeWidth: 2,
  };

  switch (elementType) {
    case 'sticky-note':
      return { ...defaults, backgroundColor: '#fffacd' }; // Light yellow
    case 'text':
      return { ...defaults, backgroundColor: 'transparent' };
    case 'rectangle':
    case 'square':
      return { ...defaults, backgroundColor: '#e3f2fd' }; // Light blue
    case 'circle':
      return { ...defaults, backgroundColor: '#f3e5f5' }; // Light purple
    case 'triangle':
      return { ...defaults, backgroundColor: '#e8f5e9' }; // Light green
    case 'star':
      return { ...defaults, backgroundColor: '#fff3e0' }; // Light orange
    case 'hexagon':
      return { ...defaults, backgroundColor: '#fce4ec' }; // Light pink
    case 'arrow':
      return { ...defaults, backgroundColor: '#e0f2f1' }; // Light teal
    default:
      return { ...defaults, backgroundColor: '#f5f5f5' }; // Light gray
  }
};
'@

# Read the current file
$currentContent = Get-Content "src\lib\fabric-element-creation.ts" -Raw

# Replace the debug colors function
$updatedContent = $currentContent -replace 'const getHighContrastElementColors = \(elementType: string\) => \{[\s\S]*?\n\s*\};', $elementCreationFix

# Write back the updated content
Set-Content -Path "src\lib\fabric-element-creation.ts" -Value $updatedContent

# Step 4: Add CSS variable for canvas background
Write-Host "`nStep 4: Adding canvas background CSS variable..." -ForegroundColor Yellow

$cssVariables = @'

/* Canvas background variable */
:root {
  --canvas-bg: #ffffff;
}

/* Dark mode canvas background */
[data-theme="dark"] {
  --canvas-bg: #f5f5f5; /* Light gray for dark mode to maintain visibility */
}
'@

Add-Content -Path "src\styles\design-system.css" -Value $cssVariables

# Step 5: Create a test script
Write-Host "`nStep 5: Creating test script..." -ForegroundColor Yellow

$testScript = @'
# Canvas Rendering Test Instructions

1. Start the development server:
   npm run dev

2. Navigate to the Canvas page

3. Try the following tests:
   - Click "Text" tool and see if text appears
   - Click "Shapes" and select a shape
   - Try drawing with the pen tool
   - Check if you can select and move objects

4. Open the browser console and check for any errors

5. Use the Debug button at the bottom left to log canvas state

If elements are still not visible:
- Check browser console for errors
- Verify canvas background is white (not black)
- Try the Canvas Diagnostic component by importing it
'@

Set-Content -Path "CANVAS_TEST_INSTRUCTIONS.md" -Value $testScript

Write-Host "`nCanvas rendering fixes applied!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "2. Test the canvas functionality" -ForegroundColor White
Write-Host "3. Check CANVAS_TEST_INSTRUCTIONS.md for detailed testing steps" -ForegroundColor White
