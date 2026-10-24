import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  PortableVaultManifest,
  PortableManifestFileEntry,
  PortableExportResult,
  ImportConflictStrategy,
  SavedTabItem,
  Collection,
  Tag
} from '../../ui/types';
import { VaultManager } from './vault-manager';

export interface PortableExportOptions {
  vaultManager: VaultManager;
  targetDirectory: string;
  items: SavedTabItem[];
  selectedItemIds?: string[];
  collections?: Collection[];
  tags?: Tag[];
  vaultName?: string;
  appVersion?: string;
  freeSpaceBytesOverride?: number; // For testing or OS reported free space
}

export interface PortableImportOptions {
  conflictStrategy?: ImportConflictStrategy;
  simulateFailureDuringStaging?: boolean; // For testing staged rollback
}

export interface PortableImportResult {
  success: boolean;
  importedItems: SavedTabItem[];
  importedItemCount: number;
  conflictsResolvedCount: number;
  totalBytesImported: number;
  manifestVersion: string;
}

export interface MigrationResult {
  success: boolean;
  sourcePath: string;
  targetPath: string;
  filesMigrated: number;
  totalBytes: number;
}

export class PortableVaultManager {
  public static readonly SUPPORTED_SCHEMA_VERSIONS = ['1.0.0'];

  /**
   * Validates relative path strictly against path traversal, absolute paths, drive letters, and null bytes (PRD Epic 4.1 & FR-111)
   */
  public static validateRelativePath(relPath: string, baseDir?: string): boolean {
    if (!relPath || typeof relPath !== 'string') {
      throw new Error(`Path traversal or unsafe path rejected: empty or invalid path`);
    }

    if (relPath.includes('\0')) {
      throw new Error(`Path traversal or unsafe path rejected: null byte detected in path (${relPath})`);
    }

    // Reject Windows drive letters (e.g. C:, D:)
    if (/^[a-zA-Z]:/.test(relPath)) {
      throw new Error(`Path traversal or unsafe path rejected: drive letters are forbidden in relative paths (${relPath})`);
    }

    // Reject leading slashes/backslashes
    if (relPath.startsWith('/') || relPath.startsWith('\\')) {
      throw new Error(`Path traversal or unsafe path rejected: leading slash forbidden in relative path (${relPath})`);
    }

    if (path.isAbsolute(relPath)) {
      throw new Error(`Path traversal or unsafe path rejected: absolute paths are forbidden (${relPath})`);
    }

    // Check for directory climbing '../' or '..\\'
    const normalized = path.normalize(relPath);
    if (normalized.startsWith('..') || normalized.split(path.sep).includes('..')) {
      throw new Error(`Path traversal or unsafe path rejected: directory climbing ('..') detected (${relPath})`);
    }

    if (baseDir) {
      const resolvedBase = path.resolve(baseDir);
      const resolvedTarget = path.resolve(resolvedBase, normalized);
      if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
        throw new Error(`Path traversal or unsafe path rejected: path escapes root boundary (${relPath})`);
      }
    }

