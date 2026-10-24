# Tabsed --- Implementation Plan and To-Do List

**Document status:** Execution backlog aligned to `Tabsed.md`\
**Version:** 1.0\
**Date:** 2026-10-24

This checklist is intentionally implementation-oriented. Complete tasks
in dependency order, keep the PRD current when decisions change, and do
not mark a task complete without its acceptance criteria and tests.

## How to Use This Plan

-   `[ ]` Not started
-   `[x]` Completed
-   `[~]` In progress
-   `[!]` Blocked / requires a decision

Each task should become an issue or coding-agent work item. Work in
small vertical slices. Keep the app runnable at the end of every phase.
Do not implement all screens with mock data and then postpone
persistence/security integration; prove the end-to-end capture path
early.

## Phase 0 --- Project Foundation and Technical Spikes

### Epic 0.1 --- Repository and engineering baseline

-   [x] Create repository and main branch protections.
-   [x] Add `Tabsed.md` and `TabsedToDo.md` to the repository root.
-   [x] Add a concise `README.md` with product summary, stack, setup,
    and limitations.
-   [x] Add `.gitignore` for Rust, Node, Tauri, SQLite temporary files,
    local vaults, secrets, and build artifacts.
-   [x] Add formatting/lint configuration for Rust and TypeScript.
-   [x] Add a standard issue template for bug, feature, and security
    reports.
-   [x] Define branch/commit conventions and code review expectations.
-   [x] Add CI for formatting, linting, unit tests, and build checks.
-   [x] Define a supported development environment and pin toolchain
    versions.
-   [x] Add dependency inventory and license review process.

**Acceptance criteria** - A clean clone can install dependencies and run
a documented development command. - CI fails on formatting/lint/test
failures. - No real browser profile, user archive, key, or secret is
committed.

### Epic 0.2 --- Validate desktop stack and Mica

-   [x] Create a minimal Tauri + React + TypeScript app.
-   [x] Validate Rust command invocation and typed frontend/backend
    responses.
-   [x] Validate Windows Mica/backdrop behavior on supported Windows
    versions.
-   [x] Test resizing, maximize/restore, minimize, multi-monitor
    behavior, and high DPI.
-   [x] Test solid/reduced-transparency fallback.
-   [x] Test light/dark/system theme persistence.
-   [x] Measure idle CPU and memory baseline.
-   [x] Test keyboard navigation and native window controls.
-   [x] Record known visual limitations and choose fallback behavior.

**Acceptance criteria** - Mica is applied only where supported and does
not prevent readable content. - The app remains usable with all
transparency disabled. - Window behavior is stable during resize and
display scaling.

### Epic 0.3 --- Validate browser integration early

-   [x] Build a minimal Chromium extension for Edge and Chrome.
-   [x] Read supported tab metadata using official extension APIs.
-   [x] Capture a screenshot on a normal permitted page.
-   [x] Verify behavior on restricted/internal pages where screenshot
    may be unavailable.
-   [x] Prototype native messaging registration and message exchange.
-   [x] Validate message size limits, schema validation, and extension
    identity checks.
-   [x] Test extension disabled, native host missing, desktop app
    closed, and version mismatch.
-   [x] Document permissions required and why each is needed.
-   [x] Verify incognito/private mode is excluded by default.
-   [x] Create a capability matrix for Edge/Chrome APIs.

**Acceptance criteria** - A tab's title and URL can reach the desktop
app through a validated channel. - Unsupported capture is reported
instead of silently failing. - No cookies/passwords/authentication data
are read or copied. - No tab is closed by this spike.

### Epic 0.4 --- Prove file/database consistency

-   [x] Create a SQLite database with migration support.
-   [x] Implement a test write/read transaction.
-   [x] Implement staged file writing and hash verification.
-   [x] Simulate disk full and permission denied.
-   [x] Simulate app termination during staging.
-   [x] Design startup reconciliation for temporary/orphaned files.
-   [x] Define when a capture job is considered committed.

**Acceptance criteria** - Failed writes do not create a false successful
record. - Recovery can identify incomplete staging artifacts. -
Source-tab closure is not part of the system until the commit protocol
is tested.

## Phase 1 --- Core MVP

### Epic 1.1 --- App shell and navigation

-   [x] Build responsive desktop shell with sidebar, title/header, main
    workspace, and optional detail inspector.
