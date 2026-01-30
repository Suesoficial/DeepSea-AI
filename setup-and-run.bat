@echo off
echo Installing Node.js...
winget install OpenJS.NodeJS
echo.
echo Refreshing PATH...
refreshenv
echo.
echo Installing dependencies...
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
echo.
echo Starting application...
npm run dev