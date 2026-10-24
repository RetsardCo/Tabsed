# Tabsed --- Product Requirements Document (PRD)

**Document status:** Product baseline for implementation\
**Version:** 1.0\
**Date:** 2026-10-24\
**Product name:** Tabsed\
**Working tagline:** *Your tabs, thoughtfully put away.*\
**Initial platform:** Windows desktop\
**Initial browser integrations:** Microsoft Edge and Google Chrome\
**Proposed stack:** Tauri, React, TypeScript, Rust, SQLite, browser
extensions, native messaging

------------------------------------------------------------------------

## 1. Executive Summary

Tabsed is a local-first desktop application for saving, organizing,
inspecting, and restoring browser tabs without requiring users to keep
every tab open. It combines a visual tab library with session
restoration, optional offline page archives, storage transparency,
duplicate detection, notes, full-text search, availability checks,
portable vaults, backups, and privacy controls.

Tabsed addresses a familiar problem: users keep large numbers of browser
tabs open because they fear losing context. The result can be a
cluttered browser, difficult navigation, increased resource use, and
uncertainty about which tabs are important. Traditional bookmarks
preserve URLs but do not provide a strong visual record of what the user
was looking at or preserve an organized session layout. Session managers
can preserve tab lists, but Tabsed aims to provide a richer, inspectable
local archive with explicit storage accounting.

Tabsed will be a Windows desktop app with three selectable integration
levels:

1.  **Basic:** desktop app and local vault, with manual import/export
    and archive management. Live-tab capture requires a browser
    integration.
2.  **Connected:** desktop app plus optional browser extensions and a
    secure native-messaging bridge for capturing and restoring tabs.
3.  **Power user:** Connected mode plus optional system-tray quick
    actions and automation.

The interface should be professional, clean, and restrained:
Apple-inspired information hierarchy and icon consistency, adapted to
Windows conventions. Use Windows Mica as the preferred native backdrop,
with restrained translucency, high readability, customizable themes, and
a reduced-effects option. Avoid decorative clutter and effects that
undermine performance.

Tabsed must be precise about what it saves. It can reliably save tab
metadata, thumbnails, session structure, notes, and files it owns. It
may save offline page captures where supported. It cannot guarantee that
every website's complete in-memory JavaScript state, authentication
state, unsaved form state, or native browser cache can be exported and
restored exactly. Those limitations must be visible in product copy and
UI.

## 2. Product Vision and Principles

### 2.1 Vision

Make it safe and convenient to close browser tabs without losing the
context needed to find and revisit them later.

### 2.2 Product promise

**Close your tabs. Keep their context. Restore them in supported
browsers. Know exactly what your vault stores.**

### 2.3 Product principles

1.  **Local-first:** the vault works without an account or cloud service
    for core functions.
2.  **Save before close:** never close source tabs until the vault
    confirms that the selected session record and required assets are
    safely persisted.
3.  **Visual recognition:** show saved page previews, titles, domains,
    and contextual metadata.
4.  **Storage honesty:** distinguish exact vault-owned file sizes from
    estimates of browser-profile usage and from unmeasurable per-tab
    native cache usage.
5.  **Progressive complexity:** basic features should be approachable;
    advanced automation and browser controls remain optional.
6.  **Privacy by default:** exclude private/incognito tabs from
    automatic capture; never silently collect credentials, cookies, or
    authentication stores.
7.  **Recoverability:** destructive actions are confirmed, recoverable
    where practical, and auditable.
8.  **Browser-specific integration:** use supported browser APIs and
    isolated connectors; do not assume all browsers expose identical
    capabilities.
9.  **Performance through restraint:** virtualize large lists, lazy-load
    thumbnails, avoid continuous animations, and keep expensive visual
    effects optional.
10. **Accessible customization:** themes and accent colors must preserve
    contrast and keyboard usability.

## 3. Problem Statement

Users often keep many tabs open because they are temporary working
context, not merely links. Closing them feels risky because a bookmark
does not preserve the visible page, the relationship between tabs, or
why a tab mattered. Many users also have multiple browser profiles and
browsers for different activities. They need a reliable way to archive
sessions, visually recognize items, and restore them without manually
rebuilding a workspace.

Tabsed should reduce the need to keep inactive tabs resident in the
browser while retaining an organized, searchable record of the user's
browsing work.

## 4. Goals and Non-Goals

### 4.1 Goals

-   Save individual tabs, selected tabs, windows, and supported tab
    groups.
-   Capture title, URL, favicon, browser/profile identity, ordering,
    pinned state, and timestamps.
-   Capture a thumbnail when browser permissions and page restrictions
    permit.
-   Close selected source tabs only after a successful save transaction.
-   Restore URLs and supported session structure to a selected supported
    browser/profile.
-   Provide a clean visual grid, compact list, and detailed list.
-   Organize saved items into vaults, collections, folders, tags, and
    favorites.
-   Support notes and annotations.
-   Detect duplicate URLs across connected browsers/profiles and vault
    items.
-   Check URL availability without automatically deleting items.
-   Index supported saved-page text for full-text search.
-   Provide optional offline archives and show capture limitations.
-   Show exact sizes for vault-owned files and clearly labeled estimates
    for browser profile folders.
-   Provide quotas, cleanup policies, recoverable trash, backups,
    integrity checks, and portable import/export.
-   Offer a desktop-only experience and optional browser integrations.
-   Support Windows light, dark, and system themes, custom accent
    colors, density controls, and reduced transparency.
-   Maintain an extensible architecture for future browser connectors.

### 4.2 Non-goals

-   Guaranteeing exact restoration of every website's in-memory
    JavaScript state.
-   Exporting and importing a complete browser-native cache for each
    tab.
-   Copying or transplanting cookies, passwords, browser login
    databases, or authentication tokens into the vault.
-   Modifying live browser profile databases or cache files directly.
-   Circumventing browser security, extension permissions,
    private-browsing policies, paywalls, or access controls.
-   Guaranteeing that every website can be archived offline.
-   Replacing a full browser, password manager, or cloud-sync service.
-   Automatically deleting a saved item because an availability check
    failed.
-   Requiring cloud accounts or sending browsing history to a remote
    service.

## 5. Target Users and Personas

### 5.1 Research-heavy user

Keeps many academic, documentation, reference, and article tabs open.
Needs visual recognition, notes, tags, full-text search, and recoverable
sessions.

### 5.2 Developer / creator

Uses multiple browser profiles and tools. Needs project collections,
browser-aware restoration, large-session handling, and a fast capture
workflow.

### 5.3 Everyday user

Wants to close clutter without learning complex browser settings. Needs
a straightforward desktop app, clear labels, safe defaults, and guided
setup.

