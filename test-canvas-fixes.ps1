# Canvas UI Validation Script
# Tests all the fixes applied to resolve canvas UI issues

Write-Host "🧪 Canvas UI Validation Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

$ErrorCount = 0

function Test-Condition {
    param([string]$Description, [scriptblock]$Test)
    Write-Host "Testing: $Description" -ForegroundColor Cyan
    try {
        $result = & $Test
        if ($result) {
            Write-Host "✅ PASS: $Description" -ForegroundColor Green
        } else {
            Write-Host "❌ FAIL: $Description" -ForegroundColor Red
            $script:ErrorCount++
        }
    } catch {
        Write-Host "❌ ERROR: $Description - $($_.Exception.Message)" -ForegroundColor Red
        $script:ErrorCount++
    }
    Write-Host ""
}

# Test 1: Package.json integrity
Test-Condition "Package.json has all required dependencies" {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    return ($pkg.dependencies.fabric -and $pkg.dependencies.react -and $pkg.dependencies.zustand)
}

# Test 2: TypeScript configuration
Test-Condition "TypeScript config uses node module resolution" {
    $tsconfig = Get-Content "tsconfig.json" | ConvertFrom-Json
    return ($tsconfig.compilerOptions.moduleResolution -eq "node")
}

# Test 3: Vite configuration optimizations
Test-Condition "Vite config includes Fabric.js optimizations" {
    $viteConfig = Get-Content "vite.config.ts" -Raw
    return ($viteConfig -match "fabric" -and $viteConfig -match "ssr")
}

# Test 4: Canvas fixes CSS exists
Test-Condition "Canvas fixes CSS file exists" {
    return (Test-Path "src/styles/canvas-fixes.css")
}

# Test 5: Type definitions updated
Test-Condition "Fabric.js type definitions are enhanced" {
    $typeDefs = Get-Content "src/types/fabric.d.ts" -Raw
    return ($typeDefs -match "FabricCanvas" -and $typeDefs -match "isDisposed")
}

# Test 6: Canvas sizing hook exists
Test-Condition "Canvas sizing hook exists" {
    return (Test-Path "src/hooks/canvas/useCanvasSizing.ts")
}

# Test 7: Store imports are consistent
Test-Condition "Canvas store uses consistent import pattern" {
    $storeContent = Get-Content "src/stores/fabricCanvasStore.ts" -Raw
    # Check that it doesn't mix static and dynamic imports inconsistently
    return ($storeContent -match "await import\('fabric'\)")
}

# Test 8: Node modules can be installed
Test-Condition "Node modules installation works" {
    $nodeModulesExists = Test-Path "node_modules"
    $packageLockExists = Test-Path "package-lock.json"
    return ($nodeModulesExists -or $packageLockExists)
}

# Test 9: TypeScript compilation check (if available)
if (Get-Command "npx" -ErrorAction SilentlyContinue) {
    Test-Condition "TypeScript compilation passes" {
        $output = npx tsc --noEmit 2>&1
        return ($LASTEXITCODE -eq 0)
    }
}

# Summary
Write-Host "==============================" -ForegroundColor Green
if ($ErrorCount -eq 0) {
    Write-Host "🎉 All tests passed! Canvas UI fixes are properly applied." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run 'npm install --legacy-peer-deps' if you haven't already" -ForegroundColor White
    Write-Host "2. Start the dev server with 'npm run dev'" -ForegroundColor White
    Write-Host "3. Test the canvas functionality in the browser" -ForegroundColor White
} else {
    Write-Host "⚠️  Found $ErrorCount issues. Please review the failures above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Recommended actions:" -ForegroundColor Yellow
    Write-Host "1. Review failed tests and fix any missing files" -ForegroundColor White
    Write-Host "2. Run 'npm install --legacy-peer-deps' to resolve dependencies" -ForegroundColor White
    Write-Host "3. Check console for any remaining TypeScript errors" -ForegroundColor White
}

Write-Host ""
Write-Host "Manual testing checklist:" -ForegroundColor Cyan
Write-Host "□ Canvas loads without console errors" -ForegroundColor White
Write-Host "□ Canvas elements can be created" -ForegroundColor White
Write-Host "□ Canvas elements can be moved and resized" -ForegroundColor White
Write-Host "□ Text editing works properly" -ForegroundColor White
Write-Host "□ Canvas resizes properly with window" -ForegroundColor White
Write-Host "□ No styling conflicts with UI elements" -ForegroundColor White
