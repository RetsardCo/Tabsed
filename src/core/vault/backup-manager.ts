import { BackupManifest, SavedTabItem } from '../../ui/types';

/**
 * Universal portable SHA-256 implementation
 * Works identically in Node.js, Vitest, and browser runtimes without Node "crypto" polyfills
 */
export function portableSha256(input: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiBitLength = input.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let str = input + '\x80';
  while ((str.length % 64) - 56) str += '\x00';

  for (let i = 0; i < str.length; i++) {
    const j = str.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }

  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];
    hash = hash.slice(0, 8);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15] || 0;
      const w2 = w[i - 2] || 0;
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = i < 16 ? (w[i] || 0) : ((w[i - 16] || 0) + s0 + (w[i - 7] || 0) + s1) | 0;

      const s1_h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1_h + ch + k[i] + w[i]) | 0;
      const s0_h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0_h + maj) | 0;

      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6]
      ];
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (8 * b)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }

  return result;
}

export interface BackupResult {
  manifest: BackupManifest;
  backupBlobJson: string;
}

export class BackupManager {
  /**
   * Generates a verifiable backup snapshot of vault items and configuration (PRD Epic 2.5)
   */
  public static createBackup(
    items: SavedTabItem[],
    vaultId = 'default-vault'
  ): BackupResult {
    const serializedData = JSON.stringify(items, null, 2);
    const hash = portableSha256(serializedData);
    const totalBytes = new Blob([serializedData]).size || serializedData.length;

    const manifest: BackupManifest = {
      backupId: 'backup_' + Date.now(),
      createdAt: new Date().toISOString(),
      schemaVersion: 1,
      vaultId,
      totalSizeBytes: totalBytes,
      itemCount: items.length,
      sha256: hash,
      files: [
        {
          path: 'vault_items.json',
          sizeBytes: totalBytes,
          sha256: hash
        }
      ]
    };

    return {
      manifest,
      backupBlobJson: serializedData
    };
  }

  /**
   * Verifies backup integrity against the manifest hash
   */
  public static verifyBackup(backupBlobJson: string, manifest: BackupManifest): boolean {
    const computedHash = portableSha256(backupBlobJson);
    return computedHash === manifest.sha256;
  }

  /**
   * Restores items from a verified backup
   */
  public static restoreFromBackup(backupBlobJson: string, manifest: BackupManifest): SavedTabItem[] {
    if (!this.verifyBackup(backupBlobJson, manifest)) {
      throw new Error('Backup integrity verification failed: hash mismatch');
    }

    const items = JSON.parse(backupBlobJson) as SavedTabItem[];
    if (!Array.isArray(items)) {
      throw new Error('Invalid backup content: expected an array of items');
    }

    return items;
  }
}