### 5.4 Storage-conscious power user

Wants to understand the disk footprint of archives, inspect large files,
configure quotas, move the vault to another drive, and prune old
snapshots safely.

### 5.5 Privacy-sensitive user

Wants local storage, explicit controls for private browsing, encryption
for sensitive archives, no silent capture, and predictable deletion
behavior.

## 6. Product Scope and Release Strategy

### 6.1 Phase 1 --- Core MVP

-   Windows desktop shell.
-   Local SQLite database and user-selectable vault directory.
-   Edge and Chrome extension integration.
-   Native-messaging bridge.
-   Capture tab/window/selected tabs.
-   Save metadata and thumbnails.
-   Collections, tags, favorites, notes, search, grid/list views.
-   Save-and-close transaction.
-   Restore URLs to selected supported browser/profile.
-   Basic settings, connection status, error reporting, and export.
-   Light/dark/system appearance and accent-color presets.

### 6.2 Phase 2 --- Storage and Control

-   Storage explorer.
-   Exact archive file-size accounting.
-   Browser-profile folder size reporting, labeled as a profile-level
    measurement.
-   Duplicate URL detection.
-   Recoverable trash.
-   Versioned backups and integrity verification.
-   Quotas and cleanup policies.
-   Storage report export.

### 6.3 Phase 3 --- Discovery and Restoration

-   Restore queue with configurable batches and delays.
-   Availability checks.
-   Full-text search of supported captured content.
-   Session history and reconstruction of supported tab groups.
-   Firefox connector, subject to API validation.
-   Better profile discovery and restore diagnostics.

### 6.4 Phase 4 --- Advanced Vault

-   Portable vault import/export manifests.
-   Optional offline page capture and content indexing.
-   Encryption for selected archives and documented key recovery.
-   Preview redaction.
-   Private-vault options with explicit permissions and lifecycle
    controls.
-   Advanced automation and retention policies.
-   Further browser connectors based on demand and feasibility.

## 7. Functional Requirements

Priority definitions: **P0** = required for MVP; **P1** = important
after MVP; **P2** = advanced or later-phase.

### 7.1 Installation and first-run setup

-   **FR-001 (P0):** The app shall launch without requiring an account.
-   **FR-002 (P0):** First run shall offer a default vault location and
    a user-selectable alternative.
-   **FR-003 (P0):** First run shall explain that browser integrations
    are optional and required for direct live-tab capture.
-   **FR-004 (P0):** The user shall be able to select Basic or Connected
    setup; Power user features may be enabled later.
-   **FR-005 (P0):** The app shall display connection and permission
    status for each installed connector.
-   **FR-006 (P1):** The app shall offer an optional system-tray
    companion.
-   **FR-007 (P0):** The app shall provide a diagnostic screen for
    connector version, protocol status, and last successful handshake
    without exposing sensitive page content.

### 7.2 Tab capture and session records

-   **FR-010 (P0):** Capture one tab, a selected set of tabs, the
    current window, or a supported tab group.
-   **FR-011 (P0):** Save URL, title, favicon when available, browser
    family, profile identifier/label when known, window identity,
    original order, pinned state, tab-group metadata where supported,
    capture time, and last-known active state when available.
-   **FR-012 (P0):** Capture a thumbnail when permitted; show a clear
    placeholder when capture is blocked or unavailable.
-   **FR-013 (P0):** Save operations shall use a transaction-like
    workflow: stage metadata/assets, persist and verify them, mark the
    session saved, then close source tabs if the user requested closing.
-   **FR-014 (P0):** If saving fails or required files cannot be
    persisted, source tabs shall remain open.
-   **FR-015 (P0):** The user shall be able to choose Save only, Save
    and close, or Cancel.
-   **FR-016 (P0):** Private/incognito tabs shall be excluded from
    automatic capture by default.
-   **FR-017 (P1):** Users may explicitly enable private-tab capture
    after browser permission and risk explanation; private data must be
    separately labeled and governed by a clear retention policy.
-   **FR-018 (P1):** The app shall support manual URL entry/import where
    direct browser integration is unavailable.
-   **FR-019 (P1):** Capture failures shall be itemized, not silently
    dropped.

### 7.3 Visual library and organization

-   **FR-020 (P0):** Provide Grid, Compact List, and Detailed List
    views.
-   **FR-021 (P0):** Cards shall display a thumbnail or placeholder,
    title, domain, saved date, and relevant collection/tags.
-   **FR-022 (P0):** The user shall be able to create, rename, reorder,
    and delete collections and folders.
-   **FR-023 (P0):** The user shall be able to assign multiple tags and
    favorites.
-   **FR-024 (P0):** A saved item may appear in multiple collections
    without duplicating its underlying archive files.
-   **FR-025 (P0):** Support sorting by saved date, title, domain, size
    when available, and last availability-check status.
-   **FR-026 (P0):** Support search by title, URL, domain, tags,
    collection, and notes.
-   **FR-027 (P1):** Support nested collections if usability testing
    confirms the hierarchy remains understandable.
-   **FR-028 (P0):** Support multi-select actions for move, tag,
    archive, export, and delete.
-   **FR-029 (P0):** Destructive bulk actions shall show a count and a
    summary before execution.

### 7.4 Notes and annotations

-   **FR-030 (P0):** Each item and collection may have user-authored
    notes.
-   **FR-031 (P0):** Notes shall be saved locally and indexed for
    search.
-   **FR-032 (P1):** Notes may include a short "why this matters" field
    and a "next action" field.
-   **FR-033 (P1):** Autosave must show an explicit saved/pending/error
    state.

### 7.5 Session restoration

-   **FR-040 (P0):** Restore a single tab or saved session to a
    supported browser.
-   **FR-041 (P0):** Allow choosing a destination browser and profile
    when supported by the connector/desktop integration.
-   **FR-042 (P0):** Before opening many tabs, show the number to be
    opened and offer a confirmation.
-   **FR-043 (P1):** Restore queue shall support configurable batch size
    and delay between batches.
-   **FR-044 (P1):** Restore queue shall support pause, resume, cancel,
    and retry failed items.
-   **FR-045 (P1):** Restore supported tab order, pinned state, and
    group organization.
-   **FR-046 (P0):** The UI shall distinguish "Open live page," "Open
    saved snapshot," and "Restore session."
-   **FR-047 (P0):** The app shall state that website-specific runtime
    state, unsaved form data, authentication, and scroll position may
    not be restored.
-   **FR-048 (P1):** Incognito/private restoration shall be explicit and
    conditional on browser permissions; it shall never happen silently.
