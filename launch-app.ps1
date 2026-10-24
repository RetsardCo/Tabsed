# Tabsed Launcher for Windows PowerShell
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "                    Tabsed - Launching Application                    " -ForegroundColor Cyan
Write-Host "              'Your tabs, thoughtfully put away.'                     " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Check node
try {
    $nodeVer = & node --version
    Write-Host "[OK] Node.js is ready: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not found on PATH. Please install Node.js." -ForegroundColor Red
    exit 1
}

# Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[...] Installing npm dependencies..." -ForegroundColor Yellow
    & cmd.exe /c "npm install"
} else {
    Write-Host "[OK] Dependencies ready." -ForegroundColor Green
}

# Open browser and run server
Write-Host "[...] Starting Tabsed Vite development server and opening browser..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to terminate." -ForegroundColor Gray
& cmd.exe /c "npm run dev -- --open --port 3000"
