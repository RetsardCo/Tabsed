# Tabsed - Native Windows Binary Build Script (.exe & .msi)
[CmdletBinding()]
param(
    [switch]$DebugBuild = $false,
    [string]$Bundles = "nsis,msi"
)

$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "        Tabsed - Native Windows Binary Compilation (.exe / .msi)       " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

# 1. Locate Rust & Cargo
Write-Host "[1/3] Configuring Rust toolchain..." -ForegroundColor Yellow
$cargoBin = "$env:USERPROFILE\.cargo\bin"
if (Test-Path $cargoBin) {
    if ($env:Path -notlike "*$cargoBin*") {
        $env:Path = "$cargoBin;$env:Path"
    }
}

try {
    $rustcVer = & rustc --version
    Write-Host "  Rust toolchain: $rustcVer" -ForegroundColor Green
} catch {
    Write-Error "Rust compiler (rustc) not found. Please install Rustup: winget install Rustlang.Rustup"
}

# 2. Locate MSVC / Windows SDK tools and libraries
Write-Host "[2/3] Configuring C++ / MSVC toolchain & Windows SDK..." -ForegroundColor Yellow
$scopeVcBase = "C:\Program Files\Microsoft Visual Studio\2022\Community\SDK\ScopeCppSDK\vc15"
if (Test-Path "$scopeVcBase\VC\bin\link.exe") {
    $vcBin = "$scopeVcBase\VC\bin"
    $sdkBin = "$scopeVcBase\SDK\bin"
    $vcLib = "$scopeVcBase\VC\lib"
    $sdkLib = "$scopeVcBase\SDK\lib"

    $includes = @(
        "$scopeVcBase\VC\include",
        "$scopeVcBase\SDK\include\um",
        "$scopeVcBase\SDK\include\shared",
        "$scopeVcBase\SDK\include\ucrt"
    ) -join ";"

    $libs = @($vcLib, $sdkLib) -join ";"

    $env:Path = "$vcBin;$sdkBin;$env:Path"
    $env:INCLUDE = $includes
    $env:LIB = $libs
    Write-Host "  MSVC Linker & SDK: ScopeCppSDK VC15 [CONFIGURED]" -ForegroundColor Green
} else {
    Write-Host "  Standard MSVC detection active" -ForegroundColor Gray
}

# 3. Compile native desktop binary and installer bundles (Tauri executes beforeBuildCommand: npm run build)
Write-Host "[3/3] Compiling native Windows binary and installer bundles ($Bundles)..." -ForegroundColor Yellow
$buildArgs = @("run", "tauri:build", "--", "--bundles", $Bundles)
if ($DebugBuild) {
    $buildArgs += "--debug"
}

& cmd.exe /c "npm $($buildArgs -join ' ')"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tauri build failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "                       Build Completed Successfully!                  " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""

$releaseDir = Join-Path $repoRoot "src-tauri\target\release"
if (Test-Path (Join-Path $releaseDir "tabsed.exe")) {
    $exe = Get-Item (Join-Path $releaseDir "tabsed.exe")
    $hash = (Get-FileHash $exe.FullName -Algorithm SHA256).Hash
    Write-Host "Standalone Binary: $($exe.FullName) ($($exe.Length) bytes)" -ForegroundColor Cyan
    Write-Host "  SHA-256: $hash" -ForegroundColor Gray
}

$bundleDir = Join-Path $releaseDir "bundle"
if (Test-Path $bundleDir) {
    Get-ChildItem -Path $bundleDir -Recurse -File | ForEach-Object {
        $hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash
        Write-Host "Installer Bundle: $($_.FullName) ($($_.Length) bytes)" -ForegroundColor Cyan
        Write-Host "  SHA-256: $hash" -ForegroundColor Gray
    }
}
Write-Host ""