-   **FR-049 (P1):** When a profile is missing or unavailable, offer a
    different destination or a retry; do not silently open in an
    unintended profile.
-   **FR-050 (P1):** A restore queue shall rate-limit opening to reduce
    startup load and avoid a burst of tabs overwhelming the browser.

### 7.6 Duplicate detection

-   **FR-060 (P1):** Detect repeated URLs across saved items and
    connected browser/profile inventories when available.
-   **FR-061 (P1):** Normalize URLs conservatively: lower-case
    scheme/host where valid, remove default ports, and optionally ignore
    known tracking parameters through a configurable rule set.
-   **FR-062 (P1):** Preserve query parameters and fragments by default
    unless the user explicitly chooses normalization rules.
-   **FR-063 (P1):** Present duplicate groups with source
    browser/profile, saved date, notes, and archive status.
-   **FR-064 (P1):** Offer keep both, merge metadata, move to one
    collection, or delete selected duplicates.
-   **FR-065 (P1):** Never automatically delete duplicates.

### 7.7 Website availability checks

-   **FR-070 (P1):** The user may check one URL, a selection, a
    collection, or the full vault.
-   **FR-071 (P1):** Store last checked time, result category,
    response/connection details when available, and error reason.
-   **FR-072 (P1):** Results shall distinguish reachable, redirect,
    authentication required, blocked by policy/robots/CORS or network
    restrictions, timeout, DNS/TLS/network failure, and uncertain.
-   **FR-073 (P1):** Availability failures shall not trigger automatic
    deletion.
-   **FR-074 (P1):** Rate-limit checks, honor reasonable server
    responses, and allow users to pause/cancel bulk checks.
-   **FR-075 (P1):** Avoid sending page contents or notes to an
    availability service; checks should use the local network stack
    unless the user explicitly configures another provider.
-   **FR-076 (P1):** Explain that a failed check does not prove a page
    is permanently gone; some websites reject automated requests or
    require a logged-in browser.

### 7.8 Offline archives and full-text search

-   **FR-080 (P1):** Support optional capture of page content/resources
    where technically and legally supported.
-   **FR-081 (P1):** Each archive shall show capture date, size, capture
    type, completeness/status, and known limitations.
-   **FR-082 (P1):** Index text only from content successfully captured
    and permitted for local indexing.
-   **FR-083 (P1):** Full-text search shall return matching archive
    title, source URL, snippet, and capture date.
-   **FR-084 (P1):** Do not claim a page is fully offline-capable if
    required resources or authentication-dependent data were not
    captured.
-   **FR-085 (P1):** Respect site access controls; do not bypass
    authentication, paywalls, or browser security restrictions.
-   **FR-086 (P1):** Provide a way to delete an archive and its search
    index while retaining the session record, or delete the entire item.
-   **FR-087 (P1):** Captures containing sensitive information shall be
    subject to the user's privacy and encryption settings.

### 7.9 Storage explorer and policies

-   **FR-090 (P0):** Show exact bytes for files managed by Tabsed:
    thumbnails, page archives, manifests, indexes, backups, and other
    vault-owned files.
-   **FR-091 (P1):** Report browser-profile directory size where
    accessible, clearly labeled as profile-level and potentially
    changing/estimated if files are locked or actively changing.
-   **FR-092 (P0):** Do not claim a precise cache size for an individual
    tab when browser APIs cannot attribute cache entries reliably.
-   **FR-093 (P0):** Separate vault storage, browser profile storage,
    and estimated/unavailable data in the UI.
-   **FR-094 (P1):** Show largest files and storage by collection, file
    category, and age.
-   **FR-095 (P1):** Allow per-vault quotas and warn before reaching
    them.
-   **FR-096 (P1):** Cleanup policies may prune eligible old thumbnails
    or optional archives only according to explicit user settings.
-   **FR-097 (P1):** Never prune the only session metadata record needed
    to identify a saved item unless the user explicitly deletes the
    item.
-   **FR-098 (P1):** Provide dry-run cleanup previews listing affected
    files and estimated space reclaimed.
-   **FR-099 (P1):** Do not directly modify active browser cache/profile
    databases. Use supported browser APIs for supported data-clearing
    operations, with clear warnings and separate consent.

### 7.10 Trash, backups, and integrity

-   **FR-100 (P1):** Deletion moves eligible vault content to
    recoverable trash before permanent deletion.
-   **FR-101 (P1):** Trash shall display deletion date and scheduled
    permanent deletion date if retention is configured.
-   **FR-102 (P1):** Allow restore from trash and explicit permanent
    deletion.
-   **FR-103 (P1):** Support versioned backups of the database and
    vault-owned files.
-   **FR-104 (P1):** Verify file hashes or equivalent integrity data for
    backup/import operations.
-   **FR-105 (P1):** Report partial backup/restore failures and permit
    retry.
-   **FR-106 (P1):** Do not describe a backup as successful until all
    required files and metadata have been verified.
-   **FR-107 (P1):** Backups should exclude live browser profile data
    and credentials by default.

### 7.11 Portability and import/export

-   **FR-110 (P1):** Export a vault with a versioned manifest and
    relative paths.
-   **FR-111 (P1):** Import from a folder or archive after validating
    the manifest and file integrity.
-   **FR-112 (P1):** Detect schema version, missing files, invalid
    paths, duplicate IDs, and hash mismatches.
-   **FR-113 (P1):** Provide a conflict-resolution screen for duplicate
    URLs/items during import.
-   **FR-114 (P1):** Support moving the vault to another drive with a
    staged copy, verification, and rollback if the move fails.
-   **FR-115 (P1):** Portable vaults shall not include browser
    authentication stores or assume that a profile's login state will
    transfer.
-   **FR-116 (P1):** Document safe handling of external drives,
    encryption, and abrupt disconnection.

### 7.12 Privacy, encryption, and private browsing

-   **FR-120 (P0):** Default to local storage and no required account.
-   **FR-121 (P0):** Private/incognito tabs are excluded from automatic
    capture by default.
-   **FR-122 (P1):** Require explicit user permission to capture private
    tabs where the browser permits it.
-   **FR-123 (P1):** Support encryption for selected archives or vault
    content using a vetted cryptographic library and documented
    key-management design.
-   **FR-124 (P1):** Explain that loss of an encryption key may make
    encrypted content unrecoverable; provide a deliberate
    recovery-key/export flow if supported.
-   **FR-125 (P1):** Allow hiding or redacting thumbnails for selected
    domains or items.
-   **FR-126 (P1):** Sensitive previews shall not appear in
    notifications or OS-level surfaces unless explicitly enabled.
