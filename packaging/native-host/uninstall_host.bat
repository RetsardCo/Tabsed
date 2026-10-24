@echo off
setlocal

echo Unregistering Tabsed Native Messaging Host...

reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tabsed.app" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.tabsed.app" /f >nul 2>&1
reg delete "HKCU\Software\Mozilla\NativeMessagingHosts\com.tabsed.app" /f >nul 2>&1

echo [OK] Tabsed Native Messaging Host unregistered from Chrome, Edge, and Firefox.
pause
