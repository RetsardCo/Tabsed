/**
 * Tabsed Vault Real-Time Synchronization Service
 * Synchronizes tabs between Browser Extensions, Native Messaging Host,
 * and the Standalone Desktop Application / Web Frontend.
 */

import { SavedTabItem } from '../../ui/types';

export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).__TAURI_INTERNALS__ ||
    (window as any).__TAURI__ ||
    (window as any).__TAURI_METADATA__
  );
}

export interface SyncCheckResult {
  changed: boolean;
  mtime: number;
  items?: SavedTabItem[];
}

export class VaultSyncService {
  private static lastMtime = 0;
  private static isPersisting = false;

  public static getLastMtime(): number {
    return this.lastMtime;
  }

  public static setLastMtime(mtime: number): void {
    this.lastMtime = mtime;
  }

  /**
   * Load initial saved items from disk vault.
   * Priority: Tauri native invoke -> Web Dev server API -> null
   */
  public static async loadInitialVaultItems(): Promise<SavedTabItem[] | null> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const items = await invoke<SavedTabItem[]>('list_vault_items');
        // Synchronize initial baseline mtime
        const check = await invoke<{ mtime_ms: number }>('check_vault_updates', { lastKnownMtimeMs: 0 });
        if (check && typeof check.mtime_ms === 'number') {
          this.lastMtime = check.mtime_ms;
        }
        if (Array.isArray(items) && items.length > 0) {
          return items;
        }
      } catch (err) {
        console.warn('[VaultSync] Tauri list_vault_items error:', err);
      }
    } else {
      try {
        const res = await fetch('/api/vault/items');
        if (res.ok) {
          const items = await res.json();
          // Synchronize initial baseline mtime in web mode
          const pollRes = await fetch('/api/vault/poll?since=0');
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData && typeof pollData.mtime === 'number') {
              this.lastMtime = pollData.mtime;
            }
          }
          if (Array.isArray(items) && items.length > 0) {
            return items;
          }
        }
      } catch {
        // Fallback to localStorage
      }
    }
    return null;
  }

  /**
   * Persist current items to disk vault.
   */
  public static async persistVaultItems(items: SavedTabItem[]): Promise<boolean> {
    if (this.isPersisting) return false;
    this.isPersisting = true;

    try {
      if (isTauriEnvironment()) {
        const { invoke } = await import('@tauri-apps/api/core');
        const writtenMtime = await invoke<number>('save_vault_items', { items });
        if (typeof writtenMtime === 'number' && writtenMtime > 0) {
          this.lastMtime = writtenMtime;
        } else {
          this.lastMtime = Date.now();
        }
        return true;
      } else {
        const res = await fetch('/api/vault/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items)
        });
        if (res.ok) {
          try {
            const data = await res.json();
            if (data && typeof data.mtime === 'number') {
              this.lastMtime = data.mtime;
            } else {
              this.lastMtime = Date.now();
            }
          } catch {
            this.lastMtime = Date.now();
          }
          return true;
        }
      }
    } catch (err) {
      // Ignore if server/tauri not available
    } finally {
      this.isPersisting = false;
    }
    return false;
  }

  /**
   * Query if disk vault has been modified by external processes (e.g. native messaging host)
   */
  public static async checkForExternalUpdates(): Promise<SyncCheckResult> {
    if (this.isPersisting) {
      return { changed: false, mtime: this.lastMtime };
    }

    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<{ changed: boolean; mtime_ms: number; items?: SavedTabItem[] }>('check_vault_updates', {
          lastKnownMtimeMs: this.lastMtime
        });
        if (res && res.changed && Array.isArray(res.items)) {
          this.lastMtime = res.mtime_ms;
          return { changed: true, mtime: res.mtime_ms, items: res.items };
        }
        if (res && res.mtime_ms > this.lastMtime) {
          this.lastMtime = res.mtime_ms;
        }
      } catch (err) {
        // Ignore IPC poll error
      }
    } else {
      try {
        const res = await fetch(`/api/vault/poll?since=${this.lastMtime}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.changed && Array.isArray(data.items)) {
            this.lastMtime = data.mtime;
            return { changed: true, mtime: data.mtime, items: data.items };
          }
          if (data && data.mtime > this.lastMtime) {
            this.lastMtime = data.mtime;
          }
        }
      } catch {
        // Dev server not responding
      }
    }

    return { changed: false, mtime: this.lastMtime };
  }

  /**
   * Start live synchronization polling loop
   */
  public static startLiveSync(
    onNewItemsDetected: (updatedItems: SavedTabItem[]) => void,
    intervalMs = 1200
  ): () => void {
    let isRunning = true;

    const poll = async () => {
      if (!isRunning) return;
      try {
        const check = await this.checkForExternalUpdates();
        if (check.changed && check.items && isRunning) {
          onNewItemsDetected(check.items);
        }
      } catch {}
    };

    const timerId = setInterval(poll, intervalMs);
    // Initial check shortly after initialization
    setTimeout(poll, 300);

    return () => {
      isRunning = false;
      clearInterval(timerId);
    };
  }
}
