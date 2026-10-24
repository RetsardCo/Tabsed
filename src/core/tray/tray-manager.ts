import { TrayConfig, TrayActionId, TrayStatus, SavedTabItem } from '../../ui/types';
import { PrivacyManager } from '../vault/privacy-manager';

export const DEFAULT_TRAY_CONFIG: TrayConfig = {
  enabled: true,
  minimizeToTray: true,
  closeToTray: false,
  showNotifications: true,
  launchAtLogin: false,
  redactNotificationTitles: true
};

export interface TrayManagerCallbacks {
  onOpenApp?: () => void;
  onOpenSearch?: () => void;
  onRestoreRecent?: (recentItem: SavedTabItem) => Promise<boolean> | boolean;
  onSaveCurrentWindow?: () => Promise<{ success: boolean; savedCount: number; message?: string }>;
  onToggleAutomation?: (paused: boolean) => void;
  onExitApp?: () => void;
}

export interface QuickActionResult {
  actionId: TrayActionId;
  success: boolean;
  message: string;
  data?: any;
}

export class TrayManager {
  private config: TrayConfig;
  private isConnectorConnected: boolean = false;
  private isAutomationPaused: boolean = false;
  private callbacks: TrayManagerCallbacks;

  constructor(config: Partial<TrayConfig> = {}, callbacks: TrayManagerCallbacks = {}) {
    this.config = { ...DEFAULT_TRAY_CONFIG, ...config };
    this.callbacks = callbacks;
  }

  public getConfig(): TrayConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<TrayConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public setConnectorStatus(connected: boolean): void {
    this.isConnectorConnected = connected;
  }

  public setAutomationPaused(paused: boolean): void {
    this.isAutomationPaused = paused;
    if (this.callbacks.onToggleAutomation) {
      this.callbacks.onToggleAutomation(paused);
    }
  }

  /**
   * Status reporting for system tray icon and menu (PRD Epic 4.5)
   */
  public getStatus(items: SavedTabItem[] = []): TrayStatus {
    const recent = items.length > 0 ? items[0] : undefined;

    return {
      connectorStatus: this.isConnectorConnected ? 'connected' : 'disconnected',
      automationStatus: this.config.enabled
        ? this.isAutomationPaused
          ? 'paused'
          : 'running'
        : 'disabled',
      totalSavedTabs: items.length,
      recentSessionTitle: recent?.title,
      lastActionMessage: this.isConnectorConnected ? 'Browser connector active' : 'Browser connector disconnected'
    };
  }

  /**
   * Executes a system tray quick action (PRD Epic 4.5)
   */
  public async executeQuickAction(
    actionId: TrayActionId,
    items: SavedTabItem[] = []
  ): Promise<QuickActionResult> {
    switch (actionId) {
      case 'open_tabsed':
        if (this.callbacks.onOpenApp) {
          this.callbacks.onOpenApp();
        }
        return {
          actionId,
          success: true,
          message: 'Opened Tabsed main window'
        };

      case 'search_vault':
        if (this.callbacks.onOpenSearch) {
          this.callbacks.onOpenSearch();
        }
        return {
          actionId,
          success: true,
          message: 'Opened Tabsed search'
        };

      case 'restore_recent': {
        if (items.length === 0) {
          return {
            actionId,
            success: false,
            message: 'No saved tabs or sessions in vault to restore'
          };
        }

        const recent = items[0];
        if (this.callbacks.onRestoreRecent) {
          const res = await this.callbacks.onRestoreRecent(recent);
          return {
            actionId,
            success: res !== false,
            message: `Restored recent session: "${recent.title}"`,
            data: recent
          };
        }
        return {
          actionId,
          success: true,
          message: `Restored recent session: "${recent.title}"`,
          data: recent
        };
      }

      case 'save_current_window': {
        // Gated on browser connector availability! (PRD Epic 4.5 & Acceptance Criteria)
        if (!this.isConnectorConnected) {
          return {
            actionId,
            success: false,
            message: 'Browser connector is unavailable. Ensure Chrome or Edge extension is installed and connected.'
          };
        }

        if (this.callbacks.onSaveCurrentWindow) {
          const res = await this.callbacks.onSaveCurrentWindow();
          return {
            actionId,
            success: res.success,
            message: res.message || `Saved ${res.savedCount} tabs from current window`
          };
        }

        return {
          actionId,
          success: true,
          message: 'Saved active window tabs'
        };
      }

      case 'pause_automation':
        this.setAutomationPaused(true);
        return {
          actionId,
          success: true,
          message: 'Automation rules paused'
        };

      case 'resume_automation':
        this.setAutomationPaused(false);
        return {
          actionId,
          success: true,
          message: 'Automation rules resumed'
        };

      case 'exit':
        if (this.callbacks.onExitApp) {
          this.callbacks.onExitApp();
        }
        return {
          actionId,
          success: true,
          message: 'Exiting Tabsed'
        };

      default:
        return {
          actionId,
          success: false,
          message: `Unknown quick action: ${actionId}`
        };
    }
  }

  /**
   * Formats notifications with sensitive page title redaction by default (PRD Epic 4.5 & FR-126)
   */
  public formatNotification(
    event: 'tab_saved' | 'backup_completed' | 'automation_executed',
    details: { title?: string; url?: string; count?: number } = {}
  ): { title: string; body: string } {
    if (!this.config.showNotifications) {
      return { title: '', body: '' };
    }

    if (event === 'tab_saved') {
      let displayTitle = details.title || 'Untitled tab';
      if (this.config.redactNotificationTitles && details.url) {
        displayTitle = PrivacyManager.redactForNotification(displayTitle, details.url);
      }
      return {
        title: 'Tabsed — Tab Saved',
        body: `Saved: ${displayTitle}`
      };
    }

    if (event === 'backup_completed') {
      return {
        title: 'Tabsed — Backup Verified',
        body: `Successfully verified and backed up ${details.count ?? 0} vault items.`
      };
    }

    return {
      title: 'Tabsed Notification',
      body: `Automation routine executed for ${details.count ?? 0} tabs.`
    };
  }
}
