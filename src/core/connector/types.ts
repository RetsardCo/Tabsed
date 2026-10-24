/**
 * Tabsed Browser Connector Interface & Capability Types
 * Aligned with Tabsed PRD Section 11.3
 */

export type CapabilityStatus = 'supported' | 'unsupported' | 'denied' | 'unavailable';

export interface ConnectorCapabilities {
  listTabs: CapabilityStatus;
  captureMetadata: CapabilityStatus;
  captureThumbnail: CapabilityStatus;
  closeTabs: CapabilityStatus;
  openUrls: CapabilityStatus;
  selectProfile: CapabilityStatus;
  restorePinnedState: CapabilityStatus;
  restoreTabGroups: CapabilityStatus;
  privateModeAvailable: CapabilityStatus;
  queryProfileStorage: CapabilityStatus;
}

export interface BrowserTab {
  tabId: number | string;
  windowId: number | string;
  url: string;
  title: string;
  favIconUrl?: string | null;
  pinned: boolean;
  orderIndex: number;
  groupId?: number | string | null;
  groupTitle?: string | null;
  incognito: boolean;
  active: boolean;
}

export interface BrowserProfile {
  id: string;
  label: string;
  browserFamily: 'Edge' | 'Chrome' | 'Brave' | 'Firefox' | 'Other';
  isDefault: boolean;
  estimatedDiskSizeBytes?: number | null;
}

export interface IBrowserConnector {
  getBrowserFamily(): string;
  getCapabilities(): Promise<ConnectorCapabilities>;
  listTabs(options?: { currentWindowOnly?: boolean; excludeIncognito?: boolean }): Promise<BrowserTab[]>;
  captureThumbnail(tabId: number | string): Promise<string | null>;
  closeTabs(tabIds: (number | string)[]): Promise<(number | string)[]>;
  openTabs(urls: { url: string; pinned?: boolean }[], profileId?: string): Promise<boolean>;
  getProfiles(): Promise<BrowserProfile[]>;
}
