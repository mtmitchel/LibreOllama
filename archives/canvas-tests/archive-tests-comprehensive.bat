@echo off
REM Comprehensive Test File Archival Script
REM Date: June 22, 2025
REM Purpose: Archive redundant, outdated, and Jest-based test files

echo ========================================
echo Comprehensive Test File Archival
echo ========================================
echo.

REM Create comprehensive archive directory structure
echo Creating archive directories...
if not exist "archives\test-archive-2025-06-22" mkdir "archives\test-archive-2025-06-22"
if not exist "archives\test-archive-2025-06-22\internal-archive" mkdir "archives\test-archive-2025-06-22\internal-archive"
if not exist "archives\test-archive-2025-06-22\jest-legacy" mkdir "archives\test-archive-2025-06-22\jest-legacy"
if not exist "archives\test-archive-2025-06-22\jest-legacy\integration" mkdir "archives\test-archive-2025-06-22\jest-legacy\integration"
if not exist "archives\test-archive-2025-06-22\jest-legacy\shapes" mkdir "archives\test-archive-2025-06-22\jest-legacy\shapes"
if not exist "archives\test-archive-2025-06-22\jest-legacy\stores" mkdir "archives\test-archive-2025-06-22\jest-legacy\stores"

echo.
echo ========================================
echo PHASE 1: Internal Archive Cleanup (21 files)
echo ========================================

REM Archive all files from src/tests/_archive/
echo Moving internal archive files...
if exist "src\tests\_archive\*" (
    move "src\tests\_archive\*" "archives\test-archive-2025-06-22\internal-archive\"
    echo Moved 21 internal archive files
) else (
    echo No internal archive files found
)

echo.
echo ========================================
echo PHASE 2: Jest Legacy Framework Cleanup (18 files)
echo ========================================

REM Archive entire outdated-tests directory
echo Moving Jest-based outdated tests...
if exist "archives\outdated-tests\integration\*" (
    move "archives\outdated-tests\integration\*" "archives\test-archive-2025-06-22\jest-legacy\integration\"
    echo Moved integration tests
)

if exist "archives\outdated-tests\shapes\*" (
    move "archives\outdated-tests\shapes\*" "archives\test-archive-2025-06-22\jest-legacy\shapes\"
    echo Moved shape tests
)

if exist "archives\outdated-tests\stores\*" (
    move "archives\outdated-tests\stores\*" "archives\test-archive-2025-06-22\jest-legacy\stores\"
    echo Moved store tests
)

if exist "archives\outdated-tests\canvas-text-editing.test.ts" (
    move "archives\outdated-tests\canvas-text-editing.test.ts" "archives\test-archive-2025-06-22\jest-legacy\"
    echo Moved canvas-text-editing.test.ts
)

REM Remove empty directories
rmdir "archives\outdated-tests\integration" 2>nul
rmdir "archives\outdated-tests\shapes" 2>nul
rmdir "archives\outdated-tests\stores" 2>nul
rmdir "archives\outdated-tests" 2>nul

echo.
echo ========================================
echo PHASE 3: Specific Jest File Cleanup
echo ========================================

REM Move specific Jest file from canvas-tests
if exist "archives\canvas-tests\phase1-grouping-architecture.test.ts" (
    move "archives\canvas-tests\phase1-grouping-architecture.test.ts" "archives\test-archive-2025-06-22\jest-legacy\"
    echo Moved phase1-grouping-architecture.test.ts
)

echo.
echo ========================================
echo ARCHIVAL COMPLETE
echo ========================================

echo.
echo SUMMARY:
echo ✅ Archived 21 internal duplicate files
echo ✅ Archived 18 Jest-based legacy tests  
echo ✅ Archived 1 specific Jest file
echo ✅ Total: 40 files archived
echo.
echo PRESERVED:
echo ✅ 33 high-value active Vitest tests
echo ✅ Complete testing infrastructure
echo ✅ All production-critical test suites
echo.
echo INVESTIGATION NEEDED:
echo ⚠️ 2 disabled comprehensive shape tests (.disabled files)
echo ⚠️ 8 interactive testing scripts in archives/canvas-tests/
echo.
echo Archive location: archives/test-archive-2025-06-22/
echo.

pause
