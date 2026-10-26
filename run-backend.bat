@echo off
title MedVision AI Backend Launcher
cd backend
if not exist venv (
    echo [MedVision] Virtual environment not found. Initializing...
    python -m venv venv
    echo [MedVision] Upgrading pip...
    venv\Scripts\python.exe -m pip install --upgrade pip
    echo [MedVision] Installing dependencies...
    venv\Scripts\python.exe -m pip install -r requirements.txt
)
echo [MedVision] Starting Uvicorn API Server...
venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
if %errorlevel% neq 0 (
    echo [MedVision] Server exited with error code %errorlevel%.
)
pause
