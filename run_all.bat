@echo off

rem === Backend ===
cd D:\med-vision-ai-clarity\backend
call venv\Scripts\activate.bat
rem Start FastAPI server in a new window
start "Backend" uvicorn app.main:app --host 0.0.0.0 --port 8000

rem === Frontend ===
cd D:\med-vision-ai-clarity\clarity-xray-ai
rem Install dependencies if needed
if not exist node_modules (npm install)
rem Start Vite dev server in a new window
start "Frontend" npm run dev