-   [x] Implement All Tabs, Collections, Recent, Favorites, Trash,
    Browsers, Tools, Storage, Settings, and Help destinations.
-   [x] Keep sidebar grouped and avoid overcrowding the main navigation.
-   [x] Implement collapsible sidebar.
-   [x] Implement global search field and keyboard shortcut.
-   [x] Implement empty states and first-run hints.
-   [x] Add consistent loading, error, and no-results states.
-   [x] Add accessible labels/tooltips for icon-only controls.
-   [x] Validate layout at minimum window size, common desktop sizes,
    high DPI, and text scaling.

**Acceptance criteria** - All primary destinations are reachable by
mouse and keyboard. - No horizontal overflow in supported window
sizes. - Sidebar selected state is clear without color alone.

### Epic 1.2 --- Design system and themes

-   [x] Define spacing, typography, corner radius, border, shadow, and
    icon tokens.
-   [x] Choose one consistent line-icon library and document usage.
-   [x] Implement system/light/dark theme.
-   [x] Implement accent presets: blue, violet, mint, rose, amber,
    graphite.
-   [x] Implement custom accent picker.
-   [x] Implement compact/comfortable/spacious density.
-   [x] Implement Mica-first backdrop and solid/reduced-transparency
    mode.
-   [x] Persist user preferences.
-   [x] Validate contrast for built-in palettes and reject or compensate
    for unreadable custom combinations.
-   [x] Respect reduced-motion preferences where feasible.
-   [x] Ensure glass effects are restrained and do not blur every card.
-   [x] Test focus rings, hover, selected, disabled, error, and
    destructive states.

**Acceptance criteria** - Theme changes do not require restarting the
app unless a platform limitation is documented. - Custom accent colors
do not make primary text or focus states inaccessible. - Reduced-effects
mode remains polished and readable.

### Epic 1.3 --- Vault location and database

-   [x] Define initial SQLite schema from `Tabsed.md`.
-   [x] Add schema migrations and foreign-key constraints.
-   [x] Create first-run vault folder selection.
-   [x] Validate path permissions and available disk space.
-   [x] Store vault-owned paths as relative paths where appropriate.
-   [x] Add vault manifest with schema version and vault identifier.
-   [x] Add database backup snapshot mechanism suitable for SQLite.
-   [x] Add database corruption detection and user-facing recovery path.
-   [x] Add unit tests for migrations, relationships, and invalid
    records.
-   [x] Document whether database WAL/journal files are included in
    storage reports.

**Acceptance criteria** - The database survives app restart and schema
migration tests. - An invalid/unwritable vault location is rejected with
actionable feedback. - No credential or cookie storage is added.

### Epic 1.4 --- Capture metadata and thumbnails

-   [x] Define typed capture request/response schema.
-   [x] Capture title, URL, domain, favicon when available, browser
    family, profile label when known, capture timestamp, order, pinned
    state, and supported group/window metadata.
-   [x] Capture thumbnail where permitted.
-   [x] Add a stable placeholder for failed/restricted screenshot
    capture.
-   [x] Stage image files before database commit.
-   [x] Hash and verify saved thumbnail files.
-   [x] Store item/session relationships without duplicating shared
    assets.
-   [x] Add partial-failure representation for a multi-tab capture.
-   [x] Add tests for empty title, invalid URL, missing favicon,
    restricted page, and thumbnail failure.
-   [x] Add crash recovery for incomplete staging files.

**Acceptance criteria** - Metadata and thumbnails persist after
restart. - Capture errors are visible per item. - The UI never pretends
a missing screenshot was captured.

### Epic 1.5 --- Save-and-close transaction

-   [x] Implement explicit Save only, Save and close, and Cancel
    actions.
-   [x] Implement capture job state machine.
-   [x] Persist and verify required records/files before close.
-   [x] Close only successfully committed tabs approved for closure.
-   [x] Preserve failed tabs and explain why they remain open.
-   [x] Add confirmation showing how many tabs will be saved/closed.
-   [x] Add crash-recovery tests at every transaction state.
-   [x] Add integration tests for one tab, multiple tabs, partial
    failure, and user cancellation.
-   [x] Add operation history with redacted diagnostics.

**Acceptance criteria** - If persistence fails, the affected source tabs
remain open. - A partial capture closes only tabs explicitly confirmed
as successfully saved. - UI status accurately distinguishes saved,
failed, and skipped items.

### Epic 1.6 --- Visual library

