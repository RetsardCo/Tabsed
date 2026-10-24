import { DomainRedactionRule, PrivateVaultConfig, SavedTabItem } from '../../ui/types';

export const DEFAULT_REDACTION_RULES: DomainRedactionRule[] = [
  {
    id: 'rule_banking_default',
    pattern: '*bank*.*',
    mode: 'placeholder',
    enabled: true,
    category: 'banking',
    description: 'Mask previews for online banking portals'
  },
  {
    id: 'rule_chase',
    pattern: '*.chase.com',
    mode: 'placeholder',
    enabled: true,
    category: 'banking',
    description: 'Mask Chase banking portals'
  },
  {
    id: 'rule_paypal',
    pattern: '*.paypal.com',
    mode: 'placeholder',
    enabled: true,
    category: 'banking',
    description: 'Mask PayPal payments and checkout'
  },
  {
    id: 'rule_health',
    pattern: '*health*.*',
    mode: 'placeholder',
    enabled: true,
    category: 'health',
    description: 'Mask patient portal and health records'
  },
  {
    id: 'rule_internal',
    pattern: '*.internal',
    mode: 'blur',
    enabled: true,
    category: 'internal',
    description: 'Mask corporate internal intranet domains'
  }
];

export const DEFAULT_PRIVATE_VAULT_CONFIG: PrivateVaultConfig = {
  allowPrivateTabCapture: false, // OFF by default (PRD FR-121)
  retentionPolicy: 'session_only',
  maxAgeHours: 24,
  excludeFromSearchIndex: true,
  redactPreviews: true
};

export class PrivacyManager {
  /**
   * Matches a domain against wildcard patterns (e.g. '*.chase.com', '*bank*.*')
   */
  public static matchesDomainPattern(domain: string, pattern: string): boolean {
    if (!domain || !pattern) return false;
    // Strip optional port from domain
    const cleanDomain = domain.toLowerCase().trim().split(':')[0];
    const cleanPattern = pattern.toLowerCase().trim();

    if (cleanPattern === '*' || cleanPattern === '*.*') return true;
    if (cleanDomain === cleanPattern) return true;

    // If pattern starts with '*.' (e.g. '*.chase.com'), also match the root domain (e.g. 'chase.com')
    if (cleanPattern.startsWith('*.')) {
      const rootDomain = cleanPattern.substring(2);
      if (cleanDomain === rootDomain) return true;
    }

    // Convert glob pattern to regular expression
    const escaped = cleanPattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${escaped}$`, 'i');

    return regex.test(cleanDomain);
  }

  /**
   * Finds the first matching active redaction rule for a given URL
   */
  public static getMatchingRule(url: string, rules: DomainRedactionRule[] = DEFAULT_REDACTION_RULES): DomainRedactionRule | null {
    if (!url) return null;

    let domain = '';
    try {
      const parsed = new URL(url.includes('://') ? url : `https://${url}`);
      domain = parsed.hostname;
    } catch {
      domain = (url.split('/')[0] || '').split(':')[0].trim();
    }

