# Tabsed --- Release & Distribution Checklist

Aligned with **Tabsed PRD Section 15 & 16**.

---

## 1. Pre-Flight Quality Gates

Execute all validation commands prior to cutting a release:

```powershell
# 1. Typecheck and unit tests
npm run typecheck
npm test

# 2. Production web bundle build
npm run build

# 3. Browser extension packaging
npm run package:extensions
```

All 22 test suites (170+ tests) must pass with zero errors.

---

## 2. Artifact Verification

- [x] **Web Bundle:** `dist/index.html` and bundled assets generated cleanly.
- [x] **Chromium Extension Package:** `dist/extensions/tabsed-chromium-v1.0.0.zip` contains valid `manifest.json`, `background.js`, `popup.html`, `popup.js`, `styles.css`, and icon sizes (16, 48, 128).
- [x] **Firefox Extension Package:** `dist/extensions/tabsed-firefox-v1.0.0.zip` contains valid gecko ID `tabsed@tabsed.com` and background scripts.
- [x] **Native Messaging Registration:**
  - `packaging/native-host/install_host.bat` registers in `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tabsed.app` and `HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.tabsed.app`.
  - `packaging/native-host/install_host.ps1` executes without admin elevation.
  - `packaging/native-host/uninstall_host.bat` cleanly purges registry keys.
- [x] **One-Click Launcher:** `launch-app.bat` and `launch-app.ps1` launch the local dev server and open `http://localhost:3000`.

---

## 3. Data Safety & Migration Verification

- [x] Upgrades do not touch or alter pre-existing user vaults in `%APPDATA%\Tabsed\`.
- [x] Uninstallation preserves user vault content by default; deletion requires an explicit choice.
- [x] Database schema versioning includes safe up/down migrations.

---

## 4. Rollback and Disaster Recovery

If an issue occurs after deploying an update:
1. Revert Git tag/commit: `git revert <commit-hash>`.
2. To restore user data, import the most recent `.json` or `.tar` backup from the `Backups` dialog in Settings.
3. To reset the native host registration: run `packaging/native-host/uninstall_host.bat`.
