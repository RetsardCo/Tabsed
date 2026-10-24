import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EncryptionManager } from '../src/core/vault/encryption-manager';

describe('Epic 4.2 --- Encryption and Key Management', () => {
  let tempDir: string;
  const testSecret = 'SuperSecureUserPassphrase2026!';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabsed-crypto-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Standard Cryptographic Primitives (AES-256-GCM)', () => {
    it('encrypts and decrypts string data with scrypt key derivation', () => {
      const plaintext = 'Sensitive financial research notes and bookmarks';
      const payload = EncryptionManager.encryptData(plaintext, testSecret, { kdf: 'scrypt' });

      expect(payload.version).toBe(1);
      expect(payload.algorithm).toBe('aes-256-gcm');
      expect(payload.kdf).toBe('scrypt');
      expect(payload.iv.length).toBe(24); // 12 bytes = 24 hex chars
      expect(payload.authTag.length).toBe(32); // 16 bytes = 32 hex chars
      expect(payload.ciphertext).not.toBe(plaintext);

      const decrypted = EncryptionManager.decryptData(payload, testSecret);
      expect(decrypted.toString('utf8')).toBe(plaintext);
    });

    it('encrypts and decrypts with PBKDF2 key derivation', () => {
      const plaintext = 'Private tab snapshot archive HTML bundle';
      const payload = EncryptionManager.encryptData(plaintext, testSecret, { kdf: 'pbkdf2' });

      expect(payload.kdf).toBe('pbkdf2');
      const decrypted = EncryptionManager.decryptData(payload, testSecret);
      expect(decrypted.toString('utf8')).toBe(plaintext);
    });

    it('encrypts and decrypts JSON objects with decryptJson helper', () => {
      const originalObj = {
        title: 'Banking Session',
        sessionTabs: [
          { url: 'https://bank.example.com/account', title: 'Checking' }
        ]
      };

      const payload = EncryptionManager.encryptData(originalObj, testSecret);
      const restored = EncryptionManager.decryptJson<typeof originalObj>(payload, testSecret);

      expect(restored).toEqual(originalObj);
    });
  });

  describe('Tamper Detection & Authentication Tag Verification (PRD FR-123 & Epic 4.2)', () => {
    it('throws tamper error when ciphertext is modified by even 1 byte', () => {
      const payload = EncryptionManager.encryptData('Important classified report', testSecret);

      // Tamper with ciphertext by altering characters
      const tamperedBytes = Buffer.from(payload.ciphertext, 'base64');
      tamperedBytes[0] ^= 0x01; // Flip 1 bit
      const tamperedPayload = {
        ...payload,
        ciphertext: tamperedBytes.toString('base64')
      };

      expect(() => {
        EncryptionManager.decryptData(tamperedPayload, testSecret);
      }).toThrow(/Tamper detected/);
    });

    it('throws tamper error when authentication tag is altered', () => {
      const payload = EncryptionManager.encryptData('Medical portal records', testSecret);

      // Corrupt auth tag
      const authTagBuffer = Buffer.from(payload.authTag, 'hex');
      authTagBuffer[0] ^= 0xff;
      const tamperedPayload = {
        ...payload,
        authTag: authTagBuffer.toString('hex')
      };

      expect(() => {
        EncryptionManager.decryptData(tamperedPayload, testSecret);
      }).toThrow(/Tamper detected/);
    });

    it('throws error when wrong password is supplied', () => {
      const payload = EncryptionManager.encryptData('Sensitive data', testSecret);

      expect(() => {
        EncryptionManager.decryptData(payload, 'WrongIncorrectPassword123!');
      }).toThrow(/Tamper detected/);
    });
  });

  describe('Recovery Key Generation and Loss Warning (PRD FR-124)', () => {
    it('generates formatted 128-bit recovery key matching TABSED-XXXX-XXXX-XXXX-XXXX', () => {
      const recoveryKey = EncryptionManager.generateRecoveryKey();
      expect(recoveryKey).toMatch(/^TABSED-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('successfully encrypts with passphrase and unlocks with recovery key', () => {
      const recoveryKey = EncryptionManager.generateRecoveryKey();
      const secretData = 'Restricted server credentials and SSH URLs';

      const payload = EncryptionManager.encryptData(secretData, recoveryKey);
      const decrypted = EncryptionManager.decryptData(payload, recoveryKey);

      expect(decrypted.toString('utf8')).toBe(secretData);

      // Verify case-insensitive recovery key entry (e.g. user typed lowercase or space-separated)
      const lowercaseKey = recoveryKey.toLowerCase();
      const decryptedWithLower = EncryptionManager.decryptData(payload, lowercaseKey);
      expect(decryptedWithLower.toString('utf8')).toBe(secretData);

      const spaceSeparatedKey = recoveryKey.replace(/-/g, ' ');
      const decryptedWithSpaces = EncryptionManager.decryptData(payload, spaceSeparatedKey);
      expect(decryptedWithSpaces.toString('utf8')).toBe(secretData);
    });

    it('produces unambiguous user warning regarding key loss', () => {
      const recoveryKey = EncryptionManager.generateRecoveryKey();
      const warningText = EncryptionManager.getRecoveryKeyWarning(recoveryKey);

      expect(warningText).toContain(recoveryKey);
      expect(warningText).toContain('PERMANENTLY UNRECOVERABLE');
      expect(warningText).toContain('local-first');
    });
  });

  describe('Safe Memory & Buffer Cleanup', () => {
    it('wipeBuffer zeroes out sensitive memory in buffer', () => {
      const secretKeyBuffer = Buffer.from('super-sensitive-raw-key-bytes-1234');
      expect(secretKeyBuffer[0]).not.toBe(0);

      EncryptionManager.wipeBuffer(secretKeyBuffer);

      // All bytes must be zero
      for (let i = 0; i < secretKeyBuffer.length; i++) {
        expect(secretKeyBuffer[i]).toBe(0);
      }
    });
  });

  describe('File-Level Encryption & Decryption on Disk', () => {
    it('encrypts a file on disk and decrypts it back to original content', () => {
      const originalFile = path.join(tempDir, 'plain_archive.html');
      const encryptedFile = path.join(tempDir, 'archive.enc.json');
      const restoredFile = path.join(tempDir, 'restored_archive.html');

      const originalHtml = '<html><body><h1>Saved Offline Snapshot</h1></body></html>';
      fs.writeFileSync(originalFile, originalHtml, 'utf8');

      // Encrypt file
      EncryptionManager.encryptFile(originalFile, encryptedFile, testSecret);
      expect(fs.existsSync(encryptedFile)).toBe(true);

      // Decrypt file
      EncryptionManager.decryptFile(encryptedFile, restoredFile, testSecret);
      expect(fs.existsSync(restoredFile)).toBe(true);

      const restoredContent = fs.readFileSync(restoredFile, 'utf8');
      expect(restoredContent).toBe(originalHtml);
    });
  });
});
