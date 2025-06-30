#!/bin/bash

# Canvas Production Readiness Check Script
# Run this locally before pushing to ensure CI will pass

set -e

echo "🚀 Canvas Production Readiness Check"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
npm ci

echo ""
echo "🔍 TypeScript type check..."
npx tsc --noEmit

echo ""
echo "🏗️  Building production bundle..."
NODE_ENV=production npm run build

echo ""
echo "🔍 Checking debug code exclusion..."
if grep -r "CanvasDebugger\|DebugOverlay\|KonvaDebugPanel\|debug-canvas" dist/ 2>/dev/null; then
    echo "❌ FAIL: Debug code found in production build!"
    exit 1
fi
echo "✅ Debug code properly excluded"

echo ""
echo "🔍 Checking file naming conventions..."
MIXED_CASE_DIRS=$(find src/features/canvas/components -type d -name "*[A-Z]*" | grep -v node_modules || true)
if [[ -n "$MIXED_CASE_DIRS" ]]; then
    echo "❌ FAIL: Mixed case directories found: $MIXED_CASE_DIRS"
    exit 1
fi
echo "✅ File naming conventions correct"

echo ""
echo "🔍 Checking for legacy imports..."
if grep -r "from.*RichTextSystem\|from.*createCanvasTestStore\|from.*types/connector[\"']" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo "❌ FAIL: Legacy import paths found!"
    exit 1
fi
echo "✅ No legacy imports found"

echo ""
echo "🔍 Checking circular dependencies..."
npx madge --circular src/ > /dev/null
echo "✅ No circular dependencies"

echo ""
echo "🧪 Running canvas tests..."
npm run test:canvas

echo ""
echo "🎉 SUCCESS! Canvas system is production-ready!"
echo ""
echo "All checks passed:"
echo "  ✓ TypeScript compilation clean"
echo "  ✓ Production build successful"
echo "  ✓ Debug code excluded"
echo "  ✓ File naming consistent"
echo "  ✓ No legacy imports"
echo "  ✓ No circular dependencies"
echo "  ✓ All tests passing"
echo ""
echo "Ready for deployment! 🚀"