-   [x] Implement Grid, Compact List, and Detailed List.
-   [x] Implement individual tab and session cards.
-   [x] Display preview, title, domain, date, and concise tags.
-   [x] Add selection state and multi-select.
-   [x] Add card context menu with open, edit, move, favorite, check,
    and delete actions as features become available.
-   [x] Implement sorting and metadata filters.
-   [x] Implement collection and tag chips with overflow behavior.
-   [x] Add lazy thumbnail loading and bounded image cache.
-   [x] Implement virtualization or pagination for large libraries.
-   [x] Add no-items, no-results, missing-thumbnail, and archive-missing
    states.
-   [x] Add responsive column count based on available width.
-   [x] Test with synthetic libraries of 100, 1,000, and 10,000 records.

**Acceptance criteria** - Large libraries do not render every thumbnail
simultaneously. - Grid and list layouts retain consistent metadata and
keyboard behavior. - Cards do not become cluttered with every available
field.

### Epic 1.7 --- Collections, tags, favorites, and notes

-   [x] Create, rename, reorder, and delete collections.
-   [x] Add items to multiple collections without duplicating files.
-   [x] Add/remove tags and favorites.
-   [x] Add item notes and collection notes.
-   [x] Add search over notes.
-   [x] Add autosave status for notes.
-   [x] Add conflict handling for note edits if multiple UI contexts can
    edit simultaneously.
-   [x] Add bulk move/tag/favorite actions.
-   [x] Add confirmation for collection deletion and explain item
    behavior.
-   [x] Add tests for orphan prevention and collection membership.

**Acceptance criteria** - Deleting a collection does not unexpectedly
delete its items. - Notes persist across restarts and are searchable. -
Multi-collection membership does not double-count physical file size.

### Epic 1.8 --- Search and filters

-   [x] Implement metadata search over title, URL, domain, tags,
    collection, and notes.
-   [x] Add debounce and cancellation for expensive searches.
-   [x] Add filters for item type, browser, profile, date, and tags.
-   [x] Add keyboard shortcut and clear-search action.
-   [x] Highlight matching metadata where useful without harming
    readability.
-   [x] Test Unicode, punctuation, long URLs, and empty queries.
-   [x] Benchmark 10,000-item search on reference hardware.

**Acceptance criteria** - Search results are correct and responsive on
the agreed benchmark dataset. - Search state and filters can be cleared
predictably. - Search never requires network access for local metadata.

### Epic 1.9 --- Restore a tab or session

-   [x] Implement single-item open.
-   [x] Implement session restore to a selected supported browser.
-   [x] Build a browser/profile destination selector based on detected
    capabilities.
-   [x] Report missing or inaccessible profiles.
-   [x] Restore supported tab order, pinned state, and groups.
-   [x] Show a confirmation before large restores.
-   [x] Label live page, saved snapshot, and session restore separately.
-   [x] Add error and retry behavior for failed tab creation.
-   [x] Add tests for browser closed, profile missing, connector
    disconnected, and partial restore.
-   [x] Document that live JavaScript state, unsaved input, and
    authentication are not guaranteed.

**Acceptance criteria** - Restore never silently selects an unintended
profile. - Partial failures are reported item by item. - The app does
not claim a tab has loaded merely because it was created.

### Epic 1.10 --- Onboarding, settings, and diagnostics

-   [x] Build first-run wizard.
-   [x] Allow Basic mode without extension installation.
-   [x] Offer Connected setup with guided extension installation.
-   [x] Add connector status and last-handshake display.
-   [x] Add test capture that does not close source tabs.
-   [x] Add test restore using a selected item.
-   [x] Add help for missing native host, disabled extension, and
    permission denial.
-   [x] Add log export with URL/content redaction by default.
-   [x] Add reset preferences action separate from deleting vault data.
-   [x] Test upgrade from first-run to Connected mode without data loss.

**Acceptance criteria** - Beginners can use the app without installing
extensions. - Connector failures do not make the saved library
accessible. - Diagnostic exports avoid sensitive browsing content by
default.

### Epic 1.11 --- MVP security and release readiness

-   [x] Review native messaging schema and origin/extension validation.
-   [x] Review path handling and prevent path traversal.
-   [x] Verify no cookie/password/auth database collection.
-   [x] Verify private tabs are excluded by default.
-   [x] Test disk-full and read-only vault behavior.
-   [x] Test app crash during save and restore.
-   [x] Run dependency and license review.
-   [x] Run accessibility smoke tests.
-   [x] Run performance baseline.
-   [x] Write installation, uninstall, backup, and troubleshooting
    instructions.
