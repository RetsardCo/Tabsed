import { SavedTabItem, SessionTab } from '../../ui/types';

/**
 * Extracts domain name from URL with safe fallback
 */
export function extractDomainFromUrl(url: string): string {
  try {
    if (!url) return '';
    if (url.startsWith('file:///')) return 'local-file';
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || '';
  }
}

/**
 * Unpacks any session item with sub-tabs into distinct individual SavedTabItem cards.
 * Preserves windowSessionId and sessionTitle so they can be grouped or filtered on demand.
 */
export function unpackSessionItem(item: SavedTabItem): SavedTabItem[] {
  // If not a session or has no subTabs, return as-is
  if (!item.sessionTabs || item.sessionTabs.length === 0) {
    return [item];
  }

  const subTabs = item.sessionTabs;
  const parentSessionId = item.id;
  const parentSessionTitle = item.title;

  return subTabs.map((sub: SessionTab, idx: number) => {
    const domain = sub.domain || extractDomainFromUrl(sub.url);
    const title = sub.title && sub.title.trim() ? sub.title.trim() : (domain || 'Saved Tab');
    const tabId = sub.id ? `${parentSessionId}_${sub.id}` : `${parentSessionId}_tab_${idx}`;

    return {
      id: tabId,
      vaultId: item.vaultId || 'default',
      itemType: 'tab' as const,
      title: title,
      url: sub.url,
      normalizedUrl: sub.url,
      domain: domain,
      faviconUrl: sub.faviconUrl || (domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : null),
      thumbnailUrl: (idx === 0 ? item.thumbnailUrl : null) || null,
      browserFamily: item.browserFamily || 'Edge',
      profileLabel: item.profileLabel || 'Default',
      savedAt: item.savedAt || new Date().toISOString(),
      lastOpenedAt: item.lastOpenedAt || null,
      notes: idx === 0 ? (item.notes || '') : '',
      isFavorite: item.isFavorite || false,
      collectionIds: item.collectionIds && item.collectionIds.length > 0 ? [...item.collectionIds] : ['inbox'],
      tags: [
        ...(item.tags || []).filter(t => t !== 'Saved Window' && t !== 'session'),
        'Tab'
      ],
      tabCount: 1,
      windowSessionId: parentSessionId,
      sessionTitle: parentSessionTitle,
      archiveSizeBytes: 131072,
      availabilityStatus: item.availabilityStatus || 'reachable',
      deletedAt: item.deletedAt || null,
      isPrivate: item.isPrivate || false
    };
  });
}

/**
 * Unpacks an array of items, converting all session items with sub-tabs into individual tab cards.
 */
export function unpackAllSessionItems(items: SavedTabItem[]): SavedTabItem[] {
  const result: SavedTabItem[] = [];
  for (const item of items) {
    if (item.sessionTabs && item.sessionTabs.length > 0) {
      const unpacked = unpackSessionItem(item);
      result.push(...unpacked);
    } else {
      result.push(item);
    }
  }
  return result;
}

/**
 * Groups individual tabs back into session cards when the user selects "Group by Window Session"
 */
export function groupTabsBySession(items: SavedTabItem[]): SavedTabItem[] {
  const sessionMap = new Map<string, SavedTabItem[]>();
  const independentTabs: SavedTabItem[] = [];

  for (const item of items) {
    if (item.windowSessionId) {
      const existing = sessionMap.get(item.windowSessionId) || [];
      existing.push(item);
      sessionMap.set(item.windowSessionId, existing);
    } else if (item.itemType === 'session') {
      independentTabs.push(item);
    } else {
      independentTabs.push(item);
    }
  }

  const groupedSessions: SavedTabItem[] = [];

  for (const [sessionId, tabs] of sessionMap.entries()) {
    if (tabs.length === 1) {
      // If only 1 tab in session, just show as individual tab
      groupedSessions.push(tabs[0]);
      continue;
    }

    const first = tabs[0];
    const sessionTabs: SessionTab[] = tabs.map(t => ({
      id: t.id,
      title: t.title,
      url: t.url,
      domain: t.domain,
      faviconUrl: t.faviconUrl,
      pinned: false
    }));

    const sessionTitle = first.sessionTitle || `${first.title} and ${tabs.length - 1} more tabs`;

    groupedSessions.push({
      id: sessionId,
      vaultId: first.vaultId,
      itemType: 'session',
      title: sessionTitle,
      url: first.url,
      normalizedUrl: first.normalizedUrl,
      domain: first.domain,
      faviconUrl: first.faviconUrl,
      thumbnailUrl: first.thumbnailUrl,
      browserFamily: first.browserFamily,
      profileLabel: first.profileLabel,
      savedAt: first.savedAt,
      notes: `Window session containing ${tabs.length} tabs.`,
      isFavorite: tabs.some(t => t.isFavorite),
      collectionIds: Array.from(new Set(tabs.flatMap(t => t.collectionIds))),
      tags: ['Session', 'Window Session', first.browserFamily],
      tabCount: tabs.length,
      sessionTabs: sessionTabs,
      windowSessionId: sessionId,
      sessionTitle: sessionTitle,
      archiveSizeBytes: tabs.length * 131072,
      availabilityStatus: first.availabilityStatus,
      deletedAt: first.deletedAt
    });
  }

  return [...groupedSessions, ...independentTabs];
}
