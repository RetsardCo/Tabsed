import { describe, it, expect, beforeEach } from 'vitest';
import { SavedTabItem } from '../src/ui/types';
import { SaveTransactionSession, TabItemInput, StagedTabRecord } from '../src/core/transaction/save-and-close';
import { TrashManager } from '../src/core/vault/trash-manager';
import { BackupManager } from '../src/core/vault/backup-manager';

describe('Cross-Cutting End-to-End Conformance & Integration Suite (PRD Section 16 & Epics 0.4, 1.2, 2.3, 4.1)', () => {
  interface SimulatedVaultState {
    items: SavedTabItem[];
    collections: { id: string; name: string }[];
  }

  let vault: SimulatedVaultState;

  beforeEach(() => {
    vault = {
      items: [],
      collections: [
        { id: 'inbox', name: 'Inbox' },
        { id: 'dev', name: 'Development' },
        { id: 'research', name: 'Research' }
      ]
    };
  });

  describe('Full Save-Before-Close Transaction Guarantee (PRD Section 11.5 & FR-011)', () => {
    it('executes end-to-end save transaction: closes only successfully committed tabs via SaveTransactionSession', async () => {
      const sourceBrowserTabs: TabItemInput[] = [
        { tabId: 101, url: 'https://react.dev/learn', title: 'React Documentation' },
        { tabId: 102, url: 'https://tauri.app/v2', title: 'Tauri v2 Overview' },
        { tabId: 103, url: 'https://example.com/unreachable', title: 'Flaky Site' }
      ];

      const session = new SaveTransactionSession('job_test_101');
      expect(session.getState()).toBe('requested');

      // 1. Validate
      session.validate(sourceBrowserTabs, { closeAfterSave: true });
      expect(session.getState()).toBe('validated');

      // 2. Stage
      session.stage();
      expect(session.getState()).toBe('staged');

      // 3. Persist with simulated failure on tab 103
      session.persist((records: StagedTabRecord[]) => {
        const persisted: StagedTabRecord[] = [];
        const failed: StagedTabRecord[] = [];

        for (const rec of records) {
          if (rec.tabId === 103) {
            rec.error = 'Simulated database disk error';
            failed.push(rec);
          } else {
            persisted.push(rec);
            vault.items.push({
              id: rec.id,
              vaultId: 'default',
              itemType: 'tab',
              title: rec.title,
              url: rec.url,
              normalizedUrl: rec.normalizedUrl,
              domain: rec.domain,
              browserFamily: 'Chrome',
              savedAt: new Date().toISOString(),
              notes: '',
              isFavorite: false,
              collectionIds: ['inbox'],
              tags: [],
              availabilityStatus: 'reachable'
            });
          }
        }
        return { persisted, failed };
      });
      expect(session.getState()).toBe('partial');

      // 4. Verify & Commit
      const summary = session.verifyAndCommit((records) => {
        return records.filter(r => r.status === 'persisted').map(r => r.tabId);
      });
      expect(session.getState()).toBe('partial');
      expect(summary.committedIds).toEqual([101, 102]);
      expect(summary.failedIds).toEqual([103]);

      // 5. Close source tabs: ONLY committed tabs are closed
      const closureSummary = session.executeTabClosure((tabId) => {
        return true;
      });

      expect(closureSummary.closedIds).toEqual([101, 102]);
      expect(closureSummary.closedIds).not.toContain(103); // Critical safety gate: failed tab remains open!
      expect(session.getState()).toBe('partial');
      expect(vault.items.length).toBe(2);
    });
  });

  describe('Tab Organization, Annotations & Search Lifecycle', () => {
    it('manages collections, tags, notes, and full-text filtering', () => {
      const tab1: SavedTabItem = {
        id: 't1',
        vaultId: 'default',
        itemType: 'tab',
        title: 'Advanced Rust Concurrency Patterns',
        url: 'https://rust-lang.org/concurrency',
        normalizedUrl: 'https://rust-lang.org/concurrency',
        domain: 'rust-lang.org',
        browserFamily: 'Chrome',
        savedAt: new Date().toISOString(),
        notes: 'Study chapters on Mutex, Channels, and Arc threading.',
        isFavorite: true,
        collectionIds: ['dev'],
        tags: ['Rust', 'Systems', 'Performance'],
        availabilityStatus: 'reachable'
      };

      const tab2: SavedTabItem = {
        id: 't2',
        vaultId: 'default',
        itemType: 'tab',
        title: 'Modern Typography in Design Systems',
        url: 'https://typography.design/guide',
        normalizedUrl: 'https://typography.design/guide',
        domain: 'typography.design',
        browserFamily: 'Edge',
        savedAt: new Date().toISOString(),
        notes: '',
        isFavorite: false,
        collectionIds: ['research'],
        tags: ['Design', 'UI'],
        availabilityStatus: 'reachable'
      };

      vault.items.push(tab1, tab2);

      // Search by keyword in notes
      const noteMatches = vault.items.filter(item => 
        item.notes?.toLowerCase().includes('arc threading')
      );
      expect(noteMatches.length).toBe(1);
      expect(noteMatches[0].id).toBe('t1');

      // Filter by collection
      const devItems = vault.items.filter(item => item.collectionIds.includes('dev'));
      expect(devItems.length).toBe(1);

      // Filter by tag
      const uiTagged = vault.items.filter(item => item.tags.includes('UI'));
      expect(uiTagged.length).toBe(1);
      expect(uiTagged[0].id).toBe('t2');

      // Toggle favorite
      tab2.isFavorite = true;
      const favorites = vault.items.filter(item => item.isFavorite);
      expect(favorites.length).toBe(2);
    });
  });

  describe('Trash, Soft-Delete & Permanent Purge Lifecycle (PRD Epic 2.3)', () => {
    it('moves item to trash, hides from active library, restores safely, and supports permanent delete via TrashManager', () => {
      const tab: SavedTabItem = {
        id: 't_trash_1',
        vaultId: 'default',
        itemType: 'tab',
        title: 'Temporary Tab',
        url: 'https://temp.org',
        normalizedUrl: 'https://temp.org',
        domain: 'temp.org',
        browserFamily: 'Edge',
        savedAt: new Date().toISOString(),
        notes: 'Temporary review notes',
        isFavorite: false,
        collectionIds: ['inbox'],
        tags: ['Temp']
      };

      let items = [tab];
      expect(items.length).toBe(1);

      // 1. Soft-delete via TrashManager
      items = TrashManager.softDelete(items, 't_trash_1');
      expect(items[0].deletedAt).toBeDefined();

      // Active library excludes soft-deleted items
      const activeLibrary = items.filter(i => !i.deletedAt);
      expect(activeLibrary.length).toBe(0);

      // Trash view contains the item
      const trashView = items.filter(i => !!i.deletedAt);
      expect(trashView.length).toBe(1);
      expect(trashView[0].id).toBe('t_trash_1');

      // 2. Restore from Trash via TrashManager
      items = TrashManager.restoreFromTrash(items, 't_trash_1');
      expect(items[0].deletedAt).toBeNull();
      expect(items.filter(i => !i.deletedAt).length).toBe(1);
      expect(items[0].notes).toBe('Temporary review notes'); // Preserves notes & tags

      // 3. Move back to trash and empty trash permanently
      items = TrashManager.softDelete(items, 't_trash_1');
      items = TrashManager.permanentDelete(items, 't_trash_1');
      expect(items.length).toBe(0);
    });
  });

  describe('Full Vault Backup & Integrity Verification (PRD 4.1 & 7.10)', () => {
    it('creates versioned backup manifest, exports JSON, and verifies hash on restore via BackupManager', () => {
      const item: SavedTabItem = {
        id: 't_backup_1',
        vaultId: 'default',
        itemType: 'tab',
        title: 'Distributed Systems Patterns',
        url: 'https://dist-sys.org',
        normalizedUrl: 'https://dist-sys.org',
        domain: 'dist-sys.org',
        browserFamily: 'Chrome',
        savedAt: '2026-10-24T12:00:00Z',
        notes: '',
        isFavorite: true,
        collectionIds: ['dev'],
        tags: ['Architecture']
      };

      // Create backup via real BackupManager
      const backupResult = BackupManager.createBackup([item], 'default-vault');
      expect(backupResult.manifest.schemaVersion).toBe(1);
      expect(backupResult.manifest.itemCount).toBe(1);
      expect(backupResult.manifest.sha256).toBeDefined();
      expect(backupResult.manifest.files[0].path).toBe('vault_items.json');

      // Verify and restore backup via real BackupManager
      const isVerified = BackupManager.verifyBackup(
        backupResult.backupBlobJson,
        backupResult.manifest
      );
      expect(isVerified).toBe(true);

      const restoredItems = BackupManager.restoreFromBackup(
        backupResult.backupBlobJson,
        backupResult.manifest
      );

      expect(restoredItems.length).toBe(1);
      expect(restoredItems[0].title).toBe('Distributed Systems Patterns');
    });
  });
});
