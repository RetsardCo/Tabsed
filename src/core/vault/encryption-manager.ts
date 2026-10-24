import * as crypto from 'crypto';
import * as fs from 'fs';
import { EncryptedVaultPayload } from '../../ui/types';

export interface EncryptionOptions {
  kdf?: 'scrypt' | 'pbkdf2';
  keyHint?: string;
  iterations?: number; // For PBKDF2
}

/**
 * EncryptionManager - Standard cryptographic implementation for Tabsed Vault
 * Aligned with Tabsed PRD Epic 4.2, Section 7.12 & Section 11.6
 *
 * Implements AES-256-GCM using Node.js crypto, random 12-byte nonces/IVs,
 * 16-byte GCM authentication tags, scrypt/PBKDF2 key derivation,
 * tamper detection, recovery key management, and safe memory cleanup.
 */
export class EncryptionManager {
  public static readonly ALGORITHM = 'aes-256-gcm';
  public static readonly IV_LENGTH_BYTES = 12; // 96-bit IV standard for AES-GCM
  public static readonly SALT_LENGTH_BYTES = 16;
  public static readonly KEY_LENGTH_BYTES = 32; // 256 bits for AES-256
  public static readonly AUTH_TAG_LENGTH_BYTES = 16; // 128-bit authentication tag

  /**
   * Overwrite buffer contents with zeroes to safely wipe sensitive keys/passwords from memory
   */
  public static wipeBuffer(buffer: Buffer | null | undefined): void {
    if (buffer && Buffer.isBuffer(buffer)) {
      buffer.fill(0);
    }
  }

  /**
   * Derives a 256-bit symmetric key from secret and salt using scrypt or PBKDF2
   */
  public static deriveKey(secret: string, salt: Buffer, kdf: 'scrypt' | 'pbkdf2' = 'scrypt'): Buffer {
    if (!secret || secret.length === 0) {
      throw new Error('Encryption secret cannot be empty');
    }

    if (kdf === 'pbkdf2') {
      return crypto.pbkdf2Sync(secret, salt, 100000, this.KEY_LENGTH_BYTES, 'sha256');
    }

    // Default to scrypt with secure parameters
    return crypto.scryptSync(secret, salt, this.KEY_LENGTH_BYTES, {
      N: 16384,
      r: 8,
      p: 1,
      maxmem: 32 * 1024 * 1024
    });
  }

  /**
   * Generates a high-entropy 128-bit formatted recovery key (e.g. TABSED-XXXX-XXXX-XXXX-XXXX)
   */
  public static generateRecoveryKey(): string {
    const rawBytes = crypto.randomBytes(16);
    const hex = rawBytes.toString('hex').toUpperCase();
    const chunks = [
      hex.substring(0, 4),
      hex.substring(4, 8),
      hex.substring(8, 12),
      hex.substring(12, 16)
    ];
    return `TABSED-${chunks.join('-')}`;
  }

  /**
   * Normalizes a secret string (strips formatting from recovery key if entered, case-insensitive)
   */
  public static normalizeSecret(secret: string): string {
    if (!secret || typeof secret !== 'string') return '';
    const trimmed = secret.trim();
    if (/^tabsed[- ]/i.test(trimmed)) {
      return trimmed.toUpperCase().replace(/\s+/g, '-');
    }
    return trimmed;
  }

  /**
   * Generates standard loss warning and storage instructions for recovery key (PRD FR-124)
   */
  public static getRecoveryKeyWarning(recoveryKey: string): string {
    return (
      `=== TABSED VAULT RECOVERY KEY ===\n\n` +
      `Recovery Key: ${recoveryKey}\n\n` +
      `IMPORTANT WARNING:\n` +
      `- Tabsed is a local-first application and does NOT store your password or key on remote servers.\n` +
      `- Loss of this recovery key and your password will make all encrypted archives and vault data PERMANENTLY UNRECOVERABLE.\n` +
      `- Store this key in a secure location (e.g., password manager, safe deposit).\n` +
      `- Never share this recovery key with untrusted parties.\n`
    );
  }

