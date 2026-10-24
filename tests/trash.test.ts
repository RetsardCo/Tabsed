import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TrashManager } from '../src/core/vault/trash-manager';
import { VaultManager } from '../src/core/vault/vault-manager';
import { SavedTabItem } from '../src/ui/types';

describe('Trash and Soft-Delete Operations (PRD Epic 2.3 & Manual Release Checklist)', () => {
  const createSampleItem = (overrides: Partial<SavedTabItem> = {}): SavedTabItem => ({
    id: 'tab_test_1',
    vaultId: 'default',
    itemType: 'tab',
    title: 'Sample Document',
    url: 'https://example.com/docs',
    normalizedUrl: 'https://example.com/docs',
    domain: 'example.com',
    faviconUrl: 'https://example.com/favicon.ico',
    thumbnailUrl: 'https://example.com/thumb.webp',
    browserFamily: 'Edge',
    profileLabel: 'Default',
    savedAt: '2026-10-24T10:00:00Z',
    notes: 'Important research note',
    isFavorite: true,
    collectionIds: ['inbox', 'research'],
    tags: ['work', 'docs'],
    archiveSizeBytes: 125000,
    availabilityStatus: 'reachable',
    deletedAt: null,
    ...overrides
  });

  describe('Soft-delete', () => {
    it('sets deletedAt timestamp and moves item to trash', () => {
      const items: SavedTabItem[] = [
        createSampleItem({ id: 'tab_1' }),
        createSampleItem({ id: 'tab_2' })
      ];

      const specificTime = '2026-10-24T12:00:00.000Z';
      const updated = TrashManager.softDelete(items, 'tab_1', specificTime);

      expect(updated[0].deletedAt).toBe(specificTime);
      expect(updated[1].deletedAt).toBeNull();
      expect(TrashManager.isItemInTrash(updated[0])).toBe(true);
      expect(TrashManager.isItemInTrash(updated[1])).toBe(false);
    });

    it('preserves all existing metadata, tags, notes, and collections on soft-delete', () => {
      const item = createSampleItem({
        id: 'tab_preserve',
        title: 'Special Title',
        notes: 'Critical notes to preserve',
        tags: ['tag1', 'tag2'],
        collectionIds: ['col1', 'col2'],
        isFavorite: true
      });

      const updated = TrashManager.softDelete([item], 'tab_preserve');
      const trashed = updated[0];

      expect(trashed.deletedAt).toBeTruthy();
      expect(trashed.title).toBe('Special Title');
      expect(trashed.notes).toBe('Critical notes to preserve');
      expect(trashed.tags).toEqual(['tag1', 'tag2']);
      expect(trashed.collectionIds).toEqual(['col1', 'col2']);
      expect(trashed.isFavorite).toBe(true);
      expect(trashed.url).toBe(item.url);
      expect(trashed.archiveSizeBytes).toBe(item.archiveSizeBytes);
    });

    it('does not overwrite existing deletedAt if item is already in trash', () => {
      const originalTime = '2026-10-20T08:00:00.000Z';
      const item = createSampleItem({ id: 'tab_1', deletedAt: originalTime });

      const updated = TrashManager.softDelete([item], 'tab_1', '2026-10-24T12:00:00.000Z');
      expect(updated[0].deletedAt).toBe(originalTime);
    });

    it('safely handles non-existent item id', () => {
      const items = [createSampleItem({ id: 'tab_1' })];
      const updated = TrashManager.softDelete(items, 'non_existent_id');
      expect(updated).toEqual(items);
    });
  });

  describe('Restore from Trash', () => {
    it('resets deletedAt to null and restores item to active library', () => {
      const items: SavedTabItem[] = [
        createSampleItem({ id: 'tab_1', deletedAt: '2026-10-24T11:00:00.000Z' }),
        createSampleItem({ id: 'tab_2', deletedAt: '2026-10-24T11:30:00.000Z' })
      ];

      const restored = TrashManager.restoreFromTrash(items, 'tab_1');

      expect(restored[0].deletedAt).toBeNull();
      expect(restored[1].deletedAt).toBe('2026-10-24T11:30:00.000Z');
      expect(TrashManager.isItemInTrash(restored[0])).toBe(false);
      expect(TrashManager.isItemInTrash(restored[1])).toBe(true);
    });

    it('preserves all metadata after restoration', () => {
      const item = createSampleItem({
        id: 'tab_restore_meta',
        title: 'Preserved After Restore',
        notes: 'Restored notes',
        tags: ['restored'],
        deletedAt: '2026-10-24T09:00:00Z'
      });

      const restored = TrashManager.restoreFromTrash([item], 'tab_restore_meta');
      const active = restored[0];

      expect(active.deletedAt).toBeNull();
      expect(active.title).toBe('Preserved After Restore');
      expect(active.notes).toBe('Restored notes');
      expect(active.tags).toEqual(['restored']);
    });

    it('safely handles restoring an item that was not in trash', () => {
      const item = createSampleItem({ id: 'tab_active', deletedAt: null });
      const restored = TrashManager.restoreFromTrash([item], 'tab_active');
      expect(restored[0].deletedAt).toBeNull();
    });
  });

  describe('Permanent Deletion', () => {
    it('permanently deletes an item from the collection', () => {
      const items: SavedTabItem[] = [
        createSampleItem({ id: 'tab_1', deletedAt: '2026-10-24T10:00:00Z' }),
        createSampleItem({ id: 'tab_2', deletedAt: null }),
        createSampleItem({ id: 'tab_3', deletedAt: '2026-10-24T11:00:00Z' })
      ];

      const afterDelete = TrashManager.permanentDelete(items, 'tab_1');

      expect(afterDelete.length).toBe(2);
      expect(afterDelete.some(i => i.id === 'tab_1')).toBe(false);
      expect(afterDelete.some(i => i.id === 'tab_2')).toBe(true);
      expect(afterDelete.some(i => i.id === 'tab_3')).toBe(true);
    });

    it('safely handles permanent deletion of non-existent id', () => {
      const items = [createSampleItem({ id: 'tab_1' })];
      const afterDelete = TrashManager.permanentDelete(items, 'tab_missing');
      expect(afterDelete.length).toBe(1);
    });
  });

  describe('Empty Trash', () => {
    it('permanently removes all items with deletedAt set while preserving all active items', () => {
      const items: SavedTabItem[] = [
        createSampleItem({ id: 'active_1', deletedAt: null }),
        createSampleItem({ id: 'trash_1', deletedAt: '2026-10-24T08:00:00Z' }),
        createSampleItem({ id: 'active_2', deletedAt: null }),
        createSampleItem({ id: 'trash_2', deletedAt: '2026-10-24T09:00:00Z' })
      ];

      const afterEmpty = TrashManager.emptyTrash(items);

      expect(afterEmpty.length).toBe(2);
      expect(afterEmpty.map(i => i.id)).toEqual(['active_1', 'active_2']);
      expect(afterEmpty.every(i => !i.deletedAt)).toBe(true);
    });

    it('returns an identical list when trash is already empty', () => {
      const items = [
        createSampleItem({ id: 'active_1', deletedAt: null }),
        createSampleItem({ id: 'active_2', deletedAt: null })
      ];

      const afterEmpty = TrashManager.emptyTrash(items);
      expect(afterEmpty.length).toBe(2);
    });
  });

  describe('Trash Filtering & Queries', () => {
    it('partitions active items and trash items accurately', () => {
      const items: SavedTabItem[] = [
        createSampleItem({ id: 'active_1', deletedAt: null }),
        createSampleItem({ id: 'trash_1', deletedAt: '2026-10-24T08:00:00Z' }),
        createSampleItem({ id: 'active_2', deletedAt: null })
      ];

      const active = TrashManager.getActiveItems(items);
      const trash = TrashManager.getTrashItems(items);

      expect(active.length).toBe(2);
      expect(active.map(i => i.id)).toEqual(['active_1', 'active_2']);

      expect(trash.length).toBe(1);
      expect(trash.map(i => i.id)).toEqual(['trash_1']);
    });
  });

  describe('Trash Retention & Expiration (PRD Epic 2.3)', () => {
    it('purges items in trash older than retention threshold and retains newer trash and active items', () => {
      const refDate = new Date('2026-10-24T12:00:00Z');
      const items: SavedTabItem[] = [
        // Active item saved long ago - MUST NEVER BE PURGED
        createSampleItem({ id: 'active_old', savedAt: '2026-08-01T00:00:00Z', deletedAt: null }),
        // Trashed 40 days ago (older than 30-day retention)
        createSampleItem({ id: 'trash_old', deletedAt: '2026-09-10T12:00:00Z' }),
        // Trashed 10 days ago (within 30-day retention)
        createSampleItem({ id: 'trash_recent', deletedAt: '2026-10-14T12:00:00Z' })
      ];

      const { retained, purged } = TrashManager.purgeExpiredTrash(items, 30, refDate);

      expect(purged.map(i => i.id)).toEqual(['trash_old']);
      expect(retained.map(i => i.id)).toEqual(['active_old', 'trash_recent']);
    });
  });

  describe('Vault Storage Accounting for Trash Directory', () => {
    let tempDir: string;
    let vault: VaultManager;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabsed-trash-test-'));
      vault = new VaultManager(tempDir);
      vault.initializeVault();
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('accurately accounts for files placed in vault trash directory', () => {
      const trashFile1 = path.join(tempDir, 'trash', 'trashed_archive_1.json');
      const trashFile2 = path.join(tempDir, 'trash', 'trashed_thumb_2.webp');

      fs.writeFileSync(trashFile1, Buffer.alloc(1500));
      fs.writeFileSync(trashFile2, Buffer.alloc(2500));

      const report = vault.calculateStorageReport();
      expect(report.trashBytes).toBe(4000);
      expect(report.exactVaultBytes).toBeGreaterThanOrEqual(4000);
    });
  });

  describe('Edge Cases and Sequential Lifecycles', () => {
    it('handles empty lists gracefully across all operations', () => {
      expect(TrashManager.softDelete([], 'tab_1')).toEqual([]);
      expect(TrashManager.restoreFromTrash([], 'tab_1')).toEqual([]);
      expect(TrashManager.permanentDelete([], 'tab_1')).toEqual([]);
      expect(TrashManager.emptyTrash([])).toEqual([]);
      expect(TrashManager.getActiveItems([])).toEqual([]);
      expect(TrashManager.getTrashItems([])).toEqual([]);
      expect(TrashManager.purgeExpiredTrash([], 30)).toEqual({ retained: [], purged: [] });
    });

    it('handles full lifecycle: active -> soft delete -> restore -> soft delete -> permanent delete', () => {
      const original = createSampleItem({ id: 'lifecycle_1', deletedAt: null });
      let list = [original];

      // 1. Soft delete
      list = TrashManager.softDelete(list, 'lifecycle_1');
      expect(list[0].deletedAt).toBeTruthy();
      expect(TrashManager.getActiveItems(list).length).toBe(0);
      expect(TrashManager.getTrashItems(list).length).toBe(1);

      // 2. Restore
      list = TrashManager.restoreFromTrash(list, 'lifecycle_1');
      expect(list[0].deletedAt).toBeNull();
      expect(TrashManager.getActiveItems(list).length).toBe(1);
      expect(TrashManager.getTrashItems(list).length).toBe(0);

      // 3. Soft delete again
      list = TrashManager.softDelete(list, 'lifecycle_1');
      expect(list[0].deletedAt).toBeTruthy();

      // 4. Permanent delete
      list = TrashManager.permanentDelete(list, 'lifecycle_1');
      expect(list.length).toBe(0);
    });

    it('handles malformed deletedAt timestamps and negative retention periods safely', () => {
      const items = [
        createSampleItem({ id: 'bad_date', deletedAt: 'not-a-valid-date-string' }),
        createSampleItem({ id: 'valid_date', deletedAt: '2026-01-01T00:00:00Z' })
      ];

      const res = TrashManager.purgeExpiredTrash(items, -5, new Date('2026-10-24T00:00:00Z'));
      // Malformed date does not crash and is retained
      expect(res.retained.some(i => i.id === 'bad_date')).toBe(true);
      // Valid old date is purged with non-negative clamp
      expect(res.purged.some(i => i.id === 'valid_date')).toBe(true);
    });
  });

  describe('UI Component Flow and Accessibility (PRD Epic 2.3)', () => {
    it('ConfirmationModal renders alertdialog role, autoFocus, and aria-labels when open', async () => {
      const { renderToString } = await import('react-dom/server');
      const { ConfirmationModal } = await import('../src/ui/components/ConfirmationModal');
      const React = await import('react');

      const html = renderToString(
        React.createElement(ConfirmationModal, {
          isOpen: true,
          title: 'Permanently Delete Tab?',
          message: 'This action cannot be undone.',
          confirmLabel: 'Permanently Delete',
          cancelLabel: 'Cancel',
          onConfirm: () => {},
          onCancel: () => {}
        })
      );

      expect(html).toContain('role="alertdialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('Permanently Delete Tab?');
      expect(html).toContain('This action cannot be undone.');
      expect(html).toContain('Permanently Delete');
      expect(html).toContain('Cancel');
      expect(html).toContain('aria-label="Close dialog"');

      // Returns empty string when closed
      const closedHtml = renderToString(
        React.createElement(ConfirmationModal, {
          isOpen: false,
          title: 'Test',
          message: 'Test',
          onConfirm: () => {},
          onCancel: () => {}
        })
      );
      expect(closedHtml).toBe('');
    });

    it('TabGrid renders Restore from Trash and Permanently Delete with aria-labels when in trash view', async () => {
      const { renderToString } = await import('react-dom/server');
      const { TabGrid } = await import('../src/ui/components/TabGrid');
      const React = await import('react');

      const trashedItem = createSampleItem({ id: 'tab_trash_grid', deletedAt: '2026-10-24T00:00:00Z' });
      const htmlInTrash = renderToString(
        React.createElement(TabGrid, {
          items: [trashedItem],
          selectedItemId: null,
          onSelectItem: () => {},
          onToggleFavorite: () => {},
          onDeleteItem: () => {},
          onRestoreItem: () => {},
          onOpenLiveUrl: () => {},
          isTrash: true
        })
      );

      expect(htmlInTrash).toContain('title="Restore from Trash"');
      expect(htmlInTrash).toContain('aria-label="Restore from Trash"');
      expect(htmlInTrash).toContain('title="Permanently Delete"');
      expect(htmlInTrash).toContain('aria-label="Permanently Delete"');

      // When not in trash view and item is active:
      const activeItem = createSampleItem({ id: 'tab_active_grid', deletedAt: null });
      const htmlActive = renderToString(
        React.createElement(TabGrid, {
          items: [activeItem],
          selectedItemId: null,
          onSelectItem: () => {},
          onToggleFavorite: () => {},
          onDeleteItem: () => {},
          onRestoreItem: () => {},
          onOpenLiveUrl: () => {},
          isTrash: false
        })
      );

      expect(htmlActive).not.toContain('title="Restore from Trash"');
      expect(htmlActive).toContain('title="Move to Trash"');
      expect(htmlActive).toContain('aria-label="Move to Trash"');
    });

    it('TabCompactList renders Restore from Trash and Permanently Delete when in trash view', async () => {
      const { renderToString } = await import('react-dom/server');
      const { TabCompactList } = await import('../src/ui/components/TabCompactList');
      const React = await import('react');

      const trashedItem = createSampleItem({ id: 'tab_trash_compact', deletedAt: '2026-10-24T00:00:00Z' });
      const htmlInTrash = renderToString(
        React.createElement(TabCompactList, {
          items: [trashedItem],
          selectedItemId: null,
          onSelectItem: () => {},
          onToggleFavorite: () => {},
          onDeleteItem: () => {},
          onRestoreItem: () => {},
          onOpenLiveUrl: () => {},
          isTrash: true
        })
      );

      expect(htmlInTrash).toContain('title="Restore from Trash"');
      expect(htmlInTrash).toContain('aria-label="Restore from Trash"');
      expect(htmlInTrash).toContain('title="Permanently Delete"');
      expect(htmlInTrash).toContain('aria-label="Permanently Delete"');
    });

    it('TabDetailedList renders Restore from Trash and Permanently Delete when in trash view', async () => {
      const { renderToString } = await import('react-dom/server');
      const { TabDetailedList } = await import('../src/ui/components/TabDetailedList');
      const React = await import('react');

      const trashedItem = createSampleItem({ id: 'tab_trash_detail', deletedAt: '2026-10-24T00:00:00Z' });
      const htmlInTrash = renderToString(
        React.createElement(TabDetailedList, {
          items: [trashedItem],
          selectedItemId: null,
          onSelectItem: () => {},
          onToggleFavorite: () => {},
          onDeleteItem: () => {},
          onRestoreItem: () => {},
          onOpenLiveUrl: () => {},
          isTrash: true
        })
      );

      expect(htmlInTrash).toContain('title="Restore from Trash"');
      expect(htmlInTrash).toContain('aria-label="Restore from Trash"');
      expect(htmlInTrash).toContain('title="Permanently Delete"');
      expect(htmlInTrash).toContain('aria-label="Permanently Delete"');
    });

    it('DetailInspector renders trash status banner, Restore button, and Permanently Delete button when in trash', async () => {
      const { renderToString } = await import('react-dom/server');
      const { DetailInspector } = await import('../src/ui/components/DetailInspector');
      const React = await import('react');

      const trashedItem = createSampleItem({ id: 'tab_inspector_trash', deletedAt: '2026-10-24T00:00:00Z' });
      const htmlInTrash = renderToString(
        React.createElement(DetailInspector, {
          item: trashedItem,
          onClose: () => {},
          onUpdateNotes: () => {},
          onAddTag: () => {},
          onRemoveTag: () => {},
          onOpenLiveUrl: () => {},
          onCheckAvailability: () => {},
          onRestoreItem: () => {},
          onDeleteItem: () => {},
          isTrash: true
        })
      );

      expect(htmlInTrash).toContain('This tab is currently in the Trash.');
      expect(htmlInTrash).toContain('Restore from Trash');
      expect(htmlInTrash).toContain('Permanently Delete');
      expect(htmlInTrash).toContain('aria-label="Restore from Trash"');
      expect(htmlInTrash).toContain('aria-label="Permanently Delete"');

      // When active
      const activeItem = createSampleItem({ id: 'tab_inspector_active', deletedAt: null });
      const htmlActive = renderToString(
        React.createElement(DetailInspector, {
          item: activeItem,
          onClose: () => {},
          onUpdateNotes: () => {},
          onAddTag: () => {},
          onRemoveTag: () => {},
          onOpenLiveUrl: () => {},
          onCheckAvailability: () => {},
          onRestoreItem: () => {},
          onDeleteItem: () => {},
          isTrash: false
        })
      );

      expect(htmlActive).not.toContain('This tab is currently in the Trash.');
      expect(htmlActive).toContain('Move to Trash');
      expect(htmlActive).not.toContain('Restore from Trash');
    });

    it('Header renders Empty Trash button when in Trash view and Save Tabs when in normal view', async () => {
      const { renderToString } = await import('react-dom/server');
      const { Header } = await import('../src/ui/components/Header');
      const React = await import('react');

      const htmlInTrash = renderToString(
        React.createElement(Header, {
          searchQuery: '',
          onSearchChange: () => {},
          viewMode: 'grid',
          onViewModeChange: () => {},
          sortBy: 'newest',
          onSortByChange: () => {},
          filterType: 'all',
          onFilterTypeChange: () => {},
          itemCount: 2,
          onOpenSaveModal: () => {},
          onQuickSave: () => {},
          isTrash: true,
          onEmptyTrash: () => {},
          trashCount: 2
        })
      );

      expect(htmlInTrash).toContain('Empty Trash');
      expect(htmlInTrash).not.toContain('Save Tabs');

      const htmlActive = renderToString(
        React.createElement(Header, {
          searchQuery: '',
          onSearchChange: () => {},
          viewMode: 'grid',
          onViewModeChange: () => {},
          sortBy: 'newest',
          onSortByChange: () => {},
          filterType: 'all',
          onFilterTypeChange: () => {},
          itemCount: 5,
          onOpenSaveModal: () => {},
          onQuickSave: () => {},
          isTrash: false,
          trashCount: 0
        })
      );

      expect(htmlActive).toContain('Save Tabs');
      expect(htmlActive).not.toContain('Empty Trash');
    });
  });
});
