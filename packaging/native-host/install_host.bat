@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   Tabsed Native Messaging Host Registration (Windows BAT)
echo ============================================================
echo.

set SCRIPT_DIR=%~dp0
set CHROMIUM_MANIFEST=%SCRIPT_DIR%com.tabsed.app.json
set FIREFOX_MANIFEST=%SCRIPT_DIR%com.tabsed.app-firefox.json
set HOST_BAT=%SCRIPT_DIR%host.bat

echo Registering Google Chrome...
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tabsed.app" /ve /t REG_SZ /d "%CHROMIUM_MANIFEST%" /f
if %ERRORLEVEL% EQU 0 (
    echo [OK] Registered Chrome native messaging host.
) else (
    echo [WARN] Failed to register Chrome host.
)

echo Registering Microsoft Edge...
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.tabsed.app" /ve /t REG_SZ /d "%CHROMIUM_MANIFEST%" /f
if %ERRORLEVEL% EQU 0 (
    echo [OK] Registered Microsoft Edge native messaging host.
) else (
    echo [WARN] Failed to register Edge host.
)

echo Registering Mozilla Firefox...
reg add "HKCU\Software\Mozilla\NativeMessagingHosts\com.tabsed.app" /ve /t REG_SZ /d "%FIREFOX_MANIFEST%" /f
if %ERRORLEVEL% EQU 0 (
    echo [OK] Registered Mozilla Firefox native messaging host.
) else (
    echo [WARN] Failed to register Firefox host.
)

echo.
echo Registration complete! You can now use the browser extension.
pause
