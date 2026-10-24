import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { VaultManager } from '../src/core/vault/vault-manager';

describe('Storage Accounting (PRD Section 11.8 & Epic 2.1)', () => {
  let tempDir: string;
  let vault: VaultManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabsed-storage-test-'));
    vault = new VaultManager(tempDir);
    vault.initializeVault();
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('accurately calculates exact bytes for vault-owned files', () => {
    // Write sample files to vault subdirectories
    const thumb1 = path.join(tempDir, 'thumbnails', 't1.webp');
    const thumb2 = path.join(tempDir, 'thumbnails', 't2.webp');
    const db = path.join(tempDir, 'database', 'tabsed.sqlite');
    const arch = path.join(tempDir, 'archives', 'capture.json');

    fs.writeFileSync(thumb1, Buffer.alloc(1024)); // 1KB
    fs.writeFileSync(thumb2, Buffer.alloc(2048)); // 2KB
    fs.writeFileSync(db, Buffer.alloc(4096));     // 4KB
    fs.writeFileSync(arch, Buffer.alloc(512));    // 512B

    const report = vault.calculateStorageReport();
    const manifestSize = fs.statSync(path.join(tempDir, 'manifest.json')).size;

    expect(report.thumbnailsBytes).toBe(1024 + 2048);
    expect(report.databaseBytes).toBe(4096);
    expect(report.archivesBytes).toBe(512);
    expect(report.manifestBytes).toBe(manifestSize);
    expect(report.exactVaultBytes).toBe(1024 + 2048 + 4096 + 512 + manifestSize);

    // Profile estimate is explicitly distinct and not conflated
    expect(report.profileEstimateBytes).toBeNull();
  });
});
