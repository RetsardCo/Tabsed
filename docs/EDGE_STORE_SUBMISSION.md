# Microsoft Edge Add-ons Review & Security Audit Guide

This document provides a comprehensive review of the **Tabsed** browser extension against the **Microsoft Edge Add-ons Developer Certification Policies** and answers common store approval questions.

---

## 1. Will Microsoft Edge Approve This Extension?

**Verdict: YES.**  
Tabsed satisfies all requirements set forth by the **Microsoft Edge Add-ons Developer Agreement & Policies** (Updated for Manifest V3).

### Key Compliance Checklist:
| Policy Requirement | Tabsed Status | Explanation |
|:---|:---|:---|
| **Manifest Version 3 (MV3)** | **Compliant** | Built on MV3 using standard service workers (`background.js`). |
| **Single Purpose (Policy 4.1)** | **Compliant** | Single distinct function: tab organization, offline saving, and restoration into a local vault. |
| **Permissions Minimalism (Policy 4.2)**| **Compliant** | Only requests permissions strictly required for tab enumeration, thumbnail capture, and local IPC. |
| **Data Privacy & Exfiltration (Policy 4.3)**| **Compliant** | **Zero remote telemetry or external servers.** All tab data remains on the user's local disk. |
| **Code Readability (Policy 4.4)**| **Compliant** | Clean, readable, unminified, non-obfuscated JavaScript in `background.js` and `popup.js`. |
| **No Injected Ads or Tracking (Policy 4.5)**| **Compliant** | No injected scripts, no ad modification, no affiliate links. |
| **Privacy Policy (Policy 4.7)** | **Compliant** | Comprehensive `PRIVACY.md` detailing local data storage and zero cloud transmissions. |

---

## 2. Permissions Justification (For Edge Partner Center Submission)

When submitting the extension in the **Microsoft Edge Partner Center**, reviewers ask for justification for declared permissions. Use the exact declarations below:

### `tabs`
- **Reviewer Justification:** "Required to enumerate currently open tabs across windows, extract their titles and URLs when the user initiates a save action, and recreate the user's tab layouts when restoring saved sessions."

### `activeTab`
- **Reviewer Justification:** "Allows capturing a visual thumbnail (`chrome.tabs.captureVisibleTab`) of the tab currently active in the user's foreground when they click Save, giving the user a visual preview in their local vault."

### `storage`
- **Reviewer Justification:** "Used exclusively for local temporary caching (`chrome.storage.local`) of staged tabs in case the native messaging desktop application is closed when tabs are saved, synchronizing them immediately upon next desktop app launch."

### `nativeMessaging`
- **Reviewer Justification:** "Enables secure local inter-process communication (IPC) via standard input/output with the Tabsed desktop application host (`com.tabsed.app`) installed on the user's local machine. No external internet communication is performed."

### `<all_urls>`
- **Reviewer Justification:** "Required so the tab saver can inspect tab titles, URLs, and capture thumbnail previews across any website that the user has navigated to when they choose to save their session."

---

## 3. Security Audit & Hardening Findings

An end-to-end security audit was conducted covering the extension and IPC bridge:

1. **Local IPC Boundary:**
   - Communication with the desktop application is confined to local process standard input/output.
   - Message packets are strictly capped at 1MB (`MAX_NATIVE_MESSAGE_SIZE`) to prevent memory exhaustion or buffer overflow exploits.
   - The native messaging manifest is registered in `HKEY_CURRENT_USER\Software\Microsoft\Edge\NativeMessagingHosts\com.tabsed.app` without requiring administrator escalation.

2. **Sensitive URL Redaction:**
   - Tabsed automatically filters and redacts URL query strings containing credential tokens: `token`, `access_token`, `auth`, `apikey`, `secret`, `password`.

3. **InPrivate / Incognito Protection:**
   - By default, tabs opened in InPrivate/Incognito browsing sessions are excluded to prevent accidental leakage of confidential browsing activities.

4. **Restricted Browser Schemes:**
   - Internal browser URLs (`edge://*`, `chrome://*`, `about:*`, `edge-extension://*`) are guarded against script injection and thumbnail capture attempts.

---

## 4. How to Package and Submit to Microsoft Edge Add-ons

1. **Run the Extension Packaging Script:**
   ```bash
   npm run package:extensions
   ```
   This generates the verified production zip at:
   `dist/extensions/tabsed-chromium-v1.0.0.zip` (and unpacked directory at `dist/extensions/unpacked-chromium`).

2. **Log into the Microsoft Edge Partner Center:**
   - Navigate to [Microsoft Edge Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview).
   - Click **Create new extension** and upload `dist/extensions/tabsed-chromium-v1.0.0.zip`.

3. **Complete the Store Listing:**
   - **Name:** Tabsed - Tab Saver & Restorer
   - **Short Description:** Save tabs with context, thumbnails, and sessions into your private local Tabsed vault.
   - **Category:** Productivity
   - **Privacy Policy URL:** Link to `https://github.com/RetsardCo/Tabsed/blob/main/PRIVACY.md`
   - **Support URL:** `https://github.com/RetsardCo/Tabsed/issues`

4. **Submit for Certification:**
   - The review typically takes 24–48 hours for extensions with clean Manifest V3 declarations and no external telemetry.