-   [x] Create release candidate and run clean-install tests on a clean
    Windows environment.

**Phase 1 release gate** - [x] Save, verify, and restore end-to-end
works for Edge and Chrome. - [x] Save-and-close failure safety is
proven. - [x] Core library works without browser integration. - [x]
Data persists across restart. - [x] Theme preferences persist. - [x]
No known critical security, data-loss, or privacy bugs remain.

## Phase 2 --- Storage and Control

### Epic 2.1 --- Storage explorer

-   [x] Define categories for database, thumbnails, archives, indexes,
    backups, trash, temporary files, and manifests.
-   [x] Calculate exact sizes for vault-owned files.
-   [x] Avoid double-counting shared assets.
-   [x] Show total vault size and available disk space.
-   [x] Show storage by category, collection, age, and largest files.
-   [x] Add profile-directory size reporting where accessible.
-   [x] Label profile scans with timestamp and incomplete/locked status.
-   [x] Explicitly state that per-tab native cache size is not generally
    available.
-   [x] Add cancellable background scans and progress.
-   [x] Add tests for missing files, symlinks/reparse points where
    relevant, locked files, and changing files.

**Acceptance criteria** - Vault-owned file sizes are exact according to
documented accounting rules. - Profile folder size is not represented as
per-tab cache. - Scan failure does not freeze the application.

### Epic 2.2 --- Duplicate detection

-   [x] Define conservative URL normalization rules.
-   [x] Preserve query and fragment by default.
-   [x] Make tracking-parameter stripping an explicit optional rule.
-   [x] Build duplicate groups across vault records and connected
    browser inventory where available.
-   [x] Show matching rule and source profile for each duplicate.
-   [x] Implement keep both, merge metadata, move, and delete selected
    actions.
-   [x] Preserve notes/tags/archive references during merge.
-   [x] Add undo or trash recovery for deletions.
-   [x] Test URL casing, default ports, fragments, tracking parameters,
    redirects, and similar-but-not-identical URLs.

**Acceptance criteria** - Duplicate detection explains why items
matched. - No duplicate is automatically deleted. - Merge cannot
silently discard notes or archive files.

### Epic 2.3 --- Trash and cleanup

-   [ ] Implement soft-delete state and recoverable trash.
-   [ ] Define trash retention settings.
-   [ ] Implement restore from trash.
-   [ ] Implement permanent deletion with confirmation.
-   [ ] Build dry-run cleanup preview.
-   [ ] List exact candidate files and bytes to be reclaimed.
-   [ ] Add orphaned-file scanner and safe cleanup.
-   [ ] Keep database and file deletion states consistent after partial
    failure.
-   [ ] Test cleanup interruption and external-drive removal.

**Acceptance criteria** - User can inspect cleanup candidates before
execution. - Failed deletion is visible and retryable. - Cleanup does
not edit active browser profile/cache databases.

### Epic 2.4 --- Quotas and retention policies

-   [ ] Add optional per-vault quota.
-   [ ] Warn at configurable thresholds.
-   [ ] Define eligible content types for pruning.
-   [ ] Allow pruning old thumbnails and optional archives only when
    explicitly configured.
-   [ ] Preserve session metadata unless the item is explicitly deleted.
-   [ ] Add dry-run and action history.
-   [ ] Ensure cleanup never runs invisibly on first launch.
-   [ ] Test quota handling when a save would exceed the limit.

**Acceptance criteria** - Quota enforcement never closes a tab before
its save state is safe. - User can see what will be pruned and how much
space may be reclaimed.

### Epic 2.5 --- Backup and integrity

-   [ ] Define backup manifest and version format.
-   [ ] Back up SQLite consistently.
-   [ ] Include required vault-owned files.
-   [ ] Hash files and verify after write.
-   [ ] Support configurable backup location and retention.
-   [ ] Add restore to staging directory.
-   [ ] Add rollback for failed restore.
-   [ ] Exclude browser profiles and credentials by default.
-   [ ] Test corrupted hash, missing file, disk full, and interrupted
    backup.
-   [ ] Show last successful backup and integrity status.

**Acceptance criteria** - Backup success is not reported until required
files verify. - Restore failure does not overwrite the active vault with
a partial state.

