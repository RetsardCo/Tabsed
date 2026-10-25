import { describe, it, expect } from 'vitest';
import { UrlNormalizer } from '../src/core/transaction/duplicate-detector';

describe('UrlNormalizer', () => {
  it('lowercases scheme and host and removes default ports', () => {
    const raw = 'HTTPS://EXAMPLE.COM:443/docs/intro';
    const norm = UrlNormalizer.normalize(raw);
    expect(norm).toBe('https://example.com/docs/intro');
  });

  it('preserves query parameters and fragments by default (FR-062)', () => {
    const raw = 'https://example.com/search?q=tabsed&sort=asc#results';
    const norm = UrlNormalizer.normalize(raw);
    expect(norm).toBe('https://example.com/search?q=tabsed&sort=asc#results');
  });

  it('strips tracking parameters when stripTrackingParams option is true (FR-061)', () => {
    const raw = 'https://example.com/article?id=123&utm_source=twitter&utm_medium=social&fbclid=XYZ123#header';
    const norm = UrlNormalizer.normalize(raw, { stripTrackingParams: true });
    expect(norm).toBe('https://example.com/article?id=123#header');
  });

  it('identifies duplicate groups across items', () => {
    const items = [
      { id: 1, url: 'https://github.com/tauri-apps/tauri' },
      { id: 2, url: 'HTTPS://GITHUB.COM:443/tauri-apps/tauri' },
      { id: 3, url: 'https://github.com/tauri-apps/tauri?utm_source=promo' },
      { id: 4, url: 'https://vitest.dev/' }
    ];

    // Under default conservative rules, items 1 and 2 match
    const duplicatesDefault = UrlNormalizer.findDuplicates(items);
    expect(duplicatesDefault.length).toBe(1);
    expect(duplicatesDefault[0].items.length).toBe(2);
    expect(duplicatesDefault[0].items.map(i => i.id)).toEqual([1, 2]);

    // When tracking params are stripped, items 1, 2, and 3 match
    const duplicatesStripped = UrlNormalizer.findDuplicates(items, { stripTrackingParams: true });
    expect(duplicatesStripped.length).toBe(1);
    expect(duplicatesStripped[0].items.length).toBe(3);
  });

  it('correctly trims trailing slashes on sub-paths and root paths when configured', () => {
    const subPathWithSlash = 'https://example.com/docs/';
    const subPathWithoutSlash = 'https://example.com/docs';
    expect(UrlNormalizer.normalize(subPathWithSlash, { trimTrailingSlash: true })).toBe('https://example.com/docs');
    expect(UrlNormalizer.normalize(subPathWithoutSlash, { trimTrailingSlash: true })).toBe('https://example.com/docs');

    const rootWithSlash = 'https://example.com/';
    expect(UrlNormalizer.normalize(rootWithSlash, { trimTrailingSlash: true })).toBe('https://example.com');

    // Matching as duplicates
    const dups = UrlNormalizer.findDuplicates(
      [{ url: subPathWithSlash }, { url: subPathWithoutSlash }],
      { trimTrailingSlash: true }
    );
    expect(dups.length).toBe(1);
    expect(dups[0].items.length).toBe(2);
  });

  it('safely ignores empty, null, or whitespace URLs and does not treat them as duplicates', () => {
    const items = [
      { id: 1, url: '' },
      { id: 2, url: '   ' },
      { id: 3, url: 'https://example.com' },
      { id: 4, url: (null as unknown as string) }
    ];
    const dups = UrlNormalizer.findDuplicates(items);
    expect(dups.length).toBe(0);
  });

  it('correctly handles IPv6 host literals and default port stripping', () => {
    const raw1 = 'http://[::1]:80/dashboard';
    const raw2 = 'http://[::1]/dashboard';
    expect(UrlNormalizer.normalize(raw1)).toBe('http://[::1]/dashboard');
    expect(UrlNormalizer.normalize(raw2)).toBe('http://[::1]/dashboard');

    const dups = UrlNormalizer.findDuplicates([{ id: 1, url: raw1 }, { id: 2, url: raw2 }]);
    expect(dups.length).toBe(1);
    expect(dups[0].items.length).toBe(2);
  });

  it('handles IDN/Punycode domains and uppercase tracking parameters', () => {
    const raw1 = 'https://MÜNCHEN.DE/events?UTM_SOURCE=newsletter&topic=art';
    const raw2 = 'https://xn--mnchen-3ya.de/events?topic=art';
    const norm1 = UrlNormalizer.normalize(raw1, { stripTrackingParams: true });
    const norm2 = UrlNormalizer.normalize(raw2);

    expect(norm1).toBe(norm2);
    const dups = UrlNormalizer.findDuplicates(
      [{ id: 1, url: raw1 }, { id: 2, url: raw2 }],
      { stripTrackingParams: true }
    );
    expect(dups.length).toBe(1);
  });
});
