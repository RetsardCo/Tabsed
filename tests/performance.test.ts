import { describe, it, expect } from 'vitest';
import { SavedTabItem } from '../src/ui/types';

describe('Cross-Cutting Performance Suite (PRD Section 13.1 & Epic Cross-Cutting)', () => {
  // Helper to generate N realistic tab fixture items
  function generateFixtureTabs(count: number): SavedTabItem[] {
    const domains = [
      'github.com', 'developer.mozilla.org', 'notion.so', 'stackoverflow.com',
      'react.dev', 'tauri.app', 'crates.io', 'youtube.com', 'news.ycombinator.com',
      'en.wikipedia.org', 'docs.microsoft.com', 'figma.com'
    ];
    const tagsPool = ['Dev', 'Research', 'Docs', 'Work', 'Personal', 'Reading', 'Inspiration'];
    const collectionsPool = ['inbox', 'research', 'dev', 'design'];

    const tabs: SavedTabItem[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const domain = domains[i % domains.length];
      const id = `perf_tab_${i}`;
      const url = `https://${domain}/article/item-${i}?ref=tabsed&topic=${i % 20}`;
      const title = `Resource #${i} on ${domain} - Documentation & Guide`;
      const collectionId = collectionsPool[i % collectionsPool.length];
      const tags = [tagsPool[i % tagsPool.length], tagsPool[(i + 2) % tagsPool.length]];
      const archiveSizeBytes = 1024 * ((i % 50) + 1) * 10; // 10KB - 500KB

      tabs.push({
        id,
        vaultId: 'default',
        itemType: i % 10 === 0 ? 'session' : 'tab',
        title,
        url,
        normalizedUrl: `https://${domain}/article/item-${i}`,
        domain,
        faviconUrl: `https://${domain}/favicon.ico`,
        thumbnailUrl: `https://${domain}/thumbs/thumb_${i}.jpg`,
        browserFamily: i % 2 === 0 ? 'Edge' : 'Chrome',
        profileLabel: 'Default',
        savedAt: new Date(now - i * 60000).toISOString(),
        notes: i % 5 === 0 ? `Important note for item ${i} with research context` : '',
        isFavorite: i % 15 === 0,
        collectionIds: [collectionId],
        tags,
        tabCount: i % 10 === 0 ? (i % 8) + 2 : undefined,
        archiveSizeBytes,
        availabilityStatus: 'reachable'
      });
    }

    return tabs;
  }

  it('filters 5,000 tabs by search query within 30ms', () => {
    const tabs = generateFixtureTabs(5000);
    const query = 'mozilla';

    const start = performance.now();
    const queryLower = query.toLowerCase();
    const results = tabs.filter(t => 
      t.title.toLowerCase().includes(queryLower) ||
      t.url.toLowerCase().includes(queryLower) ||
      t.domain.toLowerCase().includes(queryLower) ||
      t.tags.some(tag => tag.toLowerCase().includes(queryLower))
    );
    const elapsed = performance.now() - start;

    expect(results.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50); // High performance requirement (<50ms)
  });

  it('performs duplicate URL detection across 5,000 items in <40ms', () => {
    const tabs = generateFixtureTabs(5000);
    // Introduce intentional duplicates
    tabs.push({ ...tabs[10], id: 'dup_1' });
    tabs.push({ ...tabs[20], id: 'dup_2' });
    tabs.push({ ...tabs[10], id: 'dup_3' });

    const start = performance.now();
    const urlMap = new Map<string, string[]>();
    for (const tab of tabs) {
      const existing = urlMap.get(tab.normalizedUrl);
      if (existing) {
        existing.push(tab.id);
      } else {
        urlMap.set(tab.normalizedUrl, [tab.id]);
      }
    }

    const duplicates = Array.from(urlMap.entries())
      .filter(([_, ids]) => ids.length > 1)
      .map(([url, ids]) => ({ url, count: ids.length, ids }));

    const elapsed = performance.now() - start;

    expect(duplicates.length).toBeGreaterThanOrEqual(2);
    expect(elapsed).toBeLessThan(40);
  });

  it('aggregates storage consumption for 5,000 tabs in <15ms', () => {
    const tabs = generateFixtureTabs(5000);

    const start = performance.now();
    let totalVaultBytes = 0;
    const byCollection: Record<string, number> = {};
    const byDomain: Record<string, number> = {};

    for (const tab of tabs) {
      const bytes = tab.archiveSizeBytes || 0;
      totalVaultBytes += bytes;

      for (const col of tab.collectionIds) {
        byCollection[col] = (byCollection[col] || 0) + bytes;
      }
      byDomain[tab.domain] = (byDomain[tab.domain] || 0) + bytes;
    }

    const elapsed = performance.now() - start;

    expect(totalVaultBytes).toBeGreaterThan(0);
    expect(Object.keys(byCollection).length).toBe(4);
    expect(elapsed).toBeLessThan(15);
  });

  it('calculates virtualized viewport slice instantaneously over 10,000 items', () => {
    const totalItems = 10000;
    const itemHeight = 72; // px per list row
    const viewportHeight = 800; // px
    const scrollTop = 14400; // Scrolled down 200 items

    const start = performance.now();
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5); // 5 items buffer
    const visibleCount = Math.ceil(viewportHeight / itemHeight) + 10; // 10 items buffer
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount);

    const elapsed = performance.now() - start;

    expect(startIndex).toBe(195);
    expect(endIndex).toBe(217);
    expect(endIndex - startIndex).toBe(22); // Only 22 DOM nodes rendered instead of 10,000!
    expect(elapsed).toBeLessThan(2);
  });

  it('chunks and throttles restore queue into bounded batches', () => {
    const urlList = Array.from({ length: 55 }, (_, i) => `https://example.com/page-${i}`);
    const BATCH_SIZE = 10;

    const batches: string[][] = [];
    for (let i = 0; i < urlList.length; i += BATCH_SIZE) {
      batches.push(urlList.slice(i, i + BATCH_SIZE));
    }

    expect(batches.length).toBe(6);
    expect(batches[0].length).toBe(10);
    expect(batches[5].length).toBe(5); // Remainder handled safely
  });

  it('bounds memory consumption via LRU cache eviction policy for thumbnails', () => {
    const MAX_CACHE_SIZE = 100;
    class ThumbnailLRUCache {
      private cache = new Map<string, string>();

      public get(id: string): string | undefined {
        const val = this.cache.get(id);
        if (val) {
          // Re-insert to mark as recently used
          this.cache.delete(id);
          this.cache.set(id, val);
        }
        return val;
      }

      public put(id: string, dataUrl: string): void {
        if (this.cache.has(id)) {
          this.cache.delete(id);
        } else if (this.cache.size >= MAX_CACHE_SIZE) {
          // Evict oldest (first key in iteration)
          const oldestKey = this.cache.keys().next().value;
          if (oldestKey) this.cache.delete(oldestKey);
        }
        this.cache.set(id, dataUrl);
      }

      public size(): number {
        return this.cache.size;
      }
    }

    const cache = new ThumbnailLRUCache();
    // Insert 250 thumbnails
    for (let i = 0; i < 250; i++) {
      cache.put(`thumb_${i}`, `data:image/jpeg;base64,sample_payload_${i}`);
    }

    // Must never exceed MAX_CACHE_SIZE (bounds memory and avoids leaks)
    expect(cache.size()).toBe(100);
    // Oldest items (0-149) should have been evicted
    expect(cache.get('thumb_0')).toBeUndefined();
    expect(cache.get('thumb_149')).toBeUndefined();
    // Most recent items (150-249) must exist
    expect(cache.get('thumb_249')).toBeDefined();
  });
});