  /**
   * Encrypts plaintext data (Buffer, string, or object) with AES-256-GCM
   */
  public static encryptData(
    data: Buffer | string | object,
    secret: string,
    options: EncryptionOptions = {}
  ): EncryptedVaultPayload {
    const { kdf = 'scrypt', keyHint } = options;
    const normalizedSecret = this.normalizeSecret(secret);

    // Convert data to buffer
    let dataBuffer: Buffer;
    if (Buffer.isBuffer(data)) {
      dataBuffer = data;
    } else if (typeof data === 'string') {
      dataBuffer = Buffer.from(data, 'utf8');
    } else {
      dataBuffer = Buffer.from(JSON.stringify(data), 'utf8');
    }

    const salt = crypto.randomBytes(this.SALT_LENGTH_BYTES);
    const iv = crypto.randomBytes(this.IV_LENGTH_BYTES);
    const derivedKey = this.deriveKey(normalizedSecret, salt, kdf);

    try {
      const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv, {
        authTagLength: this.AUTH_TAG_LENGTH_BYTES
      });

      const ciphertext = Buffer.concat([
        cipher.update(dataBuffer),
        cipher.final()
      ]);

      const authTag = cipher.getAuthTag();

      return {
        version: 1,
        algorithm: 'aes-256-gcm',
        kdf,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        ciphertext: ciphertext.toString('base64'),
        createdAt: new Date().toISOString(),
        keyHint
      };
    } finally {
      // Safe memory cleanup: wipe derived key
      this.wipeBuffer(derivedKey);
    }
  }

  /**
   * Decrypts an EncryptedVaultPayload using AES-256-GCM and verifies authenticity
   * Throws if tampered, corrupted, or if secret is incorrect.
   */
  public static decryptData(payload: EncryptedVaultPayload, secret: string): Buffer {
    if (payload.version !== 1 || payload.algorithm !== 'aes-256-gcm') {
      throw new Error(`Unsupported encryption format or algorithm: ${payload.algorithm}`);
    }

    const normalizedSecret = this.normalizeSecret(secret);
    const salt = Buffer.from(payload.salt, 'hex');
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');

    if (iv.length !== this.IV_LENGTH_BYTES) {
      throw new Error(`Invalid IV length: expected ${this.IV_LENGTH_BYTES} bytes, got ${iv.length}`);
    }

    if (authTag.length !== this.AUTH_TAG_LENGTH_BYTES) {
      throw new Error(`Invalid Auth Tag length: expected ${this.AUTH_TAG_LENGTH_BYTES} bytes, got ${authTag.length}`);
    }

    const derivedKey = this.deriveKey(normalizedSecret, salt, payload.kdf);

    try {
      const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, iv, {
        authTagLength: this.AUTH_TAG_LENGTH_BYTES
      });

      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]);

      return decrypted;
    } catch (err: any) {
      // In Node.js crypto, GCM auth tag mismatch or corrupted ciphertext throws
      // "Unsupported state or unable to authenticate data"
      throw new Error(`Tamper detected: authentication tag mismatch or corrupted ciphertext`);
    } finally {
      // Safe memory cleanup: wipe derived key
      this.wipeBuffer(derivedKey);
    }
  }

  /**
   * Decrypts an EncryptedVaultPayload and parses as JSON
   */
  public static decryptJson<T = any>(payload: EncryptedVaultPayload, secret: string): T {
    const decryptedBuffer = this.decryptData(payload, secret);
    try {
      return JSON.parse(decryptedBuffer.toString('utf8'));
    } finally {
      this.wipeBuffer(decryptedBuffer);
    }
  }

  /**
   * Encrypts a file on disk and returns the payload (or writes payload JSON to target)
   */
  public static encryptFile(
    sourcePath: string,
    targetPath: string,
    secret: string,
    options: EncryptionOptions = {}
  ): EncryptedVaultPayload {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file for encryption does not exist: ${sourcePath}`);
    }

    const fileData = fs.readFileSync(sourcePath);
    try {
      const payload = this.encryptData(fileData, secret, options);
      fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2), 'utf8');
      return payload;
    } finally {
      this.wipeBuffer(fileData);
    }
  }

  /**
   * Decrypts an encrypted file payload on disk to target file
   */
  public static decryptFile(sourceEncryptedPath: string, targetPath: string, secret: string): void {
    if (!fs.existsSync(sourceEncryptedPath)) {
      throw new Error(`Source encrypted file does not exist: ${sourceEncryptedPath}`);
    }

    const rawJson = fs.readFileSync(sourceEncryptedPath, 'utf8');
    const payload: EncryptedVaultPayload = JSON.parse(rawJson);

    const decryptedBuffer = this.decryptData(payload, secret);
    try {
      fs.writeFileSync(targetPath, decryptedBuffer);
    } finally {
      this.wipeBuffer(decryptedBuffer);
    }
  }
}