### Epic 2.6 --- Phase 2 testing and release

-   [ ] Run storage accounting tests on a fixture vault with known file
    sizes.
-   [ ] Verify collection membership does not double-count files.
-   [ ] Run duplicate-resolution tests.
-   [ ] Run trash recovery and permanent deletion tests.
-   [ ] Run backup/restore round-trip tests.
-   [ ] Run cleanup dry-run versus actual deletion comparison.
-   [ ] Update docs and UI help.
-   [ ] Release candidate review.

## Phase 3 --- Discovery and Advanced Restoration

### Epic 3.1 --- Restore queue

-   [x] Implement queue model and per-item state.
-   [x] Add configurable batch size and delay.
-   [x] Add start, pause, resume, cancel, retry.
-   [x] Add destination browser/profile selection.
-   [x] Show queued/opening/opened/failed/skipped states.
-   [x] Preserve original ordering when supported.
-   [x] Rate-limit tab creation.
-   [x] Clarify that cancel cannot necessarily close tabs already
    opened.
-   [x] Test queue interruption, connector loss, and partial failures.
-   [x] Benchmark large restores at multiple batch sizes.

**Acceptance criteria** - Queue state is recoverable during the current
app session. - Pausing prevents new batches from starting. - Failures
are individually retryable.

### Epic 3.2 --- Website availability checks

-   [x] Define result categories and schema.
-   [x] Restrict URL schemes to supported web protocols by default.
-   [x] Validate destinations and protect against unintended
    local/private-network access.
-   [x] Add connection timeout, bounded concurrency, and cancellation.
-   [x] Classify redirect, authentication required, blocked/uncertain,
    timeout, DNS/TLS/network errors, and reachable responses.
-   [x] Store last checked timestamp and status.
-   [x] Add bulk checks by collection and vault.
-   [x] Respect reasonable server response guidance and avoid aggressive
    repeated checks.
-   [x] Ensure failed checks never delete items.
-   [x] Test login-required sites, rate limiting, redirects, TLS
    failure, DNS failure, timeout, and offline mode.

**Acceptance criteria** - Uncertain failures are not labeled
definitively "dead." - Checks are cancellable and do not leak page
content/notes. - No availability result triggers deletion.

### Epic 3.3 --- Full-text archive search

-   [ ] Select and validate local FTS implementation.
-   [ ] Define indexed fields and tokenizer behavior.
-   [ ] Add archive indexing queue.
-   [ ] Index only successfully captured and permitted content.
-   [ ] Store capture/index status.
-   [ ] Show snippets and source URL in results.
-   [ ] Add filters by collection, domain, date, and archive status.
-   [ ] Remove/rebuild index entries on archive deletion or re-index.
-   [ ] Exclude private/sensitive items according to settings.
-   [ ] Test Unicode, large documents, malformed HTML, duplicate
    content, and index corruption.

**Acceptance criteria** - Results only reference content that was
actually indexed. - Failed indexing is visible and retryable. - Deleting
an archive follows the selected index-retention policy.

### Epic 3.4 --- Offline page capture

-   [ ] Research permitted capture approaches and their limits.
-   [ ] Define capture types: thumbnail only, text capture,
    HTML/resource bundle.
-   [ ] Keep offline archive opt-in and off by default.
-   [ ] Capture a test matrix of static pages, single-page apps,
    authenticated pages, media-heavy pages, and restricted pages.
-   [ ] Record capture completeness and missing resources.
-   [ ] Sandbox archive viewing; do not execute untrusted archived
    content in privileged app context.
-   [ ] Add archive size and deletion controls.
-   [ ] Add text indexing integration.
-   [ ] Test archive deletion, corruption, and cross-platform portable
    export.
-   [ ] Document legal, site-policy, and authentication constraints.

**Acceptance criteria** - Incomplete archives are labeled. - The app
never promises exact live-session resurrection. - Archived content is
handled as untrusted input.

### Epic 3.5 --- Firefox connector

-   [ ] Review current Firefox extension API and packaging constraints.
-   [ ] Implement connector using the shared capability interface.
-   [ ] Validate metadata capture and screenshot behavior.
-   [ ] Validate native messaging on supported configurations.
-   [ ] Test profile handling and private browsing permissions.
-   [ ] Add Firefox-specific setup and troubleshooting.
-   [ ] Run the shared connector conformance suite.
-   [ ] Document unsupported capabilities.

