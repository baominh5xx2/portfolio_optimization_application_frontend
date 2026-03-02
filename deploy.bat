@echo off
echo ========================================
echo   FinBot Frontend Deploy Script
echo ========================================
echo.

echo [1/2] Building frontend...
cd /d "%~dp0"
call npm run build

if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Build completed!
echo.
echo ========================================
echo   Deployment Info
echo ========================================
echo.
echo Static files are in: dist\
echo.
echo To preview locally:
echo   npm run preview
echo.
echo To serve with any static server:
echo   npx serve dist
echo.
echo Or use Python:
echo   python -m http.server 8080 --directory dist
echo.
pause
