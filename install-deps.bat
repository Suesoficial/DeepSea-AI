@echo off
echo Installing DeepSea-AI Dependencies...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed. Please install Python first.
    pause
    exit /b 1
)

echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo Installing Python dependencies...
cd pipeline\scripts
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo WARNING: Failed to install some Python dependencies
    echo You may need to install them manually
)
cd ..\..

REM Create necessary directories
echo Creating data directories...
if not exist "backend\data\raw" mkdir "backend\data\raw"
if not exist "backend\data\processed" mkdir "backend\data\processed"
if not exist "pipeline\data\raw" mkdir "pipeline\data\raw"
if not exist "pipeline\data\processed" mkdir "pipeline\data\processed"

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy ".env.example" ".env"
)

echo.
echo ✅ Installation completed successfully!
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Run start-project.bat to start the application
echo.
pause