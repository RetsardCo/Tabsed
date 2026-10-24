# Tabsed

> **Your tabs, thoughtfully put away.**

Tabsed is a local-first desktop application for saving, organizing, inspecting, and restoring browser tabs without requiring users to keep every tab open. It combines a visual tab library with session restoration, optional offline page archives, storage transparency, duplicate detection, notes, full-text search, availability checks, portable vaults, backups, and privacy controls.

---

## Key Features

- **Save Before Close**: Never closes source tabs until the vault confirms that the selected session record and required assets are safely persisted and verified.
- **Visual Library**: Browse saved tabs with previews, favicons, titles, domains, tags, notes, and collections in Grid, Compact List, or Detailed List views.
- **Windows Mica Design**: Restrained, accessible interface with Mica-first backdrop, system/light/dark themes, accent color presets, and solid/reduced-transparency fallback.
- **Storage Transparency**: Exact byte accounting for vault-owned files; distinct, clearly labeled estimates for browser profile directories without misleading claims of per-tab cache sizes.
- **Duplicate Detection & Availability Checks**: Conservative URL normalization with duplicate grouping and safe, rate-limited link reachability checks that never auto-delete items.
- **Bounded Session Restoration**: Reopen tabs in batches with delay controls to avoid overwhelming the browser.
- **Privacy by Default**: Operates locally without requiring accounts or cloud synchronization. Private/incognito tabs are excluded by default, and cookies/passwords are never collected.

---

## Technical Stack

- **Desktop Shell**: Tauri v2
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS / Modern CSS Variables
- **Backend / Core Engine**: Rust commands & TypeScript local service bridge
- **Database**: SQLite with versioned schema migrations
- **Browser Extension**: Manifest V3 extension for Microsoft Edge and Google Chrome
- **Inter-process Communication**: Native Messaging protocol with strict length prefixes and payload validation

---

## Project Structure

```text
Tabsed/
├── .github/                   # GitHub Actions CI & issue templates
├── extension/                 # Chromium browser extension (Manifest V3)
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── background.js
├── src-tauri/                 # Tauri desktop shell and Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
├── src/                       # Frontend application and core TypeScript modules
│   ├── core/                  # Engine logic (Vault, Storage, Transactions, Connectors)
│   │   ├── vault/             # SQLite migrations, schema, and filesystem staging
│   │   ├── transaction/       # Save-and-close state machine, duplicate detector, availability
│   │   └── connector/         # Browser capability interfaces and native messaging protocol
│   ├── ui/                    # React components, themes, modals, and views
│   ├── App.tsx
│   └── main.tsx
├── tests/                     # Unit and integration test suites (Vitest)
├── Tabsed.md                  # Product Requirements Document (PRD)
├── TabsedToDo.md              # Implementation Plan & Execution Backlog
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0 (v22 LTS recommended)
- **npm** >= 9.0.0
- *(Optional for native desktop bundle)*: **Rust** toolchain and **Visual Studio C++ Build Tools** for building Tauri binaries. The web UI and core service run directly on Node.js.

### Installation

```bash
# Clone and enter the repository
cd Tabsed

# Install dependencies
npm install
```

### Development & Testing

```bash
# Run unit & integration tests
npm test

# Run TypeScript type check
npm run typecheck

# Start local development server
npm run dev

# Build production web bundle
npm run build
```

### Loading the Browser Extension (Edge / Chrome)

1. Open your browser and navigate to `edge://extensions` or `chrome://extensions`.
2. Enable **Developer mode** toggle.
3. Click **Load unpacked** and select the `Tabsed/extension` folder.

---

## Important Disclosures & Limitations

1. **Save-and-Close Guarantee**: Tabsed saves tab metadata, thumbnails, and vault-owned files before closing browser tabs. If persistence or verification fails, source tabs stay open.
2. **Session Resumption**: Tabsed reopens saved URLs and session structure. In-memory JavaScript runtime state, unsaved form input, and active session logins are not guaranteed to be restored.
3. **No Credential Harvesting**: Tabsed never reads, extracts, or stores cookies, saved passwords, or browser authentication databases.
4. **Availability Checks**: Availability checks test basic HTTP network reachability. A failed or blocked request does not prove a website is permanently gone.
5. **Storage Metrics**: Storage reports distinguish exact byte totals of vault-owned assets from estimated browser profile directory sizes.

---

## License

MIT License. See [LICENSE](file:///C:/Users/Kurados/.gemini/antigravity/scratch/Tabsed/LICENSE) for details.
