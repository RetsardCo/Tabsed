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
    for (let i = this.currentIndex; i < this.items.length; i++) {
      if (this.items[i].status === 'queued') {
        this.items[i].status = 'skipped';
      }
    }
  }

  /**
   * Process the next batch of tabs
   */
  public async processNextBatch(
    openTabFn: (item: RestoreItem) => Promise<boolean>
  ): Promise<{ processed: number; hasMore: boolean }> {
    if (this.isPaused || this.isCancelled) {
      return { processed: 0, hasMore: !this.isCancelled && this.currentIndex < this.items.length };
    }

    const batch = this.items.slice(this.currentIndex, this.currentIndex + this.config.batchSize);
    if (batch.length === 0) {
      return { processed: 0, hasMore: false };
    }

    for (const item of batch) {
      if (this.isCancelled) break;
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

    this.currentIndex += batch.length;
    const hasMore = this.currentIndex < this.items.length && !this.isCancelled;

    return { processed: batch.length, hasMore };
  }
}
