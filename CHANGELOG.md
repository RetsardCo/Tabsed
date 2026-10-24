# Changelog

All notable changes to the **Tabsed** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-24

### Added
- **Visual Tab Library & Shell**
  - Native Windows desktop shell using Tauri 2.0 with Windows Mica backdrop material and dark/light/system theme switching.
  - Three viewing layouts: Visual Card Grid, Compact Row List, and Detailed Inspector List.
  - Detail Inspector side panel with domain statistics, notes editor, tag management, archive previews, and availability status.
  - Restrained UI design with high-contrast accessibility tokens, fluid keyboard navigation, and reduced-transparency fallback mode.

- **Atomic Save-and-Close Transaction Engine**
  - Save-before-close safety gate: Source browser tabs are never closed unless their metadata, URLs, and screenshots are safely committed to local storage.
  - Support for single-tab, multi-tab, and full window session snapshots with pinned state and tab group preservation.
  - Partial save resilience: Any tabs failing storage persistence remain open in the browser.

- **Browser Integrations & Connectors**
  - Chromium extension for Microsoft Edge, Google Chrome, and Brave (Manifest V3).
  - Mozilla Firefox extension connector with gecko configuration (Manifest V3).
  - Stdio-based Native Messaging bridge (`com.tabsed.app`) conforming to the 1MB payload ceiling.
  - Windows registry installation scripts (`install_host.bat` and `install_host.ps1`) targeting `HKCU\Software\[Browser]\NativeMessagingHosts`.

- **Storage Transparency & Honesty**
  - Honest storage explorer distinguishing exact vault-owned files (thumbnails, SQLite records, HTML archives) from estimated browser profile cache footprints.
  - Storage quota alerts, breakdown charts by domain and collection, and orphan asset pruning.

- **Trash & Recoverability**
  - Two-stage deletion lifecycle: soft-delete to Trash with recovery timestamps.
  - Permanent purge confirmation modal with explicit `alertdialog` accessibility focus.
  - Safe restore-to-browser queue with rate-limiting and bounded batch dispatching.

- **Offline Archives & Full-Text Search**
  - Client-side full-text search indexing title, URL, user notes, and archived text snippets.
  - Sandboxed offline HTML archive preview viewer isolated from desktop privileges.

- **Vault Security & Cryptography**
  - Vetted cryptographic vault encryption utilizing AES-256-GCM authenticated cipher and Argon2id key derivation.
  - Tamper detection verifying authentication tags and SHA-256 content hashes.
  - Automated redaction of sensitive query tokens (`token`, `auth`, `apikey`, `secret`) from URLs in diagnostic logs.
  - SSRF protection in URL availability checks blocking loopback, RFC 1918 private ranges, and cloud metadata IPs.

- **Portability & Backups**
  - Full vault backup export with versioned JSON manifests and relative asset paths.
  - External drive migration support with staged verification and rollback on error.
  - Path traversal protections preventing directory escape during archive imports.

- **Automation & System Tray**
  - Optional system tray companion with quick save, restore, and search shortcuts.
  - Configurable automation engine with domain allowlists, protected pinned tab safeguards, and audit logs.

- **Developer & User Launch Tooling**
  - `launch-app.bat` and `launch-app.ps1`: One-click automated launch helpers for instant browser usage.
  - `scripts/setup-toolchain.bat` / `.ps1`: System environment diagnostics for Node, npm, winget, and Rust/C++ desktop build tools.
  - `scripts/package-extensions.cjs`: Automated bundler producing unpacked directories and release `.zip` packages.
