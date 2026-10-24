@echo off
title Tabsed Desktop Launcher
echo ======================================================================
echo                     Tabsed - Launching Application
echo              "Your tabs, thoughtfully put away."
echo ======================================================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org or via:
    echo     winget install OpenJS.NodeJS.LTS
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist "node_modules\" (
    echo node_modules not detected. Running npm install...
    call npm.cmd install
) else (
    echo Dependencies are ready.
)

echo.
echo [2/2] Starting Tabsed server and opening browser...
echo The app will open in your default browser once the server is ready.
echo Press Ctrl+C in this window anytime to stop the server.
echo.
call npm.cmd run dev -- --open --port 3000

pause
