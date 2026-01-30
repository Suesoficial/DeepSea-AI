@echo off
echo ========================================
echo Starting DeepSea-AI Application
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:   http://localhost:5000
echo.
echo Press Ctrl+C to stop both servers
echo ========================================
echo.

:: Start backend in background
echo Starting Backend Server...
start "DeepSea-AI Backend" cmd /k "cd backend && npm run dev"

:: Wait a moment for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend in background
echo Starting Frontend Server...
start "DeepSea-AI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Frontend will be available at: http://localhost:5173
echo Backend API available at: http://localhost:5000
echo.
echo Close this window or press any key to continue...
pause > nul