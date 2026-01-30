@echo off
echo Starting DeepSea AI Development Servers...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173 (or next available port)
echo.
echo Press any key to exit...
pause > nul