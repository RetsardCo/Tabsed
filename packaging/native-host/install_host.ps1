param(
    [string]$CustomExtensionId
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
Write-Host "Host Executable: $HostBatPath"

if (-not (Test-Path $HostBatPath)) {
    Write-Warning "host.bat not found at $HostBatPath!"
}

# Optional custom extension ID registration (writes UTF-8 without BOM)
if ($CustomExtensionId -and (Test-Path $ChromiumManifestPath)) {
    $cleanId = $CustomExtensionId.Trim().ToLower()
    $chromiumJson = Get-Content -Raw -Path $ChromiumManifestPath | ConvertFrom-Json
    $origin = "chrome-extension://$cleanId/"
    if ($chromiumJson.allowed_origins -notcontains $origin) {
        $chromiumJson.allowed_origins += $origin
        $jsonContent = $chromiumJson | ConvertTo-Json -Depth 5
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($ChromiumManifestPath, $jsonContent, $utf8NoBom)
        Write-Host "[OK] Added custom extension origin: $origin" -ForegroundColor Green
    }
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
