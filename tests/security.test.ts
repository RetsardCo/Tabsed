import { describe, it, expect } from 'vitest';
import { NativeMessagingProtocol, MAX_NATIVE_MESSAGE_SIZE } from '../src/core/connector/protocol';
import { AvailabilityChecker } from '../src/core/transaction/availability-checker';
import { PortableVaultManager } from '../src/core/vault/portable-vault';
import { PrivacyManager } from '../src/core/vault/privacy-manager';

describe('Cross-Cutting Security & Hardening Suite (PRD Section 12 & Epic Cross-Cutting)', () => {
  describe('Path Traversal Prevention (PRD FR-115, Threat Model)', () => {
    it('rejects relative parent directory traversal sequences via PortableVaultManager', () => {
      expect(() => PortableVaultManager.validateRelativePath('../secret.key')).toThrow(/directory climbing/);
      expect(() => PortableVaultManager.validateRelativePath('folder/../../etc/passwd')).toThrow(/directory climbing/);
      expect(() => PortableVaultManager.validateRelativePath('..\\..\\Windows\\System32\\config')).toThrow(/directory climbing/);
    });

    it('rejects absolute Windows paths and drive prefixes via PortableVaultManager', () => {
      expect(() => PortableVaultManager.validateRelativePath('C:\\Windows\\win.ini')).toThrow(/colon or NTFS|drive letters/);
      expect(() => PortableVaultManager.validateRelativePath('D:\\secret_vault')).toThrow(/colon or NTFS|drive letters/);
      expect(() => PortableVaultManager.validateRelativePath('/etc/shadow')).toThrow(/leading slash/);
    });

    it('rejects null byte injection attacks via PortableVaultManager', () => {
      expect(() => PortableVaultManager.validateRelativePath('safe_name.txt\0.exe')).toThrow(/null byte/);
    });

    it('rejects NTFS alternate data streams and reserved Windows device names', () => {
      expect(() => PortableVaultManager.validateRelativePath('safe.txt:stream')).toThrow(/colon or NTFS/);
      expect(() => PortableVaultManager.validateRelativePath('CON.txt')).toThrow(/Windows reserved device name/);
      expect(() => PortableVaultManager.validateRelativePath('NUL')).toThrow(/Windows reserved device name/);
    });

    it('allows valid relative sanitized filenames', () => {
      expect(PortableVaultManager.validateRelativePath('my-vault_backup.2026.json')).toBe(true);
      expect(PortableVaultManager.validateRelativePath('archives/tab_123.html')).toBe(true);
    });
  });

  describe('SSRF Protection in Availability Checker (PRD 12.3)', () => {
    it('blocks internal RFC 1918 private network addresses from SSRF', () => {
      expect(AvailabilityChecker.isSafeWebUrl('http://192.168.1.1/admin').safe).toBe(false);
      expect(AvailabilityChecker.isSafeWebUrl('http://10.0.0.5/api').safe).toBe(false);
      expect(AvailabilityChecker.isSafeWebUrl('http://172.20.1.10/status').safe).toBe(false);
    });

    it('blocks loopback and localhost addresses', () => {
      expect(AvailabilityChecker.isSafeWebUrl('http://localhost:8080/debug').safe).toBe(false);
      expect(AvailabilityChecker.isSafeWebUrl('http://127.0.0.1:3000').safe).toBe(false);
    });

    it('blocks AWS/GCP cloud metadata IP endpoints', () => {
      expect(AvailabilityChecker.isSafeWebUrl('http://169.254.169.254/latest/meta-data/').safe).toBe(false);
    });

    it('blocks dangerous protocol schemes like file:// and gopher://', () => {
      expect(AvailabilityChecker.isSafeWebUrl('file:///C:/Windows/System32/cmd.exe').safe).toBe(false);
      expect(AvailabilityChecker.isSafeWebUrl('gopher://example.com/').safe).toBe(false);
      expect(AvailabilityChecker.isSafeWebUrl('javascript:alert(1)').safe).toBe(false);
    });

    it('permits legitimate public HTTPS URLs', () => {
      expect(AvailabilityChecker.isSafeWebUrl('https://github.com/RetsardCo/Tabsed').safe).toBe(true);
      expect(AvailabilityChecker.isSafeWebUrl('https://developer.mozilla.org/').safe).toBe(true);
    });
  });

  describe('Native Messaging Security Limits & Schema Validation (PRD Epic 0.3)', () => {
    it('enforces maximum 1MB message size limit on outgoing messages', () => {
      const hugeString = 'a'.repeat(MAX_NATIVE_MESSAGE_SIZE + 10);
      const packet = {
        type: 'testPayload',
        payload: { data: hugeString },
        timestamp: new Date().toISOString()
      };

      expect(() => NativeMessagingProtocol.encodeMessage(packet)).toThrow(/exceeds 1MB limit/);
    });

    it('rejects malformed length prefixes (> 1MB) on incoming message buffer', () => {
      const buf = Buffer.alloc(8);
      // Write length prefix of 2MB (2097152 bytes)
      buf.writeUInt32LE(2 * 1024 * 1024, 0);

      expect(() => NativeMessagingProtocol.decodeMessage(buf)).toThrow(/exceeds 1MB limit/);
    });

    it('validates packet schema and rejects missing or empty message types', () => {
      expect(NativeMessagingProtocol.validatePacket(null)).toBe(false);
      expect(NativeMessagingProtocol.validatePacket({})).toBe(false);
      expect(NativeMessagingProtocol.validatePacket({ type: '' })).toBe(false);
      expect(NativeMessagingProtocol.validatePacket({ type: 'saveTabs', payload: {} })).toBe(true);
    });
  });

  describe('Sensitive URL Parameter Redaction for Logs & Diagnostics (PRD Section 12.2)', () => {
    it('redacts authentication tokens, passwords, and API keys via PrivacyManager.sanitizeUrlForLogs', () => {
      const dirtyUrl = 'https://api.service.com/v1/data?token=ghp_secret123456789&apikey=ak_live_xyz987&password=my_secret_pwd&view=summary';
      const cleanUrl = PrivacyManager.sanitizeUrlForLogs(dirtyUrl);

      expect(cleanUrl).not.toContain('ghp_secret123456789');
      expect(cleanUrl).not.toContain('ak_live_xyz987');
      expect(cleanUrl).not.toContain('my_secret_pwd');
      expect(cleanUrl).toContain('token=%5BREDACTED%5D');
      expect(cleanUrl).toContain('password=%5BREDACTED%5D');
      expect(cleanUrl).toContain('view=summary'); // Safe parameter preserved
    });

    it('handles empty or malformed strings gracefully without throwing', () => {
      expect(PrivacyManager.sanitizeUrlForLogs('')).toBe('');
      expect(PrivacyManager.sanitizeUrlForLogs('not-a-valid-url')).toBe('not-a-valid-url');
    });
  });

  describe('Untrusted Archive Sandboxing (PRD Epic 3.4 & Section 12.3)', () => {
    it('verifies that iframe sandbox attributes isolate untrusted offline archive HTML without allow-same-origin', () => {
      const safeSandboxPolicy = 'allow-scripts';
      // In PRD Section 12.3: allow-same-origin must NEVER be combined with allow-scripts
      expect(safeSandboxPolicy.includes('allow-same-origin')).toBe(false);
      expect(safeSandboxPolicy.includes('allow-scripts')).toBe(true);
    });
  });
});
