@echo off
echo ========================================
echo    DeepSea-AI Port Cleanup Utility
echo ========================================
echo.

echo 🔍 Checking current port usage...
echo.

echo Port 5000 (Backend):
netstat -ano | findstr :5000
echo.

echo Port 5173 (Frontend):
netstat -ano | findstr :5173
echo.

echo 🧹 Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Node.js processes terminated
) else (
    echo ℹ️ No Node.js processes were running
)

echo.
echo ⏳ Waiting for ports to be released...
timeout /t 3 /nobreak >nul

echo.
echo 🔍 Checking ports again...
netstat -ano | findstr :5000
netstat -ano | findstr :5173

echo.
echo ✅ Port cleanup complete!
echo You can now run start-dev-safe.bat
echo.
pause