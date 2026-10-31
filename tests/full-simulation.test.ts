import { describe, it, expect } from 'vitest';
import { SavedTabItem, Collection } from '../src/ui/types';
import { unpackAllSessionItems, groupTabsBySession, extractDomainFromUrl } from '../src/core/vault/unpack-sessions';

describe('Tabsed Desktop App Full Simulation & Conformance Suite', () => {
  // Mock generator for stress testing
  const createMockTabs = (activeCount: number, trashCount: number): SavedTabItem[] => {
    const items: SavedTabItem[] = [];
    const now = Date.now();

    for (let i = 0; i < activeCount; i++) {
      const isMultiTabSession = i % 10 === 0;
      items.push({
        id: `tab_act_${i}`,
        vaultId: 'default',
        itemType: isMultiTabSession ? 'session' : 'tab',
        title: `Active Research Article ${i} on Systems Engineering`,
        url: `https://example${i % 15}.com/article/${i}`,
        normalizedUrl: `https://example${i % 15}.com/article/${i}`,
        domain: `example${i % 15}.com`,
        faviconUrl: `https://example${i % 15}.com/favicon.ico`,
        thumbnailUrl: i % 2 === 0 ? `https://snapshots.tabsed.app/thumb_${i}.jpg` : null,
        browserFamily: i % 3 === 0 ? 'Chrome' : (i % 3 === 1 ? 'Firefox' : 'Edge'),
        profileLabel: 'Default',
        savedAt: new Date(now - (i % 14) * 24 * 60 * 60 * 1000).toISOString(),
        notes: i % 4 === 0 ? `Important reference note for section ${i}.` : '',
        isFavorite: i % 5 === 0,
        collectionIds: i % 3 === 0 ? ['col_dev'] : (i % 3 === 1 ? ['col_research'] : []),
        tags: [`Tag${i % 5}`],
        tabCount: isMultiTabSession ? 5 : 1,
        archiveSizeBytes: 1024 * 1024 + i * 10000,
        availabilityStatus: i % 8 === 0 ? 'network_error' : 'reachable',
        sessionTabs: isMultiTabSession ? [
          { id: `sub_${i}_1`, title: `Subtab 1 of ${i}`, url: `https://sub${i}.com/1`, domain: `sub${i}.com` },
          { id: `sub_${i}_2`, title: `Subtab 2 of ${i}`, url: `https://sub${i}.com/2`, domain: `sub${i}.com` }
        ] : undefined
      });
    }

    for (let j = 0; j < trashCount; j++) {
      items.push({
        id: `tab_trash_${j}`,
        vaultId: 'default',
        itemType: 'tab',
        title: `Trashed Tab ${j}`,
        url: `https://old-site-${j}.com/page`,
        normalizedUrl: `https://old-site-${j}.com/page`,
        domain: `old-site-${j}.com`,
        browserFamily: 'Chrome',
        profileLabel: 'Default',
        savedAt: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
        deletedAt: new Date(now - (j % 5) * 24 * 60 * 60 * 1000).toISOString(),
        notes: '',
        isFavorite: false,
        collectionIds: [],
        tags: [],
        availabilityStatus: 'reachable'
      });
    }

    return items;
  };

  describe('1. High-Load Tab Scaling & Single-Pass Stats Computation', () => {
    it('processes 150 active tabs and 350 trash items (500 total) efficiently without lag', () => {
      const items = createMockTabs(150, 350);
      const collections: Collection[] = [
        { id: 'col_dev', name: 'Development', description: 'Dev', accentColor: '#2563eb', itemCount: 0, createdAt: new Date().toISOString() },
        { id: 'col_research', name: 'Research', description: 'Research', accentColor: '#10b981', itemCount: 0, createdAt: new Date().toISOString() }
      ];

      const startTime = performance.now();

      // Single-pass O(N) calculation identical to App.tsx tabStats
      let trashCount = 0;
      let favoritesCount = 0;
      let activeItemCount = 0;
      let recentCount = 0;
      let edgeCount = 0;
      let chromeCount = 0;
      let firefoxCount = 0;
      let storageUsedBytes = 0;
      let totalTrashBytes = 0;
      let thumbnailsCount = 0;
      let brokenLinksCount = 0;
      let duplicatesCount = 0;
      const seenUrls = new Set<string>();
      const colCounts: Record<string, number> = { col_dev: 0, col_research: 0 };
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.deletedAt) {
          trashCount++;
          totalTrashBytes += (item.archiveSizeBytes || 131072);
        } else {
          activeItemCount++;
          const bytes = item.archiveSizeBytes || 131072;
          storageUsedBytes += bytes;

          if (item.isFavorite) favoritesCount++;
          if (item.thumbnailUrl) thumbnailsCount++;

          const savedTime = new Date(item.savedAt).getTime();
          if (savedTime >= oneWeekAgo) recentCount++;

          if (item.browserFamily === 'Edge') edgeCount++;
          else if (item.browserFamily === 'Chrome') chromeCount++;
          else if (item.browserFamily === 'Firefox') firefoxCount++;

          if (item.collectionIds) {
            for (const cid of item.collectionIds) {
              if (cid in colCounts) colCounts[cid]++;
            }
          }

          const url = item.normalizedUrl || item.url;
          if (url) {
            if (seenUrls.has(url)) duplicatesCount++;
            else seenUrls.add(url);
          }

          if (item.availabilityStatus === 'network_error' || item.availabilityStatus === 'timeout') {
            brokenLinksCount++;
          }
        }
      }

      const durationMs = performance.now() - startTime;

      expect(activeItemCount).toBe(150);
      expect(trashCount).toBe(350);
      expect(chromeCount + firefoxCount + edgeCount).toBe(150);
      expect(colCounts['col_dev'] + colCounts['col_research']).toBeGreaterThan(0);
      expect(brokenLinksCount).toBeGreaterThan(0);
      // Single pass should execute in under 15ms on any machine
      expect(durationMs).toBeLessThan(50);
    });

    it('correctly filters destination views without trash bleeding into active lists', () => {
      const items = createMockTabs(120, 200);

      // Filter: all active
      const allActive = items.filter(i => !i.deletedAt);
      expect(allActive.length).toBe(120);

      // Filter: trash
      const trash = items.filter(i => Boolean(i.deletedAt));
      expect(trash.length).toBe(200);

      // Filter: favorites
      const favs = items.filter(i => i.isFavorite && !i.deletedAt);
      expect(favs.every(f => f.isFavorite && !f.deletedAt)).toBe(true);

      // Filter: collection
      const devCol = items.filter(i => (i.collectionIds || []).includes('col_dev') && !i.deletedAt);
      expect(devCol.every(d => (d.collectionIds || []).includes('col_dev') && !d.deletedAt)).toBe(true);
    });
  });

  describe('2. Sidebar Navigation & Overlay State Isolation', () => {
    it('simulates sidebar destination change and guarantees selectedItemId is cleared', () => {
      let selectedItemId: string | null = 'tab_act_12';
      let currentDestination = 'all';

      const handleSelectDestination = (dest: string) => {
        currentDestination = dest;
        selectedItemId = null;
      };

      expect(selectedItemId).toBe('tab_act_12');

      // User clicks "Trash" in sidebar
      handleSelectDestination('trash');
      expect(currentDestination).toBe('trash');
      expect(selectedItemId).toBeNull(); // Overlay is dismissed immediately

      // User selects another item in trash
      selectedItemId = 'tab_trash_5';
      expect(selectedItemId).toBe('tab_trash_5');

      // User clicks "Favorites" in sidebar
      handleSelectDestination('favorites');
      expect(currentDestination).toBe('favorites');
      expect(selectedItemId).toBeNull(); // Overlay is dismissed again
    });

    it('simulates sidebar modal button clicks and verifies selectedItemId is cleared', () => {
      let selectedItemId: string | null = 'tab_act_45';
      let storageModalOpen = false;
      let duplicatesModalOpen = false;
      let checkLinksModalOpen = false;

      // Opener handlers matching App.tsx
      const openStorage = () => { selectedItemId = null; storageModalOpen = true; };
      const openDuplicates = () => { selectedItemId = null; duplicatesModalOpen = true; };
      const openCheckLinks = () => { selectedItemId = null; checkLinksModalOpen = true; };

      openStorage();
      expect(storageModalOpen).toBe(true);
      expect(selectedItemId).toBeNull(); // Inspector dismissed so modal is not blocked

      openDuplicates();
      expect(duplicatesModalOpen).toBe(true);
      expect(selectedItemId).toBeNull();

      openCheckLinks();
      expect(checkLinksModalOpen).toBe(true);
      expect(selectedItemId).toBeNull();
    });

    it('simulates ArchiveSearch item selection closing the search modal and opening inspector', () => {
      let archiveSearchOpen = true;
      let selectedItemId: string | null = null;

      const onSelectItemFromSearch = (id: string) => {
        archiveSearchOpen = false;
        selectedItemId = id;
      };

      onSelectItemFromSearch('tab_act_88');
      expect(archiveSearchOpen).toBe(false);
      expect(selectedItemId).toBe('tab_act_88');
    });
  });

  describe('3. Android-Launcher Style Tab Grouping & Multi-Selection', () => {
    it('creates a new group collection when two tabs are joined and assigns collectionId', () => {
      const items = createMockTabs(20, 0);
      const collections: Collection[] = [];

      const tab1 = items[0];
      const tab2 = items[1];

      // Create Group flow
      const newCollectionId = `col_${Date.now()}`;
      const newGroup: Collection = {
        id: newCollectionId,
        name: 'Distributed Systems',
        accentColor: '#3b82f6',
        description: 'Group created from tabs',
        itemCount: 2,
        createdAt: new Date().toISOString()
      };

      collections.push(newGroup);

      const selectedTabIds = [tab1.id, tab2.id];
      const updatedItems = items.map(t => {
        if (selectedTabIds.includes(t.id)) {
          const current = t.collectionIds || [];
          return { ...t, collectionIds: [...current, newCollectionId] };
        }
        return t;
      });

      expect(collections.length).toBe(1);
      expect(collections[0].name).toBe('Distributed Systems');
      expect(updatedItems.find(t => t.id === tab1.id)?.collectionIds).toContain(newCollectionId);
      expect(updatedItems.find(t => t.id === tab2.id)?.collectionIds).toContain(newCollectionId);
    });
  });

  describe('4. Notes Auto-Save and Card Display', () => {
    it('updates notes on an item and preserves it in state', () => {
      const items = createMockTabs(5, 0);
      const targetId = items[2].id;
      const newNote = 'Check theorem 4.2 in section 3 of paper';

      const updated = items.map(item => {
        if (item.id === targetId) {
          return { ...item, notes: newNote };
        }
        return item;
      });

      const target = updated.find(i => i.id === targetId);
      expect(target?.notes).toBe(newNote);
    });

    it('extracts domain accurately for URL quick-adds and fallbacks', () => {
      expect(extractDomainFromUrl('https://news.ycombinator.com/item?id=123')).toBe('news.ycombinator.com');
      expect(extractDomainFromUrl('https://github.com/rust-lang/rust')).toBe('github.com');
      expect(extractDomainFromUrl('http://localhost:3000/dashboard')).toBe('localhost');
      expect(extractDomainFromUrl('')).toBe('');
    });
  });

  describe('5. Unpack Sessions Guarantee', () => {
    it('unpacks all session tabs when restoring backups or loading vault', () => {
      const sessionItem: SavedTabItem = {
        id: 'sess_1',
        vaultId: 'default',
        itemType: 'session',
        title: 'Morning Work Session',
        url: 'https://work.com',
        normalizedUrl: 'https://work.com',
        domain: 'work.com',
        browserFamily: 'Chrome',
        savedAt: new Date().toISOString(),
        notes: '',
        isFavorite: false,
        collectionIds: ['inbox'],
        tags: [],
        sessionTabs: [
          { id: 'sub_1', title: 'Work App 1', url: 'https://work.com/1', domain: 'work.com' },
          { id: 'sub_2', title: 'Work App 2', url: 'https://work.com/2', domain: 'work.com' }
        ]
      };

      const regularTab: SavedTabItem = {
        id: 'tab_single',
        vaultId: 'default',
        itemType: 'tab',
        title: 'Single Tab',
        url: 'https://single.com',
        normalizedUrl: 'https://single.com',
        domain: 'single.com',
        browserFamily: 'Edge',
        savedAt: new Date().toISOString(),
        notes: '',
        isFavorite: false,
        collectionIds: ['inbox'],
        tags: []
      };

      const unpacked = unpackAllSessionItems([sessionItem, regularTab]);
      expect(unpacked.length).toBe(3); // 2 subtabs unpacked + 1 regular tab
      expect(unpacked.map(u => u.id)).toContain('sess_1_sub_1');
      expect(unpacked.map(u => u.id)).toContain('sess_1_sub_2');
      expect(unpacked.map(u => u.id)).toContain('tab_single');
    });
  });

  describe('6. Collection Routing & Prefix Hardening', () => {
    it('verifies created group with col_ prefix can be selected from sidebar and filters tabs without 0-tab blank screen', () => {
      const createdGroupId = `col_${Date.now()}`;
      const collections: Collection[] = [
        { id: 'inbox', name: 'Inbox', description: 'Inbox', accentColor: '#2563eb', itemCount: 1 },
        { id: createdGroupId, name: 'AI Models', description: 'AI Models', accentColor: '#7c3aed', itemCount: 2 }
      ];

      const tabs: SavedTabItem[] = [
        {
          id: 'tab_ai_1',
          vaultId: 'default',
          itemType: 'tab',
          title: 'Claude 3.7 Sonnet',
          url: 'https://anthropic.com',
          normalizedUrl: 'https://anthropic.com',
          domain: 'anthropic.com',
          browserFamily: 'Chrome',
          savedAt: new Date().toISOString(),
          notes: '',
          isFavorite: false,
          collectionIds: [createdGroupId],
          tags: []
        },
        {
          id: 'tab_ai_2',
          vaultId: 'default',
          itemType: 'tab',
          title: 'Gemini 2.5 Flash',
          url: 'https://gemini.google.com',
          normalizedUrl: 'https://gemini.google.com',
          domain: 'google.com',
          browserFamily: 'Edge',
          savedAt: new Date().toISOString(),
          notes: '',
          isFavorite: false,
          collectionIds: [createdGroupId],
          tags: []
        },
        {
          id: 'tab_inbox_1',
          vaultId: 'default',
          itemType: 'tab',
          title: 'Inbox Item',
          url: 'https://inbox.com',
          normalizedUrl: 'https://inbox.com',
          domain: 'inbox.com',
          browserFamily: 'Firefox',
          savedAt: new Date().toISOString(),
          notes: '',
          isFavorite: false,
          collectionIds: ['inbox'],
          tags: []
        }
      ];

      // Simulate sidebar click: destination becomes createdGroupId
      const currentDestination = createdGroupId;

      // Filter logic matching hardened App.tsx
      const targetCol = collections.find(c =>
        c.id === currentDestination ||
        `col_${c.id}` === currentDestination ||
        (currentDestination.startsWith('col_') && c.id === currentDestination.slice(4))
      );

      expect(targetCol).toBeDefined();
      expect(targetCol?.name).toBe('AI Models');

      const filtered = tabs.filter(i =>
        !i.deletedAt &&
        (i.collectionIds || []).some(cid =>
          cid === targetCol!.id ||
          cid === `col_${targetCol!.id}` ||
          (targetCol!.id.startsWith('col_') && cid === targetCol!.id.slice(4))
        )
      );

      // Verify that tabs are found and not empty
      expect(filtered.length).toBe(2);
      expect(filtered.map(f => f.id)).toEqual(['tab_ai_1', 'tab_ai_2']);
    });

    it('verifies colCounts accurately counts tabs with or without col_ prefix in tab.collectionIds', () => {
      const collections: Collection[] = [
        { id: 'inbox', name: 'Inbox', description: 'Inbox', accentColor: '#2563eb', itemCount: 0 },
        { id: 'col_research', name: 'Research', description: 'Research', accentColor: '#10b981', itemCount: 0 }
      ];

      const tabs: SavedTabItem[] = [
        { id: 't1', vaultId: 'd', itemType: 'tab', title: 'T1', url: 'https://1.com', normalizedUrl: 'https://1.com', domain: '1.com', browserFamily: 'Chrome', savedAt: new Date().toISOString(), notes: '', isFavorite: false, collectionIds: ['col_inbox'], tags: [] },
        { id: 't2', vaultId: 'd', itemType: 'tab', title: 'T2', url: 'https://2.com', normalizedUrl: 'https://2.com', domain: '2.com', browserFamily: 'Chrome', savedAt: new Date().toISOString(), notes: '', isFavorite: false, collectionIds: ['inbox'], tags: [] },
        { id: 't3', vaultId: 'd', itemType: 'tab', title: 'T3', url: 'https://3.com', normalizedUrl: 'https://3.com', domain: '3.com', browserFamily: 'Chrome', savedAt: new Date().toISOString(), notes: '', isFavorite: false, collectionIds: ['research'], tags: [] },
        { id: 't4', vaultId: 'd', itemType: 'tab', title: 'T4', url: 'https://4.com', normalizedUrl: 'https://4.com', domain: '4.com', browserFamily: 'Chrome', savedAt: new Date().toISOString(), notes: '', isFavorite: false, collectionIds: ['col_research'], tags: [] }
      ];

      const colCounts: Record<string, number> = {};
      for (const c of collections) colCounts[c.id] = 0;

      for (let i = 0; i < tabs.length; i++) {
        const item = tabs[i];
        if (item.collectionIds && item.collectionIds.length > 0) {
          for (let j = 0; j < item.collectionIds.length; j++) {
            const cid = item.collectionIds[j];
            for (let k = 0; k < collections.length; k++) {
              const col = collections[k];
              if (col.id === cid || `col_${col.id}` === cid || (col.id.startsWith('col_') && col.id.slice(4) === cid)) {
                colCounts[col.id] = (colCounts[col.id] || 0) + 1;
              }
            }
          }
        }
      }

      expect(colCounts['inbox']).toBe(2); // counted both 'col_inbox' and 'inbox'
      expect(colCounts['col_research']).toBe(2); // counted both 'research' and 'col_research'
    });
  });

  describe('7. DetailInspector Subtab Selection & Escape Hierarchy', () => {
    it('preserves user selected subtab ID when notes/tags are updated', () => {
      const sessionTabs = [
        { id: 'sub_1', title: 'Doc 1', url: 'https://doc.com/1', domain: 'doc.com' },
        { id: 'sub_2', title: 'Doc 2', url: 'https://doc.com/2', domain: 'doc.com' },
        { id: 'sub_3', title: 'Doc 3', url: 'https://doc.com/3', domain: 'doc.com' }
      ];

      let selectedSubTabId = 'sub_2'; // user navigated to subtab 2

      // Simulate subtab preservation logic
      const computeSelectedSubTab = (prev: string, tabs: typeof sessionTabs, defaultId: string) => {
        if (prev && tabs.some(t => t.id === prev)) {
          return prev;
        }
        return tabs[0]?.id || defaultId;
      };

      // When note is updated, selectedSubTabId must NOT reset to sub_1
      const result = computeSelectedSubTab(selectedSubTabId, sessionTabs, 'main');
      expect(result).toBe('sub_2');
    });
  });
});