**Acceptance criteria** - Firefox-specific unsupported actions are
reported clearly. - Shared library and storage behavior remains
browser-independent.

### Epic 3.6 --- Session history and group reconstruction

-   [ ] Store dated session snapshots.
-   [ ] Add compare/reopen previous arrangement where feasible.
-   [ ] Reconstruct supported pinned state and tab groups.
-   [ ] Handle unsupported group colors/names gracefully.
-   [ ] Add session restore preview.
-   [ ] Test different browser versions and connector capability
    differences.

## Phase 4 --- Advanced Vault

### Epic 4.1 --- Portable vault

-   [ ] Finalize versioned manifest schema.
-   [ ] Use relative paths.
-   [ ] Export selected or complete vault content.
-   [ ] Verify free space and expected export size.
-   [ ] Validate paths, file hashes, IDs, and schema version on import.
-   [ ] Reject path traversal and unsafe paths.
-   [ ] Stage import and verify before committing.
-   [ ] Detect duplicate items and resolve conflicts.
-   [ ] Support moving vault to another drive with verification and
    rollback.
-   [ ] Test external-drive disconnect during copy.
-   [ ] Test importing older manifest versions.

**Acceptance criteria** - Portable export can be moved and imported
without relying on the original absolute path. - Invalid manifests fail
safely. - No browser credentials/profile data are included by default.

### Epic 4.2 --- Encryption and key management

-   [ ] Define threat model and exact encryption scope.
-   [ ] Select a vetted cryptographic library and reviewed format.
-   [ ] Define key derivation, nonce/IV handling, authentication, and
    versioning through the selected library's established patterns.
-   [ ] Decide whether encryption is per archive, per vault, or both.
-   [ ] Design password/key storage and optional OS-protected key
    integration.
-   [ ] Define recovery-key export and loss warnings.
-   [ ] Encrypt test archives and verify tamper detection.
-   [ ] Ensure plaintext temporary files are cleaned safely.
-   [ ] Ensure logs and previews do not bypass intended privacy
    controls.
-   [ ] Test wrong key, corrupted ciphertext, key rotation, backup, and
    import/export.
-   [ ] Obtain a security review before release.

**Acceptance criteria** - Encryption is not home-grown. - Key loss
behavior is explicit and tested. - Tampering is detected. -
Documentation does not overstate protection.

### Epic 4.3 --- Preview redaction and private vault

-   [ ] Add domain/item rules for hiding or redacting thumbnails.
-   [ ] Ensure redaction happens before the preview is persisted where
    possible.
-   [ ] Add private-tab capture opt-in only where supported.
-   [ ] Add separate labels and retention settings for private captures.
-   [ ] Add shutdown/purge behavior with clear explanation.
-   [ ] Prevent sensitive previews in notifications by default.
-   [ ] Test private-mode permission removal and connector disconnect.
-   [ ] Verify private records are excluded from automatic indexing
    unless explicitly allowed.

**Acceptance criteria** - Private capture remains off by default. - User
understands what data will be stored before enabling it. - Redaction
does not falsely imply the underlying archive content is also redacted
unless it is.

### Epic 4.4 --- Automation

-   [ ] Define automatic vaulting triggers and protected-tab rules.
-   [ ] Require explicit user opt-in.
-   [ ] Exclude private tabs by default.
-   [ ] Protect pinned tabs, allowlisted domains, and user-defined
    collections.
-   [ ] Add preview/simulation mode for automation rules.
-   [ ] Add audit history and undo where possible.
-   [ ] Ensure automatic close only occurs after verified save.
-   [ ] Add per-rule pause/disable controls.
-   [ ] Test browser crash, extension disconnect, save failure, and
    quota exhaustion.

**Acceptance criteria** - Automation never closes a tab whose save has
not been verified. - Users can inspect and disable rules easily. -
Automatic cleanup is never enabled without an explicit choice.

### Epic 4.5 --- System tray and quick actions

-   [ ] Implement optional tray mode.
-   [ ] Add Open Tabsed, Search Vault, Restore Recent, Save Current
    Window, Pause Automation, Exit.
-   [ ] Gate browser actions on connector availability.
-   [ ] Add tray notifications only for useful events and redact
    sensitive titles by default.
-   [ ] Respect launch-at-login only when the user opts in.
-   [ ] Test app shutdown, tray restart, and connector mismatch.

