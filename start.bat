@echo off
title ProPath AI — Launcher
color 0A
cls

echo.
echo  =========================================
echo    ProPath AI — Career Intelligence
echo  =========================================
echo.
echo  Starting all services...
echo.

:: 1. Start Ollama in its own window (stays open)
echo  [1/3] Ollama (Qwen3:4b AI)...
start "Ollama AI - DO NOT CLOSE" /MIN cmd /c "ollama serve"
ping -n 4 127.0.0.1 > nul

:: 2. Start Backend in its own window
echo  [2/3] Backend API (port 5000)...
start "ProPath Backend - DO NOT CLOSE" cmd /k "cd /d %~dp0backend && node server.js"
ping -n 4 127.0.0.1 > nul

:: 3. Start Frontend in its own window
echo  [3/3] Frontend UI (port 5173)...
start "ProPath Frontend - DO NOT CLOSE" cmd /k "cd /d %~dp0frontend && npm run dev"
ping -n 5 127.0.0.1 > nul

:: Open browser
start http://localhost:5173

echo.
echo  =========================================
echo   ALL SERVICES STARTED!
echo.
echo   App  ->  http://localhost:5173
echo.
echo   Keep the 3 terminal windows OPEN.
echo   Close them only when done.
echo  =========================================
echo.
pause
