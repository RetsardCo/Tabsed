/**
 * Tabsed Duplicate Detection and Conservative URL Normalizer
 * Aligned with Tabsed PRD FR-060 through FR-065 and Epic 2.2
 */

export interface NormalizationOptions {
  stripTrackingParams?: boolean;
  preserveFragment?: boolean;
  trimTrailingSlash?: boolean;
}

export interface DuplicateGroup<T> {
  normalizedUrl: string;
  count: number;
  matchingRule: string;
  items: T[];
}

export class UrlNormalizer {
  private static readonly TRACKING_PARAMS = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fbclid',
    'gclid',
    'msclkid',
    'mc_cid',
    'mc_eid'
  ]);

  /**
   * Normalize a URL conservatively (PRD FR-061 & FR-062)
   */
  public static normalize(rawUrl: string, options: NormalizationOptions = {}): string {
    if (!rawUrl || typeof rawUrl !== 'string') return '';

    try {
      const parsed = new URL(rawUrl.trim());

      // 1. Lowercase scheme and hostname
      parsed.protocol = parsed.protocol.toLowerCase();
      parsed.hostname = parsed.hostname.toLowerCase();

      // 2. Remove default ports (80 for http, 443 for https)
      if ((parsed.protocol === 'http:' && parsed.port === '80') ||
          (parsed.protocol === 'https:' && parsed.port === '443')) {
        parsed.port = '';
      }

      // 3. Strip tracking parameters ONLY when explicitly enabled (FR-061)
      if (options.stripTrackingParams) {
        const keysToDelete: string[] = [];
        parsed.searchParams.forEach((_, key) => {
          if (this.TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(k => parsed.searchParams.delete(k));
      }

      // 4. Fragment handling: preserved by default unless options specify otherwise (FR-062)
      if (options.preserveFragment === false) {
        parsed.hash = '';
      }

      let result = parsed.toString();

      // 5. Trim trailing slash from root path if configured
      if (options.trimTrailingSlash && parsed.pathname === '/' && !parsed.search && !parsed.hash) {
        result = result.slice(0, -1);
      }

      return result;
    } catch {
      // Return trimmed raw URL if parsing fails
      return rawUrl.trim().toLowerCase();
    }
  }

  /**
   * Group items by normalized URL (PRD FR-060 & FR-063)
   */
  public static findDuplicates<T extends { url: string }>(
    items: T[],
    options: NormalizationOptions = {}
  ): DuplicateGroup<T>[] {
    const map = new Map<string, T[]>();

    for (const item of items) {
      const norm = this.normalize(item.url, options);
      if (!map.has(norm)) {
        map.set(norm, []);
      }
      map.get(norm)!.push(item);
    }

    const groups: DuplicateGroup<T>[] = [];
    for (const [norm, groupItems] of map.entries()) {
      if (groupItems.length > 1) {
        groups.push({
          normalizedUrl: norm,
          count: groupItems.length,
          matchingRule: options.stripTrackingParams
            ? 'Scheme/host lowercase + default port removal + tracking query stripped'
            : 'Conservative scheme/host lowercase + default port removal (query & fragment preserved)',
          items: groupItems
        });
      }
    }

    return groups;
  }
}
