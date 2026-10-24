# Tabsed --- Troubleshooting & Diagnostic Guide

This guide assists users and developers in diagnosing issues with Tabsed installation, running the local server, browser extensions, or native messaging.

---

## 1. Quick Launch & Running the App

### Option A: Double-Click Launcher (Recommended)
Double-click `launch-app.bat` in the Tabsed project folder. It will:
- Check that Node.js is installed.
- Install dependencies if `node_modules` is missing.
- Open your default browser to `http://localhost:3000`.
- Start the Vite server.

### Option B: Terminal Command
```powershell
npm.cmd run dev
```
Then navigate to: `http://localhost:3000`

---

## 2. Common Issues & Solutions

### Issue: "npm.ps1 cannot be loaded because running scripts is disabled on this system"
**Cause:** Windows PowerShell restricts running unverified `.ps1` scripts by default.
**Solution:**
Use `npm.cmd` instead of `npm`, or run:
```powershell
cmd.exe /c npm run dev
```
Alternatively, bypass execution policy for the current session:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

---

### Issue: Native Messaging Host Not Found in Extension
**Symptoms:** Extension popup displays "Disconnected" or "Native messaging host not found".
**Solution:**
1. Navigate to `packaging/native-host/`.
2. Right-click `install_host.bat` and select **Run as administrator** (or run directly in cmd).
3. Verify that the registry key was created:
   - For Edge: `HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.tabsed.app`
   - For Chrome: `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tabsed.app`
4. Fully restart Microsoft Edge or Google Chrome.

---

### Issue: Building Standalone Native Desktop `.exe` with Tauri
**Symptoms:** `cargo` or `rustc` command not found.
**Solution:**
The native `.exe` requires Rust and Visual Studio C++ Build Tools:
1. Run our environment diagnostic script:
   ```cmd
   scripts\setup-toolchain.bat
   ```
2. If Rust is not installed, install it via winget:
   ```cmd
   winget install Rustlang.Rustup
   winget install Microsoft.VisualStudio.2022.BuildTools
   ```
3. Restart your terminal, then run:
   ```cmd
   npm run tauri dev
   ```

---

## 3. Diagnostic Data Export

Tabsed includes a local-first diagnostic tool that produces sanitized system metrics without exposing sensitive browsing data:
1. Open Tabsed in your browser or desktop window.
2. Click **Help & Diagnostics** in the sidebar or header.
3. Review connector state, database size, and protocol handshakes.
4. Click **Export Diagnostic Report** to save a redacted `.json` log file.
