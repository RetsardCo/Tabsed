export type ViewMode = 'grid' | 'compact' | 'detailed';
export type ThemeMode = 'system' | 'light' | 'dark';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';
export type AccentPreset = 'blue' | 'violet' | 'mint' | 'rose' | 'amber' | 'graphite' | 'custom';

export interface SessionTab {
  id: string;
  title: string;
  url: string;
  domain: string;
  faviconUrl?: string | null;
  pinned?: boolean;
}

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
  tabCount?: number;
  sessionTabs?: SessionTab[];
  windowSessionId?: string | null;
  sessionTitle?: string | null;
  authorAvatarUrl?: string | null;
  archiveSizeBytes?: number | null;
  archiveContent?: string | null;
  archiveHtml?: string | null;
  availabilityStatus?: 'reachable' | 'redirect' | 'auth_required' | 'blocked_uncertain' | 'timeout' | 'network_error';
  availabilityCheckedAt?: string | null;
  deletedAt?: string | null;
  isPrivate?: boolean;
}

export type GroupMode = 'individual' | 'session';

export interface Collection {
  id: string;
  name: string;
  description: string;
  iconKey?: string;
  accentColor?: string;
  itemCount: number;
  createdAt?: string;
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
  storageQuotaBytes?: number;
  autoPruneThresholdPercent?: number;
}

export interface BackupManifest {
  backupId: string;
  createdAt: string;
  schemaVersion: number;
  vaultId: string;
  totalSizeBytes: number;
  itemCount: number;
  sha256: string;
  files: { path: string; sizeBytes: number; sha256: string }[];
}

// --- Epic 4.1: Portable Vault ---
export interface PortableManifestFileEntry {
  relativePath: string;
  sizeBytes: number;
  sha256: string;
  category: 'item_data' | 'thumbnail' | 'archive' | 'database' | 'metadata';
}

export interface PortableVaultManifest {
  manifestVersion: '1.0.0';
  vaultId: string;
  vaultName: string;
  createdAt: string;
  exportedAt: string;
  appVersion: string;
  itemCount: number;
  totalSizeBytes: number;
  files: PortableManifestFileEntry[];
  items: SavedTabItem[];
  metadata?: {
    collections?: Collection[];
    tags?: Tag[];
    exportedBy?: string;
  };
}

export type ImportConflictStrategy = 'keep-both' | 'overwrite' | 'skip';

export interface PortableExportResult {
  success: boolean;
  manifest: PortableVaultManifest;
  exportPath: string;
  totalFiles: number;
  totalBytes: number;
}

// --- Epic 4.2: Encryption and Key Management ---
export interface EncryptedVaultPayload {
  version: 1;
  algorithm: 'aes-256-gcm';
  kdf: 'scrypt' | 'pbkdf2';
  salt: string;
  iv: string;
  authTag: string;
  ciphertext: string;
  createdAt: string;
  keyHint?: string;
}

export interface EncryptionConfig {
  enabled: boolean;
  encryptVaultAtRest: boolean;
  encryptArchives: boolean;
  kdf: 'scrypt' | 'pbkdf2';
  hasRecoveryKey: boolean;
  lastRotatedAt?: string;
}

// --- Epic 4.3: Preview Redaction & Private Vault ---
export interface DomainRedactionRule {
  id: string;
  pattern: string;
  mode: 'blur' | 'placeholder' | 'strip';
  enabled: boolean;
  category?: 'banking' | 'health' | 'internal' | 'custom';
  description?: string;
}

export interface PrivateVaultConfig {
  allowPrivateTabCapture: boolean;
  retentionPolicy: 'session_only' | 'max_age_hours' | 'manual';
  maxAgeHours: number;
  excludeFromSearchIndex: boolean;
  redactPreviews: boolean;
}

// --- Epic 4.4: Automation Engine ---
export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'inactivity' | 'tab_count' | 'schedule';
  enabled: boolean;
  inactivityThresholdMinutes?: number;
  maxTabsThreshold?: number;
  action: 'save_only' | 'save_and_close' | 'prune_old_archives';
  targetCollectionId?: string;
}

export interface AutomationProtectionRules {
  protectPinnedTabs: boolean;
  allowlistedDomains: string[];
  protectedCollectionIds: string[];
  excludePrivateTabs: boolean;
}

export interface AutomationAuditLogEntry {
  id: string;
  timestamp: string;
  ruleId: string;
  ruleName: string;
  action: 'save' | 'close' | 'protect' | 'skip' | 'prune';
  tabId?: string;
  tabUrl: string;
  tabTitle: string;
  status: 'success' | 'failed' | 'skipped';
  reason: string;
}

export interface CandidateTab {
  id: string;
  title: string;
  url: string;
  domain: string;
  pinned?: boolean;
  isPrivate?: boolean;
  lastActiveMinutesAgo?: number;
  collectionIds?: string[];
}

export interface AutomationSimulationResult {
  rule: AutomationRule;
  wouldSave: CandidateTab[];
  wouldClose: CandidateTab[];
  protected: { tab: CandidateTab; reason: string }[];
  skipped: { tab: CandidateTab; reason: string }[];
}

// --- Epic 4.5: System Tray & Quick Actions ---
export type TrayActionId =
  | 'open_tabsed'
  | 'save_current_window'
  | 'search_vault'
  | 'restore_recent'
  | 'pause_automation'
  | 'resume_automation'
  | 'exit';

export interface TrayConfig {
  enabled: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  showNotifications: boolean;
  launchAtLogin: boolean;
  redactNotificationTitles: boolean;
}

export interface TrayStatus {
  connectorStatus: 'connected' | 'disconnected' | 'connecting';
  automationStatus: 'running' | 'paused' | 'disabled';
  totalSavedTabs: number;
  recentSessionTitle?: string;
  lastActionMessage?: string;
}

