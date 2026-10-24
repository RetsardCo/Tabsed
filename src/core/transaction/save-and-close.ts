/**
 * Tabsed Save-and-Close Transaction Engine
 * Implements PRD Section 11.5 State Machine:
 * requested -> validated -> capturing -> staged -> persisted -> verified -> committed -> source-tabs-closed
 */

export type TransactionState =
  | 'requested'
  | 'validated'
  | 'capturing'
  | 'staged'
  | 'persisted'
  | 'verified'
  | 'committed'
  | 'source-tabs-closed'
  | 'partial'
  | 'failed'
  | 'cancelled';

export interface TabItemInput {
  tabId: number | string;
  url: string;
  title: string;
  favIconUrl?: string | null;
  pinned?: boolean;
  incognito?: boolean;
  thumbnailDataUrl?: string | null;
  orderIndex?: number;
  collectionId?: string;
  windowId?: number | string;
}

export interface StagedTabRecord {
  tabId: number | string;
  id: string;
  url: string;
  title: string;
  domain: string;
  normalizedUrl: string;
  stagedThumbnailPath?: string | null;
  thumbnailHash?: string | null;
  status: 'pending' | 'persisted' | 'verified' | 'committed' | 'failed';
  error?: string;
}

export interface TransactionSummary {
  jobId: string;
  state: TransactionState;
  requestedCount: number;
  excludedCount: number;
  committedIds: (number | string)[];
  failedIds: (number | string)[];
  closedIds: (number | string)[];
  errorSummary?: string;
}

export class SaveTransactionSession {
  public readonly jobId: string;
  private state: TransactionState = 'requested';
  private tabs: TabItemInput[] = [];
  private stagedRecords: StagedTabRecord[] = [];
  private committedTabIds: (number | string)[] = [];
  private failedTabIds: (number | string)[] = [];
  private closedTabIds: (number | string)[] = [];
  private errorSummary?: string;
  private closeRequested = false;
  private totalRequestedCount = 0;
  private excludedCount = 0;

  constructor(jobId = 'job_' + Date.now()) {
    this.jobId = jobId;
  }

  public getState(): TransactionState {
    return this.state;
  }

  public getStagedRecords(): StagedTabRecord[] {
    return [...this.stagedRecords];
  }

  /**
   * Step 1: Validate incoming tab selection and enforce safety policies
   */
  public validate(tabs: TabItemInput[], options: { allowPrivate?: boolean; closeAfterSave?: boolean } = {}): void {
    if (this.state !== 'requested') {
      throw new Error(`Cannot validate in state: ${this.state}`);
    }

    this.totalRequestedCount = tabs.length;
    this.closeRequested = !!options.closeAfterSave;

    // Enforce PRD FR-016: Private/incognito tabs excluded by default
    const allowPrivate = options.allowPrivate ?? false;
    const validatedTabs: TabItemInput[] = [];

    for (const tab of tabs) {
      if (tab.incognito && !allowPrivate) {
        continue; // Excluded by default
      }
      if (!tab.url || typeof tab.url !== 'string' || !tab.url.trim() ||
          tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') ||
          tab.url.startsWith('about:') || tab.url.startsWith('javascript:')) {
        continue; // Internal/unsupported schemes
      }
      validatedTabs.push(tab);
    }

    this.excludedCount = tabs.length - validatedTabs.length;
    this.tabs = validatedTabs;
    this.state = 'validated';
  }

  /**
   * Step 2 & 3: Staging metadata and assets
   */
  public stage(
    stageAssetCallback?: (tabId: number | string, dataUrl: string) => { relativePath: string; hash: string } | null
  ): void {
    if (this.state !== 'validated') {
      throw new Error(`Cannot stage in state: ${this.state}`);
    }

    this.state = 'capturing';

    for (const tab of this.tabs) {
      let domain = '';
      try {
        domain = new URL(tab.url).hostname;
      } catch {
        domain = 'unknown';
      }

      let stagedThumbnailPath: string | null = null;
      let thumbnailHash: string | null = null;

      if (tab.thumbnailDataUrl && stageAssetCallback) {
        try {
          const res = stageAssetCallback(tab.tabId, tab.thumbnailDataUrl);
          if (res) {
            stagedThumbnailPath = res.relativePath;
            thumbnailHash = res.hash;
          }
        } catch (e) {
          console.warn(`Failed to stage thumbnail for tab ${tab.tabId}:`, e);
        }
      }

      this.stagedRecords.push({
        tabId: tab.tabId,
        id: 'item_' + Math.random().toString(36).substring(2, 10),
        url: tab.url,
        title: tab.title || domain,
        domain,
        normalizedUrl: tab.url.toLowerCase(),
        stagedThumbnailPath,
        thumbnailHash,
        status: 'pending'
      });
    }

    this.state = 'staged';
  }

