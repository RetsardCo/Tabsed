import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface VaultManifest {
  vaultId: string;
  name: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  quotaBytes: number | null;
}

export interface StagedFile {
  stageId: string;
  tempFilePath: string;
  expectedRelativePath: string;
  sha256: string;
  sizeBytes: number;
  createdAt: number;
}

export interface StorageReport {
  exactVaultBytes: number;
  thumbnailsBytes: number;
  archivesBytes: number;
  databaseBytes: number;
  trashBytes: number;
  backupsBytes: number;
  temporaryBytes: number;
  manifestBytes: number;
  freeSpaceBytes: number | null;
  profileEstimateBytes: number | null; // clearly labeled as profile-level estimate
}

export class VaultManager {
  private rootPath: string;
  private manifest: VaultManifest | null = null;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  public getRootPath(): string {
    return this.rootPath;
  }

  /**
   * Initializes the vault folder structure and manifest file
   */
  public initializeVault(name = 'Default Vault', quotaBytes: number | null = 5 * 1024 * 1024 * 1024): VaultManifest {
    const subdirs = ['database', 'thumbnails', 'archives', 'temp', 'backups', 'trash'];
    
    if (!fs.existsSync(this.rootPath)) {
      fs.mkdirSync(this.rootPath, { recursive: true });
    }

    for (const dir of subdirs) {
      const fullPath = path.join(this.rootPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }

    const manifestPath = path.join(this.rootPath, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      this.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } else {
      this.manifest = {
        vaultId: crypto.randomUUID(),
        name,
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quotaBytes
      };
      fs.writeFileSync(manifestPath, JSON.stringify(this.manifest, null, 2), 'utf8');
    }

    return this.manifest!;
  }

  /**
   * Stage a file in temp/ before committing to vault storage
   */
  public stageBuffer(buffer: Buffer, targetRelativePath: string): StagedFile {
    const stageId = crypto.randomUUID();
    const tempDir = path.join(this.rootPath, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `stage_${stageId}.tmp`);
    fs.writeFileSync(tempFilePath, buffer);

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const sizeBytes = buffer.length;

    return {
      stageId,
      tempFilePath,
      expectedRelativePath: targetRelativePath,
      sha256,
      sizeBytes,
      createdAt: Date.now()
    };
  }

  /**
   * Verify staged file integrity against its recorded hash
   */
  public verifyStagedFile(staged: StagedFile): boolean {
    if (!fs.existsSync(staged.tempFilePath)) {
      return false;
    }
    const data = fs.readFileSync(staged.tempFilePath);
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return hash === staged.sha256 && data.length === staged.sizeBytes;
  }

  /**
   * Atomically commit staged file to final vault destination
   */
  /**
   * Atomically commit staged file to final vault destination
   */
  public commitStagedFile(staged: StagedFile): string {
    if (!this.verifyStagedFile(staged)) {
      throw new Error(`Integrity verification failed for staged file ${staged.stageId}`);
    }

    // Path traversal and unsafe path protection (PRD 12.2 and Epic 4.1)
    if (!staged.expectedRelativePath || staged.expectedRelativePath.includes('\0')) {
      throw new Error(`Path traversal or unsafe path rejected: invalid path string`);
    }

    if (path.isAbsolute(staged.expectedRelativePath)) {
      throw new Error(`Path traversal or unsafe path rejected: absolute paths are not permitted (${staged.expectedRelativePath})`);
    }

    const resolvedRoot = path.resolve(this.rootPath);
    const destinationPath = path.resolve(resolvedRoot, staged.expectedRelativePath);

    if (!destinationPath.startsWith(resolvedRoot + path.sep)) {
      throw new Error(`Path traversal or unsafe path rejected: destination path escapes vault root (${staged.expectedRelativePath})`);
    }

    const normalizedRelative = path.relative(resolvedRoot, destinationPath);
    const destinationDir = path.dirname(destinationPath);

    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    try {
      fs.renameSync(staged.tempFilePath, destinationPath);
    } catch (err: any) {
      if (err.code === 'EXDEV') {
        fs.copyFileSync(staged.tempFilePath, destinationPath);
        fs.unlinkSync(staged.tempFilePath);
      } else {
        throw err;
      }
    }
    return normalizedRelative;
  }

  /**
   * Startup crash reconciliation: clean or report orphaned staging files
   */
  public reconcileStaging(maxAgeMs = 3600000): { cleanedCount: number; orphanedFiles: string[] } {
    const tempDir = path.join(this.rootPath, 'temp');
    if (!fs.existsSync(tempDir)) {
      return { cleanedCount: 0, orphanedFiles: [] };
    }

    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    let cleanedCount = 0;
    const orphanedFiles: string[] = [];

    for (const file of files) {
      if (file.startsWith('stage_')) {
        const fullPath = path.join(tempDir, file);
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > maxAgeMs) {
          try {
            fs.unlinkSync(fullPath);
            cleanedCount++;
          } catch (e) {
            orphanedFiles.push(file);
          }
        } else {
          orphanedFiles.push(file);
        }
      }
    }

    return { cleanedCount, orphanedFiles };
  }

  /**
   * Compute exact storage byte accounting (PRD FR-090)
   */
  public calculateStorageReport(): StorageReport {
    const getDirSize = (subDir: string): number => {
      const fullDir = path.join(this.rootPath, subDir);
      if (!fs.existsSync(fullDir)) return 0;
      let total = 0;
      const walk = (d: string) => {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
          const p = path.join(d, entry.name);
          if (entry.isDirectory()) {
            walk(p);
          } else if (entry.isFile()) {
            total += fs.statSync(p).size;
          }
        }
      };
      walk(fullDir);
      return total;
    };

    const thumbnailsBytes = getDirSize('thumbnails');
    const archivesBytes = getDirSize('archives');
    const databaseBytes = getDirSize('database');
    const trashBytes = getDirSize('trash');
    const backupsBytes = getDirSize('backups');
    const temporaryBytes = getDirSize('temp');

    // Account for root-level vault metadata files (manifest.json, etc.)
    let manifestBytes = 0;
    try {
      const rootEntries = fs.readdirSync(this.rootPath, { withFileTypes: true });
      for (const entry of rootEntries) {
        if (entry.isFile()) {
          manifestBytes += fs.statSync(path.join(this.rootPath, entry.name)).size;
        }
      }
    } catch {
      // Ignore if root directory unreadable
    }

    const exactVaultBytes = thumbnailsBytes + archivesBytes + databaseBytes + trashBytes + backupsBytes + temporaryBytes + manifestBytes;

    return {
      exactVaultBytes,
      thumbnailsBytes,
      archivesBytes,
      databaseBytes,
      trashBytes,
      backupsBytes,
      temporaryBytes,
      manifestBytes,
      freeSpaceBytes: null, // Queried via OS if supported
      profileEstimateBytes: null // Explicitly separate, never conflated with vault-owned files
    };
  }
}
