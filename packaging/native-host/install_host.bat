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

set STORE_ARG=%~1
if not "%STORE_ARG%"=="" (
    echo Forwarding extension ID / arguments: %*
)

if exist "%SCRIPT_DIR%install_host.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install_host.ps1" %*
    set PS_EXIT=!ERRORLEVEL!
    if !PS_EXIT! NEQ 0 (
        echo [ERROR] Native messaging host registration failed with exit code !PS_EXIT!.
        exit /b !PS_EXIT!
    )
) else (
    echo Registering Google Chrome...
    reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tabsed.app" /ve /t REG_SZ /d "%CHROMIUM_MANIFEST%" /f
    if !ERRORLEVEL! EQU 0 (
        echo [OK] Registered Chrome native messaging host.
    ) else (
        echo [WARN] Failed to register Chrome host.
    )

    echo Registering Microsoft Edge...
    reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.tabsed.app" /ve /t REG_SZ /d "%CHROMIUM_MANIFEST%" /f
    if !ERRORLEVEL! EQU 0 (
        echo [OK] Registered Microsoft Edge native messaging host.
    ) else (
        echo [WARN] Failed to register Edge host.
    )

    echo Registering Mozilla Firefox...
    reg add "HKCU\Software\Mozilla\NativeMessagingHosts\com.tabsed.app" /ve /t REG_SZ /d "%FIREFOX_MANIFEST%" /f
    if !ERRORLEVEL! EQU 0 (
        echo [OK] Registered Mozilla Firefox native messaging host.
    ) else (
        echo [WARN] Failed to register Firefox host.
    )
)

echo.
echo Registration complete! You can now use the browser extension.
echo Tip: To register an Edge Add-ons Store ID after publishing:
echo      install_host.bat [STORE_EXTENSION_ID]
if "%~1"=="" if not defined CI pause


