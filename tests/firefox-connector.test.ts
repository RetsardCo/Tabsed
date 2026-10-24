import { describe, it, expect } from 'vitest';
import { MockBrowserConnector } from '../src/core/connector/mock-connector';

describe('Firefox Browser Connector (PRD Epic 3.5)', () => {
  it('identifies browser family as Firefox', () => {
    const connector = new MockBrowserConnector('Firefox');
    expect(connector.getBrowserFamily()).toBe('Firefox');
  });

  it('correctly reports Firefox capability matrix (tab groups unsupported, private mode supported)', async () => {
    const connector = new MockBrowserConnector('Firefox');
    const capabilities = await connector.getCapabilities();

    expect(capabilities.listTabs).toBe('supported');
    expect(capabilities.captureMetadata).toBe('supported');
    expect(capabilities.restorePinnedState).toBe('supported');
    expect(capabilities.restoreTabGroups).toBe('unsupported'); // Firefox-specific constraint (FR-124)
    expect(capabilities.queryProfileStorage).toBe('unavailable');
  });

  it('provides Firefox-specific profiles (default-release, dev-edition)', async () => {
    const connector = new MockBrowserConnector('Firefox');
    const profiles = await connector.getProfiles();

    expect(profiles).toHaveLength(2);
    expect(profiles[0].id).toBe('default-release');
    expect(profiles[0].browserFamily).toBe('Firefox');
    expect(profiles[1].id).toBe('dev-edition');
  });

  it('filters incognito / private tabs by default', async () => {
    const connector = new MockBrowserConnector('Firefox');
    const tabs = await connector.listTabs();

    expect(tabs.every(t => !t.incognito)).toBe(true);
  });
});
