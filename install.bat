@echo off
title MedVision AI Setup & Repair
cd backend
if exist venv (
    echo [MedVision] Found existing virtual environment. Re-creating to fix hardcoded paths...
    rmdir /s /q venv
)
echo [MedVision] Creating clean Python virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create virtual environment. Ensure Python is installed and in your PATH.
    pause
    exit /b %errorlevel%
)
echo [MedVision] Upgrading pip...
venv\Scripts\python.exe -m pip install --upgrade pip
echo [MedVision] Installing clinical dependencies (this may take a few minutes)...
venv\Scripts\python.exe -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b %errorlevel%
)
echo [MedVision] Setup complete! You can now launch the server using run-backend.bat.
pause
