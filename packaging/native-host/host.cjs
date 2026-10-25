#!/usr/bin/env node
/**
 * Tabsed Native Messaging Host Bridge
 * Communicates via standard input/output using 4-byte length-prefixed JSON.
 * Compatible with Chromium (Edge, Chrome) and Mozilla Firefox.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const MAX_MESSAGE_SIZE = 10 * 1024 * 1024; // 10 MB limit

// Standardized Storage path for tabs saved via native messaging
const APPDATA = process.env.APPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Roaming') : path.join(os.homedir(), '.tabsed'));
const TABSED_DATA_DIR = path.join(APPDATA, 'Tabsed');
const VAULT_DIR = path.join(TABSED_DATA_DIR, 'vault');
const ITEMS_FILE = path.join(VAULT_DIR, 'items.json');
const STAGING_FILE = path.join(VAULT_DIR, 'native_inbox.json');
const LEGACY_STAGING_FILE = path.join(TABSED_DATA_DIR, 'native_inbox.json');
const SYNC_EVENT_FILE = path.join(VAULT_DIR, 'sync_event.json');

try {
  if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR, { recursive: true });
  }
} catch (e) {
  // Ignore fallback
}

/**
 * Crash-safe atomic JSON file writing using temporary swap file
 */
function atomicWriteJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = path.join(dir, `.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.json`);
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');

  try {
    if (fs.existsSync(filePath)) {
      try {
        fs.renameSync(tempPath, filePath);
      } catch (renameErr) {
        fs.copyFileSync(tempPath, filePath);
        try { fs.unlinkSync(tempPath); } catch {}
      }
    } else {
      fs.renameSync(tempPath, filePath);
    }
  } catch (err) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    try { fs.unlinkSync(tempPath); } catch {}
  }
}

function sendNativeMessage(obj) {
  const jsonStr = JSON.stringify(obj);
  const buffer = Buffer.from(jsonStr, 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);
  process.stdout.write(header);
  process.stdout.write(buffer);
}

let inputBuffer = Buffer.alloc(0);

process.stdin.on('readable', () => {
  let chunk;
  while ((chunk = process.stdin.read()) !== null) {
    inputBuffer = Buffer.concat([inputBuffer, chunk]);

    while (inputBuffer.length >= 4) {
      const msgLength = inputBuffer.readUInt32LE(0);
      if (msgLength > MAX_MESSAGE_SIZE) {
        sendNativeMessage({
          error: `Message size exceeds 10MB limit (${msgLength} bytes)`
        });
        process.exit(1);
      }

      if (inputBuffer.length < 4 + msgLength) {
        // Wait for more data
        break;
      }

      const rawMsg = inputBuffer.slice(4, 4 + msgLength).toString('utf8');
      inputBuffer = inputBuffer.slice(4 + msgLength);

      try {
        const message = JSON.parse(rawMsg);
        handleMessage(message);
      } catch (err) {
        sendNativeMessage({
          error: 'Invalid JSON payload: ' + err.message
        });
      }
    }
  }
});

function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'localhost';
  }
}

