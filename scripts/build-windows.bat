@echo off
setlocal
echo Starting Tabsed native Windows compilation...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-windows.ps1" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed with error code %ERRORLEVEL%.
    if not defined CI pause
    exit /b %ERRORLEVEL%
)
echo.
if not defined CI pause