  /**
   * Step 4: Persist records into database
   */
  public persist(persistDatabaseCallback: (records: StagedTabRecord[]) => { persisted: StagedTabRecord[]; failed: StagedTabRecord[] }): void {
    if (this.state !== 'staged') {
      throw new Error(`Cannot persist in state: ${this.state}`);
    }

    try {
      const { persisted, failed } = persistDatabaseCallback(this.stagedRecords);

      for (const record of persisted) {
        record.status = 'persisted';
      }
      for (const record of failed) {
        record.status = 'failed';
        this.failedTabIds.push(record.tabId);
      }

      this.state = failed.length > 0 && persisted.length > 0 ? 'partial' : failed.length > 0 ? 'failed' : 'persisted';
    } catch (err: any) {
      this.state = 'failed';
      this.errorSummary = err?.message || 'Database persistence error';
      for (const record of this.stagedRecords) {
        record.status = 'failed';
        record.error = this.errorSummary;
        this.failedTabIds.push(record.tabId);
      }
      throw err;
    }
  }

  /**
   * Step 5 & 6: Verify persisted writes and commit transaction
   */
  public verifyAndCommit(verifyCallback: (records: StagedTabRecord[]) => (number | string)[]): TransactionSummary {
    if (this.state !== 'persisted' && this.state !== 'partial') {
      throw new Error(`Cannot verify/commit in state: ${this.state}`);
    }

    try {
      this.state = 'verified';
      const verifiedIds = verifyCallback(this.stagedRecords.filter(r => r.status === 'persisted'));
      this.committedTabIds = verifiedIds;

      for (const record of this.stagedRecords) {
        if (verifiedIds.includes(record.tabId)) {
          record.status = 'committed';
        } else if (record.status !== 'failed') {
          record.status = 'failed';
          record.error = 'Verification check failed';
          this.failedTabIds.push(record.tabId);
        }
      }

      if (this.committedTabIds.length === this.stagedRecords.length && this.failedTabIds.length === 0) {
        this.state = 'committed';
      } else if (this.committedTabIds.length > 0) {
        this.state = 'partial';
      } else {
        this.state = 'failed';
      }

      return this.getSummary();
    } catch (err: any) {
      this.state = 'failed';
      this.errorSummary = err?.message || 'Verification check exception';
      throw err;
    }
  }

  /**
   * Step 7: Close ONLY committed source tabs if close was requested
   * CRITICAL SAFETY RULE: Never close uncommitted or failed tabs!
   */
  public executeTabClosure(closeTabCallback: (tabId: number | string) => boolean): TransactionSummary {
    if (!this.closeRequested) {
      return this.getSummary();
    }

    if (this.state !== 'committed' && this.state !== 'partial') {
      // Persistence was not successful; do NOT close any tabs
      return this.getSummary();
    }

    for (const tabId of this.committedTabIds) {
      try {
        const closed = closeTabCallback(tabId);
        if (closed) {
          this.closedTabIds.push(tabId);
        }
      } catch (err) {
        console.error(`Failed to close tab ${tabId}:`, err);
      }
    }

    if (this.state === 'committed') {
      this.state = 'source-tabs-closed';
    }

    return this.getSummary();
  }

  public cancel(): void {
    this.state = 'cancelled';
  }

  public getSummary(): TransactionSummary {
    return {
      jobId: this.jobId,
      state: this.state,
      requestedCount: this.totalRequestedCount,
      excludedCount: this.excludedCount,
      committedIds: [...this.committedTabIds],
      failedIds: [...this.failedTabIds],
      closedIds: [...this.closedTabIds],
      errorSummary: this.errorSummary
    };
  }
}
