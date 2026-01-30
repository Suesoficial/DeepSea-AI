@echo off
echo 🌊 Starting DeepSea-AI Application...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install root dependencies
        pause
        exit /b 1
    )
)

if not exist "frontend\\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
)

if not exist "backend\\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo 🔧 Creating environment configuration...
    copy ".env.example" ".env"
)

echo.
echo ✅ Starting servers...
echo 🔗 Frontend: http://localhost:5173
echo 🔗 Backend:  http://localhost:5000
echo.
echo Press Ctrl+C to stop the servers
echo.

REM Start both servers concurrently
start "DeepSea-AI Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "DeepSea-AI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo 🚀 DeepSea-AI is starting up...
echo Check the opened terminal windows for server status
pause