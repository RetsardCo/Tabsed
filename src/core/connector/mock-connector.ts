import { IBrowserConnector, ConnectorCapabilities, BrowserTab, BrowserProfile } from './types';

export class MockBrowserConnector implements IBrowserConnector {
  private browserFamily: 'Edge' | 'Chrome';
  private tabs: BrowserTab[];

  constructor(browserFamily: 'Edge' | 'Chrome' = 'Edge') {
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
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      return null;
    }

    // Return realistic base64 PNG data
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
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
    return [
      {
        id: 'default',
        label: 'Default Profile (Personal)',
        browserFamily: this.browserFamily,
        isDefault: true,
        estimatedDiskSizeBytes: 1420000000 // ~1.4GB profile folder
      },
      {
        id: 'work',
        label: 'Profile 2 (Work)',
        browserFamily: this.browserFamily,
        isDefault: false,
        estimatedDiskSizeBytes: 850000000 // ~850MB profile folder
      }
    ];
  }
}
