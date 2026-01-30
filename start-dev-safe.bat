@echo off
echo ========================================
echo    DeepSea-AI Safe Development Startup
echo ========================================
echo.

REM Kill any existing Node processes to prevent port conflicts
echo 🧹 Cleaning up existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Check if ports are free
echo 🔍 Checking port availability...
netstat -ano | findstr :5000 >nul
if %errorlevel% equ 0 (
    echo ❌ ERROR: Port 5000 is still in use!
    echo Please manually kill the process or restart your computer.
    pause
    exit /b 1
)

netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo ❌ ERROR: Port 5173 is still in use!
    echo Please manually kill the process or restart your computer.
    pause
    exit /b 1
)

echo ✅ Ports are available
echo.

REM Start backend first
echo 🚀 Starting backend server...
start "DeepSea-AI Backend" cmd /k "cd /d %~dp0 && npm run backend:dev"

REM Wait for backend to start
echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Check if backend is running
curl -f http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend failed to start! Check the backend window for errors.
    pause
    exit /b 1
)

echo ✅ Backend is running
echo.

REM Start frontend
echo 🎨 Starting frontend server...
start "DeepSea-AI Frontend" cmd /k "cd /d %~dp0 && npm run frontend:dev"

echo.
echo ========================================
echo ✅ STARTUP COMPLETE!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:5000
echo 🩺 Health:   http://localhost:5000/api/health
echo.
echo Two command windows should have opened.
echo Close this window when done developing.
echo.
pause