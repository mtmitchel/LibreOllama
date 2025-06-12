# Append missing useCanvasEvents.ts to the canvas export file
$desktopPath = [Environment]::GetFolderPath("Desktop")
$outputFile = Join-Path $desktopPath "LibreOllama_Canvas_Code_Export.txt"

$missingFile = "src\hooks\canvas\useCanvasEvents.ts"
$fullPath = Join-Path $PWD $missingFile

Write-Host "Appending missing file: $missingFile" -ForegroundColor Cyan

if (Test-Path $fullPath) {
    $fileHeader = @"


================================================================================
FILE: src/hooks/canvas/useCanvasEvents.ts
================================================================================
Path: $fullPath
"@
    
    $fileHeader | Add-Content -Path $outputFile -Encoding UTF8
    
    try {
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        $content | Add-Content -Path $outputFile -Encoding UTF8
        Write-Host "✅ Successfully appended useCanvasEvents.ts" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error reading file: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "❌ File not found: $fullPath" -ForegroundColor Red
}

Write-Host "`nCanvas export file updated: $outputFile" -ForegroundColor Cyan
