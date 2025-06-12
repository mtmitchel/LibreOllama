# Canvas Code Export Script
# This script exports all canvas-related code files to a single text file on the desktop

# Get the desktop path
$desktopPath = [Environment]::GetFolderPath("Desktop")
$outputFile = Join-Path $desktopPath "LibreOllama_Canvas_Code_Export.txt"

# Define all canvas-related files
$canvasFiles = @(
    # Main Canvas Component
    "src\pages\Canvas.tsx",
    
    # Canvas Wrapper Component
    "src\components\CanvasWrapper.tsx",
    
    # Canvas Store
    "src\stores\fabricCanvasStore.ts",
    
    # Canvas Components
    "src\components\canvas\CanvasToolbar.tsx",
    "src\components\canvas\PastCanvasesSidebar.tsx",
    "src\components\canvas\TextFormattingToolbar.tsx",
    
    # Canvas Hooks
    "src\hooks\canvas\useFabric.ts",
    "src\hooks\canvas\useCanvasPanning.ts",
    "src\hooks\canvas\useCanvasSelectionEvents.ts",
    "src\hooks\canvas\useCanvasEvents.ts",
    
    # Canvas Libraries
    "src\lib\fabric-element-creation.ts",
    "src\lib\canvas-layers.ts",
    "src\lib\canvas-coordinates.ts",
    
    # Canvas Context
    "src\contexts\FabricCanvasContext.tsx",
    
    # Canvas Tests
    "src\tests\canvas-rendering-validation.ts"
)

# Initialize the output file with header
$header = @"
================================================================================
LIBREOLLAMA CANVAS CODE EXPORT
================================================================================
Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Project: LibreOllama
Export Type: Canvas-Related Code Files
Total Files: $($canvasFiles.Count)
================================================================================

"@

$header | Out-File -FilePath $outputFile -Encoding UTF8

# Function to safely read file content
function Read-FileContent {
    param($filePath)
    
    if (Test-Path $filePath) {
        try {
            return Get-Content $filePath -Raw -Encoding UTF8
        }
        catch {
            return "ERROR: Could not read file - $($_.Exception.Message)"
        }
    }
    else {
        return "ERROR: File not found"
    }
}

# Export each file
$processedCount = 0
$errorCount = 0

foreach ($file in $canvasFiles) {
    $fullPath = Join-Path $PWD $file
    $relativePath = $file -replace '\\', '/'
    
    Write-Host "Processing: $relativePath" -ForegroundColor Cyan
    
    # File header
    $fileHeader = @"


================================================================================
FILE: $relativePath
================================================================================
Path: $fullPath
"@
    
    $fileHeader | Add-Content -Path $outputFile -Encoding UTF8
      # File content
    $content = Read-FileContent $fullPath
    
    if ($null -eq $content -or $content -eq "") {
        $content = "ERROR: File is empty or could not be read"
        Write-Host "  ❌ File is empty or could not be read" -ForegroundColor Red
        $errorCount++
    }
    elseif ($content.StartsWith("ERROR:")) {
        Write-Host "  ❌ $content" -ForegroundColor Red
        $errorCount++
    }
    else {
        Write-Host "  ✅ Exported successfully" -ForegroundColor Green
        $processedCount++
    }
    
    $content | Add-Content -Path $outputFile -Encoding UTF8
}

# Add footer
$footer = @"


================================================================================
EXPORT SUMMARY
================================================================================
Total Files Processed: $($canvasFiles.Count)
Successfully Exported: $processedCount
Errors: $errorCount
Output File: $outputFile
Export Completed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
================================================================================
"@

$footer | Add-Content -Path $outputFile -Encoding UTF8

# Final summary
Write-Host "`n" -NoNewline
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "CANVAS CODE EXPORT COMPLETED" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "Files processed: " -NoNewline
Write-Host "$processedCount" -ForegroundColor Green -NoNewline
Write-Host " / " -NoNewline
Write-Host "$($canvasFiles.Count)" -ForegroundColor Cyan
if ($errorCount -gt 0) {
    Write-Host "Errors: " -NoNewline
    Write-Host "$errorCount" -ForegroundColor Red
}
Write-Host "Output file: " -NoNewline
Write-Host "$outputFile" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Yellow

# Open the output file location
if (Test-Path $outputFile) {
    Write-Host "`nOpening file location..." -ForegroundColor Green
    Start-Process explorer.exe -ArgumentList "/select,`"$outputFile`""
}
else {
    Write-Host "`nERROR: Output file was not created!" -ForegroundColor Red
}