    for (const rule of rules) {
      if (rule.enabled && this.matchesDomainPattern(domain, rule.pattern)) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Standard redacted SVG placeholder for thumbnails
   */
  public static getPlaceholderThumbnailSvg(domain: string): string {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%231e293b"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14" font-weight="600">PREVIEW REDACTED</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="11">Sensitive Domain: ${domain}</text></svg>`;
  }

  /**
   * Redacts/masks thumbnail before persistence (PRD Epic 4.3 & FR-125)
   */
  public static processThumbnailBeforePersistence(
    url: string,
    thumbnail: Buffer | string | null,
    rules: DomainRedactionRule[] = DEFAULT_REDACTION_RULES
  ): { result: Buffer | string | null; isRedacted: boolean; appliedRule?: DomainRedactionRule } {
    const matchingRule = this.getMatchingRule(url, rules);
    if (!matchingRule) {
      return { result: thumbnail, isRedacted: false };
    }

    let domain = '';
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = 'sensitive-domain';
    }

    if (matchingRule.mode === 'strip') {
      return { result: null, isRedacted: true, appliedRule: matchingRule };
    }

    if (matchingRule.mode === 'placeholder' || matchingRule.mode === 'blur') {
      const placeholder = this.getPlaceholderThumbnailSvg(domain);
      return { result: placeholder, isRedacted: true, appliedRule: matchingRule };
    }

    return { result: thumbnail, isRedacted: false };
  }

  /**
   * Masks sensitive page titles for OS notifications (PRD FR-126)
   */
  public static redactForNotification(
    title: string,
    url: string,
    rules: DomainRedactionRule[] = DEFAULT_REDACTION_RULES
  ): string {
    const matchingRule = this.getMatchingRule(url, rules);
    if (!matchingRule) {
      return title;
    }

    let domain = '';
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = 'domain';
    }

    return `[Sensitive Page — ${domain}]`;
  }

  /**
   * Enforces private tab opt-in policy (PRD FR-121 & FR-122)
   */
  public static validatePrivateTabCapture(isPrivate: boolean, config: PrivateVaultConfig = DEFAULT_PRIVATE_VAULT_CONFIG): boolean {
    if (isPrivate && !config.allowPrivateTabCapture) {
      throw new Error(
        'Private tab capture is disabled by default. Enable it in Settings to capture private or incognito tabs.'
      );
    }
    return true;
  }

  /**
   * Purges private tab records and removes sensitive associated files from disk (PRD Epic 4.3 & FR-128)
   */
  public static purgePrivateTabs(
    items: SavedTabItem[],
    config: PrivateVaultConfig = DEFAULT_PRIVATE_VAULT_CONFIG,
    vaultRootPath?: string,
    fileDeleter?: (filePath: string) => void
  ): { remainingItems: SavedTabItem[]; purgedCount: number; purgedIds: string[] } {
    const now = Date.now();
    const purgedIds: string[] = [];

    const remainingItems = items.filter(item => {
      if (!item.isPrivate) {
        return true;
      }

      let shouldPurge = false;

      if (config.retentionPolicy === 'session_only') {
        shouldPurge = true;
      } else if (config.retentionPolicy === 'max_age_hours') {
        const itemSavedAt = new Date(item.savedAt).getTime();
        const maxAgeMs = config.maxAgeHours * 60 * 60 * 1000;
        if (now - itemSavedAt >= maxAgeMs) {
          shouldPurge = true;
        }
      }

      if (shouldPurge) {
        purgedIds.push(item.id);

        // Secure file deletion from disk via fileDeleter callback or fs.unlinkSync
        // Secure file deletion from disk via fileDeleter callback
        if (vaultRootPath && fileDeleter) {
          const rootClean = vaultRootPath.replace(/[/\\]+$/, '');

          // Check thumbnail file
          if (item.thumbnailUrl && !item.thumbnailUrl.startsWith('data:') && !item.thumbnailUrl.startsWith('http')) {
            const relThumb = item.thumbnailUrl.replace(/^[/\\]+/, '');
            const thumbPath = `${rootClean}/${relThumb}`;
            try {
              fileDeleter(thumbPath);
            } catch {}
          }

          // Check all possible archive file extensions (.json, .html, _content.txt)
          const possibleArchives = [
            `${rootClean}/archives/${item.id}.json`,
            `${rootClean}/archives/${item.id}.html`,
            `${rootClean}/archives/${item.id}_content.txt`
          ];
          for (const archivePath of possibleArchives) {
            try {
              fileDeleter(archivePath);
            } catch {}
          }
        }

        return false; // Remove from items
      }

      return true;
    });

    return {
      remainingItems,
      purgedCount: purgedIds.length,
      purgedIds
    };
  }

  /**
   * Determines if item should be included in full-text search indexing (PRD Epic 4.3)
   */
  public static shouldIndexItem(item: SavedTabItem, config: PrivateVaultConfig = DEFAULT_PRIVATE_VAULT_CONFIG): boolean {
    if (item.isPrivate && config.excludeFromSearchIndex) {
      return false;
    }
    return true;
  }
}