-   **FR-127 (P0):** Do not collect cookies, passwords, or
    authentication databases.
-   **FR-128 (P1):** Private vault retention and shutdown behavior must
    be configurable and clearly explained.
-   **FR-129 (P0):** All local service endpoints must
    authenticate/authorize their callers and reject arbitrary remote
    origins.

### 7.13 Theme and accessibility

-   **FR-130 (P0):** Support system, light, and dark themes.
-   **FR-131 (P0):** Support accent presets and a custom accent color.
-   **FR-132 (P0):** Use Windows Mica as the preferred main-window
    backdrop where supported.
-   **FR-133 (P0):** Provide a solid/reduced-transparency mode.
-   **FR-134 (P0):** Support compact, comfortable, and spacious content
    density.
-   **FR-135 (P0):** Keep text contrast, focus indicators, and semantic
    labels accessible across custom colors.
-   **FR-136 (P0):** Support keyboard navigation and shortcuts for
    search, capture, restore, and view switching.
-   **FR-137 (P1):** Respect Windows reduced-motion/accessibility
    preferences where feasible.

## 8. Information Architecture

### Primary navigation

1.  **All Tabs** --- all saved tab records and sessions.
2.  **Collections** --- user-defined projects and folders.
3.  **Recent** --- recently saved or restored items.
4.  **Favorites** --- pinned/high-value items.
5.  **Trash** --- recoverable deleted items.
6.  **Browsers** --- connected browser families and profiles.
7.  **Search in Archives** --- full-text search over indexed captures.
8.  **Duplicates** --- repeated URL review.
9.  **Check Links** --- availability status and bulk checking.
10. **Storage** --- vault storage, profile reports, quotas, cleanup, and
    backups.
11. **Settings** --- appearance, privacy, integrations, automation, and
    advanced options.
12. **Help & Diagnostics** --- permissions, connection status, logs with
    redaction, and troubleshooting.

Keep the main sidebar short and grouped. Less-frequent tools can live
under a Tools section or command palette rather than adding more
top-level clutter.

## 9. Screen-by-Screen UI Specification

### 9.1 App shell

**Purpose:** Provide stable navigation and a consistent workspace.

**Layout:** - Native Windows title bar and window controls. - Mica-first
app surface; content panels use mostly opaque surfaces for
readability. - Left navigation rail/sidebar with product mark and
labeled navigation. - Main content region. - Optional right detail
inspector that can be closed or toggled. - No permanently visible status
clutter; show connection and storage status in concise places.

**Behavior:** - Sidebar can collapse. - Preserve window size, navigation
state, selected collection, and layout preferences. - On smaller
windows, hide or collapse the detail inspector and reduce grid
columns. - Use consistent spacing tokens and one icon family.

**Acceptance criteria:** - No horizontal overflow at supported minimum
window size. - All main destinations reachable by keyboard. - Selected
navigation state is clear without relying only on color.

### 9.2 First-run onboarding

**Purpose:** Configure vault location and optional integration without
overwhelming beginners.

**Steps:** 1. Welcome and concise product promise. 2. Choose vault
folder (show default and available space). 3. Choose Basic or Connected
setup; Power user mode can be enabled later. 4. If Connected,
install/enable extension and approve required permissions. 5. Run a test
capture without closing tabs. 6. Show a short explanation of what Tabsed
saves and what it cannot guarantee. 7. Finish at an empty-state library
with a clear "Save your first tabs" action.

**Acceptance criteria:** - User can skip browser integration and still
enter the app. - Failed extension connection has actionable recovery
steps. - No tabs are closed during onboarding.

### 9.3 All Tabs / Library

**Purpose:** Main discovery and management workspace.

**Header:** - Page title and item count. - Search field with shortcut
hint. - Grid/list toggle. - Filter menu. - Primary "Save Tabs" action
with dropdown. - Optional profile/avatar area only if useful; do not
imply a cloud account is required.

**Filter row:** - All, Tab, Session, and user-created tag/collection
shortcuts. - Sort menu. - Avoid a large row of permanent filter chips;
overflow less-used filters into a menu.

**Grid cards:** - Thumbnail (consistent aspect ratio). - Site icon and
title. - Domain. - Optional one-line note preview. - Up to two visible
tags, with overflow count. - Saved date. - Archive size only when it is
a meaningful measured value. - Compact overflow menu. - Selected state
indicated by a thin accent border and accessible state.

**Card actions:** - Open live page. - Open saved snapshot if
available. - Restore session if item is a session. - Edit note/tags. -
Move to collection. - Favorite. - Check availability. - Delete to trash.

**Layout rules:** - Default to three columns at a sufficiently wide
content area; responsively reduce to two or one. - Do not show every
metadata field on every card. - Use virtualized rendering for large
libraries. - Lazy-load images and use placeholders. - The right detail
inspector is optional, not required to consume most of the screen.

**Empty states:** - No saved tabs: explain the extension/manual import
options. - No search results: offer clear filters. - No connection: show
saved library normally and a non-blocking connector status.

### 9.4 Tab/session detail inspector

**Purpose:** Provide detailed metadata without cluttering the grid.

**Content:** - Larger thumbnail. - Title and domain. - Primary action:
Open or Restore. - Secondary actions: Edit, Move, More. - Browser and
profile label. - Saved date, capture type, archive size/status. - Tags
and editable notes. - Session tab list if a session is selected. -
Availability status and last checked time. - Offline archive
completeness label and full-text index status.

**Rules:** - Never imply a thumbnail is a live page. - Show "Archive
incomplete" or "Snapshot only" where appropriate. - Show "Profile
unavailable" when a saved destination no longer exists.

### 9.5 Save Tabs flow

**Entry points:** Browser extension popup, app "Save Tabs" action,
system tray.

**Dialog fields:** - Scope: current tab, selected tabs, current window,
supported tab group. - Destination collection. - Save thumbnail toggle
(on by default where capture is supported). - Optional offline archive
toggle (off by default). - Action: Save only or Save and close. - Count
of tabs and any private/restricted tabs excluded.

**Transaction stages:** 1. Validate selection and exclusions. 2. Stage
metadata and thumbnails. 3. Persist files and database records. 4.
Verify required writes. 5. Mark operation successful. 6. If requested,
close only successfully saved tabs. 7. Report skipped/failed tabs
individually.

**Failure behavior:** if the database, file write, or verification
fails, do not close the affected source tab. Allow retry and diagnostic
details.

### 9.6 Browser extension popup

**Purpose:** Fast capture without opening the desktop app.

**Content:** - Compact Tabsed mark and connection state. - Save Current
Tab. - Save Current Window. - Save Selected Tabs/Group where
supported. - Collection selector. - Save and close action with
confirmation. - Open Tabsed button. - Link to connection help.

