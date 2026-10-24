/**
 * Tabsed Bounded Restore Queue
 * Aligned with Tabsed PRD FR-040 to FR-050 and Epic 3.1
 */

export interface RestoreItem {
  id: string;
  url: string;
  title: string;
  pinned: boolean;
  orderIndex: number;
  groupLabel?: string | null;
  status: 'queued' | 'opening' | 'opened' | 'failed' | 'skipped';
  error?: string;
}

export interface RestoreQueueConfig {
  batchSize: number;
  delayMs: number;
  targetBrowser: string;
  targetProfile?: string;
}

export class RestoreQueue {
  private items: RestoreItem[] = [];
  private config: RestoreQueueConfig;
  private isPaused = false;
  private isCancelled = false;
  private currentIndex = 0;

  constructor(items: RestoreItem[], config: Partial<RestoreQueueConfig> = {}) {
    this.items = items.map(i => ({ ...i })).sort((a, b) => a.orderIndex - b.orderIndex);
    this.config = {
      batchSize: config.batchSize ?? 5,
      delayMs: config.delayMs ?? 300,
      targetBrowser: config.targetBrowser ?? 'Default',
      targetProfile: config.targetProfile
    };
  }

  public getItems(): RestoreItem[] {
    return [...this.items];
  }

  public getStatus(): {
    total: number;
    opened: number;
    failed: number;
    remaining: number;
    isPaused: boolean;
    isCancelled: boolean;
  } {
    const opened = this.items.filter(i => i.status === 'opened').length;
    const failed = this.items.filter(i => i.status === 'failed').length;
    const remaining = this.items.filter(i => i.status === 'queued' || i.status === 'opening').length;

    return {
      total: this.items.length,
      opened,
      failed,
      remaining,
      isPaused: this.isPaused,
      isCancelled: this.isCancelled
    };
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public cancel(): void {
    this.isCancelled = true;
    for (const item of this.items) {
      if (item.status === 'queued') {
        item.status = 'skipped';
      }
    }
  }

  /**
   * Retry a specific failed or skipped item
   */
  public retry(itemId: string): boolean {
    const item = this.items.find(i => i.id === itemId);
    if (item && (item.status === 'failed' || item.status === 'skipped')) {
      item.status = 'queued';
      item.error = undefined;
      this.isCancelled = false;
      return true;
    }
    return false;
  }

  /**
   * Retry all failed and skipped items
   */
  public retryFailed(): number {
    let count = 0;
    for (const item of this.items) {
      if (item.status === 'failed' || item.status === 'skipped') {
        item.status = 'queued';
        item.error = undefined;
        count++;
      }
    }
    if (count > 0) {
      this.isCancelled = false;
    }
    return count;
  }

  /**
   * Process the next batch of queued tabs
   */
  public async processNextBatch(
    openTabFn: (item: RestoreItem) => Promise<boolean>
  ): Promise<{ processed: number; hasMore: boolean }> {
    if (this.isPaused || this.isCancelled) {
      const remainingQueued = this.items.some(i => i.status === 'queued');
      return { processed: 0, hasMore: !this.isCancelled && remainingQueued };
    }

    const queuedItems = this.items.filter(i => i.status === 'queued');
    const batch = queuedItems.slice(0, this.config.batchSize);
    if (batch.length === 0) {
      return { processed: 0, hasMore: false };
    }

    for (const item of batch) {
      if (this.isCancelled || this.isPaused) break;
      item.status = 'opening';
      try {
        const ok = await openTabFn(item);
        if (ok) {
          item.status = 'opened';
        } else {
          item.status = 'failed';
          item.error = 'Failed to create browser tab';
        }
      } catch (err: any) {
        item.status = 'failed';
        item.error = err.message || 'Error opening tab';
      }
    }

    const hasMore = this.items.some(i => i.status === 'queued') && !this.isCancelled;

    return { processed: batch.length, hasMore };
  }
}
