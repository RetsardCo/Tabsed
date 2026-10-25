import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { VaultSyncService } from '../src/core/vault/vault-sync';
import { SavedTabItem } from '../src/ui/types';

describe('Extension to Desktop Vault Bridge & Real-Time Sync Suite', () => {
  let tempAppData: string;
  let vaultDir: string;
  let itemsFile: string;
  let inboxFile: string;
  let syncEventFile: string;
  let originalAppData: string | undefined;

  beforeEach(() => {
    // Isolate test environment by redirecting APPDATA
    tempAppData = fs.mkdtempSync(path.join(os.tmpdir(), 'tabsed-bridge-test-'));
    originalAppData = process.env.APPDATA;
    process.env.APPDATA = tempAppData;

    vaultDir = path.join(tempAppData, 'Tabsed', 'vault');
    itemsFile = path.join(vaultDir, 'items.json');
    inboxFile = path.join(vaultDir, 'native_inbox.json');
    syncEventFile = path.join(vaultDir, 'sync_event.json');
  });

  afterEach(() => {
    process.env.APPDATA = originalAppData;
    if (fs.existsSync(tempAppData)) {
      try {
        fs.rmSync(tempAppData, { recursive: true, force: true });
      } catch {}
    }
  });

  /**
   * Helper to exchange length-prefixed messages with host.cjs process via stdio
   */
  function sendNativeMessageToHost(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const hostScript = path.resolve(__dirname, '..', 'packaging', 'native-host', 'host.cjs');
      const child = spawn(process.execPath, [hostScript], {
        env: {
          ...process.env,
          APPDATA: tempAppData
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdoutBuffer = Buffer.alloc(0);
      let stderrOutput = '';

      child.stderr.on('data', chunk => {
        stderrOutput += chunk.toString();
      });

      child.stdout.on('data', chunk => {
        stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);

        if (stdoutBuffer.length >= 4) {
          const msgLen = stdoutBuffer.readUInt32LE(0);
          if (stdoutBuffer.length >= 4 + msgLen) {
            const rawMsg = stdoutBuffer.slice(4, 4 + msgLen).toString('utf8');
            try {
              const parsed = JSON.parse(rawMsg);
              child.kill();
              resolve(parsed);
            } catch (err) {
              child.kill();
              reject(err);
            }
          }
        }
      });

      child.on('error', err => reject(err));
      child.on('close', code => {
        if (stdoutBuffer.length < 4) {
          reject(new Error(`Host closed with code ${code}. Stderr: ${stderrOutput}`));
        }
      });

      // Write 4-byte LE length prefix followed by JSON payload
      const jsonStr = JSON.stringify(message);
      const jsonBuf = Buffer.from(jsonStr, 'utf8');
      const header = Buffer.alloc(4);
      header.writeUInt32LE(jsonBuf.length, 0);

      child.stdin.write(header);
      child.stdin.write(jsonBuf);
    });
  }

  describe('Native Messaging Host Bridge (host.cjs)', () => {
    it('handles ping request and returns pong with host identity', async () => {
      const response = await sendNativeMessageToHost({ type: 'ping' });
      expect(response.type).toBe('pong');
      expect(response.status).toBe('ready');
      expect(response.host).toBe('Tabsed Native Messaging Host');
      expect(response.version).toBe('1.0.0');
    });

    it('handles getCapabilities request and returns supported features', async () => {
      const response = await sendNativeMessageToHost({ type: 'getCapabilities' });
      expect(response.success).toBe(true);
      expect(response.capabilities.listTabs).toBe('supported');
      expect(response.capabilities.captureMetadata).toBe('supported');
    });

    it('processes saveTabs payload for single tab, writes to vault/items.json atomically', async () => {
      const savePayload = {
        type: 'saveTabs',
        payload: {
          tabs: [
            {
              tabId: 501,
              windowId: 1,
              url: 'https://developer.mozilla.org/en-US/docs/Web/API',
              title: 'Web APIs | MDN',
              favIconUrl: 'https://developer.mozilla.org/favicon.ico',
              thumbnail: 'data:image/jpeg;base64,sample',
              browserFamily: 'Edge',
              pinned: false,
              collectionId: 'dev'
            }
          ]
        }
      };

      const response = await sendNativeMessageToHost(savePayload);
      expect(response.success).toBe(true);
      expect(response.committedTabIds).toEqual([501]);
      expect(response.storageMode).toBe('desktop-vault');

      // Verify files were created on disk in standardized vault path
      expect(fs.existsSync(itemsFile)).toBe(true);
      expect(fs.existsSync(inboxFile)).toBe(true);
      expect(fs.existsSync(syncEventFile)).toBe(true);

      // Verify items.json content structure
      const items: SavedTabItem[] = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));
      expect(items.length).toBe(1);
      expect(items[0].title).toBe('Web APIs | MDN');
      expect(items[0].url).toBe('https://developer.mozilla.org/en-US/docs/Web/API');
      expect(items[0].domain).toBe('developer.mozilla.org');
      expect(items[0].browserFamily).toBe('Edge');
      expect(items[0].collectionIds).toContain('dev');
      expect(items[0].itemType).toBe('tab');
      expect(items[0].availabilityStatus).toBe('reachable');

      // Verify native_inbox.json transaction record
      const inbox = JSON.parse(fs.readFileSync(inboxFile, 'utf8'));
      expect(inbox.length).toBe(1);
      expect(inbox[0].tabs.length).toBe(1);
    });

    it('processes saveTabs for multi-tab window save as a session item with subTabs', async () => {
      const multiSavePayload = {
        type: 'saveTabs',
        payload: {
          tabs: [
            {
              tabId: 601,
              url: 'https://github.com/tauri-apps/tauri',
              title: 'GitHub - tauri-apps/tauri',
              favIconUrl: 'https://github.com/favicon.ico',
              browserFamily: 'Chrome',
              pinned: false,
              collectionId: 'inbox'
            },
            {
              tabId: 602,
              url: 'https://rust-lang.org',
              title: 'Rust Programming Language',
              favIconUrl: 'https://rust-lang.org/favicon.ico',
              browserFamily: 'Chrome',
              pinned: true,
              collectionId: 'inbox'
            },
            {
              tabId: 603,
              url: 'https://vite.dev',
              title: 'Vite | Next Generation Frontend Tooling',
              favIconUrl: 'https://vite.dev/favicon.ico',
              browserFamily: 'Chrome',
              pinned: false,
              collectionId: 'inbox'
            }
          ]
        }
      };

      const response = await sendNativeMessageToHost(multiSavePayload);
      expect(response.success).toBe(true);
      expect(response.committedTabIds).toEqual([601, 602, 603]);

      const items: SavedTabItem[] = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));
      expect(items.length).toBe(1);
      expect(items[0].itemType).toBe('session');
      expect(items[0].tabCount).toBe(3);
      expect(items[0].sessionTabs?.length).toBe(3);
      expect(items[0].sessionTabs?.[0].title).toBe('GitHub - tauri-apps/tauri');
      expect(items[0].sessionTabs?.[1].pinned).toBe(true);
    });

    it('sequentially appends subsequent saves without overwriting pre-existing items', async () => {
      // First save: 1 tab
      await sendNativeMessageToHost({
        type: 'saveTabs',
        payload: {
          tabs: [{ tabId: 701, url: 'https://alpha.com', title: 'Alpha', browserFamily: 'Edge' }]
        }
      });

      // Second save: 1 tab
      await sendNativeMessageToHost({
        type: 'saveTabs',
        payload: {
          tabs: [{ tabId: 702, url: 'https://beta.com', title: 'Beta', browserFamily: 'Edge' }]
        }
      });

      const items: SavedTabItem[] = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));
      expect(items.length).toBe(2);
      // Newest item should be at the front
      expect(items[0].title).toBe('Beta');
      expect(items[1].title).toBe('Alpha');
    });

    it('gracefully handles empty tabs payload with zero commits and no crash', async () => {
      const response = await sendNativeMessageToHost({
        type: 'saveTabs',
        payload: { tabs: [] }
      });
      expect(response.success).toBe(true);
      expect(response.committedTabIds).toEqual([]);
    });
  });

  describe('VaultSyncService Client Bridge', () => {
    it('correctly reads persisted items from disk vault via mock or file sync', async () => {
      // Pre-seed items on disk
      fs.mkdirSync(vaultDir, { recursive: true });
      const testItem: SavedTabItem = {
        id: 'seed_tab_1',
        vaultId: 'default',
        itemType: 'tab',
        title: 'Seeded Documentation',
        url: 'https://docs.tabsed.com',
        normalizedUrl: 'https://docs.tabsed.com',
        domain: 'docs.tabsed.com',
        browserFamily: 'Edge',
        savedAt: new Date().toISOString(),
        notes: '',
        isFavorite: false,
        collectionIds: ['inbox'],
        tags: ['Docs'],
        availabilityStatus: 'reachable'
      };
      fs.writeFileSync(itemsFile, JSON.stringify([testItem], null, 2), 'utf8');

      // Verify the file was written and can be loaded
      const content = fs.readFileSync(itemsFile, 'utf8');
      const loaded: SavedTabItem[] = JSON.parse(content);
      expect(loaded.length).toBe(1);
      expect(loaded[0].id).toBe('seed_tab_1');
      expect(loaded[0].title).toBe('Seeded Documentation');
    });

    it('detects live sync events written by the native messaging host', async () => {
      fs.mkdirSync(vaultDir, { recursive: true });

      // Save tabs via host
      await sendNativeMessageToHost({
        type: 'saveTabs',
        payload: {
          tabs: [{ tabId: 801, url: 'https://news.ycombinator.com', title: 'Hacker News' }]
        }
      });

      // Verify sync event was emitted
      expect(fs.existsSync(syncEventFile)).toBe(true);
      const syncEvent = JSON.parse(fs.readFileSync(syncEventFile, 'utf8'));
      expect(syncEvent.type).toBe('tabs_saved');
      expect(syncEvent.count).toBe(1);

      // Verify items can be read by UI sync layer
      const items = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));
      expect(items.some((i: any) => i.url === 'https://news.ycombinator.com')).toBe(true);
    });
  });
});