**Rules:** - Use minimal permissions. - Do not capture page content by
default beyond supported metadata/thumbnail capture. - Never close tabs
before the native service confirms persistence. - If desktop service is
unavailable, offer to open the app or save a limited pending record only
if that behavior is explicitly designed and safely recoverable.

### 9.7 Restore queue

**Purpose:** Restore large sessions without overwhelming the browser.

**Controls:** - Destination browser/profile. - Total items and estimated
number of batches. - Batch size. - Delay between batches. - Open
pinned/grouped tabs when supported. - Start, pause, resume, cancel,
retry failed. - Per-item state: queued, opening, opened, failed,
skipped.

**Rules:** - Show a confirmation before opening large numbers of tabs. -
Do not claim a page loaded successfully merely because a tab was
created. - Preserve failed items for retry. - Cancel prevents future
batches; it cannot necessarily close tabs already opened.

### 9.8 Collections

**Purpose:** Group tabs by project or topic.

**Features:** - Create, rename, reorder, and delete collections. - Add
description/notes, icon, and optional accent. - Add items without
duplicating underlying files. - Show item count and total measured
archive size. - Support moving selected items between collections. -
Confirm collection deletion and explain whether items will be unassigned
or deleted.

### 9.9 Search in Archives

**Purpose:** Search text captured from supported saved pages.

**UI:** - Search field. - Filters for collection, domain, capture date,
and archive status. - Result title, domain, matching snippet, capture
date, and capture type. - Open snapshot and open live page actions. -
Explicit empty state when no indexed archives exist.

**Rules:** - Search only content actually indexed. - Show indexing
status and failures. - Avoid indexing excluded/private items. - Deleting
an archive should remove its index entries according to user choice.

### 9.10 Duplicates

**Purpose:** Help users resolve repeated URLs.

**UI:** - Groups of matching/normalized URLs. - Show browser/profile,
saved date, collection, notes, and archive presence. - Explain the
normalization rule that produced a match. - Actions: keep both, merge
metadata, move, or delete selected items.

**Safety:** never auto-delete. Merging must preserve notes and archive
references, with conflict resolution.

### 9.11 Link availability

**Purpose:** Flag URLs that may no longer respond.

**UI:** - Last checked timestamp. - Status categories: reachable,
redirected, authentication required, blocked/uncertain, timeout,
network/DNS/TLS error. - Retry and bulk-check actions. - Filters by
status and age.

**Safety:** do not treat a failed automated request as proof that a site
is gone. Never auto-delete.

### 9.12 Storage explorer

**Purpose:** Show where vault data lives and how much space it uses.

**Sections:** - Vault root path and free space. - Exact vault-owned
storage by category. - Storage by collection and age. - Largest files. -
Browser profile directory reports, separate from vault storage. - Quotas
and cleanup preview. - Backup status. - Orphaned file scan.

**Labels:** - **Exact:** measured files owned by Tabsed. - **Estimated /
changing:** profile-level scan where files may change or be locked. -
**Unavailable:** data the browser does not expose. - Never label per-tab
cache size as exact when attribution is unsupported.

**Deletion behavior:** - Dry-run preview before cleanup. - Separate
controls for vault files and any supported browser-data clearing. -
Never directly edit active profile/cache databases. - Explain expected
reclaimed space and uncertainty.

### 9.13 Trash and recovery

-   List deleted items with deletion time and retention deadline.
-   Restore selected items.
-   Permanently delete with confirmation.
-   Empty trash confirmation includes item count and measured bytes.
-   If archive file deletion fails, preserve database state and show
    retryable cleanup status.

### 9.14 Backup and restore

-   Configure destination and retention.
-   Run backup now.
-   Show progress and per-file status.
-   Verify checksums after writing.
-   Restore to a staging location before replacing active state.
-   Support rollback on failure.
-   Exclude browser profile data and credentials by default.

### 9.15 Portable vault / import-export

-   Choose export destination.
-   Include metadata, thumbnails, optional archives, notes, tags, and
    manifest.
-   Show total expected size and required free space.
-   Validate paths and hashes on import.
-   Resolve schema upgrades and duplicates.
-   Use relative paths and versioned manifest.
-   Avoid absolute-path assumptions that break when moved to another
    drive.

### 9.16 Settings

Organize into concise sections:

**Appearance** - System/light/dark theme. - Accent presets and custom
color. - Mica/reduced transparency/solid surface. -
Compact/comfortable/spacious density. - Grid default and thumbnail
behavior.

**Browsers** - Installed connectors. - Browser/profile list. -
Permissions and connection state. - Reconnect, test, and
troubleshooting.

**Storage** - Vault location. - Quotas, retention, backup location. -
Archive and thumbnail policies.

**Privacy** - Private-tab exclusion. - Sensitive-domain preview
redaction. - Encryption/key recovery. - Local-only behavior and data
export/deletion.

**Automation** - Inactivity thresholds. - Protected domains and
collections. - Allowed automatic actions. - Schedule and audit history.

**Advanced** - Diagnostics, log export with redaction, update channel,
reset preferences.

### 9.17 System tray

Optional component with: - Open Tabsed. - Save current window (only when
connector supports it). - Search vault. - Restore recent session. -
Pause/resume automation. - Exit.

Tray actions must report if the browser connector is unavailable. The
tray is not a substitute for extension permissions.

### 9.18 Help and diagnostics

-   Connector status and last handshake.
-   Required permissions and links to browser-specific instructions.
-   Test capture without closing tabs.
-   Test restore with one selected tab.
-   Log export with URLs and sensitive data redacted by default.
-   Common errors: native host not registered, extension disabled,
    browser closed, profile missing, vault read-only, insufficient disk
    space, file locked.

## 10. Design System

### 10.1 Visual direction

-   Professional, calm, Apple-inspired layout principles.
-   Windows-native behavior and Mica-first backdrop.
-   Light theme default for initial mockups; dark and system themes
    available.
-   Soft blue accent default; optional violet, mint, rose, amber,
    graphite, and custom color.
-   Content surfaces sufficiently opaque for legibility.
-   Glass effect concentrated on app frame, navigation, and occasional
    floating panels---not every card.
-   Consistent outline icon family; no mixing unrelated icon styles.
-   Avoid large decorative backgrounds, excessive badges, nested cards,
    and unnecessary dividers.

### 10.2 Layout tokens

Use a consistent spacing scale, for example 4, 8, 12, 16, 20, 24, and 32
px. Prefer whitespace and alignment over decorative separators.

