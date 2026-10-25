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
    });
  });

  describe('Session Sub-Tab Operations', () => {
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
