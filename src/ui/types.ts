export type ViewMode = 'grid' | 'compact' | 'detailed';
export type ThemeMode = 'system' | 'light' | 'dark';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';
export type AccentPreset = 'blue' | 'violet' | 'mint' | 'rose' | 'amber' | 'graphite' | 'custom';

export interface SavedTabItem {
  id: string;
  vaultId: string;
  itemType: 'tab' | 'session' | 'snapshot';
  title: string;
  url: string;
  normalizedUrl: string;
  domain: string;
  faviconUrl?: string | null;
  thumbnailUrl?: string | null;
  browserFamily: 'Edge' | 'Chrome' | 'Brave' | 'Firefox' | 'Other';
  profileLabel?: string | null;
  savedAt: string;
  lastOpenedAt?: string | null;
  notes: string;
  isFavorite: boolean;
  collectionIds: string[];
  tags: string[];
  archiveSizeBytes?: number | null;
  availabilityStatus?: 'reachable' | 'redirect' | 'auth_required' | 'blocked_uncertain' | 'timeout' | 'network_error';
  availabilityCheckedAt?: string | null;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  iconKey?: string;
  accentColor?: string;
  itemCount: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface UserPreferences {
  theme: ThemeMode;
  accent: AccentPreset;
  customAccentHex: string;
  density: DensityMode;
  micaEnabled: boolean;
  defaultView: ViewMode;
  confirmBeforeBulkClose: boolean;
  restoreBatchSize: number;
  restoreBatchDelayMs: number;
}