-   Sidebar: fixed but collapsible; target approximately 220--260 px at
    common desktop sizes.
-   Main content: flexible width.
-   Detail inspector: optional, target approximately 280--340 px when
    visible.
-   Cards: consistent thumbnail aspect ratio and card padding.
-   Minimum window size should be validated through usability testing;
    design responsively rather than hard-coding a single screen
    resolution.

### 10.3 Typography

Use a system-native UI font stack suitable for Windows. Establish a
small type scale for page titles, section headings, card titles, body
text, and metadata. Avoid using multiple typefaces. Metadata must remain
readable and not be the primary visual element.

### 10.4 Icons

Use one consistent line-icon family with uniform stroke weight. Icons
that are not universally understood require labels or tooltips. Selected
state should combine color and shape/background, not color alone.

### 10.5 Motion

Use short, restrained transitions for selection, menus, and panels.
Avoid animated blur, continuous parallax, or effects across large card
collections. Respect reduced-motion preferences where feasible.

### 10.6 Theme accessibility

Custom accent colors must not allow critical text or focus indicators to
become unreadable. Validate foreground/background contrast and provide a
fallback when a custom color is unsuitable.

## 11. Technical Architecture

### 11.1 Proposed stack

-   **Desktop shell:** Tauri.
-   **Frontend:** React + TypeScript.
-   **Backend:** Rust commands/services.
-   **Database:** SQLite.
-   **Browser integration:** separate extension packages for Chromium
    browsers; Firefox connector later.
-   **Desktop communication:** native messaging to a narrow local
    service/API.
-   **Archive storage:** files in a user-selectable vault root; database
    stores relative paths.
-   **Search:** SQLite FTS5 or another well-supported local full-text
    index, subject to dependency and platform validation.
-   **Integrity:** cryptographic hashes for archive/backup verification
    using vetted libraries.
-   **Packaging:** signed installer when release infrastructure is
    available; development builds may be unsigned but must be clearly
    identified.

The stack is a proposal, not a claim that every integration detail is
already proven. Validate Tauri plugin support, Windows backdrop
behavior, native messaging installation, and browser packaging early
with a vertical-slice prototype.

### 11.2 Components

1.  **UI shell:** navigation, cards, filters, detail inspector, dialogs,
    settings.
2.  **Application service layer:** use cases and validation independent
    of UI.
3.  **Persistence layer:** SQLite schema and migrations.
4.  **Vault filesystem manager:** staged writes, relative paths, size
    accounting, cleanup, hashing.
5.  **Browser connector interface:** capability discovery, capture,
    close, open, profile selection, group operations.
6.  **Chromium extension:** reads supported tab metadata, requests
    screenshots where permitted, sends explicit operations to native
    host.
7.  **Native-messaging host:** validates message size/schema, authorizes
    operations, forwards narrow requests to the desktop service.
8.  **Restore queue:** concurrency control, rate limiting, progress,
    cancellation.
9.  **Search/indexing service:** metadata and archive text indexing.
10. **Availability service:** rate-limited URL checks and status
    classification.
11. **Backup/import service:** manifests, hashes, schema versioning,
    staging, rollback.
12. **Privacy/security service:** permissions, encryption integration,
    redaction, sensitive logging rules.
13. **Diagnostics:** structured logs with redaction and export.

### 11.3 Browser connector contract

Define a typed connector interface with capabilities rather than
assuming all browsers support the same actions. Suggested capabilities:

-   `listTabs`
-   `captureMetadata`
-   `captureThumbnail`
-   `closeTabs`
-   `openUrls`
-   `selectProfile`
-   `restorePinnedState`
-   `restoreTabGroups`
-   `privateModeAvailable`
-   `queryProfileStorage`

Each capability must report supported, unsupported, denied, or
unavailable. Browser APIs differ, and some profile-level operations may
require a desktop helper rather than an extension.

### 11.4 Browser integration constraints

-   Use official browser extension APIs for supported operations.
-   Minimize permissions and explain them to the user.
-   Do not collect cookies/passwords/authentication databases.
-   Do not assume a browser extension can arbitrarily launch or select
    every profile.
-   Profile selection/launch is browser-specific and needs integration
    tests.
-   Incognito access requires explicit extension permission and browser
    support.
-   Restricted/internal browser pages may not allow screenshots or
    scripting.
-   A tab-created event does not mean the page loaded successfully.
-   Cross-browser restoration transfers URLs and supported metadata, not
    necessarily browser-specific session state.

### 11.5 Save-and-close transaction design

A capture operation should use explicit states:

`requested → validated → capturing → staged → persisted → verified → committed → source-tabs-closed`

Failure states include `partial`, `failed`, and `cancelled`.

Rules: 1. Capture only permitted metadata and assets. 2. Write assets to
temporary/staging files. 3. Commit metadata and file references in a
database transaction where possible. 4. Verify required assets exist and
are readable. 5. Mark the operation committed. 6. Close only the source
tabs included in the committed result. 7. If partial capture is allowed,
show exactly which tabs were committed and close only those explicitly
approved by the user. 8. On crash recovery, reconcile staging files and
database records; never assume an incomplete operation is safe to close.

### 11.6 Data model (initial logical schema)

**`vaults`** - `id` (UUID/text primary key) - `name` - `root_path` -
`created_at` - `updated_at` - `quota_bytes` nullable - `schema_version`

**`items`** - `id` - `vault_id` - `item_type` (`tab`, `session`,
`snapshot`) - `title` - `url` - `normalized_url` - `domain` -
`favicon_path` nullable - `thumbnail_path` nullable - `browser_family`
nullable - `profile_label` nullable - `saved_at` - `last_opened_at`
nullable - `notes` - `is_favorite` - `deleted_at` nullable -
`availability_status` nullable - `availability_checked_at` nullable

**`sessions`** - `id` - `vault_id` - `title` - `created_at` -
`source_browser` - `source_profile_label` - `notes`

**`session_items`** - `session_id` - `item_id` - `original_order` -
`pinned` - `group_label` nullable - `original_window_index` nullable

**`collections`** - `id` - `vault_id` - `parent_id` nullable - `name` -
`description` - `icon_key` nullable - `accent_color` nullable -
`sort_order`

**`collection_items`** - `collection_id` - `item_id` - `added_at`

**`tags`** - `id` - `vault_id` - `name` - `color` nullable

**`item_tags`** - `item_id` - `tag_id`

**`archives`** - `id` - `item_id` - `archive_type` (`thumbnail`, `html`,
`resource_bundle`, `text_index`, `backup`) - `relative_path` -
`size_bytes` - `sha256` or equivalent hash - `created_at` -
`capture_status` - `capture_notes` nullable - `encrypted` boolean

