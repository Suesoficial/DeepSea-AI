@echo off
echo ========================================
echo DeepSea-AI System Test
echo ========================================
echo.

echo Testing backend health...
curl -s http://localhost:5000/api/health
if %errorlevel% neq 0 (
    echo ERROR: Backend not responding
    echo Make sure backend is running on port 5000
    pause
    exit /b 1
)

echo.
echo Backend is healthy!
echo.
echo Testing frontend...
echo Open your browser to: http://localhost:5173
echo.
echo Expected behavior:
echo 1. Upload page should accept FASTA files
echo 2. Analysis should start automatically
echo 3. Progress should reach 100%
echo 4. Results page should show completed analysis
echo 5. Charts and data should be visible
echo.
echo If you see any FAILED jobs, restart the backend server.
echo.
pause