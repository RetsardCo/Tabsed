# Tabsed Native Messaging Host Uninstaller for Windows (PowerShell)

$ErrorActionPreference = "Continue"

$RegistryTargets = @(
    "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.tabsed.app",
    "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.tabsed.app",
    "HKCU:\Software\Mozilla\NativeMessagingHosts\com.tabsed.app"
)

Write-Host "Unregistering Tabsed Native Messaging Host..." -ForegroundColor Yellow

foreach ($target in $RegistryTargets) {
    if (Test-Path $target) {
        Remove-Item -Path $target -Recurse -Force
        Write-Host "[OK] Removed: $target" -ForegroundColor Green
    } else {
        Write-Host "[SKIP] Not present: $target"
    }
}

Write-Host "Unregistration complete." -ForegroundColor Green
