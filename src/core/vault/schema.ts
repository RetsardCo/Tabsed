/**
 * Tabsed SQLite Database Schema Definition
 * Aligned with Tabsed PRD Section 11.6
 */

export interface VaultRecord {
  id: string;
  name: string;
  root_path: string;
  created_at: string;
  updated_at: string;
  quota_bytes: number | null;
  schema_version: number;
}

export interface ItemRecord {
  id: string;
  vault_id: string;
  item_type: 'tab' | 'session' | 'snapshot';
  title: string;
  url: string;
  normalized_url: string;
  domain: string;
  favicon_path: string | null;
  thumbnail_path: string | null;
  browser_family: string | null;
  profile_label: string | null;
  saved_at: string;
  last_opened_at: string | null;
  notes: string;
  is_favorite: number; // 0 or 1
  deleted_at: string | null;
  availability_status: string | null;
  availability_checked_at: string | null;
}

export interface SessionRecord {
  id: string;
  vault_id: string;
  title: string;
  created_at: string;
  source_browser: string | null;
  source_profile_label: string | null;
  notes: string;
}

export interface SessionItemRecord {
  session_id: string;
  item_id: string;
  original_order: number;
  pinned: number; // 0 or 1
  group_label: string | null;
  original_window_index: number | null;
}

export interface CollectionRecord {
  id: string;
  vault_id: string;
  parent_id: string | null;
  name: string;
  description: string;
  icon_key: string | null;
  accent_color: string | null;
  sort_order: number;
}

export interface ArchiveRecord {
  id: string;
  item_id: string;
  archive_type: 'thumbnail' | 'html' | 'resource_bundle' | 'text_index' | 'backup';
  relative_path: string;
  size_bytes: number;
  sha256: string;
  created_at: string;
  capture_status: 'complete' | 'incomplete' | 'failed';
  capture_notes: string | null;
  encrypted: number;
}

export const INITIAL_SCHEMA_SQL = `
-- PRD Section 11.6: Initial Logical Schema

CREATE TABLE IF NOT EXISTS vaults (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  quota_bytes INTEGER,
  schema_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  vault_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK(item_type IN ('tab', 'session', 'snapshot')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  favicon_path TEXT,
  thumbnail_path TEXT,
  browser_family TEXT,
  profile_label TEXT,
  saved_at TEXT NOT NULL,
  last_opened_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  is_favorite INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  availability_status TEXT,
  availability_checked_at TEXT,
  FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_items_url ON items(url);
CREATE INDEX IF NOT EXISTS idx_items_normalized_url ON items(normalized_url);
CREATE INDEX IF NOT EXISTS idx_items_domain ON items(domain);
CREATE INDEX IF NOT EXISTS idx_items_saved_at ON items(saved_at);
CREATE INDEX IF NOT EXISTS idx_items_is_favorite ON items(is_favorite);
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON items(deleted_at);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  vault_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  source_browser TEXT,
  source_profile_label TEXT,
  notes TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_items (
  session_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  original_order INTEGER NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  group_label TEXT,
  original_window_index INTEGER,
  PRIMARY KEY (session_id, item_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  vault_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon_key TEXT,
  accent_color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES collections(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS collection_items (
  collection_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  added_at TEXT NOT NULL,
  PRIMARY KEY (collection_id, item_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  vault_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE,
  UNIQUE(vault_id, name)
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (item_id, tag_id),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS archives (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  archive_type TEXT NOT NULL CHECK(archive_type IN ('thumbnail', 'html', 'resource_bundle', 'text_index', 'backup')),
  relative_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  capture_status TEXT NOT NULL CHECK(capture_status IN ('complete', 'incomplete', 'failed')),
  capture_notes TEXT,
  encrypted INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS capture_jobs (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  completed_at TEXT,
  source_connector TEXT NOT NULL,
  requested_action TEXT NOT NULL,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT
);

CREATE TABLE IF NOT EXISTS availability_checks (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  result_category TEXT NOT NULL,
  http_status INTEGER,
  redirect_target TEXT,
  error_code TEXT,
  duration_ms INTEGER,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  destination TEXT NOT NULL,
  manifest_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  status TEXT NOT NULL,
  integrity_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