**`capture_jobs`** - `id` - `state` - `requested_at` - `completed_at`
nullable - `source_connector` - `requested_action` - `success_count` -
`failure_count` - `error_summary` nullable

**`restore_jobs` / `restore_job_items`** - Destination browser/profile,
batch settings, state, item ordering, attempts, errors, timestamps.

**`availability_checks`** - `id` - `item_id` - `checked_at` -
`result_category` - `http_status` nullable - `redirect_target`
nullable - `error_code` nullable - `duration_ms` nullable

**`backups`** - `id` - `created_at` - `destination` - `manifest_path` -
`size_bytes` - `status` - `integrity_status`

**`settings`** - key/value or typed tables for theme, accent, density,
vault path, privacy, quotas, automation.

Use migrations and foreign keys. Avoid storing secrets in generic
settings rows. Add indexes for URL, normalized URL, domain, saved date,
collection membership, and FTS fields.

### 11.7 Suggested vault directory

``` text
TabsedVault/
  manifest.json
  database/
    tabsed.sqlite
  thumbnails/
    ab/
      <item-id>.webp
  archives/
    <item-id>/
      capture.json
      index.html
      resources/
  indexes/
    archive-fts.sqlite
  backups/
    <timestamp>/
      manifest.json
      database.snapshot
  trash/
    <deletion-id>/
  temp/
```

The database may be located separately if needed for locking or
reliability, but the user-facing portable export should contain a
versioned manifest and relative paths. Temporary files must be
reconciled after crashes. Do not place browser-native cache or profile
databases inside this vault.

### 11.8 Storage accounting rules

-   Sum exact sizes of files owned by Tabsed for the vault total.
-   Decide whether database WAL/journal files are included and document
    the convention.
-   Do not double-count files referenced by multiple collections.
-   Report logical item sizes and physical file sizes separately if
    deduplication is introduced.
-   Profile directory size is a profile-level measurement, not an
    attribution to a particular tab.
-   Locked/changing files can make profile scans incomplete; show status
    and timestamp.
-   Browser cache cannot generally be exported or attributed precisely
    per tab.
-   Cleanup must calculate candidate bytes and identify exact files
    before deletion.
-   Use staged moves and verify hashes before deleting the source during
    vault relocation.

## 12. Security and Privacy Requirements

### 12.1 Threat model

Potential risks include malicious web content, compromised extensions,
unauthorized local processes, accidental private-tab capture, archive
leakage, path traversal in imports, corrupted manifests, log leakage,
and deletion of the wrong files.

### 12.2 Required mitigations

-   Validate all native-messaging message schemas and sizes.
-   Restrict local IPC to the expected app/extension workflow; do not
    expose a permissive unauthenticated HTTP endpoint.
-   Use origin/extension identity checks where supported.
-   Use canonicalized paths and reject path traversal during import.
-   Treat archived HTML and resources as untrusted content. Do not
    execute archived scripts in the privileged desktop app context.
-   Open offline captures in a sandboxed viewer or browser context with
    suitable restrictions.
-   Redact URLs/query strings and page content from logs by default
    where they may contain secrets.
-   Avoid copying cookies or authentication state.
-   Use vetted encryption primitives and OS-supported key storage where
    appropriate.
-   Explain that encryption protects stored files but does not make an
    already unlocked session invulnerable.
-   Keep private-mode capture off by default.
-   Verify hashes and manifest paths before import/restore.
-   Require explicit confirmation for permanent deletion and
    browser-data clearing.
-   Provide a privacy policy before any optional network-dependent
    feature is released.

### 12.3 Availability checks and SSRF-like risks

Availability checks must be initiated by the user or explicit local
automation. Validate URLs, limit protocols to supported web schemes by
default, prevent access to unintended local/private-network targets
unless deliberately allowed, apply timeouts and concurrency limits, and
avoid exposing internal service endpoints. The app must distinguish
network failures from confirmed HTTP responses.

## 13. Non-Functional Requirements

### 13.1 Performance

Initial engineering targets, to be validated on representative Windows
hardware:

-   App shell becomes interactive promptly on a typical supported
    machine; define a measured startup target during MVP profiling.
-   Search over local metadata should feel immediate for a library of at
    least 10,000 records on reference hardware.
-   Grid rendering must be virtualized or paginated for large
    collections.
-   Thumbnail loading must be asynchronous and bounded.
-   Capture/restore progress must not block the UI thread.
-   Availability checks must use bounded concurrency.
-   No continuous large-area blur or animation on the library grid.
-   Storage scans must be cancellable and must not freeze the UI.
-   Memory and startup benchmarks should be recorded before each
    release.

Do not claim hard performance guarantees until measured. Establish a
reference Windows machine and benchmark dataset.

### 13.2 Reliability

-   Database migrations must be transactional and tested.
-   File operations use staging and recovery routines.
-   App crash during capture must not lead to source tabs being closed
    prematurely.
-   Backup integrity and restore must be tested.
-   Import must be staged and reversible.
-   Every destructive operation should have an observable result and
    retry path.

### 13.3 Accessibility

-   Full keyboard navigation and visible focus.
-   Semantic labels for icon-only controls.
-   Contrast validation for built-in and custom themes.
-   Do not convey status by color alone.
-   Respect system text scaling where possible.
-   Reduced transparency and reduced motion options.
-   Screen-reader-friendly status and progress messages.

### 13.4 Compatibility

-   Initial target: supported current Windows 10/11 configurations, with
    exact support matrix decided after Tauri and backdrop validation.
-   Edge and Chrome extensions use supported extension APIs and manifest
    requirements.
-   Firefox support is a later connector unless early feasibility
    testing changes the plan.
-   Do not promise every browser/profile/private mode is supported
    equally.

### 13.5 Data integrity

-   Foreign keys and migrations.
-   Archive hashes.
-   Manifest versioning.
-   Orphan-file scanner.
-   Recovery for stale staging records.
-   Explicit behavior for disk full, read-only directories,
    external-drive removal, and permission denial.

## 14. Error States and Recovery UX

Every error should state: what happened, what remains safe, what the
user can do next, and whether any source tabs were closed.

Required cases: - Browser extension missing/disabled. - Native host not
registered or handshake failed. - Permission denied. - Thumbnail
unavailable. - Restricted page. - Partial capture. - Vault path
missing/read-only. - Insufficient disk space. - Database
locked/corrupt. - Browser profile missing. - Restore tab creation
failed. - Availability timeout or blocked request. - Archive capture
incomplete. - Backup hash mismatch. - Import path traversal/invalid
manifest. - External drive disconnected. - Encryption key unavailable. -
Cleanup unable to remove a file.

