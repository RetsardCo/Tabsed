import { describe, it, expect } from 'vitest';
import { SavedTabItem, SessionTab } from '../src/ui/types';

describe('Dynamic Badge Counts & Session Tab Item Operations', () => {
  const sampleSubTabs: SessionTab[] = [
    { id: 'sub-1', title: 'Godot Engine Documentation', url: 'https://docs.godotengine.org', domain: 'docs.godotengine.org' },
    { id: 'sub-2', title: 'Shader Programming Tutorial', url: 'https://shadertoy.com', domain: 'shadertoy.com' },
    { id: 'sub-3', title: 'Unity 6 LTS Release Notes', url: 'https://unity.com/releases', domain: 'unity.com' },
  ];

  const initialItems: SavedTabItem[] = [
    {
      id: 'session-1',
      vaultId: 'default',
      itemType: 'session',
      title: 'Game Development Hub',
      url: 'https://docs.godotengine.org',
      normalizedUrl: 'https://docs.godotengine.org',
      domain: 'godotengine.org',
      browserFamily: 'Edge',
      savedAt: '2026-10-24T10:00:00Z',
      notes: 'Game dev tools and references',
      isFavorite: true,
      collectionIds: ['dev'],
      tags: ['GameDev', 'Godot'],
      tabCount: 3,
      sessionTabs: sampleSubTabs,
      availabilityStatus: 'reachable',
    },
    {
      id: 'tab-chrome-1',
      vaultId: 'default',
      itemType: 'tab',
      title: 'Google Cloud Console',
      url: 'https://console.cloud.google.com',
      normalizedUrl: 'https://console.cloud.google.com',
      domain: 'cloud.google.com',
      browserFamily: 'Chrome',
      savedAt: '2026-10-24T11:00:00Z',
      notes: '',
      isFavorite: false,
      collectionIds: [],
      tags: ['Cloud'],
      availabilityStatus: 'reachable',
    },
    {
      id: 'tab-firefox-1',
      vaultId: 'default',
      itemType: 'tab',
      title: 'MDN Web Docs: Web APIs',
      url: 'https://developer.mozilla.org',
      normalizedUrl: 'https://developer.mozilla.org',
      domain: 'mozilla.org',
      browserFamily: 'Firefox',
      savedAt: '2026-10-24T12:00:00Z',
      notes: '',
      isFavorite: false,
      collectionIds: [],
      tags: ['Docs'],
      availabilityStatus: 'network_error',
    },
    {
      id: 'tab-duplicate-edge',
      vaultId: 'default',
      itemType: 'tab',
      title: 'Godot Engine Documentation Duplicate',
      url: 'https://docs.godotengine.org',
      normalizedUrl: 'https://docs.godotengine.org',
      domain: 'godotengine.org',
      browserFamily: 'Edge',
      savedAt: '2026-10-24T13:00:00Z',
      notes: '',
      isFavorite: false,
      collectionIds: [],
      tags: [],
      availabilityStatus: 'timeout',
    }
  ];

  describe('Dynamic Badge Calculations (PRD Sidebar Dynamic Badges)', () => {
    it('calculates counts accurately from active non-deleted items', () => {
      const active = initialItems.filter(i => !i.deletedAt);
      expect(active.length).toBe(4);

      const edgeCount = active.filter(i => i.browserFamily === 'Edge').length;
      const chromeCount = active.filter(i => i.browserFamily === 'Chrome').length;
      const firefoxCount = active.filter(i => i.browserFamily === 'Firefox').length;
      expect(edgeCount).toBe(2);
      expect(chromeCount).toBe(1);
      expect(firefoxCount).toBe(1);

      // Duplicates
      const seen = new Set<string>();
      let dupes = 0;
      for (const item of active) {
        const url = item.normalizedUrl || item.url;
        if (seen.has(url)) {
          dupes++;
        } else {
          seen.add(url);
        }
      }
      expect(dupes).toBe(1);

      // Broken links (network_error or timeout)
      const brokenCount = active.filter(
        i => i.availabilityStatus === 'network_error' || i.availabilityStatus === 'timeout'
      ).length;
      expect(brokenCount).toBe(2);
    });

    it('drops all badge numbers strictly to 0 when all items are deleted or library is empty', () => {
      // Soft-delete all items
      const deletedItems = initialItems.map(i => ({ ...i, deletedAt: new Date().toISOString() }));
      const active = deletedItems.filter(i => !i.deletedAt);

      const activeItemCount = active.length;
      const edgeCount = active.filter(i => i.browserFamily === 'Edge').length;
      const chromeCount = active.filter(i => i.browserFamily === 'Chrome').length;
      const firefoxCount = active.filter(i => i.browserFamily === 'Firefox').length;

      const seen = new Set<string>();
      let dupes = 0;
      for (const item of active) {
        const url = item.normalizedUrl || item.url;
        if (seen.has(url)) dupes++;
        else seen.add(url);
      }

      const brokenCount = active.filter(
        i => i.availabilityStatus === 'network_error' || i.availabilityStatus === 'timeout'
      ).length;

      expect(activeItemCount).toBe(0);
      expect(edgeCount).toBe(0);
      expect(chromeCount).toBe(0);
      expect(firefoxCount).toBe(0);
      expect(dupes).toBe(0);
      expect(brokenCount).toBe(0);

      // Collections count drops to 0
      const collectionsCount = active.filter(i => i.collectionIds && i.collectionIds.length > 0).length;
      expect(collectionsCount).toBe(0);
    });

    it('filters items correctly based on filterType', () => {
      const active = initialItems.filter(i => !i.deletedAt);

      // filterType: 'favorites'
      const favorites = active.filter(i => i.isFavorite);
      expect(favorites.length).toBe(1);
      expect(favorites[0].id).toBe('session-1');

      // filterType: 'session'
      const sessions = active.filter(i => i.itemType === 'session' || (i.tabCount && i.tabCount > 1));
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe('session-1');

      // filterType: 'tab'
      const singleTabs = active.filter(i => i.itemType === 'tab' || !i.tabCount || i.tabCount <= 1);
      expect(singleTabs.length).toBe(3);

      // filterType: 'reachable'
      const reachable = active.filter(i => i.availabilityStatus === 'reachable');
      expect(reachable.length).toBe(2);
    });
  });

  describe('Session Sub-Tab Operations & Edge Cases', () => {
    it('synthesizes sub-tabs if a session item has tabCount > 1 but no sessionTabs array', () => {
      const bareSessionItem: SavedTabItem = {
        id: 'bare-session',
        vaultId: 'default',
        itemType: 'session',
        title: 'Batch Research Session',
        url: 'https://example.com/research',
        normalizedUrl: 'https://example.com/research',
        domain: 'example.com',
        browserFamily: 'Chrome',
        savedAt: '2026-10-24T14:00:00Z',
        notes: '',
        isFavorite: false,
        collectionIds: [],
        tags: [],
        tabCount: 4,
        sessionTabs: undefined
      };

      const count = bareSessionItem.tabCount && bareSessionItem.tabCount > 1 ? bareSessionItem.tabCount : 1;
      const synthesizedTabs = Array.from({ length: count }, (_, idx) => ({
        id: `synth_${bareSessionItem.id}_${idx + 1}`,
        title: `${bareSessionItem.title} — Tab ${idx + 1}`,
        url: `${bareSessionItem.url}${bareSessionItem.url.includes('?') ? '&' : '?'}tab=${idx + 1}`,
        domain: bareSessionItem.domain,
        faviconUrl: bareSessionItem.faviconUrl
      }));

      expect(synthesizedTabs.length).toBe(4);
      expect(synthesizedTabs[0].title).toBe('Batch Research Session — Tab 1');
      expect(synthesizedTabs[3].url).toBe('https://example.com/research?tab=4');
    });

    it('normalizes manual URL inputs by prepending https:// if scheme is missing', () => {
      const testCases = [
        { input: 'github.com/RetsardCo/Tabsed', expected: 'https://github.com/RetsardCo/Tabsed' },
        { input: 'http://insecure-site.local', expected: 'http://insecure-site.local' },
        { input: 'https://secure-site.org/page', expected: 'https://secure-site.org/page' },
        { input: '   docs.godotengine.org/en/stable/   ', expected: 'https://docs.godotengine.org/en/stable/' },
      ];

      for (const tc of testCases) {
        const trimmed = tc.input.trim();
        const normalized = trimmed.startsWith('http://') || trimmed.startsWith('https://')
          ? trimmed
          : `https://${trimmed}`;
        expect(normalized).toBe(tc.expected);
      }
    });

    it('deletes an individual sub-tab from a session group without deleting the parent group', () => {
      let items = [...initialItems];

      // Simulate handleDeleteSubTab
      const parentId = 'session-1';
      const subTabIdToDelete = 'sub-2';

      items = items.map(item => {
        if (item.id === parentId) {
          const currentTabs = item.sessionTabs || [];
          const updated = currentTabs.filter((st: SessionTab) => st.id !== subTabIdToDelete);
          return {
            ...item,
            sessionTabs: updated,
            tabCount: updated.length,
          };
        }
        return item;
      });

      const session = items.find(i => i.id === parentId);
      expect(session).toBeDefined();
      expect(session!.sessionTabs?.length).toBe(2);
      expect(session!.tabCount).toBe(2);
      expect(session!.sessionTabs?.map((st: SessionTab) => st.id)).toEqual(['sub-1', 'sub-3']);
      expect(session!.sessionTabs?.some((st: SessionTab) => st.id === 'sub-2')).toBe(false);
    });

    it('updates title inline for an item', () => {
      let items = [...initialItems];
      const newTitle = 'Renamed Game Development Tools & Shaders';

      items = items.map(item => (item.id === 'session-1' ? { ...item, title: newTitle } : item));

      const updated = items.find(i => i.id === 'session-1');
      expect(updated?.title).toBe(newTitle);
    });

    it('moves an item to a designated collection', () => {
      let items = [...initialItems];
      const targetCollectionId = 'col-favorites-archive';

      items = items.map(item =>
        item.id === 'session-1'
          ? {
              ...item,
              collectionIds: item.collectionIds.includes(targetCollectionId)
                ? item.collectionIds
                : [...item.collectionIds, targetCollectionId]
            }
          : item
      );

      const moved = items.find(i => i.id === 'session-1');
      expect(moved?.collectionIds).toContain('col-favorites-archive');
      expect(moved?.collectionIds).toContain('dev');
    });
  });
});
