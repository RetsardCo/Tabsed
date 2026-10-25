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
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';

    try {
      const parsed = new URL(trimmed);

      // WHATWG URL parser automatically:
      // 1. Lowercases scheme (protocol) and host
      // 2. Removes default ports (80 for http, 443 for https)

      // 3. Strip tracking parameters ONLY when explicitly enabled (FR-061)
      if (options.stripTrackingParams && parsed.search) {
        let hasTracking = false;
        const keysToDelete: string[] = [];
        parsed.searchParams.forEach((_, key) => {
          const lower = key.toLowerCase();
          if (this.TRACKING_PARAMS.has(lower) || lower.startsWith('utm_')) {
            keysToDelete.push(key);
            hasTracking = true;
          }
        });
        if (hasTracking) {
          for (let i = 0; i < keysToDelete.length; i++) {
            parsed.searchParams.delete(keysToDelete[i]);
          }
        }
      }

      // 4. Fragment handling: preserved by default unless options specify otherwise (FR-062)
      if (options.preserveFragment === false && parsed.hash) {
        parsed.hash = '';
      }

      // 5. Trim trailing slash from sub-paths or root path if configured
      if (options.trimTrailingSlash) {
        if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
          parsed.pathname = parsed.pathname.replace(/\/+$/, '');
        }
      }

      let result = parsed.href;

      if (options.trimTrailingSlash && parsed.pathname === '/' && !parsed.search && !parsed.hash) {
        result = result.slice(0, -1);
      }

      return result;
    } catch {
      // Return trimmed raw URL if parsing fails
      return trimmed.toLowerCase();
    }
  }

  /**
   * Group items by normalized URL (PRD FR-060 & FR-063)
   */
  public static findDuplicates<T extends { url: string }>(
    items: T[],
    options: NormalizationOptions = {}
  ): DuplicateGroup<T>[] {
    const hasCustomOptions = !!(
      options.stripTrackingParams ||
      options.preserveFragment === false ||
      options.trimTrailingSlash
    );

    const map = new Map<string, T | T[]>();
    const len = items.length;

    for (let i = 0; i < len; i++) {
      const item = items[i];
      // Fast path: reuse pre-normalized URL if available and standard conservative normalization is used
      const norm = (!hasCustomOptions && (item as any).normalizedUrl)
        ? (item as any).normalizedUrl
        : this.normalize(item.url, options);

      if (!norm) continue;

      const existing = map.get(norm);
      if (existing === undefined) {
        map.set(norm, item);
      } else if (Array.isArray(existing)) {
        existing.push(item);
      } else {
        map.set(norm, [existing, item]);
      }
    }

    const matchingRule = options.stripTrackingParams
      ? 'Scheme/host lowercase + default port removal + tracking query stripped'
      : 'Conservative scheme/host lowercase + default port removal (query & fragment preserved)';

    const groups: DuplicateGroup<T>[] = [];
    for (const [norm, groupItems] of map.entries()) {
      if (Array.isArray(groupItems)) {
        groups.push({
          normalizedUrl: norm,
          count: groupItems.length,
          matchingRule,
          items: groupItems
        });
      }
    }

    return groups;
  }
}

export const DuplicateDetector = UrlNormalizer;
