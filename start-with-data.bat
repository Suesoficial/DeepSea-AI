@echo off
echo 🚀 Starting DeepSea-AI Application with Data Visualization
echo.

echo 📊 Seeding database with processed data...
node seed-data.js
echo.

echo 🔧 Starting backend server...
start "DeepSea Backend" cmd /k "cd backend && npm run dev"

echo ⏳ Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo 🎨 Starting frontend development server...
start "DeepSea Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Application started successfully!
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔌 Backend:  http://localhost:5000
echo.
echo Press any key to continue...
pause > nul