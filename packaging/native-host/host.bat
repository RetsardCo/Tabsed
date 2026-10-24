@echo off
setlocal
set SCRIPT_DIR=%~dp0
if exist "%SCRIPT_DIR%..\..\src-tauri\target\release\tabsed.exe" (
    "%SCRIPT_DIR%..\..\src-tauri\target\release\tabsed.exe" --native-host
) else if exist "%SCRIPT_DIR%tabsed.exe" (
    "%SCRIPT_DIR%tabsed.exe" --native-host
) else (
    node "%SCRIPT_DIR%host.cjs"
)
