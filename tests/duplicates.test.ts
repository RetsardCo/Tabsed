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
});
