# PowerShell script to export all src-tauri source files to desktop
# Excludes build artifacts and clutter files

# Get desktop path
$desktopPath = [Environment]::GetFolderPath("Desktop")
$outputFile = Join-Path $desktopPath "tauri-sources-export.txt"

# Define directories and files to exclude
$excludedDirs = @(
    "target",
    "node_modules", 
    ".git",
    "dist",
    "build",
    ".vscode",
    ".idea",
    "gen"
)

$excludedFiles = @(
    "*.lock",
    "*.exe",
    "*.dll",
    "*.so",
    "*.dylib",
    "*.pdb",
    "*.obj",
    "*.o",
    "*.a",
    "*.lib",
    "*.log",
    "*.tmp",
    "*.temp"
)

# Get the src-tauri directory path
$srcTauriPath = "C:\Projects\LibreOllama\src-tauri"

Write-Host "Exporting src-tauri source files to: $outputFile"
Write-Host "Source directory: $srcTauriPath"

# Initialize the output file
"# LibreOllama Tauri Backend Source Code Export" | Out-File -FilePath $outputFile -Encoding UTF8
"# Generated on: $(Get-Date)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"# Source directory: $srcTauriPath" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"=" * 80 | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8

# Function to check if a path should be excluded
function Should-Exclude {
    param($path, $name)
    
    # Check if any parent directory is in excluded list
    foreach ($excludedDir in $excludedDirs) {
        if ($path -like "*\$excludedDir\*" -or $path -like "*/$excludedDir/*") {
            return $true
        }
    }
    
    # Check if file matches excluded patterns
    foreach ($excludedFile in $excludedFiles) {
        if ($name -like $excludedFile) {
            return $true
        }
    }
    
    return $false
}

# Get all files recursively, excluding specified directories and files
$allFiles = Get-ChildItem -Path $srcTauriPath -Recurse -File | Where-Object {
    -not (Should-Exclude $_.FullName $_.Name)
}

$fileCount = 0
$totalFiles = $allFiles.Count

Write-Host "Found $totalFiles source files to export..."

foreach ($file in $allFiles) {
    $fileCount++
    $relativePath = $file.FullName.Replace($srcTauriPath, "").TrimStart('\', '/')
    
    Write-Host "Processing [$fileCount/$totalFiles]: $relativePath"
    
    # Write file header
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "# File: $relativePath" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "# Full path: $($file.FullName)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "# Size: $($file.Length) bytes" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "# Modified: $($file.LastWriteTime)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "-" * 80 | Out-File -FilePath $outputFile -Append -Encoding UTF8
    
    try {
        # Try to read file as text
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
        
        # Check if content is likely binary (contains null bytes)
        if ($content -match "`0") {
            "[BINARY FILE - Content not displayed]" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        } else {
            # Write the actual file content
            $content | Out-File -FilePath $outputFile -Append -Encoding UTF8
        }
    }
    catch {
        "[ERROR READING FILE: $($_.Exception.Message)]" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    }
    
    # Add separator
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "=" * 80 | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
}

# Write summary
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"# EXPORT SUMMARY" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"# Total files exported: $fileCount" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"# Export completed: $(Get-Date)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"# Output file size: $((Get-Item $outputFile).Length) bytes" | Out-File -FilePath $outputFile -Append -Encoding UTF8

Write-Host ""
Write-Host "Export completed successfully!" -ForegroundColor Green
Write-Host "Output file: $outputFile" -ForegroundColor Cyan
Write-Host "Total files exported: $fileCount" -ForegroundColor Yellow
Write-Host "File size: $((Get-Item $outputFile).Length) bytes" -ForegroundColor Yellow

# Open the output file location
Write-Host "Opening output file location..." -ForegroundColor Cyan
Start-Process "explorer.exe" -ArgumentList "/select,`"$outputFile`"" 