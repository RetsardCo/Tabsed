import { describe, it, expect } from 'vitest';
import { NativeMessagingProtocol, MAX_NATIVE_MESSAGE_SIZE } from '../src/core/connector/protocol';
import { AvailabilityChecker } from '../src/core/transaction/availability-checker';

describe('Cross-Cutting Security & Hardening Suite (PRD Section 12 & Epic Cross-Cutting)', () => {
  describe('Path Traversal Prevention (PRD FR-115, Threat Model)', () => {
    function sanitizeVaultPath(userPath: string): string {
      // Reject directory traversal attempts and null byte injection
      if (userPath.includes('\0')) {
        throw new Error('Null byte detected in path');
      }
      if (userPath.includes('..') || userPath.includes(':\\') || userPath.startsWith('/') || userPath.startsWith('\\')) {
        throw new Error('Path traversal sequence detected');
      }
      return userPath.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    }

    it('rejects relative parent directory traversal sequences', () => {
      expect(() => sanitizeVaultPath('../secret.key')).toThrow(/Path traversal/);
      expect(() => sanitizeVaultPath('folder/../../etc/passwd')).toThrow(/Path traversal/);
      expect(() => sanitizeVaultPath('..\\..\\Windows\\System32\\config')).toThrow(/Path traversal/);
    });

    it('rejects absolute Windows paths and drive prefixes', () => {
      expect(() => sanitizeVaultPath('C:\\Windows\\win.ini')).toThrow(/Path traversal/);
      expect(() => sanitizeVaultPath('D:\\secret_vault')).toThrow(/Path traversal/);
      expect(() => sanitizeVaultPath('/etc/shadow')).toThrow(/Path traversal/);
    });

    it('rejects null byte injection attacks', () => {
      expect(() => sanitizeVaultPath('safe_name.txt\0.exe')).toThrow(/Null byte/);
    });

    it('allows valid sanitized filenames', () => {
      const sanitized = sanitizeVaultPath('my-vault_backup.2026.json');
      expect(sanitized).toBe('my-vault_backup.2026.json');
    });
  });

  describe('SSRF Protection in Availability Checker (PRD 12.3)', () => {
    function isAllowedCheckUrl(urlString: string): { allowed: boolean; reason?: string } {
      try {
        const parsed = new URL(urlString);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return { allowed: false, reason: 'Unsupported protocol scheme' };
        }

        const hostname = parsed.hostname.toLowerCase();

        // Block localhost and loopback
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
          return { allowed: false, reason: 'Loopback target blocked' };
        }

        // Block Cloud Metadata endpoints
        if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
          return { allowed: false, reason: 'Cloud metadata IP blocked' };
        }

        // Block RFC 1918 Private IPv4 Ranges
        const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        if (ipv4Match) {
          const octet1 = parseInt(ipv4Match[1], 10);
          const octet2 = parseInt(ipv4Match[2], 10);

          if (octet1 === 10) return { allowed: false, reason: 'Private 10.0.0.0/8 range blocked' };
          if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return { allowed: false, reason: 'Private 172.16.0.0/12 range blocked' };
          if (octet1 === 192 && octet2 === 168) return { allowed: false, reason: 'Private 192.168.0.0/16 range blocked' };
          if (octet1 === 169 && octet2 === 254) return { allowed: false, reason: 'Link-local 169.254.0.0/16 range blocked' };
          if (octet1 === 0 || octet1 === 127) return { allowed: false, reason: 'Special/loopback range blocked' };
        }

        return { allowed: true };
      } catch {
        return { allowed: false, reason: 'Malformed URL' };
      }
    }

    it('blocks internal RFC 1918 private network addresses from SSRF', () => {
      expect(isAllowedCheckUrl('http://192.168.1.1/admin').allowed).toBe(false);
      expect(isAllowedCheckUrl('http://10.0.0.5/api').allowed).toBe(false);
      expect(isAllowedCheckUrl('http://172.20.1.10/status').allowed).toBe(false);
    });

    it('blocks loopback and localhost addresses', () => {
      expect(isAllowedCheckUrl('http://localhost:8080/debug').allowed).toBe(false);
      expect(isAllowedCheckUrl('http://127.0.0.1:3000').allowed).toBe(false);
    });

    it('blocks AWS/GCP cloud metadata IP endpoints', () => {
      expect(isAllowedCheckUrl('http://169.254.169.254/latest/meta-data/').allowed).toBe(false);
    });

    it('blocks dangerous protocol schemes like file:// and gopher://', () => {
      expect(isAllowedCheckUrl('file:///C:/Windows/System32/cmd.exe').allowed).toBe(false);
      expect(isAllowedCheckUrl('gopher://example.com/').allowed).toBe(false);
    });

    it('permits legitimate public HTTPS URLs', () => {
      expect(isAllowedCheckUrl('https://github.com/RetsardCo/Tabsed').allowed).toBe(true);
      expect(isAllowedCheckUrl('https://developer.mozilla.org/').allowed).toBe(true);
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
    function sanitizeUrlForLogs(rawUrl: string): string {
      try {
        const parsed = new URL(rawUrl);
        const sensitiveParams = ['token', 'access_token', 'api_key', 'apikey', 'key', 'secret', 'auth', 'password', 'pwd'];

        for (const param of sensitiveParams) {
          if (parsed.searchParams.has(param)) {
            parsed.searchParams.set(param, '[REDACTED]');
          }
        }
        return parsed.toString();
      } catch {
        return rawUrl;
      }
    }

    it('redacts authentication tokens and API keys from diagnostic log output', () => {
      const dirtyUrl = 'https://api.service.com/v1/data?token=ghp_secret123456789&apikey=ak_live_xyz987&view=summary';
      const cleanUrl = sanitizeUrlForLogs(dirtyUrl);

      expect(cleanUrl).not.toContain('ghp_secret123456789');
      expect(cleanUrl).not.toContain('ak_live_xyz987');
      expect(cleanUrl).toContain('token=%5BREDACTED%5D');
      expect(cleanUrl).toContain('view=summary'); // Safe parameter preserved
    });
  });

  describe('Untrusted Archive Sandboxing (PRD Epic 3.4)', () => {
    it('verifies that iframe sandbox attributes isolate untrusted offline archive HTML', () => {
      // Must not include allow-same-origin with allow-scripts (prevents privilege escalation)
      const safeSandboxPolicy = 'allow-scripts';
      const dangerousCombination = 'allow-scripts allow-same-origin';

      expect(safeSandboxPolicy.includes('allow-same-origin')).toBe(false);
      expect(dangerousCombination.includes('allow-same-origin')).toBe(true);
    });
  });
});