**Acceptance criteria** - Tray is optional and does not make the main
app unusable when disabled. - No action reports success before the
underlying operation confirms success.

## Cross-Cutting Work

### Testing

-   [ ] Unit tests for URL normalization, storage accounting, schemas,
    migrations, and state machines.
-   [ ] Integration tests for capture, persistence, close, restore,
    backup, import, and cleanup.
-   [ ] Browser connector conformance tests.
-   [ ] UI tests for navigation, themes, multi-select, dialogs, and
    error states.
-   [ ] Accessibility tests for keyboard navigation and contrast.
-   [ ] Performance tests with large fixture libraries.
-   [ ] Security tests for path traversal, malformed native messages,
    untrusted archives, and log redaction.
-   [ ] Crash injection tests for critical file operations.
-   [ ] Manual test matrix for supported Windows and browser versions.

### Documentation

-   [ ] Keep PRD aligned with actual shipped behavior.
-   [ ] Maintain architecture decision records for major choices.
-   [ ] Document data directory and storage accounting.
-   [ ] Document browser permissions and native messaging installation.
-   [ ] Document backup, recovery, and migration.
-   [ ] Document privacy model and limitations.
-   [ ] Document known browser-specific limitations.
-   [ ] Provide troubleshooting steps and diagnostic export guidance.

### Release and maintenance

-   [ ] Define semantic versioning and database schema versioning.
-   [ ] Add changelog.
-   [ ] Validate clean install and upgrade.
-   [ ] Test uninstall behavior without unexpectedly deleting user vault
    data.
-   [ ] Add explicit "delete vault data" flow separate from uninstall.
-   [ ] Sign production installers and extensions where infrastructure
    permits.
-   [ ] Track dependency updates and security advisories.
-   [ ] Prepare rollback/recovery instructions for releases.

## Suggested Validation Commands

Commands will vary by the final project scaffold. Adapt these to the
package scripts actually defined.

``` bash
# Frontend
npm install
npm run lint
npm run typecheck
npm test
npm run build

# Rust / Tauri backend
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test

# Desktop development / packaging
npm run tauri dev
npm run tauri build
```

Do not leave placeholder scripts that always pass. Every command
referenced in CI must exist and perform a real check.

## Manual Release Checklist

### Safety

-   [ ] Save failure leaves source tabs open.
-   [ ] Partial capture closes only committed tabs explicitly selected
    for closure.
-   [ ] Private tabs are excluded by default.
-   [ ] No cookies/passwords/auth databases are copied.
-   [ ] Permanent deletion has explicit confirmation.
-   [ ] Browser profile data is never modified directly while active.

### Data integrity

-   [ ] Database migrations pass.
-   [ ] Vault files and manifest verify.
-   [ ] Backup can be restored.
-   [ ] Import rejects unsafe paths.
-   [ ] Storage totals do not double-count shared files.
-   [ ] Missing files are surfaced and recoverable where possible.

### UX

-   [ ] Basic mode works without an extension.
-   [ ] Connector setup provides clear permission explanations.
-   [ ] Grid/list/detail layouts work at supported window sizes.
-   [ ] Themes and accent settings persist.
-   [ ] Reduced-transparency mode remains readable.
-   [ ] Loading, empty, partial, and error states are implemented.
-   [ ] Keyboard and screen-reader labels are checked.

### Performance

-   [ ] Large libraries use virtualized/paginated rendering.
-   [ ] Thumbnail decoding is bounded.
-   [ ] Storage scans are cancellable.
-   [ ] Restore queue uses bounded batches.
-   [ ] Availability checks use bounded concurrency.
-   [ ] No continuous large-area blur is used across the content grid.

### Release

-   [ ] Clean installation tested.
-   [ ] Upgrade and migration tested.
-   [ ] Uninstall preserves user data unless user explicitly chooses
    deletion.
-   [ ] Changelog and known limitations published.
-   [ ] Production artifacts are identified and signed where supported.

## Definition of Done for Every Task

-   [ ] Code is implemented and reviewed.
-   [ ] Relevant tests pass.
-   [ ] Failure and cancellation behavior are covered.
-   [ ] Privacy/security implications are reviewed.
-   [ ] User-facing copy reflects actual capability.
-   [ ] Logs do not expose sensitive browsing content by default.
-   [ ] Documentation is updated.
-   [ ] Acceptance criteria are demonstrated before closing the task.
