# Tabsed Environment & Desktop Toolchain Diagnostics (PowerShell)

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          Tabsed - Environment & Desktop Toolchain Diagnostics        " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Node & npm
Write-Host "[1/4] Checking Node.js and npm..." -ForegroundColor Yellow
try {
    $nodeVer = & node --version
    Write-Host "  Node.js: $nodeVer [INSTALLED]" -ForegroundColor Green
} catch {
    Write-Host "  Node.js: NOT FOUND" -ForegroundColor Red
}

try {
    $npmVer = & cmd.exe /c "npm --version"
    Write-Host "  npm: v$npmVer [INSTALLED]" -ForegroundColor Green
} catch {
    Write-Host "  npm: NOT FOUND" -ForegroundColor Red
}

# Rust toolchain
Write-Host ""
Write-Host "[2/4] Checking Rust Toolchain (Required for native desktop .exe)..." -ForegroundColor Yellow
$rustInstalled = $false
try {
    $rustcVer = & rustc --version
    Write-Host "  rustc: $rustcVer [INSTALLED]" -ForegroundColor Green
    $rustInstalled = $true
} catch {
    Write-Host "  rustc: NOT FOUND" -ForegroundColor DarkGray
}

try {
    $cargoVer = & cargo --version
    Write-Host "  cargo: $cargoVer [INSTALLED]" -ForegroundColor Green
} catch {
    Write-Host "  cargo: NOT FOUND" -ForegroundColor DarkGray
}

# Winget
Write-Host ""
Write-Host "[3/4] Checking Windows Package Manager (winget)..." -ForegroundColor Yellow
try {
    $wingetVer = & winget --version
    Write-Host "  winget: $wingetVer [AVAILABLE]" -ForegroundColor Green
} catch {
    Write-Host "  winget: NOT FOUND" -ForegroundColor DarkGray
}

# Recommendations
Write-Host ""
Write-Host "[4/4] Summary & Next Steps:" -ForegroundColor Yellow
if (-not $rustInstalled) {
    Write-Host "  - To run the native desktop shell (.exe) via Tauri:" -ForegroundColor Cyan
    Write-Host "      winget install Rustlang.Rustup" -ForegroundColor White
    Write-Host "      winget install Microsoft.VisualStudio.2022.BuildTools" -ForegroundColor White
    Write-Host "  - To run and explore the full app right now without Rust:" -ForegroundColor Green
    Write-Host "      Run: .\launch-app.bat (or npm run dev)" -ForegroundColor White
} else {
    Write-Host "  - Native toolchain is ready! You can run:" -ForegroundColor Green
    Write-Host "      npm run tauri dev" -ForegroundColor White
}
Write-Host ""
