import { describe, it, expect } from 'vitest';
import { BackupManager } from '../src/core/vault/backup-manager';
import { SavedTabItem } from '../src/ui/types';

describe('Backup and Integrity (PRD Epic 2.5)', () => {
  const sampleItems: SavedTabItem[] = [
    {
      id: 'tab_1',
      vaultId: 'default',
      itemType: 'tab',
      title: 'Tauri 2.0 Guide',
      url: 'https://tauri.app',
      normalizedUrl: 'https://tauri.app',
      domain: 'tauri.app',
      browserFamily: 'Edge',
      savedAt: '2026-10-24T12:00:00Z',
      notes: 'Mica window setup',
      isFavorite: true,
      collectionIds: ['dev'],
      tags: ['desktop', 'rust']
    }
  ];

  it('generates a backup snapshot with valid SHA-256 manifest', () => {
    const backup = BackupManager.createBackup(sampleItems);
    expect(backup.manifest.backupId).toMatch(/^backup_\d+/);
    expect(backup.manifest.itemCount).toBe(1);
    expect(backup.manifest.sha256).toHaveLength(64);
    expect(backup.manifest.files).toHaveLength(1);
    expect(backup.backupBlobJson).toContain('Tauri 2.0 Guide');
  });

  it('verifies valid backup against its manifest hash', () => {
    const backup = BackupManager.createBackup(sampleItems);
    const isValid = BackupManager.verifyBackup(backup.backupBlobJson, backup.manifest);
    expect(isValid).toBe(true);
  });

  it('detects tampering or corruption in backup payload', () => {
    const backup = BackupManager.createBackup(sampleItems);
    const tamperedPayload = backup.backupBlobJson + ' ';
    const isValid = BackupManager.verifyBackup(tamperedPayload, backup.manifest);
    expect(isValid).toBe(false);

    expect(() => {
      BackupManager.restoreFromBackup(tamperedPayload, backup.manifest);
    }).toThrow('Backup integrity verification failed');
  });

  it('restores exact items from verified backup', () => {
    const backup = BackupManager.createBackup(sampleItems);
    const restored = BackupManager.restoreFromBackup(backup.backupBlobJson, backup.manifest);
    expect(restored).toHaveLength(1);
    expect(restored[0].id).toBe('tab_1');
    expect(restored[0].title).toBe('Tauri 2.0 Guide');
  });
});
