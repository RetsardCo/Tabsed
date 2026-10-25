import { IBrowserConnector, ConnectorCapabilities, BrowserTab, BrowserProfile } from './types';

export class MockBrowserConnector implements IBrowserConnector {
  private browserFamily: 'Edge' | 'Chrome' | 'Firefox' | 'Brave' | 'Other';
  private tabs: BrowserTab[];

  constructor(browserFamily: 'Edge' | 'Chrome' | 'Firefox' | 'Brave' | 'Other' = 'Edge') {
    this.browserFamily = browserFamily;
    this.tabs = [
      {
        tabId: 101,
        windowId: 1,
        url: 'https://react.dev/reference/react',
        title: 'React Documentation — Built-in React Hooks',
        favIconUrl: 'https://react.dev/favicon.ico',
        pinned: true,
        orderIndex: 0,
        groupId: 1,
        groupTitle: 'Frontend Dev',
        incognito: false,
        active: false
      },
      {
        tabId: 102,
        windowId: 1,
        url: 'https://tauri.app/v2/guides/',
        title: 'Tauri 2.0 Docs & Architecture',
        favIconUrl: 'https://tauri.app/favicon.ico',
        pinned: false,
        orderIndex: 1,
        groupId: 1,
        groupTitle: 'Frontend Dev',
        incognito: false,
        active: true
      },
      {
        tabId: 103,
        windowId: 1,
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/History_API',
        title: 'History API - Web APIs | MDN',
        favIconUrl: 'https://developer.mozilla.org/favicon-48x48.png',
        pinned: false,
        orderIndex: 2,
        groupId: null,
        groupTitle: null,
        incognito: false,
        active: false
      },
      {
        tabId: 104,
        windowId: 1,
        url: `${browserFamily.toLowerCase()}://settings/privacy`,
        title: 'Browser Privacy & Settings',
        favIconUrl: null,
        pinned: false,
        orderIndex: 3,
        groupId: null,
        groupTitle: null,
        incognito: false,
        active: false
      },
      {
        tabId: 105,
        windowId: 1,
        url: 'https://news.ycombinator.com/',
        title: 'Hacker News',
        favIconUrl: 'https://news.ycombinator.com/favicon.ico',
        pinned: false,
        orderIndex: 4,
        groupId: null,
        groupTitle: null,
        incognito: true, // Incognito tab (should be excluded by default)
        active: false
      }
    ];
  }

  public getBrowserFamily(): string {
    return this.browserFamily;
  }

  public async getCapabilities(): Promise<ConnectorCapabilities> {
    if (this.browserFamily === 'Firefox') {
      // Firefox Epic 3.5: tab groups are unsupported natively
      return {
        listTabs: 'supported',
        captureMetadata: 'supported',
        captureThumbnail: 'supported',
        closeTabs: 'supported',
        openUrls: 'supported',
        selectProfile: 'supported',
        restorePinnedState: 'supported',
        restoreTabGroups: 'unsupported',
        privateModeAvailable: 'supported',
        queryProfileStorage: 'unavailable'
      };
    }

    return {
      listTabs: 'supported',
      captureMetadata: 'supported',
      captureThumbnail: 'supported',
      closeTabs: 'supported',
      openUrls: 'supported',
      selectProfile: 'supported',
      restorePinnedState: 'supported',
      restoreTabGroups: 'supported',
      privateModeAvailable: 'supported',
      queryProfileStorage: 'supported'
    };
  }

  public async listTabs(options: { currentWindowOnly?: boolean; excludeIncognito?: boolean } = {}): Promise<BrowserTab[]> {
    let result = [...this.tabs];
    if (options.excludeIncognito !== false) {
      result = result.filter(t => !t.incognito);
    }
    return result;
  }

  public async captureThumbnail(tabId: number | string): Promise<string | null> {
    const tab = this.tabs.find(t => t.tabId === tabId);
    if (!tab) return null;
    
    // Internal browser URLs cannot be captured
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      return null;
    }

    try {
      const domain = new URL(tab.url).hostname.replace(/^www\./, '');
      const cleanTitle = (tab.title || domain).replace(/[<>&"]/g, '');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bg_${tabId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#bg_${tabId})" />
  <rect x="0" y="0" width="600" height="36" fill="#1e293b" />
  <circle cx="20" cy="18" r="5" fill="#ef4444" />
  <circle cx="36" cy="18" r="5" fill="#f59e0b" />
  <circle cx="52" cy="18" r="5" fill="#10b981" />
  <rect x="80" y="8" width="400" height="20" rx="4" fill="#0f172a" />
  <text x="94" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#94a3b8">${domain}</text>
  <rect x="40" y="60" width="160" height="20" rx="4" fill="#2563eb" opacity="0.8" />
  <text x="40" y="112" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="bold" fill="#f8fafc">${cleanTitle.slice(0, 38)}</text>
  <rect x="40" y="135" width="520" height="10" rx="3" fill="#334155" />
  <rect x="40" y="155" width="480" height="10" rx="3" fill="#334155" />
  <rect x="40" y="175" width="420" height="10" rx="3" fill="#334155" />
  <rect x="40" y="210" width="245" height="150" rx="8" fill="#1e293b" stroke="#334155" />
  <rect x="315" y="210" width="245" height="150" rx="8" fill="#1e293b" stroke="#334155" />
</svg>`;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    } catch {
      return null;
    }
  }

  public async closeTabs(tabIds: (number | string)[]): Promise<(number | string)[]> {
    const closed: (number | string)[] = [];
    this.tabs = this.tabs.filter(t => {
      if (tabIds.includes(t.tabId)) {
        closed.push(t.tabId);
        return false;
      }
      return true;
    });
    return closed;
  }

  public async openTabs(urls: { url: string; pinned?: boolean }[]): Promise<boolean> {
    let nextId = 200;
    for (const u of urls) {
      this.tabs.push({
        tabId: nextId++,
        windowId: 1,
        url: u.url,
        title: 'Restored: ' + u.url,
        pinned: !!u.pinned,
        orderIndex: this.tabs.length,
        incognito: false,
        active: false
      });
    }
    return true;
  }

  public async getProfiles(): Promise<BrowserProfile[]> {
    if (this.browserFamily === 'Firefox') {
      return [
        {
          id: 'default-release',
          label: 'default-release (Firefox Personal)',
          browserFamily: 'Firefox',
          isDefault: true,
          estimatedDiskSizeBytes: 1100000000
        },
        {
          id: 'dev-edition',
          label: 'dev-edition-default (Firefox Dev)',
          browserFamily: 'Firefox',
          isDefault: false,
          estimatedDiskSizeBytes: 650000000
        }
      ];
    }

    return [
      {
        id: 'default',
        label: `${this.browserFamily} Default Profile`,
        browserFamily: this.browserFamily,
        isDefault: true,
        estimatedDiskSizeBytes: 1420000000
      },
      {
        id: 'work',
        label: `${this.browserFamily} Profile 2 (Work)`,
        browserFamily: this.browserFamily,
        isDefault: false,
        estimatedDiskSizeBytes: 850000000
      }
    ];
  }
}
