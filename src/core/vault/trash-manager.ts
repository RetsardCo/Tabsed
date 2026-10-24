import { SavedTabItem } from '../../ui/types';

export interface TrashPurgeResult {
  retained: SavedTabItem[];
  purged: SavedTabItem[];
}

/**
 * TrashManager - Core logic for soft-delete, trash recovery, and permanent deletion
 * Aligned with Tabsed PRD Epic 2.3 & Section 11.6
 */
export class TrashManager {
  /**
   * Soft-deletes an item by setting its deletedAt timestamp.
   * If the item is already soft-deleted, keeps the original deletedAt timestamp.
   */
  public static softDelete(items: SavedTabItem[], id: string, timestamp?: string): SavedTabItem[] {
    const deletedAt = timestamp || new Date().toISOString();
    return items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          deletedAt: item.deletedAt || deletedAt
        };
      }
      return item;
    });
  }

  /**
   * Restores an item from trash by resetting deletedAt to null.
   * All original metadata, tags, collections, and notes are preserved.
   */
  public static restoreFromTrash(items: SavedTabItem[], id: string): SavedTabItem[] {
    return items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          deletedAt: null
        };
      }
      return item;
    });
  }

  /**
   * Permanently deletes an item from the collection.
   */
  public static permanentDelete(items: SavedTabItem[], id: string): SavedTabItem[] {
    return items.filter(item => item.id !== id);
  }

  /**
   * Permanently deletes all items currently in trash (where deletedAt is non-null).
   */
  public static emptyTrash(items: SavedTabItem[]): SavedTabItem[] {
    return items.filter(item => !item.deletedAt);
  }

  /**
   * Returns all items currently in trash.
   */
  public static getTrashItems(items: SavedTabItem[]): SavedTabItem[] {
    return items.filter(item => Boolean(item.deletedAt));
  }

  /**
   * Returns all active (non-trashed) items.
   */
  public static getActiveItems(items: SavedTabItem[]): SavedTabItem[] {
    return items.filter(item => !item.deletedAt);
  }

  /**
   * Checks whether a given item is in trash.
   */
  public static isItemInTrash(item: SavedTabItem): boolean {
    return Boolean(item.deletedAt);
  }

  /**
   * Purges items in trash that have exceeded the retention period (in days).
   * Aligned with PRD Epic 2.3 trash retention settings.
   */
  public static purgeExpiredTrash(
    items: SavedTabItem[],
    retentionDays: number,
    referenceDate = new Date()
  ): TrashPurgeResult {
    const safeRetention = Math.max(0, retentionDays);
    const cutoffTime = referenceDate.getTime() - safeRetention * 24 * 60 * 60 * 1000;
    const retained: SavedTabItem[] = [];
    const purged: SavedTabItem[] = [];

    for (const item of items) {
      if (item.deletedAt) {
        const deletedTime = new Date(item.deletedAt).getTime();
        if (!isNaN(deletedTime) && deletedTime < cutoffTime) {
          purged.push(item);
          continue;
        }
      }
      retained.push(item);
    }

    return { retained, purged };
  }
}
