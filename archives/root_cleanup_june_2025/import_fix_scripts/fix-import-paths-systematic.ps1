# Canvas Import Path Fix Script
# Fixes the remaining import path issues to complete the consolidation

# This PowerShell script systematically updates import paths

$rootPath = "c:\Projects\LibreOllama"
$errors = 0

Write-Host "🔧 Starting Canvas Import Path Fixes..." -ForegroundColor Green

# Function to update import paths in a file
function Update-ImportPaths {
    param(
        [string]$FilePath,
        [string]$OldImport,
        [string]$NewImport,
        [string]$Description
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match [regex]::Escape($OldImport)) {
            $content = $content -replace [regex]::Escape($OldImport), $NewImport
            Set-Content $FilePath $content -NoNewline
            Write-Host "✅ Fixed: $Description in $FilePath" -ForegroundColor Cyan
            return $true
        }
    }
    return $false
}

# Define import fixes
$importFixes = @(
    @{
        Pattern = "src/components/canvas/**/*.tsx"
        OldImport = "from '../stores/konvaCanvasStore'"
        NewImport = "from '../../features/canvas/stores'"
        Description = "Store import path"
    },
    @{
        Pattern = "src/components/canvas/**/*.tsx"  
        OldImport = "from '../../stores'"
        NewImport = "from '../../features/canvas/stores'"
        Description = "Generic stores import"
    },
    @{
        Pattern = "src/components/canvas/**/*.tsx"
        OldImport = "from './types'"
        NewImport = "from '../../../features/canvas/layers/types'"
        Description = "Layer types import"
    }
)

# Apply fixes to each file pattern
foreach ($fix in $importFixes) {
    $pattern = $fix.Pattern -replace "\*\*", "*" -replace "/", "\"
    $files = Get-ChildItem -Path $rootPath -Recurse -Include "*.tsx", "*.ts" | Where-Object { 
        $_.FullName -like "*components\canvas*" 
    }
    
    foreach ($file in $files) {
        $updated = Update-ImportPaths -FilePath $file.FullName -OldImport $fix.OldImport -NewImport $fix.NewImport -Description $fix.Description
        if (-not $updated) {
            $errors++
        }
    }
}

Write-Host "🎯 Import path fixes completed. Errors remaining: $errors" -ForegroundColor Yellow

# Check TypeScript errors after fixes
Write-Host "🔍 Checking TypeScript errors..." -ForegroundColor Blue
Set-Location $rootPath
$tscOutput = & npx tsc --noEmit 2>&1
$errorCount = ($tscOutput | Measure-Object -Line).Lines

Write-Host "📊 TypeScript errors after fixes: $errorCount lines" -ForegroundColor Magenta

if ($errorCount -lt 200) {
    Write-Host "🎉 Major progress! Error count significantly reduced!" -ForegroundColor Green
} else {
    Write-Host "⚠️  More fixes needed. Running additional diagnostics..." -ForegroundColor Yellow
}
