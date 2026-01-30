@echo off
echo ========================================
echo    DeepSea-AI System Verification
echo ========================================
echo.

echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
) else (
    echo ✅ Node.js: 
    node --version
)

echo.
echo 🔍 Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found! Please install Python first.
    pause
    exit /b 1
) else (
    echo ✅ Python: 
    python --version
)

echo.
echo 🔍 Checking dependencies...

if not exist "node_modules" (
    echo ❌ Root dependencies missing! Run: npm install
    pause
    exit /b 1
) else (
    echo ✅ Root dependencies installed
)

if not exist "frontend\node_modules" (
    echo ❌ Frontend dependencies missing! Run: cd frontend && npm install
    pause
    exit /b 1
) else (
    echo ✅ Frontend dependencies installed
)

if not exist "backend\node_modules" (
    echo ❌ Backend dependencies missing! Run: cd backend && npm install
    pause
    exit /b 1
) else (
    echo ✅ Backend dependencies installed
)

echo.
echo 🔍 Checking configuration files...

if not exist ".env" (
    echo ❌ .env file missing!
    pause
    exit /b 1
) else (
    echo ✅ .env file exists
)

if not exist "frontend\vite.config.ts" (
    echo ❌ Vite config missing!
    pause
    exit /b 1
) else (
    echo ✅ Vite config exists
)

echo.
echo 🔍 Checking port availability...
netstat -ano | findstr :5000 >nul
if %errorlevel% equ 0 (
    echo ⚠️ WARNING: Port 5000 is in use! Run cleanup-ports.bat first.
) else (
    echo ✅ Port 5000 is available
)

netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo ⚠️ WARNING: Port 5173 is in use! Run cleanup-ports.bat first.
) else (
    echo ✅ Port 5173 is available
)

echo.
echo ========================================
echo ✅ SYSTEM VERIFICATION COMPLETE!
echo ========================================
echo.
echo Ready to start development!
echo Run: start-dev-safe.bat
echo.
pause