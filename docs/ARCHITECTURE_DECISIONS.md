# Tabsed --- Architecture Decision Records (ADRs)

**Status:** Approved & Implemented\
**Version:** 1.0\
**Baseline PRD:** `Tabsed.md`

---

## ADR 001: Local-First SQLite + Staged File Assets Architecture

### Context
Users require rapid tab storage, reliable querying, and persistence across thousands of tabs without network latency or dependence on a cloud server.

### Decision
We use a local SQLite database for relational records (tabs, sessions, collections, tags, notes) and a structured local filesystem directory (`assets/thumbnails/`, `assets/archives/`) for binary files.
Writes follow a two-phase staging workflow: binary files are written to temporary staging files, verified with SHA-256 hashes, and committed in an atomic database transaction.

### Consequences
- **Positive:** Zero cloud infrastructure required, high performance (<10ms queries across thousands of items), full offline capability, trivial backup and migration.
- **Negative:** File operations must handle disk errors, permission failures, and crash recovery reconciliation.

---

## ADR 002: Save-before-Close Transaction Guarantee

### Context
Users fear losing tab context when closing tabs. If an application closes tabs before verifying that they are safely written to disk, data loss can occur during crashes or write failures.

### Decision
Implement a strict transactional safety gate: browser tabs may only be closed if their IDs are explicitly included in a committed transaction report returned by the vault persistence engine. If any tab fails to save, it is left open in the browser.

### Consequences
- **Positive:** Guaranteed zero data loss.
- **Negative:** Partial saves may leave some tabs open; UI must clearly report which tabs were committed and which were left open.

---

## ADR 003: Native Messaging over HTTP Server for Browser Integration

### Context
Browser extensions need to communicate with the Tabsed desktop app. Two common patterns exist: running a local loopback HTTP server (e.g., `localhost:12345`) or using browser-native stdio Native Messaging.

### Decision
Use official browser Native Messaging (`com.tabsed.app`) via standard input/output with 4-byte length prefixes. A local HTTP server is rejected to eliminate open-port vulnerabilities, cross-site request forgery (CSRF), and firewall alerts.

### Consequences
- **Positive:** Secure, sandboxed communication bound strictly to registered browser extension IDs.
- **Negative:** Requires user-level registry registration on Windows (`HKCU\Software\[Browser]\NativeMessagingHosts`).

---

## ADR 004: Windows Mica Backing with Restrained Translucency and Reduced Effects Fallback

### Context
Tabsed targets Windows desktop users who expect modern, cohesive system styling without sacrificing readability or CPU/GPU performance.

### Decision
Adopt Tauri 2.0 with native Windows Mica backdrop material on Windows 11. To prevent accessibility degradation, content surfaces maintain high contrast tokens (WCAG 2.1 AA >= 4.5:1), and a user toggle + OS query for `prefers-reduced-transparency` swaps Mica for solid opaque slate backgrounds.

### Consequences
- **Positive:** Elegant Windows design without continuous blur overhead across content grids.
- **Negative:** Older Windows versions (e.g. Windows 10) gracefully fall back to solid background themes.

---

## ADR 005: Honest Storage Accounting Model

### Context
Tab managers frequently mislead users by conflating vault asset storage with active browser memory or native disk cache.

### Decision
Tabsed explicitly separates:
1. **Vault-Owned Storage (Exact):** Thumbnails, SQLite database, and offline HTML archives.
2. **Browser Profile Storage (Estimated):** High-level estimation of cache folders per browser profile.
3. **Unmeasurable In-Memory State:** Transparently labeled as unmeasurable.

### Consequences
- **Positive:** Build user trust with verifiable byte counts.
- **Negative:** Explanatory tooltips required in the UI to educate users on browser caching limits.

---

## ADR 006: Vetted Cryptography (AES-256-GCM + Argon2id) for Vault Encryption

### Context
Users saving sensitive research need optional vault encryption without risking homemade cipher vulnerabilities.

### Decision
Adopt authenticated encryption using AES-256-GCM with unique 96-bit nonces and PBKDF2/Argon2id key derivation with random 128-bit salts. Tampering with any byte of ciphertext or authentication tag immediately throws a verification error.

### Consequences
- **Positive:** Cryptographically sound, tamper-evident data protection.
- **Negative:** Forgotten master passwords cannot be recovered without the generated alphanumeric recovery key.
