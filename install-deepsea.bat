@echo off
echo ========================================
echo DeepSea-AI Installation Script
echo ========================================
echo.

echo [1/4] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend dependency installation failed
    pause
    exit /b 1
)
cd ..

echo.
echo [2/4] Installing Frontend Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependency installation failed
    pause
    exit /b 1
)
cd ..

echo.
echo [3/4] Creating Required Directories...
if not exist "data" mkdir data
if not exist "data\raw" mkdir data\raw
if not exist "data\processed" mkdir data\processed

echo.
echo [4/4] Setting up Environment...
if not exist "frontend\.env.development" (
    echo Creating frontend environment file...
    echo # Development Environment - Real API Mode > frontend\.env.development
    echo VITE_API_URL= >> frontend\.env.development
    echo VITE_DEV_MODE=true >> frontend\.env.development
    echo VITE_DEMO_MODE=false >> frontend\.env.development
    echo VITE_HEALTH_CHECK_ENABLED=true >> frontend\.env.development
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo To start the application:
echo   1. Run: start-deepsea.bat
echo   2. Open: http://localhost:5173
echo.
echo Backend API will be available at: http://localhost:5000
echo.
pause