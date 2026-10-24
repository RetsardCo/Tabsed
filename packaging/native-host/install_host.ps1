# Tabsed Native Messaging Host Installer for Windows (PowerShell)
# Registers host in HKCU for Google Chrome, Microsoft Edge, and Mozilla Firefox

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ChromiumManifestPath = Join-Path $ScriptDir "com.tabsed.app.json"
$FirefoxManifestPath = Join-Path $ScriptDir "com.tabsed.app-firefox.json"
$HostBatPath = Join-Path $ScriptDir "host.bat"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Tabsed Native Messaging Host Registration for Windows" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Host Directory: $ScriptDir"
Write-Host "Host Executable: $HostBatPath"

# Ensure host.bat has absolute path in manifests
$escapedBat = $HostBatPath.Replace('\', '\\')

if (Test-Path $ChromiumManifestPath) {
    $chromiumJson = Get-Content -Raw -Path $ChromiumManifestPath | ConvertFrom-Json
    $chromiumJson.path = $HostBatPath
    $chromiumJson | ConvertTo-Json -Depth 5 | Set-Content -Path $ChromiumManifestPath -Encoding UTF8
    Write-Host "[OK] Updated Chromium manifest path -> $HostBatPath" -ForegroundColor Green
}

if (Test-Path $FirefoxManifestPath) {
    $firefoxJson = Get-Content -Raw -Path $FirefoxManifestPath | ConvertFrom-Json
    $firefoxJson.path = $HostBatPath
    $firefoxJson | ConvertTo-Json -Depth 5 | Set-Content -Path $FirefoxManifestPath -Encoding UTF8
    Write-Host "[OK] Updated Firefox manifest path -> $HostBatPath" -ForegroundColor Green
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
