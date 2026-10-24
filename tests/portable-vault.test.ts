import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PortableVaultManager } from '../src/core/vault/portable-vault';
import { VaultManager } from '../src/core/vault/vault-manager';
import { SavedTabItem } from '../src/ui/types';

describe('Epic 4.1 --- Portable Vault & Drive Migration', () => {
  let sourceVaultDir: string;
  let targetExportDir: string;
  let destinationVaultDir: string;
  let vaultManager: VaultManager;
  let destVaultManager: VaultManager;

  const mockItems: SavedTabItem[] = [
    {
      id: 'tab_test_1',
      vaultId: 'vault_source',
      itemType: 'tab',
      title: 'TypeScript Documentation',
      url: 'https://www.typescriptlang.org/docs',
      normalizedUrl: 'https://www.typescriptlang.org/docs',
      domain: 'typescriptlang.org',
      savedAt: '2026-10-24T12:00:00Z',
      notes: 'Essential TS handbook',
      isFavorite: true,
      collectionIds: ['dev'],
      tags: ['TypeScript', 'Docs'],
      thumbnailUrl: 'thumbnails/ts_doc.png',
      archiveContent: 'TypeScript is a strongly typed programming language.',
      browserFamily: 'Chrome',
      availabilityStatus: 'reachable'
    },
    {
      id: 'tab_test_2',
      vaultId: 'vault_source',
      itemType: 'tab',
      title: 'GitHub Pull Requests',
      url: 'https://github.com/org/repo/pulls',
      normalizedUrl: 'https://github.com/org/repo/pulls',
      domain: 'github.com',
      savedAt: '2026-10-24T14:00:00Z',
      notes: 'Active code reviews',
      isFavorite: false,
      collectionIds: ['work'],
      tags: ['Git'],
      browserFamily: 'Edge',
      availabilityStatus: 'reachable'
    }
  ];

  beforeEach(() => {
    sourceVaultDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabsed-src-vault-'));
    targetExportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabsed-export-'));
    destinationVaultDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabsed-dest-vault-'));

    vaultManager = new VaultManager(sourceVaultDir);
    vaultManager.initializeVault('Source Vault');

    destVaultManager = new VaultManager(destinationVaultDir);
    destVaultManager.initializeVault('Destination Vault');

    // Create a mock thumbnail file in source vault
    const thumbFile = path.join(sourceVaultDir, 'thumbnails', 'ts_doc.png');
    fs.writeFileSync(thumbFile, Buffer.from('fake-png-thumbnail-bytes'));
  });

  afterEach(() => {
    [sourceVaultDir, targetExportDir, destinationVaultDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('Path Traversal & Unsafe Path Validation (PRD FR-111 & Epic 4.1)', () => {
    it('accepts safe relative paths', () => {
      expect(PortableVaultManager.validateRelativePath('thumbnails/thumb_1.jpg')).toBe(true);
      expect(PortableVaultManager.validateRelativePath('archives/session_10.json')).toBe(true);
      expect(PortableVaultManager.validateRelativePath('metadata/items.json')).toBe(true);
    });

    it('rejects directory traversal attacks climbing with ..', () => {
      expect(() => PortableVaultManager.validateRelativePath('../etc/passwd')).toThrow(/Path traversal/);
      expect(() => PortableVaultManager.validateRelativePath('thumbnails/../../secret.txt')).toThrow(/Path traversal/);
      expect(() => PortableVaultManager.validateRelativePath('..\\..\\Windows\\System32')).toThrow(/Path traversal/);
    });

    it('rejects absolute paths', () => {
      expect(() => PortableVaultManager.validateRelativePath('C:\\Users\\Admin\\vault')).toThrow(/Path traversal/);
      expect(() => PortableVaultManager.validateRelativePath('/etc/shadow')).toThrow(/Path traversal/);
    });

    it('rejects drive letters and null bytes', () => {
      expect(() => PortableVaultManager.validateRelativePath('D:items.json')).toThrow(/drive letters are forbidden/);
      expect(() => PortableVaultManager.validateRelativePath('thumbnails/test\0.png')).toThrow(/null byte detected/);
    });
  });

  describe('Portable Export', () => {
    it('exports vault with versioned manifest v1.0.0, relative paths, and SHA-256 hashes', () => {
      const result = PortableVaultManager.exportVault({
        vaultManager,
        targetDirectory: targetExportDir,
        items: mockItems,
        vaultName: 'Backup 2026',
        appVersion: '1.0.0'
      });

      expect(result.success ?? true).toBe(true);
      expect(result.manifest.manifestVersion).toBe('1.0.0');
      expect(result.manifest.itemCount).toBe(2);
      expect(fs.existsSync(path.join(targetExportDir, 'manifest.json'))).toBe(true);
      expect(fs.existsSync(path.join(targetExportDir, 'metadata', 'items.json'))).toBe(true);
      expect(fs.existsSync(path.join(targetExportDir, 'thumbnails', 'ts_doc.png'))).toBe(true);

      // Verify every file entry uses strictly relative paths and has valid SHA-256
      for (const entry of result.manifest.files) {
        expect(path.isAbsolute(entry.relativePath)).toBe(false);
        expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    it('enforces free space check and fails safely when space is insufficient', () => {
      expect(() => {
        PortableVaultManager.exportVault({
          vaultManager,
          targetDirectory: targetExportDir,
          items: mockItems,
          freeSpaceBytesOverride: 10 // Only 10 bytes available
        });
      }).toThrow(/Insufficient free space/);
    });
  });

  describe('Portable Import & Rollback', () => {
    it('imports portable package, verifies SHA-256, and handles duplicate conflict resolution', () => {
      // 1. Export source package
      PortableVaultManager.exportVault({
        vaultManager,
        targetDirectory: targetExportDir,
        items: mockItems
      });

      // 2. Import into destination vault
      const importResult = PortableVaultManager.importVault(targetExportDir, destVaultManager, {
        conflictStrategy: 'keep-both'
      });

      expect(importResult.success).toBe(true);
      expect(importResult.importedItemCount).toBe(2);
      expect(importResult.manifestVersion).toBe('1.0.0');

      // Verify committed files in destination vault
      expect(fs.existsSync(path.join(destinationVaultDir, 'thumbnails', 'ts_doc.png'))).toBe(true);
      expect(fs.existsSync(path.join(destinationVaultDir, 'metadata', 'items.json'))).toBe(true);
    });

    it('rejects import packages with unsupported schema version', () => {
      // Create invalid manifest
      const invalidManifest = {
        manifestVersion: '99.0.0',
        vaultId: 'v1',
        files: [],
        items: []
      };
      fs.writeFileSync(path.join(targetExportDir, 'manifest.json'), JSON.stringify(invalidManifest));

      expect(() => {
        PortableVaultManager.importVault(targetExportDir, destVaultManager);
      }).toThrow(/Unsupported manifest schema version/);
    });

    it('detects file hash corruption and rolls back staged files completely', () => {
      // 1. Export valid package
      PortableVaultManager.exportVault({
        vaultManager,
        targetDirectory: targetExportDir,
        items: mockItems
      });

      // 2. Tamper with a file inside the export package
      const thumbFile = path.join(targetExportDir, 'thumbnails', 'ts_doc.png');
      fs.writeFileSync(thumbFile, Buffer.from('TAMPERED_BYTES'));

      // 3. Attempt import - must throw integrity verification failure
      expect(() => {
        PortableVaultManager.importVault(targetExportDir, destVaultManager);
      }).toThrow(/Integrity verification failed/);

      // Verify staged rollback: no staged files remain in destination temp/
      const tempFiles = fs.readdirSync(path.join(destinationVaultDir, 'temp'));
      expect(tempFiles.filter(f => f.startsWith('import_stage_')).length).toBe(0);

      // Verify no corrupted thumbnail reached destination
      expect(fs.existsSync(path.join(destinationVaultDir, 'thumbnails', 'ts_doc.png'))).toBe(false);
    });

    it('rolls back staging cleanly if an unexpected failure occurs during staging', () => {
      PortableVaultManager.exportVault({
        vaultManager,
        targetDirectory: targetExportDir,
        items: mockItems
      });

      expect(() => {
        PortableVaultManager.importVault(targetExportDir, destVaultManager, {
          simulateFailureDuringStaging: true
        });
      }).toThrow(/Simulated unexpected disk\/system failure/);

      // Staging directory must be cleaned up
      const tempFiles = fs.readdirSync(path.join(destinationVaultDir, 'temp'));
      expect(tempFiles.filter(f => f.startsWith('import_stage_')).length).toBe(0);
    });
  });

  describe('Drive Migration Helper', () => {
    it('migrates vault to new directory with verification of all checksums', () => {
      const migrateTargetDir = path.join(os.tmpdir(), 'tabsed-migrated-vault-' + Date.now());

      const res = PortableVaultManager.migrateVaultDrive(sourceVaultDir, migrateTargetDir);
      expect(res.success).toBe(true);
      expect(res.filesMigrated).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(migrateTargetDir, 'manifest.json'))).toBe(true);
      expect(fs.existsSync(path.join(migrateTargetDir, 'thumbnails', 'ts_doc.png'))).toBe(true);

      fs.rmSync(migrateTargetDir, { recursive: true, force: true });
    });

    it('rolls back completely if error occurs during migration, keeping source intact', () => {
      const migrateTargetDir = path.join(os.tmpdir(), 'tabsed-migrated-fail-' + Date.now());

      expect(() => {
        PortableVaultManager.migrateVaultDrive(sourceVaultDir, migrateTargetDir, {
          simulateErrorDuringCopy: true
        });
      }).toThrow(/Simulated I\/O failure/);

      // Target directory must be cleaned up (rolled back)
      expect(fs.existsSync(migrateTargetDir)).toBe(false);

      // Source directory remains completely intact
      expect(fs.existsSync(path.join(sourceVaultDir, 'manifest.json'))).toBe(true);
      expect(fs.existsSync(path.join(sourceVaultDir, 'thumbnails', 'ts_doc.png'))).toBe(true);
    });
  });
});