Never show a generic "success" when only part of the requested operation
succeeded.

## 15. Telemetry, Updates, and Packaging

-   No mandatory telemetry.
-   Default diagnostics stay local.
-   Any optional diagnostics sharing must be opt-in, reviewed, and
    redact browsing data.
-   Use signed release artifacts when distribution infrastructure is
    established.
-   Clearly distinguish development builds from production releases.
-   Extension updates and desktop app updates must be
    version-compatible; detect mismatched native messaging protocol
    versions.
-   Provide a local backup/export path before database migrations or
    major upgrades.
-   Include a changelog and rollback/recovery instructions for release
    candidates.

## 16. Acceptance Criteria

### MVP release gate

-   A user can install and launch Tabsed without an account.
-   A user can choose Basic setup and use the library with
    imported/manual records.
-   A connected Edge/Chrome user can capture a tab and a window.
-   Metadata and thumbnails persist after app restart.
-   Save-and-close does not close tabs when persistence fails.
-   A saved item can be opened in its original URL.
-   Supported restoration can target a chosen browser/profile or clearly
    report why it cannot.
-   Collections, tags, favorites, notes, search, grid/list views work.
-   Light/dark/system themes and accent presets persist.
-   The app labels snapshots versus live pages clearly.
-   Vault-owned storage sizes are exact and do not count shared files
    multiple times.
-   Private tabs are excluded by default.
-   No credentials/cookies are copied to the vault.
-   Tests cover disk-full and partial-save failure paths.
-   Accessibility and performance smoke tests pass.

### Phase 2 release gate

-   Duplicate detection explains matching rules and never auto-deletes.
-   Storage explorer distinguishes exact vault sizes from profile-level
    reports.
-   Trash restore and permanent deletion work.
-   Backup verification detects corruption.
-   Cleanup previews exact candidate files.
-   Quotas do not remove required session metadata.

### Phase 3 release gate

-   Restore queue can pause, resume, cancel, and retry.
-   Availability checks classify uncertain results without deleting
    data.
-   Full-text search only returns indexed supported content.
-   Browser connector capability differences are visible.
-   Bulk operations are cancellable and rate-limited.

### Phase 4 release gate

-   Portable import/export validates schema and hashes.
-   Encryption/key recovery behavior is documented and tested.
-   Private-vault lifecycle is explicit.
-   Offline archives report completeness limitations.
-   Automated cleanup is previewable, reversible where possible, and
    covered by tests.

## 17. Risks and Mitigations

  -------------------------------------------------------------------------
  Risk                      Impact                  Mitigation
  ------------------------- ----------------------- -----------------------
  Browser APIs differ       Inconsistent restore    Capability-based
                            behavior                connector interface and
                                                    browser-specific tests

  Exact runtime state       User expectations       Clear labels and honest
  cannot be restored        mismatch                product copy

  Native cache cannot be    Storage feature         Separate vault archives
  exported per tab          overpromises            from browser
                                                    profile/cache reporting

  Native messaging setup is Beginner onboarding     Guided installer,
  complex                   friction                connection test, Basic
                                                    mode

  Huge libraries strain UI  Sluggish browsing       Virtualization,
                                                    thumbnail cache, async
                                                    search

  Offline capture is        Misleading archives     Capture status,
  incomplete                                        limitations, optional
                                                    feature

  Sensitive page content    Privacy harm            Local-first,
  leaks                                             encryption, redacted
                                                    logs, private-mode
                                                    defaults

  Cleanup deletes needed    Data loss               Dry-run preview, trash,
  files                                             hashes, no direct
                                                    profile DB editing

  Portable import contains  Security issue          Manifest validation,
  malicious paths/content                           canonical paths,
                                                    sandboxed viewer

  Glass effects harm        UI cost and             Mica-first, restrained
  performance/readability   accessibility           Acrylic,
                                                    reduced-effects mode
  -------------------------------------------------------------------------

## 18. Open Decisions

These decisions can be made during implementation planning without
blocking the initial architecture:

1.  Final app icon and trademark/domain availability.
2.  Exact minimum supported Windows version after Tauri/backdrop
    testing.
3.  Final extension permissions for each supported browser.
4.  Whether encryption is applied per archive, per vault, or both.
5.  Whether nested collections are needed in the first stable release.
6.  Archive format and viewer isolation strategy.
7.  Default backup retention and trash retention.
8.  Update delivery/signing infrastructure.
9.  Whether a future cloud-sync feature is desired; it is out of initial
    scope.
10. Final performance thresholds based on a benchmark machine and
    dataset.

## 19. Definition of Done

A feature is complete only when: - Its behavior is documented. - UI
states include loading, empty, success, partial failure, and error where
applicable. - Data migrations are included when needed. -
Security/privacy implications are reviewed. - Keyboard and accessibility
behavior is verified. - Unit/integration tests cover success and failure
paths. - Storage effects and deletion semantics are clear. - Logs do not
expose sensitive browsing content by default. - Documentation and
user-facing copy match the actual capability. - No unsupported
capability is represented as guaranteed.

------------------------------------------------------------------------

## Appendix A --- Core UX Copy

**Save and close:** "Tabsed will save the selected tab details and
previews before closing the original tabs. If saving fails, those tabs
will stay open."

**Offline archive:** "This is a saved copy of supported page content.
Some dynamic features, protected resources, or login-dependent content
may not be available offline."

**Availability check:** "This result describes what Tabsed could verify
from this network request. A blocked or timed-out request does not
necessarily mean the website is gone."

**Profile storage:** "This is the size of the browser profile folder,
not the cache size attributable to one tab. The value may change while
the browser is running."

**Restore session:** "Tabsed can reopen saved URLs and supported tab
organization. Website runtime state, unsaved input, and authentication
may not be restored."

**Private browsing:** "Private tabs are excluded by default. Enabling
capture may store sensitive page titles, URLs, and previews in this
vault."

## Appendix B --- Reference Product Summary

-   **Name:** Tabsed
-   **Tagline:** Your tabs, thoughtfully put away.
-   **Platform:** Windows desktop first
-   **Integration:** Basic desktop-only mode, optional extensions/native
    messaging, optional tray
-   **Browsers:** Edge and Chrome first; Firefox later
-   **Visual style:** clean professional, Apple-inspired principles,
    Windows Mica-first
-   **Core stack:** Tauri + React + TypeScript + Rust + SQLite
-   **Data model:** local metadata plus vault-owned files
-   **Default privacy:** local-first, private tabs excluded, no
    credential copying
-   **Roadmap:** core MVP → storage/control → discovery/restoration →
    advanced vault
