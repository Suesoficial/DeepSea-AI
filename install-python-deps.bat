@echo off
echo Installing Python dependencies for DeepSea AI Pipeline...
echo.

cd pipeline\scripts

echo Installing requirements from requirements.txt...
python -m pip install -r requirements.txt

echo.
echo Python dependencies installation complete!
echo.
pause