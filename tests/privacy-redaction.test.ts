import { describe, it, expect } from 'vitest';
import {
  PrivacyManager,
  DEFAULT_REDACTION_RULES,
  DEFAULT_PRIVATE_VAULT_CONFIG
} from '../src/core/vault/privacy-manager';
import { DomainRedactionRule, PrivateVaultConfig, SavedTabItem } from '../src/ui/types';

describe('Epic 4.3 --- Preview Redaction & Private Vault', () => {
  describe('Sensitive Domain Matching Rules', () => {
    it('matches wildcard and subdomain patterns', () => {
      expect(PrivacyManager.matchesDomainPattern('login.chase.com', '*.chase.com')).toBe(true);
      expect(PrivacyManager.matchesDomainPattern('secure.bankofamerica.com', '*bank*.*')).toBe(true);
      expect(PrivacyManager.matchesDomainPattern('myhealth.hospital.org', '*health*.*')).toBe(true);
      expect(PrivacyManager.matchesDomainPattern('wiki.internal', '*.internal')).toBe(true);
    });

    it('does not match non-sensitive domains', () => {
      expect(PrivacyManager.matchesDomainPattern('github.com', '*.chase.com')).toBe(false);
      expect(PrivacyManager.matchesDomainPattern('news.ycombinator.com', '*bank*.*')).toBe(false);
    });

    it('correctly finds matching redaction rule for a URL', () => {
      const rule = PrivacyManager.getMatchingRule('https://secure.chase.com/my-accounts', DEFAULT_REDACTION_RULES);
      expect(rule).not.toBeNull();
      expect(rule?.category).toBe('banking');
    });
  });

  describe('Thumbnail Redaction Before Persistence (PRD FR-125 & Epic 4.3)', () => {
    it('replaces thumbnail with redacted SVG placeholder for sensitive banking URLs', () => {
      const originalThumbnail = 'https://example.com/sensitive_snapshot.jpg';
      const bankingUrl = 'https://www.chase.com/portal/dashboard';

      const res = PrivacyManager.processThumbnailBeforePersistence(
        bankingUrl,
        originalThumbnail,
        DEFAULT_REDACTION_RULES
      );

      expect(res.isRedacted).toBe(true);
      expect(typeof res.result).toBe('string');
      expect(res.result).toContain('data:image/svg+xml');
      expect(res.result).toContain('PREVIEW REDACTED');
      expect(res.result).toContain('chase.com');
    });

    it('strips thumbnail completely when rule mode is "strip"', () => {
      const customRules: DomainRedactionRule[] = [
        {
          id: 'rule_strip_patient',
          pattern: '*.patientportal.com',
          mode: 'strip',
          enabled: true
        }
      ];

      const res = PrivacyManager.processThumbnailBeforePersistence(
        'https://app.patientportal.com/records',
        'raw_image_data',
        customRules
      );

      expect(res.isRedacted).toBe(true);
      expect(res.result).toBeNull();
    });

    it('leaves thumbnails untouched for non-sensitive public domains', () => {
      const publicUrl = 'https://developer.mozilla.org/en-US/docs/Web/API';
      const originalThumbnail = 'https://images.example.com/mdn.png';

      const res = PrivacyManager.processThumbnailBeforePersistence(
        publicUrl,
        originalThumbnail,
        DEFAULT_REDACTION_RULES
      );

      expect(res.isRedacted).toBe(false);
      expect(res.result).toBe(originalThumbnail);
    });
  });

  describe('Notification Title Redaction (PRD FR-126)', () => {
    it('masks page titles from sensitive domains in notifications', () => {
      const sensitiveTitle = 'Account #4321-9876 Balance: $12,450.00 — Chase';
      const sensitiveUrl = 'https://secure.chase.com/statement';

      const redactedTitle = PrivacyManager.redactForNotification(
        sensitiveTitle,
        sensitiveUrl,
        DEFAULT_REDACTION_RULES
      );

      expect(redactedTitle).toBe('[Sensitive Page — secure.chase.com]');
      expect(redactedTitle).not.toContain('$12,450.00');
    });

    it('preserves public page titles in notifications', () => {
      const publicTitle = 'Vite Guide — Getting Started';
      const publicUrl = 'https://vitejs.dev/guide/';

      const result = PrivacyManager.redactForNotification(publicTitle, publicUrl, DEFAULT_REDACTION_RULES);
      expect(result).toBe(publicTitle);
    });
  });

  describe('Private Tab Opt-In Enforcement (PRD FR-121 & FR-122)', () => {
    it('rejects capture of private/incognito tabs by default', () => {
      expect(() => {
        PrivacyManager.validatePrivateTabCapture(true, DEFAULT_PRIVATE_VAULT_CONFIG);
      }).toThrow(/Private tab capture is disabled by default/);
    });

    it('allows capture when user explicitly opts in via settings', () => {
      const optInConfig: PrivateVaultConfig = {
        ...DEFAULT_PRIVATE_VAULT_CONFIG,
        allowPrivateTabCapture: true
      };

      expect(PrivacyManager.validatePrivateTabCapture(true, optInConfig)).toBe(true);
    });

    it('always permits normal non-private tabs', () => {
      expect(PrivacyManager.validatePrivateTabCapture(false, DEFAULT_PRIVATE_VAULT_CONFIG)).toBe(true);
    });
  });

  describe('Private Tab Purge Routines (PRD Epic 4.3 & FR-128)', () => {
    const mockItemsWithPrivate: SavedTabItem[] = [
      {
        id: 'tab_public_1',
        vaultId: 'v1',
        itemType: 'tab',
        title: 'Public News',
        url: 'https://news.ycombinator.com',
        normalizedUrl: 'https://news.ycombinator.com',
        domain: 'ycombinator.com',
        savedAt: new Date().toISOString(),
        notes: '',
        isFavorite: false,
        collectionIds: [],
        tags: [],
        browserFamily: 'Chrome',
        isPrivate: false
      },
      {
        id: 'tab_private_1',
        vaultId: 'v1',
        itemType: 'tab',
        title: 'Confidential Healthcare Portal',
        url: 'https://health.example.com',
        normalizedUrl: 'https://health.example.com',
        domain: 'example.com',
        savedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48h ago
        notes: 'Confidential',
        isFavorite: false,
        collectionIds: [],
        tags: [],
        browserFamily: 'Chrome',
        isPrivate: true,
        thumbnailUrl: 'thumbnails/private_thumb.png'
      }
    ];

    it('purges private tabs under session_only retention policy', () => {
      const deletedFiles: string[] = [];
      const mockFileDeleter = (p: string) => { deletedFiles.push(p); };

      const res = PrivacyManager.purgePrivateTabs(
        mockItemsWithPrivate,
        { ...DEFAULT_PRIVATE_VAULT_CONFIG, retentionPolicy: 'session_only' },
        '/mock/vault',
        mockFileDeleter
      );

      expect(res.purgedCount).toBe(1);
      expect(res.purgedIds).toContain('tab_private_1');
      expect(res.remainingItems.length).toBe(1);
      expect(res.remainingItems[0].id).toBe('tab_public_1');

      // Verify associated files were unlinked
      expect(deletedFiles.some(f => f.includes('private_thumb.png'))).toBe(true);
    });

    it('excludes private tabs from search indexing when excludeFromSearchIndex is enabled', () => {
      const privateItem = mockItemsWithPrivate[1];
      const publicItem = mockItemsWithPrivate[0];

      expect(PrivacyManager.shouldIndexItem(privateItem, DEFAULT_PRIVATE_VAULT_CONFIG)).toBe(false);
      expect(PrivacyManager.shouldIndexItem(publicItem, DEFAULT_PRIVATE_VAULT_CONFIG)).toBe(true);
    });
  });
});
