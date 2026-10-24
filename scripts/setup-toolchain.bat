@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo           Tabsed - Environment & Desktop Toolchain Diagnostics
echo ======================================================================
echo.

echo [1/4] Checking Node.js and npm...
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('node --version') do echo   Node.js: %%v [INSTALLED]
) else (
    echo   Node.js: NOT FOUND. Install via: winget install OpenJS.NodeJS.LTS
)

where npm.cmd >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('npm.cmd --version') do echo   npm: %%v [INSTALLED]
) else (
    echo   npm: NOT FOUND.
)

echo.
echo [2/4] Checking Rust Toolchain (Required for native desktop .exe)...
where rustc >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('rustc --version') do echo   rustc: %%v [INSTALLED]
) else (
    echo   rustc: NOT FOUND.
)

where cargo >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('cargo --version') do echo   cargo: %%v [INSTALLED]
) else (
    echo   cargo: NOT FOUND.
)

echo.
echo [3/4] Checking Windows Package Manager (winget)...
where winget >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('winget --version') do echo   winget: %%v [AVAILABLE]
) else (
    echo   winget: NOT FOUND.
)

echo.
echo [4/4] Recommendations:
where cargo >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   To compile native Windows .exe with Tauri and Mica transparency:
    echo     1. Install Rust via winget:
    echo          winget install Rustlang.Rustup
    echo     2. Or download installer: https://rustup.rs
    echo     3. Install Visual Studio 2022 C++ Build Tools:
    echo          winget install Microsoft.VisualStudio.2022.BuildTools
    echo.
    echo   Note: Tabsed works right now in your browser without Rust:
    echo     Double-click "launch-app.bat" or run "npm run dev"
) else (
    echo   All desktop toolchain components are installed!
    echo   You can build the native desktop app with:
    echo     npm run tauri dev
    echo     npm run tauri build
)

echo.
echo ======================================================================
pause
