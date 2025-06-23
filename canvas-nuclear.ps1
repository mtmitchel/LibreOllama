# PowerShell script to temporarily disable canvas.node files during testing
param(
    [string]$Action = "disable"
)

$canvasNodeFiles = @()
$backupExtension = ".vitest-backup"

# Find all canvas.node files in node_modules
Write-Host "🔍 Searching for canvas.node files..." -ForegroundColor Cyan

Get-ChildItem -Path "node_modules" -Recurse -Include "*.node" -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.Name -match "canvas" -or $_.DirectoryName -match "canvas") {
        $canvasNodeFiles += $_.FullName
        Write-Host "  Found: $($_.FullName)" -ForegroundColor Yellow
    }
}

if ($canvasNodeFiles.Count -eq 0) {
    Write-Host "❌ No canvas.node files found" -ForegroundColor Red
    exit 1
}

function Disable-CanvasNodes {
    Write-Host "🚫 Disabling canvas.node files..." -ForegroundColor Cyan
    
    foreach ($file in $canvasNodeFiles) {
        if (Test-Path $file) {
            $backupFile = "$file$backupExtension"
            if (-not (Test-Path $backupFile)) {
                Move-Item $file $backupFile -Force
                Write-Host "  ✅ Disabled: $(Split-Path $file -Leaf)" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  Already disabled: $(Split-Path $file -Leaf)" -ForegroundColor Yellow
            }
        }
    }
}

function Restore-CanvasNodes {
    Write-Host "🔄 Restoring canvas.node files..." -ForegroundColor Cyan
    
    foreach ($file in $canvasNodeFiles) {
        $backupFile = "$file$backupExtension"
        if (Test-Path $backupFile) {
            Move-Item $backupFile $file -Force
            Write-Host "  ✅ Restored: $(Split-Path $file -Leaf)" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  No backup found: $(Split-Path $file -Leaf)" -ForegroundColor Yellow
        }
    }
}

function Run-Tests {
    Write-Host "🧪 Running tests with disabled canvas.node files..." -ForegroundColor Cyan
    
    # Disable files
    Disable-CanvasNodes
    
    try {
        # Run the test suite
        & npm test
        $testResult = $LASTEXITCODE
    }
    finally {
        # Always restore files, even if tests fail
        Write-Host "🔄 Restoring files..." -ForegroundColor Cyan
        Restore-CanvasNodes
    }
    
    if ($testResult -eq 0) {
        Write-Host "✅ Tests completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Tests failed with exit code: $testResult" -ForegroundColor Red
        exit $testResult
    }
}

# Main execution
if ($Action -eq "disable") {
    Disable-CanvasNodes
} elseif ($Action -eq "restore") {
    Restore-CanvasNodes
} elseif ($Action -eq "test") {
    Run-Tests
} else {
    Write-Host "❌ Invalid action. Use 'disable', 'restore', or 'test'" -ForegroundColor Red
    Write-Host "Usage examples:" -ForegroundColor Cyan
    Write-Host "  .\canvas-nuclear.ps1 -Action disable   # Disable canvas.node files" -ForegroundColor White
    Write-Host "  .\canvas-nuclear.ps1 -Action restore   # Restore canvas.node files" -ForegroundColor White
    Write-Host "  .\canvas-nuclear.ps1 -Action test      # Run tests with disabled files" -ForegroundColor White
    exit 1
}
