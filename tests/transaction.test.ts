import { describe, it, expect, vi } from 'vitest';
import { SaveTransactionSession, TabItemInput } from '../src/core/transaction/save-and-close';

describe('SaveTransactionSession', () => {
  const sampleTabs: TabItemInput[] = [
    { tabId: 1, url: 'https://example.com/page1', title: 'Page 1', pinned: false, incognito: false },
    { tabId: 2, url: 'https://example.com/page2', title: 'Page 2', pinned: false, incognito: false },
    { tabId: 3, url: 'https://secret.com/private', title: 'Private', pinned: false, incognito: true },
    { tabId: 4, url: 'chrome://settings', title: 'Settings', pinned: false, incognito: false }
  ];

  it('excludes private and internal tabs by default during validation', () => {
    const session = new SaveTransactionSession();
    session.validate(sampleTabs, { allowPrivate: false, closeAfterSave: true });

    expect(session.getState()).toBe('validated');
    session.stage();
    const staged = session.getStagedRecords();

    // Tab 3 (incognito) and Tab 4 (chrome://) must be filtered out
    expect(staged.length).toBe(2);
    expect(staged.map(s => s.tabId)).toEqual([1, 2]);
  });

  it('completes happy path and closes source tabs when persistence succeeds', () => {
    const session = new SaveTransactionSession();
    session.validate(sampleTabs, { closeAfterSave: true });
    session.stage();

    session.persist(records => ({
      persisted: records,
      failed: []
    }));
    expect(session.getState()).toBe('persisted');

    session.verifyAndCommit(records => records.map(r => r.tabId));
    expect(session.getState()).toBe('committed');

    const closeTabMock = vi.fn().mockReturnValue(true);
    const summary = session.executeTabClosure(closeTabMock);

    expect(session.getState()).toBe('source-tabs-closed');
    expect(closeTabMock).toHaveBeenCalledTimes(2);
    expect(closeTabMock).toHaveBeenCalledWith(1);
    expect(closeTabMock).toHaveBeenCalledWith(2);
    expect(summary.closedIds).toEqual([1, 2]);
  });

  it('NEVER closes source tabs if persistence fails (FR-014 Safety Invariant)', () => {
    const session = new SaveTransactionSession();
    session.validate(sampleTabs, { closeAfterSave: true });
    session.stage();

    // Simulate database write failure
    session.persist(records => ({
      persisted: [],
      failed: records
    }));
    expect(session.getState()).toBe('failed');

    const closeTabMock = vi.fn();
    const summary = session.executeTabClosure(closeTabMock);

    // Source tabs MUST NOT be closed!
    expect(closeTabMock).not.toHaveBeenCalled();
    expect(summary.closedIds).toEqual([]);
    expect(summary.committedIds).toEqual([]);
  });

  it('closes ONLY successfully committed tabs in partial failures', () => {
    const session = new SaveTransactionSession();
    session.validate(sampleTabs, { closeAfterSave: true });
    session.stage();

    // Tab 1 succeeds, Tab 2 fails
    session.persist(records => ({
      persisted: records.filter(r => r.tabId === 1),
      failed: records.filter(r => r.tabId === 2)
    }));
    expect(session.getState()).toBe('partial');

    session.verifyAndCommit(records => records.map(r => r.tabId));
    expect(session.getState()).toBe('partial');

    const closeTabMock = vi.fn().mockReturnValue(true);
    const summary = session.executeTabClosure(closeTabMock);

    // Only Tab 1 was committed and should be closed
    expect(closeTabMock).toHaveBeenCalledTimes(1);
    expect(closeTabMock).toHaveBeenCalledWith(1);
    expect(summary.closedIds).toEqual([1]);
    expect(summary.failedIds).toEqual([2]);
  });
});
