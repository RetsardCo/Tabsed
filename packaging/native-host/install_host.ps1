param(
    [Parameter(Position = 0)]
    [Alias("ExtensionId", "Id")]
    [string]$CustomExtensionId,

    [Alias("EdgeExtensionId", "StoreExtensionId", "StoreId")]
    [string]$EdgeStoreId,

    [Alias("ChromeExtensionId")]
    [string]$ChromeStoreId,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$AdditionalExtensionIds
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ChromiumManifestPath = Join-Path $ScriptDir "com.tabsed.app.json"
$FirefoxManifestPath = Join-Path $ScriptDir "com.tabsed.app-firefox.json"
$HostBatPath = Join-Path $ScriptDir "host.bat"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Tabsed Native Messaging Host Registration for Windows" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Host Directory: $ScriptDir"

# Discover compiled or installed tabsed.exe binary
$CandidateExePaths = @(
    (Join-Path $ScriptDir "tabsed.exe"),
    (Join-Path $ScriptDir "..\..\src-tauri\target\release\tabsed.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\Tabsed\tabsed.exe"),
    (Join-Path $env:ProgramFiles "Tabsed\tabsed.exe")
)

$DiscoveredExe = $null
foreach ($cand in $CandidateExePaths) {
    if (Test-Path $cand) {
        $DiscoveredExe = (Resolve-Path $cand).Path
        break
    }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Normalize-ExtensionId {
    param([string]$RawId)
    if ([string]::IsNullOrWhiteSpace($RawId)) { return $null }
    $id = $RawId.Trim().ToLower()
    $id = $id -replace '^chrome-extension://', ''
    $id = $id.Trim('/')
    $id = $id -replace '[^a-z0-9]', ''
    return $id
}

# Configure Chromium manifest
if (Test-Path $ChromiumManifestPath) {
    $chromiumJson = Get-Content -Raw -Path $ChromiumManifestPath | ConvertFrom-Json
    if ($DiscoveredExe) {
        $chromiumJson.path = $DiscoveredExe
        Write-Host "Pointed Chromium manifest to: $DiscoveredExe" -ForegroundColor Green
    } else {
        $chromiumJson.path = "host.bat"
        Write-Host "Using host.bat wrapper: $HostBatPath" -ForegroundColor Yellow
    }

    # Gather any requested extension IDs to register (custom, Edge Store, Chrome Store, additional)
    $idsToRegister = @()
    if ($CustomExtensionId) { $idsToRegister += $CustomExtensionId }
    if ($EdgeStoreId) { $idsToRegister += $EdgeStoreId }
    if ($ChromeStoreId) { $idsToRegister += $ChromeStoreId }
    if ($AdditionalExtensionIds) { $idsToRegister += $AdditionalExtensionIds }

    foreach ($rawId in $idsToRegister) {
        $cleanId = Normalize-ExtensionId $rawId
        if ($cleanId) {
            $origin = "chrome-extension://$cleanId/"
            if ($chromiumJson.allowed_origins -notcontains $origin) {
                $chromiumJson.allowed_origins += $origin
                Write-Host "[OK] Added extension origin: $origin" -ForegroundColor Green
            } else {
                Write-Host "[INFO] Extension origin already registered: $origin" -ForegroundColor Gray
            }
        }
    }

    $jsonContent = $chromiumJson | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText($ChromiumManifestPath, $jsonContent, $utf8NoBom)

    Write-Host "`nRegistered Chromium Allowed Origins (Edge & Chrome):" -ForegroundColor Cyan
    foreach ($orig in $chromiumJson.allowed_origins) {
        Write-Host "  - $orig" -ForegroundColor Gray
    }
}

# Configure Firefox manifest
if (Test-Path $FirefoxManifestPath) {
    $firefoxJson = Get-Content -Raw -Path $FirefoxManifestPath | ConvertFrom-Json
    if ($DiscoveredExe) {
        $firefoxJson.path = $DiscoveredExe
        Write-Host "Pointed Firefox manifest to: $DiscoveredExe" -ForegroundColor Green
    } else {
        $firefoxJson.path = "host.bat"
    }
    $jsonContent = $firefoxJson | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText($FirefoxManifestPath, $jsonContent, $utf8NoBom)
}

# Registry locations (User-level registration, does not require Admin privileges)
$RegistryTargets = @(
    @{
        Name = "Google Chrome"
        Path = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.tabsed.app"
        Manifest = $ChromiumManifestPath
    },
    @{
        Name = "Microsoft Edge"
        Path = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.tabsed.app"
        Manifest = $ChromiumManifestPath
    },
    @{
        Name = "Mozilla Firefox"
        Path = "HKCU:\Software\Mozilla\NativeMessagingHosts\com.tabsed.app"
        Manifest = $FirefoxManifestPath
    }
)

foreach ($target in $RegistryTargets) {
    try {
        if (-not (Test-Path $target.Path)) {
            New-Item -Path $target.Path -Force | Out-Null
        }
        Set-ItemProperty -Path $target.Path -Name "(Default)" -Value $target.Manifest
        Write-Host "[OK] Registered for $($target.Name): $($target.Path)" -ForegroundColor Green
    } catch {
        Write-Warning "Could not register $($target.Name): $_"
    }
}

Write-Host ""
Write-Host "Registration completed successfully!" -ForegroundColor Cyan
Write-Host "Restart your browser(s) and open the Tabsed extension." -ForegroundColor Cyan
Write-Host ""
Write-Host "Tip: When your extension is published to Microsoft Edge Add-ons, register the store ID by running:" -ForegroundColor Yellow
Write-Host "     powershell -File .\install_host.ps1 -EdgeStoreId <PUBLISHED_STORE_ID>" -ForegroundColor Yellow
Write-Host "     or: .\install_host.bat <PUBLISHED_STORE_ID>" -ForegroundColor Yellow
