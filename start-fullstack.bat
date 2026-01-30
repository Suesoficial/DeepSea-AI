@echo off
echo 🌊 Starting DeepSea-AI Full-Stack Application...
echo.

REM Kill any existing processes on ports 5000 and 5173
echo Clearing ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /PID %%a /F >nul 2>&1

REM Start backend first
echo 🔧 Starting backend server on port 5000...
start "DeepSea-AI Backend" cmd /k "cd backend && npm run dev"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start frontend
echo 🎨 Starting frontend server on port 5173...
start "DeepSea-AI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Both servers are starting up...
echo.
echo 🔗 Frontend: http://localhost:5173
echo 🔗 Backend:  http://localhost:5000
echo 🔗 Health:   http://localhost:5000/api/health
echo.
echo Press any key to open the application in your browser...
pause >nul
start http://localhost:5173