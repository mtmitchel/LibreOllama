@echo off
REM archive_old_tests.bat

echo Creating archive directory...
if not exist "C:\Projects\LibreOllama\src\tests\_archive" mkdir "C:\Projects\LibreOllama\src\tests\_archive"

echo Moving outdated test files to archive...

if exist "C:\Projects\LibreOllama\src\tests\canvas-rendering-validation.ts" (
    move "C:\Projects\LibreOllama\src\tests\canvas-rendering-validation.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
    echo Moved canvas-rendering-validation.ts
)

if exist "C:\Projects\LibreOllama\src\tests\canvas-sections-advanced-tests.ts" (
    move "C:\Projects\LibreOllama\src\tests\canvas-sections-advanced-tests.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
    echo Moved canvas-sections-advanced-tests.ts
)

if exist "C:\Projects\LibreOllama\src\tests\canvas-sections-validation.ts" (
    move "C:\Projects\LibreOllama\src\tests\canvas-sections-validation.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
    echo Moved canvas-sections-validation.ts
)

if exist "C:\Projects\LibreOllama\src\tests\phase1-test-suite.ts" (
    move "C:\Projects\LibreOllama\src\tests\phase1-test-suite.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
    echo Moved phase1-test-suite.ts
)

if exist "C:\Projects\LibreOllama\src\tests\rich-text-formatting-fixes-test.ts" (
    move "C:\Projects\LibreOllama\src\tests\rich-text-formatting-fixes-test.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
    echo Moved rich-text-formatting-fixes-test.ts
)

if exist "C:\Projects\LibreOllama\src\tests\run-canvas-sections-tests.ts" (
    move "C:\Projects\LibreOllama\src\tests\run-canvas-sections-tests.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
    echo Moved run-canvas-sections-tests.ts
)

if exist "C:\Projects\LibreOllama\src\tests\table-cell-editing-refactor-test.ts" (
    move "C:\Projects\LibreOllama\src\tests\table-cell-editing-refactor-test.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
    echo Moved table-cell-editing-refactor-test.ts
)

if exist "C:\Projects\LibreOllama\src\tests\ts-node-loader.js" (
    move "C:\Projects\LibreOllama\src\tests\ts-node-loader.js" "C:\Projects\LibreOllama\src\tests\_archive\"
    echo Moved ts-node-loader.js
)

echo.
echo Old test files archived successfully!
echo Archive location: C:\Projects\LibreOllama\src\tests\_archive\
pause
