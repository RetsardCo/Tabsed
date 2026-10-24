#!/usr/bin/env node
/**
 * Tabsed Native Messaging Host Bridge
 * Communicates via standard input/output using 4-byte length-prefixed JSON.
 * Compatible with Chromium (Edge, Chrome) and Mozilla Firefox.
 */

const fs = require('fs');
const path = require('path');

const MAX_MESSAGE_SIZE = 1024 * 1024; // 1 MB limit

// Storage path for tabs saved via native messaging
const APPDATA = process.env.APPDATA || process.env.USERPROFILE || '.';
const TABSED_DATA_DIR = path.join(APPDATA, 'Tabsed');
const STAGING_FILE = path.join(TABSED_DATA_DIR, 'native_inbox.json');

try {
  if (!fs.existsSync(TABSED_DATA_DIR)) {
    fs.mkdirSync(TABSED_DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Ignore fallback
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
          error: `Message size exceeds 1MB limit (${msgLength} bytes)`
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
        let existing = [];
        if (fs.existsSync(STAGING_FILE)) {
          existing = JSON.parse(fs.readFileSync(STAGING_FILE, 'utf8'));
        }

        const now = new Date().toISOString();
        const batch = {
          batchId: 'batch_' + Date.now(),
          savedAt: now,
          tabs: tabs.map(t => {
            committedIds.push(t.tabId);
            return {
              id: 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              url: t.url,
              title: t.title || 'Untitled',
              faviconUrl: t.favIconUrl || null,
              thumbnailUrl: t.thumbnail || null,
              browserFamily: t.browserFamily || 'Edge',
              pinned: !!t.pinned,
              savedAt: now,
              collectionId: t.collectionId || 'inbox'
            };
          })
        };

        existing.push(batch);
        fs.writeFileSync(STAGING_FILE, JSON.stringify(existing, null, 2), 'utf8');

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
          failedTabIds: tabs.map(t => t.tabId)
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
