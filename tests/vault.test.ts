import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { VaultManager } from '../src/core/vault/vault-manager';

describe('VaultManager', () => {
  let tempDir: string;
  let vault: VaultManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabsed-test-vault-'));
    vault = new VaultManager(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('initializes vault subdirectories and manifest.json', () => {
    const manifest = vault.initializeVault('My Test Vault', 1000000);
    expect(manifest.name).toBe('My Test Vault');
    expect(manifest.schemaVersion).toBe(1);

    expect(fs.existsSync(path.join(tempDir, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'database'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'thumbnails'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'archives'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'temp'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'backups'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'trash'))).toBe(true);
  });

  it('stages buffer and computes correct SHA-256 hash', () => {
    vault.initializeVault();
    const testData = Buffer.from('hello world from tabsed');
    const staged = vault.stageBuffer(testData, 'thumbnails/test.txt');

    expect(staged.sizeBytes).toBe(testData.length);
    expect(fs.existsSync(staged.tempFilePath)).toBe(true);
    expect(vault.verifyStagedFile(staged)).toBe(true);
  });

  it('fails verification if staged file content is modified', () => {
    vault.initializeVault();
    const testData = Buffer.from('original data');
    const staged = vault.stageBuffer(testData, 'thumbnails/test.txt');

    // Tamper with file
    fs.writeFileSync(staged.tempFilePath, Buffer.from('tampered data'));
    expect(vault.verifyStagedFile(staged)).toBe(false);

    expect(() => vault.commitStagedFile(staged)).toThrow(/Integrity verification failed/);
  });

  it('commits verified staged file to relative path inside vault', () => {
    vault.initializeVault();
    const testData = Buffer.from('image bytes');
    const staged = vault.stageBuffer(testData, 'thumbnails/preview_1.png');

    const committedRelative = vault.commitStagedFile(staged);
    expect(committedRelative).toBe(path.normalize('thumbnails/preview_1.png'));

    const finalPath = path.join(tempDir, committedRelative);
    expect(fs.existsSync(finalPath)).toBe(true);
    expect(fs.readFileSync(finalPath).toString()).toBe('image bytes');
    // Staging file in temp/ should no longer exist
    expect(fs.existsSync(staged.tempFilePath)).toBe(false);
  });

  it('sanitizes path traversal attempts during commit', () => {
    vault.initializeVault();
    const testData = Buffer.from('malicious attempt');
    const staged = vault.stageBuffer(testData, '../../secret.txt');

    const committedRelative = vault.commitStagedFile(staged);
    expect(committedRelative).not.toContain('..');
    const finalPath = path.join(tempDir, committedRelative);
    expect(finalPath.startsWith(tempDir)).toBe(true);
  });

  it('reconciles expired orphaned staging files', () => {
    vault.initializeVault();
    const tempSubdir = path.join(tempDir, 'temp');
    const oldStagedFile = path.join(tempSubdir, 'stage_old.tmp');
    fs.writeFileSync(oldStagedFile, 'old data');

    // Artificially age the file
    const oneDayAgo = (Date.now() - 25 * 3600 * 1000) / 1000;
    fs.utimesSync(oldStagedFile, oneDayAgo, oneDayAgo);

    const result = vault.reconcileStaging(3600 * 1000);
    expect(result.cleanedCount).toBe(1);
    expect(fs.existsSync(oldStagedFile)).toBe(false);
  });
});
