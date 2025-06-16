# Canvas UI Fix Script
# Addresses compatibility and configuration issues

Write-Host "🔧 Fixing Canvas UI Issues..." -ForegroundColor Yellow

# 1. Check current versions
Write-Host "📦 Current package versions:" -ForegroundColor Cyan
npm list react fabric typescript vite

# 2. Clear npm cache to resolve potential module issues
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Cyan
npm cache clean --force

# 3. Remove node_modules and package-lock.json for clean reinstall
Write-Host "🗑️ Removing node_modules for clean reinstall..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

# 4. Install with legacy peer deps to avoid compatibility issues
Write-Host "📥 Installing packages with legacy peer deps..." -ForegroundColor Cyan
npm install --legacy-peer-deps

# 5. Check for TypeScript errors
Write-Host "🔍 Checking TypeScript compilation..." -ForegroundColor Cyan
npx tsc --noEmit

# 6. Start dev server with verbose output
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "If you see any Fabric.js import errors, check the console output below:" -ForegroundColor Yellow
npm run dev