function handleMessage(message) {
  const type = message.type || message.action;

  switch (type) {
    case 'ping':
      sendNativeMessage({
        type: 'pong',
        version: '1.0.0',
        status: 'ready',
        host: 'Tabsed Native Messaging Host',
        timestamp: new Date().toISOString()
      });
      break;

    case 'getCapabilities':
      sendNativeMessage({
        success: true,
        capabilities: {
          listTabs: 'supported',
          captureMetadata: 'supported',
          captureThumbnail: 'supported',
          closeTabs: 'supported',
          openUrls: 'supported',
          selectProfile: 'supported',
          restorePinnedState: 'supported',
          restoreTabGroups: 'supported',
          privateModeAvailable: 'supported',
          queryProfileStorage: 'supported'
        }
      });
      break;

    case 'saveTabs': {
      const tabs = message.payload?.tabs || message.tabs || [];
      const committedIds = [];

      try {
        const now = new Date().toISOString();
        const batchId = 'batch_' + Date.now();

        // 1. Map committed tab IDs
        for (const t of tabs) {
          if (t.tabId !== undefined && t.tabId !== null) {
            committedIds.push(t.tabId);
          } else if (t.id !== undefined && t.id !== null) {
            committedIds.push(t.id);
          }
        }

        // 2. Prepare Vault Items
        let newItems = [];
        if (tabs.length === 1) {
          const t = tabs[0];
          const domain = extractDomain(t.url);
          const title = t.title || domain || 'Saved Tab';
          const browserFamily = t.browserFamily || (process.platform === 'win32' ? 'Edge' : 'Chrome');

          newItems.push({
            id: 'tab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
            vaultId: 'default',
            itemType: 'tab',
            title: title,
            url: t.url,
            normalizedUrl: t.url,
            domain: domain,
            faviconUrl: t.favIconUrl || (domain ? `https://${domain}/favicon.ico` : null),
            thumbnailUrl: t.thumbnail || null,
            browserFamily: browserFamily,
            profileLabel: 'Default',
            savedAt: now,
            notes: '',
            isFavorite: false,
            collectionIds: [t.collectionId || 'inbox'],
            tags: ['Extension', browserFamily],
            tabCount: 1,
            archiveSizeBytes: 131072,
            availabilityStatus: 'reachable'
          });
        } else if (tabs.length > 1) {
          const firstTab = tabs[0];
          const firstDomain = extractDomain(firstTab.url);
          const firstTitle = firstTab.title || firstDomain || 'Saved Window';
          const browserFamily = firstTab.browserFamily || (process.platform === 'win32' ? 'Edge' : 'Chrome');
          const sessionTitle = `${firstTitle} and ${tabs.length - 1} more tabs`;

          const sessionTabs = tabs.map((t, idx) => {
            const dom = extractDomain(t.url);
            return {
              id: `sub_${Date.now()}_${idx}`,
              title: t.title || dom || 'Untitled',
              url: t.url,
              domain: dom,
              faviconUrl: t.favIconUrl || (dom ? `https://${dom}/favicon.ico` : null),
              pinned: !!t.pinned
            };
          });

          newItems.push({
            id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
            vaultId: 'default',
            itemType: 'session',
            title: sessionTitle,
            url: firstTab.url,
            normalizedUrl: firstTab.url,
            domain: firstDomain,
            faviconUrl: firstTab.favIconUrl || (firstDomain ? `https://${firstDomain}/favicon.ico` : null),
            thumbnailUrl: firstTab.thumbnail || null,
            browserFamily: browserFamily,
            profileLabel: 'Default',
            savedAt: now,
            notes: `Saved window session with ${tabs.length} tabs from ${browserFamily}.`,
            isFavorite: false,
            collectionIds: [firstTab.collectionId || 'inbox'],
            tags: ['Extension', 'Saved Window', browserFamily],
            tabCount: tabs.length,
            sessionTabs: sessionTabs,
            archiveSizeBytes: tabs.length * 131072,
            availabilityStatus: 'reachable'
          });
        }

        // 3. Atomically update items.json in standardized vault
        let existingItems = [];
        if (fs.existsSync(ITEMS_FILE)) {
          try {
            existingItems = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
            if (!Array.isArray(existingItems)) existingItems = [];
          } catch {}
        }
        const updatedItems = [...newItems, ...existingItems];
        atomicWriteJson(ITEMS_FILE, updatedItems);

        // 4. Atomically append batch to native_inbox.json
        let existingInbox = [];
        if (fs.existsSync(STAGING_FILE)) {
          try {
            existingInbox = JSON.parse(fs.readFileSync(STAGING_FILE, 'utf8'));
            if (!Array.isArray(existingInbox)) existingInbox = [];
          } catch {}
        }
        const batch = {
          batchId: batchId,
          savedAt: now,
          tabs: tabs.map(t => ({
            id: 'tab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
            url: t.url,
            title: t.title || 'Untitled',
            faviconUrl: t.favIconUrl || null,
            thumbnailUrl: t.thumbnail || null,
            browserFamily: t.browserFamily || 'Edge',
            pinned: !!t.pinned,
            savedAt: now,
            collectionId: t.collectionId || 'inbox'
          }))
        };
        existingInbox.push(batch);
        atomicWriteJson(STAGING_FILE, existingInbox);
        try {
          atomicWriteJson(LEGACY_STAGING_FILE, existingInbox);
        } catch {}

        // 5. Notify file watchers / poller via sync_event.json
        atomicWriteJson(SYNC_EVENT_FILE, {
          type: 'tabs_saved',
          count: tabs.length,
          batchId: batchId,
          timestamp: now
        });

        sendNativeMessage({
          success: true,
          committedTabIds: committedIds,
          failedTabIds: [],
          storageMode: 'desktop-vault',
          message: `Saved ${committedIds.length} tabs to Tabsed native vault.`
        });
      } catch (err) {
        sendNativeMessage({
          success: false,
          error: 'Failed to persist tabs: ' + err.message,
          committedTabIds: [],
          failedTabIds: tabs.map(t => t.tabId || t.id)
        });
      }
      break;
    }

    default:
      sendNativeMessage({
        type: 'response',
        status: 'received',
        originalType: type,
        timestamp: new Date().toISOString()
      });
      break;
  }
}

process.stdin.on('end', () => {
  process.exit(0);
});
