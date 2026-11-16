@echo off
title Cloud Payroll System Launcher
echo ===================================================
echo     Starting Cloud-Based Payroll System
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Django Backend on http://127.0.0.1:8000 ...
start "Payroll Backend (Django)" cmd /k "cd /d ""%~dp0backend"" && call venv\Scripts\activate.bat && python manage.py runserver 127.0.0.1:8000"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Vite Frontend on http://localhost:5173 ...
start "Payroll Frontend (Vite)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo Opening http://localhost:5173 in your default browser...
start http://localhost:5173

echo.
echo ===================================================
echo   System is running!
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://localhost:5173
echo ===================================================
pause