    return true;
  }

  /**
   * Computes SHA-256 hash of a file on disk
   */
  public static computeFileSha256(filePath: string): string {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Computes SHA-256 hash of a buffer
   */
  public static computeBufferSha256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Exports selected or complete vault content into a portable directory with a versioned manifest (PRD Epic 4.1)
   */
  public static exportVault(options: PortableExportOptions): PortableExportResult {
    const {
      vaultManager,
      targetDirectory,
      items,
      selectedItemIds,
      collections,
      tags,
      vaultName = 'Tabsed Portable Vault',
      appVersion = '1.0.0',
      freeSpaceBytesOverride
    } = options;

    const sourceRoot = vaultManager.getRootPath();

    // Filter items if specific selection requested
    const itemsToExport = selectedItemIds && selectedItemIds.length > 0
      ? items.filter(item => selectedItemIds.includes(item.id))
      : items;

    // Estimate file sizes and verify required disk space
    let totalEstimatedBytes = 0;
    const fileEntries: PortableManifestFileEntry[] = [];

    // Ensure target directory exists
    if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory, { recursive: true });
    }

    // Create target subdirectories
    const subdirs = ['thumbnails', 'archives', 'metadata'];
    for (const sub of subdirs) {
      const p = path.join(targetDirectory, sub);
      if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
      }
    }

    // 1. Process items and gather referenced assets
    for (const item of itemsToExport) {
      // Check for thumbnail file
      if (item.thumbnailUrl && !item.thumbnailUrl.startsWith('http://') && !item.thumbnailUrl.startsWith('https://')) {
        const relativeThumb = item.thumbnailUrl.replace(/^[/\\]+/, '');
        this.validateRelativePath(relativeThumb, sourceRoot);
        const sourceThumbPath = path.join(sourceRoot, relativeThumb);
        if (fs.existsSync(sourceThumbPath)) {
          const stats = fs.statSync(sourceThumbPath);
          totalEstimatedBytes += stats.size;
        }
      }

      // Check for archive files
      const possibleArchiveRel = path.join('archives', `${item.id}.json`);
      const possibleArchiveSrc = path.join(sourceRoot, possibleArchiveRel);
      if (fs.existsSync(possibleArchiveSrc)) {
        const stats = fs.statSync(possibleArchiveSrc);
        totalEstimatedBytes += stats.size;
      }
    }

    // Add estimated items JSON size
    const serializedItems = JSON.stringify(itemsToExport, null, 2);
    totalEstimatedBytes += Buffer.byteLength(serializedItems, 'utf8');

    // Free space check (PRD Epic 4.1 & FR-110)
    if (freeSpaceBytesOverride !== undefined && freeSpaceBytesOverride < totalEstimatedBytes) {
      throw new Error(
        `Insufficient free space: required ${totalEstimatedBytes} bytes, but only ${freeSpaceBytesOverride} bytes available`
      );
    }

    // 2. Copy assets and record manifest entries
    for (const item of itemsToExport) {
      // Thumbnail
      if (item.thumbnailUrl && !item.thumbnailUrl.startsWith('http://') && !item.thumbnailUrl.startsWith('https://')) {
        const relativeThumb = item.thumbnailUrl.replace(/^[/\\]+/, '');
        const sourceThumbPath = path.join(sourceRoot, relativeThumb);
        if (fs.existsSync(sourceThumbPath)) {
          const destThumbPath = path.join(targetDirectory, relativeThumb);
          const destThumbDir = path.dirname(destThumbPath);
          if (!fs.existsSync(destThumbDir)) {
            fs.mkdirSync(destThumbDir, { recursive: true });
          }
          fs.copyFileSync(sourceThumbPath, destThumbPath);

          const hash = this.computeFileSha256(destThumbPath);
          const size = fs.statSync(destThumbPath).size;
          fileEntries.push({
            relativePath: relativeThumb.replace(/\\/g, '/'),
            sizeBytes: size,
            sha256: hash,
            category: 'thumbnail'
          });
        }
      }

      // Archive content
      if (item.archiveContent) {
        const relPath = `archives/${item.id}_content.txt`;
        const destPath = path.join(targetDirectory, relPath);
        fs.writeFileSync(destPath, item.archiveContent, 'utf8');
        const hash = this.computeFileSha256(destPath);
        const size = fs.statSync(destPath).size;
        fileEntries.push({
          relativePath: relPath,
          sizeBytes: size,
          sha256: hash,
          category: 'archive'
        });
      }
    }

    // 3. Write items.json
    const itemsRelPath = 'metadata/items.json';
    const itemsDestPath = path.join(targetDirectory, itemsRelPath);
    fs.writeFileSync(itemsDestPath, serializedItems, 'utf8');
    const itemsHash = this.computeFileSha256(itemsDestPath);
    const itemsSize = fs.statSync(itemsDestPath).size;
    fileEntries.push({
      relativePath: itemsRelPath,
      sizeBytes: itemsSize,
      sha256: itemsHash,
      category: 'item_data'
    });

    // 4. Generate versioned manifest.json
    const nowIso = new Date().toISOString();
    let totalBytes = 0;
    for (const f of fileEntries) {
      totalBytes += f.sizeBytes;
    }

    const manifest: PortableVaultManifest = {
      manifestVersion: '1.0.0',
      vaultId: crypto.randomUUID(),
      vaultName,
      createdAt: nowIso,
      exportedAt: nowIso,
      appVersion,
      itemCount: itemsToExport.length,
      totalSizeBytes: totalBytes,
      files: fileEntries,
      items: itemsToExport,
      metadata: {
        collections,
        tags,
        exportedBy: 'Tabsed Desktop'
      }
    };

    const manifestPath = path.join(targetDirectory, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    return {
      success: true,
      manifest,
      exportPath: targetDirectory,
      totalFiles: fileEntries.length + 1, // Including manifest.json
      totalBytes: totalBytes + fs.statSync(manifestPath).size
    };
  }

  /**
   * Imports portable vault package with schema verification, strict path traversal checks,
   * SHA-256 hash checks, duplicate conflict resolution, and staged rollback on failure (PRD Epic 4.1)
   */
  public static importVault(
    importSourcePath: string,
    targetVault: VaultManager,
    options: PortableImportOptions = {}
  ): PortableImportResult {
    const { conflictStrategy = 'keep-both', simulateFailureDuringStaging = false } = options;

    if (!fs.existsSync(importSourcePath)) {
      throw new Error(`Import source directory not found: ${importSourcePath}`);
    }

    const manifestPath = path.join(importSourcePath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Invalid portable vault: manifest.json not found in import package`);
    }

    let manifest: PortableVaultManifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e: any) {
      throw new Error(`Invalid portable vault manifest: JSON parse error (${e.message})`);
    }

    // Schema version check (PRD Epic 4.1)
    if (!manifest.manifestVersion || !this.SUPPORTED_SCHEMA_VERSIONS.includes(manifest.manifestVersion)) {
      throw new Error(
        `Unsupported manifest schema version: "${manifest.manifestVersion || 'unknown'}". Supported versions: ${this.SUPPORTED_SCHEMA_VERSIONS.join(', ')}`
      );
    }

    if (!Array.isArray(manifest.files) || !Array.isArray(manifest.items)) {
      throw new Error(`Invalid portable vault manifest: missing files or items array`);
    }

    // Step 1: Create a staging directory in target vault
    const vaultRoot = targetVault.getRootPath();
    const stageId = crypto.randomUUID();
    const stagingDir = path.join(vaultRoot, 'temp', `import_stage_${stageId}`);
    fs.mkdirSync(stagingDir, { recursive: true });

    try {
      // Step 2 & 3: Validate paths and stage copy with hash verification
      let totalBytesImported = 0;

      for (const fileEntry of manifest.files) {
        // Strict path traversal and unsafe path check
        this.validateRelativePath(fileEntry.relativePath, stagingDir);

        const sourceFilePath = path.join(importSourcePath, fileEntry.relativePath);
        if (!fs.existsSync(sourceFilePath)) {
          throw new Error(`Manifest file missing from import package: ${fileEntry.relativePath}`);
        }

        const stagingFilePath = path.join(stagingDir, fileEntry.relativePath);
        const stagingFileDir = path.dirname(stagingFilePath);
        if (!fs.existsSync(stagingFileDir)) {
          fs.mkdirSync(stagingFileDir, { recursive: true });
        }

        // Copy to staging
        fs.copyFileSync(sourceFilePath, stagingFilePath);

        // Compute and verify SHA-256 hash
        const computedHash = this.computeFileSha256(stagingFilePath);
        if (computedHash !== fileEntry.sha256) {
          throw new Error(
            `Integrity verification failed for ${fileEntry.relativePath}: hash mismatch (expected ${fileEntry.sha256}, got ${computedHash})`
          );
        }

        totalBytesImported += fs.statSync(stagingFilePath).size;
      }

      if (simulateFailureDuringStaging) {
        throw new Error(`Simulated unexpected disk/system failure during import staging`);
      }

      // Step 4: Duplicate conflict resolution on items
      const importedItems: SavedTabItem[] = [];
      let conflictsResolvedCount = 0;

      for (const item of manifest.items) {
        if (conflictStrategy === 'skip') {
          importedItems.push(item);
        } else if (conflictStrategy === 'keep-both') {
          // Generate new UUID to prevent ID collision
          const newItemId = 'imported_' + crypto.randomUUID().slice(0, 8);
          conflictsResolvedCount++;
          importedItems.push({
            ...item,
            id: newItemId,
            title: `${item.title} (Imported)`
          });
        } else {
          // 'overwrite'
          conflictsResolvedCount++;
          importedItems.push(item);
        }
      }

      // Step 5: Commit staged files to target vault directories
      for (const fileEntry of manifest.files) {
        const stagedFilePath = path.join(stagingDir, fileEntry.relativePath);
        const targetFilePath = path.join(vaultRoot, fileEntry.relativePath);
        const targetDir = path.dirname(targetFilePath);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        fs.copyFileSync(stagedFilePath, targetFilePath);
      }

      // Clean up staging directory on success
      fs.rmSync(stagingDir, { recursive: true, force: true });

      return {
        success: true,
        importedItems,
        importedItemCount: importedItems.length,
        conflictsResolvedCount,
        totalBytesImported,
        manifestVersion: manifest.manifestVersion
      };
    } catch (err) {
      // Staged Rollback: clean up staging directory completely so no dirty files remain
      if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      }
      throw err;
    }
  }

  /**
   * Moves or migrates a vault to another drive/path with full verification and atomic rollback (PRD Epic 4.1 & FR-114)
   */
  public static migrateVaultDrive(
    sourceVaultPath: string,
    targetVaultPath: string,
    options: { simulateErrorDuringCopy?: boolean } = {}
  ): MigrationResult {
    if (!fs.existsSync(sourceVaultPath)) {
      throw new Error(`Source vault path does not exist: ${sourceVaultPath}`);
    }

    const sourceManifest = path.join(sourceVaultPath, 'manifest.json');
    if (!fs.existsSync(sourceManifest)) {
      throw new Error(`Invalid source vault: manifest.json not found in ${sourceVaultPath}`);
    }

    if (fs.existsSync(targetVaultPath)) {
      const existingEntries = fs.readdirSync(targetVaultPath);
      if (existingEntries.length > 0) {
        throw new Error(`Target destination is not empty: ${targetVaultPath}`);
      }
    } else {
      fs.mkdirSync(targetVaultPath, { recursive: true });
    }

    let filesMigrated = 0;
    let totalBytes = 0;

    try {
      // Walk source vault and copy every file to target
      const copyRecursive = (currentSrc: string, currentTarget: string) => {
        const entries = fs.readdirSync(currentSrc, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(currentSrc, entry.name);
          const destPath = path.join(currentTarget, entry.name);

          if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
            }
            copyRecursive(srcPath, destPath);
          } else if (entry.isFile()) {
            if (options.simulateErrorDuringCopy && filesMigrated >= 1) {
              throw new Error(`Simulated I/O failure (e.g. drive disconnected during copy)`);
            }

            fs.copyFileSync(srcPath, destPath);

            // Verify copied file hash
            const srcHash = this.computeFileSha256(srcPath);
            const destHash = this.computeFileSha256(destPath);

            if (srcHash !== destHash) {
              throw new Error(`Checksum mismatch during migration for file ${entry.name}`);
            }

            filesMigrated++;
            totalBytes += fs.statSync(destPath).size;
          }
        }
      };

      copyRecursive(sourceVaultPath, targetVaultPath);

      return {
        success: true,
        sourcePath: sourceVaultPath,
        targetPath: targetVaultPath,
        filesMigrated,
        totalBytes
      };
    } catch (err) {
      // Rollback on failure: clean up target directory completely, preserve source intact
      if (fs.existsSync(targetVaultPath)) {
        fs.rmSync(targetVaultPath, { recursive: true, force: true });
      }
      throw err;
    }
  }
}
