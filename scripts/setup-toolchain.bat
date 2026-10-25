@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo           Tabsed - Environment & Desktop Toolchain Diagnostics
echo ======================================================================
echo.

echo [1/5] Checking Node.js and npm...
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
echo [2/5] Checking Rust Toolchain (Required for native desktop .exe)...
set CARGO_BIN=%USERPROFILE%\.cargo\bin
if exist "%CARGO_BIN%\rustc.exe" (
    set "PATH=%CARGO_BIN%;%PATH%"
)

where rustc >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('rustc --version') do echo   rustc: %%v [INSTALLED]
) else (
    echo   rustc: NOT FOUND. Install via: winget install Rustlang.Rustup
)

where cargo >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('cargo --version') do echo   cargo: %%v [INSTALLED]
) else (
    echo   cargo: NOT FOUND.
)

echo.
echo [3/5] Checking C++ Build Tools & Linker (link.exe)...
set SCOPE_VC=C:\Program Files\Microsoft Visual Studio\2022\Community\SDK\ScopeCppSDK\vc15\VC\bin\link.exe
if exist "%SCOPE_VC%" (
    echo   MSVC Linker: %SCOPE_VC% [CONFIGURED]
) else (
    where link.exe >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        for /f "tokens=*" %%v in ('where link.exe') do echo   MSVC Linker: %%v [INSTALLED]
    ) else (
        echo   MSVC Linker: NOT FOUND. Install via: winget install Microsoft.VisualStudio.2022.BuildTools
    )
)

echo.
echo [4/5] Checking Windows Package Manager (winget)...
where winget >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('winget --version') do echo   winget: %%v [AVAILABLE]
) else (
    echo   winget: NOT FOUND.
)

echo.
echo [5/5] Recommendations:
where cargo >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   All desktop toolchain components are verified!
    echo   To compile native Windows .exe and .msi installers:
    echo     scripts\build-windows.bat
    echo   To launch development desktop shell:
    echo     npm run tauri:dev
) else (
    echo   Install required toolchain packages via:
    echo     winget install Rustlang.Rustup
    echo     winget install Microsoft.VisualStudio.2022.BuildTools
    echo   Or explore Tabsed directly in the browser via:
    echo     launch-app.bat
)

echo.
echo ======================================================================
pause
