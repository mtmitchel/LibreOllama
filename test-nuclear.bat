@echo off
setlocal enabledelayedexpansion

echo 🔍 Finding canvas.node files...

set "found=0"
for /r "node_modules" %%F in (*.node) do (
    echo "%%F" | findstr /i "canvas" >nul
    if !errorlevel!==0 (
        echo   Found: %%F
        set "found=1"
        echo   Renaming to: %%F.vitest-backup
        if exist "%%F" (
            ren "%%F" "%%~nxF.vitest-backup"
            if !errorlevel!==0 (
                echo   ✅ Disabled: %%~nxF
            ) else (
                echo   ❌ Failed to disable: %%~nxF
            )
        )
    )
)

if "%found%"=="0" (
    echo ❌ No canvas.node files found
    exit /b 1
)

echo.
echo 🧪 Running tests with disabled canvas.node files...
npm test
set "test_result=%errorlevel%"

echo.
echo 🔄 Restoring canvas.node files...
for /r "node_modules" %%F in (*.vitest-backup) do (
    echo "%%F" | findstr /i "canvas" >nul
    if !errorlevel!==0 (
        set "original=%%~dpnF"
        set "original=!original:~0,-14!"
        echo   Restoring: !original!
        if exist "%%F" (
            ren "%%F" "%%~nF"
            if !errorlevel!==0 (
                echo   ✅ Restored: %%~nF
            ) else (
                echo   ❌ Failed to restore: %%~nF
            )
        )
    )
)

echo.
if "%test_result%"=="0" (
    echo ✅ Tests completed successfully!
) else (
    echo ❌ Tests failed with exit code: %test_result%
    exit /b %test_result%
)

exit /b 0
