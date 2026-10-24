import { describe, it, expect, vi } from 'vitest';
import { TrayManager, DEFAULT_TRAY_CONFIG } from '../src/core/tray/tray-manager';
import { SavedTabItem } from '../src/ui/types';

describe('Epic 4.5 --- System Tray & Quick Actions', () => {
  const mockItems: SavedTabItem[] = [
    {
      id: 'session_recent',
      vaultId: 'v1',
      itemType: 'session',
      title: 'Active Research Sprint',
      url: 'https://research.example.org',
      normalizedUrl: 'https://research.example.org',
      domain: 'research.example.org',
      savedAt: new Date().toISOString(),
      notes: '',
      isFavorite: true,
      collectionIds: ['research'],
      tags: ['AI'],
      browserFamily: 'Edge'
    }
  ];

  describe('Configuration & Status Reporting', () => {
    it('initializes with default tray configuration and allows updates', () => {
      const tray = new TrayManager();
      expect(tray.getConfig().enabled).toBe(true);
      expect(tray.getConfig().minimizeToTray).toBe(true);
      expect(tray.getConfig().redactNotificationTitles).toBe(true);

      tray.updateConfig({ minimizeToTray: false });
      expect(tray.getConfig().minimizeToTray).toBe(false);
    });

    it('reports accurate status including connector and automation state', () => {
      const tray = new TrayManager();
      tray.setConnectorStatus(true);
      tray.setAutomationPaused(false);

      const status = tray.getStatus(mockItems);
      expect(status.connectorStatus).toBe('connected');
      expect(status.automationStatus).toBe('running');
      expect(status.totalSavedTabs).toBe(1);
      expect(status.recentSessionTitle).toBe('Active Research Sprint');
    });
  });

  describe('Browser Connector Gating (PRD Epic 4.5 & Acceptance Criteria)', () => {
    it('fails safely when save_current_window is invoked while browser connector is disconnected', async () => {
      const tray = new TrayManager();
      tray.setConnectorStatus(false); // Disconnected

      const result = await tray.executeQuickAction('save_current_window', mockItems);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Browser connector is unavailable');
    });

    it('succeeds when save_current_window is invoked while browser connector is connected', async () => {
      const mockSaveWindow = vi.fn().mockResolvedValue({ success: true, savedCount: 8 });
      const tray = new TrayManager({}, { onSaveCurrentWindow: mockSaveWindow });
      tray.setConnectorStatus(true); // Connected

      const result = await tray.executeQuickAction('save_current_window', mockItems);
      expect(result.success).toBe(true);
      expect(mockSaveWindow).toHaveBeenCalledTimes(1);
    });
  });

  describe('Quick Actions Execution', () => {
    it('executes open_tabsed, search_vault, and exit actions', async () => {
      const onOpenApp = vi.fn();
      const onOpenSearch = vi.fn();
      const onExitApp = vi.fn();

      const tray = new TrayManager({}, { onOpenApp, onOpenSearch, onExitApp });

      const resOpen = await tray.executeQuickAction('open_tabsed');
      expect(resOpen.success).toBe(true);
      expect(onOpenApp).toHaveBeenCalledTimes(1);

      const resSearch = await tray.executeQuickAction('search_vault');
      expect(resSearch.success).toBe(true);
      expect(onOpenSearch).toHaveBeenCalledTimes(1);

      const resExit = await tray.executeQuickAction('exit');
      expect(resExit.success).toBe(true);
      expect(onExitApp).toHaveBeenCalledTimes(1);
    });

    it('restores recent session and handles empty vault gracefully', async () => {
      const onRestoreRecent = vi.fn().mockResolvedValue(true);
      const tray = new TrayManager({}, { onRestoreRecent });

      // With items
      const res = await tray.executeQuickAction('restore_recent', mockItems);
      expect(res.success).toBe(true);
      expect(onRestoreRecent).toHaveBeenCalledWith(mockItems[0]);

      // With empty items
      const emptyRes = await tray.executeQuickAction('restore_recent', []);
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.message).toContain('No saved tabs');
    });

    it('pauses and resumes automation via quick action', async () => {
      const onToggle = vi.fn();
      const tray = new TrayManager({}, { onToggleAutomation: onToggle });

      await tray.executeQuickAction('pause_automation');
      expect(tray.getStatus().automationStatus).toBe('paused');
      expect(onToggle).toHaveBeenCalledWith(true);

      await tray.executeQuickAction('resume_automation');
      expect(tray.getStatus().automationStatus).toBe('running');
      expect(onToggle).toHaveBeenCalledWith(false);
    });
  });

  describe('Notification Formatting & Redaction (PRD FR-126)', () => {
    it('redacts sensitive titles from notifications when enabled', () => {
      const tray = new TrayManager({ redactNotificationTitles: true, showNotifications: true });
      const notif = tray.formatNotification('tab_saved', {
        title: 'Account #1234 Balance: $9,000 — Chase Online',
        url: 'https://chase.com/portal'
      });

      expect(notif.body).toContain('[Sensitive Page — chase.com]');
      expect(notif.body).not.toContain('$9,000');
    });

    it('preserves public titles in notifications', () => {
      const tray = new TrayManager({ redactNotificationTitles: true, showNotifications: true });
      const notif = tray.formatNotification('tab_saved', {
        title: 'React Documentation — Hooks',
        url: 'https://react.dev/reference/react'
      });

      expect(notif.body).toContain('React Documentation — Hooks');
    });
  });
});
