@echo off
echo Starting DeepSea-AI Application...
echo.

REM Check if .env file exists
if not exist ".env" (
    echo WARNING: .env file not found. Creating from template...
    copy ".env.example" ".env"
    echo Please edit .env file with your configuration and restart.
    pause
    exit /b 1
)

REM Check if node_modules exist
if not exist "node_modules" (
    echo ERROR: Dependencies not installed. Please run install-deps.bat first.
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo ERROR: Frontend dependencies not installed. Please run install-deps.bat first.
    pause
    exit /b 1
)

if not exist "backend\node_modules" (
    echo ERROR: Backend dependencies not installed. Please run install-deps.bat first.
    pause
    exit /b 1
)

echo Starting development servers...
echo.
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:5000
echo.

REM Start the development servers
start "DeepSea-AI" cmd /k "npm run dev"

echo.
echo ✅ Application started successfully!
echo.
echo Press Ctrl+C in the opened window to stop the servers.
pause