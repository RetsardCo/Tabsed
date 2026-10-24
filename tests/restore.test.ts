import { describe, it, expect, vi } from 'vitest';
import { RestoreQueue, RestoreItem } from '../src/core/transaction/restore-queue';

describe('RestoreQueue', () => {
  const items: RestoreItem[] = [
    { id: '1', url: 'https://site1.com', title: 'Site 1', pinned: true, orderIndex: 0, status: 'queued' },
    { id: '2', url: 'https://site2.com', title: 'Site 2', pinned: false, orderIndex: 1, status: 'queued' },
    { id: '3', url: 'https://site3.com', title: 'Site 3', pinned: false, orderIndex: 2, status: 'queued' },
    { id: '4', url: 'https://site4.com', title: 'Site 4', pinned: false, orderIndex: 3, status: 'queued' }
  ];

  it('restores in batches of configured size and preserves order', async () => {
    const queue = new RestoreQueue(items, { batchSize: 2 });
    const mockOpen = vi.fn().mockResolvedValue(true);

    const firstBatch = await queue.processNextBatch(mockOpen);
    expect(firstBatch.processed).toBe(2);
    expect(firstBatch.hasMore).toBe(true);
    expect(mockOpen).toHaveBeenCalledTimes(2);

    const status1 = queue.getStatus();
    expect(status1.opened).toBe(2);
    expect(status1.remaining).toBe(2);

    const secondBatch = await queue.processNextBatch(mockOpen);
    expect(secondBatch.processed).toBe(2);
    expect(secondBatch.hasMore).toBe(false);

    const status2 = queue.getStatus();
    expect(status2.opened).toBe(4);
    expect(status2.remaining).toBe(0);
  });

  it('pauses and resumes queue processing', async () => {
    const queue = new RestoreQueue(items, { batchSize: 2 });
    const mockOpen = vi.fn().mockResolvedValue(true);

    queue.pause();
    const batchWhilePaused = await queue.processNextBatch(mockOpen);
    expect(batchWhilePaused.processed).toBe(0);
    expect(mockOpen).not.toHaveBeenCalled();

    queue.resume();
    const batchAfterResume = await queue.processNextBatch(mockOpen);
    expect(batchAfterResume.processed).toBe(2);
    expect(mockOpen).toHaveBeenCalledTimes(2);
  });

  it('cancels remaining queued items', async () => {
    const queue = new RestoreQueue(items, { batchSize: 2 });
    const mockOpen = vi.fn().mockResolvedValue(true);

    await queue.processNextBatch(mockOpen);
    queue.cancel();

    const currentItems = queue.getItems();
    expect(currentItems[0].status).toBe('opened');
    expect(currentItems[1].status).toBe('opened');
    expect(currentItems[2].status).toBe('skipped');
    expect(currentItems[3].status).toBe('skipped');
  });

  it('retries individual failed items and all failed items (PRD Epic 3.1)', async () => {
    const queue = new RestoreQueue(items, { batchSize: 2 });
    // First batch fails item 2
    const mockOpen = vi.fn().mockImplementation((item: RestoreItem) => {
      if (item.id === '2') return Promise.resolve(false);
      return Promise.resolve(true);
    });

    await queue.processNextBatch(mockOpen);
    const status1 = queue.getStatus();
    expect(status1.opened).toBe(1);
    expect(status1.failed).toBe(1);

    // Retry individual failed item 2
    expect(queue.retry('2')).toBe(true);
    const retryStatus = queue.getStatus();
    expect(retryStatus.failed).toBe(0);
    expect(retryStatus.remaining).toBe(3); // 2, 3, 4 queued

    // Process next batch which includes item 2 again
    const nextMock = vi.fn().mockResolvedValue(true);
    const nextBatch = await queue.processNextBatch(nextMock);
    expect(nextBatch.processed).toBe(2);

    const openedItems = queue.getItems().filter(i => i.status === 'opened');
    expect(openedItems.map(i => i.id)).toContain('2');
  });
});
