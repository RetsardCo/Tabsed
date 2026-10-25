# Tabsed Environment & Desktop Toolchain Diagnostics (PowerShell)

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          Tabsed - Environment & Desktop Toolchain Diagnostics        " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Node & npm
Write-Host "[1/5] Checking Node.js and npm..." -ForegroundColor Yellow
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
Write-Host "[2/5] Checking Rust Toolchain (Required for native desktop .exe)..." -ForegroundColor Yellow
$cargoBin = "$env:USERPROFILE\.cargo\bin"
if (Test-Path $cargoBin -and $env:Path -notlike "*$cargoBin*") {
    $env:Path = "$cargoBin;$env:Path"
}

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

# MSVC & Windows SDK
Write-Host ""
Write-Host "[3/5] Checking C++ Build Tools & Linker (link.exe)..." -ForegroundColor Yellow
$msvcFound = $false
$scopeVcBase = "C:\Program Files\Microsoft Visual Studio\2022\Community\SDK\ScopeCppSDK\vc15"
if (Test-Path "$scopeVcBase\VC\bin\link.exe") {
    Write-Host "  MSVC Linker: $scopeVcBase\VC\bin\link.exe [CONFIGURED]" -ForegroundColor Green
    $msvcFound = $true
} elseif (Get-Command link.exe -ErrorAction SilentlyContinue) {
    $linkCmd = (Get-Command link.exe).Source
    Write-Host "  MSVC Linker: $linkCmd [INSTALLED]" -ForegroundColor Green
    $msvcFound = $true
} else {
    Write-Host "  MSVC Linker: NOT FOUND" -ForegroundColor DarkGray
}

# Winget
Write-Host ""
Write-Host "[4/5] Checking Windows Package Manager (winget)..." -ForegroundColor Yellow
try {
    $wingetVer = & winget --version
    Write-Host "  winget: $wingetVer [AVAILABLE]" -ForegroundColor Green
} catch {
    Write-Host "  winget: NOT FOUND" -ForegroundColor DarkGray
}

# Recommendations
Write-Host ""
Write-Host "[5/5] Summary & Next Steps:" -ForegroundColor Yellow
if (-not $rustInstalled) {
    Write-Host "  - To compile native desktop binaries (.exe / .msi):" -ForegroundColor Cyan
    Write-Host "      winget install Rustlang.Rustup" -ForegroundColor White
}
if (-not $msvcFound) {
    Write-Host "  - To install C++ build tools for MSVC:" -ForegroundColor Cyan
    Write-Host "      winget install Microsoft.VisualStudio.2022.BuildTools" -ForegroundColor White
}
if ($rustInstalled -and $msvcFound) {
    Write-Host "  - Native toolchain is fully configured and ready!" -ForegroundColor Green
    Write-Host "      To compile .exe & .msi: .\scripts\build-windows.bat" -ForegroundColor White
    Write-Host "      To run native dev shell: npm run tauri:dev" -ForegroundColor White
} else {
    Write-Host "  - To run and explore the full app in your browser right now:" -ForegroundColor Green
    Write-Host "      Run: .\launch-app.bat (or npm run dev)" -ForegroundColor White
}
Write-Host ""
