# Tabsed Privacy Policy

**Effective Date:** October 25, 2026  
**Last Updated:** October 25, 2026  

Tabsed ("we", "our", or "the extension") is an open-source, local-first tab manager and offline archiver designed to put tabs away without losing context. We are committed to absolute data privacy and transparency.

---

## 1. Core Privacy Philosophy: Local-First & Zero Telemetry

- **No Remote Servers**: Tabsed operates entirely locally on your device. We do not operate tracking servers, remote analytics endpoints, or cloud databases.
- **No Third-Party Analytics**: Tabsed does not integrate Google Analytics, Mixpanel, telemetry SDKs, or third-party advertising trackers.
- **Zero Data Exfiltration**: Your saved tab URLs, page titles, screenshots, session layouts, and notes never leave your personal computer.

---

## 2. Information We Access and How It Is Used

Tabsed requires specific browser extension permissions to function. Below is an exhaustive breakdown:

| Permission | Purpose | Data Handled & Storage |
|:---|:---|:---|
| `tabs` | Enumerate open browser tabs, titles, URLs, and window arrangements when you choose to save them. | Processed entirely in-memory and committed to your local Tabsed vault. |
| `activeTab` | Capture a visual screenshot thumbnail of the current active tab when you click save. | Converted to a JPEG data URL and stored in your local vault. |
| `storage` | Temporary local cache (`chrome.storage.local`) if the desktop application is closed when tabs are saved. | Stored within your browser's private local storage partition until synchronized with the desktop app. |
| `nativeMessaging` | Communication channel between the browser extension and the local Tabsed desktop application (`com.tabsed.app`). | Local Standard Input/Output (stdio) IPC pipeline on `127.0.0.1` / local machine. |
| `<all_urls>` | Allows capturing visual previews and inspecting tab URLs across any user-visited site when requested. | No web requests are made to external endpoints. Tab data is strictly read from browser tabs. |

---

## 3. Data Storage & Security

- **Local Vault Storage**: All saved sessions, notes, collections, and snapshots are stored on your local disk in your designated vault directory (or encrypted with AES-256-GCM when encryption is enabled).
- **Private / InPrivate Browsing**: InPrivate/Incognito tabs are ignored by default and are not saved unless explicitly overridden by the user.
- **Credential Protection**: Tabsed automatically redacts sensitive query parameters (such as `token`, `access_token`, `auth`, `apikey`, `secret`, `password`) from saved tab URLs.
- **No Cookies or Credentials**: Tabsed never reads, requests, stores, or exports browser cookies, session tokens, or password vaults.

---

## 4. Third-Party Services

- **Favicon Resolution**: Tabsed attempts to load favicons provided by the website or locally cached icons. If an icon is missing, it falls back to public high-resolution favicon caching (`https://www.google.com/s2/favicons`) and the official Tabsed icon. No cookies or personal identifiers are sent with favicon requests.

---

## 5. User Control and Data Deletion

- **Soft Delete (Trash)**: Deleting a tab moves it to your vault's Trash bucket, where it can be restored.
- **Permanent Purge**: Emptying the Trash permanently deletes all corresponding records and files from your device.
- **Export & Portability**: You can export your entire vault as an open `.zip` or unencrypted folder at any time.

---

## 6. Contact & Source Code

Tabsed is open source under the MIT and Apache-2.0 licenses. You can inspect the source code, verify our security practices, or report questions at:
- **GitHub Repository:** [https://github.com/RetsardCo/Tabsed](https://github.com/RetsardCo/Tabsed)
- **Email:** security@tabsed.app
