# Canvas Import Path Fix Script
# Fixes the remaining import path issues to complete the consolidation

$rootPath = "c:\Projects\LibreOllama"

Write-Host "🔧 Starting Canvas Import Path Fixes..." -ForegroundColor Green

# Get all TypeScript files in canvas components
$canvasFiles = Get-ChildItem -Path "$rootPath\src\components\canvas" -Recurse -Include "*.tsx", "*.ts"

Write-Host "Found $($canvasFiles.Count) canvas files to process" -ForegroundColor Cyan

foreach ($file in $canvasFiles) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix store imports
    $content = $content -replace "from '../stores/konvaCanvasStore'", "from '../../features/canvas/stores'"
    $content = $content -replace "from '../../stores'", "from '../../features/canvas/stores'"
    $content = $content -replace "from '../../../stores'", "from '../../features/canvas/stores'"
    
    # Fix type imports
    $content = $content -replace "from './types'", "from '../../../features/canvas/layers/types'"
    $content = $content -replace "from '../components/ConnectorRenderer'", "from '../../../features/canvas/components/ConnectorRenderer'"
    $content = $content -replace "from '../../types/konva.types'", "from '../../../features/canvas/types/konva.types'"
    
    # Fix component imports
    $content = $content -replace "import \{ useCanvasStore \}", "import { useKonvaCanvasStore }"
    $content = $content -replace "useCanvasStore\(\)", "useKonvaCanvasStore()"
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content -NoNewline
        Write-Host "✅ Updated: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "🎯 Import path fixes completed!" -ForegroundColor Green

# Check TypeScript errors after fixes
Write-Host "🔍 Checking TypeScript errors..." -ForegroundColor Blue
Set-Location $rootPath
try {
    $tscOutput = & npx tsc --noEmit 2>&1
    $errorCount = ($tscOutput | Measure-Object -Line).Lines
    Write-Host "📊 TypeScript errors after fixes: $errorCount lines" -ForegroundColor Magenta
} catch {
    Write-Host "Could not run TypeScript check" -ForegroundColor Red
}
